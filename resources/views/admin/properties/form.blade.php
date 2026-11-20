@extends('layouts.app')

@section('title', $property->exists ? 'Edit Properti' : 'Tambah Properti')

@section('content')
    <div class="page-head">
        <div>
            <h2>{{ $property->exists ? 'Edit Properti' : 'Tambah Properti' }}</h2>
            <p class="page-sub">{{ $property->exists ? $property->name : 'Lengkapi informasi properti baru.' }}</p>
        </div>
        <a class="btn btn-ghost" href="{{ $property->exists ? route('properties.show', $property) : route('properties.index') }}">Kembali</a>
    </div>

    <form method="POST" action="{{ $property->exists ? route('properties.update', $property) : route('properties.store') }}">
        @csrf
        @if ($property->exists)
            @method('PUT')
        @endif

        <section class="card">
            <div class="card-body">
                @include('partials.form-errors')

                <label class="form-field">
                    <span class="form-label">Nama properti *</span>
                    <input type="text" name="name" value="{{ old('name', $property->name) }}" required maxlength="150" placeholder="Contoh: Kostantinopel Kost Putri">
                    @error('name')<span class="field-error">{{ $message }}</span>@enderror
                </label>

                <div class="form-row">
                    <label class="form-field">
                        <span class="form-label">Tipe *</span>
                        <select name="type" required>
                            @foreach ($types as $value => $label)
                                <option value="{{ $value }}" @selected(old('type', $property->type) === $value)>{{ $label }}</option>
                            @endforeach
                        </select>
                        @error('type')<span class="field-error">{{ $message }}</span>@enderror
                    </label>

                    <label class="form-field">
                        <span class="form-label">Telepon</span>
                        <input type="text" name="phone" value="{{ old('phone', $property->phone) }}" maxlength="50" placeholder="0812-3456-7890">
                        @error('phone')<span class="field-error">{{ $message }}</span>@enderror
                    </label>
                </div>

                <label class="form-field">
                    <span class="form-label">Alamat</span>
                    <input type="text" name="address" value="{{ old('address', $property->address) }}" maxlength="255" placeholder="Jalan, kota">
                    @error('address')<span class="field-error">{{ $message }}</span>@enderror
                </label>

                <label class="form-field">
                    <span class="form-label">Catatan</span>
                    <textarea name="notes" rows="3" placeholder="Informasi tambahan tentang properti">{{ old('notes', $property->notes) }}</textarea>
                    @error('notes')<span class="field-error">{{ $message }}</span>@enderror
                </label>

                <div class="form-actions">
                    <a class="btn btn-ghost" href="{{ $property->exists ? route('properties.show', $property) : route('properties.index') }}">Batal</a>
                    <button class="btn btn-primary" type="submit">{{ $property->exists ? 'Simpan Perubahan' : 'Simpan Properti' }}</button>
                </div>
            </div>
        </section>
    </form>
@endsection
