'use strict';

const fs = require('fs');
const path = require('path');

const input = path.resolve(process.argv[2] || 'asset/xml/ilmualam.xml');
const output = path.resolve(process.argv[3] || 'reports/theme-jsonld-fix/ilmualam-fixed.xml');
const outputDir = path.dirname(output);
const xml = fs.readFileSync(input, 'utf8');

const oldBody = '&quot;<data:label.name.jsonEscaped/>&quot;<b:if cond=\'not data:label.isLast\'>,</b:if>';
const newBody = '<b:if cond=\'data:i != 0\'>,</b:if>&quot;<data:label.name.jsonEscaped/>&quot;';

const occurrences = xml.split(oldBody).length - 1;
if (occurrences !== 2) {
  throw new Error(`Expected exactly 2 JSON-LD keyword loops, found ${occurrences}.`);
}

const fixed = xml.split(oldBody).join(newBody);
if (fixed === xml) throw new Error('No XML change was produced.');
if (fixed.includes("not data:label.isLast")) {
  throw new Error('Verification failed: unsupported data:label.isLast remains in the XML.');
}

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(output, fixed);
fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify({
  input,
  output,
  keywordLoopsChanged: occurrences,
  originalBytes: Buffer.byteLength(xml),
  fixedBytes: Buffer.byteLength(fixed),
  generatedAt: new Date().toISOString()
}, null, 2));

console.log(`Patched ${occurrences} Blogger JSON-LD keyword loops.`);
