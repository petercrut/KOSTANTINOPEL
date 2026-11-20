<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    protected $fillable = [
        'code', 'booking_id', 'tenant_id', 'property_id', 'room_id',
        'description', 'amount', 'due_date', 'status', 'paid_at', 'method', 'paid_via',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date:Y-m-d',
            'paid_at' => 'date:Y-m-d',
            'amount' => 'integer',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Status efektif: tagihan yang belum dibayar dan lewat jatuh tempo dianggap "late".
     */
    public function effectiveStatus(): string
    {
        if ($this->status === 'paid') {
            return 'paid';
        }

        if ($this->due_date && $this->due_date->toDateString() < now()->toDateString()) {
            return 'late';
        }

        return 'unpaid';
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }
}
