<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Property;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AnnouncementController extends Controller
{
    public function index(Request $request): View
    {
        $announcements = Announcement::query()
            ->with('property')
            ->when($request->filled('property_id'), fn ($q) => $q->where('property_id', $request->query('property_id')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = $request->query('search');
                $q->where(fn ($sub) => $sub->where('title', 'like', "%{$term}%")->orWhere('body', 'like', "%{$term}%"));
            })
            ->ordered()
            ->paginate(12)
            ->withQueryString();

        return view('admin.announcements.index', [
            'announcements' => $announcements,
            'properties' => Property::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'body' => ['required', 'string'],
            'property_id' => ['nullable', 'integer', 'exists:properties,id'],
            'pinned' => ['sometimes', 'boolean'],
        ]);

        Announcement::create([
            'title' => trim($data['title']),
            'body' => trim($data['body']),
            'property_id' => $data['property_id'] ?? null,
            'pinned' => $request->boolean('pinned'),
            'author' => $request->user()->name,
        ]);

        return back()->with('status', 'Pengumuman berhasil diterbitkan.');
    }

    public function update(Request $request, Announcement $announcement): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'body' => ['required', 'string'],
            'property_id' => ['nullable', 'integer', 'exists:properties,id'],
        ]);

        $announcement->update([
            'title' => trim($data['title']),
            'body' => trim($data['body']),
            'property_id' => $data['property_id'] ?? null,
        ]);

        return back()->with('status', 'Pengumuman berhasil diperbarui.');
    }

    public function destroy(Announcement $announcement): RedirectResponse
    {
        $announcement->delete();

        return back()->with('status', 'Pengumuman berhasil dihapus.');
    }

    public function pin(Announcement $announcement): RedirectResponse
    {
        $announcement->update(['pinned' => ! $announcement->pinned]);

        return back()->with('status', $announcement->pinned ? 'Pengumuman disematkan.' : 'Sematkan pengumuman dilepas.');
    }
}
