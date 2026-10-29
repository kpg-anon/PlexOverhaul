// A second injection (dev reload, or VM re-running) tears down the first.
if (window.__PXO) {
  try { window.__PXO.destroy(); } catch (e) { console.warn("[pxo] destroy failed", e); }
}

const PXO = {
  version: "{{version}}",
  cssModules: [],
  elements: [],
  cleanups: [],

  addCss(name, css) {
    PXO.cssModules.push({ name, css });
  },

  // Each element file calls this. init() runs once at startup and may return
  // a cleanup function that destroy() calls.
  element(def) {
    PXO.elements.push(def);
  },

  onCleanup(fn) {
    PXO.cleanups.push(fn);
  },

  log(...args) {
    console.debug("[pxo]", ...args);
  },
};

window.__PXO = PXO;
