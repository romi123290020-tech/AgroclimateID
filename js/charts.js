/* ==========================================================
   charts.js — All Chart.js visualizations
   ========================================================== */

window.DM = window.DM || {};
DM._charts = {};

DM._destroy = (id) => { if (DM._charts[id]) { DM._charts[id].destroy(); delete DM._charts[id]; } };

DM._theme = () => {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    text: dark ? '#cbd5e1' : '#475569',
    grid: dark ? 'rgba(148,163,184,.12)' : 'rgba(15,107,58,.08)',
    title: dark ? '#e2e8f0' : '#0f172a'
  };
};

DM._mountChart = function (id, config) {
  DM._destroy(id);
  const ctx = document.getElementById(id);
  if (!ctx) return;
  const t = DM._theme();
  config.options = config.options || {};
  config.options.responsive = true;
  config.options.maintainAspectRatio = false;
  config.options.animation = { duration: 700, easing: 'easeOutQuart' };
  config.options.plugins = Object.assign({ legend: { labels: { color: t.text, font: { size: 11 } } } }, config.options.plugins || {});
  // apply theme colors to scales if any
  if (config.options.scales) {
    for (const sk of Object.keys(config.options.scales)) {
      const s = config.options.scales[sk];
      s.ticks = Object.assign({ color: t.text, font: { size: 10 } }, s.ticks || {});
      s.grid  = Object.assign({ color: t.grid }, s.grid || {});
    }
  }
  DM._charts[id] = new Chart(ctx, config);
};

