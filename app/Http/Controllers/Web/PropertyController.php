<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Services\OccupancyService;
use App\Support\Labels;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class PropertyController extends Controller
{
    public function index(Request $request): View
    {
        $properties = Property::query()
            ->withCount('rooms')
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = $request->query('search');
                $query->where(fn ($q) => $q->where('name', 'like', "%{$term}%")->orWhere('address', 'like', "%{$term}%"));
            })
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString();

        return view('admin.properties.index', [
            'properties' => $properties,
            'types' => Labels::PROPERTY_TYPES,
        ]);
    }

    public function create(): View
    {
        return view('admin.properties.form', [
            'property' => new Property(['type' => 'kost']),
            'types' => Labels::PROPERTY_TYPES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $property = Property::create($this->validated($request));

        return redirect()->route('properties.show', $property)->with('status', 'Properti berhasil ditambahkan.');
    }

    public function show(Property $property, OccupancyService $occupancy): View
    {
        $property->load('rooms');
        $counts = ['available' => 0, 'occupied' => 0, 'maintenance' => 0];

        foreach ($property->rooms as $room) {
            $counts[$occupancy->effectiveStatus($room)]++;
        }

        return view('admin.properties.show', [
            'property' => $property,
            'rooms' => $property->rooms->sortBy('number'),
            'counts' => $counts,
            'tenants' => $property->tenants()->with('room')->where('status', 'active')->get(),
            'occupancy' => $occupancy,
        ]);
    }

    public function edit(Property $property): View
    {
        return view('admin.properties.form', [
            'property' => $property,
            'types' => Labels::PROPERTY_TYPES,
        ]);
    }

    public function update(Request $request, Property $property): RedirectResponse
    {
        $property->update($this->validated($request));

        return redirect()->route('properties.show', $property)->with('status', 'Properti berhasil diperbarui.');
    }

    public function destroy(Property $property): RedirectResponse
    {
        if ($property->rooms()->exists()) {
            return back()->with('error', 'Properti masih memiliki kamar dan tidak dapat dihapus.');
        }

        $property->delete();

        return redirect()->route('properties.index')->with('status', 'Properti berhasil dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'type' => ['required', Rule::in(array_keys(Labels::PROPERTY_TYPES))],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
