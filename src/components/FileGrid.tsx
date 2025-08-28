import { FileCard } from '@/components/FileCard';
import { Pagination } from '@/components/Pagination';
import { FileData } from '@/lib/fileService';
import { Sparkles, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface FileGridProps {
  files: FileData[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  searchQuery: string;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onDownload: (fileId: string) => void;
  onPreview: (fileId: string) => void;
  onShare: (fileId: string) => void;
}

export const FileGrid = ({
  files,
  totalCount,
  currentPage,
  totalPages,
  searchQuery,
  isLoading = false,
  onPageChange,
  onDownload,
  onPreview,
  onShare
}: FileGridProps) => {
  const formatFileData = (file: FileData) => ({
    id: file.id,
    name: file.name,
    size: formatFileSize(file.file_size),
    type: file.file_type,
    uploadDate: new Date(file.upload_date).toLocaleDateString(),
    downloadCount: file.download_count
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="file-card animate-pulse">
            <div className="h-32 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">
            {searchQuery ? 'Search Results' : 'Recent Files'}
            <Sparkles className="inline w-6 h-6 ml-2 text-primary" />
          </h2>
          <p className="text-muted-foreground">
            {searchQuery 
              ? `Found ${totalCount} files matching "${searchQuery}"` 
              : `${totalCount} files available for download`
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {files.length > 0 ? (
          files.map((file) => (
            <FileCard
              key={file.id}
              file={formatFileData(file)}
              onDownload={onDownload}
              onPreview={onPreview}
              onShare={onShare}
            />
          ))
        ) : totalCount === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="text-muted-foreground">
              <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No files uploaded yet</h3>
              <p className="mb-4">Be the first to share something amazing!</p>
              <Button asChild className="bg-gradient-to-r from-primary to-accent">
                <Link to="/upload">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="col-span-full text-center py-16">
            <div className="text-muted-foreground">
              <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No files found</h3>
              <p>Try adjusting your search query.</p>
            </div>
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
};