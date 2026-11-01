// @ts-check
// Un piccolo scrittore di PDF: pagine A4 con testo (Helvetica), rettangoli e linee. Basta per i
// fogli di montaggio; niente immagini, niente compressione.

export const PAGE_W = 595.28;
export const PAGE_H = 841.89;
/** Punti PDF per millimetro. */
export const PT_PER_MM = 72 / 25.4;

/** Il testo come lo vuole il PDF (WinAnsi ~ Latin-1): le lettere fuori da quel gruppo diventano "?". */
function pdfString(/** @type {string} */ s) {
  let out = "";
  for (const ch of s) {
    const c = ch.codePointAt(0) ?? 63;
    const mapped = c === 0x2013 || c === 0x2014 ? "-" : c === 0x2019 || c === 0x2018 ? "'" : c === 0x201c || c === 0x201d ? '"' : ch;
    const code = mapped.codePointAt(0) ?? 63;
    if (code > 255) out += "?";
    else if (mapped === "(" || mapped === ")" || mapped === "\\") out += "\\" + mapped;
    else out += mapped;
  }
  return out;
}

/** Una pagina: raccoglie le istruzioni di disegno. */
export class Page {
  constructor() {
    /** @type {string[]} */
    this.ops = [];
  }

  /** Testo con l'angolo in basso a sinistra in (x, y). @param {number} x @param {number} y @param {number} size @param {string} text @param {boolean} [bold] */
  text(x, y, size, text, bold = false) {
    this.ops.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${pdfString(text)}) Tj ET`);
  }

  /** Testo centrato su x. @param {number} cx @param {number} y @param {number} size @param {string} text @param {boolean} [bold] */
  centered(cx, y, size, text, bold = false) {
    this.text(cx - textWidth(text, size) / 2, y, size, text, bold);
  }

  /** @param {number} x @param {number} y @param {number} w @param {number} h @param {number} [width] */
  rect(x, y, w, h, width = 1) {
    this.ops.push(`${width} w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
  }

  /** @param {number} x @param {number} y @param {number} w @param {number} h @param {number} gray */
  fill(x, y, w, h, gray) {
    this.ops.push(`${gray} g ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f 0 g`);
  }

  /** @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2 @param {number} [width] @param {boolean} [dashed] */
  line(x1, y1, x2, y2, width = 0.5, dashed = false) {
    this.ops.push(`${dashed ? "[3 2] 0 d" : "[] 0 d"} ${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S [] 0 d`);
  }
}

/** Larghezza approssimata del testo in Helvetica, in punti. */
export function textWidth(/** @type {string} */ text, /** @type {number} */ size) {
  return text.length * size * 0.5;
}

/** Va a capo senza spezzare le parole. @param {string} text @param {number} max */
export function wrap(text, max) {
  /** @type {string[]} */
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line && (line + " " + word).length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? line + " " + word : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Costruisce il file PDF. @param {Page[]} pages @returns {Uint8Array} */
export function build(pages) {
  const objs = /** @type {string[]} */ ([]);
  const kids = pages.map((_, i) => `${5 + i * 2} 0 R`).join(" ");
  objs.push("<< /Type /Catalog /Pages 2 0 R >>");
  objs.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  objs.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  objs.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  pages.forEach((p, i) => {
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`);
    const body = p.ops.join("\n");
    objs.push(`<< /Length ${body.length} >>\nstream\n${body}\nendstream`);
  });
  let out = "%PDF-1.4\n";
  const offsets = /** @type {number[]} */ ([]);
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) out += `${String(off).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  // Ogni carattere è un byte (Latin-1).
  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
  return bytes;
}
