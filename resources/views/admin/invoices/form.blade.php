@extends('layouts.app')

@section('title', $invoice->exists ? 'Edit Tagihan' : 'Buat Tagihan')

@section('content')
    <div class="page-head">
        <div>
            <h2>{{ $invoice->exists ? 'Edit Tagihan' : 'Buat Tagihan' }}</h2>
            <p class="page-sub">{{ $invoice->exists ? $invoice->code : 'Tagihan manual untuk penyewa, booking, atau keperluan umum.' }}</p>
        </div>
        <a class="btn btn-ghost" href="{{ $invoice->exists ? route('invoices.show', $invoice) : route('invoices.index') }}">Kembali</a>
    </div>

    <form method="POST" action="{{ $invoice->exists ? route('invoices.update', $invoice) : route('invoices.store') }}">
        @csrf
        @if ($invoice->exists)
            @method('PUT')
        @endif

        <section class="card mb-22">
            <div class="card-head"><h3>Detail Tagihan</h3></div>
            <div class="card-body">
                @include('partials.form-errors')

                <label class="form-field">
                    <span class="form-label">Deskripsi *</span>
                    <input type="text" name="description" value="{{ old('description', $invoice->description) }}" required maxlength="255" placeholder="Contoh: Sewa kamar K-101 — November 2026">
                    @error('description')<span class="field-error">{{ $message }}</span>@enderror
                </label>

                <div class="form-row">
                    <label class="form-field">
                        <span class="form-label">Nominal (Rp) *</span>
                        <input type="number" name="amount" value="{{ old('amount', $invoice->amount) }}" required min="0" step="1000">
                        @error('amount')<span class="field-error">{{ $message }}</span>@enderror
                    </label>
                    <label class="form-field">
                        <span class="form-label">Jatuh tempo *</span>
                        <input type="date" name="due_date" value="{{ old('due_date', $invoice->due_date?->toDateString()) }}" required>
                        @error('due_date')<span class="field-error">{{ $message }}</span>@enderror
                    </label>
                </div>

                @unless ($invoice->exists)
                    <div class="form-row">
                        <label class="form-field">
                            <span class="form-label">Penyewa (opsional)</span>
                            <select name="tenant_id">
                                <option value="">- Tidak terkait penyewa -</option>
                                @foreach ($tenants as $tenant)
                                    <option value="{{ $tenant->id }}" @selected((string) old('tenant_id', $invoice->tenant_id) === (string) $tenant->id)>
                                        {{ $tenant->name }} · {{ $tenant->room?->number }}
                                    </option>
                                @endforeach
                            </select>
                            @error('tenant_id')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                        <label class="form-field">
                            <span class="form-label">Booking (opsional)</span>
                            <select name="booking_id">
                                <option value="">- Tidak terkait booking -</option>
                                @foreach ($bookings as $booking)
                                    <option value="{{ $booking->id }}" @selected((string) old('booking_id', $invoice->booking_id) === (string) $booking->id)>
                                        {{ $booking->code }} · {{ $booking->guest_name }} · {{ $booking->room?->number }}
                                    </option>
                                @endforeach
                            </select>
                            @error('booking_id')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                    </div>

                    <div class="form-row">
                        <label class="form-field">
                            <span class="form-label">Kamar (opsional)</span>
                            <select name="room_id">
                                <option value="">- Tidak terkait kamar -</option>
                                @foreach ($rooms as $room)
                                    <option value="{{ $room->id }}" @selected((string) old('room_id', $invoice->room_id) === (string) $room->id)>
                                        {{ $room->number }} · {{ $room->property?->name }}
                                    </option>
                                @endforeach
                            </select>
                            @error('room_id')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                        <label class="form-field">
                            <span class="form-label">Properti (opsional)</span>
                            <select name="property_id">
                                <option value="">- Tidak terkait properti -</option>
                                @foreach ($properties as $property)
                                    <option value="{{ $property->id }}" @selected((string) old('property_id', $invoice->property_id) === (string) $property->id)>{{ $property->name }}</option>
                                @endforeach
                            </select>
                            @error('property_id')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                    </div>

                    <p class="text-muted-sm mb-0">Kode tagihan dibuat otomatis dengan format <span class="mono">INV-####</span>. Status awal adalah belum dibayar.</p>
                @else
                    <div class="alert alert-info mb-0">
                        Kode <strong class="mono">{{ $invoice->code }}</strong> · Status {{ \App\Support\Labels::label('invoiceStatus', $invoice->effectiveStatus()) }}.
                        Keterkaitan penyewa, booking, dan kamar tidak diubah melalui formulir ini.
                    </div>
                @endunless
            </div>
        </section>

        <div class="form-actions">
            <a class="btn btn-ghost" href="{{ $invoice->exists ? route('invoices.show', $invoice) : route('invoices.index') }}">Batal</a>
            <button class="btn btn-primary" type="submit">{{ $invoice->exists ? 'Simpan Perubahan' : 'Simpan Tagihan' }}</button>
        </div>
    </form>
@endsection
