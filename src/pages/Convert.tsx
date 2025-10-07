import { useState, useCallback } from "react";
import { RefreshCw, Download, X, File, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ModernHeader } from "@/components/ModernHeader";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import FloatingAIChat from "@/components/FloatingAIChat";
import { EnhancedFileConverter } from "@/lib/enhancedFileConverter";

interface ConversionJob {
  id: string;
  fileName: string;
  originalFormat: string;
  targetFormat: string;
  fileSize: string;
  progress: number;
  status: 'converting' | 'completed' | 'error';
  convertedBlob?: Blob;
  convertedFilename?: string;
}

const Convert = () => {
  const [dragActive, setDragActive] = useState(false);
  const [conversions, setConversions] = useState<ConversionJob[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const formatOptions = [
    // Documents
    { value: "pdf", label: "PDF Document", category: "Document" },
    { value: "txt", label: "Text File", category: "Document" },
    { value: "html", label: "HTML Page", category: "Document" },
    
    // Data Formats
    { value: "json", label: "JSON", category: "Data" },
    { value: "csv", label: "CSV", category: "Data" },
    { value: "xlsx", label: "Excel Spreadsheet", category: "Data" },
    
    // Image Formats
    { value: "png", label: "PNG Image", category: "Image" },
    { value: "jpg", label: "JPEG Image", category: "Image" },
    { value: "webp", label: "WebP Image", category: "Image" },
    { value: "gif", label: "GIF Image", category: "Image" },
  ];

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

    if (e.dataTransfer.files && e.dataTransfer.files[0] && selectedFormat) {
      handleFiles(e.dataTransfer.files);
    } else if (!selectedFormat) {
      toast({
        title: "Format Required",
        description: "Please select a target format before uploading files.",
        variant: "destructive",
      });
    }
  }, [selectedFormat, toast]);

  const getFileExtension = (fileName: string) => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFiles = async (fileList: FileList) => {
    if (!selectedFormat) {
      toast({
        title: "Format Required",
        description: "Please select a target format first.",
        variant: "destructive",
      });
      return;
    }

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const conversionId = Date.now().toString(36) + Math.random().toString(36).substr(2);

      const newConversion: ConversionJob = {
        id: conversionId,
        fileName: file.name,
        originalFormat: getFileExtension(file.name),
        targetFormat: selectedFormat,
        fileSize: formatFileSize(file.size),
        progress: 0,
        status: 'converting'
      };

      setConversions(prev => [...prev, newConversion]);

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setConversions(current => {
            const updated = current.map(c => {
              if (c.id === conversionId && c.status === 'converting' && c.progress < 90) {
                return { ...c, progress: c.progress + Math.random() * 10 };
              }
              return c;
            });
            return updated;
          });
        }, 200);

        // Perform actual conversion
        console.log('Starting conversion:', file.name, 'to', selectedFormat);
        const result = await EnhancedFileConverter.convertFile(file, selectedFormat);
        console.log('Conversion result:', result);

        clearInterval(progressInterval);

        if (result.success && result.blob && result.filename) {
          console.log('Conversion successful, storing blob:', result.filename, 'size:', result.blob.size);
          setConversions(current =>
            current.map(c =>
              c.id === conversionId
                ? { 
                    ...c, 
                    progress: 100, 
                    status: 'completed', 
                    convertedBlob: result.blob, 
                    convertedFilename: result.filename 
                  }
                : c
            )
          );

          toast({
            title: "Conversion Complete! ✓",
            description: `${file.name} converted to ${selectedFormat.toUpperCase()}`,
            className: "bg-primary text-primary-foreground",
          });
        } else {
          throw new Error(result.error || 'Conversion failed');
        }

      } catch (error) {
        setConversions(current =>
          current.map(c =>
            c.id === conversionId
              ? { ...c, status: 'error', progress: 0 }
              : c
          )
        );

        toast({
          title: "Conversion Failed",
          description: error instanceof Error ? error.message : 'An error occurred during conversion',
          variant: "destructive",
        });
      }
    }
  };

  const removeConversion = (id: string) => {
    setConversions(prev => prev.filter(conv => conv.id !== id));
  };

  const downloadFile = (conversion: ConversionJob) => {
    console.log('=== DOWNLOAD CLICKED ===');
    console.log('Conversion ID:', conversion.id);
    console.log('Has blob:', !!conversion.convertedBlob);
    console.log('Blob type:', conversion.convertedBlob?.type);
    console.log('Blob size:', conversion.convertedBlob?.size);
    console.log('Has filename:', !!conversion.convertedFilename);
    console.log('Filename:', conversion.convertedFilename);
    console.log('Status:', conversion.status);
    console.log('Full conversion object:', conversion);
    
    if (!conversion.convertedBlob || !conversion.convertedFilename) {
      console.error('Missing blob or filename!');
      toast({
        title: "Download Failed",
        description: "Converted file not available. Try converting again.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Creating object URL...');
      const url = URL.createObjectURL(conversion.convertedBlob);
      console.log('Object URL created:', url);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = conversion.convertedFilename;
      link.style.display = 'none';
      
      console.log('Appending link and triggering click...');
      document.body.appendChild(link);
      
      // Force click
      link.click();
      console.log('Click triggered');
      
      // Cleanup after a short delay
      setTimeout(() => {
        console.log('Cleaning up...');
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      toast({
        title: "Download Started",
        description: `Downloading ${conversion.convertedFilename}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download file",
        variant: "destructive",
      });
    }
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
            <h1 className={`font-bold mb-4 ${isMobile ? 'text-3xl' : 'text-5xl'}`}>
              <span className="hero-text">File Converter</span>
            </h1>
            <p className={`text-muted-foreground ${isMobile ? 'text-lg' : 'text-xl'}`}>
              Convert your files between different formats quickly and securely.
            </p>
          </div>

          <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
            {/* Conversion Setup */}
            <div className="space-y-6">
              <div className="modern-card">
                <h3 className="text-lg font-semibold mb-4">Select Target Format</h3>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose output format..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[50vh] overflow-y-auto">
                    {Object.entries(
                      formatOptions.reduce((acc, format) => {
                        if (!acc[format.category]) acc[format.category] = [];
                        acc[format.category].push(format);
                        return acc;
                      }, {} as Record<string, typeof formatOptions>)
                    ).map(([category, formats]) => (
                      <div key={category}>
                        <div className="px-2 py-1 text-sm font-semibold text-muted-foreground">
                          {category}
                        </div>
                        {formats.map((format) => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div
                className={`upload-zone ${isMobile ? 'p-8' : 'p-16'} text-center cursor-pointer transition-all ${
                  dragActive ? 'border-primary bg-primary/10 scale-[1.02]' : ''
                } ${!selectedFormat ? 'opacity-50 cursor-not-allowed' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => {
                  if (selectedFormat) {
                    document.getElementById('conversionFileInput')?.click();
                  } else {
                    toast({
                      title: "Format Required",
                      description: "Please select a target format first.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg`}>
                  <RefreshCw className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-white`} />
                </div>
                <h3 className={`font-semibold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                  {selectedFormat ? `Convert to ${selectedFormat.toUpperCase()}` : 'Select format first'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  Drop files here or click to browse
                </p>
                {selectedFormat && (
                  <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent text-white">
                    Choose Files
                  </Button>
                )}
                <input
                  id="conversionFileInput"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
              </div>

              <div className={`text-sm text-muted-foreground space-y-1 ${isMobile ? 'text-xs' : ''}`}>
                <p className="font-medium mb-2">Supported Conversions:</p>
                <p>• Text/Markdown/HTML → PDF</p>
                <p>• Images (PNG, JPG, WEBP) → PDF</p>
                <p>• CSV ↔ JSON ↔ Excel (XLSX)</p>
                <p>• Markdown → HTML</p>
                <p>• Image format conversions</p>
                <p>• HTML → Text</p>
                <p className="font-semibold text-primary">• Maximum file size: 10GB</p>
              </div>
            </div>

            {/* Conversion Queue */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Conversion Queue</h3>
              
              {conversions.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <File className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="text-lg mb-1">No conversions yet</p>
                  <p className="text-sm">Select a format and upload files to get started</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {conversions.map((conversion) => (
                    <div key={conversion.id} className="modern-card p-4">
                      <div className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} mb-3 gap-3`}>
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center shrink-0">
                            {conversion.status === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5 text-primary" />
                            ) : (
                              <File className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{conversion.fileName}</p>
                            <div className={`flex items-center ${isMobile ? 'flex-wrap' : ''} gap-2 mt-1`}>
                              <Badge variant="outline" className="text-xs">
                                {conversion.originalFormat.toUpperCase()}
                              </Badge>
                              <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                {conversion.targetFormat.toUpperCase()}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{conversion.fileSize}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`flex items-center ${isMobile ? 'flex-col gap-2 w-full' : 'space-x-2'} relative z-10`}>
                          {conversion.status === 'completed' && (
                            <button
                              onClick={(e) => {
                                console.log('=== RAW BUTTON CLICK ===');
                                console.log('Event:', e);
                                console.log('Target:', e.target);
                                console.log('Conversion:', conversion);
                                e.preventDefault();
                                e.stopPropagation();
                                downloadFile(conversion);
                              }}
                              style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 100 }}
                              className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent text-white h-9 px-4 py-2 ${isMobile ? 'w-full h-10' : ''}`}
                            >
                              <Download className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'}`} />
                              Download
                            </button>
                          )}
                          <Button
                            variant="ghost"
                            size={isMobile ? "default" : "icon"}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeConversion(conversion.id);
                            }}
                            type="button"
                            className={isMobile ? 'w-full' : 'w-8 h-8'}
                          >
                            <X className="w-4 h-4" />
                            {isMobile && <span className="ml-2">Remove</span>}
                          </Button>
                        </div>
                      </div>
                      
                      {conversion.status === 'converting' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Converting...
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(conversion.progress)}%
                            </span>
                          </div>
                          <Progress value={conversion.progress} className="h-2" />
                        </div>
                      )}

                      {conversion.status === 'completed' && (
                        <p className="text-sm text-primary font-medium">
                          Conversion complete! ✓
                        </p>
                      )}

                      {conversion.status === 'error' && (
                        <p className="text-sm text-destructive font-medium">
                          Conversion failed
                        </p>
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

export default Convert;
