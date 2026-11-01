// Italian for the classroom edition. The app's own texts are English and live in about 200
// files, so rather than touching each one this module translates what reaches the page: it looks
// every text node and the title / aria-label / placeholder of every element up by its exact
// English wording, and keeps the original so a switch back to English restores it. A text that
// has no entry stays English, so the interface never shows a blank. A few texts that carry a
// number go through patterns below.

export type Lang = "it" | "en";

const KEY = "school3d_lang";
let current: Lang = "it";
const listeners = new Set<() => void>();

const IT: Record<string, string> = {
  // menus
  File: "File",
  Edit: "Modifica",
  View: "Visualizza",
  Draw: "Disegna",
  Tools: "Strumenti",
  Plugins: "Plugin",
  Window: "Finestra",
  Help: "Aiuto",
  Menu: "Menu",
  "New": "Nuovo",
  "Open…": "Apri…",
  Save: "Salva",
  "Save As…": "Salva con nome…",
  Import: "Importa",
  "Import…": "Importa…",
  "Import image...": "Importa immagine...",
  Export: "Esporta",
  Print: "Stampa",
  "Print Sheets…": "Stampa i fogli…",
  "Restore Unsaved Work": "Recupera il lavoro non salvato",
  Undo: "Annulla",
  Redo: "Ripeti",
  Delete: "Elimina",
  "Select All": "Seleziona tutto",
  "Select None": "Deseleziona",
  "Delete Guides": "Elimina le guide",
  "Delete Imported Meshes": "Elimina le mesh importate",
  "Clear Paint": "Togli il colore",
  "Make Group": "Crea gruppo",
  "Make Component…": "Crea componente…",
  "Make Unique": "Rendi unico",
  Explode: "Scomponi",
  "Explode Curve": "Scomponi la curva",
  Lock: "Blocca",
  "Close Group / Component": "Chiudi gruppo / componente",
  "Settings…": "Impostazioni…",
  "Manage Plugins…": "Gestisci i plugin…",
  "Install from .zip…": "Installa da .zip…",
  "Load from .zip for This Session…": "Carica da .zip per questa sessione…",
  "Load from .zip for this session…": "Carica da .zip per questa sessione…",
  "No plugin commands yet": "Ancora nessun comando dei plugin",
  Panels: "Pannelli",
  "User Guide": "Guida per l'utente",
  "What's New": "Novità",
  "Source on GitHub": "Codice su GitHub",
  "Download the desktop app": "Scarica l'app per il computer",
  "Download the Desktop App": "Scarica l'app per il computer",
  "Developer: console": "Sviluppatore: console",
  // tools
  Select: "Seleziona",
  "Select (Space)": "Seleziona (Spazio)",
  Line: "Linea",
  "Line (L)": "Linea (L)",
  Rect: "Rettangolo",
  "Rect (R)": "Rettangolo (R)",
  Circle: "Cerchio",
  "Circle (C)": "Cerchio (C)",
  Arc: "Arco",
  "Arc (A)": "Arco (A)",
  Push: "Spingi/Tira",
  "Push (P)": "Spingi/Tira (P)",
  Move: "Sposta",
  "Move (M)": "Sposta (M)",
  Rotate: "Ruota",
  "Rotate (Q)": "Ruota (Q)",
  Scale: "Scala",
  "Scale (S)": "Scala (S)",
  Offset: "Offset",
  "Offset (F)": "Offset (F)",
  Follow: "Segui",
  "Follow (W)": "Segui (W)",
  Tape: "Metro",
  "Tape (T)": "Metro (T)",
  Dim: "Quota",
  "Dim (D)": "Quota (D)",
  Paint: "Colora",
  "Paint (B)": "Colora (B)",
  Erase: "Gomma",
  "Erase (E)": "Gomma (E)",
  "Section Plane": "Piano di sezione",
  "Zoom Extents": "Adatta alla vista",
  // views
  Iso: "Iso",
  Top: "Alto",
  Front: "Fronte",
  Right: "Destra",
  Persp: "Prosp.",
  "Iso view": "Vista isometrica",
  "Top view": "Vista dall'alto",
  "Front view": "Vista frontale",
  "Right view": "Vista da destra",
  "Persp view": "Vista prospettica",
  "Isometric view (parallel projection)": "Vista isometrica (proiezione parallela)",
  "Top view, looking down -Z": "Vista dall'alto, guardando lungo -Z",
  "Front view, looking along +Y": "Vista frontale, guardando lungo +Y",
  "Right view, looking along -X": "Vista da destra, guardando lungo -X",
  "Three-quarter perspective view": "Vista prospettica a tre quarti",
  Perspective: "Prospettiva",
  Views: "Viste",
  "3D viewport": "Vista 3D",
  Viewport: "Vista",
  // panels
  Outliner: "Struttura",
  Tags: "Tag",
  "New tag": "Nuovo tag",
  Untagged: "Senza tag",
  Scenes: "Scene",
  Scene: "Scena",
  "Add Scene": "Aggiungi scena",
  "Add a scene from the current view": "Aggiungi una scena dalla vista attuale",
  "Save the current view (camera, hidden tags, open group) as a scene": "Salva la vista attuale (camera, tag nascosti, gruppo aperto) come scena",
  "Save this view (camera, hidden tags, open group) as a scene tab": "Salva questa vista (camera, tag nascosti, gruppo aperto) come scheda scena",
  Materials: "Materiali",
  "Material library": "Libreria dei materiali",
  Library: "Libreria",
  "Library categories": "Categorie della libreria",
  "Search the library": "Cerca nella libreria",
  "Search: oak, ply, blue...": "Cerca: quercia, compensato, blu...",
  "Nothing in the library matches.": "Nessun risultato nella libreria.",
  "No material": "Nessun materiale",
  Styles: "Stili",
  "Style presets": "Stili predefiniti",
  Presets: "Predefiniti",
  Profiles: "Profili",
  Sections: "Sezioni",
  "Section cuts": "Tagli di sezione",
  "Section Cuts": "Tagli di sezione",
  "Section fill": "Riempimento della sezione",
  "Section Fill": "Riempimento della sezione",
  "Section planes": "Piani di sezione",
  "Section Planes": "Piani di sezione",
  Section: "Sezione",
  "Cut list": "Lista di taglio",
  "Model report": "Rapporto del modello",
  Measurements: "Misure",
  Sheets: "Fogli",
  "Sheet goods": "Pannelli",
  Model: "Modello",
  "Model or sheets": "Modello o fogli",
  Layer: "Livello",
  Units: "Unità",
  "Units:": "Unità:",
  "Sizes in": "Misure in",
  "Round sizes to": "Arrotonda le misure a",
  "Round to": "Arrotonda a",
  "Import units": "Unità d'importazione",
  "fractional inches": "pollici frazionari",
  in: "in",
  Day: "Giorno",
  Date: "Data",
  Time: "Ora",
  Month: "Mese",
  Latitude: "Latitudine",
  Jan: "gen",
  Feb: "feb",
  Mar: "mar",
  Apr: "apr",
  May: "mag",
  Jun: "giu",
  Jul: "lug",
  Aug: "ago",
  Sep: "set",
  Oct: "ott",
  Nov: "nov",
  Dec: "dic",
  // styles and look
  "Face style": "Stile delle facce",
  Shaded: "Ombreggiato",
  "Shaded with textures": "Ombreggiato con texture",
  Wireframe: "Wireframe",
  "Hidden line": "Linee nascoste",
  "X-ray": "Raggi X",
  Monochrome: "Monocromatico",
  Clay: "Argilla",
  "Shop drawing": "Disegno di bottega",
  "Glass and metal": "Vetro e metallo",
  Outdoors: "All'aperto",
  Wood: "Legno",
  Edges: "Spigoli",
  Faces: "Facce",
  Labels: "Etichette",
  Background: "Sfondo",
  "Background colour": "Colore dello sfondo",
  "Background on": "Sfondo attivo",
  Sky: "Cielo",
  "Sky colour": "Colore del cielo",
  "Sky on": "Cielo attivo",
  Ground: "Terreno",
  "Ground colour": "Colore del terreno",
  "Ground on": "Terreno attivo",
  "Ground grid": "Griglia sul terreno",
  Grid: "Griglia",
  Shadows: "Ombre",
  "Show shadows": "Mostra le ombre",
  "and shadows": "e ombre",
  Colours: "Colori",
  Smooth: "Liscio",
  Soften: "Ammorbidisci",
  "Soften angle": "Angolo di ammorbidimento",
  "Soften edges": "Ammorbidisci gli spigoli",
  "Soften selected": "Ammorbidisci la selezione",
  "Soft and hidden edges": "Spigoli morbidi e nascosti",
  "Faces turning by at most": "Facce che girano al massimo di",
  "Fill colour": "Colore di riempimento",
  "Fill colour colour": "Colore di riempimento",
  "Fill colour on": "Riempimento attivo",
  "Cut line colour": "Colore della linea di taglio",
  "Cut line colour colour": "Colore della linea di taglio",
  "Cut line colour on": "Linea di taglio attiva",
  "Cut line width": "Spessore della linea di taglio",
  "Panel width": "Larghezza del pannello",
  Light: "Chiaro",
  Dark: "Scuro",
  Value: "Valore",
  Alpha: "Alfa",
  All: "Tutto",
  Off: "No",
  Hide: "Nascondi",
  Pin: "Fissa",
  Dismiss: "Chiudi",
  "Got it": "Capito",
  "Enable…": "Attiva…",
  Installed: "Installati",
  Permissions: "Permessi",
  Extensions: "Estensioni",
  "On Edge": "Sullo spigolo",
  "On Face": "Sulla faccia",
  "On faces": "Sulle facce",
  "On the ground": "Sul terreno",
  Endpoint: "Estremo",
  Endpoints: "Estremi",
  Midpoint: "Punto medio",
  // longer explanations
  "Click an entity. Drag for a window. Double-click a group to edit it.": "Fai clic su un elemento. Trascina per una finestra di selezione. Doppio clic su un gruppo per modificarlo.",
  "Select solids (open a group or component to reach its solids).": "Seleziona i solidi (apri un gruppo o un componente per raggiungerli).",
  "Select.": "Seleziona.",
  "Double-click in the model to edit in place (Esc leaves). Double-click a name to rename. Right-click for Make Group, Make Component, Make Unique, Explode, Lock.":
    "Doppio clic nel modello per modificare sul posto (Esc per uscire). Doppio clic su un nome per rinominarlo. Clic destro per Crea gruppo, Crea componente, Rendi unico, Scomponi, Blocca.",
  "Nothing yet. Draw a shape and push it into a solid; select solids and press Ctrl+G to group them.": "Ancora niente. Disegna una forma e spingila fino a farne un solido; seleziona i solidi e premi Ctrl+G per raggrupparli.",
  "Tags control visibility only. Geometry stays in its group.": "I tag controllano solo la visibilità. La geometria resta nel suo gruppo.",
  "Put the selection on Untagged": "Metti la selezione su «Senza tag»",
  "Take the selection off its tag": "Togli la selezione dal suo tag",
  "Units live in the box below: click the unit chip (or Edit > Units) to switch between millimetres, centimetres, metres, inches and feet-inches.":
    "Le unità sono nella casella sotto: fai clic sull'unità (o Modifica > Unità) per passare tra millimetri, centimetri, metri, pollici e piedi-pollici.",
  "Choose the units lengths are typed and shown in": "Scegli le unità in cui le lunghezze si scrivono e si mostrano",
  "How finished sizes are rounded": "Come si arrotondano le misure finite",
  "Keep this rounding next time (otherwise it lasts for this session)": "Mantieni questo arrotondamento la prossima volta (altrimenti vale per questa sessione)",
  "Finished sizes to the nearest 0.5 mm": "Misure finite al più vicino 0,5 mm",
  "Finished sizes to the nearest 1/16 in": "Misure finite al più vicino 1/16 di pollice",
  "Finished sizes to the nearest 1/32 in": "Misure finite al più vicino 1/32 di pollice",
  "0.5 mm": "0,5 mm",
  "1/16 in": "1/16 in",
  "1/32 in": "1/32 in",
  "Active section planes cut the model": "I piani di sezione attivi tagliano il modello",
  "Draw the section planes themselves": "Disegna i piani di sezione stessi",
  "Cut the model with a plane (no default key)": "Taglia il modello con un piano (nessun tasto predefinito)",
  "Fill the faces a section plane cuts": "Riempi le facce tagliate da un piano di sezione",
  "Drawing sheets: scaled views of the model on paper": "Fogli di disegno: viste in scala del modello su carta",
  "Drawing sheets: scaled views of the model on paper, dimensioned, with a title block": "Fogli di disegno: viste in scala del modello su carta, con quote e cartiglio",
  "Every drawing sheet through the system print dialog, at 100%": "Tutti i fogli di disegno con la finestra di stampa del sistema, al 100%",
  "Hidden line on paper, heavy outlines, pencil overruns.": "Linee nascoste su carta, contorni marcati, matita che sborda.",
  "Material colours without textures, outlines heavier.": "Colori dei materiali senza texture, contorni più marcati.",
  "Materials with textures, plain edges, the theme's background.": "Materiali con texture, spigoli semplici, sfondo del tema.",
  "One colour for every face, outlines and endpoints heavier.": "Un solo colore per ogni faccia, contorni ed estremi più marcati.",
  "Textures under a sky, on the ground, with heavy outlines.": "Texture sotto un cielo, sul terreno, con contorni marcati.",
  "See-through faces: every edge, joinery inside included.": "Facce trasparenti: tutti gli spigoli, comprese le giunzioni all'interno.",
  "Outlines drawn heavier": "Contorni più marcati",
  "The ends of edges drawn heavier": "Estremi degli spigoli più marcati",
  "Edges run a little past their ends": "Gli spigoli sporgono un poco oltre gli estremi",
  "Soft edges are not drawn (a silhouette still is)": "Gli spigoli morbidi non si disegnano (la sagoma sì)",
  "Show soft and hidden edges dashed, so you can see and pick them (the Eraser with Ctrl+Shift unsoftens)": "Mostra a tratti gli spigoli morbidi e nascosti, per vederli e sceglierli (la Gomma con Ctrl+Maiusc li indurisce)",
  "The shading runs across smooth edges, as if the faces were one curved face": "L'ombreggiatura passa sopra gli spigoli lisci, come se le facce fossero una sola faccia curva",
  "The Eraser does it edge by edge: Ctrl softens and smooths, Shift hides, Ctrl+Shift unsoftens.": "La Gomma lavora spigolo per spigolo: Ctrl ammorbidisce e leviga, Maiusc nasconde, Ctrl+Maiusc indurisce.",
  "Every edge of the selected solids whose faces turn by at most this angle is softened and smoothed; every other edge of them goes hard. One undo step.":
    "Ogni spigolo dei solidi selezionati le cui facce girano al massimo di questo angolo viene ammorbidito e levigato; tutti gli altri diventano duri. Un solo passo di annullamento.",
  "The selected circles, arcs, polygons and curves become plain edges, each segment its own again; one undo step": "I cerchi, archi, poligoni e curve selezionati diventano spigoli semplici, ogni segmento di nuovo a sé; un passo di annullamento",
  "Take the paint off what the selection holds, so the group's (or the solid's container's) paint shows; one undo step": "Toglie il colore da ciò che contiene la selezione, così si vede quello del gruppo (o del contenitore del solido); un passo di annullamento",
  "Pick one below, or Alt+click a face with Paint (B).": "Scegline uno qui sotto, oppure Alt+clic su una faccia con Colora (B).",
  "Make a material from a PNG or JPEG": "Crea un materiale da un PNG o JPEG",
  "Show or hide the ground grid (saved with the document and with each scene)": "Mostra o nascondi la griglia sul terreno (salvata con il documento e con ogni scena)",
  "Show the ground grid (View > Grid); saved with the document": "Mostra la griglia sul terreno (Visualizza > Griglia); salvata con il documento",
  "Solar time, north along green. Scenes save the style and the shadows with the camera.": "Ora solare, nord lungo il verde. Le scene salvano stile e ombre insieme alla camera.",
  "Drag to widen or narrow the panel (arrow keys too; double-click for the usual width)": "Trascina per allargare o stringere il pannello (anche con le frecce; doppio clic per la larghezza solita)",
  "x ─ red · y ─ green · z ─ blue": "x ─ rosso · y ─ verde · z ─ blu",
  "Visible only": "Solo visibili",
  "Leave out hidden items, hidden tags and hidden groups": "Escludi elementi, tag e gruppi nascosti",
  "groups and components": "gruppi e componenti",
  "from components": "dai componenti",
  "Imported geometry that is not a solid": "Geometria importata che non è un solido",
  "Working out the cut list…": "Calcolo della lista di taglio…",
  "default · 0 items": "predefinito · 0 elementi",
  // cut list, nesting, reports
  "Nesting ›": "Disposizione ›",
  "Lay the parts out on sheets and boards: cutting diagrams, the cut order, SVG, DXF and a PDF booklet": "Disponi i pezzi su pannelli e tavole: schemi di taglio, ordine di taglio, SVG, DXF e un libretto PDF",
  "A live report of the model: counts, overall size, volume, board feet by material from the cut list, and warnings. Export it as Markdown and CSV.": "Un rapporto aggiornato del modello: conteggi, dimensioni, volume, piedi tavola per materiale dalla lista di taglio e avvisi. Esportalo in Markdown e CSV.",
  "Print the cut list report": "Stampa il rapporto della lista di taglio",
  "Save a sheet of part labels (Avery 5160 size) as a PDF": "Salva un foglio di etichette dei pezzi (formato Avery 5160) in PDF",
  "Save the cut list as a spreadsheet (CSV)": "Salva la lista di taglio come foglio di calcolo (CSV)",
  "Save the cut list report as a PDF": "Salva il rapporto della lista di taglio in PDF",
  "SketchUp, STL, 3MF, glTF, OBJ, DXF or SVG, as one undo step": "SketchUp, STL, 3MF, glTF, OBJ, DXF o SVG, come un solo passo di annullamento",
  CSV: "CSV",
  PDF: "PDF",
  // plugins
  "Cabinet generator": "Generatore di mobili",
  "A frameless cabinet from its sizes: sides, top, bottom, shelves, a back and a toe kick, each a named component, so the cut list reads it straight away.": "Un mobile senza telaio a partire dalle misure: fianchi, piano, fondo, ripiani, schienale e zoccolo, ognuno un componente con nome, così la lista di taglio lo legge subito.",
  "Shelf pin holes": "Fori per i reggipiano",
  "A tool that drills a column of shelf pin holes into a cabinet side: hover a face to see the column, click to drill. Type count, pitch, diameter (8, 32mm, 5mm).": "Uno strumento che fora una colonna di fori per i reggipiano nel fianco di un mobile: passa su una faccia per vedere la colonna, fai clic per forare. Scrivi numero, passo, diametro (8, 32mm, 5mm).",
  "Install a plugin (a .zip of its folder); it is kept for next time": "Installa un plugin (uno .zip della sua cartella); resta per la prossima volta",
  "Run a plugin until this tab closes, without installing it": "Usa un plugin fino alla chiusura della scheda, senza installarlo",
  "Plugins run in their own sandboxes and can do only what they asked for when you enabled them. Writing one: docs/PLUGINS.md.": "I plugin girano in uno spazio protetto e possono fare solo ciò che hanno chiesto quando li hai attivati.",
  "sandboxed, with permissions": "in uno spazio protetto, con permessi",
  "Add to the window: panels in the side panel, commands in the Plugins menu, tools on the rail (they follow the pointer, but see nothing of the model without \"Read the model\"), messages and questions":
    "Aggiungere alla finestra: pannelli nel pannello laterale, comandi nel menu Plugin, strumenti nella barra (seguono il puntatore, ma non vedono il modello senza «Leggere il modello»), messaggi e domande",
  "Change the model: every change is one named undo step, checked by the kernel like your own edits": "Modificare il modello: ogni modifica è un passo di annullamento con nome, controllato dal nucleo come le tue modifiche",
  "Read the model: solids, groups and components, faces, materials, the cut list and the selection, and change the selection; also what is under the pointer while its tools are in use":
    "Leggere il modello: solidi, gruppi e componenti, facce, materiali, lista di taglio e selezione, e cambiare la selezione; anche ciò che sta sotto il puntatore mentre i suoi strumenti sono in uso",
  "Keep settings: a small store of its own, for this app and inside the documents you save": "Conservare le impostazioni: un piccolo archivio suo, per questa app e dentro i documenti che salvi",
  "Save and open files: only through the save and open dialogs, where you pick the file (a browser without a save dialog asks you before each download); never programs or scripts":
    "Salvare e aprire file: solo con le finestre di salvataggio e apertura, dove scegli tu il file (un browser senza finestra di salvataggio chiede prima di ogni download); mai programmi o script",
  "The render service (renders are off until one is set and answering)": "Il servizio di rendering (i rendering sono spenti finché non ne è impostato uno che risponde)",
  // status and misc
  Selection: "Selezione",
  "Where the units are": "Dove sono le unità",
  "Nothing is uploaded.": "Non viene caricato nulla.",
  "Runs in your browser, nothing is uploaded.": "Funziona nel tuo browser, non viene caricato nulla.",
  "About this demo": "Informazioni su questa demo",
  Sawhorse: "3Dschool",
  "Untitled - Sawhorse": "Senza titolo - 3Dschool",
  Untitled: "Senza titolo",
  "Windows, macOS and Linux installers on GitHub": "Programmi di installazione per Windows, macOS e Linux su GitHub",
  "· Sawhorse · MIT": "· 3Dschool · MIT",
  "The 3D model": "Il modello 3D",
};

