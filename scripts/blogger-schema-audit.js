'use strict';

const fs = require('fs');
const path = require('path');

const API_ROOT = 'https://www.googleapis.com/blogger/v3';
const BLOG_URL = process.env.BLOGGER_BLOG_URL || 'https://www.ilmualam.com/';
const API_KEY = process.env.BLOGGER_API_KEY || '';
const BLOG_ID = process.env.BLOGGER_BLOG_ID || '';
const OUT_DIR = path.resolve(process.env.AUDIT_OUTPUT_DIR || 'reports/blogger-schema-audit');
const MAX_RESULTS = Number(process.env.BLOGGER_MAX_RESULTS || 500);

function decodeEntities(value) {
  return String(value || '')
    .replace(/&quot;/g, '"').replace(/&#34;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function stripHtml(html) {
  return String(html || '').replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function extractJsonLd(html) {
  const blocks = [];
  const re = /<script\b[^>]*type\s*=\s*['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(String(html || '')))) {
    const raw = decodeEntities(match[1]).trim();
    try {
      const parsed = JSON.parse(raw);
      blocks.push({ valid: true, raw, parsed });
    } catch (error) {
      blocks.push({ valid: false, raw, error: error.message });
    }
  }
  return blocks;
}

function collectTypes(value, output = []) {
  if (!value || typeof value !== 'object') return output;
  if (Array.isArray(value)) {
    value.forEach((item) => collectTypes(item, output));
    return output;
  }
  const type = value['@type'];
  if (Array.isArray(type)) output.push(...type.map(String));
  else if (type) output.push(String(type));
  if (Array.isArray(value['@graph'])) collectTypes(value['@graph'], output);
  return output;
}

function countHeadings(html, level) {
  return (String(html || '').match(new RegExp(`<h${level}\\b`, 'gi')) || []).length;
}

function auditPost(post) {
  const html = post.content || '';
  const blocks = extractJsonLd(html);
  const types = blocks.flatMap((block) => block.valid ? collectTypes(block.parsed) : []);
  const counts = types.reduce((acc, type) => ((acc[type] = (acc[type] || 0) + 1), acc), {});
  const articleCount = ['Article', 'BlogPosting', 'NewsArticle'].reduce((n, type) => n + (counts[type] || 0), 0);
  const duplicateTypes = Object.entries(counts).filter(([, count]) => count > 1).map(([type]) => type);
  const text = stripHtml(html);
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const missingAlt = images.filter((tag) => !/\balt\s*=\s*['"][^'"]+['"]/i.test(tag)).length;
  const shortcodes = [...html.matchAll(/\{(?:getToc|toc|tableOfContents)[^}]*\}/gi)].map((m) => m[0]);

  return {
    id: post.id,
    title: post.title || '',
    url: post.url || '',
    published: post.published || '',
    updated: post.updated || '',
    labels: post.labels || [],
    jsonLdBlocks: blocks.length,
    invalidJsonLdBlocks: blocks.filter((b) => !b.valid).length,
    schemaTypes: [...new Set(types)],
    duplicateTypes,
    embeddedArticleSchemas: articleCount,
    likelyDuplicateArticleWithTheme: articleCount > 0,
    embeddedBreadcrumbSchemas: counts.BreadcrumbList || 0,
    embeddedFaqSchemas: counts.FAQPage || 0,
    embeddedHowToSchemas: counts.HowTo || 0,
    h1Count: countHeadings(html, 1),
    h2Count: countHeadings(html, 2),
    wordCount: text ? text.split(/\s+/).length : 0,
    imageCount: images.length,
    imagesMissingAlt: missingAlt,
    brokenShortcodes: shortcodes,
    issues: [
      ...(articleCount > 0 ? ['EMBEDDED_ARTICLE_SCHEMA'] : []),
      ...(duplicateTypes.length ? ['DUPLICATE_SCHEMA_TYPE'] : []),
      ...(blocks.some((b) => !b.valid) ? ['INVALID_JSON_LD'] : []),
      ...(shortcodes.length ? ['UNPROCESSED_SHORTCODE'] : []),
      ...(countHeadings(html, 1) > 0 ? ['H1_INSIDE_POST_BODY'] : []),
      ...(missingAlt > 0 ? ['IMAGE_ALT_MISSING'] : [])
    ]
  };
}

async function apiGet(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Blogger API ${response.status}: ${await response.text()}`);
  return response.json();
}

async function resolveBlogId() {
  if (BLOG_ID) return BLOG_ID;
  if (!API_KEY) throw new Error('Set BLOGGER_BLOG_ID or BLOGGER_API_KEY. The audit is read-only.');
  const url = `${API_ROOT}/blogs/byurl?url=${encodeURIComponent(BLOG_URL)}&key=${encodeURIComponent(API_KEY)}`;
  const blog = await apiGet(url);
  return blog.id;
}

async function fetchPosts(blogId) {
  if (!API_KEY) throw new Error('BLOGGER_API_KEY is required for the read-only posts audit.');
  const posts = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({ key: API_KEY, fetchBodies: 'true', status: 'live', maxResults: '500' });
    if (pageToken) params.set('pageToken', pageToken);
    const page = await apiGet(`${API_ROOT}/blogs/${encodeURIComponent(blogId)}/posts?${params}`);
    posts.push(...(page.items || []));
    pageToken = page.nextPageToken || '';
  } while (pageToken && posts.length < MAX_RESULTS);
  return posts.slice(0, MAX_RESULTS);
}

function csvEscape(value) {
  const string = Array.isArray(value) ? value.join('|') : String(value ?? '');
  return /[",\n]/.test(string) ? `"${string.replace(/"/g, '""')}"` : string;
}

