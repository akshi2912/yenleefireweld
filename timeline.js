// Company Timeline: reveal-on-scroll + count-up year animation (0 -> year)
document.addEventListener('DOMContentLoaded', function () {

    var items = document.querySelectorAll('.timeline-item');
    if (!items.length) return;

    function animateYear(el) {
        if (el.dataset.animated === 'true') return;
        el.dataset.animated = 'true';

        var target = parseInt(el.getAttribute('data-target'), 10);
        var label = el.getAttribute('data-label');
        if (isNaN(target)) return;

        var duration = 1400;
        var startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            // ease-out for a smooth finish
            var eased = 1 - Math.pow(1 - progress, 3);
            var current = Math.floor(eased * target);
            el.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = label ? label : target;
            }
        }

        requestAnimationFrame(step);
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                var yearEl = entry.target.querySelector('.timeline-year');
                if (yearEl) animateYear(yearEl);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.35 });

    items.forEach(function (item) {
        observer.observe(item);
    });
});
