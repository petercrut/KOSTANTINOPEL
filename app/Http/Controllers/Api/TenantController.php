<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessRuleException;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\RequestResource;
use App\Http\Resources\TenantAccountResource;
use App\Http\Resources\TenantResource;
use App\Models\Room;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantService;
use App\Support\Labels;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TenantController extends ApiController
{
    private const FIELD_MAP = [
        'idNumber' => 'id_number',
        'birthDate' => 'birth_date',
        'emergencyName' => 'emergency_name',
        'emergencyPhone' => 'emergency_phone',
        'roomId' => 'room_id',
        'propertyId' => 'property_id',
        'startDate' => 'start_date',
        'endDate' => 'end_date',
    ];

    public function index(Request $request): JsonResponse
    {
        $query = Tenant::query()->with(['user', 'room.property']);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('propertyId')) {
            $query->where('property_id', $request->query('propertyId'));
        }

        if ($request->filled('roomId')) {
            $query->where('room_id', $request->query('roomId'));
        }

        $this->applySearch($query, $request, ['name', 'email', 'phone', 'id_number']);
        $this->applySort($query, $request, [
            'name' => 'name',
            'startDate' => 'start_date',
            'createdAt' => 'created_at',
        ], '-created_at');

        return $this->paginated($this->paginate($query, $request), TenantResource::class);
    }

    public function store(Request $request, TenantService $service): JsonResponse
    {
        $data = $this->mapped($request->validate([
            'name' => ['required', 'string', 'max:120'],
            'roomId' => ['required', 'integer', 'exists:rooms,id'],
            'startDate' => ['required', 'date'],
            'endDate' => ['sometimes', 'nullable', 'date', 'after_or_equal:startDate'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'idNumber' => ['sometimes', 'nullable', 'string', 'max:40'],
            'email' => ['sometimes', 'nullable', 'email', 'max:190'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'birthDate' => ['sometimes', 'nullable', 'date'],
            'gender' => ['sometimes', 'nullable', 'string', 'max:30'],
            'occupation' => ['sometimes', 'nullable', 'string', 'max:80'],
            'emergencyName' => ['sometimes', 'nullable', 'string', 'max:120'],
            'emergencyPhone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'note' => ['sometimes', 'nullable', 'string'],
            'amount' => ['sometimes', 'nullable', 'integer', 'min:0'],
        ]), self::FIELD_MAP);

        $tenant = $service->create($data);

        return $this->respond(new TenantResource($tenant), 201);
    }

    public function show(Tenant $tenant): JsonResponse
    {
        $tenant->load(['user', 'room.property']);

        return $this->respond(new TenantResource($tenant));
    }

    public function update(Request $request, Tenant $tenant): JsonResponse
    {
        $data = $this->mapped($request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'roomId' => ['sometimes', 'integer', 'exists:rooms,id'],
            'propertyId' => ['sometimes', 'integer', 'exists:properties,id'],
            'startDate' => ['sometimes', 'date'],
            'endDate' => ['sometimes', 'nullable', 'date'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'idNumber' => ['sometimes', 'nullable', 'string', 'max:40'],
            'email' => ['sometimes', 'nullable', 'email', 'max:190'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'birthDate' => ['sometimes', 'nullable', 'date'],
            'gender' => ['sometimes', 'nullable', 'string', 'max:30'],
            'occupation' => ['sometimes', 'nullable', 'string', 'max:80'],
            'emergencyName' => ['sometimes', 'nullable', 'string', 'max:120'],
            'emergencyPhone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'note' => ['sometimes', 'nullable', 'string'],
        ]), self::FIELD_MAP);

        if (isset($data['room_id']) && (int) $data['room_id'] !== $tenant->room_id) {
            $room = Room::findOrFail($data['room_id']);
            $occupant = Tenant::where('room_id', $room->id)
                ->where('status', 'active')
                ->whereKeyNot($tenant->id)
                ->first();

            if ($occupant) {
                throw new BusinessRuleException('Kamar ' . $room->number . ' sudah dihuni oleh ' . $occupant->name);
            }

            $data['property_id'] = $room->property_id;
        }

        $tenant->update($data);

        return $this->respond(new TenantResource($tenant->fresh(['user', 'room.property'])));
    }

    public function destroy(Tenant $tenant): JsonResponse
    {
        if ($tenant->status === 'active') {
            throw new BusinessRuleException('Penyewa masih aktif. Akhiri masa sewa terlebih dahulu.');
        }

        $tenant->delete();

        return response()->json(null, 204);
    }

    public function endTenancy(Tenant $tenant, TenantService $service): JsonResponse
    {
        return $this->respond(new TenantResource($service->end($tenant)));
    }

    public function createAccount(Request $request, Tenant $tenant): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:190'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        if ($tenant->user()->exists()) {
            throw new BusinessRuleException('Penyewa ini sudah memiliki akun login');
        }

        $email = strtolower(trim($data['email']));

        if (User::whereRaw('lower(email) = ?', [$email])->exists()) {
            throw new BusinessRuleException('Email sudah digunakan akun lain');
        }

        $user = User::create([
            'name' => $tenant->name,
            'email' => $email,
            'password' => $data['password'],
            'role' => 'tenant',
            'tenant_id' => $tenant->id,
        ]);

        $tenant->update(['email' => $email]);

        return $this->respond(new TenantAccountResource($user), 201);
    }

    public function deleteAccount(Tenant $tenant): JsonResponse
    {
        $user = $tenant->user;

        if (! $user) {
            throw new BusinessRuleException('Penyewa belum memiliki akun login', 404, 'NOT_FOUND');
        }

        $user->delete();

        return response()->json(null, 204);
    }

    public function resetPassword(Request $request, Tenant $tenant): JsonResponse
    {
        $data = $request->validate([
            'password' => ['required', 'string', 'min:6'],
        ]);

        $user = $tenant->user;

        if (! $user) {
            throw new BusinessRuleException('Penyewa belum memiliki akun login', 404, 'NOT_FOUND');
        }

        $user->update(['password' => $data['password']]);

        return response()->json(null, 204);
    }

    public function invoices(Tenant $tenant): JsonResponse
    {
        $invoices = $tenant->invoices()->orderByDesc('code')->get();

        return response()->json(['data' => InvoiceResource::collection($invoices)]);
    }

    public function requests(Tenant $tenant): JsonResponse
    {
        $rows = $tenant->requests()->orderByDesc('created_at')->get();

        return response()->json(['data' => RequestResource::collection($rows)]);
    }

    public function identity(Request $request, Tenant $tenant): JsonResponse
    {
        $data = $this->mapped($request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'idNumber' => ['sometimes', 'nullable', 'string', 'max:40'],
            'email' => ['sometimes', 'nullable', 'email', 'max:190'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'birthDate' => ['sometimes', 'nullable', 'date'],
            'gender' => ['sometimes', 'nullable', Rule::in(array_keys(Labels::GENDERS))],
            'occupation' => ['sometimes', 'nullable', 'string', 'max:80'],
            'emergencyName' => ['sometimes', 'nullable', 'string', 'max:120'],
            'emergencyPhone' => ['sometimes', 'nullable', 'string', 'max:40'],
        ]), self::FIELD_MAP);

        $tenant->update($data);

        return $this->respond(new TenantResource($tenant->fresh(['user', 'room.property'])));
    }
}
