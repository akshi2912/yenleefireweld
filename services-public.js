/* ==================================================================
   Public Services page — renders services added via
   admin/add-service.html into the existing Services grid, styled to
   match the static service cards. Falls back to showing nothing extra
   if none have been added yet (the static catalogue still shows as
   normal either way).
   ================================================================== */
(function () {
  const API_BASE = window.YLF_API_BASE || '';
  let servicesCache = [];

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function cardHtml(s) {
    const icon = s.icon || 'images/fire-alarm.png';
    return `
      <button type="button" class="service-card qa-dynamic-card" data-service-id="${s.id}">
        <span class="qa-new-badge">NEW</span>
        <div class="service-icon"><img src="${icon}" alt="${escapeHtml(s.serviceName)}" loading="lazy"></div>
        <h3>${escapeHtml(s.serviceName)}</h3>
        <p>${escapeHtml(s.shortDescription || s.category)}</p>
        <span class="service-link">See Details →</span>
      </button>`;
  }

  function buildDetailModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'qa-detail-backdrop';
    backdrop.innerHTML = `
      <div class="qa-detail-modal" role="dialog" aria-modal="true">
        <button type="button" class="qa-close" aria-label="Close">&times;</button>
        <div id="qaDetailBody"></div>
      </div>`;
    document.body.appendChild(backdrop);

    function close() {
      backdrop.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    backdrop.querySelector('.qa-close').addEventListener('click', close);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop.classList.contains('is-open')) close();
    });

    return {
      open(service) {
        const body = backdrop.querySelector('#qaDetailBody');
        const icon = service.icon || 'images/fire-alarm.png';
        const features = (service.features || [])
          .map((f) => `<li>${escapeHtml(f)}</li>`)
          .join('');
        body.innerHTML = `
          <img class="qa-detail-icon" src="${icon}" alt="${escapeHtml(service.serviceName)}">
          <h3>${escapeHtml(service.serviceName)}</h3>
          <div class="qa-detail-category">${escapeHtml(service.category)}</div>
          <p class="qa-detail-desc">${escapeHtml(service.fullDescription || service.shortDescription || 'Details coming soon.')}</p>
          ${features ? `<ul class="qa-detail-features">${features}</ul>` : ''}
        `;
        backdrop.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      },
    };
  }

  async function loadDynamicServices() {
    const container = document.getElementById('dynamicServicesContainer');
    if (!container) return;

    try {
      const res = await fetch(`${API_BASE}/api/services`);
      if (!res.ok) return;
      const data = await res.json();
      servicesCache = data.services || [];
      if (!servicesCache.length) return;

      container.innerHTML = servicesCache.map(cardHtml).join('');

      const detailModal = buildDetailModal();
      container.querySelectorAll('[data-service-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const service = servicesCache.find((s) => s.id === btn.dataset.serviceId);
          if (service) detailModal.open(service);
        });
      });
    } catch (e) {
      // Quietly leave the static catalogue as-is.
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDynamicServices);
  } else {
    loadDynamicServices();
  }
})();
