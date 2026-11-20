<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Property;
use App\Services\OccupancyService;
use App\Support\Format;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\View\View;

class AnalyticsController extends Controller
{
    public function index(Request $request, OccupancyService $occupancy): View
    {
        $from = $request->filled('from')
            ? Carbon::parse($request->query('from'))->startOfDay()
            : now()->startOfYear();

        $to = $request->filled('to')
            ? Carbon::parse($request->query('to'))->endOfDay()
            : now()->endOfDay();

        $groupBy = $request->query('groupBy', 'month');

        if (! in_array($groupBy, ['month', 'property', 'method'], true)) {
            $groupBy = 'month';
        }

        $paid = Invoice::with('property')
            ->where('status', 'paid')
            ->whereNotNull('paid_at')
            ->whereDate('paid_at', '>=', $from->toDateString())
            ->whereDate('paid_at', '<=', $to->toDateString())
            ->get();

        $points = [];

        foreach ($paid as $invoice) {
            if ($groupBy === 'property') {
                $key = $invoice->property?->name ?? 'Tanpa properti';
                $label = $key;
            } elseif ($groupBy === 'method') {
                $key = $invoice->method ?: 'Tunai';
                $label = $key;
            } else {
                $key = $invoice->paid_at->format('Y-m');
                $label = Format::monthLabel($invoice->paid_at);
            }

            if (! isset($points[$key])) {
                $points[$key] = ['key' => $key, 'label' => $label, 'total' => 0];
            }

            $points[$key]['total'] += (int) $invoice->amount;
        }

        $points = array_values($points);
        usort($points, fn ($a, $b) => strcmp((string) $a['key'], (string) $b['key']));
        $max = max(1, max(array_column($points, 'total') ?: [0]));

        foreach ($points as $index => $point) {
            $points[$index]['height'] = (int) round(($point['total'] / $max) * 100);
        }

        $byProperty = Property::with('rooms')->orderBy('name')->get()->map(function (Property $property) use ($occupancy) {
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

        return view('admin.analytics.index', [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'groupBy' => $groupBy,
            'points' => $points,
            'total' => array_sum(array_column($points, 'total')),
            'occupancy' => $occupancy->stats(),
            'byProperty' => $byProperty,
        ]);
    }
}
