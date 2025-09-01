// supabase/functions/file-conversion/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { PDFDocument } from "npm:pdf-lib";
import Papa from "npm:papaparse";
import { ImageMagick, MagickFormat } from "https://deno.land/x/imagemagick_deno/mod.ts";
import * as XLSX from "npm:xlsx";
import { Document, Packer, Paragraph } from "npm:docx";
import { marked } from "npm:marked";

serve(async (req) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const targetFormat = formData.get("targetFormat") as string;

    let converted: Blob;

    switch (targetFormat) {
      case "pdf":
        converted = await convertToPDF(file);
        break;
      case "json":
        converted = await convertToJSON(file);
        break;
      case "csv":
        converted = await convertToCSV(file);
        break;
      case "docx":
        converted = await convertToDOCX(file);
        break;
      case "txt":
        converted = await convertToTXT(file);
        break;
      case "xlsx":
        converted = await convertToXLSX(file);
        break;
      case "html":
        converted = await convertMarkdownToHTML(file);
        break;
      case "md":
        converted = await convertHTMLToMarkdown(file);
        break;
      case "png":
      case "jpeg":
      case "webp":
        converted = await convertImage(file, targetFormat);
        break;
      default:
        return new Response("Unsupported format", { status: 400 });
    }

    return new Response(await converted.arrayBuffer(), {
      headers: { "Content-Type": converted.type },
    });
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
});

// ✅ PDF conversion (text-based)
async function convertToPDF(fileBlob: Blob): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const text = await fileBlob.text();
  page.drawText(text.slice(0, 2000), { x: 50, y: 350, size: 12 });
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

// ✅ CSV → JSON
async function convertToJSON(fileBlob: Blob): Promise<Blob> {
  const text = await fileBlob.text();
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
  return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
}

// ✅ JSON → CSV
async function convertToCSV(fileBlob: Blob): Promise<Blob> {
  const text = await fileBlob.text();
  const data = JSON.parse(text);
  const csv = Papa.unparse(data);
  return new Blob([csv], { type: "text/csv" });
}

// ✅ TXT ↔ DOCX
async function convertToDOCX(fileBlob: Blob): Promise<Blob> {
  const text = await fileBlob.text();
  const doc = new Document({ sections: [{ children: [new Paragraph(text)] }] });
  const buffer = await Packer.toBuffer(doc);
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

async function convertToTXT(fileBlob: Blob): Promise<Blob> {
  const text = await fileBlob.text();
  return new Blob([text], { type: "text/plain" });
}

// ✅ XLSX ↔ CSV
async function convertToXLSX(fileBlob: Blob): Promise<Blob> {
  const text = await fileBlob.text();
  const data = Papa.parse(text, { header: true }).data;
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

// ✅ Markdown ↔ HTML
async function convertMarkdownToHTML(fileBlob: Blob): Promise<Blob> {
  const text = await fileBlob.text();
  const html = marked(text);
  return new Blob([html], { type: "text/html" });
}

async function convertHTMLToMarkdown(fileBlob: Blob): Promise<Blob> {
  const text = await fileBlob.text();
  // simple conversion stripping tags — for real use, better use "turndown"
  const md = text.replace(/<[^>]+>/g, "");
  return new Blob([md], { type: "text/markdown" });
}

// ✅ Image conversion
async function convertImage(fileBlob: Blob, targetFormat: string): Promise<Blob> {
  const inputBuffer = new Uint8Array(await fileBlob.arrayBuffer());
  let outputBuffer: Uint8Array | null = null;

  await ImageMagick.read(inputBuffer, (img) => {
    img.write(
      MagickFormat[targetFormat.toUpperCase() as keyof typeof MagickFormat],
      (data) => {
        outputBuffer = data;
      },
    );
  });

  if (!outputBuffer) throw new Error("Image conversion failed");

  return new Blob([outputBuffer], { type: `image/${targetFormat.toLowerCase()}` });
}
