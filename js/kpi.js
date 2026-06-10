/* ==========================================================
   kpi.js — KPI cards, monitoring cards, hero stats
   ========================================================== */

window.DM = window.DM || {};
DM._sparkCharts = {};

DM._avg = (arr, k) => arr.length ? +(arr.reduce((s, r) => s + (+r[k] || 0), 0) / arr.length).toFixed(1) : 0;
DM._sum = (arr, k) => +arr.reduce((s, r) => s + (+r[k] || 0), 0).toFixed(1);

DM.renderHero = function () {
  const rows = DM.state.filtered.length ? DM.state.filtered : DM.state.raw;
  const tavg = DM._avg(rows, 'TAVG');
  const rh   = DM._avg(rows, 'RH');
  const prcp = DM._avg(rows, 'PRCP');
  const anomaly = DM._avg(rows, 'enso_anomaly');
  const enso = DM.classifyEnso(anomaly);

  document.getElementById('hero-tavg').textContent = tavg || '—';
  document.getElementById('hero-rh').textContent = rh || '—';
  document.getElementById('hero-prcp').textContent = prcp || '—';
  document.getElementById('hero-date').textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('hero-region').textContent =
    DM.state.filters.kab || DM.state.filters.provinsi || 'Indonesia';

  const badge = document.getElementById('enso-badge');
  badge.textContent = enso;
  badge.className = 'enso-badge ' + (enso === 'El Niño' ? 'enso-elnino' : enso === 'La Niña' ? 'enso-lanina' : 'enso-neutral');
  document.getElementById('enso-value').textContent = anomaly.toFixed(2);

  // gauge marker position
  const pct = Math.max(0, Math.min(100, ((anomaly + 2.5) / 5) * 100));
  document.getElementById('enso-gauge-marker').style.left = `calc(${pct}% - 2px)`;

  // ticker
  document.getElementById('ticker-text').textContent =
    `${DM.state.filters.provinsi || 'Indonesia'} • TAVG ${tavg}°C • RH ${rh}% • PRCP ${prcp}mm • ENSO ${enso}`;
};

DM.kpiDefs = [
  { key: 'kasus',  label: 'Total Kasus OPT', icon: 'bug',          unit: '',     calc: r => DM._sum(r, 'kasus_opt') },
  { key: 'gddAvg', label: 'Rata-rata GDD',   icon: 'activity',     unit: '°C·d', calc: r => DM._avg(r, 'GDD') },
  { key: 'agdd',   label: 'Akumulasi GDD',   icon: 'trending-up',  unit: '°C·d', calc: r => DM._sum(r, 'GDD') },
  { key: 'prcp',   label: 'Curah Hujan',     icon: 'cloud-rain',   unit: 'mm',   calc: r => DM._avg(r, 'PRCP') },
  { key: 'rh',     label: 'RH',              icon: 'droplets',     unit: '%',    calc: r => DM._avg(r, 'RH') },
  { key: 'wdsp',   label: 'Kecepatan Angin', icon: 'wind',         unit: 'm/s',  calc: r => DM._avg(r, 'WDSP') },
  { key: 'enso',   label: 'ENSO Status',     icon: 'waves',        unit: '',     calc: r => DM.classifyEnso(DM._avg(r, 'enso_anomaly')) },
  { key: 'risk',   label: 'Risiko OPT',      icon: 'shield-alert', unit: '',     calc: r => DM._dominantRisk(r) }
];

DM._dominantRisk = function (rows) {
  const cnt = { Aman: 0, Waspada: 0, Bahaya: 0 };
  rows.forEach(r => cnt[DM.riskLevel(r.GDD, r.RH, r.PRCP).label]++);
  return Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
};

