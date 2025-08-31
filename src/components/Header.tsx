import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Upload, Menu, X, RefreshCw, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/ThemeProvider";
import { SearchResults } from "./SearchResults";
import { FileData } from "./FileCard";
import ambleLogoDark from "@/assets/amble-logo-dark.png";
import ambleLogoLight from "@/assets/amble-logo-light.png";

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchResults?: FileData[];
  onDownload?: (fileId: string) => void;
  onPreview?: (fileId: string) => void;
  onShare?: (fileId: string) => void;
}

export const Header = ({ 
  onSearch, 
  searchResults = [], 
  onDownload, 
  onPreview, 
  onShare 
}: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch?.(searchQuery);
      setShowSearchResults(true);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent p-2 shadow-colorful">
              <img 
                src={ambleLogoDark} 
                alt="Amble Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              AMBLE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`font-semibold text-lg transition-all duration-300 hover:scale-105 ${
                isActive('/') 
                  ? 'text-primary drop-shadow-lg' 
                  : 'text-slate-300 hover:text-primary'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/upload" 
              className={`font-semibold text-lg transition-all duration-300 hover:scale-105 ${
                isActive('/upload') 
                  ? 'text-secondary drop-shadow-lg' 
                  : 'text-slate-300 hover:text-secondary'
              }`}
            >
              Upload
            </Link>
            <Link 
              to="/convert" 
              className={`font-semibold text-lg transition-all duration-300 hover:scale-105 ${
                isActive('/convert') 
                  ? 'text-accent drop-shadow-lg' 
                  : 'text-slate-300 hover:text-accent'
              }`}
            >
              Convert
            </Link>
            <Link 
              to="/about" 
              className={`font-semibold text-lg transition-all duration-300 hover:scale-105 ${
                isActive('/about') 
                  ? 'text-tertiary drop-shadow-lg' 
                  : 'text-slate-300 hover:text-tertiary'
              }`}
            >
              About
            </Link>
          </nav>

          {/* Search Bar and Theme Toggle */}
          <div className="hidden md:flex items-center space-x-4">
            <form onSubmit={handleSearch} className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 w-72 bg-slate-700/70 border-slate-600 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary rounded-xl"
                />
              </div>
              <Button 
                type="submit" 
                size="sm" 
                className="bg-gradient-to-r from-primary to-accent text-white hover:from-primary-dark hover:to-accent/80 px-6 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Search
              </Button>
            </form>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="relative bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white rounded-xl w-12 h-12 transition-all duration-300 hover:scale-105"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border pt-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="font-medium text-muted-foreground hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/upload" 
                className="font-medium text-muted-foreground hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Upload
              </Link>
              <Link 
                to="/convert" 
                className="font-medium text-muted-foreground hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Convert
              </Link>
              <Link 
                to="/about" 
                className="font-medium text-muted-foreground hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
            </nav>
            
            <form onSubmit={handleSearch} className="mt-4 flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" size="sm" className="bg-gradient-to-r from-primary to-accent">
                Search
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="relative"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </form>
          </div>
        )}
      </div>
    </header>
    
    {/* Search results will be handled by parent component */}
    </>
  );
};