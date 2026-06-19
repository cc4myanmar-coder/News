import React, { useState, useEffect } from 'react';
import { CentralBankRate } from '../types';
import { 
  Building2, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Globe, 
  ArrowRight, 
  Clock, 
  HelpCircle,
  ChevronsUp,
  ChevronsDown,
  Info
} from 'lucide-react';

interface CentralBankRatesPanelProps {
  onLexiconOpen?: (key: string) => void;
}

export const CentralBankRatesPanel: React.FC<CentralBankRatesPanelProps> = ({ onLexiconOpen }) => {
  const [rates, setRates] = useState<CentralBankRate[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('fed');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [syncSource, setSyncSource] = useState<string>('local_system');
  const [isGeminiStandby, setIsGeminiStandby] = useState<boolean>(false);

  const fetchRates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/central-bank-rates');
      if (!response.ok) {
        throw new Error('API server returned error status');
      }
      const data = await response.json();
      if (data && data.rates) {
        setRates(data.rates);
        setSyncSource(data.source || 'gemini_grounded_live');
        if (data.geminiStandby) {
          setIsGeminiStandby(true);
        } else {
          setIsGeminiStandby(false);
        }
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err: any) {
      console.error("Failed to load central bank rates:", err);
      setError("ဗဟိုဘဏ် အတိုးနှုန်းဒေတာများကို ဆွဲယူ၍မရပါ။ ပြန်လည်ကြိုးစားကြည့်ပါ။");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const selectedBank = rates.find(r => r.id === selectedBankId);

  return (
    <div className="bg-[#0b0c10] border border-[#1b1b1e] rounded-xl overflow-hidden font-sans shadow-lg">
      
      {/* Header Block */}
      <div className="bg-gradient-to-r from-[#0d0e15] to-[#12131b] p-4 border-b border-[#1b1b1e] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Building2 className="w-4.5 h-4.5 text-cyan-400 animate-pulse" />
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              GLOBAL CENTRAL BANKS RATES & OUTLOOK
              <span className="text-[10px] text-indigo-400 px-1.5 py-0.2 rounded bg-indigo-950/45 border border-indigo-900/30">ဗဟိုဘဏ်များ</span>
            </h3>
          </div>
          <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
            Major central banks' current interest rates, next meeting dates, expectations and direct trading implications (မြန်မာလို)
          </p>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
          <span className="text-[9px] font-mono text-slate-500 shrink-0">
            SOURCE: <strong className="text-indigo-400 uppercase">{syncSource.replace('_', ' ')}</strong>
          </span>
          <button
            onClick={fetchRates}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-[#101014] hover:bg-slate-800 disabled:opacity-50 text-slate-300 hover:text-white font-mono text-[10px] font-bold px-2.5 py-1 rounded border border-slate-800/80 transition-all cursor-pointer shadow-sm select-none"
            title="Sourced live with Google Search via Gemini API"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Rates</span>
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-6 text-center text-rose-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <span>{error}</span>
          <button 
            onClick={fetchRates} 
            className="mt-2 text-xs bg-red-950/50 border border-red-900 text-slate-300 hover:text-white px-3 py-1 rounded.svg text-center"
          >
            Retry Fetch
          </button>
        </div>
      ) : rates.length === 0 ? (
        <div className="p-12 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin"></div>
          <span>Loading central banks data stream...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#1b1b1e]">
          
          {/* Left list - grid layout (5 cols on lg) */}
          <div className="lg:col-span-4 p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 max-h-[250px] lg:max-h-[385px] overflow-y-auto scrollbar-thin">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase px-1 block tracking-wider col-span-full">
              Select Central Bank
            </span>
            {rates.map((bank) => {
              const isSelected = bank.id === selectedBankId;
              let stanceColor = 'bg-slate-900 border-slate-800 text-slate-400';
              if (bank.stance === 'Hawkish') stanceColor = 'bg-red-950/40 border-red-900/30 text-red-400';
              if (bank.stance === 'Dovish') stanceColor = 'bg-emerald-950/40 border-emerald-900/30 text-emerald-400';
              if (bank.stance === 'Neutral') stanceColor = 'bg-indigo-950/40 border-indigo-900/30 text-indigo-400';

              return (
                <button
                  key={bank.id}
                  onClick={() => setSelectedBankId(bank.id)}
                  className={`w-full text-left p-2.5 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-950/20 border-indigo-500/40 shadow-inner text-white' 
                      : 'bg-slate-950/30 border-slate-900 hover:bg-slate-900/50 hover:border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base leading-none select-none shrink-0">{bank.logo || '🌐'}</span>
                    <div className="min-w-0">
                      <span className={`text-[11px] font-bold block truncate tracking-wide ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {bank.name.split(' - ')[0]}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono text-slate-500 leading-none">Rate:</span>
                        <strong className="text-[10px] font-mono text-indigo-400 leading-none">{bank.rate}</strong>
                      </div>
                    </div>
                  </div>
                  <span className={`text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded border ${stanceColor} shrink-0`}>
                    {bank.stance}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right details panel (8 cols on lg) */}
          <div className="lg:col-span-8 p-4 flex flex-col justify-between max-h-[385px] overflow-y-auto scrollbar-thin bg-slate-950/15">
            {selectedBank ? (
              <div className="space-y-4">
                
                {/* Meta details header band */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-900/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xl select-none">{selectedBank.logo}</span>
                    <div>
                      <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                        {selectedBank.name}
                      </h4>
                      <span className="text-[9px] text-slate-600 block font-mono">
                        LATEST RATE ACTION: {selectedBank.lastDecision}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#0f1016] border border-slate-900">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className="text-[9px] font-mono text-slate-400">NEXT MEETING: <strong className="text-indigo-400">{selectedBank.nextMeeting}</strong></span>
                  </div>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 bg-[#0d0e14] border border-slate-900 rounded-lg text-center font-mono">
                    <span className="text-[9px] text-slate-500 uppercase block tracking-wider">Current Rate</span>
                    <strong className="text-xs text-white mt-0.5 block">{selectedBank.rate}</strong>
                  </div>
                  <div className="p-2 bg-[#0d0e14] border border-slate-900 rounded-lg text-center font-mono">
                    <span className="text-[9px] text-slate-500 uppercase block tracking-wider">Previous Rate</span>
                    <strong className="text-xs text-slate-400 mt-0.5 block">{selectedBank.previousRate}</strong>
                  </div>
                  <div className="p-2 bg-[#0d0e14] border border-slate-900 rounded-lg text-center font-mono">
                    <span className="text-[9px] text-slate-500 uppercase block tracking-wider">Inflation (CPI)</span>
                    <strong className="text-xs text-rose-400 mt-0.5 block">{selectedBank.inflationRate}</strong>
                  </div>
                  <div className="p-2 bg-[#0d0e14] border border-slate-900 rounded-lg text-center font-mono">
                    <span className="text-[9px] text-slate-500 uppercase block tracking-wider">Target / GDP</span>
                    <strong className="text-xs text-slate-400 mt-0.5 block">
                      {selectedBank.inflationTarget} / {selectedBank.gdpGrowth}
                    </strong>
                  </div>
                </div>

                {/* Burmese Expectations */}
                <div className="p-3 bg-indigo-950/10 border border-indigo-900/20 rounded-xl space-y-1">
                  <h5 className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 pb-1 border-b border-indigo-900/10">
                    <TrendingUp className="w-3.5 h-3.5" /> 
                    EXPECTATIONS & CONSENSUS // အတိုးနှုန်း မျှော်မှန်းချက်
                  </h5>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
                    {selectedBank.expectation}
                  </p>
                </div>

                {/* Trading Implications */}
                <div className="p-3 bg-amber-950/10 border border-amber-900/20 rounded-xl space-y-1">
                  <h5 className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5 pb-1 border-b border-amber-900/10">
                    <TrendingDown className="w-3.5 h-3.5" /> 
                    TRADING IMPLICATIONS // အရောင်းအဝယ် လားရာ သုံးသပ်ချက်
                  </h5>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
                    {selectedBank.tradingImplication}
                  </p>
                </div>

                {/* Optional Burma dictionary action button */}
                {onLexiconOpen && (
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => onLexiconOpen(selectedBank.stance === 'Hawkish' ? 'Hawkish Stance' : (selectedBank.stance === 'Dovish' ? 'Dovish' : 'Neutral Stance'))}
                      className="text-[9px] font-mono text-slate-500 hover:text-indigo-400 flex items-center gap-1 select-none underline cursor-pointer"
                    >
                      <Info className="w-3 h-3" />
                      <span>{selectedBank.stance} ဆိုသည်မှာ ကုန်သည်များအတွက် အဘယ်နည်း။</span>
                    </button>
                  </div>
                )}

              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                Select a Central Bank to display detailed expectations
              </div>
            )}
          </div>

        </div>
      )}

      {/* Warnings & standby indicators */}
      {isGeminiStandby && (
        <div className="bg-amber-900/10 border-t border-amber-950/20 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-[9px] font-mono text-amber-500 uppercase leading-none">
            Gemini stand-by mode: rates are sourced from verified global economic database.
          </span>
        </div>
      )}

    </div>
  );
};
