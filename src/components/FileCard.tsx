import { Download, Eye, Share2, Calendar, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface FileData {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadDate: string;
  downloadCount: number;
  thumbnail?: string;
}

interface FileCardProps {
  file: FileData;
  onDownload?: (fileId: string) => void;
  onPreview?: (fileId: string) => void;
  onShare?: (fileId: string) => void;
}

export const FileCard = ({ file, onDownload, onPreview, onShare }: FileCardProps) => {
  const getFileIcon = (type: string) => {
    return <FileIcon className="w-8 h-8 text-primary" />;
  };

  const formatType = (type: string) => {
    return type.toUpperCase().replace('APPLICATION/', '').replace('IMAGE/', '').replace('TEXT/', '');
  };

  return (
    <div className="file-card group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
            {file.thumbnail ? (
              <img 
                src={file.thumbnail} 
                alt={file.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              getFileIcon(file.type)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate text-sm">
              {file.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {formatType(file.type)}
              </Badge>
              <span className="text-xs text-muted-foreground">{file.size}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center text-xs text-muted-foreground mb-4">
        <Calendar className="w-3 h-3 mr-1" />
        <span>{file.uploadDate}</span>
        <span className="mx-2">•</span>
        <span>{file.downloadCount} downloads</span>
      </div>

      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPreview?.(file.id)}
          className="flex-1"
        >
          <Eye className="w-3 h-3 mr-1" />
          Preview
        </Button>
        <Button
          size="sm"
          onClick={() => onDownload?.(file.id)}
          className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent"
        >
          <Download className="w-3 h-3 mr-1" />
          Download
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onShare?.(file.id)}
        >
          <Share2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};