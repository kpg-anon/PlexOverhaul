// Rows fade up once, in order, the first time they appear after a navigation.
PXO.element({
  name: "hubs",
  init() {
    const seen = new WeakSet();
    let batch = 0;

    const scan = () => {
      const hubs = PXO.$$(PXO.sc("VirtualHubScroller-hub"));
      let i = 0;
      for (const hub of hubs) {
        if (seen.has(hub)) continue;
        seen.add(hub);
        hub.style.setProperty("--pxo-i", String(Math.min(batch + i++, 8)));
        hub.classList.add("pxo-in");
      }
      batch += i;
    };

    const offRoute = PXO.onRoute(() => { batch = 0; });
    // Immediate, so a new row is hidden before its first paint instead of
    // showing for a frame and then fading in.
    const offMut = PXO.onMutate(scan, { immediate: true });
    scan();

    return () => {
      offRoute();
      offMut();
      PXO.$$(".pxo-in").forEach((n) => n.classList.remove("pxo-in"));
    };
  },
});
