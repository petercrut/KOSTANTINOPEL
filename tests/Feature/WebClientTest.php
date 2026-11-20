<?php

namespace Tests\Feature;

use Tests\TestCase;

class WebClientTest extends TestCase
{
    public function test_client_shell_is_served(): void
    {
        $this->get('/client')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/html; charset=UTF-8')
            ->assertSee('Kostantinopel API Client')
            ->assertSee('/client/js/app.js', false)
            ->assertSee('/client/assets/client.css', false);
    }

    public function test_client_stylesheet_is_served(): void
    {
        $this->get('/client/assets/client.css')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/css; charset=UTF-8')
            ->assertSee('--brand');
    }

    public function test_client_javascript_module_is_served(): void
    {
        $this->get('/client/js/app.js')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/javascript; charset=UTF-8')
            ->assertSee("from './api.js'", false);
    }

    public function test_missing_client_asset_returns_not_found(): void
    {
        $this->get('/client/js/missing.js')->assertNotFound();
    }

    public function test_path_traversal_outside_client_directory_is_blocked(): void
    {
        $this->get('/client/..%2F.env')->assertNotFound();
    }

    public function test_unknown_client_path_falls_back_to_shell(): void
    {
        $this->get('/client/dashboard')
            ->assertOk()
            ->assertSee('Kostantinopel API Client');
    }
}
