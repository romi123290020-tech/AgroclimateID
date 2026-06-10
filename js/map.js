/* ==========================================================
   map.js — Leaflet map with markers + heatmap
   ========================================================== */

window.DM = window.DM || {};
DM._map = null;
DM._mapLayers = { markers: null, heat: null };

DM.initMap = function () {
  if (DM._map) return;
  DM._map = L.map('map-canvas', { scrollWheelZoom: false, attributionControl: false })
    .setView([-2.5, 118], 5);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd', maxZoom: 19
  }).addTo(DM._map);
};

DM.renderMap = function () {
  if (!DM._map) DM.initMap();
  const rows = DM.state.filtered.length ? DM.state.filtered : DM.state.raw;

  if (DM._mapLayers.markers) DM._map.removeLayer(DM._mapLayers.markers);
  if (DM._mapLayers.heat)    DM._map.removeLayer(DM._mapLayers.heat);

  // aggregate per kab
  const agg = {};
  rows.forEach(r => {
    const k = `${r.Provinsi}||${r["Kab / kota"]}`;
    if (!agg[k]) agg[k] = { provinsi: r.Provinsi, kab: r["Kab / kota"], lat: r.lat, lon: r.lon, list: [] };
    agg[k].list.push(r);
  });

  const markers = L.layerGroup();
  const heatPoints = [];

  Object.values(agg).forEach(g => {
    const gdd  = DM._avg(g.list, 'GDD');
    const rh   = DM._avg(g.list, 'RH');
    const prcp = DM._avg(g.list, 'PRCP');
    const wdsp = DM._avg(g.list, 'WDSP');
    const agdd = DM._sum(g.list, 'GDD');
    const intensitas = DM._avg(g.list, 'intensitas_opt');
    const ensoAv = DM._avg(g.list, 'enso_anomaly');
    const enso = DM.classifyEnso(ensoAv);
    const risk = DM.riskLevel(gdd, rh, prcp);
    const color = risk.label === 'Bahaya' ? '#ef4444' : risk.label === 'Waspada' ? '#f59e0b' : '#10b981';

    L.circleMarker([g.lat, g.lon], {
      radius: 6 + Math.min(14, intensitas / 6),
      color: '#ffffff', weight: 2, fillColor: color, fillOpacity: .85
    }).bindPopup(`
      <div class="popup-card">
        <h4>${g.kab}</h4>
        <div class="text-[10px] text-slate-500 mb-1">${g.provinsi}</div>
        <div class="row"><span>Komoditas</span><span>${Array.from(new Set(g.list.map(r => r.Komoditas))).join(', ')}</span></div>
        <div class="row"><span>GDD</span><span>${gdd}</span></div>
        <div class="row"><span>AGDD</span><span>${agdd}</span></div>
        <div class="row"><span>RH</span><span>${rh}%</span></div>
        <div class="row"><span>WDSP</span><span>${wdsp} m/s</span></div>
        <div class="row"><span>PRCP</span><span>${prcp} mm</span></div>
        <div class="row"><span>ENSO</span><span>${enso}</span></div>
        <div class="row"><span>Status</span><span style="color:${color};font-weight:700">${risk.label}</span></div>
      </div>
    `).addTo(markers);

    heatPoints.push([g.lat, g.lon, Math.max(0.1, intensitas / 100)]);
  });

  DM._mapLayers.markers = markers.addTo(DM._map);
  if (window.L.heatLayer) {
    DM._mapLayers.heat = L.heatLayer(heatPoints, {
      radius: 35, blur: 25, maxZoom: 8, max: 1.0,
      gradient: { 0.2: '#10b981', 0.45: '#f59e0b', 0.75: '#f97316', 1.0: '#ef4444' }
    }).addTo(DM._map);
  }
};
