// Hovering a link to a details page for 120ms fetches and decodes that item's
// backdrop art, so it is ready when the page opens.
PXO.element({
  name: "prefetch",
  init() {
    let timer = 0;
    let pending = null;

    const onOver = (e) => {
      const a = e.target instanceof Element && e.target.closest('a[href*="/details?key="]');
      if (!a || a === pending) return;
      clearTimeout(timer);
      pending = a;
      const key = PXO.art.keyFromHref(a.getAttribute("href"));
      if (key) timer = setTimeout(() => PXO.art.prefetch(key), 120);
    };
    const onOut = (e) => {
      if (pending && !pending.contains(e.relatedTarget)) {
        clearTimeout(timer);
        pending = null;
      }
    };

    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });
    return () => {
      clearTimeout(timer);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
    };
  },
});
