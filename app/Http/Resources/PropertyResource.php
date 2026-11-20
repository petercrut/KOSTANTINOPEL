<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'address' => (string) $this->address,
            'phone' => (string) $this->phone,
            'notes' => (string) $this->notes,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
