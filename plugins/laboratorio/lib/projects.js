// @ts-check
// I progetti guidati: ogni progetto è una funzione che, date le misure (in metri), restituisce
// i pezzi (ognuno un componente con il nome che userà la lista di taglio), i passi di montaggio
// e, se serve, perché le misure non vanno bene.
//
// Assi: x lungo la larghezza, y dal davanti al dietro, z in alto.

/** @typedef {{ id: string, label: string, unit: "length" | "count", value: number, min: number, max?: number }} Param */
/** @typedef {{ name: string, boxes: { min: [number, number, number], size: [number, number, number] }[], copies: { at: [number, number, number], name?: string }[], material?: string }} Part */
/** @typedef {{ name: string, parts: Part[], steps: string[], tip: string }} Built */
/** @typedef {{ id: string, title: string, about: string, params: Param[], build: (p: Record<string, number>) => Built, problem: (p: Record<string, number>) => string | null }} Project */

/** I materiali della scuola: nome e colore. */
export const MATERIALS = [
  { name: "Pino", color: /** @type {[number, number, number, number]} */ ([222, 184, 135, 255]) },
  { name: "Faggio", color: /** @type {[number, number, number, number]} */ ([205, 160, 120, 255]) },
  { name: "Compensato", color: /** @type {[number, number, number, number]} */ ([214, 180, 130, 255]) },
  { name: "MDF", color: /** @type {[number, number, number, number]} */ ([170, 140, 105, 255]) },
];

const MM = 0.001;

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => (n === 1 ? one : many);

/**
 * Una scatola dai lati, dal fondo e dal coperchio.
 * @type {Project}
 */
const scatola = {
  id: "scatola",
  title: "Scatola con coperchio",
  about: "Una scatola di cinque pezzi più il coperchio: fondo, due lati lunghi, due lati corti.",
  params: [
    { id: "w", label: "Larghezza", unit: "length", value: 200 * MM, min: 0 },
    { id: "d", label: "Profondità", unit: "length", value: 150 * MM, min: 0 },
    { id: "h", label: "Altezza", unit: "length", value: 100 * MM, min: 0 },
    { id: "t", label: "Spessore", unit: "length", value: 10 * MM, min: 0 },
  ],
  problem: (p) => {
    if (!(p.t >= 3 * MM)) return "Lo spessore deve essere almeno 3 mm.";
    if (!(p.w > 4 * p.t) || !(p.d > 4 * p.t)) return "Larghezza e profondità devono essere almeno quattro volte lo spessore.";
    if (!(p.h > 3 * p.t)) return "L'altezza deve essere più di tre volte lo spessore.";
    return null;
  },
  build: (p) => {
    const { w, d, h, t } = p;
    const side = h - 2 * t;
    return {
      name: "Scatola",
      parts: [
        { name: "Fondo", boxes: [{ min: [0, 0, 0], size: [w, d, t] }], copies: [{ at: [0, 0, 0] }] },
        {
          name: "Lato lungo",
          boxes: [{ min: [0, 0, 0], size: [w, t, side] }],
          copies: [{ at: [0, 0, t], name: "Lato davanti" }, { at: [0, d - t, t], name: "Lato dietro" }],
        },
        {
          name: "Lato corto",
          boxes: [{ min: [0, 0, 0], size: [t, d - 2 * t, side] }],
          copies: [{ at: [0, t, t], name: "Lato sinistro" }, { at: [w - t, t, t], name: "Lato destro" }],
        },
        { name: "Coperchio", boxes: [{ min: [0, 0, 0], size: [w, d, t] }], copies: [{ at: [0, 0, h - t] }] },
      ],
      steps: [
        "Taglia i pezzi alle misure della lista di taglio e controllale con il metro.",
        "Smussa con la carta vetrata gli spigoli e le facce di ogni pezzo.",
        "Incolla i due lati corti tra i due lati lunghi, formando un telaio, e controlla gli angoli con la squadra.",
        "Incolla il telaio sopra il fondo e lascia asciugare.",
        "Appoggia il coperchio sopra senza incollarlo, così la scatola si apre.",
      ],
      tip: "Con lo strumento Giunzioni puoi fare una battuta (un gradino) sul bordo del coperchio perché resti fermo.",
    };
  },
};

