import React, { useMemo, useState } from 'react';
import * as d3 from 'd3';
import { Activity, TrendingUp, TrendingDown, Eye, Info, X } from 'lucide-react';

export interface SparklinePoint {
  time: string;
  value: number; // Volatility percentage e.g. 4.8
}

interface VolatilitySparklineProps {
  data: SparklinePoint[];
  width?: number;
  height?: number;
}

export const VolatilitySparkline: React.FC<VolatilitySparklineProps> = ({
  data,
  width = 240,
  height = 50,
}) => {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Layout boundaries
  const margins = { top: 6, right: 6, bottom: 6, left: 6 };

  // Calculate current, min, max and avg for informative metrics
  const { current, min, max, avg, trend } = useMemo(() => {
    if (data.length === 0) return { current: 0, min: 0, max: 0, avg: 0, trend: 'neutral' };
    const values = data.map(d => d.value);
    const currentVal = values[values.length - 1];
    const prevVal = values[values.length > 1 ? values.length - 2 : 0];
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    let direction: 'up' | 'down' | 'neutral' = 'neutral';
    if (currentVal > prevVal + 0.01) direction = 'up';
    else if (currentVal < prevVal - 0.01) direction = 'down';

    return {
      current: currentVal,
      min: minimum,
      max: maximum,
      avg: average,
      trend: direction
    };
  }, [data]);

  // D3 Scales and Path calculations (using useMemo for buttery smooth rendering)
  const { linePath, areaPath, points } = useMemo(() => {
    if (data.length === 0) return { linePath: '', areaPath: '', points: [] };

    // X Scale: indexes of data
    const xScale = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range([margins.left, width - margins.right]);

    // Y Scale: min to max with a small padding
    const yMin = Math.max(0, Math.min(...data.map(d => d.value)) - 0.5);
    const yMax = Math.max(...data.map(d => d.value)) + 0.5;

    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([height - margins.bottom, margins.top]);

    // Create paths
    const lineGenerator = d3.line<SparklinePoint>()
      .x((_, i) => xScale(i))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    const areaGenerator = d3.area<SparklinePoint>()
      .x((_, i) => xScale(i))
      .y0(height - margins.bottom)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    const computedPoints = data.map((d, i) => ({
      x: xScale(i),
      y: yScale(d.value),
      data: d,
      index: i,
    }));

    return {
      linePath: lineGenerator(data) || '',
      areaPath: areaGenerator(data) || '',
      points: computedPoints,
    };
  }, [data, width, height, margins.left, margins.right, margins.top, margins.bottom]);

  // Handle subtle mouse interactions for accurate tooltips
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;

    // Find nearest point based on X coordinate
    let closestIndex = 0;
    let minDiff = Infinity;

    points.forEach((pt, index) => {
      const diff = Math.abs(pt.x - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = index;
      }
    });

    if (minDiff < 15) {
      setHoveredPointIndex(closestIndex);
    } else {
      setHoveredPointIndex(null);
    }
  };

  const activePoint = hoveredPointIndex !== null ? points[hoveredPointIndex] : null;

  return (
    <div id="vola-sparkline-card" className="bg-[#0b0c10] border border-slate-900/80 rounded-xl p-3 mb-3.5 flex flex-col gap-2 relative">
      <div className="flex justify-between items-center relative">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
            1H NQ/ES VOLATILITY INDEX
          </span>

          {/* Interactive Info / Details Trigger */}
          <div className="relative inline-block">
            <button
              type="button"
              id="vola-info-toggle"
              onClick={() => setShowExplanation(!showExplanation)}
              onMouseEnter={() => setShowExplanation(true)}
              className="p-1 rounded text-slate-500 hover:text-indigo-400 transition-colors focus:outline-none"
              title="View Volatility Details"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono font-bold">
          {trend === 'up' ? (
            <span className="text-rose-400 flex items-center gap-0.5 bg-rose-950/20 border border-rose-900/30 px-1.5 py-0.2 rounded">
              <TrendingUp className="w-3 h-3" />
              <span>{current.toFixed(2)}%</span>
            </span>
          ) : trend === 'down' ? (
            <span className="text-emerald-400 flex items-center gap-0.5 bg-emerald-950/20 border border-emerald-900/30 px-1.5 py-0.2 rounded">
              <TrendingDown className="w-3 h-3" />
              <span>{current.toFixed(2)}%</span>
            </span>
          ) : (
            <span className="text-slate-400 flex items-center gap-0.5 bg-slate-900 border border-slate-800 px-1.5 py-0.2 rounded">
              <span>{current.toFixed(2)}%</span>
            </span>
          )}
        </div>
      </div>

      {/* Embedded Details Overlay Tooltip inside Card */}
      {showExplanation && (
        <div 
          id="vola-info-popup" 
          className="absolute inset-x-2 top-2 bottom-2 bg-[#050608]/98 border border-indigo-950/80 rounded-lg p-3 z-25 flex flex-col justify-between text-left shadow-xl animate-fade-in"
          onMouseLeave={() => setShowExplanation(false)}
        >
          <div className="flex justify-between items-start-center border-b border-indigo-950 pb-1">
            <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
              <Info className="w-3 h-3" /> 1H NQ & ES FUTURES VOLATILITY
            </span>
            <button 
              type="button"
              onClick={() => setShowExplanation(false)}
              className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 py-1 text-[9px] sm:text-[10px] text-slate-300 space-y-1.5 font-sans leading-relaxed">
            <p className="font-medium text-slate-200">
              <strong className="text-white">အဓိပ္ပာယ်</strong> - နောက်ဆုံး ၁ နာရီအတွင်း CME ၏ Nasdaq-100 (NQ) နှင့် S&P 500 (ES) အညွှန်းကိန်း Futures စျေးနှုန်းများ၏ တစ်မိနစ်ချင်း လှုပ်ခတ်မှု အတက်အကျအရှိန် (Rolling standard deviation of price changes) ကို တိုက်ရိုက်တွက်ချက်ပြထားခြင်း ဖြစ်သည်။
            </p>
            <p className="text-slate-400">
              <strong className="text-white">အသုံးဝင်ပုံ</strong> - Volatility % ပိုမြင့်လာပါက စျေးနှုန်းသည် သက်မှတ်ထားသော Support/Resistance Level များကို အလွယ်တကူ breakout ဖြစ်စေနိုင်ပြီး CMT index price tick အလျင် မြန်ဆန်လာမည်။ Volatility % ကျဆင်းနေပါက စျေးကွက်သည် range-bound sideway အပိုင်းအခြားထဲတွင်သာ ငြိမ်သက်နေတတ်သည်။
            </p>
            <p className="text-indigo-300/90 font-mono text-[8px] sm:text-[9px] border-t border-indigo-950/50 pt-1">
              DATA SOURCE: CME Direct live price ticks fed into our standard-deviation aggregator engine.
            </p>
          </div>
        </div>
      )}

      {/* Sparkline Canvas */}
      <div className="relative h-[55px] w-full flex items-center justify-center bg-[#07080a] border border-slate-950 rounded-lg overflow-hidden py-1">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="overflow-visible select-none cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPointIndex(null)}
        >
          <defs>
            {/* Smooth glowing gradients */}
            <linearGradient id="sparkline-area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id="sparkline-line-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4338ca" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>

          {/* Area under curve */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#sparkline-area-gradient)"
              stroke="none"
              className="pointer-events-none"
            />
          )}

          {/* Sparkline main vector */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="url(#sparkline-line-gradient)"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="pointer-events-none"
            />
          )}

          {/* Hover tracker cursor line */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={margins.top}
              x2={activePoint.x}
              y2={height - margins.bottom}
              stroke="#4f46e5"
              strokeWidth="0.8"
              strokeDasharray="2 2"
              className="pointer-events-none"
            />
          )}

          {/* Dot to highlight active ticker point */}
          {activePoint && (
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="4.5"
              fill="#818cf8"
              stroke="#0b0c10"
              strokeWidth="1.5"
              className="pointer-events-none"
            />
          )}

          {/* Standalone endpoint dot as structural guide */}
          {points.length > 0 && !activePoint && (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="3"
              fill="#6366f1"
              className="animate-pulse pointer-events-none"
            />
          )}
        </svg>

        {/* Dynamic Tooltip HUD */}
        {activePoint && (
          <div className="absolute top-1 left-2 pointer-events-none bg-slate-950/90 border border-slate-800/80 px-2 py-0.5 rounded text-[9px] font-mono select-none text-slate-350 shadow-md">
            <span className="text-slate-500 mr-1.5">{activePoint.data.time}</span>
            <span className="text-indigo-300 font-bold">Vola: {activePoint.data.value.toFixed(2)}%</span>
          </div>
        )}
      </div>

      {/* Grid Summary Footer */}
      <div className="grid grid-cols-3 gap-1 text-[9px] font-mono border-t border-slate-900/50 pt-1.5 text-center">
        <div>
          <span className="text-slate-500 uppercase block tracking-tighter">1H Min</span>
          <span className="text-slate-300 font-bold">{min.toFixed(2)}%</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase block tracking-tighter">1H Avg</span>
          <span className="text-slate-300 font-bold">{avg.toFixed(2)}%</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase block tracking-tighter">1H Max</span>
          <span className="text-slate-300 font-bold">{max.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
};
