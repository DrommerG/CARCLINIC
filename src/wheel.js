// Fuente de assets/js/wheel.js. Se empaqueta con esbuild para que funcione sin servidor.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import shieldUrl from './escudo-hub.webp';

const NAVY = 0x001427;
const CORAL = 0xe63e2d;
const PAPER = 0xfcfafa;

const revolve = (profile, material, segments = 160) => {
  const curve = new THREE.SplineCurve(profile.map(([r, y]) => new THREE.Vector2(r, y)));
  const geometry = new THREE.LatheGeometry(curve.getPoints(90), segments);
  geometry.rotateX(Math.PI / 2);
  return new THREE.Mesh(geometry, material);
};

const buildTire = () => {
  const group = new THREE.Group();
  const rubber = new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: 0.82, metalness: 0.05, side: THREE.DoubleSide });
  const side = [[1.36, 0.5], [1.42, 0.58], [1.56, 0.64], [1.72, 0.66], [1.86, 0.62], [1.96, 0.53], [2.01, 0.4], [2.03, 0.2], [2.04, 0]];
  group.add(revolve([...side, ...side.slice(0, -1).reverse().map(([r, y]) => [r, -y])], rubber));

  const block = new THREE.BoxGeometry(0.1, 0.19, 0.26);
  const lugs = new THREE.MeshStandardMaterial({ color: 0x101317, roughness: 0.72, metalness: 0.05 });
  const perRow = 46;
  const rows = [
    { z: 0.14, r: 2.06, skew: 0.38, shift: 0 },
    { z: -0.14, r: 2.06, skew: -0.38, shift: 0.5 },
    { z: 0.43, r: 2.03, skew: 0.5, shift: 0.5 },
    { z: -0.43, r: 2.03, skew: -0.5, shift: 0 },
  ];
  const mesh = new THREE.InstancedMesh(block, lugs, perRow * rows.length);
  const dummy = new THREE.Object3D();
  let index = 0;
  rows.forEach(({ z, r, skew, shift }) => {
    for (let i = 0; i < perRow; i += 1) {
      const a = ((i + shift) / perRow) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * r, Math.sin(a) * r, z);
      dummy.rotation.set(0, 0, a);
      dummy.rotateX(skew);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      index += 1;
    }
  });
  group.add(mesh);
  return group;
};

const buildSidewallText = async () => {
  await document.fonts.load('64px Anton').catch(() => {});
  const size = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.font = '84px Anton, Impact, sans-serif';
  ctx.fillStyle = '#FCFAFA';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const radius = (1.7 / 1.9) * (size / 2);
  const word = 'ESTÉTICA AUTOMOTRIZ';
  const spacing = 0.074;
  [-Math.PI / 2, Math.PI / 2].forEach((center) => {
    [...word].forEach((letter, i) => {
      const a = center + (i - (word.length - 1) / 2) * spacing;
      ctx.save();
      ctx.translate(size / 2 + Math.cos(a) * radius, size / 2 + Math.sin(a) * radius);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText(letter, 0, 0);
      ctx.restore();
    });
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.5, 1.9, 160),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.5, depthWrite: false }),
  );
  ring.position.z = 0.668;
  return ring;
};

