<?php

namespace App\Http\Controllers\Web;

use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Property;
use App\Models\Room;
use App\Services\BookingService;
use App\Support\Labels;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class BookingController extends Controller
{
    public function index(Request $request): View
    {
        $bookings = Booking::query()
            ->with(['room.property', 'invoices'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($request->filled('property_id'), fn ($q) => $q->where('property_id', $request->query('property_id')))
            ->when($request->filled('room_id'), fn ($q) => $q->where('room_id', $request->query('room_id')))
            ->when($request->filled('from'), fn ($q) => $q->whereDate('check_out', '>=', $request->query('from')))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('check_in', '<=', $request->query('to')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = $request->query('search');
                $q->where(fn ($sub) => $sub->where('code', 'like', "%{$term}%")
                    ->orWhere('guest_name', 'like', "%{$term}%")
                    ->orWhere('guest_phone', 'like', "%{$term}%"));
            })
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return view('admin.bookings.index', [
            'bookings' => $bookings,
            'properties' => Property::orderBy('name')->get(),
            'rooms' => Room::with('property')->orderBy('number')->get(),
            'statuses' => Labels::BOOKING_STATUSES,
        ]);
    }

    public function create(Request $request): View
    {
        return view('admin.bookings.form', [
            'booking' => new Booking([
                'room_id' => $request->query('room_id'),
                'check_in' => now()->toDateString(),
                'check_out' => now()->addDay()->toDateString(),
                'rent_type' => 'harian',
                'status' => 'pending',
            ]),
            'rooms' => Room::with('property')->orderBy('number')->get(),
            'rentTypes' => Labels::RENT_TYPES,
        ]);
    }

    public function store(Request $request, BookingService $service): RedirectResponse
    {
        $data = $request->validate([
            'room_id' => ['required', 'integer', 'exists:rooms,id'],
            'guest_name' => ['required', 'string', 'max:120'],
            'guest_phone' => ['nullable', 'string', 'max:40'],
            'check_in' => ['required', 'date'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'rent_type' => ['required', Rule::in(array_keys(Labels::RENT_TYPES))],
            'notes' => ['nullable', 'string'],
        ]);

        try {
            $booking = $service->create($data);
        } catch (BusinessRuleException $exception) {
            return back()->withInput()->with('error', $exception->getMessage());
        }

        return redirect()->route('bookings.show', $booking)->with('status', 'Booking berhasil dibuat.');
    }

    public function quote(Request $request, BookingService $service): JsonResponse
    {
        $data = $request->validate([
            'room_id' => ['required', 'integer', 'exists:rooms,id'],
            'check_in' => ['required', 'date'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'rent_type' => ['sometimes', Rule::in(array_keys(Labels::RENT_TYPES))],
        ]);

        $room = Room::findOrFail($data['room_id']);
        $quote = $service->quote($room, $data['check_in'], $data['check_out'], $data['rent_type'] ?? 'harian');

        return response()->json([
            'days' => $quote['days'],
            'units' => $quote['units'],
            'unitLabel' => $quote['label'],
            'total' => $quote['amount'],
        ]);
    }

    public function show(Booking $booking): View
    {
        $booking->load(['room.property', 'invoices']);

        return view('admin.bookings.show', [
            'booking' => $booking,
            'statuses' => Labels::BOOKING_STATUSES,
            'transitions' => Booking::TRANSITIONS[$booking->status] ?? [],
        ]);
    }

    public function edit(Booking $booking): View
    {
        return view('admin.bookings.form', [
            'booking' => $booking,
            'rooms' => Room::with('property')->orderBy('number')->get(),
            'rentTypes' => Labels::RENT_TYPES,
        ]);
    }

    public function update(Request $request, Booking $booking, BookingService $service): RedirectResponse
    {
        $data = $request->validate([
            'guest_name' => ['required', 'string', 'max:120'],
            'guest_phone' => ['nullable', 'string', 'max:40'],
            'check_in' => ['required', 'date'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'rent_type' => ['required', Rule::in(array_keys(Labels::RENT_TYPES))],
            'notes' => ['nullable', 'string'],
        ]);

        if (! $service->isAvailableFor($booking, $data['check_in'], $data['check_out'])) {
            return back()->withInput()->with('error', 'Kamar tidak tersedia pada periode tersebut.');
        }

        $quote = $service->quote($booking->room, $data['check_in'], $data['check_out'], $data['rent_type']);

        DB::transaction(function () use ($booking, $data, $quote) {
            $booking->update(array_merge($data, [
                'days' => $quote['days'],
                'units' => $quote['units'],
                'unit_label' => $quote['label'],
                'total' => $quote['amount'],
            ]));

            $invoice = $booking->invoices()->where('status', '!=', 'paid')->first();

            if ($invoice) {
                $invoice->update([
                    'description' => 'Booking ' . $booking->code . ' — Kamar ' . $booking->room->number
                        . ' (' . $quote['units'] . ' ' . $quote['label'] . ')',
                    'amount' => $quote['amount'],
                ]);
            }
        });

        return redirect()->route('bookings.show', $booking)->with('status', 'Booking berhasil diperbarui.');
    }

    public function status(Request $request, Booking $booking, BookingService $service): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(array_keys(Labels::BOOKING_STATUSES))],
        ]);

        try {
            $service->transition($booking, $data['status']);
        } catch (BusinessRuleException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return redirect()->route('bookings.show', $booking)->with('status', 'Status booking diperbarui.');
    }

    public function destroy(Booking $booking, BookingService $service): RedirectResponse
    {
        try {
            $service->delete($booking);
        } catch (BusinessRuleException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return redirect()->route('bookings.index')->with('status', 'Booking berhasil dihapus.');
    }
}
