/* ==========================================================================
   NEURALIS TECHFEST — INTERACTION + 3D SYSTEM
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  /* ==========================================================
     PRELOADER / BOOT SEQUENCE
     ========================================================== */
  const preloader = document.getElementById('preloader');
  const bootLines = document.getElementById('boot-lines');
  const bootBarFill = document.getElementById('boot-bar-fill');
  const bootPct = document.getElementById('boot-pct');

  const bootSequence = [
    '> NEURALIS BIOS v48.1 — initializing grid...',
    '> Mounting event registry [TECHFEST_2026]...',
    '> Calibrating neural core render pipeline...',
    '> Syncing 6 competition tracks...',
    '> Handshake complete. Welcome, builder.'
  ];

  let bootProgress = 0;
  let bootLineIndex = 0;

  function runBoot() {
    const lineInterval = reduceMotion ? 0 : 380;
    const totalTime = reduceMotion ? 0 : 1900;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      bootProgress = Math.min(100, Math.round((elapsed / totalTime) * 100));
      bootBarFill.style.width = bootProgress + '%';
      bootPct.textContent = bootProgress + '%';

      const expectedLines = Math.min(bootSequence.length, Math.floor((elapsed / totalTime) * bootSequence.length) + 1);
      while (bootLineIndex < expectedLines) {
        const div = document.createElement('div');
        div.textContent = bootSequence[bootLineIndex];
        bootLines.appendChild(div);
        bootLineIndex++;
      }

      if (elapsed < totalTime) {
        requestAnimationFrame(tick);
      } else {
        bootBarFill.style.width = '100%';
        bootPct.textContent = '100%';
        setTimeout(() => preloader.classList.add('done'), 250);
      }
    }
    requestAnimationFrame(tick);
  }
  runBoot();

  /* ==========================================================
     CUSTOM CURSOR
     ========================================================== */
  if (!isTouch) {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
    });

    function animateRing() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(animateRing);
    }
    animateRing();

    document.querySelectorAll('a, button, .track-card, input, select').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('active'));
      el.addEventListener('mouseleave', () => ring.classList.remove('active'));
    });
  }

  /* ==========================================================
     NAVBAR: scroll state, scrollspy, mobile menu
     ========================================================== */
  const navbar = document.getElementById('navbar');
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);

    let fromTop = window.scrollY + 140;
    navLinks.forEach(link => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const section = document.querySelector(targetId);
      if (section && section.offsetTop <= fromTop && section.offsetTop + section.offsetHeight > fromTop) {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { passive: true });

  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    const icon = menuToggle.querySelector('i');
    icon.className = navMenu.classList.contains('active') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
  });
  navLinks.forEach(link => link.addEventListener('click', () => {
    navMenu.classList.remove('active');
    menuToggle.querySelector('i').className = 'fa-solid fa-bars';
  }));

  /* ==========================================================
     THREE.JS SCENE — the "neural core"
     ========================================================== */
  const canvas = document.getElementById('webgl');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 14);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Core group (everything that spins/drags together)
  const coreGroup = new THREE.Group();
  scene.add(coreGroup);

  // Outer wireframe icosahedron
  const outerGeo = new THREE.IcosahedronGeometry(3.4, 1);
  const outerMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.55 });
  const outerMesh = new THREE.Mesh(outerGeo, outerMat);
  coreGroup.add(outerMesh);

  // Inner solid-ish icosahedron
  const innerGeo = new THREE.IcosahedronGeometry(1.7, 0);
  const innerMat = new THREE.MeshBasicMaterial({ color: 0xbd00ff, wireframe: true, transparent: true, opacity: 0.75 });
  const innerMesh = new THREE.Mesh(innerGeo, innerMat);
  coreGroup.add(innerMesh);

  // Orbiting rings
  const ringGroup = new THREE.Group();
  const ringColors = [0xff6c00, 0x00f0ff, 0xbd00ff];
  for (let i = 0; i < 3; i++) {
    const ringGeo = new THREE.TorusGeometry(4.6 + i * 0.5, 0.012, 8, 96);
    const ringMat = new THREE.MeshBasicMaterial({ color: ringColors[i], transparent: true, opacity: 0.5 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.random() * Math.PI;
    ring.rotation.y = Math.random() * Math.PI;
    ring.userData.spin = 0.0015 + i * 0.0008;
    ringGroup.add(ring);
  }
  coreGroup.add(ringGroup);

  // Particle shell around the core
  const particleCount = 900;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const r = 5.2 + Math.random() * 1.6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    particlePositions[i * 3 + 2] = r * Math.cos(phi);
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleMat = new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.035, transparent: true, opacity: 0.75 });
  const particles = new THREE.Points(particleGeo, particleMat);
  coreGroup.add(particles);

  // Deep starfield background (independent of core)
  const starCount = 1200;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 80;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 80;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 80 - 20;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.045, transparent: true, opacity: 0.4 });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  /* ---------- Pointer interaction: parallax + drag rotate ---------- */
  let targetRotX = 0, targetRotY = 0;
  let dragRotX = 0, dragRotY = 0;
  let isDragging = false;
  let lastPointer = { x: 0, y: 0 };
  let idleSpin = true;

  function pointerToNDC(clientX, clientY) {
    return {
      x: (clientX / window.innerWidth) * 2 - 1,
      y: -(clientY / window.innerHeight) * 2 + 1
    };
  }

  window.addEventListener('mousemove', (e) => {
    if (isDragging) return;
    const ndc = pointerToNDC(e.clientX, e.clientY);
    targetRotY = ndc.x * 0.35;
    targetRotX = ndc.y * 0.25;
  });

  canvas.addEventListener('pointerdown', (e) => {
    isDragging = true;
    idleSpin = false;
    lastPointer = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPointer.x;
    const dy = e.clientY - lastPointer.y;
    dragRotY += dx * 0.005;
    dragRotX += dy * 0.005;
    lastPointer = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('pointerup', () => {
    isDragging = false;
    setTimeout(() => { idleSpin = true; }, 1200);
  });
  // Touch support
  canvas.addEventListener('touchstart', (e) => {
    isDragging = true; idleSpin = false;
    const t = e.touches[0];
    lastPointer = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (!isDragging || !e.touches[0]) return;
    const t = e.touches[0];
    dragRotY += (t.clientX - lastPointer.x) * 0.005;
    dragRotX += (t.clientY - lastPointer.y) * 0.005;
    lastPointer = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  window.addEventListener('touchend', () => {
    isDragging = false;
    setTimeout(() => { idleSpin = true; }, 1200);
  });

  /* ---------- Scroll-driven camera / core motion (GSAP ScrollTrigger) ---------- */
  let scrollDolly = 0;    // camera z offset
  let scrollSpin = 0;     // extra y rotation from scroll
  let scrollScale = 1;    // core scale

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1
      }
    })
    .to({}, {
      duration: 1,
      onUpdate: function () {
        const p = this.progress();
        scrollDolly = p * 10;             // camera drifts back as you scroll
        scrollSpin = p * Math.PI * 2.4;   // core keeps turning through the page
        scrollScale = 1 - Math.min(p, 0.6) * 0.35; // core shrinks slightly deeper in
      }
    });

    // Section reveal animations
    gsap.utils.toArray('.reveal-up').forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });
    gsap.utils.toArray('.reveal-side').forEach((el) => {
      gsap.to(el, {
        opacity: 1, x: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    // Track cards stagger in
    gsap.from('.track-card', {
      opacity: 0, y: 40, duration: 0.7, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '#tracks-grid', start: 'top 80%' }
    });

    // Speaker cards stagger in
    gsap.from('.speaker-card', {
      opacity: 0, y: 30, duration: 0.6, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '.speakers-grid', start: 'top 85%' }
    });
  } else {
    // Fallback: reveal everything immediately if GSAP failed to load
    document.querySelectorAll('.reveal-up, .reveal-side').forEach(el => {
      el.style.opacity = 1; el.style.transform = 'none';
    });
  }

  /* ---------- Render loop ---------- */
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Smooth parallax toward pointer target
    const easedRotY = isDragging ? dragRotY : (dragRotY + targetRotY);
    const easedRotX = isDragging ? dragRotX : (dragRotX + targetRotX);

    coreGroup.rotation.y += ((easedRotY + (idleSpin ? t * 0.06 : 0) + scrollSpin) - coreGroup.rotation.y) * 0.06;
    coreGroup.rotation.x += ((easedRotX) - coreGroup.rotation.x) * 0.06;

    const targetScale = scrollScale;
    coreGroup.scale.x += (targetScale - coreGroup.scale.x) * 0.05;
    coreGroup.scale.y += (targetScale - coreGroup.scale.y) * 0.05;
    coreGroup.scale.z += (targetScale - coreGroup.scale.z) * 0.05;

    ringGroup.children.forEach((ring) => { ring.rotation.z += ring.userData.spin; });
    particles.rotation.y -= 0.0006;
    stars.rotation.y += 0.00012;

    camera.position.z += ((14 + scrollDolly) - camera.position.z) * 0.05;

    renderer.render(scene, camera);
  }
  if (!reduceMotion) {
    animate();
  } else {
    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ==========================================================
     TRACK CARD 3D TILT (CSS transform, mouse-driven)
     ========================================================== */
  if (!isTouch) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `rotateY(${px * 14}deg) rotateX(${-py * 14}deg) translateZ(10px)`;
        const glow = card.querySelector('.track-glow');
        if (glow) { glow.style.left = (px * 100 + 50) + '%'; glow.style.top = (py * 100 + 50) + '%'; }
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'rotateY(0deg) rotateX(0deg) translateZ(0px)';
      });
    });
  }

  /* ==========================================================
     STAT COUNTERS
     ========================================================== */
  const statEls = document.querySelectorAll('.hstat-num');
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.getAttribute('data-count'), 10);
      const prefix = el.getAttribute('data-prefix') || '';
      const suffix = el.getAttribute('data-suffix') || '';
      const duration = reduceMotion ? 0 : 1600;
      const start = performance.now();

      function updateCount(now) {
        const p = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.round(target * eased);
        el.textContent = prefix + val.toLocaleString('en-IN') + suffix;
        if (p < 1) requestAnimationFrame(updateCount);
      }
      requestAnimationFrame(updateCount);
      statObserver.unobserve(el);
    });
  }, { threshold: 0.4 });
  statEls.forEach((el) => statObserver.observe(el));

  /* ==========================================================
     REGISTRATION FORM (demo submit, no backend)
     ========================================================== */
  const regForm = document.getElementById('reg-form');
  const formStatus = document.getElementById('form-status');
  regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    formStatus.textContent = '> transmitting to grid...';
    formStatus.classList.remove('ok');
    setTimeout(() => {
      formStatus.textContent = '> registration received. check your email for confirmation.';
      formStatus.classList.add('ok');
      regForm.reset();
    }, 900);
  });

});
