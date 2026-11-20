<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceRequest;
use App\Models\Tenant;
use App\Support\Labels;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class RequestController extends Controller
{
    public function index(Request $request): View
    {
        $requests = MaintenanceRequest::query()
            ->with(['tenant', 'room.property'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($request->filled('category'), fn ($q) => $q->where('category', $request->query('category')))
            ->when($request->filled('priority'), fn ($q) => $q->where('priority', $request->query('priority')))
            ->when($request->filled('tenant_id'), fn ($q) => $q->where('tenant_id', $request->query('tenant_id')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = $request->query('search');
                $q->where(fn ($sub) => $sub->where('code', 'like', "%{$term}%")
                    ->orWhere('title', 'like', "%{$term}%")
                    ->orWhere('description', 'like', "%{$term}%"));
            })
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return view('admin.requests.index', [
            'requests' => $requests,
            'tenants' => Tenant::orderBy('name')->get(),
            'categories' => Labels::REQUEST_CATEGORIES,
            'statuses' => Labels::REQUEST_STATUSES,
            'priorities' => Labels::REQUEST_PRIORITIES,
        ]);
    }

    public function update(Request $request, MaintenanceRequest $requestModel): RedirectResponse
    {
        $data = $request->validate([
            'category' => ['sometimes', Rule::in(array_keys(Labels::REQUEST_CATEGORIES))],
            'priority' => ['sometimes', Rule::in(array_keys(Labels::REQUEST_PRIORITIES))],
            'title' => ['sometimes', 'string', 'max:150'],
            'description' => ['sometimes', 'string'],
            'status' => ['sometimes', Rule::in(array_keys(Labels::REQUEST_STATUSES))],
            'response' => ['nullable', 'string'],
        ]);

        if (($data['status'] ?? null) === 'done' && ! $requestModel->resolved_at) {
            $data['resolved_at'] = now()->toDateString();
        }

        $requestModel->update($data);

        return back()->with('status', 'Laporan berhasil diperbarui.');
    }

    public function respond(Request $request, MaintenanceRequest $requestModel): RedirectResponse
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

        return back()->with('status', 'Tanggapan berhasil dikirim.');
    }

    public function destroy(MaintenanceRequest $requestModel): RedirectResponse
    {
        $requestModel->delete();

        return redirect()->route('requests.index')->with('status', 'Laporan berhasil dihapus.');
    }
}