DM.renderAllCharts = function () {
  const rows = DM.state.filtered.length ? DM.state.filtered : DM.state.raw;

  /* ---------- Time series ---------- */
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const tavgM = months.map(m => DM._avg(rows.filter(r => r.bulan === m), 'TAVG'));
  const rhM   = months.map(m => DM._avg(rows.filter(r => r.bulan === m), 'RH'));
  const prcpM = months.map(m => DM._avg(rows.filter(r => r.bulan === m), 'PRCP'));
  DM._mountChart('chart-timeseries', {
    type: 'line',
    data: {
      labels: months.map(m => `Bln ${m}`),
      datasets: [
        { label: 'TAVG (°C)',  data: tavgM, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.12)',  tension: .35, yAxisID: 'y',  fill: true, borderWidth: 2 },
        { label: 'RH (%)',     data: rhM,   borderColor: '#2480f7', backgroundColor: 'rgba(36,128,247,.12)',  tension: .35, yAxisID: 'y2', fill: true, borderWidth: 2 },
        { label: 'PRCP (mm)',  data: prcpM, borderColor: '#1faa5c', backgroundColor: 'rgba(31,170,92,.12)',  tension: .35, yAxisID: 'y3', fill: true, borderWidth: 2 }
      ]
    },
    options: {
      interaction: { mode: 'index', intersect: false },
      scales: {
        y:  { position: 'left',  title: { display: true, text: '°C', color: '#ef4444' } },
        y2: { position: 'right', title: { display: true, text: '% / mm', color: '#2480f7' }, grid: { display: false } },
        y3: { display: false }
      }
    }
  });

  /* ---------- Multi-axis climate ---------- */
  const gddM = months.map(m => DM._avg(rows.filter(r => r.bulan === m), 'GDD'));
  const optM = months.map(m => DM._sum(rows.filter(r => r.bulan === m), 'kasus_opt'));
  DM._mountChart('chart-multiaxis', {
    data: {
      labels: months.map(m => `Bln ${m}`),
      datasets: [
        { type: 'bar',  label: 'PRCP (mm)',   data: prcpM, backgroundColor: 'rgba(36,128,247,.5)', yAxisID: 'y' },
        { type: 'line', label: 'TAVG (°C)',   data: tavgM, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.15)', tension: .35, yAxisID: 'y2', borderWidth: 2 },
        { type: 'line', label: 'GDD',         data: gddM, borderColor: '#1faa5c', backgroundColor: 'rgba(31,170,92,.15)', tension: .35, yAxisID: 'y3', borderWidth: 2 },
        { type: 'line', label: 'Kasus OPT',   data: optM, borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,.15)', tension: .35, yAxisID: 'y3', borderDash: [4,3], borderWidth: 2 }
      ]
    },
    options: {
      scales: {
        y:  { position: 'left' },
        y2: { position: 'right', grid: { display: false } },
        y3: { display: false }
      }
    }
  });

  /* ---------- Curah hujan vs OPT (bar+line) ---------- */
  DM._mountChart('chart-prcp-opt', {
    data: {
      labels: months.map(m => `Bln ${m}`),
      datasets: [
        { type: 'bar',  label: 'PRCP (mm)',  data: prcpM, backgroundColor: 'rgba(36,128,247,.55)' },
        { type: 'line', label: 'Kasus OPT', data: optM, borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,.18)', tension: .35, fill: true, borderWidth: 2 }
      ]
    },
    options: { scales: { y: { beginAtZero: true } } }
  });

  /* ---------- GDD vs OPT ---------- */
  DM._mountChart('chart-gdd-opt', {
    data: {
      labels: months.map(m => `Bln ${m}`),
      datasets: [
        { type: 'bar',  label: 'GDD',        data: gddM, backgroundColor: 'rgba(31,170,92,.55)' },
        { type: 'line', label: 'Kasus OPT', data: optM, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.15)', tension: .35, fill: true, borderWidth: 2 }
      ]
    },
    options: { scales: { y: { beginAtZero: true } } }
  });

  /* ---------- ENSO vs PRCP ---------- */
  const ensoM = months.map(m => DM._avg(rows.filter(r => r.bulan === m), 'enso_anomaly'));
  DM._mountChart('chart-enso-prcp', {
    data: {
      labels: months.map(m => `Bln ${m}`),
      datasets: [
        { type: 'bar',  label: 'PRCP (mm)',     data: prcpM, backgroundColor: 'rgba(36,128,247,.45)', yAxisID: 'y' },
        { type: 'line', label: 'Anomaly Niño', data: ensoM, borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,.18)', tension: .35, yAxisID: 'y2', borderWidth: 2, fill: true }
      ]
    },
    options: {
      scales: {
        y:  { position: 'left',  beginAtZero: true },
        y2: { position: 'right', grid: { display: false }, title: { display: true, text: '°C' } }
      }
    }
  });

  /* ---------- RH vs OPT ---------- */
  DM._mountChart('chart-rh-opt', {
    data: {
      labels: months.map(m => `Bln ${m}`),
      datasets: [
        { type: 'line', label: 'RH (%)',      data: rhM, borderColor: '#0ea5e9', backgroundColor: 'rgba(14,165,233,.15)', tension: .35, fill: true, borderWidth: 2 },
        { type: 'bar',  label: 'Kasus OPT', data: optM, backgroundColor: 'rgba(168,85,247,.55)' }
      ]
    }
  });

  /* ---------- Scatter GDD vs intensitas ---------- */
  const scGdd = rows.slice(0, 800).map(r => ({ x: r.GDD, y: r.intensitas_opt }));
  DM._mountChart('chart-scatter-gdd', {
    type: 'scatter',
    data: { datasets: [{ label: 'GDD × Intensitas', data: scGdd, backgroundColor: 'rgba(31,170,92,.5)', borderColor: '#138848' }] },
    options: { scales: { x: { title: { display: true, text: 'GDD' } }, y: { title: { display: true, text: 'Intensitas OPT' } } } }
  });

  /* ---------- Scatter RH vs kasus ---------- */
  const scRh = rows.slice(0, 800).map(r => ({ x: r.RH, y: r.kasus_opt }));
  DM._mountChart('chart-scatter-rh', {
    type: 'scatter',
    data: { datasets: [{ label: 'RH × Kasus', data: scRh, backgroundColor: 'rgba(36,128,247,.5)', borderColor: '#114fae' }] },
    options: { scales: { x: { title: { display: true, text: 'RH (%)' } }, y: { title: { display: true, text: 'Kasus OPT' } } } }
  });

  /* ---------- "Heatmap" bulan vs OPT (stacked bar matrix) ---------- */
  const opts = Array.from(new Set(rows.map(r => r.OPT)));
  const palette = ['#1faa5c','#2480f7','#f97316','#a855f7','#ef4444','#14b8a6','#eab308','#0ea5e9','#f43f5e'];
  const heatDs = opts.map((opt, i) => ({
    label: opt,
    data: months.map(m => DM._sum(rows.filter(r => r.bulan === m && r.OPT === opt), 'kasus_opt')),
    backgroundColor: palette[i % palette.length]
  }));
  DM._mountChart('chart-heatmap', {
    type: 'bar',
    data: { labels: months.map(m => `Bln ${m}`), datasets: heatDs },
    options: {
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } } },
      scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
    }
  });

  /* ---------- Polar wind ---------- */
  const sectors = [0, 45, 90, 135, 180, 225, 270, 315];
  const windSect = sectors.map((s, i) => {
    const sub = rows.filter((_, idx) => idx % 8 === i);
    return DM._avg(sub, 'WDSP');
  });
  DM._mountChart('chart-wind', {
    type: 'polarArea',
    data: { labels: ['N','NE','E','SE','S','SW','W','NW'], datasets: [{
      data: windSect,
      backgroundColor: ['rgba(31,170,92,.6)','rgba(36,128,247,.6)','rgba(14,165,233,.6)','rgba(168,85,247,.6)','rgba(239,68,68,.6)','rgba(249,115,22,.6)','rgba(234,179,8,.6)','rgba(20,184,166,.6)']
    }]},
    options: { plugins: { legend: { position: 'bottom', labels: { font: { size: 9 } } } } }
  });

  /* ---------- Ranking provinsi ---------- */
  const provAgg = {};
  rows.forEach(r => { provAgg[r.Provinsi] = (provAgg[r.Provinsi] || 0) + r.intensitas_opt; });
  const provTop = Object.entries(provAgg).sort((a, b) => b[1] - a[1]).slice(0, 10);
  DM._mountChart('chart-rank-prov', {
    type: 'bar',
    data: {
      labels: provTop.map(x => x[0]),
      datasets: [{ label: 'Skor Risiko', data: provTop.map(x => +x[1].toFixed(0)),
        backgroundColor: provTop.map((_, i) => `rgba(${239 - i * 8},${68 + i * 10},${68 + i * 8},.75)`) }]
    },
    options: { indexAxis: 'y', plugins: { legend: { display: false } } }
  });

  /* ---------- Ranking kab/kota ---------- */
  const kabAgg = {};
  rows.forEach(r => { kabAgg[r["Kab / kota"]] = (kabAgg[r["Kab / kota"]] || 0) + r.intensitas_opt; });
  const kabTop = Object.entries(kabAgg).sort((a, b) => b[1] - a[1]).slice(0, 10);
  DM._mountChart('chart-rank-kab', {
    type: 'bar',
    data: {
      labels: kabTop.map(x => x[0]),
      datasets: [{ label: 'Skor Risiko', data: kabTop.map(x => +x[1].toFixed(0)),
        backgroundColor: kabTop.map((_, i) => `rgba(${36 + i * 5},${128 - i * 4},${247 - i * 10},.75)`) }]
    },
    options: { indexAxis: 'y', plugins: { legend: { display: false } } }
  });

  /* ---------- CSI radar per komoditas ---------- */
  const komList = Array.from(new Set(rows.map(r => r.Komoditas)));
  const csiAxes = ['Suhu', 'RH', 'PRCP', 'Angin', 'GDD'];
  const radarDs = komList.map((kom, i) => {
    const sub = rows.filter(r => r.Komoditas === kom);
    const tavg = DM._avg(sub, 'TAVG'), rh = DM._avg(sub, 'RH'),
          prcp = DM._avg(sub, 'PRCP'), wdsp = DM._avg(sub, 'WDSP'), gdd = DM._avg(sub, 'GDD');
    const t  = 100 - Math.min(100, Math.abs(tavg - 27) * 9);
    const rH = 100 - Math.min(100, Math.abs(rh - 85) * 2);
    const p  = 100 - Math.min(100, Math.abs(prcp - 180) * .4);
    const w  = 100 - Math.min(100, Math.max(0, wdsp - 2.5) * 25);
    const g  = Math.min(100, gdd / 8);
    const col = ['31,170,92','36,128,247','249,115,22'][i % 3];
    return {
      label: kom,
      data: [t, rH, p, w, g].map(v => +v.toFixed(1)),
      backgroundColor: `rgba(${col},.2)`, borderColor: `rgba(${col},.9)`,
      pointBackgroundColor: `rgba(${col},1)`, borderWidth: 2
    };
  });
  DM._mountChart('chart-csi', {
    type: 'radar',
    data: { labels: csiAxes, datasets: radarDs },
    options: {
      scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 20, color: DM._theme().text }, angleLines: { color: DM._theme().grid }, grid: { color: DM._theme().grid }, pointLabels: { color: DM._theme().text, font: { size: 11, weight: '600' } } } }
    }
  });
};

DM.destroyAllCharts = function () {
  Object.keys(DM._charts).forEach(DM._destroy);
};
