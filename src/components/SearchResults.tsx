import { useState, useEffect } from "react";
import { FileCard, FileData } from "./FileCard";
import { X } from "lucide-react";
import { Button } from "./ui/button";

interface SearchResultsProps {
  isVisible: boolean;
  results: FileData[];
  searchQuery: string;
  onClose: () => void;
  onDownload: (fileId: string) => void;
  onPreview: (fileId: string) => void;
  onShare: (fileId: string) => void;
}

export const SearchResults = ({ 
  isVisible, 
  results, 
  searchQuery, 
  onClose,
  onDownload,
  onPreview,
  onShare
}: SearchResultsProps) => {
  const [animationClass, setAnimationClass] = useState("");

  useEffect(() => {
    if (isVisible) {
      setAnimationClass("animate-slide-down");
    } else {
      setAnimationClass("animate-slide-up");
    }
  }, [isVisible]);

  if (!isVisible && animationClass !== "animate-slide-up") return null;

  return (
    <div className={`fixed top-20 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border shadow-lg ${animationClass}`}>
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Search Results for "{searchQuery}" ({results.length} found)
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {results.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onDownload={onDownload}
              onPreview={onPreview}
              onShare={onShare}
            />
          ))}
        </div>
      </div>
    </div>
  );
};