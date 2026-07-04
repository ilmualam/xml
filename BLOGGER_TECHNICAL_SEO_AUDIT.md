# BLOGGER_TECHNICAL_SEO_AUDIT

Date: 2026-07-04  
Repository: `tbbcom/xml`  
Template audited: `/home/runner/work/xml/xml/asset/xml/ilmualam.xml`

## 1. Executive summary

- **Overall technical SEO health score:** **78/100**
- **Overall risk level:** **Medium**
- **Top critical findings:**
  1. High duplicate/excluded index coverage signals in GSC (`Alternate canonical`, `Duplicate without user-selected canonical`) require URL-sample verification before any template change.
  2. Desktop CLS issue affects 278 URLs and mobile LCP issue affects 49 URLs; template has several potential contributors (ads, heavy third-party scripts, fixed header transitions) but no single confirmed root cause from repository-only evidence.
  3. XML validator reports many duplicate static HTML IDs and duplicate meta-name warnings in template source context (likely due Blogger `b:defaultmarkup` duplication model), requiring rendered HTML verification before classifying as defects.
- **Top high-impact opportunities:**
  1. Add automated regression checks for canonical/robots/schema consistency.
  2. Add rendered-page smoke checks for noindex/canonical/schema across homepage/post/page/label/search/archive.
  3. Add CWV guardrails (image dimensions and ad-slot reservation checks) in CI.
- **What can be fixed safely (after separate remediation task):**
  - Add/expand repository-level SEO lint tests and CI checks.
  - Add audit-backed guardrails for accidental regressions (canonical/noindex/schema/HTTPS assets).
- **What requires live-site verification:**
  - Canonical selection outcomes for duplicate clusters.
  - Real CLS/LCP root causes from field/lab traces.
  - Rendered schema output and potential duplicate entities in production HTML.
- **Outside Blogger XML scope:**
  - Google indexing decisions (`Crawled/Discovered - currently not indexed`).
  - External redirect/server behavior, DNS/HTTPS infrastructure, and GSC processing lag.
  - Content quality, internal-link quality from older published posts.

---

## 2. GSC evidence mapping

Evidence reviewed from `/home/runner/work/xml/xml/asset/audit-input/`:
- `README.md`
- `Critical issues.csv`
- `Non-critical issues.csv`
- `Metadata.csv`
- `coverage-all-known-pages.csv`
- `coverage-sitemap-only.csv`
- `cwv-mobile.csv`
- `cwv-desktop.csv`
- `https-summary.csv`
- `performance-devices.csv`
- `performance-search-appearance.csv`
- `Chart.csv`

