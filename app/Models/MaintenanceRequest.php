<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceRequest extends Model
{
    protected $table = 'requests';

    protected $fillable = [
        'code', 'tenant_id', 'property_id', 'room_id', 'category', 'priority',
        'title', 'description', 'status', 'response', 'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'resolved_at' => 'date:Y-m-d',
        ];
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
}
