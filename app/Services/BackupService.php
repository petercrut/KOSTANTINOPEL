<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Http\Resources\AnnouncementResource;
use App\Http\Resources\BookingResource;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\PropertyResource;
use App\Http\Resources\RequestResource;
use App\Http\Resources\RoomResource;
use App\Http\Resources\TenantResource;
use App\Http\Resources\UserResource;
use App\Models\Announcement;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\MaintenanceRequest;
use App\Models\Property;
use App\Models\Room;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class BackupService
{
    /**
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function export(): array
    {
        return [
            'users' => UserResource::collection(User::all())->resolve(),
            'properties' => PropertyResource::collection(Property::all())->resolve(),
            'rooms' => RoomResource::collection(Room::all())->resolve(),
            'tenants' => TenantResource::collection(Tenant::with('user')->get())->resolve(),
            'bookings' => BookingResource::collection(Booking::all())->resolve(),
            'invoices' => InvoiceResource::collection(Invoice::all())->resolve(),
            'requests' => RequestResource::collection(MaintenanceRequest::all())->resolve(),
            'announcements' => AnnouncementResource::collection(Announcement::all())->resolve(),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function restore(array $payload): void
    {
        $required = ['properties', 'rooms', 'tenants', 'bookings', 'invoices', 'requests', 'announcements'];

        foreach ($required as $key) {
            if (! array_key_exists($key, $payload) || ! is_array($payload[$key])) {
                throw new BusinessRuleException('Berkas backup tidak valid: bagian "' . $key . '" tidak ditemukan', 400, 'VALIDATION_ERROR');
            }
        }

        DB::transaction(function () use ($payload) {
            Invoice::query()->delete();
            MaintenanceRequest::query()->delete();
            Booking::query()->delete();
            Announcement::query()->delete();
            Tenant::query()->delete();
            Room::query()->delete();
            Property::query()->delete();

            $propertyMap = [];

            foreach ($payload['properties'] as $row) {
                $property = Property::create([
                    'name' => $row['name'] ?? 'Properti',
                    'type' => $row['type'] ?? 'kost',
                    'address' => $row['address'] ?? '',
                    'phone' => $row['phone'] ?? null,
                    'notes' => $row['notes'] ?? null,
                ]);

                $propertyMap[(string) ($row['id'] ?? $property->id)] = $property->id;
            }

            $roomMap = [];

            foreach ($payload['rooms'] as $row) {
                $propertyId = $propertyMap[(string) ($row['propertyId'] ?? '')] ?? null;

                if (! $propertyId) {
                    continue;
                }

                $room = Room::create([
                    'property_id' => $propertyId,
                    'number' => $row['number'] ?? '-',
                    'type' => $row['type'] ?? 'Single',
                    'capacity' => (int) ($row['capacity'] ?? 1),
                    'price_daily' => (int) ($row['priceDaily'] ?? 0),
                    'price_monthly' => (int) ($row['priceMonthly'] ?? 0),
                    'facilities' => $row['facilities'] ?? [],
                    'status' => $row['status'] ?? 'available',
                ]);

                $roomMap[(string) ($row['id'] ?? $room->id)] = $room->id;
            }

            $tenantMap = [];

            foreach ($payload['tenants'] as $row) {
                $roomId = $roomMap[(string) ($row['roomId'] ?? '')] ?? null;
                $propertyId = $propertyMap[(string) ($row['propertyId'] ?? '')]
                    ?? ($roomId ? Room::find($roomId)?->property_id : null);

                if (! $roomId || ! $propertyId) {
                    continue;
                }

                $tenant = Tenant::create([
                    'name' => $row['name'] ?? 'Penyewa',
                    'phone' => $row['phone'] ?? '',
                    'id_number' => $row['idNumber'] ?? '',
                    'email' => $row['email'] ?? '',
                    'address' => $row['address'] ?? '',
                    'birth_date' => ($row['birthDate'] ?? null) ?: null,
                    'gender' => $row['gender'] ?? '',
                    'occupation' => $row['occupation'] ?? '',
                    'emergency_name' => $row['emergencyName'] ?? '',
                    'emergency_phone' => $row['emergencyPhone'] ?? '',
                    'property_id' => $propertyId,
                    'room_id' => $roomId,
                    'start_date' => $row['startDate'] ?? now()->toDateString(),
                    'end_date' => ($row['endDate'] ?? null) ?: null,
                    'status' => $row['status'] ?? 'active',
                    'note' => $row['note'] ?? '',
                ]);

                $tenantMap[(string) ($row['id'] ?? $tenant->id)] = $tenant->id;
            }

            $bookingMap = [];

            foreach ($payload['bookings'] as $row) {
                $roomId = $roomMap[(string) ($row['roomId'] ?? '')] ?? null;
                $propertyId = $propertyMap[(string) ($row['propertyId'] ?? '')]
                    ?? ($roomId ? Room::find($roomId)?->property_id : null);

                if (! $roomId || ! $propertyId) {
                    continue;
                }

                $booking = Booking::create([
                    'code' => $row['code'] ?? 'BK-' . str_pad((string) (count($bookingMap) + 1), 4, '0', STR_PAD_LEFT),
                    'tenant_id' => $tenantMap[(string) ($row['tenantId'] ?? '')] ?? null,
                    'guest_name' => $row['guestName'] ?? 'Tamu',
                    'guest_phone' => $row['guestPhone'] ?? '',
                    'property_id' => $propertyId,
                    'room_id' => $roomId,
                    'check_in' => $row['checkIn'] ?? now()->toDateString(),
                    'check_out' => $row['checkOut'] ?? now()->addDay()->toDateString(),
                    'rent_type' => $row['rentType'] ?? 'harian',
                    'days' => (int) ($row['days'] ?? 1),
                    'units' => (int) ($row['units'] ?? 1),
                    'unit_label' => $row['unitLabel'] ?? 'malam',
                    'total' => (int) ($row['total'] ?? 0),
                    'status' => $row['status'] ?? 'pending',
                    'notes' => $row['notes'] ?? '',
                ]);

                $bookingMap[(string) ($row['id'] ?? $booking->id)] = $booking->id;
            }

            foreach ($payload['invoices'] as $row) {
                $roomId = $roomMap[(string) ($row['roomId'] ?? '')] ?? null;
                $propertyId = $propertyMap[(string) ($row['propertyId'] ?? '')]
                    ?? ($roomId ? Room::find($roomId)?->property_id : null);

                Invoice::create([
                    'code' => $row['code'] ?? 'INV-' . str_pad((string) (Invoice::count() + 1), 4, '0', STR_PAD_LEFT),
                    'booking_id' => $bookingMap[(string) ($row['bookingId'] ?? '')] ?? null,
                    'tenant_id' => $tenantMap[(string) ($row['tenantId'] ?? '')] ?? null,
                    'property_id' => $propertyId,
                    'room_id' => $roomId,
                    'description' => $row['description'] ?? 'Tagihan',
                    'amount' => (int) ($row['amount'] ?? 0),
                    'due_date' => $row['dueDate'] ?? now()->toDateString(),
                    'status' => $row['status'] ?? 'unpaid',
                    'paid_at' => ($row['paidAt'] ?? null) ?: null,
                    'method' => $row['method'] ?? null,
                    'paid_via' => $row['paidVia'] ?? null,
                ]);
            }

            foreach ($payload['requests'] as $row) {
                $tenantId = $tenantMap[(string) ($row['tenantId'] ?? '')] ?? null;

                if (! $tenantId) {
                    continue;
                }

                $tenant = Tenant::find($tenantId);

                MaintenanceRequest::create([
                    'code' => $row['code'] ?? 'REQ-' . str_pad((string) (MaintenanceRequest::count() + 1), 4, '0', STR_PAD_LEFT),
                    'tenant_id' => $tenant->id,
                    'property_id' => $propertyMap[(string) ($row['propertyId'] ?? '')] ?? $tenant->property_id,
                    'room_id' => $roomMap[(string) ($row['roomId'] ?? '')] ?? $tenant->room_id,
                    'category' => $row['category'] ?? 'lainnya',
                    'priority' => $row['priority'] ?? 'normal',
                    'title' => $row['title'] ?? 'Laporan',
                    'description' => $row['description'] ?? '',
                    'status' => $row['status'] ?? 'open',
                    'response' => $row['response'] ?? '',
                    'resolved_at' => ($row['resolvedAt'] ?? null) ?: null,
                ]);
            }

            foreach ($payload['announcements'] as $row) {
                Announcement::create([
                    'title' => $row['title'] ?? 'Pengumuman',
                    'body' => $row['body'] ?? '',
                    'property_id' => $propertyMap[(string) ($row['propertyId'] ?? '')] ?? null,
                    'pinned' => (bool) ($row['pinned'] ?? false),
                    'author' => $row['author'] ?? 'Admin',
                ]);
            }

            foreach (Arr::get($payload, 'users', []) as $row) {
                $user = User::where('email', $row['email'] ?? '')->first();

                if ($user) {
                    $user->update([
                        'name' => $row['name'] ?? $user->name,
                        'role' => $row['role'] ?? $user->role,
                        'tenant_id' => $tenantMap[(string) ($row['tenantId'] ?? '')] ?? $user->tenant_id,
                    ]);
                }
            }
        });
    }
}
