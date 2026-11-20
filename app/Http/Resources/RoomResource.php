<?php

namespace App\Http\Resources;

use App\Services\OccupancyService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'propertyId' => (string) $this->property_id,
            'number' => $this->number,
            'type' => $this->type,
            'capacity' => (int) $this->capacity,
            'priceDaily' => (int) $this->price_daily,
            'priceMonthly' => (int) $this->price_monthly,
            'facilities' => $this->facilities ?? [],
            'status' => $this->status,
            'effectiveStatus' => app(OccupancyService::class)->effectiveStatus($this->resource),
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
