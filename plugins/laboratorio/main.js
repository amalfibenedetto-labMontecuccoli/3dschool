// @ts-check
// Laboratorio: progetti guidati, giunzioni semplici, profili dei bordi e fogli di montaggio,
// pensato per le lezioni di tecnologia. Ispirato a WoodSketch (https://github.com/FMastro/woodsketch),
// riscritto qui per il sistema dei plugin.
import { file, model, storage, ui, units } from "sawhorse";
import { PROFILES, edgePlan } from "./lib/edges.js";
import { KINDS, faceInfo, plan } from "./lib/joints.js";
import { assemblySheets } from "./lib/sheets.js";
import { MATERIALS, PROJECTS, defaultsOf, projectById } from "./lib/projects.js";

/** Lo stato del pannello dei progetti. */
const state = { project: PROJECTS[0].id, material: MATERIALS[0].name, values: defaultsOf(PROJECTS[0]) };

/** @returns {import("sawhorse").Field[]} */
function projectBody() {
  const project = projectById(state.project);
  return [
    { type: "select", id: "progetto", label: "Progetto", value: project.id, options: PROJECTS.map((p) => ({ value: p.id, label: p.title })) },
    { type: "note", id: "about", text: project.about, tone: "info" },
    ...project.params.map((q) => /** @type {import("sawhorse").Field} */ ({ type: "number", id: q.id, label: q.label, unit: q.unit, value: state.values[q.id], min: q.min, max: q.max })),
    { type: "select", id: "materiale", label: "Legno", value: state.material, options: MATERIALS.map((m) => ({ value: m.name, label: m.name })) },
    { type: "button", id: "crea", label: "Crea il progetto", primary: true },
    { type: "note", id: "stato", text: "" },
  ];
}

const projectPanel = await ui.registerPanel({
  id: "progetti",
  title: "Progetti guidati",
  body: projectBody(),
  onChange: async (id, values) => {
    if (id === "progetto") {
      state.project = String(values.progetto);
      state.values = defaultsOf(projectById(state.project));
      await projectPanel.setBody(projectBody());
    } else if (id === "materiale") {
      state.material = String(values.materiale);
    } else if (typeof values[id] === "number") {
      state.values[id] = /** @type {number} */ (values[id]);
    }
    await explain();
  },
  onAction: async (id) => {
    if (id === "crea") await createProject();
  },
});

/** Dice nel pannello se le misure vanno bene e cosa verrà creato. */
async function explain() {
  const project = projectById(state.project);
  const wrong = project.problem(state.values);
  const count = wrong ? 0 : project.build(state.values).parts.reduce((n, p) => n + p.copies.length, 0);
  await projectPanel.update({
    fields: {
      crea: { disabled: !!wrong },
      stato: wrong ? { text: wrong, tone: "warning" } : { text: `Crea ${project.title.toLowerCase()}: ${count} pezzi, nella lista di taglio.`, tone: "info" },
    },
  });
}

async function createProject() {
  const project = projectById(state.project);
  const wrong = project.problem(state.values);
  if (wrong) {
    await ui.notify(wrong, { kind: "warning" });
    return;
  }
  const built = project.build(state.values);
  const f = units.format;
  const label = `${built.name} (${project.params
    .slice(0, 3)
    .map((q) => f(state.values[q.id]))
    .join(" x ")})`;
  const batch = model.batch(`Progetto: ${built.name}`);
  // I materiali della scuola, quelli che non ci sono ancora.
  const known = new Set((await model.materials()).map((m) => m.name));
  for (const m of MATERIALS) if (!known.has(m.name)) batch.defineMaterial(m.name, m.color);
  /** @type {import("sawhorse").Vec3} */
  let at = [0, 0, 0];
  const box = await model.bounds();
  if (box) at = [box.max[0] + 0.1, box.min[1], 0];
  const comp = batch.component({
    name: label,
    instanceName: built.name,
    at,
    parts: built.parts.map((p) => ({ ...p, material: state.material })),
  });
  try {
    const result = await batch.commit();
    const id = /** @type {number} */ (result.value(comp.node));
    await storage.document.set("progetto", { id, name: built.name, projectId: project.id, steps: built.steps, tip: built.tip, material: state.material });
    await model.select([{ kind: "instance", id }]);
    await ui.notify(`Creato: ${built.name}. I pezzi sono nella lista di taglio; i passi di montaggio sono nel foglio di montaggio.`);
  } catch (e) {
    await ui.notify(`Non sono riuscito a creare il progetto: ${e instanceof Error ? e.message : String(e)}`, { kind: "error" });
  }
}

await ui.registerCommand({ id: "crea-progetto", run: createProject });
await explain();

// ---- I fogli di montaggio ---------------------------------------------------------------

const sheetsPanel = await ui.registerPanel({
  id: "fogli",
  title: "Fogli di montaggio",
  body: [
    { type: "note", id: "info", text: "Crea un PDF con l'elenco dei pezzi, i passi di montaggio e una pagina per ogni pezzo, con le tre viste in scala.", tone: "info" },
    { type: "button", id: "pdf", label: "Crea il PDF", primary: true },
    { type: "note", id: "esito", text: "" },
  ],
  onAction: async (id) => {
    if (id === "pdf") await makeSheets();
  },
});

