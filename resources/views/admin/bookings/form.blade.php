@extends('layouts.app')

@section('title', $booking->exists ? 'Edit Booking' : 'Tambah Booking')

@section('content')
    <div class="page-head">
        <div>
            <h2>{{ $booking->exists ? 'Edit Booking' : 'Tambah Booking' }}</h2>
            <p class="page-sub">{{ $booking->exists ? $booking->code . ' · ' . $booking->guest_name : 'Pilih kamar dan periode menginap.' }}</p>
        </div>
        <a class="btn btn-ghost" href="{{ $booking->exists ? route('bookings.show', $booking) : route('bookings.index') }}">Kembali</a>
    </div>

    <form method="POST"
          action="{{ $booking->exists ? route('bookings.update', $booking) : route('bookings.store') }}"
          data-booking-form
          data-quote-url="{{ route('bookings.quote') }}">
        @csrf
        @if ($booking->exists)
            @method('PUT')
        @endif

        <section class="card mb-22">
            <div class="card-head"><h3>Data Tamu & Kamar</h3></div>
            <div class="card-body">
                @include('partials.form-errors')

                <div class="form-row">
                    <label class="form-field">
                        <span class="form-label">Nama tamu *</span>
                        <input type="text" name="guest_name" value="{{ old('guest_name', $booking->guest_name) }}" required maxlength="120">
                        @error('guest_name')<span class="field-error">{{ $message }}</span>@enderror
                    </label>
                    <label class="form-field">
                        <span class="form-label">Telepon tamu</span>
                        <input type="text" name="guest_phone" value="{{ old('guest_phone', $booking->guest_phone) }}" maxlength="40">
                        @error('guest_phone')<span class="field-error">{{ $message }}</span>@enderror
                    </label>
                </div>

                <div class="form-row">
                    <label class="form-field">
                        <span class="form-label">Kamar *</span>
                        @if ($booking->exists)
                            <input type="hidden" name="room_id" value="{{ $booking->room_id }}">
                            <input type="text" value="{{ $booking->room?->number }} · {{ $booking->room?->property?->name }}" disabled>
                            <small class="form-hint">Kamar tidak dapat diubah saat mengedit booking.</small>
                        @else
                            <select name="room_id" required>
                                <option value="">Pilih kamar</option>
                                @foreach ($rooms as $room)
                                    <option value="{{ $room->id }}" @selected((string) old('room_id', $booking->room_id) === (string) $room->id)>
                                        {{ $room->number }} · {{ $room->property?->name }} — {{ \App\Support\Format::rupiah($room->price_daily) }}/malam
                                    </option>
                                @endforeach
                            </select>
                        @endif
                        @error('room_id')<span class="field-error">{{ $message }}</span>@enderror
                    </label>

                    <label class="form-field">
                        <span class="form-label">Tipe sewa *</span>
                        <select name="rent_type" required>
                            @foreach ($rentTypes as $value => $label)
                                <option value="{{ $value }}" @selected(old('rent_type', $booking->rent_type) === $value)>{{ $label }}</option>
                            @endforeach
                        </select>
                        <small class="form-hint">Mingguan mendapat diskon 10%; bulanan memakai harga bulanan kamar.</small>
                        @error('rent_type')<span class="field-error">{{ $message }}</span>@enderror
                    </label>
                </div>

                <div class="form-row">
                    <label class="form-field">
                        <span class="form-label">Check-in *</span>
                        <input type="date" name="check_in" value="{{ old('check_in', $booking->check_in?->toDateString()) }}" required>
                        @error('check_in')<span class="field-error">{{ $message }}</span>@enderror
                    </label>
                    <label class="form-field">
                        <span class="form-label">Check-out *</span>
                        <input type="date" name="check_out" value="{{ old('check_out', $booking->check_out?->toDateString()) }}" required>
                        @error('check_out')<span class="field-error">{{ $message }}</span>@enderror
                    </label>
                </div>

                <label class="form-field">
                    <span class="form-label">Catatan</span>
                    <textarea name="notes" rows="2">{{ old('notes', $booking->notes) }}</textarea>
                    @error('notes')<span class="field-error">{{ $message }}</span>@enderror
                </label>
            </div>
        </section>

        <div class="grid-2">
            <section class="card">
                <div class="card-head"><h3>Perkiraan Biaya</h3></div>
                <div class="card-body">
                    <div class="quote-box" data-quote>
                        <span class="text-muted-sm">Pilih kamar dan tanggal untuk melihat perkiraan biaya.</span>
                    </div>
                </div>
            </section>

            <section class="card">
                <div class="card-head"><h3>Simpan Booking</h3></div>
                <div class="card-body">
                    <p class="text-muted-sm">Tagihan otomatis dibuat setelah booking disimpan. Status awal booking adalah <strong>Menunggu</strong>.</p>
                    @if ($booking->exists)
                        <p class="text-muted-sm">Kode booking: <strong class="mono">{{ $booking->code }}</strong></p>
                    @endif
                    <div class="form-actions">
                        <a class="btn btn-ghost" href="{{ $booking->exists ? route('bookings.show', $booking) : route('bookings.index') }}">Batal</a>
                        <button class="btn btn-primary" type="submit">{{ $booking->exists ? 'Simpan Perubahan' : 'Simpan Booking' }}</button>
                    </div>
                </div>
            </section>
        </div>
    </form>
@endsection
