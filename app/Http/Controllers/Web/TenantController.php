<?php

namespace App\Http\Controllers\Web;

use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\Room;
use App\Models\Tenant;
use App\Models\User;
use App\Services\InvoiceService;
use App\Services\TenantService;
use App\Support\Labels;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;

class TenantController extends Controller
{
    public function index(Request $request): View
    {
        $tenants = Tenant::query()
            ->with(['room.property', 'user'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($request->filled('property_id'), fn ($q) => $q->where('property_id', $request->query('property_id')))
            ->when($request->filled('room_id'), fn ($q) => $q->where('room_id', $request->query('room_id')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = $request->query('search');
                $q->where(fn ($sub) => $sub->where('name', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%")
                    ->orWhere('phone', 'like', "%{$term}%"));
            })
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return view('admin.tenants.index', [
            'tenants' => $tenants,
            'properties' => Property::orderBy('name')->get(),
            'rooms' => Room::with('property')->orderBy('number')->get(),
            'statuses' => Labels::TENANT_STATUSES,
        ]);
    }

    public function create(Request $request): View
    {
        return view('admin.tenants.form', [
            'tenant' => new Tenant([
                'room_id' => $request->query('room_id'),
                'start_date' => now()->toDateString(),
                'status' => 'active',
            ]),
            'rooms' => Room::with('property')->orderBy('number')->get(),
            'genders' => Labels::GENDERS,
        ]);
    }

    public function store(Request $request, TenantService $service): RedirectResponse
    {
        $data = $this->validated($request);
        $data['amount'] = $request->input('amount');

        try {
            $tenant = $service->create($data);
        } catch (BusinessRuleException $exception) {
            return back()->withInput()->with('error', $exception->getMessage());
        }

        return redirect()->route('tenants.show', $tenant)->with('status', 'Penyewa berhasil ditambahkan.');
    }

    public function show(Tenant $tenant, InvoiceService $invoices): View
    {
        $tenant->load(['room.property', 'user', 'requests']);
        $tenantInvoices = $tenant->invoices()->orderByDesc('code')->get();

        return view('admin.tenants.show', [
            'tenant' => $tenant,
            'invoices' => $tenantInvoices,
            'requests' => $tenant->requests()->orderByDesc('created_at')->get(),
            'outstanding' => $tenantInvoices->filter(fn ($invoice) => ! $invoice->isPaid())->sum('amount'),
            'totals' => $invoices->totals(),
        ]);
    }

    public function edit(Tenant $tenant): View
    {
        return view('admin.tenants.form', [
            'tenant' => $tenant,
            'rooms' => Room::with('property')->orderBy('number')->get(),
            'genders' => Labels::GENDERS,
        ]);
    }

    public function update(Request $request, Tenant $tenant): RedirectResponse
    {
        $data = $this->validated($request, true);

        if (isset($data['room_id']) && (int) $data['room_id'] !== $tenant->room_id) {
            $room = Room::findOrFail($data['room_id']);
            $occupant = Tenant::where('room_id', $room->id)
                ->where('status', 'active')
                ->whereKeyNot($tenant->id)
                ->first();

            if ($occupant) {
                return back()->withInput()->with('error', 'Kamar ' . $room->number . ' sudah dihuni oleh ' . $occupant->name);
            }

            $data['property_id'] = $room->property_id;
        }

        $tenant->update($data);

        return redirect()->route('tenants.show', $tenant)->with('status', 'Data penyewa berhasil diperbarui.');
    }

    public function destroy(Tenant $tenant): RedirectResponse
    {
        if ($tenant->status === 'active') {
            return back()->with('error', 'Penyewa masih aktif. Akhiri masa sewa terlebih dahulu.');
        }

        $tenant->delete();

        return redirect()->route('tenants.index')->with('status', 'Data penyewa berhasil dihapus.');
    }

    public function end(Tenant $tenant, TenantService $service): RedirectResponse
    {
        try {
            $service->end($tenant);
        } catch (BusinessRuleException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return redirect()->route('tenants.show', $tenant)->with('status', 'Masa sewa telah diakhiri.');
    }

    public function accountStore(Request $request, Tenant $tenant): RedirectResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:190'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        if ($tenant->user()->exists()) {
            return back()->with('error', 'Penyewa ini sudah memiliki akun login.');
        }

        $email = strtolower(trim($data['email']));

        if (User::whereRaw('lower(email) = ?', [$email])->exists()) {
            return back()->with('error', 'Email sudah digunakan akun lain.');
        }

        User::create([
            'name' => $tenant->name,
            'email' => $email,
            'password' => $data['password'],
            'role' => 'tenant',
            'tenant_id' => $tenant->id,
        ]);

        $tenant->update(['email' => $email]);

        return redirect()->route('tenants.show', $tenant)->with('status', 'Akun login penyewa berhasil dibuat.');
    }

    public function accountDestroy(Tenant $tenant): RedirectResponse
    {
        if (! $tenant->user) {
            return back()->with('error', 'Penyewa belum memiliki akun login.');
        }

        $tenant->user->delete();

        return redirect()->route('tenants.show', $tenant)->with('status', 'Akun login penyewa berhasil dihapus.');
    }

    public function password(Request $request, Tenant $tenant): RedirectResponse
    {
        $data = $request->validate([
            'password' => ['required', 'string', 'min:6'],
        ]);

        if (! $tenant->user) {
            return back()->with('error', 'Penyewa belum memiliki akun login.');
        }

        $tenant->user->update(['password' => $data['password']]);

        return redirect()->route('tenants.show', $tenant)->with('status', 'Password akun penyewa berhasil direset.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:120'],
            'room_id' => [$required, 'integer', 'exists:rooms,id'],
            'start_date' => [$required, 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'phone' => ['nullable', 'string', 'max:40'],
            'id_number' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:190'],
            'address' => ['nullable', 'string', 'max:255'],
            'birth_date' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'max:30'],
            'occupation' => ['nullable', 'string', 'max:80'],
            'emergency_name' => ['nullable', 'string', 'max:120'],
            'emergency_phone' => ['nullable', 'string', 'max:40'],
            'note' => ['nullable', 'string'],
        ]);
    }
}
