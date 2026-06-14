/* =====================================================================
   hdri.js — ENVIRONNEMENT IRISÉ PROCÉDURAL (bruit de Perlin)
   ---------------------------------------------------------------------
   On reprend ton générateur Perlin (leçons précédentes) mais cette fois
   le canvas ne décore plus la page : il devient la LUMIÈRE de la scène 3D
   (une "HDRI" maison). Three.js s'en sert pour éclairer le verre, le métal
   et poser des reflets arc-en-ciel sur tes blobs.

   On exporte makePerlinEnv() -> { canvas, render(t) }.
   ===================================================================== */

// --- Bruit de Perlin (improved noise, Ken Perlin) — identique à water.js ---
class Perlin {
  constructor() {
    const perm = [...Array(256).keys()];
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    this.p = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.p[i] = perm[i & 255];
  }
  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(a, b, t) { return a + t * (b - a); }
  grad(h, x, y, z) {
    h &= 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
  noise(x, y, z) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = this.fade(x), v = this.fade(y), w = this.fade(z);
    const p = this.p;
    const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z;
    const B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
    return this.lerp(
      this.lerp(
        this.lerp(this.grad(p[AA], x, y, z),     this.grad(p[BA], x - 1, y, z), u),
        this.lerp(this.grad(p[AB], x, y - 1, z), this.grad(p[BB], x - 1, y - 1, z), u), v),
      this.lerp(
        this.lerp(this.grad(p[AA + 1], x, y, z - 1),     this.grad(p[BA + 1], x - 1, y, z - 1), u),
        this.lerp(this.grad(p[AB + 1], x, y - 1, z - 1), this.grad(p[BB + 1], x - 1, y - 1, z - 1), u), v),
      w);
  }
}

/* Palette florale/irisée (du creux sombre vers la crête lumineuse).
   C'est TA palette — change ces RGB pour changer l'ambiance de la lumière. */
   
const PALETTE = [
  [  8,  20,  55],   // bleu nuit profond (creux)
  [ 20,  65, 150],   // bleu franc
  [ 25, 120, 220],   // azur
  [ 55, 190, 245],   // cyan lumineux
  [150, 230, 255],   // cyan clair
  [245, 252, 255],   // écume (crêtes)
];

function ramp(n) {
  n = Math.max(0, Math.min(0.999, n));
  const seg = n * (PALETTE.length - 1);
  const i = Math.floor(seg);
  const f = seg - i;
  const a = PALETTE[i], b = PALETTE[i + 1];
  return [
    a[0] + (b[0] - a[0]) * f,
    a[1] + (b[1] - a[1]) * f,
    a[2] + (b[2] - a[2]) * f,
  ];
}

export function makePerlinEnv({ width = 256, height = 128 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.createImageData(width, height);
  const perlin = new Perlin();

  function fractal(x, y, z) {
    let total = 0, amp = 1, freq = 1, max = 0;
    for (let o = 0; o < 4; o++) {
      total += perlin.noise(x * freq, y * freq, z * freq) * amp;
      max += amp; amp *= 0.5; freq *= 2;
    }
    return total / max;
  }

  const SCALE = 0.018;

  function render(t) {
    const d = img.data;
    for (let y = 0; y < height; y++) {
      // Dégradé vertical "ciel -> sol" : le haut éclaire plus que le bas.
      // (rend la lumière directionnelle, donc plus crédible qu'un fond plat)
      const sky = 1 - y / height;                 // 1 en haut, 0 en bas
      const skyBoost = 0.55 + sky * 0.7;
      for (let x = 0; x < width; x++) {
        const n = (fractal(x * SCALE, y * SCALE, t) + 1) / 2;
        let [r, g, b] = ramp(n);
        r *= skyBoost; g *= skyBoost; b *= skyBoost;
        const i = (y * width + x) * 4;
        d[i]     = Math.min(255, r);
        d[i + 1] = Math.min(255, g);
        d[i + 2] = Math.min(255, b);
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  render(0);
  return { canvas, render };
}
