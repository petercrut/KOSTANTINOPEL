/* ============================================================
   Kostantinopel — views/reports.js
   ============================================================ */
window.KOL = window.KOL || {};
KOL.views = KOL.views || {};

KOL.views.reports = (function () {
  'use strict';

  var selectedMonth = null;

  function render(el) {
    var U = KOL.utils, DB = KOL.db;
    var mk = selectedMonth || U.currentMonthKey();
    var occ = DB.occupancyStats();
    var totals = DB.invoiceTotals();

    var paidInMonth = DB.all('invoices').filter(function (inv) {
      return inv.status === 'paid' && U.monthKey(inv.paidAt) === mk;
    }).sort(function (a, b) { return String(a.paidAt || '').localeCompare(String(b.paidAt || '')); });

    var revenue = paidInMonth.reduce(function (sum, inv) { return sum + (Number(inv.amount) || 0); }, 0);

    var byMethod = {};
    paidInMonth.forEach(function (inv) {
      var m = inv.method || 'Lainnya';
      byMethod[m] = (byMethod[m] || 0) + (Number(inv.amount) || 0);
    });

    var byProperty = {};
    paidInMonth.forEach(function (inv) {
      var p = DB.propertyById(inv.propertyId);
      var key = p ? p.name : 'Lainnya';
      byProperty[key] = (byProperty[key] || 0) + (Number(inv.amount) || 0);
    });

    var bookingsCreated = DB.all('bookings').filter(function (b) { return U.monthKey(b.createdAt) === mk; }).length;
    var bookingsIn = DB.all('bookings').filter(function (b) { return U.monthKey(b.checkIn) === mk; }).length;
    var bookingsOut = DB.all('bookings').filter(function (b) { return U.monthKey(b.checkOut) === mk; }).length;

    var maxProp = Math.max.apply(null, Object.keys(byProperty).map(function (k) { return byProperty[k]; }).concat([1]));
    var maxMethod = Math.max.apply(null, Object.keys(byMethod).map(function (k) { return byMethod[k]; }).concat([1]));

    var html = '<div class="page-head">' +
      '<div><h2>Laporan &amp; Analitik</h2><p class="page-sub">Rekap pendapatan, okupansi, dan aktivitas properti.</p></div>' +
    '</div>';

    html += '<div class="report-month">' +
      '<label class="form-label" for="report-month-input" style="margin:0">Periode</label>' +
      '<input type="month" id="report-month-input" value="' + mk + '">' +
      '<div class="spacer"></div>' +
      '<button class="btn btn-ghost" id="btn-export">⬇ Ekspor CSV</button>' +
    '</div>';

    html += '<div class="report-summary">' +
      '<div class="mini-stat"><span>Pendapatan ' + U.escapeHTML(U.monthLabel(mk)) + '</span>' +
        '<strong>' + U.formatIDR(revenue) + '</strong>' +
        '<small>' + paidInMonth.length + ' tagihan lunas</small></div>' +
      '<div class="mini-stat"><span>Okupansi Saat Ini</span>' +
        '<strong>' + occ.rate + '%</strong>' +
        '<small>' + occ.occupied + ' dari ' + occ.total + ' kamar terisi</small></div>' +
      '<div class="mini-stat"><span>Booking Baru</span>' +
        '<strong>' + bookingsCreated + '</strong>' +
        '<small>' + bookingsIn + ' check-in · ' + bookingsOut + ' check-out</small></div>' +
      '<div class="mini-stat"><span>Tagihan Tertunda</span>' +
        '<strong>' + U.formatIDR(totals.unpaidTotal) + '</strong>' +
        '<small>' + U.formatIDR(totals.lateTotal) + ' melewati jatuh tempo</small></div>' +
    '</div>';

    html += '<section class="grid-2">' +
      '<div class="card">' +
        '<div class="card-head"><h3>Pendapatan per Metode</h3></div>' +
        '<div class="card-body">' +
          (Object.keys(byMethod).length
            ? Object.keys(byMethod).map(function (m) {
                var pct = Math.round(byMethod[m] / maxMethod * 100);
                return '<div class="method-row">' +
                  '<span class="method-name">' + U.escapeHTML(m) + '</span>' +
                  '<div class="method-bar"><span style="width:' + pct + '%"></span></div>' +
                  '<span class="method-amount">' + U.formatIDR(byMethod[m]) + '</span>' +
                '</div>';
              }).join('')
            : U.emptyState('Belum ada pembayaran pada periode ini.')) +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-head"><h3>Pendapatan per Properti</h3></div>' +
        '<div class="card-body">' +
          (Object.keys(byProperty).length
            ? Object.keys(byProperty).map(function (name) {
                var pct = Math.round(byProperty[name] / maxProp * 100);
                return '<div class="method-row">' +
                  '<span class="method-name">' + U.escapeHTML(name) + '</span>' +
                  '<div class="method-bar"><span style="width:' + pct + '%;background:linear-gradient(90deg,#818CF8,#4F46E5)"></span></div>' +
                  '<span class="method-amount">' + U.formatIDR(byProperty[name]) + '</span>' +
                '</div>';
              }).join('')
            : U.emptyState('Belum ada pendapatan pada periode ini.')) +
        '</div>' +
      '</div>' +
    '</section>';

    html += '<section class="card">' +
      '<div class="card-head"><h3>Tagihan Lunas — ' + U.escapeHTML(U.monthLabel(mk)) + '</h3>' +
      '<span class="card-link">' + U.formatIDR(revenue) + '</span></div>' +
      '<div class="card-body no-pad">' +
        (paidInMonth.length
          ? '<table class="table"><thead><tr><th>Kode</th><th>Deskripsi</th><th>Kamar</th><th>Tanggal Bayar</th><th>Metode</th><th class="num">Jumlah</th></tr></thead>' +
            '<tbody>' + paidInMonth.map(function (inv) {
              var room = inv.roomId ? DB.roomById(inv.roomId) : null;
              return '<tr>' +
                '<td><strong>' + U.escapeHTML(inv.code) + '</strong></td>' +
                '<td>' + U.escapeHTML(inv.description) + '</td>' +
                '<td class="cell-muted">' + U.escapeHTML(room ? room.number : '-') + '</td>' +
                '<td>' + U.formatDate(inv.paidAt) + '</td>' +
                '<td>' + U.escapeHTML(inv.method || '-') + '</td>' +
                '<td class="num"><strong>' + U.formatIDR(inv.amount) + '</strong></td>' +
              '</tr>';
            }).join('') + '</tbody></table>'
          : U.emptyState('Belum ada tagihan lunas pada periode ini.')) +
      '</div>' +
    '</section>';

    el.innerHTML = html;

    U.qs('#report-month-input').addEventListener('change', function (e) {
      selectedMonth = e.target.value || U.currentMonthKey();
      render(el);
    });
    U.qs('#btn-export').addEventListener('click', function () { exportCSV(mk, paidInMonth, U, DB); });
  }

  function exportCSV(mk, paidInMonth, U, DB) {
    var rows = [['Kode', 'Tanggal Bayar', 'Deskripsi', 'Properti', 'Kamar', 'Metode', 'Jumlah (Rp)']].concat(
      paidInMonth.map(function (inv) {
        var p = DB.propertyById(inv.propertyId);
        var room = inv.roomId ? DB.roomById(inv.roomId) : null;
        return [
          inv.code,
          U.formatDate(inv.paidAt),
          inv.description,
          p ? p.name : '',
          room ? room.number : '',
          inv.method || '',
          String(inv.amount)
        ];
      })
    );
    var csv = rows.map(function (r) {
      return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(';');
    }).join('\r\n');
    U.downloadFile('laporan-' + mk + '.csv', csv, 'text/csv;charset=utf-8');
    U.toast('Laporan CSV diunduh', 'success');
  }

  return { render: render };
})();
