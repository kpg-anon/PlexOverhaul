// Builds plex-overhaul.user.js (and .meta.js) in the repo root from src/.
//
// Order: src/core/*.js (by filename), src/theme/*.css, each src/elements/<name>/
// (style.css then index.js, by folder name), src/main.js.
//
// CSS shorthand `%Component-part` is left in place and resolved at runtime by
// src/core/60-styles.js to Plex's real (hashed) class names.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src");
const outName = "plex-overhaul";

const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const list = (dir, ext) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(ext)).sort() : [];

function cssModule(name, file) {
  return `PXO.addCss(${JSON.stringify(name)}, ${JSON.stringify(read(file))});\n`;
}

function jsModule(label, file) {
  return `// ---- ${label}\n${read(file).trimEnd()}\n`;
}

function build() {
  const pkg = JSON.parse(read(path.join(root, "package.json")));
  const d = new Date();
  const modified = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  const header = read(path.join(src, "header.js"))
    .replace("{{version}}", pkg.version)
    .replace("{{modified}}", modified)
    .trimEnd();

  const parts = [];
  for (const f of list(path.join(src, "core"), ".js")) parts.push(jsModule(`core/${f}`, path.join(src, "core", f)));
  for (const f of list(path.join(src, "theme"), ".css")) parts.push(cssModule(`theme/${f}`, path.join(src, "theme", f)));

  const elDir = path.join(src, "elements");
  for (const name of fs.readdirSync(elDir).sort()) {
    const dir = path.join(elDir, name);
    if (!fs.statSync(dir).isDirectory()) continue;
    if (fs.existsSync(path.join(dir, "style.css"))) parts.push(cssModule(`elements/${name}`, path.join(dir, "style.css")));
    if (fs.existsSync(path.join(dir, "index.js"))) parts.push(jsModule(`elements/${name}`, path.join(dir, "index.js")));
  }
  parts.push(jsModule("main.js", path.join(src, "main.js")));

  const body = parts.join("\n").replace(/\{\{version\}\}/g, pkg.version);
  const out = `${header}\n\n(function () {\n"use strict";\n\n${body}\n})();\n`;

  fs.writeFileSync(path.join(root, `${outName}.user.js`), out);
  fs.writeFileSync(path.join(root, `${outName}.meta.js`), header + "\n");
  console.log(`built ${outName}.user.js ${pkg.version} (${(out.length / 1024).toFixed(1)} KiB)`);
}

build();

if (process.argv.includes("--watch")) {
  let t;
  fs.watch(src, { recursive: true }, () => {
    clearTimeout(t);
    t = setTimeout(() => {
      try { build(); } catch (e) { console.error(e.message); }
    }, 80);
  });
  console.log("watching src/");
}
