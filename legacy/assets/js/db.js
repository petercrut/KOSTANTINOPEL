/* ============================================================
   Kostantinopel — db.js
   Lapisan data berbasis localStorage + logika bisnis.
   Struktur data mudah dipetakan ke backend/API di kemudian hari.
   ============================================================ */
window.KOL = window.KOL || {};

KOL.db = (function () {
  'use strict';

  var U = KOL.utils;
  var KEY = 'kostantinopel.db.v1';
  var state = null;

  var L = {
    propertyType: { kost: 'Kost', kontrakan: 'Kontrakan', apartemen: 'Apartemen', hotel: 'Hotel' },
    roomStatus: { available: 'Tersedia', occupied: 'Terisi', maintenance: 'Perawatan' },
    tenantStatus: { active: 'Aktif', inactive: 'Selesai' },
    bookingStatus: { pending: 'Menunggu', confirmed: 'Terkonfirmasi', checkin: 'Check-in', checkedout: 'Check-out', cancelled: 'Dibatalkan' },
    invoiceStatus: { unpaid: 'Belum Bayar', late: 'Terlambat', paid: 'Lunas' },
    rentType: { harian: 'Harian', mingguan: 'Mingguan', bulanan: 'Bulanan' },
    method: { Tunai: 'Tunai', Transfer: 'Transfer Bank', QRIS: 'QRIS', 'Kartu Debit': 'Kartu Debit' },
    role: { admin: 'Admin / Pemilik', tenant: 'Penyewa' },
    requestCategory: {
      perbaikan: 'Perbaikan', kebersihan: 'Kebersihan', keamanan: 'Keamanan',
      keluhan: 'Keluhan', lainnya: 'Lainnya'
    },
    requestStatus: { open: 'Baru', in_progress: 'Diproses', done: 'Selesai', rejected: 'Ditolak' },
    requestPriority: { low: 'Rendah', normal: 'Normal', high: 'Tinggi' }
  };

  function emptyState() {
    return {
      users: [], session: null,
      properties: [], rooms: [], tenants: [], bookings: [], invoices: [],
      requests: [], announcements: [],
      counters: { inv: 0, bk: 0, req: 0 },
      seededAt: null
    };
  }

  /* ============================================================
     SEED — data demo (tanggal relatif terhadap hari ini)
     ============================================================ */
  function seed() {
    var s = emptyState();
    var now = new Date().toISOString();
    var today = U.todayISO();
    var currentMK = U.currentMonthKey();

    var salt = U.randomSalt();
    s.users.push({
      id: 'usr_admin', name: 'Admin Kostantinopel', email: 'admin@kostantinopel.id',
      passwordHash: 's0$' + salt + '$' + U.cyrb53(salt + ':admin123'),
      role: 'admin', createdAt: now
    });

    var pKost = { id: 'prp_kost', name: 'Kostantinopel Kost Putri', type: 'kost', address: 'Jl. Anggrek No. 12, Bandung', phone: '0812-3456-7890', notes: 'Kost khusus putri, 2 lantai.', createdAt: now };
    var pHotel = { id: 'prp_hotel', name: 'Hotel Kolonia', type: 'hotel', address: 'Jl. Kenanga No. 5, Jakarta', phone: '021-555-0199', notes: 'Hotel butik, 3 lantai.', createdAt: now };
    s.properties.push(pKost, pHotel);

    function room(id, propertyId, number, type, capacity, priceDaily, priceMonthly, facilities, status) {
      return {
        id: id, propertyId: propertyId, number: number, type: type, capacity: capacity,
        priceDaily: priceDaily, priceMonthly: priceMonthly,
        facilities: facilities, status: status || 'available', createdAt: now
      };
    }
    s.rooms.push(
      room('rm_k101', pKost.id, 'K-101', 'Single', 1, 50000, 850000, ['WiFi', 'AC', 'Kamar Mandi Dalam', 'Lemari']),
      room('rm_k102', pKost.id, 'K-102', 'Double', 2, 80000, 1200000, ['WiFi', 'AC', 'Kamar Mandi Dalam', 'Balkon']),
      room('rm_k103', pKost.id, 'K-103', 'Single', 1, 50000, 850000, ['WiFi', 'AC', 'Kamar Mandi Dalam']),
      room('rm_k104', pKost.id, 'K-104', 'Double', 2, 80000, 1200000, ['WiFi', 'AC', 'Kamar Mandi Dalam', 'TV']),
      room('rm_k105', pKost.id, 'K-105', 'Single', 1, 50000, 850000, ['WiFi', 'AC', 'Kamar Mandi Dalam', 'Meja Kerja']),
      room('rm_k106', pKost.id, 'K-106', 'Single', 1, 45000, 800000, ['WiFi', 'Kamar Mandi Dalam']),
      room('rm_h201', pHotel.id, 'H-201', 'Superior', 2, 350000, 9000000, ['WiFi', 'AC', 'TV', 'Breakfast', 'Kamar Mandi Dalam']),
      room('rm_h202', pHotel.id, 'H-202', 'Superior', 2, 350000, 9000000, ['WiFi', 'AC', 'TV', 'Breakfast', 'Kamar Mandi Dalam']),
      room('rm_h203', pHotel.id, 'H-203', 'Deluxe', 2, 450000, 11000000, ['WiFi', 'AC', 'TV', 'Breakfast', 'Balkon', 'Kamar Mandi Dalam']),
      room('rm_h204', pHotel.id, 'H-204', 'Deluxe', 2, 450000, 11000000, ['WiFi', 'AC', 'TV', 'Breakfast', 'Balkon', 'Kamar Mandi Dalam']),
      room('rm_h205', pHotel.id, 'H-205', 'Suite', 4, 750000, 18000000, ['WiFi', 'AC', 'TV', 'Breakfast', 'Living Room', 'Kamar Mandi Dalam']),
      room('rm_h206', pHotel.id, 'H-206', 'Suite', 4, 750000, 18000000, ['WiFi', 'AC', 'TV', 'Breakfast', 'Living Room', 'Kamar Mandi Dalam'])
    );

    function tenant(id, name, phone, idNumber, roomId, startDaysAgo, extra) {
      var rm = s.rooms.find(function (r) { return r.id === roomId; });
      var data = {
        id: id, name: name, phone: phone, idNumber: idNumber,
        email: '', address: '', birthDate: '', gender: '', occupation: '',
        emergencyName: '', emergencyPhone: '',
        propertyId: rm.propertyId, roomId: roomId,
        startDate: U.addDays(today, -startDaysAgo), endDate: null,
        status: 'active', note: '', createdAt: now
      };
      Object.keys(extra || {}).forEach(function (k) { data[k] = extra[k]; });
      return data;
    }
    s.tenants.push(
      tenant('tnt_siti', 'Siti Rahma', '0811-1000-0001', '3273012345670001', 'rm_k101', 92, {
        email: 'siti@kostantinopel.id',
        address: 'Jl. Anggrek No. 12, Bandung',
        birthDate: '1998-04-12', gender: 'Perempuan', occupation: 'Desainer Grafis',
        emergencyName: 'Rahmat Hidayat', emergencyPhone: '0812-9000-1111'
      }),
      tenant('tnt_dewi', 'Dewi Lestari', '0811-1000-0002', '3273012345670002', 'rm_k102', 45, {
        email: 'dewi@kostantinopel.id', address: 'Jl. Melati No. 3, Bandung',
        birthDate: '1995-09-21', gender: 'Perempuan', occupation: 'Guru'
      }),
      tenant('tnt_budi', 'Budi Santoso', '0811-1000-0003', '3273012345670003', 'rm_k104', 76, {
        email: 'budi@kostantinopel.id', gender: 'Laki-laki', occupation: 'Karyawan Swasta'
      }),
      tenant('tnt_rina', 'Rina Marlina', '0811-1000-0004', '3273012345670004', 'rm_k105', 2, {
        email: 'rina@kostantinopel.id', gender: 'Perempuan', occupation: 'Mahasiswa'
      })
    );

    /* Akun login penyewa (demo) — terhubung ke data penyewa Siti Rahma */
    var tenantSalt = U.randomSalt();
    s.users.push({
      id: 'usr_tenant_siti', name: 'Siti Rahma', email: 'siti@kostantinopel.id',
      passwordHash: 's0$' + tenantSalt + '$' + U.cyrb53(tenantSalt + ':siti123'),
      role: 'tenant', tenantId: 'tnt_siti', createdAt: now
    });

    function monthsFrom(startIso) {
      var keys = [];
      var cursor = startIso.slice(0, 7);
      var guard = 0;
      while (cursor <= currentMK && guard < 24) {
        keys.push(cursor);
        cursor = U.monthKey(U.addMonths(cursor + '-01', 1));
        guard++;
      }
      return keys;
    }

    var tenantCfg = { tnt_siti: 'currentUnpaid', tnt_dewi: 'paid', tnt_budi: 'currentUnpaid', tnt_rina: 'currentUnpaid' };
    Object.keys(tenantCfg).forEach(function (tid) {
      var t = s.tenants.find(function (x) { return x.id === tid; });
      var keys = monthsFrom(t.startDate);
      keys.forEach(function (mk, i) {
        var rm = s.rooms.find(function (r) { return r.id === t.roomId; });
        var dueDate = i === 0 ? U.addDays(t.startDate, 5) : mk + '-05';
        var paid = tenantCfg[tid] === 'paid' ? true : (mk < currentMK);
        s.invoices.push({
          id: 'inv_' + tid + '_' + i, code: null,
          bookingId: null, tenantId: t.id,
          propertyId: rm.propertyId, roomId: rm.id,
          description: 'Sewa kamar ' + rm.number + ' — ' + U.monthLabel(mk),
          amount: rm.priceMonthly, dueDate: dueDate,
          status: paid ? 'paid' : 'unpaid',
          paidAt: paid ? U.addDays(dueDate, 1) : null,
          method: paid ? 'Transfer' : null,
          createdAt: now
        });
      });
    });

    function booking(code, guestName, guestPhone, roomId, inDays, outDays, rentType, status, createdAtDaysAgo, paid) {
      var rm = s.rooms.find(function (r) { return r.id === roomId; });
      var checkIn = U.addDays(today, inDays);
      var checkOut = U.addDays(today, outDays);
      var calc = computeBookingTotal(rm, checkIn, checkOut, rentType);
      var b = {
        id: 'bk_' + code, code: null,
        tenantId: null, guestName: guestName, guestPhone: guestPhone,
        propertyId: rm.propertyId, roomId: rm.id,
        checkIn: checkIn, checkOut: checkOut,
        rentType: rentType, days: calc.days, units: calc.units, unitLabel: calc.label,
        total: calc.amount, status: status, notes: '',
        createdAt: new Date(Date.now() - createdAtDaysAgo * 86400000).toISOString()
      };
      s.bookings.push(b);
      s.invoices.push({
        id: 'inv_bk_' + code, code: null,
        bookingId: b.id, tenantId: null,
        propertyId: rm.propertyId, roomId: rm.id,
        description: 'Booking BK-' + code + ' — Kamar ' + rm.number + ' (' + calc.units + ' ' + calc.label + ')',
        amount: calc.amount,
        dueDate: checkOut,
        status: paid ? 'paid' : 'unpaid',
        paidAt: paid ? checkOut : null,
        method: paid ? 'Transfer' : null,
        createdAt: b.createdAt
      });
    }
    booking('0001', 'Andi Wijaya', '0813-2000-0011', 'rm_h201', -4, -2, 'harian', 'checkedout', 5, true);
    booking('0002', 'Sari Nurhaliza', '0813-2000-0022', 'rm_h203', 0, 2, 'harian', 'checkin', 3, false);
    booking('0003', 'Bambang Wibowo', '0813-2000-0033', 'rm_h205', 3, 5, 'harian', 'pending', 1, false);

    s.invoices.forEach(function (inv, i) { inv.code = 'INV-' + String(i + 1).padStart(4, '0'); });
    s.bookings.forEach(function (b, i) { b.code = 'BK-' + String(i + 1).padStart(4, '0'); });

    /* Pengumuman dari pengelola */
    s.announcements.push(
      {
        id: 'ann_air', title: 'Pemeliharaan Air Lantai 2', pinned: true,
        body: 'Pemeliharaan pompa air akan dilakukan Sabtu ini pukul 09.00–12.00. Air mungkin mati sementara. Mohon siapkan cadangan air untuk kebutuhan mendesak.',
        propertyId: 'prp_kost', author: 'Admin Kostantinopel',
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
      },
      {
        id: 'ann_tamu', title: 'Aturan Tamu Menginap', pinned: false,
        body: 'Tamu yang menginap lebih dari pukul 22.00 wajib melapor ke pengelola dan mencatat identitas di buku tamu. Terima kasih atas kerja samanya.',
        propertyId: null, author: 'Admin Kostantinopel',
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
      },
      {
        id: 'ann_promo', title: 'Promo Perpanjangan Sewa', pinned: false,
        body: 'Perpanjangan sewa 6 bulan sebelum jatuh tempo mendapat potongan Rp 100.000. Hubungi pengelola untuk informasi lebih lanjut.',
        propertyId: 'prp_kost', author: 'Admin Kostantinopel',
        createdAt: new Date(Date.now() - 8 * 86400000).toISOString()
      }
    );

    /* Laporan / permintaan penyewa */
    s.requests.push(
      {
        id: 'req_ac', code: 'REQ-0001',
        tenantId: 'tnt_siti', propertyId: 'prp_kost', roomId: 'rm_k101',
        category: 'perbaikan', priority: 'normal',
        title: 'AC kurang dingin', description: 'AC di kamar sudah tidak dingin sejak dua hari lalu. Mohon diperiksa.',
        status: 'in_progress', response: 'Teknisi dijadwalkan datang besok pukul 10.00.',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
      },
      {
        id: 'req_lampu', code: 'REQ-0002',
        tenantId: 'tnt_siti', propertyId: 'prp_kost', roomId: 'rm_k101',
        category: 'perbaikan', priority: 'high',
        title: 'Lampu kamar mandi mati', description: 'Lampu kamar mandi dalam kamar mati sejak semalam. Mohon diganti.',
        status: 'open', response: '',
        createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 6 * 3600000).toISOString()
      }
    );

    s.counters.inv = s.invoices.length;
    s.counters.bk = s.bookings.length;
    s.counters.req = s.requests.length;
    s.demoContent = true;
    s.seededAt = now;
    return s;
  }

  /* ============================================================
     MIGRASI — melengkapi data lama agar mendukung peran & portal
     ============================================================ */
  function migrate(st) {
    var changed = false;

    ['users', 'properties', 'rooms', 'tenants', 'bookings', 'invoices', 'requests', 'announcements'].forEach(function (k) {
      if (!Array.isArray(st[k])) { st[k] = []; changed = true; }
    });
    if (!st.counters) { st.counters = { inv: 0, bk: 0, req: 0 }; changed = true; }
    if (typeof st.counters.inv !== 'number') { st.counters.inv = st.invoices.length; changed = true; }
    if (typeof st.counters.bk !== 'number') { st.counters.bk = st.bookings.length; changed = true; }
    if (typeof st.counters.req !== 'number') { st.counters.req = st.requests.length; changed = true; }
    if (typeof st.session === 'undefined') { st.session = null; changed = true; }

    st.users.forEach(function (u) {
      if (!u.role) { u.role = 'admin'; changed = true; }
    });

    st.tenants.forEach(function (t) {
      ['email', 'address', 'birthDate', 'gender', 'occupation', 'emergencyName', 'emergencyPhone'].forEach(function (k) {
        if (typeof t[k] === 'undefined') { t[k] = ''; changed = true; }
      });
    });

    /* Pastikan akun login penyewa demo tetap ada pada data lama */
    var siti = st.tenants.find(function (t) { return t.id === 'tnt_siti'; });
    if (siti) {
      if (!siti.email) { siti.email = 'siti@kostantinopel.id'; changed = true; }
      var hasAccount = st.users.some(function (u) { return u.tenantId === 'tnt_siti'; });
      if (!hasAccount) {
        var salt = U.randomSalt();
        st.users.push({
          id: 'usr_tenant_siti', name: siti.name, email: 'siti@kostantinopel.id',
          passwordHash: 's0$' + salt + '$' + U.cyrb53(salt + ':siti123'),
          role: 'tenant', tenantId: 'tnt_siti', createdAt: new Date().toISOString()
        });
        changed = true;
      }
    }

    /* Data demo portal (pengumuman & laporan) untuk basis data lama */
    if (!st.demoContent) {
      if (!st.announcements.length) {
        st.announcements.push(
          {
            id: 'ann_air', title: 'Pemeliharaan Air Lantai 2', pinned: true,
            body: 'Pemeliharaan pompa air akan dilakukan Sabtu ini pukul 09.00–12.00. Air mungkin mati sementara. Mohon siapkan cadangan air untuk kebutuhan mendesak.',
            propertyId: 'prp_kost', author: 'Admin Kostantinopel',
            createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
          },
          {
            id: 'ann_tamu', title: 'Aturan Tamu Menginap', pinned: false,
            body: 'Tamu yang menginap lebih dari pukul 22.00 wajib melapor ke pengelola dan mencatat identitas di buku tamu. Terima kasih atas kerja samanya.',
            propertyId: null, author: 'Admin Kostantinopel',
            createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
          },
          {
            id: 'ann_promo', title: 'Promo Perpanjangan Sewa', pinned: false,
            body: 'Perpanjangan sewa 6 bulan sebelum jatuh tempo mendapat potongan Rp 100.000. Hubungi pengelola untuk informasi lebih lanjut.',
            propertyId: 'prp_kost', author: 'Admin Kostantinopel',
            createdAt: new Date(Date.now() - 8 * 86400000).toISOString()
          }
        );
      }
      if (!st.requests.length && siti) {
        st.requests.push(
          {
            id: 'req_ac', code: 'REQ-0001',
            tenantId: siti.id, propertyId: siti.propertyId, roomId: siti.roomId,
            category: 'perbaikan', priority: 'normal',
            title: 'AC kurang dingin', description: 'AC di kamar sudah tidak dingin sejak dua hari lalu. Mohon diperiksa.',
            status: 'in_progress', response: 'Teknisi dijadwalkan datang besok pukul 10.00.',
            createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
          },
          {
            id: 'req_lampu', code: 'REQ-0002',
            tenantId: siti.id, propertyId: siti.propertyId, roomId: siti.roomId,
            category: 'perbaikan', priority: 'high',
            title: 'Lampu kamar mandi mati', description: 'Lampu kamar mandi dalam kamar mati sejak semalam. Mohon diganti.',
            status: 'open', response: '',
            createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
            updatedAt: new Date(Date.now() - 6 * 3600000).toISOString()
          }
        );
      }
      st.counters.req = Math.max(st.counters.req || 0, st.requests.length);
      st.demoContent = true;
      changed = true;
    }

    return changed;
  }

  /* ============================================================
     LOAD / SAVE
     ============================================================ */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') throw new Error('invalid');
        state = parsed;
        if (migrate(state)) save();
      } else {
        state = seed();
        save();
      }
    } catch (e) {
      state = seed();
      save();
    }
    return state;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* penyimpanan penuh */ }
  }

  function get() { if (!state) load(); return state; }

  function reset() { state = seed(); save(); return state; }

  /* ============================================================
     CRUD
     ============================================================ */
  function all(coll) { get(); return state[coll].slice(); }
  function find(coll, id) { get(); return state[coll].find(function (x) { return x.id === id; }) || null; }
  function insert(coll, item) {
    get();
    item.id = item.id || U.uid(coll.slice(0, 3));
    item.createdAt = item.createdAt || new Date().toISOString();
    state[coll].push(item);
    save();
    return item;
  }
  function update(coll, id, patch) {
    get();
    var item = state[coll].find(function (x) { return x.id === id; });
    if (!item) return null;
    Object.keys(patch).forEach(function (k) { item[k] = patch[k]; });
    item.updatedAt = new Date().toISOString();
    save();
    return item;
  }
  function remove(coll, id) {
    get();
    var idx = state[coll].findIndex(function (x) { return x.id === id; });
    if (idx === -1) return false;
    state[coll].splice(idx, 1);
    save();
    return true;
  }
  function nextCode(kind) {
    get();
    state.counters[kind] = (state.counters[kind] || 0) + 1;
    var prefix = kind === 'inv' ? 'INV-' : kind === 'req' ? 'REQ-' : 'BK-';
    return prefix + String(state.counters[kind]).padStart(4, '0');
  }

  /* ============================================================
     SELEKTOR & STATUS
     ============================================================ */
  function propertyById(id) { return find('properties', id); }
  function roomById(id) { return find('rooms', id); }
  function roomLabel(room) {
    if (!room) return '-';
    var p = propertyById(room.propertyId);
    return (p ? p.name : 'Properti') + ' · ' + room.number;
  }
  function tenantsOfRoom(roomId) {
    get();
    return state.tenants.filter(function (t) { return t.roomId === roomId && t.status === 'active'; });
  }
  function isTenantActive(t) {
    if (!t || t.status !== 'active') return false;
    var today = U.todayISO();
    return !t.endDate || t.endDate >= today;
  }
  function isTenantInPeriod(t, fromIso, toIso) {
    if (!isTenantActive(t)) return false;
    var end = t.endDate || '9999-12-31';
    return t.startDate <= toIso && end >= fromIso;
  }
  /* Booking dengan status ini dianggap menduduki kamar (termasuk reservasi pending) */
  var OCCUPYING_BOOKING_STATUSES = ['pending', 'confirmed', 'checkin'];

  function roomEffectiveStatus(room) {
    if (!room) return 'unknown';
    if (room.status === 'maintenance') return 'maintenance';
    var today = U.todayISO();
    get();
    var occupied = state.tenants.some(function (t) { return t.roomId === room.id && isTenantInPeriod(t, today, today); });
    if (!occupied) {
      occupied = state.bookings.some(function (b) {
        return b.roomId === room.id && OCCUPYING_BOOKING_STATUSES.indexOf(b.status) !== -1 &&
          b.checkIn <= today && b.checkOut >= today;
      });
    }
    return occupied ? 'occupied' : 'available';
  }
  function isRoomAvailable(roomId, fromIso, toIso, excludeBookingId) {
    var room = roomById(roomId);
    if (!room) return false;
    if (room.status === 'maintenance') return false;
    get();
    var clashTenant = state.tenants.some(function (t) { return t.roomId === roomId && isTenantInPeriod(t, fromIso, toIso); });
    if (clashTenant) return false;
    var clashBooking = state.bookings.some(function (b) {
      if (b.id === excludeBookingId) return false;
      return b.roomId === roomId && OCCUPYING_BOOKING_STATUSES.indexOf(b.status) !== -1 &&
        b.checkIn <= toIso && b.checkOut >= fromIso;
    });
    return !clashBooking;
  }

  /* ============================================================
     BOOKING
     ============================================================ */
  function rentUnits(room, checkIn, checkOut, rentType) {
    var days = Math.max(1, U.daysBetween(checkIn, checkOut));
    if (rentType === 'mingguan') return { units: Math.max(1, Math.ceil(days / 7)), label: 'minggu', days: days };
    if (rentType === 'bulanan') return { units: Math.max(1, Math.ceil(days / 30)), label: 'bulan', days: days };
    return { units: days, label: 'malam', days: days };
  }
  function computeBookingTotal(room, checkIn, checkOut, rentType) {
    var u = rentUnits(room, checkIn, checkOut, rentType);
    if (rentType === 'mingguan') u.amount = Math.round(u.units * (room.priceDaily || 0) * 7 * 0.9);
    else if (rentType === 'bulanan') u.amount = u.units * (room.priceMonthly || 0);
    else u.amount = u.units * (room.priceDaily || 0);
    return u;
  }
  function createBooking(data) {
    var room = roomById(data.roomId);
    if (!room) throw new Error('Kamar tidak ditemukan');
    if (!data.checkIn || !data.checkOut || data.checkOut <= data.checkIn) throw new Error('Periode tanggal tidak valid');
    if (!data.guestName || !data.guestName.trim()) throw new Error('Nama tamu wajib diisi');
    if (!isRoomAvailable(room.id, data.checkIn, data.checkOut, null)) throw new Error('Kamar tidak tersedia pada periode tersebut');
    var calc = computeBookingTotal(room, data.checkIn, data.checkOut, data.rentType);
    var booking = insert('bookings', {
      code: nextCode('bk'),
      tenantId: null,
      guestName: data.guestName.trim(),
      guestPhone: data.guestPhone || '',
      propertyId: room.propertyId,
      roomId: room.id,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      rentType: data.rentType,
      days: calc.days,
      units: calc.units,
      unitLabel: calc.label,
      total: calc.amount,
      status: 'pending',
      notes: data.notes || ''
    });
    insert('invoices', {
      code: nextCode('inv'),
      bookingId: booking.id, tenantId: null,
      propertyId: room.propertyId, roomId: room.id,
      description: 'Booking ' + booking.code + ' — Kamar ' + room.number + ' (' + calc.units + ' ' + calc.label + ')',
      amount: calc.amount,
      dueDate: data.rentType === 'bulanan' ? data.checkIn : data.checkOut,
      status: 'unpaid', paidAt: null, method: null
    });
    return booking;
  }
  function setBookingStatus(id, status) {
    var b = find('bookings', id);
    if (!b) throw new Error('Booking tidak ditemukan');
    var allowed = { pending: ['confirmed', 'cancelled'], confirmed: ['checkin', 'cancelled'], checkin: ['checkedout'], checkedout: [], cancelled: [] };
    if (allowed[b.status].indexOf(status) === -1) throw new Error('Status booking tidak dapat diubah');
    if (status === 'confirmed' && !isRoomAvailable(b.roomId, b.checkIn, b.checkOut, b.id)) {
      throw new Error('Kamar sudah dipesan pada periode tersebut');
    }
    return update('bookings', id, { status: status });
  }
  function bookingUnpaidInvoices(bookingId) {
    get();
    return state.invoices.filter(function (i) { return i.bookingId === bookingId && i.status !== 'paid'; });
  }
  function deleteBooking(id) {
    get();
    var hasPaid = state.invoices.some(function (i) { return i.bookingId === id && i.status === 'paid'; });
    if (hasPaid) throw new Error('Booking memiliki tagihan lunas dan tidak dapat dihapus');
    state.invoices = state.invoices.filter(function (i) { return i.bookingId !== id; });
    remove('bookings', id);
    return true;
  }

  /* ============================================================
     PENYEWA
     ============================================================ */
  function createTenant(data) {
    var room = roomById(data.roomId);
    if (!room) throw new Error('Kamar tidak ditemukan');
    if (!data.name || !data.name.trim()) throw new Error('Nama penyewa wajib diisi');
    if (!data.startDate) throw new Error('Tanggal masuk wajib diisi');
    get();
    var occupant = state.tenants.find(function (t) { return t.roomId === room.id && t.status === 'active'; });
    if (occupant) throw new Error('Kamar ' + room.number + ' sudah dihuni oleh ' + occupant.name);
    var tenant = insert('tenants', {
      name: data.name.trim(), phone: data.phone || '', idNumber: data.idNumber || '',
      email: data.email || '', address: data.address || '', birthDate: data.birthDate || '',
      gender: data.gender || '', occupation: data.occupation || '',
      emergencyName: data.emergencyName || '', emergencyPhone: data.emergencyPhone || '',
      propertyId: room.propertyId, roomId: room.id,
      startDate: data.startDate, endDate: data.endDate || null,
      status: 'active', note: data.note || ''
    });
    insert('invoices', {
      code: nextCode('inv'), bookingId: null, tenantId: tenant.id,
      propertyId: room.propertyId, roomId: room.id,
      description: 'Sewa kamar ' + room.number + ' — ' + U.monthLabel(U.monthKey(data.startDate)),
      amount: Number(data.amount) || room.priceMonthly,
      dueDate: U.addDays(data.startDate, 5),
      status: 'unpaid', paidAt: null, method: null
    });
    return tenant;
  }
  function endTenancy(id) {
    var t = find('tenants', id);
    if (!t) throw new Error('Penyewa tidak ditemukan');
    if (t.status !== 'active') throw new Error('Penyewa sudah tidak aktif');
    return update('tenants', id, { status: 'inactive', endDate: U.todayISO() });
  }

  /* ============================================================
     PORTAL PENYEWA — akun, tagihan, laporan, pengumuman
     ============================================================ */
  function tenantAccount(tenantId) {
    get();
    return state.users.find(function (u) { return u.tenantId === tenantId && u.role === 'tenant'; }) || null;
  }
  function invoicesForTenant(tenantId) {
    get();
    return state.invoices.filter(function (i) { return i.tenantId === tenantId; })
      .sort(function (a, b) { return String(b.code || '').localeCompare(String(a.code || '')); });
  }
  function requestsForTenant(tenantId) {
    get();
    return state.requests.filter(function (r) { return r.tenantId === tenantId; })
      .sort(function (a, b) { return String(b.createdAt || '').localeCompare(String(a.createdAt || '')); });
  }
  function announcementsFor(propertyId) {
    get();
    return state.announcements.filter(function (a) {
      return !a.propertyId || a.propertyId === propertyId;
    }).sort(function (a, b) {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
  }
  function createRequest(data) {
    var tenant = find('tenants', data.tenantId);
    if (!tenant) throw new Error('Data penyewa tidak ditemukan');
    if (!data.title || !data.title.trim()) throw new Error('Judul laporan wajib diisi');
    if (!data.description || !data.description.trim()) throw new Error('Deskripsi laporan wajib diisi');
    var now = new Date().toISOString();
    return insert('requests', {
      code: nextCode('req'),
      tenantId: tenant.id,
      propertyId: tenant.propertyId,
      roomId: tenant.roomId,
      category: data.category || 'lainnya',
      priority: data.priority || 'normal',
      title: data.title.trim(),
      description: data.description.trim(),
      status: data.status || 'open', response: data.response || '',
      createdAt: now, updatedAt: now
    });
  }
  function updateRequest(id, patch) {
    var req = find('requests', id);
    if (!req) throw new Error('Laporan tidak ditemukan');
    patch.updatedAt = new Date().toISOString();
    if (patch.status === 'done' && !patch.resolvedAt) patch.resolvedAt = U.todayISO();
    return update('requests', id, patch);
  }
  function createAnnouncement(data) {
    if (!data.title || !data.title.trim()) throw new Error('Judul pengumuman wajib diisi');
    if (!data.body || !data.body.trim()) throw new Error('Isi pengumuman wajib diisi');
    return insert('announcements', {
      title: data.title.trim(),
      body: data.body.trim(),
      propertyId: data.propertyId || null,
      pinned: !!data.pinned,
      author: data.author || 'Admin'
    });
  }
  function updateAnnouncement(id, patch) {
    if (!find('announcements', id)) throw new Error('Pengumuman tidak ditemukan');
    return update('announcements', id, patch);
  }

  /* ============================================================
     TAGIHAN
     ============================================================ */
  function invoiceStatus(inv) {
    if (!inv) return 'unpaid';
    if (inv.status === 'paid') return 'paid';
    return inv.dueDate && inv.dueDate < U.todayISO() ? 'late' : 'unpaid';
  }
  function createInvoice(data) {
    var room = data.roomId ? roomById(data.roomId) : null;
    return insert('invoices', {
      code: nextCode('inv'),
      bookingId: data.bookingId || null,
      tenantId: data.tenantId || null,
      propertyId: data.propertyId || (room ? room.propertyId : null),
      roomId: data.roomId || (room ? room.id : null),
      description: data.description || 'Tagihan',
      amount: Number(data.amount) || 0,
      dueDate: data.dueDate || U.todayISO(),
      status: 'unpaid', paidAt: null, method: null
    });
  }
  function payInvoice(id, method, paidAt, paidVia) {
    var inv = find('invoices', id);
    if (!inv) throw new Error('Tagihan tidak ditemukan');
    if (inv.status === 'paid') throw new Error('Tagihan sudah lunas');
    return update('invoices', id, {
      status: 'paid', method: method || 'Tunai', paidAt: paidAt || U.todayISO(),
      paidVia: paidVia || 'admin'
    });
  }
  function invoiceTotals() {
    var paidTotal = 0, unpaidTotal = 0, lateTotal = 0, paidThisMonth = 0;
    var mk = U.currentMonthKey();
    get();
    state.invoices.forEach(function (inv) {
      var st = invoiceStatus(inv);
      var amount = Number(inv.amount) || 0;
      if (st === 'paid') {
        paidTotal += amount;
        if (U.monthKey(inv.paidAt) === mk) paidThisMonth += amount;
      } else {
        unpaidTotal += amount;
        if (st === 'late') lateTotal += amount;
      }
    });
    return { paidTotal: paidTotal, unpaidTotal: unpaidTotal, lateTotal: lateTotal, paidThisMonth: paidThisMonth };
  }

  /* ============================================================
     STATISTIK
     ============================================================ */
  function occupancyStats() {
    get();
    var total = state.rooms.length;
    var occupied = state.rooms.filter(function (r) { return roomEffectiveStatus(r) === 'occupied'; }).length;
    var maintenance = state.rooms.filter(function (r) { return r.status === 'maintenance'; }).length;
    var available = total - occupied - maintenance;
    return {
      total: total, occupied: occupied, available: Math.max(0, available), maintenance: maintenance,
      rate: total ? Math.round(occupied / total * 100) : 0
    };
  }
  function occupancyByProperty() {
    get();
    return state.properties.map(function (p) {
      var rooms = state.rooms.filter(function (r) { return r.propertyId === p.id; });
      var occupied = rooms.filter(function (r) { return roomEffectiveStatus(r) === 'occupied'; }).length;
      return {
        id: p.id, name: p.name, type: p.type, total: rooms.length, occupied: occupied,
        available: rooms.length - occupied, rate: rooms.length ? Math.round(occupied / rooms.length * 100) : 0
      };
    });
  }
  function last6MonthsRevenue() {
    var result = [];
    var today = U.todayISO();
    for (var i = 5; i >= 0; i--) {
      var mk = U.monthKey(U.addMonths(today, -i));
      var label = new Date(mk + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'short' });
      var total = 0;
      get();
      state.invoices.forEach(function (inv) {
        if (inv.status === 'paid' && U.monthKey(inv.paidAt) === mk) total += Number(inv.amount) || 0;
      });
      result.push({ key: mk, label: label, total: total });
    }
    return result;
  }
  function recentActivity(n) {
    get();
    var items = [];
    state.invoices.forEach(function (inv) {
      items.push({
        type: 'invoice', createdAt: inv.createdAt,
        title: inv.code + ' — ' + inv.description,
        status: invoiceStatus(inv), amount: inv.amount
      });
    });
    state.bookings.forEach(function (b) {
      items.push({
        type: 'booking', createdAt: b.createdAt,
        title: b.code + ' — ' + b.guestName,
        status: b.status, amount: b.total
      });
    });
    items.sort(function (a, b) { return String(b.createdAt || '').localeCompare(String(a.createdAt || '')); });
    return items.slice(0, n || 6);
  }
  function dashboardStats() {
    get();
    var occ = occupancyStats();
    var inv = invoiceTotals();
    var today = U.todayISO();
    return {
      properties: state.properties.length,
      roomsTotal: occ.total,
      roomsOccupied: occ.occupied,
      occupancyRate: occ.rate,
      revenueThisMonth: inv.paidThisMonth,
      outstanding: inv.unpaidTotal,
      late: inv.lateTotal,
      activeTenants: state.tenants.filter(function (t) { return isTenantActive(t); }).length,
      pendingBookings: state.bookings.filter(function (b) { return b.status === 'pending'; }).length,
      inHouse: state.bookings.filter(function (b) { return b.status === 'checkin'; }).length,
      arrivals: state.bookings.filter(function (b) { return b.status === 'confirmed' && b.checkIn >= today; }).length,
      departures: state.bookings.filter(function (b) { return b.status === 'checkin' && b.checkOut <= today; }).length,
      openRequests: state.requests.filter(function (r) { return r.status === 'open' || r.status === 'in_progress'; }).length,
      newRequests: state.requests.filter(function (r) { return r.status === 'open'; }).length,
      announcements: state.announcements.length
    };
  }

  /* ============================================================
     BACKUP & SESI
     ============================================================ */
  function exportBackup() { return JSON.stringify(get(), null, 2); }
  function importBackup(json) {
    var parsed;
    try { parsed = JSON.parse(json); } catch (e) { throw new Error('File bukan JSON yang valid'); }
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.users) || !Array.isArray(parsed.properties)) {
      throw new Error('Struktur data tidak valid');
    }
    ['rooms', 'tenants', 'bookings', 'invoices', 'requests', 'announcements'].forEach(function (k) {
      if (!Array.isArray(parsed[k])) parsed[k] = [];
    });
    parsed.counters = parsed.counters || { inv: 0, bk: 0, req: 0 };
    parsed.session = null;
    state = parsed;
    migrate(state);
    save();
  }
  function storageInfo() {
    var raw = localStorage.getItem(KEY) || '';
    return { bytes: raw.length, kb: (raw.length / 1024).toFixed(1), seededAt: get().seededAt };
  }
  function getSession() { get(); return state.session || null; }
  function setSession(s) { get(); state.session = s || null; save(); }

  return {
    L: L, init: load, save: save, reset: reset,
    all: all, find: find, insert: insert, update: update, remove: remove, nextCode: nextCode,
    propertyById: propertyById, roomById: roomById, roomLabel: roomLabel,
    tenantsOfRoom: tenantsOfRoom, isTenantActive: isTenantActive,
    roomEffectiveStatus: roomEffectiveStatus, isRoomAvailable: isRoomAvailable,
    rentUnits: rentUnits, computeBookingTotal: computeBookingTotal,
    createBooking: createBooking, setBookingStatus: setBookingStatus,
    bookingUnpaidInvoices: bookingUnpaidInvoices, deleteBooking: deleteBooking,
    createTenant: createTenant, endTenancy: endTenancy,
    tenantAccount: tenantAccount, invoicesForTenant: invoicesForTenant,
    requestsForTenant: requestsForTenant, announcementsFor: announcementsFor,
    createRequest: createRequest, updateRequest: updateRequest,
    createAnnouncement: createAnnouncement, updateAnnouncement: updateAnnouncement,
    invoiceStatus: invoiceStatus, createInvoice: createInvoice, payInvoice: payInvoice,
    invoiceTotals: invoiceTotals, occupancyStats: occupancyStats, occupancyByProperty: occupancyByProperty,
    last6MonthsRevenue: last6MonthsRevenue, recentActivity: recentActivity, dashboardStats: dashboardStats,
    exportBackup: exportBackup, importBackup: importBackup, storageInfo: storageInfo,
    getSession: getSession, setSession: setSession
  };
})();
