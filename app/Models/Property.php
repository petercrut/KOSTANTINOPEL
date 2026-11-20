<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Property extends Model
{
    protected $fillable = ['name', 'type', 'address', 'phone', 'notes'];

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }

    public function tenants(): HasMany
    {
        return $this->hasMany(Tenant::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class);
    }
}
