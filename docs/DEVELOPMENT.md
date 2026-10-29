# Development

## Build

    npm run build      # writes plex-overhaul.user.js and plex-overhaul.meta.js
    npm run watch      # rebuilds on any change under src/

No dependencies. `tools/build.mjs` concatenates the sources in this order:

1. `src/core/*.js` by filename (`00-pxo.js` first)
2. `src/theme/*.css` by filename
3. each `src/elements/<name>/` by folder name: `style.css`, then `index.js`
4. `src/main.js`

`src/header.js` is the metadata block; `{{version}}` comes from `package.json`,
`{{modified}}` is the build date.

## Trying a change

Open Plex Web, paste `plex-overhaul.user.js` into the devtools console and run it.
Running it again replaces the previous copy, so there is no need to reload.

## How it attaches

It matches `*://*/web/index.html*` and `https://app.plex.tv/desktop*`, then exits
unless the page has Plex's `<div id="plex" class="application">` and its
`apple-itunes-app` meta tag (app id 383457673).

## Layout

| path | what it does |
| --- | --- |
| `src/core/00-pxo.js` | `PXO` namespace, `PXO.element()`, `PXO.addCss()`, cleanup list. Tears down a previous copy if one is running. |
| `src/core/10-dom.js` | `PXO.sc()` / `PXO.tid()` selectors, `PXO.h()` element builder, icons |
| `src/core/20-settings.js` | settings in localStorage `pxo.settings`, mirrored to `data-pxo-*` on `<html>` |
| `src/core/30-router.js` | `PXO.route()` and `PXO.onRoute()` for Plex's hash routes; sets `data-pxo-route` |
| `src/core/40-observer.js` | one MutationObserver; subscribers run once per frame, or before paint with `{ immediate: true }` |
| `src/core/50-api.js` | `PXO.api.get()`: same-origin server if the page is served by one, otherwise the account's server via plex.tv resources; `img()` transcoder URLs |
| `src/core/60-styles.js` | resolves `%Component-part` to Plex's real class names at runtime, puts all CSS in one `<style id="pxo-style">` after `<head>`, loads Inter and registers it as `-apple-system` |
| `src/core/70-art.js` | cached item-art lookups and off-thread image decodes (`PXO.art`) |
| `src/theme/10-tokens.css` | Afterglow palette and accent presets, motion tokens |
| `src/theme/20-plex-vars.css` | remaps Plex's own `--color-*`, `--font-*`, radius variables |
| `src/theme/30-base.css` | body, scrollbars, focus ring, shared `.pxo-btn`, keyframes |
| `src/elements/topbar` | top bar, wordmark, search pill, settings button |
| `src/elements/sidebar` | 76px icon rail that expands over the page on hover |
| `src/elements/backdrop` | crossfading full-window art layer (`PXO.backdrop.show()`) |
| `src/elements/hero` | home hero: Continue Watching + recently added, thumbnail strip |
| `src/elements/hubs` | row titles, round scroll buttons, pivot tabs, list rows, row fade-in |
| `src/elements/poster-card` | rounded cards, hover lift, gradient progress, badges |
| `src/elements/preplay` | details page layout and item art in the backdrop |
| `src/elements/menus` | Radix and legacy menus, search dropdown, modals, tooltips, account menu |
| `src/elements/page-transition` | fade on route change |
| `src/elements/settings-panel` | accent, animations, layout toggles |
| `src/elements/prefetch` | hovering a details link for 120ms prefetches and decodes its art |
| `src/elements/player` | floating mini player bar, seek bar, player buttons |
| `src/elements/search` | search results page and dropdown rows |
| `src/elements/forms` | Plex's legacy Bootstrap forms and modals (settings pages, Edit metadata) |
| `src/elements/user-select` | Plex Home profile picker and PIN screen |

## Adding an element

Make `src/elements/<name>/` with a `style.css`, an `index.js`, or both. In CSS,
`%Component-part` means any Plex class containing `Component-part-` (Plex adds a
per-build hash); `src/core/60-styles.js` swaps it for the real class names found in
Plex's stylesheets, falling back to `[class*="Component-part-"]`. In JS, use
`PXO.sc("Component-part")` for the same lookup.

    PXO.element({
      name: "<name>",
      init() {
        const off = PXO.onMutate(() => { /* find and patch nodes */ });
        return () => off(); // undo everything on PXO.destroy()
      },
    });

## Rules

These came out of measuring frame rate and style-recalc time against stock Plex.

- No universal (`*`) or `[style*=...]` selectors; no `:has()` (set a data attribute instead).
- Animations on Plex's own nodes are opacity-only; transforms make its virtual lists
  recompute every frame. Never animate `transform` on popper wrappers (they are
  positioned with an inline transform).
- For hover lifts and scales on Plex's elements use the separate `translate` /
  `scale` properties, not `transform`: several (the details-page play button) are
  centred by Plex with `transform: translate(-50%, -50%)`, which `transform` replaces.
- No `backdrop-filter` on anything that sits over moving content.
- Write to `<html>` attributes only when the value changes.

## Releasing

1. Bump `version` in `package.json` (patch for fixes, minor for behaviour changes).
2. `npm run build` and commit `plex-overhaul.user.js` and `plex-overhaul.meta.js`.
3. Add a `CHANGELOG.md` entry.
4. Copy `plex-overhaul.user.js` to `kpg-anon/scripts` at `userscripts/plex-overhaul.user.js`;
   `@updateURL` points there, so that is the copy installs update from.
