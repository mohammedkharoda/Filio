// lib/form16/index.ts
// Parse an uploaded Form 16 PDF ENTIRELY in the browser (§8). We extract what we can
// and hand it back for the user to CONFIRM — never trusted silently. A clean manual
// path always remains. Nothing here touches the network.

export interface Form16Extract {
  grossSalary: number | null;
  tds: number | null;
  employerName: string | null;
  employerTan: string | null;
  employeePan: string | null;
  /** True if we found essentially nothing useful — nudge the user to enter manually. */
  lowConfidence: boolean;
}

const TAN_RE = /\b([A-Z]{4}\d{5}[A-Z])\b/;
const PAN_RE = /\b([A-Z]{5}\d{4}[A-Z])\b/;

/** Turn "12,34,567.00" (Indian grouping) into 1234567. */
function toNumber(raw: string): number {
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

/** Find the first plausible amount within `window` chars after a label match. */
function amountAfter(text: string, labels: RegExp[], window = 160): number | null {
  for (const label of labels) {
    const m = label.exec(text);
    if (!m) continue;
    const start = m.index + m[0].length;
    const slice = text.slice(start, start + window);
    const amt = /(\d[\d,]*\.\d{2}|\d[\d,]{3,})/.exec(slice);
    const captured = amt?.[1];
    if (captured) {
      const value = toNumber(captured);
      if (value > 0) return value;
    }
  }
  return null;
}

/** Read a PDF File into concatenated text using pdfjs-dist (dynamically imported). */
async function extractText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Serve the worker statically (copied into /public). Version matches the library.
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  let out = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    out += " " + strings;
  }
  await doc.destroy();
  return out.replace(/\s+/g, " ").trim();
}

export async function parseForm16(file: File): Promise<Form16Extract> {
  const text = await extractText(file);

  const grossSalary = amountAfter(text, [
    /gross salary[^0-9]{0,40}/i,
    /total amount of salary[^0-9]{0,60}/i,
    /salary as per provisions contained in section\s*17\(1\)[^0-9]{0,40}/i,
  ]);

  const tds = amountAfter(text, [
    /total tax deducted[^0-9]{0,40}/i,
    /amount of tax deducted[^0-9]{0,40}/i,
    /tax deducted and deposited[^0-9]{0,60}/i,
    /net tax payable[^0-9]{0,40}/i,
  ]);

  const employerTan = TAN_RE.exec(text)?.[1] ?? null;

  // The employee PAN is usually the one that appears alongside "PAN of the Employee".
  const empPanMatch = /pan of the employee[^A-Z]{0,20}([A-Z]{5}\d{4}[A-Z])/i.exec(text);
  const employeePan = empPanMatch?.[1] ?? PAN_RE.exec(text)?.[1] ?? null;

  const nameMatch =
    /name and address of the employer[:\s]+([A-Za-z0-9 .,&()-]{3,60})/i.exec(text);
  const employerName = nameMatch?.[1]?.trim() ?? null;

  const lowConfidence = grossSalary === null && tds === null;

  return { grossSalary, tds, employerName, employerTan, employeePan, lowConfidence };
}
