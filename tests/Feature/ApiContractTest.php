<?php

namespace Tests\Feature;

use App\Http\Middleware\NormalizePath;
use App\Models\Booking;
use App\Models\Room;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class ApiContractTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    private function token(string $email, string $password): string
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $email,
            'password' => $password,
        ]);

        $response->assertOk();

        return $response->json('token');
    }

    /**
     * @return array<string, string>
     */
    private function adminHeaders(): array
    {
        return ['Authorization' => 'Bearer ' . $this->token('admin@kostantinopel.id', 'admin123')];
    }

    public function test_api_root_returns_usage_information(): void
    {
        $this->getJson('/api/v1')
            ->assertOk()
            ->assertJsonPath('data.name', 'Kostantinopel')
            ->assertJsonPath('data.health', url('/api/v1/health'))
            ->assertJsonStructure([
                'data' => ['name', 'version', 'baseUrl', 'documentation', 'specification', 'health', 'authentication'],
            ]);
    }

    public function test_duplicate_slashes_are_normalized(): void
    {
        $request = \Mockery::mock(Request::class);
        $request->shouldReceive('getRequestUri')->once()->andReturn('//api/v1/health?x=1');

        $response = (new NormalizePath())->handle($request, fn () => new Response('ok'));

        $this->assertSame(308, $response->getStatusCode());
        $this->assertStringEndsWith('/api/v1/health?x=1', $response->headers->get('Location'));
    }

    public function test_health_endpoint_uses_data_envelope(): void
    {
        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertJsonPath('data.status', 'ok')
            ->assertJsonStructure(['data' => ['status', 'time', 'version']]);
    }

    public function test_login_returns_token_and_user(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@kostantinopel.id',
            'password' => 'admin123',
        ])
            ->assertOk()
            ->assertJsonStructure([
                'token',
                'expiresAt',
                'user' => ['id', 'name', 'email', 'role'],
            ])
            ->assertJsonPath('user.role', 'admin');
    }

    public function test_bad_credentials_return_401_envelope(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@kostantinopel.id',
            'password' => 'salah',
        ])
            ->assertStatus(401)
            ->assertJsonPath('error.code', 'UNAUTHORIZED');
    }

    public function test_unauthenticated_request_returns_401_envelope(): void
    {
        $this->getJson('/api/v1/properties')
            ->assertStatus(401)
            ->assertJsonPath('error.code', 'UNAUTHORIZED');
    }

    public function test_property_list_uses_data_and_meta_envelope(): void
    {
        $response = $this->withHeaders($this->adminHeaders())->getJson('/api/v1/properties');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'name', 'type', 'address', 'createdAt']],
                'meta' => ['page', 'perPage', 'total', 'totalPages'],
            ])
            ->assertJsonPath('meta.page', 1)
            ->assertJsonPath('meta.perPage', 20);

        $this->assertSame(2, $response->json('meta.total'));
        $this->assertIsString($response->json('data.0.id'));
    }

    public function test_validation_error_returns_400_envelope(): void
    {
        $this->withHeaders($this->adminHeaders())
            ->postJson('/api/v1/properties', [])
            ->assertStatus(400)
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonStructure([
                'error' => ['code', 'message', 'details' => [['field', 'message']]],
            ]);
    }

    public function test_missing_resource_returns_404_envelope(): void
    {
        $this->withHeaders($this->adminHeaders())
            ->getJson('/api/v1/properties/99999')
            ->assertStatus(404)
            ->assertJsonPath('error.code', 'NOT_FOUND');
    }

    public function test_booking_quote_calculates_daily_price(): void
    {
        $room = Room::where('price_daily', '>', 0)->firstOrFail();

        $this->withHeaders($this->adminHeaders())
            ->postJson('/api/v1/bookings/quote', [
                'roomId' => (string) $room->id,
                'checkIn' => '2027-06-01',
                'checkOut' => '2027-06-04',
                'rentType' => 'harian',
            ])
            ->assertOk()
            ->assertJsonPath('data.days', 3)
            ->assertJsonPath('data.units', 3)
            ->assertJsonPath('data.unitLabel', 'malam')
            ->assertJsonPath('data.total', 3 * $room->price_daily);
    }

    public function test_booking_quote_calculates_weekly_and_monthly_price(): void
    {
        $room = Room::where('price_daily', '>', 0)->where('price_monthly', '>', 0)->firstOrFail();
        $headers = $this->adminHeaders();

        $weeklyDays = 8;
        $weeklyUnits = (int) ceil($weeklyDays / 7);
        $weeklyTotal = (int) round($weeklyUnits * $room->price_daily * 7 * 0.9);

        $this->withHeaders($headers)
            ->postJson('/api/v1/bookings/quote', [
                'roomId' => (string) $room->id,
                'checkIn' => '2027-06-01',
                'checkOut' => '2027-06-09',
                'rentType' => 'mingguan',
            ])
            ->assertOk()
            ->assertJsonPath('data.days', $weeklyDays)
            ->assertJsonPath('data.units', $weeklyUnits)
            ->assertJsonPath('data.total', $weeklyTotal);

        $monthlyDays = 31;
        $monthlyUnits = (int) ceil($monthlyDays / 30);
        $monthlyTotal = $monthlyUnits * $room->price_monthly;

        $this->withHeaders($headers)
            ->postJson('/api/v1/bookings/quote', [
                'roomId' => (string) $room->id,
                'checkIn' => '2027-06-01',
                'checkOut' => '2027-07-02',
                'rentType' => 'bulanan',
            ])
            ->assertOk()
            ->assertJsonPath('data.days', $monthlyDays)
            ->assertJsonPath('data.units', $monthlyUnits)
            ->assertJsonPath('data.total', $monthlyTotal);
    }

    public function test_invalid_booking_status_transition_returns_409(): void
    {
        $booking = Booking::where('status', 'pending')->firstOrFail();

        $this->withHeaders($this->adminHeaders())
            ->patchJson("/api/v1/bookings/{$booking->id}/status", ['status' => 'checkedout'])
            ->assertStatus(409)
            ->assertJsonPath('error.code', 'CONFLICT');
    }

    public function test_tenant_token_cannot_access_admin_endpoints(): void
    {
        $token = $this->token('siti@kostantinopel.id', 'siti123');

        $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->getJson('/api/v1/properties')
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'FORBIDDEN');
    }

    public function test_tenant_portal_endpoints_are_available(): void
    {
        $token = $this->token('siti@kostantinopel.id', 'siti123');
        $headers = ['Authorization' => 'Bearer ' . $token];

        foreach (['summary', 'room', 'invoices', 'requests', 'announcements'] as $endpoint) {
            $this->withHeaders($headers)
                ->getJson("/api/v1/portal/{$endpoint}")
                ->assertOk()
                ->assertJsonStructure(['data']);
        }
    }
}
