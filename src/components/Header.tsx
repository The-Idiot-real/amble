import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Upload, Menu, X, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/ThemeProvider";
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
  onShare,
}: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch?.(searchQuery);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="grid grid-cols-[auto_1fr_auto] items-center h-16">
          {/* Notch with Logo */}
          <div className="relative bg-background rounded-br-3xl shadow-md flex items-center h-16 px-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent p-2 shadow-lg flex items-center justify-center">
                <img
                  src={theme === "dark" ? ambleLogoDark : ambleLogoLight}
                  alt="Amble Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="font-bold text-xl text-foreground">AMBLE</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-center space-x-8">
            <Link
              to="/"
              className={`font-medium transition-colors hover:text-primary ${
                isActive("/") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Home
            </Link>
            <Link
              to="/upload"
              className={`font-medium transition-colors hover:text-primary ${
                isActive("/upload") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Upload
            </Link>
            <Link
              to="/convert"
              className={`font-medium transition-colors hover:text-primary ${
                isActive("/convert") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Convert
            </Link>
            <Link
              to="/about"
              className={`font-medium transition-colors hover:text-primary ${
                isActive("/about") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              About
            </Link>
          </nav>

          {/* Right Side: Search + Theme Toggle */}
          <div className="hidden md:flex items-center space-x-3 pr-4">
            <form onSubmit={handleSearch} className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-background/50 border-muted-foreground/20"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/80 px-6"
              >
                Search
              </Button>
            </form>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="relative"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
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
      </header>
    </>
  );
};
