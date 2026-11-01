// @ts-check
// I fogli di montaggio: una pagina riassuntiva (pezzi, legno, passi di montaggio) e una pagina
// per ogni pezzo, con le tre viste in scala (dall'alto, davanti, di lato) e le quote.
import { PAGE_H, PAGE_W, PT_PER_MM, Page, build, textWidth, wrap } from "./pdf.js";

/** @typedef {import("sawhorse").CutRow} Row */
/** @typedef {{ name: string, steps: string[], tip: string, material: string }} Project */

/** Millimetri con al massimo un decimale, virgola decimale. @param {number} metres */
export function mm(metres) {
  const v = Math.round(metres * 1000 * 2) / 2;
  return String(v).replace(".", ",");
}

/** Le scale di disegno che usiamo, dalla più grande: il disegno è `scale` volte il pezzo. */
const SCALES = [10, 5, 2, 1, 1 / 2, 1 / 5, 1 / 10, 1 / 20];

/** @param {number} s */
function scaleLabel(s) {
  return s >= 1 ? `${s}:1` : `1:${Math.round(1 / s)}`;
}

/** I passi di lavorazione di ogni pezzo, per chi comincia. @param {Row} row @returns {string[]} */
function partSteps(row) {
  const grain = row.grain === "length" ? "lungo la lunghezza" : row.grain === "width" ? "lungo la larghezza" : null;
  return [
    `Segna sul legno ${mm(row.length)} mm di lunghezza e ${mm(row.width)} mm di larghezza, con matita e squadra.${grain ? ` Le fibre devono andare ${grain}.` : ""}`,
    "Taglia con il seghetto un po' fuori dalla linea, per non tagliare il pezzo troppo corto.",
    "Pareggia fino alla linea con la raspa o la carta vetrata e controlla gli angoli con la squadra.",
    `Misura lo spessore: deve essere ${mm(row.thickness)} mm. Poi smussa gli spigoli con la carta vetrata.`,
  ];
}

/** @param {Page} page @param {string} title @param {string} sub */
function header(page, title, sub) {
  page.fill(0, PAGE_H - 70, PAGE_W, 70, 0.93);
  page.text(40, PAGE_H - 38, 20, title, true);
  page.text(40, PAGE_H - 58, 10, sub);
  page.text(PAGE_W - 40 - textWidth("3Dschool", 9), PAGE_H - 58, 9, "3Dschool");
}

/**
 * La pagina riassuntiva (e le successive se i pezzi non ci stanno).
 * @param {Row[]} rows @param {Project | null} project @param {string} title
 */
function summary(rows, project, title) {
  /** @type {Page[]} */
  const pages = [];
  let page = new Page();
  header(page, `Foglio di montaggio: ${title}`, project ? `Legno: ${project.material}` : "Elenco dei pezzi");
  pages.push(page);
  let y = PAGE_H - 100;
  const cols = [40, 250, 290, 355, 420, 490];
  const head = ["Pezzo", "Q.tà", "Spessore", "Larghezza", "Lunghezza", "Legno"];
  const heading = () => {
    head.forEach((h, i) => page.text(cols[i], y, 9, h, true));
    page.line(40, y - 4, PAGE_W - 40, y - 4, 0.8);
    y -= 20;
  };
  page.text(40, y, 13, "I pezzi da preparare (misure in mm)", true);
  y -= 24;
  heading();
  for (const r of rows) {
    if (y < 80) {
      page = new Page();
      header(page, `Foglio di montaggio: ${title}`, "Elenco dei pezzi (continua)");
      pages.push(page);
      y = PAGE_H - 100;
      heading();
    }
    const cells = [r.name, String(r.qty), mm(r.thickness), mm(r.width), mm(r.length), r.material ?? "-"];
    cells.forEach((c, i) => page.text(cols[i], y, 10, c.slice(0, i === 0 ? 34 : 14)));
    y -= 16;
  }
  y -= 14;
  const steps = project?.steps ?? [
    "Taglia i pezzi alle misure indicate.",
    "Smussa gli spigoli e carteggia tutte le facce.",
    "Incolla e assembla i pezzi, controllando gli angoli con la squadra.",
  ];
  if (y < 200) {
    page = new Page();
    header(page, `Foglio di montaggio: ${title}`, "Passi di montaggio");
    pages.push(page);
    y = PAGE_H - 100;
  }
  page.text(40, y, 13, "Come si monta", true);
  y -= 22;
  steps.forEach((s, i) => {
    const lines = wrap(s, 88);
    if (y < 60) {
      page = new Page();
      header(page, `Foglio di montaggio: ${title}`, "Passi di montaggio (continua)");
      pages.push(page);
      y = PAGE_H - 100;
    }
    page.text(40, y, 11, `${i + 1}.`, true);
    lines.forEach((l, k) => page.text(60, y - k * 14, 11, l));
    y -= lines.length * 14 + 6;
  });
  if (project?.tip) {
    y -= 8;
    wrap(`Consiglio: ${project.tip}`, 92).forEach((l, k) => page.text(40, y - k * 14, 10, l));
  }
  return pages;
}

