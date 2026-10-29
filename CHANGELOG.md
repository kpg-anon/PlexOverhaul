# Changelog

## [1.1.1] - 2026-10-29

### Fixed

- The icon sidebar stayed expanded after clicking one of its links until the page was clicked.
- On details pages the poster's play button and hover outline moved to the side on hover.

## [1.1.0] - 2026-10-29

### Added

- Styling for the account menu, search results, Plex's settings pages, the Edit metadata dialog, the list-style menu and Detail View rows.
- Hero slides change with the arrow keys.

### Changed

- Navigation is much faster: CSS selectors resolve to Plex's real class names, entrance animations are opacity-only, and background art is decoded before it is shown.
- Item art is cached and starts loading when a poster is hovered.
- The home hero renders from a cache, so the page no longer jumps when it appears.

### Fixed

- Search results were hidden, then mispositioned.
- Art from the previous item stayed behind cast pages and items without art.
- The top bar overflowed on narrow windows.

## [1.0.0] - 2026-10-29

First release.
