/* ==========================================================================
   YEN LEE FIREWELD — ENTERPRISE ENHANCEMENTS
   Adds the two premium interactions not already covered by premium-2026.js:
   button ripple feedback, and lightweight image parallax on scroll.
   Loaded LAST, after premium-2026.js.
   ========================================================================== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    initRipple();
    initParallax();
  }

  /* ---------- Button ripple ---------- */
  function initRipple() {
    var selector = ".btn, a.btn, .btn-primary-lg, .btn-ghost-lg";
    document.addEventListener("click", function (e) {
      var target = e.target.closest(selector);
      if (!target) return;

      var rect = target.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var ripple = document.createElement("span");
      ripple.className = "ripple-effect";
      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
      ripple.style.top = (e.clientY - rect.top - size / 2) + "px";

      var computed = window.getComputedStyle(target);
      if (computed.position === "static") target.style.position = "relative";
      target.style.overflow = "hidden";

      target.appendChild(ripple);
      ripple.addEventListener("animationend", function () {
        ripple.remove();
      });
    });
  }

  /* ---------- Lightweight image parallax ---------- */
  function initParallax() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var candidates = document.querySelectorAll(
      ".page-banner img, .hero img, #hero img, .home-hero img, .about-banner img"
    );
    if (!candidates.length) return;

    var layers = [];
    candidates.forEach(function (img) {
      if (img.closest(".parallax-img-wrap")) {
        layers.push(img);
        return;
      }
      layers.push(img);
    });

    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      layers.forEach(function (img) {
        var rect = img.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        var progress = (rect.top - vh / 2) / vh;
        var offset = progress * 24;
        img.style.transform = "translateY(" + offset.toFixed(1) + "px) scale(1.06)";
      });
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    update();
  }
})();
