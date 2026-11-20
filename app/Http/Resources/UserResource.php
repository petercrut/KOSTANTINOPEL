<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'tenantId' => $this->tenant_id ? (string) $this->tenant_id : null,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
