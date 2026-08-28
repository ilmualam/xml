# CLAUDE.md — ilmualam.com Blogger Template

## Overview
- **Site**: [ilmualam.com](https://www.ilmualam.com) — Islamic educational content (Malay/ms-MY)
- **Platform**: Blogger/Blogspot with a fully custom XML template
- **Template**: `asset/xml/ilmualam.xml` (~3,760 lines) — the single source of truth
- **Template name**: The Ilmu Alam Green v1.0.0, maintained by Ilmu Alam

---

## File Structure
```
xml/
├── CLAUDE.md                  ← this file
├── README.md
├── LICENSE                    ← MIT
└── asset/xml/
    └── ilmualam.xml           ← complete Blogger template
```

---

## Template Architecture

### Key Sections (in order)
| Lines | Section |
|-------|---------|
| 1–57 | `<head>` — preconnects, fonts, Ad Supply script, rr-container inline script |
| 58–1190 | `<b:skin>` — all CSS (inside `<![CDATA[...]]>`) |
| 1191–2412 | `<b:defaultmarkups>` — default widget markup overrides |
| 2413–2425 | Miscellaneous (AdSense, Analytics, global Organization+WebSite JSON-LD) |
| 2426–3696 | `<body>` — layout sections, all widget instances |
| 3697–3755 | Site scripts (jQuery, search JS, Service Worker, Quran API, lazy video) |
| 3756–3761 | Footer close tags |

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
The input event listener is on **the input element `t`**, not on `$w` (window):
```js
t.on("input", function(e) {  // ← correct: t is e.find("input")
  clearTimeout(o);
  o = setTimeout(() => getSearch(t, s), 500);
});
```
> **Bug history**: Was incorrectly `$w.on("input", ...)` — window doesn't receive input events from child inputs. Fixed to `t.on("input", ...)`.

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
- `$w = $(window)`, `$d = $(document)`, `$h = $("html")`, `$b = $("body")`
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
| `pbtLazy()` | jQuery plugin — lazy-load thumbnails/avatars |
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
| jQuery 3.6.0 (cdnjs) | Core JS framework |
| Bootstrap Icons 1.13.1 (cdnjs) | Icon font |
| Google Fonts (Inter, Noto Naskh Arabic, Amiri) | Typography |
| Google AdSense | Monetization |
| Ad Supply (`live.demand.supply`) | Additional ads |
| Follow.it | Email newsletter |
| Al Quran Cloud API | Quran content (`window.Quran` global) |
| Tanzil (jsDelivr) | Fallback Quran data |
| Service Worker (ilmualam.pages.dev/sw.js) | PWA/offline support |

---

## Known Issues Fixed (Changelog)
- **Double JSON-LD** — Removed redundant homepage `WebSite+Organization` block from inside `pbt-head`; the global schema after `b:defaultmarkups` (line ~2422) is authoritative for all pages.
- **Search not working** — Fixed: `$w.on("input", ...)` → `t.on("input", ...)` so input events on the search box are captured correctly.
- **Duplicate theme-color** — Removed hard-coded `<meta name='theme-color' content='#249749'>` from top of `<head>`; dynamic one inside `pbt-head` is the correct single source.
- **og:image wrong dimensions** — Changed `resizeImage 1200` to `resizeImage(src, 1200, "1200:630")` for both OG and Twitter image tags to ensure proper 1200×630 crop matches declared width/height metadata.

---

## Development Rules

1. **All changes go in `asset/xml/ilmualam.xml`** — there is no build step; the XML is uploaded directly to Blogger.
2. **Test in Blogger's template editor** before publishing — syntax errors break the entire site.
3. **One `postMeta` includable** — only the one inside `Blog1` widget runs; the `b:defaultmarkup type='Blog'` version is the fallback for other Blog widgets (rarely used).
4. **JSON-LD @ids must be unique per page** — use `#article`, `#breadcrumb`, `#primaryimage` etc. scoped to `data:post.url.canonical`.
5. **All JSON inside `<script type='application/ld+json'>` must use `&quot;` for quotes** in Blogger XML context.
6. **CSS goes inside `<b:skin>` CDATA block** — do not add `<style>` tags elsewhere.
7. **JS goes in the main `<b:tag name='script'>` CDATA block** at end of body — preserve the `//` `<![CDATA[` / `//]]>` wrappers.
8. **Robots**: Search/archive/error pages must remain `noindex` — do not change the robots `b:if` logic.
9. **Images**: Always use `resizeImage(src, width, "ratio")` for OG images to get proper crop.
10. **Dark mode** state is in `localStorage.dark_mode` and CSS class `is-dark` on `<html>`.
