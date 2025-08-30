import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Upload, Menu, X, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/ThemeProvider";
import ambleLogoDark from "@/assets/amble-logo-dark.png";
import ambleLogoLight from "@/assets/amble-logo-light.png";

export const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="relative container mx-auto px-6 py-3 flex items-center justify-between">
        {/* Left notch with circular logo */}
        <div className="absolute left-0 top-0 h-full w-28 bg-background rounded-br-3xl shadow-md flex items-center justify-center">
          <Link to="/" className="flex items-center justify-center">
            <img
              src={theme === "dark" ? ambleLogoDark : ambleLogoLight}
              alt="Amble Logo"
              className="w-14 h-14 rounded-full shadow-lg object-contain"
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 ml-32">
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

        {/* Right controls */}
        <div className="hidden md:flex items-center space-x-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="flex items-center space-x-2"
          >
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
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden ml-auto"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>
    </header>
  );
};
