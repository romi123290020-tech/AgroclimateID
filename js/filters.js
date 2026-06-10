/* ==========================================================
   filters.js — Filter panel state, debounce, and population
   ========================================================== */

window.DM = window.DM || {};

DM.state = {
  raw: [],          // all rows
  filtered: [],     // after filters
  filters: {
    provinsi: '', kab: '', tahun: '', bulan: '',
    komoditas: '', opt: '', enso: '', gddMin: 0,
    dateStart: '', dateEnd: ''
  }
};

DM._debounce = function (fn, wait = 300) {
  let t = null;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
};

DM.populateFilters = function () {
  const rows = DM.state.raw;
  const uniq = (k) => Array.from(new Set(rows.map(r => r[k]))).filter(Boolean).sort();
  const fill = (sel, items, prefix = 'Semua') => {
    const el = document.getElementById(sel);
    el.innerHTML = `<option value="">${prefix}</option>` + items.map(v => `<option>${v}</option>`).join('');
  };
  // Provinsi: fixed Sulawesi list
  fill('f-provinsi', ['Sulawesi Barat','Sulawesi Selatan','Sulawesi Tengah','Sulawesi Tenggara','Sulawesi Utara']);
  fill('f-kab',       uniq('Kab / kota'));
  // Tahun: fixed 2018-2025
  fill('f-tahun',     ['2018','2019','2020','2021','2022','2023','2024','2025']);
  fill('f-bulan',     ["1","2","3","4","5","6","7","8","9","10","11","12"]);
  fill('f-komoditas', uniq('Komoditas'));
  fill('f-opt',       uniq('OPT'));

  // Date pickers — set min/max based on dataset
  const dates = rows.map(r => r.DATE).filter(Boolean).sort();
  const dStart = document.getElementById('f-date-start');
  const dEnd   = document.getElementById('f-date-end');
  if (dates.length) {
    dStart.min = dEnd.min = dates[0];
    dStart.max = dEnd.max = dates[dates.length - 1];
  }
};

DM.applyFilters = function () {
  const f = DM.state.filters;
  const startTs = f.dateStart ? new Date(f.dateStart).getTime() : null;
  const endTs   = f.dateEnd   ? new Date(f.dateEnd).getTime()   : null;
  DM.state.filtered = DM.state.raw.filter(r => {
    if (f.provinsi  && r.Provinsi !== f.provinsi) return false;
    if (f.kab       && r["Kab / kota"] !== f.kab) return false;
    if (f.tahun     && String(r.tahun) !== String(f.tahun)) return false;
    if (f.bulan     && String(r.bulan) !== String(f.bulan)) return false;
    if (f.komoditas && r.Komoditas !== f.komoditas) return false;
    if (f.opt       && r.OPT !== f.opt) return false;
    if (f.enso      && r.ENSO !== f.enso) return false;
    if (r.GDD < +f.gddMin) return false;
    if (startTs !== null || endTs !== null) {
      const ts = new Date(r.DATE).getTime();
      if (startTs !== null && ts < startTs) return false;
      if (endTs   !== null && ts > endTs)   return false;
    }
    return true;
  });
  document.getElementById('filter-summary').textContent =
    `${DM.state.filtered.length.toLocaleString('id-ID')} record terfilter (dari ${DM.state.raw.length.toLocaleString('id-ID')})`;
};

DM.bindFilters = function () {
  const map = {
    'f-provinsi': 'provinsi', 'f-kab': 'kab', 'f-tahun': 'tahun', 'f-bulan': 'bulan',
    'f-komoditas': 'komoditas', 'f-opt': 'opt', 'f-enso': 'enso'
  };
  const handler = DM._debounce(() => DM.refreshAll(), 300);
  for (const [id, key] of Object.entries(map)) {
    document.getElementById(id).addEventListener('change', e => {
      DM.state.filters[key] = e.target.value;
      handler();
    });
  }
  // date pickers
  document.getElementById('f-date-start').addEventListener('change', e => {
    DM.state.filters.dateStart = e.target.value;
    handler();
  });
  document.getElementById('f-date-end').addEventListener('change', e => {
    DM.state.filters.dateEnd = e.target.value;
    handler();
  });

  const gdd = document.getElementById('f-gdd');
  const gddVal = document.getElementById('f-gdd-val');
  gdd.addEventListener('input', e => {
    DM.state.filters.gddMin = +e.target.value;
    gddVal.textContent = e.target.value;
    handler();
  });

  document.getElementById('btn-apply').addEventListener('click', () => DM.refreshAll());
  document.getElementById('btn-reset').addEventListener('click', () => {
    DM.state.filters = { provinsi:'',kab:'',tahun:'',bulan:'',komoditas:'',opt:'',enso:'',gddMin:0,dateStart:'',dateEnd:'' };
    ['f-provinsi','f-kab','f-tahun','f-bulan','f-komoditas','f-opt','f-enso'].forEach(i => document.getElementById(i).value = '');
    document.getElementById('f-date-start').value = '';
    document.getElementById('f-date-end').value = '';
    document.getElementById('f-gdd').value = 0;
    gddVal.textContent = '0';
    DM.refreshAll();
  });
};
