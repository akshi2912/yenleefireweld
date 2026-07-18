/* ==========================================================================
   YEN LEE FIREWELD — PRODUCT & CATEGORY EXPERIENCE JS
   Scroll-reveal + stagger + subtle 3D tilt for .catalog-card / .product-card
   / hero content. No dependencies. Respects prefers-reduced-motion.
   ========================================================================== */
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var revealTargets = document.querySelectorAll(
      '.catalog-card, .product-card, .category-hero-content, .rk-feature, .rk-stat'
    );

    // stagger index per parent container so each grid counts from 0
    var counters = new Map();
    revealTargets.forEach(function (el) {
      var parent = el.parentElement;
      var n = counters.get(parent) || 0;
      el.style.setProperty('--i', Math.min(n, 8));
      counters.set(parent, n + 1);
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealTargets.forEach(function (el) { el.classList.add('in-view'); });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );
      revealTargets.forEach(function (el) { io.observe(el); });
    }

    // subtle pointer tilt on catalog/product cards (desktop only)
    if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var tiltTargets = document.querySelectorAll('.catalog-card, .product-card');
      tiltTargets.forEach(function (card) {
        var raf = null;
        card.addEventListener('mousemove', function (e) {
          var rect = card.getBoundingClientRect();
          var x = (e.clientX - rect.left) / rect.width - 0.5;
          var y = (e.clientY - rect.top) / rect.height - 0.5;
          if (raf) cancelAnimationFrame(raf);
          raf = requestAnimationFrame(function () {
            card.style.transform =
              'perspective(900px) rotateX(' + (y * -6).toFixed(2) + 'deg) rotateY(' +
              (x * 8).toFixed(2) + 'deg) translateY(-4px)';
          });
        });
        card.addEventListener('mouseleave', function () {
          if (raf) cancelAnimationFrame(raf);
          card.style.transform = '';
        });
      });
    }

    // animated count-up for .rk-num[data-count]
    var counters2 = document.querySelectorAll('.rk-num[data-count]');
    if (counters2.length && 'IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var target = parseFloat(el.getAttribute('data-count'));
          var suffix = el.getAttribute('data-suffix') || '';
          var dur = 1200, start = null;
          function step(ts) {
            if (!start) start = ts;
            var p = Math.min((ts - start) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
          cio.unobserve(el);
        });
      }, { threshold: 0.5 });
      counters2.forEach(function (el) { cio.observe(el); });
    }
  });
})();
