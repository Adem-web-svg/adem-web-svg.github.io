// ================= NAV : menu mobile =================
const navBurger = document.getElementById('navBurger');
const nav = document.querySelector('.nav');

if (navBurger) {
  navBurger.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    navBurger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.body.classList.remove('nav-open');
    if (navBurger) navBurger.setAttribute('aria-expanded', 'false');
  });
});

// ================= BARRE DE PROGRESSION + OMBRE DU MENU =================
const progress = document.querySelector('.scroll-progress');
function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progress) progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ================= REVEAL AU SCROLL (apparition en cascade) =================
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const revealTargets = document.querySelectorAll(
  '.section-head, .about-text, .about-card, .video-wrap, .timeline-item, .xp-card, .veille-table-wrap, ' +
  '.skill-card, .project-card, .path-step, .veille-block, .env-card, .journal-entry, .contact-list, .contact-intro'
);

if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealTargets.forEach(el => {
    // petit décalage entre les cartes d'une même grille
    const siblings = Array.from(el.parentElement.children).filter(c => c.classList.contains(el.classList[0]));
    const idx = siblings.indexOf(el);
    el.style.transitionDelay = `${Math.min(idx, 5) * 70}ms`;
    el.classList.add('reveal');
    revealObserver.observe(el);
  });
}

// ================= ONGLET ACTIF AU SCROLL (page d'accueil) =================
const tabLinks = document.querySelectorAll('.nav-links a[data-section]');
if (tabLinks.length && 'IntersectionObserver' in window) {
  // chaque section de la page est rattachée à l'onglet le plus proche
  const map = {
    top: 'top', qui: 'qui', parcours: 'parcours', competences: 'competences',
    realisations: 'realisations', projet: 'projet', apprentissage: 'projet', contact: 'contact'
  };
  const setActive = (key) => {
    tabLinks.forEach(a => a.classList.toggle('is-active', a.dataset.section === key));
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActive(map[entry.target.id] || 'top');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  document.querySelectorAll('#top, section[id]').forEach(sec => observer.observe(sec));
}

// ================= ANIMATION RÉSEAU EN ARRIÈRE-PLAN DU HAUT DE PAGE =================
// Des « nœuds » se déplacent lentement et se relient quand ils sont proches,
// comme les équipements d'un réseau. L'animation s'arrête quand le haut de page n'est plus visible.
(function () {
  const canvas = document.querySelector('.hero-network');
  if (!canvas) return;
  const hero = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  const colors = ['151,71,255', '255,79,216', '179,136,255', '63,224,160'];
  let w, h, dpr, nodes = [], running = true, raf;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = hero.clientWidth; h = hero.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(70, Math.max(24, (w * h) / 16000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: 1.2 + Math.random() * 1.8,
      c: colors[Math.floor(Math.random() * colors.length)],
      p: Math.random() * Math.PI * 2
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const max = 140;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
        if (d < max) {
          ctx.strokeStyle = `rgba(151,71,255,${0.22 * (1 - d / max)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    nodes.forEach(n => {
      n.p += 0.03;
      const glow = 0.55 + Math.sin(n.p) * 0.3;
      ctx.fillStyle = `rgba(${n.c},${glow})`;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    });
  }

  function step() {
    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    });
    draw();
    if (running) raf = requestAnimationFrame(step);
  }

  resize();
  window.addEventListener('resize', resize);

  if (prefersReducedMotion) { draw(); return; }   // image fixe si animations réduites
  step();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) { running = true; step(); }
      else if (!e.isIntersecting) { running = false; cancelAnimationFrame(raf); }
    }).observe(hero);
  }
})();

// ================= AGRANDIR LES PHOTOS DE PROJETS =================
(function () {
  const medias = document.querySelectorAll('.project-media');
  if (!medias.length) return;
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.innerHTML = '<button class="lightbox-close" type="button">Fermer ✕</button><img alt="">';
  document.body.appendChild(box);
  const big = box.querySelector('img');
  const close = () => box.classList.remove('is-open');

  medias.forEach(fig => {
    const img = fig.querySelector('img');
    fig.tabIndex = 0;
    fig.setAttribute('role', 'button');
    fig.setAttribute('aria-label', 'Agrandir : ' + img.alt);
    const open = () => {
      big.src = fig.dataset.full || img.src;
      big.alt = img.alt;
      box.classList.add('is-open');
    };
    fig.addEventListener('click', open);
    fig.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  box.addEventListener('click', e => { if (e.target !== big) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();
