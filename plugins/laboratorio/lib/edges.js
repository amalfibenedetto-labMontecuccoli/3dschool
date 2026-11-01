// @ts-check
// I profili dei bordi: smusso (taglio a 45 gradi) e arrotondamento. Si disegna sulla testa del
// pezzo la piccola sagoma dell'angolo da togliere e la si spinge lungo tutto lo spigolo, come si
// farebbe con la pialla. Vale per gli spigoli dei pezzi a forma di parallelepipedo.
//
// Le coordinate sono in metri nel mondo; gli assi sono 0 = x, 1 = y, 2 = z.

/** @typedef {[number, number, number]} Vec3 */

export const PROFILES = /** @type {const} */ ([
  { value: "smusso", label: "Smusso (taglio a 45 gradi)" },
  { value: "arrotondato", label: "Arrotondamento" },
]);

const TOL = 1e-6;

/** @param {Vec3} a @param {Vec3} b */
const sub = (a, b) => /** @type {Vec3} */ ([a[0] - b[0], a[1] - b[1], a[2] - b[2]]);
/** @param {Vec3} a @param {Vec3} b */
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * Cosa disegnare e dove, per togliere l'angolo di uno spigolo.
 * @param {"smusso" | "arrotondato"} profile @param {number} size raggio o lato dello smusso
 * @param {{ a: Vec3, b: Vec3 }} edge lo spigolo
 * @param {{ min: Vec3, max: Vec3 }} box i limiti del pezzo
 * @param {{ id: number, normal: Vec3, origin: Vec3 }[]} faces le facce del pezzo
 * @returns {{ face: number, points: Vec3[], length: number } | string}
 */
export function edgePlan(profile, size, edge, box, faces) {
  if (!(size > 0)) return "La misura del profilo deve essere più di zero.";
  const d = sub(edge.b, edge.a);
  const length = Math.hypot(d[0], d[1], d[2]);
  if (length < TOL) return "Lo spigolo è troppo corto.";
  const axis = [0, 1, 2].reduce((best, k) => (Math.abs(d[k]) > Math.abs(d[best]) ? k : best), 0);
  if (Math.abs(d[axis]) < length * 0.9999) return "Questo spigolo è inclinato: lavoro solo su spigoli paralleli agli assi.";
  const [i, j] = [0, 1, 2].filter((k) => k !== axis);
  const P = edge.a;
  // Lo spigolo deve stare in un angolo del parallelepipedo.
  const onMin = (/** @type {number} */ k) => Math.abs(P[k] - box.min[k]) < TOL;
  const onMax = (/** @type {number} */ k) => Math.abs(P[k] - box.max[k]) < TOL;
  if (!(onMin(i) || onMax(i)) || !(onMin(j) || onMax(j))) return "Questo spigolo non è sull'angolo di un pezzo a forma di parallelepipedo.";
  const ui = onMin(i) ? 1 : -1;
  const uj = onMin(j) ? 1 : -1;
  if (size >= (box.max[i] - box.min[i]) / 2 || size >= (box.max[j] - box.min[j]) / 2) return "Il profilo è troppo grande per questo pezzo.";
  // La faccia di testa che passa per la prima estremità dello spigolo.
  const dir = /** @type {Vec3} */ ([0, 0, 0]);
  dir[axis] = 1;
  const end = faces.find((f) => Math.abs(Math.abs(dot(f.normal, dir)) - 1) < 1e-4 && Math.abs(dot(f.normal, sub(P, f.origin))) < 1e-5);
  if (!end) return "Non trovo la faccia di testa di questo spigolo.";
  /** @param {number} x @param {number} y @returns {Vec3} */
  const at = (x, y) => {
    const p = /** @type {Vec3} */ ([P[0], P[1], P[2]]);
    p[i] += ui * x;
    p[j] += uj * y;
    return p;
  };
  /** @type {Vec3[]} */
  let points;
  if (profile === "smusso") {
    points = [at(0, 0), at(size, 0), at(0, size)];
  } else {
    // L'angolo meno il quarto di cerchio che resta: il centro è a (r, r), l'arco va da (r, 0) a (0, r).
    const n = 8;
    points = [at(0, 0)];
    for (let k = 0; k <= n; k++) {
      const t = ((270 - (90 * k) / n) * Math.PI) / 180;
      points.push(at(size + size * Math.cos(t), size + size * Math.sin(t)));
    }
  }
  return { face: end.id, points, length: length + 0.001 };
}
