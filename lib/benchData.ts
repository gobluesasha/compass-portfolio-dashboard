// Comparable companies for each of the 25 core portfolio positions
// 2 comps per core position = 50 bench entries

export type BenchComp = {
  sym: string;
  name: string;
  compFor: string;   // core 25 ticker this is a comp for
  sector: string;
};

export const BENCH_COMPS: BenchComp[] = [
  // APH — Amphenol (Electronic Connectors)
  { sym: 'TEL',   name: 'TE Connectivity',          compFor: 'APH',  sector: 'Technology' },
  { sym: 'HUBB',  name: 'Hubbell Inc',               compFor: 'APH',  sector: 'Industrials' },

  // MSFT — Microsoft (Cloud / Enterprise Software)
  { sym: 'ORCL',  name: 'Oracle Corp',               compFor: 'MSFT', sector: 'Technology' },
  { sym: 'SAP',   name: 'SAP SE',                    compFor: 'MSFT', sector: 'Technology' },

  // GOOGL — Alphabet (Internet / Digital Advertising)
  { sym: 'META',  name: 'Meta Platforms',            compFor: 'GOOGL', sector: 'Communication Services' },
  { sym: 'SNAP',  name: 'Snap Inc',                  compFor: 'GOOGL', sector: 'Communication Services' },

  // MRK — Merck (Large-Cap Pharma)
  { sym: 'PFE',   name: 'Pfizer Inc',                compFor: 'MRK',  sector: 'Healthcare' },
  { sym: 'ABBV',  name: 'AbbVie Inc',                compFor: 'MRK',  sector: 'Healthcare' },

  // WMT — Walmart (Mass Retail)
  { sym: 'COST',  name: 'Costco Wholesale',          compFor: 'WMT',  sector: 'Consumer Staples' },
  { sym: 'KR',    name: 'Kroger Co',                 compFor: 'WMT',  sector: 'Consumer Staples' },

  // TMO — Thermo Fisher (Life Science Tools)
  { sym: 'A',     name: 'Agilent Technologies',      compFor: 'TMO',  sector: 'Healthcare' },
  { sym: 'WAT',   name: 'Waters Corp',               compFor: 'TMO',  sector: 'Healthcare' },

  // JNJ — Johnson & Johnson (Diversified Healthcare)
  { sym: 'ABT',   name: 'Abbott Laboratories',       compFor: 'JNJ',  sector: 'Healthcare' },
  { sym: 'MDT',   name: 'Medtronic PLC',             compFor: 'JNJ',  sector: 'Healthcare' },

  // EXPD — Expeditors (Freight & Logistics)
  { sym: 'CHRW',  name: 'C.H. Robinson Worldwide',   compFor: 'EXPD', sector: 'Industrials' },
  { sym: 'XPO',   name: 'XPO Inc',                   compFor: 'EXPD', sector: 'Industrials' },

  // V — Visa (Payments Networks)
  { sym: 'AXP',   name: 'American Express',          compFor: 'V',    sector: 'Financials' },
  { sym: 'PYPL',  name: 'PayPal Holdings',           compFor: 'V',    sector: 'Financials' },

  // DHR — Danaher (Life Science Instruments)
  { sym: 'BIO',   name: 'Bio-Rad Laboratories',      compFor: 'DHR',  sector: 'Healthcare' },
  { sym: 'BRKR',  name: 'Bruker Corp',               compFor: 'DHR',  sector: 'Healthcare' },

  // NVDA — Nvidia (GPUs / AI Chips)
  { sym: 'AMD',   name: 'Advanced Micro Devices',    compFor: 'NVDA', sector: 'Technology' },
  { sym: 'INTC',  name: 'Intel Corp',                compFor: 'NVDA', sector: 'Technology' },

  // QCOM — Qualcomm (Mobile Semiconductors)
  { sym: 'TXN',   name: 'Texas Instruments',         compFor: 'QCOM', sector: 'Technology' },
  { sym: 'MRVL',  name: 'Marvell Technology',        compFor: 'QCOM', sector: 'Technology' },

  // ACN — Accenture (IT Services / Consulting)
  { sym: 'IBM',   name: 'IBM Corp',                  compFor: 'ACN',  sector: 'Technology' },
  { sym: 'CTSH',  name: 'Cognizant Technology',      compFor: 'ACN',  sector: 'Technology' },

  // ICE — Intercontinental Exchange (Financial Exchanges)
  { sym: 'CME',   name: 'CME Group',                 compFor: 'ICE',  sector: 'Financials' },
  { sym: 'NDAQ',  name: 'Nasdaq Inc',                compFor: 'ICE',  sector: 'Financials' },

  // SYK — Stryker (Orthopedic Devices)
  { sym: 'EW',    name: 'Edwards Lifesciences',      compFor: 'SYK',  sector: 'Healthcare' },
  { sym: 'ZBH',   name: 'Zimmer Biomet Holdings',    compFor: 'SYK',  sector: 'Healthcare' },

  // SHW — Sherwin-Williams (Paints & Coatings)
  { sym: 'PPG',   name: 'PPG Industries',            compFor: 'SHW',  sector: 'Materials' },
  { sym: 'RPM',   name: 'RPM International',         compFor: 'SHW',  sector: 'Materials' },

  // BSX — Boston Scientific (Cardiovascular Devices)
  { sym: 'STE',   name: 'Steris PLC',                compFor: 'BSX',  sector: 'Healthcare' },
  { sym: 'HOLX',  name: 'Hologic Inc',               compFor: 'BSX',  sector: 'Healthcare' },

  // FAST — Fastenal (Industrial Distribution)
  { sym: 'GWW',   name: 'W.W. Grainger',             compFor: 'FAST', sector: 'Industrials' },
  { sym: 'MSM',   name: 'MSC Industrial Direct',     compFor: 'FAST', sector: 'Industrials' },

  // ITW — Illinois Tool Works (Diversified Industrials)
  { sym: 'AME',   name: 'AMETEK Inc',                compFor: 'ITW',  sector: 'Industrials' },
  { sym: 'CARR',  name: 'Carrier Global',            compFor: 'ITW',  sector: 'Industrials' },

  // MSI — Motorola Solutions (Public Safety / Communications)
  { sym: 'AXON',  name: 'Axon Enterprise',           compFor: 'MSI',  sector: 'Technology' },
  { sym: 'ZBRA',  name: 'Zebra Technologies',        compFor: 'MSI',  sector: 'Technology' },

  // CHKP — Check Point Software (Cybersecurity)
  { sym: 'CRWD',  name: 'CrowdStrike Holdings',      compFor: 'CHKP', sector: 'Technology' },
  { sym: 'ZS',    name: 'Zscaler Inc',               compFor: 'CHKP', sector: 'Technology' },

  // ROP — Roper Technologies (Industrial Software)
  { sym: 'FICO',  name: 'Fair Isaac Corp',           compFor: 'ROP',  sector: 'Technology' },
  { sym: 'TDY',   name: 'Teledyne Technologies',     compFor: 'ROP',  sector: 'Technology' },

  // ADP — Automatic Data Processing (HR / Payroll)
  { sym: 'PAYC',  name: 'Paycom Software',           compFor: 'ADP',  sector: 'Technology' },
  { sym: 'WEX',   name: 'WEX Inc',                   compFor: 'ADP',  sector: 'Financials' },

  // CHD — Church & Dwight (Consumer Staples / HPC)
  { sym: 'CLX',   name: 'Clorox Co',                 compFor: 'CHD',  sector: 'Consumer Staples' },
  { sym: 'PG',    name: 'Procter & Gamble',          compFor: 'CHD',  sector: 'Consumer Staples' },

  // LIN — Linde (Industrial Gases)
  { sym: 'APD',   name: 'Air Products & Chemicals',  compFor: 'LIN',  sector: 'Materials' },
  { sym: 'AIQUY', name: 'Air Liquide ADR',           compFor: 'LIN',  sector: 'Materials' },
];

// Core 25 display names (for the compFor label in the table)
export const CORE_NAMES: Record<string, string> = {
  APH:  'Amphenol',   MSFT: 'Microsoft',  GOOGL: 'Alphabet',
  MRK:  'Merck',      WMT:  'Walmart',    TMO:   'Thermo Fisher',
  JNJ:  'J&J',        EXPD: 'Expeditors', V:     'Visa',
  DHR:  'Danaher',    NVDA: 'Nvidia',     QCOM:  'Qualcomm',
  ACN:  'Accenture',  ICE:  'ICE',        SYK:   'Stryker',
  SHW:  'Sherwin-Wms',BSX:  'Boston Sci', FAST:  'Fastenal',
  ITW:  'Illinois TW',MSI:  'Motorola',   CHKP:  'Check Point',
  ROP:  'Roper Tech', ADP:  'ADP',        CHD:   'Church & Dwight',
  LIN:  'Linde',
};
