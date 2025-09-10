import { useState, useEffect, useRef } from 'react';
import { ModernFileGrid } from '@/components/ModernFileGrid';
import { FilePreview } from '@/components/FilePreview';
import { ModernHeader } from '@/components/ModernHeader';
import { useToast } from '@/hooks/use-toast';
import { getLocalFilesPaginated, downloadLocalFile, LocalFileData, formatFileSize } from '@/lib/localFileStorage';
import FloatingAIChat from '@/components/FloatingAIChat';
import { useIsMobile } from '@/hooks/use-mobile';
import { FileData } from '@/components/FileCard';
import { StoredFile } from '@/lib/fileStorage';

// Adapter functions to convert between interfaces
const convertToFileData = (localFile: LocalFileData): FileData => ({
  id: localFile.id,
  name: localFile.name,
  size: formatFileSize(localFile.fileSize),
  type: localFile.fileType,
  uploadDate: new Date(localFile.uploadDate).toLocaleDateString(),
  downloadCount: localFile.downloadCount,
  thumbnail: localFile.fileType.startsWith('image/') ? localFile.data : undefined
});

const convertToStoredFile = (localFile: LocalFileData): StoredFile => ({
  id: localFile.id,
  name: localFile.name,
  size: localFile.fileSize,
  type: localFile.fileType,
  data: localFile.data,
  uploadDate: new Date(localFile.uploadDate),
  downloadCount: localFile.downloadCount
});

const Index = () => {
  const [files, setFiles] = useState<LocalFileData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);
  const searchResultsRef = useRef(null);
  const { toast } = useToast();
  const ITEMS_PER_PAGE = 9;
  const isMobile = useIsMobile();

  useEffect(() => {
    loadFiles();
  }, [currentPage, searchQuery]);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const { 
        files: fetchedFiles, 
        totalCount: count 
      } = getLocalFilesPaginated(currentPage, ITEMS_PER_PAGE, searchQuery);
      
      setFiles(fetchedFiles);
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
      const file = files.find(f => f.id === fileId);
      if (!file) return;

      downloadLocalFile(file.id);

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

  const openPreview = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      setPreviewFile(convertToStoredFile(file));
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  return (
    <div className="min-h-screen">
      <ModernHeader 
        onSearch={setSearchQuery}
        searchResults={files.map(convertToFileData)}
        onDownload={downloadFile}
        onPreview={openPreview}
        onShare={() => {}}
      />
      
      <main className={`container mx-auto px-4 py-8 ${isMobile ? 'px-2' : 'px-6 py-12'}`}>
        {/* Hero Section */}
        <section className={`text-center ${isMobile ? 'mb-8' : 'mb-16'}`}>
          <div className="max-w-4xl mx-auto">
            <h1 className={`font-bold mb-6 ${isMobile ? 'text-3xl' : 'text-5xl md:text-6xl'}`}>
              <span className="gradient-text">Welcome to Amble</span>
            </h1>
            <p className={`text-muted-foreground mb-8 leading-relaxed ${isMobile ? 'text-lg mb-6' : 'text-xl md:text-2xl mb-8'}`}>
              Your intelligent file sharing platform with AI assistance. Upload, organize, and chat with your files.
            </p>
            <div className={`flex gap-4 justify-center ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'}`}>
              <a 
                href="/upload" 
                className={`inline-flex items-center justify-center font-semibold text-white rounded-xl transition-all duration-200 bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent hover:scale-105 neon-glow ${isMobile ? 'px-6 py-3 text-base' : 'px-8 py-4 text-lg'}`}
              >
                Start Uploading
              </a>
              <a 
                href="/convert" 
                className={`inline-flex items-center justify-center font-semibold border-2 border-primary text-primary rounded-xl transition-all duration-200 hover:bg-primary hover:text-white hover:scale-105 ${isMobile ? 'px-6 py-3 text-base' : 'px-8 py-4 text-lg'}`}
              >
                Convert Files
              </a>
            </div>
          </div>
        </section>

        {/* Files Section */}
        <section ref={searchResultsRef}>
          {isLoading ? (
            <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className={`mt-4 text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>Loading your files...</p>
            </div>
          ) : (
            <ModernFileGrid
              files={files.map(convertToFileData)}
              totalCount={totalCount}
              currentPage={currentPage}
              totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)}
              onPageChange={setCurrentPage}
              onDownload={downloadFile}
              onPreview={openPreview}
              onShare={() => {}}
              searchQuery={searchQuery}
            />
          )}
        </section>
      </main>

      {previewFile && (
        <FilePreview 
          file={previewFile} 
          isOpen={!!previewFile}
          onClose={closePreview}
          onDownload={() => downloadFile(previewFile.id)}
        />
      )}

      <FloatingAIChat />
    </div>
  );
};

export default Index;