<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'code' => $this->code,
            'tenantId' => $this->tenant_id ? (string) $this->tenant_id : null,
            'guestName' => $this->guest_name,
            'guestPhone' => (string) $this->guest_phone,
            'propertyId' => (string) $this->property_id,
            'roomId' => (string) $this->room_id,
            'checkIn' => $this->check_in?->format('Y-m-d'),
            'checkOut' => $this->check_out?->format('Y-m-d'),
            'rentType' => $this->rent_type,
            'days' => (int) $this->days,
            'units' => (int) $this->units,
            'unitLabel' => $this->unit_label,
            'total' => (int) $this->total,
            'status' => $this->status,
            'notes' => (string) $this->notes,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
