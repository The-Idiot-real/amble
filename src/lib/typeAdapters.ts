import { LocalFileData } from './localFileStorage';
import { FileData } from './fileService';
import { StoredFile } from './fileStorage';

/**
 * Convert LocalFileData to FileData format for FileGrid component
 */
export const localFileDataToFileData = (localFile: LocalFileData): FileData => {
  return {
    id: localFile.id,
    name: localFile.name,
    topic: localFile.topic,
    description: localFile.description,
    tags: localFile.tags,
    original_name: localFile.originalName,
    file_size: localFile.fileSize,
    file_type: localFile.fileType,
    file_path: localFile.data, // Using base64 data as file path
    storage_path: localFile.data, // Using base64 data as storage path
    upload_date: localFile.uploadDate,
    download_count: localFile.downloadCount,
    is_public: localFile.isPublic,
  };
};

/**
 * Convert LocalFileData array to FileData array
 */
export const localFileDataArrayToFileDataArray = (localFiles: LocalFileData[]): FileData[] => {
  return localFiles.map(localFileDataToFileData);
};

/**
 * Convert LocalFileData to StoredFile format for FilePreview component
 */
export const localFileDataToStoredFile = (localFile: LocalFileData): StoredFile => {
  return {
    id: localFile.id,
    name: localFile.name,
    size: localFile.fileSize,
    type: localFile.fileType,
    data: localFile.data,
    uploadDate: new Date(localFile.uploadDate),
    downloadCount: localFile.downloadCount,
  };
};

/**
 * Convert FileData to LocalFileData format
 */
export const fileDataToLocalFileData = (fileData: FileData): LocalFileData => {
  return {
    id: fileData.id,
    name: fileData.name,
    originalName: fileData.original_name,
    topic: fileData.topic,
    description: fileData.description,
    tags: fileData.tags,
    fileSize: fileData.file_size,
    fileType: fileData.file_type,
    data: fileData.file_path, // Using file path as data
    uploadDate: fileData.upload_date,
    downloadCount: fileData.download_count,
    isPublic: fileData.is_public,
  };
};

/**
 * Convert StoredFile to LocalFileData format
 */
export const storedFileToLocalFileData = (storedFile: StoredFile): LocalFileData => {
  return {
    id: storedFile.id,
    name: storedFile.name,
    originalName: storedFile.name,
    fileSize: storedFile.size,
    fileType: storedFile.type,
    data: storedFile.data,
    uploadDate: storedFile.uploadDate.toISOString(),
    downloadCount: storedFile.downloadCount,
    isPublic: true,
  };
};
