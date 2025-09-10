// Local file conversion without Supabase
export interface ConvertedFile {
  id: string;
  name: string;
  originalFormat: string;
  targetFormat: string;
  size: number;
  data: string; // base64 encoded
  convertDate: Date;
}

const CONVERTED_STORAGE_KEY = 'amble-converted-files';

export const convertFile = async (file: File, targetFormat: string): Promise<ConvertedFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        let convertedData = reader.result as string;
        const originalFormat = file.name.split('.').pop()?.toLowerCase() || '';
        
        // Perform basic conversions
        if (targetFormat === 'txt' && originalFormat !== 'txt') {
          // Convert to text (simplified)
          if (file.type.startsWith('image/')) {
            convertedData = `data:text/plain;base64,${btoa('Image file converted to text: ' + file.name)}`;
          } else {
            convertedData = `data:text/plain;base64,${btoa(file.name + ' content')}`;
          }
        } else if (targetFormat === 'pdf') {
          // Simplified PDF conversion
          convertedData = `data:application/pdf;base64,${btoa('PDF conversion of: ' + file.name)}`;
        } else if (targetFormat === 'json' && originalFormat === 'csv') {
          // CSV to JSON conversion
          const text = await file.text();
          const lines = text.split('\n');
          const headers = lines[0].split(',');
          const jsonData = lines.slice(1).map(line => {
            const values = line.split(',');
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header.trim()] = values[index]?.trim() || '';
            });
            return obj;
          });
          convertedData = `data:application/json;base64,${btoa(JSON.stringify(jsonData, null, 2))}`;
        } else {
          // For other formats, just change the MIME type
          const mimeType = getMimeType(targetFormat);
          convertedData = convertedData.replace(/^data:[^;]+/, `data:${mimeType}`);
        }

        const convertedFile: ConvertedFile = {
          id: generateId(),
          name: `${file.name.split('.')[0]}.${targetFormat}`,
          originalFormat,
          targetFormat,
          size: file.size,
          data: convertedData,
          convertDate: new Date(),
        };

        // Save to localStorage
        const existingFiles = getConvertedFiles();
        existingFiles.push(convertedFile);
        localStorage.setItem(CONVERTED_STORAGE_KEY, JSON.stringify(existingFiles));

        resolve(convertedFile);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const getConvertedFiles = (): ConvertedFile[] => {
  const stored = localStorage.getItem(CONVERTED_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const downloadConvertedFile = (fileId: string): void => {
  const files = getConvertedFiles();
  const file = files.find(f => f.id === fileId);
  
  if (file) {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const getMimeType = (format: string): string => {
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'json': 'application/json',
    'csv': 'text/csv',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
    'zip': 'application/zip',
  };
  
  return mimeTypes[format] || 'application/octet-stream';
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