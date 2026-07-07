'use strict';

const fs = require('fs');
const path = require('path');

const input = path.resolve(process.argv[2] || 'asset/xml/ilmualam.xml');
const output = path.resolve(process.argv[3] || 'reports/theme-jsonld-fix/ilmualam-fixed.xml');
const outputDir = path.dirname(output);
const xml = fs.readFileSync(input, 'utf8');

const oldLoop = "<b:loop values='data:post.labels' var='label'>&quot;<data:label.name.jsonEscaped/>&quot;<b:if cond='not data:label.isLast'>,</b:if></b:loop>";
const newLoop = "<b:loop index='i' values='data:post.labels' var='label'><b:if cond='data:i != 0'>,</b:if>&quot;<data:label.name.jsonEscaped/>&quot;</b:loop>";

const occurrences = xml.split(oldLoop).length - 1;
if (occurrences !== 2) {
  throw new Error(`Expected exactly 2 JSON-LD keyword loops, found ${occurrences}.`);
}

const fixed = xml.split(oldLoop).join(newLoop);
if (fixed === xml) throw new Error('No XML change was produced.');
if (fixed.includes("not data:label.isLast")) {
  throw new Error('Verification failed: unsupported data:label.isLast remains in the XML.');
}
if (fixed.includes("<b:loop values='data:post.labels' var='label'><b:if cond='data:i != 0'>")) {
  throw new Error('Verification failed: index=\'i\' is missing from a JSON-LD keyword loop.');
}

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(output, fixed);
fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify({
  input,
  output,
  keywordLoopsChanged: occurrences,
  indexVariablesAdded: occurrences,
  originalBytes: Buffer.byteLength(xml),
  fixedBytes: Buffer.byteLength(fixed),
  generatedAt: new Date().toISOString()
}, null, 2));

console.log(`Patched ${occurrences} Blogger JSON-LD keyword loops with index variables.`);
