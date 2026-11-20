<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return $request->expectsJson()
                ? response()->json(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Silakan masuk terlebih dahulu.']], 401)
                : redirect()->route('login');
        }

        if ($roles !== [] && ! in_array($user->role, $roles, true)) {
            abort(403, 'Anda tidak berhak mengakses halaman ini.');
        }

        return $next($request);
    }
}
