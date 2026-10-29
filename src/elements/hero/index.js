// Home page hero: Continue Watching items first, then recently added movies
// and shows. Manual navigation only, unless "Hero autoplay" is on.
PXO.element({
  name: "hero",
  init() {
    const { h, api } = PXO;
    const idle = window.requestIdleCallback ? (fn) => requestIdleCallback(fn, { timeout: 2000 }) : (fn) => setTimeout(fn, 300);
    let node = null;
    let slides = [];
    let index = 0;
    let timer = 0;
    let loading = null;

    const fmtDuration = (ms) => {
      const m = Math.round(ms / 60000);
      return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
    };

    function toSlide(item, kind, mid) {
      const ep = item.type === "episode";
      const showKey = ep ? item.grandparentRatingKey : item.ratingKey;
      const art = ep ? item.grandparentArt || item.art : item.art;
      const logo = ep ? `/library/metadata/${item.grandparentRatingKey}/clearLogo` : api.imageOf(item, "clearLogo");
      const meta = [];
      if (ep) meta.push(`S${item.parentIndex} · E${item.index}`);
      if (item.year && !ep) meta.push(String(item.year));
      if (item.contentRating) meta.push(item.contentRating);
      if (item.duration) meta.push(fmtDuration(item.duration));
      (item.Genre || []).slice(0, 2).forEach((g) => meta.push(g.tag));
      return {
        id: item.ratingKey,
        showKey,
        kind,
        label: kind === "deck" ? "Continue watching" : `New in ${item.librarySectionTitle || "your library"}`,
        title: ep ? item.grandparentTitle : item.title,
        subtitle: ep ? item.title : item.tagline || "",
        summary: item.summary || "",
        meta,
        rating: item.audienceRating,
        art: api.img(art, 1920, 1080),
        thumb: api.img(art, 400, 225),
        logo: logo ? api.img(logo, 840, 320) : "",
        progress: item.viewOffset && item.duration ? item.viewOffset / item.duration : 0,
        colors: item.UltraBlurColors,
        href: `#!/server/${mid}/details?key=${encodeURIComponent(`/library/metadata/${item.ratingKey}`)}`,
      };
    }

    async function load() {
      const mid = await api.machineId();
      const [deck, movies, shows] = await Promise.all([
        api.get("/hubs/home/continueWatching?X-Plex-Container-Size=6").catch(() => ({})),
        api.get("/hubs/home/recentlyAdded?type=1&X-Plex-Container-Size=6").catch(() => ({})),
        api.get("/hubs/home/recentlyAdded?type=2&X-Plex-Container-Size=4").catch(() => ({})),
      ]);
      const seen = new Set();
      const out = [];
      const add = (list, kind) =>
        (list || []).forEach((it) => {
          const s = toSlide(it, kind, mid);
          if (!s.art || seen.has(s.showKey)) return;
          seen.add(s.showKey);
          out.push(s);
        });
      add((deck.Metadata || []).slice(0, 5), "deck");
      add(movies.Metadata, "new");
      add(shows.Metadata, "new");
      return out.slice(0, 10);
    }

    // Plays through Plex's own UI: open the item, press its Play button, and for
    // a partly watched item answer Plex's "Resume Playback" list with its first
    // entry ("Resume from …").
    function play(slide) {
      location.hash = slide.href.slice(1);
      const started = Date.now();
      const waitFor = (find, then, ms) => {
        const tick = () => {
          const el = find();
          if (el) return then(el);
          if (Date.now() - started < ms) setTimeout(tick, 120);
        };
        setTimeout(tick, 120);
      };
      waitFor(() => PXO.$(PXO.tid("preplay-play")), (btn) => {
        btn.click();
        if (slide.progress) {
          waitFor(() => PXO.$(`#modal-root ${PXO.sc("ListModalItem-listModalItem")}`), (item) => item.click(), 10000);
        }
      }, 8000);
    }

    function renderSlide() {
      if (!node || !slides.length) return;
      const s = slides[index];
      const body = node.querySelector(".pxo-hero-body");
      const title = s.logo
        ? h("img.pxo-hero-logo", { src: s.logo, alt: s.title, onerror: (e) => e.target.replaceWith(h("h1.pxo-hero-title", {}, s.title)) })
        : h("h1.pxo-hero-title", {}, s.title);
      body.replaceChildren(
        h("div.pxo-hero-content", {},
          h("div.pxo-hero-label", {}, h("i"), s.label),
          title,
          h("div.pxo-hero-meta", {},
            s.rating ? h("span.pxo-hero-rating", {}, `★ ${Number(s.rating).toFixed(1)}`) : null,
            ...s.meta.map((m) => h("span", {}, m))),
          s.subtitle ? h("div.pxo-hero-subtitle", {}, s.subtitle) : null,
          h("p.pxo-hero-summary", {}, s.summary),
          s.progress ? h("div.pxo-hero-progress", {}, h("i", { style: { width: `${Math.round(s.progress * 100)}%` } })) : null,
          h("div.pxo-hero-actions", {},
            h("button.pxo-btn.pxo-btn--primary", { type: "button", onclick: () => play(s) },
              PXO.svg(PXO.icons.play, 18), s.progress ? "Resume" : "Play"),
            h("a.pxo-btn", { href: s.href }, PXO.svg(PXO.icons.info, 18), "Details")))
      );
      node.querySelectorAll(".pxo-hero-thumb").forEach((t, i) => t.classList.toggle("is-on", i === index));
      // Scroll only the strip (scrollIntoView would also scroll the page), and
      // read its geometry a frame later: reading it right after replacing the
      // hero content would force a synchronous layout of the whole page.
      if (index > 0 || node.querySelector(".pxo-hero-strip").scrollLeft > 0) {
        requestAnimationFrame(() => {
          const strip = node.querySelector(".pxo-hero-strip");
          const on = strip && strip.children[index];
          if (!on) return;
          const left = on.offsetLeft - (strip.clientWidth - on.clientWidth) / 2;
          strip.scrollTo({ left, behavior: PXO.settings.reducedMotion() ? "auto" : "smooth" });
        });
      }
      PXO.backdrop && PXO.backdrop.show(s.art, s.colors);
      // Decode the next slide's art while idle, so the arrow is instant.
      const next = slides[(index + 1) % slides.length];
      idle(() => PXO.art.decode(next.art).catch(() => {}));
      schedule();
    }

    function go(i) {
      index = (i + slides.length) % slides.length;
      renderSlide();
    }

    function schedule() {
      clearTimeout(timer);
      if (PXO.settings.get("heroAutoplay") && !PXO.settings.reducedMotion() && !document.hidden && node && !node.matches(":hover")) {
        timer = setTimeout(() => go(index + 1), 9000);
      }
    }

    function build() {
      const strip = h("div.pxo-hero-strip", {},
        ...slides.map((s, i) =>
          h("button.pxo-hero-thumb", { type: "button", title: s.title, onclick: () => go(i), style: { backgroundImage: `url("${s.thumb}")` } },
            s.progress ? h("i", { style: { width: `${Math.round(s.progress * 100)}%` } }) : null)));
      const onKey = (e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        if (e.target instanceof HTMLInputElement) return;
        e.preventDefault();
        go(index + (e.key === "ArrowRight" ? 1 : -1));
      };
      const el = h("section.pxo-hero", {
        "aria-roledescription": "carousel",
        "aria-label": "Featured",
        onmouseenter: () => clearTimeout(timer),
        onmouseleave: schedule,
        onkeydown: onKey,
      },
        h("div.pxo-hero-body"),
        h("div.pxo-hero-nav", {},
          h("button.pxo-hero-arrow", { type: "button", "aria-label": "Previous", onclick: () => go(index - 1) }, PXO.svg(PXO.icons.left, 18)),
          strip,
          h("button.pxo-hero-arrow", { type: "button", "aria-label": "Next", onclick: () => go(index + 1) }, PXO.svg(PXO.icons.right, 18))));
      return el;
    }

    function remove() {
      clearTimeout(timer);
      node && node.remove();
      delete document.documentElement.dataset.pxoHero;
    }

    // Slides from the last visit, shown at once while fresh data loads, so the
    // hero is in place when the rows render instead of pushing them down later.
    // Kept per user: Plex Home users share the browser.
    const CACHE = "pxo.hero.v2";
    const readCache = () => {
      try {
        const c = JSON.parse(localStorage.getItem(CACHE) || "null");
        return c && c.user === api.userKey() ? c.slides : [];
      } catch (e) { return []; }
    };
    const writeCache = (list) => {
      try { localStorage.setItem(CACHE, JSON.stringify({ user: api.userKey(), slides: list })); } catch (e) {}
    };
    let slidesUser = null;

    // A failed or empty load is not retried on every DOM change; wait 5 min.
    let lastLoad = 0;
    function refresh() {
      if (loading || Date.now() - lastLoad < 5 * 60 * 1000) return;
      lastLoad = Date.now();
      loading = load().then((fresh) => {
        loading = null;
        writeCache(fresh);
        const same = fresh.map((s) => s.id).join() === slides.map((s) => s.id).join();
        slides = fresh;
        if (!same && node) {
          const was = node;
          node = build();
          index = 0;
          if (was.isConnected) { was.replaceWith(node); renderSlide(); }
        }
        ensure();
      }, (e) => { loading = null; PXO.log("hero load failed", e); });
    }

    function ensure() {
      if (!PXO.settings.get("hero") || PXO.route().name !== "home") return remove();
      // A different Plex Home user: drop the previous user's slides.
      if (slidesUser !== api.userKey()) {
        slidesUser = api.userKey();
        if (slides.length) {
          slides = [];
          remove();
          node = null;
        }
      }
      // Cheap exit for the common case: already first in the page content.
      if (node && node.isConnected && node.parentElement.firstElementChild === node) return;
      // Insert as soon as the home page's content scroller exists, before the
      // rows render, so adding the hero does not shift them. During a route
      // change the previous page's scroller can still be in place for a frame,
      // and Plex shows a spinner page while loading; both are skipped.
      const host = PXO.$(PXO.sc("PageContent-pageContentScroller"));
      if (!host || host.matches(PXO.sc("EmptyPageContent-emptyPageContentScroller")) ||
        host.querySelector(PXO.sc("PrePlayPageContent-prePlayContentWrapper"))) return;
      if (!slides.length) slides = readCache();
      if (!slides.length) {
        refresh();
        return;
      }
      if (!node) {
        node = build();
        refresh();
      }
      host.prepend(node);
      document.documentElement.dataset.pxoHero = "1";
      renderSlide();
    }

    // Darken the backdrop as the rows scroll up over it, once per frame at most.
    let scrollQueued = false;
    const onScroll = (e) => {
      const t = e.target;
      if (scrollQueued || !node || !(t instanceof Element) || !t.contains(node)) return;
      scrollQueued = true;
      requestAnimationFrame(() => {
        scrollQueued = false;
        PXO.backdrop && PXO.backdrop.shade(Math.min(1, t.scrollTop / 520));
      });
    };
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });

    const offMut = PXO.onMutate(ensure, { immediate: true });
    const offRoute = PXO.onRoute(() => ensure());
    const onVisibility = () => schedule();
    document.addEventListener("visibilitychange", onVisibility);
    const offSet = PXO.settings.onChange((k) => {
      if (k === "hero") ensure();
      if (k === "heroAutoplay") schedule();
    });
    ensure();

    return () => {
      offMut();
      offRoute();
      offSet();
      document.removeEventListener("scroll", onScroll, { capture: true });
      document.removeEventListener("visibilitychange", onVisibility);
      remove();
    };
  },
});
