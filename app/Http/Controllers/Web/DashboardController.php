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
use App\Services\InvoiceService;
use App\Services\OccupancyService;
use App\Support\Format;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function __invoke(OccupancyService $occupancy, InvoiceService $invoices): View
    {
        $stats = $occupancy->stats();
        $totals = $invoices->totals();
        $today = now()->toDateString();

        $properties = Property::with('rooms')->orderBy('name')->get()->map(function (Property $property) use ($occupancy) {
            $counts = ['available' => 0, 'occupied' => 0, 'maintenance' => 0];

            foreach ($property->rooms as $room) {
                $counts[$occupancy->effectiveStatus($room)]++;
            }

            $total = $property->rooms->count();

            return [
                'name' => $property->name,
                'type' => $property->type,
                'total' => $total,
                'occupied' => $counts['occupied'],
                'available' => $counts['available'],
                'maintenance' => $counts['maintenance'],
                'rate' => $total > 0 ? (int) round(($counts['occupied'] / $total) * 100) : 0,
            ];
        });

        return view('admin.dashboard', [
            'stats' => $stats,
            'totals' => $totals,
            'properties' => $properties,
            'revenue' => $this->revenueSeries(6),
            'bookings' => Booking::with('room.property')->latest()->limit(6)->get(),
            'invoices' => Invoice::with(['tenant', 'room'])->orderByDesc('due_date')->limit(6)->get(),
            'requests' => MaintenanceRequest::with('tenant')
                ->whereIn('status', ['open', 'in_progress'])
                ->latest()
                ->limit(5)
                ->get(),
            'announcements' => Announcement::ordered()->limit(3)->get(),
            'today' => $today,
            'counts' => [
                'arrivals' => Booking::whereDate('check_in', $today)->count(),
                'departures' => Booking::whereDate('check_out', $today)->count(),
                'inHouse' => Booking::where('status', 'checkin')
                    ->whereDate('check_in', '<=', $today)
                    ->whereDate('check_out', '>=', $today)
                    ->count(),
                'pendingBookings' => Booking::where('status', 'pending')->count(),
                'activeTenants' => $stats['tenants'],
                'rooms' => Room::count(),
            ],
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function revenueSeries(int $months): array
    {
        $start = now()->startOfMonth()->subMonthsNoOverflow($months - 1);
        $points = [];

        for ($i = 0; $i < $months; $i++) {
            $month = $start->copy()->addMonthsNoOverflow($i);
            $points[$month->format('Y-m')] = [
                'label' => Format::monthShort($month->month),
                'total' => 0,
            ];
        }

        $paid = Invoice::where('status', 'paid')
            ->whereNotNull('paid_at')
            ->whereDate('paid_at', '>=', $start->toDateString())
            ->get();

        foreach ($paid as $invoice) {
            $key = $invoice->paid_at->format('Y-m');

            if (isset($points[$key])) {
                $points[$key]['total'] += (int) $invoice->amount;
            }
        }

        $max = max(1, max(array_column($points, 'total')));

        foreach ($points as $key => $point) {
            $points[$key]['height'] = (int) round(($point['total'] / $max) * 100);
        }

        return array_values($points);
    }
}
