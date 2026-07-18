/*===========================================================
  HOMEPAGE-ONLY BEHAVIOR
===========================================================*/

(function () {

    /*=========================
      STATS COUNTER — animate
      only once the statistics
      section scrolls into view
    =========================*/

    const counters = document.querySelectorAll(".counter");

    if (counters.length) {

        const animateCounter = (counter) => {

            counter.innerText = "0";

            const target = +counter.getAttribute("data-target");
            const isHours = target === 24; // "24/7" special case
            const duration = 1500;
            const steps = 60;
            const increment = target / steps;
            let current = 0;
            let step = 0;

            const tick = () => {

                step++;
                current += increment;

                if (step >= steps) {
                    counter.innerText = target + (isHours ? "/7" : "+");
                    return;
                }

                counter.innerText = Math.ceil(current);
                setTimeout(tick, duration / steps);

            };

            tick();

        };

        const statsSection = document.querySelector(".statistics");

        if (statsSection && "IntersectionObserver" in window) {

            const statsObserver = new IntersectionObserver((entries, obs) => {

                entries.forEach(entry => {

                    if (entry.isIntersecting) {
                        counters.forEach(animateCounter);
                        obs.disconnect();
                    }

                });

            }, { threshold: 0.4 });

            statsObserver.observe(statsSection);

        } else {
            // No observer support (or no stats section) — just animate right away
            counters.forEach(animateCounter);
        }

    }

    /*=========================
      CLIENT LOGO SLIDER —
      pause the marquee while
      a visitor is hovering it
    =========================*/

    const clientSlider = document.querySelector(".client-slider");
    const clientTrack = document.querySelector(".client-track");

    if (clientSlider && clientTrack) {

        clientSlider.addEventListener("mouseenter", () => {
            clientTrack.style.animationPlayState = "paused";
        });

        clientSlider.addEventListener("mouseleave", () => {
            clientTrack.style.animationPlayState = "running";
        });

    }

})();
