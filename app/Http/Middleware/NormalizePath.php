<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class NormalizePath
{
    /**
     * Samakan slash ganda pada URL (mis. //api/v1) menjadi satu slash.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $uri = $request->getRequestUri();
        $parts = explode('?', $uri, 2);
        $path = $parts[0];
        $normalized = preg_replace('#/{2,}#', '/', $path);

        if ($normalized !== $path) {
            $query = isset($parts[1]) ? '?' . $parts[1] : '';

            return redirect()->to($normalized . $query, 308);
        }

        return $next($request);
    }
}
