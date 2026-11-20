<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    protected $fillable = [
        'property_id', 'number', 'type', 'capacity',
        'price_daily', 'price_monthly', 'facilities', 'status',
    ];

    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
            'price_daily' => 'integer',
            'price_monthly' => 'integer',
            'facilities' => 'array',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function tenants(): HasMany
    {
        return $this->hasMany(Tenant::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function requests(): HasMany
    {
        return $this->hasMany(MaintenanceRequest::class);
    }

    public function activeTenant(): ?Tenant
    {
        return $this->tenants()
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('end_date')->orWhereDate('end_date', '>=', now()->toDateString());
            })
            ->first();
    }

    public function label(): string
    {
        return ($this->property?->name ?? 'Properti') . ' · ' . $this->number;
    }
}
