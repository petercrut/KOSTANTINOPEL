<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

abstract class ApiController extends Controller
{
    protected function respond(JsonResource $data, int $status = 200): JsonResponse
    {
        return response()->json(['data' => $data], $status);
    }

    /**
     * @param  class-string<JsonResource>  $resourceClass
     */
    protected function paginated(LengthAwarePaginator $paginator, string $resourceClass): JsonResponse
    {
        return response()->json([
            'data' => $resourceClass::collection($paginator->getCollection()),
            'meta' => [
                'page' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'totalPages' => $paginator->lastPage(),
            ],
        ]);
    }

    protected function perPage(Request $request): int
    {
        return max(1, min(100, (int) $request->query('perPage', 20)));
    }

    protected function paginate(Builder $query, Request $request): LengthAwarePaginator
    {
        return $query->paginate(
            $this->perPage($request),
            ['*'],
            'page',
            max(1, (int) $request->query('page', 1)),
        );
    }

    /**
     * @param  array<string, string>  $columns  camelCase => column
     */
    protected function applySort(Builder $query, Request $request, array $columns, string $default = '-created_at'): Builder
    {
        $sort = (string) $request->query('sort', $default);
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $key = ltrim($sort, '-');
        $column = $columns[$key] ?? null;

        if (! $column) {
            return $query->orderByDesc('id');
        }

        return $query->orderBy($column, $direction);
    }

    /**
     * Ubah kunci camelCase dari request menjadi kolom snake_case.
     *
     * @param  array<string, mixed>  $data
     * @param  array<string, string>  $map
     * @return array<string, mixed>
     */
    protected function mapped(array $data, array $map): array
    {
        $result = [];

        foreach ($data as $key => $value) {
            $result[$map[$key] ?? $key] = $value;
        }

        return $result;
    }

    /**
     * @param  array<int, string>  $columns
     */
    protected function applySearch(Builder $query, Request $request, array $columns): Builder
    {
        $term = trim((string) $request->query('search', ''));

        if ($term === '') {
            return $query;
        }

        return $query->where(function (Builder $query) use ($columns, $term) {
            foreach ($columns as $column) {
                $query->orWhere($column, 'like', '%' . $term . '%');
            }
        });
    }
}
