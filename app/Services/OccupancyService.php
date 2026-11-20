<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Property;
use App\Models\Room;
use App\Models\Tenant;

class OccupancyService
{
    /**
     * Status efektif kamar: perawatan lebih dulu, lalu hunian penyewa/booking aktif.
     */
    public function effectiveStatus(Room $room, ?string $today = null): string
    {
        if ($room->status === 'maintenance') {
            return 'maintenance';
        }

        $today ??= now()->toDateString();

        $hasTenant = Tenant::query()
            ->where('room_id', $room->id)
            ->where('status', 'active')
            ->whereDate('start_date', '<=', $today)
            ->where(function ($query) use ($today) {
                $query->whereNull('end_date')->orWhereDate('end_date', '>=', $today);
            })
            ->exists();

        if ($hasTenant) {
            return 'occupied';
        }

        $hasBooking = Booking::query()
            ->where('room_id', $room->id)
            ->whereIn('status', Booking::OCCUPYING_STATUSES)
            ->whereDate('check_in', '<=', $today)
            ->whereDate('check_out', '>=', $today)
            ->exists();

        return $hasBooking ? 'occupied' : 'available';
    }

    /**
     * Cek ketersediaan kamar pada rentang tanggal, mengabaikan booking tertentu.
     */
    public function isAvailable(int $roomId, string $from, string $to, ?int $excludeBookingId = null): bool
    {
        $room = Room::find($roomId);

        if (! $room || $room->status === 'maintenance') {
            return false;
        }

        $clashTenant = Tenant::query()
            ->where('room_id', $roomId)
            ->where('status', 'active')
            ->whereDate('start_date', '<=', $to)
            ->where(function ($query) use ($from) {
                $query->whereNull('end_date')->orWhereDate('end_date', '>=', $from);
            })
            ->exists();

        if ($clashTenant) {
            return false;
        }

        return ! Booking::query()
            ->where('room_id', $roomId)
            ->whereIn('status', Booking::OCCUPYING_STATUSES)
            ->when($excludeBookingId, fn ($query) => $query->whereKeyNot($excludeBookingId))
            ->whereDate('check_in', '<=', $to)
            ->whereDate('check_out', '>=', $from)
            ->exists();
    }

    /**
     * @return array<string, mixed>
     */
    public function stats(): array
    {
        $rooms = Room::with('property')->get();
        $counts = ['available' => 0, 'occupied' => 0, 'maintenance' => 0];

        foreach ($rooms as $room) {
            $counts[$this->effectiveStatus($room)]++;
        }

        return [
            'properties' => Property::count(),
            'rooms' => $rooms->count(),
            'available' => $counts['available'],
            'occupied' => $counts['occupied'],
            'maintenance' => $counts['maintenance'],
            'occupancyRate' => $rooms->count() > 0
                ? round(($counts['occupied'] / $rooms->count()) * 100, 1)
                : 0.0,
            'tenants' => Tenant::query()
                ->where('status', 'active')
                ->where(function ($query) {
                    $query->whereNull('end_date')->orWhereDate('end_date', '>=', now()->toDateString());
                })
                ->count(),
        ];
    }
}