| GSC issue | Affected pages | Evidence file | Likely cause | Template-related? | Confidence | Priority | Recommended next step |
|---|---:|---|---|---|---|---|---|
| Alternate page with proper canonical tag | 645 | `coverage-all-known-pages.csv` | **Expected Blogger behavior** for duplicate variants/pagination/mobile variants unless sample URLs show canonical mismatch | Possibly, not confirmed | Medium | Medium | Pull URL samples from GSC and compare rendered canonical/hreflang/redirect behavior per template type |
| Duplicate without user-selected canonical | 156 | `coverage-all-known-pages.csv` | **Insufficient evidence**; could be internal duplication, weak canonical signals, or URL-parameter variants | Possibly, not confirmed | Medium | High | Collect representative URL pairs and inspect rendered canonical, internal links, and sitemap consistency |
| Not found (404) | 121 | `coverage-all-known-pages.csv` | **Content issue / internal linking issue / external links** likely from removed URLs | Not directly proven | High | High | Export URL list, segment by source links, fix internal links and optionally restore or redirect key pages |
| Page with redirect | 75 | `coverage-all-known-pages.csv` | **Expected Blogger behavior** in many cases (legacy URLs, normalized URLs) | Usually external/platform | Medium | Low | Verify redirect chains and ensure canonical points to final destination |
| Excluded by noindex tag | 5 | `coverage-all-known-pages.csv` | **Likely expected policy** (`data:view.search.query` or `data:view.isArchive` set to noindex) | Yes (intentional logic present) | High | Low | Validate these URLs are search/archive/error and should remain excluded |
| Crawled - currently not indexed | 83 | `coverage-all-known-pages.csv` | **Content/indexing quality or internal linking**; not proof of technical defect | Usually non-template | Medium | Medium | Audit affected pages for uniqueness, links, freshness, and thin/duplicate content patterns |
| Discovered - currently not indexed | 20 (validation passed) | `coverage-all-known-pages.csv`, `coverage-sitemap-only.csv` | **Already resolved / stale GSC history** per passed validation | Not currently actionable | High | Low | Keep as historical note; monitor trend before any change |
| Redirect error | 0 | `coverage-all-known-pages.csv`, `coverage-sitemap-only.csv` | **No active issue** | N/A | High | None | No action; keep monitoring |
| Blocked by robots.txt | 0 | `coverage-all-known-pages.csv`, `coverage-sitemap-only.csv` | **No active issue** | N/A | High | None | No action; keep monitoring |
| Mobile LCP over 2.5s | 49 URLs | `cwv-mobile.csv` | **Requires live verification**; plausible contributors: multiple third-party scripts in `<head>`, ad scripts, image loading priorities | Possible | Medium | High | Run PSI/Lighthouse + CrUX URL-level checks on affected templates, correlate with rendered waterfall |
| Desktop CLS over 0.1 | 278 URLs | `cwv-desktop.csv` | **Requires live verification**; plausible contributors: dynamic ad insertion, sticky header transition, late content injections | Possible | Medium | High | Run CLS session traces on sample URLs, verify ad-slot reservation and dynamic component behavior |
| HTTPS status | 0 issues | `https-summary.csv` | **No active issue** | N/A | High | None | No action |
| Device performance differences | Mobile: 4,907 clicks / pos 4.73; Desktop: 714 clicks / pos 15.57 | `performance-devices.csv` | **Mixed behavior, not a defect by itself**; device UX/performance/content intent differences | Indirect | Medium | Medium | Validate mobile/desktop rendering parity, CWV differences, and SERP snippet consistency |

### Classification summary (required classes)
- **Expected Blogger behavior:** alternate canonical, many redirects, noindex on search/archive.
- **Content issue / internal linking issue:** most 404 and part of crawled-not-indexed.
- **External/platform issue:** Google indexing state and redirect processing.
- **Stale GSC data / already resolved:** discovered-not-indexed passed validation.
- **Insufficient evidence / requires live verification:** duplicate canonical cluster root causes and CWV root causes.
- **Confirmed template defect:** none proven from provided evidence only.

---

## 3. Blogger XML technical audit

File audited: `/home/runner/work/xml/xml/asset/xml/ilmualam.xml`

### Canonical and indexing directives
- Canonical tag present and centralized: `<link expr:href='data:view.url.canonical' rel='canonical'/>` (line ~1309).
- No duplicate `rel='canonical'` found in source (count: 1).
- Homepage/post/static/label/search/archive canonical behavior depends on Blogger `data:view.url.canonical`; no hardcoded conflicting canonical found.
- No explicit `?m=1` canonical handling found; relies on Blogger canonical object (acceptable, requires rendered verification).
- Robots logic present:
  - `noindex, follow` when `data:view.isError or data:view.search.query or data:view.isArchive` (line ~28-31).
  - `index, follow` for other views.
- Policy aligns with instruction to keep search/archive/error excluded.

### Duplicate canonicals / homepage/post/page/label/search/archive
- Source-level single canonical implementation is clean.
- Must still verify rendered outputs for each page type in live environment.

### Redirect logic
- No explicit HTTP redirect rules in template (expected for Blogger template scope).
- Pagination rel links exist (`rel='next'`, `rel='prev'`) using Blogger navigation objects.

### Titles/meta descriptions/metadata
- Dynamic title and meta description configured (`data:view.title.escaped`, `data:view.description`).
- No direct evidence of malformed title/description expressions in source.
- XML lint warning flags duplicate static `meta name` values (`robots`, `twitter:image`, `twitter:image:alt`) due template-level conditional structures; rendered-page verification needed to confirm if duplicates coexist in final HTML.

### Open Graph / Twitter
- OG/Twitter implemented with dynamic canonical URL and resized 1200x630 image crops.
- `og:type` conditional by page type is present.
- Article date metadata present for post context.

### hreflang
- `ms-MY` and `x-default` alternates present and both point to canonical URL object.
- No multi-language alternate matrix beyond these two declarations.

