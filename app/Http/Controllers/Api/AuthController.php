<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessRuleException;
use App\Http\Resources\UserResource;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends ApiController
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw new BusinessRuleException('Email atau password salah', 401, 'UNAUTHORIZED');
        }

        return response()->json($this->tokenPayload($user));
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['sometimes', Rule::in(['admin', 'tenant'])],
        ]);

        $email = strtolower(trim($data['email']));

        if (User::whereRaw('lower(email) = ?', [$email])->exists()) {
            throw new BusinessRuleException('Email sudah terdaftar. Silakan masuk.');
        }

        $role = $data['role'] ?? 'admin';
        $tenantId = null;
        $name = $data['name'];

        if ($role === 'tenant') {
            $tenant = Tenant::whereRaw('lower(email) = ?', [$email])
                ->where('status', 'active')
                ->first();

            if (! $tenant) {
                throw new BusinessRuleException(
                    'Email belum terdaftar sebagai penyewa. Hubungi pengelola properti Anda.',
                    400,
                    'VALIDATION_ERROR',
                );
            }

            if (User::where('tenant_id', $tenant->id)->where('role', 'tenant')->exists()) {
                throw new BusinessRuleException('Akun penyewa untuk email ini sudah dibuat. Silakan masuk.');
            }

            $tenantId = $tenant->id;
            $name = $tenant->name;
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => $data['password'],
            'role' => $role,
            'tenant_id' => $tenantId,
        ]);

        return response()->json($this->tokenPayload($user), 201);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();

        if ($token && method_exists($token, 'delete')) {
            $token->delete();
        }

        return response()->json(null, 204);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('tenant');

        return $this->respond(new UserResource($user));
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'email' => ['sometimes', 'email', 'max:190'],
        ]);

        if (isset($data['email'])) {
            $email = strtolower(trim($data['email']));
            $taken = User::whereRaw('lower(email) = ?', [$email])
                ->whereKeyNot($user->id)
                ->exists();

            if ($taken) {
                throw new BusinessRuleException('Email sudah digunakan akun lain.');
            }

            $data['email'] = $email;
        }

        $user->update($data);

        return $this->respond(new UserResource($user->fresh()));
    }

    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'currentPassword' => ['required', 'string'],
            'newPassword' => ['required', 'string', 'min:6'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['currentPassword'], $user->password)) {
            throw new BusinessRuleException('Password saat ini salah', 400, 'VALIDATION_ERROR');
        }

        $user->update(['password' => $data['newPassword']]);

        return response()->json(null, 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function tokenPayload(User $user): array
    {
        $expiresAt = now()->addDays(7);
        $token = $user->createToken('api', ['*'], $expiresAt);

        return [
            'token' => $token->plainTextToken,
            'expiresAt' => $expiresAt->getTimestamp() * 1000,
            'user' => new UserResource($user),
        ];
    }
}
