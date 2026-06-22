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
import { ViewHelper } from './lib/ViewHelper.js';
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
// En mode orbite (le mode par défaut), c'est orbit.target — PAS lookAt — qui
// dicte où regarde la caméra. On mémorise donc le point visé pour le donner
// comme cible d'orbite, sinon le cadrage choisi est écrasé par le centre de scène.
const DEFAULT_TARGET = new THREE.Vector3(-5.27, 4.08, 12.86);

camera.position.set(-10.70, 7.01, 17.95);   // cadrage par défaut (desktop), choisi en vol libre
camera.lookAt(DEFAULT_TARGET);

// Détection mobile : sur écran étroit/portrait on n'utilise PAS le cadrage
// desktop (trop serré). On cadre TOUTE la scène en 3/4 une fois le modèle
// chargé — cf. le callback du loader plus bas (on a besoin du centre/rayon).
const isMobile = matchMedia('(pointer: coarse)').matches || window.innerWidth < 600;
// Cadrage dédié mobile (vue d'ensemble choisie sur l'appareil). Appliqué une
// fois le modèle chargé — cf. le callback du loader plus bas.
const MOBILE_POS = new THREE.Vector3(-17.55, 11.88, -21.20);
const MOBILE_TARGET = new THREE.Vector3(-11.95, 9.31, -16.09);
// --- Mode DEV : détecté largement (localhost, 127.x, 0.0.0.0, IP privée du
// LAN pour tester sur mobile, *.local, ou ?dev dans l'URL). Jamais vrai sur
// ddw26.pages.dev -> les aides au réglage ne fuitent jamais en prod. ---
const DEV =
  /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname)
  || location.hostname.endsWith('.local')
  || location.search.includes('dev');

// Imprime ET copie (si le presse-papier est autorisé) le cadrage courant,
// prêt à coller dans le code. En orbite on lit la VRAIE cible (orbit.target) ;
// en vol libre on la déduit de la direction de visée (3e colonne de la matrice).
// Appel : touche P, ou cam reste exposée pour bidouiller en console.
function dumpCamera() {
  const p = camera.position;
  let tx, ty, tz;
  if (mode === 'orbit') {
    ({ x: tx, y: ty, z: tz } = orbit.target);
  } else {
    const e = camera.matrixWorld.elements;
    tx = p.x - e[8] * 8; ty = p.y - e[9] * 8; tz = p.z - e[10] * 8;
  }
  const txt =
`camera.position.set(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)});
camera.lookAt(${tx.toFixed(2)}, ${ty.toFixed(2)}, ${tz.toFixed(2)});`;
  console.log('%cCadrage caméra (copié dans le presse-papier) :\n' + txt, 'color:#b07cff');
  navigator.clipboard?.writeText(txt).catch(() => {});
  return txt;
}

if (DEV) {
  window.cam = camera;          // bidouille libre en console
  window.dumpCamera = dumpCamera;
  console.log('%c[DEV] Touche P = copier le cadrage caméra prêt à coller.', 'color:#b07cff');
}

/* ---------- HDRI Perlin (lumière + fond irisé) ---------- */
const env = makePerlinEnv({ width: 256, height: 128 });
const eqTex = new THREE.CanvasTexture(env.canvas);
eqTex.mapping = THREE.EquirectangularReflectionMapping;
eqTex.colorSpace = THREE.SRGBColorSpace;

// ENVIRONNEMENT FIGÉ : on calcule la HDRI UNE seule fois, sur une frame
// choisie (FROZEN_T), puis on n'y touche plus. Plus de PMREM par frame
// = plus de surchauffe sur les ordis/téléphones. Change FROZEN_T pour
// "tomber" sur un autre instant du bruit si la compo ne te plaît pas.
const FROZEN_T = 12.0;
env.render(FROZEN_T);
eqTex.needsUpdate = true;

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

// Variante du modèle : mobile = GLB plus léger (textures 1024), desktop =
// pleine qualité (textures 2048). Les deux sont produits par le même export
// Blender (cf. pipeline/update-model.sh) -> géométrie identique.
const MODEL_URL = isMobile ? '3D/space-mobile.glb' : '3D/space.glb';

