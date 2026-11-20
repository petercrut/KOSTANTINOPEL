<?php

use App\Http\Controllers\Web\AnalyticsController;
use App\Http\Controllers\Web\AnnouncementController;
use App\Http\Controllers\Web\AuthController;
use App\Http\Controllers\Web\BookingController;
use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\InvoiceController;
use App\Http\Controllers\Web\PageController;
use App\Http\Controllers\Web\PortalController;
use App\Http\Controllers\Web\ProfileController;
use App\Http\Controllers\Web\PropertyController;
use App\Http\Controllers\Web\RequestController;
use App\Http\Controllers\Web\RoomController;
use App\Http\Controllers\Web\SettingsController;
use App\Http\Controllers\Web\TenantController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PageController::class, 'landing'])->name('home');
Route::get('/docs', [PageController::class, 'docs'])->name('docs');
Route::get('/openapi.json', [PageController::class, 'openapi'])->name('openapi');

/*
|--------------------------------------------------------------------------
| Standalone API client (public/client)
|--------------------------------------------------------------------------
|
| Serves the vanilla JS CRUD client as a same-origin SPA so it can call
| /api/v1 without CORS. Static assets are streamed straight from
| public/client, with path traversal protection.
|
*/
Route::get('/client/{path?}', function (?string $path = null) {
    $root = realpath(public_path('client'));

    if ($root === false) {
        abort(404, 'Web client belum tersedia.');
    }

    $relative = trim(str_replace('\\', '/', (string) $path), '/');
    $relative = $relative === '' ? 'index.html' : $relative;

    $target = realpath($root . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relative));
    $insideRoot = $target !== false
        && str_starts_with($target, $root . DIRECTORY_SEPARATOR)
        && is_file($target);

    if (! $insideRoot) {
        if (pathinfo($relative, PATHINFO_EXTENSION) !== '') {
            abort(404);
        }

        return response(file_get_contents($root . DIRECTORY_SEPARATOR . 'index.html'), 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }

    $types = [
        'html' => 'text/html; charset=UTF-8',
        'css' => 'text/css; charset=UTF-8',
        'js' => 'text/javascript; charset=UTF-8',
        'json' => 'application/json',
        'svg' => 'image/svg+xml',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'webp' => 'image/webp',
        'ico' => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
    ];

    $extension = strtolower(pathinfo($target, PATHINFO_EXTENSION));
    $headers = isset($types[$extension]) ? ['Content-Type' => $types[$extension]] : [];

    return response(file_get_contents($target), 200, $headers);
})->where('path', '.*')->name('client');

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.attempt');
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AuthController::class, 'register'])->name('register.attempt');
});

Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');

Route::middleware('auth')->group(function () {
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('/profile/password', [ProfileController::class, 'password'])->name('profile.password');
});

Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    Route::resource('properties', PropertyController::class);
    Route::resource('rooms', RoomController::class);

    Route::resource('tenants', TenantController::class);
    Route::post('tenants/{tenant}/end', [TenantController::class, 'end'])->name('tenants.end');
    Route::post('tenants/{tenant}/account', [TenantController::class, 'accountStore'])->name('tenants.account.store');
    Route::delete('tenants/{tenant}/account', [TenantController::class, 'accountDestroy'])->name('tenants.account.destroy');
    Route::put('tenants/{tenant}/account/password', [TenantController::class, 'password'])->name('tenants.account.password');

    Route::get('bookings/quote', [BookingController::class, 'quote'])->name('bookings.quote');
    Route::resource('bookings', BookingController::class);
    Route::patch('bookings/{booking}/status', [BookingController::class, 'status'])->name('bookings.status');

    Route::resource('invoices', InvoiceController::class);
    Route::post('invoices/{invoice}/payment', [InvoiceController::class, 'payment'])->name('invoices.payment');

    Route::get('requests', [RequestController::class, 'index'])->name('requests.index');
    Route::patch('requests/{requestModel}', [RequestController::class, 'update'])->name('requests.update');
    Route::post('requests/{requestModel}/response', [RequestController::class, 'respond'])->name('requests.respond');
    Route::delete('requests/{requestModel}', [RequestController::class, 'destroy'])->name('requests.destroy');

    Route::get('announcements', [AnnouncementController::class, 'index'])->name('announcements.index');
    Route::post('announcements', [AnnouncementController::class, 'store'])->name('announcements.store');
    Route::patch('announcements/{announcement}', [AnnouncementController::class, 'update'])->name('announcements.update');
    Route::delete('announcements/{announcement}', [AnnouncementController::class, 'destroy'])->name('announcements.destroy');
    Route::patch('announcements/{announcement}/pin', [AnnouncementController::class, 'pin'])->name('announcements.pin');

    Route::get('analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

    Route::get('settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::get('settings/backup', [SettingsController::class, 'backup'])->name('settings.backup');
    Route::post('settings/restore', [SettingsController::class, 'restore'])->name('settings.restore');
    Route::post('settings/reset', [SettingsController::class, 'reset'])->name('settings.reset');
});

Route::middleware(['auth', 'role:tenant'])->prefix('portal')->name('portal.')->group(function () {
    Route::get('/', [PortalController::class, 'dashboard'])->name('dashboard');
    Route::get('/invoices', [PortalController::class, 'invoices'])->name('invoices');
    Route::post('/invoices/{id}/payment', [PortalController::class, 'payment'])->name('invoices.payment');
    Route::get('/requests', [PortalController::class, 'requests'])->name('requests');
    Route::post('/requests', [PortalController::class, 'storeRequest'])->name('requests.store');
    Route::get('/announcements', [PortalController::class, 'announcements'])->name('announcements');
    Route::patch('/identity', [PortalController::class, 'identity'])->name('identity');
    Route::get('/profile', [PortalController::class, 'profile'])->name('profile');
});
