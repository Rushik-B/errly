import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility for classnames

interface NavItem {
  id: string;
  title: string;
}

const navItems: NavItem[] = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'installation', title: 'Installation' },
  { id: 'setup', title: 'Setup' },
  { id: 'usage', title: 'Usage' },
  { id: 'framework-examples', title: 'Framework Examples' },
  { id: 'summary', title: 'Summary' },
];

const DocsSidebar: React.FC = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const intersectingSections = useRef<Map<string, IntersectionObserverEntry>>(new Map());

  const determineActiveSection = useCallback(() => {
    let bestMatchId: string | null = null;
    let minPositiveTop = Infinity; // Smallest top >= 0
    let maxNegativeTop = -Infinity; // Largest top < 0
    let idForMaxNegativeTop: string | null = null; // ID corresponding to maxNegativeTop

    intersectingSections.current.forEach((entry, id) => {
      const top = entry.boundingClientRect.top;
      if (top >= 0 && top < minPositiveTop) {
        minPositiveTop = top;
        bestMatchId = id; // Prioritize sections with top >= 0
      }
      if (top < 0 && top > maxNegativeTop) {
        maxNegativeTop = top;
        idForMaxNegativeTop = id;
      }
    });

    // If we didn't find a section with top >= 0 (minPositiveTop is still Infinity),
    // use the one closest to the top from above (maxNegativeTop).
    if (minPositiveTop === Infinity && idForMaxNegativeTop !== null) {
      bestMatchId = idForMaxNegativeTop;
    }

    // If still no match, fallback to the first nav item
    if (bestMatchId === null && navItems.length > 0) {
      bestMatchId = navItems[0].id;
    }

    // Only update state if the ID actually changed
    setActiveId(currentActiveId => {
      if (currentActiveId !== bestMatchId) {
        return bestMatchId;
      }
      return currentActiveId;
    });

  }, []);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        intersectingSections.current.set(entry.target.id, entry);
      } else {
        intersectingSections.current.delete(entry.target.id);
      }
    });
    determineActiveSection();
  }, [determineActiveSection]);

  useEffect(() => {
    observer.current = new IntersectionObserver(handleObserver, {
      rootMargin: '-15% 0px -85% 0px',
      threshold: 0,
    });

    const elements = navItems.map(({ id }) => document.getElementById(id)).filter(el => el);
    elements.forEach((el) => observer.current?.observe(el as Element));

    const checkInitialScroll = () => {
        intersectingSections.current.clear();
        let minTop = Infinity;
        let initialActiveId = null;

        elements.forEach(el => {
            if (el) {
                const rect = el.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const isInView =
                    rect.top <= viewportHeight * 0.85 &&
                    rect.bottom >= viewportHeight * 0.15;

                if (isInView) {
                    // Store minimal info needed for determineActiveSection fallback
                    intersectingSections.current.set(el.id, { boundingClientRect: rect } as IntersectionObserverEntry);
                    
                    // Track the one closest to the top
                    if (rect.top >= 0 && rect.top < minTop) {
                        minTop = rect.top;
                        initialActiveId = el.id;
                    }
                }
            }
        });

        // If we found a specific top-most element initially, set it.
        // Otherwise, let determineActiveSection figure out the best fit (handles negative tops/fallbacks).
        if (initialActiveId !== null) {
            setActiveId(initialActiveId);
        } else {
            determineActiveSection(); 
        }
    };

    const timeoutId = setTimeout(checkInitialScroll, 150);

    return () => {
      clearTimeout(timeoutId);
      elements.forEach((el) => observer.current?.unobserve(el as Element));
      observer.current?.disconnect();
    };
  }, [navItems, handleObserver, determineActiveSection]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Optionally force update active state, though scrollIntoView should trigger observer
      // setActiveId(id);
       // History push state is better for UX so back button works as expected
       history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <aside className="hidden md:block p-4 z-20 max-w-xs w-full">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl border border-blue-400/20 rounded-xl shadow-lg pointer-events-none" />
      
      {/* Navigation Content */}
      <nav className="relative text-sm lg:text-base p-4">
        <h3 className="text-lg font-semibold mb-4 text-white">On this page</h3>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => handleLinkClick(e, item.id)}
                className={cn(
                  'block py-1 px-3 rounded transition-all duration-150 ease-in-out',
                  'text-gray-300 hover:text-white hover:bg-blue-900/40',
                  {
                    'text-white font-semibold bg-blue-600/50': activeId === item.id,
                  }
                )}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default DocsSidebar; 