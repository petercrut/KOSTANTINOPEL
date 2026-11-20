<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\Room;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class TenantService
{
    public function __construct(private readonly InvoiceService $invoices) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Tenant
    {
        $room = Room::find($data['room_id'] ?? null);

        if (! $room) {
            throw new BusinessRuleException('Kamar tidak ditemukan', 404, 'NOT_FOUND');
        }

        if (empty(trim((string) ($data['name'] ?? '')))) {
            throw new BusinessRuleException('Nama penyewa wajib diisi', 422, 'VALIDATION_ERROR');
        }

        if (empty($data['start_date'])) {
            throw new BusinessRuleException('Tanggal masuk wajib diisi', 422, 'VALIDATION_ERROR');
        }

        $occupant = Tenant::query()
            ->where('room_id', $room->id)
            ->where('status', 'active')
            ->first();

        if ($occupant) {
            throw new BusinessRuleException('Kamar ' . $room->number . ' sudah dihuni oleh ' . $occupant->name);
        }

        return DB::transaction(function () use ($data, $room) {
            $tenant = Tenant::create([
                'name' => trim((string) $data['name']),
                'phone' => $data['phone'] ?? '',
                'id_number' => $data['id_number'] ?? '',
                'email' => $data['email'] ?? '',
                'address' => $data['address'] ?? '',
                'birth_date' => $data['birth_date'] ?: null,
                'gender' => $data['gender'] ?? '',
                'occupation' => $data['occupation'] ?? '',
                'emergency_name' => $data['emergency_name'] ?? '',
                'emergency_phone' => $data['emergency_phone'] ?? '',
                'property_id' => $room->property_id,
                'room_id' => $room->id,
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'] ?: null,
                'status' => 'active',
                'note' => $data['note'] ?? '',
            ]);

            $this->invoices->createForTenant($tenant, $room, isset($data['amount']) ? (int) $data['amount'] : null);

            return $tenant->fresh(['room.property', 'invoices']);
        });
    }

    public function end(Tenant $tenant): Tenant
    {
        if ($tenant->status !== 'active') {
            throw new BusinessRuleException('Penyewa sudah tidak aktif');
        }

        $tenant->update(['status' => 'inactive', 'end_date' => now()->toDateString()]);

        return $tenant->fresh(['room.property']);
    }
}
