@extends('layouts.app')

@section('title', $room->exists ? 'Edit Kamar' : 'Tambah Kamar')

@section('content')
    @php
        $facilityValue = old('facilities', is_array($room->facilities) ? implode(', ', $room->facilities) : $room->facilities);
    @endphp

    <div class="page-head">
        <div>
            <h2>{{ $room->exists ? 'Edit Kamar' : 'Tambah Kamar' }}</h2>
            <p class="page-sub">{{ $room->exists ? 'Kamar ' . $room->number : 'Lengkapi data kamar baru.' }}</p>
        </div>
        <a class="btn btn-ghost" href="{{ $room->exists ? route('rooms.show', $room) : route('rooms.index') }}">Kembali</a>
    </div>

    <form method="POST" action="{{ $room->exists ? route('rooms.update', $room) : route('rooms.store') }}">
        @csrf
        @if ($room->exists)
            @method('PUT')
        @endif

        <section class="card">
            <div class="card-body">
                @include('partials.form-errors')

                <div class="form-row">
                    <label class="form-field">
                        <span class="form-label">Properti *</span>
                        <select name="property_id" required>
                            <option value="">Pilih properti</option>
                            @foreach ($properties as $property)
                                <option value="{{ $property->id }}" @selected((string) old('property_id', $room->property_id) === (string) $property->id)>{{ $property->name }}</option>
                            @endforeach
                        </select>
                        @error('property_id')<span class="field-error">{{ $message }}</span>@enderror
                    </label>

                    <label class="form-field">
                        <span class="form-label">Nomor kamar *</span>
                        <input type="text" name="number" value="{{ old('number', $room->number) }}" required maxlength="30" placeholder="Contoh: K-101">
                        @error('number')<span class="field-error">{{ $message }}</span>@enderror
                    </label>
                </div>

                <div class="form-grid-3">
                    <label class="form-field">
                        <span class="form-label">Tipe kamar *</span>
                        <input type="text" name="type" value="{{ old('type', $room->type) }}" required maxlength="60" placeholder="Single / Double / Suite">
                        @error('type')<span class="field-error">{{ $message }}</span>@enderror
                    </label>

                    <label class="form-field">
                        <span class="form-label">Kapasitas *</span>
                        <input type="number" name="capacity" value="{{ old('capacity', $room->capacity) }}" required min="1" max="20">
                        @error('capacity')<span class="field-error">{{ $message }}</span>@enderror
                    </label>

                    <label class="form-field">
                        <span class="form-label">Status *</span>
                        <select name="status" required>
                            @foreach ($statuses as $value => $label)
                                <option value="{{ $value }}" @selected(old('status', $room->status) === $value)>{{ $label }}</option>
                            @endforeach
                        </select>
                        @error('status')<span class="field-error">{{ $message }}</span>@enderror
                    </label>
                </div>

                <div class="form-row">
                    <label class="form-field">
                        <span class="form-label">Harga harian (Rp) *</span>
                        <input type="number" name="price_daily" value="{{ old('price_daily', $room->price_daily) }}" required min="0" step="1000">
                        @error('price_daily')<span class="field-error">{{ $message }}</span>@enderror
                    </label>

                    <label class="form-field">
                        <span class="form-label">Harga bulanan (Rp) *</span>
                        <input type="number" name="price_monthly" value="{{ old('price_monthly', $room->price_monthly) }}" required min="0" step="1000">
                        @error('price_monthly')<span class="field-error">{{ $message }}</span>@enderror
                    </label>
                </div>

                <label class="form-field">
                    <span class="form-label">Fasilitas</span>
                    <textarea name="facilities" rows="2" placeholder="WiFi, AC, Kamar Mandi Dalam">{{ $facilityValue }}</textarea>
                    <small class="form-hint">Pisahkan fasilitas dengan koma.</small>
                    @error('facilities')<span class="field-error">{{ $message }}</span>@enderror
                </label>

                <div class="form-actions">
                    <a class="btn btn-ghost" href="{{ $room->exists ? route('rooms.show', $room) : route('rooms.index') }}">Batal</a>
                    <button class="btn btn-primary" type="submit">{{ $room->exists ? 'Simpan Perubahan' : 'Simpan Kamar' }}</button>
                </div>
            </div>
        </section>
    </form>
@endsection