function writeReports(rows, blogId) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const fields = ['id','title','url','published','jsonLdBlocks','invalidJsonLdBlocks','schemaTypes','duplicateTypes','embeddedArticleSchemas','embeddedBreadcrumbSchemas','embeddedFaqSchemas','embeddedHowToSchemas','h1Count','h2Count','wordCount','imageCount','imagesMissingAlt','brokenShortcodes','issues'];
  const csv = [fields.join(','), ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(','))].join('\n');
  fs.writeFileSync(path.join(OUT_DIR, 'audit.csv'), csv);
  fs.writeFileSync(path.join(OUT_DIR, 'audit.json'), JSON.stringify({ generatedAt: new Date().toISOString(), blogId, blogUrl: BLOG_URL, posts: rows }, null, 2));

  const issueCounts = rows.flatMap((r) => r.issues).reduce((acc, issue) => ((acc[issue] = (acc[issue] || 0) + 1), acc), {});
  const summary = [
    '# Blogger Schema & SERP Audit', '',
    `Generated: ${new Date().toISOString()}`,
    `Blog: ${BLOG_URL}`,
    `Posts audited: ${rows.length}`, '',
    '## Issue totals', '',
    ...Object.entries(issueCounts).sort((a,b) => b[1]-a[1]).map(([issue,count]) => `- **${issue}:** ${count}`), '',
    '## Highest-priority posts', '',
    ...rows.filter((r) => r.issues.length).slice(0, 100).map((r) => `- [${r.title}](${r.url}) — ${r.issues.join(', ')}`), '',
    '> Read-only audit: no Blogger post, page, draft, comment, label or theme was modified.'
  ].join('\n');
  fs.writeFileSync(path.join(OUT_DIR, 'SUMMARY.md'), summary);
}

async function main() {
  const blogId = await resolveBlogId();
  const posts = await fetchPosts(blogId);
  const rows = posts.map(auditPost).sort((a, b) => b.issues.length - a.issues.length);
  writeReports(rows, blogId);
  console.log(`Audited ${rows.length} posts. Reports: ${OUT_DIR}`);
}

if (require.main === module) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}

module.exports = { extractJsonLd, collectTypes, auditPost, stripHtml };
