// src/lib/fileConverter.ts

/**
 * Uploads a file to the Supabase file conversion function and returns the converted Blob.
 * @param file The input file to convert
 * @param targetFormat Desired output format (e.g. "pdf", "json", "csv", "docx", "xlsx", "html", "md", "png", "jpeg", "webp")
 */
export async function convertFile(file: File, targetFormat: string): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("targetFormat", targetFormat);

  const response = await fetch("/functions/v1/file-conversion", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Conversion failed: ${await response.text()}`);
  }

  const contentType = response.headers.get("Content-Type") || "application/octet-stream";
  const buffer = await response.arrayBuffer();
  return new Blob([buffer], { type: contentType });
}
