<?php

namespace App\Http\Controllers\Web;

use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\Property;
use App\Models\Room;
use App\Models\Tenant;
use App\Services\InvoiceService;
use App\Support\Labels;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class InvoiceController extends Controller
{
    public function index(Request $request, InvoiceService $service): View
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

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->query('tenant_id'));
        }

        if ($request->filled('search')) {
            $term = $request->query('search');
            $query->where(fn ($q) => $q->where('code', 'like', "%{$term}%")->orWhere('description', 'like', "%{$term}%"));
        }

        return view('admin.invoices.index', [
            'invoices' => $query->orderByDesc('created_at')->paginate(15)->withQueryString(),
            'totals' => $service->totals(),
            'tenants' => Tenant::orderBy('name')->get(),
            'statuses' => Labels::INVOICE_STATUSES,
        ]);
    }

    public function create(Request $request): View
    {
        return view('admin.invoices.form', [
            'invoice' => new Invoice([
                'due_date' => now()->addDays(5)->toDateString(),
                'tenant_id' => $request->query('tenant_id'),
                'booking_id' => $request->query('booking_id'),
            ]),
            'tenants' => Tenant::with('room')->orderBy('name')->get(),
            'bookings' => Booking::with('room')->latest()->limit(50)->get(),
            'rooms' => Room::with('property')->orderBy('number')->get(),
            'properties' => Property::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request, InvoiceService $service): RedirectResponse
    {
        $data = $request->validate([
            'description' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'integer', 'min:0'],
            'due_date' => ['required', 'date'],
            'tenant_id' => ['nullable', 'integer', 'exists:tenants,id'],
            'booking_id' => ['nullable', 'integer', 'exists:bookings,id'],
            'room_id' => ['nullable', 'integer', 'exists:rooms,id'],
            'property_id' => ['nullable', 'integer', 'exists:properties,id'],
        ]);

        $invoice = $service->create($data);

        return redirect()->route('invoices.show', $invoice)->with('status', 'Tagihan berhasil dibuat.');
    }

    public function show(Invoice $invoice): View
    {
        $invoice->load(['tenant.room', 'room.property', 'booking']);

        return view('admin.invoices.show', [
            'invoice' => $invoice,
            'methods' => Labels::PAYMENT_METHODS,
            'effectiveStatus' => $invoice->effectiveStatus(),
        ]);
    }

    public function edit(Invoice $invoice): View
    {
        return view('admin.invoices.form', [
            'invoice' => $invoice,
            'tenants' => Tenant::with('room')->orderBy('name')->get(),
            'bookings' => Booking::with('room')->latest()->limit(50)->get(),
            'rooms' => Room::with('property')->orderBy('number')->get(),
            'properties' => Property::orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, Invoice $invoice): RedirectResponse
    {
        $data = $request->validate([
            'description' => ['sometimes', 'string', 'max:255'],
            'amount' => ['sometimes', 'integer', 'min:0'],
            'due_date' => ['sometimes', 'date'],
        ]);

        $invoice->update($data);

        return redirect()->route('invoices.show', $invoice)->with('status', 'Tagihan berhasil diperbarui.');
    }

    public function payment(Request $request, Invoice $invoice, InvoiceService $service): RedirectResponse
    {
        $data = $request->validate([
            'method' => ['required', Rule::in(array_keys(Labels::PAYMENT_METHODS))],
            'paid_at' => ['nullable', 'date'],
            'paid_via' => ['nullable', 'string', 'max:30'],
        ]);

        try {
            $service->pay($invoice, $data['method'], $data['paid_at'] ?? null, $data['paid_via'] ?? 'admin');
        } catch (BusinessRuleException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return redirect()->route('invoices.show', $invoice)->with('status', 'Pembayaran berhasil dicatat.');
    }
}
