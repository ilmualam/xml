'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { removeArticleNodes, cleanJsonLd, parseArgs } = require('../scripts/blogger-schema-cleanup.js');

test('removes standalone Article schema block', () => {
  const html = '<p>Hello</p><script type="application/ld+json">{"@type":"Article","headline":"X"}</script>';
  const result = cleanJsonLd(html);
  assert.equal(result.changes.length, 1);
  assert.equal(result.cleanedHtml.includes('Article'), false);
  assert.equal(result.cleanedHtml.includes('<p>Hello</p>'), true);
});

test('preserves FAQPage while removing Article from object graph', () => {
  const input = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Article', headline: 'X' },
      { '@type': 'FAQPage', mainEntity: [] }
    ]
  };
  const cleaned = removeArticleNodes(input);
  assert.equal(cleaned['@graph'].length, 1);
  assert.equal(cleaned['@graph'][0]['@type'], 'FAQPage');
});

test('leaves invalid JSON-LD unchanged', () => {
  const html = '<script type="application/ld+json">{"@type":</script>';
  const result = cleanJsonLd(html);
  assert.equal(result.cleanedHtml, html);
  assert.equal(result.changes.length, 0);
});

test('preserves empty arrays in non-removed schema', () => {
  const input = {
    '@type': 'FAQPage',
    mainEntity: []
  };
  const cleaned = removeArticleNodes(input);
  assert.deepEqual(cleaned, { '@type': 'FAQPage', mainEntity: [] });
});

test('leaves mixed schema script unchanged and flags manual review', () => {
  const html = '<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Article","headline":"X"},{"@type":"FAQPage","mainEntity":[]}]}</script>';
  const result = cleanJsonLd(html);
  assert.equal(result.cleanedHtml, html);
  assert.equal(result.changes.length, 1);
  assert.equal(result.changes[0].action, 'manual-review');
});

test('defaults to dry-run and five posts', () => {
  const args = parseArgs(['node', 'script']);
  assert.equal(args.apply, false);
  assert.equal(args.max, 5);
});
