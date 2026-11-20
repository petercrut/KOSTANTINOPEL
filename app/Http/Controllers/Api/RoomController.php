<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessRuleException;
use App\Http\Resources\RoomResource;
use App\Http\Resources\TenantResource;
use App\Models\Room;
use App\Services\OccupancyService;
use App\Support\Labels;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoomController extends ApiController
{
    private const FIELD_MAP = [
        'propertyId' => 'property_id',
        'priceDaily' => 'price_daily',
        'priceMonthly' => 'price_monthly',
    ];

    public function __construct(private readonly OccupancyService $occupancy) {}

    public function index(Request $request): JsonResponse
    {
        $query = Room::query()->with('property');

        if ($request->filled('propertyId')) {
            $query->where('property_id', $request->query('propertyId'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        $this->applySearch($query, $request, ['number', 'type']);
        $this->applySort($query, $request, [
            'number' => 'number',
            'priceDaily' => 'price_daily',
            'priceMonthly' => 'price_monthly',
            'capacity' => 'capacity',
            'createdAt' => 'created_at',
        ], 'number');

        return $this->paginated($this->paginate($query, $request), RoomResource::class);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->mapped($this->validatePayload($request), self::FIELD_MAP);

        $exists = Room::where('property_id', $data['property_id'])
            ->where('number', $data['number'])
            ->exists();

        if ($exists) {
            throw new BusinessRuleException('Nomor kamar sudah digunakan pada properti ini');
        }

        $room = Room::create($data);

        return $this->respond(new RoomResource($room), 201);
    }

    public function show(Room $room): JsonResponse
    {
        return $this->respond(new RoomResource($room));
    }

    public function update(Request $request, Room $room): JsonResponse
    {
        $data = $this->mapped($this->validatePayload($request, true), self::FIELD_MAP);
        $propertyId = $data['property_id'] ?? $room->property_id;
        $number = $data['number'] ?? $room->number;

        $exists = Room::where('property_id', $propertyId)
            ->where('number', $number)
            ->whereKeyNot($room->id)
            ->exists();

        if ($exists) {
            throw new BusinessRuleException('Nomor kamar sudah digunakan pada properti ini');
        }

        $room->update($data);

        return $this->respond(new RoomResource($room->fresh()));
    }

    public function destroy(Room $room): JsonResponse
    {
        if ($room->tenants()->exists() || $room->bookings()->exists()) {
            throw new BusinessRuleException('Kamar memiliki riwayat penyewa atau booking dan tidak dapat dihapus');
        }

        $room->delete();

        return response()->json(null, 204);
    }

    public function availability(Request $request, Room $room): JsonResponse
    {
        $data = $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
        ]);

        $effectiveStatus = $this->occupancy->effectiveStatus($room);
        $available = $this->occupancy->isAvailable($room->id, $data['from'], $data['to']);

        $reason = match (true) {
            $room->status === 'maintenance' => 'Kamar sedang dalam perawatan',
            ! $available => 'Kamar sudah terisi pada periode tersebut',
            default => 'Kamar tersedia',
        };

        return response()->json([
            'data' => [
                'roomId' => (string) $room->id,
                'from' => $data['from'],
                'to' => $data['to'],
                'available' => $available,
                'effectiveStatus' => $effectiveStatus,
                'reason' => $reason,
            ],
        ]);
    }

    public function tenants(Room $room): JsonResponse
    {
        $tenants = $room->tenants()->with('user')->latest('start_date')->get();

        return response()->json(['data' => TenantResource::collection($tenants)]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'propertyId' => [$required, 'integer', 'exists:properties,id'],
            'number' => [$required, 'string', 'max:30'],
            'type' => ['sometimes', 'string', 'max:60'],
            'capacity' => ['sometimes', 'integer', 'min:1', 'max:20'],
            'priceDaily' => ['sometimes', 'integer', 'min:0'],
            'priceMonthly' => ['sometimes', 'integer', 'min:0'],
            'facilities' => ['sometimes', 'array'],
            'facilities.*' => ['string', 'max:60'],
            'status' => ['sometimes', Rule::in(array_keys(Labels::ROOM_STATUSES))],
        ]);
    }
}
