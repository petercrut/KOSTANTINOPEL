<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebAccessTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
        $this->get('/portal')->assertRedirect('/login');
    }

    public function test_admin_can_login_and_open_management_pages(): void
    {
        $this->post('/login', [
            'email' => 'admin@kostantinopel.id',
            'password' => 'admin123',
        ])->assertRedirect('/dashboard');

        foreach ([
            '/dashboard',
            '/properties',
            '/properties/create',
            '/rooms',
            '/rooms/create',
            '/tenants',
            '/tenants/create',
            '/bookings',
            '/bookings/create',
            '/invoices',
            '/invoices/create',
            '/requests',
            '/announcements',
            '/analytics',
            '/settings',
            '/docs',
        ] as $path) {
            $this->get($path)->assertOk();
        }
    }

    public function test_tenant_can_login_and_open_portal_pages(): void
    {
        $this->post('/login', [
            'email' => 'siti@kostantinopel.id',
            'password' => 'siti123',
        ])->assertRedirect('/portal');

        foreach ([
            '/portal',
            '/portal/invoices',
            '/portal/requests',
            '/portal/announcements',
            '/portal/profile',
        ] as $path) {
            $this->get($path)->assertOk();
        }
    }

    public function test_tenant_cannot_open_admin_pages(): void
    {
        $this->post('/login', [
            'email' => 'siti@kostantinopel.id',
            'password' => 'siti123',
        ]);

        $this->get('/dashboard')->assertForbidden();
        $this->get('/properties')->assertForbidden();
        $this->get('/settings')->assertForbidden();
    }

    public function test_bad_web_credentials_flash_an_error(): void
    {
        $this->from('/login')
            ->post('/login', [
                'email' => 'admin@kostantinopel.id',
                'password' => 'salah',
            ])
            ->assertRedirect('/login')
            ->assertSessionHas('error', 'Email atau password salah');
    }
}
