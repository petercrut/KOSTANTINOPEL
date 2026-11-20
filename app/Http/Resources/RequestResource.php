<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $respondedAt = null;

        if (trim((string) $this->response) !== '' && $this->updated_at) {
            $respondedAt = $this->updated_at->toIso8601String();
        }

        return [
            'id' => (string) $this->id,
            'code' => $this->code,
            'tenantId' => (string) $this->tenant_id,
            'propertyId' => (string) $this->property_id,
            'roomId' => (string) $this->room_id,
            'category' => $this->category,
            'priority' => $this->priority,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'response' => (string) $this->response,
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
            'respondedAt' => $respondedAt,
            'resolvedAt' => $this->resolved_at?->format('Y-m-d'),
        ];
    }
}