/** Texts with a number or a name in them. */
const PATTERNS: Array<[RegExp, (m: RegExpExecArray) => string]> = [
  [/^Units: fractional in$/, () => "Unità: pollici frazionari"],
  [/^Units: fractional inches\. Click to change\.$/, () => "Unità: pollici frazionari. Fai clic per cambiarle."],
  [/^Units: (.+)\. Click to change\.$/, (m) => `Unità: ${m[1]}. Fai clic per cambiarle.`],
  [/^Edit: (.+) · undo (\d+) · redo (\d+)$/, (m) => `Modifica: ${m[1] === "Model" ? "Modello" : m[1]} · annulla ${m[2]} · ripeti ${m[3]}`],
  [/^Sketch: (\d+) regions? · draw with Rect \(R\)$/, (m) => `Schizzo: ${m[1]} regioni · disegna con Rettangolo (R)`],
  [/^(\d+) solids?$/, (m) => `${m[1]} solidi`],
  [/^Section (\d+)$/, (m) => `Sezione ${m[1]}`],
  [/^Scene (\d+)$/, (m) => `Scena ${m[1]}`],
];

const originals = new WeakMap<Text, { orig: string; shown: string }>();

export function lang(): Lang {
  return current;
}

export function onLangChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** The text in the current language (English when it has no translation). */
export function tr(text: string): string {
  if (current !== "it") return text;
  const lead = text.match(/^\s*/)?.[0] ?? "";
  const trail = text.match(/\s*$/)?.[0] ?? "";
  const core = text.trim();
  if (!core) return text;
  const hit = IT[core];
  if (hit !== undefined) return lead + hit + trail;
  for (const [re, fn] of PATTERNS) {
    const m = re.exec(core);
    if (m) return lead + fn(m) + trail;
  }
  return text;
}

