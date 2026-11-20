@extends('layouts.app')

@section('title', $tenant->exists ? 'Edit Penyewa' : 'Tambah Penyewa')

@section('content')
    <div class="page-head">
        <div>
            <h2>{{ $tenant->exists ? 'Edit Penyewa' : 'Tambah Penyewa' }}</h2>
            <p class="page-sub">{{ $tenant->exists ? $tenant->name : 'Lengkapi data diri dan penempatan kamar.' }}</p>
        </div>
        <a class="btn btn-ghost" href="{{ $tenant->exists ? route('tenants.show', $tenant) : route('tenants.index') }}">Kembali</a>
    </div>

    <form method="POST" action="{{ $tenant->exists ? route('tenants.update', $tenant) : route('tenants.store') }}">
        @csrf
        @if ($tenant->exists)
            @method('PUT')
        @endif

        <section class="card mb-22">
            <div class="card-head"><h3>Data Penyewa</h3></div>
            <div class="card-body">
                @include('partials.form-errors')

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
                        <input type="email" name="email" value="{{ old('email', $tenant->email) }}" maxlength="190" placeholder="Email ini dipakai untuk pendaftaran akun portal">
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
                            @foreach ($genders as $value => $label)
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

                <label class="form-field">
                    <span class="form-label">Catatan</span>
                    <textarea name="note" rows="2">{{ old('note', $tenant->note) }}</textarea>
                    @error('note')<span class="field-error">{{ $message }}</span>@enderror
                </label>
            </div>
        </section>

        <section class="card mb-22">
            <div class="card-head"><h3>Penempatan Kamar</h3></div>
            <div class="card-body">
                <div class="form-row">
                    <label class="form-field">
                        <span class="form-label">Kamar *</span>
                        <select name="room_id" required>
                            <option value="">Pilih kamar</option>
                            @foreach ($rooms as $room)
                                <option value="{{ $room->id }}" @selected((string) old('room_id', $tenant->room_id) === (string) $room->id)>
                                    {{ $room->number }} · {{ $room->property?->name }} ({{ \App\Support\Labels::label('roomStatus', $room->status) }})
                                </option>
                            @endforeach
                        </select>
                        @error('room_id')<span class="field-error">{{ $message }}</span>@enderror
                    </label>
                    <label class="form-field">
                        <span class="form-label">Tanggal masuk *</span>
                        <input type="date" name="start_date" value="{{ old('start_date', $tenant->start_date?->toDateString()) }}" required>
                        @error('start_date')<span class="field-error">{{ $message }}</span>@enderror
                    </label>
                </div>

                <div class="form-row">
                    <label class="form-field">
                        <span class="form-label">Tanggal keluar</span>
                        <input type="date" name="end_date" value="{{ old('end_date', $tenant->end_date?->toDateString()) }}">
                        <small class="form-hint">Kosongkan jika masa sewa belum ditentukan.</small>
                        @error('end_date')<span class="field-error">{{ $message }}</span>@enderror
                    </label>
                    @unless ($tenant->exists)
                        <label class="form-field">
                            <span class="form-label">Nominal tagihan pertama (Rp)</span>
                            <input type="number" name="amount" value="{{ old('amount') }}" min="0" step="1000" placeholder="Kosongkan untuk memakai harga bulanan kamar">
                            <small class="form-hint">Tagihan otomatis dibuat saat penyewa ditambahkan.</small>
                            @error('amount')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                    @endunless
                </div>

                @if ($tenant->exists)
                    <div class="alert alert-info mb-0">Status penyewa saat ini: {{ \App\Support\Labels::label('tenantStatus', $tenant->status) }}. Gunakan tombol “Akhiri Masa Sewa” pada halaman detail untuk menyelesaikan hunian.</div>
                @endif
            </div>
        </section>

        <div class="form-actions">
            <a class="btn btn-ghost" href="{{ $tenant->exists ? route('tenants.show', $tenant) : route('tenants.index') }}">Batal</a>
            <button class="btn btn-primary" type="submit">{{ $tenant->exists ? 'Simpan Perubahan' : 'Simpan Penyewa' }}</button>
        </div>
    </form>
@endsection
