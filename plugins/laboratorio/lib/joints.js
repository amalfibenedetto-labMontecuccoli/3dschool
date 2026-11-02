// @ts-check
// Le giunzioni semplici: scasso (dado), battuta, mezzo legno, incastro a dita e foro. Si lavora su
// una faccia piana di un pezzo a forma di parallelepipedo: si disegna sulla faccia la sagoma del
// taglio e la si spinge dentro il legno (o fino all'altra parte, se è passante), come si fa a mano
// con Spingi/Tira.
//
// Le coordinate sono in metri nel mondo; gli assi sono 0 = x, 1 = y, 2 = z.

/** @typedef {[number, number, number]} Vec3 */
/** @typedef {"scasso" | "battuta" | "mezzolegno" | "dita" | "foro"} Kind */
/** @typedef {{ width: number, depth: number }} Params */
/**
 * La faccia su cui si lavora.
 * @typedef {{ solid: number, face: number, axis: number, plane: number, min: Vec3, max: Vec3, normal: Vec3 }} FaceInfo
 */
/** @typedef {{ cuts: Vec3[][], depth: number, centre?: Vec3, note: string }} Plan */

export const KINDS = /** @type {const} */ ([
  { value: "scasso", label: "Scasso (dado): una scanalatura che attraversa il pezzo" },
  { value: "battuta", label: "Battuta: un gradino lungo un bordo" },
  { value: "mezzolegno", label: "Mezzo legno: togliere metà spessore all'estremità" },
  { value: "dita", label: "Incastro a dita (box joint): dita alternate all'estremità" },
  { value: "foro", label: "Foro tondo (per tasselli, viti o l'ingresso della casetta)" },
]);

/** Le misure di partenza di ogni giunzione, in metri. */
export const JOINT_DEFAULTS = /** @type {Record<string, { width: number, depth: number }>} */ ({
  scasso: { width: 0.018, depth: 0.006 },
  battuta: { width: 0.01, depth: 0.005 },
  mezzolegno: { width: 0.05, depth: 0 },
  dita: { width: 0.012, depth: 0.018 },
  foro: { width: 0.008, depth: 0.02 },
});

/**
 * La faccia come serve qui, oppure perché non va bene.
 * @param {number} solid @param {number} face
 * @param {{ min: Vec3, max: Vec3 }} box i limiti del solido
 * @param {{ normal: Vec3, origin: Vec3 }} f la faccia
 * @returns {FaceInfo | string}
 */
export function faceInfo(solid, face, box, f) {
  const n = f.normal;
  const axis = [0, 1, 2].reduce((best, k) => (Math.abs(n[k]) > Math.abs(n[best]) ? k : best), 0);
  if (Math.abs(n[axis]) < 0.9999) return "Questa faccia è inclinata: lavoro solo su facce parallele agli assi (come quelle di un'asse).";
  return { solid, face, axis, plane: f.origin[axis], min: box.min, max: box.max, normal: n };
}

/** I due assi della faccia: il più lungo e il più corto. @param {FaceInfo} f @returns {{ a: number, b: number }} */
export function inPlane(f) {
  const others = [0, 1, 2].filter((k) => k !== f.axis);
  const len = (/** @type {number} */ k) => f.max[k] - f.min[k];
  return len(others[0]) >= len(others[1]) ? { a: others[0], b: others[1] } : { a: others[1], b: others[0] };
}

/** @param {FaceInfo} f @param {number} a @param {number} av @param {number} b @param {number} bv @returns {Vec3} */
function point(f, a, av, b, bv) {
  /** @type {Vec3} */
  const p = [0, 0, 0];
  p[f.axis] = f.plane;
  p[a] = av;
  p[b] = bv;
  return p;
}

/**
 * Un rettangolo sulla faccia: da a1 a a2 lungo il lato lungo, da b1 a b2 lungo il lato corto.
 * @param {FaceInfo} f @param {number} a @param {number} b @param {number} a1 @param {number} a2 @param {number} b1 @param {number} b2
 * @returns {Vec3[]}
 */
function rect(f, a, b, a1, a2, b1, b2) {
  return [point(f, a, a1, b, b1), point(f, a, a2, b, b1), point(f, a, a2, b, b2), point(f, a, a1, b, b2)];
}

