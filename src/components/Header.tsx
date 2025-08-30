import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Upload, RefreshCw, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/ThemeProvider";
import ambleLogoDark from "@/assets/amble-logo-dark.png";
import ambleLogoLight from "@/assets/amble-logo-light.png";

export const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const isActive = (path: string) =>
    location.pathname === path ? "text-primary font-semibold" : "text-muted-foreground";

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src={theme === "dark" ? ambleLogoDark : ambleLogoLight}
            alt="Amble"
            className="h-8 w-auto"
          />
          <span className="font-bold text-xl">AMBLE</span>
        </Link>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className={isActive("/")}>Home</Link>
          <Link to="/upload" className={isActive("/upload")}>Upload</Link>
          <Link to="/convert" className={isActive("/convert")}>Convert</Link>
          <Link to="/about" className={isActive("/about")}>About</Link>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="hidden md:flex items-center bg-muted rounded-lg px-2"
          >
            <Input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-none bg-transparent focus:ring-0 w-40"
            />
            <Button size="sm" type="submit" className="ml-1">
              <Search size={16} />
            </Button>
          </form>

          {/* Upload Shortcut */}
          <Link to="/upload">
            <Button size="sm" className="hidden md:inline-flex">
              <Upload size={16} className="mr-1" /> Upload
            </Button>
          </Link>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </div>
      </div>
    </header>
  );
};
