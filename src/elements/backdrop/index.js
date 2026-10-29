// A full-window backdrop layer inside Plex's FullPageBackground container.
// Other elements call PXO.backdrop.show(url, colors) / PXO.backdrop.clear().
// Two stacked <img> layers crossfade with opacity only; a new image is decoded
// (PXO.art.decode) before it is shown.
PXO.element({
  name: "backdrop",
  init() {
    const html = document.documentElement;
    const root = PXO.h("div.pxo-backdrop", { "aria-hidden": "true" });
    const layers = [PXO.h("div.pxo-backdrop-layer"), PXO.h("div.pxo-backdrop-layer")];
    const tint = PXO.h("div.pxo-backdrop-tint");
    // Darkens the art as the home page scrolls (hero/index.js); opacity only.
    const shade = PXO.h("div.pxo-backdrop-shade");
    root.append(...layers, tint, shade);
    let front = 0;
    let current = "";
    let shadeValue = 0;

    const ensure = () => {
      if (root.isConnected) return;
      const host = PXO.$(PXO.sc("FullPageBackground-backgroundContainer"));
      if (host) host.append(root);
    };

    const setActive = (on) => {
      root.classList.toggle("is-active", on);
      if (on) html.dataset.pxoArt = "1";
      else delete html.dataset.pxoArt;
    };

    PXO.backdrop = {
      show(url, colors) {
        // With Backdrops off the layer is hidden; skip the fetch and decode.
        if (!url || url === current || !PXO.settings.get("ambient")) return;
        current = url;
        PXO.art.decode(url).then((img) => {
          if (current !== url) return;
          front = 1 - front;
          layers[front].replaceChildren(img);
          layers[front].classList.add("is-on");
          layers[1 - front].classList.remove("is-on");
          setActive(true);
        }, () => {});
        // UltraBlurColors gives four corner colours for the artwork.
        if (colors) {
          root.style.setProperty("--pxo-tl", `#${colors.topLeft}`);
          root.style.setProperty("--pxo-br", `#${colors.bottomRight}`);
        }
      },
      clear() {
        current = "";
        setActive(false);
        layers.forEach((l) => l.classList.remove("is-on"));
      },
      shade(v) {
        const q = Math.round(v * 50) / 50;
        if (q === shadeValue) return;
        shadeValue = q;
        shade.style.opacity = String(q * 0.8);
      },
    };

    const offMut = PXO.onMutate(ensure);
    const offRoute = PXO.onRoute((r) => {
      PXO.backdrop.shade(0);
      if (r.name !== "home" && r.name !== "details") PXO.backdrop.clear();
    });
    ensure();

    return () => {
      offMut();
      offRoute();
      root.remove();
      delete html.dataset.pxoArt;
      delete PXO.backdrop;
    };
  },
});