/**
 * Una casetta per uccelli con il tetto piano.
 * @type {Project}
 */
const casetta = {
  id: "casetta",
  title: "Casetta per uccelli",
  about: "Una casetta a pianta quadrata con il tetto piano che sporge; il foro d'ingresso lo fai tu dopo.",
  params: [
    { id: "w", label: "Larghezza", unit: "length", value: 140 * MM, min: 0 },
    { id: "d", label: "Profondità", unit: "length", value: 140 * MM, min: 0 },
    { id: "h", label: "Altezza delle pareti", unit: "length", value: 220 * MM, min: 0 },
    { id: "t", label: "Spessore", unit: "length", value: 12 * MM, min: 0 },
    { id: "over", label: "Sporgenza del tetto", unit: "length", value: 20 * MM, min: 0 },
  ],
  problem: (p) => {
    if (!(p.t >= 6 * MM)) return "Lo spessore deve essere almeno 6 mm.";
    if (!(p.w > 6 * p.t) || !(p.d > 6 * p.t)) return "La casetta è troppo stretta per lo spessore scelto.";
    if (!(p.h > 6 * p.t)) return "Le pareti sono troppo basse per lo spessore scelto.";
    if (!(p.over >= 0)) return "La sporgenza del tetto non può essere negativa.";
    return null;
  },
  build: (p) => {
    const { w, d, h, t, over } = p;
    return {
      name: "Casetta per uccelli",
      parts: [
        { name: "Fondo", boxes: [{ min: [0, 0, 0], size: [w, d, t] }], copies: [{ at: [0, 0, 0] }] },
        {
          name: "Parete laterale",
          boxes: [{ min: [0, 0, 0], size: [t, d, h] }],
          copies: [{ at: [0, 0, t], name: "Parete sinistra" }, { at: [w - t, 0, t], name: "Parete destra" }],
        },
        {
          name: "Parete davanti e dietro",
          boxes: [{ min: [0, 0, 0], size: [w - 2 * t, t, h] }],
          copies: [{ at: [t, 0, t], name: "Parete davanti" }, { at: [t, d - t, t], name: "Parete dietro" }],
        },
        { name: "Tetto", boxes: [{ min: [0, 0, 0], size: [w + 2 * over, d + 2 * over, t] }], copies: [{ at: [-over, -over, t + h] }] },
      ],
      steps: [
        "Taglia i pezzi alle misure della lista di taglio.",
        "Con lo strumento Giunzioni fai nella parete davanti un foro d'ingresso di 3 cm, a due terzi dell'altezza, e forellini in basso per far uscire l'acqua dal fondo.",
        "Incolla le due pareti laterali ai bordi del fondo.",
        "Incolla la parete davanti e quella dietro tra le pareti laterali.",
        "Appoggia il tetto: deve sporgere uguale su tutti i lati. Fissalo con due viti per poter pulire la casetta a fine stagione.",
      ],
      tip: "Non mettere il posatoio davanti al foro: i predatori lo usano per arrivare ai piccoli.",
    };
  },
};

/**
 * Sgabello, tavolino e panca: un piano, quattro gambe e quattro traversi.
 * @param {string} id @param {string} title @param {string} name @param {string} about @param {Param[]} params @param {string[]} steps @param {string} tip
 * @returns {Project}
 */
