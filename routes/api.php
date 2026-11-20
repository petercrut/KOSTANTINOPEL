<?php

use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\PortalController;
use App\Http\Controllers\Api\PropertyController;
use App\Http\Controllers\Api\RequestController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\SystemController;
use App\Http\Controllers\Api\TenantController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/', [SystemController::class, 'index']);
    Route::get('/health', [SystemController::class, 'health']);

    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::patch('/auth/profile', [AuthController::class, 'updateProfile']);
        Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

        Route::middleware('role:admin')->group(function () {
            Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
            Route::get('/dashboard/revenue', [DashboardController::class, 'revenue']);
            Route::get('/dashboard/activity', [DashboardController::class, 'activity']);
            Route::get('/dashboard/occupancy', [DashboardController::class, 'occupancy']);
            Route::get('/dashboard/occupancy/by-property', [DashboardController::class, 'occupancyByProperty']);

            Route::get('/properties', [PropertyController::class, 'index']);
            Route::post('/properties', [PropertyController::class, 'store']);
            Route::get('/properties/{property}', [PropertyController::class, 'show']);
            Route::patch('/properties/{property}', [PropertyController::class, 'update']);
            Route::delete('/properties/{property}', [PropertyController::class, 'destroy']);
            Route::get('/properties/{property}/rooms', [PropertyController::class, 'rooms']);
            Route::get('/properties/{property}/summary', [PropertyController::class, 'summary']);

            Route::get('/rooms', [RoomController::class, 'index']);
            Route::post('/rooms', [RoomController::class, 'store']);
            Route::get('/rooms/{room}', [RoomController::class, 'show']);
            Route::patch('/rooms/{room}', [RoomController::class, 'update']);
            Route::delete('/rooms/{room}', [RoomController::class, 'destroy']);
            Route::get('/rooms/{room}/availability', [RoomController::class, 'availability']);
            Route::get('/rooms/{room}/tenants', [RoomController::class, 'tenants']);

            Route::get('/tenants', [TenantController::class, 'index']);
            Route::post('/tenants', [TenantController::class, 'store']);
            Route::get('/tenants/{tenant}', [TenantController::class, 'show']);
            Route::patch('/tenants/{tenant}', [TenantController::class, 'update']);
            Route::delete('/tenants/{tenant}', [TenantController::class, 'destroy']);
            Route::post('/tenants/{tenant}/end-tenancy', [TenantController::class, 'endTenancy']);
            Route::post('/tenants/{tenant}/account', [TenantController::class, 'createAccount']);
            Route::delete('/tenants/{tenant}/account', [TenantController::class, 'deleteAccount']);
            Route::patch('/tenants/{tenant}/account/password', [TenantController::class, 'resetPassword']);
            Route::get('/tenants/{tenant}/invoices', [TenantController::class, 'invoices']);
            Route::get('/tenants/{tenant}/requests', [TenantController::class, 'requests']);
            Route::patch('/tenants/{tenant}/identity', [TenantController::class, 'identity']);

            Route::get('/bookings', [BookingController::class, 'index']);
            Route::post('/bookings', [BookingController::class, 'store']);
            Route::post('/bookings/quote', [BookingController::class, 'quote']);
            Route::get('/bookings/{booking}', [BookingController::class, 'show']);
            Route::patch('/bookings/{booking}', [BookingController::class, 'update']);
            Route::delete('/bookings/{booking}', [BookingController::class, 'destroy']);
            Route::patch('/bookings/{booking}/status', [BookingController::class, 'status']);

            Route::get('/invoices', [InvoiceController::class, 'index']);
            Route::post('/invoices', [InvoiceController::class, 'store']);
            Route::get('/invoices/summary', [InvoiceController::class, 'summary']);
            Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
            Route::patch('/invoices/{invoice}', [InvoiceController::class, 'update']);
            Route::post('/invoices/{invoice}/payment', [InvoiceController::class, 'payment']);

            Route::get('/requests', [RequestController::class, 'index']);
            Route::post('/requests', [RequestController::class, 'store']);
            Route::get('/requests/{requestModel}', [RequestController::class, 'show']);
            Route::patch('/requests/{requestModel}', [RequestController::class, 'update']);
            Route::delete('/requests/{requestModel}', [RequestController::class, 'destroy']);
            Route::post('/requests/{requestModel}/response', [RequestController::class, 'addResponse']);

            Route::get('/announcements', [AnnouncementController::class, 'index']);
            Route::post('/announcements', [AnnouncementController::class, 'store']);
            Route::get('/announcements/{announcement}', [AnnouncementController::class, 'show']);
            Route::patch('/announcements/{announcement}', [AnnouncementController::class, 'update']);
            Route::delete('/announcements/{announcement}', [AnnouncementController::class, 'destroy']);
            Route::patch('/announcements/{announcement}/pin', [AnnouncementController::class, 'pin']);

            Route::get('/analytics/occupancy', [AnalyticsController::class, 'occupancy']);
            Route::get('/analytics/occupancy/by-property', [AnalyticsController::class, 'occupancyByProperty']);
            Route::get('/analytics/revenue', [AnalyticsController::class, 'revenue']);
            Route::get('/analytics/revenue/export', [AnalyticsController::class, 'export']);

            Route::get('/system/info', [SystemController::class, 'info']);
            Route::get('/system/backup', [SystemController::class, 'backup']);
            Route::post('/system/restore', [SystemController::class, 'restore']);
            Route::post('/system/reset', [SystemController::class, 'reset']);
        });

        Route::middleware('role:tenant')->prefix('portal')->group(function () {
            Route::get('/summary', [PortalController::class, 'summary']);
            Route::get('/room', [PortalController::class, 'room']);
            Route::get('/invoices', [PortalController::class, 'invoices']);
            Route::post('/invoices/{id}/payment', [PortalController::class, 'payment']);
            Route::get('/requests', [PortalController::class, 'requests']);
            Route::post('/requests', [PortalController::class, 'createRequest']);
            Route::get('/announcements', [PortalController::class, 'announcements']);
            Route::patch('/identity', [PortalController::class, 'identity']);
        });
    });
});
