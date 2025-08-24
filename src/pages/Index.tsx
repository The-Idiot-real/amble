import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { FileCard, FileData } from "@/components/FileCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Mock data for demonstration
const mockFiles: FileData[] = [
  {
    id: "1",
    name: "Project_Presentation.pdf",
    size: "2.4 MB",
    type: "application/pdf",
    uploadDate: "2 hours ago",
    downloadCount: 15,
  },
  {
    id: "2", 
    name: "Summer_Vacation_Photos.zip",
    size: "45.8 MB",
    type: "application/zip",
    uploadDate: "1 day ago",
    downloadCount: 8,
  },
  {
    id: "3",
    name: "Budget_Spreadsheet.xlsx",
    size: "1.2 MB", 
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    uploadDate: "3 days ago",
    downloadCount: 23,
  },
  {
    id: "4",
    name: "Design_Mockups.fig",
    size: "12.6 MB",
    type: "application/figma",
    uploadDate: "1 week ago", 
    downloadCount: 42,
  },
  {
    id: "5",
    name: "Meeting_Recording.mp4",
    size: "156.3 MB",
    type: "video/mp4",
    uploadDate: "2 weeks ago",
    downloadCount: 31,
  },
  {
    id: "6",
    name: "Research_Paper.docx", 
    size: "890 KB",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    uploadDate: "3 weeks ago",
    downloadCount: 67,
  },
];

const Index = () => {
  const [files, setFiles] = useState<FileData[]>(mockFiles);
  const [filteredFiles, setFilteredFiles] = useState<FileData[]>(mockFiles);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFiles(files);
    } else {
      const filtered = files.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFiles(filtered);
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
      // Simulate download
      setTimeout(() => {
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, downloadCount: f.downloadCount + 1 } : f
        ));
      }, 1000);
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
      navigator.clipboard.writeText(`https://sharewell.app/file/${fileId}`);
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
                Upload, share, and manage your files with our modern, secure platform. 
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

            {filteredFiles.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onDownload={handleDownload}
                    onPreview={handlePreview}
                    onShare={handleShare}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-muted-foreground">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No files found</h3>
                  <p>Try adjusting your search query or upload some files.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="container mx-auto text-center">
            <div className="file-card max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-6">
                Join thousands of users who trust ShareWell for their file sharing needs.
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
