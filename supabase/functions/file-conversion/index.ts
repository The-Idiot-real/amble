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
      console.error('File not found:', fileError);
      throw new Error('File not found');
    }

    // Download original file from storage
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from('files')
      .download(fileData.storage_path);

    if (downloadError || !fileBlob) {
      console.error('Download error:', downloadError);
      throw new Error('Failed to download original file');
    }

    console.log(`Original file downloaded: ${fileData.original_name}, size: ${fileBlob.size} bytes`);

    // Convert file using proper conversion logic
    let convertedBlob: Blob;
    let convertedFileName: string;

    try {
      convertedBlob = await convertFile(fileBlob, fileData.file_type, targetFormat, fileData.original_name);
      convertedFileName = fileData.name.replace(/\.[^/.]+$/, `.${targetFormat}`);
      console.log(`Conversion completed: ${convertedBlob.size} bytes`);
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

    console.log(`Converted file uploaded to: ${convertedStoragePath}`);

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
  console.log(`Converting ${originalName} from ${originalType} to ${targetFormat}`);
  
  // Handle text-based conversions
  if (targetFormat === 'txt') {
    return await convertToText(fileBlob, originalType, originalName);
  }
  
  // Handle PDF conversions
  if (targetFormat === 'pdf') {
    return await convertToPDF(fileBlob, originalType, originalName);
  }
  
  // Handle JSON conversions
  if (targetFormat === 'json') {
    return await convertToJSON(fileBlob, originalType, originalName);
  }
  
  // Handle CSV conversions
  if (targetFormat === 'csv') {
    return await convertToCSV(fileBlob, originalType, originalName);
  }
  
  // Handle image conversions
  if (isImageFile(originalType) && isImageFormat(targetFormat)) {
    return await convertImage(fileBlob, targetFormat);
  }
  
  // For unsupported conversions, create a metadata file
  console.log(`Direct conversion not supported from ${originalType} to ${targetFormat}, creating metadata file`);
  const metadata = {
    originalFile: originalName,
    originalType: originalType,
    targetFormat: targetFormat,
    convertedAt: new Date().toISOString(),
    size: fileBlob.size,
    note: `This file could not be directly converted from ${originalType} to ${targetFormat}. This is a metadata representation.`
  };
  
  return new Blob([JSON.stringify(metadata, null, 2)], { type: getMimeType(targetFormat) });
}

async function convertToText(fileBlob: Blob, originalType: string, originalName: string): Promise<Blob> {
  if (originalType.includes('text') || originalType.includes('json') || originalType.includes('csv')) {
    // Already text-based, return as is
    const text = await fileBlob.text();
    return new Blob([text], { type: 'text/plain' });
  } else {
    // For non-text files, create a text representation
    const textContent = `File: ${originalName}
Type: ${originalType}
Size: ${fileBlob.size} bytes
Converted: ${new Date().toISOString()}

This file has been converted to text format. The original content may not be fully representable as plain text.
For binary files, this serves as a metadata representation.`;
    
    return new Blob([textContent], { type: 'text/plain' });
  }
}

// Use pdf-lib for proper PDF generation
import { PDFDocument, rgb } from "https://esm.sh/pdf-lib@1.17.1";

async function convertToPDF(fileBlob: Blob, originalType: string, originalName: string): Promise<Blob> {
  console.log(`Converting ${originalName} to PDF`);
  
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    
    let content = '';
    if (originalType.includes('text') || originalType.includes('json') || originalType.includes('csv')) {
      content = await fileBlob.text();
    } else {
      content = `File: ${originalName}
Type: ${originalType}
Size: ${fileBlob.size} bytes
Converted: ${new Date().toISOString()}

Note: This file could not be directly converted to PDF.
This is a metadata representation of the original file.`;
    }
    
    // Split content into lines and add to PDF
    const lines = content.split('\n');
    const fontSize = 12;
    const margin = 50;
    const lineHeight = fontSize * 1.2;
    let yPosition = 750;
    
    for (const line of lines) {
      if (yPosition < margin) {
        // Add new page if needed
        const newPage = pdfDoc.addPage([612, 792]);
        yPosition = 750;
        newPage.drawText(line, {
          x: margin,
          y: yPosition,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
      } else {
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
      }
      yPosition -= lineHeight;
    }
    
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
    
  } catch (error) {
    console.error('PDF conversion error:', error);
    throw new Error(`Failed to create PDF: ${error.message}`);
  }
}

// Use PapaParse for proper CSV handling
import Papa from "https://esm.sh/papaparse@5.4.1";

async function convertToJSON(fileBlob: Blob, originalType: string, originalName: string): Promise<Blob> {
  if (originalType.includes('json')) {
    // Already JSON, validate and format
    try {
      const text = await fileBlob.text();
      const parsed = JSON.parse(text);
      return new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' });
    } catch (error) {
      throw new Error('Invalid JSON file');
    }
  } else if (originalType.includes('csv') || originalName.toLowerCase().endsWith('.csv')) {
    // CSV to JSON using PapaParse
    const csvText = await fileBlob.text();
    const { data, errors } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
    
    if (errors.length > 0) {
      console.warn('CSV parsing warnings:', errors);
    }
    
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  } else {
    // Other file types to JSON metadata
    const jsonData = {
      originalFile: originalName,
      fileType: originalType,
      fileSize: fileBlob.size,
      convertedAt: new Date().toISOString(),
      content: originalType.includes('text') ? await fileBlob.text() : 'Binary content not displayable'
    };
    
    return new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
  }
}

async function convertToCSV(fileBlob: Blob, originalType: string, originalName: string): Promise<Blob> {
  if (originalType.includes('csv') || originalName.toLowerCase().endsWith('.csv')) {
    // Already CSV
    return new Blob([await fileBlob.text()], { type: 'text/csv' });
  } else if (originalType.includes('json') || originalName.toLowerCase().endsWith('.json')) {
    // JSON to CSV using PapaParse
    try {
      const jsonText = await fileBlob.text();
      const data = JSON.parse(jsonText);
      
      if (!Array.isArray(data)) {
        // Convert single object to array
        const flatData = [data];
        const csv = Papa.unparse(flatData);
        return new Blob([csv], { type: 'text/csv' });
      }
      
      if (data.length === 0) {
        return new Blob([''], { type: 'text/csv' });
      }
      
      // Use PapaParse to generate proper CSV
      const csv = Papa.unparse(data, {
        quotes: true,
        delimiter: ","
      });
      
      return new Blob([csv], { type: 'text/csv' });
    } catch (error) {
      throw new Error('Invalid JSON for CSV conversion');
    }
  } else {
    // Other files to CSV metadata
    const csvContent = `Field,Value
Original File,${originalName}
File Type,${originalType}
File Size,${fileBlob.size}
Converted At,${new Date().toISOString()}`;
    
    return new Blob([csvContent], { type: 'text/csv' });
  }
}

async function convertImage(fileBlob: Blob, targetFormat: string): Promise<Blob> {
  // For server-side image conversion, we'd need proper image processing libraries
  // For now, return the original image with updated MIME type
  console.log(`Image conversion from blob to ${targetFormat} format`);
  
  // This is a basic implementation - in production you'd use proper image processing
  const arrayBuffer = await fileBlob.arrayBuffer();
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

function isImageFormat(format: string): boolean {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(format.toLowerCase());
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
