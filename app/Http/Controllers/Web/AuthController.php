<?php

namespace App\Http\Controllers\Web;

use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class AuthController extends Controller
{
    public function showLogin(): View|RedirectResponse
    {
        if (Auth::check()) {
            return redirect()->route(Auth::user()->isAdmin() ? 'dashboard' : 'portal.dashboard');
        }

        return view('auth.login');
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            throw new BusinessRuleException('Email atau password salah', 422, 'VALIDATION_ERROR');
        }

        $request->session()->regenerate();

        return redirect()->intended(
            Auth::user()->isAdmin() ? route('dashboard') : route('portal.dashboard'),
        );
    }

    public function showRegister(): View|RedirectResponse
    {
        if (Auth::check()) {
            return redirect()->route(Auth::user()->isAdmin() ? 'dashboard' : 'portal.dashboard');
        }

        return view('auth.register');
    }

    public function register(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
            'role' => ['required', Rule::in(['admin', 'tenant'])],
        ]);

        $email = strtolower(trim($data['email']));

        if (User::whereRaw('lower(email) = ?', [$email])->exists()) {
            throw new BusinessRuleException('Email sudah terdaftar. Silakan masuk.', 422, 'VALIDATION_ERROR');
        }

        $tenantId = null;
        $name = $data['name'];

        if ($data['role'] === 'tenant') {
            $tenant = Tenant::whereRaw('lower(email) = ?', [$email])
                ->where('status', 'active')
                ->first();

            if (! $tenant) {
                throw new BusinessRuleException(
                    'Email belum terdaftar sebagai penyewa. Hubungi pengelola properti Anda.',
                    422,
                    'VALIDATION_ERROR',
                );
            }

            if (User::where('tenant_id', $tenant->id)->where('role', 'tenant')->exists()) {
                throw new BusinessRuleException('Akun penyewa untuk email ini sudah dibuat. Silakan masuk.', 422, 'VALIDATION_ERROR');
            }

            $tenantId = $tenant->id;
            $name = $tenant->name;
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => $data['password'],
            'role' => $data['role'],
            'tenant_id' => $tenantId,
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route($user->isAdmin() ? 'dashboard' : 'portal.dashboard')
            ->with('status', 'Akun berhasil dibuat. Selamat datang!');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('status', 'Anda telah keluar.');
    }
}
