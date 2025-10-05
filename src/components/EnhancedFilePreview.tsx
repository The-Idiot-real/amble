import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Download, X, ZoomIn, ZoomOut, Play, Pause } from "lucide-react";
import { StoredFile } from "@/lib/fileStorage";

interface EnhancedFilePreviewProps {
  file: StoredFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export const EnhancedFilePreview = ({ file, isOpen, onClose, onDownload }: EnhancedFilePreviewProps) => {
  const [zoom, setZoom] = useState(100);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (file && isOpen) {
      generatePreview(file);
    }
  }, [file, isOpen]);

  const generatePreview = (file: StoredFile) => {
    const fileType = file.type.toLowerCase();
    
    // Images
    if (fileType.startsWith('image/')) {
      setPreviewContent(file.data);
    } 
    // Audio
    else if (fileType.startsWith('audio/')) {
      setPreviewContent(file.data);
    }
    // Video
    else if (fileType.startsWith('video/')) {
      setPreviewContent(file.data);
    }
    // PDF
    else if (fileType === 'application/pdf') {
      setPreviewContent(file.data);
    }
    // Text files
    else if (fileType.startsWith('text/') || fileType === 'application/json') {
      try {
        const base64Data = file.data.split(',')[1];
        const text = atob(base64Data);
        setPreviewContent(text);
      } catch (error) {
        setPreviewContent('Unable to preview this file type.');
      }
    }
    // Office documents (DOCX, XLSX, PPTX)
    else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      fileType === 'application/msword' ||
      fileType === 'application/vnd.ms-excel' ||
      fileType === 'application/vnd.ms-powerpoint'
    ) {
      // Use Google Docs Viewer for office files
      const encodedUrl = encodeURIComponent(file.data);
      setPreviewContent(`https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`);
    }
    else {
      setPreviewContent(`Preview not available for this file type. Click download to view the file.`);
    }
  };

  if (!file) return null;

  const fileType = file.type.toLowerCase();
  const isImage = fileType.startsWith('image/');
  const isText = fileType.startsWith('text/') || fileType === 'application/json';
  const isAudio = fileType.startsWith('audio/');
  const isVideo = fileType.startsWith('video/');
  const isPDF = fileType === 'application/pdf';
  const isOfficeDoc = fileType.includes('word') || fileType.includes('excel') || fileType.includes('powerpoint') || 
                      fileType.includes('document') || fileType.includes('sheet') || fileType.includes('presentation');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate flex-1">{file.name}</DialogTitle>
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
                  <span className="text-sm font-mono min-w-[4rem] text-center">{zoom}%</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.min(300, zoom + 25))}
                    disabled={zoom >= 300}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button onClick={onDownload} size="sm" className="bg-gradient-to-r from-primary to-accent">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="overflow-auto flex-1 max-h-[calc(90vh-120px)]">
          {/* Image Preview */}
          {isImage && previewContent && (
            <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
              <img
                src={previewContent}
                alt={file.name}
                style={{ 
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'center',
                  maxWidth: '100%',
                  height: 'auto'
                }}
                className="rounded-lg shadow-lg"
              />
            </div>
          )}

          {/* Audio Preview */}
          {isAudio && previewContent && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                {isPlaying ? (
                  <Pause className="w-12 h-12 text-white" />
                ) : (
                  <Play className="w-12 h-12 text-white" />
                )}
              </div>
              <audio
                controls
                className="w-full max-w-md"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src={previewContent} type={file.type} />
                Your browser does not support the audio element.
              </audio>
              <p className="text-sm text-muted-foreground">{file.name}</p>
            </div>
          )}

          {/* Video Preview */}
          {isVideo && previewContent && (
            <div className="flex justify-center p-4">
              <video
                controls
                className="w-full max-w-4xl rounded-lg shadow-lg"
              >
                <source src={previewContent} type={file.type} />
                Your browser does not support the video element.
              </video>
            </div>
          )}

          {/* PDF Preview */}
          {isPDF && previewContent && (
            <div className="w-full h-[70vh]">
              <iframe
                src={previewContent}
                className="w-full h-full border-0 rounded-lg"
                title={file.name}
              />
            </div>
          )}

          {/* Office Document Preview */}
          {isOfficeDoc && previewContent && previewContent.startsWith('http') && (
            <div className="w-full h-[70vh]">
              <iframe
                src={previewContent}
                className="w-full h-full border-0 rounded-lg"
                title={file.name}
              />
            </div>
          )}

          {/* Text Preview */}
          {isText && previewContent && !previewContent.startsWith('http') && (
            <pre className="whitespace-pre-wrap font-mono text-sm bg-muted/50 p-6 rounded-lg overflow-auto">
              {previewContent}
            </pre>
          )}

          {/* Fallback */}
          {!isImage && !isAudio && !isVideo && !isPDF && !isOfficeDoc && !isText && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-6">
                <Download className="w-10 h-10 text-white" />
              </div>
              <p className="text-lg text-muted-foreground mb-6">{previewContent}</p>
              <Button onClick={onDownload} size="lg" className="bg-gradient-to-r from-primary to-accent">
                <Download className="w-5 h-5 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
