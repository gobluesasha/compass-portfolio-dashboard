'use client';

import { useRef, useEffect, useState } from 'react';
import { Position } from '../types/portfolio';
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

function Sparkline({ data, height = 60 }: { data: number[]; height?: number }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 280;
  const h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const first = data[0];
  const last  = data[data.length - 1];
  const isUp  = last >= first;
  const color = isUp ? '#10b981' : '#ef4444';
  const returnPct = ((last - first) / first * 100).toFixed(2);

  return (
    <div className="flex flex-col gap-1">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
        {/* Gradient fill */}
        <defs>
          <linearGradient id={`grad-${isUp}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <polygon
          points={`0,${h} ${pts} ${w},${h}`}
          fill={`url(#grad-${isUp})`}
        />
        {/* Line */}
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* End dot */}
        {data.length > 1 && (
          <circle
            cx={w}
            cy={h - ((last - min) / range) * h}
            r="2.5"
            fill={color}
          />
        )}
      </svg>
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-[#8a96a8] font-mono">90-day</span>
        <span className={`text-[11px] font-mono font-semibold ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>
          {isUp ? '+' : ''}{returnPct}%
        </span>
      </div>
    </div>
  );
}

// Analyst consensus: Yahoo rating 1=Strong Buy, 2=Buy, 3=Hold, 4=Sell, 5=Strong Sell
function AnalystGauge({ rating, target, current, analysts }: {
  rating: number | null;
  target: number | null;
  current: number | null;
  analysts: number | null;
}) {
  const labels = ['', 'Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'];
  const colors = ['', 'text-emerald-700', 'text-emerald-500', 'text-amber-500', 'text-red-500', 'text-red-700'];
  const barColors = ['', 'bg-emerald-500', 'bg-emerald-400', 'bg-amber-400', 'bg-red-400', 'bg-red-600'];
  const label = rating !== null ? (labels[Math.round(rating)] ?? 'Hold') : null;
  const color = rating !== null ? (colors[Math.round(rating)] ?? 'text-amber-500') : 'text-[#c8cdd6]';
  const barColor = rating !== null ? (barColors[Math.round(rating)] ?? 'bg-amber-400') : 'bg-[#e5e3dd]';
  // Position bar fill: 1=full green side, 5=full red side. Invert scale for display.
  const fillPct = rating !== null ? ((5 - rating) / 4) * 100 : 0;
  const upside = (current && target) ? ((target - current) / current * 100) : null;

  return (
    <div className="flex flex-col gap-3">
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
      {/* Rating bar */}
      <div className="flex flex-col gap-1">
        <div className="w-full h-2 rounded-full bg-[#e5e3dd] overflow-hidden">
          <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${fillPct}%` }} />
        </div>
        <div className="flex justify-between text-[9px] text-[#8a96a8]">
          <span>Strong Buy</span>
          <span>Hold</span>
          <span>Strong Sell</span>
        </div>
      </div>
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

function fmtPct(v: number | null, decimals = 1, isRatio = false): string | null {
  if (v === null) return null;
  const val = isRatio ? v * 100 : v;
  return `${val.toFixed(decimals)}%`;
}

function fmtMult(v: number | null, decimals = 1): string | null {
  return v !== null ? `${v.toFixed(decimals)}×` : null;
}

export default function ExpandedRow({ position, isOpen, timestamps }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    if (isOpen) {
      // Measure after a tick to let content render
      requestAnimationFrame(() => {
        if (containerRef.current) setHeight(containerRef.current.scrollHeight);
      });
    } else {
      setHeight(0);
    }
  }, [isOpen, position]);

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
          <div className="lg:col-span-2 p-5 border-r border-[#e5e3dd] flex flex-col gap-5">

            {/* Sector / Industry / Delta tags */}
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
              {delta && delta.direction !== 'unchanged' && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${
                  delta.direction === 'new' ? 'bg-violet-50 text-violet-700 border-violet-200'
                  : delta.direction === 'increased' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-600 border-red-200'
                }`}>
                  {delta.direction === 'new' ? 'NEW Q4'
                    : delta.direction === 'increased' ? `▲ ${(delta.sharesDiffPct * 100).toFixed(1)}% Q3→Q4`
                    : `▼ ${(Math.abs(delta.sharesDiffPct) * 100).toFixed(1)}% Q3→Q4`}
                </span>
              )}
            </div>

            {/* Business summary */}
            {qualitative.businessSummary && (
              <div>
                <SectionHeader title="Business Overview" />
                <p className="text-xs text-[#4a5e78] leading-relaxed line-clamp-4">
                  {qualitative.businessSummary}
                </p>
              </div>
            )}

            {/* Price chart (real sparkline or placeholder) */}
            <div>
              <SectionHeader title="Price Chart · 90 Days" />
              {market.sparkline && market.sparkline.length > 1 ? (
                <Sparkline data={market.sparkline} />
              ) : (
                <div className="w-full h-20 rounded border border-dashed border-[#c8c4bc] bg-white flex items-center justify-center">
                  <span className="text-[10px] text-[#8a96a8] animate-pulse">
                    Loading chart data…
                  </span>
                </div>
              )}
            </div>

            {/* Performance */}
            <div>
              <SectionHeader title="Performance" />
              <div className="flex gap-2">
                <PerfBadge label="1M" value={risk.return1MPct} />
                <PerfBadge label="3M" value={risk.return3MPct} />
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
          <div className="lg:col-span-3 p-5 grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Analyst consensus */}
            <div className="md:col-span-2">
              <SectionHeader title="Analyst Consensus" />
              <AnalystGauge
                rating={analyst.consensusRating}
                target={analyst.targetPrice}
                current={market.price}
                analysts={analyst.numberOfAnalysts}
              />
            </div>

            {/* Fundamentals */}
            <div>
              <SectionHeader title="Fundamentals" />
              <div className="grid grid-cols-2 gap-3">
                <StatCell label="Revenue Growth" value={fmtPct(fundamentals.revenueGrowthPct, 1, true)} />
                <StatCell label="EPS Growth" value={fmtPct(fundamentals.epsGrowthPct, 1, true)} />
                <StatCell label="Gross Margin" value={fmtPct(fundamentals.grossMarginPct, 1, true)} />
                <StatCell label="Return on Equity" value={fmtPct(fundamentals.returnOnEquity, 1, true)} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <StatCell label="Last Earnings" value={earnings.lastEarningsDate} />
                <StatCell label="Next Earnings" value={earnings.nextEarningsDate} />
              </div>
            </div>

            {/* Valuation */}
            <div>
              <SectionHeader title="Valuation" />
              <div className="grid grid-cols-2 gap-3">
                <StatCell label="P/E (TTM)" value={fmtMult(valuation.pe)} />
                <StatCell label="Fwd P/E" value={fmtMult(valuation.forwardPe)} />
                <StatCell label="EV / EBITDA" value={fmtMult(valuation.evEbitda)} />
                <StatCell label="Price / Sales" value={fmtMult(valuation.priceToSales)} />
                <StatCell label="Price / Book" value={fmtMult(valuation.priceToBook)} />
                <StatCell label="Div. Yield" value={valuation.dividendYield !== null ? `${(valuation.dividendYield * 100).toFixed(2)}%` : null} />
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

            {/* Investment Notes — full-width thesis framework */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-semibold text-[#007cba] tracking-wide">Investment Notes</span>
                <div className="flex-1 h-px bg-[#e5e3dd]" />
                <button
                  disabled
                  title="Integration point — connect to notes CMS or internal system"
                  className="flex items-center gap-1 px-2.5 py-1 rounded border border-[#d4d1c9] bg-[#f2f1ec] text-[10px] text-[#a8a49e] cursor-not-allowed select-none"
                >
                  <span>✏</span> Edit Notes
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left column */}
                <div className="flex flex-col gap-4">
                  <ThesisField label="Investment Thesis" placeholder="2–3 sentence summary of the investment case." />
                  <ThesisBullets label="What Needs to Go Right" />
                  <ThesisBullets label="Kill Criteria / Sell Triggers" />
                </div>
                {/* Right column */}
                <div className="flex flex-col gap-4">
                  <ThesisField label="Key Catalysts (Next 90 Days)" placeholder="Near-term events or data points that could move the thesis." />
                  <ThesisStatus />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