### Structured data
- JSON-LD blocks exist for:
  - Global `Organization` + `WebSite` + `WebPage` (line ~2556).
  - Post `Article` (+ `ImageObject`, `Person`, refs to organization/website) (line ~2101 and repeated in fallback markup).
  - Label pages `CollectionPage` + `ItemList` (line ~2170 and repeated fallback).
- `SearchAction` present in `WebSite` entity.
- No FAQPage/HowTo JSON-LD found in source (not required unless content type supports it).
- Linter reports dynamic-expression JSON-LD blocks skipped (expected with Blogger templating).
- Potential duplicate schema entity definitions across default markups are likely template fallback behavior, but rendered verification is required to ensure single effective output per page.

### Invalid expressions, malformed dates/URLs
- Automated checks passed (`npm run validate`) with warnings only.
- No fatal malformed XML/Blogger expression parse errors detected.
- Date expressions use Blogger ISO8601 fields for publish/modify.

---

## 4. Core Web Vitals audit

### Mobile LCP (49 affected URLs)
**Evidence-backed potential contributors in template (not confirmed root cause):**
1. Multiple third-party preconnects and scripts in/near head (`live.demand.supply`, AdSense, external assets).
2. Heavy main script payload in a large inline/minified block (line ~3794).
3. Above-the-fold sections (`featured`, hero cards, ad containers) rely on dynamic content and images.
4. Search/featured/related content fetching can add network and main-thread work.

**What is not proven from repository-only evidence:**
- Which specific element is LCP on affected URLs.
- Whether featured image loading priority is incorrect on live pages.
- Whether render-blocking chains are the dominant bottleneck for affected templates.

### Desktop CLS (278 affected URLs)
**Evidence-backed potential contributors (not confirmed root cause):**
1. Ad containers include dynamic ad injection (`adsbygoogle`, demand-supply widgets).
2. Sticky header uses transition and position changes (`.header-inner.is-fixed.show`).
3. Dynamic widgets and JS-inserted content (search results, related posts, sitemap engine, cookie consent visibility).
4. Some links/components use placeholder anchors and JS behavior that can affect interaction-driven layout state.

**What is not proven from repository-only evidence:**
- Exact shifting nodes captured in CrUX for affected URLs.
- Whether CLS is primarily ad-slot, image, font, or script-insertion driven on production.

---

## 5. JavaScript and UI safety audit

### Findings
- jQuery dependency is explicit and central (`cdnjs` jQuery load at ~3790).
- Main script includes broad global behavior in one very large minified block (line ~3794), increasing regression risk.
- Search behavior:
  - Main script uses input-bound debounce (`t.on("input", ...)`) and URL-safe query encoding.
  - Secondary “Live Search JSONP override” unbinds/rebinds input handlers (`$input.off("input").on("input", ...)`), which can conflict if initialization order changes.
- Global variables/functions exist in inline scripts (expected in template-style architecture but increases collision risk).
- Script blocks generally include guard checks (e.g., modal/container existence checks in override scripts), reducing null-element crash risk.
- Scripts run on pages where matching containers exist; some blocks still load globally and then return early.

### Risk statement
- No directly proven fatal JS defect in repository-only review.
- Medium risk of behavior coupling between main script and override search script due event rebinding strategy.

---

## 6. XML integrity audit

### Checks performed
- `npm test` passed (6/6).
- `npm run validate` passed with warnings only.
- Blogger namespace declaration present and correct.
- XML is parseable and well-formed by repository validator.
- No duplicate `b:section` IDs (scripted check).
- No duplicate `b:widget` IDs (scripted check).
- Duplicate `b:includable` IDs exist across default markup/fallback contexts (common in Blogger template architecture).

### Validator warnings (non-fatal)
1. Duplicate static HTML IDs detected in source (many).
2. Duplicate static meta names detected (`robots`, `twitter:image`, `twitter:image:alt`) in source.
3. JSON-LD dynamic blocks skipped from strict JSON parsing due Blogger expressions.

### Integrity conclusion
- **No confirmed XML-breaking defects.**
- Warnings require rendered HTML verification before classifying as production defects.

---

## 7. Prioritized remediation plan

> This is planning only; no production fixes implemented in this task.

### Group A — Confirmed critical defects
No confirmed critical template defects were proven by the provided evidence and repository-only inspection.

### Group B — Safe high-impact fixes (automation/testing first)