const ATTRS = ["title", "aria-label", "placeholder"] as const;
const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE"]);

function textNode(n: Text): void {
  const parent = n.parentElement;
  if (!parent || SKIP.has(parent.tagName) || parent.closest("[data-no-i18n]")) return;
  const seen = originals.get(n);
  const value = n.nodeValue ?? "";
  // Our own write coming back as a mutation: nothing to do.
  if (seen && value === seen.shown) return;
  if (current === "it") {
    const shown = tr(value);
    originals.set(n, { orig: value, shown });
    if (shown !== value) n.nodeValue = shown;
  } else {
    originals.delete(n);
  }
}

function element(e: Element): void {
  if (e.closest("[data-no-i18n]")) return;
  for (const a of ATTRS) {
    const v = e.getAttribute(a);
    if (v === null) continue;
    const key = `data-i18n-${a}`;
    const orig = e.getAttribute(key);
    if (current === "it") {
      // A value we wrote ourselves is left alone; anything else is the app's new English.
      if (orig !== null && e.getAttribute(`${key}-shown`) === v) continue;
      const shown = tr(v);
      e.setAttribute(key, v);
      e.setAttribute(`${key}-shown`, shown);
      if (shown !== v) e.setAttribute(a, shown);
    } else if (orig !== null) {
      e.setAttribute(a, orig);
      e.removeAttribute(key);
      e.removeAttribute(`${key}-shown`);
    }
  }
}

