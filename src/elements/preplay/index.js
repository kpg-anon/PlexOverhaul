// Details pages: show the item's own background art in the shared backdrop
// (Plex shows a blurred, darkened copy). Episodes and seasons use the show
// art. The lookup and decode are cached and usually already done by a hover
// prefetch (elements/prefetch).
PXO.element({
  name: "preplay",
  init() {
    let token = 0;

    const onRoute = async (r) => {
      if (r.name !== "details") return;
      const mine = ++token;
      // Cast pages and Discover items (#!/provider/...) are not items on this
      // server; clear the backdrop so the previous item's art doesn't linger.
      const m = /^\/library\/metadata\/(\d+)$/.exec(r.params.get("key") || "");
      if (!m || r.path.startsWith("/provider/")) {
        PXO.backdrop && PXO.backdrop.clear();
        return;
      }
      const art = await PXO.art.forKey(m[1]);
      if (mine !== token || !PXO.backdrop) return;
      if (art) PXO.backdrop.show(art.url, art.colors);
      else PXO.backdrop.clear(); // item without background art
    };

    const off = PXO.onRoute(onRoute);
    onRoute(PXO.route());
    return off;
  },
});
