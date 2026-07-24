import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeadphonesIcon, Menu, X, ChevronDown } from 'lucide-react';

export const PublicHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-capita-navy text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-capita-cyan p-2 rounded-lg group-hover:scale-105 transition-transform">
                <HeadphonesIcon className="w-6 h-6 text-capita-navy" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold leading-none tracking-tight">Capita</span>
                <span className="text-xs text-gray-300 font-medium">Corporate Helpdesk</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <div className="relative group">
              <button className="flex items-center gap-1 text-sm font-medium hover:text-capita-cyan transition-colors">
                What we do <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <Link to="/" className="text-sm font-medium hover:text-capita-cyan transition-colors">
              Why Capita
            </Link>
            <Link to="/" className="text-sm font-medium hover:text-capita-cyan transition-colors">
              News & insights
            </Link>
            <Link to="/" className="text-sm font-medium hover:text-capita-cyan transition-colors">
              About us
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="bg-capita-cyan text-capita-navy hover:bg-white transition-colors px-5 py-2.5 rounded-md font-semibold text-sm"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-capita-cyan focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-capita-navy border-t border-gray-700">
          <div className="px-4 pt-2 pb-6 space-y-1">
            <Link to="/" className="block px-3 py-3 text-base font-medium hover:text-capita-cyan border-b border-gray-700">What we do</Link>
            <Link to="/" className="block px-3 py-3 text-base font-medium hover:text-capita-cyan border-b border-gray-700">Why Capita</Link>
            <Link to="/" className="block px-3 py-3 text-base font-medium hover:text-capita-cyan border-b border-gray-700">News & insights</Link>
            <Link to="/" className="block px-3 py-3 text-base font-medium hover:text-capita-cyan">About us</Link>
            <div className="mt-4 pt-4 px-3">
              <Link
                to="/login"
                className="w-full flex justify-center bg-capita-cyan text-capita-navy px-4 py-3 rounded-md font-bold text-base"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
