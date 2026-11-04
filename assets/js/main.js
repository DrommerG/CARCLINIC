(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) root.classList.add('reduce');

  gsap.registerPlugin(ScrollTrigger);
  const CC = (window.CC = { reduce, lenis: null, wheelBoost: 0 });

  if (!reduce) {
    const lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    CC.lenis = lenis;
  }

  ScrollTrigger.create({
    start: 24,
    end: 'max',
    toggleClass: { targets: '.site-header', className: 'is-solid' },
  });

  const toggle = document.querySelector('.nav-toggle');
  const setNav = (open) => {
    root.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    if (CC.lenis) open ? CC.lenis.stop() : CC.lenis.start();
  };
  toggle.addEventListener('click', () => setNav(!root.classList.contains('nav-open')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('nav-open')) setNav(false);
  });

  const tickers = [...document.querySelectorAll('[data-ticker]')].map((row) => {
    const track = row.firstElementChild;
    const copy = track.firstElementChild.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    track.append(copy);
    if (reduce) return null;
    const rev = row.dataset.ticker === 'rev';
    return gsap.fromTo(track,
      { xPercent: rev ? -50 : 0 },
      { xPercent: rev ? 0 : -50, duration: Number(row.dataset.speed) || 40, ease: 'none', repeat: -1 });
  }).filter(Boolean);

  if (!reduce) {
    let boost = 0;
    ScrollTrigger.create({
      onUpdate: (self) => { boost = Math.max(boost, Math.min(Math.abs(self.getVelocity()) / 500, 6)); },
    });
    gsap.ticker.add(() => {
      boost *= 0.94;
      CC.wheelBoost = boost;
      tickers.forEach((t) => t.timeScale(1 + boost));
    });

    document.querySelectorAll('[data-parallax]').forEach((img) => {
      gsap.fromTo(img, { yPercent: -4 }, {
        yPercent: 4,
        ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top top', end: 'bottom top', scrub: true },
      });
    });

    document.querySelectorAll('[data-float]').forEach((img) => {
      gsap.fromTo(img, { y: 50 }, {
        y: -50,
        ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    gsap.from('[data-rise]', { yPercent: 112, duration: 1.15, ease: 'power4.out', delay: 0.15, stagger: 0.08 });
  }

  const startCountdowns = () => {
    const nodes = document.querySelectorAll('[data-countdown]');
    if (!nodes.length) return;
    const start = new Date(2026, 10, 27).getTime();
    const end = new Date(2026, 10, 28).getTime();
    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => {
      const now = Date.now();
      const state = now < start ? 'soon' : now < end ? 'live' : 'past';
      const left = Math.max(0, Math.floor((start - now) / 1000));
      const values = {
        d: Math.floor(left / 86400),
        h: Math.floor(left / 3600) % 24,
        m: Math.floor(left / 60) % 60,
        s: left % 60,
      };
      nodes.forEach((node) => {
        node.dataset.state = state;
        node.querySelectorAll('[data-unit]').forEach((el) => { el.textContent = pad(values[el.dataset.unit]); });
      });
    };
    tick();
    setInterval(tick, 1000);
  };
  startCountdowns();

  const wipes = document.querySelector('[data-wipes]');
  if (wipes && !reduce) {
    gsap.matchMedia().add('(min-width: 901px)', () => {
      const steps = gsap.utils.toArray('.wipes__step', wipes);
      const figures = steps.map((s) => s.querySelector('figure'));
      const texts = steps.map((s) => s.querySelector('.wipes__text'));
      const marks = gsap.utils.toArray('.wipes__index li', wipes);
      const mark = (i) => marks.forEach((m, k) => m.classList.toggle('is-active', k === i));

      gsap.set(figures.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set(texts.slice(1), { autoAlpha: 0, y: 28 });
      mark(0);

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: wipes,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (self) => mark(Math.min(steps.length - 1, Math.floor(self.progress * tl.duration() + 0.3))),
        },
      });
      figures.slice(1).forEach((fig, i) => {
        const at = i + 0.35;
        tl.to(fig, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.65 }, at)
          .to(texts[i], { autoAlpha: 0, y: -28, duration: 0.2 }, at + 0.1)
          .to(texts[i + 1], { autoAlpha: 1, y: 0, duration: 0.25 }, at + 0.35);
      });
      tl.to({}, { duration: 0.35 });

      return () => {
        gsap.set([...figures, ...texts], { clearProps: 'all' });
        marks.forEach((m) => m.classList.remove('is-active'));
      };
    });
  }

  const form = document.querySelector('[data-book]');
  if (form) {
    const date = form.querySelector('input[type="date"]');
    const today = new Date();
    date.min = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.querySelector('[data-status]').textContent = 'Las reservas en línea todavía no están activas. Tus datos no se enviaron.';
    });
  }
})();
