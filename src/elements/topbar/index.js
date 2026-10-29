PXO.element({
  name: "topbar",
  init() {
    let bar = null;
    let settingsBtn = null;
    let wordmark = null;

    const ensure = () => {
      if (bar && bar.isConnected && settingsBtn && settingsBtn.isConnected && wordmark && wordmark.isConnected) return;
      const logo = PXO.$(PXO.sc("NavBar-logoContainer"));
      if (!logo) return;
      const next = logo.closest(PXO.sc("NavBar-container")) || logo.parentElement;
      if (bar !== next) {
        bar && bar.classList.remove("pxo-topbar");
        bar = next;
        bar.classList.add("pxo-topbar");
      }

      // Wordmark in place of the Plex logo; the original link stays clickable.
      if (!wordmark || !wordmark.isConnected) {
        const host = logo.querySelector("a") || logo;
        wordmark = PXO.h("span.pxo-wordmark", {}, "stream", PXO.h("i.pxo-wordmark-dot"));
        host.append(wordmark);
      }

      const account = PXO.$(PXO.tid("navbarAccountMenuTrigger"), bar);
      const anchor = account && account.closest("button");
      if (anchor && (!settingsBtn || !settingsBtn.isConnected)) {
        settingsBtn = PXO.h(
          "button.pxo-topbar-btn",
          {
            type: "button",
            title: "Overhaul settings",
            "aria-label": "Overhaul settings",
            "aria-haspopup": "dialog",
            "aria-expanded": "false",
            onclick: () => PXO.toggleSettings && PXO.toggleSettings(),
          },
          PXO.svg(PXO.icons.sliders, 20)
        );
        anchor.before(settingsBtn);
      }
    };

    // The bar turns solid once the page under it has scrolled. Attributes on
    // <html> restyle the whole document, so they are written only on change.
    let scrolled = false;
    const setScrolled = (v) => {
      if (v === scrolled) return;
      scrolled = v;
      bar && bar.classList.toggle("pxo-scrolled", v);
      document.documentElement.dataset.pxoScrolled = v ? "1" : "0";
    };
    const scrollerSel = `${PXO.sc("PageContent-pageContentScroller")}, ${PXO.sc("Page-pageScroller")}`;
    const onScroll = (e) => {
      const t = e.target;
      if (t instanceof Element && (t.scrollTop > 12) !== scrolled && t.matches(scrollerSel)) setScrolled(t.scrollTop > 12);
    };
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    const offRoute = PXO.onRoute(() => setScrolled(false));
    const offMut = PXO.onMutate(ensure);
    ensure();

    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      offRoute();
      offMut();
      bar && bar.classList.remove("pxo-topbar", "pxo-scrolled");
      settingsBtn && settingsBtn.remove();
      PXO.$$(".pxo-wordmark").forEach((n) => n.remove());
    };
  },
});
