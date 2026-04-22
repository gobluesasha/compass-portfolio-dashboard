'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLinks() {
  const pathname = usePathname();
  const isOverview   = pathname === '/';
  const isPortfolio  = pathname === '/portfolio' || pathname.startsWith('/portfolio');

  return (
    <nav className="flex items-center gap-1 bg-white/8 rounded-lg p-1 border border-white/10">
      <Link
        href="/"
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-semibold transition-all duration-150 ${
          isOverview
            ? 'bg-white text-[#202e4a] shadow-sm'
            : 'text-white/60 hover:text-white hover:bg-white/10'
        }`}
      >
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" fill="currentColor">
          <rect x="1" y="1" width="6" height="6" rx="1" />
          <rect x="9" y="1" width="6" height="6" rx="1" opacity="0.5" />
          <rect x="1" y="9" width="6" height="6" rx="1" opacity="0.5" />
          <rect x="9" y="9" width="6" height="6" rx="1" opacity="0.3" />
        </svg>
        Overview
      </Link>
      <Link
        href="/portfolio"
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-semibold transition-all duration-150 ${
          isPortfolio
            ? 'bg-white text-[#202e4a] shadow-sm'
            : 'text-white/60 hover:text-white hover:bg-white/10'
        }`}
      >
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" fill="currentColor">
          <rect x="1" y="10" width="3" height="5" rx="0.5" />
          <rect x="6" y="6" width="3" height="9" rx="0.5" opacity="0.7" />
          <rect x="11" y="2" width="3" height="13" rx="0.5" opacity="0.5" />
          <path d="M1 9 L7.5 5 L12.5 2" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </svg>
        Portfolio
      </Link>
    </nav>
  );
}