/**
 * La sagoma del taglio sulla faccia, per il punto toccato, e quanto è profondo.
 * @param {Kind} kind @param {FaceInfo} f @param {Vec3} at dove si è cliccato @param {Params} p
 * @returns {Plan | string}
 */
export function plan(kind, f, at, p) {
  const { a, b } = inPlane(f);
  const [a0, a1, b0, b1] = [f.min[a], f.max[a], f.min[b], f.max[b]];
  const thickness = f.max[f.axis] - f.min[f.axis];
  const w = p.width;
  if (!(w > 0)) return "La larghezza deve essere più di zero.";
  const through = !(p.depth > 0);
  const pa = at[a];
  const pb = at[b];

  // Dita e mezzo legno hanno una profondità loro: le dita attraversano il pezzo, il mezzo legno è metà spessore.
  if (kind === "mezzolegno" || kind === "dita") {
    const nearEnd = pa - a0 < a1 - pa ? 0 : 1;
    if (kind === "mezzolegno") {
      if (w >= a1 - a0) return "La sovrapposizione è più lunga del pezzo.";
      const cut = nearEnd === 0 ? rect(f, a, b, a0, a0 + w, b0, b1) : rect(f, a, b, a1 - w, a1, b0, b1);
      return { cuts: [cut], depth: thickness / 2, note: "mezzo legno" };
    }
    // Incastro a dita: un numero dispari di dita uguali; si tolgono quelle di posto dispari (le «tacche»).
    const len = p.depth > 0 ? p.depth : thickness;
    if (len >= a1 - a0) return "Le dita sono più lunghe del pezzo.";
    const total = b1 - b0;
    let n = Math.max(3, Math.round(total / w));
    if (n % 2 === 0) n += 1;
    const fw = total / n;
    /** @type {Vec3[][]} */
    const cuts = [];
    for (let i = 1; i < n; i += 2) {
      const lo = b0 + i * fw;
      cuts.push(nearEnd === 0 ? rect(f, a, b, a0, a0 + len, lo, lo + fw) : rect(f, a, b, a1 - len, a1, lo, lo + fw));
    }
    return { cuts, depth: thickness + 0.001, note: `incastro a dita (${n} dita)` };
  }

  const depth = through ? thickness + 0.001 : p.depth;
  if (!through && p.depth >= thickness) return "La profondità deve essere minore dello spessore del pezzo (oppure 0 per un taglio passante).";

  if (kind === "scasso") {
    // Attraversa tutto il pezzo nel senso del lato corto; sta nel punto toccato lungo il lato lungo.
    if (w >= a1 - a0) return "Lo scasso è più largo del pezzo.";
    const s = Math.min(Math.max(pa - w / 2, a0), a1 - w);
    return { cuts: [rect(f, a, b, s, s + w, b0, b1)], depth, note: through ? "scasso passante" : "scasso" };
  }
  if (kind === "battuta") {
    // Un gradino lungo il bordo più vicino al punto toccato.
    const d = [pa - a0, a1 - pa, pb - b0, b1 - pb];
    const side = d.indexOf(Math.min(...d));
    if (side < 2 && w >= a1 - a0) return "La battuta è più larga del pezzo.";
    if (side >= 2 && w >= b1 - b0) return "La battuta è più larga del pezzo.";
    const cut =
      side === 0 ? rect(f, a, b, a0, a0 + w, b0, b1) : side === 1 ? rect(f, a, b, a1 - w, a1, b0, b1) : side === 2 ? rect(f, a, b, a0, a1, b0, b0 + w) : rect(f, a, b, a0, a1, b1 - w, b1);
    return { cuts: [cut], depth, note: "battuta" };
  }
  // Foro: un cerchio (24 lati) di diametro `width`, tutto dentro la faccia.
  const r = w / 2;
  if (pa - r < a0 || pa + r > a1 || pb - r < b0 || pb + r > b1) return "Il foro esce dal bordo del pezzo: clicca più verso il centro, o usa un diametro più piccolo.";
  const pts = Array.from({ length: 24 }, (_, i) => {
    const t = (i / 24) * Math.PI * 2;
    return point(f, a, pa + r * Math.cos(t), b, pb + r * Math.sin(t));
  });
  return { cuts: [pts], depth, centre: point(f, a, pa, b, pb), note: through ? "foro passante" : "foro" };
}
