'use strict';

const fs = require('fs');
const path = require('path');

const input = path.resolve(process.argv[2] || 'asset/xml/ilmualam.xml');
const output = path.resolve(process.argv[3] || 'reports/theme-jsonld-fix/ilmualam-fixed.xml');

const xml = fs.readFileSync(input, 'utf8');

// Match the exact invalid JSON-LD pattern produced by the theme:
// "label", immediately before the closing Blogger label loop.
// The fix moves the comma before every item except the first, preventing ,].
const badLoopEnd = /&quot;<data:label\.name\.jsonEscaped\s*\/>\s*&quot;\s*,\s*<\/b:loop>/g;
const matches = [...xml.matchAll(badLoopEnd)].length;

if (matches !== 1) {
  throw new Error(`Expected exactly one trailing-comma label loop, found ${matches}.`);
}

const fixed = xml.replace(
  badLoopEnd,
  '<b:if cond=\'data:i != 0\'>,</b:if>&quot;<data:label.name.jsonEscaped/>&quot;</b:loop>'
);

if (fixed === xml) throw new Error('No XML change was produced.');
if (/,&quot;?\s*\]/.test(fixed)) {
  throw new Error('Verification failed: a trailing comma before a JSON array close remains.');
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, fixed);

const report = {
  input,
  output,
  trailingCommaLoopsFound: matches,
  keywordLoopsChanged: 1,
  originalBytes: Buffer.byteLength(xml),
  fixedBytes: Buffer.byteLength(fixed),
  generatedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(path.dirname(output), 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
