'use client';

import { useState, useEffect, useCallback } from 'react';
import { PORTFOLIO } from '../../lib/portfolioData';

const CORE_THRESHOLD = 0.027;

type NewsItem = {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  publishedAt: number;
  relatedSymbol: string;
};

const CORE_POSITIONS = PORTFOLIO
  .filter(p => p.weight >= CORE_THRESHOLD)
  .sort((a, b) => b.weight - a.weight);

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const hrs = Math.floor(diff / 3_600_000);
  const mins = Math.floor(diff / 60_000);
  if (hrs >= 24) return `${Math.floor(hrs / 24)}d ago`;
  if (hrs >= 1)  return `${hrs}h ago`;
  if (mins > 0)  return `${mins}m ago`;
  return 'Just now';
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white rounded-xl border border-[#e5e3dd] px-4 py-4 shadow-sm flex flex-col gap-2.5 hover:border-[#007cba] hover:shadow-md transition-all group"
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold font-mono text-white bg-[#202e4a] px-1.5 py-0.5 rounded shrink-0">
          {item.relatedSymbol}
        </span>
        <span className="text-[10px] text-[#a8a49e] font-mono ml-auto shrink-0">{timeAgo(item.publishedAt)}</span>
      </div>
      <p className="text-[13px] font-semibold text-[#202e4a] leading-snug group-hover:text-[#007cba] transition-colors line-clamp-3">
        {item.title}
      </p>
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-[#f2f1ec]">
        <span className="text-[10px] text-[#8a96a8]">{item.publisher}</span>
        <span className="text-[10px] text-[#007cba] opacity-0 group-hover:opacity-100 transition-opacity">Read ↗</span>
      </div>
    </a>
  );
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [selectedSym, setSelectedSym] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'holding'>('recent');

  const load = useCallback(async () => {
    const syms = CORE_POSITIONS.map(p => p.sym).join(',');
    try {
      const res = await fetch(`/api/news?symbols=${syms}&limit=60&perSym=6`);
      if (!res.ok) return;
      const json = await res.json();
      setNews(json.data ?? []);
      setLastFetched(new Date());
    } catch { /* non-fatal */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15 * 60_000);
    return () => clearInterval(id);
  }, [load]);

  const symsWithNews = CORE_POSITIONS.map(p => p.sym).filter(s => news.some(n => n.relatedSymbol === s));
  const filtered = selectedSym === 'ALL' ? news : news.filter(n => n.relatedSymbol === selectedSym);
  const totalCount = filtered.length;

  const displayItems: (NewsItem | { _group: string })[] = (() => {
    if (sortBy === 'recent') return [...filtered].sort((a, b) => b.publishedAt - a.publishedAt);
    const out: (NewsItem | { _group: string })[] = [];
    const symsInView = selectedSym === 'ALL' ? symsWithNews : [selectedSym];
    for (const sym of symsInView) {
      const items = filtered.filter(n => n.relatedSymbol === sym).sort((a, b) => b.publishedAt - a.publishedAt);
      if (items.length) { out.push({ _group: sym }); out.push(...items); }
    }
    return out;
  })();

  return (
    <main className="min-h-screen bg-[#f2f1ec] text-[#202e4a]">
      <div className="max-w-[1600px] mx-auto px-6 py-6 flex flex-col gap-6">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-[#202e4a] tracking-tight">Portfolio News</h1>
            <p className="text-[11px] text-[#8a96a8] mt-0.5">
              Core 25 positions · {totalCount} article{totalCount !== 1 ? 's' : ''}
              {lastFetched && <span className="font-mono"> · Updated {lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white border border-[#e5e3dd] rounded-lg p-1 shadow-sm shrink-0">
            {(['recent', 'holding'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                  sortBy === s
                    ? 'bg-[#202e4a] text-white shadow-sm'
                    : 'text-[#8a96a8] hover:text-[#202e4a] hover:bg-[#f2f1ec]'
                }`}
              >
                {s === 'recent' ? 'Most Recent' : 'By Holding'}
              </button>
            ))}
          </div>
        </div>

        {/* Ticker filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedSym('ALL')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
              selectedSym === 'ALL'
                ? 'bg-[#202e4a] text-white border-[#202e4a] shadow-sm'
                : 'bg-white text-[#4a5e78] border-[#d4d1c9] hover:border-[#202e4a] hover:text-[#202e4a]'
            }`}
          >
            All
          </button>
          {symsWithNews.map(sym => {
            const count = news.filter(n => n.relatedSymbol === sym).length;
            const isActive = selectedSym === sym;
            return (
              <button
                key={sym}
                onClick={() => setSelectedSym(isActive ? 'ALL' : sym)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all font-mono ${
                  isActive
                    ? 'bg-[#007cba] text-white border-[#007cba] shadow-sm'
                    : 'bg-white text-[#4a5e78] border-[#d4d1c9] hover:border-[#007cba] hover:text-[#007cba]'
                }`}
              >
                {sym}
                <span className={`text-[9px] rounded-full px-1 py-0 font-semibold ${isActive ? 'bg-white/20 text-white' : 'bg-[#f2f1ec] text-[#8a96a8]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* News grid / grouped list */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#e5e3dd] p-4 shadow-sm animate-pulse flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-12 rounded bg-[#e5e3dd]" />
                  <div className="h-2 w-10 rounded bg-[#e5e3dd] ml-auto" />
                </div>
                <div className="h-4 w-full rounded bg-[#e5e3dd]" />
                <div className="h-4 w-4/5 rounded bg-[#e5e3dd]" />
                <div className="h-3 w-24 rounded bg-[#e5e3dd] mt-auto" />
              </div>
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e5e3dd] px-6 py-12 text-center shadow-sm">
            <p className="text-[#8a96a8] text-sm">No news available at this time.</p>
          </div>
        ) : sortBy === 'holding' ? (
          <div className="flex flex-col gap-6">
            {displayItems.reduce<{ sym: string; items: NewsItem[] }[]>((groups, item) => {
              if ('_group' in item) {
                groups.push({ sym: item._group, items: [] });
              } else {
                groups[groups.length - 1]?.items.push(item);
              }
              return groups;
            }, []).map(group => {
              const pos = CORE_POSITIONS.find(p => p.sym === group.sym);
              return (
                <div key={group.sym} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedSym(group.sym)} className="flex items-center gap-2">
                      <span className="font-mono text-[13px] font-bold text-[#007cba] hover:underline">{group.sym}</span>
                      <span className="text-[11px] text-[#8a96a8] truncate max-w-[200px]">{pos?.issuerName}</span>
                    </button>
                    <div className="flex-1 h-px bg-[#d4d1c9]" />
                    <span className="text-[10px] text-[#a8a49e] font-mono shrink-0">{group.items.length} article{group.items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.items.map(item => <NewsCard key={item.uuid} item={item} />)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(displayItems as NewsItem[]).map(item => <NewsCard key={item.uuid} item={item} />)}
          </div>
        )}

        <footer className="pb-4">
          <span className="text-[10px] text-[#a8a49e] font-mono">News via Yahoo Finance · Refreshes every 15 min</span>
        </footer>
      </div>
    </main>
  );
}
