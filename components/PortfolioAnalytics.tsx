'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
  PieChart, Pie,
} from 'recharts';
import { PORTFOLIO, PORTFOLIO_STATS } from '../lib/portfolioData';
import { computeSectorAllocation } from '../lib/historicalData';

const CORE_THRESHOLD = 0.027;

// S&P 500 approximate sector weights Q1 2026 — static placeholder
const SP500_WEIGHTS: Record<string, number> = {
  'Technology':          31.0,
  'Comm. Services':       8.8,
  'Healthcare':          12.0,
  'Industrials':          8.5,
  'Consumer Discret.':   10.8,
  'Consumer Staples':     5.6,
  'Financials':          13.2,
  'Materials':            2.4,
  'Energy':               3.9,
  'Real Estate':          2.3,
  'Utilities':            2.5,
};

function SectorTooltip({ active, payload, label }: { active?: boolean; payload?: {name: string; value: number}[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e3dd', borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
      <p style={{ fontWeight: 600, marginBottom: 4, color: '#202e4a' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.name === 'portfolio' ? '#007cba' : '#8a96a8' }}>
          {p.name === 'portfolio' ? 'Portfolio' : 'S&P 500'}: {p.value}%
        </p>
      ))}
    </div>
  );
}

function CountTooltip({ active, payload, label }: { active?: boolean; payload?: {value: number}[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e3dd', borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
      <p style={{ color: '#202e4a', fontWeight: 600 }}>{label}</p>
      <p style={{ color: '#007cba' }}>{payload[0]?.value} positions</p>
    </div>
  );
}

function SectionHeader({ title, note }: { title: string; note?: string }) {
  return (
    <div className="px-5 py-3.5 border-b border-[#eeece7]">
      <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#8a96a8]">{title}</span>
      {note && <p className="text-[9px] text-[#a8a49e] mt-0.5 font-mono italic">{note}</p>}
    </div>
  );
}

function ConcentrationCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-[#e5e3dd] bg-[#f8f7f3] px-4 py-3 flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[#8a96a8]">{label}</span>
      <span className="text-xl font-mono font-bold text-[#202e4a] leading-none">{value}</span>
      {sub && <span className="text-[10px] text-[#8a96a8]">{sub}</span>}
    </div>
  );
}

