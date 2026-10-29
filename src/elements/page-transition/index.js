// Each navigation fades the new page's content in. Plex swaps the content
// scroller on route change, so the class is applied to whichever is current.
PXO.element({
  name: "page-transition",
  init() {
    let pending = false;
    let tagged = null;

    const apply = () => {
      if (!pending) return;
      const page = PXO.$(PXO.sc("PageContent-pageContentScroller"));
      if (!page) return;
      pending = false;
      tagged && tagged.classList.remove("pxo-enter");
      tagged = page;
      page.classList.remove("pxo-enter");
      void page.offsetWidth; // restart the animation when the node is reused
      page.classList.add("pxo-enter");
    };

    const offRoute = PXO.onRoute(() => {
      pending = true;
      requestAnimationFrame(apply);
    });
    const offMut = PXO.onMutate(apply);

    return () => {
      offRoute();
      offMut();
      tagged && tagged.classList.remove("pxo-enter");
    };
  },
});
