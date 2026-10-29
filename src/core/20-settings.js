PXO.settings = (() => {
  const KEY = "pxo.settings";
  const defaults = {
    accent: "afterglow", // afterglow | aurora | ember | glacier
    motion: "system", // system | full | reduced
    hero: true,
    heroAutoplay: false,
    rail: true, // icon rail sidebar instead of Plex's 260px sidebar
    ambient: true, // tint the page with the current hero/item backdrop
  };
  let values = { ...defaults };
  try {
    Object.assign(values, JSON.parse(localStorage.getItem(KEY) || "{}"));
  } catch (e) {}
  const listeners = new Set();
  const mq = matchMedia("(prefers-reduced-motion: reduce)");

  // Stops Plex's own animations while reduced motion is on. It is a separate
  // element, present only then, because its universal selectors would
  // otherwise be matched against every element on every style recalc.
  const reduceStyle = PXO.h("style", { id: "pxo-reduce-motion" });
  reduceStyle.textContent =
    "*, *::before, *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition-duration: 1ms !important; }";
  PXO.onCleanup(() => reduceStyle.remove());

  function apply() {
    const html = document.documentElement;
    html.dataset.pxoAccent = values.accent;
    html.dataset.pxoRail = values.rail ? "1" : "0";
    html.dataset.pxoAmbient = values.ambient ? "1" : "0";
    const reduce = values.motion === "reduced" || (values.motion === "system" && mq.matches);
    html.dataset.pxoReduce = reduce ? "1" : "0";
    if (reduce && !reduceStyle.isConnected) html.append(reduceStyle);
    else if (!reduce) reduceStyle.remove();
  }

  const onMq = () => apply();
  mq.addEventListener("change", onMq);
  PXO.onCleanup(() => mq.removeEventListener("change", onMq));

  return {
    defaults,
    apply,
    get: (k) => values[k],
    all: () => ({ ...values }),
    set(k, v) {
      values[k] = v;
      try { localStorage.setItem(KEY, JSON.stringify(values)); } catch (e) {}
      apply();
      listeners.forEach((fn) => fn(k, v));
    },
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    reducedMotion: () => document.documentElement.dataset.pxoReduce === "1",
  };
})();