// Progression de la barre, pilotée par les OCTETS RÉELLEMENT REÇUS.
// Le serveur (dev en "chunked", parfois la prod) omet souvent Content-Length :
// e.total vaut alors 0, MAIS e.loaded (octets reçus) reste fiable. On divise
// donc par la taille du fichier -> vraie progression du téléchargement, fluide
// et logique (à débit constant = vitesse constante). Plus de fausse rampe.
let estTotal = isMobile ? 3_500_000 : 10_600_000;  // estimation de repli (octets)
let shown = 0;        // % affiché : pilote la barre ET le chiffre (toujours en phase)
let loadedBytes = 0;  // octets reçus (dispo même sans Content-Length)
let knownTotal = 0;   // taille exacte si le serveur l'annonce (prime sur l'estimé)
let floor = 0;        // filet anti-figé le temps d'établir la connexion
let finished = false;

// Taille exacte des variantes, écrite par le pipeline -> barre précise sans
// constante codée en dur. Non bloquant : si le fetch échoue, on garde l'estimé.
fetch('3D/space.manifest.json')
  .then((r) => r.json())
  .then((m) => { const b = isMobile ? m.mobile : m.desktop; if (b) estTotal = b; })
  .catch(() => {});

function paint(p) {
  const v = Math.round(p);
  loaderBar.style.width = v + '%';   // même valeur arrondie pour la barre…
  if (loaderPct) loaderPct.innerHTML = v + '<small>%</small>';  // …et le chiffre
  if (loaderStatus) loaderStatus.textContent = statusFor(v);
}

function animateLoader() {
  if (finished) return;
  // Cible = vraie progression du téléchargement. Plafond 99% : le décodage
  // Draco arrive APRÈS le téléchargement -> finishLoader() conclut à 100%.
  const total = knownTotal || estTotal;
  floor = Math.min(12, floor + 0.3);   // bouge un peu avant les 1ers octets, puis le réel prend le relais
  const target = Math.max(Math.min(99, (loadedBytes / total) * 100), floor);
  // Rattrapage à vitesse constante (pas d'easing) -> aucune décélération
  // « illogique » ni mur. Plafonné à la cible pour ne jamais la dépasser.
  shown = Math.min(target, shown + 1.2);
  paint(shown);
  requestAnimationFrame(animateLoader);
}
requestAnimationFrame(animateLoader);

// Tween final fluide de la valeur courante -> 100%, puis fondu de l'écran.
function finishLoader() {
  finished = true;
  const from = shown;
  let k = 0;
  (function fill() {
    k = Math.min(1, k + 0.06);                 // ~0.3s à 60fps
    paint(from + (100 - from) * k);
    if (k < 1) requestAnimationFrame(fill);
    else setTimeout(() => loaderEl.classList.add('hidden'), 250);
  })();
}

loader.load(
  MODEL_URL,
  (gltf) => {
    scene.add(gltf.scene);
    // Centre / rayon de la scène -> pour cadrer l'orbite
    const box = new THREE.Box3().setFromObject(gltf.scene);
    box.getCenter(SCENE_CENTER);
    SCENE_RADIUS = box.getSize(new THREE.Vector3()).length() / 2;
    // Position de départ choisie sur l'appareil (le cadrage que tu aimes)...
    if (isMobile) camera.position.copy(MOBILE_POS);
    // ...MAIS on orbite autour du VRAI centre du modèle. C'est la clé : comme
    // OrbitControls zoome toujours VERS la cible, une cible décentrée (vers
    // l'avant) rendait le zoom asymétrique — nickel de devant, impossible de
    // dos (on fonçait vers le point avant en traversant la scène). En ciblant
    // le centre, on s'approche du contenu depuis n'importe quel angle.
    orbit.target.copy(SCENE_CENTER);
    // Bornes proportionnelles à la distance de cadrage (caméra ↔ centre), pas
    // au rayon de bounding box (faussé par l'étendue du sol/décor du GLB).
    const frameDist = camera.position.distanceTo(orbit.target);
    orbit.minDistance = frameDist * 0.12;   // s'approcher du contenu sans le traverser
    orbit.maxDistance = frameDist * 3;       // voir toute la scène, sans plus (fini le 1px)
    // FAR juste au-delà de l'éloignement max + l'étendue de la scène, pour ne
    // jamais clipper la géométrie quand on est complètement dézoomé.
    camera.far = orbit.maxDistance + SCENE_RADIUS * 2;
    camera.updateProjectionMatrix();
    orbit.update();
    buildHotspots();
    // Tween fluide vers 100% puis fondu une fois la scène prête.
    finishLoader();
    setMode('orbit');                      // démarre en mode Orbite
  },
  (e) => {
    // e.loaded = octets reçus (toujours fourni). e.total n'est dispo que si
    // le serveur envoie Content-Length ; on s'en sert alors comme taille exacte.
    loadedBytes = e.loaded;
    if (e.lengthComputable && e.total) knownTotal = e.total;
  },
  (err) => {
    if (loaderStatus) loaderStatus.textContent = 'Could not load the space';
    loaderEl.innerHTML = '<div class="loader-core">'
      + '<h1 class="loader-wordmark">Oops</h1>'
      + '<p class="loader-status">The 3D space failed to load.<br>' + err + '</p></div>';
  }
);

