<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190'],
        ]);

        $email = strtolower(trim($data['email']));

        if (User::whereRaw('lower(email) = ?', [$email])->whereKeyNot($user->id)->exists()) {
            return back()->with('error', 'Email sudah digunakan akun lain.');
        }

        $user->update(['name' => $data['name'], 'email' => $email]);

        return back()->with('status', 'Profil berhasil diperbarui.');
    }

    public function password(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        if (! Hash::check($data['current_password'], $request->user()->password)) {
            return back()->with('error', 'Password saat ini salah.');
        }

        $request->user()->update(['password' => $data['password']]);

        return back()->with('status', 'Password berhasil diubah.');
    }
}
