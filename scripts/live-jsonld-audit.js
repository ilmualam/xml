'use strict';

const fs = require('fs');
const path = require('path');

const URLS = (process.env.AUDIT_URLS || 'https://www.ilmualam.com/2026/03/surah-al-kautsar.html')
  .split(',').map((value) => value.trim()).filter(Boolean);
const OUT_DIR = path.resolve(process.env.LIVE_AUDIT_OUTPUT_DIR || 'reports/live-jsonld-audit');

function decodeEntities(value) {
  return String(value || '')
    .replace(/&quot;/g, '"').replace(/&#34;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function inspectHtml(html) {
  const source = String(html || '');
  const jsonLdOpenings = [...source.matchAll(/<script\b[^>]*type\s*=\s*['"]application\/ld\+json['"][^>]*>/gi)];
  const allScriptOpenings = (source.match(/<script\b/gi) || []).length;
  const allScriptClosings = (source.match(/<\/script\s*>/gi) || []).length;
  const blocks = [];
  const re = /<script\b[^>]*type\s*=\s*['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script\s*>/gi;
  let match;
  while ((match = re.exec(source))) {
    const raw = decodeEntities(match[1]).trim();
    try {
      const parsed = JSON.parse(raw);
      blocks.push({ valid: true, type: parsed && parsed['@type'] || null, rawLength: raw.length });
    } catch (error) {
      blocks.push({ valid: false, error: error.message, rawPreview: raw.slice(0, 1000) });
    }
  }
  return {
    jsonLdOpeningCount: jsonLdOpenings.length,
    jsonLdClosedBlockCount: blocks.length,
    unterminatedJsonLdCount: Math.max(0, jsonLdOpenings.length - blocks.length),
    allScriptOpenings,
    allScriptClosings,
    scriptTagImbalance: allScriptOpenings - allScriptClosings,
    invalidJsonLdCount: blocks.filter((block) => !block.valid).length,
    blocks
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const results = [];
  for (const url of URLS) {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IlmuAlamSchemaAudit/1.0)' }
    });
    const html = await response.text();
    const report = {
      url,
      status: response.status,
      contentType: response.headers.get('content-type') || '',
      fetchedAt: new Date().toISOString(),
      ...inspectHtml(html)
    };
    results.push(report);
    const slug = new URL(url).pathname.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.html`), html);
  }
  fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify({ results }, null, 2));
  const failed = results.some((item) => item.unterminatedJsonLdCount || item.scriptTagImbalance || item.invalidJsonLdCount);
  console.log(JSON.stringify(results, null, 2));
  if (failed) process.exitCode = 2;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = { inspectHtml, decodeEntities };