function conGambe(id, title, name, about, params, steps, tip) {
  return {
    id,
    title,
    about,
    params,
    problem: (p) => {
      if (!(p.ts >= 10 * MM)) return "Il piano deve avere almeno 10 mm di spessore.";
      if (!(p.s >= 20 * MM)) return "Le gambe devono avere almeno 20 mm di lato.";
      if (!(p.w > 2 * p.inset + 2 * p.s + 40 * MM) || !(p.d > 2 * p.inset + 2 * p.s + 40 * MM)) return "Il piano è troppo piccolo per le gambe.";
      if (!(p.h > p.ts + 120 * MM)) return "L'altezza deve essere più del piano più 12 cm.";
      return null;
    },
    build: (p) => {
      const { w, d, h, ts, s, inset } = p;
      const rt = 20 * MM;
      const rh = 50 * MM;
      const legH = h - ts;
      const railZ = legH - rh - 10 * MM;
      const x2 = w - inset - s;
      const y2 = d - inset - s;
      return {
        name,
        parts: [
          { name: "Piano", boxes: [{ min: [0, 0, 0], size: [w, d, ts] }], copies: [{ at: [0, 0, legH] }] },
          {
            name: "Gamba",
            boxes: [{ min: [0, 0, 0], size: [s, s, legH] }],
            copies: [
              { at: [inset, inset, 0], name: "Gamba davanti sinistra" },
              { at: [x2, inset, 0], name: "Gamba davanti destra" },
              { at: [inset, y2, 0], name: "Gamba dietro sinistra" },
              { at: [x2, y2, 0], name: "Gamba dietro destra" },
            ],
          },
          {
            name: "Traverso lungo",
            boxes: [{ min: [0, 0, 0], size: [w - 2 * inset - 2 * s, rt, rh] }],
            copies: [{ at: [inset + s, inset, railZ], name: "Traverso davanti" }, { at: [inset + s, d - inset - rt, railZ], name: "Traverso dietro" }],
          },
          {
            name: "Traverso corto",
            boxes: [{ min: [0, 0, 0], size: [rt, d - 2 * inset - 2 * s, rh] }],
            copies: [{ at: [inset, inset + s, railZ], name: "Traverso sinistro" }, { at: [w - inset - rt, inset + s, railZ], name: "Traverso destro" }],
          },
        ],
        steps,
        tip,
      };
    },
  };
}

const sgabello = conGambe(
  "sgabello",
  "Sgabello",
  "Sgabello",
  "Uno sgabello con il piano, quattro gambe e quattro traversi che lo irrigidiscono.",
  [
    { id: "w", label: "Larghezza del piano", unit: "length", value: 300 * MM, min: 0 },
    { id: "d", label: "Profondità del piano", unit: "length", value: 300 * MM, min: 0 },
    { id: "h", label: "Altezza", unit: "length", value: 450 * MM, min: 0 },
    { id: "ts", label: "Spessore del piano", unit: "length", value: 20 * MM, min: 0 },
    { id: "s", label: "Lato delle gambe", unit: "length", value: 40 * MM, min: 0 },
    { id: "inset", label: "Distanza delle gambe dal bordo", unit: "length", value: 20 * MM, min: 0 },
  ],
  [
    "Taglia i pezzi alle misure della lista di taglio; le quattro gambe devono essere tutte della stessa lunghezza.",
    "Smussa gli spigoli e carteggia tutti i pezzi.",
    "Incolla un traverso lungo e uno corto tra due gambe, per fare due telai a L e poi due telai chiusi.",
    "Metti i due telai in piedi e collegali con gli altri traversi; controlla con la squadra che non siano storti.",
    "Capovolgi il piano, appoggiaci sopra le gambe e avvita dal basso attraverso i traversi.",
  ],
  "Misura le due diagonali del telaio: se sono uguali, è squadrato.",
);

