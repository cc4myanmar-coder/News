import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  ExternalLink, 
  Facebook, 
  Youtube, 
  FileText, 
  Award, 
  Flame, 
  HelpCircle, 
  Layers, 
  TrendingUp, 
  ShieldAlert, 
  ArrowRight,
  Clock,
  ThumbsUp,
  Bookmark
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  platform: 'Facebook' | 'YouTube' | 'Guide' | 'Discord';
  url: string;
  category: 'Trading Concepts' | 'Risk Management' | 'Prop Firms' | 'Market Psychology';
  description: string;
  tags: string[];
  date: string;
  readTime: string;
  votes: number;
  featured?: boolean;
}

export const KnowledgeHub: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // Premium Curated Content for Burmese Traders
  const knowledgeData: ContentItem[] = [
    {
      id: 'futures-vs-cfd',
      title: "Future နဲ့ CFD (Contract For Difference) ကြားက Pros & Cons",
      platform: 'Facebook',
      url: "https://www.facebook.com/share/p/1J89PyJCcm/",
      category: 'Trading Concepts',
      description: "Futures ကန်ထရိုက်နှင့် CFD မြှင့်တင်ရောင်းဝယ်မှုတို့၏ အဓိကအားသာချက်၊ အားနည်းချက် နှိုင်းယှဉ်ချက်များကို မြန်မာလို အသေးစိတ် ရှင်းလင်းတင်ပြချက်။ Margin တွက်ချက်ပုံ၊ Regulation နှင့် အမှန်တကယ် ကုန်သွယ်မှုတွင် ထည့်သွင်းစဉ်းစားရမည့် အချက်များ ပါဝင်သည်။",
      tags: ["Futures", "CFD", "Education", "Trading Concepts"],
      date: "June 18, 2026",
      readTime: "5 min read",
      votes: 142,
      featured: true
    },
    {
      id: 'drawdown-rules',
      title: "Prop Firm Drawdown Rules & Management / အရှုံးထိန်းသိမ်းပုံ မူဝါဒ များ",
      platform: 'Facebook',
      url: "https://www.facebook.com/RoadToFundedTrader/",
      category: 'Risk Management',
      description: "Prop Firm (ဥပမာ Apex, MyForexFunds သို့မဟုတ် အခြား Funding Programs များ) တွင် အရေးအကြီးဆုံးဖြစ်သော Daily Drawdown (နေ့စဉ် အမြင့်ဆုံး အရှုံးသတ်မှတ်ချက်) နှင့် Trailing Max Drawdown တွက်ချက်ပုံ အမှန်ကို လက်တွေ့ သာဓကများဖြင့် ရှင်းပြချက်။",
      tags: ["Drawdown", "Prop Firm", "Risk Rules"],
      date: "June 12, 2026",
      readTime: "8 min read",
      votes: 98,
      featured: true
    },
    {
      id: 'nq-vs-es-specs',
      title: "Nasdaq (NQ) vs S&P 500 (ES) Futures: Point Value & Specs",
      platform: 'Guide',
      url: "https://discord.gg/zMNgEjNSGm",
      category: 'Trading Concepts',
      description: "NQ Futures (Nasdaq 100) နှင့် ES Futures (S&P 500) တို့၏ contract size များ၊ အနည်းဆုံး စျေးနှုန်းပြောင်းလဲမှု (Tick Size/Value) နှင့် trading hours များအကြောင်း သောင်းပြောင်းထွေလာ လမ်းညွှန်ချက်။ Micro (MNQ/MES) ကုန်သွယ်မည့်သူများ မဖြစ်မနေ သိထားသင့်သည်။",
      tags: ["Contract Specs", "NQ", "ES", "Micro Futures"],
      date: "May 28, 2026",
      readTime: "6 min read",
      votes: 74
    },
    {
      id: 'prop-firm-mindset',
      title: "Funded Account ရရှိပြီးနောက် အကောင့်မပျက်အောင် ထိန်းသိမ်းရမည့် စိတ္တဇ စည်းကမ်းများ",
      platform: 'YouTube',
      url: "https://www.youtube.com/@roadtofundedtrader",
      category: 'Market Psychology',
      description: "Trader များ Evaluation အောင်မြင်ပြီး Funded Account (PA accounts / Live Accounts) ရောက်လျှင် အများဆုံး အမိုက်မှား ဖြစ်တတ်သော ရောဂါများ (Overtrading, Revenge Trading) ကိုကျော်လွှားပြီး တည်ငြိမ်သော ဝင်ငွေ ထုတ်ယူနိုင်ရန် (Payouts) လိုက်နာရမည့် Mindset ပိုင်းဆိုင်ရာ လေ့ကျင့်ခန်း။",
      tags: ["Mindset", "Payouts", "Psychology"],
      date: "May 15, 2026",
      readTime: "12 min video",
      votes: 115
    },
    {
      id: 'news-trading-avoidance',
      title: "High-Impact News ဖြစ်ပေါ်ချိန်တွင် အရောင်းအဝယ် ရှောင်ရှားရမည့် Golden Rules များ",
      platform: 'Guide',
      url: "https://www.facebook.com/RoadToFundedTrader/",
      category: 'Risk Management',
      description: "FOMC Meeting, CPI Inflation data နှင့် Non-Farm Payrolls (NFP) ကဲ့သို့သော High impact တာဆွဲအား ပြင်းထန်လှသော သတင်းများ စျေးကွက်ထဲ မထွက်မီနှင့် ထွက်ပြီးနောက် ၅ မိနစ်အတွင်း အဘယ်ကြောင့် Order များ မတင်သင့်သနည်း။ Slip page နှင့် Liquidity gap များအကြောင်း သရုပ်ဖော်ချက်။",
      tags: ["News Trading", "CPI", "FOMC", "Slippage"],
      date: "April 05, 2026",
      readTime: "4 min read",
      votes: 83
    }
  ];

  // Filter Logic
  const filteredData = knowledgeData.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesPlatform = selectedPlatform === 'All' || item.platform === selectedPlatform;

    return matchesSearch && matchesCategory && matchesPlatform;
  });

  const toggleSave = (id: string) => {
    if (savedIds.includes(id)) {
      setSavedIds(savedIds.filter(savedId => savedId !== id));
    } else {
      setSavedIds([...savedIds, id]);
    }
  };

  const getPlatformIcon = (platform: ContentItem['platform']) => {
    switch (platform) {
      case 'Facebook':
        return <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />;
      case 'YouTube':
        return <Youtube className="w-3.5 h-3.5 text-[#FF0000]" />;
      case 'Discord':
        return <Layers className="w-3.5 h-3.5 text-[#5865F2]" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const categories = ['All', 'Trading Concepts', 'Risk Management', 'Prop Firms', 'Market Psychology'];
  const platforms = ['All', 'Facebook', 'YouTube', 'Guide', 'Discord'];

  return (
    <div className="bg-[#0b0c10] border border-[#1b1b1e] rounded-xl overflow-hidden font-sans shadow-lg flex flex-col h-full">
      
      {/* Header Block */}
      <div className="bg-gradient-to-r from-[#0d0e15] to-[#12131b] p-4 border-b border-[#1b1b1e] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <BookOpen className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              RTFT KNOWLEDGE DISCOVERY HUB
              <span className="text-[10px] text-indigo-400 px-1.5 py-0.2 rounded bg-indigo-950/45 border border-indigo-900/30">ပညာမျှဝေခြင်း</span>
            </h3>
          </div>
          <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
            Curated Specific Social Media Post Library & Concepts for Learning (မြန်မာလို လမ်းညွှန်ချက်များ)
          </p>
        </div>

        {/* Counter */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-950/20 border border-indigo-900/40 shrink-0">
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">
            {filteredData.length} Guides Available
          </span>
        </div>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="p-3 bg-slate-950/30 border-b border-[#1b1b1e] space-y-2.5">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="အကြောင်းအရာ သို့မဟုတ် သော့ချက်စာလုံးဖြင့် ရှာဖွေရန်... (Search concepts, e.g. CDF, Drawdown)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#101014] border border-slate-900 focus:border-indigo-500/50 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-300 focus:outline-none placeholder-slate-600 font-sans transition-all"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex flex-col gap-2">
          
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider select-none shrink-0">TOPIC:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[9px] font-sans font-bold px-2 py-0.5 rounded-full transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' 
                    : 'bg-[#101014] text-slate-400 hover:text-slate-200 border border-slate-900/80 hover:border-slate-800'
                }`}
              >
                {cat === 'All' ? 'အကုန်လုံး' : cat}
              </button>
            ))}
          </div>

          {/* Platforms */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider select-none shrink-0">SOURCE:</span>
            {platforms.map((plat) => (
              <button
                key={plat}
                onClick={() => setSelectedPlatform(plat)}
                className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md transition-all shrink-0 cursor-pointer ${
                  selectedPlatform === plat
                    ? 'bg-[#1e1b4b] text-slate-200 border border-indigo-500/40'
                    : 'bg-[#101014] text-slate-500 hover:text-slate-300 border border-slate-900/80'
                }`}
              >
                {plat === 'All' ? 'ALL SOURCES' : plat.toUpperCase()}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* Grid Content List */}
      <div className="p-3 bg-slate-950/10 space-y-2.5 max-h-[460px] overflow-y-auto scrollbar-thin flex-1">
        
        {filteredData.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center gap-3">
            <HelpCircle className="w-8 h-8 text-slate-700 animate-pulse" />
            <span>လောလောဆယ် ရှာဖွေထားသော အကြောင်းအရာ မရှိပါ။</span>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setSelectedPlatform('All'); }} 
              className="text-[10px] bg-[#101014] hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-900/40 text-slate-400 hover:text-indigo-400 px-3 py-1 rounded transition-all cursor-pointer"
            >
              Filters ပြန်ထုတ်ရန်
            </button>
          </div>
        ) : (
          filteredData.map((item) => {
            const isSaved = savedIds.includes(item.id);
            const isPlatformFb = item.platform === 'Facebook';
            const isPlatformYt = item.platform === 'YouTube';
            const isPlatformDiscord = item.platform === 'Discord';

            let platformBg = 'bg-slate-900/20 text-slate-400 border-slate-850';
            if (isPlatformFb) platformBg = 'bg-[#1877F2]/4 text-[#1877F2] border-[#1877F2]/15';
            if (isPlatformYt) platformBg = 'bg-[#FF0000]/4 text-[#FF0000] border-[#FF0000]/15';
            if (isPlatformDiscord) platformBg = 'bg-[#5865F2]/4 text-[#5865F2] border-[#5865F2]/15';

            return (
              <div 
                key={item.id}
                className={`group relative rounded-xl border p-3.5 transition-all duration-300 ${
                  item.featured 
                    ? 'bg-indigo-950/5 border-indigo-900/35 hover:border-indigo-500/40 shadow-md shadow-indigo-950/10' 
                    : 'bg-[#0d0e14]/60 border-[#1c1c22] hover:border-slate-800 hover:bg-[#0f1016]'
                }`}
              >
                {/* Featured Glowing Indicator */}
                {item.featured && (
                  <span className="absolute top-0 right-10 translate-y-[-50%] text-[8px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 px-2 py-0.2 rounded-full uppercase tracking-widest leading-none">
                    ⭐ Featured Link
                  </span>
                )}

                {/* Badge and Save Ribbon */}
                <div className="flex items-center justify-between gap-2.5 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8.5px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border flex items-center gap-1 ${platformBg}`}>
                      {getPlatformIcon(item.platform)}
                      <span>{item.platform}</span>
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.readTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleSave(item.id)}
                      className="p-1 rounded hover:bg-slate-900 cursor-pointer transition-colors"
                      title={isSaved ? 'Bookmark Saved' : 'Save bookmark'}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'text-indigo-400 fill-indigo-400/40' : 'text-slate-500 hover:text-slate-300'}`} />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h4 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors leading-snug tracking-normal">
                  {item.title}
                </h4>

                {/* Description */}
                <p className="text-xs text-slate-400 leading-relaxed font-sans mt-2">
                  {item.description}
                </p>

                {/* Tag Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-900/60 justify-between">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="text-[8px] font-mono text-slate-500 group-hover:text-slate-400 px-1.5 py-0.2 rounded bg-slate-950 border border-slate-900"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Redirection Link Action Button */}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-mono font-bold bg-indigo-950/40 hover:bg-indigo-600 border border-indigo-900/60 hover:border-indigo-500 text-indigo-400 hover:text-white px-3 py-1 rounded-md transition-all cursor-pointer shadow-sm group/btn shrink-0 select-none"
                  >
                    <span>လေ့လာရန် ဖတ်ရန်</span>
                    <ExternalLink className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </a>
                </div>

              </div>
            );
          })
        )}

      </div>

      {/* Helpful Info Footer */}
      <div className="bg-slate-950/40 border-t border-[#1b1b1e] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-[9px] font-mono text-slate-500 uppercase leading-none">
            We list specific posts containing high-value strategies so you can bypass Facebook noise.
          </span>
        </div>
        <span className="text-[9px] font-mono text-indigo-400 font-bold shrink-0">Updated Weekly</span>
      </div>

    </div>
  );
};