DM.renderKPIs = function () {
  const rows = DM.state.filtered.length ? DM.state.filtered : DM.state.raw;
  const grid = document.getElementById('kpi-grid');
  grid.innerHTML = DM.kpiDefs.map((def, i) => {
    const val = def.calc(rows);
    const formatted = typeof val === 'number' ? val.toLocaleString('id-ID') : val;
    const colorClass = def.key === 'enso' ?
      (val === 'El Niño' ? 'text-rose-600' : val === 'La Niña' ? 'text-climate-600' : 'text-slate-500')
      : def.key === 'risk' ?
      (val === 'Bahaya' ? 'text-rose-600' : val === 'Waspada' ? 'text-amber-600' : 'text-emerald-600')
      : 'text-slate-800 dark:text-white';
    return `
      <div class="kpi-card" data-kpi="${def.key}">
        <div class="flex items-start justify-between">
          <div>
            <div class="label">${def.label}</div>
            <div class="value ${colorClass}">${formatted}<span class="text-xs font-medium text-slate-400 ml-1">${def.unit}</span></div>
          </div>
          <div class="icon-wrap"><i data-lucide="${def.icon}" class="w-4 h-4"></i></div>
        </div>
        <canvas class="spark" id="spark-${def.key}"></canvas>
      </div>`;
  }).join('');

  if (window.lucide) lucide.createIcons();

  // sparkline mini charts on numeric KPIs
  DM.kpiDefs.forEach(def => {
    if (def.key === 'enso' || def.key === 'risk') return;
    const ctx = document.getElementById('spark-' + def.key);
    if (!ctx) return;
    if (DM._sparkCharts[def.key]) DM._sparkCharts[def.key].destroy();
    // monthly series
    const monthly = Array.from({ length: 12 }, (_, m) => {
      const sub = rows.filter(r => r.bulan === m + 1);
      return def.key === 'kasus' ? DM._sum(sub, 'kasus_opt')
           : def.key === 'agdd'  ? DM._sum(sub, 'GDD')
           : def.key === 'gddAvg'? DM._avg(sub, 'GDD')
           : def.key === 'prcp' ? DM._avg(sub, 'PRCP')
           : def.key === 'rh'   ? DM._avg(sub, 'RH')
           : DM._avg(sub, 'WDSP');
    });
    DM._sparkCharts[def.key] = new Chart(ctx, {
      type: 'line',
      data: { labels: monthly.map((_, i) => i + 1), datasets: [{
        data: monthly, borderColor: '#1faa5c', backgroundColor: 'rgba(31,170,92,.18)',
        borderWidth: 1.5, fill: true, tension: .35, pointRadius: 0
      }] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 600 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } }
      }
    });
  });
};

/* ---------------- Monitoring Cards ---------------- */

DM.renderMonCards = function () {
  const rows = DM.state.filtered.length ? DM.state.filtered : DM.state.raw;

  // aggregate per (Komoditas, OPT) — show top 8 by intensitas
  const groups = {};
  rows.forEach(r => {
    const k = `${r.Komoditas}||${r.OPT}`;
    (groups[k] = groups[k] || []).push(r);
  });
  const cards = Object.entries(groups).map(([k, list]) => {
    const [komoditas, opt] = k.split('||');
    const gdd  = DM._avg(list, 'GDD');
    const agdd = DM._sum(list, 'GDD');
    const prcp = DM._avg(list, 'PRCP');
    const rh   = DM._avg(list, 'RH');
    const wdsp = DM._avg(list, 'WDSP');
    const intensitas = DM._avg(list, 'intensitas_opt');
    const ensoAv = DM._avg(list, 'enso_anomaly');
    const enso = DM.classifyEnso(ensoAv);
    const risk = DM.riskLevel(gdd, rh, prcp);
    return { komoditas, opt, gdd, agdd, prcp, rh, wdsp, intensitas, enso, risk };
  }).sort((a, b) => b.intensitas - a.intensitas).slice(0, 12);

  const recommend = (c) => {
    if (c.risk.label === 'Bahaya') return `Lakukan tindakan pengendalian intensif untuk ${c.opt} pada ${c.komoditas}. Pantau harian.`;
    if (c.risk.label === 'Waspada') return `Tingkatkan monitoring lapangan dan siapkan agen hayati untuk ${c.opt}.`;
    return `Kondisi terkendali. Pertahankan praktik kultur teknis pada ${c.komoditas}.`;
  };

  document.getElementById('mon-cards').innerHTML = cards.map(c => `
    <div class="mon-card">
      <div class="header">
        <div>
          <div class="title">${c.opt}</div>
          <div class="sub">${c.komoditas} • Tbase ${DM.tbaseMap[c.opt] || '—'}°C</div>
        </div>
        <span class="status-badge ${c.risk.cls}">${c.risk.label}</span>
      </div>

      <div class="mt-3 space-y-1">
        <div class="metric"><span>GDD</span><span>${c.gdd.toLocaleString('id-ID')} °C·d</span></div>
        <div class="progress"><div style="width:${Math.min(100, c.gdd / 10)}%"></div></div>
        <div class="metric"><span>AGDD</span><span>${c.agdd.toLocaleString('id-ID')} °C·d</span></div>
        <div class="metric"><span>Curah Hujan</span><span>${c.prcp} mm</span></div>
        <div class="metric"><span>RH</span><span>${c.rh}%</span></div>
        <div class="metric"><span>Wind Speed</span><span>${c.wdsp} m/s</span></div>
        <div class="metric"><span>ENSO</span>
          <span class="enso-badge ${c.enso === 'El Niño' ? 'enso-elnino' : c.enso === 'La Niña' ? 'enso-lanina' : 'enso-neutral'}">${c.enso}</span>
        </div>
      </div>

      <div class="mt-3 p-2 rounded-xl bg-gradient-to-r from-agro-500/10 to-climate-500/10 border border-agro-500/15 text-[11px] leading-snug">
        <div class="font-semibold text-agro-700 dark:text-agro-300 mb-0.5 flex items-center gap-1">
          <i data-lucide="sparkles" class="w-3 h-3"></i> AI Insight
        </div>
        ${recommend(c)}
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
};
