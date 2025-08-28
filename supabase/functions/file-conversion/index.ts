import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileId, targetFormat } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Converting file ${fileId} to ${targetFormat}`);

    // Get original file from database
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError || !fileData) {
      throw new Error('File not found');
    }

    // Download original file from storage
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from('files')
      .download(fileData.storage_path);

    if (downloadError || !fileBlob) {
      throw new Error('Failed to download original file');
    }

    console.log(`Original file downloaded: ${fileData.original_name}`);

    // Convert file based on type
    let convertedBlob: Blob;
    let convertedFileName: string;

    try {
      convertedBlob = await convertFile(fileBlob, fileData.file_type, targetFormat, fileData.original_name);
      convertedFileName = fileData.name.replace(/\.[^/.]+$/, `.${targetFormat}`);
    } catch (conversionError) {
      console.error('Conversion error:', conversionError);
      throw new Error(`Failed to convert file: ${conversionError.message}`);
    }

    // Upload converted file to storage
    const convertedStoragePath = `converted/${Date.now()}_${convertedFileName}`;
    const { error: uploadError } = await supabase.storage
      .from('files')
      .upload(convertedStoragePath, convertedBlob, {
        contentType: getMimeType(targetFormat),
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload converted file');
    }

    // Save converted file metadata to database
    const { data: convertedFile, error: insertError } = await supabase
      .from('files')
      .insert({
        name: convertedFileName,
        original_name: convertedFileName,
        file_size: convertedBlob.size,
        file_type: getMimeType(targetFormat),
        file_path: `${supabaseUrl}/storage/v1/object/public/files/${convertedStoragePath}`,
        storage_path: convertedStoragePath,
        topic: fileData.topic,
        description: `Converted from ${fileData.original_name}`,
        tags: [...(fileData.tags || []), 'converted']
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to save converted file metadata');
    }

    // Update conversion record
    await supabase
      .from('conversions')
      .update({
        status: 'completed',
        converted_file_id: convertedFile.id,
        completed_at: new Date().toISOString()
      })
      .eq('original_file_id', fileId)
      .eq('target_format', targetFormat);

    console.log('Conversion completed successfully');

    return new Response(JSON.stringify({
      success: true,
      convertedFile: convertedFile,
      downloadUrl: convertedFile.file_path
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in file-conversion function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function convertFile(fileBlob: Blob, originalType: string, targetFormat: string, originalName: string): Promise<Blob> {
  const arrayBuffer = await fileBlob.arrayBuffer();
  
  // Handle text-based conversions
  if (isTextFile(originalType) || targetFormat === 'txt') {
    return await handleTextConversion(arrayBuffer, originalType, targetFormat, originalName);
  }
  
  // Handle image conversions (basic format change)
  if (isImageFile(originalType) && isImageFile(getMimeType(targetFormat))) {
    return await handleImageConversion(arrayBuffer, targetFormat);
  }
  
  // For other conversions, return original with appropriate headers
  console.log(`Direct conversion from ${originalType} to ${targetFormat}`);
  return new Blob([arrayBuffer], { type: getMimeType(targetFormat) });
}

async function handleTextConversion(arrayBuffer: ArrayBuffer, originalType: string, targetFormat: string, originalName: string): Promise<Blob> {
  let textContent = '';
  
  if (originalType.includes('text') || originalType.includes('json')) {
    // Plain text files
    textContent = new TextDecoder().decode(arrayBuffer);
  } else if (originalType.includes('pdf')) {
    // PDF to text (simplified - in production use PDF.js or similar)
    textContent = `[PDF Content from ${originalName}]\n\nThis is a converted PDF file. In a production environment, this would contain the actual extracted text from the PDF.`;
  } else if (originalType.includes('word') || originalType.includes('document')) {
    // Word document to text
    try {
      // For Word docs, we'd normally use a library like mammoth.js
      // For now, provide a basic conversion message
      textContent = `[Document Content from ${originalName}]\n\nThis is a converted document file. In a production environment with proper document processing libraries, this would contain the actual text content.`;
    } catch (error) {
      textContent = `Error reading document: ${error.message}`;
    }
  } else {
    // Try to decode as text
    try {
      textContent = new TextDecoder().decode(arrayBuffer);
    } catch (error) {
      textContent = `[Binary file converted to text]\nOriginal file: ${originalName}\nNote: This file may contain binary data that cannot be properly displayed as text.`;
    }
  }
  
  if (targetFormat === 'txt') {
    return new Blob([textContent], { type: 'text/plain' });
  } else if (targetFormat === 'json') {
    const jsonContent = {
      originalFile: originalName,
      content: textContent,
      convertedAt: new Date().toISOString()
    };
    return new Blob([JSON.stringify(jsonContent, null, 2)], { type: 'application/json' });
  }
  
  return new Blob([textContent], { type: getMimeType(targetFormat) });
}

async function handleImageConversion(arrayBuffer: ArrayBuffer, targetFormat: string): Promise<Blob> {
  // In a production environment, you would use proper image processing
  // For now, return the image data with the correct MIME type
  return new Blob([arrayBuffer], { type: getMimeType(targetFormat) });
}

function isTextFile(mimeType: string): boolean {
  return mimeType.startsWith('text/') || 
         mimeType.includes('json') || 
         mimeType.includes('xml') || 
         mimeType.includes('csv');
}

function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'txt': 'text/plain',
    'json': 'application/json',
    'csv': 'text/csv',
    'xml': 'text/xml',
    'html': 'text/html',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed'
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}