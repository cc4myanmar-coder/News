import React, { useState, useEffect, useRef } from 'react';
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
  MessageSquare,
  Sun,
  Moon,
  Youtube,
  GripVertical,
  ArrowLeftRight,
  LayoutGrid,
  DollarSign,
  BarChart2,
  Users,
  LineChart,
  Sliders,
  Check,
  ShieldAlert,
  Lock
} from 'lucide-react';
import { NewsItem, CalendarEvent, VolatilityAnalysis, TickData } from './types';
import { BURMESE_LEXICON } from './components/BurmeseLexicon';
import { LiveFuturesChart } from './components/LiveFuturesChart';
import { CentralBankRatesPanel } from './components/CentralBankRatesPanel';
import { KnowledgeHub } from './components/KnowledgeHub';
import { getMacroDetailsForEvent } from './components/MacroExplainerData';
import { VolatilitySparkline, SparklinePoint } from './components/VolatilitySparkline';
import { getRtftLogoUrl } from './lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

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

import { TimezoneDropdown, TIMEZONES } from './components/TimezoneDropdown';

// Conversions assistant to transform static Eastern Time (EST/EDT) records dynamically
export const convertEstToSelectedTimezone = (dateStr: string, timeStr: string, targetTimezone: string, use12Hour: boolean = false): string => {
  try {
    // Standardize and extract hours/minutes and AM/PM if present
    const clean = timeStr.trim().toUpperCase().replace(/\s+/g, ' ');
    const match = clean.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/);
    if (!match) return timeStr;
    
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const ampm = match[3];
    
    if (ampm === 'PM' && hour < 12) {
      hour += 12;
    } else if (ampm === 'AM' && hour === 12) {
      hour = 0;
    }

    // Resolve event date components
    const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!dateParts) return timeStr;
    const year = parseInt(dateParts[1], 10);
    const month = parseInt(dateParts[2], 10);
    const day = parseInt(dateParts[3], 10);

    // Dynamic DST Resolution: New York is either UTC-4 (EDT) or UTC-5 (EST)
    // We check both possibilities and let the Intl engine tell us which candidate corresponds
    // to the targeted hour and minute in New York.
    const candidate1 = new Date(Date.UTC(year, month - 1, day, hour + 4, minute)); // Guess: EDT (UTC-4)
    const candidate2 = new Date(Date.UTC(year, month - 1, day, hour + 5, minute)); // Guess: EST (UTC-5)

    const verificationFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });

    const isMatch1 = (() => {
      try {
        const parts = verificationFormatter.format(candidate1).split(':');
        const h1 = parseInt(parts[0], 10);
        const m1 = parseInt(parts[1], 10);
        return h1 === hour && m1 === minute;
      } catch {
        return false;
      }
    })();

    const eventUtcDate = isMatch1 ? candidate1 : candidate2;

    // Finally, format output into local user-selected timezone
    return new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: use12Hour
    }).format(eventUtcDate);
  } catch (error) {
    console.warn("Time zone automatic DST conversion fallback triggered:", error);
    // Return original HH:MM if parsing fails in any step
    const simpleParts = timeStr.match(/(\d{2}):(\d{2})/);
    return simpleParts ? simpleParts[0] : timeStr;
  }
};


// Helper to parse dates into human trader-friendly days of the week matching Forex Factory styles
const formatCalendarDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const formatted = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    
    // Get local today, yesterday, and tomorrow dates in YYYY-MM-DD
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    const toYmd = (dateObj: Date) => {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const todayYmd = toYmd(today);
    const yesterdayYmd = toYmd(yesterday);
    const tomorrowYmd = toYmd(tomorrow);
    
    if (dateStr === todayYmd) {
      return `${formatted} (Today)`;
    } else if (dateStr === tomorrowYmd) {
      return `${formatted} (Tomorrow)`;
    } else if (dateStr === yesterdayYmd) {
      return `${formatted} (Yesterday)`;
    }
    
    return formatted;
  } catch {
    return dateStr;
  }
};

// Standard FOMC meetings for 2026 and 2027
export const FOMC_MEETINGS = [
  { start: "2026-01-27", end: "2026-01-28", label: "January 27-28, 2026", mmLabel: "၂၀၂၆ ခုနှစ်၏ ၁ ကြိမ်မြောက် အစည်းအဝေး", days: "Tuesday - Wednesday", mmDays: "အင်္ဂါ - ဗုဒ္ဓဟူးနေ့" },
  { start: "2026-03-17", end: "2026-03-18", label: "March 17-18, 2026", mmLabel: "၂၀၂၆ ခုနှစ်၏ ၂ ကြိမ်မြောက် အစည်းအဝေး", days: "Tuesday - Wednesday", mmDays: "အင်္ဂါ - ဗုဒ္ဓဟူးနေ့" },
  { start: "2026-04-28", end: "2026-04-29", label: "April 28-29, 2026", mmLabel: "၂၀၂၆ ခုနှစ်၏ ၃ ကြိမ်မြောက် အစည်းအဝေး", days: "Tuesday - Wednesday", mmDays: "အင်္ဂါ - ဗုဒ္ဓဟူးနေ့" },
  { start: "2026-06-16", end: "2026-06-17", label: "June 16-17, 2026", mmLabel: "၂၀၂၆ ခုနှစ်၏ ၄ ကြိမ်မြောက် အစည်းအဝေး", days: "Tuesday - Wednesday", mmDays: "အင်္ဂါ - ဗုဒ္ဓဟူးနေ့" },
  { start: "2026-07-28", end: "2026-07-29", label: "July 28-29, 2026", mmLabel: "၂၀၂၆ ခုနှစ်၏ ၅ ကြိမ်မြောက် အစည်းအဝေး", days: "Tuesday - Wednesday", mmDays: "အင်္ဂါ - ဗုဒ္ဓဟူးနေ့" },
  { start: "2026-09-15", end: "2026-09-16", label: "September 15-16, 2026", mmLabel: "၂၀၂၆ ခုနှစ်၏ ၆ ကြိမ်မြောက် အစည်းအဝေး", days: "Tuesday - Wednesday", mmDays: "အင်္ဂါ - ဗုဒ္ဓဟူးနေ့" },
  { start: "2026-11-03", end: "2026-11-04", label: "November 3-4, 2026", mmLabel: "၂၀၂၆ ခုနှစ်၏ ၇ ကြိမ်မြောက် အစည်းအဝေး", days: "Tuesday - Wednesday", mmDays: "အင်္ဂါ - ဗုဒ္ဓဟူးနေ့" },
  { start: "2026-12-15", end: "2026-12-16", label: "December 15-16, 2026", mmLabel: "၂၀၂၆ ခုနှစ်၏ ၈ ကြိမ်မြောက် အစည်းအဝေး", days: "Tuesday - Wednesday", mmDays: "အင်္ဂါ - ဗုဒ္ဓဟူးနေ့" },
  
  { start: "2027-01-26", end: "2027-01-27", label: "January 26-27, 2027", mmLabel: "၂၀၂၇ ခုနှစ်၏ ၁ ကြိမ်မြောက် အစည်းအဝေး", days: "Tuesday - Wednesday", mmDays: "အင်္ဂါ - ဗုဒ္ဓဟူးနေ့" },
  { start: "2027-03-16", end: "2027-03-17", label: "March 16-17, 2027", mmLabel: "၂၀၂၇ ခုနှစ်၏ ၂ ကြိမ်မြောက် အစည်းအဝေး", days: "Tuesday - Wednesday", mmDays: "အင်္ဂါ - ဗုဒ္ဓဟူးနေ့" },
  { start: "2027-04-27", end: "2027-04-28", label: "April 27-28, 2027", mmLabel: "၂၀၂၇ ခုနှစ်၏ ၃ ကြိမ်မြောက် အစည်းအဝေး", days: "Tuesday - Wednesday", mmDays: "အင်္ဂါ - ဗုဒ္ဓဟူးနေ့" },
  { start: "2027-06-15", end: "2027-06-16", label: "June 15-16, 2027", mmLabel: "၂၀၂၇ ခုနှစ်၏ ၄ ကြိမ်မြောက် အစည်းအဝေး", days: "Tuesday - Wednesday", mmDays: "အင်္ဂါ - ဗုဒ္ဓဟူးနေ့" },
  { start: "2027-07-27", end: "2027-07-28", label: "July 27-28, 2027", mmLabel: "၂၀၂၇ ခုနှစ်၏ ၅ ကြိမ်မြောက် အစည်းအဝေး", days: "Tuesday - Wednesday", mmDays: "အင်္ဂါ - ဗုဒ္ဓဟူးနေ့" },
  { start: "2027-09-21", end: "2027-09-22", label: "September 21-22, 2027", mmLabel: "၂၀၂၇ ခုနှစ်၏ ၆ ကြိမ်မြောက် အစည်းအဝေး", days: "Tuesday - Wednesday", mmDays: "အင်္ဂါ - ဗုဒ္ဓဟူးနေ့" },
  { start: "2027-11-02", end: "2027-11-03", label: "November 2-3, 2027", mmLabel: "၂၀၂၇ ခုနှစ်၏ ၇ ကြိမ်မြောက် အစည်းအဝေး", days: "Tuesday - Wednesday", mmDays: "အင်္ဂါ - ဗုဒ္ဓဟူးနေ့" },
  { start: "2027-12-14", end: "2027-12-15", label: "December 14-15, 2027", mmLabel: "၂၀၂၇ ခုနှစ်၏ ၈ ကြိမ်မြောက် အစည်းအဝေး", days: "Tuesday - Wednesday", mmDays: "အင်္ဂါ - ဗုဒ္ဓဟူးနေ့" },
];