async function makeSheets() {
  const list = await model.cutList({ rounding: "half_mm" });
  if (list.rows.length === 0) {
    await ui.notify("Non ci sono pezzi: crea un progetto guidato o disegna dei componenti.", { kind: "warning" });
    return;
  }
  const kept = /** @type {{ name: string, steps: string[], tip: string, material: string } | null} */ (await storage.document.get("progetto"));
  const doc = await model.document();
  const title = kept?.name ?? (doc.name && doc.name !== "Untitled" ? doc.name : "Progetto");
  try {
    const bytes = assemblySheets(list.rows, kept, title);
    const saved = await file.save({ name: `Foglio di montaggio - ${title}.pdf`, data: bytes, mime: "application/pdf", description: "PDF" });
    await sheetsPanel.update({ fields: { esito: { text: saved ? `Salvato: ${saved.name}` : "Annullato.", tone: "info" } } });
  } catch (e) {
    await ui.notify(`Non sono riuscito a creare il PDF: ${e instanceof Error ? e.message : String(e)}`, { kind: "error" });
  }
}

await ui.registerCommand({ id: "fogli-pdf", run: makeSheets });


// ---- Le giunzioni ------------------------------------------------------------------------

const MM = 0.001;
/** Le misure di partenza di ogni giunzione (metri). @type {Record<string, { width: number, depth: number }>} */
const JOINT_DEFAULTS = { scasso: { width: 18 * MM, depth: 6 * MM }, battuta: { width: 10 * MM, depth: 5 * MM }, foro: { width: 8 * MM, depth: 20 * MM } };
const joint = { kind: "scasso", ...JOINT_DEFAULTS.scasso };

/** @returns {import("sawhorse").Field[]} */
function jointBody() {
  const isHole = joint.kind === "foro";
  return [
    { type: "select", id: "tipo", label: "Giunzione", value: joint.kind, options: KINDS.map((k) => ({ value: k.value, label: k.label })) },
    { type: "number", id: "larghezza", label: isHole ? "Diametro" : "Larghezza", unit: "length", value: joint.width, min: 0 },
    { type: "number", id: "profondita", label: "Profondità (0 = passante)", unit: "length", value: joint.depth, min: 0 },
    { type: "note", id: "come", text: "1. Fai doppio clic sul pezzo per aprirlo. 2. Attiva lo strumento. 3. Clicca sulla faccia, nel punto dove vuoi il taglio (per la battuta, vicino al bordo).", tone: "info" },
    { type: "button", id: "attiva", label: "Attiva lo strumento Giunzione", primary: true },
  ];
}

const jointPanel = await ui.registerPanel({
  id: "giunzioni",
  title: "Giunzioni",
  body: jointBody(),
  onChange: async (id, values) => {
    if (id === "tipo") {
      joint.kind = String(values.tipo);
      Object.assign(joint, JOINT_DEFAULTS[joint.kind] ?? JOINT_DEFAULTS.scasso);
      await jointPanel.setBody(jointBody());
    } else if (id === "larghezza" && typeof values.larghezza === "number") joint.width = values.larghezza;
    else if (id === "profondita" && typeof values.profondita === "number") joint.depth = values.profondita;
  },
  onAction: async (id) => {
    if (id === "attiva") await ui.activateTool("giunzione");
  },
});

/** @type {{ key: string, info: import("./lib/joints.js").FaceInfo | string, editable: boolean } | null} */
let faceCache = null;

/** I dati di una faccia, ricordati finché il puntatore resta sulla stessa. @param {number} solid @param {number} face */
async function faceData(solid, face) {
  const key = `${solid}:${face}`;
  if (faceCache?.key === key) return faceCache;
  const one = await model.solid(solid);
  const faces = await model.faces(solid);
  const f = faces.find((x) => x.id === face);
  if (!one || !f) return null;
  faceCache = { key, info: faceInfo(solid, face, { min: one.min, max: one.max }, { normal: f.normal, origin: f.origin }), editable: one.editable };
  return faceCache;
}

