'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { lintXML, parseXML } = require('../scripts/xml-lint.js');

const FIXTURES = path.join(__dirname, 'fixtures');
const PRODUCTION_TEMPLATE = path.join(__dirname, '..', 'asset', 'xml', 'ilmualam.xml');

function loadFixture(name) {
    return fs.readFileSync(path.join(FIXTURES, name), 'utf8');
}

function loadProductionTemplate() {
    return fs.readFileSync(PRODUCTION_TEMPLATE, 'utf8').replace(/^\uFEFF/, '');
}

function countMatches(source, pattern) {
    return (source.match(pattern) || []).length;
}

test('valid.xml — passes with no errors', () => {
    const { errors } = lintXML(loadFixture('valid.xml'));
    assert.deepEqual(errors, [], `Expected no errors, got: ${JSON.stringify(errors)}`);
});

test('malformed.xml — reports XML parse errors', () => {
    const { errors } = lintXML(loadFixture('malformed.xml'));
    assert.ok(errors.length > 0, 'Expected at least one error for malformed XML');
    const hasParseError = errors.some((e) => e.toLowerCase().includes('xml'));
    assert.ok(hasParseError, `Expected an XML parse error, got: ${JSON.stringify(errors)}`);
});

test('missing-condition.xml — reports b:if without cond attribute', () => {
    const { errors } = lintXML(loadFixture('missing-condition.xml'));
    assert.ok(errors.length > 0, 'Expected at least one error for missing b:if cond attribute');
    const hasMissingCond = errors.some((e) => e.includes('b:if') && e.includes('cond'));
    assert.ok(hasMissingCond, `Expected a missing-cond error, got: ${JSON.stringify(errors)}`);
});

test('duplicate-id.xml — detects duplicate static HTML ids', () => {
    const { errors, warnings } = lintXML(loadFixture('duplicate-id.xml'));
    const allMessages = [...errors, ...warnings];
    assert.ok(allMessages.length > 0, 'Expected at least one error or warning for duplicate id attributes');
    const hasDupId = allMessages.some((m) => m.toLowerCase().includes('duplicate') && m.includes('sidebar'));
    assert.ok(hasDupId, `Expected a duplicate-id message, got: ${JSON.stringify(allMessages)}`);
});

test('Blogger expressions inside JSON-LD are warned, not errored', () => {
    const xml = `<?xml version='1.0' encoding='UTF-8'?>
<html xmlns='http://www.w3.org/1999/xhtml'
      xmlns:b='http://www.google.com/2005/gml/b'
      xmlns:data='http://www.google.com/2005/gml/data'>
  <head>
    <script type='application/ld+json'>
    {&quot;@context&quot;:&quot;https://schema.org&quot;,&quot;name&quot;:&quot;<data:blog.title/>&quot;}
    </script>
  </head>
  <body><b:if cond='data:view.isHomepage'><span>ok</span></b:if></body>
</html>`;
    const { errors, warnings } = lintXML(xml);
    const jsonLdErrors = errors.filter((e) => e.includes('JSON-LD'));
    assert.deepEqual(jsonLdErrors, [], 'Blogger expressions in JSON-LD must not produce errors');
    const jsonLdWarnings = warnings.filter((w) => w.includes('JSON-LD'));
    assert.ok(jsonLdWarnings.length > 0, 'Blogger expressions in JSON-LD must produce a warning');
});

test('missing Blogger namespace produces an error', () => {
    const xml = `<?xml version='1.0' encoding='UTF-8'?>
<html xmlns='http://www.w3.org/1999/xhtml'>
  <body><div id='main'>content</div></body>
</html>`;
    const { errors } = lintXML(xml);
    const hasNsError = errors.some((e) => e.includes('namespace'));
    assert.ok(hasNsError, `Expected a namespace error, got: ${JSON.stringify(errors)}`);
});

test('production template remains well-formed with no fatal lint errors', () => {
    const { errors } = lintXML(loadProductionTemplate());
    assert.deepEqual(errors, [], `Production XML has fatal errors: ${JSON.stringify(errors)}`);
});

test('production template has exactly one canonical declaration', () => {
    const xml = loadProductionTemplate();
    const canonicalCount = countMatches(xml, /rel=['"]canonical['"]/g);
    assert.equal(canonicalCount, 1, `Expected exactly one canonical declaration, found ${canonicalCount}`);
    assert.match(xml, /expr:href=['"]data:view\.url\.canonical['"][^>]*rel=['"]canonical['"]|rel=['"]canonical['"][^>]*expr:href=['"]data:view\.url\.canonical['"]/, 'Canonical must use data:view.url.canonical');
});

test('production robots policy protects search, archive and error views', () => {
    const xml = loadProductionTemplate();
    assert.match(xml, /<b:if\s+cond=['"]data:view\.isError or data:view\.search\.query or data:view\.isArchive['"]>/, 'Expected explicit noindex condition for error, search and archive views');
    assert.match(xml, /<meta\s+content=['"]noindex, follow['"]\s+name=['"]robots['"]\s*\/>/, 'Expected noindex, follow directive');
    assert.match(xml, /<meta\s+content=['"]index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1['"]\s+name=['"]robots['"]\s*\/>/, 'Expected index directive for normal pages');
});

test('production template keeps one robots branch pair and no unconditional noindex', () => {
    const xml = loadProductionTemplate();
    assert.equal(countMatches(xml, /name=['"]robots['"]/g), 2, 'Expected exactly two conditional robots meta declarations');
    assert.equal(countMatches(xml, /content=['"]noindex, follow['"]/g), 1, 'Expected exactly one noindex directive');
});

test('production canonical and hreflang consistently use canonical URL object', () => {
    const { doc } = parseXML(loadProductionTemplate());
    const links = Array.from(doc.getElementsByTagName('link'));

    const msMyLink = links.find(link => link.getAttribute('hreflang') === 'ms-MY' && link.getAttribute('rel') === 'alternate');
    assert.ok(msMyLink, 'Missing ms-MY hreflang alternate link');
    assert.equal(msMyLink.getAttribute('expr:href'), 'data:view.url.canonical', 'ms-MY hreflang must use data:view.url.canonical');

    const xDefaultLink = links.find(link => link.getAttribute('hreflang') === 'x-default' && link.getAttribute('rel') === 'alternate');
    assert.ok(xDefaultLink, 'Missing x-default hreflang alternate link');
    assert.equal(xDefaultLink.getAttribute('expr:href'), 'data:view.url.canonical', 'x-default hreflang must use data:view.url.canonical');
});

test('production template does not contain insecure HTTP asset URLs', () => {
    const xml = loadProductionTemplate();
    const insecureAssets = [...xml.matchAll(/(?:src|href)\s*=\s*['"]http:\/\/[^'"]+['"]/g)].map((m) => m[0]);
    assert.deepEqual(insecureAssets, [], `Found insecure asset URLs: ${insecureAssets.join(', ')}`);
});
