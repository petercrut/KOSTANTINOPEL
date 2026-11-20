<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\MaintenanceRequest;
use App\Models\Property;
use App\Models\Room;
use App\Models\Tenant;
use App\Models\User;
use App\Services\BookingService;
use App\Support\Format;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $today = Carbon::today();
        $currentMonth = $today->copy()->startOfMonth();

        User::updateOrCreate(
            ['email' => 'admin@kostantinopel.id'],
            [
                'name' => 'Admin Kostantinopel',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'tenant_id' => null,
            ],
        );

        $kost = Property::updateOrCreate(
            ['name' => 'Kostantinopel Kost Putri'],
            [
                'type' => 'kost',
                'address' => 'Jl. Anggrek No. 12, Bandung',
                'phone' => '0812-3456-7890',
                'notes' => 'Kost khusus putri, 2 lantai.',
            ],
        );

        $hotel = Property::updateOrCreate(
            ['name' => 'Hotel Kolonia'],
            [
                'type' => 'hotel',
                'address' => 'Jl. Kenanga No. 5, Jakarta',
                'phone' => '021-555-0199',
                'notes' => 'Hotel butik, 3 lantai.',
            ],
        );

        $rooms = [
            ['K-101', 'Single', 1, 50000, 850000, ['WiFi', 'AC', 'Kamar Mandi Dalam', 'Lemari']],
            ['K-102', 'Double', 2, 80000, 1200000, ['WiFi', 'AC', 'Kamar Mandi Dalam', 'Balkon']],
            ['K-103', 'Single', 1, 50000, 850000, ['WiFi', 'AC', 'Kamar Mandi Dalam']],
            ['K-104', 'Double', 2, 80000, 1200000, ['WiFi', 'AC', 'Kamar Mandi Dalam', 'TV']],
            ['K-105', 'Single', 1, 50000, 850000, ['WiFi', 'AC', 'Kamar Mandi Dalam', 'Meja Kerja']],
            ['K-106', 'Single', 1, 45000, 800000, ['WiFi', 'Kamar Mandi Dalam']],
            ['H-201', 'Superior', 2, 350000, 9000000, ['WiFi', 'AC', 'TV', 'Breakfast', 'Kamar Mandi Dalam']],
            ['H-202', 'Superior', 2, 350000, 9000000, ['WiFi', 'AC', 'TV', 'Breakfast', 'Kamar Mandi Dalam']],
            ['H-203', 'Deluxe', 2, 450000, 11000000, ['WiFi', 'AC', 'TV', 'Breakfast', 'Balkon', 'Kamar Mandi Dalam']],
            ['H-204', 'Deluxe', 2, 450000, 11000000, ['WiFi', 'AC', 'TV', 'Breakfast', 'Balkon', 'Kamar Mandi Dalam']],
            ['H-205', 'Suite', 4, 750000, 18000000, ['WiFi', 'AC', 'TV', 'Breakfast', 'Living Room', 'Kamar Mandi Dalam']],
            ['H-206', 'Suite', 4, 750000, 18000000, ['WiFi', 'AC', 'TV', 'Breakfast', 'Living Room', 'Kamar Mandi Dalam']],
        ];

        foreach ($rooms as [$number, $type, $capacity, $daily, $monthly, $facilities]) {
            Room::updateOrCreate(
                ['number' => $number],
                [
                    'property_id' => str_starts_with($number, 'K-') ? $kost->id : $hotel->id,
                    'type' => $type,
                    'capacity' => $capacity,
                    'price_daily' => $daily,
                    'price_monthly' => $monthly,
                    'facilities' => $facilities,
                    'status' => 'available',
                ],
            );
        }

        $room = fn (string $number) => Room::where('number', $number)->firstOrFail();

        $tenantData = [
            ['Siti Rahma', '0811-1000-0001', '3273012345670001', 'K-101', 92, [
                'email' => 'siti@kostantinopel.id',
                'address' => 'Jl. Anggrek No. 12, Bandung',
                'birth_date' => '1998-04-12',
                'gender' => 'Perempuan',
                'occupation' => 'Desainer Grafis',
                'emergency_name' => 'Rahmat Hidayat',
                'emergency_phone' => '0812-9000-1111',
            ]],
            ['Dewi Lestari', '0811-1000-0002', '3273012345670002', 'K-102', 45, [
                'email' => 'dewi@kostantinopel.id',
                'address' => 'Jl. Melati No. 3, Bandung',
                'birth_date' => '1995-09-21',
                'gender' => 'Perempuan',
                'occupation' => 'Guru',
            ]],
            ['Budi Santoso', '0811-1000-0003', '3273012345670003', 'K-104', 76, [
                'email' => 'budi@kostantinopel.id',
                'gender' => 'Laki-laki',
                'occupation' => 'Karyawan Swasta',
            ]],
            ['Rina Marlina', '0811-1000-0004', '3273012345670004', 'K-105', 2, [
                'email' => 'rina@kostantinopel.id',
                'gender' => 'Perempuan',
                'occupation' => 'Mahasiswa',
            ]],
        ];

        $paidConfig = [
            'siti@kostantinopel.id' => 'currentUnpaid',
            'dewi@kostantinopel.id' => 'paid',
            'budi@kostantinopel.id' => 'currentUnpaid',
            'rina@kostantinopel.id' => 'currentUnpaid',
        ];

        foreach ($tenantData as [$name, $phone, $idNumber, $roomNumber, $daysAgo, $extra]) {
            $roomRecord = $room($roomNumber);
            $startDate = $today->copy()->subDays($daysAgo);

            $tenant = Tenant::updateOrCreate(
                ['email' => $extra['email']],
                array_merge([
                    'name' => $name,
                    'phone' => $phone,
                    'id_number' => $idNumber,
                    'address' => '',
                    'birth_date' => null,
                    'gender' => '',
                    'occupation' => '',
                    'emergency_name' => '',
                    'emergency_phone' => '',
                    'property_id' => $roomRecord->property_id,
                    'room_id' => $roomRecord->id,
                    'start_date' => $startDate->toDateString(),
                    'end_date' => null,
                    'status' => 'active',
                    'note' => '',
                ], $extra),
            );

            $mode = $paidConfig[$extra['email']] ?? 'currentUnpaid';
            $cursor = $startDate->copy()->startOfMonth();
            $index = 0;

            while ($cursor->lte($currentMonth)) {
                $dueDate = $index === 0 ? $startDate->copy()->addDays(5) : $cursor->copy()->day(5);
                $paid = $mode === 'paid' || $cursor->lt($currentMonth);

                Invoice::create([
                    'code' => 'TMP-' . uniqid(),
                    'booking_id' => null,
                    'tenant_id' => $tenant->id,
                    'property_id' => $roomRecord->property_id,
                    'room_id' => $roomRecord->id,
                    'description' => 'Sewa kamar ' . $roomRecord->number . ' — ' . Format::monthLabel($cursor),
                    'amount' => $roomRecord->price_monthly,
                    'due_date' => $dueDate->toDateString(),
                    'status' => $paid ? 'paid' : 'unpaid',
                    'paid_at' => $paid ? $dueDate->copy()->addDay()->toDateString() : null,
                    'method' => $paid ? 'Transfer' : null,
                ]);

                $cursor->addMonthNoOverflow();
                $index++;
            }
        }

        $siti = Tenant::where('email', 'siti@kostantinopel.id')->firstOrFail();

        User::updateOrCreate(
            ['email' => 'siti@kostantinopel.id'],
            [
                'name' => $siti->name,
                'password' => Hash::make('siti123'),
                'role' => 'tenant',
                'tenant_id' => $siti->id,
            ],
        );

        $bookingService = app(BookingService::class);

        $bookingSeed = [
            ['Andi Wijaya', '0813-2000-0011', 'H-201', -4, -2, 'checkedout', true],
            ['Sari Nurhaliza', '0813-2000-0022', 'H-203', 0, 2, 'checkin', false],
            ['Bambang Wibowo', '0813-2000-0033', 'H-205', 3, 5, 'pending', false],
        ];

        foreach ($bookingSeed as [$guest, $phone, $roomNumber, $inDays, $outDays, $status, $paid]) {
            $roomRecord = $room($roomNumber);
            $checkIn = $today->copy()->addDays($inDays);
            $checkOut = $today->copy()->addDays($outDays);
            $quote = $bookingService->quote($roomRecord, $checkIn->toDateString(), $checkOut->toDateString(), 'harian');

            $booking = Booking::create([
                'code' => 'TMP-' . uniqid(),
                'tenant_id' => null,
                'guest_name' => $guest,
                'guest_phone' => $phone,
                'property_id' => $roomRecord->property_id,
                'room_id' => $roomRecord->id,
                'check_in' => $checkIn->toDateString(),
                'check_out' => $checkOut->toDateString(),
                'rent_type' => 'harian',
                'days' => $quote['days'],
                'units' => $quote['units'],
                'unit_label' => $quote['label'],
                'total' => $quote['amount'],
                'status' => $status,
                'notes' => '',
            ]);

            Invoice::create([
                'code' => 'TMP-' . uniqid(),
                'booking_id' => $booking->id,
                'tenant_id' => null,
                'property_id' => $roomRecord->property_id,
                'room_id' => $roomRecord->id,
                'description' => 'Booking ' . $booking->code . ' — Kamar ' . $roomRecord->number
                    . ' (' . $quote['units'] . ' ' . $quote['label'] . ')',
                'amount' => $quote['amount'],
                'due_date' => $checkOut->toDateString(),
                'status' => $paid ? 'paid' : 'unpaid',
                'paid_at' => $paid ? $checkOut->toDateString() : null,
                'method' => $paid ? 'Transfer' : null,
            ]);
        }

        foreach (Invoice::orderBy('id')->get() as $index => $invoice) {
            $invoice->update(['code' => 'INV-' . str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT)]);
        }

        foreach (Booking::orderBy('id')->get() as $index => $booking) {
            $code = 'BK-' . str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT);
            $booking->update(['code' => $code]);
            Invoice::where('booking_id', $booking->id)
                ->where('description', 'like', 'Booking TMP-%')
                ->update(['description' => 'Booking ' . $code . ' — Kamar ' . $booking->room->number
                    . ' (' . $booking->units . ' ' . $booking->unit_label . ')']);
        }

        Announcement::updateOrCreate(
            ['title' => 'Pemeliharaan Air Lantai 2'],
            [
                'pinned' => true,
                'body' => 'Pemeliharaan pompa air akan dilakukan Sabtu ini pukul 09.00–12.00. Air mungkin mati sementara. Mohon siapkan cadangan air untuk kebutuhan mendesak.',
                'property_id' => $kost->id,
                'author' => 'Admin Kostantinopel',
                'created_at' => now()->subDay(),
            ],
        );

        Announcement::updateOrCreate(
            ['title' => 'Aturan Tamu Menginap'],
            [
                'pinned' => false,
                'body' => 'Tamu yang menginap lebih dari pukul 22.00 wajib melapor ke pengelola dan mencatat identitas di buku tamu. Terima kasih atas kerja samanya.',
                'property_id' => null,
                'author' => 'Admin Kostantinopel',
                'created_at' => now()->subDays(4),
            ],
        );

        Announcement::updateOrCreate(
            ['title' => 'Promo Perpanjangan Sewa'],
            [
                'pinned' => false,
                'body' => 'Perpanjangan sewa 6 bulan sebelum jatuh tempo mendapat potongan Rp 100.000. Hubungi pengelola untuk informasi lebih lanjut.',
                'property_id' => $kost->id,
                'author' => 'Admin Kostantinopel',
                'created_at' => now()->subDays(8),
            ],
        );

        MaintenanceRequest::updateOrCreate(
            ['code' => 'REQ-0001'],
            [
                'tenant_id' => $siti->id,
                'property_id' => $siti->property_id,
                'room_id' => $siti->room_id,
                'category' => 'perbaikan',
                'priority' => 'normal',
                'title' => 'AC kurang dingin',
                'description' => 'AC di kamar sudah tidak dingin sejak dua hari lalu. Mohon diperiksa.',
                'status' => 'in_progress',
                'response' => 'Teknisi dijadwalkan datang besok pukul 10.00.',
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDay(),
            ],
        );

        MaintenanceRequest::updateOrCreate(
            ['code' => 'REQ-0002'],
            [
                'tenant_id' => $siti->id,
                'property_id' => $siti->property_id,
                'room_id' => $siti->room_id,
                'category' => 'perbaikan',
                'priority' => 'high',
                'title' => 'Lampu kamar mandi mati',
                'description' => 'Lampu kamar mandi dalam kamar mati sejak semalam. Mohon diganti.',
                'status' => 'open',
                'response' => '',
                'created_at' => now()->subHours(6),
                'updated_at' => now()->subHours(6),
            ],
        );
    }
}
