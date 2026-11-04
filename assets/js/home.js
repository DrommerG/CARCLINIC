(() => {
  const { reduce } = window.CC;
  const CC = window.CC;

  const gate = document.querySelector('[data-gate]');
  const video = gate.querySelector('video');
  new IntersectionObserver(([entry]) => {
    if (reduce) return;
    entry.isIntersecting ? video.play().catch(() => {}) : video.pause();
  }).observe(gate);

  if (reduce) {
    video.removeAttribute('autoplay');
    video.pause();
  } else {
    gsap.from('.gate__title h1, .gate__phrase', { autoAlpha: 0, y: 26, duration: 1.1, ease: 'power3.out', stagger: 0.18, delay: 0.2 });
    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: gate, start: 'top top', end: 'bottom bottom', scrub: true },
    })
      .fromTo('.gate__door', { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1 }, 0)
      .fromTo('.gate__edge', { y: 0 }, { y: () => -window.innerHeight, duration: 1 }, 0)
      .fromTo('.gate__edge', { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0)
      .fromTo('.gate__slats', { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0)
      .to('.gate__cue', { opacity: 0, duration: 0.06 }, 0)
      .to({}, { duration: 0.22 });
  }

  const orbit = document.querySelector('[data-orbit]');
  const cards = [...orbit.querySelectorAll('.ocard')];
  const wide = matchMedia('(min-width: 901px)');
  const stage = orbit.querySelector('.orbit__stage');
  const hub = orbit.querySelector('.orbit__hub');
  const TAU = Math.PI * 2;
  let rx = 0;
  let ry = 0;
  let theta = -Math.PI / 2 + Math.PI / cards.length;
  let visible = false;
  let hovering = false;

  const measure = () => {
    if (!wide.matches) {
      cards.forEach((c) => { c.style.transform = ''; c.style.zIndex = ''; });
      return;
    }
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h'));
    const w = stage.clientWidth;
    const h = stage.clientHeight - header;
    const cw = cards[0].offsetWidth;
    const ch = cards[0].offsetHeight;
    rx = w / 2 - cw * 0.54 - 12;
    ry = Math.max(h / 2 - ch * 0.53, hub.offsetHeight * 0.3);
  };

  const place = () => {
    cards.forEach((card, i) => {
      const a = theta + (i * TAU) / cards.length;
      const sin = Math.sin(a);
      const depth = (sin + 1) / 2;
      const scale = 0.72 + 0.34 * depth;
      card.style.transform = `translate3d(${(Math.cos(a) * rx).toFixed(1)}px, ${(sin * ry).toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      card.style.zIndex = sin > -0.12 ? 10 + Math.round(depth * 20) : 1 + Math.round(depth * 3);
    });
  };

  measure();
  place();
  addEventListener('resize', () => { measure(); place(); });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(orbit);
  orbit.querySelector('.orbit__cards').addEventListener('pointerover', () => { hovering = true; });
  orbit.querySelector('.orbit__cards').addEventListener('pointerout', () => { hovering = false; });
  orbit.addEventListener('focusin', () => { hovering = true; });
  orbit.addEventListener('focusout', () => { hovering = false; });

  if (!reduce) {
    gsap.ticker.add((time, delta) => {
      if (!visible || !wide.matches || hovering) return;
      theta += (0.00011 + CC.wheelBoost * 0.00022) * Math.min(delta, 40);
      place();
    });
  }

  document.querySelectorAll('[data-promo]').forEach((col) => {
    const clip = col.querySelector('video');
    if (!clip) return;
    const play = () => {
      if (!clip.src) clip.src = clip.dataset.src;
      col.classList.add('is-playing');
      clip.currentTime = 0;
      clip.play().catch(() => {});
    };
    const stop = () => {
      col.classList.remove('is-playing');
      clip.pause();
    };
    col.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') play(); });
    col.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') stop(); });
    col.querySelector('.capsule').addEventListener('click', () => {
      if (matchMedia('(hover: hover)').matches) return;
      col.classList.contains('is-playing') ? stop() : play();
    });
  });

  const reserve = document.querySelector('.reserve');
  const ignition = document.querySelector('[data-ignition]');
  const svg = ignition.querySelector('.tach');
  const NS = 'http://www.w3.org/2000/svg';
  const C = 300;
  const MAX = 8;
  const RED_FROM = 6.5;
  const angleOf = (rpm) => -225 + (rpm / MAX) * 270;
  const polar = (r, deg) => {
    const rad = (deg * Math.PI) / 180;
    return [C + r * Math.cos(rad), C + r * Math.sin(rad)];
  };
  const el = (name, attrs, parent = svg) => {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    parent.append(node);
    return node;
  };
  const arc = (r, from, to) => {
    const [x0, y0] = polar(r, from);
    const [x1, y1] = polar(r, to);
    return `M${x0} ${y0} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  };

  el('path', { class: 'tach__track', d: arc(290, angleOf(0), angleOf(MAX)) });
  const fill = el('path', { class: 'tach__fill', d: arc(290, angleOf(0), angleOf(MAX)), pathLength: 1, 'stroke-dasharray': '0 1' });
  for (let v = 0; v <= MAX + 0.001; v += 0.25) {
    const major = Number.isInteger(v);
    const red = v >= RED_FROM;
    const a = angleOf(v);
    const [x0, y0] = polar(major ? 250 : 262, a);
    const [x1, y1] = polar(276, a);
    el('line', { class: `tach__tick${major ? ' tach__tick--major' : ''}${red ? ' tach__tick--red' : ''}`, x1: x0, y1: y0, x2: x1, y2: y1 });
    if (major) {
      const [tx, ty] = polar(222, a);
      const num = el('text', { class: `tach__num${red ? ' tach__num--red' : ''}`, x: tx, y: ty });
      num.textContent = v;
    }
  }
  const needle = el('line', { class: 'tach__needle', x1: C + 150, y1: C, x2: C + 268, y2: C });

  const gauge = { rpm: 0, sweep: 0, hover: 0, boosted: false, inView: false };
  const IDLE = 0.9;
  const draw = () => {
    needle.setAttribute('transform', `rotate(${angleOf(gauge.rpm).toFixed(2)} ${C} ${C})`);
    fill.setAttribute('stroke-dasharray', `${(gauge.rpm / MAX).toFixed(4)} 1`);
    reserve.style.setProperty('--heat', Math.max(0, (gauge.rpm - 2.5) / 5.5).toFixed(3));
  };

  if (reduce) {
    gauge.rpm = IDLE;
    draw();
  } else {
    const pistons = gsap.utils.toArray('.pistons i');
    gsap.set(pistons, { yPercent: 100 });
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '[data-engine]',
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onToggle: (self) => { gauge.inView = self.isActive; },
      },
    });
    [0, 2, 3, 1].forEach((col, k) => {
      tl.to(pistons[col], {
        keyframes: { yPercent: [100, 34, 66, 0], easeEach: 'sine.inOut' },
        duration: 0.34,
      }, 0.14 + k * 0.08);
    });
    tl.to(reserve, { autoAlpha: 1, duration: 0.02 }, 0.72)
      .fromTo(gauge, { sweep: 0 }, { sweep: 1, duration: 0.16 }, 0.74)
      .to({}, { duration: 0.1 });

    if (matchMedia('(hover: none)').matches) {
      document.querySelector('.reserve__hint').textContent = 'Toca para encender';
    }

    addEventListener('pointermove', (e) => {
      if (!gauge.inView || e.pointerType !== 'mouse') return;
      const box = ignition.getBoundingClientRect();
      const dist = Math.hypot(e.clientX - (box.left + box.width / 2), e.clientY - (box.top + box.height / 2));
      gauge.hover = Math.max(0, Math.min(1, 1 - (dist - box.width * 0.2) / (box.width * 0.9)));
    });

    gsap.ticker.add((time) => {
      if (!gauge.inView) return;
      const key = Math.sin(gauge.sweep * Math.PI) * (MAX - IDLE);
      const wobble = Math.sin(time * 19) * 0.03;
      const rev = gauge.hover > 0 ? gauge.hover * 6.1 + Math.sin(time * 31) * 0.05 * gauge.hover : 0;
      const target = gauge.boosted ? MAX : IDLE + wobble + Math.max(rev, key);
      gauge.rpm += (target - gauge.rpm) * 0.14;
      draw();
    });

    ignition.addEventListener('click', (e) => {
      e.preventDefault();
      gauge.boosted = true;
      setTimeout(() => { location.href = ignition.href; }, 560);
    });
    addEventListener('pageshow', () => { gauge.boosted = false; });
  }
})();
