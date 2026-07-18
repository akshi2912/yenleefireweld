/* ==================================================================
   Yen Lee Fireweld — Public Project Listing (dynamic, CMS-driven)
   ================================================================== */
(function () {
  const API_BASE = window.YLF_API_BASE || '';
  const grid = document.getElementById('dynProjectGrid');
  if (!grid) return; // this script only runs on projects.html

  const searchInput = document.getElementById('dynSearch');
  const categorySelect = document.getElementById('dynCategory');
  const statusSelect = document.getElementById('dynStatus');
  const locationSelect = document.getElementById('dynLocation');
  const sortSelect = document.getElementById('dynSort');
  const pagination = document.getElementById('dynPagination');

  const PAGE_SIZE = 9;
  let currentPage = 1;
  let allProjects = []; // unpaginated, already filtered+sorted from the last load

  async function loadFilters() {
    try {
      const res = await fetch(`${API_BASE}/api/projects/filters`);
      const data = await res.json();
      fillSelect(categorySelect, data.categories, 'All Categories');
      fillSelect(statusSelect, data.statuses, 'All Statuses');
      fillSelect(locationSelect, data.locations, 'All Locations');
    } catch (e) { /* filters are optional; fail silently */ }
  }
  function fillSelect(select, values, placeholder) {
    if (!select) return;
    select.innerHTML = `<option value="">${placeholder}</option>` + values.map((v) => `<option>${v}</option>`).join('');
  }

  function statusBadge(status) { return `<span class="pcard-badge ${status}">${status}</span>`; }

  function formatDate(d) {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (e) { return d; }
  }

  function cardTemplate(p, i) {
    const img = p.featuredImage || 'images/project-bg.jpg';
    return `
      <div class="pcard" style="--i:${i}">
        <div class="pcard-hero">
          <img src="${img}" alt="${escapeHtml(p.projectName)}" loading="lazy">
          ${statusBadge(p.projectStatus)}
          ${p.isFeatured ? '<span class="pcard-featured-tag">Featured</span>' : ''}
        </div>
        <div class="pcard-glass-sheen"></div>
        <div class="pcard-light"></div>
        <div class="pcard-body">
          <h3 class="pcard-title">${escapeHtml(p.projectName)}</h3>
          <p class="pcard-meta"><strong>${escapeHtml(p.siteName || '')}</strong> · ${escapeHtml(p.siteLocation || '')}</p>
          ${p.clientName ? `<p class="pcard-client">Client: ${escapeHtml(p.clientName)}</p>` : ''}
          <p class="pcard-desc">${escapeHtml(p.shortDescription || '')}</p>
          <div class="pcard-stats">
            <div class="pcard-stat">Working Days<b>${p.numberOfWorkingDays || '—'}</b></div>
            <div class="pcard-stat">Completed<b>${formatDate(p.completionDate) || '—'}</b></div>
          </div>
          <a class="pcard-cta" href="project-details.html?slug=${encodeURIComponent(p.slug)}">View Details →</a>
        </div>
      </div>`;
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function attachTiltAndLight(card) {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const px = x / rect.width;
      const py = y / rect.height;
      const tiltX = (py - 0.5) * -8;
      const tiltY = (px - 0.5) * 10;
      card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
      card.style.setProperty('--mx', `${x}px`);
      card.style.setProperty('--my', `${y}px`);
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  }

  async function fetchWithRetry(url, { timeoutMs = 12000, retries = 2 } = {}) {
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`Request failed (${res.status}).`);
        return await res.json();
      } catch (err) {
        clearTimeout(timer);
        if (attempt < retries) {
          attempt += 1;
          await new Promise((r) => setTimeout(r, 500 * attempt));
          continue;
        }
        throw err;
      }
    }
  }

  function sortProjects(projects) {
    const sorted = projects.slice();
    switch (sortSelect?.value) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.completionDate || 0) - new Date(a.completionDate || 0));
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.completionDate || 0) - new Date(b.completionDate || 0));
        break;
      case 'name-asc':
        sorted.sort((a, b) => (a.projectName || '').localeCompare(b.projectName || ''));
        break;
      case 'name-desc':
        sorted.sort((a, b) => (b.projectName || '').localeCompare(a.projectName || ''));
        break;
      default:
        sorted.sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
    }
    return sorted;
  }

  async function loadProjects() {
    const params = new URLSearchParams();
    if (searchInput?.value.trim()) params.set('search', searchInput.value.trim());
    if (categorySelect?.value) params.set('category', categorySelect.value);
    if (statusSelect?.value) params.set('status', statusSelect.value);
    if (locationSelect?.value) params.set('location', locationSelect.value);

    grid.innerHTML = '<div class="dyn-empty">Loading projects…</div>';
    pagination.hidden = true;

    try {
      const data = await fetchWithRetry(`${API_BASE}/api/projects?${params.toString()}`);
      allProjects = sortProjects(data.projects || []);
      if (!allProjects.length) {
        grid.innerHTML = '<div class="dyn-empty">No projects match your search yet. Try a different filter.</div>';
        return;
      }
      renderPage(1);
    } catch (e) {
      console.error('[Projects] Failed to load projects:', e);
      grid.innerHTML = `
        <div class="dyn-empty">
          <p>Could not load projects right now. Please try again shortly.</p>
          <button type="button" id="dynRetryBtn" class="btn-ghost" style="cursor:pointer;margin-top:10px;">Retry</button>
        </div>`;
      document.getElementById('dynRetryBtn')?.addEventListener('click', loadProjects);
    }
  }

  function renderPage(page) {
    const totalPages = Math.max(1, Math.ceil(allProjects.length / PAGE_SIZE));
    currentPage = Math.min(Math.max(1, page), totalPages);

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = allProjects.slice(start, start + PAGE_SIZE);

    grid.innerHTML = pageItems.map(cardTemplate).join('');
    grid.querySelectorAll('.pcard').forEach(attachTiltAndLight);

    if (window.gsap) {
      gsap.fromTo(grid.querySelectorAll('.pcard'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' }
      );
    }

    renderPagination(totalPages);
    grid.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function renderPagination(totalPages) {
    if (totalPages <= 1) { pagination.hidden = true; pagination.innerHTML = ''; return; }
    pagination.hidden = false;

    const pages = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1) pages.push(p);
      else if (pages[pages.length - 1] !== '…') pages.push('…');
    }

    pagination.innerHTML = `
      <button type="button" class="dyn-page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>‹</button>
      ${pages.map((p) => p === '…'
        ? '<span class="dyn-page-ellipsis">…</span>'
        : `<button type="button" class="dyn-page-btn ${p === currentPage ? 'is-active' : ''}" data-page="${p}">${p}</button>`
      ).join('')}
      <button type="button" class="dyn-page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>›</button>
    `;
  }

  pagination.addEventListener('click', (e) => {
    const btn = e.target.closest('.dyn-page-btn');
    if (!btn || btn.disabled) return;
    renderPage(Number(btn.dataset.page));
  });

  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

  [searchInput].forEach((el) => el?.addEventListener('input', debounce(loadProjects, 300)));
  [categorySelect, statusSelect, locationSelect].forEach((el) => el?.addEventListener('change', loadProjects));
  sortSelect?.addEventListener('change', () => {
    allProjects = sortProjects(allProjects);
    renderPage(1);
  });

  loadFilters();
  loadProjects();
})();
