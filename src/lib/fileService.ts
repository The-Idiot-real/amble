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
  user_id?: string;
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
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  
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
    
  // Save file metadata to database with user_id
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
      storage_path: filePath,
      upload_date: new Date().toISOString(),
      download_count: 0,
      is_public: true,
      user_id: user.id // Add user_id here
    })
    .select()
    .single();
    
  if (dbError) {
    throw new Error(`Database error: ${dbError.message}`);
  }
  
  return fileData;
};

export const getFiles = async (page: number = 1, itemsPerPage: number = 9, searchQuery: string = '') => {
  try {
    let query = supabase
      .from('files')
      .select('*', { count: 'exact' })
      .eq('is_public', true)
      .order('upload_date', { ascending: false });
    
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`);
    }
    
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    return {
      files: data || [],
      totalCount: count || 0
    };
  } catch (error) {
    console.error('Error fetching files:', error);
    return {
      files: [],
      totalCount: 0
    };
  }
};

export const getUserFiles = async (page: number = 1, itemsPerPage: number = 9) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { files: [], totalCount: 0 };
    }
    
    let query = supabase
      .from('files')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('upload_date', { ascending: false });
    
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    return {
      files: data || [],
      totalCount: count || 0
    };
  } catch (error) {
    console.error('Error fetching user files:', error);
    return {
      files: [],
      totalCount: 0
    };
  }
};

export const updateFileDownloadCount = async (fileId: string) => {
  try {
    const { error } = await supabase
      .from('files')
      .update({ download_count: supabase.sql('download_count + 1') })
      .eq('id', fileId);
      
    if (error) {
      console.error('Error updating download count:', error);
    }
  } catch (error) {
    console.error('Error updating download count:', error);
  }
};

export const deleteFile = async (fileId: string) => {
  try {
    // First get the file to delete the storage file
    const { data: fileData, error: fetchError } = await supabase
      .from('files')
      .select('storage_path')
      .eq('id', fileId)
      .single();
      
    if (fetchError) {
      throw fetchError;
    }
    
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('files')
      .remove([fileData.storage_path]);
      
    if (storageError) {
      console.error('Storage deletion error:', storageError);
    }
    
    // Delete from database
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);
      
    if (dbError) {
      throw dbError;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
