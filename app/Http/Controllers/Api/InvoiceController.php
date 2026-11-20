<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessRuleException;
use App\Http\Resources\InvoiceResource;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\Room;
use App\Services\InvoiceService;
use App\Support\Labels;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InvoiceController extends ApiController
{
    private const FIELD_MAP = [
        'bookingId' => 'booking_id',
        'tenantId' => 'tenant_id',
        'propertyId' => 'property_id',
        'roomId' => 'room_id',
        'dueDate' => 'due_date',
    ];

    public function index(Request $request): JsonResponse
    {
        $query = Invoice::query()->with(['tenant', 'room.property', 'booking']);

        if ($request->filled('status')) {
            $status = $request->query('status');
            $today = now()->toDateString();

            if ($status === 'paid') {
                $query->where('status', 'paid');
            } elseif ($status === 'late') {
                $query->where('status', '!=', 'paid')->whereDate('due_date', '<', $today);
            } elseif ($status === 'unpaid') {
                $query->where('status', '!=', 'paid')->whereDate('due_date', '>=', $today);
            }
        }

        if ($request->filled('tenantId')) {
            $query->where('tenant_id', $request->query('tenantId'));
        }

        if ($request->filled('bookingId')) {
            $query->where('booking_id', $request->query('bookingId'));
        }

        $this->applySearch($query, $request, ['code', 'description']);
        $this->applySort($query, $request, [
            'code' => 'code',
            'amount' => 'amount',
            'dueDate' => 'due_date',
            'createdAt' => 'created_at',
        ], '-created_at');

        return $this->paginated($this->paginate($query, $request), InvoiceResource::class);
    }

    public function store(Request $request, InvoiceService $service): JsonResponse
    {
        $data = $this->mapped($request->validate([
            'description' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'integer', 'min:0'],
            'dueDate' => ['required', 'date'],
            'tenantId' => ['sometimes', 'nullable', 'integer', 'exists:tenants,id'],
            'bookingId' => ['sometimes', 'nullable', 'integer', 'exists:bookings,id'],
            'roomId' => ['sometimes', 'nullable', 'integer', 'exists:rooms,id'],
            'propertyId' => ['sometimes', 'nullable', 'integer', 'exists:properties,id'],
        ]), self::FIELD_MAP);

        $invoice = $service->create($data);

        return $this->respond(new InvoiceResource($invoice), 201);
    }

    public function summary(InvoiceService $service): JsonResponse
    {
        return response()->json(['data' => $service->totals()]);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        $invoice->load(['tenant', 'room.property', 'booking']);

        return $this->respond(new InvoiceResource($invoice));
    }

    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        $data = $this->mapped($request->validate([
            'description' => ['sometimes', 'string', 'max:255'],
            'amount' => ['sometimes', 'integer', 'min:0'],
            'dueDate' => ['sometimes', 'date'],
        ]), self::FIELD_MAP);

        $invoice->update($data);

        return $this->respond(new InvoiceResource($invoice->fresh()));
    }

    public function payment(Request $request, Invoice $invoice, InvoiceService $service): JsonResponse
    {
        $data = $request->validate([
            'method' => ['sometimes', Rule::in(array_keys(Labels::PAYMENT_METHODS))],
            'paidAt' => ['sometimes', 'nullable', 'date'],
            'paidVia' => ['sometimes', 'nullable', 'string', 'max:30'],
        ]);

        $invoice = $service->pay(
            $invoice,
            $data['method'] ?? null,
            $data['paidAt'] ?? null,
            $data['paidVia'] ?? 'admin',
        );

        return $this->respond(new InvoiceResource($invoice));
    }
}
