import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import Link from 'next/link';
import NavLinks from '../components/NavLinks';
import './globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Compass Capital — Portfolio Dashboard',
  description: 'Live 13-F portfolio intelligence dashboard for Compass Capital Management. Track holdings, performance, sector allocation, and analyst consensus across 84 positions.',
  openGraph: {
    title: 'Compass Capital — Portfolio Dashboard',
    description: 'Live 13-F portfolio intelligence dashboard. Holdings, performance, sector allocation, and analyst consensus.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
      <body className="font-sans antialiased bg-[#f2f1ec]">
        <header className="bg-[#202e4a] sticky top-0 z-10 shadow-md">
          <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              {/* Compass needle icon */}
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" />
                  <polygon points="12,4 13.5,12 12,11 10.5,12" fill="white" />
                  <polygon points="12,20 10.5,12 12,13 13.5,12" fill="white" fillOpacity="0.4" />
                  <circle cx="12" cy="12" r="1.5" fill="white" />
                </svg>
              </div>
              <div className="leading-tight">
                <p className="text-[13px] font-semibold text-white tracking-tight group-hover:text-white/90 transition-colors">
                  Compass Capital Management
                </p>
                <p className="text-[10px] text-white/40 font-mono tracking-wide">
                  Portfolio Dashboard · Q4 2025
                </p>
              </div>
            </Link>

            {/* Nav */}
            <div className="flex items-center gap-3">
              <NavLinks />
              <a
                href="https://www.compasscap.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded border border-white/20 text-[13px] font-medium text-white/50 hover:text-white hover:border-white/40 transition-colors"
              >
                compasscap.com ↗
              </a>
            </div>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
