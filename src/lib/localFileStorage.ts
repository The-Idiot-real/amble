// Local file storage without Supabase
export interface LocalFileData {
  id: string;
  name: string;
  originalName: string;
  topic?: string;
  description?: string;
  tags?: string[];
  fileSize: number;
  fileType: string;
  data: string; // base64 encoded
  uploadDate: string;
  downloadCount: number;
  isPublic: boolean;
}

const STORAGE_KEY = 'amble-local-files';

export const uploadFileLocally = async (data: {
  name: string;
  topic?: string;
  description?: string;
  tags?: string[];
  file: File;
}): Promise<LocalFileData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const fileData: LocalFileData = {
        id: generateId(),
        name: data.name,
        originalName: data.file.name,
        topic: data.topic,
        description: data.description,
        tags: data.tags,
        fileSize: data.file.size,
        fileType: data.file.type,
        data: reader.result as string,
        uploadDate: new Date().toISOString(),
        downloadCount: 0,
        isPublic: true,
      };

      const files = getLocalFiles();
      files.push(fileData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
      
      resolve(fileData);
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(data.file);
  });
};

export const getLocalFiles = (): LocalFileData[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const searchLocalFiles = (query: string): LocalFileData[] => {
  const files = getLocalFiles();
  
  if (!query.trim()) return files;

  const searchTerms = query.toLowerCase().split(' ');
  
  return files.filter(file => {
    const searchableText = [
      file.name,
      file.originalName,
      file.topic || '',
      file.description || '',
      ...(file.tags || [])
    ].join(' ').toLowerCase();

    // Check for tag searches (#study)
    const tagMatches = searchTerms.filter(term => term.startsWith('#'));
    if (tagMatches.length > 0) {
      const hasTagMatch = tagMatches.some(tagTerm => {
        const tag = tagTerm.substring(1); // Remove #
        return file.tags?.some(fileTag => 
          fileTag.toLowerCase().includes(tag)
        );
      });
      
      // Also check regular terms
      const regularTerms = searchTerms.filter(term => !term.startsWith('#'));
      const hasRegularMatch = regularTerms.length === 0 || 
        regularTerms.every(term => searchableText.includes(term));
      
      return hasTagMatch && hasRegularMatch;
    }

    // Regular search
    return searchTerms.every(term => searchableText.includes(term));
  });
};

export const downloadLocalFile = (fileId: string): void => {
  const files = getLocalFiles();
  const fileIndex = files.findIndex(f => f.id === fileId);
  
  if (fileIndex !== -1) {
    const file = files[fileIndex];
    
    // Create download link
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Update download count
    files[fileIndex].downloadCount++;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  }
};

export const getLocalFilesPaginated = (
  page = 1, 
  limit = 9, 
  searchQuery = ''
): { files: LocalFileData[], totalCount: number } => {
  let files = searchQuery ? searchLocalFiles(searchQuery) : getLocalFiles();
  
  // Sort by upload date (newest first)
  files = files.sort((a, b) => 
    new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
  );

  const totalCount = files.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedFiles = files.slice(startIndex, endIndex);

  return {
    files: paginatedFiles,
    totalCount
  };
};

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};