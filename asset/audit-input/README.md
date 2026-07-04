# Google Search Console Evidence — ilmualam.com

Report date: 2026-07-04
Search performance window: Last 3 months
Source: Google Search Console exports supplied by the site owner

## Evidence summary

### Page indexing — all known pages

| Reason | Pages | Validation | Initial interpretation |
|---|---:|---|---|
| Alternate page with proper canonical tag | 645 | Not Started | Usually expected for duplicates/mobile variants; verify patterns before changing canonicals. |
| Duplicate without user-selected canonical | 156 | Not Started | High-priority canonical investigation. Requires URL samples before any XML change. |
| Not found (404) | 121 | Not Started | Likely removed/broken URLs or internal-link issues; not automatically a template defect. |
| Page with redirect | 75 | Not Started | Often expected; inspect redirect targets and chains. |
| Excluded by `noindex` tag | 5 | Not Started | Must verify whether search/label/archive pages are intentionally noindexed. |
| Crawled — currently not indexed | 83 | Not Started | Usually content/duplication/internal-linking quality issue; may involve template signals. |
| Discovered — currently not indexed | 20 | Passed | Google reports validation passed; preserve as historical evidence. |
| Redirect error | 0 | N/A | No affected URLs in this export. |
| Blocked by robots.txt | 0 | N/A | No affected URLs in this export. |

### Sitemap-only indexing export

The submitted sitemap export reports 2 URLs as `Crawled - currently not indexed`, 20 historical `Discovered - currently not indexed` URLs with passed validation, and zero redirect/robots errors.

### Core Web Vitals

| Device | Issue | URLs | Validation |
|---|---|---:|---|
| Mobile | LCP longer than 2.5s | 49 | Not Started |
| Mobile | INP longer than 200ms | 0 | N/A |
| Desktop | CLS greater than 0.1 | 278 | Not Started |
| Desktop | LCP longer than 2.5s | 0 | N/A |

### HTTPS

The HTTPS export contains no active issue rows.

### Search performance snapshot

| Device | Clicks | Impressions | CTR | Average position |
|---|---:|---:|---:|---:|
| Mobile | 4,907 | 296,809 | 1.65% | 4.73 |
| Desktop | 714 | 33,163 | 2.15% | 15.57 |
| Tablet | 88 | 6,203 | 1.42% | 4.82 |

## Audit instructions

Treat these files as evidence, not automatic proof of a template defect.

Before editing `asset/xml/ilmualam.xml`:

1. Map every issue to affected URL patterns and exact rendered output.
2. Separate expected Blogger duplicate/canonical behaviour from genuine defects.
3. Do not change canonical, robots, `noindex`, redirects, sitemap logic, schema, ads, analytics, widget IDs, section IDs, layout, or production URLs without confirmed evidence.
4. Create `BLOGGER_TECHNICAL_SEO_AUDIT.md` first.
5. Keep any remediation PR in draft and do not merge automatically.

Duplicate ZIP exports were consolidated; no production XML files were changed.
