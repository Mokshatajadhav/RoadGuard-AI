import React, { useState } from 'react';

/**
 * Interactive SVG Bar Chart
 * data: Array<{ label: string, value: number, color?: string, secondaryValue?: number }>
 */
export function BarChart({
  data = [],
  height = 220,
  barColor = '#10b981',
  title = '',
  emptyText = 'No data available for this range',
  yAxisLabel = 'Complaints',
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200" style={{ height }}>
        {emptyText}
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = height - 50; // leave room for labels
  const barWidthPercent = Math.max(12, Math.min(48, Math.floor(75 / data.length)));

  return (
    <div className="w-full select-none">
      {title && (
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-slate-700">{title}</span>
          <span className="text-[10px] text-slate-400 font-medium">Max: {maxValue}</span>
        </div>
      )}

      <div className="relative pt-6" style={{ height }}>
        {/* Y-axis gridlines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7 text-[10px] text-slate-300 font-mono">
          <div className="border-b border-slate-100 flex justify-between">
            <span>{maxValue}</span>
          </div>
          <div className="border-b border-slate-100 flex justify-between">
            <span>{Math.round(maxValue / 2)}</span>
          </div>
          <div className="border-b border-slate-200 flex justify-between">
            <span>0</span>
          </div>
        </div>

        {/* Bars Container */}
        <div className="relative h-full flex items-end justify-around px-2 pb-7 gap-1 z-10">
          {data.map((d, idx) => {
            const barHeight = Math.max(4, Math.round((d.value / maxValue) * chartHeight));
            const isHovered = hoveredIdx === idx;
            const fill = d.color || barColor;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-7 px-2 py-1 rounded-md bg-slate-900 text-white text-[11px] font-bold shadow-lg whitespace-nowrap z-30 transition-all pointer-events-none">
                    {d.label}: <span className="text-emerald-400">{d.value}</span>
                  </div>
                )}

                {/* The Bar */}
                <div
                  className="w-full max-w-[48px] rounded-t-md transition-all duration-300 group-hover:opacity-90 group-hover:scale-y-[1.02] origin-bottom shadow-xs"
                  style={{
                    height: `${barHeight}px`,
                    backgroundColor: fill,
                  }}
                />

                {/* X-axis Label */}
                <span className="absolute bottom-1 text-[10px] text-slate-500 font-medium truncate max-w-full text-center group-hover:text-slate-900 transition-colors">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Interactive Donut / Ring Distribution Chart
 * data: Array<{ label: string, value: number, color: string }>
 */
export function DonutChart({
  data = [],
  size = 180,
  strokeWidth = 24,
  centerLabel = '',
  centerValue = '',
}) {
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const total = data.reduce((acc, curr) => acc + (curr.value || 0), 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-slate-400 text-xs text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        <span className="font-semibold">No records in selection</span>
        <span className="text-[10px] text-slate-400 mt-0.5">Try widening filter criteria</span>
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
      {/* SVG Ring */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {data.map((item, idx) => {
            if (item.value === 0) return null;
            const strokeDashoffset = circumference - (item.value / total) * circumference;
            const rotation = (accumulatedAngle / total) * 360;
            accumulatedAngle += item.value;

            const isHovered = hoveredSlice === idx;

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredSlice(idx)}
                onMouseLeave={() => setHoveredSlice(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-xl font-extrabold text-slate-900 leading-none">
            {hoveredSlice !== null ? data[hoveredSlice].value : (centerValue || total)}
          </span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 max-w-[80px] truncate">
            {hoveredSlice !== null ? data[hoveredSlice].label : (centerLabel || 'Total')}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-1.5 w-full max-w-[200px] text-xs">
        {data.map((item, idx) => {
          const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
          const isHovered = hoveredSlice === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredSlice(idx)}
              onMouseLeave={() => setHoveredSlice(null)}
              className={`flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                isHovered ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-slate-900">{item.value}</span>
                <span className="text-[10px] text-slate-400 font-mono w-7 text-right">
                  {percent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Interactive Horizontal Progress Bar List
 * data: Array<{ label: string, count: number, total: number, color?: string, subtext?: string }>
 */
export function HorizontalBarList({ data = [], emptyText = 'No distribution available' }) {
  if (!data || data.length === 0) {
    return <p className="text-xs text-slate-400 py-4 text-center">{emptyText}</p>;
  }

  const maxVal = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-3 text-xs">
      {data.map((item, idx) => {
        const percent = Math.round((item.count / maxVal) * 100);
        const fill = item.color || '#3b82f6';

        return (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-semibold truncate max-w-[200px]">{item.label}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-slate-900">{item.count}</span>
                {item.subtext && <span className="text-[10px] text-slate-400">{item.subtext}</span>}
              </div>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${percent}%`, backgroundColor: fill }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
