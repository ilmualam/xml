'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { lintXML } = require('../scripts/xml-lint.js');

const FIXTURES = path.join(__dirname, 'fixtures');

function loadFixture(name) {
    return fs.readFileSync(path.join(FIXTURES, name), 'utf8');
}

test('valid.xml — passes with no errors', () => {
    const { errors, warnings } = lintXML(loadFixture('valid.xml'));
    assert.deepEqual(errors, [], `Expected no errors, got: ${JSON.stringify(errors)}`);
});

test('malformed.xml — reports XML parse errors', () => {
    const { errors } = lintXML(loadFixture('malformed.xml'));
    assert.ok(
        errors.length > 0,
        'Expected at least one error for malformed XML'
    );
    const hasParseError = errors.some((e) => e.toLowerCase().includes('xml'));
    assert.ok(hasParseError, `Expected an XML parse error, got: ${JSON.stringify(errors)}`);
});

test('missing-condition.xml — reports b:if without cond attribute', () => {
    const { errors } = lintXML(loadFixture('missing-condition.xml'));
    assert.ok(
        errors.length > 0,
        'Expected at least one error for missing b:if cond attribute'
    );
    const hasMissingCond = errors.some(
        (e) => e.includes('b:if') && e.includes('cond')
    );
    assert.ok(hasMissingCond, `Expected a missing-cond error, got: ${JSON.stringify(errors)}`);
});

test('duplicate-id.xml — detects duplicate static HTML ids', () => {
    const { errors, warnings } = lintXML(loadFixture('duplicate-id.xml'));
    // Duplicate id detection is reported as a warning (Blogger templates can
    // have the same id in multiple defaultmarkup sections by design).
    const allMessages = [...errors, ...warnings];
    assert.ok(
        allMessages.length > 0,
        'Expected at least one error or warning for duplicate id attributes'
    );
    const hasDupId = allMessages.some(
        (m) => m.toLowerCase().includes('duplicate') && m.includes('sidebar')
    );
    assert.ok(hasDupId, `Expected a duplicate-id message, got: ${JSON.stringify(allMessages)}`);
});

test('Blogger expressions inside JSON-LD are warned, not errored', () => {
    // Simulate a JSON-LD block that contains a Blogger template element
    // (<data:blog.title/> is parsed by xmldom as a child element of <script>).
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
    // Should not add an error for the Blogger-expression JSON-LD block
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
