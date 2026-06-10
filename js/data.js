/* ==========================================================
   data.js — Loaders, parsers, and synthetic sample generator
   ========================================================== */

window.DM = window.DM || {};

DM.tbaseMap = {
  // KAKAO
  "PBK": 15, "BBK": 11, "VSD": 17,
  // KELAPA
  "Kumbang Nyiur": 11, "Kumbang Janur": 16, "Tikus": 25,
  // CENGKEH
  "Penggerek Batang": 27, "Penggerek Cabang": 14, "Cacar Daun Cengkeh": 15
};

DM.komoditasOpt = {
  "Kakao":   ["PBK", "BBK", "VSD"],
  "Kelapa":  ["Kumbang Nyiur", "Kumbang Janur", "Tikus"],
  "Cengkeh": ["Penggerek Batang", "Penggerek Cabang", "Cacar Daun Cengkeh"]
};

// Sulawesi-only provinces & kabupaten with real coordinates
DM.regions = [
  // Sulawesi Barat
  { provinsi: "Sulawesi Barat",    kab: "Mamuju",           lat: -2.68, lon: 118.89 },
  { provinsi: "Sulawesi Barat",    kab: "Majene",           lat: -3.55, lon: 118.97 },
  { provinsi: "Sulawesi Barat",    kab: "Polewali Mandar",  lat: -3.40, lon: 119.30 },
  { provinsi: "Sulawesi Barat",    kab: "Mamasa",           lat: -2.94, lon: 119.34 },

  // Sulawesi Selatan
  { provinsi: "Sulawesi Selatan",  kab: "Luwu",             lat: -2.95, lon: 120.20 },
  { provinsi: "Sulawesi Selatan",  kab: "Luwu Utara",       lat: -2.55, lon: 120.20 },
  { provinsi: "Sulawesi Selatan",  kab: "Bone",             lat: -4.55, lon: 120.30 },
  { provinsi: "Sulawesi Selatan",  kab: "Gowa",             lat: -5.32, lon: 119.74 },
  { provinsi: "Sulawesi Selatan",  kab: "Soppeng",          lat: -4.36, lon: 119.89 },
  { provinsi: "Sulawesi Selatan",  kab: "Wajo",             lat: -4.03, lon: 120.21 },

  // Sulawesi Tengah
  { provinsi: "Sulawesi Tengah",   kab: "Poso",             lat: -1.40, lon: 120.75 },
  { provinsi: "Sulawesi Tengah",   kab: "Donggala",         lat: -0.68, lon: 119.74 },
  { provinsi: "Sulawesi Tengah",   kab: "Sigi",             lat: -1.43, lon: 119.94 },
  { provinsi: "Sulawesi Tengah",   kab: "Parigi Moutong",   lat: -0.80, lon: 120.18 },
  { provinsi: "Sulawesi Tengah",   kab: "Banggai",          lat: -1.30, lon: 122.78 },

  // Sulawesi Tenggara
  { provinsi: "Sulawesi Tenggara", kab: "Kolaka",           lat: -4.05, lon: 121.59 },
  { provinsi: "Sulawesi Tenggara", kab: "Konawe",           lat: -3.95, lon: 122.10 },
  { provinsi: "Sulawesi Tenggara", kab: "Muna",             lat: -4.97, lon: 122.59 },
  { provinsi: "Sulawesi Tenggara", kab: "Buton",            lat: -5.47, lon: 122.95 },
  { provinsi: "Sulawesi Tenggara", kab: "Kolaka Utara",     lat: -3.10, lon: 121.10 },

  // Sulawesi Utara
  { provinsi: "Sulawesi Utara",    kab: "Minahasa",         lat:  1.34, lon: 124.83 },
  { provinsi: "Sulawesi Utara",    kab: "Bolaang Mongondow",lat:  0.74, lon: 124.05 },
  { provinsi: "Sulawesi Utara",    kab: "Minahasa Selatan", lat:  1.10, lon: 124.59 },
  { provinsi: "Sulawesi Utara",    kab: "Minahasa Utara",   lat:  1.49, lon: 125.00 },
  { provinsi: "Sulawesi Utara",    kab: "Kepulauan Sangihe",lat:  3.60, lon: 125.51 }
];

// Sinusoidal monthly seed for climate realism
DM._monthFactor = (m, base, amp, phase=0) => base + amp * Math.sin(((m - phase) / 12) * 2 * Math.PI);