const tavolino = conGambe(
  "tavolino",
  "Tavolino",
  "Tavolino",
  "Un tavolino con il piano, quattro gambe e quattro traversi.",
  [
    { id: "w", label: "Lunghezza del piano", unit: "length", value: 800 * MM, min: 0 },
    { id: "d", label: "Larghezza del piano", unit: "length", value: 500 * MM, min: 0 },
    { id: "h", label: "Altezza", unit: "length", value: 450 * MM, min: 0 },
    { id: "ts", label: "Spessore del piano", unit: "length", value: 20 * MM, min: 0 },
    { id: "s", label: "Lato delle gambe", unit: "length", value: 45 * MM, min: 0 },
    { id: "inset", label: "Distanza delle gambe dal bordo", unit: "length", value: 30 * MM, min: 0 },
  ],
  [
    "Taglia i pezzi alle misure della lista di taglio.",
    "Smussa e carteggia tutti i pezzi, prima di incollare: dopo è molto più difficile.",
    "Incolla i due traversi corti tra due gambe, per due telai laterali.",
    "Collega i due telai con i traversi lunghi e controlla le diagonali.",
    "Appoggia il piano e fissalo dal basso con viti o con tasselli di legno.",
  ],
  "Un traverso sotto il piano lo tiene dritto e aggiunge rigidità.",
);

const panca = conGambe(
  "panca",
  "Panca",
  "Panca",
  "Una panca lunga con il piano, quattro gambe e quattro traversi.",
  [
    { id: "w", label: "Lunghezza del piano", unit: "length", value: 1000 * MM, min: 0 },
    { id: "d", label: "Larghezza del piano", unit: "length", value: 300 * MM, min: 0 },
    { id: "h", label: "Altezza", unit: "length", value: 450 * MM, min: 0 },
    { id: "ts", label: "Spessore del piano", unit: "length", value: 25 * MM, min: 0 },
    { id: "s", label: "Lato delle gambe", unit: "length", value: 50 * MM, min: 0 },
    { id: "inset", label: "Distanza delle gambe dal bordo", unit: "length", value: 40 * MM, min: 0 },
  ],
  [
    "Taglia i pezzi alle misure della lista di taglio: le quattro gambe uguali e i quattro traversi a coppie.",
    "Smussa gli spigoli del piano con lo strumento Profili dei bordi: una panca si tocca sempre.",
    "Incolla i traversi corti tra le gambe, per fare due telai laterali, e lasciali asciugare.",
    "Collega i telai con i traversi lunghi e controlla le diagonali con il metro.",
    "Appoggia il piano e fissalo dal basso con viti, senza farle uscire dalla parte di sopra.",
  ],
  "Su una panca lunga conviene un traverso in più al centro: prova ad aggiungerlo tu.",
);

/**
 * Un cassetto: fronte, retro, due lati e il fondo, che entra in una scanalatura.
 * @type {Project}
 */