| Issue | Exact file | Exact XML area/component | Evidence | Expected benefit | Implementation risk | Test method | Rollback method | GSC validation request needed? |
|---|---|---|---|---|---|---|---|---|
| Missing automated canonical/noindex regression checks | `/home/runner/work/xml/xml/tests/test.js` (new tests), `/home/runner/work/xml/xml/scripts/xml-lint.js` (possible expansion) | N/A (test harness) | Current tests do not assert canonical/noindex behavior | Prevent accidental SEO regressions before deploy | Low | Add parser-based assertions + CI run | Revert test commit | No |
| Missing schema ID uniqueness guardrails | same as above | JSON-LD validation pipeline | Current lint skips dynamic JSON-LD parse blocks | Early detection of duplicate/conflicting schema patterns | Low-Medium | Static schema-pattern assertions + snapshot tests | Revert test commit | No |
| Missing href/image-dimension hygiene checks | same as above | XML lint checks | Placeholder `href="#"` and dynamic image rendering patterns present | Reduce crawl waste/UX regressions | Low | Add non-blocking lint warnings first | Revert lint rule | No |

### Group C — Requires live-site verification before any XML change

| Issue | Exact file | Exact XML area/component | Evidence | Expected benefit | Implementation risk | Test method | Rollback method | GSC validation request needed? |
|---|---|---|---|---|---|---|---|---|
| Duplicate without user-selected canonical (156) | `/home/runner/work/xml/xml/asset/xml/ilmualam.xml` | Canonical/hreflang/meta output sections (~28-35, ~1309) | GSC coverage export | Better canonical consolidation | Medium-High (can deindex valid pages if wrong) | URL Inspection + rendered HTML diff on samples | Revert template upload | Yes (after confirmed fix) |
| Mobile LCP issue (49) | same | head scripts/preconnect/fonts, featured section, image output, ad scripts | CWV mobile export | Better mobile UX and ranking resilience | Medium | PSI + Lighthouse trace + CrUX verification per template type | Revert performance patch | Yes (CWV validation) |
| Desktop CLS issue (278) | same | ad blocks, sticky header, dynamic injections | CWV desktop export | Reduced layout instability | Medium | Lighthouse CLS trace + DevTools layout shift regions + field monitoring | Revert visual/JS patch | Yes (CWV validation) |

### Group D — External or non-template issues

| Issue | Exact file | Exact XML area/component | Evidence | Expected benefit | Implementation risk | Test method | Rollback method | GSC validation request needed? |
|---|---|---|---|---|---|---|---|---|
| Not found (404) URLs (121) likely from removed pages/links | N/A | N/A | GSC coverage export | Recover crawl efficiency and user paths | Medium (redirect mapping mistakes) | Crawl + internal-link source mapping | Revert redirect/content updates | Yes (if resolved URLs) |
| Crawled/Discovered currently not indexed | N/A | N/A | GSC coverage exports | Better indexing consistency | Medium | Content quality/internal-link audits | Revert content/site-structure changes | Optional |
| GSC lag/stale state for passed discovered-not-indexed | N/A | N/A | `Passed` validation state | Avoid unnecessary template churn | Low | Time-based monitoring | N/A | No |

---

## 8. Regression test recommendations (do not implement yet)

Add automated checks for:
1. Canonical consistency by page-type conditions (homepage/post/page/label/search/archive/error).
2. Robots/noindex logic to prevent accidental indexing of search/archive/error.
3. Duplicate metadata names in rendered effective branch outputs.
4. Malformed Blogger expressions (`b:if` missing cond, malformed expr syntax).
5. Unsafe JSON-LD patterns and duplicate schema IDs (`@id`) within effective output.
6. Duplicate static IDs with severity tuned for Blogger defaultmarkups.
7. HTTPS-only asset URLs.
8. Missing image dimensions/aspect-ratio risks in post/featured/related cards.
9. Invalid internal `href` values (placeholder anchors outside intentional JS controls).
10. Canonical/robots conflict detection (e.g., index + conflicting canonical/noindex combinations).

---

## 9. Live-site verification checklist

Detailed checklist is provided in:
- `/home/runner/work/xml/xml/LIVE_SITE_VERIFICATION.md`

---

## Appendix — Commands and outputs used

- `npm ci`
- `npm test` (passed 6/6)
- `npm run validate` (passed with warnings)
- Targeted repository scans (`rg`, `view`, scripted duplicate-ID checks)

This audit is evidence-based and intentionally does **not** implement production fixes.
