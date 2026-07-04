# LIVE_SITE_VERIFICATION

Date: 2026-07-04  
Target site: https://www.ilmualam.com

Use this checklist before any remediation deployment and again after deployment.

## Sampling matrix

- [ ] Homepage (`/`)
- [ ] One article URL
- [ ] One static page URL (`/p/...`)
- [ ] One label page URL (`/search/label/...`)
- [ ] One search page URL (`/search?q=...`)
- [ ] One archive page URL

Contexts:
- [ ] Desktop viewport
- [ ] Mobile viewport
- [ ] Logged-out/incognito session

## Technical SEO output checks (per sampled URL)

### Canonical and robots
- [ ] Confirm exactly one canonical in rendered HTML and it is the intended final URL
- [ ] Confirm robots meta is correct for page type
- [ ] Confirm search/archive/error pages remain `noindex, follow`
- [ ] Confirm indexable pages are not accidentally `noindex`

### Rendered HTML/schema
- [ ] Capture fully rendered HTML snapshot (post-JS) and initial HTML
- [ ] Validate JSON-LD output in Rich Results Test
- [ ] Validate schema in Schema Markup Validator
- [ ] Confirm no duplicate critical `@id` collisions in effective schema graph
- [ ] Confirm article pages emit expected Article metadata (headline, dates, image)
- [ ] Confirm label pages emit expected CollectionPage/ItemList schema when applicable

### Navigation/UI integrity
- [ ] Menu opens/closes correctly (desktop + mobile)
- [ ] Thumbnails render correctly (featured/list/related/search)
- [ ] Related posts load without console errors
- [ ] Share buttons work and build valid URLs
- [ ] Breadcrumbs render correctly and link correctly
- [ ] Comments widget loads correctly
- [ ] Ads render without major layout jumps
- [ ] Cookie/banner behavior does not obstruct critical content

### JavaScript/runtime quality
- [ ] No critical console errors
- [ ] No repeated null-element exceptions
- [ ] Search modal (open, close, input debounce, view-all link) works correctly

## Performance and CWV verification

- [ ] Run Lighthouse (desktop) on homepage + article + label
- [ ] Run Lighthouse (mobile) on homepage + article + label
- [ ] Run PageSpeed Insights for representative affected URLs
- [ ] Capture LCP element and waterfall for mobile-affected URLs
- [ ] Capture CLS shift sources for desktop-affected URLs

## Google tool verification

- [ ] Run Rich Results Test for homepage + article + label
- [ ] Run Schema Markup Validator for homepage + article + label
- [ ] Run GSC URL Inspection for sampled URLs (live test + indexed status)
- [ ] Confirm sitemap submission status remains healthy

## Post-deploy validation (if fixes are later deployed)

- [ ] Compare before/after rendered canonical and robots outputs
- [ ] Compare before/after schema output and errors
- [ ] Re-check UI components (menu/search/related/comments/share/ads)
- [ ] Monitor GSC coverage deltas for 2–4 weeks
- [ ] Submit GSC validation requests only for issues with confirmed implemented fixes
