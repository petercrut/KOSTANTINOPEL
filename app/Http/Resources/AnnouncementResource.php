<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnnouncementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'title' => $this->title,
            'body' => $this->body,
            'propertyId' => $this->property_id ? (string) $this->property_id : null,
            'pinned' => (bool) $this->pinned,
            'author' => $this->author,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
