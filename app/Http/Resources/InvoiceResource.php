<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'code' => $this->code,
            'bookingId' => $this->booking_id ? (string) $this->booking_id : null,
            'tenantId' => $this->tenant_id ? (string) $this->tenant_id : null,
            'propertyId' => $this->property_id ? (string) $this->property_id : null,
            'roomId' => $this->room_id ? (string) $this->room_id : null,
            'description' => $this->description,
            'amount' => (int) $this->amount,
            'dueDate' => $this->due_date?->format('Y-m-d'),
            'status' => $this->status,
            'effectiveStatus' => $this->effectiveStatus(),
            'paidAt' => $this->paid_at?->format('Y-m-d'),
            'method' => $this->method,
            'paidVia' => $this->paid_via,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
