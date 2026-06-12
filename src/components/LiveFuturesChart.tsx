import React from 'react';
import { TickData } from '../types';

interface LiveFuturesChartProps {
  data: TickData[];
  indexName: string;
  color: string;
  currentPrice: number;
  dailyHigh: number;
  dailyLow: number;
}

export const LiveFuturesChart: React.FC<LiveFuturesChartProps> = ({
  data,
  indexName,
  color,
  currentPrice,
  dailyHigh,
  dailyLow,
}) => {
  if (data.length === 0) return <div className="h-44 flex items-center justify-center text-slate-500 font-mono text-xs">Waiting for ticks...</div>;

  const width = 500;
  const height = 180;
  const padding = 20;

  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices, dailyLow) * 0.9998;
  const maxPrice = Math.max(...prices, dailyHigh) * 1.0002;
  const priceRange = maxPrice - minPrice || 1;

  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((d.price - minPrice) / priceRange) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  // Last coordinate for gradient filling
  const lastX = padding + (width - padding * 2);
  const lastY = height - padding;
  const firstX = padding;
  const gradientPoints = `${points} ${lastX},${lastY} ${firstX},${lastY}`;

  // Current price visual baseline
  const currentY = height - padding - ((currentPrice - minPrice) / priceRange) * (height - padding * 2);

  return (
    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-2">
          <span className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: color }}></span>
          <span className="text-sm font-bold tracking-wider text-slate-200">{indexName} Intraday 1s Ticks</span>
        </div>
        <div className="flex space-x-3 text-xs font-mono">
          <span className="text-slate-400">High: <span className="text-emerald-400 font-semibold">{dailyHigh.toFixed(2)}</span></span>
          <span className="text-slate-400">Low: <span className="text-rose-400 font-semibold">{dailyLow.toFixed(2)}</span></span>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
          <defs>
            <linearGradient id={`grad-${indexName}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(51, 65, 85, 0.25)" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(51, 65, 85, 0.25)" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(51, 65, 85, 0.25)" strokeDasharray="3 3" />

          {/* Current price horizontal barrier */}
          <line 
            x1={padding} 
            y1={currentY} 
            x2={width - padding} 
            y2={currentY} 
            stroke={color} 
            strokeWidth="0.75" 
            strokeOpacity="0.4"
            strokeDasharray="4 2" 
          />

          {/* Fill Gradient Area */}
          <polygon points={gradientPoints} fill={`url(#grad-${indexName})`} />

          {/* Smooth price connection line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={points}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Bouncing head pulse indicator */}
          {data.length > 0 && (
            <g>
              <circle 
                cx={padding + (width - padding * 2)} 
                cy={currentY} 
                r="6" 
                fill={color} 
                className="animate-ping" 
                opacity="0.3"
              />
              <circle 
                cx={padding + (width - padding * 2)} 
                cy={currentY} 
                r="3.5" 
                fill={color} 
              />
            </g>
          )}
        </svg>

        {/* Floating current price tag */}
        <div 
          className="absolute right-2 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-100 font-bold"
          style={{ 
            backgroundColor: color,
            top: `${Math.min(height - 30, Math.max(10, (currentY / height) * 100))}%`,
            transform: 'translateY(-50%)' 
          }}
        >
          {currentPrice.toFixed(2)}
        </div>
      </div>
    </div>
  );
};
