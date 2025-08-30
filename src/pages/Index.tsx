import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { FileGrid } from "@/components/FileGrid";
import { FilePreview } from "@/components/FilePreview";
import AiChat from "@/components/AiChat"; // ✅ default import
import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getFiles, downloadFile as downloadFileService, FileData } from "@/lib/fileService";

const Index = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 9;

  useEffect(() => {
    loadFiles();
  }, [currentPage, searchQuery]);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const { files: fetchedFiles, totalCount: count } = await getFiles(currentPage, ITEMS_PER_PAGE, searchQuery);
      setFiles(fetchedFiles);
      setTotalCount(count);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({ title: "Error", description: "Failed to load files.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    if (query.trim() && searchResultsRef.current) {
      setTimeout(() => searchResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  };

  const handleDownload = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    try {
      const link = document.createElement('a');
      link.href = file.file_path;
      link.download = file.original_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      await downloadFileService(fileId);
      toast({ title: "Download Started", description: `Downloading ${file.name}...` });
      setTimeout(() => loadFiles(), 1000);
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: "Download Failed", description: "Failed to download file.", variant: "destructive" });
    }
  };

  const handlePreview = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      setPreviewFile({ id: file.id, name: file.name, type: file.file_type, data: file.file_path });
      setIsPreviewOpen(true);
    }
  };

  const handleShare = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    navigator.clipboard.writeText(`${window.location.origin}/file/${fileId}`);
    toast({ title: "Link Copied", description: `Share link for ${file.name} copied!` });
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen">
      <Header onSearch={handleSearch} />

      <main>
        <section className="py-20 px-6 text-center">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Share Files <span className="gradient-text">Efficiently</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Upload, share, convert, and manage your files with our modern, secure platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent">
                <Link to="/upload"><Upload className="w-5 h-5 mr-2" />Start Uploading</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/convert"><RefreshCw className="w-5 h-5 mr-2" />Convert Files</Link>
              </Button>
              <Button variant="ghost" size="lg" asChild>
                <Link to="/about">Learn More<ArrowRight className="w-5 h-5 ml-2" /></Link>
              </Button>
            </div>
          </div>
        </section>

        <section ref={searchResultsRef} className="py-16 px-6">
          <div className="container mx-auto">
            <FileGrid files={files} totalCount={totalCount} currentPage={currentPage} totalPages={totalPages} searchQuery={searchQuery} isLoading={isLoading} onPageChange={setCurrentPage} onDownload={handleDownload} onPreview={handlePreview} onShare={handleShare} />
          </div>
        </section>

        {!searchQuery && <section className="py-20 px-6">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-6">Join thousands of users who trust Amble for file sharing and conversion.</p>
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent">
              <Link to="/upload"><Upload className="w-5 h-5 mr-2" />Upload Your First File</Link>
            </Button>
          </div>
        </section>}
      </main>

      <FilePreview file={previewFile} isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} onDownload={() => previewFile && handleDownload(previewFile.id)} />

      {/* ✅ AI Chat */}
      <AiChat />
    </div>
  );
};

export default Index;