/* ===================================================================
   CONTRÔLES
   =================================================================== */
let mode = 'orbit';                       // 'fly' | 'orbit'  (orbite par défaut)
// true dès le départ : on garde le cadrage par défaut (camera.position +
// DEFAULT_TARGET posés plus haut) au lieu de laisser frameScene() l'écraser
// à la 1re entrée en orbite. frameScene() reste accessible via Numpad 0.
let orbitFramedOnce = true;

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
orbit.target.copy(DEFAULT_TARGET);

/* ---------- Gestes tactiles (mobile) ----------
   Un doigt = pivoter (orbite). Deux doigts qui glissent = TRANSLATION dans le
   plan de l'écran : sur les côtés = latéral, vers le haut/bas = la caméra
   monte/descend. Pincer = zoom (avancer/reculer).
   screenSpacePanning à true => le haut/bas reste un vrai haut/bas écran. */
orbit.screenSpacePanning = true;
orbit.enablePan = true;
orbit.touches.ONE = THREE.TOUCH.ROTATE;
orbit.touches.TWO = THREE.TOUCH.DOLLY_PAN;

const isTouch = matchMedia('(pointer: coarse)').matches;

// Zoom VERS le curseur : à la molette, on zoome là où pointe la souris.
// MAIS pas au doigt : sur tactile, ce chemin se grippe quand le TOUT PREMIER
// geste est un pincement (l'ancre de zoom n'a jamais été amorcée par un
// déplacement préalable comme c'est toujours le cas à la souris) -> le zoom
// « se bloque ». Sur tactile on garde donc un pincement = dolly simple et fiable.
orbit.zoomToCursor = !isTouch;

// Réglages de sensibilité réservés au tactile : on garde le feeling souris
// intact sur desktop, et on rend le doigt plus franc + l'inertie plus glissée.
if (isTouch) {
  orbit.rotateSpeed = 0.55;     // pivot posé, pas nerveux à un doigt
  orbit.panSpeed = 2.6;         // translation franche à deux doigts (latéral + haut/bas)
  orbit.zoomSpeed = 2.4;        // pincer pour avancer/reculer — plus réactif
  orbit.dampingFactor = 0.12;   // glissé qui se prolonge un peu après le doigt
}

/* ---------- Gizmo d'axes interactif (façon Blender) ----------
   Pastilles X/Y/Z en haut à droite : un clic/tap snappe la caméra sur l'axe
   correspondant (animation fluide). Tourne autour de orbit.target — on PARTAGE
   la référence pour que le snap vise toujours le point regardé, pas l'origine. */
const viewHelper = new ViewHelper(camera, dom);
viewHelper.center = orbit.target;
// Plus petit et plus haut sur mobile (le bouton Mode y est masqué) ; sous le
// bouton Mode sur desktop (top:70 + ~36 de hauteur).
if (isMobile) { viewHelper.dim = 108; viewHelper.marginTop = 70; viewHelper.marginRight = 10; }
else          { viewHelper.dim = 136; viewHelper.marginTop = 112; viewHelper.marginRight = 20; }

