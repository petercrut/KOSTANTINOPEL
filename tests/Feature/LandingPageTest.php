<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LandingPageTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    public function test_landing_page_renders_with_demo_content(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('Kostantinopel')
            ->assertSee('Kamar Tersedia')
            ->assertSee('Sistem Manajemen Co-Living', false);
    }

    public function test_docs_page_loads_swagger_ui(): void
    {
        $this->get('/docs')
            ->assertOk()
            ->assertSee('swagger-ui', false)
            ->assertSee('Dokumentasi API Kostantinopel');
    }

    public function test_openapi_spec_is_served(): void
    {
        $this->get('/openapi.json')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/json');

        $spec = json_decode(file_get_contents(public_path('openapi/openapi.json')), true);

        $this->assertSame('3.0.3', $spec['openapi']);
        $this->assertSame('Kostantinopel API', $spec['info']['title']);
    }
}