DM.generateSample = function () {
  const rows = [];
  const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const komoditasList = Object.keys(DM.komoditasOpt);
  let id = 0;

  for (const year of years) {
    // ENSO phase per month, slow swing
    for (let m = 1; m <= 12; m++) {
      const enso_anomaly = +(Math.sin((year - 2022) * 1.2 + m / 2.5) * 1.3 + (Math.random() - 0.5) * 0.4).toFixed(2);
      for (const region of DM.regions) {
        for (const komoditas of komoditasList) {
          for (const opt of DM.komoditasOpt[komoditas]) {
            // climate values with seasonal variation
            const tavg = +DM._monthFactor(m, 27, 2.5, 3 + (region.lat / 5)).toFixed(1);
            const trange = 6 + Math.random() * 3;
            const tmax = +(tavg + trange / 2 + (Math.random() - .5)).toFixed(1);
            const tmin = +(tavg - trange / 2 + (Math.random() - .5)).toFixed(1);
            const baseRain = DM._monthFactor(m, 180, 130, -1);   // wetter Nov-Mar
            const ensoRainAdj = enso_anomaly < -0.5 ? 1.25 : (enso_anomaly > 0.5 ? 0.65 : 1);
            const prcp = +Math.max(5, baseRain * ensoRainAdj * (0.7 + Math.random() * 0.7)).toFixed(1);
            const rh = +Math.min(96, Math.max(55, 78 + (prcp - 180) * 0.04 + (Math.random() - .5) * 6)).toFixed(1);
            const wdsp = +Math.max(0.5, 2.4 + Math.sin(m / 2) + (Math.random() - .5) * 1.2).toFixed(2);

            const tbase = DM.tbaseMap[opt] || 10;
            const gdd_daily = Math.max((tmax + tmin) / 2 - tbase, 0);
            // monthly-scale GDD (proxy: 30 days)
            const gdd = +(gdd_daily * 30 * (0.85 + Math.random() * 0.3)).toFixed(1);

            // OPT intensity influenced by GDD, RH, PRCP, ENSO
            const climateScore =
              (gdd / 800) * 0.45 +
              ((rh - 60) / 30) * 0.30 +
              ((prcp - 50) / 250) * 0.20 +
              (enso_anomaly > 0 ? 0.05 : -0.03);
            const intensitas_opt = +Math.max(0, Math.min(100, climateScore * 100 * (0.6 + Math.random() * 0.8))).toFixed(1);
            const kasus_opt = Math.round(intensitas_opt * (0.6 + Math.random() * 0.6));

            const enso = enso_anomaly >= 0.5 ? "El Niño" : (enso_anomaly <= -0.5 ? "La Niña" : "Netral");

            rows.push({
              id: ++id,
              DATE: `${year}-${String(m).padStart(2, '0')}-15`,
              tahun: year, bulan: m,
              "Provinsi": region.provinsi,
              "Kab / kota": region.kab,
              lat: region.lat, lon: region.lon,
              "Komoditas": komoditas,
              "OPT": opt,
              TMAX: tmax, TMIN: tmin, TAVG: tavg,
              PRCP: prcp, RH: rh, WDSP: wdsp,
              GDD: gdd, AGDD: 0, // AGDD set later
              kasus_opt, intensitas_opt,
              enso_anomaly, ENSO: enso, tbase
            });
          }
        }
      }
    }
  }

  // compute AGDD as running cumulative per (provinsi, kab, komoditas, opt, year) by month
  rows.sort((a, b) => {
    const ka = `${a.Provinsi}|${a["Kab / kota"]}|${a.Komoditas}|${a.OPT}|${a.tahun}|${a.bulan}`;
    const kb = `${b.Provinsi}|${b["Kab / kota"]}|${b.Komoditas}|${b.OPT}|${b.tahun}|${b.bulan}`;
    return ka.localeCompare(kb);
  });
  const acc = {};
  for (const r of rows) {
    const k = `${r.Provinsi}|${r["Kab / kota"]}|${r.Komoditas}|${r.OPT}|${r.tahun}`;
    acc[k] = (acc[k] || 0) + r.GDD;
    r.AGDD = +acc[k].toFixed(1);
  }
  return rows;
};

DM.classifyEnso = function (anomaly) {
  if (anomaly >= 0.5) return "El Niño";
  if (anomaly <= -0.5) return "La Niña";
  return "Netral";
};

DM.calculateGDD = function (tmax, tmin, optName) {
  const tbase = DM.tbaseMap[optName] || 10;
  return Math.max(((tmax + tmin) / 2) - tbase, 0);
};

