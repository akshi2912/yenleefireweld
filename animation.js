/*===========================================================
  YEN LEE FIREWELD — SCROLL / TEXT ANIMATION ENGINE
  Automatically tags common section/card elements as
  "reveal" targets (no HTML edits needed per page) and
  fades/slides them in as they enter the viewport.
===========================================================*/

(function () {

    // Elements that should fade+slide up as a whole block
    const revealSelectors = [
        ".section-title",
        ".about-image",
        ".about-content",
        ".contact-info",
        ".contact-form",
        ".client-slider",
        ".map-box",
        ".map",
        ".faq-item"
    ];

    // Elements that should stagger their direct children in
    // (grids of cards, icons, stats, etc.)
    const staggerSelectors = [
        ".service-grid",
        ".product-grid",
        ".project-grid",
        ".why-grid",
        ".stats-grid",
        ".testimonial-grid",
        ".footer-grid",
        ".gallery-grid",
        ".value-grid",
        ".team-grid",
        ".info-box",
        ".product-features",
        ".feature-grid"
    ];

    revealSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            if (!el.classList.contains("reveal")) {
                el.classList.add("reveal");
            }
        });
    });

    staggerSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            el.classList.add("reveal-stagger");
        });
    });

    // Alternate left/right reveal for about-style two-column rows
    document.querySelectorAll(".about-container, .about-row").forEach(row => {
        const kids = row.children;
        if (kids[0]) { kids[0].classList.remove("reveal"); kids[0].classList.add("reveal-left"); }
        if (kids[1]) { kids[1].classList.remove("reveal"); kids[1].classList.add("reveal-right"); }
    });

    const targets = document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-stagger");

    if ("IntersectionObserver" in window) {

        const observer = new IntersectionObserver((entries, obs) => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {
                    entry.target.classList.add("active");
                    obs.unobserve(entry.target);
                }

            });

        }, {
            threshold: 0.15,
            rootMargin: "0px 0px -60px 0px"
        });

        targets.forEach(el => observer.observe(el));

    } else {
        // Fallback: no IntersectionObserver support, just show everything
        targets.forEach(el => el.classList.add("active"));
    }

    /*===========================================================
      HERO TAGLINE TYPEWRITER (only runs if a .hero-type element
      exists on the page — used for an extra animated line under
      the main hero heading)
    ===========================================================*/

    const typeEl = document.querySelector(".hero-type");

    if (typeEl) {

        const phrases = JSON.parse(typeEl.getAttribute("data-phrases") || "[]");

        if (phrases.length) {

            let phraseIndex = 0;
            let charIndex = 0;
            let deleting = false;

            const type = () => {

                const current = phrases[phraseIndex];

                if (!deleting) {

                    charIndex++;
                    typeEl.textContent = current.slice(0, charIndex);

                    if (charIndex === current.length) {
                        deleting = true;
                        setTimeout(type, 1400);
                        return;
                    }

                } else {

                    charIndex--;
                    typeEl.textContent = current.slice(0, charIndex);

                    if (charIndex === 0) {
                        deleting = false;
                        phraseIndex = (phraseIndex + 1) % phrases.length;
                    }

                }

                setTimeout(type, deleting ? 45 : 90);

            };

            type();

        }

    }

})();
