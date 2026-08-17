/*
 * build_docs.js — build the Word (.docx) versions of the field guides from the
 * Markdown in docs/, so the printed and on-screen versions cannot drift apart.
 *
 * The Markdown files are the source of truth. This renders them; it does not
 * hold any content of its own.
 *
 * Requires the `docx` npm package once:
 *
 *   npm install docx
 *   node docs/generators/build_docs.js
 *
 * Re-run after editing any guide in docs/, then commit the updated .docx files.
 */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  LevelFormat, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
} = require('docx');

const DOCS = path.resolve(__dirname, '..');

const INK = '12343F';
const ACCENT = '12657D';
const MUTED = '5B7480';
const RULE = 'D7E1E5';
const PANEL = 'EEF4F6';

const GUIDES = [
  { md: 'INSTALL_GUIDE.md', out: 'MCA_SAMS_Install_Guide.docx' },
  { md: 'INTERVIEWER_GUIDE.md', out: 'MCA_SAMS_Interviewer_Guide.docx' },
  { md: 'SUPERVISOR_GUIDE.md', out: 'MCA_SAMS_Supervisor_Guide.docx' },
];

/* ------------------------------------------------------------ inline text -- */

/**
 * Render inline Markdown — **bold**, *italic*, `code` — into docx TextRuns.
 * Link syntax is flattened to its label; a printed guide cannot be clicked.
 */
