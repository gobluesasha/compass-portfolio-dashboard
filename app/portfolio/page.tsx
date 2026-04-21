import { PORTFOLIO, PORTFOLIO_STATS } from '../../lib/portfolioData';
import PortfolioWrapper from '../../components/PortfolioWrapper';

function StatCard({ label, value, sub, accent = false }: {
  label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <div className="px-5 py-3.5 rounded-lg bg-white border border-[#e5e3dd] flex flex-col gap-1 min-w-[120px] shadow-sm">
      <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[#8a96a8]">{label}</span>
      <span className={`text-xl font-mono font-bold leading-none ${accent ? 'text-[#007cba]' : 'text-[#202e4a]'}`}>{value}</span>
      {sub && <span className="text-[10px] text-[#8a96a8]">{sub}</span>}
    </div>
  );
}

function SignalBar({ green, yellow, red }: { green: number; yellow: number; red: number }) {
  const total = green + yellow + red;
  return (
    <div className="px-5 py-3.5 rounded-lg bg-white border border-[#e5e3dd] flex flex-col gap-2 min-w-[180px] shadow-sm">
      <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[#8a96a8]">Signal Mix</span>
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        <div className="bg-emerald-500 transition-all" style={{ width: `${(green / total) * 100}%` }} />
        <div className="bg-amber-400 transition-all" style={{ width: `${(yellow / total) * 100}%` }} />
        <div className="bg-red-500 transition-all" style={{ width: `${(red / total) * 100}%` }} />
      </div>
      <div className="flex gap-3 text-[10px]">
        <span className="text-emerald-600 font-semibold">{green} ● Conviction</span>
        <span className="text-amber-500 font-semibold">{yellow} ● Monitor</span>
        <span className="text-red-500 font-semibold">{red} ● Concern</span>
      </div>
    </div>
  );
}

interface PageProps {
  searchParams: Promise<{ sym?: string }>;
}

export default async function PortfolioPage({ searchParams }: PageProps) {
  const { sym: focusSym } = await searchParams;
  const totalAUM = (PORTFOLIO_STATS.totalValueK / 1000).toFixed(1);

  return (
    <main className="min-h-screen bg-[#f2f1ec] text-[#202e4a]">
      <div className="max-w-[1600px] mx-auto px-6 py-6 flex flex-col gap-6">

        {/* Stats row */}
        <div className="flex flex-wrap gap-3">
          <StatCard label="Total AUM" value={`$${totalAUM}M`} sub="13-F reported value" accent />
          <StatCard label="Positions" value={String(PORTFOLIO_STATS.totalPositions)} sub="Unique holdings" />
          <StatCard label="Top 10 Concentration" value={`${(PORTFOLIO_STATS.top10Weight * 100).toFixed(1)}%`} sub="% of AUM in 10 largest positions" />
          <SignalBar
            green={PORTFOLIO_STATS.greenCount}
            yellow={PORTFOLIO_STATS.yellowCount}
            red={PORTFOLIO_STATS.redCount}
          />
          <StatCard
            label="Largest Position"
            value={PORTFOLIO[0].sym}
            sub={`${PORTFOLIO[0].weightDisplay} · ${PORTFOLIO[0].issuerName.slice(0, 22)}`}
          />
        </div>

        {/* Section header */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-[#8a96a8] tracking-wide">
            Holdings · Q4 2025 13-F
          </span>
          <div className="flex-1 h-px bg-[#d4d1c9]" />
          <span className="text-[11px] text-[#8a96a8]">
            Click column to sort · click row to expand
          </span>
        </div>

        <PortfolioWrapper initialPositions={PORTFOLIO} focusSym={focusSym} />

        <footer className="pt-2 pb-6 flex items-center justify-between">
          <span className="text-[10px] text-[#a8a49e] uppercase tracking-widest">
            © 2025 Compass Capital Management Inc.
          </span>
          <span className="text-[10px] text-[#a8a49e] font-mono">
            Source: SEC 13-F Q4 2025 · Prices via Yahoo Finance
          </span>
        </footer>
      </div>
    </main>
  );
}
