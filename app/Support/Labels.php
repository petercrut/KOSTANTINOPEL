<?php

namespace App\Support;

class Labels
{
    public const PROPERTY_TYPES = [
        'kost' => 'Kost',
        'kontrakan' => 'Kontrakan',
        'apartemen' => 'Apartemen',
        'hotel' => 'Hotel',
    ];

    public const ROOM_STATUSES = [
        'available' => 'Tersedia',
        'occupied' => 'Terisi',
        'maintenance' => 'Perawatan',
    ];

    public const TENANT_STATUSES = [
        'active' => 'Aktif',
        'inactive' => 'Selesai',
    ];

    public const BOOKING_STATUSES = [
        'pending' => 'Menunggu',
        'confirmed' => 'Terkonfirmasi',
        'checkin' => 'Check-in',
        'checkedout' => 'Check-out',
        'cancelled' => 'Dibatalkan',
    ];

    public const INVOICE_STATUSES = [
        'unpaid' => 'Belum Bayar',
        'late' => 'Terlambat',
        'paid' => 'Lunas',
    ];

    public const RENT_TYPES = [
        'harian' => 'Harian',
        'mingguan' => 'Mingguan',
        'bulanan' => 'Bulanan',
    ];

    public const PAYMENT_METHODS = [
        'Tunai' => 'Tunai',
        'Transfer' => 'Transfer Bank',
        'QRIS' => 'QRIS',
        'Kartu Debit' => 'Kartu Debit',
    ];

    public const ROLES = [
        'admin' => 'Admin / Pemilik',
        'tenant' => 'Penyewa',
    ];

    public const REQUEST_CATEGORIES = [
        'perbaikan' => 'Perbaikan',
        'kebersihan' => 'Kebersihan',
        'keamanan' => 'Keamanan',
        'keluhan' => 'Keluhan',
        'lainnya' => 'Lainnya',
    ];

    public const REQUEST_STATUSES = [
        'open' => 'Baru',
        'in_progress' => 'Diproses',
        'done' => 'Selesai',
        'rejected' => 'Ditolak',
    ];

    public const REQUEST_PRIORITIES = [
        'low' => 'Rendah',
        'normal' => 'Normal',
        'high' => 'Tinggi',
    ];

    public const GENDERS = [
        'Laki-laki' => 'Laki-laki',
        'Perempuan' => 'Perempuan',
    ];

    /** @return array<int, string> */
    public static function values(string $group): array
    {
        return array_values(self::map($group));
    }

    /** @return array<string, string> */
    public static function map(string $group): array
    {
        return match ($group) {
            'propertyType' => self::PROPERTY_TYPES,
            'roomStatus' => self::ROOM_STATUSES,
            'tenantStatus' => self::TENANT_STATUSES,
            'bookingStatus' => self::BOOKING_STATUSES,
            'invoiceStatus' => self::INVOICE_STATUSES,
            'rentType' => self::RENT_TYPES,
            'method' => self::PAYMENT_METHODS,
            'role' => self::ROLES,
            'requestCategory' => self::REQUEST_CATEGORIES,
            'requestStatus' => self::REQUEST_STATUSES,
            'requestPriority' => self::REQUEST_PRIORITIES,
            'gender' => self::GENDERS,
            default => [],
        };
    }

    public static function label(string $group, ?string $key): string
    {
        if ($key === null || $key === '') {
            return '-';
        }

        return self::map($group)[$key] ?? ucfirst($key);
    }
}
