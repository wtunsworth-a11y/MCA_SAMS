/*
 * build.js — produce a single self-contained HTML file from the modular source.
 *
 * Output: dist/MCA_SAMS_Survey.html — one file with all CSS and JS inlined, so
 * it can be emailed and opened straight from a phone browser with no web server
 * and no separate files.
 *
 * Usage:  node build.js
 * Re-run this whenever you edit anything in js/ or css/.
 *
 * The hosted build (index.html) loads js/ as ES modules. A module script cannot
 * run from a file:// page, so this build strips the import/export keywords and
 * concatenates the modules in dependency order into one classic script.
 */
const fs = require('fs');
const path = require('path');

const read = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');

// Dependency order: config and data first, then the layers that use them.
const MODULES = [
  'js/config.js',
  'js/questions.js',
  'js/photo-subjects.js',
  'js/zip.js',
  'js/storage.js',
  'js/photos.js',
  'js/export.js',
  'js/app.js',
];

/**
 * The viewer of a single file may be in either colour scheme, and some hosts
 * stamp an explicit choice on the root element. Mirror the dark tokens onto
 * [data-theme="dark"] and guard the media query so an explicit light choice
 * still wins.
 */
function themeAware(css) {
  const match = css.match(
    /@media \(prefers-color-scheme: dark\) \{\n  :root \{\n([\s\S]*?)\n  \}\n\}/
  );
  if (!match) return css;

  const tokens = match[1];
  const dedented = tokens
    .split('\n')
    .map((line) => (line.startsWith('    ') ? line.slice(2) : line))
    .join('\n');

  return (
    css.slice(0, match.index) +
    '@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n' +
    tokens +
    '\n  }\n}\n\n:root[data-theme="dark"] {\n' +
    dedented +
    '\n}\n' +
    css.slice(match.index + match[0].length)
  );
}

/** Strip module syntax so the file runs as one classic script. */
function flatten(source, file) {
  let out = source
    .replace(/^import .*?;\n/gm, '')
    .replace(/^export (const|let|function|async function|class)/gm, '$1');

  if (file === 'js/app.js') {
    // app.js reaches the storage layer through a namespace import; with the
    // modules concatenated, those functions are already in scope.
    out = out.replace(/\bstore\.(\w+)/g, '$1');
  }
  return `/* ==== ${file} ==== */\n${out.trim()}`;
}

const css = themeAware(read('css/styles.css'));
const js = MODULES.map((file) => flatten(read(file), file)).join('\n\n');

const icon = read('icons/icon.svg');
const iconDataUri = 'data:image/svg+xml;base64,' + Buffer.from(icon).toString('base64');

const html = `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#12343f">
  <title>Managalas Mining Survey</title>
  <link rel="icon" href="${iconDataUri}" type="image/svg+xml">
  <link rel="apple-touch-icon" href="${iconDataUri}">
  <style>
${css}
  </style>
</head>
<body>
  <main id="app" aria-live="polite">
    <p class="empty">Loading…</p>
  </main>
  <noscript><p class="empty">This survey tool needs JavaScript enabled.</p></noscript>
  <script>
${js}
  </script>
</body>
</html>
`;

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
const out = path.join(__dirname, 'dist', 'MCA_SAMS_Survey.html');
fs.writeFileSync(out, html);

const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`Wrote dist/MCA_SAMS_Survey.html (${kb} KB) from ${MODULES.length} modules.`);
