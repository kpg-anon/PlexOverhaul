// Plex Web is a hash router: #!/, #!/media/<server>/..., #!/server/<id>/details?key=...
PXO.route = () => {
  const hash = location.hash.replace(/^#!?/, "") || "/";
  const [p, q = ""] = hash.split("?");
  const params = new URLSearchParams(q);
  let name = "other";
  if (p === "/" || p === "") name = "home";
  else if (/\/details$/.test(p)) name = "details";
  else if (/^\/media\/[^/]+\/com\.plexapp\.plugins\.library/.test(p)) name = "library";
  else if (/^\/settings/.test(p)) name = "settings";
  else if (/^\/search/.test(p)) name = "search";
  return { name, path: p, params, hash };
};

PXO.onRoute = (() => {
  const listeners = new Set();
  let last = null;
  const fire = () => {
    const r = PXO.route();
    if (r.hash === last) return;
    last = r.hash;
    document.documentElement.dataset.pxoRoute = r.name;
    listeners.forEach((fn) => fn(r));
  };
  window.addEventListener("hashchange", fire);
  window.addEventListener("popstate", fire);
  PXO.onCleanup(() => {
    window.removeEventListener("hashchange", fire);
    window.removeEventListener("popstate", fire);
  });
  PXO.fireRoute = () => { last = null; fire(); };
  return (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  };
})();