const cassetto = {
  id: "cassetto",
  title: "Cassetto",
  about: "Un cassetto di cinque pezzi: fronte, retro, due lati e il fondo sottile in una scanalatura.",
  params: [
    { id: "w", label: "Larghezza", unit: "length", value: 400 * MM, min: 0 },
    { id: "d", label: "Profondità", unit: "length", value: 400 * MM, min: 0 },
    { id: "h", label: "Altezza", unit: "length", value: 120 * MM, min: 0 },
    { id: "t", label: "Spessore dei lati", unit: "length", value: 12 * MM, min: 0 },
    { id: "tb", label: "Spessore del fondo", unit: "length", value: 6 * MM, min: 0 },
  ],
  problem: (p) => {
    if (!(p.t >= 8 * MM)) return "I lati devono avere almeno 8 mm di spessore.";
    if (!(p.tb >= 3 * MM) || !(p.tb < p.t)) return "Il fondo deve essere sottile: da 3 mm fino a meno dello spessore dei lati.";
    if (!(p.w > 6 * p.t) || !(p.d > 6 * p.t)) return "Il cassetto è troppo piccolo per lo spessore scelto.";
    if (!(p.h > 4 * p.t)) return "Il cassetto è troppo basso per lo spessore scelto.";
    return null;
  },
  build: (p) => {
    const { w, d, h, t, tb } = p;
    // Il fondo sta in una scanalatura a 8 mm dal bordo di sotto, nei quattro lati.
    const g = 8 * MM;
    return {
      name: "Cassetto",
      parts: [
        { name: "Fronte", boxes: [{ min: [0, 0, 0], size: [w, t, h] }], copies: [{ at: [0, 0, 0] }] },
        { name: "Retro", boxes: [{ min: [0, 0, 0], size: [w, t, h] }], copies: [{ at: [0, d - t, 0] }] },
        {
          name: "Lato",
          boxes: [{ min: [0, 0, 0], size: [t, d - 2 * t, h] }],
          copies: [{ at: [0, t, 0], name: "Lato sinistro" }, { at: [w - t, t, 0], name: "Lato destro" }],
        },
        { name: "Fondo", boxes: [{ min: [0, 0, 0], size: [w - 2 * t, d - 2 * t, tb] }], copies: [{ at: [t, t, g] }] },
      ],
      steps: [
        "Taglia i pezzi alle misure della lista di taglio.",
        `Su ognuno dei quattro lati fai, con lo strumento Giunzioni, uno scasso largo ${Math.round(tb / MM)} mm e profondo 5 mm, a ${Math.round(g / MM)} mm dal bordo di sotto: ci scorrerà il fondo.`,
        "Incolla i due lati tra il fronte e il retro, formando un telaio, e controlla gli angoli con la squadra.",
        "Infila il fondo nelle scanalature prima che la colla sia asciutta, senza incollarlo: potrà dilatarsi.",
        "Dopo l'asciugatura carteggia il cassetto, finché scorre senza sforzo.",
      ],
      tip: "Lascia un millimetro di gioco per lato rispetto all'apertura in cui il cassetto deve scorrere.",
    };
  },
};

/**
 * Una cassetta per gli attrezzi, aperta, con un manico tra le due testate.
 * @type {Project}
 */
const cassettaAttrezzi = {
  id: "attrezzi",
  title: "Cassetta degli attrezzi",
  about: "Una cassetta aperta con due testate alte e un manico di legno tra le testate.",
  params: [
    { id: "w", label: "Lunghezza", unit: "length", value: 400 * MM, min: 0 },
    { id: "d", label: "Larghezza", unit: "length", value: 200 * MM, min: 0 },
    { id: "h", label: "Altezza dei lati", unit: "length", value: 120 * MM, min: 0 },
    { id: "t", label: "Spessore", unit: "length", value: 12 * MM, min: 0 },
    { id: "hh", label: "Quanto sporgono le testate", unit: "length", value: 90 * MM, min: 0 },
  ],
  problem: (p) => {
    if (!(p.t >= 8 * MM)) return "Lo spessore deve essere almeno 8 mm.";
    if (!(p.w > 8 * p.t) || !(p.d > 8 * p.t)) return "La cassetta è troppo piccola per lo spessore scelto.";
    if (!(p.h > 4 * p.t)) return "I lati sono troppo bassi per lo spessore scelto.";
    if (!(p.hh >= 60 * MM)) return "Le testate devono sporgere almeno 6 cm, per tenere il manico.";
    return null;
  },
  build: (p) => {
    const { w, d, h, t, hh } = p;
    const grip = 25 * MM;
    const top = h + t + hh;
    return {
      name: "Cassetta degli attrezzi",
      parts: [
        { name: "Fondo", boxes: [{ min: [0, 0, 0], size: [w - 2 * t, d, t] }], copies: [{ at: [t, 0, 0] }] },
        {
          name: "Lato lungo",
          boxes: [{ min: [0, 0, 0], size: [w - 2 * t, t, h] }],
          copies: [{ at: [t, 0, t], name: "Lato davanti" }, { at: [t, d - t, t], name: "Lato dietro" }],
        },
        {
          name: "Testata",
          boxes: [{ min: [0, 0, 0], size: [t, d, top] }],
          copies: [{ at: [0, 0, 0], name: "Testata sinistra" }, { at: [w - t, 0, 0], name: "Testata destra" }],
        },
        { name: "Manico", boxes: [{ min: [0, 0, 0], size: [w - 2 * t, grip, grip] }], copies: [{ at: [t, (d - grip) / 2, top - grip - 20 * MM] }] },
      ],
      steps: [
        "Taglia i pezzi alle misure della lista di taglio.",
        "Con lo strumento Profili dei bordi arrotonda gli spigoli del manico e delle testate: lo si tiene in mano.",
        "Incolla il fondo e i due lati lunghi tra le testate, formando la cassetta, e controlla gli angoli con la squadra.",
        "Incolla il manico tra le due testate, a metà della larghezza, e tienilo fermo finché la colla è asciutta.",
        "Rinforza gli angoli con due viti per lato, dopo aver fatto i fori con lo strumento Giunzioni.",
      ],
      tip: "Prima di incollare il manico provalo in mano con la cassetta piena: se è troppo in alto o in basso, cambia la misura.",
    };
  },
};

