import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Search, Moon, Sun, Flame, Radio } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleTheme, toggleMobileMenu, toggleSearch } from '../../store/slices/uiSlice';

export function Header() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, isMobileMenuOpen, isSearchOpen } = useAppSelector((state) => state.ui);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).toUpperCase();
    setCurrentDateStr(formatted);
  }, []);

  const currentCategory = new URLSearchParams(location.search).get('category') || '';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      dispatch(toggleSearch());
      setSearchQuery('');
    }
  };

  const navLinks = [
    { label: 'All Stories', path: '/' },
    { label: '🔥 Leaks & Intel', path: '/?category=rumors', isLeak: true },
    { label: 'Smartphones', path: '/?category=smartphones' },
    { label: 'AI & ML', path: '/?category=ai' },
    { label: 'Laptops', path: '/?category=laptops' },
    { label: 'Gaming', path: '/?category=gaming' },
    { label: 'Gadgets', path: '/?category=gadgets' },
    { label: 'Wearables', path: '/?category=wearables' },
    { label: 'Apps', path: '/?category=apps' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-xl border-b border-theme transition-colors">
      {/* Top Editorial Wire Bar */}
      <div className="border-b border-theme bg-surface-subtle text-[11px] font-mono text-muted py-1 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 truncate">
            <span className="text-secondary font-medium tracking-wider whitespace-nowrap">{currentDateStr || 'DISPATCH'}</span>
            <span className="text-muted/40">•</span>
            <div className="flex items-center gap-1.5 text-emerald-500 whitespace-nowrap">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              <span className="hidden sm:inline">LIVE WIRE FEED</span>
              <span className="sm:hidden">WIRE</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <span className="hidden md:inline text-muted">GLOBAL HARDWARE & AI PULSE</span>
            <span className="text-amber-500 font-medium flex items-center gap-1">
              <Flame className="w-3 h-3" />
              <span className="hidden sm:inline">SUPPLY CHAIN RADAR</span>
              <span className="sm:hidden text-[10px]">RADAR</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Masthead Banner */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Senoopsy Brand Mark */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary text-canvas flex items-center justify-center font-bold text-base font-editorial tracking-tighter shadow-sm group-hover:scale-105 transition-transform">
              S
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-primary font-editorial uppercase block leading-none">
                Senoopsy
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-muted uppercase block mt-0.5">
                Tech Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Category Navigation */}
          <nav className="hidden xl:flex items-center gap-1 bg-surface-subtle border border-theme p-1 rounded-lg">
            {navLinks.slice(0, 7).map((link) => {
              const isActive = link.path === '/'
                ? location.pathname === '/' && !currentCategory
                : currentCategory === link.path.replace('/?category=', '');

              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`px-3 py-1 rounded-md text-xs font-medium tracking-tight transition-all duration-150 ${
                    isActive
                      ? 'bg-primary text-canvas font-bold shadow-sm'
                      : link.isLeak
                      ? 'text-amber-500 hover:text-amber-600 dark:hover:text-amber-300'
                      : 'text-secondary hover:text-primary hover:bg-surface-hover'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => dispatch(toggleSearch())}
              className="px-2.5 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-hover border border-theme text-secondary hover:text-primary text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
              aria-label="Search"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search Wire</span>
            </button>

            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-1.5 sm:p-2 rounded-lg text-secondary hover:text-primary hover:bg-surface-hover transition-colors border border-theme"
              aria-label="Toggle dark/light theme"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            <button
              onClick={() => dispatch(toggleMobileMenu())}
              className="xl:hidden p-1.5 sm:p-2 rounded-lg text-secondary hover:text-primary hover:bg-surface-hover transition-colors border border-theme"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Search Drawer */}
        {isSearchOpen && (
          <div className="py-2.5 border-t border-theme animate-slide-up">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles, hardware specs, leakers (Ming-Chi Kuo)..."
                className="w-full glass-input pl-9 pr-4 py-2 text-xs"
                autoFocus
              />
            </form>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="xl:hidden py-3 border-t border-theme animate-slide-up">
            <nav className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-secondary hover:text-primary hover:bg-surface-hover transition-colors flex items-center justify-between"
                  onClick={() => dispatch(toggleMobileMenu())}
                >
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}