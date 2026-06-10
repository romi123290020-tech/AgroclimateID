/* ==========================================================
   insights.js — AI insight engine + DataTable
   ========================================================== */

window.DM = window.DM || {};
DM._dt = null;

DM.generateInsights = function () {
  const rows = DM.state.filtered.length ? DM.state.filtered : DM.state.raw;
  const insights = [];
  if (!rows.length) {
    insights.push({ type: 'info', title: 'Tidak ada data', body: 'Silakan ubah filter untuk melihat insight.' });
  } else {
    const anomaly = DM._avg(rows, 'enso_anomaly');
    const enso = DM.classifyEnso(anomaly);
    const prcp = DM._avg(rows, 'PRCP');
    const rh   = DM._avg(rows, 'RH');
    const gdd  = DM._avg(rows, 'GDD');
    const wdsp = DM._avg(rows, 'WDSP');

    if (enso === 'El Niño' && prcp < 150 && gdd > 500) {
      insights.push({ type: 'warn', title: 'Risiko OPT Meningkat (El Niño)',
        body: 'Kombinasi El Niño, curah hujan rendah, dan GDD tinggi mendorong perkembangan OPT. Tingkatkan monitoring lapangan dan siapkan agen hayati.' });
    }
    if (enso === 'La Niña' && prcp > 200) {
      insights.push({ type: 'info', title: 'Curah Hujan Tinggi (La Niña)',
        body: 'Fase La Niña memicu kelembapan tinggi. Waspada penyakit jamur — perketat sanitasi kebun & rotasi fungisida.' });
    }
    if (rh > 85 && prcp > 180) {
      insights.push({ type: 'warn', title: 'Potensi Penyakit Jamur',
        body: 'RH tinggi & curah hujan tinggi meningkatkan risiko penyakit jamur. Lakukan pengawasan intensif.' });
    }
    if (gdd > 800) {
      insights.push({ type: 'warn', title: 'GDD Mencapai Ambang Bahaya',
        body: 'Akumulasi panas melewati 800 °C·d — populasi OPT dewasa berpotensi puncak. Persiapkan pengendalian terpadu.' });
    } else if (gdd > 400) {
      insights.push({ type: 'info', title: 'GDD Status Waspada',
        body: 'Periode kritis perkembangan OPT, pantau perangkap feromon mingguan.' });
    } else {
      insights.push({ type: 'ok', title: 'GDD Aman',
        body: 'Akumulasi panas rendah — populasi OPT cenderung terkendali. Lanjutkan praktik kultur teknis.' });
    }
    if (wdsp > 4) {
      insights.push({ type: 'info', title: 'Angin Kencang',
        body: 'Kecepatan angin tinggi dapat mempercepat penyebaran spora & menyulitkan aplikasi pestisida.' });
    }
    // Top hotspot
    const kabAgg = {};
    rows.forEach(r => { kabAgg[r["Kab / kota"]] = (kabAgg[r["Kab / kota"]] || 0) + r.intensitas_opt; });
    const top = Object.entries(kabAgg).sort((a, b) => b[1] - a[1])[0];
    if (top) insights.push({ type: 'warn', title: `Hotspot: ${top[0]}`,
      body: `Wilayah dengan skor risiko OPT kumulatif tertinggi (${top[1].toFixed(0)}). Prioritaskan intervensi.` });
  }
  const ico = { warn: 'alert-triangle', info: 'info', ok: 'check-circle-2' };
  document.getElementById('ai-insights').innerHTML = insights.map(i => `
    <div class="insight ${i.type}">
      <div class="ico"><i data-lucide="${ico[i.type]}" class="w-3.5 h-3.5"></i></div>
      <div><div class="title">${i.title}</div><div class="body">${i.body}</div></div>
    </div>
  `).join('');
  if (window.lucide) lucide.createIcons();
};

/* -------------------- DataTable -------------------- */

DM.renderTable = function () {
  const rows = DM.state.filtered.length ? DM.state.filtered : DM.state.raw;
  const cols = [
    { title: 'DATE', data: 'DATE' },
    { title: 'Provinsi', data: 'Provinsi' },
    { title: 'Kab / kota', data: 'Kab / kota' },
    { title: 'Komoditas', data: 'Komoditas' },
    { title: 'OPT', data: 'OPT' },
    { title: 'GDD', data: 'GDD' },
    { title: 'AGDD', data: 'AGDD' },
    { title: 'RH', data: 'RH' },
    { title: 'WDSP', data: 'WDSP' },
    { title: 'PRCP', data: 'PRCP' },
    { title: 'ENSO', data: 'ENSO' }
  ];

  if (DM._dt) { DM._dt.destroy(); $('#data-table').empty(); }
  DM._dt = $('#data-table').DataTable({
    data: rows.slice(0, 5000),
    columns: cols,
    pageLength: 10,
    order: [[0, 'desc']],
    deferRender: true,
    scrollX: true,
    language: {
      search: '<i class="lucide-search"></i> Cari:',
      lengthMenu: 'Tampilkan _MENU_ baris',
      info: 'Menampilkan _START_–_END_ dari _TOTAL_ baris',
      paginate: { previous: '‹', next: '›' }
    }
  });
};

DM._avg = DM._avg || ((arr, k) => arr.length ? +(arr.reduce((s, r) => s + (+r[k] || 0), 0) / arr.length).toFixed(1) : 0);
DM._sum = DM._sum || ((arr, k) => +arr.reduce((s, r) => s + (+r[k] || 0), 0).toFixed(1));