function runs(text, base = {}) {
  const out = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      out.push(new TextRun({ text: text.slice(last, match.index), ...base }));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      out.push(new TextRun({ text: token.slice(2, -2), bold: true, ...base }));
    } else if (token.startsWith('`')) {
      out.push(new TextRun({ text: token.slice(1, -1), font: 'Consolas', size: 19, ...base }));
    } else if (token.startsWith('[')) {
      // Keep the label, drop the target and any markup inside the label — a
      // printed guide cannot be clicked.
      const label = token.slice(1, token.indexOf(']')).replace(/[`*]/g, '');
      out.push(new TextRun({ text: label, italics: true, ...base }));
    } else {
      out.push(new TextRun({ text: token.slice(1, -1), italics: true, ...base }));
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  return out.length ? out : [new TextRun({ text: '', ...base })];
}

/* ---------------------------------------------------------------- blocks -- */

const heading = (text, level, size) =>
  new Paragraph({
    heading: level,
    spacing: { before: 260, after: 110 },
    children: [new TextRun({ text, bold: true, color: ACCENT, size })],
  });

const para = (text) =>
  new Paragraph({ spacing: { after: 110 }, children: runs(text) });

const bullet = (text) =>
  new Paragraph({
    numbering: { reference: 'guide-bullets', level: 0 },
    spacing: { after: 50 },
    children: runs(text),
  });

const numbered = (text, reference) =>
  new Paragraph({
    numbering: { reference, level: 0 },
    spacing: { after: 50 },
    children: runs(text),
  });

const checkbox = (text) =>
  new Paragraph({
    spacing: { after: 60 },
    indent: { left: 340 },
    children: [new TextRun({ text: '☐  ', size: 24 }), ...runs(text)],
  });

const quote = (text) =>
  new Paragraph({
    spacing: { before: 120, after: 120 },
    indent: { left: 340 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 12 } },
    children: runs(text, { italics: true }),
  });

const codeLine = (text) =>
  new Paragraph({
    spacing: { after: 0 },
    indent: { left: 340 },
    shading: { type: ShadingType.CLEAR, fill: PANEL },
    children: [new TextRun({ text: text || ' ', font: 'Consolas', size: 18 })],
  });

const rule = () =>
  new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE, space: 6 } },
    children: [new TextRun('')],
  });

function splitRow(line) {
  return line
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim());
}

function table(rows) {
  const [header, ...body] = rows;
  const width = { size: 100, type: WidthType.PERCENTAGE };
  const border = { style: BorderStyle.SINGLE, size: 4, color: RULE };
  const borders = { top: border, bottom: border, left: border, right: border };

  const cell = (text, opts = {}) =>
    new TableCell({
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      shading: opts.head ? { type: ShadingType.CLEAR, fill: PANEL } : undefined,
      children: [
        new Paragraph({
          spacing: { after: 0 },
          children: runs(text, opts.head ? { bold: true, color: INK } : {}),
        }),
      ],
    });

  return new Table({
    width,
    borders,
    rows: [
      new TableRow({ tableHeader: true, children: header.map((t) => cell(t, { head: true })) }),
      ...body.map((row) => new TableRow({ children: row.map((t) => cell(t)) })),
    ],
  });
}

/* ---------------------------------------------------------------- parser -- */

/** Does this line begin a block that must not be swallowed into a paragraph? */
function isBlockStart(line, following) {
  if (/^(#{1,4})\s/.test(line)) return true;
  if (line === '---' || line.startsWith('```')) return true;
  if (line.startsWith('> ')) return true;
  if (/^[-*]\s/.test(line)) return true;
  if (/^\d+\.\s/.test(line)) return true;
  if (line.startsWith('|') && following && /^\|[\s:|-]+\|$/.test(following.trim())) return true;
  return false;
}

function parse(markdown, olRefs) {
  const lines = markdown.split('\n');
  const blocks = [];
  let olIndex = 0;
  let i = 0;
  let lastWasList = false;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; lastWasList = false; continue; }

    // fenced code
    if (trimmed.startsWith('```')) {
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        blocks.push(codeLine(lines[i]));
        i++;
      }
      i++;
      blocks.push(new Paragraph({ spacing: { after: 110 }, children: [new TextRun('')] }));
      continue;
    }

    // table
    if (trimmed.startsWith('|') && lines[i + 1] && /^\|[\s:|-]+\|$/.test(lines[i + 1].trim())) {
      const rows = [splitRow(trimmed)];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i].trim()));
        i++;
      }
      blocks.push(table(rows));
      blocks.push(new Paragraph({ spacing: { after: 140 }, children: [new TextRun('')] }));
      continue;
    }

    if (trimmed === '---') { blocks.push(rule()); i++; continue; }

    const h = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const levels = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4];
      const sizes = [32, 26, 23, 21];
      blocks.push(heading(h[2].replace(/\*\*/g, ''), levels[level - 1], sizes[level - 1]));
      i++;
      lastWasList = false;
      continue;
    }

    if (trimmed.startsWith('> ')) { blocks.push(quote(trimmed.slice(2))); i++; continue; }

    const check = trimmed.match(/^[-*]\s+\[ \]\s+(.*)$/);
    if (check) { blocks.push(checkbox(check[1])); i++; lastWasList = true; continue; }

    const li = trimmed.match(/^[-*]\s+(.*)$/);
    if (li) {
      const parts = [li[1]];
      i++;
      while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i].trim(), lines[i + 1])) {
        parts.push(lines[i].trim());
        i++;
      }
      blocks.push(bullet(parts.join(' ')));
      lastWasList = true;
      continue;
    }

    const ol = trimmed.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      // Each ordered list gets its own reference so numbering restarts at 1.
      if (!lastWasList) olIndex++;
      const parts = [ol[1]];
      i++;
      while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i].trim(), lines[i + 1])) {
        parts.push(lines[i].trim());
        i++;
      }
      blocks.push(numbered(parts.join(' '), olRefs[Math.min(olIndex, olRefs.length - 1)]));
      lastWasList = true;
      continue;
    }

    // Markdown wraps prose across lines; a paragraph runs on until a blank line
    // or the start of another block.
    const parts = [trimmed];
    i++;
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i].trim(), lines[i + 1])) {
      parts.push(lines[i].trim());
      i++;
    }
    blocks.push(para(parts.join(' ')));
    lastWasList = false;
  }

  return blocks;
}

/* ----------------------------------------------------------------- build -- */

const olRefs = Array.from({ length: 40 }, (_, n) => `ol-${n}`);

const numbering = {
  config: [
    {
      reference: 'guide-bullets',
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 460, hanging: 260 } } },
      }],
    },
    ...olRefs.map((reference) => ({
      reference,
      levels: [{
        level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START,
        style: { paragraph: { indent: { left: 460, hanging: 260 } } },
      }],
    })),
  ],
};

async function build({ md, out }) {
  const source = fs.readFileSync(path.join(DOCS, md), 'utf8');

  const doc = new Document({
    numbering,
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22, color: INK } },
      },
    },
    sections: [{
      properties: { page: { margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } },
      children: [
        ...parse(source, olRefs),
        new Paragraph({
          spacing: { before: 400 },
          children: [new TextRun({
            text:
              'Managalas and Oro Province Project (MOPP) — CIFOR-ICRAF, funded by the European Union.',
            italics: true, size: 18, color: MUTED,
          })],
        }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(DOCS, out), buffer);
  console.log(`  ${out.padEnd(36)} ${(buffer.length / 1024).toFixed(0)} KB  from ${md}`);
}

(async () => {
  console.log('Building Word guides from Markdown:');
  for (const guide of GUIDES) await build(guide);
})();
