import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { FileCard, FileData } from "@/components/FileCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, Sparkles, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getStoredFiles, searchFiles, downloadFile, formatFileSize } from "@/lib/fileStorage";

const Index = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = () => {
    const storedFiles = getStoredFiles();
    const fileData: FileData[] = storedFiles.map(file => ({
      id: file.id,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
      uploadDate: new Date(file.uploadDate).toLocaleDateString(),
      downloadCount: file.downloadCount
    }));
    setFiles(fileData);
    setFilteredFiles(fileData);
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFiles(files);
    } else {
      const storedResults = searchFiles(searchQuery);
      const searchResults: FileData[] = storedResults.map(file => ({
        id: file.id,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        uploadDate: new Date(file.uploadDate).toLocaleDateString(),
        downloadCount: file.downloadCount
      }));
      setFilteredFiles(searchResults);
    }
  }, [searchQuery, files]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleDownload = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      toast({
        title: "Download Started",
        description: `Downloading ${file.name}...`,
      });
      downloadFile(fileId);
      // Refresh files to update download count
      setTimeout(() => {
        loadFiles();
      }, 500);
    }
  };

  const handlePreview = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      toast({
        title: "Preview",
        description: `Opening preview for ${file.name}...`,
      });
    }
  };

  const handleShare = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      navigator.clipboard.writeText(`https://amble.app/file/${fileId}`);
      toast({
        title: "Link Copied",
        description: `Share link for ${file.name} copied to clipboard!`,
      });
    }
  };

  return (
    <div className="min-h-screen">
      <Header onSearch={handleSearch} />
      
      <main>
        {/* Hero Section */}
        <section className="py-20 px-6 text-center">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Share Files <span className="gradient-text">Beautifully</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Upload, share, convert, and manage your files with our modern, secure platform. 
              Beautiful design meets powerful functionality.
            </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent">
                  <Link to="/upload">
                    <Upload className="w-5 h-5 mr-2" />
                    Start Uploading
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/convert">
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Convert Files
                  </Link>
                </Button>
                <Button variant="ghost" size="lg" asChild>
                  <Link to="/about">
                    Learn More
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Files Section */}
        <section className="py-16 px-6">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  Recent Files
                  <Sparkles className="inline w-6 h-6 ml-2 text-primary" />
                </h2>
                <p className="text-muted-foreground">
                  {searchQuery ? `Found ${filteredFiles.length} files matching "${searchQuery}"` : 
                   `${files.length} files available for download`}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFiles.length > 0 ? (
                filteredFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onDownload={handleDownload}
                    onPreview={handlePreview}
                    onShare={handleShare}
                  />
                ))
              ) : files.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <div className="text-muted-foreground">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No files uploaded yet</h3>
                    <p className="mb-4">Be the first to share something amazing!</p>
                    <Button asChild className="bg-gradient-to-r from-primary to-accent">
                      <Link to="/upload">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Files
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="col-span-full text-center py-16">
                  <div className="text-muted-foreground">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No files found</h3>
                    <p>Try adjusting your search query.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="container mx-auto text-center">
            <div className="file-card max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-6">
                Join thousands of users who trust Amble for their file sharing and conversion needs.
              </p>
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent">
                <Link to="/upload">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Your First File
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
