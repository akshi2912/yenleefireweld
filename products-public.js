/* ==================================================================
   Public Products page — renders the live "Latest Products" section
   from products added via admin/add-product.html. Falls back to
   staying hidden if there are none yet (the static catalogue below
   still shows as normal either way).
   ================================================================== */
(function () {
  const API_BASE = window.YLF_API_BASE || '';

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function cardHtml(p) {
    const img = p.image || 'images/product1.jpg';
    return `
      <div class="product-card">
        <div class="product-card-img"><img src="${img}" alt="${escapeHtml(p.productName)}" loading="lazy"></div>
        <h3>${escapeHtml(p.productName)}</h3>
        <p>${escapeHtml(p.shortDescription || p.category)}</p>
      </div>`;
  }

  async function loadLatestProducts() {
    const section = document.getElementById('latestProducts');
    const grid = document.getElementById('latestProductsGrid');
    if (!section || !grid) return;

    try {
      const res = await fetch(`${API_BASE}/api/products`);
      if (!res.ok) return;
      const data = await res.json();
      const products = (data.products || []).slice(0, 6);
      if (!products.length) return;

      grid.innerHTML = products.map(cardHtml).join('');
      section.hidden = false;
    } catch (e) {
      // Quietly leave the section hidden — the static catalogue is still there.
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadLatestProducts);
  } else {
    loadLatestProducts();
  }
})();
