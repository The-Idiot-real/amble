import { useState, useCallback } from "react";
import { Upload as UploadIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ModernHeader } from "@/components/ModernHeader";
import { UploadDialog } from "@/components/UploadDialog";
import { uploadFile, formatFileSize } from "@/lib/fileService";
import { useIsMobile } from "@/hooks/use-mobile";
import FloatingAIChat from "@/components/FloatingAIChat";

interface PendingFile {
  file: File;
  id: string;
}

interface UploadingFile {
  id: string;
  file: File;
  name: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

const Upload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      openFileDialog(e.dataTransfer.files[0]);
    }
  }, []);

  const openFileDialog = (file: File) => {
    setPendingFile({
      file,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2)
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      openFileDialog(e.target.files[0]);
    }
  };

  const handleUploadConfirm = async (data: {
    title: string;
    tags: string[];
    description: string;
  }) => {
    if (!pendingFile) return;

    const uploadingFile: UploadingFile = {
      id: pendingFile.id,
      file: pendingFile.file,
      name: data.title,
      progress: 0,
      status: 'uploading'
    };

    setUploadingFiles(prev => [...prev, uploadingFile]);
    setPendingFile(null);

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadingFiles(current => {
          const updated = current.map(f => {
            if (f.id === uploadingFile.id && f.status === 'uploading') {
              const newProgress = Math.min(f.progress + Math.random() * 15, 95);
              return { ...f, progress: newProgress };
            }
            return f;
          });
          return updated;
        });
      }, 300);

      // Perform actual upload
      const uploadedFile = await uploadFile({
        file: pendingFile.file,
        name: data.title,
        topic: undefined,
        description: data.description || undefined,
        tags: data.tags.length > 0 ? data.tags : undefined
      });

      clearInterval(interval);

      // Mark as completed
      setUploadingFiles(current =>
        current.map(f =>
          f.id === uploadingFile.id
            ? { ...f, progress: 100, status: 'completed' }
            : f
        )
      );

      // Show success notification
      toast({
        title: "Upload Successful! ✓",
        description: `${data.title} has been uploaded successfully and is now visible to everyone.`,
        className: "bg-primary text-primary-foreground",
      });

      // Remove from list after 3 seconds
      setTimeout(() => {
        setUploadingFiles(current => current.filter(f => f.id !== uploadingFile.id));
      }, 3000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadingFiles(current =>
        current.map(f =>
          f.id === uploadingFile.id
            ? { ...f, status: 'error', progress: 0 }
            : f
        )
      );

      toast({
        title: "Upload Failed",
        description: `Failed to upload ${data.title}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <ModernHeader 
        onSearch={() => {}}
        searchResults={[]}
        onDownload={() => {}}
        onPreview={() => {}}
        onShare={() => {}}
      />
      
      <main className={`container mx-auto ${isMobile ? 'px-4 py-8' : 'px-6 py-12'}`}>
        <div className="max-w-4xl mx-auto">
          <div className={`text-center ${isMobile ? 'mb-8' : 'mb-12'}`}>
            <h1 className={`font-bold mb-4 ${isMobile ? 'text-3xl' : 'text-5xl'}`}>
              <span className="hero-text">Upload Your Files</span>
            </h1>
            <p className={`text-muted-foreground ${isMobile ? 'text-lg' : 'text-xl'}`}>
              Share your files with the world. Add title, tags, and description for better organization.
            </p>
          </div>

          {/* Upload Zone */}
          <div
            className={`upload-zone cursor-pointer transition-all ${
              dragActive ? 'border-primary bg-primary/10 scale-[1.02]' : ''
            } ${isMobile ? 'p-12' : 'p-20'} text-center mb-8`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-lg">
                <UploadIcon className="w-12 h-12 text-white" />
              </div>
              <h3 className={`font-semibold mb-3 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                Drop your files here
              </h3>
              <p className={`text-muted-foreground mb-6 ${isMobile ? 'text-sm' : 'text-base'}`}>
                or click to browse from your computer
              </p>
              <Button 
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent text-white font-semibold px-8 shadow-lg"
              >
                Choose Files
              </Button>
              <input
                id="fileInput"
                type="file"
                accept="*/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          <div className={`text-center text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'} space-y-1`}>
            <p>Maximum file size: 100MB</p>
            <p>Supported formats: All file types</p>
            <p>Files are stored locally in your browser</p>
          </div>

          {/* Upload Progress - Fixed position at bottom right */}
          {uploadingFiles.length > 0 && (
            <div className="fixed bottom-24 right-8 space-y-3 z-50 max-w-sm">
              {uploadingFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-card border border-border rounded-xl p-4 shadow-2xl animate-fade-in"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {file.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.file.size)}
                      </p>
                    </div>
                  </div>
                  
                  {file.status === 'uploading' && (
                    <div className="space-y-1">
                      <Progress value={file.progress} className="h-1.5" />
                      <p className="text-xs text-muted-foreground text-right">
                        {Math.round(file.progress)}%
                      </p>
                    </div>
                  )}
                  
                  {file.status === 'completed' && (
                    <p className="text-sm text-primary font-medium">
                      Upload successful! ✓
                    </p>
                  )}
                  
                  {file.status === 'error' && (
                    <p className="text-sm text-destructive font-medium">
                      Upload failed
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Upload Dialog */}
      <UploadDialog
        file={pendingFile?.file || null}
        isOpen={!!pendingFile}
        onClose={() => setPendingFile(null)}
        onConfirm={handleUploadConfirm}
      />

      <FloatingAIChat />
    </div>
  );
};

export default Upload;
