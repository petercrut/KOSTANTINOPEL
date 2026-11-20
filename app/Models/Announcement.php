<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Announcement extends Model
{
    protected $fillable = ['title', 'body', 'property_id', 'pinned', 'author'];

    protected function casts(): array
    {
        return [
            'pinned' => 'boolean',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function scopeVisibleTo($query, ?int $propertyId)
    {
        return $query->where(function ($q) use ($propertyId) {
            $q->whereNull('property_id');

            if ($propertyId) {
                $q->orWhere('property_id', $propertyId);
            }
        });
    }

    public function scopeOrdered($query)
    {
        return $query->orderByDesc('pinned')->orderByDesc('created_at');
    }
}
