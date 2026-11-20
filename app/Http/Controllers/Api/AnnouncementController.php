<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\AnnouncementResource;
use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Announcement::query()->with('property');

        if ($request->filled('pinned')) {
            $query->where('pinned', filter_var($request->query('pinned'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('propertyId')) {
            $query->visibleTo((int) $request->query('propertyId'));
        }

        $this->applySearch($query, $request, ['title', 'body', 'author']);
        $this->applySort($query, $request, [
            'title' => 'title',
            'createdAt' => 'created_at',
        ], '-created_at');

        return $this->paginated($this->paginate($query, $request), AnnouncementResource::class);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatePayload($request);

        $announcement = Announcement::create([
            'title' => trim($data['title']),
            'body' => trim($data['body']),
            'property_id' => $data['propertyId'] ?? null,
            'pinned' => (bool) ($data['pinned'] ?? false),
            'author' => $data['author'] ?? 'Admin',
        ]);

        return $this->respond(new AnnouncementResource($announcement), 201);
    }

    public function show(Announcement $announcement): JsonResponse
    {
        return $this->respond(new AnnouncementResource($announcement));
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $data = $this->validatePayload($request, true);

        $announcement->update([
            'title' => $data['title'] ?? $announcement->title,
            'body' => $data['body'] ?? $announcement->body,
            'property_id' => array_key_exists('propertyId', $data)
                ? $data['propertyId']
                : $announcement->property_id,
            'pinned' => array_key_exists('pinned', $data)
                ? (bool) $data['pinned']
                : $announcement->pinned,
        ]);

        return $this->respond(new AnnouncementResource($announcement->fresh()));
    }

    public function destroy(Announcement $announcement): JsonResponse
    {
        $announcement->delete();

        return response()->json(null, 204);
    }

    public function pin(Request $request, Announcement $announcement): JsonResponse
    {
        $data = $request->validate([
            'pinned' => ['required', 'boolean'],
        ]);

        $announcement->update(['pinned' => $data['pinned']]);

        return $this->respond(new AnnouncementResource($announcement->fresh()));
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'title' => [$required, 'string', 'max:150'],
            'body' => [$required, 'string'],
            'propertyId' => ['sometimes', 'nullable', 'integer', 'exists:properties,id'],
            'pinned' => ['sometimes', 'boolean'],
            'author' => ['sometimes', 'string', 'max:120'],
        ]);
    }
}
