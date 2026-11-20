<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'phone' => (string) $this->phone,
            'idNumber' => (string) $this->id_number,
            'email' => (string) $this->email,
            'address' => (string) $this->address,
            'birthDate' => $this->birth_date?->format('Y-m-d'),
            'gender' => (string) $this->gender,
            'occupation' => (string) $this->occupation,
            'emergencyName' => (string) $this->emergency_name,
            'emergencyPhone' => (string) $this->emergency_phone,
            'propertyId' => (string) $this->property_id,
            'roomId' => (string) $this->room_id,
            'startDate' => $this->start_date?->format('Y-m-d'),
            'endDate' => $this->end_date?->format('Y-m-d'),
            'status' => $this->status,
            'note' => (string) $this->note,
            'loginAccount' => $this->relationLoaded('user') && $this->user
                ? new TenantAccountResource($this->user)
                : null,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
