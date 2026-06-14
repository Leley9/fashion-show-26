/* =====================================================================
   scene.js — LA SCÈNE 3D INTERACTIVE
   ---------------------------------------------------------------------
   Deux modes de navigation :
     • VOL 1re personne  (souris + ZQSD/WASD/Espace/Maj)
     • ORBITE type Blender (souris + PAVÉ NUMÉRIQUE)
   Bascule avec le bouton "Mode" ou la touche Tab.

   Bulles cliquables -> modales de contenu (content.js)
   Éclairage : HDRI Perlin irisée (hdri.js)
   ===================================================================== */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { makePerlinEnv } from './hdri.js';
import { HOTSPOTS } from './content.js';

const CDN = 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/libs/draco/';

/* ---------- Renderer ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('app').appendChild(renderer.domElement);
const dom = renderer.domElement;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.05, 200);
camera.position.set(2.0, 1.6, 4.6);
camera.lookAt(10, 1.4, 4.6);

/* ---------- HDRI Perlin (lumière + fond irisé) ---------- */
const env = makePerlinEnv({ width: 256, height: 128 });
const eqTex = new THREE.CanvasTexture(env.canvas);
eqTex.mapping = THREE.EquirectangularReflectionMapping;
eqTex.colorSpace = THREE.SRGBColorSpace;

const pmrem = new THREE.PMREMGenerator(renderer);
let envRT = pmrem.fromEquirectangular(eqTex);
scene.environment = envRT.texture;
scene.background = eqTex;
scene.backgroundBlurriness = 0.22;

scene.add(new THREE.HemisphereLight(0xbfe4ff, 0x14264a, 0.5));
const key = new THREE.DirectionalLight(0xffffff, 1.2);
key.position.set(5, 10, 6);
scene.add(key);

/* ---------- Chargement du modèle ---------- */
const draco = new DRACOLoader().setDecoderPath(CDN);
const loader = new GLTFLoader().setDRACOLoader(draco);

const loaderBar = document.getElementById('loader-bar');
const loaderEl = document.getElementById('loader');
const loaderPct = document.getElementById('loader-pct');
const loaderStatus = document.getElementById('loader-status');

// Étapes de statut affichées selon l'avancement (en anglais)
function statusFor(p) {
  if (p < 25) return 'Entering the space';
  if (p < 55) return 'Unfolding the runway';
  if (p < 85) return 'Dressing the lights';
  if (p < 100) return 'Almost on stage';
  return 'Welcome';
}

let SCENE_CENTER = new THREE.Vector3(8.7, 0.5, 4.5);
let SCENE_RADIUS = 10;

loader.load(
  '3D/space.glb',
  (gltf) => {
    scene.add(gltf.scene);
    // Centre / rayon de la scène -> pour cadrer l'orbite
    const box = new THREE.Box3().setFromObject(gltf.scene);
    box.getCenter(SCENE_CENTER);
    SCENE_RADIUS = box.getSize(new THREE.Vector3()).length() / 2;
    orbit.target.copy(SCENE_CENTER);
    orbit.minDistance = SCENE_RADIUS * 0.15;
    orbit.maxDistance = SCENE_RADIUS * 4;
    orbit.update();
    buildHotspots();
    // Pousse la barre à 100% puis fond enchaîné une fois la scène prête
    loaderBar.style.width = '100%';
    if (loaderPct) loaderPct.innerHTML = '100<small>%</small>';
    if (loaderStatus) loaderStatus.textContent = statusFor(100);
    setTimeout(() => loaderEl.classList.add('hidden'), 450);
    setMode('orbit');                      // démarre en mode Orbite
  },
  (e) => {
    if (!e.lengthComputable) return;
    const p = Math.round((e.loaded / e.total) * 100);
    loaderBar.style.width = p + '%';
    if (loaderPct) loaderPct.innerHTML = p + '<small>%</small>';
    if (loaderStatus) loaderStatus.textContent = statusFor(p);
  },
  (err) => {
    if (loaderStatus) loaderStatus.textContent = 'Could not load the space';
    loaderEl.innerHTML = '<div class="loader-aurora"></div><div class="loader-core">'
      + '<h1 class="loader-wordmark" data-text="Oops">Oops</h1>'
      + '<p class="loader-status">The 3D space failed to load.<br>' + err + '</p></div>';
  }
);

/* ===================================================================
   CONTRÔLES
   =================================================================== */
let mode = 'orbit';                       // 'fly' | 'orbit'  (orbite par défaut)
let orbitFramedOnce = false;

// -- Vol 1re personne --
const fly = new PointerLockControls(camera, dom);
const keys = {};
addEventListener('keyup', (e) => (keys[e.code] = false));

const SPEED = 4.5;
const dir = new THREE.Vector3();
const right = new THREE.Vector3();
const worldUp = new THREE.Vector3(0, 1, 0);
const moveV = new THREE.Vector3();

