# Blogger API Schema Audit Setup

This repository includes a **read-only** audit for embedded JSON-LD, duplicate schema signals, broken TOC shortcodes and basic on-page SEO hygiene.

## What it does

- Reads published posts through Blogger API v3.
- Detects embedded `Article`, `BlogPosting`, `NewsArticle`, `BreadcrumbList`, `FAQPage`, `HowTo` and other JSON-LD types.
- Flags invalid JSON-LD, repeated schema types, post-body H1 tags, images without useful `alt`, and unprocessed TOC shortcodes.
- Creates CSV, JSON and Markdown reports under `reports/blogger-schema-audit/`.
- Never sends POST, PUT, PATCH or DELETE requests.

## Google Cloud setup

1. Open Google Cloud Console and create or select a project.
2. Enable **Blogger API v3**.
3. Create an API key.
4. Restrict the key to Blogger API where practical.
5. Do not commit the key to this repository.

For this read-only public-post audit, OAuth credentials are not required. OAuth will only be introduced later for a separate backup-and-cleanup workflow after audit review.

## GitHub repository secrets

Add these under **Settings → Secrets and variables → Actions**:

- `BLOGGER_API_KEY` — required.
- `BLOGGER_BLOG_ID` — recommended. The numeric Blog ID from Blogger settings or API.
- `BLOGGER_BLOG_URL` — optional; defaults to `https://www.ilmualam.com/`.

## Run locally

```bash
BLOGGER_API_KEY="your-key" \
BLOGGER_BLOG_ID="your-blog-id" \
npm run audit:blogger
```

Windows PowerShell:

```powershell
$env:BLOGGER_API_KEY="your-key"
$env:BLOGGER_BLOG_ID="your-blog-id"
npm run audit:blogger
```

Optional limit for testing:

```bash
BLOGGER_MAX_RESULTS=20 npm run audit:blogger
```

## Run with GitHub Actions

Open **Actions → Blogger Schema & SERP Audit → Run workflow**. The generated report is uploaded as a workflow artifact. The workflow does not commit report data and cannot modify Blogger content.

## Interpreting key findings

- `EMBEDDED_ARTICLE_SCHEMA`: likely overlaps with the theme-generated Article schema; review before removal.
- `DUPLICATE_SCHEMA_TYPE`: the same schema type appears more than once in the post body.
- `INVALID_JSON_LD`: JSON parsing failed; fix manually or through a reviewed cleanup plan.
- `UNPROCESSED_SHORTCODE`: old TOC shortcode appears visibly in content.
- `H1_INSIDE_POST_BODY`: Blogger/theme already supplies the page H1 in most cases.
- `IMAGE_ALT_MISSING`: at least one image has no non-empty alt attribute.

## Safety policy

Do not bulk-edit posts from this report automatically. First review samples in Rich Results Test and compare body schema against rendered theme schema. Any future cleanup tool must provide full backups, dry-run output, batch limits and explicit confirmation before write access is enabled.
