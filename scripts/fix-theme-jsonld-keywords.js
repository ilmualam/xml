'use strict';

const fs = require('fs');
const path = require('path');

const input = path.resolve(process.argv[2] || 'asset/xml/ilmualam.xml');
const output = path.resolve(process.argv[3] || 'reports/theme-jsonld-fix/ilmualam-fixed.xml');

const xml = fs.readFileSync(input, 'utf8');

const loopRe = /(<b:loop\b[^>]*\bindex=['"]i['"][^>]*\bvalues=['"]data:post\.labels['"][^>]*\bvar=['"]label['"][^>]*>)([\s\S]*?)(<\/b:loop>)/g;
let matches = 0;
let changed = 0;

const fixed = xml.replace(loopRe, (full, open, body, close, offset) => {
  matches += 1;
  const before = xml.slice(Math.max(0, offset - 300), offset);
  if (!/keywords/i.test(before)) return full;

  const bad = /&quot;<data:label\.name\.jsonEscaped\s*\/>\s*&quot;\s*,/;
  if (!bad.test(body)) return full;

  const replacementBody = body.replace(
    bad,
    '<b:if cond=\'data:i != 0\'>,</b:if>&quot;<data:label.name.jsonEscaped/>&quot;'
  );
  changed += 1;
  return open + replacementBody + close;
});

if (changed !== 1) {
  throw new Error(`Expected exactly one JSON-LD keywords loop fix, found ${changed} changes across ${matches} label loops.`);
}

if (fixed === xml) throw new Error('No XML change was produced.');

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, fixed);

const report = {
  input,
  output,
  labelLoopsScanned: matches,
  keywordLoopsChanged: changed,
  originalBytes: Buffer.byteLength(xml),
  fixedBytes: Buffer.byteLength(fixed),
  generatedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(path.dirname(output), 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
