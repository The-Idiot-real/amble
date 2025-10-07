import { useState, useCallback } from "react";
import { Upload as UploadIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ModernHeader } from "@/components/ModernHeader";
import { UploadDialog } from "@/components/UploadDialog";
import { uploadFile } from "@/lib/fileService";
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
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === uploadingFile.id 
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        );
      }, 200);

      const uploadedFile = await uploadFile({
        name: data.title,
        description: data.description,
        tags: data.tags,
        file: pendingFile.file
      });

      clearInterval(progressInterval);

      setUploadingFiles(prev =>
        prev.map(f =>
          f.id === uploadingFile.id
            ? { ...f, progress: 100, status: 'completed' }
            : f
        )
      );

      toast({
        title: "Upload Successful",
        description: `${uploadedFile.name} has been uploaded successfully.`,
      });

      // Remove completed upload after 3 seconds
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.id !== uploadingFile.id));
      }, 3000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadingFiles(prev =>
        prev.map(f =>
          f.id === uploadingFile.id
            ? { ...f, progress: 0, status: 'error' }
            : f
        )
      );

      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCloseDialog = () => {
    setPendingFile(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <ModernHeader />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Upload Area */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Upload Files
              </h1>
              <p className="text-lg text-muted-foreground">
                Share your files with the Amble community
              </p>
            </div>

            {/* Drag and Drop Area */}
            <div
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
                dragActive
                  ? "border-[rgb(53,145,181)] bg-cyan-50 dark:bg-cyan-950/30"
                  : "border-border hover:border-[rgb(56,209,120)]"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <UploadIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Drag and drop files here
              </h3>
              <p className="text-muted-foreground mb-4">or</p>
              
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileSelect}
                accept="*/*"
              />
              
              <Button
                onClick={() => document.getElementById('file-upload')?.click()}
                className="bg-gradient-to-r from-[rgb(53,145,181)] to-[rgb(56,209,120)] hover:opacity-90 transition-opacity text-white border-0 shadow-lg"
              >
                Choose Files
              </Button>
            </div>

            {/* Upload Guidelines */}
            <div className="mt-8 grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
              <div className="text-center">
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-950/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UploadIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">Easy Upload</h4>
                <p>Simply drag and drop or click to select files</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-950/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">Instant Access</h4>
                <p>Files are immediately available for download</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-950/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UploadIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">Share Anywhere</h4>
                <p>Share your files with anyone, anywhere</p>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadingFiles.length > 0 && (
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Upload Progress</h2>
              <div className="space-y-4">
                {uploadingFiles.map((file) => (
                  <div key={file.id} className="border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">{file.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {file.status === 'uploading' && `${file.progress}%`}
                        {file.status === 'completed' && '✓ Complete'}
                        {file.status === 'error' && '✗ Failed'}
                      </span>
                    </div>
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="h-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Upload Dialog */}
      {pendingFile && (
        <UploadDialog
          file={pendingFile.file}
          isOpen={!!pendingFile}
          onClose={handleCloseDialog}
          onConfirm={handleUploadConfirm}
        />
      )}

      {!isMobile && <FloatingAIChat />}
    </div>
  );
};

export default Upload;
