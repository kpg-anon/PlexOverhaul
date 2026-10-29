// One MutationObserver for the whole app. By default subscribers run at most
// once per animation frame, after React has finished a batch of DOM changes.
// `{ immediate: true }` subscribers run in the observer callback itself, before
// the browser paints, for changes that must land in the same frame as Plex's
// own render (inserting the hero, starting a row's fade). Those must return
// quickly when there is nothing to do.
PXO.onMutate = (() => {
  const frame = new Set();
  const immediate = new Set();
  let queued = false;
  const call = (fn) => {
    try { fn(); } catch (e) { console.error("[pxo]", e); }
  };
  const run = () => {
    queued = false;
    frame.forEach(call);
  };
  const mo = new MutationObserver(() => {
    immediate.forEach(call);
    if (!queued) {
      queued = true;
      requestAnimationFrame(run);
    }
  });
  PXO.startObserver = () => mo.observe(document.documentElement, { childList: true, subtree: true });
  PXO.onCleanup(() => mo.disconnect());
  return (fn, opts) => {
    const set = opts && opts.immediate ? immediate : frame;
    set.add(fn);
    return () => set.delete(fn);
  };
})();
