// Plex class names look like `SourceSidebar-sidebar-hLtTJn`; the suffix changes
// with each Plex Web build, so match on the stable prefix.
PXO.sc = (name) => `[class*="${name}-"]`;
PXO.tid = (id) => `[data-testid="${id}"]`;

PXO.$ = (sel, root = document) => root.querySelector(sel);
PXO.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// h("div.a.b", { onclick, style: {...}, dataset: {...}, ...attrs }, ...children)
PXO.h = (spec, props, ...children) => {
  const [tag, ...classes] = spec.split(".");
  const el = document.createElement(tag || "div");
  if (classes.length) el.className = classes.join(" ");
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k === "dataset") Object.assign(el.dataset, v);
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "html") el.innerHTML = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
};

PXO.svg = (pathD, size = 20) =>
  PXO.h("span.pxo-icon", {
    "aria-hidden": "true",
    html: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${pathD}</svg>`,
  });

PXO.icons = {
  play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
};
