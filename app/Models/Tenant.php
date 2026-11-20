<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Tenant extends Model
{
    protected $fillable = [
        'name', 'phone', 'id_number', 'email', 'address', 'birth_date', 'gender',
        'occupation', 'emergency_name', 'emergency_phone',
        'property_id', 'room_id', 'start_date', 'end_date', 'status', 'note',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date:Y-m-d',
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
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

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function requests(): HasMany
    {
        return $this->hasMany(MaintenanceRequest::class);
    }

    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }

    public function isActive(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        return ! $this->end_date || $this->end_date->toDateString() >= now()->toDateString();
    }

    public function inPeriod(string $from, string $to): bool
    {
        if (! $this->isActive()) {
            return false;
        }

        $end = $this->end_date?->toDateString() ?? '9999-12-31';

        return $this->start_date->toDateString() <= $to && $end >= $from;
    }
}
