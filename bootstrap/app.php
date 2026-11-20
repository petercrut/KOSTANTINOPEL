<?php

use App\Exceptions\BusinessRuleException;
use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\NormalizePath;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        apiPrefix: 'api',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(NormalizePath::class);

        $middleware->alias([
            'role' => EnsureRole::class,
        ]);
        $middleware->redirectGuestsTo(fn () => route('login'));
        $middleware->redirectUsersTo(fn () => route('dashboard'));
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->dontReport([
            BusinessRuleException::class,
        ]);

        $isApi = fn (Request $request): bool => $request->is('api/*') || $request->expectsJson();

        $errorPayload = function (string $code, string $message, array $details = []): array {
            $error = ['code' => $code, 'message' => $message];

            if ($details !== []) {
                $error['details'] = $details;
            }

            return ['error' => $error];
        };

        $exceptions->render(function (BusinessRuleException $exception, Request $request) use ($isApi) {
            if ($isApi($request)) {
                return response()->json([
                    'error' => [
                        'code' => $exception->errorCode,
                        'message' => $exception->getMessage(),
                    ],
                ], $exception->status);
            }

            return back()->withInput()->with('error', $exception->getMessage());
        });

        $exceptions->render(function (ValidationException $exception, Request $request) use ($isApi, $errorPayload) {
            if (! $isApi($request)) {
                return null;
            }

            $details = [];

            foreach ($exception->errors() as $field => $messages) {
                foreach ($messages as $message) {
                    $details[] = ['field' => $field, 'message' => $message];
                }
            }

            return response()->json($errorPayload('VALIDATION_ERROR', 'Data yang dikirim tidak valid.', $details), 400);
        });

        $exceptions->render(function (AuthenticationException $exception, Request $request) use ($isApi, $errorPayload) {
            if (! $isApi($request)) {
                return null;
            }

            return response()->json($errorPayload('UNAUTHORIZED', 'Token tidak ada, kedaluwarsa, atau tidak valid.'), 401);
        });

        $exceptions->render(function (AuthorizationException $exception, Request $request) use ($isApi, $errorPayload) {
            if (! $isApi($request)) {
                return null;
            }

            return response()->json($errorPayload('FORBIDDEN', 'Anda tidak berhak mengakses data ini.'), 403);
        });

        $exceptions->render(function (AccessDeniedHttpException $exception, Request $request) use ($isApi, $errorPayload) {
            if (! $isApi($request)) {
                return null;
            }

            return response()->json($errorPayload('FORBIDDEN', $exception->getMessage() ?: 'Anda tidak berhak mengakses data ini.'), 403);
        });

        $exceptions->render(function (NotFoundHttpException $exception, Request $request) use ($isApi, $errorPayload) {
            if (! $isApi($request)) {
                return null;
            }

            return response()->json($errorPayload('NOT_FOUND', 'Resource tidak ditemukan.'), 404);
        });

        $exceptions->render(function (ModelNotFoundException $exception, Request $request) use ($isApi, $errorPayload) {
            if (! $isApi($request)) {
                return null;
            }

            return response()->json($errorPayload('NOT_FOUND', 'Resource tidak ditemukan.'), 404);
        });

        $exceptions->render(function (Throwable $exception, Request $request) use ($isApi, $errorPayload) {
            if (! $isApi($request)) {
                return null;
            }

            if ($exception instanceof HttpExceptionInterface) {
                $status = $exception->getStatusCode();
                $code = match ($status) {
                    401 => 'UNAUTHORIZED',
                    403 => 'FORBIDDEN',
                    404 => 'NOT_FOUND',
                    405 => 'METHOD_NOT_ALLOWED',
                    429 => 'TOO_MANY_REQUESTS',
                    default => 'HTTP_ERROR',
                };

                return response()->json($errorPayload($code, $exception->getMessage() ?: 'Permintaan tidak dapat diproses.'), $status);
            }

            report($exception);

            return response()->json($errorPayload('SERVER_ERROR', 'Terjadi kesalahan pada server.'), 500);
        });
    })->create();