const buildRim = () => {
  const group = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: 0x14181d, metalness: 1, roughness: 0.34, side: THREE.DoubleSide });
  const face = new THREE.MeshStandardMaterial({ color: 0x59626b, metalness: 1, roughness: 0.3 });
  const bright = new THREE.MeshStandardMaterial({ color: 0xd9dde1, metalness: 1, roughness: 0.16 });
  const accent = new THREE.MeshStandardMaterial({ color: CORAL, metalness: 0.2, roughness: 0.3 });

  group.add(revolve([[1.38, -0.52], [1.3, -0.46], [1.2, -0.34], [1.16, -0.1], [1.17, 0.2], [1.25, 0.42], [1.33, 0.5], [1.39, 0.52]], dark));

  const lip = new THREE.Mesh(new THREE.TorusGeometry(1.37, 0.055, 24, 180), bright);
  lip.position.z = 0.53;
  group.add(lip);
  const line = new THREE.Mesh(new THREE.TorusGeometry(1.255, 0.016, 12, 180), accent);
  line.position.z = 0.46;
  group.add(line);

  const shape = new THREE.Shape();
  shape.moveTo(0.34, -0.07);
  shape.quadraticCurveTo(0.8, -0.075, 1.27, -0.02);
  shape.lineTo(1.27, 0.115);
  shape.quadraticCurveTo(0.8, 0.05, 0.34, 0.07);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.026, bevelSize: 0.022, bevelSegments: 3, curveSegments: 16 });

  for (let i = 0; i < 5; i += 1) {
    [1, -1].forEach((sign) => {
      const pivot = new THREE.Group();
      pivot.rotation.z = (i / 5) * Math.PI * 2 + sign * 0.15;
      const spoke = new THREE.Mesh(geometry, face);
      spoke.scale.y = sign;
      spoke.rotation.y = -0.11;
      spoke.position.z = 0.27;
      pivot.add(spoke);
      group.add(pivot);
    });
  }

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.5, 0.2, 64), face);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.36;
  group.add(hub);

  const nut = new THREE.CylinderGeometry(0.042, 0.042, 0.07, 6);
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    const mesh = new THREE.Mesh(nut, bright);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(Math.cos(a) * 0.36, Math.sin(a) * 0.36, 0.48);
    group.add(mesh);
  }

  const texture = new THREE.TextureLoader().load(shieldUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const cap = new THREE.Mesh(new THREE.CircleGeometry(0.27, 64), new THREE.MeshStandardMaterial({ map: texture, metalness: 0.15, roughness: 0.4 }));
  cap.position.z = 0.492;
  group.add(cap);
  const capRing = new THREE.Mesh(new THREE.TorusGeometry(0.275, 0.018, 12, 80), bright);
  capRing.position.z = 0.492;
  group.add(capRing);
  return group;
};

const buildDisc = () => {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#8b9096';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#1b1f24';
  for (let i = 0; i < 60; i += 1) {
    const a = (i / 60) * Math.PI * 2;
    const r = size * (0.27 + (i % 3) * 0.07);
    ctx.beginPath();
    ctx.arc(size / 2 + Math.cos(a) * r, size / 2 + Math.sin(a) * r, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.08, 96), new THREE.MeshStandardMaterial({ map: texture, metalness: 0.9, roughness: 0.42 }));
  disc.position.z = -0.02;
  return disc;
};

const buildCaliper = () => {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 1.1, -0.46, 0.46, false);
  shape.absarc(0, 0, 0.8, 0.46, -0.46, true);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4, curveSegments: 24 });
  const material = new THREE.MeshPhysicalMaterial({ color: CORAL, metalness: 0.1, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.18 });
  const caliper = new THREE.Mesh(geometry, material);
  caliper.rotation.z = -0.55;
  caliper.position.z = 0.0;
  return caliper;
};

const start = async (canvas) => {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    document.documentElement.classList.add('no-webgl');
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.62;

  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 50);
  camera.position.z = 11.4;

  const key = new THREE.DirectionalLight(PAPER, 2.4);
  key.position.set(-4, 5, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight(CORAL, 3.2);
  rim.position.set(6, -3, 1);
  scene.add(rim);
  const back = new THREE.DirectionalLight(NAVY, 1);
  back.position.set(0, 0, -6);
  scene.add(back);

  const tilt = new THREE.Group();
  const spin = new THREE.Group();
  spin.add(buildTire(), buildRim(), buildDisc(), await buildSidewallText());
  tilt.add(spin, buildCaliper());
  tilt.rotation.set(0.08, -0.46, 0);
  scene.add(tilt);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  // Compila antes de que se vea: la primera compilación congela la página casi 2 s.
  await renderer.compileAsync(scene, camera);
  renderer.render(scene, camera);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const aim = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => {
    aim.x = (e.clientX / innerWidth - 0.5) * 0.16;
    aim.y = (e.clientY / innerHeight - 0.5) * 0.1;
  }, { passive: true });

  let running = false;
  let last = 0;
  const frame = (now) => {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const boost = window.CC ? window.CC.wheelBoost : 0;
    spin.rotation.z -= (0.5 + boost * 1.5) * dt;
    tilt.rotation.y += (-0.46 + aim.x - tilt.rotation.y) * 0.05;
    tilt.rotation.x += (0.08 + aim.y - tilt.rotation.x) * 0.05;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };

  if (reduce) {
    renderer.render(scene, camera);
    return;
  }
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    } else if (!entry.isIntersecting) {
      running = false;
    }
  }).observe(canvas);
};

const canvas = document.querySelector('[data-wheel]');
if (canvas) {
  const boot = () => start(canvas);
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(boot, { timeout: 1200 }) : setTimeout(boot, 400));
  document.readyState === 'complete' ? idle() : addEventListener('load', idle, { once: true });
}