DM.statusGDD = function (gdd) {
  if (gdd >= 800) return { label: "Bahaya",  cls: "status-bahaya"  };
  if (gdd >= 400) return { label: "Waspada", cls: "status-waspada" };
  return                    { label: "Aman",    cls: "status-aman"    };
};

// Risk classification combining GDD + RH + PRCP
DM.riskLevel = function (gdd, rh, prcp) {
  const gddH = gdd >= 800, gddM = gdd >= 400;
  const rhH  = rh  >= 85,  rhM  = rh  >= 75;
  const prcpH= prcp>= 200, prcpM= prcp>= 100;
  const high = (gddH ? 1 : 0) + (rhH ? 1 : 0) + (prcpH ? 1 : 0);
  const mid  = (gddM ? 1 : 0) + (rhM ? 1 : 0) + (prcpM ? 1 : 0);
  if (high >= 2) return { label: "Bahaya",  cls: "status-bahaya",  score: 3 };
  if (mid  >= 2) return { label: "Waspada", cls: "status-waspada", score: 2 };
  return            { label: "Aman",    cls: "status-aman",    score: 1 };
};

// Climate Suitability Index for OPT development (0-100)
DM.csi = function (tavg, rh, prcp, wdsp, gdd) {
  // Temperatures ~27C are optimal for many tropical OPT
  const tScore  = 100 - Math.min(100, Math.abs(tavg - 27) * 9);
  const rhScore = 100 - Math.min(100, Math.abs(rh - 85) * 2);
  const prcpScore = 100 - Math.min(100, Math.abs(prcp - 180) * 0.4);
  const windScore = 100 - Math.min(100, Math.max(0, wdsp - 2.5) * 25);
  const gddScore  = Math.min(100, gdd / 8);
  return +((tScore * .2 + rhScore * .25 + prcpScore * .2 + windScore * .15 + gddScore * .2)).toFixed(1);
};

// Parse uploaded XLSX (single workbook) and try to map to schema
DM.parseWorkbook = async function (file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const out = [];
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const json = XLSX.utils.sheet_to_json(ws, { defval: null, raw: false });
    json.forEach(r => out.push(r));
  }
  return out;
};

// Merge user-uploaded rows into our canonical structure
DM.normalizeRows = function (raw) {
  const norm = [];
  for (const r of raw) {
    const dateRaw = r.DATE || r.Date || r.date || r.Tanggal || r.TANGGAL;
    if (!dateRaw) continue;
    const d = new Date(dateRaw);
    if (isNaN(d.getTime())) continue;
    const opt = r.OPT || r.opt || r.Hama || "PBK";
    const komoditas = r.Komoditas || r.komoditas || r.KOMODITAS || "Kakao";
    const tmax = +(r.TMAX ?? r.Tmax ?? r.tmax ?? 30);
    const tmin = +(r.TMIN ?? r.Tmin ?? r.tmin ?? 22);
    const tavg = +(r.TAVG ?? r.Tavg ?? r.tavg ?? (tmax + tmin) / 2);
    const prcp = +(r.PRCP ?? r.Prcp ?? r.prcp ?? r["Curah Hujan"] ?? 0);
    const rh   = +(r.RH   ?? r.Rh   ?? r.rh   ?? 75);
    const wdsp = +(r.WDSP ?? r.Wdsp ?? r.wdsp ?? r["Wind Speed"] ?? 2);
    const anomaly = +(r.anomaly ?? r.Anomaly ?? r.ENSO_anomaly ?? 0);
    const gdd = DM.calculateGDD(tmax, tmin, opt);
    norm.push({
      DATE: d.toISOString().slice(0, 10),
      tahun: d.getFullYear(), bulan: d.getMonth() + 1,
      "Provinsi": r.Provinsi || r.PROVINSI || "Sulawesi Selatan",
      "Kab / kota": r["Kab / kota"] || r["Kab/Kota"] || r.Kabupaten || "—",
      lat: +r.lat || -3, lon: +r.lon || 120,
      "Komoditas": komoditas, "OPT": opt,
      TMAX: tmax, TMIN: tmin, TAVG: tavg,
      PRCP: prcp, RH: rh, WDSP: wdsp,
      GDD: +gdd.toFixed(1), AGDD: 0,
      kasus_opt: +(r.kasus_opt ?? r.Kasus ?? 0),
      intensitas_opt: +(r.intensitas_opt ?? r.Intensitas ?? 0),
      enso_anomaly: anomaly, ENSO: DM.classifyEnso(anomaly),
      tbase: DM.tbaseMap[opt] || 10
    });
  }
  return norm;
};
