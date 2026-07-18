/* ==========================================================================
   YEN LEE FIREWELD — CINEMATIC 3D HERO (Three.js)
   A rotating field of ember particles + a glowing core, reacting to the
   mouse. Loaded only on index.html, inside the .hero / #hero section.
   Degrades gracefully: if Three.js fails to load, the CSS gradient hero
   underneath still looks complete on its own.
   ========================================================================== */
(function(){
  "use strict";

  document.addEventListener("DOMContentLoaded", function(){
    var hero = document.querySelector(".hero, #hero, .home-hero");
    if (!hero || typeof THREE === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var canvasHost = document.createElement("div");
    canvasHost.id = "hero-3d-canvas";
    hero.insertBefore(canvasHost, hero.firstChild);

    var width = hero.clientWidth, height = hero.clientHeight || 640;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(55, width/height, 0.1, 100);
    camera.position.z = 9;

    var renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    canvasHost.appendChild(renderer.domElement);

    // Glowing core
    var coreGeo = new THREE.IcosahedronGeometry(1.6, 2);
    var coreMat = new THREE.MeshBasicMaterial({
      color: 0xff5b1f, wireframe:true, transparent:true, opacity:0.35
    });
    var core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    var coreGlowGeo = new THREE.IcosahedronGeometry(1.15, 1);
    var coreGlowMat = new THREE.MeshBasicMaterial({ color:0xffb020, transparent:true, opacity:0.18 });
    var coreGlow = new THREE.Mesh(coreGlowGeo, coreGlowMat);
    scene.add(coreGlow);

    // Ember particle field
    var particleCount = width < 700 ? 260 : 520;
    var positions = new Float32Array(particleCount*3);
    var speeds = new Float32Array(particleCount);
    for (var i=0;i<particleCount;i++){
      var radius = 3 + Math.random()*6;
      var theta = Math.random()*Math.PI*2;
      var phi = Math.acos((Math.random()*2)-1);
      positions[i*3]   = radius*Math.sin(phi)*Math.cos(theta);
      positions[i*3+1] = radius*Math.sin(phi)*Math.sin(theta);
      positions[i*3+2] = radius*Math.cos(phi);
      speeds[i] = 0.2 + Math.random()*0.6;
    }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    var pMat = new THREE.PointsMaterial({
      color:0xffb020, size:0.045, transparent:true, opacity:0.85,
      blending:THREE.AdditiveBlending, depthWrite:false
    });
    var particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    var mouseX = 0, mouseY = 0, targetRotX = 0, targetRotY = 0;
    hero.addEventListener("mousemove", function(e){
      var rect = hero.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left)/rect.width - 0.5)*2;
      mouseY = ((e.clientY - rect.top)/rect.height - 0.5)*2;
    });

    window.addEventListener("resize", function(){
      width = hero.clientWidth; height = hero.clientHeight || 640;
      camera.aspect = width/height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });

    var clock = new THREE.Clock();
    function animate(){
      requestAnimationFrame(animate);
      var t = clock.getElapsedTime();

      core.rotation.y = t*0.15;
      core.rotation.x = t*0.08;
      coreGlow.rotation.y = -t*0.1;
      particles.rotation.y = t*0.03;

      targetRotX += (mouseY*0.3 - targetRotX)*0.04;
      targetRotY += (mouseX*0.3 - targetRotY)*0.04;
      scene.rotation.x = targetRotX;
      scene.rotation.y = targetRotY;

      var pulse = 1 + Math.sin(t*1.6)*0.05;
      core.scale.set(pulse, pulse, pulse);
      coreGlow.scale.set(pulse*1.05, pulse*1.05, pulse*1.05);

      renderer.render(scene, camera);
    }
    animate();
  });
})();
