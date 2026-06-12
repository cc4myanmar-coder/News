export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  timestamp: string;
  category: 'Tech Sector' | 'IPOs' | 'Earnings' | 'Geopolitical' | 'Macroeconomics';
  impact: 'Bullish' | 'Bearish' | 'Neutral';
  indicesAffected: string[];
  volatilityScore: number;
}

export interface CalendarEvent {
  id: string;
  time: string;
  date: string;
  event: string;
  country: string;
  impact: 'High' | 'Medium' | 'Low';
  actual: string | null;
  forecast: string | null;
  previous: string | null;
}

export interface VolatilityAnalysis {
  verdict: string;
  supportResistance: {
    NQ: { support: string; resistance: string };
    ES: { support: string; resistance: string };
  };
  bias: string;
}

export interface TickData {
  time: string;
  price: number;
}
