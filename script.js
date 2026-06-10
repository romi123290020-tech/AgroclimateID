/* ==========================================================
   script.js — Main entry, theme toggle, lifecycle
   ========================================================== */

(function () {
  const $loader = document.getElementById('loader');
  const $status = document.getElementById('loader-status');
  const setStatus = (s) => { if ($status) $status.textContent = s; };

  function hideLoader() {
    if (!$loader) return;
    $loader.style.transition = 'opacity .4s ease';
    $loader.style.opacity = '0';
    setTimeout(() => $loader.remove(), 420);
  }

  /* -------- Theme toggle -------- */
  const themeBtn = document.getElementById('theme-toggle');
  const setTheme = (t) => {
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
    try { localStorage.setItem('dm-theme', t); } catch (e) {}
    // re-render charts with new theme
    if (DM.state && DM.state.raw && DM.state.raw.length) {
      DM.renderAllCharts();
      DM.renderKPIs();
    }
  };
  const savedTheme = (function () { try { return localStorage.getItem('dm-theme'); } catch (e) { return null; } })() || 'light';
  setTheme(savedTheme);
  themeBtn.addEventListener('click', () => setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

  /* -------- File upload -------- */
  document.getElementById('file-upload').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setStatus('memproses file…');
    $loader.style.opacity = '1';
    $loader.style.display = 'flex';
    let merged = [];
    for (const f of files) {
      try {
        const raw = await DM.parseWorkbook(f);
        const norm = DM.normalizeRows(raw);
        merged = merged.concat(norm);
      } catch (err) { console.warn('Gagal parsing', f.name, err); }
    }
    if (merged.length) {
      DM.state.raw = merged;
      DM.populateFilters();
      DM.refreshAll();
    }
    hideLoader();
  });

  /* -------- Refresh orchestrator -------- */
  DM.refreshAll = function () {
    DM.applyFilters();
    DM.renderHero();
    DM.renderKPIs();
    DM.renderMonCards();
    DM.renderMap();
    DM.renderAllCharts();
    DM.generateInsights();
    DM.renderTable();
  };

  /* -------- Boot -------- */
  async function boot() {
    setStatus('membangkitkan dataset iklim…');
    // yield to UI so loader is visible
    await new Promise(r => setTimeout(r, 30));
    DM.state.raw = DM.generateSample();
    setStatus('menyiapkan filter…');
    await new Promise(r => setTimeout(r, 20));
    DM.populateFilters();
    DM.bindFilters();

    setStatus('me-render dashboard…');
    await new Promise(r => setTimeout(r, 20));
    DM.initMap();
    DM.refreshAll();

    // export bindings
    document.getElementById('btn-png').addEventListener('click', DM.exportPNG);
    document.getElementById('btn-pdf').addEventListener('click', DM.exportPDF);
    document.getElementById('btn-xlsx').addEventListener('click', DM.exportExcel);

    // chart carousel controls
    initCarousel();

    if (window.lucide) lucide.createIcons();
    hideLoader();
  }

  function initCarousel() {
    const car = document.getElementById('chart-carousel');
    if (!car) return;
    const prev = document.getElementById('carousel-prev');
    const next = document.getElementById('carousel-next');
    const dotsEl = document.getElementById('carousel-dots');

    const cards = car.querySelectorAll('.chart-card');
    dotsEl.innerHTML = Array.from(cards).map((_, i) => `<button class="dot${i === 0 ? ' active' : ''}" data-i="${i}"></button>`).join('');
    const dots = dotsEl.querySelectorAll('.dot');

    const stepWidth = () => (cards[0] ? cards[0].getBoundingClientRect().width + 16 : 600);
    prev.addEventListener('click', () => car.scrollBy({ left: -stepWidth(), behavior: 'smooth' }));
    next.addEventListener('click', () => car.scrollBy({ left:  stepWidth(), behavior: 'smooth' }));

    dots.forEach(d => d.addEventListener('click', () => {
      const i = +d.dataset.i;
      car.scrollTo({ left: i * stepWidth(), behavior: 'smooth' });
    }));

    car.addEventListener('scroll', () => {
      const i = Math.round(car.scrollLeft / stepWidth());
      dots.forEach((d, idx) => d.classList.toggle('active', idx === i));
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