await ui.registerTool({
  id: "giunzione",
  onActivate: async (tool) => {
    await tool.setView({ status: "Giunzione: passa su una faccia del pezzo e clicca." });
  },
  onDeactivate: () => {
    faceCache = null;
  },
  async onEvent(e, tool) {
    if (e.type === "leave") {
      await tool.setView({ overlay: [], labels: [] });
      return;
    }
    const surf = e.snap?.surface;
    if (!surf || surf.at.kind !== "face") {
      await tool.setView({ overlay: [], labels: [], status: "Giunzione: passa su una faccia del pezzo e clicca." });
      return;
    }
    const data = await faceData(surf.at.solid, surf.at.face);
    if (!data) return;
    if (typeof data.info === "string") {
      await tool.setView({ overlay: [], labels: [], status: data.info });
      return;
    }
    const made = plan(/** @type {import("./lib/joints.js").Kind} */ (joint.kind), data.info, surf.point, joint);
    if (typeof made === "string") {
      await tool.setView({ overlay: [], labels: [], status: made });
      return;
    }
    await tool.setView({
      overlay: [{ kind: "loop", points: made.points, color: data.editable ? "preview" : "warning" }],
      status: data.editable ? `Clic per fare: ${made.note} (${units.format(joint.width)} x ${joint.depth > 0 ? units.format(joint.depth) : "passante"}).` : "Fai doppio clic sul pezzo per aprirlo, poi riprova.",
      value: `${units.format(joint.width)}, ${joint.depth > 0 ? units.format(joint.depth) : "0"}`,
    });
    if (e.type !== "click") return;
    if (!data.editable) {
      await ui.notify("Il pezzo è chiuso dentro un componente: fai doppio clic su di lui per aprirlo, poi riprova.", { kind: "warning" });
      return;
    }
    const batch = model.batch(`Giunzione: ${made.note}`);
    const drawn = batch.op({ op: "draw", target: { on: "face", object: data.info.solid, face: data.info.face }, points: made.points, closed: true, ...(made.centre ? { curve: { kind: "circle", centre: made.centre } } : {}) });
    batch.op({ op: "push_pull", object: data.info.solid, face: drawn.face, distance: -made.depth });
    try {
      await batch.commit();
      faceCache = null;
      await ui.notify(`Fatto: ${made.note}.`);
    } catch (err) {
      await ui.notify(`Non sono riuscito a fare il taglio: ${err instanceof Error ? err.message : String(err)}`, { kind: "error" });
    }
  },
  async onValue(text, tool) {
    // "larghezza, profondità": per esempio "20mm, 8mm".
    const [w, d] = text.split(",").map((x) => units.parse(x.trim()));
    if (typeof w === "number" && w > 0) joint.width = w;
    if (typeof d === "number" && d >= 0) joint.depth = d;
    await jointPanel.update({ values: { larghezza: joint.width, profondita: joint.depth } });
    await tool.setView({ status: `Misure: ${units.format(joint.width)} x ${joint.depth > 0 ? units.format(joint.depth) : "passante"}.` });
  },
});

// ---- I profili dei bordi -----------------------------------------------------------------

const profile = { kind: "smusso", size: 3 * MM };

const edgePanel = await ui.registerPanel({
  id: "bordi",
  title: "Profili dei bordi",
  body: [
    { type: "select", id: "profilo", label: "Profilo", value: profile.kind, options: PROFILES.map((x) => ({ value: x.value, label: x.label })) },
    { type: "number", id: "misura", label: "Misura (lato o raggio)", unit: "length", value: profile.size, min: 0 },
    { type: "note", id: "come", text: "1. Fai doppio clic sul pezzo per aprirlo. 2. Con lo strumento Seleziona clicca uno o più spigoli. 3. Premi il pulsante.", tone: "info" },
    { type: "button", id: "applica", label: "Applica agli spigoli selezionati", primary: true },
    { type: "note", id: "esito", text: "" },
  ],
  onChange: (id, values) => {
    if (id === "profilo") profile.kind = String(values.profilo);
    else if (id === "misura" && typeof values.misura === "number") profile.size = values.misura;
  },
  onAction: async (id) => {
    if (id === "applica") await applyProfile();
  },
});

async function applyProfile() {
  const edges = (await model.selection()).filter((x) => x.kind === "edge" && x.owner.kind === "solid");
  if (edges.length === 0) {
    await ui.notify("Seleziona prima uno o più spigoli del pezzo (clicca sullo spigolo con lo strumento Seleziona).", { kind: "warning" });
    return;
  }
  const batch = model.batch(`Profilo: ${profile.kind}`);
  let count = 0;
  for (const it of edges.slice(0, 12)) {
    if (it.kind !== "edge") continue;
    const solid = await model.solid(it.owner.id);
    if (!solid) continue;
    if (!solid.editable) {
      await ui.notify("Il pezzo è chiuso dentro un componente: fai doppio clic su di lui per aprirlo, poi riprova.", { kind: "warning" });
      return;
    }
    const faces = await model.faces(it.owner.id);
    const made = edgePlan(/** @type {"smusso" | "arrotondato"} */ (profile.kind), profile.size, { a: it.a, b: it.b }, { min: solid.min, max: solid.max }, faces);
    if (typeof made === "string") {
      await ui.notify(made, { kind: "warning" });
      return;
    }
    const drawn = batch.op({ op: "draw", target: { on: "face", object: it.owner.id, face: made.face }, points: made.points, closed: true });
    batch.op({ op: "push_pull", object: it.owner.id, face: drawn.face, distance: -made.length });
    count++;
  }
  try {
    await batch.commit();
    await edgePanel.update({ fields: { esito: { text: `Fatto: ${profile.kind} su ${count} ${count === 1 ? "spigolo" : "spigoli"}.`, tone: "info" } } });
  } catch (e) {
    await ui.notify(`Non sono riuscito a fare il profilo: ${e instanceof Error ? e.message : String(e)}`, { kind: "error" });
  }
}

await ui.registerCommand({ id: "profilo-bordi", run: applyProfile });