function flyStep(dt) {
  if (mode !== 'fly' || !fly.isLocked) return;
  camera.getWorldDirection(dir);
  right.crossVectors(dir, worldUp).normalize();
  moveV.set(0, 0, 0);
  if (keys['KeyW'] || keys['ArrowUp'])    moveV.add(dir);
  if (keys['KeyS'] || keys['ArrowDown'])  moveV.sub(dir);
  if (keys['KeyD'] || keys['ArrowRight']) moveV.add(right);
  if (keys['KeyA'] || keys['ArrowLeft'])  moveV.sub(right);
  if (keys['Space'])      moveV.add(worldUp);
  if (keys['ShiftLeft'] || keys['ControlLeft']) moveV.sub(worldUp);
  if (moveV.lengthSq() > 0) camera.position.add(moveV.normalize().multiplyScalar(SPEED * dt));
}

// -- Orbite type Blender --
const orbit = new OrbitControls(camera, dom);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;
orbit.enabled = false;
orbit.target.copy(SCENE_CENTER);

const off = new THREE.Vector3();
const sph = new THREE.Spherical();

function snapView(x, y, z) {                 // vue de face/côté/dessus
  off.copy(camera.position).sub(orbit.target);
  const d = off.length() || SCENE_RADIUS * 2;
  camera.position.set(
    orbit.target.x + x * d,
    orbit.target.y + y * d + (y !== 0 ? 0 : 0),
    orbit.target.z + z * d
  );
  if (Math.abs(y) > 0.5) camera.position.z += 0.001;   // évite le gimbal vertical
  orbit.update();
}
function orbitBy(dTheta, dPhi) {             // pivoter par paliers (15°)
  off.copy(camera.position).sub(orbit.target);
  sph.setFromVector3(off);
  sph.theta += dTheta;
  sph.phi = Math.max(0.05, Math.min(Math.PI - 0.05, sph.phi + dPhi));
  off.setFromSpherical(sph);
  camera.position.copy(orbit.target).add(off);
  orbit.update();
}
function dolly(factor) {                      // zoom (Numpad +/-)
  off.copy(camera.position).sub(orbit.target).multiplyScalar(factor);
  camera.position.copy(orbit.target).add(off);
  orbit.update();
}
function frameScene() {                        // cadrer toute la scène (Numpad 0)
  const d = SCENE_RADIUS * 1.9;
  camera.position.set(SCENE_CENTER.x + d * 0.7, SCENE_CENTER.y + d * 0.5, SCENE_CENTER.z + d * 0.8);
  orbit.update();
}
let flat = false;
function toggleOrtho() {                        // Numpad 5 : vue aplatie (quasi-ortho)
  flat = !flat;
  camera.fov = flat ? 16 : 62;
  camera.updateProjectionMatrix();
}

const STEP = Math.PI / 12;                       // 15°
addEventListener('keydown', (e) => {
  if (e.code === 'Tab') { e.preventDefault(); setMode(mode === 'fly' ? 'orbit' : 'fly'); return; }
  keys[e.code] = true;
  if (mode !== 'orbit' || modal.classList.contains('open')) return;
  const ctrl = e.ctrlKey || e.metaKey;
  switch (e.code) {
    case 'Numpad1': snapView(0, 0, ctrl ? -1 : 1); break;   // face / arrière
    case 'Numpad3': snapView(ctrl ? -1 : 1, 0, 0); break;   // droite / gauche
    case 'Numpad7': snapView(0, ctrl ? -1 : 1, 0); break;   // dessus / dessous
    case 'Numpad0': frameScene(); break;                    // cadrer la scène
    case 'Numpad5': toggleOrtho(); break;                   // aplatir / perspective
    case 'Numpad4': orbitBy(-STEP, 0); break;               // pivoter gauche
    case 'Numpad6': orbitBy(STEP, 0); break;                // pivoter droite
    case 'Numpad8': orbitBy(0, -STEP); break;               // pivoter haut
    case 'Numpad2': orbitBy(0, STEP); break;                // pivoter bas
    case 'NumpadAdd': dolly(0.85); break;                   // zoom avant
    case 'NumpadSubtract': dolly(1.15); break;              // zoom arrière
    default: return;
  }
  e.preventDefault();
});

/* -- Bascule de mode -- */
const reticle = document.getElementById('reticle');
const tooltip = document.getElementById('tooltip');
const intro = document.getElementById('intro');
const help = document.getElementById('help');
const numpadHelp = document.getElementById('numpad-help');
const modeBtn = document.getElementById('mode-btn');

function setMode(m) {
  mode = m;
  if (m === 'orbit') {
    if (fly.isLocked) fly.unlock();
    orbit.enabled = true;
    if (!orbitFramedOnce) { frameScene(); orbitFramedOnce = true; }
    intro.classList.add('hidden');
    reticle.classList.add('hidden');
    help.classList.add('hidden');
    numpadHelp.classList.remove('hidden');
    modeBtn.textContent = 'Mode: Orbit ⌨';
    dom.style.cursor = 'grab';
  } else {
    orbit.enabled = false;
    reticle.classList.remove('hidden');
    help.classList.remove('hidden');
    numpadHelp.classList.add('hidden');
    modeBtn.textContent = 'Mode: Fly 🕊';
    dom.style.cursor = 'default';
    if (!modal.classList.contains('open')) intro.classList.remove('hidden');
  }
}
modeBtn.addEventListener('click', () => setMode(mode === 'fly' ? 'orbit' : 'fly'));

