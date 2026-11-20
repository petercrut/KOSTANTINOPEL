@extends('layouts.app')

@section('title', $tenant->name)

@section('content')
    <div class="page-head">
        <div>
            <h2>{{ $tenant->name }}</h2>
            <p class="page-sub">
                Kamar {{ $tenant->room?->number ?? '-' }} · {{ $tenant->property?->name ?? '-' }}
                · sejak {{ \App\Support\Format::dateLong($tenant->start_date) }}
            </p>
        </div>
        <div class="actions-row">
            <a class="btn btn-ghost" href="{{ route('tenants.index') }}">Kembali</a>
            <a class="btn btn-ghost" href="{{ route('tenants.edit', $tenant) }}">Edit</a>
            @if ($tenant->status === 'active')
                <form method="POST" action="{{ route('tenants.end', $tenant) }}" data-confirm="Akhiri masa sewa {{ $tenant->name }} hari ini?">
                    @csrf
                    <button class="btn btn-danger-ghost" type="submit">Akhiri Masa Sewa</button>
                </form>
            @endif
        </div>
    </div>

    <div class="stat-grid cols-4">
        <div class="mini-stat">
            <span>Status</span>
            <strong>{{ \App\Support\Labels::label('tenantStatus', $tenant->status) }}</strong>
            <small>{{ $tenant->end_date ? 'Selesai ' . \App\Support\Format::date($tenant->end_date->toDateString()) : 'Tanpa batas akhir' }}</small>
        </div>
        <div class="mini-stat">
            <span>Kamar</span>
            <strong>{{ $tenant->room?->number ?? '-' }}</strong>
            <small>{{ $tenant->room?->type ?? '-' }}</small>
        </div>
        <div class="mini-stat">
            <span>Tagihan Belum Lunas</span>
            <strong>{{ \App\Support\Format::rupiah($outstanding) }}</strong>
            <small>{{ $invoices->where('status', '!=', 'paid')->count() }} tagihan</small>
        </div>
        <div class="mini-stat">
            <span>Total Tagihan</span>
            <strong>{{ $invoices->count() }}</strong>
            <small>{{ \App\Support\Format::rupiah($invoices->sum('amount')) }} nilai keseluruhan</small>
        </div>
    </div>

    <div class="grid-2 wide-left">
        <section class="card">
            <div class="card-head"><h3>Data Diri</h3></div>
            <div class="card-body">
                <div class="detail-grid">
                    <div class="detail-item"><span>Telepon</span><strong>{{ $tenant->phone ?: '-' }}</strong></div>
                    <div class="detail-item"><span>Email</span><strong>{{ $tenant->email ?: '-' }}</strong></div>
                    <div class="detail-item"><span>Nomor identitas</span><strong>{{ $tenant->id_number ?: '-' }}</strong></div>
                    <div class="detail-item"><span>Jenis kelamin</span><strong>{{ $tenant->gender ?: '-' }}</strong></div>
                    <div class="detail-item"><span>Tanggal lahir</span><strong>{{ \App\Support\Format::date($tenant->birth_date?->toDateString()) }}</strong></div>
                    <div class="detail-item"><span>Pekerjaan</span><strong>{{ $tenant->occupation ?: '-' }}</strong></div>
                    <div class="detail-item"><span>Alamat asal</span><strong>{{ $tenant->address ?: '-' }}</strong></div>
                    <div class="detail-item"><span>Kontak darurat</span><strong>{{ $tenant->emergency_name ?: '-' }} @if ($tenant->emergency_phone) · {{ $tenant->emergency_phone }} @endif</strong></div>
                </div>
                @if ($tenant->note)
                    <hr class="sep">
                    <p class="text-muted-sm mb-0">{{ $tenant->note }}</p>
                @endif
            </div>
        </section>

        <section class="card">
            <div class="card-head"><h3>Akun Portal</h3></div>
            <div class="card-body">
                @if ($tenant->user)
                    <div class="detail-grid mb-16">
                        <div class="detail-item"><span>Email login</span><strong>{{ $tenant->user->email }}</strong></div>
                        <div class="detail-item"><span>Dibuat</span><strong>{{ \App\Support\Format::dateLong($tenant->user->created_at) }}</strong></div>
                    </div>

                    <form method="POST" action="{{ route('tenants.account.password', $tenant) }}" class="mb-16">
                        @csrf
                        @method('PUT')
                        <label class="form-field">
                            <span class="form-label">Reset password</span>
                            <input type="text" name="password" minlength="6" required placeholder="Password baru minimal 6 karakter">
                            @error('password')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                        <button class="btn btn-ghost btn-sm" type="submit">Simpan Password Baru</button>
                    </form>

                    <form method="POST" action="{{ route('tenants.account.destroy', $tenant) }}" data-confirm="Hapus akun login {{ $tenant->user->email }}? Penyewa tidak akan bisa masuk ke portal.">
                        @csrf
                        @method('DELETE')
                        <button class="btn btn-danger-ghost btn-sm" type="submit">Hapus Akun Login</button>
                    </form>
                @else
                    <p class="text-muted-sm">Penyewa ini belum memiliki akun portal. Buat akun agar penyewa dapat membayar tagihan dan mengirim laporan secara mandiri.</p>
                    <form method="POST" action="{{ route('tenants.account.store', $tenant) }}">
                        @csrf
                        <label class="form-field">
                            <span class="form-label">Email login</span>
                            <input type="email" name="email" value="{{ old('email', $tenant->email) }}" required maxlength="190">
                            @error('email')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                        <label class="form-field">
                            <span class="form-label">Password awal</span>
                            <input type="text" name="password" minlength="6" required placeholder="Minimal 6 karakter">
                            @error('password')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                        <button class="btn btn-primary btn-sm" type="submit">Buat Akun Portal</button>
                    </form>
                @endif
            </div>
        </section>
    </div>

    <section class="card mb-22">
        <div class="card-head">
            <h3>Tagihan Penyewa</h3>
            <a class="card-link" href="{{ route('invoices.create', ['tenant_id' => $tenant->id]) }}">Buat tagihan</a>
        </div>
        <div class="card-body no-pad table-wrap">
            <table class="table">
                <thead>
                    <tr>
                        <th>Kode</th>
                        <th>Deskripsi</th>
                        <th>Jatuh Tempo</th>
                        <th class="num">Nominal</th>
                        <th>Status</th>
                        <th class="right">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($invoices as $invoice)
                        <tr>
                            <td><a href="{{ route('invoices.show', $invoice) }}" class="mono">{{ $invoice->code }}</a></td>
                            <td>{{ $invoice->description }}</td>
                            <td class="nowrap">{{ \App\Support\Format::date($invoice->due_date?->toDateString()) }}</td>
                            <td class="num">{{ \App\Support\Format::rupiah($invoice->amount) }}</td>
                            <td><x-status-badge :status="$invoice->effectiveStatus()" group="invoiceStatus" /></td>
                            <td class="actions"><a class="btn btn-ghost btn-sm" href="{{ route('invoices.show', $invoice) }}">Detail</a></td>
                        </tr>
                    @empty
                        <tr><td colspan="6"><div class="empty-state"><p>Belum ada tagihan</p></div></td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </section>

    <section class="card mb-22">
        <div class="card-head"><h3>Laporan & Kendala</h3></div>
        <div class="card-body">
            <div class="request-list">
                @forelse ($requests as $requestModel)
                    <article class="request-card">
                        <div class="request-head">
                            <div>
                                <span class="request-title">{{ $requestModel->title }}</span>
                                <div class="request-meta">
                                    <span class="mono">{{ $requestModel->code }}</span>
                                    <span>·</span>
                                    <span>{{ \App\Support\Labels::label('requestCategory', $requestModel->category) }}</span>
                                    <span>·</span>
                                    <span>{{ \App\Support\Format::dateLong($requestModel->created_at) }}</span>
                                </div>
                            </div>
                            <div class="request-head-side">
                                <x-status-badge :status="$requestModel->status" group="requestStatus" />
                            </div>
                        </div>
                        <p class="request-desc">{{ $requestModel->description }}</p>
                        @if ($requestModel->response)
                            <div class="request-response"><strong>Tanggapan:</strong> {{ $requestModel->response }}</div>
                        @endif
                    </article>
                @empty
                    <div class="empty-state"><p>Belum ada laporan</p></div>
                @endforelse
            </div>
        </div>
    </section>

    @if ($tenant->status !== 'active')
        <section class="card">
            <div class="card-head"><h3>Hapus Data Penyewa</h3></div>
            <div class="card-body row-between">
                <p class="text-muted-sm mb-0">Penyewa yang sudah tidak aktif dapat dihapus. Riwayat tagihan juga akan terhapus.</p>
                <form method="POST" action="{{ route('tenants.destroy', $tenant) }}" data-confirm="Hapus data penyewa {{ $tenant->name }}? Tindakan ini tidak dapat dibatalkan.">
                    @csrf
                    @method('DELETE')
                    <button class="btn btn-danger-ghost" type="submit">Hapus Penyewa</button>
                </form>
            </div>
        </section>
    @endif
@endsection
