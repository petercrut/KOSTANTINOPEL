@extends('layouts.portal')

@section('title', 'Profil & Data Diri')

@section('content')
    @php
        $user = $tenant->user;
        $room = $tenant->room;
        $property = $tenant->property ?? $room?->property;
    @endphp

    <div class="page-head">
        <div>
            <h2>Profil &amp; Data Diri</h2>
            <p class="page-sub">Perbarui data diri, informasi kontak, dan keamanan akun portal Anda.</p>
        </div>
    </div>

    <div class="stat-grid cols-4">
        <div class="mini-stat">
            <span>Status Hunian</span>
            <strong>{{ \App\Support\Labels::label('tenantStatus', $tenant->status) }}</strong>
            <small>{{ $tenant->end_date ? 'Berakhir ' . \App\Support\Format::date($tenant->end_date->toDateString()) : 'Tanpa batas akhir' }}</small>
        </div>
        <div class="mini-stat">
            <span>Kamar</span>
            <strong>{{ $room?->number ?? '-' }}</strong>
            <small>{{ $property?->name ?? '-' }}</small>
        </div>
        <div class="mini-stat">
            <span>Tagihan Belum Lunas</span>
            <strong>{{ \App\Support\Format::rupiah($outstanding) }}</strong>
            <small>Termasuk jatuh tempo</small>
        </div>
        <div class="mini-stat">
            <span>Total Sudah Dibayar</span>
            <strong>{{ \App\Support\Format::rupiah($paidTotal) }}</strong>
            <small>Sepanjang masa sewa</small>
        </div>
    </div>

    <div class="grid-2 wide-left">
        <section class="card">
            <div class="card-head"><h3>Data Diri Penyewa</h3></div>
            <div class="card-body">
                @include('partials.form-errors')
                <form method="POST" action="{{ route('portal.identity') }}">
                    @csrf
                    @method('PATCH')

                    <div class="form-row">
                        <label class="form-field">
                            <span class="form-label">Nama lengkap *</span>
                            <input type="text" name="name" value="{{ old('name', $tenant->name) }}" required maxlength="120">
                            @error('name')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                        <label class="form-field">
                            <span class="form-label">Nomor telepon</span>
                            <input type="text" name="phone" value="{{ old('phone', $tenant->phone) }}" maxlength="40">
                            @error('phone')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                    </div>

                    <div class="form-row">
                        <label class="form-field">
                            <span class="form-label">Email</span>
                            <input type="email" name="email" value="{{ old('email', $tenant->email) }}" maxlength="190">
                            @error('email')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                        <label class="form-field">
                            <span class="form-label">Nomor identitas (KTP)</span>
                            <input type="text" name="id_number" value="{{ old('id_number', $tenant->id_number) }}" maxlength="40">
                            @error('id_number')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                    </div>

                    <div class="form-grid-3">
                        <label class="form-field">
                            <span class="form-label">Tanggal lahir</span>
                            <input type="date" name="birth_date" value="{{ old('birth_date', $tenant->birth_date?->toDateString()) }}">
                            @error('birth_date')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                        <label class="form-field">
                            <span class="form-label">Jenis kelamin</span>
                            <select name="gender">
                                <option value="">-</option>
                                @foreach (\App\Support\Labels::GENDERS as $value => $label)
                                    <option value="{{ $value }}" @selected(old('gender', $tenant->gender) === $value)>{{ $label }}</option>
                                @endforeach
                            </select>
                            @error('gender')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                        <label class="form-field">
                            <span class="form-label">Pekerjaan</span>
                            <input type="text" name="occupation" value="{{ old('occupation', $tenant->occupation) }}" maxlength="80">
                            @error('occupation')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                    </div>

                    <label class="form-field">
                        <span class="form-label">Alamat asal</span>
                        <input type="text" name="address" value="{{ old('address', $tenant->address) }}" maxlength="255">
                        @error('address')<span class="field-error">{{ $message }}</span>@enderror
                    </label>

                    <div class="form-row">
                        <label class="form-field">
                            <span class="form-label">Kontak darurat</span>
                            <input type="text" name="emergency_name" value="{{ old('emergency_name', $tenant->emergency_name) }}" maxlength="120">
                            @error('emergency_name')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                        <label class="form-field">
                            <span class="form-label">Telepon darurat</span>
                            <input type="text" name="emergency_phone" value="{{ old('emergency_phone', $tenant->emergency_phone) }}" maxlength="40">
                            @error('emergency_phone')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                    </div>

                    <div class="form-actions">
                        <button class="btn btn-primary" type="submit">Simpan Data Diri</button>
                    </div>
                </form>
            </div>
        </section>

        <div>
            <section class="card mb-22">
                <div class="card-head"><h3>Akun Portal</h3></div>
                <div class="card-body">
                    <p class="text-muted-sm">Email akun digunakan untuk masuk ke portal penyewa.</p>
                    <form method="POST" action="{{ route('profile.update') }}">
                        @csrf
                        @method('PATCH')
                        <label class="form-field">
                            <span class="form-label">Nama akun *</span>
                            <input type="text" name="name" value="{{ old('name', $user?->name) }}" required maxlength="120">
                            @error('name')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                        <label class="form-field">
                            <span class="form-label">Email login *</span>
                            <input type="email" name="email" value="{{ old('email', $user?->email) }}" required maxlength="190">
                            @error('email')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                        <button class="btn btn-primary btn-block" type="submit">Simpan Akun</button>
                    </form>
                </div>
            </section>

            <section class="card">
                <div class="card-head"><h3>Ubah Password</h3></div>
                <div class="card-body">
                    <form method="POST" action="{{ route('profile.password') }}">
                        @csrf
                        @method('PUT')
                        <label class="form-field">
                            <span class="form-label">Password saat ini *</span>
                            <input type="password" name="current_password" required autocomplete="current-password">
                            @error('current_password')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                        <label class="form-field">
                            <span class="form-label">Password baru *</span>
                            <input type="password" name="password" required minlength="6" autocomplete="new-password">
                            @error('password')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                        <label class="form-field">
                            <span class="form-label">Ulangi password baru *</span>
                            <input type="password" name="password_confirmation" required minlength="6" autocomplete="new-password">
                        </label>
                        <button class="btn btn-ghost btn-block" type="submit">Perbarui Password</button>
                    </form>
                </div>
            </section>
        </div>
    </div>

    <section class="card">
        <div class="card-head"><h3>Info Hunian</h3></div>
        <div class="card-body">
            <div class="info-grid">
                <div class="info-item"><span>Properti</span><strong>{{ $property?->name ?? '-' }}</strong></div>
                <div class="info-item"><span>Kamar</span><strong>{{ $room?->number ?? '-' }} · {{ $room?->type ?? '-' }}</strong></div>
                <div class="info-item"><span>Mulai sewa</span><strong>{{ \App\Support\Format::dateLong($tenant->start_date) }}</strong></div>
                <div class="info-item"><span>Akhir sewa</span><strong>{{ $tenant->end_date ? \App\Support\Format::dateLong($tenant->end_date) : 'Belum ditentukan' }}</strong></div>
            </div>
            <div class="identity-foot mt-16">
                <div class="identity-note">
                    <strong>Perubahan data penting</strong>
                    <span>Untuk pindah kamar atau mengakhiri masa sewa, hubungi pengelola properti. Perubahan tersebut tidak dapat dilakukan sendiri melalui portal.</span>
                </div>
                <a class="btn btn-ghost" href="{{ route('portal.requests') }}">Hubungi Pengelola</a>
            </div>
        </div>
    </section>
@endsection
