<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\Room;
use App\Support\Codes;
use Illuminate\Support\Facades\DB;

class BookingService
{
    public function __construct(
        private readonly OccupancyService $occupancy,
        private readonly InvoiceService $invoices,
    ) {}

    /**
     * Hitung satuan sewa dan total biaya booking.
     *
     * @return array{days: int, units: int, label: string, amount: int}
     */
    public function quote(Room $room, string $checkIn, string $checkOut, string $rentType): array
    {
        $days = max(1, (int) round(abs(strtotime($checkOut) - strtotime($checkIn)) / 86400));

        if ($rentType === 'mingguan') {
            $units = max(1, (int) ceil($days / 7));

            return ['days' => $days, 'units' => $units, 'label' => 'minggu', 'amount' => (int) round($units * $room->price_daily * 7 * 0.9)];
        }

        if ($rentType === 'bulanan') {
            $units = max(1, (int) ceil($days / 30));

            return ['days' => $days, 'units' => $units, 'label' => 'bulan', 'amount' => $units * $room->price_monthly];
        }

        return ['days' => $days, 'units' => $days, 'label' => 'malam', 'amount' => $days * $room->price_daily];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Booking
    {
        $room = Room::find($data['room_id'] ?? null);

        if (! $room) {
            throw new BusinessRuleException('Kamar tidak ditemukan', 404, 'NOT_FOUND');
        }

        $checkIn = $data['check_in'] ?? null;
        $checkOut = $data['check_out'] ?? null;

        if (! $checkIn || ! $checkOut || $checkOut <= $checkIn) {
            throw new BusinessRuleException('Periode tanggal tidak valid', 422, 'VALIDATION_ERROR');
        }

        if (empty(trim((string) ($data['guest_name'] ?? '')))) {
            throw new BusinessRuleException('Nama tamu wajib diisi', 422, 'VALIDATION_ERROR');
        }

        if (! $this->occupancy->isAvailable($room->id, $checkIn, $checkOut)) {
            throw new BusinessRuleException('Kamar tidak tersedia pada periode tersebut');
        }

        $rentType = $data['rent_type'] ?? 'harian';
        $quote = $this->quote($room, $checkIn, $checkOut, $rentType);

        return DB::transaction(function () use ($data, $room, $checkIn, $checkOut, $rentType, $quote) {
            $booking = Booking::create([
                'code' => Codes::next(Booking::class, 'BK-'),
                'tenant_id' => $data['tenant_id'] ?? null,
                'guest_name' => trim((string) $data['guest_name']),
                'guest_phone' => $data['guest_phone'] ?? '',
                'property_id' => $room->property_id,
                'room_id' => $room->id,
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'rent_type' => $rentType,
                'days' => $quote['days'],
                'units' => $quote['units'],
                'unit_label' => $quote['label'],
                'total' => $quote['amount'],
                'status' => 'pending',
                'notes' => $data['notes'] ?? '',
            ]);

            $this->invoices->createForBooking($booking, $quote, $room);

            return $booking->fresh(['room.property', 'invoices']);
        });
    }

    public function isAvailableFor(Booking $booking, string $from, string $to): bool
    {
        return $this->occupancy->isAvailable($booking->room_id, $from, $to, $booking->id);
    }

    public function transition(Booking $booking, string $status): Booking
    {        if (! $booking->canTransitionTo($status)) {
            throw new BusinessRuleException('Status booking tidak dapat diubah');
        }

        if ($status === 'confirmed' && ! $this->occupancy->isAvailable(
            $booking->room_id,
            $booking->check_in->toDateString(),
            $booking->check_out->toDateString(),
            $booking->id,
        )) {
            throw new BusinessRuleException('Kamar sudah dipesan pada periode tersebut');
        }

        $booking->update(['status' => $status]);

        return $booking->fresh(['room.property', 'invoices']);
    }

    public function delete(Booking $booking): void
    {
        $hasPaid = $booking->invoices()->where('status', 'paid')->exists();

        if ($hasPaid) {
            throw new BusinessRuleException('Booking memiliki tagihan lunas dan tidak dapat dihapus');
        }

        DB::transaction(function () use ($booking) {
            Invoice::where('booking_id', $booking->id)->delete();
            $booking->delete();
        });
    }

    /**
     * Ringkasan pendapatan booking pada bulan berjalan.
     *
     * @return array{bookings: int, revenue: int, pending: int}
     */
    public function summary(): array
    {
        $bookings = Booking::query()->whereIn('status', Booking::OCCUPYING_STATUSES);

        return [
            'bookings' => (clone $bookings)->count(),
            'revenue' => (int) Booking::query()
                ->where('status', '!=', 'cancelled')
                ->whereYear('check_in', now()->year)
                ->whereMonth('check_in', now()->month)
                ->sum('total'),
            'pending' => Booking::where('status', 'pending')->count(),
        ];
    }
}
