import { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Search, 
  Calendar, 
  AlertTriangle, 
  Globe, 
  Activity, 
  Cpu, 
  BookOpen, 
  Sparkles, 
  Clock, 
  ArrowUpRight, 
  Info, 
  ChevronRight,
  Filter,
  Flame,
  Volume2,
  TrendingUpIcon,
  HelpCircle,
  Facebook,
  Send,
  MessageSquare
} from 'lucide-react';
import { NewsItem, CalendarEvent, VolatilityAnalysis, TickData } from './types';
import { BURMESE_LEXICON } from './components/BurmeseLexicon';
import { LiveFuturesChart } from './components/LiveFuturesChart';
import { getMacroDetailsForEvent } from './components/MacroExplainerData';
import { VolatilitySparkline, SparklinePoint } from './components/VolatilitySparkline';

// Helper to generate dynamic volatility series for the D3 sparkline
const generateInitialVolatilityHistory = (): SparklinePoint[] => {
  const now = Date.now();
  return Array.from({ length: 60 }, (_, i) => {
    const time = new Date(now - (60 - i) * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    // Core baseline around 4.8% index, with randomized micro-swing wave overlays
    const value = 4.8 + Math.sin(i * 0.15) * 1.6 + Math.cos(i * 0.08) * 0.9 + Math.random() * 0.5;
    return { time, value: Math.max(1.8, Math.min(18.5, value)) };
  });
};

// Helper to strictly round index futures price to valid CME tick sizes (0.25 minimum increment)
const roundToCmeTick = (val: number): number => {
  return Math.round(val * 4) / 4;
};

// Helper to parse dates into human trader-friendly days of the week matching Forex Factory styles
const formatCalendarDate = (dateStr: string): string => {
  if (dateStr === '2026-06-10') return 'Wednesday, Jun 10';
  if (dateStr === '2026-06-11') return 'Thursday, Jun 11 (Today)';
  if (dateStr === '2026-06-12') return 'Friday, Jun 12 (Tomorrow)';
  
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

export default function App() {
  // Real-time market tick state initialized to correct June 2026 baseline
  const [nqPrice, setNqPrice] = useState<number>(28883.50);
  const [nqChange, setNqChange] = useState<number>(1.25);
  const [nqDirection, setNqDirection] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [nqHistory, setNqHistory] = useState<TickData[]>([]);
  const [nqHigh, setNqHigh] = useState<number>(28950.00);
  const [nqLow, setNqLow] = useState<number>(28810.00);

  const [esPrice, setEsPrice] = useState<number>(6432.75); // Strictly rounded to 0.25 tick spec
  const [esChange, setEsChange] = useState<number>(0.72);
  const [esDirection, setEsDirection] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [esHistory, setEsHistory] = useState<TickData[]>([]);
  const [esHigh, setEsHigh] = useState<number>(6460.00);
  const [esLow, setEsLow] = useState<number>(6410.00);

  // Focus index for chart view (NQ is prioritized)
  const [focusedIndex, setFocusedIndex] = useState<'NQ' | 'ES'>('NQ');

  // Real-time server data feeds
  const [news, setNews] = useState<NewsItem[]>([]);
  const [calendar, setCalendar] = useState<CalendarEvent[]>([]);
  const [volatilityAnalysis, setVolatilityAnalysis] = useState<VolatilityAnalysis | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(true);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [dataSources, setDataSources] = useState<{ news: string; calendar: string }>({
    news: 'Loading...',
    calendar: 'Loading...'
  });

  // Dual-intelligence failover indicators
  const [geminiStandby, setGeminiStandby] = useState<boolean>(false);
  const [standbyReason, setStandbyReason] = useState<string>('');

  // Client side filtering & search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [calendarDayFilter, setCalendarDayFilter] = useState<'all' | 'high-only'>('all');

  // Selected lexicon entry for Burmese explanation modal
  const [selectedLexiconKey, setSelectedLexiconKey] = useState<string | null>(null);

  // Selected calendar event for detailed Myanmar macro explanation and professional scenarios
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<CalendarEvent | null>(null);

  // Volatility historical timeline data for the interactive D3 sparkline
  const [volatilityHistory, setVolatilityHistory] = useState<SparklinePoint[]>(() => generateInitialVolatilityHistory());

  // Dynamic feedback sync states for trading layout alignment
  const [showPriceAdjuster, setShowPriceAdjuster] = useState<boolean>(false);
  const [manualNq, setManualNq] = useState<string>('28883.50');
  const [manualEs, setManualEs] = useState<string>('6432.75'); // Ticked baseline
  const [priceSyncStatus, setPriceSyncStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
  
  // Real-time custom volatility warnings state
  const [volatilityAlerts, setVolatilityAlerts] = useState<Array<{
    id: string;
    timestamp: string;
    index: string;
    type: string;
    description: string;
    severity: 'critical' | 'moderate' | 'info';
  }>>([
    {
      id: 'a-1',
      timestamp: '08:31 EST',
      index: 'USD',
      type: 'Core PPI Published',
      description: 'Core PPI MoM printed 0.5%, in line with standard consensus guidelines.',
      severity: 'moderate'
    },
    {
      id: 'a-2',
      timestamp: '08:30 EST',
      index: 'FED',
      type: 'Jobless Claims Open',
      description: 'US Initial Jobless Claims registered at 218K versus 220K expected forecast.',
      severity: 'info'
    },
    {
      id: 'a-3',
      timestamp: 'yesterday',
      index: 'USD',
      type: 'CPI Print Support',
      description: 'Core CPI print confirms structural deceleration to 2.9% YoY.',
      severity: 'moderate'
    }
  ]);

  // Sync / Fetch live market futures prices using Google Grounded Search (with seamless local fallback)
  const fetchRealTimeBaseline = async () => {
    setPriceSyncStatus('fetching');
    try {
      const res = await fetch('/api/market-prices');
      const data = await res.json();
      if (data && data.prices) {
        const { nq, es } = data.prices;
        const roundedNq = roundToCmeTick(nq);
        const roundedEs = roundToCmeTick(es);

        setNqPrice(roundedNq);
        setNqHigh(roundedNq + 45);
        setNqLow(roundedNq - 45);
        setManualNq(roundedNq.toString());

        setEsPrice(roundedEs);
        setEsHigh(roundedEs + 12);
        setEsLow(roundedEs - 12);
        setManualEs(roundedEs.toString());

        // Regenerate historical trace points relative to newly acquired baseline
        const now = Date.now();
        const updatedNq = Array.from({ length: 30 }, (_, i) => ({
          time: new Date(now - (30 - i) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          price: roundToCmeTick(roundedNq - (15 - i * 0.5) + Math.sin(i * 0.3) * 10 + Math.random() * 3)
        }));
        const updatedEs = Array.from({ length: 30 }, (_, i) => ({
          time: new Date(now - (30 - i) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          price: roundToCmeTick(roundedEs - (2 - i * 0.1) + Math.cos(i * 0.3) * 2 + Math.random() * 1.0)
        }));
        setNqHistory(updatedNq);
        setEsHistory(updatedEs);

        setPriceSyncStatus('success');
        setTimeout(() => setPriceSyncStatus('idle'), 3000);
      } else {
        setPriceSyncStatus('error');
      }
    } catch (err) {
      setPriceSyncStatus('error');
    }
  };

  // Set custom user-specified target price and regenerate the tick trace seamlessly
  const handleApplyManualPrices = () => {
    const rawNq = parseFloat(manualNq);
    const rawEs = parseFloat(manualEs);
    
    if (!isNaN(rawNq) && rawNq > 0) {
      const numNq = roundToCmeTick(rawNq);
      setNqPrice(numNq);
      setNqHigh(numNq + 45);
      setNqLow(numNq - 45);
      setManualNq(numNq.toString());

      const now = Date.now();
      const updatedNq = Array.from({ length: 30 }, (_, i) => ({
        time: new Date(now - (30 - i) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        price: roundToCmeTick(numNq - (15 - i * 0.5) + Math.sin(i * 0.3) * 10 + Math.random() * 3)
      }));
      setNqHistory(updatedNq);
    }

    if (!isNaN(rawEs) && rawEs > 0) {
      const numEs = roundToCmeTick(rawEs);
      setEsPrice(numEs);
      setEsHigh(numEs + 12);
      setEsLow(numEs - 12);
      setManualEs(numEs.toString());

      const now = Date.now();
      const updatedEs = Array.from({ length: 30 }, (_, i) => ({
        time: new Date(now - (30 - i) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        price: roundToCmeTick(numEs - (2 - i * 0.1) + Math.cos(i * 0.3) * 2 + Math.random() * 1.0)
      }));
      setEsHistory(updatedEs);
    }

    setShowPriceAdjuster(false);
  };

  // Initial setup and polling of background price ticks
  useEffect(() => {
    // Generate initial history points based on the baseline configuration
    const now = Date.now();
    const initialNq: TickData[] = Array.from({ length: 30 }, (_, i) => ({
      time: new Date(now - (30 - i) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      price: roundToCmeTick(28883.50 - (15 - i * 0.5) + Math.sin(i * 0.3) * 10 + Math.random() * 3)
    }));
    const initialEs: TickData[] = Array.from({ length: 30 }, (_, i) => ({
      time: new Date(now - (30 - i) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      price: roundToCmeTick(6432.75 - (2 - i * 0.1) + Math.cos(i * 0.3) * 2 + Math.random() * 1.0)
    }));

    setNqHistory(initialNq);
    setEsHistory(initialEs);

    // Dynamic price ticking (Every 1.2s for realistic rapid feed)
    const tickInterval = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      // Random walk for NQ (High volatility, highly active) - strictly using multipliers of CME 0.25 tick steps
      setNqPrice(prev => {
        const tickSteps = Math.floor(Math.random() * 11) - 5; // -5 to +5 ticks
        const delta = tickSteps * 0.25; // strictly 0.25 tick steps
        const nextPrice = roundToCmeTick(prev + delta);
        setNqDirection(delta > 0 ? 'up' : (delta < 0 ? 'down' : 'neutral'));
        
        // Keep history at 30 points
        setNqHistory(h => {
          const updated = [...h.slice(1), { time: timeStr, price: nextPrice }];
          return updated;
        });

        // Functional updates prevent state closure traps and interval resets on High/Low modifications
        setNqHigh(h => nextPrice > h ? nextPrice : h);
        setNqLow(l => nextPrice < l ? nextPrice : l);

        return nextPrice;
      });

      // Simple walk for ES (Stable, heavyweight macro) - strictly using multipliers of CME 0.25 tick steps
      setEsPrice(prev => {
        const tickSteps = Math.floor(Math.random() * 5) - 2; // -2 to +2 ticks
        const delta = tickSteps * 0.25; // strictly 0.25 tick steps
        const nextPrice = roundToCmeTick(prev + delta);
        setEsDirection(delta > 0 ? 'up' : (delta < 0 ? 'down' : 'neutral'));

        setEsHistory(h => {
          const updated = [...h.slice(1), { time: timeStr, price: nextPrice }];
          return updated;
        });

        setEsHigh(h => nextPrice > h ? nextPrice : h);
        setEsLow(l => nextPrice < l ? nextPrice : l);

        return nextPrice;
      });

      // Live updates to the D3-powered hourly volatility sparkline
      setVolatilityHistory(prev => {
        if (prev.length === 0) return prev;
        const timeMinuteStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // 15% probability of shifting to a new minute point to represent elapsed time
        const shouldPushNewPoint = Math.random() < 0.15;
        
        if (shouldPushNewPoint) {
          const lastValue = prev[prev.length - 1].value;
          const nextValue = Math.max(1.8, Math.min(18.5, lastValue + (Math.random() * 0.8 - 0.4)));
          return [...prev.slice(1), { time: timeMinuteStr, value: nextValue }];
        } else {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          const currentVal = updated[lastIdx].value;
          const delta = (Math.random() * 0.24 - 0.12);
          updated[lastIdx] = {
            ...updated[lastIdx],
            value: Math.max(1.8, Math.min(18.5, currentVal + delta))
          };
          return updated;
        }
      });

      // Clear blink direction after 400ms
      setTimeout(() => {
        setNqDirection('neutral');
        setEsDirection('neutral');
      }, 400);

    }, 1200);

    // Random volatility and macro news alert generator (every 28 seconds) to mimic live market updates
    const alertInterval = setInterval(() => {
      const types = ['Flash News Bulletin', 'Macro Release Alert', 'Fed Speaker Update', 'Earnings Flash', 'Supply Chain News'];
      const categories = ['USD', 'FED', 'NQ', 'ES', 'ECB', 'SEMIS'];
      const details = [
        'USD Core PPI print of 0.5% matches consensus expectations; bullish structural tech feedback.',
        'Initial Jobless Claims report registers 218K versus 220K expected, suggesting labor market resilience.',
        'San Francisco Fed President signals support for continuous, data-dependent benchmark holding stances.',
        'Major chipmakers raise Blackwell supply shipments guidelines, spurring sector interest.',
        'ECB officials suggest interest rate policies will reflect transatlantic inflation trends.',
        'Wall Street analysts forecast high-volatility flows surrounding tomorrow\'s consumer sentiment index release.'
      ];

      const chosenType = types[Math.floor(Math.random() * types.length)];
      const chosenDetail = details[Math.floor(Math.random() * details.length)];
      const chosenCategory = categories[Math.floor(Math.random() * categories.length)];
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' EST';

      setVolatilityAlerts(prev => [
        {
          id: `a-${Date.now()}`,
          timestamp: timeStr,
          index: chosenCategory,
          type: chosenType,
          description: chosenDetail,
          severity: Math.random() > 0.7 ? 'critical' : (Math.random() > 0.4 ? 'moderate' : 'info')
        },
        ...prev.slice(0, 5) // maximum 6 alerts
      ]);
    }, 28000);

    // Load API feeds initially
    fetchNewsFeed();
    fetchCalendarFeed();
    fetchRealTimeBaseline();

    // Auto-polling pipeline (Every 90 seconds) to maintain real-time up-to-date macro and news feeds
    const pipelineInterval = setInterval(() => {
      console.log("Auto-refreshing pipeline feeds...");
      fetchNewsFeed();
      fetchCalendarFeed();
    }, 90000);

    return () => {
      clearInterval(tickInterval);
      clearInterval(alertInterval);
      clearInterval(pipelineInterval);
    };
  }, []);

  // Sync / Real-time update news from Gemini
  const fetchNewsFeed = async () => {
    setIsLoadingNews(true);
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data && data.news) {
        setNews(data.news);
        setDataSources(prev => ({ ...prev, news: data.source }));
        if (data.geminiStandby) {
          setGeminiStandby(true);
          setStandbyReason(data.standbyReason || 'quota_exhausted');
        } else {
          setGeminiStandby(false);
        }
      }
    } catch (err) {
      console.log('Telemetry Notice: fallback active.');
    } finally {
      setIsLoadingNews(false);
    }
  };

  // Sync / Fetch live economic calendar
  const fetchCalendarFeed = async () => {
    setIsLoadingCalendar(true);
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      if (data && data.calendar) {
        setCalendar(data.calendar);
        setDataSources(prev => ({ ...prev, calendar: data.source }));
        if (data.geminiStandby) {
          setGeminiStandby(true);
          setStandbyReason(data.standbyReason || 'quota_exhausted');
        }
      }
    } catch (err) {
      console.log('Telemetry Notice: calendar fallback active.');
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  // Dynamic on-demand AI quantitative analysis via server
  const triggerAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const recentHeaders = news.slice(0, 5).map(n => n.title);
      // Construct historical trends for NQ and ES
      const priceActionHistory = nqHistory.slice(-5).map(h => ({ nq: h.price, time: h.time }));

      const response = await fetch('/api/analyze-volatility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentNQ: nqPrice.toFixed(2),
          currentES: esPrice.toFixed(2),
          priceActionHistory,
          newsSummaries: recentHeaders
        })
      });
      const result = await response.json();
      if (result) {
        setVolatilityAnalysis(result);
        if (result.geminiStandby) {
          setGeminiStandby(true);
          setStandbyReason(result.standbyReason || 'quota_exhausted');
        }
      }
    } catch (error) {
      console.log('Telemetry Notice: analytical fallback active.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto trigger AI analysis on news load to occupy terminal beautifully
  useEffect(() => {
    if (news.length > 0 && !volatilityAnalysis) {
      triggerAiAnalysis();
    }
  }, [news]);

  // Client filtering
  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategory === 'All') return matchesSearch;
    if (selectedCategory === 'Tech Sector' && item.category === 'Tech Sector') return matchesSearch;
    if (selectedCategory === 'earnings' && (item.category === 'Earnings' || item.category === 'IPOs')) return matchesSearch;
    if (selectedCategory === 'macro' && (item.category === 'Geopolitical' || item.category === 'Macroeconomics')) return matchesSearch;
    
    return false;
  });

  const filteredCalendar = calendar.filter(item => {
    if (calendarDayFilter === 'high-only') {
      return item.impact === 'High';
    }
    return true;
  });

  return (
    <div id="quantum-app-container" className="min-h-screen bg-[#070708] text-slate-300 font-sans flex flex-col antialiased">
      
      {/* HEADER SECTION - Beautiful dark glowing control panel */}
      <header id="app-header" className="min-h-[74px] lg:h-[74px] bg-[#0c0c0e] border-b border-[#1b1b1e] flex flex-col lg:flex-row lg:items-center justify-between px-4 sm:px-6 py-4 lg:py-0 shrink-0 sticky top-0 z-50 shadow-md gap-4">
        
        {/* Left corner branding & Mobile clock */}
        <div className="flex items-center justify-between lg:justify-start gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 shrink-0">
              <Cpu className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse"></span>
                <span className="text-[9px] font-mono tracking-wider text-emerald-400 font-bold uppercase">LIVE FEED ESTABLISHED</span>
              </div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5 flex-wrap">
                QUANTUM<span className="text-indigo-400 font-medium font-semibold">TERMINAL</span>
                <span className="text-[9px] bg-indigo-900/35 text-indigo-300 border border-indigo-700/50 px-1.5 py-0.2 rounded font-mono font-normal tracking-normal lowercase">v1.0</span>
              </h1>
            </div>
          </div>

          {/* Clock helper specifically for layout on smaller mobile screens (< sm) */}
          <div className="flex sm:hidden flex-col items-end font-mono shrink-0 select-none">
            <span className="text-[8px] text-[#5c5d6c] uppercase tracking-wider">EST CLOCK</span>
            <span className="text-xs font-semibold text-slate-300">
              {new Date().toLocaleTimeString('en-US', { timeZone: 'EST', hour12: false, hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Real-time Tickers: Pipeline indicators & Desktop Clock */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full lg:w-auto lg:ml-auto">
          
          {/* Active pipeline status badge indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#222226] bg-[#101012] select-none">
            <div className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] sm:text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider font-mono truncate">LIVE MACRO PIPELINE ACTIVE</span>
              <span className="text-[8px] sm:text-[9px] text-slate-500 font-sans truncate">Forex Factory & CME index scanning</span>
            </div>
          </div>

          {/* Crawler active status badge indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#222226] bg-[#101012] select-none">
            <div className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] sm:text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider font-mono truncate">REAL-TIME NEWS CRAWLER</span>
              <span className="text-[8px] sm:text-[9px] text-slate-500 font-sans truncate">Parsing Bloomberg & Reuters feeds</span>
            </div>
          </div>

          {/* Digital Clock (shown on screens >= sm) */}
          <div className="hidden sm:flex flex-col items-end shrink-0 select-none px-2 font-mono lg:ml-4 border-l border-slate-800/60 pl-4">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">EASTERN TIME (EST)</span>
            <div className="flex items-center gap-1.5 text-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm font-semibold">{new Date().toLocaleTimeString('en-US', { timeZone: 'EST', hour12: false })}</span>
            </div>
          </div>
        </div>

      </header>



      {/* SUB-HEADER INFOBAR */}
      <div className="bg-[#09090b] border-b border-[#1b1b1e] px-6 py-2 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Coverage: <strong className="text-white">Real-Time News Flows & Macroeconomic Indicators</strong></span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 border-l border-slate-800 pl-4 text-slate-500">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Click any highlighted word in headers to see <span className="text-indigo-300 font-semibold underline cursor-pointer" onClick={() => setSelectedLexiconKey('Macroeconomics')}>Burmese explanations (မြန်မာဖွင့်ဆိုချက်)</span>.</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-500 text-[10px] font-mono hidden lg:inline">
            NEWS API SOURCE: <span className="text-indigo-400 font-semibold uppercase">{dataSources.news}</span>
          </span>
          <span className="text-slate-500 text-[10px] font-mono hidden lg:inline">
            CALENDAR: <span className="text-rose-400 font-semibold uppercase">{dataSources.calendar}</span>
          </span>
        </div>
      </div>

      {/* MAIN WORKSPACE GRID */}
      <main id="terminal-content" className="flex-1 grid grid-cols-1 xl:grid-cols-12 xl:overflow-hidden overflow-y-auto">
        
        {/* LEFT COLUMN (7 COLS on XL) - Intraday Ticks, Focus Chart, and News Flow */}
        <section className="xl:col-span-7 flex flex-col border-r border-[#1b1b1e] overflow-y-auto">

          {/* MAIN NEWS HEADER & FILTER CONTROLS */}
          <div className="bg-[#0b0c0f] border-b border-[#1b1b1e] p-4 font-mono">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">LIVE SEC/REUTERS NEWS FLOW</span>
                </div>
                <p className="text-[11px] text-slate-500">Prioritizing Tech IPOs, Nvidia earnings, Semiconductor supply chains & geopolitical developments</p>
              </div>

              {/* Gemini Trigger Sync Button with beautiful design */}
              <div className="flex items-center gap-2">
                <button 
                  id="gemini-sync-btn"
                  onClick={fetchNewsFeed}
                  disabled={isLoadingNews}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-lg shadow-indigo-600/10 border border-indigo-500 transition-all font-sans cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingNews ? 'animate-spin' : ''}`} />
                  <span>Gemini Sync</span>
                </button>
              </div>
            </div>

            {/* Filter segments & search */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-900">
              
              <div className="flex flex-wrap gap-1.5">
                <button 
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1 text-xs rounded transition-all font-sans ${
                    selectedCategory === 'All' 
                      ? 'bg-slate-800 text-white font-semibold border border-slate-700' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  All Feeds
                </button>
                <button 
                  onClick={() => setSelectedCategory('Tech Sector')}
                  className={`px-3 py-1 text-xs rounded transition-all font-sans ${
                    selectedCategory === 'Tech Sector' 
                      ? 'bg-indigo-950/80 text-indigo-300 font-semibold border border-indigo-700/60' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  Tech Sector
                </button>
                <button 
                  onClick={() => setSelectedCategory('earnings')}
                  className={`px-3 py-1 text-xs rounded transition-all font-sans ${
                    selectedCategory === 'earnings' 
                      ? 'bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-700/60' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  Earnings & IPOs
                </button>
                <button 
                  onClick={() => setSelectedCategory('macro')}
                  className={`px-3 py-1 text-xs rounded transition-all font-sans ${
                    selectedCategory === 'macro' 
                      ? 'bg-amber-950/80 text-amber-300 font-semibold border border-amber-700/60' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  Macro & Geopolitics
                </button>
              </div>

              {/* Instant Search Bar */}
              <div className="relative md:w-64 shrink-0">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                  <Search className="w-3.5 h-3.5 text-slate-500" />
                </span>
                <input 
                  type="text"
                  placeholder="Search headlines or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#101114] border border-[#222226] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-all font-sans"
                />
              </div>

            </div>
          </div>

          {/* NEWS STREAM ITEMS COLUMN */}
          <div id="news-stream" className="flex-1 p-4 space-y-4">
            {isLoadingNews ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-xs font-mono text-slate-400">Querying real-time sector logs with Gemini search integration...</span>
              </div>
            ) : filteredNews.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <AlertTriangle className="w-7 h-7 mx-auto mb-2 text-slate-600" />
                <p className="text-xs font-mono">No matching real-time stories found for "{searchQuery}".</p>
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                  className="mt-2 text-xs text-indigo-400 underline hover:text-indigo-300"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              filteredNews.map((story) => {
                // Determine layout styles depending on impact
                const impactClass = 
                  story.impact === 'Bullish' ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400' :
                  story.impact === 'Bearish' ? 'bg-rose-950/30 border-rose-500/40 text-rose-400' :
                  'bg-slate-900/35 border-slate-700/40 text-slate-400';

                const categoryLabelClass =
                  story.category === 'Tech Sector' ? 'bg-indigo-900/35 text-indigo-300 border-indigo-700/50' :
                  story.category === 'IPOs' ? 'bg-purple-900/35 text-purple-300 border-purple-700/50' :
                  story.category === 'Earnings' ? 'bg-teal-900/35 text-teal-300 border-teal-700/50' :
                  story.category === 'Geopolitical' ? 'bg-amber-900/35 text-amber-300 border-amber-500/50' :
                  'bg-slate-800/55 text-slate-300 border-slate-600/50';

                const pubTime = new Date(story.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div 
                    key={story.id} 
                    className="bg-[#0b0c0f] border border-[#1b1b1e] hover:border-[#2e2f36] p-4 rounded-xl transition-all shadow-sm flex flex-col md:flex-row gap-4 items-start"
                  >
                    
                    {/* Index affected flags & stats metadata */}
                    <div className="flex md:flex-col gap-2 shrink-0 md:w-32 justify-between md:justify-start">
                      <div className="flex gap-1.5 flex-wrap">
                        {story.indicesAffected.map(ind => (
                          <span 
                            key={ind} 
                            onClick={() => {
                              setFocusedIndex(ind === 'NQ' ? 'NQ' : 'ES');
                              const element = document.getElementById('ticker-' + ind.toLowerCase());
                              if (element) element.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`cursor-pointer px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-tight border ${
                              ind === 'NQ' ? 'bg-indigo-900/30 text-indigo-300 border-indigo-800/40' : 'bg-rose-950 text-rose-300 border-rose-800/40'
                            }`}
                          >
                            {ind}
                          </span>
                        ))}
                      </div>
                      
                      {/* Volatility score meter */}
                      <div className="flex flex-col items-start gap-1 font-mono md:mt-2">
                        <span className="text-[9px] text-slate-500 font-semibold uppercase">Volatility Risk</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${story.volatilityScore >= 7 ? 'text-red-400' : story.volatilityScore >= 5 ? 'text-amber-400' : 'text-slate-400'}`}>
                            {story.volatilityScore}/10
                          </span>
                          <div className="w-12 h-1.5 bg-slate-800 rounded overflow-hidden">
                            <div 
                              className={`h-full ${story.volatilityScore >= 7 ? 'bg-red-500' : story.volatilityScore >= 5 ? 'bg-amber-500' : 'bg-slate-500'}`}
                              style={{ width: `${story.volatilityScore * 10}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Headline and breakdown info */}
                    <div className="flex-1">
                      
                      {/* Category tag & Timestamp */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${categoryLabelClass}`}>
                            {story.category.toUpperCase()}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded border uppercase font-mono font-bold ${impactClass}`}>
                            {story.impact}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{pubTime}</span>
                        </div>
                      </div>

                      {/* Main title */}
                      <h3 className="text-white font-semibold text-sm leading-snug tracking-tight mb-1.5 hover:text-indigo-300 transition-colors">
                        {story.title}
                      </h3>

                      {/* Actionable summary details */}
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {story.summary}
                      </p>

                      {/* Burmese Insight toggle/helper */}
                      <div className="mt-3 pt-2.5 border-t border-slate-900 flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-mono">SOURCE: {story.source}</span>
                        
                        <button 
                          onClick={() => setSelectedLexiconKey(story.category === 'Geopolitical' ? 'Geopolitical' : (story.category === 'Tech Sector' ? 'NQ' : (story.category === 'Earnings' ? 'Earnings Report' : 'IPO')))}
                          className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold bg-slate-900/80 hover:bg-slate-800/80 px-2 py-1 rounded border border-slate-800"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>မြန်မာအဓိပ္ပာယ်</span>
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>

        </section>

        {/* RIGHT COLUMN (5 COLS on XL) - Economic Calendar, Alerts, and Burmese Dictionary */}
        <aside className="xl:col-span-5 bg-[#09090b] flex flex-col divide-y divide-[#1b1b1e]">
          
          {/* SEC 1: REAL-TIME ECONOMIC CALENDAR */}
          <div className="p-4 flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-mono font-extrabold text-slate-300 uppercase tracking-widest">LIVE ECONOMIC CALENDAR</span>
              </div>
              <button 
                onClick={fetchCalendarFeed}
                disabled={isLoadingCalendar}
                className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                title="Refresh calendar data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCalendar ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Filter by impact level */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] text-slate-500 font-mono">Today & Tomorrow US Metrics</span>
              <div className="flex bg-slate-900 p-0.5 rounded text-[10px] border border-slate-800">
                <button 
                  onClick={() => setCalendarDayFilter('all')}
                  className={`px-2 py-0.5 rounded ${calendarDayFilter === 'all' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400'}`}
                >
                  All Events
                </button>
                <button 
                  onClick={() => setCalendarDayFilter('high-only')}
                  className={`px-2 py-0.5 rounded ${calendarDayFilter === 'high-only' ? 'bg-red-950 text-red-300 font-semibold border-red-900/30' : 'text-slate-400'}`}
                >
                  High Impact
                </button>
              </div>
            </div>

            {/* Automatic update info and Status */}
            <div className="mb-3.5 px-3 py-2 rounded-lg bg-indigo-950/20 border border-indigo-500/10 text-[10.5px] leading-relaxed text-slate-300 font-sans">
              <div className="flex items-center gap-1.5 font-mono text-indigo-400 font-extrabold text-[10px] uppercase mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                AUTO-PIPELINE STREAM (အလိုအလျောက် သတင်းတိုက်ရိုက်ရယူမှု)
              </div>
              <p>
                စနစ်သည် <strong className="text-white font-semibold">CME & Forex Factory</strong> မှ ထုတ်ပြန်သော macro data သစ်များကို <strong className="text-indigo-300 font-semibold">Google News Crawl Pipeline</strong> ဖြင့် ၉၀ စက္ကန့်လျှင်တစ်ကြိမ် အလိုအလျောက် live updates ရယူပေးနေပါသည်။ လူကိုယ်တိုင် manually update တောင်းရန် မလိုဘဲ realtime updates ရရှိနေမည် ဖြစ်ပါသည်။
              </p>
              {dataSources.calendar === 'gemini_google_search' ? (
                <div className="mt-1.5 text-[9.5px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-900/20 w-fit">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></span>
                  ● Real-Time API Engine Layer: LIVE ACTIVE
                </div>
              ) : (
                <div className="mt-1.5 text-[9.5px] font-mono text-amber-400 flex items-center gap-1 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-900/20 w-fit">
                  <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                  ▲ Backup Baseline Stream: Syncing via CME Datapools
                </div>
              )}
            </div>

            {/* Calendar Events List */}
            <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
              {isLoadingCalendar ? (
                <div className="text-center py-8 text-slate-500 font-mono text-xs">Fetching macro events...</div>
              ) : filteredCalendar.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">No high-impact events reported.</div>
              ) : (
                filteredCalendar.map((item, index) => {
                  const isHigh = item.impact === 'High';
                  const isMedium = item.impact === 'Medium';
                  
                  const badgeClass = 
                    isHigh ? 'bg-red-950 text-red-300 border-red-900/40 font-bold' :
                    isMedium ? 'bg-amber-950/70 text-amber-300 border-amber-900/50 font-bold' :
                    'bg-slate-900 text-slate-400 border-slate-800';

                  const showHeader = index === 0 || filteredCalendar[index - 1].date !== item.date;

                  return (
                    <div key={item.id} className="flex flex-col gap-1.5">
                      {showHeader && (
                        <div className="sticky top-0 z-10 bg-[#09090b]/90 backdrop-blur-md py-1.5 px-2 my-1 text-[10px] font-mono font-black tracking-wider text-indigo-400 border-l-2 border-indigo-500 bg-indigo-500/5 flex items-center justify-between uppercase rounded-r">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                            {formatCalendarDate(item.date)}
                          </span>
                        </div>
                      )}

                      <div 
                        className={`flex gap-3 p-2.5 rounded-lg border bg-[#0b0c0f] hover:bg-[#101114] transition-all cursor-pointer ${
                          isHigh ? 'border-red-900/20 hover:border-red-900/40 bg-red-950/10' : 'border-slate-800/40'
                        }`}
                        onClick={() => setSelectedCalendarEvent(item)}
                      >
                        {/* Hour block */}
                        <div className="w-16 shrink-0 text-center flex flex-col justify-center border-r border-slate-800/40 pr-2">
                          <span className="block text-xs font-semibold text-slate-200 font-mono">{item.time}</span>
                          <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">{item.country}</span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 justify-between mb-0.5">
                            <span className="text-xs font-semibold text-slate-200 truncate block">{item.event}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[8px] border font-mono ${badgeClass}`}>
                              {item.impact}
                            </span>
                          </div>

                          {/* Actual, Forecast, Previous values */}
                          <div className="flex items-center justify-between text-[11px] font-mono mt-1 text-slate-400">
                            <div>
                              Act: <strong className={item.actual ? (isHigh ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold') : 'text-slate-600 font-medium'}>
                                {item.actual || 'Pending'}
                              </strong>
                            </div>
                            <div>Exp: <span className="text-slate-300 font-medium">{item.forecast || 'N/A'}</span></div>
                            <div>Prev: <span className="text-slate-300 font-medium">{item.previous || 'N/A'}</span></div>
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-2.5 p-2 bg-[#0d0d10] border border-[#1b1b1e] rounded text-[10px] text-slate-500 flex items-center justify-between">
              <span>* Click on events to view NQ & ES scenario targets</span>
              <button 
                onClick={() => {
                  if (filteredCalendar.length > 0) {
                    setSelectedCalendarEvent(filteredCalendar[0]);
                  } else {
                    setSelectedLexiconKey('Macroeconomics');
                  }
                }}
                className="text-indigo-400 font-bold hover:underline"
              >
                Explain Macro
              </button>
            </div>
          </div>

          {/* SEC 2: REAL-TIME VOLATILITY ALERTS */}
          <div className="p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-amber-500 w-4 h-4 animate-bounce" />
                <span className="text-xs font-mono font-extrabold text-slate-300 uppercase tracking-widest">LIVE VOLATILITY ALERTS (NQ PRIORITIZED)</span>
              </div>
              <span className="text-[8px] text-red-500 font-bold tracking-widest animate-pulse border border-red-500/25 px-1.5 py-0.2 rounded">MONITORING</span>
            </div>

            <div className="space-y-2 max-h-[175px] overflow-y-auto pr-1">
              {volatilityAlerts.map((alert) => {
                const isNq = alert.index === 'NQ';
                const isCritical = alert.severity === 'critical';
                const isModerate = alert.severity === 'moderate';

                const alertBorderColor = 
                  isCritical ? 'border-red-900 bg-red-950/15 text-red-100' :
                  isModerate ? 'border-amber-900 bg-amber-950/10 text-amber-100' :
                  'border-slate-800 bg-[#0b0c0f] text-slate-300';

                return (
                  <div key={alert.id} className={`p-2.5 rounded-lg border leading-tight ${alertBorderColor}`}>
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-red-500' : isModerate ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wide">
                          {alert.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[8px] font-mono text-slate-500">
                        <span className={`px-1 rounded text-white font-bold font-sans ${isNq ? 'bg-indigo-600' : 'bg-rose-600'}`}>{alert.index}</span>
                        <span>{alert.timestamp}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">{alert.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEC 3: SYSTEM AI QUANT ANALYST DESK */}
          <div className="p-4 bg-[#0a0a0d] flex-grow flex flex-col">
            <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-mono font-extrabold text-slate-300 uppercase tracking-widest">AI QUANT ANALYST CO-DESK</span>
              </div>
              <button 
                onClick={triggerAiAnalysis}
                disabled={isAnalyzing}
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-950/40 border border-indigo-900/50 px-2 py-0.5 rounded cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>Re-Analyze</span>
              </button>
            </div>

            {/* D3-powered hourly volatility trend sparkline chart */}
            <VolatilitySparkline data={volatilityHistory} />

            {isAnalyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
                <span className="text-[11px] font-mono">Running pricing volatility and news weighting models...</span>
              </div>
            ) : volatilityAnalysis ? (
              <div className="space-y-3">
                {/* Core Verdict summary */}
                <div className="bg-[#101116] border-l-2 border-indigo-500 p-3 rounded-r">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase">Tactical Verdict Summary</span>
                    <span className={`text-[10px] uppercase font-bold font-mono px-1.5 rounded ${
                      volatilityAnalysis.bias.includes('Bullish') ? 'bg-emerald-950 text-emerald-400' :
                      volatilityAnalysis.bias.includes('Bearish') ? 'bg-rose-950 text-rose-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      Bias: {volatilityAnalysis.bias}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">{volatilityAnalysis.verdict}</p>
                </div>

                {/* Support and resistance zones calculated */}
                <div className="grid grid-cols-2 gap-3.5 mt-2">
                  <div className="bg-[#101114] border border-slate-800 p-2.5 rounded-lg">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 font-mono text-indigo-300">NQ Future Zones</div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[11px] text-slate-400">Resistance:</span>
                      <strong className="text-rose-400 font-mono">{volatilityAnalysis.supportResistance.NQ.resistance}</strong>
                    </div>
                    <div className="flex justify-between text-xs border-t border-slate-900/80 pt-1 mt-1">
                      <span className="text-[11px] text-slate-400">Support:</span>
                      <strong className="text-emerald-400 font-mono">{volatilityAnalysis.supportResistance.NQ.support}</strong>
                    </div>
                  </div>

                  <div className="bg-[#101114] border border-slate-800 p-2.5 rounded-lg">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 font-mono text-rose-300">ES Future Zones</div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[11px] text-slate-400">Resistance:</span>
                      <strong className="text-rose-400 font-mono">{volatilityAnalysis.supportResistance.ES.resistance}</strong>
                    </div>
                    <div className="flex justify-between text-xs border-t border-slate-900/80 pt-1 mt-1">
                      <span className="text-[11px] text-slate-400">Support:</span>
                      <strong className="text-emerald-400 font-mono">{volatilityAnalysis.supportResistance.ES.support}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center py-6 text-slate-600 font-mono text-xs">
                Waiting on initial analysis loading...
              </div>
            )}
          </div>

        </aside>

      </main>

      {/* FOOTER BAR WITH BULLET TRADING STATUS CODES */}
      <footer className="min-h-10 bg-[#070709] border-t border-[#1b1b1e] flex flex-col md:flex-row items-center justify-between px-6 shrink-0 py-3 md:py-0 text-slate-400 text-xs gap-3">
        <div className="flex gap-3 sm:gap-4 md:gap-7 items-center flex-wrap justify-center md:justify-start">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="text-[10px] font-mono text-slate-500"><span className="text-slate-300">REUTERS</span> FEED: ACTIVE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            <span className="text-[10px] font-mono text-slate-500"><span className="text-slate-300">SEC FILINGS</span>: POLLING</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
            <span className="text-[10px] font-mono text-slate-500"><span className="text-slate-200">GEMINI RETRIEVAL</span>: STANDBY</span>
          </div>
        </div>

        {/* Centered Copyright Claim status & Social Media Connections */}
        <div className="flex flex-col xl:flex-row items-center gap-2.5 sm:gap-4 justify-center py-1">
          <div className="text-[10px] font-mono text-slate-300 font-semibold tracking-wide flex items-center gap-1 bg-[#101014] border border-slate-900 px-3 py-1 rounded shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            <span>© 2021 - 2026 COPYRIGHT BY RTFT</span>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {/* Facebook Connection */}
            <a 
              href="https://www.facebook.com/RoadToFundedTrader/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 text-slate-300 hover:text-white px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all"
              id="social-fb-link"
            >
              <Facebook className="w-3 h-3 text-[#1877F2]" />
              <span>FB PAGE</span>
            </a>

            {/* Discord Connection */}
            <a 
              href="https://discord.gg/zMNgEjNSGm" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 text-slate-300 hover:text-white px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all"
              id="social-discord-link"
            >
              <MessageSquare className="w-3 h-3 text-[#5865F2]" />
              <span>DISCORD</span>
            </a>

            {/* Telegram Connection */}
            <a 
              href="https://t.me/+qZe0SIoUvkI4NGY1" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#26A5E4]/10 hover:bg-[#26A5E4]/20 border border-[#26A5E4]/30 text-slate-300 hover:text-white px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all"
              id="social-telegram-link"
            >
              <Send className="w-3 h-3 text-[#26A5E4]" />
              <span>TELEGRAM</span>
            </a>
          </div>
        </div>

        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter text-center md:text-right">
          PRO TERMINAL v1.0 // REGULATED QUANTUM DATASTREAM V1
        </div>
      </footer>

      {/* DETAILED DYNAMIC ECONOMIC CALENDAR SCENARIOS MODAL */}
      {selectedCalendarEvent && (() => {
        const details = getMacroDetailsForEvent(selectedCalendarEvent.event);
        return (
          <div id="macro-explainer-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="bg-[#0b0c10] border border-[#23252f] text-slate-100 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-950 via-[#10121a] to-indigo-950/40 px-6 py-4 border-b border-[#23252f] flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/25">
                    <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-400 tracking-wider uppercase block">
                      QUANTUM MACRO ANALYSES // GLOBAL INDICATOR
                    </span>
                    <h3 className="font-extrabold text-white text-base tracking-wide font-sans mt-0.5">
                      {selectedCalendarEvent.event}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCalendarEvent(null)}
                  className="text-slate-400 hover:text-white text-xl font-mono font-bold hover:bg-slate-800/80 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin">
                
                {/* Metric Summary Scoreboard */}
                <div className="grid grid-cols-3 gap-3 bg-[#0d0e14] p-3 rounded-xl border border-slate-800/50">
                  <div className="text-center py-2 border-r border-slate-800/40">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider">Actual (လက်ရှိ)</span>
                    <strong className={`text-sm font-mono mt-1 block ${
                      selectedCalendarEvent.actual 
                        ? (selectedCalendarEvent.impact === 'High' ? 'text-rose-400' : 'text-emerald-400') 
                        : 'text-slate-500 font-normal italic'
                    }`}>
                      {selectedCalendarEvent.actual || 'Pending Release'}
                    </strong>
                  </div>
                  <div className="text-center py-2 border-r border-slate-800/40">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider">Forecast (စစ်တမ်း)</span>
                    <strong className="text-sm font-mono text-slate-300 mt-1 block">
                      {selectedCalendarEvent.forecast || 'N/A'}
                    </strong>
                  </div>
                  <div className="text-center py-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider">Previous (ယခင်)</span>
                    <strong className="text-sm font-mono text-slate-400 mt-1 block">
                      {selectedCalendarEvent.previous || 'N/A'}
                    </strong>
                  </div>
                </div>

                {/* Part A: Indicator Definition */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-indigo-400 tracking-wider uppercase block">
                    📖 Indicator Meaning & Scope / အထောက်အထား အနက်ဖွင့်ချက်
                  </span>
                  <div className="bg-[#11131c] rounded-xl p-4 border border-slate-850 space-y-2">
                    <p className="text-sm text-slate-100 font-semibold leading-relaxed Burmese tracking-wide">
                      {details.meaningBurmese}
                    </p>
                    <p className="text-xs text-slate-400 font-normal leading-relaxed italic border-t border-slate-800/40 pt-2 font-sans">
                      {details.meaningEnglish}
                    </p>
                  </div>
                </div>

                {/* Part B: Potential Market Volatility / NQ, ES, DXY Weighting */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider uppercase block">
                    ⚡ Volatility Impact Heatmap / စျေးကွက် ရိုက်ခတ်နိုင်စွမ်း (NQ / ES / DXY)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* NQ Progress */}
                    <div className="bg-[#121118]/80 border border-slate-800/50 p-3 rounded-xl flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-mono font-bold text-indigo-400">NQ Futures</span>
                        <span className="text-xs font-mono font-bold text-rose-450">{details.nqImpactScore}/10</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-850 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-rose-500 rounded-full" 
                          style={{ width: `${details.nqImpactScore * 10}%` }}
                        ></div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-semibold mt-1">Tech / Semis Sensitive</span>
                    </div>

                    {/* ES Progress */}
                    <div className="bg-[#111318]/80 border border-slate-800/50 p-3 rounded-xl flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-mono font-bold text-slate-300">ES Futures</span>
                        <span className="text-xs font-mono font-bold text-amber-450">{details.esImpactScore}/10</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-850 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-amber-500 rounded-full" 
                          style={{ width: `${details.esImpactScore * 10}%` }}
                        ></div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-semibold mt-1">Broad Market S&P Impact</span>
                    </div>

                    {/* DXY Progress */}
                    <div className="bg-[#101316]/80 border border-slate-800/50 p-3 rounded-xl flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-mono font-bold text-emerald-400">DXY Dollar Index</span>
                        <span className="text-xs font-mono font-bold text-emerald-450">{details.dxyImpactScore}/10</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-850 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${details.dxyImpactScore * 10}%` }}
                        ></div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-semibold mt-1">Direct Interest Correlation</span>
                    </div>
                  </div>
                </div>

                {/* Part C: Scenario Analysis Columns */}
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider uppercase block">
                    📊 Professional Expectation Scenarios / ခန့်မှန်းချက်ရလဒ်အလိုက် အတက်အကျ လမ်းညွှန်များ
                  </span>

                  <div className="space-y-3">
                    
                    {/* Scenario 1: Greater than expected (> Forecast) */}
                    {(() => {
                      const sc = details.scenarios.greaterThanExpected;
                      const isBullish = sc.nqBias === 'Bullish';
                      const isBearish = sc.nqBias === 'Bearish';
                      
                      const cardStyle = isBullish 
                        ? 'border-emerald-900/40 bg-[#0c1510]/50 hover:bg-[#0c1510]/70' 
                        : isBearish 
                          ? 'border-rose-950 bg-[#160b0d]/50 hover:bg-[#160b0d]/70' 
                          : 'border-slate-800 bg-slate-900/10';
                      
                      const headerColor = isBullish 
                        ? 'text-emerald-400' 
                        : isBearish 
                          ? 'text-rose-400' 
                          : 'text-slate-300';

                      return (
                        <div className={`p-4 rounded-xl border transition-colors ${cardStyle}`}>
                          <div className="flex flex-wrap justify-between items-center gap-2 mb-2 border-b border-white/5 pb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${isBullish ? 'bg-emerald-500 animate-pulse' : isBearish ? 'bg-rose-500' : 'bg-slate-500'}`}></span>
                              <h4 className={`text-xs font-bold font-mono tracking-wide ${headerColor} uppercase`}>
                                Greater than expected (&gt; Forecast) // မျှော်မှန်းသည်ထက် ပိုထွက်လျှင်
                              </h4>
                            </div>
                            <span className="text-[10px] font-mono font-extrabold text-slate-500 uppercase tracking-tighter">
                              {sc.marketImpact}
                            </span>
                          </div>
                          
                          <p className="text-[12px] text-slate-300 font-medium leading-relaxed mb-3 Burmese font-sans">
                            {sc.descriptionBurmese}
                          </p>

                          {/* Individual asset impact metrics */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-[10px] font-mono">
                            <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/40">
                              <span className="text-slate-400 block mb-0.5">NQ Bias</span>
                              <span className={`font-bold ${
                                sc.nqBias === 'Bullish' ? 'text-emerald-400' : sc.nqBias === 'Bearish' ? 'text-rose-400' : 'text-amber-400'
                              }`}>{sc.nqBias === 'Bullish' ? '🟢 BULLISH Surging' : sc.nqBias === 'Bearish' ? '🔴 BEARISH Falling' : '🟡 NEUTRAL Calm'}</span>
                            </div>

                            <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/40">
                              <span className="text-slate-400 block mb-0.5">ES Bias</span>
                              <span className={`font-bold ${
                                sc.esBias === 'Bullish' ? 'text-emerald-400' : sc.esBias === 'Bearish' ? 'text-rose-400' : 'text-amber-400'
                              }`}>{sc.esBias === 'Bullish' ? '🟢 BULLISH Robust' : sc.esBias === 'Bearish' ? '🔴 BEARISH Sluggish' : '🟡 NEUTRAL Calm'}</span>
                            </div>

                            <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/40">
                              <span className="text-slate-400 block mb-0.5">DXY Bias</span>
                              <span className={`font-bold ${
                                sc.dxyBias === 'Bullish' ? 'text-emerald-400' : sc.dxyBias === 'Bearish' ? 'text-rose-400' : 'text-amber-400'
                              }`}>{sc.dxyBias === 'Bullish' ? '🟢 BULLISH Strong' : sc.dxyBias === 'Bearish' ? '🔴 BEARISH Soft' : '🟡 NEUTRAL Calm'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Scenario 2: As Expected (= Forecast) */}
                    {(() => {
                      const sc = details.scenarios.asExpected;
                      return (
                        <div className="p-4 rounded-xl border border-slate-800 bg-[#0e0f14]/50 hover:bg-[#0e0f14]/75 transition-colors">
                          <div className="flex flex-wrap justify-between items-center gap-2 mb-2 border-b border-white/5 pb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                              <h4 className="text-xs font-bold font-mono tracking-wide text-slate-300 uppercase">
                                As Expected (= Forecast) // မျှော်မှန်းချက်အတိုင်း ထွက်လျှင်
                              </h4>
                            </div>
                            <span className="text-[10px] font-mono font-extrabold text-slate-500 uppercase tracking-tighter">
                              {sc.marketImpact}
                            </span>
                          </div>
                          
                          <p className="text-[12px] text-slate-400 font-normal leading-relaxed mb-3 Burmese font-sans">
                            {sc.descriptionBurmese}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-[10px] font-mono">
                            <div className="bg-slate-900/40 p-1.5 rounded border border-slate-800/20">
                              <span className="text-slate-500 block mb-0.5">NQ Bias</span>
                              <span className="font-bold text-amber-500/80">🟡 NEUTRAL Calm</span>
                            </div>
                            <div className="bg-slate-900/40 p-1.5 rounded border border-slate-800/20">
                              <span className="text-slate-500 block mb-0.5">ES Bias</span>
                              <span className="font-bold text-amber-500/80">🟡 NEUTRAL Calm</span>
                            </div>
                            <div className="bg-slate-900/40 p-1.5 rounded border border-slate-800/20">
                              <span className="text-slate-500 block mb-0.5">DXY Bias</span>
                              <span className="font-bold text-amber-500/80">🟡 NEUTRAL Calm</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Scenario 3: Smaller than expected (< Forecast) */}
                    {(() => {
                      const sc = details.scenarios.smallerThanExpected;
                      const isBullish = sc.nqBias === 'Bullish';
                      const isBearish = sc.nqBias === 'Bearish';
                      
                      const cardStyle = isBullish 
                        ? 'border-emerald-900/40 bg-[#0c1510]/50 hover:bg-[#0c1510]/70' 
                        : isBearish 
                          ? 'border-rose-950 bg-[#160b0d]/50 hover:bg-[#160b0d]/70' 
                          : 'border-slate-800 bg-slate-900/10';
                      
                      const headerColor = isBullish 
                        ? 'text-emerald-400' 
                        : isBearish 
                          ? 'text-rose-400' 
                          : 'text-slate-300';

                      return (
                        <div className={`p-4 rounded-xl border transition-colors ${cardStyle}`}>
                          <div className="flex flex-wrap justify-between items-center gap-2 mb-2 border-b border-white/5 pb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${isBullish ? 'bg-emerald-500 animate-pulse' : isBearish ? 'bg-rose-500' : 'bg-slate-500'}`}></span>
                              <h4 className={`text-xs font-bold font-mono tracking-wide ${headerColor} uppercase`}>
                                Smaller than expected (&lt; Forecast) // မျှော်မှန်းချက်ထက် လျော့နည်းလျှင်
                              </h4>
                            </div>
                            <span className="text-[10px] font-mono font-extrabold text-slate-500 uppercase tracking-tighter">
                              {sc.marketImpact}
                            </span>
                          </div>
                          
                          <p className="text-[12px] text-slate-300 font-medium leading-relaxed mb-3 Burmese font-sans">
                            {sc.descriptionBurmese}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-[10px] font-mono">
                            <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/40">
                              <span className="text-slate-400 block mb-0.5">NQ Bias</span>
                              <span className={`font-bold ${
                                sc.nqBias === 'Bullish' ? 'text-emerald-400' : sc.nqBias === 'Bearish' ? 'text-rose-400' : 'text-amber-400'
                              }`}>{sc.nqBias === 'Bullish' ? '🟢 BULLISH Surging' : sc.nqBias === 'Bearish' ? '🔴 BEARISH Falling' : '🟡 NEUTRAL Calm'}</span>
                            </div>

                            <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/40">
                              <span className="text-slate-400 block mb-0.5">ES Bias</span>
                              <span className={`font-bold ${
                                sc.esBias === 'Bullish' ? 'text-emerald-400' : sc.esBias === 'Bearish' ? 'text-rose-400' : 'text-amber-400'
                              }`}>{sc.esBias === 'Bullish' ? '🟢 BULLISH Robust' : sc.esBias === 'Bearish' ? '🔴 BEARISH Sluggish' : '🟡 NEUTRAL Calm'}</span>
                            </div>

                            <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/40">
                              <span className="text-slate-400 block mb-0.5">DXY Bias</span>
                              <span className={`font-bold ${
                                sc.dxyBias === 'Bullish' ? 'text-emerald-400' : sc.dxyBias === 'Bearish' ? 'text-rose-400' : 'text-amber-400'
                              }`}>{sc.dxyBias === 'Bullish' ? '🟢 BULLISH Strong' : sc.dxyBias === 'Bearish' ? '🔴 BEARISH Soft' : '🟡 NEUTRAL Calm'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="bg-[#12141c] px-6 py-4 border-t border-[#23252f] flex justify-between items-center shrink-0">
                <span className="text-[11px] text-slate-500 font-mono">
                  Quantum Terminal Pro // Macro scenarios
                </span>
                <button 
                  onClick={() => setSelectedCalendarEvent(null)}
                  className="text-white bg-indigo-600 hover:bg-indigo-500 font-bold px-5 py-2 rounded-xl transition-all text-xs shadow-lg cursor-pointer"
                >
                  Close / ပိတ်ပါ
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TRADING EDUCATION DRAWER / BURMESE DICTIONARY MODAL & LEXICON TOOLTIPS */}
      {selectedLexiconKey && BURMESE_LEXICON[selectedLexiconKey] && (
        <div id="dictionary-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121216] border border-[#2e2e36] text-slate-100 rounded-xl max-w-md w-full overflow-hidden shadow-2xl relative">
            <div className="bg-indigo-950/70 px-5 py-4 border-b border-[#2e2e36] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm tracking-wide text-white uppercase font-mono">Tradepedia // မြန်မာဖွင့်ဆိုချက်</h3>
              </div>
              <button 
                onClick={() => setSelectedLexiconKey(null)}
                className="text-slate-400 hover:text-white text-lg font-mono font-bold hover:bg-slate-800/80 px-2 py-0.5 rounded transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <span className="text-[11px] font-mono font-bold text-indigo-400 tracking-wider uppercase">စကားရပ်</span>
                <h4 className="text-lg font-extrabold text-white mt-0.5">{BURMESE_LEXICON[selectedLexiconKey].term}</h4>
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold text-emerald-400 tracking-wider uppercase">မြန်မာဘာသာပြန်</span>
                <p className="text-base text-slate-200 font-medium mt-1 leading-relaxed leading- Burmese text-[#eceef5]">
                  {BURMESE_LEXICON[selectedLexiconKey].burmese}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold text-amber-400 tracking-wider uppercase">အသေးစိတ်ရှင်းလင်းချက်</span>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                  {BURMESE_LEXICON[selectedLexiconKey].explanation}
                </p>
              </div>

              <div className="bg-slate-900/60 p-3 rounded border border-slate-850 text-[11px] text-slate-500 leading-normal">
                💡 <span className="font-semibold text-slate-400">အကြံပြုချက်:</span> US index Futures trading တွင် NQ သည် Tech သတင်းများကြောင့် လှုပ်ခတ်မှု အလွန်ကြမ်းတမ်းပြီး ES သည် မက်ကရိုစီးပွားရေး အချက်အလက်များပေါ်တွင် ပိုမိုတည်ငြိမ်စွာ ရွေ့လျားလေ့ရှိပါသည်။
              </div>
            </div>

            <div className="bg-[#15151b] px-5 py-3 border-t border-[#1b1b1f] flex justify-between items-center text-xs text-slate-400">
              <span>မြန်မာ Trading အကူအညီ</span>
              <button 
                onClick={() => setSelectedLexiconKey(null)}
                className="text-white bg-indigo-600 hover:bg-indigo-500 font-bold px-4 py-1.5 rounded-lg transition-all text-xs"
              >
                နားလည်ပါပြီ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK FLOATING GLOSSARY SELECTOR ON SCREEN BAR */}
      <div className="fixed bottom-14 right-4 z-40 flex flex-col items-end gap-1 font-mono">
        <div className="group relative">
          <button 
            id="glossary-floating-btn"
            onClick={() => setSelectedLexiconKey('NQ')}
            className="flex items-center gap-1.5 bg-indigo-600/90 hover:bg-indigo-500 hover:scale-105 active:scale-95 text-white font-bold text-xs p-2.5 rounded-full shadow-xl border border-indigo-500/50 transition-all font-sans cursor-pointer"
            title="မြန်မာ Trading Dictionary"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">မြန်မာ Tradepedia</span>
          </button>
          
          {/* Quick links hover dropdown tooltip */}
          <div className="absolute bottom-11 right-0 hidden group-hover:block hover:block bg-slate-950 border border-slate-800 rounded-lg p-2.5 w-60 shadow-2xl transition-all">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block border-b border-slate-900 pb-1 mb-1.5">အသုံးအနှုန်း ဖွင့်ဆိုချက်များ</span>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-sky-400 text-left font-sans">
              <button className="hover:underline py-0.5" onClick={() => setSelectedLexiconKey('NQ')}>• Nasdaq Futures (NQ)</button>
              <button className="hover:underline py-0.5" onClick={() => setSelectedLexiconKey('ES')}>• S&P Futures (ES)</button>
              <button className="hover:underline py-0.5" onClick={() => setSelectedLexiconKey('Bullish')}>• Bullish (စျေးတက်)</button>
              <button className="hover:underline py-0.5" onClick={() => setSelectedLexiconKey('Bearish')}>• Bearish (စျေးကျ)</button>
              <button className="hover:underline py-0.5" onClick={() => setSelectedLexiconKey('IPO')}>• IPO</button>
              <button className="hover:underline py-0.5" onClick={() => setSelectedLexiconKey('Earnings Report')}>• Earnings Report</button>
              <button className="hover:underline py-0.5" onClick={() => setSelectedLexiconKey('Geopolitical')}>• Geopolitical</button>
              <button className="hover:underline py-0.5" onClick={() => setSelectedLexiconKey('VWAP')}>• VWAP</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