/* ===================================================================
   BULLES (hotspots)
   =================================================================== */
const hotspotGroup = new THREE.Group();
scene.add(hotspotGroup);

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.4, 'rgba(255,255,255,0.55)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const GLOW = glowTexture();

function buildHotspots() {
  for (const h of HOTSPOTS) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: GLOW, color: new THREE.Color(h.color),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    sprite.position.fromArray(h.position);
    sprite.scale.setScalar(0.6);
    sprite.userData.hotspot = h;
    sprite.userData.base = 0.6;
    hotspotGroup.add(sprite);
  }
}

/* ---------- Viser une bulle (raycast) ---------- */
const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);
const mouseNDC = new THREE.Vector2();
let mouseClient = { x: 0, y: 0 };
let hovered = null;

dom.addEventListener('pointermove', (e) => {
  mouseClient = { x: e.clientX, y: e.clientY };
  mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

function pick() {
  const usePoint = mode === 'fly' ? (fly.isLocked ? center : null) : mouseNDC;
  if (!usePoint) { hovered = null; reticle.classList.remove('active'); tooltip.classList.remove('show'); return; }
  raycaster.setFromCamera(usePoint, camera);
  const hits = raycaster.intersectObjects(hotspotGroup.children, false);
  hovered = hits.length ? hits[0].object : null;
  if (hovered) {
    tooltip.textContent = hovered.userData.hotspot.title;
    tooltip.classList.add('show');
    if (mode === 'fly') {
      reticle.classList.add('active');
    } else {
      tooltip.style.left = mouseClient.x + 'px';
      tooltip.style.top = (mouseClient.y + 22) + 'px';
      tooltip.style.transform = 'translate(-50%, 0)';
      dom.style.cursor = 'pointer';
    }
  } else {
    reticle.classList.remove('active');
    tooltip.classList.remove('show');
    if (mode === 'orbit') dom.style.cursor = orbit.enabled ? 'grab' : 'default';
  }
}

/* ===================================================================
   MODALES
   =================================================================== */
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');

function mediaHTML(h) {
  let html = '';
  for (const src of (h.images || [])) html += `<img loading="lazy" src="${src}" alt="">`;
  for (const v of (h.videos || [])) {
    if (/youtube|vimeo|^https?:/i.test(v) && !/\.(mp4|webm|mov)$/i.test(v))
      html += `<iframe src="${v}" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    else
      html += `<video src="${v}" controls preload="metadata"></video>`;
  }
  if (!html) html = '<p class="soon">📷 Contenu à venir — photos & vidéos du studio.</p>';
  return html;
}
function openModal(h) {
  modalContent.innerHTML =
    `<h2 style="--accent:${h.color}">${h.title}</h2>` +
    `<p class="note">${h.note.replace(/\n/g, '<br>')}</p>` +
    `<div class="gallery">${mediaHTML(h)}</div>`;
  modal.classList.add('open');
  if (mode === 'fly') fly.unlock();
}
function closeModal() { modal.classList.remove('open'); }
document.getElementById('modal-close').addEventListener('click', () => {
  closeModal();
  if (mode === 'fly') fly.lock();
});
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

/* ---------- Clic = ouvrir une bulle (clic franc, pas un drag) ---------- */
let downX = 0, downY = 0;
dom.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; });
dom.addEventListener('pointerup', (e) => {
  const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
  if (mode === 'fly' && fly.isLocked && hovered) openModal(hovered.userData.hotspot);
  else if (mode === 'orbit' && moved < 5 && hovered) openModal(hovered.userData.hotspot);
});

/* ---------- Entrée en vol (pointer lock) ---------- */
intro.addEventListener('click', () => { if (mode === 'fly') fly.lock(); });
fly.addEventListener('lock', () => intro.classList.add('hidden'));
fly.addEventListener('unlock', () => {
  if (mode === 'fly' && !modal.classList.contains('open')) intro.classList.remove('hidden');
});

/* ===================================================================
   BOUCLE DE RENDU
   =================================================================== */
const clock = new THREE.Clock();
let envAcc = 0, pmremAcc = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const t = clock.elapsedTime;

  flyStep(dt);
  if (mode === 'orbit') orbit.update();
  pick();

  for (const s of hotspotGroup.children) {
    s.scale.setScalar(s.userData.base * (1 + Math.sin(t * 2 + s.position.x) * 0.12));
  }

  envAcc += dt;
  if (envAcc > 0.08) {
    env.render(t * 0.06);
    eqTex.needsUpdate = true;
    envAcc = 0;
    pmremAcc += 0.08;
    if (pmremAcc > 0.32) {
      const rt = pmrem.fromEquirectangular(eqTex);
      scene.environment = rt.texture;
      envRT.dispose();
      envRT = rt;
      pmremAcc = 0;
    }
  }

  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
