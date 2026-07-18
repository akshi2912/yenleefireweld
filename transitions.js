/*==================================================
   YEN LEE FIREWELD — PAGE TRANSITIONS
   A single, consistent "slide-cover" transition on
   every internal navigation, plus the reveal
   animation on load.
===================================================*/

(function () {

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var overlay = document.querySelector(".page-transition");
    var body = document.body;

    if (!overlay || reduceMotion) return;

    var revealed = false;

    function reveal() {
        if (revealed) return;
        revealed = true;
        requestAnimationFrame(function () {
            body.classList.remove("pt-leaving");
            body.classList.add("pt-loaded");
        });
    }

    // If this page has a preloader (home page), wait for it to finish
    // fading out before playing the reveal so the two effects
    // don't fight each other. Otherwise reveal as soon as the DOM is ready.
    if (document.getElementById("preloader")) {
        window.addEventListener("load", function () {
            setTimeout(reveal, 500);
        });
    } else if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", reveal);
    } else {
        reveal();
    }

    // Failsafe: never let the overlay trap the user on a page.
    setTimeout(reveal, 2500);

    // Fix bfcache/back-forward navigation leaving the overlay mid-animation.
    window.addEventListener("pageshow", function (e) {
        if (e.persisted) {
            body.classList.remove("pt-leaving");
            revealed = false;
            reveal();
        }
    });

    // Intercept same-site .html link clicks to play the exit animation
    // before actually navigating.
    var links = document.querySelectorAll('a[href$=".html"]');
    var currentPath = window.location.pathname.split("/").pop() || "index.html";

    links.forEach(function (link) {

        var href = link.getAttribute("href");

        if (!href || link.target === "_blank") return;
        if (href === currentPath) return; // already on this page

        link.addEventListener("click", function (e) {

            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

            e.preventDefault();

            body.classList.remove("pt-loaded");
            body.classList.add("pt-leaving");

            setTimeout(function () {
                window.location.href = href;
            }, 900);

        });

    });

})();
