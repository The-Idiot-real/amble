import { useState, useEffect, useRef } from 'react';
import { ModernFileGrid } from '@/components/ModernFileGrid';
import { EnhancedFilePreview } from '@/components/EnhancedFilePreview';
import { ModernHeader } from '@/components/ModernHeader';
import { HeroSection } from '@/pages/HeroSection';
import { useToast } from '@/hooks/use-toast';
import { getFiles, updateFileDownloadCount, formatFileSize } from '@/lib/fileService';
import FloatingAIChat from '@/components/FloatingAIChat';
import { useIsMobile } from '@/hooks/use-mobile';
import { FileData } from '@/components/FileCard';

// Adapter function to convert between interfaces
const convertToFileData = (file: any): FileData => ({
  id: file.id,
  name: file.name,
  size: formatFileSize(file.file_size),
  type: file.file_type,
  uploadDate: new Date(file.upload_date).toLocaleDateString(),
  downloadCount: file.download_count,
  thumbnail: file.file_type.startsWith('image/') ? file.file_path : undefined
});

const Index = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState<any>(null);
  const searchResultsRef = useRef(null);
  const { toast } = useToast();
  const ITEMS_PER_PAGE = 12;
  const isMobile = useIsMobile();

  useEffect(() => {
    loadFiles();
  }, [currentPage, searchQuery]);

  // Load files on mount to ensure they show up
  useEffect(() => {
    const timer = setTimeout(() => {
      loadFiles();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const { files: fetchedFiles, totalCount: count } = await getFiles(
        currentPage,
        ITEMS_PER_PAGE,
        searchQuery
      );
      
      const convertedFiles = fetchedFiles.map(convertToFileData);
      setFiles(convertedFiles);
      setTotalCount(count);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error",
        description: "Failed to load files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (fileId: string) => {
    try {
      const { files: fetchedFiles } = await getFiles(1, 1000);
      const file = fetchedFiles.find((f: any) => f.id === fileId);
      if (!file) return;
      
      // Update download count
      await updateFileDownloadCount(fileId);
      
      // Get file extension from original name or file type
      const extension = file.original_name.includes('.') 
        ? file.original_name.split('.').pop() 
        : file.file_type.split('/').pop();
      
      // Fetch the file as blob
      const response = await fetch(file.file_path);
      const blob = await response.blob();
      
      // Create download link with proper filename
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Update local state
      setFiles(prevFiles => 
        prevFiles.map(f => 
          f.id === fileId 
            ? { ...f, downloadCount: f.downloadCount + 1 }
            : f
        )
      );
      
      toast({
        title: "Download Started",
        description: `Downloading ${file.name}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openPreview = async (fileId: string) => {
    const { files: fetchedFiles } = await getFiles(1, 1000);
    const file = fetchedFiles.find((f: any) => f.id === fileId);
    if (file) {
      setPreviewFile({
        id: file.id,
        name: file.name,
        size: formatFileSize(file.file_size),
        type: file.file_type,
        data: file.file_path,
        uploadDate: new Date(file.upload_date),
        downloadCount: file.download_count
      });
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (searchResultsRef.current) {
      (searchResultsRef.current as HTMLElement).scrollIntoView({ 
        behavior: 'smooth' 
      });
    }
  };

  const handleShare = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: `Share link for ${file.name} copied to clipboard`,
      });
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <ModernHeader 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentPage="home"
      />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Always show hero section */}
        {!searchQuery && <HeroSection />}
        
        {/* Recent Files section */}
        <div ref={searchResultsRef}>
          <ModernFileGrid
            files={files}
            totalCount={totalCount}
            currentPage={currentPage}
            totalPages={totalPages}
            searchQuery={searchQuery}
            isLoading={isLoading}
            onPageChange={handlePageChange}
            onDownload={downloadFile}
            onPreview={openPreview}
            onShare={handleShare}
          />
        </div>
      </main>

      {previewFile && (
        <EnhancedFilePreview
          file={previewFile}
          isOpen={!!previewFile}
          onClose={closePreview}
          onDownload={() => downloadFile(previewFile.id)}
        />
      )}

      {!isMobile && <FloatingAIChat />}
    </div>
  );
};

export default Index;
