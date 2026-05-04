'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

type SummaryState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; bullets: string[]; sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'; generatedAt: number }
  | { status: 'error' };

const SENTIMENT_META = {
  positive: { label: 'Positive', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  neutral:  { label: 'Neutral',  color: 'text-[#8a96a8]',  bg: 'bg-[#f8f7f3]', border: 'border-[#d4d1c9]',  dot: 'bg-[#8a96a8]' },
  negative: { label: 'Negative', color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    dot: 'bg-red-500' },
  mixed:    { label: 'Mixed',    color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-400' },
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

function AISummaryCard({ sym, news, apiReady }: { sym: string; news: NewsItem[]; apiReady: boolean }) {
  const [state, setState] = useState<SummaryState>({ status: 'idle' });
  const prevSym = useRef<string>('');

  // Reset state and prevSym when holding changes so re-selecting triggers a fresh fetch
  useEffect(() => {
    prevSym.current = '';
    setState({ status: 'idle' });
  }, [sym]);

  useEffect(() => {
    const headlines = news.filter(n => n.relatedSymbol === sym).map(n => n.title);
    if (!apiReady || headlines.length === 0) { setState({ status: 'idle' }); return; }
    if (sym === prevSym.current) return; // de-dupe only after all checks pass
    prevSym.current = sym;

    let cancelled = false;
    setState({ status: 'loading' });
    fetch('/api/news-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: sym, headlines }),
    })
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        if (json.data) setState({ status: 'done', bullets: json.data.bullets, sentiment: json.data.sentiment, generatedAt: json.data.generatedAt });
        else setState({ status: 'error' });
      })
      .catch(() => { if (!cancelled) setState({ status: 'error' }); });
    return () => { cancelled = true; };
  }, [sym, news, apiReady]);

  if (!apiReady) return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center gap-3">
      <span className="text-amber-500 text-base">⚠</span>
      <div>
        <p className="text-xs font-semibold text-amber-800">AI Summaries Unavailable</p>
        <p className="text-[11px] text-amber-700 mt-0.5">Add <code className="font-mono bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> to your environment variables to enable per-holding analysis.</p>
      </div>
    </div>
  );

  if (state.status === 'idle') return null;

  if (state.status === 'loading') return (
    <div className="bg-white rounded-xl border border-[#e5e3dd] px-5 py-4 shadow-sm animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 rounded bg-[#e5e3dd]" />
        <div className="h-3 w-32 rounded bg-[#e5e3dd]" />
        <div className="h-2.5 w-16 rounded bg-[#e5e3dd] ml-auto" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-3 w-full rounded bg-[#e5e3dd]" />
        <div className="h-3 w-5/6 rounded bg-[#e5e3dd]" />
        <div className="h-3 w-4/6 rounded bg-[#e5e3dd]" />
      </div>
    </div>
  );

  if (state.status === 'error') return (
    <div className="bg-[#f8f7f3] border border-[#d4d1c9] rounded-xl px-5 py-3 text-[11px] text-[#8a96a8]">
      Summary unavailable for {sym} — try again shortly.
    </div>
  );

  const meta = SENTIMENT_META[state.sentiment];
  return (
    <div className={`rounded-xl border ${meta.border} ${meta.bg} px-5 py-4`}>
      <div className="flex items-center gap-2 mb-3">
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-[#202e4a] shrink-0" fill="currentColor">
          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a5 5 0 110 10A5 5 0 018 3zm-.5 2v4l3.5 2-.5-.866-2.5-1.434V5H7.5z" opacity=".4"/>
          <circle cx="8" cy="8" r="2.5" />
          <path d="M11.5 3.5l1-1M4.5 3.5l-1-1M8 1.5V.5" stroke="currentColor" strokeWidth=".8" strokeLinecap="round" opacity=".5"/>
        </svg>
        <span className="text-[11px] font-bold text-[#202e4a] uppercase tracking-widest">AI Summary · {sym}</span>
        <div className={`ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${meta.border}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          <span className={`text-[9px] font-bold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {state.bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-[#007cba] font-bold text-[11px] mt-0.5 shrink-0">{i + 1}.</span>
            <span className="text-[12px] text-[#202e4a] leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>
      <p className="text-[9px] text-[#a8a49e] mt-3 text-right">
        Powered by Claude · {new Date(state.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [selectedSym, setSelectedSym] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'holding'>('recent');
  const [apiReady, setApiReady] = useState(false);

  // Check if AI is available
  useEffect(() => {
    fetch('/api/news-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: '__probe__', headlines: [] }),
    })
      .then(r => r.json())
      .then(j => { if (j.error !== 'ANTHROPIC_API_KEY not configured') setApiReady(true); })
      .catch(() => {});
  }, []);

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

  // Symbols that actually have news (in weight order)
  const symsWithNews = CORE_POSITIONS.map(p => p.sym).filter(s => news.some(n => n.relatedSymbol === s));

  // Filter
  const filtered = selectedSym === 'ALL' ? news : news.filter(n => n.relatedSymbol === selectedSym);

  // Sort / group
  const displayItems: (NewsItem | { _group: string })[] = (() => {
    if (sortBy === 'recent') return [...filtered].sort((a, b) => b.publishedAt - a.publishedAt);
    // Group by holding (weight order)
    const out: (NewsItem | { _group: string })[] = [];
    const symsInView = selectedSym === 'ALL' ? symsWithNews : [selectedSym];
    for (const sym of symsInView) {
      const items = filtered.filter(n => n.relatedSymbol === sym).sort((a, b) => b.publishedAt - a.publishedAt);
      if (items.length) { out.push({ _group: sym }); out.push(...items); }
    }
    return out;
  })();

  const totalCount = filtered.length;

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
          {/* Sort controls */}
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

        {/* AI Summary (shown when a specific holding is selected) */}
        {selectedSym !== 'ALL' && (
          <AISummaryCard sym={selectedSym} news={news} apiReady={apiReady} />
        )}

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
          // Grouped view
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
                    <button
                      onClick={() => setSelectedSym(group.sym)}
                      className="flex items-center gap-2 group"
                    >
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
          // Recent view
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(displayItems as NewsItem[]).map(item => <NewsCard key={item.uuid} item={item} />)}
          </div>
        )}

        <footer className="pb-4">
          <span className="text-[10px] text-[#a8a49e] font-mono">News via Yahoo Finance · Refreshes every 15 min · AI summaries powered by Claude</span>
        </footer>
      </div>
    </main>
  );
}
