// The rail expands on :hover and on :focus-within (for keyboard users). After a
// mouse click the clicked link keeps focus, which held the rail open on the
// new page until the user clicked elsewhere. When a navigation follows a
// pointer interaction, drop focus from the rail; keyboard focus is left alone.
PXO.element({
  name: "sidebar",
  init() {
    let pointer = false;
    const onPointer = () => { pointer = true; };
    const onKey = () => { pointer = false; };

    const offRoute = PXO.onRoute(() => {
      const a = document.activeElement;
      if (pointer && a instanceof HTMLElement && a.closest(PXO.sc("SourceSidebar-pane"))) a.blur();
    });
    document.addEventListener("pointerdown", onPointer, { capture: true, passive: true });
    document.addEventListener("keydown", onKey, { capture: true, passive: true });

    return () => {
      offRoute();
      document.removeEventListener("pointerdown", onPointer, { capture: true });
      document.removeEventListener("keydown", onKey, { capture: true });
    };
  },
});