/**
 * Una mensola a muro con due sostegni e un listello per il fissaggio.
 * @type {Project}
 */
const mensola = {
  id: "mensola",
  title: "Mensola",
  about: "Una mensola con il piano, due sostegni sotto e un listello dietro per fissarla al muro.",
  params: [
    { id: "w", label: "Lunghezza", unit: "length", value: 600 * MM, min: 0 },
    { id: "d", label: "Profondità", unit: "length", value: 200 * MM, min: 0 },
    { id: "t", label: "Spessore", unit: "length", value: 18 * MM, min: 0 },
    { id: "hs", label: "Altezza dei sostegni", unit: "length", value: 120 * MM, min: 0 },
    { id: "inset", label: "Distanza dei sostegni dai lati", unit: "length", value: 40 * MM, min: 0 },
  ],
  problem: (p) => {
    if (!(p.t >= 10 * MM)) return "Lo spessore deve essere almeno 10 mm.";
    if (!(p.w > 2 * (p.inset + p.t) + 60 * MM)) return "La mensola è troppo corta per questi sostegni.";
    if (!(p.d > 60 * MM)) return "La profondità deve essere almeno 6 cm.";
    if (!(p.hs >= 80 * MM)) return "I sostegni devono essere alti almeno 8 cm.";
    return null;
  },
  build: (p) => {
    const { w, d, t, hs, inset } = p;
    const strip = 60 * MM;
    return {
      name: "Mensola",
      parts: [
        { name: "Piano", boxes: [{ min: [0, 0, 0], size: [w, d, t] }], copies: [{ at: [0, 0, hs] }] },
        {
          name: "Sostegno",
          boxes: [{ min: [0, 0, 0], size: [t, d, hs] }],
          copies: [{ at: [inset, 0, 0], name: "Sostegno sinistro" }, { at: [w - inset - t, 0, 0], name: "Sostegno destro" }],
        },
        { name: "Listello", boxes: [{ min: [0, 0, 0], size: [w - 2 * (inset + t), t, strip] }], copies: [{ at: [inset + t, d - t, hs - strip] }] },
      ],
      steps: [
        "Taglia i pezzi alle misure della lista di taglio.",
        "Smussa con lo strumento Profili dei bordi gli spigoli davanti del piano.",
        "Incolla il listello tra i due sostegni, dietro e in alto: forma un telaio a U.",
        "Appoggia il piano sopra il telaio, a filo dietro, e fissalo con viti dal basso.",
        "Avvita il listello al muro con tasselli e viti adatte al muro: chiedi aiuto a un adulto per il trapano.",
      ],
      tip: "Una mensola lunga si piega sotto il peso dei libri: oltre 80 cm aggiungi un terzo sostegno al centro.",
    };
  },
};

/**
 * Una libreria con ripiani.
 * @type {Project}
 */
