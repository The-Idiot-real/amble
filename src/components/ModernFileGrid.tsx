import { useState } from 'react';
import { Download, Eye, Share2, FileText, Image, Archive, Video, Music, MoreVertical, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FileData {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadDate: string;
  downloadCount: number;
  thumbnail?: string;
  tags?: string[];
  topic?: string;
}

interface ModernFileGridProps {
  files: FileData[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onDownload: (fileId: string) => void;
  onPreview: (fileId: string) => void;
  onShare: (fileId: string) => void;
  searchQuery: string;
  isLoading?: boolean;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return Video;
  if (type.startsWith('audio/')) return Music;
  if (type.includes('zip') || type.includes('rar')) return Archive;
  return FileText;
};

const getFileTypeColor = (type: string) => {
  if (type.startsWith('image/')) return 'text-blue-500';
  if (type.startsWith('video/')) return 'text-purple-500';
  if (type.startsWith('audio/')) return 'text-green-500';
  if (type.includes('pdf')) return 'text-red-500';
  if (type.includes('text') || type.includes('document')) return 'text-orange-500';
  return 'text-gray-500';
};

export const ModernFileGrid = ({ 
  files, 
  totalCount, 
  currentPage, 
  totalPages, 
  onPageChange, 
  onDownload, 
  onPreview, 
  onShare,
  searchQuery,
  isLoading = false
}: ModernFileGridProps) => {
  const isMobile = useIsMobile();

  if (files.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/20 flex items-center justify-center">
          <FileText className="w-10 h-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-medium mb-2">
          {searchQuery ? 'No files found' : 'No files uploaded yet'}
        </h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          {searchQuery 
            ? `No files match "${searchQuery}". Try adjusting your search terms.`
            : 'Upload your first file to get started with Amble.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Results header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {searchQuery ? `Search Results` : 'Your Files'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {totalCount} {totalCount === 1 ? 'file' : 'files'}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
      </div>

      {/* Files grid - 3 rows x 4 columns (12 items per page) */}
      <div className={`grid gap-6 ${
        isMobile 
          ? 'grid-cols-1' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      }`}>
        {files.map((file) => {
          const FileIcon = getFileIcon(file.type);
          const iconColor = getFileTypeColor(file.type);
          
          return (
            <div key={file.id} className="modern-card group bounce-in-animation">
              {/* File preview/icon */}
              <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 mb-4 relative overflow-hidden pulse-glow-animation">
                {file.thumbnail ? (
                  <img 
                    src={file.thumbnail} 
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileIcon className={`w-16 h-16 ${iconColor}`} />
                  </div>
                )}
                
                {/* Hover actions */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-accent/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
                  <Button
                    size="sm"
                    className="bg-white text-primary hover:bg-white hover:scale-110 transition-transform shadow-lg"
                    onClick={() => onPreview(file.id)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="bg-white text-primary hover:bg-white hover:scale-110 transition-transform shadow-lg"
                    onClick={() => onDownload(file.id)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* File info */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate text-sm" title={file.name}>
                      {file.name}
                    </h3>
                    {file.topic && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {file.topic}
                      </Badge>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onPreview(file.id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDownload(file.id)}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onShare(file.id)}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* File metadata */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{file.uploadDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{file.downloadCount}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{file.size}</span>
                  {file.tags && file.tags.length > 0 && (
                    <div className="flex gap-1">
                      {file.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                      {file.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{file.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-8">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </Button>
          
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)
              )
              .map((page, index, array) => (
                <div key={page} className="flex items-center gap-1">
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="text-muted-foreground px-2">...</span>
                  )}
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    className="w-10 h-10"
                  >
                    {page}
                  </Button>
                </div>
              ))
            }
          </div>
          
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};