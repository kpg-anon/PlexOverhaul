// CSS shorthand `%Component-part` means "any Plex class containing
// `Component-part-`" (Plex appends a per-build hash). An attribute selector
// like [class*="Component-part-"] can't be indexed by the style engine, so it
// is tested against every element on every style recalc. Instead, read the
// class names Plex's own stylesheets define and use real class selectors;
// names with no match yet fall back to the attribute selector and are tried
// again whenever Plex loads another stylesheet.
PXO.mountStyles = () => {
  const font = PXO.h("link", {
    id: "pxo-font",
    rel: "stylesheet",
    crossorigin: "anonymous", // makes its rules readable for the alias below
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  });
  // Plex sets "-apple-system, BlinkMacSystemFont, Segoe UI, ..." directly on
  // many containers. Outside Safari, -apple-system is just a family name, so
  // registering Inter's font files under that name turns every one of those
  // stacks into Inter without a rule per element.
  const alias = PXO.h("style", { id: "pxo-font-alias" });
  font.addEventListener("load", () => {
    try {
      alias.textContent = Array.from(font.sheet.cssRules)
        .filter((r) => r instanceof CSSFontFaceRule)
        .map((r) => r.cssText.replace(/font-family:\s*["']?Inter["']?/i, 'font-family: "-apple-system"'))
        .join("\n");
    } catch (e) {
      PXO.log("font alias unavailable", e);
    }
  });
  const style = PXO.h("style", { id: "pxo-style" });
  const RE = /%([A-Z][A-Za-z0-9]*-[A-Za-z0-9]+)/g;
  const raw = PXO.cssModules.map((m) => `/* ${m.name} */\n${m.css}`).join("\n");
  const names = [...new Set(Array.from(raw.matchAll(RE), (m) => m[1]))];
  const selectors = new Map();
  let sheetCount = -1;
  let tokens = [];
  let tokensAt = -1;

  function scanClassTokens() {
    const tokens = new Set();
    const walk = (rules) => {
      for (const r of rules) {
        if (r.selectorText) for (const m of r.selectorText.matchAll(/\.([A-Za-z_][\w-]*)/g)) tokens.add(m[1]);
        if (r.cssRules) walk(r.cssRules);
      }
    };
    for (const ss of document.styleSheets) {
      if (ss.ownerNode === style) continue;
      try { walk(ss.cssRules); } catch (e) {} // cross-origin (Google Fonts)
    }
    return Array.from(tokens);
  }

  // Names with no match are not searched again until another stylesheet loads.
  const misses = new Map();

  function resolve(n) {
    if (selectors.has(n)) return selectors.get(n);
    const count = document.styleSheets.length;
    if (misses.get(n) === count) return null;
    if (tokensAt !== count) {
      tokens = scanClassTokens();
      tokensAt = count;
    }
    const hits = tokens.filter((t) => t.includes(`${n}-`));
    if (!hits.length) {
      misses.set(n, count);
      return null;
    }
    const cls = hits.map((t) => `.${CSS.escape(t)}`);
    const sel = cls.length === 1 ? cls[0] : `:is(${cls.join(",")})`;
    selectors.set(n, sel);
    return sel;
  }

  function render() {
    if (document.styleSheets.length === sheetCount) return;
    sheetCount = document.styleSheets.length;
    if (style.textContent && names.every((n) => selectors.has(n))) return;
    const text = raw.replace(RE, (_, n) => resolve(n) || `[class*="${n}-"]`);
    if (text !== style.textContent) style.textContent = text;
  }

  // JS lookups (PXO.sc) use the same resolved selectors.
  const fallbackSc = PXO.sc;
  PXO.sc = (n) => resolve(n) || fallbackSc(n);

  render();
  // Appended to <html> after <head>, so these rules come after every style tag
  // Plex adds to <head> at runtime and win ties in specificity.
  document.documentElement.append(font, alias, style);
  const off = PXO.onMutate(render);
  PXO.styleStats = () => ({ names: names.length, resolved: selectors.size, unresolved: names.filter((n) => !selectors.has(n)) });
  PXO.onCleanup(() => {
    off();
    PXO.sc = fallbackSc;
    font.remove();
    alias.remove();
    style.remove();
  });
};
