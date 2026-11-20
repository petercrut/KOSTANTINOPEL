<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessRuleException;
use App\Http\Resources\AnnouncementResource;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\PropertyResource;
use App\Http\Resources\RequestResource;
use App\Http\Resources\RoomResource;
use App\Http\Resources\TenantResource;
use App\Models\Announcement;
use App\Models\MaintenanceRequest;
use App\Models\Tenant;
use App\Services\InvoiceService;
use App\Support\Codes;
use App\Support\Labels;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PortalController extends ApiController
{
    public function summary(Request $request): JsonResponse
    {
        $tenant = $this->tenant($request);
        $tenant->load(['room.property', 'requests', 'invoices']);
        $unpaid = $tenant->invoices->filter(fn ($invoice) => ! $invoice->isPaid());
        $nextDue = $unpaid->sortBy(fn ($invoice) => $invoice->due_date?->toDateString())->first();

        return response()->json([
            'data' => [
                'tenant' => new TenantResource($tenant),
                'property' => $tenant->room?->property ? new PropertyResource($tenant->room->property) : null,
                'room' => $tenant->room ? new RoomResource($tenant->room) : null,
                'outstanding' => (int) $unpaid->sum('amount'),
                'unpaidCount' => $unpaid->count(),
                'nextDueDate' => $nextDue?->due_date?->format('Y-m-d'),
                'activeRequests' => $tenant->requests
                    ->whereIn('status', ['open', 'in_progress'])
                    ->count(),
                'latestAnnouncements' => AnnouncementResource::collection(
                    Announcement::visibleTo($tenant->property_id)->ordered()->limit(3)->get(),
                ),
            ],
        ]);
    }

    public function room(Request $request): JsonResponse
    {
        $tenant = $this->tenant($request);
        $tenant->load('room.property');

        return response()->json([
            'data' => [
                'tenant' => new TenantResource($tenant),
                'property' => $tenant->room?->property ? new PropertyResource($tenant->room->property) : null,
                'room' => $tenant->room ? new RoomResource($tenant->room) : null,
                'active' => $tenant->isActive(),
            ],
        ]);
    }

    public function invoices(Request $request): JsonResponse
    {
        $tenant = $this->tenant($request);
        $invoices = $tenant->invoices()->orderByDesc('code')->get();

        if ($request->filled('status')) {
            $invoices = $invoices->filter(
                fn ($invoice) => $invoice->effectiveStatus() === $request->query('status'),
            )->values();
        }

        return response()->json(['data' => InvoiceResource::collection($invoices)]);
    }

    public function payment(Request $request, int $id, InvoiceService $service): JsonResponse
    {
        $tenant = $this->tenant($request);
        $invoice = $tenant->invoices()->find($id);

        if (! $invoice) {
            throw new BusinessRuleException('Tagihan tidak ditemukan', 404, 'NOT_FOUND');
        }

        $data = $request->validate([
            'method' => ['sometimes', Rule::in(array_keys(Labels::PAYMENT_METHODS))],
            'paidAt' => ['sometimes', 'nullable', 'date'],
            'paidVia' => ['sometimes', 'nullable', 'string', 'max:30'],
        ]);

        $invoice = $service->pay(
            $invoice,
            $data['method'] ?? null,
            $data['paidAt'] ?? null,
            $data['paidVia'] ?? 'tenant',
        );

        return $this->respond(new InvoiceResource($invoice));
    }

    public function requests(Request $request): JsonResponse
    {
        $tenant = $this->tenant($request);
        $rows = $tenant->requests()->orderByDesc('created_at')->get();

        return response()->json(['data' => RequestResource::collection($rows)]);
    }

    public function createRequest(Request $request): JsonResponse
    {
        $tenant = $this->tenant($request);

        $data = $request->validate([
            'category' => ['sometimes', Rule::in(array_keys(Labels::REQUEST_CATEGORIES))],
            'priority' => ['sometimes', Rule::in(array_keys(Labels::REQUEST_PRIORITIES))],
            'title' => ['required', 'string', 'max:150'],
            'description' => ['required', 'string'],
            'status' => ['sometimes', Rule::in(['open'])],
        ]);

        $row = MaintenanceRequest::create([
            'code' => Codes::next(MaintenanceRequest::class, 'REQ-'),
            'tenant_id' => $tenant->id,
            'property_id' => $tenant->property_id,
            'room_id' => $tenant->room_id,
            'category' => $data['category'] ?? 'lainnya',
            'priority' => $data['priority'] ?? 'normal',
            'title' => trim($data['title']),
            'description' => trim($data['description']),
            'status' => 'open',
            'response' => '',
        ]);

        return $this->respond(new RequestResource($row), 201);
    }

    public function announcements(Request $request): JsonResponse
    {
        $tenant = $this->tenant($request);
        $rows = Announcement::visibleTo($tenant->property_id)->ordered()->get();

        return response()->json(['data' => AnnouncementResource::collection($rows)]);
    }

    public function identity(Request $request): JsonResponse
    {
        $tenant = $this->tenant($request);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'idNumber' => ['sometimes', 'nullable', 'string', 'max:40'],
            'email' => ['sometimes', 'nullable', 'email', 'max:190'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'birthDate' => ['sometimes', 'nullable', 'date'],
            'gender' => ['sometimes', 'nullable', 'string', 'max:30'],
            'occupation' => ['sometimes', 'nullable', 'string', 'max:80'],
            'emergencyName' => ['sometimes', 'nullable', 'string', 'max:120'],
            'emergencyPhone' => ['sometimes', 'nullable', 'string', 'max:40'],
        ]);

        $tenant->update($this->mapped($data, [
            'idNumber' => 'id_number',
            'birthDate' => 'birth_date',
            'emergencyName' => 'emergency_name',
            'emergencyPhone' => 'emergency_phone',
        ]));

        return $this->respond(new TenantResource($tenant->fresh(['room.property', 'user'])));
    }

    private function tenant(Request $request): Tenant
    {
        $user = $request->user();

        if (! $user || ! $user->tenant_id) {
            throw new BusinessRuleException('Akun ini tidak terhubung dengan data penyewa', 403, 'FORBIDDEN');
        }

        $tenant = Tenant::with('room.property')->find($user->tenant_id);

        if (! $tenant) {
            throw new BusinessRuleException('Data penyewa tidak ditemukan', 404, 'NOT_FOUND');
        }

        return $tenant;
    }
}