function walk(root: Node): void {
  if (root.nodeType === Node.TEXT_NODE) {
    textNode(root as Text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  element(el);
  const w = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let n: Node | null = w.nextNode();
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) textNode(n as Text);
    else element(n as Element);
    n = w.nextNode();
  }
}

function restoreEnglish(): void {
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let n: Node | null = w.nextNode();
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) {
      const t = n as Text;
      const seen = originals.get(t);
      if (seen && t.nodeValue === seen.shown) t.nodeValue = seen.orig;
      originals.delete(t);
    } else {
      element(n as Element);
    }
    n = w.nextNode();
  }
}

let started = false;

/** Start translating the page and keep doing it as the app changes it. */
export function startTranslating(): void {
  if (started) return;
  started = true;
  try {
    const kept = localStorage.getItem(KEY);
    const asked = new URLSearchParams(location.search).get("lang");
    current = asked === "en" || asked === "it" ? asked : kept === "en" ? "en" : "it";
  } catch {
    current = "it";
  }
  const obs = new MutationObserver((records) => {
    obs.disconnect();
    try {
      for (const r of records) {
        if (r.type === "characterData") textNode(r.target as Text);
        else if (r.type === "attributes") element(r.target as Element);
        else r.addedNodes.forEach((n) => walk(n));
      }
    } finally {
      obs.observe(document.body, OBSERVE);
    }
  });
  const OBSERVE: MutationObserverInit = { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] };
  walk(document.body);
  obs.observe(document.body, OBSERVE);
  document.documentElement.lang = current;
  document.title = tr(document.title);
}

export function setLang(next: Lang): void {
  if (next === current) return;
  current = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* per-browser convenience */
  }
  document.documentElement.lang = next;
  if (next === "en") restoreEnglish();
  else walk(document.body);
  listeners.forEach((fn) => fn());
}
