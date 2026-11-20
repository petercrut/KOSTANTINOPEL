<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessRuleException;
use App\Http\Resources\PropertyResource;
use App\Http\Resources\RoomResource;
use App\Models\Property;
use App\Services\OccupancyService;
use App\Support\Labels;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PropertyController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Property::query();

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        $this->applySearch($query, $request, ['name', 'address', 'phone']);
        $this->applySort($query, $request, [
            'name' => 'name',
            'type' => 'type',
            'createdAt' => 'created_at',
        ], 'name');

        return $this->paginated($this->paginate($query, $request), PropertyResource::class);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatePayload($request);

        $property = Property::create($data);

        return $this->respond(new PropertyResource($property), 201);
    }

    public function show(Property $property): JsonResponse
    {
        return $this->respond(new PropertyResource($property));
    }

    public function update(Request $request, Property $property): JsonResponse
    {
        $data = $this->validatePayload($request, true);

        $property->update($data);

        return $this->respond(new PropertyResource($property->fresh()));
    }

    public function destroy(Property $property): JsonResponse
    {
        if ($property->rooms()->exists()) {
            throw new BusinessRuleException('Properti masih memiliki kamar dan tidak dapat dihapus');
        }

        $property->delete();

        return response()->json(null, 204);
    }

    public function rooms(Property $property): JsonResponse
    {
        $rooms = $property->rooms()->orderBy('number')->get();

        return response()->json(['data' => RoomResource::collection($rooms)]);
    }

    public function summary(Property $property, OccupancyService $occupancy): JsonResponse
    {
        $rooms = $property->rooms()->get();
        $counts = ['available' => 0, 'occupied' => 0, 'maintenance' => 0];

        foreach ($rooms as $room) {
            $counts[$occupancy->effectiveStatus($room)]++;
        }

        $total = $rooms->count();

        return response()->json([
            'data' => [
                'propertyId' => (string) $property->id,
                'name' => $property->name,
                'totalRooms' => $total,
                'occupied' => $counts['occupied'],
                'available' => $counts['available'],
                'maintenance' => $counts['maintenance'],
                'occupancyRate' => $total > 0 ? (int) round(($counts['occupied'] / $total) * 100) : 0,
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:150'],
            'type' => [$required, Rule::in(array_keys(Labels::PROPERTY_TYPES))],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);
    }
}
