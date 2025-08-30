import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export default function Header() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <header className="relative flex items-center justify-between px-6 py-3 bg-[#030617] text-white shadow-md">
      {/* Left notch with logo */}
      <div className="absolute top-0 left-0 h-full flex items-center">
        {/* Notch background shape */}
        <div className="bg-[#030617] h-full w-16 rounded-br-3xl"></div>
        {/* Logo */}
        <div className="absolute top-1/2 -translate-y-1/2 left-2 w-14 h-14 rounded-full overflow-hidden bg-black shadow-lg">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Nav links */}
      <nav className="ml-20 flex items-center gap-6">
        <Link to="/" className="hover:text-green-400 transition-colors">
          Home
        </Link>
        <Link to="/upload" className="hover:text-green-400 transition-colors">
          Upload
        </Link>
        <Link to="/convert" className="hover:text-green-400 transition-colors">
          Convert
        </Link>
        <Link to="/about" className="hover:text-green-400 transition-colors">
          About
        </Link>
      </nav>

      {/* Right side: search + theme toggle */}
      <div className="flex items-center gap-4">
        <div className="flex items-center bg-[#0d1224] rounded-lg overflow-hidden">
          <input
            type="text"
            placeholder="Search files..."
            className="px-3 py-1 bg-transparent outline-none text-sm text-white"
          />
          <Button className="bg-green-500 hover:bg-green-600 text-white rounded-none">
            Search
          </Button>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full bg-[#0d1224] hover:bg-[#1a2136] transition-colors"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
