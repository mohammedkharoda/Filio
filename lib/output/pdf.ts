// lib/output/pdf.ts
// Generate the filled ITR-1 preparation summary PDF entirely client-side (§9).
// Nothing is uploaded. Standard PDF fonts can't encode ₹, so we render "Rs".

import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { MappingSheet } from "./mapping";
import { triggerBrowserDownload } from "@/lib/download";

/** Standard PDF fonts are WinAnsi — replace ₹ and strip anything unencodable. */
function sanitize(text: string): string {
  return text
    .replace(/₹/g, "Rs ")
    .replace(/[₨]/g, "Rs ")
    .replace(/[^ -ÿ]/g, "");
}

const TERRACOTTA = rgb(0.663, 0.314, 0.184); // Filio primary #A9502F
const INK = rgb(0.165, 0.161, 0.145); // #2A2925
const MUTED = rgb(0.42, 0.384, 0.341); // #6B6257
const LINE = rgb(0.902, 0.851, 0.788); // #E6D9C9

export async function generateSummaryPdf(
  sheet: MappingSheet,
  meta: { name: string; pan: string; assessmentYear: string },
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const A4 = { w: 595.28, h: 841.89 };
  const margin = 48;
  let page = doc.addPage([A4.w, A4.h]);
  let y = A4.h - margin;

  const draw = (text: string, x: number, size: number, f: PDFFont, color = INK) => {
    page.drawText(sanitize(text), { x, y, size, font: f, color });
  };

  const newPageIfNeeded = (needed: number) => {
    if (y - needed < margin) {
      page = doc.addPage([A4.w, A4.h]);
      y = A4.h - margin;
    }
  };

  // Header
  draw(`Filio - ${sheet.formName} Preparation Summary`, margin, 20, bold, TERRACOTTA);
  y -= 26;
  draw(`Assessment Year ${meta.assessmentYear}  ·  Filing under: ${sheet.regimeLabel}`, margin, 11, font, MUTED);
  y -= 16;
  draw(`${meta.name || "Not provided"}   PAN: ${meta.pan || "Not provided"}`, margin, 11, font, INK);
  y -= 10;
  page.drawLine({
    start: { x: margin, y },
    end: { x: A4.w - margin, y },
    thickness: 1,
    color: LINE,
  });
  y -= 18;
  if (sheet.staged) {
    draw(
      "Note: capital-gains, business, and presumptive tax are finalized on the portal.",
      margin,
      9,
      font,
      MUTED,
    );
    y -= 16;
  }

  // Sections
  for (const section of sheet.sections) {
    newPageIfNeeded(60);
    draw(section.title, margin, 13, bold, TERRACOTTA);
    y -= 18;
    for (const row of section.rows) {
      newPageIfNeeded(34);
      draw(`${row.box}`, margin, 9, bold, MUTED);
      y -= 12;
      draw(row.label, margin, 11, font, INK);
      const valStr = sanitize(row.value);
      const valWidth = bold.widthOfTextAtSize(valStr, 11);
      page.drawText(valStr, { x: A4.w - margin - valWidth, y, size: 11, font: bold, color: INK });
      y -= row.note ? 12 : 16;
      if (row.note) {
        draw(row.note, margin, 8.5, font, MUTED);
        y -= 14;
      }
    }
    y -= 10;
  }

  // Next steps + disclaimer
  newPageIfNeeded(160);
  page.drawLine({ start: { x: margin, y }, end: { x: A4.w - margin, y }, thickness: 1, color: LINE });
  y -= 20;
  draw("Next steps on the official portal", margin, 13, bold, TERRACOTTA);
  y -= 18;
  const steps = [
    "1. Log in at incometax.gov.in with your PAN.",
    "2. Go to e-File > Income Tax Returns > File Income Tax Return.",
    `3. Select AY ${meta.assessmentYear}, form ${sheet.formName}, and the ${sheet.regimeLabel}.`,
    "4. Copy each value above into the matching box, checking pre-filled data.",
    "5. Verify the tax computation, then e-verify to complete filing.",
  ];
  for (const s of steps) {
    newPageIfNeeded(16);
    draw(s, margin, 10.5, font, INK);
    y -= 15;
  }
  y -= 10;

  newPageIfNeeded(70);
  draw("Important", margin, 11, bold, MUTED);
  y -= 14;
  const disclaimer = [
    "Filio is an educational preparation tool, not a tax advisor and not an authorised",
    "e-filing intermediary. These figures are your responsibility to review. Filio does not",
    "file anything for you. Always verify against incometax.gov.in before submitting.",
  ];
  for (const d of disclaimer) {
    newPageIfNeeded(14);
    draw(d, margin, 9, font, MUTED);
    y -= 12;
  }

  return doc.save();
}

/** Build the PDF and trigger a browser download. Stays on the user's device. */
export async function downloadSummaryPdf(
  sheet: MappingSheet,
  meta: { name: string; pan: string; assessmentYear: string },
): Promise<void> {
  const bytes = await generateSummaryPdf(sheet, meta);
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const filename = `filio-${sheet.formName.toLowerCase().replace(/[^a-z0-9]/g, "")}-summary-${meta.assessmentYear}.pdf`;
  triggerBrowserDownload(blob, filename);
}