function RiskPlaceholder({ label }: { label: string }) {
  return (
    <div
      className="rounded-lg border border-dashed border-[#d4d1c9] bg-[#f8f7f3] px-4 py-3.5 flex flex-col gap-1"
      title="Integration point: risk analytics engine"
    >
      <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[#8a96a8]">{label}</span>
      <span className="text-xl font-mono font-bold text-[#c8cdd6]">—</span>
      <span className="text-[9px] text-[#a8a49e] font-mono italic">Integration point: risk engine</span>
    </div>
  );
}

export default function PortfolioAnalytics() {
  const sectorAllocation = computeSectorAllocation(PORTFOLIO);

  const sectorData = [...sectorAllocation]
    .sort((a, b) => b.weight - a.weight)
    .map(s => ({
      sector: s.sector,
      portfolio: parseFloat((s.weight * 100).toFixed(1)),
      benchmark: SP500_WEIGHTS[s.sector] ?? 0,
    }));

  // Concentration
  const sorted = [...PORTFOLIO].sort((a, b) => b.weight - a.weight);
  const top5  = sorted.slice(0, 5).reduce((s, p) => s + p.weight, 0);
  const top10 = sorted.slice(0, 10).reduce((s, p) => s + p.weight, 0);
  const top25 = sorted.slice(0, 25).reduce((s, p) => s + p.weight, 0);
  const maxSector = sectorAllocation.reduce(
    (a, b) => (a.weight > b.weight ? a : b),
    sectorAllocation[0] ?? { sector: '', weight: 0 }
  );

  // Core vs tail donut
  const coreValueK = PORTFOLIO.filter(p => p.weight >= CORE_THRESHOLD).reduce((s, p) => s + p.valueK, 0);
  const tailValueK = PORTFOLIO.filter(p => p.weight <  CORE_THRESHOLD).reduce((s, p) => s + p.valueK, 0);
  const total = PORTFOLIO_STATS.totalValueK;
  const donutData = [
    { name: 'Core (25)',  value: parseFloat((coreValueK / total * 100).toFixed(1)), valueK: coreValueK, fill: '#007cba' },
    { name: 'Tail (58)',  value: parseFloat((tailValueK / total * 100).toFixed(1)), valueK: tailValueK, fill: '#c8cdd6' },
  ];

  // Position size histogram
  const buckets = [
    { label: '0–0.5%', min: 0,     max: 0.005, count: 0 },
    { label: '0.5–1%', min: 0.005, max: 0.01,  count: 0 },
    { label: '1–2%',   min: 0.01,  max: 0.02,  count: 0 },
    { label: '2–3%',   min: 0.02,  max: 0.03,  count: 0 },
    { label: '3–4%',   min: 0.03,  max: 0.04,  count: 0 },
    { label: '4%+',    min: 0.04,  max: 1,     count: 0 },
  ];
  PORTFOLIO.forEach(p => {
    const b = buckets.find(b => p.weight >= b.min && p.weight < b.max);
    if (b) b.count++;
    else if (p.weight >= 0.04) buckets[5].count++;
  });

  const chartH = Math.max(sectorData.length * 40, 200);

  return (
    <div className="flex flex-col gap-4">

      {/* Sector Exposure */}
      <div className="bg-white rounded-lg border border-[#e5e3dd] shadow-sm overflow-hidden">
        <SectionHeader
          title="Sector Exposure vs. S&P 500"
          note="Benchmark weights: static placeholder — integration point for live benchmark feed"
        />
        <div className="px-5 pt-4 pb-2">
          <div className="flex gap-4 mb-3 text-[11px] text-[#4a5e78]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-2.5 rounded-sm bg-[#007cba]" />Portfolio
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-2.5 rounded-sm bg-[#d4d1c9]" />S&amp;P 500
            </span>
          </div>
          <ResponsiveContainer width="100%" height={chartH}>
            <BarChart data={sectorData} layout="vertical" barCategoryGap="25%" barGap={3} margin={{ left: 0, right: 30 }}>
              <XAxis type="number" tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: '#8a96a8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="sector" width={120} tick={{ fontSize: 11, fill: '#4a5e78' }} axisLine={false} tickLine={false} />
              <Tooltip content={<SectorTooltip />} />
              <Bar dataKey="portfolio" fill="#007cba" radius={[0, 3, 3, 0]} />
              <Bar dataKey="benchmark" fill="#d4d1c9" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Concentration Risk + Core vs Tail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-[#e5e3dd] shadow-sm overflow-hidden">
          <SectionHeader title="Concentration Risk" />
          <div className="p-5 flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <ConcentrationCard label="Top 5" value={`${(top5 * 100).toFixed(1)}%`} sub="of AUM" />
              <ConcentrationCard label="Top 10" value={`${(top10 * 100).toFixed(1)}%`} sub="of AUM" />
              <ConcentrationCard label="Core 25" value={`${(top25 * 100).toFixed(1)}%`} sub="of AUM" />
            </div>
            {maxSector.weight > 0.20 ? (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                <span className="text-amber-500 text-sm shrink-0">⚠</span>
                <div>
                  <p className="text-xs font-semibold text-amber-700">Single-Sector Alert</p>
                  <p className="text-[11px] text-amber-600 mt-0.5">
                    {maxSector.sector} at {(maxSector.weight * 100).toFixed(1)}% exceeds the 20% threshold
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
                <span className="text-emerald-500 text-sm">✓</span>
                <p className="text-xs text-emerald-700">No single sector exceeds 20% — concentration within guidelines</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e5e3dd] shadow-sm overflow-hidden">
          <SectionHeader title="Core vs. Tail Allocation" />
          <div className="p-5 flex items-center gap-6">
            <div className="shrink-0">
              <ResponsiveContainer width={150} height={150}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                    {donutData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-3 flex-1">
              {donutData.map(d => (
                <div key={d.name} className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-sm mt-0.5 shrink-0" style={{ background: d.fill }} />
                  <div>
                    <p className="text-xs font-semibold text-[#202e4a]">{d.name} positions</p>
                    <p className="text-sm font-mono font-bold text-[#007cba]">{d.value}%</p>
                    <p className="text-[10px] text-[#8a96a8]">${(d.valueK / 1000).toFixed(1)}M AUM</p>
                  </div>
                </div>
              ))}
              <p className="text-[9px] text-[#a8a49e] font-mono">Core threshold: weight ≥ 2.7%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Histogram + Risk Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-[#e5e3dd] shadow-sm overflow-hidden">
          <SectionHeader title="Position Size Distribution" />
          <div className="px-5 pt-4 pb-3">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={buckets} barCategoryGap="30%" margin={{ top: 0, right: 10, bottom: 0, left: -10 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8a96a8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#8a96a8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CountTooltip />} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {buckets.map((_, i) => (
                    <Cell key={i} fill={i <= 1 ? '#b8d4e4' : i <= 2 ? '#78aec8' : '#007cba'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e5e3dd] shadow-sm overflow-hidden">
          <SectionHeader title="Portfolio Risk Metrics" note="Integration point: connect to risk analytics engine for live calculations" />
          <div className="p-5 grid grid-cols-2 gap-3">
            <RiskPlaceholder label="Portfolio Beta" />
            <RiskPlaceholder label="Volatility (Ann.)" />
            <RiskPlaceholder label="VaR 95% / 1-Day" />
            <RiskPlaceholder label="Sharpe Ratio" />
          </div>
        </div>
      </div>
    </div>
  );
}
