/* ============================================================
   Quick Add — floating "+" button + developer-code modal.
   Include this file + css/quick-add.css on projects.html,
   services.html and products.html. Set the type via:
     <body data-quick-add="project">   → projects.html
     <body data-quick-add="service">   → services.html
     <body data-quick-add="product">   → products.html

   Clicking "+" asks for the developer code only (no username, no
   password, no lock-icon login form). On success it redirects
   straight into the right "Add" screen in the developer console.
   ============================================================ */
(function () {
  const API_BASE = window.YLF_API_BASE || '';
  const TOKEN_KEY = 'ylf_dev_token';

  const TYPES = {
    project: {
      label: 'Add Project',
      sentence: 'Enter your company code to start a new submission.',
      redirect: 'admin/submit.html?type=project',
    },
    service: {
      label: 'Add Service',
      sentence: 'Enter your company code to start a new submission.',
      redirect: 'admin/submit.html?type=service',
    },
    product: {
      label: 'Add Product',
      sentence: 'Enter your company code to start a new submission.',
      redirect: 'admin/submit.html?type=product',
    },
  };

  function init() {
    const type = document.body.getAttribute('data-quick-add');
    const config = TYPES[type];
    if (!config) return; // no quick-add configured on this page

    const wrap = buildFab(config);
    const backdrop = buildModal(config);
    wireUp(wrap, backdrop, config);
  }

  function spawnRipple(button, evt) {
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.className = 'qa-ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    const x = (evt && evt.clientX ? evt.clientX - rect.left : rect.width / 2) - size / 2;
    const y = (evt && evt.clientY ? evt.clientY - rect.top : rect.height / 2) - size / 2;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    button.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  function buildFab(config) {
    const wrap = document.createElement('div');
    wrap.className = 'qa-fab-wrap';
    wrap.innerHTML = `
      <span class="qa-fab-label">${config.label}</span>
      <button type="button" class="qa-fab" aria-label="${config.label}" title="${config.label}">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v14M5 12h14"/></svg>
      </button>
    `;
    document.body.appendChild(wrap);
    return wrap;
  }

  function buildModal(config) {
    const backdrop = document.createElement('div');
    backdrop.className = 'qa-modal-backdrop';
    backdrop.innerHTML = `
      <div class="qa-modal" role="dialog" aria-modal="true" aria-labelledby="qaModalTitle">
        <button type="button" class="qa-close" aria-label="Close">&times;</button>

        <div id="qaStep1">
          <div class="qa-modal-icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              <circle cx="12" cy="16" r="1.4" fill="currentColor"></circle>
            </svg>
          </div>
          <h3 id="qaModalTitle">Company Access</h3>
          <p class="qa-modal-sub">${config.sentence}</p>

          <form id="qaForm" novalidate>
            <div class="qa-field">
              <label for="qaCode">Company Code</label>
              <div class="qa-field-input-row">
                <input type="password" id="qaCode" name="code" autocomplete="off" placeholder="Enter code" required>
                <button type="button" class="qa-toggle-visibility" id="qaToggleVis" aria-label="Show code">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
            </div>
            <div class="qa-error" id="qaError"></div>
            <div class="qa-modal-actions">
              <button type="button" class="qa-btn qa-btn-ghost" id="qaCancel">Cancel</button>
              <button type="submit" class="qa-btn qa-btn-primary" id="qaSubmit">
                <span id="qaSubmitLabel">Verify</span>
              </button>
            </div>
          </form>
        </div>

        <div id="qaStep2" class="qa-success" hidden>
          <div class="qa-success-check">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <p>Access granted</p>
          <span>Taking you to ${config.label}…</span>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
    return backdrop;
  }

  function wireUp(wrap, backdrop, config) {
    const fab = wrap.querySelector('.qa-fab');
    const modal = backdrop.querySelector('.qa-modal');
    const closeBtn = backdrop.querySelector('.qa-close');
    const cancelBtn = backdrop.querySelector('#qaCancel');
    const form = backdrop.querySelector('#qaForm');
    const codeInput = backdrop.querySelector('#qaCode');
    const errorEl = backdrop.querySelector('#qaError');
    const submitBtn = backdrop.querySelector('#qaSubmit');
    const submitLabel = backdrop.querySelector('#qaSubmitLabel');
    const toggleVis = backdrop.querySelector('#qaToggleVis');
    const step1 = backdrop.querySelector('#qaStep1');
    const step2 = backdrop.querySelector('#qaStep2');

    function openModal() {
      errorEl.textContent = '';
      codeInput.classList.remove('qa-input-error');
      form.reset();
      step1.hidden = false;
      step2.hidden = true;
      backdrop.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => codeInput.focus(), 60);
    }
    function closeModal() {
      backdrop.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    fab.addEventListener('click', (e) => {
      spawnRipple(fab, e);
      openModal();
    });
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop.classList.contains('is-open')) closeModal();
    });

    toggleVis.addEventListener('click', () => {
      const showing = codeInput.type === 'text';
      codeInput.type = showing ? 'password' : 'text';
      toggleVis.setAttribute('aria-label', showing ? 'Show code' : 'Hide code');
      toggleVis.innerHTML = showing
        ? `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
        : `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a19.9 19.9 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a19.9 19.9 0 0 1-3.22 4.34M14.12 14.12a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.textContent = '';
      codeInput.classList.remove('qa-input-error');
      const code = codeInput.value.trim();

      if (!code) {
        errorEl.textContent = 'Please enter the company code.';
        codeInput.classList.add('qa-input-error');
        return;
      }

      submitBtn.disabled = true;
      submitLabel.innerHTML = '<span class="qa-spinner"></span>';

      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          errorEl.textContent = data.error || 'Invalid Company Code';
          codeInput.classList.add('qa-input-error');
          modal.classList.remove('qa-shake');
          void modal.offsetWidth; // restart animation
          modal.classList.add('qa-shake');
          submitBtn.disabled = false;
          submitLabel.textContent = 'Verify';
          codeInput.focus();
          return;
        }

        sessionStorage.setItem(TOKEN_KEY, data.token);
        step1.hidden = true;
        step2.hidden = false;
        setTimeout(() => {
          window.location.href = config.redirect;
        }, 700);
      } catch (err) {
        errorEl.textContent = 'Could not reach the server. Please try again.';
        submitBtn.disabled = false;
        submitLabel.textContent = 'Verify';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
