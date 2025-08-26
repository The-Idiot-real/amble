export interface StoredFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // base64 encoded
  uploadDate: Date;
  downloadCount: number;
}

export interface ConvertedFile {
  id: string;
  originalName: string;
  originalFormat: string;
  targetFormat: string;
  size: number;
  data: string; // base64 encoded
  convertDate: Date;
  downloadCount: number;
}

export interface AppStats {
  totalFiles: number;
  totalUsers: number;
  totalDownloads: number;
  totalConverts: number;
}

const STORAGE_KEY = 'amble-files';
const CONVERTED_STORAGE_KEY = 'amble-converted';
const STATS_KEY = 'amble-stats';

// File storage functions
export const saveFile = (file: File): Promise<StoredFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const storedFile: StoredFile = {
        id: generateId(),
        name: file.name,
        size: file.size,
        type: file.type,
        data: reader.result as string,
        uploadDate: new Date(),
        downloadCount: 0
      };

      const files = getStoredFiles();
      files.push(storedFile);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
      
      // Update stats
      updateStats({ totalFiles: 1 });
      
      resolve(storedFile);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const getStoredFiles = (): StoredFile[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const searchFiles = (query: string): StoredFile[] => {
  const files = getStoredFiles();
  return files.filter(file => 
    file.name.toLowerCase().includes(query.toLowerCase()) ||
    file.type.toLowerCase().includes(query.toLowerCase())
  );
};

export const downloadFile = (fileId: string): void => {
  const files = getStoredFiles();
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
    updateStats({ totalDownloads: 1 });
  }
};

// Conversion functions
export const convertFile = async (file: File, targetFormat: string): Promise<ConvertedFile> => {
  // This is a simplified conversion - in reality you'd use a proper conversion service
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const convertedFile: ConvertedFile = {
        id: generateId(),
        originalName: file.name,
        originalFormat: file.name.split('.').pop() || '',
        targetFormat,
        size: file.size,
        data: reader.result as string,
        convertDate: new Date(),
        downloadCount: 0
      };

      const converted = getConvertedFiles();
      converted.push(convertedFile);
      localStorage.setItem(CONVERTED_STORAGE_KEY, JSON.stringify(converted));
      
      // Update stats
      updateStats({ totalConverts: 1 });
      
      resolve(convertedFile);
    };
    reader.readAsDataURL(file);
  });
};

export const getConvertedFiles = (): ConvertedFile[] => {
  const stored = localStorage.getItem(CONVERTED_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const downloadConvertedFile = (fileId: string): void => {
  const files = getConvertedFiles();
  const fileIndex = files.findIndex(f => f.id === fileId);
  
  if (fileIndex !== -1) {
    const file = files[fileIndex];
    
    // Create download link
    const link = document.createElement('a');
    link.href = file.data;
    link.download = `${file.originalName.split('.')[0]}.${file.targetFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Update download count
    files[fileIndex].downloadCount++;
    localStorage.setItem(CONVERTED_STORAGE_KEY, JSON.stringify(files));
    updateStats({ totalDownloads: 1 });
  }
};

// Stats functions
export const getStats = (): AppStats => {
  const stored = localStorage.getItem(STATS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Initialize stats
  const initialStats: AppStats = {
    totalFiles: 0,
    totalUsers: 1, // At least one user (the current user)
    totalDownloads: 0,
    totalConverts: 0
  };
  
  localStorage.setItem(STATS_KEY, JSON.stringify(initialStats));
  return initialStats;
};

export const updateStats = (updates: Partial<AppStats>): void => {
  const currentStats = getStats();
  const newStats = {
    ...currentStats,
    totalFiles: currentStats.totalFiles + (updates.totalFiles || 0),
    totalUsers: Math.max(currentStats.totalUsers, updates.totalUsers || currentStats.totalUsers),
    totalDownloads: currentStats.totalDownloads + (updates.totalDownloads || 0),
    totalConverts: currentStats.totalConverts + (updates.totalConverts || 0)
  };
  
  localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
};

// Utility functions
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