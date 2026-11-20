<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessRuleException;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Models\Room;
use App\Services\BookingService;
use App\Support\Labels;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class BookingController extends ApiController
{
    private const FIELD_MAP = [
        'roomId' => 'room_id',
        'guestName' => 'guest_name',
        'guestPhone' => 'guest_phone',
        'checkIn' => 'check_in',
        'checkOut' => 'check_out',
        'rentType' => 'rent_type',
    ];

    public function index(Request $request): JsonResponse
    {
        $query = Booking::query()->with('room.property');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('roomId')) {
            $query->where('room_id', $request->query('roomId'));
        }

        if ($request->filled('from')) {
            $query->whereDate('check_out', '>=', $request->query('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('check_in', '<=', $request->query('to'));
        }

        $this->applySearch($query, $request, ['code', 'guest_name', 'guest_phone']);
        $this->applySort($query, $request, [
            'checkIn' => 'check_in',
            'checkOut' => 'check_out',
            'total' => 'total',
            'createdAt' => 'created_at',
        ], '-created_at');

        return $this->paginated($this->paginate($query, $request), BookingResource::class);
    }

    public function store(Request $request, BookingService $service): JsonResponse
    {
        $data = $this->mapped($request->validate([
            'roomId' => ['required', 'integer', 'exists:rooms,id'],
            'guestName' => ['required', 'string', 'max:120'],
            'guestPhone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'checkIn' => ['required', 'date'],
            'checkOut' => ['required', 'date', 'after:checkIn'],
            'rentType' => ['sometimes', Rule::in(array_keys(Labels::RENT_TYPES))],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]), self::FIELD_MAP);

        $booking = $service->create($data);

        return $this->respond(new BookingResource($booking), 201);
    }

    public function quote(Request $request, BookingService $service): JsonResponse
    {
        $data = $request->validate([
            'roomId' => ['required', 'integer', 'exists:rooms,id'],
            'checkIn' => ['required', 'date'],
            'checkOut' => ['required', 'date', 'after:checkIn'],
            'rentType' => ['sometimes', Rule::in(array_keys(Labels::RENT_TYPES))],
        ]);

        $room = Room::findOrFail($data['roomId']);
        $rentType = $data['rentType'] ?? 'harian';
        $quote = $service->quote($room, $data['checkIn'], $data['checkOut'], $rentType);

        return response()->json([
            'data' => [
                'roomId' => (string) $room->id,
                'checkIn' => $data['checkIn'],
                'checkOut' => $data['checkOut'],
                'rentType' => $rentType,
                'days' => $quote['days'],
                'units' => $quote['units'],
                'unitLabel' => $quote['label'],
                'total' => $quote['amount'],
            ],
        ]);
    }

    public function show(Booking $booking): JsonResponse
    {
        $booking->load('room.property', 'invoices');

        return $this->respond(new BookingResource($booking));
    }

    public function update(Request $request, Booking $booking, BookingService $service): JsonResponse
    {
        $data = $this->mapped($request->validate([
            'guestName' => ['sometimes', 'string', 'max:120'],
            'guestPhone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'checkIn' => ['sometimes', 'date'],
            'checkOut' => ['sometimes', 'date'],
            'rentType' => ['sometimes', Rule::in(array_keys(Labels::RENT_TYPES))],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]), self::FIELD_MAP);

        $checkIn = $data['check_in'] ?? $booking->check_in->toDateString();
        $checkOut = $data['check_out'] ?? $booking->check_out->toDateString();
        $rentType = $data['rent_type'] ?? $booking->rent_type;

        if ($checkOut <= $checkIn) {
            throw new BusinessRuleException('Periode tanggal tidak valid', 422, 'VALIDATION_ERROR');
        }

        if (($data['check_in'] ?? null) || ($data['check_out'] ?? null) || ($data['rent_type'] ?? null)) {
            if (! $service->isAvailableFor($booking, $checkIn, $checkOut)) {
                throw new BusinessRuleException('Kamar tidak tersedia pada periode tersebut');
            }
        }

        $quote = $service->quote($booking->room, $checkIn, $checkOut, $rentType);

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

        return $this->respond(new BookingResource($booking->fresh('room.property')));
    }

    public function destroy(Booking $booking, BookingService $service): JsonResponse
    {
        $service->delete($booking);

        return response()->json(null, 204);
    }

    public function status(Request $request, Booking $booking, BookingService $service): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(array_keys(Labels::BOOKING_STATUSES))],
        ]);

        $booking = $service->transition($booking, $data['status']);

        return $this->respond(new BookingResource($booking));
    }
}
