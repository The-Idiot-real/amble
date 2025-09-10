import { useState, useCallback } from "react";
import { RefreshCw, Upload as UploadIcon, Download, X, File, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { convertFile, downloadConvertedFile, formatFileSize } from "@/lib/localFileConverter";
import { useIsMobile } from "@/hooks/use-mobile";
import FloatingAIChat from "@/components/FloatingAIChat";

interface ConversionJob {
  id: string;
  fileName: string;
  originalFormat: string;
  targetFormat: string;
  fileSize: string;
  progress: number;
  status: 'uploading' | 'converting' | 'completed' | 'error';
  convertedFileId?: string;
}

const Convert = () => {
  const [dragActive, setDragActive] = useState(false);
  const [conversions, setConversions] = useState<ConversionJob[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const formatOptions = [
    { value: "pdf", label: "PDF", category: "Document" },
    { value: "docx", label: "Word Document", category: "Document" },
    { value: "xlsx", label: "Excel Spreadsheet", category: "Document" },
    { value: "pptx", label: "PowerPoint", category: "Document" },
    { value: "txt", label: "Text File", category: "Document" },
    { value: "jpg", label: "JPEG Image", category: "Image" },
    { value: "png", label: "PNG Image", category: "Image" },
    { value: "webp", label: "WebP Image", category: "Image" },
    { value: "gif", label: "GIF Image", category: "Image" },
    { value: "svg", label: "SVG Vector", category: "Image" },
    { value: "mp4", label: "MP4 Video", category: "Video" },
    { value: "avi", label: "AVI Video", category: "Video" },
    { value: "mov", label: "MOV Video", category: "Video" },
    { value: "mp3", label: "MP3 Audio", category: "Audio" },
    { value: "wav", label: "WAV Audio", category: "Audio" },
    { value: "zip", label: "ZIP Archive", category: "Archive" },
    { value: "rar", label: "RAR Archive", category: "Archive" },
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

  const handleFiles = async (fileList: FileList) => {
    if (!selectedFormat) {
      toast({
        title: "Format Required",
        description: "Please select a target format first.",
        variant: "destructive",
      });
      return;
    }

    const newConversions = Array.from(fileList).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      fileName: file.name,
      originalFormat: getFileExtension(file.name),
      targetFormat: selectedFormat,
      fileSize: formatFileSize(file.size),
      progress: 0,
      status: 'uploading' as const
    }));

    setConversions(prev => [...prev, ...newConversions]);

    // Process each file
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const conversionIndex = conversions.length + i;

      try {
        // Simulate upload progress
        const uploadInterval = setInterval(() => {
          setConversions(current => {
            const updated = [...current];
            if (updated[conversionIndex] && updated[conversionIndex].status === 'uploading') {
              updated[conversionIndex].progress += Math.random() * 20;
              if (updated[conversionIndex].progress >= 50) {
                updated[conversionIndex].status = 'converting';
                updated[conversionIndex].progress = 50;
                clearInterval(uploadInterval);
              }
            }
            return updated;
          });
        }, 200);

        // Perform actual conversion
        const convertedFile = await convertFile(file, selectedFormat);

        // Update conversion progress
        const conversionInterval = setInterval(() => {
          setConversions(current => {
            const updated = [...current];
            if (updated[conversionIndex] && updated[conversionIndex].status === 'converting') {
              updated[conversionIndex].progress += Math.random() * 10;
              if (updated[conversionIndex].progress >= 100) {
                updated[conversionIndex].progress = 100;
                updated[conversionIndex].status = 'completed';
                updated[conversionIndex].convertedFileId = convertedFile.id;
                clearInterval(conversionInterval);
                
                toast({
                  title: "Conversion Complete",
                  description: `${file.name} converted to ${selectedFormat.toUpperCase()}`,
                });
              }
            }
            return updated;
          });
        }, 300);

      } catch (error) {
        setConversions(current => {
          const updated = [...current];
          if (updated[conversionIndex]) {
            updated[conversionIndex].status = 'error';
            updated[conversionIndex].progress = 0;
          }
          return updated;
        });

        toast({
          title: "Conversion Failed",
          description: `Failed to convert ${file.name}. Please try again.`,
          variant: "destructive",
        });
      }
    }
  };

  const removeConversion = (id: string) => {
    setConversions(prev => prev.filter(conv => conv.id !== id));
  };

  const downloadFile = (conversion: ConversionJob) => {
    if (conversion.convertedFileId) {
      downloadConvertedFile(conversion.convertedFileId);
      toast({
        title: "Download Started",
        description: `Downloading converted ${conversion.fileName}`,
      });
    }
  };

  const getStatusColor = (status: ConversionJob['status']) => {
    switch (status) {
      case 'uploading': return 'bg-blue-500';
      case 'converting': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: ConversionJob['status']) => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'converting': return 'Converting...';
      case 'completed': return 'Ready to download';
      case 'error': return 'Conversion failed';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className={`container mx-auto ${isMobile ? 'px-4 py-8' : 'px-6 py-12'}`}>
        <div className="max-w-6xl mx-auto">
          <div className={`text-center ${isMobile ? 'mb-8' : 'mb-12'}`}>
            <h1 className={`font-bold mb-4 ${isMobile ? 'text-3xl' : 'text-4xl'}`}>
              <span className="gradient-text">File Converter</span>
            </h1>
            <p className={`text-muted-foreground ${isMobile ? 'text-lg' : 'text-xl'}`}>
              Convert your files between different formats quickly and securely using local processing.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Conversion Setup */}
            <div className="space-y-6">
              <div className="file-card">
                <h3 className="text-lg font-semibold mb-4">Select Target Format</h3>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose output format..." />
                  </SelectTrigger>
                  <SelectContent>
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
                className={`upload-zone p-12 text-center cursor-pointer transition-all ${
                  dragActive ? 'border-primary scale-105' : ''
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
                <RefreshCw className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {selectedFormat ? `Convert to ${selectedFormat.toUpperCase()}` : 'Select format first'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  Drop files here or click to browse
                </p>
                {selectedFormat && (
                  <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent">
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

              <div className="text-sm text-muted-foreground">
                <p>Maximum file size: 100MB per file</p>
                <p>Batch conversion supported</p>
              </div>
            </div>

            {/* Conversion Queue */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Conversion Queue</h3>
              
              {conversions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No conversions yet</p>
                  <p className="text-sm">Select a format and upload files to get started</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {conversions.map((conversion) => (
                    <div key={conversion.id} className="file-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                            <File className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{conversion.fileName}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {conversion.originalFormat.toUpperCase()}
                              </Badge>
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                              <Badge variant="secondary" className="text-xs">
                                {conversion.targetFormat.toUpperCase()}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{conversion.fileSize}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {conversion.status === 'completed' && (
                            <Button
                              size="sm"
                              onClick={() => downloadFile(conversion)}
                              className="bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeConversion(conversion.id)}
                            className="w-6 h-6"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {getStatusText(conversion.status)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(conversion.progress)}%
                          </span>
                        </div>
                        <Progress value={conversion.progress} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Popular Conversions */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold mb-6 text-center">Popular Conversions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                "PDF → DOCX", "JPG → PNG", "MP4 → MP3", 
                "DOCX → PDF", "PNG → JPG", "WAV → MP3",
                "XLSX → CSV", "GIF → MP4", "RAR → ZIP",
                "SVG → PNG", "MOV → MP4", "PPTX → PDF"
              ].map((conversion, index) => (
                <div key={index} className="file-card text-center p-4 hover:scale-105 transition-transform cursor-pointer">
                  <div className="text-sm font-medium text-muted-foreground">
                    {conversion}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <FloatingAIChat />
    </div>
  );
};

export default Convert;