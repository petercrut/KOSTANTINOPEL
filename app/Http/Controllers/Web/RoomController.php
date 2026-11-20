<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\Room;
use App\Services\OccupancyService;
use App\Support\Labels;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class RoomController extends Controller
{
    public function index(Request $request, OccupancyService $occupancy): View
    {
        $rooms = Room::query()
            ->with('property')
            ->when($request->filled('property_id'), fn ($q) => $q->where('property_id', $request->query('property_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = $request->query('search');
                $q->where(fn ($sub) => $sub->where('number', 'like', "%{$term}%")->orWhere('type', 'like', "%{$term}%"));
            })
            ->orderBy('property_id')
            ->orderBy('number')
            ->paginate(15)
            ->withQueryString();

        return view('admin.rooms.index', [
            'rooms' => $rooms,
            'properties' => Property::orderBy('name')->get(),
            'statuses' => Labels::ROOM_STATUSES,
            'occupancy' => $occupancy,
        ]);
    }

    public function create(Request $request): View
    {
        return view('admin.rooms.form', [
            'room' => new Room([
                'property_id' => $request->query('property_id'),
                'type' => 'Single',
                'capacity' => 1,
                'price_daily' => 50000,
                'price_monthly' => 850000,
                'status' => 'available',
            ]),
            'properties' => Property::orderBy('name')->get(),
            'statuses' => Labels::ROOM_STATUSES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        $exists = Room::where('property_id', $data['property_id'])
            ->where('number', $data['number'])
            ->exists();

        if ($exists) {
            return back()->withInput()->withErrors(['number' => 'Nomor kamar sudah digunakan pada properti ini.']);
        }

        $room = Room::create($data);

        return redirect()->route('rooms.show', $room)->with('status', 'Kamar berhasil ditambahkan.');
    }

    public function show(Request $request, Room $room, OccupancyService $occupancy): View
    {
        $room->load('property');

        $from = $request->query('from', now()->toDateString());
        $to = $request->query('to', now()->addDay()->toDateString());
        $checking = $request->filled('from') || $request->filled('to');
        $available = $checking && $to > $from
            ? $occupancy->isAvailable($room->id, $from, $to)
            : null;

        return view('admin.rooms.show', [
            'room' => $room,
            'effectiveStatus' => $occupancy->effectiveStatus($room),
            'tenants' => $room->tenants()->with('user')->latest('start_date')->get(),
            'bookings' => $room->bookings()->latest('check_in')->limit(10)->get(),
            'from' => $from,
            'to' => $to,
            'available' => $available,
            'checking' => $checking,
        ]);
    }

    public function edit(Room $room): View
    {
        return view('admin.rooms.form', [
            'room' => $room,
            'properties' => Property::orderBy('name')->get(),
            'statuses' => Labels::ROOM_STATUSES,
        ]);
    }

    public function update(Request $request, Room $room): RedirectResponse
    {
        $data = $this->validated($request);

        $exists = Room::where('property_id', $data['property_id'])
            ->where('number', $data['number'])
            ->whereKeyNot($room->id)
            ->exists();

        if ($exists) {
            return back()->withInput()->withErrors(['number' => 'Nomor kamar sudah digunakan pada properti ini.']);
        }

        $room->update($data);

        return redirect()->route('rooms.show', $room)->with('status', 'Kamar berhasil diperbarui.');
    }

    public function destroy(Room $room): RedirectResponse
    {
        if ($room->tenants()->exists() || $room->bookings()->exists()) {
            return back()->with('error', 'Kamar memiliki riwayat penyewa atau booking dan tidak dapat dihapus.');
        }

        $room->delete();

        return redirect()->route('rooms.index')->with('status', 'Kamar berhasil dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'property_id' => ['required', 'integer', 'exists:properties,id'],
            'number' => ['required', 'string', 'max:30'],
            'type' => ['required', 'string', 'max:60'],
            'capacity' => ['required', 'integer', 'min:1', 'max:20'],
            'price_daily' => ['required', 'integer', 'min:0'],
            'price_monthly' => ['required', 'integer', 'min:0'],
            'facilities' => ['nullable', 'string'],
            'status' => ['required', Rule::in(array_keys(Labels::ROOM_STATUSES))],
        ]);

        $data['facilities'] = $this->parseFacilities($data['facilities'] ?? '');

        return $data;
    }

    /**
     * @return array<int, string>
     */
    private function parseFacilities(string $value): array
    {
        $parts = preg_split('/[,;\n]+/', $value) ?: [];

        return array_values(array_filter(array_map('trim', $parts), fn ($item) => $item !== ''));
    }
}
