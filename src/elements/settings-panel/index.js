// Panel opened from the sliders button in the top bar.
PXO.element({
  name: "settings-panel",
  init() {
    const { h, settings } = PXO;
    let panel = null;

    const accents = [
      { id: "afterglow", name: "Afterglow", stops: ["#ffa66e", "#ff5f8a", "#8d7dff"] },
      { id: "aurora", name: "Aurora", stops: ["#5fe0b4", "#4cc3ff", "#8d7dff"] },
      { id: "ember", name: "Ember", stops: ["#ffc65c", "#ff7a45", "#ff3f6c"] },
      { id: "glacier", name: "Glacier", stops: ["#e6ebf7", "#a8b6d9", "#7f8dff"] },
    ];

    const segmented = (key, options) =>
      h("div.pxo-seg", { role: "radiogroup" },
        ...options.map(([value, label]) =>
          h("button.pxo-seg-btn", {
            type: "button",
            role: "radio",
            "aria-checked": String(settings.get(key) === value),
            onclick: () => { settings.set(key, value); render(); },
          }, label)));

    const toggle = (key, label, hint) =>
      h("label.pxo-toggle", {},
        h("span.pxo-toggle-text", {}, h("b", {}, label), hint ? h("small", {}, hint) : null),
        h("input", { type: "checkbox", checked: settings.get(key), onchange: (e) => settings.set(key, e.target.checked) }),
        h("i.pxo-toggle-track"));

    function render() {
      if (!panel) return;
      panel.replaceChildren(
        h("header.pxo-panel-head", {},
          h("div", {}, h("b", {}, "Overhaul"), h("small", {}, `v${PXO.version}`)),
          h("button.pxo-panel-close", { type: "button", "aria-label": "Close", onclick: close }, PXO.svg(PXO.icons.close, 18))),
        h("section", {},
          h("h3", {}, "Accent"),
          h("div.pxo-swatches", {},
            ...accents.map((a) =>
              h("button.pxo-swatch", {
                type: "button",
                "aria-pressed": String(settings.get("accent") === a.id),
                onclick: () => { settings.set("accent", a.id); render(); },
              },
              h("i", { style: { background: `linear-gradient(115deg, ${a.stops[0]}, ${a.stops[1]} 55%, ${a.stops[2]})` } }),
              a.name)))),
        h("section", {},
          h("h3", {}, "Animations"),
          segmented("motion", [["system", "Follow system"], ["full", "Full"], ["reduced", "Reduced"]])),
        h("section", {},
          h("h3", {}, "Layout"),
          toggle("hero", "Home hero", "Large backdrop with Continue Watching and new items"),
          toggle("heroAutoplay", "Hero autoplay", "Advance every 9 s; pauses while the pointer is over it"),
          toggle("rail", "Icon rail sidebar", "Collapses the sidebar to icons; expands on hover"),
          toggle("ambient", "Backdrops", "Show artwork behind home and details pages"))
      );
    }

    const trigger = () => PXO.$(".pxo-topbar-btn");

    function open() {
      if (panel) return;
      panel = h("div.pxo-panel", { role: "dialog", "aria-label": "Overhaul settings", tabindex: "-1" });
      document.body.append(panel);
      render();
      trigger() && trigger().setAttribute("aria-expanded", "true");
      panel.focus({ preventScroll: true });
      setTimeout(() => document.addEventListener("pointerdown", outside, true));
      document.addEventListener("keydown", onKey, true);
    }

    function close() {
      if (!panel) return;
      const p = panel;
      panel = null;
      p.classList.add("is-closing");
      setTimeout(() => p.remove(), 200);
      const t = trigger();
      if (t) {
        t.setAttribute("aria-expanded", "false");
        if (p.contains(document.activeElement)) t.focus({ preventScroll: true });
      }
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("keydown", onKey, true);
    }

    const outside = (e) => {
      if (panel && !panel.contains(e.target) && !e.target.closest(".pxo-topbar-btn")) close();
    };
    const onKey = (e) => { if (e.key === "Escape") close(); };

    PXO.toggleSettings = () => (panel ? close() : open());

    return () => {
      close();
      delete PXO.toggleSettings;
    };
  },
});
