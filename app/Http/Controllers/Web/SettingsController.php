<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
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
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\View\View;

class SettingsController extends Controller
{
    public function index(): View
    {
        $database = config('database.connections.sqlite.database');
        $bytes = is_string($database) && $database !== ':memory:' && is_file($database)
            ? (int) filesize($database)
            : 0;

        return view('admin.settings', [
            'counts' => [
                'properties' => Property::count(),
                'rooms' => Room::count(),
                'tenants' => Tenant::count(),
                'bookings' => Booking::count(),
                'invoices' => Invoice::count(),
                'requests' => MaintenanceRequest::count(),
                'announcements' => Announcement::count(),
                'users' => User::count(),
            ],
            'seededAt' => User::min('created_at'),
            'storageBytes' => $bytes,
            'version' => (string) config('app.version', '1.0.0'),
        ]);
    }

    public function backup(BackupService $service): JsonResponse
    {
        return response()->json($service->export(), 200, [
            'Content-Disposition' => 'attachment; filename="kostantinopel-backup-' . now()->format('Ymd-His') . '.json"',
        ]);
    }

    public function restore(Request $request, BackupService $service): RedirectResponse
    {
        $request->validate([
            'backup' => ['required', 'file', 'mimetypes:application/json,text/plain', 'max:10240'],
        ]);

        $payload = json_decode((string) file_get_contents($request->file('backup')->getRealPath()), true);

        if (! is_array($payload)) {
            return back()->with('error', 'Berkas backup tidak dapat dibaca.');
        }

        try {
            $service->restore($payload);
        } catch (\Throwable $exception) {
            return back()->with('error', 'Restore gagal: ' . $exception->getMessage());
        }

        return back()->with('status', 'Data berhasil dipulihkan dari backup.');
    }

    public function reset(): RedirectResponse
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

        Auth::logout();

        return redirect()->route('login')->with('status', 'Data demo telah direset. Silakan masuk kembali.');
    }
}
