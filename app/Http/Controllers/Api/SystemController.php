<?php

namespace App\Http\Controllers\Api;

use App\Models\Announcement;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\MaintenanceRequest;
use App\Models\Property;
use App\Models\Room;
use App\Models\Tenant;
use App\Models\User;
use App\Services\BackupService;
use Database\Seeders\DemoDataSeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SystemController extends ApiController
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => [
                'name' => (string) config('app.name'),
                'version' => (string) config('app.version', '1.0.0'),
                'baseUrl' => url('/api/v1'),
                'documentation' => url('/docs'),
                'specification' => url('/openapi.json'),
                'health' => url('/api/v1/health'),
                'authentication' => [
                    'login' => url('/api/v1/auth/login'),
                    'scheme' => 'Bearer token (Sanctum)',
                ],
            ],
        ]);
    }

    public function health(): JsonResponse
    {
        return response()->json([
            'data' => [
                'status' => 'ok',
                'time' => now()->toIso8601String(),
                'version' => (string) config('app.version', '1.0.0'),
            ],
        ]);
    }

    public function info(): JsonResponse
    {
        $database = config('database.connections.sqlite.database');
        $bytes = is_string($database) && $database !== ':memory:' && is_file($database)
            ? (int) filesize($database)
            : 0;

        return response()->json([
            'data' => [
                'version' => (string) config('app.version', '1.0.0'),
                'seededAt' => User::min('created_at'),
                'storageBytes' => $bytes,
                'storageKb' => number_format($bytes / 1024, 1, ',', '.'),
                'counts' => [
                    'users' => User::count(),
                    'properties' => Property::count(),
                    'rooms' => Room::count(),
                    'tenants' => Tenant::count(),
                    'bookings' => Booking::count(),
                    'invoices' => Invoice::count(),
                    'requests' => MaintenanceRequest::count(),
                    'announcements' => Announcement::count(),
                ],
            ],
        ]);
    }

    public function backup(BackupService $service): JsonResponse
    {
        return response()->json(['data' => $service->export()]);
    }

    public function restore(Request $request, BackupService $service): JsonResponse
    {
        $payload = $request->validate([
            'properties' => ['required', 'array'],
            'rooms' => ['required', 'array'],
            'tenants' => ['required', 'array'],
            'bookings' => ['required', 'array'],
            'invoices' => ['required', 'array'],
            'requests' => ['required', 'array'],
            'announcements' => ['required', 'array'],
            'users' => ['sometimes', 'array'],
        ]);

        $service->restore($payload);

        return response()->json(null, 204);
    }

    public function reset(): JsonResponse
    {
        DB::transaction(function () {
            Invoice::query()->delete();
            MaintenanceRequest::query()->delete();
            Booking::query()->delete();
            Announcement::query()->delete();
            Tenant::query()->delete();
            Room::query()->delete();
            Property::query()->delete();

            if (Schema::hasTable('personal_access_tokens')) {
                DB::table('personal_access_tokens')->delete();
            }

            User::query()->delete();

            (new DemoDataSeeder)->run();
        });

        return response()->json(null, 204);
    }
}
