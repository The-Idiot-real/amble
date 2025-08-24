import { useState, useCallback } from "react";
import { Upload as UploadIcon, File, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";

interface UploadedFile {
  name: string;
  size: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

const Upload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

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
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = (fileList: FileList) => {
    const newFiles = Array.from(fileList).map(file => ({
      name: file.name,
      size: formatFileSize(file.size),
      progress: 0,
      status: 'uploading' as const
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach((_, index) => {
      const fileIndex = files.length + index;
      const interval = setInterval(() => {
        setFiles(currentFiles => {
          const updatedFiles = [...currentFiles];
          if (updatedFiles[fileIndex]) {
            updatedFiles[fileIndex].progress += Math.random() * 20;
            if (updatedFiles[fileIndex].progress >= 100) {
              updatedFiles[fileIndex].progress = 100;
              updatedFiles[fileIndex].status = 'completed';
              clearInterval(interval);
              toast({
                title: "Upload Complete",
                description: `${updatedFiles[fileIndex].name} has been uploaded successfully.`,
              });
            }
          }
          return updatedFiles;
        });
      }, 300);
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Upload Your Files</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Share your files with the world. Drag and drop or click to upload.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Upload Zone */}
            <div className="space-y-6">
              <div
                className={`upload-zone p-12 text-center cursor-pointer transition-all ${
                  dragActive ? 'border-primary scale-105' : ''
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <UploadIcon className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Drop files here</h3>
                <p className="text-muted-foreground mb-4">
                  or click to browse from your computer
                </p>
                <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent">
                  Choose Files
                </Button>
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Maximum file size: 100MB</p>
                <p>Supported formats: All file types</p>
              </div>
            </div>

            {/* Upload Progress */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Upload Progress</h3>
              
              {files.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No files selected yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="file-card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                            {file.status === 'completed' ? (
                              <CheckCircle className="w-4 h-4 text-primary" />
                            ) : (
                              <File className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{file.size}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                          className="w-6 h-6"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      {file.status === 'uploading' && (
                        <div className="space-y-1">
                          <Progress value={file.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {Math.round(file.progress)}% uploaded
                          </p>
                        </div>
                      )}
                      
                      {file.status === 'completed' && (
                        <p className="text-xs text-primary font-medium">Upload complete!</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Upload;