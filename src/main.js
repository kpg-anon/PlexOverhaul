PXO.destroy = () => {
  const html = document.documentElement;
  for (const fn of PXO.cleanups.splice(0).reverse()) {
    try { fn(); } catch (e) { console.error("[pxo]", e); }
  }
  html.classList.remove("pxo");
  for (const k of Object.keys(html.dataset)) if (k.startsWith("pxo")) delete html.dataset[k];
  if (window.__PXO === PXO) delete window.__PXO;
};

// @match *://*/web/index.html* also hits non-Plex sites with that path.
// 383457673 is Plex's App Store id, in Plex Web's static index.html; the title
// is not used because Plex Web rewrites it while playing.
const isPlexWeb = () =>
  !!document.querySelector("#plex.application") &&
  !!document.querySelector('meta[name="apple-itunes-app"][content*="383457673"]');

function start() {
  if (!isPlexWeb()) return PXO.destroy();
  document.documentElement.classList.add("pxo");
  PXO.settings.apply();
  PXO.mountStyles();
  for (const el of PXO.elements) {
    try {
      const cleanup = el.init();
      if (typeof cleanup === "function") PXO.onCleanup(cleanup);
    } catch (e) {
      console.error(`[pxo] ${el.name} failed to start`, e);
    }
  }
  PXO.startObserver();
  PXO.fireRoute();
  PXO.log(`started ${PXO.version}, ${PXO.elements.length} elements`);
}

// @run-at document-start: wait for <body> so the style tag lands after <head>.
if (document.body) start();
else document.addEventListener("DOMContentLoaded", start, { once: true });
