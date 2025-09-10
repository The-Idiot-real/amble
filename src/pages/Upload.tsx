import { useState, useCallback } from "react";
import { Upload as UploadIcon, File, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ModernHeader } from "@/components/ModernHeader";

import { uploadFileLocally, formatFileSize } from "@/lib/localFileStorage";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import FloatingAIChat from "@/components/FloatingAIChat";

interface UploadedFile {
  name: string;
  size: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  file: File;
  customName: string;
}

interface FileFormData {
  name: string;
  topic: string;
  description: string;
  tags: string;
}

const Upload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [formData, setFormData] = useState<FileFormData>({
    name: '',
    topic: '',
    description: '',
    tags: ''
  });
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
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = async (fileList: FileList) => {
    const newFiles = Array.from(fileList).map(file => ({
      name: file.name,
      size: formatFileSize(file.size),
      progress: 0,
      status: 'uploading' as const,
      file: file,
      customName: '' // Start with empty custom name for user input
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const uploadFile = async (fileData: UploadedFile) => {
    if (!fileData.customName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the file before uploading.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setFiles(currentFiles => {
          const updatedFiles = [...currentFiles];
          const fileIndex = updatedFiles.findIndex(f => f.file === fileData.file);
          if (fileIndex !== -1 && updatedFiles[fileIndex].status === 'uploading') {
            updatedFiles[fileIndex].progress += Math.random() * 20;
            if (updatedFiles[fileIndex].progress >= 100) {
              updatedFiles[fileIndex].progress = 100;
              clearInterval(uploadInterval);
            }
          }
          return updatedFiles;
        });
      }, 200);

      // Parse tags from input (supports #tag format)
      const parsedTags = formData.tags 
        ? formData.tags.split(',').map(tag => tag.trim().replace(/^#/, '')).filter(Boolean)
        : [];

      await uploadFileLocally({
        file: fileData.file,
        name: fileData.customName,
        topic: formData.topic || undefined,
        description: formData.description || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined
      });

      // Update status to completed
      setFiles(currentFiles => {
        const updatedFiles = [...currentFiles];
        const fileIndex = updatedFiles.findIndex(f => f.file === fileData.file);
        if (fileIndex !== -1) {
          updatedFiles[fileIndex].status = 'completed';
          updatedFiles[fileIndex].progress = 100;
        }
        return updatedFiles;
      });

      toast({
        title: "Upload Complete",
        description: `${fileData.customName} has been uploaded successfully.`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      setFiles(currentFiles => {
        const updatedFiles = [...currentFiles];
        const fileIndex = updatedFiles.findIndex(f => f.file === fileData.file);
        if (fileIndex !== -1) {
          updatedFiles[fileIndex].status = 'error';
        }
        return updatedFiles;
      });

      toast({
        title: "Upload Failed",
        description: `Failed to upload ${fileData.customName}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
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
        <div className="max-w-6xl mx-auto">
          <div className={`text-center ${isMobile ? 'mb-8' : 'mb-12'}`}>
            <h1 className={`font-bold mb-4 ${isMobile ? 'text-3xl' : 'text-4xl'}`}>
              <span className="gradient-text">Upload Your Files</span>
            </h1>
            <p className={`text-muted-foreground ${isMobile ? 'text-lg' : 'text-xl'}`}>
              Share and convert your files with the world. Name your files and add tags for better organization.
            </p>
          </div>

          <div className={`space-y-8 ${isMobile ? '' : 'grid gap-8 lg:grid-cols-3'}`}>
            {/* File Metadata Form */}
            <div className="space-y-6">
              <div className="file-card">
                <h3 className={`font-semibold mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>File Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="topic">Topic</Label>
                    <Input
                      id="topic"
                      value={formData.topic}
                      onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                      placeholder="e.g., Work, Personal, Study"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of your files..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="study, work, important (or #study, #work)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Separate with commas. Use # for hashtags (e.g., #study, #work)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Zone */}
            <div className="space-y-6">
              <div
                className={`upload-zone cursor-pointer transition-all ${
                  dragActive ? 'border-primary scale-105' : ''
                } ${isMobile ? 'p-8' : 'p-12'} text-center`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <UploadIcon className={`text-primary mx-auto mb-4 ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`} />
                <h3 className={`font-semibold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>Drop files here</h3>
                <p className={`text-muted-foreground mb-4 ${isMobile ? 'text-sm' : ''}`}>
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

              <div className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                <p>Maximum file size: 100MB</p>
                <p>Supported formats: All file types</p>
                <p>Files are stored locally in your browser</p>
              </div>
            </div>

            {/* Upload Progress */}
            <div className="space-y-4">
              <h3 className={`font-semibold ${isMobile ? 'text-lg' : 'text-xl'}`}>Files to Upload</h3>
              
              {files.length === 0 ? (
                <div className={`text-center text-muted-foreground ${isMobile ? 'py-8' : 'py-12'}`}>
                  <File className={`mx-auto mb-4 opacity-50 ${isMobile ? 'w-8 h-8' : 'w-12 h-12'}`} />
                  <p className={isMobile ? 'text-sm' : ''}>No files selected yet</p>
                </div>
              ) : (
                <div className={`space-y-3 overflow-y-auto ${isMobile ? 'max-h-64' : 'max-h-96'}`}>
                  {files.map((file, index) => (
                    <div key={index} className="file-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className={`bg-muted rounded-lg flex items-center justify-center ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}>
                            {file.status === 'completed' ? (
                              <CheckCircle className={`text-primary ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                            ) : (
                              <File className={`text-muted-foreground ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="space-y-2">
                              <Input
                                value={file.customName}
                                onChange={(e) => {
                                  setFiles(currentFiles => {
                                    const updatedFiles = [...currentFiles];
                                    const fileIndex = updatedFiles.findIndex(f => f === file);
                                    if (fileIndex !== -1) {
                                      updatedFiles[fileIndex].customName = e.target.value;
                                    }
                                    return updatedFiles;
                                  });
                                }}
                                className={`font-medium ${isMobile ? 'text-sm h-8' : 'text-sm'}`}
                                placeholder="Enter file name..."
                                disabled={file.status === 'completed'}
                              />
                              <div className="flex items-center gap-2">
                                <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                                  Original: {file.name} ({file.size})
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {file.status === 'uploading' && file.customName.trim() && (
                            <Button
                              size="sm"
                              onClick={() => uploadFile(file)}
                              className="bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent"
                            >
                              Upload
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(index)}
                            className={isMobile ? 'w-6 h-6' : 'w-6 h-6'}
                          >
                            <X className={isMobile ? 'w-2 h-2' : 'w-3 h-3'} />
                          </Button>
                        </div>
                      </div>
                      
                      {file.status === 'uploading' && file.progress > 0 && (
                        <div className="space-y-1">
                          <Progress value={file.progress} className="h-2" />
                          <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                            {Math.round(file.progress)}% uploaded
                          </p>
                        </div>
                      )}
                      
                      {file.status === 'completed' && (
                        <div className="flex items-center gap-2">
                          <p className={`text-primary font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>Upload complete!</p>
                          {formData.tags && (
                            <div className="flex gap-1 flex-wrap">
                              {formData.tags.split(',').map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="secondary" className="text-xs">
                                  #{tag.trim().replace(/^#/, '')}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <FloatingAIChat />
    </div>
  );
};

export default Upload;