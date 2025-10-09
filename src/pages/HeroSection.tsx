import { Button } from '@/components/ui/button';
import { Upload, RefreshCw, ArrowRight, FileText, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
export const HeroSection = () => {
  return <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 py-16">
      <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
        <span className="text-foreground">Share Files </span>
        <span className="bg-gradient-to-r from-[rgb(53,145,181)] to-[rgb(56,209,120)] bg-clip-text text-transparent">Efficiently</span>
      </h1>
      
      <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl animate-fade-in">
        Upload, share, convert, and manage your files with our modern, secure platform. Beautiful design meets powerful functionality.
      </p>
      
      <div className="flex flex-wrap gap-4 mb-16 animate-fade-in justify-center">
        <Link to="/upload">
          <Button size="lg" className="text-lg px-8 py-6 rounded-xl bg-gradient-to-r from-[rgb(53,145,181)] to-[rgb(56,209,120)] hover:opacity-90 transition-opacity border-0 shadow-lg">
            <Upload className="w-5 h-5 mr-2" />
            Start Uploading
          </Button>
        </Link>
        <Link to="/convert">
          <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-xl border-2">
            <RefreshCw className="w-5 h-5 mr-2" />
            Convert Files
          </Button>
        </Link>
        <Link to="/about">
          <Button size="lg" variant="ghost" className="text-lg px-6 py-6 rounded-xl">
            Learn More
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
    </div>;
};