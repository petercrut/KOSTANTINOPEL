<?php

namespace App\Http\Controllers\Web;

use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Invoice;
use App\Models\MaintenanceRequest;
use App\Models\Tenant;
use App\Services\InvoiceService;
use App\Support\Codes;
use App\Support\Labels;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class PortalController extends Controller
{
    public function dashboard(Request $request): View
    {
        $tenant = $this->tenant($request);
        $tenant->load(['room.property', 'requests']);
        $invoices = $tenant->invoices()->orderByDesc('code')->get();
        $unpaid = $invoices->filter(fn ($invoice) => ! $invoice->isPaid());

        return view('portal.dashboard', [
            'tenant' => $tenant,
            'invoices' => $invoices->take(5),
            'outstanding' => (int) $unpaid->sum('amount'),
            'unpaidCount' => $unpaid->count(),
            'nextDue' => $unpaid->sortBy(fn ($invoice) => $invoice->due_date?->toDateString())->first(),
            'requests' => $tenant->requests()->orderByDesc('created_at')->limit(5)->get(),
            'announcements' => Announcement::visibleTo($tenant->property_id)->ordered()->limit(3)->get(),
        ]);
    }

    public function invoices(Request $request): View
    {
        $tenant = $this->tenant($request);
        $invoices = $tenant->invoices()->orderByDesc('code')->get();

        if ($request->filled('status')) {
            $invoices = $invoices->filter(
                fn ($invoice) => $invoice->effectiveStatus() === $request->query('status'),
            )->values();
        }

        $all = $tenant->invoices;
        $unpaid = $all->filter(fn ($invoice) => ! $invoice->isPaid());

        return view('portal.invoices', [
            'tenant' => $tenant,
            'invoices' => $invoices,
            'outstanding' => (int) $unpaid->sum('amount'),
            'paidTotal' => (int) $all->where('status', 'paid')->sum('amount'),
            'methods' => Labels::PAYMENT_METHODS,
        ]);
    }

    public function payment(Request $request, int $id, InvoiceService $service): RedirectResponse
    {
        $tenant = $this->tenant($request);
        $invoice = $tenant->invoices()->find($id);

        if (! $invoice) {
            abort(404);
        }

        $data = $request->validate([
            'method' => ['required', Rule::in(array_keys(Labels::PAYMENT_METHODS))],
        ]);

        try {
            $service->pay($invoice, $data['method'], now()->toDateString(), 'tenant');
        } catch (BusinessRuleException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('status', 'Pembayaran berhasil dicatat. Terima kasih!');
    }

    public function requests(Request $request): View
    {
        $tenant = $this->tenant($request);

        return view('portal.requests', [
            'tenant' => $tenant,
            'requests' => $tenant->requests()->orderByDesc('created_at')->get(),
            'categories' => Labels::REQUEST_CATEGORIES,
            'priorities' => Labels::REQUEST_PRIORITIES,
            'statuses' => Labels::REQUEST_STATUSES,
        ]);
    }

    public function storeRequest(Request $request): RedirectResponse
    {
        $tenant = $this->tenant($request);

        $data = $request->validate([
            'category' => ['required', Rule::in(array_keys(Labels::REQUEST_CATEGORIES))],
            'priority' => ['required', Rule::in(array_keys(Labels::REQUEST_PRIORITIES))],
            'title' => ['required', 'string', 'max:150'],
            'description' => ['required', 'string'],
        ]);

        MaintenanceRequest::create([
            'code' => Codes::next(MaintenanceRequest::class, 'REQ-'),
            'tenant_id' => $tenant->id,
            'property_id' => $tenant->property_id,
            'room_id' => $tenant->room_id,
            'category' => $data['category'],
            'priority' => $data['priority'],
            'title' => trim($data['title']),
            'description' => trim($data['description']),
            'status' => 'open',
            'response' => '',
        ]);

        return redirect()->route('portal.requests')->with('status', 'Laporan berhasil dikirim.');
    }

    public function announcements(Request $request): View
    {
        $tenant = $this->tenant($request);

        return view('portal.announcements', [
            'tenant' => $tenant,
            'announcements' => Announcement::visibleTo($tenant->property_id)->ordered()->get(),
        ]);
    }

    public function identity(Request $request): RedirectResponse
    {
        $tenant = $this->tenant($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:40'],
            'id_number' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:190'],
            'address' => ['nullable', 'string', 'max:255'],
            'birth_date' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'max:30'],
            'occupation' => ['nullable', 'string', 'max:80'],
            'emergency_name' => ['nullable', 'string', 'max:120'],
            'emergency_phone' => ['nullable', 'string', 'max:40'],
        ]);

        $tenant->update($data);

        return back()->with('status', 'Data diri berhasil diperbarui.');
    }

    public function profile(Request $request): View
    {
        $tenant = $this->tenant($request);
        $tenant->load('room.property', 'user');
        $invoices = $tenant->invoices;

        return view('portal.profile', [
            'tenant' => $tenant,
            'outstanding' => (int) $invoices->filter(fn ($invoice) => ! $invoice->isPaid())->sum('amount'),
            'paidTotal' => (int) $invoices->where('status', 'paid')->sum('amount'),
        ]);
    }

    private function tenant(Request $request): Tenant
    {
        $user = $request->user();

        if (! $user || ! $user->tenant_id) {
            abort(403, 'Akun ini tidak terhubung dengan data penyewa.');
        }

        $tenant = Tenant::with('room.property')->find($user->tenant_id);

        if (! $tenant) {
            abort(404, 'Data penyewa tidak ditemukan.');
        }

        return $tenant;
    }
}
