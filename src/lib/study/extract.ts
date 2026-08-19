import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { InputFormat } from "./types";

GlobalWorkerOptions.workerSrc = workerSrc;

export interface ExtractionResult {
  text: string;
  pages: string[];
  error?: string;
}

export async function extractText(input: { file: File; format: InputFormat }): Promise<ExtractionResult> {
  if (input.format === "pdf") {
    return extractPDF(input.file);
  }
  const text = await input.file.text();
  return { text, pages: [text] };
}

export async function extractTextFromContent(input: { text: string; format: InputFormat }): Promise<ExtractionResult> {
  return { text: input.text, pages: [input.text] };
}

async function extractPDF(file: File): Promise<ExtractionResult> {
  const arrayBuf = await file.arrayBuffer();
  let doc: PDFDocumentProxy | null = null;
  try {
    const loadingTask = getDocument({ data: arrayBuf, disableAutoFetch: true, disableStream: true });
    doc = await loadingTask.promise;
    const numPages = doc.numPages;
    const pages: string[] = [];
    for (let i = 1; i <= numPages; i++) {
      const page = await doc.getPage(i);
      const txtContent = await page.getTextContent();
      const pageText = (txtContent.items as Array<{ str: string }>).map((item) => item.str).join("");
      pages.push(pageText);
    }
    const fullText = pages.join("\n\n");
    return { text: fullText, pages };
  } catch (err) {
    return { text: "", pages: [], error: `PDF extraction failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}
