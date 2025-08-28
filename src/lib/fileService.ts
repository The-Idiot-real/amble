import { supabase } from '@/integrations/supabase/client';

export interface FileData {
  id: string;
  name: string;
  topic?: string;
  description?: string;
  tags?: string[];
  original_name: string;
  file_size: number;
  file_type: string;
  file_path: string;
  storage_path: string;
  upload_date: string;
  download_count: number;
  is_public: boolean;
}

export interface UploadFileData {
  name: string;
  topic?: string;
  description?: string;
  tags?: string[];
  file: File;
}

export const uploadFile = async (data: UploadFileData): Promise<FileData> => {
  const { file, name, topic, description, tags } = data;
  
  // Generate unique file path
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('files')
    .getPublicUrl(filePath);

  // Save file metadata to database
  const { data: fileData, error: dbError } = await supabase
    .from('files')
    .insert({
      name: name || file.name,
      topic,
      description,
      tags,
      original_name: file.name,
      file_size: file.size,
      file_type: file.type,
      file_path: publicUrl,
      storage_path: filePath
    })
    .select()
    .single();

  if (dbError) {
    // Clean up uploaded file if database insert fails
    await supabase.storage.from('files').remove([filePath]);
    throw new Error(`Database error: ${dbError.message}`);
  }

  return fileData;
};

export const getFiles = async (page = 1, limit = 9, searchQuery = ''): Promise<{ files: FileData[], totalCount: number }> => {
  let query = supabase
    .from('files')
    .select('*', { count: 'exact' })
    .eq('is_public', true)
    .order('upload_date', { ascending: false });

  if (searchQuery.trim()) {
    query = query.or(`name.ilike.%${searchQuery}%,topic.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { data, error, count } = await query
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    throw new Error(`Failed to fetch files: ${error.message}`);
  }

  return {
    files: data || [],
    totalCount: count || 0
  };
};

export const downloadFile = async (fileId: string): Promise<void> => {
  // Get current file data
  const { data: fileData, error: fetchError } = await supabase
    .from('files')
    .select('download_count')
    .eq('id', fileId)
    .single();

  if (fetchError) {
    console.error('Failed to fetch file data:', fetchError);
    return;
  }

  // Increment download count
  const { error } = await supabase
    .from('files')
    .update({ download_count: (fileData.download_count || 0) + 1 })
    .eq('id', fileId);

  if (error) {
    console.error('Failed to update download count:', error);
  }
};

export const searchFiles = async (query: string): Promise<FileData[]> => {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('is_public', true)
    .or(`name.ilike.%${query}%,topic.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
    .order('upload_date', { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  return data || [];
};

export const convertFile = async (fileId: string, targetFormat: string): Promise<void> => {
  // Create conversion record
  const { error: conversionError } = await supabase
    .from('conversions')
    .insert({
      original_file_id: fileId,
      original_format: 'auto-detect',
      target_format: targetFormat,
      status: 'pending'
    });

  if (conversionError) {
    throw new Error(`Failed to create conversion: ${conversionError.message}`);
  }

  // Call conversion edge function
  const { error } = await supabase.functions.invoke('file-conversion', {
    body: { fileId, targetFormat }
  });

  if (error) {
    throw new Error(`Conversion failed: ${error.message}`);
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (fileType: string): string => {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('video/')) return '🎥';
  if (fileType.startsWith('audio/')) return '🎵';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📑';
  if (fileType.includes('zip') || fileType.includes('rar')) return '🗜️';
  return '📁';
};