const libreria = {
  id: "libreria",
  title: "Libreria",
  about: "Una libreria con due fianchi, la base, il piano di sopra, i ripiani e lo schienale.",
  params: [
    { id: "w", label: "Larghezza", unit: "length", value: 800 * MM, min: 0 },
    { id: "h", label: "Altezza", unit: "length", value: 1200 * MM, min: 0 },
    { id: "d", label: "Profondità", unit: "length", value: 250 * MM, min: 0 },
    { id: "t", label: "Spessore", unit: "length", value: 18 * MM, min: 0 },
    { id: "n", label: "Ripiani", unit: "count", value: 3, min: 0, max: 12 },
  ],
  problem: (p) => {
    if (!(p.t >= 10 * MM)) return "Lo spessore deve essere almeno 10 mm.";
    if (!(p.w > 6 * p.t)) return "La libreria è troppo stretta per lo spessore scelto.";
    if (!(p.d > 6 * MM + p.t)) return "Non è abbastanza profonda per lo schienale.";
    if (!Number.isInteger(p.n) || p.n < 0 || p.n > 12) return "Ripiani: un numero intero da 0 a 12.";
    if (!(p.h - (2 + p.n) * p.t > 50 * MM)) return `È troppo bassa per ${p.n} ${plural(p.n, "ripiano", "ripiani")}.`;
    return null;
  },
  build: (p) => {
    const { w, h, d, t, n } = p;
    const back = 6 * MM;
    const innerW = w - 2 * t;
    const innerD = d - back;
    const gap = (h - 2 * t - n * t) / (n + 1);
    /** @type {Part[]} */
    const parts = [
      {
        name: "Fianco",
        boxes: [{ min: [0, 0, 0], size: [t, d, h] }],
        copies: [{ at: [0, 0, 0], name: "Fianco sinistro" }, { at: [w - t, 0, 0], name: "Fianco destro" }],
      },
      { name: "Base", boxes: [{ min: [0, 0, 0], size: [innerW, innerD, t] }], copies: [{ at: [t, 0, 0] }] },
      { name: "Piano di sopra", boxes: [{ min: [0, 0, 0], size: [innerW, innerD, t] }], copies: [{ at: [t, 0, h - t] }] },
    ];
    if (n > 0) {
      parts.push({
        name: "Ripiano",
        boxes: [{ min: [0, 0, 0], size: [innerW, innerD, t] }],
        copies: Array.from({ length: n }, (_, i) => ({ at: /** @type {[number, number, number]} */ ([t, 0, t + gap * (i + 1) + t * i]), name: `Ripiano ${i + 1}` })),
      });
    }
    parts.push({ name: "Schienale", boxes: [{ min: [0, 0, 0], size: [innerW, back, h - 2 * t] }], copies: [{ at: [t, d - back, t] }] });
    return {
      name: "Libreria",
      parts,
      steps: [
        "Taglia i pezzi alle misure della lista di taglio.",
        "Segna sui fianchi, a distanze uguali, dove vanno i ripiani, e fai le sedi (scassi) con lo strumento Giunzioni.",
        "Incolla la base e il piano di sopra tra i due fianchi, formando il telaio.",
        "Inserisci i ripiani nelle sedi e incollali.",
        "Controlla le diagonali, poi inchioda lo schienale sul retro: tiene la libreria squadrata.",
      ],
      tip: "I ripiani lunghi si piegano sotto il peso dei libri: oltre 80 cm conviene metterne uno spesso o aggiungere un montante.",
    };
  },
};

/** @type {Project[]} */
export const PROJECTS = [scatola, casetta, sgabello, tavolino, panca, cassetto, cassettaAttrezzi, mensola, libreria];

/** @param {string} id */
export function projectById(id) {
  return PROJECTS.find((p) => p.id === id) ?? PROJECTS[0];
}

/** @param {Project} project @returns {Record<string, number>} */
export function defaultsOf(project) {
  return Object.fromEntries(project.params.map((q) => [q.id, q.value]));
}
