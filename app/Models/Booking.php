<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Booking extends Model
{
    public const OCCUPYING_STATUSES = ['pending', 'confirmed', 'checkin'];

    public const TRANSITIONS = [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['checkin', 'cancelled'],
        'checkin' => ['checkedout'],
        'checkedout' => [],
        'cancelled' => [],
    ];

    protected $fillable = [
        'code', 'tenant_id', 'guest_name', 'guest_phone', 'property_id', 'room_id',
        'check_in', 'check_out', 'rent_type', 'days', 'units', 'unit_label',
        'total', 'status', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'check_in' => 'date:Y-m-d',
            'check_out' => 'date:Y-m-d',
            'days' => 'integer',
            'units' => 'integer',
            'total' => 'integer',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function isOccupying(): bool
    {
        return in_array($this->status, self::OCCUPYING_STATUSES, true);
    }

    public function canTransitionTo(string $status): bool
    {
        return in_array($status, self::TRANSITIONS[$this->status] ?? [], true);
    }
}
