
/* =================================================================
   1) LE BRUIT DE PERLIN  (version "improved noise" de Ken Perlin)
   -----------------------------------------------------------------
   noise(x, y, z) renvoie une valeur lisse entre -1 et 1.
   Deux points proches -> valeurs proches (= organique, pas aleatoire pur).
   On utilisera z comme le TEMPS pour animer.
   ================================================================= */
class Perlin {
  constructor() {
    // Table de permutation melangee (la "graine" de l'aleatoire)
    const perm = [...Array(256).keys()];
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    this.p = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.p[i] = perm[i & 255];
  }
  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); } // courbe douce
  lerp(a, b, t) { return a + t * (b - a); }               // interpolation
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

/* =================================================================
   2) BRUIT FRACTAL  (= on empile plusieurs octaves de Perlin)
   -----------------------------------------------------------------
   Grandes vagues + rides fines = matiere riche et organique.
   ================================================================= */
const perlin = new Perlin();
function fractal(x, y, z) {
  let total = 0, amp = 1, freq = 1, max = 0;
  for (let o = 0; o < 4; o++) {          // 4 octaves
    total += perlin.noise(x * freq, y * freq, z * freq) * amp;
    max += amp;
    amp *= 0.5;   // chaque octave compte 2x moins
    freq *= 2;    // ...mais a un detail 2x plus fin
  }
  return total / max;                    // ramene a peu pres dans [-1, 1]
}

/* =================================================================
   3) RENDU SUR LE CANVAS
   -----------------------------------------------------------------
   On dessine en BASSE resolution (rapide) ; le CSS l'etire en plein
   ecran. Chaque pixel : on lit le bruit -> on en deduit une couleur
   irisee (via la teinte HSL).
   ================================================================= */
const canvas = document.getElementById('water');
const ctx = canvas.getContext('2d');
const W = 200, H = 120;                   // <- resolution interne (monte/baisse pour perf/detail)
canvas.width = W; canvas.height = H;
const img = ctx.createImageData(W, H);

// petite fonction HSL -> RGB
function hsl(h, s, l) {
  h /= 360;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h * 12) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

const SCALE = 0.012;   // taille des vagues (petit = grandes ondulations)
let t = 0;

function render() {
  t += 0.004;          // vitesse du "courant" (avance dans la 3e dimension)
  const d = img.data;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // n entre 0 et 1 : la "hauteur" de la surface d'eau a cet endroit/instant
      let n = (fractal(x * SCALE, y * SCALE, t) + 1) / 2;

      // On mappe le bruit sur une teinte arc-en-ciel qui derive lentement
      const hue = 185 + n * 75;   // 185 (cyan) -> 260 (violet) : une vraie eau
      const [r, g, b] = hsl(hue, 0.7, 0.25 + n * 0.45);

      // Cretes lumineuses facon caustiques : on eclaircit les sommets
      const glow = Math.pow(n, 3);   // seules les valeurs hautes brillent

      const light = 0.15 + Math.pow(n, 1.5) * 0.6;   // creux sombres, crêtes lumineuses

      const i = (y * W + x) * 4;
      d[i]     = Math.min(255, r + glow * 120);
      d[i + 1] = Math.min(255, g + glow * 120);
      d[i + 2] = Math.min(255, b + glow * 120);
      d[i + 3] = 255;
      
    }
  }
  ctx.putImageData(img, 0, 0);
  requestAnimationFrame(render);
}
render();