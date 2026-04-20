'use client';

import { useRef, useEffect, useState } from 'react';
import { Position } from '../types/portfolio';

interface Props {
  position: Position;
  isOpen: boolean;
}

// ── Small helper: renders a labelled stat cell ─────────────────
function StatCell({
  label,
  value,
  valueClass = '',
}: {
  label: string;
  value: string | number | null;
  valueClass?: string;
}) {
  const display = value === null || value === undefined ? '—' : value;
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] uppercase tracking-widest font-medium text-[#3d566e]">
        {label}
      </span>
      <span
        className={`text-sm font-mono font-semibold ${
          value === null ? 'text-[#2d4155]' : 'text-[#c9d9e8]'
        } ${valueClass}`}
      >
        {display}
      </span>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#3a5a7a]">
        {title}
      </span>
      <div className="flex-1 h-px bg-[#1a2d3d]" />
    </div>
  );
}

// ── Performance badge ──────────────────────────────────────────
function PerfBadge({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex flex-col items-center gap-1 px-3 py-2 rounded bg-[#0d1e2e] border border-[#1a2d3d]">
      <span className="text-[10px] uppercase tracking-widest text-[#3d566e]">{label}</span>
      <span
        className={`text-sm font-mono font-bold ${
          value === null
            ? 'text-[#2d4155]'
            : value >= 0
            ? 'text-emerald-400'
            : 'text-red-400'
        }`}
      >
        {value === null ? '—' : `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`}
      </span>
    </div>
  );
}

export default function ExpandedRow({ position, isOpen }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setHeight(isOpen ? containerRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  const { fundamentals, valuation, risk, qualitative, priceHistory, market, earnings } = position;

  return (
    <div
      style={{
        maxHeight: height,
        transition: 'max-height 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
    >
      <div ref={containerRef}>
        {/* Inner panel */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 border-t border-[#0e2236]">
          
          {/* ── LEFT: Chart + Price Info ─────────────────────── */}
          <div className="lg:col-span-2 p-5 border-r border-[#0e2236] flex flex-col gap-5">
            
            {/* Chart placeholder */}
            <div>
              <SectionHeader title="Price Chart" />
              <div
                className="w-full h-36 rounded border border-dashed border-[#1a3248] 
                           bg-[#080f18] flex flex-col items-center justify-center gap-1.5"
              >
                {/* Mock sparkline SVG */}
                <svg
                  viewBox="0 0 200 60"
                  className="w-48 opacity-20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline
                    points="0,45 20,38 40,42 60,28 80,32 100,18 120,22 140,12 160,16 180,8 200,5"
                    stroke="#4f8ef7"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-[10px] uppercase tracking-widest text-[#1e3550]">
                  Live chart · coming soon
                </span>
              </div>
            </div>

            {/* Entry vs current */}
            <div>
              <SectionHeader title="Price" />
              <div className="grid grid-cols-3 gap-3">
                <StatCell label="Entry" value={priceHistory.entryPrice !== null ? `$${priceHistory.entryPrice.toFixed(2)}` : null} />
                <StatCell label="Current" value={priceHistory.currentPrice !== null ? `$${priceHistory.currentPrice.toFixed(2)}` : null} />
                <StatCell label="P&L" value={null} />
              </div>
            </div>

            {/* Performance */}
            <div>
              <SectionHeader title="Performance" />
              <div className="flex gap-2">
                <PerfBadge label="1M" value={priceHistory.return1MPct} />
                <PerfBadge label="3M" value={priceHistory.return3MPct} />
                <PerfBadge label="YTD" value={priceHistory.returnYTDPct} />
              </div>
            </div>

            {/* Market data */}
            <div>
              <SectionHeader title="Live Data" />
              <div className="grid grid-cols-2 gap-3">
                <StatCell label="Price" value={market.price !== null ? `$${market.price.toFixed(2)}` : null} />
                <StatCell
                  label="Day Chg"
                  value={market.dayChangePct !== null ? `${market.dayChangePct >= 0 ? '+' : ''}${market.dayChangePct.toFixed(2)}%` : null}
                  valueClass={market.dayChangePct !== null ? (market.dayChangePct >= 0 ? 'text-emerald-400' : 'text-red-400') : ''}
                />
                <StatCell label="Total Return" value={market.totalReturnPct !== null ? `${market.totalReturnPct.toFixed(2)}%` : null} />
                <StatCell label="Qtly Growth" value={market.quarterlyGrowth !== null ? `${market.quarterlyGrowth.toFixed(2)}%` : null} />
              </div>
            </div>
          </div>

          {/* ── RIGHT: Fundamentals / Valuation / Risk / Qualitative ── */}
          <div className="lg:col-span-3 p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Fundamentals */}
            <div>
              <SectionHeader title="Fundamentals" />
              <div className="grid grid-cols-2 gap-3">
                <StatCell label="Revenue Growth" value={fundamentals.revenueGrowthPct !== null ? `${fundamentals.revenueGrowthPct.toFixed(1)}%` : null} />
                <StatCell label="EPS Growth" value={fundamentals.epsGrowthPct !== null ? `${fundamentals.epsGrowthPct.toFixed(1)}%` : null} />
                <StatCell label="Proj. Growth" value={fundamentals.projectedGrowthPct !== null ? `${fundamentals.projectedGrowthPct.toFixed(1)}%` : null} />
                <StatCell label="Actual Growth" value={fundamentals.actualGrowthPct !== null ? `${fundamentals.actualGrowthPct.toFixed(1)}%` : null} />
              </div>
              {/* Earnings summary */}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <StatCell label="Last Earnings" value={earnings.lastEarningsDate} />
                <StatCell label="Next Earnings" value={earnings.nextEarningsDate} />
              </div>
            </div>

            {/* Valuation */}
            <div>
              <SectionHeader title="Valuation" />
              <div className="grid grid-cols-1 gap-3">
                <StatCell label="P/E Ratio" value={valuation.pe !== null ? `${valuation.pe.toFixed(1)}×` : null} />
                <StatCell label="EV / EBITDA" value={valuation.evEbitda !== null ? `${valuation.evEbitda.toFixed(1)}×` : null} />
                <StatCell label="Price / Sales" value={valuation.priceToSales !== null ? `${valuation.priceToSales.toFixed(1)}×` : null} />
              </div>
            </div>

            {/* Risk */}
            <div>
              <SectionHeader title="Risk Metrics" />
              <div className="grid grid-cols-1 gap-3">
                <StatCell label="Volatility" value={risk.volatilityPct !== null ? `${risk.volatilityPct.toFixed(1)}%` : null} />
                <StatCell label="Beta" value={risk.beta !== null ? risk.beta.toFixed(2) : null} />
                <StatCell label="Max Drawdown" value={risk.maxDrawdownPct !== null ? `${risk.maxDrawdownPct.toFixed(1)}%` : null} />
              </div>
            </div>

            {/* Qualitative */}
            <div>
              <SectionHeader title="Qualitative" />
              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-medium text-[#3d566e]">
                    Investment Thesis
                  </span>
                  <p className="mt-1 text-xs text-[#2d4155] leading-relaxed">
                    {qualitative.thesis ?? '— Awaiting notes —'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-medium text-[#3d566e]">
                    What Needs to Go Right
                  </span>
                  <p className="mt-1 text-xs text-[#2d4155] leading-relaxed">
                    {qualitative.whatNeedsToGoRight ?? '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-medium text-[#3d566e]">
                    Sell Criteria
                  </span>
                  <p className="mt-1 text-xs text-[#2d4155] leading-relaxed">
                    {qualitative.sellCriteria ?? '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-medium text-[#3d566e]">
                    Catalysts
                  </span>
                  <p className="mt-1 text-xs text-[#2d4155] leading-relaxed">
                    {qualitative.catalysts ?? '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
