import { Upload, Shuffle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const HeroSection = () => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 hero-text">
          Share Your Files with Amble
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Upload, convert, and share files effortlessly. Your digital library, simplified.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link to="/upload">
            <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent text-white px-8 py-6 text-lg rounded-xl">
              <Upload className="mr-2 h-5 w-5" />
              Start Uploading
            </Button>
          </Link>
          <Link to="/convert">
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg rounded-xl border-2">
              <Shuffle className="mr-2 h-5 w-5" />
              Convert Files
            </Button>
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary transition-colors">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 mx-auto">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Easy Upload</h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop files or browse to upload. Support for all file types.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary transition-colors">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 mx-auto">
              <Shuffle className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Format Conversion</h3>
            <p className="text-sm text-muted-foreground">
              Convert between various file formats quickly and efficiently.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary transition-colors">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 mx-auto">
              <Download className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant Download</h3>
            <p className="text-sm text-muted-foreground">
              Download files instantly with one click. Track download counts.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
