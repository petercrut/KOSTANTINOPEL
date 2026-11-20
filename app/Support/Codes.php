<?php

namespace App\Support;

class Codes
{
    /**
     * Hasilkan kode berurutan berikutnya, mis. INV-0016.
     *
     * @param  class-string<\Illuminate\Database\Eloquent\Model>  $modelClass
     */
    public static function next(string $modelClass, string $prefix, int $pad = 4): string
    {
        $last = $modelClass::query()
            ->whereNotNull('code')
            ->orderByDesc('id')
            ->value('code');

        $number = $last ? (int) substr($last, strlen($prefix)) : 0;

        return $prefix . str_pad((string) ($number + 1), $pad, '0', STR_PAD_LEFT);
    }
}
