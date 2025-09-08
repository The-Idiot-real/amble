import { useState, useEffect, useRef } from 'react';
import { FileGrid } from '@/components/FileGrid';
import { FilePreview } from '@/components/FilePreview';
import { Header } from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { getLocalFilesPaginated, downloadLocalFile, LocalFileData } from '@/lib/localFileStorage';
import { 
  localFileDataArrayToFileDataArray, 
  localFileDataToStoredFile 
} from '@/lib/typeAdapters';
import FloatingAIChat from '@/components/FloatingAIChat';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  // Properly type the files state as LocalFileData[]
  const [files, setFiles] = useState<LocalFileData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  // Properly type the previewFile state as LocalFileData | null
  const [previewFile, setPreviewFile] = useState<LocalFileData | null>(null);
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
      // Set files as LocalFileData[] (no conversion needed here)
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

  const downloadFile = async (file: LocalFileData) => {
    try {
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

  const openPreview = (file: LocalFileData) => {
    setPreviewFile(file);
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Convert LocalFileData[] to FileData[] for FileGrid component */}
        <FileGrid 
          files={localFileDataArrayToFileDataArray(files)}
          isLoading={isLoading}
          totalCount={totalCount}
          currentPage={currentPage}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          onDownload={(fileId: string) => {
            // Find the file by ID and call downloadFile with LocalFileData
            const file = files.find(f => f.id === fileId);
            if (file) downloadFile(file);
          }}
          onPreview={(fileId: string) => {
            // Find the file by ID and call openPreview with LocalFileData
            const file = files.find(f => f.id === fileId);
            if (file) openPreview(file);
          }}
          onShare={() => {}}
        />

        {/* Hero Section */}
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to Amble</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Your intelligent file sharing platform with AI assistance. Upload, organize, and chat with your files.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="/upload" className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90">
              Start Uploading
            </a>
            <a href="/convert" className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg hover:bg-secondary/90">
              Convert Files
            </a>
          </div>
        </div>

        {/* Files Section */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4">Loading your files...</p>
          </div>
        ) : (
          <div>
            {/* Search input */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-md mx-auto block px-4 py-2 border rounded-lg"
              />
            </div>
            
            {/* FileGrid is already rendered above */}
          </div>
        )}

        {/* Convert LocalFileData to StoredFile for FilePreview component */}
        {previewFile && (
          <FilePreview
            file={localFileDataToStoredFile(previewFile)}
            isOpen={!!previewFile}
            onClose={closePreview}
            onDownload={() => previewFile && downloadFile(previewFile)}
          />
        )}
      </main>

      <FloatingAIChat />
    </div>
  );
};

export default Index;
