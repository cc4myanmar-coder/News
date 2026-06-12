import React, { useState, useRef, useEffect } from 'react';
import { Search, Globe, ChevronDown } from 'lucide-react';

export interface TimezoneOption {
  label: string;
  value: string;
  abbr: string;
}

export const TIMEZONES: TimezoneOption[] = [
  { label: '(GMT-11:00) American Samoa', value: 'Pacific/Pago_Pago', abbr: 'SST' },
  { label: '(GMT-10:00) Hawaii', value: 'Pacific/Honolulu', abbr: 'HST' },
  { label: '(GMT-09:00) Alaska', value: 'America/Anchorage', abbr: 'AKST' },
  { label: '(GMT-08:00) Pacific Time (Los Angeles, US & Canada)', value: 'America/Los_Angeles', abbr: 'PST' },
  { label: '(GMT-07:00) Mountain Time (Denver, US & Canada)', value: 'America/Denver', abbr: 'MST' },
  { label: '(GMT-06:00) Central Time (Chicago, US & Canada)', value: 'America/Chicago', abbr: 'CST' },
  { label: '(GMT-05:00) Eastern Time (New York, US & Canada)', value: 'America/New_York', abbr: 'EST' },
  { label: '(GMT-04:00) Atlantic Time (Halifax, Canada)', value: 'America/Halifax', abbr: 'AST' },
  { label: '(GMT-03:00) Buenos Aires', value: 'America/Argentina/Buenos_Aires', abbr: 'ART' },
  { label: '(GMT+00:00) UTC / London', value: 'UTC', abbr: 'GMT' },
  { label: '(GMT+01:00) Central European Time (Paris, Berlin)', value: 'Europe/Paris', abbr: 'CET' },
  { label: '(GMT+02:00) Eastern European Time (Athens, Kyiv)', value: 'Europe/Athens', abbr: 'EET' },
  { label: '(GMT+03:00) Moscow Standard Time', value: 'Europe/Moscow', abbr: 'MSK' },
  { label: '(GMT+04:00) Gulf Standard Time (Dubai)', value: 'Asia/Dubai', abbr: 'GST' },
  { label: '(GMT+05:30) India Standard Time (Mumbai)', value: 'Asia/Kolkata', abbr: 'IST' },
  { label: '(GMT+06:00) Urumqi', value: 'Asia/Urumqi', abbr: 'URUMQI' },
  { label: '(GMT+06:30) Rangoon', value: 'Asia/Yangon', abbr: 'MMT' },
  { label: '(GMT+07:00) Novosibirsk', value: 'Asia/Novosibirsk', abbr: 'NOVST' },
  { label: '(GMT+07:00) Bangkok, Hanoi', value: 'Asia/Bangkok', abbr: 'ICT' },
  { label: '(GMT+07:00) Jakarta', value: 'Asia/Jakarta', abbr: 'WIB' },
  { label: '(GMT+07:00) Krasnoyarsk', value: 'Asia/Krasnoyarsk', abbr: 'KRAT' },
  { label: '(GMT+08:00) Beijing', value: 'Asia/Shanghai', abbr: 'CST' },
  { label: '(GMT+08:00) Chongqing', value: 'Asia/Chongqing', abbr: 'CST' },
  { label: '(GMT+08:00) Hong Kong', value: 'Asia/Hong_Kong', abbr: 'HKT' },
  { label: '(GMT+08:00) Kuala Lumpur', value: 'Asia/Kuala_Lumpur', abbr: 'MYT' },
  { label: '(GMT+08:00) Singapore', value: 'Asia/Singapore', abbr: 'SGT' },
  { label: '(GMT+09:00) Japan Standard Time (Tokyo)', value: 'Asia/Tokyo', abbr: 'JST' },
  { label: '(GMT+10:00) Australian Eastern Sea (Sydney)', value: 'Australia/Sydney', abbr: 'AEST' },
  { label: '(GMT+12:00) New Zealand Standard Time (Auckland)', value: 'Pacific/Auckland', abbr: 'NZST' }
];

interface TimezoneDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export const TimezoneDropdown: React.FC<TimezoneDropdownProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const activeOption = TIMEZONES.find((tz) => tz.value === value) || TIMEZONES.find((tz) => tz.value === 'America/New_York') || TIMEZONES[0];

  const filteredTimezones = TIMEZONES.filter((tz) =>
    tz.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tz.abbr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tz.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative z-55 font-mono select-none" id="timezone-picker-wrapper">
      {/* Current Selection Button Bar styled with custom details */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchQuery('');
        }}
        id="timezone-select-picker"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1b1b1e] hover:border-[#2e2f36] bg-[#0c0c0e]/90 text-slate-300 hover:text-white text-[11px] font-bold tracking-tight transition-all duration-200 cursor-pointer max-w-[280px] md:max-w-[340px] text-left truncate justify-between w-full"
      >
        <span className="flex items-center gap-1.5 truncate">
          <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">{activeOption.label}</span>
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating dropdown menu with Search field and filtered List */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-[310px] md:w-[350px] rounded-xl border border-[#202024] bg-[#0c0c0e] shadow-2xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search box block */}
          <div className="px-3 pb-2 pt-1 border-b border-[#18181b]">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search timezone..."
                className="w-full bg-[#141417] text-[11px] text-white pl-8 pr-3 py-2 rounded-lg border border-[#202024] focus:outline-none focus:border-indigo-500 transition-colors"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* List of elements */}
          <div className="max-h-[220px] overflow-y-auto pt-1 select-none custom-scrollbar">
            {filteredTimezones.length === 0 ? (
              <div className="text-[10px] text-slate-500 text-center py-4 font-sans">
                No matching timezones found
              </div>
            ) : (
              filteredTimezones.map((tz) => {
                const isSelected = tz.value === value;
                return (
                  <button
                    key={tz.value}
                    onClick={() => {
                      onChange(tz.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-[11px] tracking-tight transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/15 text-indigo-400 font-bold border-l-2 border-indigo-500'
                        : 'text-slate-400 hover:bg-[#121215] hover:text-white'
                    }`}
                  >
                    <span className="truncate">{tz.label}</span>
                    <span className="text-[9px] text-slate-500 font-bold px-1 py-0.2 bg-[#1b1b1f] rounded border border-slate-800">
                      {tz.abbr}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
