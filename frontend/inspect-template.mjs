import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const data = new Uint8Array(fs.readFileSync("./public/template.pdf"));
const doc = await pdfjsLib.getDocument({ data }).promise;

for (let p = 1; p <= Math.min(doc.numPages, 2); p += 1) {
  const page = await doc.getPage(p);
  const content = await page.getTextContent();
  console.log(`--- page ${p} ---`);
  for (const item of content.items.slice(0, 500)) {
    const x = item.transform[4] ?? 0;
    const y = item.transform[5] ?? 0;
    console.log(`${item.str}\tx=${x.toFixed(1)}\ty=${y.toFixed(1)}`);
  }
}
