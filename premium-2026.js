/* ==========================================================================
   YEN LEE FIREWELD — PREMIUM 2026 BEHAVIOUR LAYER
   Site-wide: ember particles, cursor glow, scroll progress, scroll reveals,
   magnetic buttons, animated counters.
   Depends on GSAP + ScrollTrigger (loaded via CDN in <head>).
   ========================================================================== */
(function(){
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  function init(){
    injectScrollProgress();
    injectCursorGlow();
    injectEmberCanvas();
    tagRevealTargets();
    initScrollReveal();
    initMagneticButtons();
    initCounters();
    initHeaderScrollState();
  }

  /* ---------- Scroll progress bar ---------- */
  function injectScrollProgress(){
    var bar = document.createElement("div");
    bar.id = "scroll-progress";
    document.body.appendChild(bar);
    window.addEventListener("scroll", function(){
      var h = document.documentElement;
      var scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
      bar.style.width = (scrolled || 0) + "%";
    }, { passive:true });
  }

  /* ---------- Mouse-follow glow ---------- */
  function injectCursorGlow(){
    if (window.matchMedia("(pointer:coarse)").matches) return;
    var glow = document.createElement("div");
    glow.id = "cursor-glow";
    document.body.appendChild(glow);
    var tx=0, ty=0, cx=0, cy=0;
    window.addEventListener("mousemove", function(e){ tx=e.clientX; ty=e.clientY; }, { passive:true });
    (function loop(){
      cx += (tx-cx)*0.12; cy += (ty-cy)*0.12;
      glow.style.left = cx+"px"; glow.style.top = cy+"px";
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Ember / spark particle background (lightweight canvas) ---------- */
  function injectEmberCanvas(){
    var canvas = document.createElement("canvas");
    canvas.id = "ember-canvas";
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var w, h, particles = [];
    var COUNT = window.innerWidth < 768 ? 26 : 55;

    function resize(){
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize, { passive:true });
    resize();

    function Ember(){
      this.reset(true);
    }
    Ember.prototype.reset = function(initial){
      this.x = Math.random()*w;
      this.y = initial ? Math.random()*h : h + 20;
      this.r = 0.6 + Math.random()*2.2;
      this.speed = 0.3 + Math.random()*0.9;
      this.drift = (Math.random()-0.5)*0.6;
      this.alpha = 0.15 + Math.random()*0.55;
      var hue = Math.random() > 0.5 ? "255,91,31" : "255,176,32";
      this.color = hue;
    };
    Ember.prototype.update = function(){
      this.y -= this.speed;
      this.x += this.drift + Math.sin(this.y*0.01)*0.3;
      if (this.y < -20) this.reset(false);
    };
    Ember.prototype.draw = function(){
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
      ctx.fillStyle = "rgba("+this.color+","+this.alpha+")";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba("+this.color+",0.8)";
      ctx.fill();
    };

    for (var i=0;i<COUNT;i++) particles.push(new Ember());

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    function tick(){
      ctx.clearRect(0,0,w,h);
      for (var i=0;i<particles.length;i++){
        particles[i].update();
        particles[i].draw();
      }
      requestAnimationFrame(tick);
    }
    tick();
  }

  /* ---------- Tag likely elements for scroll-reveal ---------- */
  function tagRevealTargets(){
    var selectors = [
      ".product-card",".service-card",".card",".brand-card",".project-card",
      ".cert-card",".industry-card",".app-card",".testimonial-card",
      ".blog-card",".team-card",".section-title",".detail-gallery",".detail-info",
      ".quick-specs",".qs-item"
    ];
    document.querySelectorAll(selectors.join(",")).forEach(function(el){
      el.classList.add("reveal-up");
    });
  }

  /* ---------- Scroll reveal (IntersectionObserver, GSAP-free fallback) ---------- */
  function initScrollReveal(){
    if (!("IntersectionObserver" in window)){
      document.querySelectorAll(".reveal-up").forEach(function(el){ el.classList.add("in-view"); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    }, { threshold:0.12, rootMargin:"0px 0px -40px 0px" });
    document.querySelectorAll(".reveal-up").forEach(function(el){ io.observe(el); });

    // If GSAP is present, add a touch of stagger/parallax on top
    if (window.gsap && window.ScrollTrigger){
      gsap.registerPlugin(ScrollTrigger);
      gsap.utils.toArray(".page-banner h1").forEach(function(el){
        gsap.fromTo(el, {opacity:0, y:24}, {opacity:1, y:0, duration:1, ease:"power3.out"});
      });
    }
  }

  /* ---------- Magnetic buttons ---------- */
  function initMagneticButtons(){
    if (window.matchMedia("(pointer:coarse)").matches) return;
    var targets = document.querySelectorAll(".btn, .btn-primary-lg, .btn-ghost-lg");
    targets.forEach(function(btn){
      btn.classList.add("magnetic");
      btn.addEventListener("mousemove", function(e){
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width/2;
        var y = e.clientY - rect.top - rect.height/2;
        btn.style.transform = "translate("+ (x*0.18) +"px,"+ (y*0.35) +"px)";
      });
      btn.addEventListener("mouseleave", function(){
        btn.style.transform = "translate(0,0)";
      });
    });
  }

  /* ---------- Animated counters (elements with data-count or .counter-num) ---------- */
  function initCounters(){
    var counters = document.querySelectorAll("[data-count], .counter-num, .stat-num, [data-count-premium]");
    if (!counters.length) return;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        var raw = el.getAttribute("data-count") || el.textContent;
        var match = raw.match(/[\d.]+/);
        if (!match) return;
        var target = parseFloat(match[0]);
        var suffix = raw.replace(match[0], "");
        var current = 0;
        var duration = 1400;
        var start = null;
        function step(ts){
          if (!start) start = ts;
          var progress = Math.min((ts-start)/duration, 1);
          current = target * progress;
          el.textContent = (target % 1 === 0 ? Math.floor(current) : current.toFixed(1)) + suffix;
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = raw;
        }
        requestAnimationFrame(step);
      });
    }, { threshold:0.4 });
    counters.forEach(function(el){ io.observe(el); });
  }

  /* ---------- Header solid-on-scroll state ---------- */
  function initHeaderScrollState(){
    var header = document.getElementById("header") || document.querySelector("header");
    if (!header) return;
    window.addEventListener("scroll", function(){
      if (window.scrollY > 40) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    }, { passive:true });
  }

})();
