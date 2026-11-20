<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessRuleException;
use App\Http\Resources\RequestResource;
use App\Models\MaintenanceRequest;
use App\Models\Tenant;
use App\Support\Codes;
use App\Support\Labels;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RequestController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = MaintenanceRequest::query()->with(['tenant', 'room.property']);

        foreach (['status', 'category', 'priority'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->query($filter));
            }
        }

        if ($request->filled('tenantId')) {
            $query->where('tenant_id', $request->query('tenantId'));
        }

        $this->applySearch($query, $request, ['code', 'title', 'description']);
        $this->applySort($query, $request, [
            'createdAt' => 'created_at',
            'priority' => 'priority',
            'status' => 'status',
        ], '-created_at');

        return $this->paginated($this->paginate($query, $request), RequestResource::class);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tenantId' => ['required', 'integer', 'exists:tenants,id'],
            'category' => ['sometimes', Rule::in(array_keys(Labels::REQUEST_CATEGORIES))],
            'priority' => ['sometimes', Rule::in(array_keys(Labels::REQUEST_PRIORITIES))],
            'title' => ['required', 'string', 'max:150'],
            'description' => ['required', 'string'],
            'status' => ['sometimes', Rule::in(array_keys(Labels::REQUEST_STATUSES))],
        ]);

        $tenant = Tenant::findOrFail($data['tenantId']);
        $status = $data['status'] ?? 'open';

        $row = MaintenanceRequest::create([
            'code' => Codes::next(MaintenanceRequest::class, 'REQ-'),
            'tenant_id' => $tenant->id,
            'property_id' => $tenant->property_id,
            'room_id' => $tenant->room_id,
            'category' => $data['category'] ?? 'lainnya',
            'priority' => $data['priority'] ?? 'normal',
            'title' => trim($data['title']),
            'description' => trim($data['description']),
            'status' => $status,
            'response' => '',
            'resolved_at' => $status === 'done' ? now()->toDateString() : null,
        ]);

        return $this->respond(new RequestResource($row), 201);
    }

    public function show(MaintenanceRequest $requestModel): JsonResponse
    {
        $requestModel->load(['tenant', 'room.property']);

        return $this->respond(new RequestResource($requestModel));
    }

    public function update(Request $request, MaintenanceRequest $requestModel): JsonResponse
    {
        $data = $request->validate([
            'category' => ['sometimes', Rule::in(array_keys(Labels::REQUEST_CATEGORIES))],
            'priority' => ['sometimes', Rule::in(array_keys(Labels::REQUEST_PRIORITIES))],
            'title' => ['sometimes', 'string', 'max:150'],
            'description' => ['sometimes', 'string'],
            'status' => ['sometimes', Rule::in(array_keys(Labels::REQUEST_STATUSES))],
            'response' => ['sometimes', 'nullable', 'string'],
        ]);

        if (($data['status'] ?? null) === 'done' && ! $requestModel->resolved_at) {
            $data['resolved_at'] = now()->toDateString();
        }

        $requestModel->update($data);

        return $this->respond(new RequestResource($requestModel->fresh()));
    }

    public function destroy(MaintenanceRequest $requestModel): JsonResponse
    {
        $requestModel->delete();

        return response()->json(null, 204);
    }

    public function addResponse(Request $request, MaintenanceRequest $requestModel): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(array_keys(Labels::REQUEST_STATUSES))],
            'response' => ['required', 'string'],
        ]);

        $requestModel->update([
            'status' => $data['status'],
            'response' => $data['response'],
            'resolved_at' => $data['status'] === 'done' ? now()->toDateString() : null,
        ]);

        return $this->respond(new RequestResource($requestModel->fresh()));
    }
}
