import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { FileGrid } from "@/components/FileGrid";
import { FilePreview } from "@/components/FilePreview";
import AiChat from "@/components/AiChat";
import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getFiles, downloadFile as downloadFileService, FileData } from "@/lib/fileService";

const Index = () => {
  const [files, setFiles] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const searchResultsRef = useRef(null);
  const ITEMS_PER_PAGE = 9;

  useEffect(() => {
    loadFiles();
  }, [currentPage, searchQuery]);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const {
        files: fetchedFiles,
        totalCount: count
      } = await getFiles(currentPage, ITEMS_PER_PAGE, searchQuery);
      setFiles(fetchedFiles);
      setTotalCount(count);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error",
        description: "Failed to load files. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (file: FileData) => {
    try {
      await downloadFileService(file.id);
      toast({
        title: "Success",
        description: "File downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
  };

  const openPreview = (file: FileData) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewFile(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Welcome to Amble
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your intelligent file management and AI assistant platform
          </p>
          
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload Files
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/convert">
                <ArrowRight className="mr-2 h-4 w-4" />
                Convert Files
              </Link>
            </Button>
          </div>
        </section>

        {/* AI Chat Section */}
        <section className="mb-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold mb-2">AI Assistant</h2>
            <p className="text-muted-foreground">
              Chat with our AI assistant to help you with your files and questions
            </p>
          </div>
          
          <AiChat />
        </section>

        {/* Files Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Your Files</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadFiles}
                disabled={isLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p>Loading files...</p>
            </div>
          ) : (
            <FileGrid
              files={files}
              onDownload={downloadFile}
              onPreview={openPreview}
              ref={searchResultsRef}
            />
          )}
        </section>
      </main>

      {/* File Preview Modal */}
      <FilePreview
        file={previewFile}
        isOpen={isPreviewOpen}
        onClose={closePreview}
      />
    </div>
  );
};

export default Index;
