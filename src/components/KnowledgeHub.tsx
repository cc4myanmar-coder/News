import React, { useState, useEffect } from 'react';
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
  Clock, 
  Bookmark,
  Lock,
  Unlock,
  Plus,
  Edit,
  Trash2,
  X,
  LogOut,
  Check,
  RefreshCw,
  AlertTriangle,
  Eye,
  EyeOff
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
  
  // Dynamic State & Loader
  const [knowledgeData, setKnowledgeData] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Admin authentication states
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string>('');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [showPasscode, setShowPasscode] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Content publisher / editor modal states
  const [showEditorModal, setShowEditorModal] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  
  // Form fields state
  const [formId, setFormId] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formUrl, setFormUrl] = useState<string>('');
  const [formPlatform, setFormPlatform] = useState<ContentItem['platform']>('Facebook');
  const [formCategory, setFormCategory] = useState<ContentItem['category']>('Trading Concepts');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formTagsString, setFormTagsString] = useState<string>('');
  const [formReadTime, setFormReadTime] = useState<string>('5 min read');
  const [formFeatured, setFormFeatured] = useState<boolean>(false);

  // Load knowledge articles from API
  const fetchArticles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/knowledge-hub');
      if (!res.ok) throw new Error('Failed to load articles from pipeline database.');
      const data = await res.json();
      setKnowledgeData(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error loading articles');
    } finally {
      setIsLoading(false);
    }
  };

  // Check persistent admin state on mount
  useEffect(() => {
    fetchArticles();
    const storedToken = localStorage.getItem('rtft_admin_token');
    if (storedToken) {
      setAdminToken(storedToken);
      setIsAdmin(true);
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);
    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'အကောင့်ဝင်ရန် passcode မမှန်ကန်ပါ။');
      }

      const data = await res.json();
      localStorage.setItem('rtft_admin_token', data.token);
      setAdminToken(data.token);
      setIsAdmin(true);
      setShowAuthModal(false);
      setPasscode('');
    } catch (err: any) {
      setAuthError(err.message || 'Passcode checking failure.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('rtft_admin_token');
    setAdminToken('');
    setIsAdmin(false);
  };

  // Open editor modal for creating or editing
  const openEditor = (item?: ContentItem) => {
    setEditorError(null);
    if (item) {
      // Edit mode
      setFormId(item.id);
      setFormTitle(item.title);
      setFormUrl(item.url);
      setFormPlatform(item.platform);
      setFormCategory(item.category);
      setFormDescription(item.description);
      setFormTagsString(item.tags.join(', '));
      setFormReadTime(item.readTime);
      setFormFeatured(!!item.featured);
    } else {
      // Create mode
      setFormId('');
      setFormTitle('');
      setFormUrl('');
      setFormPlatform('Facebook');
      setFormCategory('Trading Concepts');
      setFormDescription('');
      setFormTagsString('');
      setFormReadTime('5 min read');
      setFormFeatured(false);
    }
    setShowEditorModal(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUrl.trim() || !formDescription.trim()) {
      setEditorError('ကျေးဇူးပြု၍ Title, URL နှင့် Description များကို မဖြစ်မနေ ဖြည့်ပေးပါ။');
      return;
    }

    setEditorError(null);
    setIsSaving(true);

    const tagsArray = formTagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const payload = {
      id: formId || undefined,
      title: formTitle,
      url: formUrl,
      platform: formPlatform,
      category: formCategory,
      description: formDescription,
      tags: tagsArray,
      readTime: formReadTime || '5 min read',
      featured: formFeatured
    };

    try {
      const res = await fetch('/api/knowledge-hub', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-passcode': adminToken
        },
        body: JSON.stringify({ item: payload })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'ပို့စ်တင်ခြင်း/ပြင်ဆင်ခြင်း မအောင်မြင်ပါ။');
      }

      await fetchArticles(); // Refresh list
      setShowEditorModal(false);
    } catch (err: any) {
      setEditorError(err.message || 'Error occurred while saving article.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('ဤပို့စ်ကို ဖျက်ပစ်ရန် သေချာပါသလား?')) return;

    try {
      const res = await fetch(`/api/knowledge-hub/${id}`, {
        method: 'DELETE',
        headers: { 
          'x-admin-passcode': adminToken
        }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'ပို့စ်ဖျက်ရန် အခွင့်မရှိပါ။');
      }

      await fetchArticles(); // Refresh
    } catch (err: any) {
      alert(err.message || 'Error deleting article');
    }
  };

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

  return (
    <div className="bg-[#0b0c10] border border-[#1b1b1e] rounded-xl overflow-hidden font-sans shadow-lg flex flex-col h-full relative">
      
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

        {/* Counter and Admin Control buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/40 px-2 py-0.5 rounded flex items-center gap-1">
                <Unlock className="w-2.5 h-2.5" />
                ADMIN MODE
              </span>
              <button
                onClick={() => openEditor()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors"
                title="ပို့စ်အသစ်တင်ရန်"
              >
                <Plus className="w-3 h-3" />
                <span>Post တင်ရန်</span>
              </button>
              <button
                onClick={handleAdminLogout}
                className="bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900/30 text-[10px] font-bold px-1.5 py-1 rounded cursor-pointer transition-colors"
                title="Admin Logout"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-[#101014] hover:bg-indigo-950/30 text-slate-400 hover:text-indigo-400 border border-slate-800 hover:border-indigo-900/30 text-[10px] font-mono font-semibold px-2.5 py-1 rounded flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Lock className="w-3 h-3" />
              <span>Admin Gateway</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#101014] border border-slate-800/80 shrink-0">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">
              {filteredData.length} Guides
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="p-3 bg-slate-950/30 border-b border-[#1b1b1e] space-y-2.5">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="အကြောင်းအရာ သို့မဟုတ် သော့ချက်စာလုံးဖြင့် ရှာဖွေရန်... (Search concepts, e.g. CFD, Drawdown)"
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
        
        {isLoading ? (
          <div className="py-20 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
            <span>လေ့လာရေးဆောင်းပါးများကို လှမ်းယူနေပါသည်...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
            <AlertTriangle className="w-7 h-7 text-rose-500 animate-bounce" />
            <span>ဆာဗာမှ ဒေတာဆွဲထုတ်ရန် မအောင်မြင်ပါ။</span>
            <button
              onClick={fetchArticles}
              className="mt-2 text-[10px] bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 px-3 py-1 rounded"
            >
              Retry Database Sync
            </button>
          </div>
        ) : filteredData.length === 0 ? (
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
                    {/* Admin editing tools on the card itself */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 mr-2 border-r border-slate-800 pr-2">
                        <button
                          onClick={() => openEditor(item)}
                          className="p-1 rounded bg-[#101014] border border-slate-800 hover:border-indigo-500/50 text-slate-400 hover:text-indigo-400 cursor-pointer"
                          title="ပို့စ်ကို ပြင်ဆင်ရန်"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(item.id)}
                          className="p-1 rounded bg-[#101014] border border-slate-800 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 cursor-pointer"
                          title="ပို့စ်ကို ဖျက်ရန်"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

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


      {/* ADMIN PASSCODE GATEWAY OVERLAY MODAL */}
      {showAuthModal && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0c0f] border border-[#1b1b1e] w-full max-w-sm rounded-xl overflow-hidden shadow-2xl animate-scale-in">
            
            <div className="bg-slate-950 p-4 border-b border-[#1b1b1e] flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono">
                <Lock className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">RTFT SECURE ADMIN GATEWAY</span>
              </div>
              <button 
                onClick={() => { setShowAuthModal(false); setAuthError(''); setPasscode(''); setShowPasscode(false); }}
                className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">ADMIN PASSCODE</label>
                <div className="relative">
                  <input
                    type={showPasscode ? "text" : "password"}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="••••••••••••"
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 rounded pl-3 pr-10 py-2 text-sm text-center font-mono focus:outline-none transition-all placeholder-slate-850"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
                    title={showPasscode ? "Hide passcode" : "Show passcode"}
                  >
                    {showPasscode ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="text-[11px] font-mono text-rose-400 bg-rose-950/20 border border-rose-900/30 p-2.5 rounded text-center">
                  ⚠️ {authError}
                </div>
              )}



              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAuthModal(false); setAuthError(''); setPasscode(''); setShowPasscode(false); }}
                  className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-400 py-2 rounded text-xs font-semibold cursor-pointer transition-all"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  {isAuthenticating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}
                  <span>အတည်ပြုမည်</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}


      {/* CONTENT PUBLISHER & EDITOR FORM MODAL */}
      {showEditorModal && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b0c0f] border border-[#1b1b1e] w-full max-w-md rounded-xl overflow-hidden shadow-2xl my-auto animate-scale-in">
            
            <div className="bg-slate-950 p-4 border-b border-[#1b1b1e] flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {formId ? 'EDIT CONTENT' : 'PUBLISH NEW POST'}
                </span>
              </div>
              <button 
                onClick={() => setShowEditorModal(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePost} className="p-4 space-y-3.5 text-left max-h-[440px] overflow-y-auto">
              
              {/* Title */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Post Title (ဆောင်းပါးခေါင်းစဉ်)</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Future နဲ့ CFD (Contract For Difference) ကြားက Pros & Cons"
                  className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500/50 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none transition-all"
                />
              </div>

              {/* URL */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Redirect URL (အသေးစိတ်ဖတ်ရန် လင့်ခ်)</label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://www.facebook.com/share/p/..."
                  className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500/50 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Platform */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Platform (မီဒီယာ)</label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value as ContentItem['platform'])}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500/50 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Facebook">Facebook</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Guide">Guide</option>
                    <option value="Discord">Discord</option>
                  </select>
                </div>

                {/* Read Time */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Read / Duration (ဖတ်ချိန်)</label>
                  <input
                    type="text"
                    value={formReadTime}
                    onChange={(e) => setFormReadTime(e.target.value)}
                    placeholder="5 min read"
                    className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500/50 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Category (ကဏ္ဍ)</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ContentItem['category'])}
                  className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500/50 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="Trading Concepts">Trading Concepts</option>
                  <option value="Risk Management">Risk Management</option>
                  <option value="Prop Firms">Prop Firms</option>
                  <option value="Market Psychology">Market Psychology</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Description (မြန်မာလို အတိုချုပ် ရှင်းလင်းချက်)</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="ဆောင်းပါးပါ အကြောင်းအရာအကျဉ်းကို မြန်မာလို ရေးသားဖော်ပြပေးပါ..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500/50 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none transition-all font-sans"
                />
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Tags (ကော်မာခြားပြီး ရေးပါ, e.g. Forex, Risk, Micro)</label>
                <input
                  type="text"
                  value={formTagsString}
                  onChange={(e) => setFormTagsString(e.target.value)}
                  placeholder="Futures, CFD, Education, Trading Concepts"
                  className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500/50 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none transition-all font-sans"
                />
              </div>

              {/* Featured toggle & form submission */}
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded border border-slate-900">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-300 font-bold uppercase font-mono">⭐ Featured (အထူးဆောင်းပါး)</span>
                  <span className="text-[8px] text-slate-500">ရှေ့ဆုံးမှ Highlight ပြသထားရန်</span>
                </div>
                <input
                  type="checkbox"
                  checked={formFeatured}
                  onChange={(e) => setFormFeatured(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500/25 border-slate-900 rounded cursor-pointer accent-indigo-500"
                />
              </div>

              {editorError && (
                <div className="text-[10px] font-mono text-rose-400 bg-rose-950/20 border border-rose-900/30 p-2 rounded text-center">
                  ⚠️ {editorError}
                </div>
              )}

              <div className="flex gap-2.5 pt-2 border-t border-[#1b1b1e] mt-4">
                <button
                  type="button"
                  onClick={() => setShowEditorModal(false)}
                  className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-400 py-2 rounded text-xs font-semibold cursor-pointer transition-all"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>အတည်ပြုမည်</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
