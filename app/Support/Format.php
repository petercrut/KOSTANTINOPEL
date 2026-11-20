<?php

namespace App\Support;

use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;

class Format
{
    public const MONTHS_SHORT = [
        1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr', 5 => 'Mei', 6 => 'Jun',
        7 => 'Jul', 8 => 'Agu', 9 => 'Sep', 10 => 'Okt', 11 => 'Nov', 12 => 'Des',
    ];

    public const MONTHS_LONG = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni',
        7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
    ];

    public static function rupiah(int|float|null $value): string
    {
        return 'Rp ' . number_format((int) $value, 0, ',', '.');
    }

    public static function date(?string $iso): string
    {
        if (! $iso) {
            return '-';
        }

        return Carbon::parse($iso)->format('d/m/Y');
    }

    public static function dateLong(CarbonInterface|string|null $value): string
    {
        if (! $value) {
            return '-';
        }

        $date = $value instanceof CarbonInterface ? $value : Carbon::parse($value);

        return $date->day . ' ' . self::MONTHS_LONG[$date->month] . ' ' . $date->year;
    }

    public static function monthLabel(string|CarbonInterface|null $value): string
    {
        if (! $value) {
            return '-';
        }

        $date = $value instanceof CarbonInterface ? $value : Carbon::parse($value);

        return self::MONTHS_LONG[$date->month] . ' ' . $date->year;
    }

    public static function monthShort(int $month): string
    {
        return self::MONTHS_SHORT[$month] ?? '';
    }

    public static function daysBetween(string $from, string $to): int
    {
        return max(1, (int) round(abs(strtotime($to) - strtotime($from)) / 86400));
    }
}