/**
 * Una pagina per un pezzo: nome, quantità, sizes, le tre viste in scala e i passi.
 * @param {Row} row @param {string} title @param {number} index @param {number} total
 */
function partPage(row, title, index, total) {
  const page = new Page();
  header(page, row.name, `${title} - pezzo ${index} di ${total}`);
  const L = row.length * 1000;
  const W = row.width * 1000;
  const T = row.thickness * 1000;
  page.text(40, PAGE_H - 100, 12, `Quantità: ${row.qty}     Legno: ${row.material ?? "da scegliere"}`);
  page.text(40, PAGE_H - 118, 12, `Misure finite: ${mm(row.thickness)} x ${mm(row.width)} x ${mm(row.length)} mm (spessore x larghezza x lunghezza)`);
  if (row.shaped) page.text(40, PAGE_H - 134, 10, "Il pezzo ha una forma lavorata: le misure sono quelle del blocco da cui lo ricavi.");

  // Le viste: dall'alto (L x W), davanti (L x T) e di lato (W x T).
  const areaW = PAGE_W - 120;
  const areaH = 330;
  // Larghezza: vista dall'alto + 60 pt + vista di lato. Altezza: dall'alto + 40 pt + davanti.
  const fit = Math.min((areaW - 60) / ((L + W) * PT_PER_MM), (areaH - 52) / ((W + T) * PT_PER_MM));
  const scale = SCALES.find((s) => s <= fit) ?? SCALES[SCALES.length - 1];
  const k = scale * PT_PER_MM;
  const x0 = 60;
  const top = PAGE_H - 170;
  const topH = W * k;
  const frontH = T * k;
  // dall'alto
  page.rect(x0, top - topH, L * k, topH, 1.2);
  page.centered(x0 + (L * k) / 2, top + 6, 9, `${mm(row.length)}`);
  page.text(x0 + L * k + 6, top - topH / 2, 9, `${mm(row.width)}`);
  page.text(x0, top - topH - 12, 8, "dall'alto");
  // davanti
  const fy = top - topH - 40;
  page.rect(x0, fy - frontH, L * k, frontH, 1.2);
  page.text(x0 + L * k + 6, fy - frontH / 2, 9, `${mm(row.thickness)}`);
  page.text(x0, fy - frontH - 12, 8, "davanti");
  // di lato, accanto alla vista davanti
  const sx = x0 + L * k + 60;
  page.rect(sx, fy - frontH, W * k, frontH, 1.2);
  page.centered(sx + (W * k) / 2, fy + 4, 9, `${mm(row.width)}`);
  page.text(sx, fy - frontH - 12, 8, "di lato");
  // la direzione delle fibre sulla vista dall'alto
  if (row.grain !== "none") {
    const along = row.grain === "length";
    for (let i = 1; i <= 3; i++) {
      const f = i / 4;
      if (along) page.line(x0 + 6, top - topH * f, x0 + L * k - 6, top - topH * f, 0.4, true);
      else page.line(x0 + L * k * f, top - 6, x0 + L * k * f, top - topH + 6, 0.4, true);
    }
  }
  page.text(PAGE_W - 40 - textWidth(`Scala ${scaleLabel(scale)}`, 10), top - topH - 12, 10, `Scala ${scaleLabel(scale)}`, true);

  // i passi
  let y = fy - frontH - 60;
  page.text(40, y, 13, "Come lo prepari", true);
  y -= 22;
  partSteps(row).forEach((s, i) => {
    const lines = wrap(s, 88);
    page.text(40, y, 11, `${i + 1}.`, true);
    lines.forEach((l, n) => page.text(60, y - n * 14, 11, l));
    y -= lines.length * 14 + 6;
  });
  return page;
}

/**
 * Il PDF dei fogli di montaggio.
 * @param {Row[]} rows i pezzi della lista di taglio @param {Project | null} project @param {string} title
 */
export function assemblySheets(rows, project, title) {
  const pages = summary(rows, project, title);
  rows.forEach((r, i) => pages.push(partPage(r, title, i + 1, rows.length)));
  return build(pages);
}
