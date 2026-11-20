<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\Room;
use App\Models\Tenant;
use App\Support\Codes;
use App\Support\Format;

class InvoiceService
{
    /**
     * Tagihan otomatis untuk booking baru.
     *
     * @param  array{days: int, units: int, label: string, amount: int}  $quote
     */
    public function createForBooking(Booking $booking, array $quote, Room $room): Invoice
    {
        return Invoice::create([
            'code' => Codes::next(Invoice::class, 'INV-'),
            'booking_id' => $booking->id,
            'tenant_id' => null,
            'property_id' => $room->property_id,
            'room_id' => $room->id,
            'description' => 'Booking ' . $booking->code . ' — Kamar ' . $room->number
                . ' (' . $quote['units'] . ' ' . $quote['label'] . ')',
            'amount' => $quote['amount'],
            'due_date' => $booking->rent_type === 'bulanan'
                ? $booking->check_in->toDateString()
                : $booking->check_out->toDateString(),
            'status' => 'unpaid',
            'paid_at' => null,
            'method' => null,
        ]);
    }

    /**
     * Tagihan sewa bulan pertama untuk penyewa baru.
     */
    public function createForTenant(Tenant $tenant, Room $room, ?int $amount = null): Invoice
    {
        return Invoice::create([
            'code' => Codes::next(Invoice::class, 'INV-'),
            'booking_id' => null,
            'tenant_id' => $tenant->id,
            'property_id' => $room->property_id,
            'room_id' => $room->id,
            'description' => 'Sewa kamar ' . $room->number . ' — '
                . Format::monthLabel($tenant->start_date),
            'amount' => $amount ?: $room->price_monthly,
            'due_date' => $tenant->start_date->copy()->addDays(5)->toDateString(),
            'status' => 'unpaid',
            'paid_at' => null,
            'method' => null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Invoice
    {
        $room = ! empty($data['room_id']) ? Room::find($data['room_id']) : null;

        return Invoice::create([
            'code' => Codes::next(Invoice::class, 'INV-'),
            'booking_id' => $data['booking_id'] ?? null,
            'tenant_id' => $data['tenant_id'] ?? null,
            'property_id' => $data['property_id'] ?? $room?->property_id,
            'room_id' => $data['room_id'] ?? $room?->id,
            'description' => $data['description'] ?? 'Tagihan',
            'amount' => (int) ($data['amount'] ?? 0),
            'due_date' => $data['due_date'] ?? now()->toDateString(),
            'status' => 'unpaid',
            'paid_at' => null,
            'method' => null,
        ]);
    }

    public function pay(Invoice $invoice, ?string $method = null, ?string $paidAt = null, string $via = 'admin'): Invoice
    {
        if ($invoice->isPaid()) {
            throw new BusinessRuleException('Tagihan sudah lunas');
        }

        $invoice->update([
            'status' => 'paid',
            'method' => $method ?: 'Tunai',
            'paid_at' => $paidAt ?: now()->toDateString(),
            'paid_via' => $via,
        ]);

        return $invoice->fresh(['tenant', 'room.property', 'booking']);
    }

    /**
     * @return array{paidTotal: int, unpaidTotal: int, lateTotal: int, paidThisMonth: int}
     */
    public function totals(): array
    {
        $paidTotal = 0;
        $unpaidTotal = 0;
        $lateTotal = 0;
        $paidThisMonth = 0;
        $monthKey = now()->format('Y-m');

        foreach (Invoice::all() as $invoice) {
            $status = $invoice->effectiveStatus();
            $amount = (int) $invoice->amount;

            if ($status === 'paid') {
                $paidTotal += $amount;
                if ($invoice->paid_at && $invoice->paid_at->format('Y-m') === $monthKey) {
                    $paidThisMonth += $amount;
                }
            } else {
                $unpaidTotal += $amount;
                if ($status === 'late') {
                    $lateTotal += $amount;
                }
            }
        }

        return [
            'paidTotal' => $paidTotal,
            'unpaidTotal' => $unpaidTotal,
            'lateTotal' => $lateTotal,
            'paidThisMonth' => $paidThisMonth,
        ];
    }
}
