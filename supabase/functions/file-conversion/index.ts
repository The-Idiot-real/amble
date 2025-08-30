import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileId, targetFormat } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1️⃣ Get original file metadata
    const { data: fileData, error: fileError } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (fileError || !fileData) throw new Error("File not found");

    // 2️⃣ Download original file from storage
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("files")
      .download(fileData.storage_path);

    if (downloadError || !fileBlob) throw new Error("Failed to download original file");

    // 3️⃣ Convert file (basic conversion)
    const convertedBlob = await convertFile(fileBlob, fileData.file_type, targetFormat, fileData.name);
    const convertedFileName = fileData.name.replace(/\.[^/.]+$/, `.${targetFormat}`);
    const convertedStoragePath = `converted/${Date.now()}_${convertedFileName}`;

    // 4️⃣ Upload converted file
    const { error: uploadError } = await supabase.storage
      .from("files")
      .upload(convertedStoragePath, convertedBlob, {
        contentType: getMimeType(targetFormat),
        upsert: false,
      });

    if (uploadError) throw new Error("Failed to upload converted file");

    // 5️⃣ Save metadata
    const { data: convertedFile, error: insertError } = await supabase
      .from("files")
      .insert({
        name: convertedFileName,
        original_name: convertedFileName,
        file_size: convertedBlob.size,
        file_type: getMimeType(targetFormat),
        file_path: `${supabaseUrl}/storage/v1/object/public/files/${convertedStoragePath}`,
        storage_path: convertedStoragePath,
        topic: fileData.topic,
        description: `Converted from ${fileData.original_name}`,
        tags: [...(fileData.tags || []), "converted"],
      })
      .select()
      .single();

    if (insertError) throw new Error("Failed to save converted file metadata");

    return new Response(
      JSON.stringify({
        success: true,
        convertedFile,
        downloadUrl: convertedFile.file_path,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function convertFile(fileBlob: Blob, originalType: string, targetFormat: string, originalName: string): Promise<Blob> {
  // Basic conversion: just return a text or metadata blob for unsupported types
  if (targetFormat === "txt") {
    const text = originalType.includes("text") ? await fileBlob.text() : `Metadata of ${originalName}`;
    return new Blob([text], { type: "text/plain" });
  }

  if (targetFormat === "json") {
    const jsonData = {
      originalName,
      originalType,
      size: fileBlob.size,
      convertedAt: new Date().toISOString(),
    };
    return new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
  }

  // For other formats, just return the original file as-is
  const buffer = await fileBlob.arrayBuffer();
  return new Blob([buffer], { type: getMimeType(targetFormat) });
}

function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    txt: "text/plain",
    json: "application/json",
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    csv: "text/csv",
  };
  return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
}
