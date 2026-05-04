'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Position, SparkPoint } from '../types/portfolio';
import { DataTimestamps } from './PortfolioWrapper';

interface Props {
  position: Position;
  isOpen: boolean;
  timestamps: DataTimestamps;
}

function StatCell({ label, value, valueClass = '' }: { label: string; value: string | number | null; valueClass?: string }) {
  const display = value === null || value === undefined ? '—' : value;
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] font-medium text-[#8a96a8] tracking-wide">{label}</span>
      <span className={`text-sm font-mono font-semibold ${value === null ? 'text-[#c8cdd6]' : 'text-[#202e4a]'} ${valueClass}`}>
        {display}
      </span>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[11px] font-semibold text-[#007cba] tracking-wide">{title}</span>
      <div className="flex-1 h-px bg-[#e5e3dd]" />
    </div>
  );
}

function PerfBadge({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex flex-col items-center gap-1 px-3 py-2 rounded bg-[#f2f1ec] border border-[#e5e3dd]">
      <span className="text-[10px] text-[#8a96a8] tracking-wide">{label}</span>
      <span className={`text-sm font-mono font-bold ${value === null ? 'text-[#c8cdd6]' : value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
        {value === null ? '—' : `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`}
      </span>
    </div>
  );
}

function fmtChartDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function PriceChart({ data }: { data: SparkPoint[] }) {
  if (!data.length) return null;
  const first = data[0].close;
  const last  = data[data.length - 1].close;
  const isUp  = last >= first;
  const color = isUp ? '#10b981' : '#ef4444';
  const returnPct = ((last - first) / first * 100).toFixed(2);

  const prices = data.map(d => d.close);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const pad  = (maxP - minP) * 0.08 || 1;
  const domain: [number, number] = [minP - pad, maxP + pad];

  // Show ~5 evenly-spaced x-axis ticks
  const tickInterval = Math.floor(data.length / 5);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-[#8a96a8] font-mono">90-day close</span>
        <span className={`text-[11px] font-mono font-semibold ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>
          {isUp ? '+' : ''}{returnPct}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0eee9" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={fmtChartDate}
            interval={tickInterval}
            tick={{ fontSize: 10, fill: '#8a96a8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={domain}
            tickFormatter={v => `$${v.toFixed(0)}`}
            tick={{ fontSize: 10, fill: '#8a96a8' }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const pt = payload[0].payload as SparkPoint;
              return (
                <div className="bg-white border border-[#e5e3dd] rounded shadow-sm px-2.5 py-1.5 text-[11px]">
                  <p className="text-[#8a96a8]">{fmtChartDate(pt.date)}</p>
                  <p className="font-mono font-semibold text-[#202e4a]">${pt.close.toFixed(2)}</p>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="close"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const ACTION_META: Record<string, { icon: string; color: string }> = {
  up:   { icon: '↑', color: 'text-emerald-600' },
  down: { icon: '↓', color: 'text-red-600'     },
  init: { icon: '★', color: 'text-sky-600'     },
  main: { icon: '→', color: 'text-[#8a96a8]'   },
  reit: { icon: '→', color: 'text-[#8a96a8]'   },
};

// Analyst consensus: Yahoo rating 1=Strong Buy, 2=Buy, 3=Hold, 4=Sell, 5=Strong Sell
function AnalystGauge({ sym, rating, target, current, analysts, analystActions }: {
  sym: string;
  rating: number | null;
  target: number | null;
  current: number | null;
  analysts: number | null;
  analystActions: { date: string; firm: string; action: string; toGrade: string; fromGrade: string }[] | null;
}) {
  const labels    = ['', 'Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'];
  const colors    = ['', 'text-emerald-700', 'text-emerald-500', 'text-amber-500', 'text-red-500', 'text-red-700'];
  const barColors = ['', 'bg-emerald-500', 'bg-emerald-400', 'bg-amber-400', 'bg-red-400', 'bg-red-600'];
  const label    = rating !== null ? (labels[Math.round(rating)] ?? 'Hold') : null;
  const color    = rating !== null ? (colors[Math.round(rating)] ?? 'text-amber-500') : 'text-[#c8cdd6]';
  const barColor = rating !== null ? (barColors[Math.round(rating)] ?? 'bg-amber-400') : 'bg-[#e5e3dd]';
  const fillPct  = rating !== null ? ((5 - rating) / 4) * 100 : 0;
  const upside   = (current && target) ? ((target - current) / current * 100) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        {/* Left: rating + bar */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-medium text-[#8a96a8] tracking-wide mb-0.5">Consensus</p>
              <p className={`text-lg font-bold ${color}`}>{label ?? '—'}</p>
              {analysts !== null && (
                <p className="text-[10px] text-[#8a96a8]">{analysts} analysts</p>
              )}
            </div>
            {target !== null && (
              <div className="text-right">
                <p className="text-[10px] font-medium text-[#8a96a8] tracking-wide mb-0.5">Avg Target</p>
                <p className="text-lg font-mono font-bold text-[#202e4a]">${target.toFixed(2)}</p>
                {upside !== null && (
                  <p className={`text-[11px] font-mono font-semibold ${upside >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {upside >= 0 ? '+' : ''}{upside.toFixed(1)}% upside
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="w-full h-2 rounded-full bg-[#e5e3dd] overflow-hidden">
              <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${fillPct}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-[#8a96a8]">
              <span>Strong Buy</span><span>Hold</span><span>Strong Sell</span>
            </div>
          </div>
          <a
            href={`https://finance.yahoo.com/quote/${sym}/analysis`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[10px] text-[#007cba] hover:underline font-semibold w-fit"
          >
            View full analysis on Yahoo Finance ↗
          </a>
        </div>

        {/* Right: recent analyst actions */}
        {analystActions && analystActions.length > 0 && (
          <div className="w-48 shrink-0">
            <p className="text-[10px] font-medium text-[#8a96a8] tracking-wide mb-2">Recent Actions</p>
            <div className="flex flex-col gap-2">
              {analystActions.map((a, i) => {
                const meta = ACTION_META[a.action] ?? { icon: '·', color: 'text-[#8a96a8]' };
                const gradeChanged = a.fromGrade && a.fromGrade !== a.toGrade;
                return (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className={`text-[11px] font-bold shrink-0 mt-0.5 ${meta.color}`}>{meta.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-[#202e4a] leading-tight truncate">{a.firm}</p>
                      <p className="text-[9px] text-[#8a96a8] leading-tight">
                        {a.toGrade || 'Rating update'}
                        {gradeChanged && ` (from ${a.fromGrade})`}
                        {' · '}{a.date}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Industry-level benchmarks by sector (approximate medians, decimal fractions)
const SECTOR_BENCHMARKS: Record<string, Partial<Record<string, number>>> = {
  'Technology': {
    revenueGrowthPct: 0.12, grossMarginPct: 0.65, operatingMarginPct: 0.20,
    netMarginPct: 0.18, returnOnEquity: 0.28, ebitdaMarginPct: 0.28, fcfMarginPct: 0.20, returnOnAssets: 0.10,
  },
  'Healthcare': {
    revenueGrowthPct: 0.08, grossMarginPct: 0.55, operatingMarginPct: 0.15,
    netMarginPct: 0.12, returnOnEquity: 0.20, ebitdaMarginPct: 0.20, fcfMarginPct: 0.15, returnOnAssets: 0.07,
  },
  'Industrials': {
    revenueGrowthPct: 0.07, grossMarginPct: 0.35, operatingMarginPct: 0.12,
    netMarginPct: 0.09, returnOnEquity: 0.18, ebitdaMarginPct: 0.15, fcfMarginPct: 0.10, returnOnAssets: 0.06,
  },
  'Financials': {
    revenueGrowthPct: 0.06, grossMarginPct: 0.60, operatingMarginPct: 0.30,
    netMarginPct: 0.25, returnOnEquity: 0.15, ebitdaMarginPct: 0.35, fcfMarginPct: 0.25, returnOnAssets: 0.08,
  },
  'Consumer Staples': {
    revenueGrowthPct: 0.04, grossMarginPct: 0.35, operatingMarginPct: 0.14,
    netMarginPct: 0.10, returnOnEquity: 0.25, ebitdaMarginPct: 0.18, fcfMarginPct: 0.12, returnOnAssets: 0.07,
  },
  'Communication Services': {
    revenueGrowthPct: 0.09, grossMarginPct: 0.55, operatingMarginPct: 0.18,
    netMarginPct: 0.15, returnOnEquity: 0.22, ebitdaMarginPct: 0.30, fcfMarginPct: 0.18, returnOnAssets: 0.09,
  },
  'Materials': {
    revenueGrowthPct: 0.05, grossMarginPct: 0.28, operatingMarginPct: 0.12,
    netMarginPct: 0.08, returnOnEquity: 0.15, ebitdaMarginPct: 0.18, fcfMarginPct: 0.10, returnOnAssets: 0.06,
  },
};

// Fundamentals cell with sector benchmark hover tooltip
function FundamentalCell({ label, value, metricKey, sector }: {
  label: string;
  value: string | null;
  metricKey: string;
  sector: string | null;
}) {
  const [show, setShow] = useState(false);
  const benchmark = sector ? (SECTOR_BENCHMARKS[sector]?.[metricKey] ?? null) : null;

  // Parse the formatted string back to a number for comparison (value is like "12.5%")
  const numericValue = value ? parseFloat(value) / 100 : null;
  const hasBenchmark = benchmark !== null && numericValue !== null;
  const diff = hasBenchmark ? numericValue - benchmark : null;
  const isAbove = diff !== null && diff > 0;
  const diffPct = diff !== null ? Math.abs(diff * 100) : 0;

  return (
    <div
      className="relative flex flex-col gap-0.5 min-w-0"
      onMouseEnter={() => hasBenchmark && setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="text-[10px] font-medium text-[#8a96a8] tracking-wide flex items-center gap-1">
        {label}
        {hasBenchmark && <span className="text-[8px] text-[#007cba] font-mono">≈</span>}
      </span>
      <span className={`text-sm font-mono font-semibold ${value === null ? 'text-[#c8cdd6]' : 'text-[#202e4a]'} ${hasBenchmark ? 'cursor-help underline decoration-dotted decoration-[#007cba]/40' : ''}`}>
        {value ?? '—'}
      </span>

      {show && hasBenchmark && (
        <div className="absolute bottom-full left-0 mb-2 z-50 bg-white border border-[#d4d1c9] rounded-lg shadow-lg p-3 w-52" style={{ pointerEvents: 'none' }}>
          <p className="text-[10px] font-semibold text-[#007cba] uppercase tracking-wide mb-2">{label} · Sector Benchmark</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#8a96a8]">This holding</span>
              <span className="text-[10px] font-mono font-semibold text-[#202e4a]">{value}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#8a96a8]">{sector} avg</span>
              <span className="text-[10px] font-mono font-semibold text-[#8a96a8]">{(benchmark * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full h-px bg-[#f2f1ec]" />
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-semibold ${isAbove ? 'text-emerald-600' : 'text-red-500'}`}>
                {isAbove ? '▲ Above' : '▼ Below'} sector avg
              </span>
              <span className={`text-[10px] font-mono font-semibold ${isAbove ? 'text-emerald-600' : 'text-red-500'}`}>
                {isAbove ? '+' : '-'}{diffPct.toFixed(1)} pp
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ThesisField({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div>
      <span className="text-[10px] font-medium text-[#8a96a8] tracking-wide">{label}</span>
      <div className="mt-1.5 rounded border border-dashed border-[#c8c4bc] bg-white px-3 py-2.5">
        <p className="text-[11px] text-[#a8a49e] italic leading-relaxed">
          [Integration point: awaiting input from investment team]
        </p>
        <p className="text-[10px] text-[#c8cdd6] mt-1">{placeholder}</p>
      </div>
    </div>
  );
}

function ThesisBullets({ label }: { label: string }) {
  return (
    <div>
      <span className="text-[10px] font-medium text-[#8a96a8] tracking-wide">{label}</span>
      <div className="mt-1.5 rounded border border-dashed border-[#c8c4bc] bg-white px-3 py-2.5 flex flex-col gap-1.5">
        {[1, 2, 3].map(n => (
          <div key={n} className="flex items-start gap-2">
            <span className="text-[#c8cdd6] text-[10px] mt-0.5 shrink-0">•</span>
            <p className="text-[11px] text-[#a8a49e] italic">
              [Integration point: awaiting input from investment team]
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const THESIS_STATUS_STYLES = {
  intact:         'bg-emerald-50 text-emerald-700 border-emerald-200',
  'under review': 'bg-amber-50 text-amber-700 border-amber-200',
  broken:         'bg-red-50 text-red-600 border-red-200',
};

function ThesisStatus() {
  const status = 'under review' as keyof typeof THESIS_STATUS_STYLES;
  return (
    <div className="flex flex-col gap-3">
      <div>
        <span className="text-[10px] font-medium text-[#8a96a8] tracking-wide">Thesis Status</span>
        <div className="mt-1.5 flex items-center gap-2">
          <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border ${THESIS_STATUS_STYLES[status]}`}>
            {status}
          </span>
          <span className="text-[10px] text-[#a8a49e] italic">[Integration point]</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-[10px] font-medium text-[#8a96a8] tracking-wide">Last Thesis Review</span>
          <p className="mt-1 text-[11px] text-[#a8a49e] italic font-mono">[Awaiting input]</p>
        </div>
        <div>
          <span className="text-[10px] font-medium text-[#8a96a8] tracking-wide">Days Since Review</span>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-[11px] font-mono font-semibold text-[#c8cdd6]">—</span>
            <span className="text-[9px] text-red-400 italic font-mono">no review on record</span>
          </div>
        </div>
      </div>
    </div>
  );
}

type PeerItem = {
  sym: string;
  name: string;
  price: number | null;
  changePct: number | null;
};

type HistoricalValYear = {
  year: number;
  pe: number | null;
  priceToSales: number | null;
  priceToBook: number | null;
  evEbitda: number | null;
};

// Which historical series to show per metric label
const HIST_KEY_MAP: Record<string, keyof Omit<HistoricalValYear, 'year'>> = {
  'P/E (TTM)':    'pe',
  'P/B':          'priceToBook',
  'Price / Sales': 'priceToSales',
  'EV / EBITDA':  'evEbitda',
};

function ValuationCell({
  label, value, historical,
}: {
  label: string;
  value: string | null;
  historical: HistoricalValYear[] | null;
}) {
  const [show, setShow] = useState(false);
  const histKey = HIST_KEY_MAP[label];
  const hasHistory = histKey && historical && historical.some(h => h[histKey] !== null);

  const points = hasHistory
    ? historical!.map(h => ({ year: h.year, val: h[histKey] as number | null }))
    : [];
  const defined = points.filter(p => p.val !== null) as { year: number; val: number }[];
  const maxVal = defined.length ? Math.max(...defined.map(p => p.val)) : 1;

  return (
    <div className="relative flex flex-col gap-0.5 min-w-0"
      onMouseEnter={() => hasHistory && setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="text-[10px] font-medium text-[#8a96a8] tracking-wide flex items-center gap-1">
        {label}
        {hasHistory && <span className="text-[8px] text-[#007cba] font-mono">▲ 3Y</span>}
      </span>
      <span className={`text-sm font-mono font-semibold ${value === null ? 'text-[#c8cdd6]' : 'text-[#202e4a]'} ${hasHistory ? 'cursor-help underline decoration-dotted decoration-[#007cba]/40' : ''}`}>
        {value ?? '—'}
      </span>

      {show && hasHistory && (
        <div className="absolute bottom-full left-0 mb-2 z-50 bg-white border border-[#d4d1c9] rounded-lg shadow-lg p-3 w-48"
          style={{ pointerEvents: 'none' }}>
          <p className="text-[10px] font-semibold text-[#007cba] uppercase tracking-wide mb-2.5">
            {label} · 3-Year History
          </p>
          <div className="flex flex-col gap-2">
            {points.map(p => (
              <div key={p.year} className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#8a96a8] w-10 shrink-0">FY{p.year}</span>
                <div className="flex-1 h-1.5 bg-[#f2f1ec] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#007cba]/70"
                    style={{ width: p.val !== null ? `${(p.val / maxVal) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-[10px] font-mono font-semibold text-[#202e4a] w-10 text-right shrink-0">
                  {p.val !== null ? `${p.val.toFixed(1)}×` : '—'}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#f2f1ec]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#8a96a8]">Current (TTM)</span>
              <span className="text-[10px] font-mono font-semibold text-[#202e4a]">{value ?? '—'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function fmtPct(v: number | null, decimals = 1, isRatio = false): string | null {
  if (v === null) return null;
  const val = isRatio ? v * 100 : v;
  return `${val.toFixed(decimals)}%`;
}

function fmtMult(v: number | null, decimals = 1): string | null {
  return v !== null ? `${v.toFixed(decimals)}×` : null;
}

function fmtB(v: number | null): string | null {
  if (v === null) return null;
  const abs = Math.abs(v);
  if (abs >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `$${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `$${(v / 1e6).toFixed(1)}M`;
  return `$${v.toLocaleString()}`;
}

export default function ExpandedRow({ position, isOpen, timestamps }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [peers, setPeers] = useState<PeerItem[] | null>(null);
  const [peersLoading, setPeersLoading] = useState(false);
  const [historicalVal, setHistoricalVal] = useState<HistoricalValYear[] | null>(null);
  const [gaapMode, setGaapMode] = useState<'gaap' | 'non-gaap'>('gaap');

  const loadPeers = useCallback(() => {
    if (peers !== null) return;
    setPeersLoading(true);
    fetch(`/api/peers?sym=${position.sym}`)
      .then(r => r.json())
      .then(j => { setPeers(j.data ?? []); setPeersLoading(false); })
      .catch(() => { setPeers([]); setPeersLoading(false); });
  }, [position.sym, peers]);

  const loadHistoricalVal = useCallback(() => {
    if (historicalVal !== null) return;
    fetch(`/api/historical-valuation?sym=${position.sym}`)
      .then(r => r.json())
      .then(j => setHistoricalVal(j.data ?? []))
      .catch(() => setHistoricalVal([]));
  }, [position.sym, historicalVal]);

  useEffect(() => {
    if (isOpen) { loadPeers(); loadHistoricalVal(); }
  }, [isOpen, loadPeers, loadHistoricalVal]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (isOpen) {
      requestAnimationFrame(() => {
        if (containerRef.current) setHeight(containerRef.current.scrollHeight);
      });
    } else {
      setHeight(0);
      setBioExpanded(false);
    }
  }, [isOpen, position, peers]);

  const { fundamentals, valuation, risk, analyst, qualitative, priceHistory, market, earnings, sector, industry, delta } = position;

  const dataLines = [
    timestamps.quotes       && `Quotes: ${timestamps.quotes.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    timestamps.returns      && `Returns: ${timestamps.returns.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    timestamps.fundamentals && `Fundamentals: ${timestamps.fundamentals.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    timestamps.earnings     && `Earnings: ${timestamps.earnings.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
  ].filter(Boolean).join(' · ');

  return (
    <div style={{ maxHeight: height, transition: 'max-height 0.28s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden' }}>
      <div ref={containerRef}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 border-t border-[#d4d1c9] bg-[#faf9f6]">

          {/* ── LEFT: Chart + Price Info ── */}
          <div className="lg:col-span-2 p-4 border-r border-[#e5e3dd] flex flex-col gap-3">

            {/* Sector / Industry tags */}
            <div className="flex flex-wrap items-center gap-2">
              {sector && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#202e4a] text-white uppercase tracking-wide">
                  {sector}
                </span>
              )}
              {industry && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#e5e3dd] text-[#4a5e78] uppercase tracking-wide">
                  {industry}
                </span>
              )}
            </div>

            {/* Business summary — expandable */}
            {qualitative.businessSummary && (
              <div>
                <SectionHeader title="Business Overview" />
                <p className={`text-xs text-[#4a5e78] leading-relaxed ${bioExpanded ? '' : 'line-clamp-3'}`}>
                  {qualitative.businessSummary}
                </p>
                {qualitative.businessSummary.length > 200 && (
                  <button
                    onClick={e => { e.stopPropagation(); setBioExpanded(v => !v); }}
                    className="mt-1 text-[10px] text-[#007cba] hover:underline font-semibold"
                  >
                    {bioExpanded ? 'Show less ↑' : 'Show more ↓'}
                  </button>
                )}
              </div>
            )}

            {/* Leadership Team */}
            <div>
              <SectionHeader title="Leadership Team" />
              {qualitative.leadership && qualitative.leadership.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {qualitative.leadership.slice(0, 5).map((o, i) => (
                    <div key={i} className="flex items-baseline gap-2 min-w-0">
                      <span className="text-[10px] text-[#8a96a8] w-28 shrink-0 leading-tight truncate" title={o.title}>{o.title}</span>
                      <a
                        href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(o.name + ' ' + position.issuerName)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-[11px] font-semibold text-[#007cba] hover:underline leading-tight truncate"
                        title={`Search LinkedIn for ${o.name}`}
                      >{o.name}</a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded border border-dashed border-[#c8c4bc] bg-white px-3 py-2 flex items-center justify-center">
                  <span className="text-[10px] text-[#8a96a8] animate-pulse">Loading officer data…</span>
                </div>
              )}
            </div>

            {/* Price chart */}
            <div>
              <SectionHeader title="Price Chart · 90 Days" />
              {market.sparkline && market.sparkline.length > 1 ? (
                <PriceChart data={market.sparkline} />
              ) : (
                <div className="w-full h-[180px] rounded border border-dashed border-[#c8c4bc] bg-white flex items-center justify-center">
                  <span className="text-[10px] text-[#8a96a8] animate-pulse">Loading chart data…</span>
                </div>
              )}
            </div>

            {/* Performance */}
            <div>
              <SectionHeader title="Performance" />
              <div className="flex gap-2 flex-wrap">
                <PerfBadge label="1M"  value={risk.return1MPct} />
                <PerfBadge label="3M"  value={risk.return3MPct} />
                <PerfBadge label="6M"  value={risk.return6MPct} />
                <PerfBadge label="YTD" value={risk.returnYTDPct} />
              </div>
            </div>

            {/* Live data */}
            <div>
              <SectionHeader title="Live Data" />
              <div className="grid grid-cols-2 gap-3">
                <StatCell label="Price" value={market.price !== null ? `$${market.price.toFixed(2)}` : null} />
                <StatCell
                  label="Day Chg"
                  value={market.dayChangePct !== null ? `${market.dayChangePct >= 0 ? '+' : ''}${market.dayChangePct.toFixed(2)}%` : null}
                  valueClass={market.dayChangePct !== null ? (market.dayChangePct >= 0 ? 'text-emerald-600' : 'text-red-600') : ''}
                />
                <StatCell label="Qtly Return" value={market.quarterlyGrowth !== null ? `${market.quarterlyGrowth >= 0 ? '+' : ''}${(market.quarterlyGrowth * 100).toFixed(1)}%` : null} />
                <StatCell label="Max Drawdown" value={risk.maxDrawdownPct !== null ? `${(risk.maxDrawdownPct * 100).toFixed(1)}%` : null}
                  valueClass={risk.maxDrawdownPct !== null ? 'text-red-600' : ''} />
              </div>
            </div>

            {/* Data freshness */}
            {dataLines && (
              <p className="text-[9px] text-[#a8a49e] font-mono leading-relaxed">
                Data fetched today · {dataLines}
              </p>
            )}
          </div>

          {/* ── RIGHT ── */}
          <div className="lg:col-span-3 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Analyst consensus */}
            <div className="md:col-span-2">
              <SectionHeader title="Analyst Consensus" />
              <AnalystGauge
                sym={position.sym}
                rating={analyst.consensusRating}
                target={analyst.targetPrice}
                current={market.price}
                analysts={analyst.numberOfAnalysts}
                analystActions={analyst.analystActions}
              />
            </div>

            {/* Company Financials */}
            <div className="md:col-span-2">
              <SectionHeader title="Company Financials" />
              <div className="grid grid-cols-4 gap-3">
                <StatCell label="Market Cap"    value={fmtB(valuation.marketCap)} />
                <StatCell label="Enterprise Val" value={fmtB(valuation.enterpriseValue)} />
                <StatCell label="Total Revenue" value={fmtB(valuation.totalRevenue)} />
                <StatCell label="EBITDA"         value={fmtB(valuation.ebitda)} />
              </div>
            </div>

            {/* Fundamentals with GAAP / Non-GAAP toggle */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-semibold text-[#007cba] tracking-wide">Fundamentals</span>
                <div className="flex-1 h-px bg-[#e5e3dd]" />
                <div className="flex rounded overflow-hidden border border-[#d4d1c9] text-[10px] font-semibold">
                  <button
                    onClick={e => { e.stopPropagation(); setGaapMode('gaap'); }}
                    className={`px-2.5 py-1 transition-colors ${gaapMode === 'gaap' ? 'bg-[#202e4a] text-white' : 'bg-white text-[#8a96a8] hover:text-[#4a5e78]'}`}
                  >GAAP</button>
                  <button
                    onClick={e => { e.stopPropagation(); setGaapMode('non-gaap'); }}
                    className={`px-2.5 py-1 transition-colors border-l border-[#d4d1c9] ${gaapMode === 'non-gaap' ? 'bg-[#202e4a] text-white' : 'bg-white text-[#8a96a8] hover:text-[#4a5e78]'}`}
                  >Non-GAAP</button>
                </div>
              </div>

              {gaapMode === 'gaap' ? (
                <div className="grid grid-cols-2 gap-3">
                  <FundamentalCell label="Revenue Growth"  value={fmtPct(fundamentals.revenueGrowthPct, 1, true)}  metricKey="revenueGrowthPct"   sector={sector} />
                  <StatCell        label="EPS Growth"      value={fmtPct(fundamentals.epsGrowthPct, 1, true)} />
                  <FundamentalCell label="Gross Margin"    value={fmtPct(fundamentals.grossMarginPct, 1, true)}    metricKey="grossMarginPct"     sector={sector} />
                  <FundamentalCell label="Operating Margin" value={fmtPct(fundamentals.operatingMarginPct, 1, true)} metricKey="operatingMarginPct" sector={sector} />
                  <FundamentalCell label="Net Margin"      value={fmtPct(fundamentals.netMarginPct, 1, true)}      metricKey="netMarginPct"       sector={sector} />
                  <FundamentalCell label="Return on Equity" value={fmtPct(fundamentals.returnOnEquity, 1, true)}   metricKey="returnOnEquity"     sector={sector} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <FundamentalCell label="Revenue Growth"  value={fmtPct(fundamentals.revenueGrowthPct, 1, true)}  metricKey="revenueGrowthPct"   sector={sector} />
                  <FundamentalCell label="EBITDA Margin"   value={fmtPct(fundamentals.ebitdaMarginPct, 1, true)}   metricKey="ebitdaMarginPct"    sector={sector} />
                  <FundamentalCell label="FCF Margin"      value={fmtPct(fundamentals.fcfMarginPct, 1, true)}      metricKey="fcfMarginPct"       sector={sector} />
                  <StatCell        label="Op. CF Margin"   value={fmtPct(fundamentals.operatingCFMarginPct, 1, true)} />
                  <FundamentalCell label="Return on Assets" value={fmtPct(fundamentals.returnOnAssets, 1, true)}   metricKey="returnOnAssets"     sector={sector} />
                  <FundamentalCell label="Return on Equity" value={fmtPct(fundamentals.returnOnEquity, 1, true)}   metricKey="returnOnEquity"     sector={sector} />
                </div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-3">
                <StatCell label="Last Earnings" value={earnings.lastEarningsDate} />
                <StatCell label="Next Earnings" value={earnings.nextEarningsDate} />
              </div>
            </div>

            {/* Valuation */}
            <div>
              <SectionHeader title="Valuation Multiples" />
              {historicalVal === null && (
                <p className="text-[9px] text-[#c8cdd6] font-mono mb-2 animate-pulse">Loading historical data…</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <ValuationCell label="P/E (TTM)"    value={fmtMult(valuation.pe)}           historical={historicalVal} />
                <StatCell      label="Fwd P/E"      value={fmtMult(valuation.forwardPe)} />
                <ValuationCell label="P/B"           value={fmtMult(valuation.priceToBook)}   historical={historicalVal} />
                <StatCell      label="PEG Ratio"    value={fmtMult(valuation.peg, 2)} />
                <ValuationCell label="EV / EBITDA"  value={fmtMult(valuation.evEbitda)}       historical={historicalVal} />
                <StatCell      label="EV / Revenue" value={fmtMult(valuation.evRevenue)} />
                <ValuationCell label="Price / Sales" value={fmtMult(valuation.priceToSales)}  historical={historicalVal} />
                <StatCell      label="ROE"          value={fmtPct(fundamentals.returnOnEquity, 1, true)} />
                <StatCell      label="D/E Ratio"    value={risk.debtToEquity !== null ? risk.debtToEquity.toFixed(2) : null} />
                <StatCell      label="Div. Yield"   value={valuation.dividendYield !== null ? `${(valuation.dividendYield * 100).toFixed(2)}%` : null} />
              </div>
            </div>

            {/* Risk */}
            <div>
              <SectionHeader title="Risk Metrics" />
              <div className="grid grid-cols-2 gap-3">
                <StatCell label="Beta" value={risk.beta !== null ? risk.beta.toFixed(2) : null} />
                <StatCell label="Debt / Equity" value={risk.debtToEquity !== null ? risk.debtToEquity.toFixed(2) : null} />
                <StatCell label="Max Drawdown" value={risk.maxDrawdownPct !== null ? `${(risk.maxDrawdownPct * 100).toFixed(1)}%` : null}
                  valueClass={risk.maxDrawdownPct !== null ? 'text-red-600' : ''} />
                <StatCell label="Volatility" value={risk.volatilityPct !== null ? `${risk.volatilityPct.toFixed(1)}%` : null} />
              </div>
            </div>

            {/* Comparable Companies */}
            <div className="md:col-span-2">
              <SectionHeader title="Comparable Companies" />
              {peersLoading ? (
                <p className="text-[10px] text-[#8a96a8] animate-pulse">Loading peers…</p>
              ) : peers && peers.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {peers.map(p => (
                    <div key={p.sym} className="flex items-center gap-3">
                      <a
                        href={`https://finance.yahoo.com/quote/${p.sym}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="font-mono text-xs font-bold text-[#007cba] hover:underline w-14 shrink-0"
                      >{p.sym}</a>
                      <span className="text-xs text-[#4a5e78] flex-1 truncate">{p.name}</span>
                      {p.changePct !== null && (
                        <span className={`font-mono text-xs font-semibold shrink-0 ${p.changePct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {p.changePct >= 0 ? '+' : ''}{p.changePct.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : peers !== null ? (
                <p className="text-[10px] text-[#a8a49e] italic">No comparable companies found</p>
              ) : null}
            </div>

            {/* Investment Notes — compact thesis framework */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-semibold text-[#007cba] tracking-wide">Investment Notes</span>
                <div className="flex-1 h-px bg-[#e5e3dd]" />
                <button
                  disabled
                  title="Integration point — connect to notes CMS or internal system"
                  className="text-[10px] text-[#a8a49e] border border-[#d4d1c9] rounded px-2 py-0.5 cursor-not-allowed select-none"
                >✏ Edit Notes</button>
              </div>
              <div className="rounded border border-dashed border-[#d4d1c9] bg-white px-4 py-3 flex flex-col gap-2">
                {[
                  { label: 'Investment Thesis',         hint: '2–3 sentence summary' },
                  { label: 'What Needs to Go Right',    hint: '3 key assumptions' },
                  { label: 'Kill Criteria / Sell Triggers', hint: '3 sell triggers' },
                  { label: 'Key Catalysts (Next 90d)',  hint: 'near-term events' },
                ].map(f => (
                  <div key={f.label} className="flex items-baseline gap-3">
                    <span className="text-[10px] font-medium text-[#8a96a8] w-40 shrink-0">{f.label}</span>
                    <span className="text-[10px] text-[#a8a49e] italic">[Integration point — awaiting investment team · {f.hint}]</span>
                  </div>
                ))}
                <div className="flex items-center gap-3 pt-1 border-t border-[#f2f1ec] mt-1">
                  <span className="text-[10px] font-medium text-[#8a96a8] w-40 shrink-0">Thesis Status</span>
                  <span className="inline-block px-2 py-0.5 rounded text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">under review</span>
                  <span className="text-[10px] text-[#c8cdd6] ml-auto font-mono">Last review: —</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
