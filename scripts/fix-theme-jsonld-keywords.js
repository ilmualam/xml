'use strict';

const fs = require('fs');
const path = require('path');

const input = path.resolve(process.argv[2] || 'asset/xml/ilmualam.xml');
const output = path.resolve(process.argv[3] || 'reports/theme-jsonld-fix/ilmualam-fixed.xml');

const xml = fs.readFileSync(input, 'utf8');
let scanned = 0;
let changed = 0;

const loopRe = /<b:loop\b([^>]*)>([\s\S]*?)<\/b:loop>/g;
const fixed = xml.replace(loopRe, (full, attrs, body) => {
  if (!/values=['"]data:post\.labels['"]/.test(attrs)) return full;
  if (!/var=['"]label['"]/.test(attrs)) return full;
  scanned += 1;

  const contextStart = Math.max(0, arguments.length ? 0 : 0);
  const hasLabelValue = /<data:label\.name(?:\.jsonEscaped)?\s*\/>/.test(body);
  const endsWithComma = /,&?\s*$/.test(body.replace(/\s+/g, '')) || /&quot;\s*,\s*$/.test(body);
  if (!hasLabelValue || !endsWithComma) return full;

  let cleanBody = body.replace(/,\s*$/, '');
  cleanBody = cleanBody.replace(
    /&quot;<data:label\.name(?:\.jsonEscaped)?\s*\/>\s*&quot;/,
    '<b:if cond=\'data:i != 0\'>,</b:if>&quot;<data:label.name.jsonEscaped/>&quot;'
  );
  changed += 1;
  return `<b:loop${attrs}>${cleanBody}</b:loop>`;
});

if (changed !== 1) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(path.join(path.dirname(output), 'debug.txt'), `labelLoopsScanned=${scanned}\nchanges=${changed}\n`);
  throw new Error(`Expected exactly one JSON-LD label loop fix, scanned ${scanned}, changed ${changed}.`);
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, fixed);
fs.writeFileSync(path.join(path.dirname(output), 'report.json'), JSON.stringify({
  input,
  output,
  labelLoopsScanned: scanned,
  keywordLoopsChanged: changed,
  originalBytes: Buffer.byteLength(xml),
  fixedBytes: Buffer.byteLength(fixed),
  generatedAt: new Date().toISOString()
}, null, 2));

console.log(`Patched ${changed} JSON-LD label loop.`);