export function getFomcStatus(nowDate: Date = new Date()) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const todayStr = `${nowDate.getFullYear()}-${pad(nowDate.getMonth() + 1)}-${pad(nowDate.getDate())}`;
  
  const completed = FOMC_MEETINGS.filter(m => m.end <= todayStr);
  const upcoming = FOMC_MEETINGS.filter(m => m.end > todayStr);
  
  const lastCompleted = completed.length > 0 ? completed[completed.length - 1] : FOMC_MEETINGS[0];
  const nextUpcoming = upcoming.length > 0 ? upcoming[0] : FOMC_MEETINGS[FOMC_MEETINGS.length - 1];
  
  return {
    lastCompleted,
    nextUpcoming
  };
}

export default function App() {
  const { lastCompleted: clientLastCompleted, nextUpcoming: clientNextUpcoming } = getFomcStatus();

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

  // Color theme state with 5 choices (dark, light, emerald, crimson, amber)
  const [theme, setTheme] = useState<'dark' | 'light' | 'emerald' | 'crimson' | 'amber'>(() => {
    try {
      const saved = localStorage.getItem('rtft-quantum-theme');
      if (saved === 'light' || saved === 'dark' || saved === 'emerald' || saved === 'crimson' || saved === 'amber') {
        return saved;
      }
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rtft-quantum-theme', theme);
    } catch (e) {
      console.warn('Storage permission restricted:', e);
    }
  }, [theme]);

  // Selected Font Family ('jakarta', 'inter', 'grotesk', 'jetbrains', 'myanmar')
  const [fontFamily, setFontFamily] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('rtft-quantum-font-family');
      return saved || 'jakarta';
    } catch {
      return 'jakarta';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rtft-quantum-font-family', fontFamily);
    } catch (e) {
      console.warn('Storage permission restricted:', e);
    }
  }, [fontFamily]);

  // Selected Font Size ('small', 'medium', 'large', 'xlarge')
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>(() => {
    try {
      const saved = localStorage.getItem('rtft-quantum-font-size');
      return (saved === 'small' || saved === 'medium' || saved === 'large' || saved === 'xlarge') ? saved : 'medium';
    } catch {
      return 'medium';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rtft-quantum-font-size', fontSize);
    } catch (e) {
      console.warn('Storage permission restricted:', e);
    }
  }, [fontSize]);

  // Selected Timezone with automatic fallback and storage persistence
  const [selectedTimezone, setSelectedTimezone] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('rtft-quantum-timezone');
      return saved || 'America/New_York';
    } catch {
      return 'America/New_York';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rtft-quantum-timezone', selectedTimezone);
    } catch (e) {
      console.warn('Storage permission restricted for timezone:', e);
    }
  }, [selectedTimezone]);

  // Selected Time format style preference: 12-Hour format vs 24-Hour format
  const [use12HourFormat, setUse12HourFormat] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('rtft-quantum-timer-12h');
      return saved === 'true'; // Default is false (24-Hour)
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rtft-quantum-timer-12h', String(use12HourFormat));
    } catch (e) {
      console.warn('Storage permission restricted for time format:', e);
    }
  }, [use12HourFormat]);

  // Column alignment / layout order preference: Standard (News on Left, Calendar on Right) vs Swapped (Calendar on Left, News on Right)
  const [isColumnSwapped, setIsColumnSwapped] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('rtft-quantum-columns-swapped');
      return saved === 'true'; // Default is false (Standard)
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rtft-quantum-columns-swapped', String(isColumnSwapped));
    } catch (e) {
      console.warn('Storage permission restricted for column config:', e);
    }
  }, [isColumnSwapped]);

  // Interactive click particle bloom states (glowing flower petal feedback)
  const [clickParticles, setClickParticles] = useState<{
    id: number;
    x: number;
    y: number;
    color: string;
    tx: number;
    ty: number;
    size: number;
    shape: 'circle' | 'petal' | 'diamond';
    rotation: number;
  }[]>([]);

  // Automatically prune old particles to keep the document lightweight and fast
  useEffect(() => {
    if (clickParticles.length > 0) {
      const timer = setTimeout(() => {
        setClickParticles(prev => prev.filter(p => Date.now() - Math.floor(p.id) < 850));
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [clickParticles.length]);

  // Global mouse down listener (handles left and right clicks seamlessly)
  useEffect(() => {
    const handleGlobalMouseDown = (e: MouseEvent) => {
      const count = 16; // Number of blooming petals per click
      const baseColors = [
        '#6366f1', // Indigo
        '#818cf8', // Soft indigo
        '#c084fc', // Bright purple
        '#f43f5e', // Vibrant rose/pink
        '#fbbf24', // Warm gold/amber
        '#34d399', // Mint emerald
        '#22d3ee', // Cyber cyan
      ];

      const now = Date.now();
      const newParticles = [];

      for (let i = 0; i < count; i++) {
        // Distribute angles evenly with subtle random variations to give a natural, fluffy look
        const angle = (i * 2 * Math.PI) / count + (Math.random() * 0.3 - 0.15);
        const distance = 30 + Math.random() * 60; // Spread radius
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        const size = 5 + Math.random() * 7;
        const color = baseColors[Math.floor(Math.random() * baseColors.length)];
        
        const shapes: ('circle' | 'petal' | 'diamond')[] = ['petal', 'circle', 'diamond'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const rotation = Math.random() * 360;

        newParticles.push({
          id: now + i + Math.random(),
          x: e.clientX,
          y: e.clientY,
          color,
          tx,
          ty,
          size,
          shape,
          rotation
        });
      }

      setClickParticles(prev => [...prev.slice(-60), ...newParticles]);
    };

    window.addEventListener("mousedown", handleGlobalMouseDown, { capture: true });
    return () => {
      window.removeEventListener("mousedown", handleGlobalMouseDown, { capture: true });
    };
  }, []);

  // Silent inspection/source block logic (stealthy protection without visual modals)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 key
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        return;
      }

      // Detect OS (macOS vs Windows/Linux)
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // Ctrl+Shift+I / Cmd+Opt+I (Developer Tools)
      // Ctrl+Shift+J / Cmd+Opt+J (Console)
      // Ctrl+Shift+C / Cmd+Opt+C (Inspect)
      if (cmdOrCtrl && shift && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c" || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
        e.preventDefault();
        return;
      }

      // Ctrl+U / Cmd+Opt+U (View Source)
      if ((cmdOrCtrl && (e.key === "U" || e.key === "u" || e.keyCode === 85)) || (cmdOrCtrl && alt && (e.key === "U" || e.key === "u" || e.keyCode === 85))) {
        e.preventDefault();
        return;
      }

      // Ctrl+S / Cmd+S (Save Page)
      if (cmdOrCtrl && (e.key === "S" || e.key === "s" || e.keyCode === 83)) {
        e.preventDefault();
        return;
      }
    };

    window.addEventListener("contextmenu", handleContextMenu, { capture: true });
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);

  // Drag-and-drop state trackers for workspace columns
  const [draggedColumn, setDraggedColumn] = useState<'news' | 'calendar' | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<'news' | 'calendar' | null>(null);

  // FOMC meeting analysis state and modal display toggling
  const [fomcAnalysis, setFomcAnalysis] = useState<any>(null);
  const [isLoadingFomc, setIsLoadingFomc] = useState<boolean>(false);
  const [showFomcModal, setShowFomcModal] = useState<boolean>(false);

  // Synchronize Tab Favicon dynamically with the customized brand/logo image
  useEffect(() => {
    const updateFavicon = (href: string) => {
      ['icon', 'shortcut icon', 'apple-touch-icon'].forEach((relType) => {
        let link: HTMLLinkElement | null = document.querySelector(`link[rel="${relType}"]`);
        if (!link) {
          link = document.createElement('link');
          link.rel = relType;
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = href;
      });
    };

    try {
      const logoUrl = getRtftLogoUrl();
      updateFavicon(`${logoUrl}?v=rtft2026`);

      // Convert JPG logo to base64 PNG for instant browser tab rendering across all browsers
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = `${logoUrl}?v=rtft2026`;
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, 64, 64);
            const dataUrl = canvas.toDataURL('image/png');
            updateFavicon(dataUrl);
          }
        } catch (e) {
          // CORS fallback already set
        }
      };
    } catch (e) {
      console.warn('Favicon synchronization failed:', e);
    }
  }, []);
  
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
  const fetchCalendarFeed = async (force: boolean = false) => {
    setIsLoadingCalendar(true);
    try {
      const res = await fetch(`/api/calendar${force ? '?force=true' : ''}`);
      const data = await res.json();
      if (data && data.calendar) {
        setCalendar(data.calendar);
        setDataSources(prev => ({ ...prev, calendar: data.source }));
        
        // Dynamically populate live alerts in client based on active calendar states
        try {
          const fomcRate = data.calendar.find((item: any) => item.event.toLowerCase().includes("federal funds") || item.event.toLowerCase().includes("fomc"));
          const retailSales = data.calendar.find((item: any) => item.event.toLowerCase().includes("retail sales"));
          const joblessClaims = data.calendar.find((item: any) => item.event.toLowerCase().includes("claims") || item.event.toLowerCase().includes("unemployment"));
          
          const newAlerts: any[] = [];
          
          if (fomcRate && fomcRate.actual && fomcRate.actual !== 'Pending' && fomcRate.actual !== 'Pending Release') {
            newAlerts.push({
              id: 'a-fomc-rate',
              timestamp: fomcRate.time,
              index: 'FED',
              type: 'FOMC Rate Target',
              description: `FOMC Federal Funds Rate printed at ${fomcRate.actual} versus consensus ${fomcRate.forecast || '3.75%'}. Volatility indexes surged for CME stock products.`,
              severity: 'critical'
            });
          }
          
          if (retailSales && retailSales.actual && retailSales.actual !== 'Pending' && retailSales.actual !== 'Pending Release') {
            newAlerts.push({
              id: 'a-retail-sales',
              timestamp: retailSales.time,
              index: 'USD',
              type: 'US Retail Sales',
              description: `US Retail Sales macro indicators published at ${retailSales.actual} versus ${retailSales.forecast || '0.5%'} expectations core consensus.`,
              severity: 'moderate'
            });
          }

          if (joblessClaims && joblessClaims.actual && joblessClaims.actual !== 'Pending' && joblessClaims.actual !== 'Pending Release') {
            newAlerts.push({
              id: 'a-jobless-claims',
              timestamp: joblessClaims.time,
              index: 'USD',
              type: 'Jobless Claims',
              description: `US Unemployment Jobless Claims printed at ${joblessClaims.actual} versus estimated ${joblessClaims.forecast || '225K'}.`,
              severity: 'moderate'
            });
          }
          
          if (newAlerts.length > 0) {
            setVolatilityAlerts(prev => {
              // Filters out duplicates of these custom real-time alerts if already present
              const filtered = prev.filter(a => a.id !== 'a-fomc-rate' && a.id !== 'a-retail-sales' && a.id !== 'a-jobless-claims');
              return [...newAlerts, ...filtered];
            });
          }
        } catch (alertError) {
          console.warn("Client alert injection notice:", alertError);
        }

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

  // Trigger FOMC Macro economic result & Burmese analyst report
  const triggerFomcAnalysis = async (force: boolean = false) => {
    setIsLoadingFomc(true);
    setShowFomcModal(true);
    try {
      const response = await fetch(`/api/fomc-analysis${force ? '?force=true' : ''}`);
      const data = await response.json();
      if (data && data.analysis) {
        setFomcAnalysis(data.analysis);
        if (data.geminiStandby) {
          setGeminiStandby(true);
          setStandbyReason(data.standbyReason || 'quota_exhausted');
        }
      }
    } catch (err) {
      console.log('Telemetry Notice: FOMC analyst fallback active.', err);
    } finally {
      setIsLoadingFomc(false);
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

  const activeZone = TIMEZONES.find(tz => tz.value === selectedTimezone) || TIMEZONES[0];

  return (
    <div id="quantum-app-container" className={`min-h-screen bg-[#070708] text-slate-300 flex flex-col antialiased ${
      theme === 'light' ? 'theme-light' : 
      theme === 'emerald' ? 'theme-emerald' : 
      theme === 'crimson' ? 'theme-crimson' : 
      theme === 'amber' ? 'theme-amber' : ''
    } font-${fontFamily} size-${fontSize}`}>
      
      {/* HEADER SECTION - Beautiful dark glowing control panel */}
      <header id="app-header" className="min-h-[74px] lg:h-[74px] bg-[#0c0c0e] border-b border-[#1b1b1e] flex flex-col lg:flex-row lg:items-center justify-between px-4 sm:px-6 py-4 lg:py-0 shrink-0 sticky top-0 z-50 shadow-md gap-4">
        
        {/* Left corner branding & Mobile clock */}
        <div className="flex items-center justify-between lg:justify-start gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border-2 border-indigo-500/50 text-indigo-400 shrink-0 overflow-hidden shadow-[0_0_12px_rgba(99,102,241,0.35)] hover:border-indigo-400 transition-all duration-300">
              <img 
                src="https://ccsgfqstofavjjxjuxkk.supabase.co/storage/v1/object/public/assets/logo.jpg" 
                alt="RTFT Logo" 
                className="w-full h-full object-cover select-none"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse"></span>
                <span className="text-[9px] font-mono tracking-wider text-emerald-400 font-bold uppercase">LIVE FEED ESTABLISHED</span>
              </div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5 flex-wrap">
                QUANTUM <span className="text-indigo-400 font-semibold">TERMINAL</span> 
                <span className="text-slate-400/90 text-xs sm:text-sm font-semibold tracking-wide font-mono px-1 py-0.2 select-none border-l border-[#1b1b1e] pl-1.5">
                  BY <span className="text-indigo-300 font-bold">RTFT</span>
                </span>
                <span className="text-[9px] bg-indigo-900/35 text-indigo-300 border border-indigo-700/50 px-1.5 py-0.2 rounded font-mono font-normal tracking-normal lowercase">v1.0</span>
              </h1>
            </div>
          </div>

          {/* Clock helper specifically for layout on smaller mobile screens (< sm) */}
          <div className="flex sm:hidden items-center gap-1.5 font-mono shrink-0 select-none">
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-[#5c5d6c] uppercase tracking-wider">{activeZone.abbr} CLOCK</span>
              <span className="text-xs font-semibold text-slate-300">
                {(() => {
                  try {
                    return new Date().toLocaleTimeString('en-US', { timeZone: selectedTimezone, hour12: use12HourFormat, hour: '2-digit', minute: '2-digit' });
                  } catch {
                    return new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: use12HourFormat, hour: '2-digit', minute: '2-digit' });
                  }
                })()}
              </span>
            </div>
            <button
              onClick={() => setUse12HourFormat(!use12HourFormat)}
              className="px-1.5 py-0.5 text-[8px] font-extrabold border border-slate-800 bg-[#101012] hover:bg-slate-900 rounded text-slate-400 transition-colors uppercase cursor-pointer"
              title="Toggle 12H/24H Time Format"
            >
              {use12HourFormat ? "12H" : "24H"}
            </button>
          </div>
        </div>

        {/* Real-time Tickers: Pipeline indicators & Desktop Clock */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full lg:w-auto lg:ml-auto">
          
          {/* Active pipeline status badge indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#222226] bg-[#101012] select-none">
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
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#222226] bg-[#101012] select-none">
            <div className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] sm:text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider font-mono truncate">REAL-TIME NEWS CRAWLER</span>
              <span className="text-[8px] sm:text-[9px] text-slate-500 font-sans truncate">Parsing Bloomberg & Reuters feeds</span>
            </div>
          </div>

          {/* Timezone Selector & Digital Clock (shown on screens >= sm) */}
          <div className="hidden sm:flex flex-col items-end shrink-0 select-none px-2 font-mono lg:ml-4 border-l border-slate-800/60 pl-4">
            <div className="flex items-center gap-2">
              <TimezoneDropdown value={selectedTimezone} onChange={setSelectedTimezone} />
              <button
                onClick={() => setUse12HourFormat(!use12HourFormat)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold border transition-all cursor-pointer ${
                  use12HourFormat 
                    ? "bg-indigo-950/40 text-indigo-300 border-indigo-700/40" 
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                }`}
                title="Toggle Time Format (12H / 24H)"
                id="timezone-format-toggle"
              >
                {use12HourFormat ? "12H" : "24H"}
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-slate-205 mt-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-sm font-semibold text-slate-200">
                {(() => {
                  try {
                    return new Date().toLocaleTimeString('en-US', { timeZone: selectedTimezone, hour12: use12HourFormat, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  } catch {
                    return new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: use12HourFormat, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  }
                })()}
              </span>
            </div>
          </div>


        </div>

      </header>



      {/* SUB-HEADER INFOBAR */}
      <div className="hidden sm:flex bg-[#09090b] border-b border-[#1b1b1e] px-6 py-2 flex-wrap items-center justify-between gap-4 text-xs">
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
        <div className="flex items-center gap-4 flex-wrap">
          {/* Workspace Grid Alignment Reorder controller */}
          <div className="flex items-center gap-2 bg-[#101014] border border-slate-800/80 rounded px-2.5 py-1 text-slate-400 font-mono text-[10px] select-none">
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] text-slate-400">ALIGNMENT:</span>
            <div className="flex items-center gap-1.5 bg-[#09090b] rounded px-2 py-0.5 border border-slate-800/60">
              <span className={`font-bold transition-colors ${!isColumnSwapped ? 'text-indigo-400' : 'text-slate-500'}`}>NEWS FIRST</span>
              <button 
                onClick={() => setIsColumnSwapped(!isColumnSwapped)}
                className="p-1 bg-slate-900 border border-slate-700/40 hover:border-slate-500/60 rounded text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center shadow-sm"
                title="Swap main column ordering (or drag and drop column headers)"
                id="column-swap-toggle-btn"
              >
                <ArrowLeftRight className={`w-3 h-3 transition-transform duration-500 ${isColumnSwapped ? 'rotate-180' : ''}`} />
              </button>
              <span className={`font-bold transition-colors ${isColumnSwapped ? 'text-indigo-400' : 'text-slate-500'}`}>CALENDAR FIRST</span>
            </div>
            <span className="text-slate-600 hidden md:inline">• Drag columns to reorder</span>
          </div>

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
        <section 
          onDragOver={(e) => {
            if (draggedColumn === 'calendar') {
              e.preventDefault();
              setDragOverColumn('news');
            }
          }}
          onDragLeave={() => {
            setDragOverColumn(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            const source = e.dataTransfer.getData('text/plain');
            if (source === 'calendar' || draggedColumn === 'calendar') {
              setIsColumnSwapped(!isColumnSwapped);
            }
            setDraggedColumn(null);
            setDragOverColumn(null);
          }}
          className={`xl:col-span-4 flex flex-col overflow-y-auto relative transition-all duration-300 ${
            isColumnSwapped 
              ? 'xl:order-2 border-l border-[#1b1b1e]' 
              : 'xl:order-1 border-r border-[#1b1b1e]'
          } ${dragOverColumn === 'news' ? 'ring-2 ring-indigo-500/60 ring-inset bg-indigo-950/5' : ''}`}
        >
          {/* Column swapping Drop-Drop interactive visual feedback overlay */}
          {dragOverColumn === 'news' && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] border-2 border-dashed border-indigo-500/50 flex flex-col items-center justify-center z-50 animate-fade-in pointer-events-none">
              <ArrowLeftRight className="w-10 h-10 text-indigo-400 animate-pulse mb-3" />
              <span className="text-sm font-mono font-bold text-white uppercase tracking-wider">Drop here to swap positions</span>
              <span className="text-xs font-sans text-slate-400">Rearrange workspace alignment</span>
            </div>
          )}

          {/* MAIN NEWS HEADER & FILTER CONTROLS */}
          <div className="bg-[#0b0c0f] border-b border-[#1b1b1e] p-4 font-mono">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  {/* Grip Handle for Drag and Drop Swapping */}
                  <div 
                    draggable={true}
                    onDragStart={(e) => {
                      setDraggedColumn('news');
                      e.dataTransfer.setData('text/plain', 'news');
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setDraggedColumn(null);
                      setDragOverColumn(null);
                    }}
                    onClick={() => setIsColumnSwapped(!isColumnSwapped)}
                    className="p-1 rounded bg-[#101014] border border-slate-800 hover:border-indigo-500/50 text-slate-500 hover:text-indigo-400 cursor-grab active:cursor-grabbing transition-all flex items-center justify-center mr-1"
                    title="Drag this handle to swap columns or click to swap instantly"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
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
              <AnimatePresence mode="popLayout">
                {filteredNews.map((story) => {
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
                    <motion.div 
                      key={story.id} 
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.97 }}
                      transition={{ 
                        type: 'spring', 
                        stiffness: 350, 
                        damping: 30,
                        mass: 0.8,
                        layout: { type: 'spring', stiffness: 350, damping: 32 }
                      }}
                      className="bg-[#0b0c0f] border border-[#1b1b1e] hover:border-[#2e2f36] p-4 rounded-xl transition-colors duration-200 shadow-sm flex flex-col md:flex-row xl:flex-col gap-4 items-start"
                    >
                      
                      {/* Index affected flags & stats metadata */}
                      <div className="flex md:flex-col xl:flex-row xl:w-full xl:justify-between xl:items-center gap-2 shrink-0 md:w-32 justify-between md:justify-start">
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
                        <div className="flex flex-col items-start gap-1 font-mono md:mt-2 xl:mt-0">
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
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

        </section>

        {/* RIGHT COLUMN (5 COLS on XL) - Economic Calendar, Alerts, and Burmese Dictionary */}
        <aside 
          onDragOver={(e) => {
            if (draggedColumn === 'news') {
              e.preventDefault();
              setDragOverColumn('calendar');
            }
          }}
          onDragLeave={() => {
            setDragOverColumn(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            const source = e.dataTransfer.getData('text/plain');
            if (source === 'news' || draggedColumn === 'news') {
              setIsColumnSwapped(!isColumnSwapped);
            }
            setDraggedColumn(null);
            setDragOverColumn(null);
          }}
          className={`xl:col-span-8 bg-[#09090b] flex flex-col divide-y divide-[#1b1b1e] relative transition-all duration-300 ${
            isColumnSwapped 
              ? 'xl:order-1' 
              : 'xl:order-2'
          } ${dragOverColumn === 'calendar' ? 'ring-2 ring-indigo-500/60 ring-inset bg-indigo-950/5' : ''}`}
        >
          {/* Column swapping Drop-Drop interactive visual feedback overlay */}
          {dragOverColumn === 'calendar' && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] border-2 border-dashed border-indigo-500/50 flex flex-col items-center justify-center z-50 animate-fade-in pointer-events-none">
              <ArrowLeftRight className="w-10 h-10 text-indigo-400 animate-pulse mb-3" />
              <span className="text-sm font-mono font-bold text-white uppercase tracking-wider">Drop here to swap positions</span>
              <span className="text-xs font-sans text-slate-400">Rearrange workspace alignment</span>
            </div>
          )}
          
          {/* SEC 1: REAL-TIME ECONOMIC CALENDAR */}
          <div className="p-4 flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                {/* Grip Handle for Drag and Drop Swapping */}
                <div 
                  draggable={true}
                  onDragStart={(e) => {
                    setDraggedColumn('calendar');
                    e.dataTransfer.setData('text/plain', 'calendar');
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => {
                    setDraggedColumn(null);
                    setDragOverColumn(null);
                  }}
                  onClick={() => setIsColumnSwapped(!isColumnSwapped)}
                  className="p-1 rounded bg-[#101014] border border-slate-800 hover:border-indigo-500/50 text-slate-500 hover:text-indigo-400 cursor-grab active:cursor-grabbing transition-all flex items-center justify-center mr-1"
                  title="Drag this handle to swap columns or click to swap instantly"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
                <Calendar className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-mono font-extrabold text-slate-300 uppercase tracking-widest">LIVE ECONOMIC CALENDAR</span>
              </div>
              <button 
                onClick={() => fetchCalendarFeed(true)}
                disabled={isLoadingCalendar}
                className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                title="Refresh calendar data (Bypass Cache)"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCalendar ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* FOMC MEETING PORTAL */}
            <div className="mb-4.5 p-3.5 bg-gradient-to-r from-indigo-950/15 via-[#0c0d12]/95 to-[#050608]/95 border border-indigo-500/25 rounded-lg shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-450 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500 animate-pulse"></span>
                  </span>
                  <span className="text-[10px] font-bold tracking-widest text-slate-300">FOMC PORTAL</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[9px] font-mono bg-[#110e11] border border-red-950/30 text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider" title="ပြီးသွားသော အစည်းအဝေး">
                    COMPLETED: {clientLastCompleted.label}
                  </span>
                  <span className="text-[9px] font-mono bg-indigo-950/80 border border-indigo-800/40 text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider" title="လာမည့် အစည်းအဝေး">
                    COMING: {clientNextUpcoming.label} ({clientNextUpcoming.days})
                  </span>
                </div>
              </div>
              
              <h4 className="text-xs font-black text-slate-100 mb-1.5 flex items-center gap-1 font-sans">
                FOMC Meeting Result & Analytical Bias
              </h4>
              

              <p className="text-[11px] text-slate-400 leading-relaxed mb-3.5 font-sans">
                ပြီးသွားသော {clientLastCompleted.label} အစည်းအဝေး၏ အတိုးနှုန်း ဆုံးဖြတ်ချက်များ၊ FED ဥက္ကဋ္ဌ၏ အမြင်နှင့် Dot Plot ကို မြန်မာလို အသေးစိတ် ရလဒ်များ ဆန်းစစ်သုံးသပ်ချက်။ လာမည့်အစည်းအဝေးမှာ {clientNextUpcoming.label} ({clientNextUpcoming.mmDays}) ဖြစ်ပါသည်။
              </p>
              
              <button
                id="fomc-analysis-trigger-btn"
                onClick={triggerFomcAnalysis}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all rounded text-[11px] font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-indigo-500/10 font-sans"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                FOMC Result & Analysis (မြန်မာလိုဆန်းစစ်ချက်ဖတ်ရန်)
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

            {/* Calendar Events List */}
            <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
              {isLoadingCalendar ? (
                <div className="text-center py-8 text-slate-500 font-mono text-xs">Fetching macro events...</div>
              ) : calendar.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">No macro events reported.</div>
              ) : (
                // Group by unique dates to maintain list structure even with filters active
                Array.from(new Set(calendar.map(item => item.date as string)))
                  .sort()
                  .map((dateVal: string) => {
                    const dateEvents = calendar.filter(item => item.date === dateVal);
                    const matchingEvents = dateEvents.filter(item => {
                      if (calendarDayFilter === 'high-only') {
                        return item.impact === 'High';
                      }
                      return true;
                    });

                    return (
                      <div key={dateVal} className="space-y-1.5 mb-2.5">
                        {/* Day/Date Header - Always visible to ensure days are clear in the layout */}
                        <div className="sticky top-0 z-10 bg-[#09090b]/90 backdrop-blur-md py-1.5 px-2 my-1 text-[10px] font-mono font-black tracking-wider text-indigo-400 border-l-2 border-indigo-500 bg-indigo-500/5 flex items-center justify-between uppercase rounded-r">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                            {formatCalendarDate(dateVal)}
                          </span>
                        </div>

                        {matchingEvents.length === 0 ? (
                          <div className="text-center py-3 text-[10px] font-mono text-slate-500 bg-[#0b0c0f]/20 rounded-lg border border-dashed border-slate-800/35 my-0.5">
                            No {calendarDayFilter === 'high-only' ? 'High Impact' : 'Scheduled'} Events
                          </div>
                        ) : (
                          matchingEvents.map((item) => {
                            const isHigh = item.impact === 'High';
                            const isMedium = item.impact === 'Medium';
                            
                            const badgeClass = 
                              isHigh ? 'bg-red-950 text-red-300 border-red-900/40 font-bold' :
                              isMedium ? 'bg-amber-950/70 text-amber-300 border-amber-900/50 font-bold' :
                              'bg-slate-900 text-slate-400 border-slate-800';

                            return (
                              <div 
                                key={item.id}
                                className={`flex gap-3 p-2.5 rounded-lg border bg-[#0b0c0f] hover:bg-[#101114] transition-all cursor-pointer ${
                                  isHigh ? 'border-red-900/20 hover:border-red-900/40 bg-red-950/10' : 'border-slate-800/40'
                                }`}
                                onClick={() => setSelectedCalendarEvent(item)}
                              >
                                {/* Hour block */}
                                <div className="w-16 shrink-0 text-center flex flex-col justify-center border-r border-slate-800/40 pr-2">
                                  <span className="block text-xs font-semibold text-slate-200 font-mono">
                                    {convertEstToSelectedTimezone(item.date, item.time, selectedTimezone, use12HourFormat)}
                                  </span>
                                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">{activeZone.abbr} • {item.country}</span>
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
                            );
                          })
                        )}
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

          {/* SEC 1.5: GLOBAL CENTRAL BANKS INTEREST RATE EXPECTATIONS & RESULTS */}
          <div className="p-4 flex flex-col">
            <CentralBankRatesPanel onLexiconOpen={(key) => setSelectedLexiconKey(key)} />
          </div>

          {/* SEC 1.8: KNOWLEDGE DISCOVERY & STUDY HUB */}
          <div className="p-4 flex flex-col animate-fade-in">
            <KnowledgeHub />
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
      <footer className="min-h-12 bg-[#070709] border-t border-[#1b1b1e] flex flex-col md:flex-row items-center justify-between px-6 shrink-0 py-3 md:py-0 text-slate-400 text-xs gap-3">
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
        <div className="flex flex-col xl:flex-row items-center gap-3.5 sm:gap-6 justify-center py-2">
          <div className="text-[10px] font-mono text-slate-300 font-semibold tracking-wide flex items-center gap-1.5 bg-[#101014] border border-slate-900/80 px-3.5 py-1.5 rounded-full shrink-0 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            <span>© 2019 - 2026 COPYRIGHT BY RTFT</span>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {/* Facebook Connection */}
            <a 
              href="https://www.facebook.com/RoadToFundedTrader/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative flex items-center gap-2.5 bg-[#1877F2]/8 hover:bg-[#1877F2]/15 border border-[#1877F2]/25 hover:border-[#1877F2]/60 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_12px_rgba(24,119,242,0.25)] hover:-translate-y-0.5"
              id="social-fb-link"
            >
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1877F2] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1877F2]"></span>
              </span>
              <div className="p-1 rounded bg-[#1877F2]/10 group-hover:bg-[#1877F2]/25 transition-colors">
                <Facebook className="w-3.5 h-3.5 text-[#1877F2] group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex flex-col items-start text-xs leading-none font-mono">
                <span className="text-[9px] font-black tracking-wider text-slate-105 group-hover:text-[#1877F2]">FB PAGE</span>
                <span className="text-[7px] text-slate-500 font-medium group-hover:text-slate-400 mt-0.5">@roadtofundedtrader</span>
              </div>
            </a>

            {/* Discord Connection */}
            <a 
              href="https://discord.gg/zMNgEjNSGm" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative flex items-center gap-2.5 bg-[#5865F2]/8 hover:bg-[#5865F2]/15 border border-[#5865F2]/25 hover:border-[#5865F2]/60 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_12px_rgba(88,101,242,0.25)] hover:-translate-y-0.5"
              id="social-discord-link"
            >
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5865F2] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5865F2]"></span>
              </span>
              <div className="p-1 rounded bg-[#5865F2]/10 group-hover:bg-[#5865F2]/25 transition-colors">
                <MessageSquare className="w-3.5 h-3.5 text-[#5865F2] group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex flex-col items-start text-xs leading-none font-mono">
                <span className="text-[9px] font-black tracking-wider text-slate-105 group-hover:text-[#5865F2]">DISCORD</span>
                <span className="text-[7px] text-slate-500 font-medium group-hover:text-slate-400 mt-0.5">join community</span>
              </div>
            </a>

            {/* Telegram Connection */}
            <a 
              href="https://t.me/+qZe0SIoUvkI4NGY1" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative flex items-center gap-2.5 bg-[#26A5E4]/8 hover:bg-[#26A5E4]/15 border border-[#26A5E4]/25 hover:border-[#26A5E4]/60 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_12px_rgba(38,165,228,0.25)] hover:-translate-y-0.5"
              id="social-telegram-link"
            >
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#26A5E4] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#26A5E4]"></span>
              </span>
              <div className="p-1 rounded bg-[#26A5E4]/10 group-hover:bg-[#26A5E4]/25 transition-colors">
                <Send className="w-3.5 h-3.5 text-[#26A5E4] group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex flex-col items-start text-xs leading-none font-mono">
                <span className="text-[9px] font-black tracking-wider text-slate-105 group-hover:text-[#26A5E4]">TELEGRAM</span>
                <span className="text-[7px] text-slate-500 font-medium group-hover:text-slate-400 mt-0.5">vip alerts channel</span>
              </div>
            </a>

            {/* YouTube Connection */}
            <a 
              href="https://www.youtube.com/@RTFT-VIP-Channel" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative flex items-center gap-2.5 bg-[#FF0000]/8 hover:bg-[#FF0000]/15 border border-[#FF0000]/25 hover:border-[#FF0000]/60 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_12px_rgba(255,0,0,0.25)] hover:-translate-y-0.5"
              id="social-youtube-link"
            >
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF0000] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF0000]"></span>
              </span>
              <div className="p-1 rounded bg-[#FF0000]/10 group-hover:bg-[#FF0000]/25 transition-colors">
                <Youtube className="w-3.5 h-3.5 text-[#FF0000] group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex flex-col items-start text-xs leading-none font-mono">
                <span className="text-[9px] font-black tracking-wider text-slate-105 group-hover:text-[#FF0000]">YOUTUBE</span>
                <span className="text-[7px] text-slate-500 font-medium group-hover:text-slate-400 mt-0.5">free lessons</span>
              </div>
            </a>
          </div>
        </div>

        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter text-center md:text-right">
          PRO TERMINAL v1.0 // REGULATED QUANTUM DATASTREAM V1
        </div>
      </footer>

      {/* FOMC MEETING ANALYSES BURMESE DIALOG */}
      {showFomcModal && (
        <div id="fomc-analysis-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in animate-duration-200">
          <div className="bg-[#0b0c10] border border-[#23252f] text-slate-100 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-950 via-[#10121a] to-indigo-950/40 px-6 py-4 border-b border-[#23252f] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/25">
                  <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-450 tracking-wider uppercase block">
                    FOMC ANALYSES // CHRONOS MACRO INTELLIGENCE
                  </span>
                  <h3 className="font-extrabold text-white text-base tracking-wide font-sans mt-0.5">
                    FOMC Result & Comprehensive Trading Analysis (မြန်မာလို)
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => triggerFomcAnalysis(true)}
                  disabled={isLoadingFomc}
                  className="p-2 text-slate-400 hover:text-white hover:bg-[#1a1b24] rounded-lg border border-[#23252f] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono"
                  title="Force Reload & Re-analyze Live Minutes Release"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFomc ? 'animate-spin' : ''}`} />
                  <span>REFRESH ANALYSIS</span>
                </button>
                <button 
                  onClick={() => setShowFomcModal(false)}
                  className="text-slate-400 hover:text-white text-xl font-mono font-bold hover:bg-slate-800/80 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin font-sans">
              
              {isLoadingFomc || !fomcAnalysis ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                  <div className="relative mb-6">
                    <div className="w-14 h-14 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-indigo-400 animate-pulse" />
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono mb-2">
                    Retrieving SEC/FED Database & Grounding Search...
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                    Gemini AI က လက်ရှိ FOMC ဆုံးဖြတ်ချက်များ၊ အတိုးနှုန်း Dot Plot များနှင့် ဗဟိုဘဏ်ဥက္ကဋ္ဌ (FED Chair) ၏ သတင်းစာရှင်းလင်းပွဲအချက်အလက်များကို ရှာဖွေပြီး မြန်မာလို အသေးစိတ် ရေးသားဆန်းစစ်နေပါသည်။ ခေတ္တစောင့်ဆိုင်းပေးပါ။
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Meeting Metadata Banner */}
                  <div className="bg-[#0e0f15] border border-slate-800/50 p-4 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 block uppercase">ပြီးသွားသော အစည်းအဝေး (Completed Meeting)</span>
                      <strong className="text-xs text-indigo-400 font-mono block">{fomcAnalysis.meetingDate}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 block uppercase">လာမည့် အစည်းအဝေး (Upcoming Meeting)</span>
                      <strong className="text-xs text-emerald-400 font-mono block">
                        {clientNextUpcoming.label} ({clientNextUpcoming.mmDays} / {clientNextUpcoming.days})
                      </strong>
                    </div>
                  </div>

                  {/* Core Result Sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Rate Decision Card */}
                    <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-slate-800/40">
                          <DollarSign className="w-4 h-4 text-emerald-450 shrink-0" />
                          <h4 className="text-xs font-mono font-black text-slate-300 uppercase">အတိုးနှုန်း ဆုံးဖြတ်ချက်</h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">{fomcAnalysis.interestRateDecision}</p>
                      </div>
                    </div>

                    {/* Dot-Plot Sentiment Card */}
                    <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-slate-800/40">
                          <BarChart2 className="w-4 h-4 text-cyan-450 shrink-0" />
                          <h4 className="text-xs font-mono font-black text-slate-300 uppercase">အတိုးနှုန်း မျှော်မှန်းချက် (Dot Plot)</h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">{fomcAnalysis.dotPlotSentiment}</p>
                      </div>
                    </div>

                    {/* Members Stance Card */}
                    <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-slate-800/40">
                          <Users className="w-4 h-4 text-purple-450 shrink-0" />
                          <h4 className="text-xs font-mono font-black text-slate-300 uppercase">အဖွဲ့ဝင်များ၏ သဘောထားနှင့် မဲခွဲမှု</h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">{fomcAnalysis.voterStance}</p>
                      </div>
                    </div>

                    {/* Chairman Statement Card */}
                    <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-slate-800/40">
                          <MessageSquare className="w-4 h-4 text-indigo-450 shrink-0" />
                          <h4 className="text-xs font-mono font-black text-slate-300 uppercase">ဗဟိုဘဏ်ဥက္ကဋ္ဌ (FED Chair) ၏ သုံးသပ်ချက်</h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">{fomcAnalysis.powellExpectations}</p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Segment - Full Width */}
                  <div className="p-4.5 bg-[#0a0b10] border border-slate-800 rounded-xl">
                    <h4 className="text-xs font-mono font-black text-indigo-400 tracking-widest uppercase mb-2.5 pb-2 border-b border-slate-800/60 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-405" /> အထွေထွေ စီးပွားရေးအနှစ်ချုပ် (FOMC Summary)
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{fomcAnalysis.summaryBurmese}</p>
                  </div>

                  {/* Strategic Projections - DXY vs NQ/MNQ */}
                  <div className="border border-indigo-500/20 bg-indigo-950/10 rounded-xl overflow-hidden divide-y divide-indigo-900/20">
                    {/* DXY Outlook */}
                    <div className="p-4.5">
                      <h4 className="text-xs font-mono font-bold text-amber-500 uppercase mb-2 flex items-center gap-2 tracking-wider">
                        <TrendingDown className="w-4 h-4" /> DXY (US Dollar Index) ၏ လားရာဗျူဟာ
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{fomcAnalysis.dxyOutlook}</p>
                    </div>

                    {/* NQ/MNQ bias */}
                    <div className="p-4.5">
                      <h4 className="text-xs font-mono font-bold text-indigo-455 uppercase mb-2 flex items-center gap-2 tracking-wider">
                        <LineChart className="w-4 h-4 text-indigo-455" /> NQ / MNQ TRADERS STRATEGIC BIAS (Nasdaq 100)
                      </h4>
                      <div className="bg-[#0b0c10]/95 border border-indigo-500/15 p-3.5 rounded-lg text-xs leading-relaxed text-slate-300 font-sans">
                        {fomcAnalysis.traderBiasNqMnq}
                      </div>
                    </div>
                  </div>

                  {/* Footer Disclaimer */}
                  <div className="p-3 bg-[#110e11] border border-red-950/30 rounded text-[10px] font-mono text-slate-500 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-slate-600 shrink-0" />
                    <p className="leading-tight font-sans text-slate-500">{fomcAnalysis.riskDisclaimer}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-[#08090d] border-t border-[#23252f] px-6 py-3 shrink-0 flex justify-end font-mono">
              <span className="text-[10px] text-slate-600">RTFT QUANTUM SYSTEM DECISIONS v1.0.0</span>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED DYNAMIC ECONOMIC CALENDAR SCENARIOS MODAL */}
      {selectedCalendarEvent && (() => {
        const details = getMacroDetailsForEvent(selectedCalendarEvent.event);
        const nameLower = selectedCalendarEvent.event.toLowerCase();
        const actualLower = (selectedCalendarEvent.actual || '').toLowerCase();
        const forecastLower = (selectedCalendarEvent.forecast || '').toLowerCase();
        const previousLower = (selectedCalendarEvent.previous || '').toLowerCase();

        const isHoliday = nameLower.includes('holiday') || nameLower.includes('day off') || nameLower.includes('closed') || actualLower.includes('holiday') || forecastLower.includes('holiday') || previousLower.includes('holiday');
        const isSpeechOrMeeting = nameLower.includes('speak') || nameLower.includes('speech') || nameLower.includes('testimony') || nameLower.includes('testifies') || nameLower.includes('audits') || nameLower.includes('meeting') || nameLower.includes('press conference') || nameLower.includes('minutes') || actualLower.includes('tentative') || forecastLower.includes('tentative');
        const isNonNumerical = isHoliday || isSpeechOrMeeting || (!/\d/.test(selectedCalendarEvent.actual || '') && !/\d/.test(selectedCalendarEvent.forecast || '') && !/\d/.test(selectedCalendarEvent.previous || ''));

        const displayMeaningBurmese = isHoliday 
          ? "ဘဏ်ပိတ်ရက် (Bank Holiday) ဖြစ်သည်။ ယနေ့တွင် သက်ဆိုင်ရာ နိုင်ငံ၏ ငွေရေးကြေးရေးဌာနများနှင့် ဘဏ်လုပ်ငန်းများ ပိတ်ထားမည်ဖြစ်သဖြင့် စျေးကွက်အတွင်း အရောင်းအဝယ် ပမာဏ (Trading Volume) အလွန်နည်းပါးနေနိုင်ပြီး ကိန်းဂဏန်းအခြေပြု သောင်းပြောင်းလှုပ်ခတ် သတင်းထုတ်ပြန်ချက်များ ထွက်ပေါ်လာမည် မဟုတ်ပါ။"
          : (isSpeechOrMeeting 
              ? "ဗဟိုဘဏ်ဥက္ကဋ္ဌ သို့မဟုတ် ငွေကြေးပေါ်လစီ အကြံပေးအဖွဲ့ဝင်များ၏ နှုတ်ပြောကြားချက်/ဟောပြောပွဲ သို့မဟုတ် အစည်းအဝေးမှတ်တမ်း ဖြစ်သည်။ ကိန်းဂဏန်းအခြေပြု သတင်းမျိုးမဟုတ်သော်လည်း စကားလုံး တစ်လုံးချင်းစီ၏ အဓိပ္ပာယ် (Tone: Hawkish vs Dovish) အပေါ်မူတည်၍ စျေးကွက် ရုတ်တရက် လှုပ်ရှားပြောင်းလဲနိုင်သည်။"
              : details.meaningBurmese);

        const displayMeaningEnglish = isHoliday 
          ? "Official Bank Holiday / Market closure. Trading participation and institutional desks are inactive, resulting in lower network depth. No numerical data release occurs."
          : (isSpeechOrMeeting 
              ? "Policy statement, panel discussion, or speech by central bankers. Systemic volatility depends on the speaker's tone and sentiment cueing, rather than numeric comparisons."
              : details.meaningEnglish);

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
                      isHoliday 
                        ? 'text-amber-500 font-bold' 
                        : isSpeechOrMeeting 
                          ? 'text-indigo-400 font-bold' 
                          : selectedCalendarEvent.actual 
                            ? (selectedCalendarEvent.impact === 'High' ? 'text-rose-400' : 'text-emerald-400') 
                            : 'text-slate-500 font-normal italic'
                    }`}>
                      {isHoliday ? 'HOLIDAY' : (isSpeechOrMeeting ? 'SPEECH / MEETING' : (selectedCalendarEvent.actual || 'Pending Release'))}
                    </strong>
                  </div>
                  <div className="text-center py-2 border-r border-slate-800/40">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider">Forecast (စစ်တမ်း)</span>
                    <strong className="text-sm font-mono text-slate-300 mt-1 block">
                      {isHoliday ? 'N/A' : (isSpeechOrMeeting ? 'VERBAL INFO' : (selectedCalendarEvent.forecast || 'N/A'))}
                    </strong>
                  </div>
                  <div className="text-center py-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider">Previous (ယခင်)</span>
                    <strong className="text-sm font-mono text-slate-400 mt-1 block">
                      {isHoliday ? 'N/A' : (isSpeechOrMeeting ? 'N/A' : (selectedCalendarEvent.previous || 'N/A'))}
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
                      {displayMeaningBurmese}
                    </p>
                    <p className="text-xs text-slate-400 font-normal leading-relaxed italic border-t border-slate-800/40 pt-2 font-sans">
                      {displayMeaningEnglish}
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

                  {/* Dynamic DXY Correlation Percentage Gauge */}
                  <div className="bg-indigo-950/20 border border-indigo-500/15 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                        <span className="text-[10px] font-mono text-indigo-400 font-bold">DXY Correlation</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-300 font-bold block">Dollar Reverse Relationship Status</span>
                        <span className="text-[9px] text-rose-400/90 block font-medium">NQ & ES move in opposite direction to USD/DXY sentiment // DXY နှင့် ပြောင်းပြန်ဆက်သွယ်ချက်</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 bg-[#0c0d12]/90 border border-slate-800 px-3 py-1 rounded-lg">
                      <span className="text-xs font-mono font-black text-rose-400 block tracking-wider">
                        {details.dxyCorrelation}% REVERSE CORRELATION
                      </span>
                      <span className="text-[8px] text-slate-500 block font-mono uppercase">
                        Active Hedge Factor
                      </span>
                    </div>
                  </div>
                </div>

                {/* Part C: Scenario Analysis Columns or Holiday/Speech Special Insights */}
                {isNonNumerical ? (
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 tracking-wider uppercase block">
                      💡 Non-Numerical Event Guidelines / နံပါတ်အခြေပြုမဟုတ်သော သတင်းလေ့လာဆန်းစစ်ချက်
                    </span>
                    
                    <div className="p-4.5 rounded-xl border border-indigo-900/35 bg-indigo-950/5 hover:bg-slate-900/60 transition-colors">
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-2.5 border-b border-white/5 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                          <h4 className="text-xs font-bold font-mono tracking-wide text-indigo-300 uppercase">
                            {isHoliday ? 'BANK HOLIDAY // MARKET LIQUIDITY ANALYSIS' : 'POLICY SPEECH & SENTIMENT CUE ANALYSIS'}
                          </h4>
                        </div>
                        <span className="text-[9px] font-mono font-extrabold text-indigo-400 bg-indigo-950/45 px-2 py-0.5 rounded border border-indigo-900/30">
                          {isHoliday ? 'LOW PARTICIPATION' : 'HIGH INTUITIVE VOLATILITY'}
                        </span>
                      </div>

                      {isHoliday ? (
                        <div className="space-y-3">
                          <p className="text-[12px] text-slate-300 font-medium leading-relaxed Burmese font-sans">
                            ယခုဖြစ်စဉ်သည် ဘဏ်ပိတ်ရက် (Bank Holiday) ဖြစ်သောကြောင့် နှိုင်းယှဉ်တွက်ချက်ရမည့် စီးပွားရေး ကိန်းဂဏန်း (Forecast/Expectation) များ မရှိပါ။ သို့သော်လည်း အရောင်းအဝယ်ပြုလုပ်သူ အဖွဲ့အစည်းကြီးများ (Institutional Desks) ပိတ်ထားသဖြင့် <strong>စျေးကွက်၏ အရည်အသွေး (Liquidity) အလွန် နိမ့်ပါးနေနိုင်ပါသည်။</strong> Spread များ ကြီးမားကျယ်ပြန့်လာခြင်း၊ ပုံမှန်မဟုတ်သော တစ်ဖက်သတ် စျေးခုန်ထွက်ခြင်း (Slippage) သို့မဟုတ် လုံးဝလှုပ်ရှားမှုမရှိဘဲ တန့်နေခြင်း (Sideways/Chop) ဖြစ်ပေါ်လာတတ်ပါသည်။ Traders များအနေဖြင့် Leverage ကို အတတ်နိုင်ဆုံး လျှော့ချကာ အန္တရာယ်ထိန်းသိမ်းရန် အထူးအကြံပြုအပ်ပါသည်။
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 pt-1.5">
                            <div className="bg-slate-900/50 p-2.5 rounded border border-slate-800/40">
                              <span className="text-indigo-400 font-bold block mb-1">📌 NQ / ES Futures:</span>
                              <span className="leading-normal font-sans">Trading activity လျော့နည်းသဖြင့် သဘာဝမဟုတ်သော erratic spikes များ ဖြစ်ပေါ်တတ်သည်။</span>
                            </div>
                            <div className="bg-slate-900/50 p-2.5 rounded border border-slate-800/40">
                              <span className="text-emerald-400 font-bold block mb-1">📌 DXY Dollar Index:</span>
                              <span className="leading-normal font-sans">ဒေါ်လာတန်ဖိုးသည် session ပိတ်ရက်အတိုင်း sideways range ဖြင့်သာ ငြိမ်နေလေ့ရှိသည်။</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-[12px] text-slate-300 font-medium leading-relaxed Burmese font-sans">
                            ယခုဖြစ်စဉ်သည် ဗဟိုဘဏ်အရာရှိများ၏ ဟောပြောပွဲ သို့မဟုတ် မူဝါဒဆွေးနွေးပွဲ (Speech / Conference) ဖြစ်သောကြောင့် နှိုင်းယှဉ်ရန် ကိန်းဂဏန်းများအတိအကျ မရှိပါ။ သို့သော်လည်း ၎င်းတို့ပြောကြားမည့် <strong>စကားလုံးတစ်လုံးချင်းစီ၏ လေသံ (Tone) က စျေးကွက်ကို တိုက်ရိုက်လှုပ်ခတ်စေပါမည်။</strong> အတိုးတိုးမြှင့်မည့်အရိပ်အယောင် (Hawkish - စတော့စျေးကွက် Bearish) သို့မဟုတ် အတိုးနှုန်းလျှော့ချမည့် အရိပ်အယောင် (Dovish - စတော့စျေးကွက် Bullish) အသုံးအနှုန်းများအပေါ် အယ်လ်ဂိုရစ်သမ်စနစ်များ (Algorithmic Trading Systems) က ချက်ချင်း တုံ့ပြန်ကုန်သွယ်လေ့ရှိသဖြင့် စကားပြောနေချိန်အတွင်း Volatility မြင့်မားမှုကို သတိပြုပါ။
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 pt-1.5">
                            <div className="bg-slate-900/50 p-2.5 rounded border border-slate-800/40">
                              <span className="text-rose-455 font-bold block mb-1">📣 Hawkish tone (တင်းကျပ်သောလေသံ)</span>
                              <span className="leading-normal font-sans">အတိုးနှုန်း ဆက်လက်မြှင့်တင်ရန် ပြောလျှင် NQ/ES သို့ အရောင်းဖိအား ဝင်လာနိုင်ပြီး DXY ဒေါ်လာ တက်ပါမည်။</span>
                            </div>
                            <div className="bg-slate-900/50 p-2.5 rounded border border-slate-800/40">
                              <span className="text-emerald-400 font-bold block mb-1">📣 Dovish tone (ဖြေလျှော့သောလေသံ)</span>
                              <span className="leading-normal font-sans">အတိုးနှုန်း အမြန်လျှော့ချရန် အရိပ်အယောင်ပေးပါက NQ/ES futures များ အပြင်းအထန် Rally တက်ပါမည်။</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
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

                            {/* Dynamic Economist Relationship Note */}
                            <div className="mt-2.5 pt-2 border-t border-white/5 flex gap-2 justify-between items-center text-[9px] text-slate-500 font-mono">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                <span className="uppercase text-[8px] tracking-wider text-slate-400">CORRELATION METRIC</span>
                              </span>
                              <span className="text-rose-400 font-extrabold text-right">
                                {details.dxyCorrelation}% Negative Tracking (Reverse Correlation with DXY)
                              </span>
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

                            {/* Dynamic Economist Relationship Note */}
                            <div className="mt-2.5 pt-2 border-t border-white/5 flex gap-2 justify-between items-center text-[9px] text-slate-500 font-mono">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500/60"></span>
                                <span className="uppercase text-[8px] tracking-wider text-slate-400">CORRELATION METRIC</span>
                              </span>
                              <span className="text-amber-500/80 font-extrabold text-right">
                                {details.dxyCorrelation}% Reverse Link established with DXY
                              </span>
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

                            {/* Dynamic Economist Relationship Note */}
                            <div className="mt-2.5 pt-2 border-t border-white/5 flex gap-2 justify-between items-center text-[9px] text-slate-500 font-mono">
                              <span className="flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${isBullish ? 'bg-emerald-500 animate-pulse' : isBearish ? 'bg-rose-500' : 'bg-slate-500'}`}></span>
                                <span className="uppercase text-[8px] tracking-wider text-slate-400">CORRELATION METRIC</span>
                              </span>
                              <span className={`${isBullish ? 'text-emerald-400' : isBearish ? 'text-rose-400' : 'text-slate-300'} font-extrabold text-right`}>
                                {details.dxyCorrelation}% Negative Tracking (Reverse Correlation with DXY)
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                    </div>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="bg-[#12141c] px-6 py-4 border-t border-[#23252f] flex justify-between items-center shrink-0">
                <span className="text-[11px] text-slate-500 font-mono">
                  Quantum Terminal Pro // Macro scenarios
                </span>
                <button 
                  onClick={() => setSelectedCalendarEvent(null)}
                  className="text-white bg-indigo-600 hover:bg-indigo-500 font-bold px-5 py-2 rounded-xl transition-all text-xs shadow-lg cursor-pointer animate-pulse"
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

      {/* CLICK PARTICLE BLOOM OVERLAY */}
      <div className="fixed inset-0 pointer-events-none z-[1000000] overflow-hidden">
        {clickParticles.map(p => (
          <div
            key={p.id}
            className={`absolute animate-particle-bloom ${
              p.shape === 'petal' 
                ? 'rounded-tl-[80%] rounded-br-[80%] rounded-tr-[20%] rounded-bl-[20%]' 
                : p.shape === 'diamond'
                ? 'rotate-45'
                : 'rounded-full'
            }`}
            style={{
              '--tx': `${p.tx}px`,
              '--ty': `${p.ty}px`,
              '--rot': `${p.rotation}deg`,
              left: `${p.x}px`,
              top: `${p.y}px`,
              width: `${p.size}px`,
              height: `${p.shape === 'petal' ? p.size * 1.45 : p.size}px`,
              backgroundColor: p.color,
              boxShadow: `0 0 10px ${p.color}, 0 0 3px rgba(255, 255, 255, 0.9)`,
            } as React.CSSProperties}
          />
        ))}
      </div>

    </div>
  );
}
