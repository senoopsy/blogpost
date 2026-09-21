import { Link } from 'react-router-dom';
import { ShieldCheck, Globe, Rss } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const editorialCategories = [
    { label: '🔥 Leaks & Supply Chain', path: '/?category=rumors' },
    { label: 'Smartphones & Silicon', path: '/?category=smartphones' },
    { label: 'AI & Neural Compute', path: '/?category=ai' },
    { label: 'Laptops & Architectures', path: '/?category=laptops' },
    { label: 'Gaming & GPU Hardware', path: '/?category=gaming' },
    { label: 'Gadgets & Smart Home', path: '/?category=gadgets' },
    { label: 'Wearables & XR', path: '/?category=wearables' },
    { label: 'Apps & Systems', path: '/?category=apps' },
  ];

  return (
    <footer className="mt-16 sm:mt-20 border-t border-theme bg-surface text-secondary text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10">
          {/* Brand Manifesto */}
          <div className="md:col-span-5 space-y-3 sm:space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary text-canvas flex items-center justify-center font-bold text-base font-editorial tracking-tighter">
                S
              </div>
              <span className="text-xl font-bold text-primary font-editorial tracking-tight uppercase">
                Senoopsy
              </span>
            </Link>

            <p className="text-xs sm:text-sm leading-relaxed text-secondary max-w-sm">
              The authoritative tech journalism and hardware intelligence platform. Delivering in-depth silicon teardowns, verified leaker reporting, and exhaustive technical analysis without redirects.
            </p>

            <div className="flex items-center gap-3 sm:gap-4 text-[11px] font-mono text-muted pt-1">
              <span className="flex items-center gap-1.5 text-emerald-500">
                <ShieldCheck className="w-3.5 h-3.5" />
                VERIFIED DESK
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                GLOBAL
              </span>
            </div>
          </div>

          {/* Editorial Sections */}
          <div className="md:col-span-4 space-y-2.5 sm:space-y-3">
            <h4 className="font-mono text-[11px] uppercase tracking-wider text-primary font-semibold">
              Editorial Sections
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {editorialCategories.map((cat) => (
                <Link
                  key={cat.label}
                  to={cat.path}
                  className="hover:text-primary transition-colors py-0.5"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Sources & Transparency */}
          <div className="md:col-span-3 space-y-2.5 sm:space-y-3">
            <h4 className="font-mono text-[11px] uppercase tracking-wider text-primary font-semibold">
              Primary Sources
            </h4>
            <p className="text-xs leading-relaxed text-muted">
              Senoopsy synthesizes primary reporting from The Verge, 9to5Mac, Android Police, GSMArena, Wired, and verified analysts (Ming-Chi Kuo, Ross Young, Mark Gurman).
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-secondary bg-surface-subtle px-2.5 py-1 rounded-md border border-theme">
                <Rss className="w-3 h-3 text-amber-500" />
                15+ RSS Feeds Active
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Attribution */}
        <div className="mt-10 sm:mt-12 pt-4 sm:pt-6 border-t border-theme flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted">
          <p>© {currentYear} Senoopsy Intelligence. All rights reserved.</p>
          <p className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center sm:justify-end">
            <span>Autonomous Tech Journalism</span>
            <span>•</span>
            <span>Zero Redirects</span>
            <span>•</span>
            <span>Primary Sources Preserved</span>
          </p>
        </div>
      </div>
    </footer>
  );
}