import { useState, useEffect, useRef } from 'react';
import { Search, Upload, Shuffle, Menu, Sun, Moon, Home, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/components/ThemeProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ImprovedAmbleLogo } from '@/components/ImprovedAmbleLogo';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SearchResult {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadDate: string;
  downloadCount: number;
  tags?: string[];
}

interface ModernHeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  currentPage?: string;
  onSearch?: (query: string) => void;
  searchResults?: SearchResult[];
  onDownload?: (fileId: string) => void;
  onPreview?: (fileId: string) => void;
  onShare?: (fileId: string) => void;
}

export const ModernHeader = ({ 
  searchQuery: externalSearchQuery,
  onSearchChange,
  currentPage,
  onSearch, 
  searchResults = [], 
  onDownload, 
  onPreview, 
  onShare 
}: ModernHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || '');
  const [showResults, setShowResults] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (onSearchChange) {
      onSearchChange(query);
    }
    if (onSearch) {
      onSearch(query);
    }
    setShowResults(query.length > 0 && searchResults.length > 0);
  };

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Upload', href: '/upload', icon: Upload },
    { name: 'Convert', href: '/convert', icon: Shuffle },
    { name: 'About', href: '/about', icon: Info },
  ];

  const NavItems = ({ mobile = false }) => (
    <div className={mobile ? 'flex flex-col space-y-1' : 'flex items-center space-x-1'}>
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => mobile && setIsOpen(false)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }
              ${mobile ? 'justify-start w-full' : ''}
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="transform transition-transform group-hover:scale-110">
              <ImprovedAmbleLogo size={40} />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Amble</span>
          </Link>

          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="hidden md:flex">
              <NavItems />
            </nav>
          )}

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-4 relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search files, tags..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setShowResults(searchQuery.length > 0)}
                className="pl-10 pr-4 bg-muted/50 border-0 focus:bg-background"
              />
            </div>

            {/* Search Results Dropdown */}
            {showResults && onPreview && onDownload && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-lg max-h-96 overflow-y-auto z-50">
                {searchResults.length > 0 ? (
                  <div className="p-2">
                    <div className="text-xs text-muted-foreground p-2 border-b">
                      {searchResults.length} results found
                    </div>
                    {searchResults.slice(0, 8).map((file) => (
                      <div
                        key={file.id}
                        className="p-3 hover:bg-muted rounded-lg cursor-pointer group"
                        onClick={() => {
                          onPreview(file.id);
                          setShowResults(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground">{file.size}</p>
                              <p className="text-xs text-muted-foreground">{file.uploadDate}</p>
                              {file.tags && (
                                <div className="flex gap-1">
                                  {file.tags.slice(0, 2).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      #{tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="ghost" onClick={(e) => {
                              e.stopPropagation();
                              onDownload(file.id);
                            }}>
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <p className="text-sm">No files found matching "{searchQuery}"</p>
                    <p className="text-xs mt-1">Try searching for file names or tags</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9">
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            {isMobile && (
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-9 h-9">
                    <Menu className="h-4 w-4" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col space-y-4 mt-8">
                    <NavItems mobile />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};