# CLAUDE.md — ilmualam.com Blogger Template

## Overview
- **Site**: [ilmualam.com](https://www.ilmualam.com) — Islamic educational content (Malay/ms-MY)
- **Platform**: Blogger/Blogspot with a fully custom XML template
- **Template**: `asset/xml/ilmualam.xml` (~4,000 lines) — the single source of truth
- **Template name**: The Ilmu Alam Green v1.0.0 (based on Pro Blogger Templates Core 2.2.0)
- **Site JS**: `scripts/vanilla.js` (no jQuery), served via jsDelivr pinned to a commit SHA

---

## File Structure
```
xml/
├── CLAUDE.md                     ← this file
├── asset/xml/ilmualam.xml        ← complete Blogger template (upload this)
├── asset/audit-input/            ← Search Console exports (evidence)
├── scripts/vanilla.js            ← site JS, loaded by the template from jsDelivr
├── scripts/xml-lint.js           ← `npm run validate`
├── scripts/blogger-*.js          ← Blogger API tools (manual GitHub Actions)
├── scripts/live-jsonld-audit.js  ← live JSON-LD audit (manual GitHub Action)
├── content-refresh/              ← post refresh manifests for blogger-content-refresh
├── docs/                         ← Blogger API setup notes
└── tests/                        ← `npm test`
```

---

## Template Architecture

### Key Sections (in order)
`<head>` (preconnects, fonts, early dark-mode script) → `<b:skin>` (all CSS, CDATA) → `<b:defaultmarkups>` → global JSON-LD (end of head) → `<body>` layout sections and widgets → small inline scripts (lazy video, Quran API, reading time, sitemap engine) + deferred `vanilla.js`.

### Blogger Namespace
- `b:if / b:elseif / b:else` — conditionals
- `b:loop` — iteration
- `b:include name='...'` — reusable includables (207 uses)
- `b:with var='...'` — scoped variables
- `data:view.*` / `data:blog.*` / `data:post.*` — Blogger data bindings
- `expr:` — expression evaluation on attributes
- `b:defaultmarkup type='...'` — override default widget rendering

---

## SEO Implementation

### Structured Data (JSON-LD)
Only ONE set per page — the global schema at the end of `<head>` (outside `b:defaultmarkups`) covers all pages:
- **All pages**: `Organization` + `WebSite` + `WebPage` (with `SearchAction`)
- **Post pages**: `Article` + `WebPage` + `BreadcrumbList` (in `postMeta` includable inside `Blog1` widget)
- **Label/category pages**: `CollectionPage` + `ItemList` (in `postMeta` includable)

> **Rule**: Never add another `WebSite` or `Organization` schema elsewhere — duplicate `@id` values break Google's rich results.

### Meta Tags
- `<title>` — dynamic via `data:view.title.escaped`
- `<meta name='description'>` — dynamic via `data:view.description.escaped`
- `<link rel='canonical'>` — dynamic via `data:view.url.canonical`
- Robots: `noindex, follow` on error/search/archive; `index, follow` everywhere else
- hreflang: `ms-MY` and `x-default`
- `theme-color` — ONE dynamic meta at line ~1269 via `data:skin.vars.browser_bg` (do not add a second hard-coded one)

### Open Graph & Twitter Card
- `og:image` / `twitter:image` — use `resizeImage(src, 1200, "1200:630")` for correct 1200×630 crop
- `og:type` — `website` on homepage/label pages, `article` on posts
- `article:published_time` / `article:modified_time` — ISO8601 from post data

---

## Search Functionality

### How It Works
- Modal `.main-search` (fixed, 34rem, hidden by default)
- Opens on: `.search-toggle` click or **Ctrl+K**
- Closes on: `.close` click, overlay click, or **Esc**

### Event Listener (important)
The input listener is on the search **input element** (`input.addEventListener('input', …)`), never on `window`.

### Search API
- Recent posts: `/search/?by-date=true&max-results=N&view=json`
- Label posts: `/search/label/{label}?by-date=true&max-results=N&view=json`
- Search query: `/search/?q={term}&by-date=true&max-results=50&view=json`
- Results parsed from `#data` element, max 15 shown initially

---

## CSS Conventions

### CSS Variables (root)
- `--accent-color` / `--keycolor`: `#247b49` (green)
- `--text-color`: `#09090b`
- `--meta-color`: `#71717a`
- `--border-color`: `#f4f4f5`
- `--widget-bg`: `#ffffff`
- `--modal-bg`: `#ffffff`
- `:root.is-dark` — dark mode overrides
- `:root.rtl` — RTL language overrides

### Layout Classes
- `.flex-c` / `.flex-sb` / `.flex-col` — flex utilities
- `.card`, `.md`, `.sm`, `.cs` — post card sizes
- `.entry-title`, `.entry-meta`, `.entry-thumbnail` — BEM-like post anatomy
- `.no-sidebar` / `.is-left` / `.is-right` — sidebar layout toggles

---

## JavaScript Conventions

### Global State
- Helpers in vanilla.js: `qs`, `qsa`, `scrollY()`, `offsetTop()`, `getAttr(shortcode, key)`
- `pbt` object — template config (isDark, stickyMenu, postAuthor, etc.) from `pbt-var` includable
- `localStorage.dark_mode` — user dark mode preference (`"true"` / `"false"`)
- `localStorage.search_term` — last search query (debounce dedup)

### Key Functions
| Function | Purpose |
|----------|---------|
| `getFeedUrl(n, label)` | Build Blogger feed JSON URL |
| `getPosts(opts)` | AJAX post fetcher — powers featured/trending/search/related |
| `getSearch(input, container)` | Debounced search trigger |
| `openSearch()` / `closeSearch()` | Search modal open/close |
| `darkModeLogo(val)` | Swap logo src for dark mode |
| `pbtLazy(el)` | Lazy-load thumbnail/avatar backgrounds (skips elements with `.pbt-lazy`) |
| `getPostContent(opts)` | Generate post card HTML by type |
| `megaTabs(el, tabs)` | Mega menu tab builder |
| `disqusComments(shortname)` | Inject Disqus embed |

---

## Widget Sections (Blogger Layout)
| Section ID | Purpose |
|------------|---------|
| `pbt-panel` | Hidden theme options (thumbnail noThumb, link options) |
| `main-logo` | Site logo image |
| `main-menu` | Navigation (LinkList widget — supports mega menu via `getPosts` shortcode) |
| `featured` | Featured posts area |
| `trending` | Trending/popular posts grid |
| `sidebar` | Sidebar widgets |
| `related-posts` | Related posts (HTML widget) |
| `post-ads-1..4` | Ad placements within posts |
| `footer-info` | Footer logo + description |
| `footer-widgets` | Footer widget columns |
| `cookie` | Cookie consent widget |

---

## External Integrations
| Service | Purpose |
|---------|---------|
| Bootstrap Icons 1.13.1 (cdnjs) | Icon font |
| Google Fonts (Inter, Noto Naskh Arabic, Amiri) | Typography |
| Google AdSense | Monetization |
| Ad Supply (`live.demand.supply`) | Additional ads |
| Follow.it | Email newsletter |
| Al Quran Cloud API | Quran content (`window.Quran` global) |
| Tanzil (jsDelivr) | Fallback Quran data |
| PWA manifest (ilmualam.github.io/pwa) | Web app manifest |

---

## Known Issues Fixed (Changelog)
- **Double JSON-LD** — Removed redundant homepage `WebSite+Organization` block from inside `pbt-head`; the global schema after `b:defaultmarkups` (line ~2422) is authoritative for all pages.
- **Search not working** — Fixed: `$w.on("input", ...)` → `t.on("input", ...)` so input events on the search box are captured correctly.
- **Duplicate theme-color** — Removed hard-coded `<meta name='theme-color' content='#249749'>` from top of `<head>`; dynamic one inside `pbt-head` is the correct single source.
- **og:image wrong dimensions** — Changed `resizeImage 1200` to `resizeImage(src, 1200, "1200:630")` for both OG and Twitter image tags to ensure proper 1200×630 crop matches declared width/height metadata.

- **Cropped thumbnails** — `--base` was 16/10, cropping the site's 16:9 thumbnails. Now 16/9; cards (home/label/search, Trending, Related, Featured md) use the sitemap-style layout: image → green label pill → title → 📅 date.
- **CLS: Trending/Related** — JS-loaded widgets grew from a 12rem loader to full cards. A hidden `:before` placeholder now reserves exactly one card row (one row on desktop, horizontal scroll-snap on tablet/mobile). Card header height is fixed via `--card-head`.
- **CLS: post images** — `aspect-ratio:auto` + `content-visibility:auto` on `.post-body img` cancelled the width/height-attribute ratio and collapsed off-screen images. Removed.
- **CLS: JS-moved ad slots** — `.before-ads/.after-ads/.post-footer-ads/.inline-ad` now reserve their height (100vw on portrait mobile, matching the rr-container script).
- **CLS: font swap / header icons** — metric-matched `Inter Fallback` faces; header icon buttons have fixed widths.
- **LCP** — first label/search list card and the first Featured card render a real `<img fetchpriority=high>` (srcset via `sourceSet`) instead of a JS background; logo no longer `fetchpriority=high`.
- **Dead/broken scripts removed** — jQuery related-posts block (`jQuery is not defined` on every page) and a post-image script that sat entirely on a `//` comment line.
- **Schema** — global `WebPage` is now per-page (`<canonical>#webpage`, CollectionPage + ItemList on label pages, SearchResultsPage on search); `Article.mainEntityOfPage` points at it; the never-rendered label block in `postMeta` and the misleading `funding: Google AdSense` claim were removed.
- **Sync XHR / short labels** — related, sidebar and trending widgets top up from recent posts asynchronously when a label has too few posts (no more blocking `XMLHttpRequest`).
- **Invalid Article keywords** — `data:label.isLast` is unsupported in Blogger; keyword loops now use `index='i'`.
- **Console errors** — removed cross-origin Service Worker registration (SW must be same-origin) and `crossorigin='use-credentials'` on the manifest.
- **vanilla.js** is loaded from jsDelivr pinned to a commit SHA. After changing `scripts/vanilla.js`, commit it first, then update the SHA in the XML `<b:tag name='script' ... vanilla.js>` line.

---

## Development Rules

1. **All changes go in `asset/xml/ilmualam.xml`** — there is no build step; the XML is uploaded directly to Blogger.
2. **Test in Blogger's template editor** before publishing — syntax errors break the entire site.
3. **One `postMeta` includable** — only the one inside `Blog1` widget runs; the `b:defaultmarkup type='Blog'` version is the fallback for other Blog widgets (rarely used).
4. **JSON-LD @ids must be unique per page** — use `#article`, `#breadcrumb`, `#primaryimage` etc. scoped to `data:post.url.canonical`.
5. **All JSON inside `<script type='application/ld+json'>` must use `&quot;` for quotes** in Blogger XML context.
6. **CSS goes inside `<b:skin>` CDATA block** — do not add `<style>` tags elsewhere.
7. **Site JS goes in `scripts/vanilla.js`** — commit it, then update the pinned SHA in the template. Small inline scripts keep the `//<![CDATA[` / `//]]>` wrappers on their own lines.
8. **Robots**: Search/archive/error pages must remain `noindex` — do not change the robots `b:if` logic.
9. **Images**: Always use `resizeImage(src, width, "ratio")` for OG images to get proper crop.
10. **Dark mode** state is in `localStorage.dark_mode` and CSS class `is-dark` on `<html>`.
