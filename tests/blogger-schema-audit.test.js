'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { extractJsonLd, collectTypes, auditPost, stripHtml } = require('../scripts/blogger-schema-audit.js');

test('extractJsonLd parses valid schema and reports invalid blocks', () => {
  const html = `
    <script type="application/ld+json">{"@type":"FAQPage"}</script>
    <script type="application/ld+json">{"@type":</script>`;
  const blocks = extractJsonLd(html);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].valid, true);
  assert.equal(blocks[1].valid, false);
});

test('collectTypes reads top-level and @graph schema types', () => {
  const schema = {
    '@type': 'WebPage',
    '@graph': [
      { '@type': 'Article' },
      { '@type': ['FAQPage', 'CreativeWork'] }
    ]
  };
  assert.deepEqual(collectTypes(schema), ['WebPage', 'Article', 'FAQPage', 'CreativeWork']);
});

test('auditPost flags embedded Article, duplicate types, shortcode and missing alt', () => {
  const post = {
    id: '1',
    title: 'Example',
    url: 'https://example.com/post',
    content: `
      <h1>Duplicate heading</h1>
      {getToc} $title={Table of Contents}
      <img src="image.jpg">
      <script type="application/ld+json">{"@type":"Article"}</script>
      <script type="application/ld+json">{"@type":"Article"}</script>
    `
  };
  const result = auditPost(post);
  assert.equal(result.embeddedArticleSchemas, 2);
  assert.ok(result.issues.includes('EMBEDDED_ARTICLE_SCHEMA'));
  assert.ok(result.issues.includes('DUPLICATE_SCHEMA_TYPE'));
  assert.ok(result.issues.includes('UNPROCESSED_SHORTCODE'));
  assert.ok(result.issues.includes('H1_INSIDE_POST_BODY'));
  assert.ok(result.issues.includes('IMAGE_ALT_MISSING'));
});

test('stripHtml returns readable text without scripts', () => {
  const text = stripHtml('<p>Hello <strong>world</strong></p><script>bad()</script>');
  assert.equal(text, 'Hello world');
});
