'use client';

import { useState } from 'react';
import { Position } from '../types/portfolio';
import PortfolioWrapper from './PortfolioWrapper';
import BenchWrapper from './BenchWrapper';

type Tab = 'portfolio' | 'bench';

interface Props {
  initialPositions: Position[];
  focusSym?: string;
  initialSignalFilter?: string;
}

export default function PortfolioTabs({ initialPositions, focusSym, initialSignalFilter }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('portfolio');

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-[#d4d1c9]">
        <TabButton label="Portfolio" active={activeTab === 'portfolio'} onClick={() => setActiveTab('portfolio')} />
        <TabButton label="Bench" active={activeTab === 'bench'} onClick={() => setActiveTab('bench')} />
      </div>

      {activeTab === 'portfolio' && (
        <PortfolioWrapper initialPositions={initialPositions} focusSym={focusSym} initialSignalFilter={initialSignalFilter} />
      )}
      {activeTab === 'bench' && (
        <BenchWrapper />
      )}
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 text-[12px] font-semibold tracking-wide transition-colors relative -mb-px ${
        active
          ? 'text-[#007cba] border-b-2 border-[#007cba]'
          : 'text-[#8a96a8] hover:text-[#4a5e78] border-b-2 border-transparent'
      }`}
    >
      {label}
    </button>
  );
}
