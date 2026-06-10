/* ==========================================================
   export.js — PNG / PDF / Excel export
   ========================================================== */

window.DM = window.DM || {};

DM.exportPNG = async function () {
  const target = document.querySelector('main, body');
  // capture KPI + cards + analytics
  const wrap = document.getElementById('analytics');
  if (!wrap) return;
  const canvas = await html2canvas(wrap, { backgroundColor: null, scale: 2, useCORS: true });
  const link = document.createElement('a');
  link.download = `agroclimate-dashboard-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

DM.exportPDF = async function () {
  const { jsPDF } = window.jspdf;
  const sections = ['kpi', 'cards', 'map', 'analytics'];
  const pdf = new jsPDF('p', 'mm', 'a4');
  let first = true;
  for (const id of sections) {
    const el = document.getElementById(id);
    if (!el) continue;
    const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 1.4, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const w = 210;
    const h = (canvas.height * w) / canvas.width;
    if (!first) pdf.addPage();
    first = false;
    let y = 0;
    if (h > 297) {
      // split tall sections
      let remaining = h;
      while (remaining > 0) {
        pdf.addImage(imgData, 'PNG', 0, y, w, h);
        remaining -= 297;
        if (remaining > 0) { pdf.addPage(); y -= 297; }
      }
    } else {
      pdf.addImage(imgData, 'PNG', 0, 0, w, h);
    }
  }
  pdf.save(`agroclimate-dashboard-${Date.now()}.pdf`);
};

DM.exportExcel = function () {
  const rows = DM.state.filtered.length ? DM.state.filtered : DM.state.raw;
  const data = rows.map(r => ({
    DATE: r.DATE, Provinsi: r.Provinsi, "Kab / kota": r["Kab / kota"],
    Komoditas: r.Komoditas, OPT: r.OPT,
    TMAX: r.TMAX, TMIN: r.TMIN, TAVG: r.TAVG,
    PRCP: r.PRCP, RH: r.RH, WDSP: r.WDSP,
    GDD: r.GDD, AGDD: r.AGDD,
    ENSO: r.ENSO, anomaly: r.enso_anomaly,
    kasus_opt: r.kasus_opt, intensitas_opt: r.intensitas_opt
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'AgroClimate');
  XLSX.writeFile(wb, `agroclimate-data-${Date.now()}.xlsx`);
};
