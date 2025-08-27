import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Download, X, ZoomIn, ZoomOut } from "lucide-react";
import { StoredFile } from "@/lib/fileStorage";

interface FilePreviewProps {
  file: StoredFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export const FilePreview = ({ file, isOpen, onClose, onDownload }: FilePreviewProps) => {
  const [zoom, setZoom] = useState(100);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  useEffect(() => {
    if (file && isOpen) {
      generatePreview(file);
    }
  }, [file, isOpen]);

  const generatePreview = (file: StoredFile) => {
    const fileType = file.type.toLowerCase();
    
    if (fileType.startsWith('image/')) {
      setPreviewContent(file.data);
    } else if (fileType.startsWith('text/') || fileType === 'application/json') {
      // Convert data URL to text
      try {
        const base64Data = file.data.split(',')[1];
        const text = atob(base64Data);
        setPreviewContent(text);
      } catch (error) {
        setPreviewContent('Unable to preview this file type.');
      }
    } else if (fileType === 'application/pdf') {
      setPreviewContent('PDF preview not available in this demo. Click download to view the file.');
    } else {
      setPreviewContent(`Preview not available for ${file.type} files. Click download to view the file.`);
    }
  };

  if (!file) return null;

  const isImage = file.type.startsWith('image/');
  const isText = file.type.startsWith('text/') || file.type === 'application/json';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate">{file.name}</DialogTitle>
            <div className="flex items-center gap-2">
              {isImage && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.max(25, zoom - 25))}
                    disabled={zoom <= 25}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-mono">{zoom}%</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                    disabled={zoom >= 200}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button onClick={onDownload} size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="overflow-auto flex-1">
          {isImage && previewContent ? (
            <div className="flex justify-center">
              <img
                src={previewContent}
                alt={file.name}
                style={{ 
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top left',
                  maxWidth: 'none'
                }}
                className="max-w-full h-auto"
              />
            </div>
          ) : isText && previewContent ? (
            <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-auto max-h-96">
              {previewContent}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Download className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">{previewContent}</p>
              <Button onClick={onDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};