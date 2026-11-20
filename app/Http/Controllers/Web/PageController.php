<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\Property;
use App\Models\Room;
use App\Models\Tenant;
use App\Support\Format;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PageController extends Controller
{
    public function landing(): View
    {
        $rooms = Room::with('property')->orderBy('price_daily')->limit(6)->get();

        return view('landing', [
            'properties' => Property::withCount('rooms')->orderBy('name')->get(),
            'rooms' => $rooms,
            'stats' => [
                'properties' => Property::count(),
                'rooms' => Room::count(),
                'tenants' => Tenant::where('status', 'active')->count(),
                'occupancy' => Invoice::where('status', 'unpaid')->count(),
            ],
            'announcements' => Announcement::ordered()->limit(3)->get(),
            'latestBooking' => Booking::latest()->first(),
            'formatted' => fn (int $amount) => Format::rupiah($amount),
        ]);
    }

    public function docs(): View
    {
        return view('docs');
    }

    public function openapi()
    {
        $candidates = [
            public_path('openapi/openapi.json'),
            base_path('legacy/openapi/openapi.json'),
        ];

        foreach ($candidates as $path) {
            if (is_file($path)) {
                return response()->file($path, ['Content-Type' => 'application/json']);
            }
        }

        abort(404, 'Spesifikasi OpenAPI tidak ditemukan.');
    }
}
