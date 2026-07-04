# Safe Blogger Schema Cleanup

This tool removes only embedded `Article`, `BlogPosting`, and `NewsArticle` JSON-LD from post bodies while preserving unrelated schema such as `FAQPage`, `HowTo`, `VideoObject`, and `WebApplication`.

## Safety defaults

- Dry-run is the default.
- Maximum 5 posts per first apply.
- Every selected post gets `.before.html` and `.after.html` files.
- A `manifest.json` records each proposed or applied change.
- Apply mode is blocked unless `--confirm-blog-id` exactly matches `BLOGGER_BLOG_ID`.
- Invalid JSON-LD is left untouched.
- The tool uses PATCH and changes only the post `content` field.

## Required GitHub Secrets for OAuth

Add these repository secrets:

- `BLOGGER_BLOG_ID`
- `BLOGGER_CLIENT_ID`
- `BLOGGER_CLIENT_SECRET`
- `BLOGGER_REFRESH_TOKEN`

The OAuth consent must grant:

```text
https://www.googleapis.com/auth/blogger
```

Never paste OAuth secrets into source files, issues, pull requests, logs, or chat.

## Dry-run locally

```bash
npm run cleanup:blogger:dry-run
```

Target exact post IDs:

```bash
npm run cleanup:blogger -- --post-ids=POST_ID_1,POST_ID_2 --max=2
```

## First apply

Review every `.before.html`, `.after.html`, and `manifest.json` file first. Then run no more than five posts:

```bash
npm run cleanup:blogger -- --apply --max=5 --confirm-blog-id=YOUR_BLOG_ID
```

For safest testing, use explicit IDs:

```bash
npm run cleanup:blogger -- --apply --post-ids=POST_ID_1,POST_ID_2 --max=2 --confirm-blog-id=YOUR_BLOG_ID
```

## Verification after apply

For each changed post:

1. Open the live post and confirm content/layout are unchanged.
2. View rendered source and confirm only one article schema remains.
3. Check FAQ/HowTo/Video schema still exists where relevant.
4. Test with Google Rich Results Test.
5. Keep the generated backup artifact until verification is complete.

Do not process the remaining posts until the first test batch passes all checks.
