/* ==================================================================
   Yen Lee Fireweld — Project Details (dynamic)
   ================================================================== */
(function () {
  const API_BASE = window.YLF_API_BASE || '';
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  const loadingEl = document.getElementById('pdLoading');
  const rootEl = document.getElementById('pdRoot');

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function formatDate(d) {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (e) { return d; }
  }

  if (!slug) {
    loadingEl.innerHTML = '<p>No project specified. <a href="projects.html" style="color:var(--fire-3,#ffb020)">Back to Projects</a></p>';
    return;
  }

  async function load() {
    const attemptFetch = async (retriesLeft) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      try {
        const res = await fetch(`${API_BASE}/api/projects/${encodeURIComponent(slug)}`, { signal: controller.signal });
        clearTimeout(timer);
        if (res.status === 404) throw Object.assign(new Error('not found'), { isNotFound: true });
        if (!res.ok) throw new Error(`Request failed (${res.status}).`);
        return await res.json();
      } catch (err) {
        clearTimeout(timer);
        if (!err.isNotFound && retriesLeft > 0) {
          await new Promise((r) => setTimeout(r, 500));
          return attemptFetch(retriesLeft - 1);
        }
        throw err;
      }
    };

    try {
      const { project: p, related, prev, next } = await attemptFetch(2);
      render(p, related, prev, next);
    } catch (e) {
      console.error('[Project Details] Failed to load project:', e);
      if (e.isNotFound) {
        loadingEl.innerHTML = '<p>This project could not be found. <a href="projects.html" style="color:var(--fire-3,#ffb020)">Back to Projects</a></p>';
      } else {
        loadingEl.innerHTML = `
          <p>Could not load this project page right now. Please try again.</p>
          <button type="button" id="pdRetryBtn" class="btn-ghost" style="cursor:pointer;margin-top:10px;">Retry</button>`;
        document.getElementById('pdRetryBtn')?.addEventListener('click', load);
      }
    }
  }

  function render(p, related, prev, next) {
    document.title = `${p.projectName} | Yen Lee Fireweld`;
    document.getElementById('pdPageTitle').textContent = `${p.projectName} | Yen Lee Fireweld`;
    document.getElementById('pdMetaDesc').setAttribute('content', p.shortDescription || p.projectName);

    document.getElementById('pdHeroImg').src = p.featuredImage || 'images/project-bg.jpg';
    document.getElementById('pdCategory').textContent = p.projectCategory || '';
    document.getElementById('pdTitle').textContent = p.projectName;
    document.getElementById('pdSiteName').textContent = p.siteName || '';
    document.getElementById('pdLocation').textContent = p.siteLocation || '';
    document.getElementById('pdStatus').innerHTML = p.projectStatus ? `<span class="pcard-badge ${p.projectStatus}">${p.projectStatus}</span>` : '';

    document.getElementById('pdClient').textContent = p.clientName || '—';
    document.getElementById('pdDays').dataset.countto = p.numberOfWorkingDays || 0;
    document.getElementById('pdStart').textContent = formatDate(p.startDate);
    document.getElementById('pdEnd').textContent = formatDate(p.completionDate);
    document.getElementById('pdCondition').textContent = p.siteCondition || '—';

    document.getElementById('pdDescription').innerHTML = p.projectDescription || '<p>No description provided.</p>';
    document.getElementById('pdScope').innerHTML = p.scopeOfWork || '<p>No scope details provided.</p>';

    // Before / After
    if (p.beforeImages?.length && p.afterImages?.length) {
      document.getElementById('pdBASection').hidden = false;
      document.getElementById('pdBeforeImg').src = p.beforeImages[0];
      document.getElementById('pdAfterImg').src = p.afterImages[0];
      initBeforeAfterSlider();
    }

    // Timeline (derived from start / during / completion)
    const tlItems = [];
    if (p.startDate) tlItems.push({ date: p.startDate, title: 'Site mobilization & start of works' });
    if (p.duringImages?.length) tlItems.push({ date: '', title: `Works in progress — ${p.duringImages.length} site update${p.duringImages.length > 1 ? 's' : ''} logged` });
    if (p.completionDate) tlItems.push({ date: p.completionDate, title: 'Project completed & handed over' });
    if (tlItems.length) {
      document.getElementById('pdTimelineSection').hidden = false;
      document.getElementById('pdTimeline').innerHTML = tlItems.map((t) => `
        <div class="pd-tl-item">
          <div class="pd-tl-date">${t.date ? formatDate(t.date) : ''}</div>
          <div class="pd-tl-title">${escapeHtml(t.title)}</div>
        </div>`).join('');
    }

    // Safety certifications
    if (p.safetyCertifications?.length) {
      document.getElementById('pdSafetySection').hidden = false;
      document.getElementById('pdSafetyTags').innerHTML = p.safetyCertifications.map((s) => `<span class="pd-tag">${escapeHtml(s)}</span>`).join('');
    }
    // Equipment
    if (p.equipmentUsed?.length) {
      document.getElementById('pdEquipmentSection').hidden = false;
      document.getElementById('pdEquipmentTags').innerHTML = p.equipmentUsed.map((s) => `<span class="pd-tag">${escapeHtml(s)}</span>`).join('');
    }

    // Gallery (combine before/during/after/gallery, dedup)
    const allImages = [...(p.beforeImages||[]), ...(p.duringImages||[]), ...(p.afterImages||[]), ...(p.galleryImages||[])];
    if (allImages.length) {
      document.getElementById('pdGallerySection').hidden = false;
      document.getElementById('pdGallery').innerHTML = allImages.map((url, i) => `<img src="${url}" alt="Project image ${i+1}" loading="lazy" data-idx="${i}">`).join('');
      initLightbox(allImages);
    }

    // Map
    if (p.googleMapLink) {
      document.getElementById('pdMapSection').hidden = false;
      const embedUrl = p.googleMapLink.includes('/embed')
        ? p.googleMapLink
        : `https://www.google.com/maps?q=${encodeURIComponent(p.siteLocation || p.projectName)}&output=embed`;
      document.getElementById('pdMapFrame').src = embedUrl;
    }

    // Testimonial
    if (p.customerTestimonial) {
      document.getElementById('pdTestimonialSection').hidden = false;
      document.getElementById('pdTestimonial').textContent = p.customerTestimonial;
    }

    // PDF download
    if (p.pdfReport) {
      const pdfBtn = document.getElementById('pdDownloadPdf');
      pdfBtn.hidden = false;
      pdfBtn.href = p.pdfReport;
      pdfBtn.setAttribute('download', '');
    }

    // Share
    document.getElementById('pdShareBtn').addEventListener('click', async () => {
      const shareData = { title: p.projectName, text: p.shortDescription || p.projectName, url: window.location.href };
      if (navigator.share) {
        try { await navigator.share(shareData); } catch (e) {}
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    });

    // Prev / Next
    const prevLink = document.getElementById('pdPrevLink');
    const nextLink = document.getElementById('pdNextLink');
    if (prev) { prevLink.href = `project-details.html?slug=${prev.slug}`; prevLink.querySelector('.nm').textContent = prev.projectName; }
    else prevLink.style.visibility = 'hidden';
    if (next) { nextLink.href = `project-details.html?slug=${next.slug}`; nextLink.querySelector('.nm').textContent = next.projectName; }
    else nextLink.style.visibility = 'hidden';

    // Related
    if (related?.length) {
      document.getElementById('pdRelatedSection').hidden = false;
      document.getElementById('pdRelatedGrid').innerHTML = related.map((r, i) => `
        <div class="pcard" style="--i:${i}">
          <div class="pcard-hero"><img src="${r.featuredImage || 'images/project-bg.jpg'}" alt="${escapeHtml(r.projectName)}" loading="lazy">${r.projectStatus ? `<span class="pcard-badge ${r.projectStatus}">${r.projectStatus}</span>` : ''}</div>
          <div class="pcard-glass-sheen"></div><div class="pcard-light"></div>
          <div class="pcard-body">
            <h3 class="pcard-title">${escapeHtml(r.projectName)}</h3>
            <p class="pcard-meta">${escapeHtml(r.siteLocation || '')}</p>
            <a class="pcard-cta" href="project-details.html?slug=${r.slug}">View Details →</a>
          </div>
        </div>`).join('');
    }

    loadingEl.style.display = 'none';
    rootEl.hidden = false;

    initAnimations();
  }

  function initBeforeAfterSlider() {
    const slider = document.getElementById('pdBASlider');
    const afterWrap = document.getElementById('pdAfterWrap');
    const handle = document.getElementById('pdBAHandle');
    let dragging = false;

    function setPos(clientX) {
      const rect = slider.getBoundingClientRect();
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      afterWrap.style.width = pct + '%';
      handle.style.left = pct + '%';
    }
    handle.addEventListener('mousedown', () => (dragging = true));
    window.addEventListener('mouseup', () => (dragging = false));
    window.addEventListener('mousemove', (e) => { if (dragging) setPos(e.clientX); });
    handle.addEventListener('touchstart', () => (dragging = true));
    window.addEventListener('touchend', () => (dragging = false));
    window.addEventListener('touchmove', (e) => { if (dragging && e.touches[0]) setPos(e.touches[0].clientX); });
    slider.addEventListener('click', (e) => setPos(e.clientX));
  }

  function initLightbox(images) {
    const lightbox = document.getElementById('pdLightbox');
    const img = document.getElementById('pdLightboxImg');
    let idx = 0;
    function open(i) { idx = i; img.src = images[i]; lightbox.classList.add('is-open'); }
    function close() { lightbox.classList.remove('is-open'); }
    function nav(delta) { idx = (idx + delta + images.length) % images.length; img.src = images[idx]; }

    document.querySelectorAll('#pdGallery img').forEach((el) => el.addEventListener('click', () => open(Number(el.dataset.idx))));
    document.getElementById('pdLightboxClose').addEventListener('click', close);
    document.getElementById('pdLightboxPrev').addEventListener('click', () => nav(-1));
    document.getElementById('pdLightboxNext').addEventListener('click', () => nav(1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') nav(-1);
      if (e.key === 'ArrowRight') nav(1);
    });
  }

  function initAnimations() {
    if (!window.gsap) return;
    // Parallax hero image
    gsap.to('#pdHeroImg', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.pd-hero', start: 'top top', end: 'bottom top', scrub: true } });

    // Scroll reveal for each section
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      gsap.fromTo(el, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });

    // Count-up stat
    document.querySelectorAll('[data-countto]').forEach((el) => {
      const target = Number(el.dataset.countto) || 0;
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target, duration: 1.2, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%' },
        onUpdate: () => { el.textContent = Math.round(obj.val); },
      });
    });
  }

  load();
})();
