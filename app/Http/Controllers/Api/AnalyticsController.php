<?php

namespace App\Http\Controllers\Api;

use App\Models\Invoice;
use App\Models\Property;
use App\Support\Format;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AnalyticsController extends ApiController
{
    public function occupancy(DashboardController $dashboard): JsonResponse
    {
        return response()->json(['data' => $dashboard->occupancyPayload()]);
    }

    public function occupancyByProperty(DashboardController $dashboard): JsonResponse
    {
        return response()->json(['data' => $dashboard->occupancyByPropertyPayload()]);
    }

    public function revenue(Request $request): JsonResponse
    {
        return response()->json($this->revenueReport($request));
    }

    public function export(Request $request)
    {
        $report = $this->revenueReport($request);
        $lines = ['key,label,total'];

        foreach ($report['data']['points'] as $point) {
            $lines[] = sprintf('%s,"%s",%d', $point['key'], $point['label'], $point['total']);
        }

        $filename = 'pendapatan-' . now()->format('Ymd-His') . '.csv';

        return response(implode("\n", $lines), 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function revenueReport(Request $request): array
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

        $invoices = Invoice::with('property')
            ->where('status', 'paid')
            ->whereNotNull('paid_at')
            ->whereDate('paid_at', '>=', $from->toDateString())
            ->whereDate('paid_at', '<=', $to->toDateString())
            ->get();

        $points = [];

        foreach ($invoices as $invoice) {
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

        return [
            'data' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'groupBy' => $groupBy,
                'total' => array_sum(array_column($points, 'total')),
                'points' => $points,
            ],
        ];
    }
}
