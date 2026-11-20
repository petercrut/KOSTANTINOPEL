<?php

namespace App\Http\Controllers\Api;

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
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends ApiController
{
    public function __construct(
        private readonly OccupancyService $occupancy,
        private readonly InvoiceService $invoices,
    ) {}

    public function stats(): JsonResponse
    {
        $occupancy = $this->occupancy->stats();
        $invoiceTotals = $this->invoices->totals();
        $today = now()->toDateString();

        return response()->json([
            'data' => [
                'properties' => Property::count(),
                'roomsTotal' => $occupancy['rooms'],
                'roomsOccupied' => $occupancy['occupied'],
                'occupancyRate' => (int) round($occupancy['occupancyRate']),
                'revenueThisMonth' => $invoiceTotals['paidThisMonth'],
                'outstanding' => $invoiceTotals['unpaidTotal'],
                'late' => $invoiceTotals['lateTotal'],
                'activeTenants' => $occupancy['tenants'],
                'pendingBookings' => Booking::where('status', 'pending')->count(),
                'inHouse' => Booking::where('status', 'checkin')
                    ->whereDate('check_in', '<=', $today)
                    ->whereDate('check_out', '>=', $today)
                    ->count(),
                'arrivals' => Booking::whereDate('check_in', $today)->count(),
                'departures' => Booking::whereDate('check_out', $today)->count(),
                'openRequests' => MaintenanceRequest::whereIn('status', ['open', 'in_progress'])->count(),
                'newRequests' => MaintenanceRequest::where('status', 'open')->count(),
                'announcements' => Announcement::count(),
            ],
        ]);
    }

    public function revenue(Request $request): JsonResponse
    {
        $months = max(1, min(24, (int) $request->query('months', 6)));
        $start = now()->startOfMonth()->subMonthsNoOverflow($months - 1);

        $points = [];

        for ($i = 0; $i < $months; $i++) {
            $month = $start->copy()->addMonthsNoOverflow($i);
            $points[$month->format('Y-m')] = [
                'key' => $month->format('Y-m'),
                'label' => Format::monthShort($month->month) . ' ' . $month->year,
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

        return response()->json(['data' => array_values($points)]);
    }

    public function activity(Request $request): JsonResponse
    {
        $limit = max(1, min(50, (int) $request->query('limit', 10)));

        $items = collect();

        foreach (Booking::latest()->limit($limit)->get() as $booking) {
            $items->push([
                'type' => 'booking',
                'createdAt' => $booking->created_at?->toIso8601String(),
                'title' => $booking->code . ' — ' . $booking->guest_name,
                'status' => $booking->status,
                'amount' => (int) $booking->total,
            ]);
        }

        foreach (Invoice::latest()->limit($limit)->get() as $invoice) {
            $items->push([
                'type' => 'invoice',
                'createdAt' => $invoice->created_at?->toIso8601String(),
                'title' => $invoice->code . ' — ' . $invoice->description,
                'status' => $invoice->effectiveStatus(),
                'amount' => (int) $invoice->amount,
            ]);
        }

        foreach (MaintenanceRequest::latest()->limit($limit)->get() as $request) {
            $items->push([
                'type' => 'request',
                'createdAt' => $request->created_at?->toIso8601String(),
                'title' => $request->code . ' — ' . $request->title,
                'status' => $request->status,
                'amount' => 0,
            ]);
        }

        $data = $items
            ->sortByDesc(fn (array $item) => $item['createdAt'] ?? '')
            ->take($limit)
            ->values()
            ->all();

        return response()->json(['data' => $data]);
    }

    public function occupancy(): JsonResponse
    {
        return response()->json(['data' => $this->occupancyPayload()]);
    }

    public function occupancyByProperty(): JsonResponse
    {
        return response()->json(['data' => $this->occupancyByPropertyPayload()]);
    }

    /**
     * @return array<string, int>
     */
    public function occupancyPayload(): array
    {
        $stats = $this->occupancy->stats();

        return [
            'total' => $stats['rooms'],
            'occupied' => $stats['occupied'],
            'available' => $stats['available'],
            'maintenance' => $stats['maintenance'],
            'rate' => (int) round($stats['occupancyRate']),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function occupancyByPropertyPayload(): array
    {
        $rows = [];

        foreach (Property::with('rooms')->orderBy('name')->get() as $property) {
            $counts = ['available' => 0, 'occupied' => 0, 'maintenance' => 0];

            foreach ($property->rooms as $room) {
                $counts[$this->occupancy->effectiveStatus($room)]++;
            }

            $total = $property->rooms->count();

            $rows[] = [
                'id' => (string) $property->id,
                'name' => $property->name,
                'type' => $property->type,
                'total' => $total,
                'occupied' => $counts['occupied'],
                'available' => $counts['available'],
                'rate' => $total > 0 ? (int) round(($counts['occupied'] / $total) * 100) : 0,
            ];
        }

        return $rows;
    }
}