// Zone DOM transparente posée EXACTEMENT sur le gizmo : capte le clic/tap et le
// relaie à handleClick (qui recalcule les coords depuis le canvas). Hors de
// cette zone, le canvas garde l'orbite/zoom normalement.
const gizmoEl = document.getElementById('view-gizmo');
gizmoEl.style.width = gizmoEl.style.height = viewHelper.dim + 'px';
gizmoEl.style.top = viewHelper.marginTop + 'px';
gizmoEl.style.right = viewHelper.marginRight + 'px';
gizmoEl.addEventListener('pointerup', (e) => viewHelper.handleClick(e));

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
  if (e.code === 'Tab') { e.preventDefault(); if (!isMobile) setMode(mode === 'fly' ? 'orbit' : 'fly'); return; }
  if (DEV && e.code === 'KeyP') { e.preventDefault(); dumpCamera(); return; }
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
    gizmoEl.classList.remove('hidden');
    modeBtn.textContent = 'Mode: Orbit';
    dom.style.cursor = 'grab';
  } else {
    orbit.enabled = false;
    reticle.classList.remove('hidden');
    help.classList.remove('hidden');
    numpadHelp.classList.add('hidden');
    gizmoEl.classList.add('hidden');
    modeBtn.textContent = 'Mode: Fly';
    dom.style.cursor = 'default';
    if (!modal.classList.contains('open')) intro.classList.remove('hidden');
  }
}
// Sur téléphone, le mode Fly (WASD + pointer-lock) n'a pas de sens : on bloque
// la bascule. Le bouton est masqué et reste sur Orbite.
if (isMobile) {
  modeBtn.disabled = true;
  modeBtn.hidden = true;
} else {
  modeBtn.addEventListener('click', () => setMode(mode === 'fly' ? 'orbit' : 'fly'));
}

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
  // Au doigt (tactile) : pas de survol continu — on agit au tap (cf. pointerup).
  // Sinon le tooltip/curseur resterait « collé » à la dernière position touchée.
  const usePoint = mode === 'fly'
    ? (fly.isLocked ? center : null)
    : (isTouch ? null : mouseNDC);
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
  if (!html) html = '<p class="soon">Contenu à venir — photos & vidéos du studio.</p>';
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

/* ---------- Clic / tap = ouvrir une bulle (clic franc, pas un drag) ---------- */
// Raycast PONCTUEL à un point écran donné : fiable au doigt (où il n'y a
// pas de survol), aussi bien qu'à la souris. Renvoie la bulle touchée ou null.
const tapNDC = new THREE.Vector2();
function hotspotAt(clientX, clientY) {
  tapNDC.x = (clientX / window.innerWidth) * 2 - 1;
  tapNDC.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(tapNDC, camera);
  const hits = raycaster.intersectObjects(hotspotGroup.children, false);
  return hits.length ? hits[0].object : null;
}

let downX = 0, downY = 0;
// Tolérance de déplacement : un peu plus large au doigt (le doigt « bouge »
// toujours un peu) qu'à la souris, pour distinguer un tap d'un glissé/orbite.
const TAP_SLOP = isTouch ? 12 : 5;
dom.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; });
dom.addEventListener('pointerup', (e) => {
  const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
  if (mode === 'fly' && fly.isLocked && hovered) {
    openModal(hovered.userData.hotspot);
  } else if (mode === 'orbit' && moved < TAP_SLOP) {
    // tap/clic franc : on vise précisément l'endroit relâché
    const hit = hotspotAt(e.clientX, e.clientY);
    if (hit) openModal(hit.userData.hotspot);
  }
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

// autoClear OFF : on efface nous-mêmes une fois par frame. Le gizmo se rend
// ensuite dans son coin (clearDepth uniquement) PAR-DESSUS la scène sans
// l'effacer — c'est la mécanique attendue par ViewHelper.
renderer.autoClear = false;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const t = clock.elapsedTime;

  flyStep(dt);
  // Pendant le snap du gizmo, il pilote la caméra : on met orbit en pause pour
  // ne pas se battre avec lui (sinon damping vs slerp = saccades).
  if (viewHelper.animating) viewHelper.update(dt);
  else if (mode === 'orbit') orbit.update();
  pick();

  for (const s of hotspotGroup.children) {
    s.scale.setScalar(s.userData.base * (1 + Math.sin(t * 2 + s.position.x) * 0.12));
  }

  // HDRI Perlin FIGÉE : plus aucun recalcul ici (cf. FROZEN_T plus haut).
  // C'était ce bloc — render() du canvas + fromEquirectangular() (PMREM) —
  // qui faisait chauffer les machines en tournant ~3×/seconde.

  renderer.clear();
  renderer.render(scene, camera);
  viewHelper.render(renderer);
}
animate();

addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
