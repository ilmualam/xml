'use strict';

const fs = require('fs');
const path = require('path');

const input = path.resolve(process.argv[2] || 'asset/xml/ilmualam.xml');
const outputDir = path.resolve('reports/theme-jsonld-fix');
const xml = fs.readFileSync(input, 'utf8');

fs.mkdirSync(outputDir, { recursive: true });

const loops = [];
const loopRe = /<b:loop\b([^>]*)>([\s\S]*?)<\/b:loop>/g;
let match;
while ((match = loopRe.exec(xml))) {
  const attrs = match[1];
  const body = match[2];
  if (!/values=['"]data:post\.labels['"]/.test(attrs)) continue;
  if (!/var=['"]label['"]/.test(attrs)) continue;

  const start = Math.max(0, match.index - 500);
  const end = Math.min(xml.length, loopRe.lastIndex + 500);
  loops.push({
    index: loops.length + 1,
    attrs,
    body,
    context: xml.slice(start, end)
  });
}

fs.writeFileSync(path.join(outputDir, 'label-loops.json'), JSON.stringify({ count: loops.length, loops }, null, 2));
fs.writeFileSync(path.join(outputDir, 'ilmualam-original.xml'), xml);
fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify({
  mode: 'diagnostic',
  labelLoopsFound: loops.length,
  generatedAt: new Date().toISOString()
}, null, 2));

console.log(`Diagnostic generated for ${loops.length} Blogger label loops.`);
