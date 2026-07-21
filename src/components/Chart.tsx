import React, { useState, useRef, useEffect } from 'react';
import './components.css';

interface DataPoint {
  label: string;
  value: number;
}

interface MultiDataPoint {
  label: string;
  sales: number;
  purchases: number;
}

interface DonutDataPoint {
  label: string;
  value: number;
  pct?: number;
}

interface ChartProps {
  data?: DataPoint[];
  multiData?: MultiDataPoint[];
  donutData?: DonutDataPoint[];
  title?: string;
  type?: 'line' | 'sparkline' | 'bar' | 'donut' | 'horizontalBar' | 'multiBar';
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  colors?: string[];
  prefix?: string;
  suffix?: string;
  showValues?: boolean;
}

const DONUT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#14b8a6'];

export const Chart: React.FC<ChartProps> = ({
  data = [],
  multiData,
  donutData,
  title,
  type = 'line',
  height = 200,
  strokeColor = '#10b981',
  colors = DONUT_COLORS,
  prefix = 'Rs. ',
  suffix = ''
}) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; index: number; type?: string } | null>(null);
  const [animated, setAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(timer);
  }, []);

  // ─────────────────────────────────── DONUT CHART ──────────────────────────
  if (type === 'donut' && donutData && donutData.length > 0) {
    const total = donutData.reduce((s, d) => s + d.value, 0);
    const cx = 90, cy = 90, r = 68, strokeWidth = 22;
    const circumference = 2 * Math.PI * r;
    let cumulativePct = 0;

    return (
      <div className="chart-container" style={{ height }}>
        {title && <div className="chart-header"><span className="chart-title">{title}</span></div>}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
          <svg width="180" height="180" viewBox="0 0 180 180" style={{ flexShrink: 0 }}>
            {/* Background ring */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-hover)" strokeWidth={strokeWidth} />
            {donutData.map((d, i) => {
              const pct = d.value / total;
              const dashArray = circumference * pct;
              const dashOffset = -circumference * cumulativePct;
              cumulativePct += pct;
              const delay = i * 0.08;
              return (
                <circle
                  key={i}
                  cx={cx} cy={cy} r={r}
                  fill="none"
                  stroke={colors[i % colors.length]}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${animated ? dashArray : 0} ${circumference}`}
                  strokeDashoffset={dashOffset}
                  style={{
                    transformOrigin: `${cx}px ${cy}px`,
                    transform: 'rotate(-90deg)',
                    transition: `stroke-dasharray ${0.6 + delay}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setTooltip({ x: 0, y: 0, index: i })}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
            {/* Center label */}
            <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--text-tertiary)" fontSize="10" fontWeight="500">TOTAL</text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--text-primary)" fontSize="15" fontWeight="700">{total}</text>
          </svg>
          {/* Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflow: 'hidden' }}>
            {donutData.map((d, i) => {
              const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
              const isHovered = tooltip?.index === i;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem',
                    padding: '4px 6px', borderRadius: '4px',
                    backgroundColor: isHovered ? 'var(--bg-hover)' : 'transparent',
                    transition: 'background-color 0.15s',
                    cursor: 'default'
                  }}
                >
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: colors[i % colors.length], flexShrink: 0 }} />
                  <span style={{ flex: 1, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────── HORIZONTAL BAR ───────────────────────────
  if (type === 'horizontalBar' && data && data.length > 0) {
    const maxVal = Math.max(...data.map(d => d.value), 1);

    return (
      <div className="chart-container" style={{ height }}>
        {title && <div className="chart-header"><span className="chart-title">{title}</span></div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'space-around', paddingTop: '4px' }}>
          {data.map((d, i) => {
            const pct = (d.value / maxVal) * 100;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', width: '90px', flexShrink: 0, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.label}
                </span>
                <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--bg-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: animated ? `${pct}%` : '0%',
                    backgroundColor: colors[i % colors.length],
                    borderRadius: '4px',
                    transition: `width ${0.5 + i * 0.08}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`
                  }} />
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', width: '60px', flexShrink: 0 }}>
                  {prefix}{typeof d.value === 'number' ? d.value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : d.value}{suffix}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ────────────────────────────────── MULTI BAR ─────────────────────────────
  if (type === 'multiBar' && multiData && multiData.length > 0) {
    const allVals = multiData.flatMap(d => [d.sales, d.purchases]);
    const maxVal = Math.max(...allVals, 1);
    const svgW = 500, svgH = height - 60;
    const barGroupW = svgW / multiData.length;
    const barW = Math.min(barGroupW * 0.32, 18);
    const padY = 10;

    return (
      <div className="chart-container" style={{ height }} ref={containerRef}>
        {title && (
          <div className="chart-header">
            <span className="chart-title">{title}</span>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#10b981', display: 'inline-block' }} /> Sales
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#3b82f6', display: 'inline-block' }} /> Purchases
              </span>
            </div>
          </div>
        )}
        <div className="chart-wrapper">
          <svg className="chart-svg-element" viewBox={`0 0 ${svgW} ${svgH + 20}`}
            onMouseLeave={() => setTooltip(null)}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = padY + (1 - pct) * (svgH - padY * 2);
              return (
                <line key={i} x1={0} y1={y} x2={svgW} y2={y}
                  stroke="var(--border-color)" strokeWidth={pct === 0 ? 1 : 0.5} strokeDasharray={pct === 0 ? '0' : '4 4'} />
              );
            })}
            {multiData.map((d, i) => {
              const cx = (i + 0.5) * barGroupW;
              const salesH = animated ? ((d.sales / maxVal) * (svgH - padY * 2)) : 0;
              const purchH = animated ? ((d.purchases / maxVal) * (svgH - padY * 2)) : 0;
              const salesY = svgH - padY - salesH;
              const purchY = svgH - padY - purchH;
              const isHovered = tooltip?.index === i;

              return (
                <g key={i} onMouseEnter={() => setTooltip({ x: cx, y: 0, index: i })} style={{ cursor: 'pointer' }}>
                  {isHovered && (
                    <rect x={cx - barGroupW / 2} y={padY} width={barGroupW} height={svgH - padY * 2}
                      fill="var(--bg-hover)" opacity={0.5} />
                  )}
                  <rect x={cx - barW - 2} y={salesY} width={barW} height={salesH}
                    fill="#10b981" rx="2"
                    style={{ transition: `y ${0.4 + i * 0.02}s, height ${0.4 + i * 0.02}s` }} />
                  <rect x={cx + 2} y={purchY} width={barW} height={purchH}
                    fill="#3b82f6" rx="2"
                    style={{ transition: `y ${0.4 + i * 0.02}s, height ${0.4 + i * 0.02}s` }} />
                  {/* X Label */}
                  {(i === 0 || i % 3 === 0 || i === multiData.length - 1) && (
                    <text x={cx} y={svgH + 16} textAnchor="middle" fill="var(--text-tertiary)" fontSize="8">{d.label}</text>
                  )}
                </g>
              );
            })}
          </svg>
          {tooltip !== null && multiData[tooltip.index] && (
            <div className="chart-tooltip" style={{ left: `${(tooltip.index / multiData.length) * 100}%`, top: '20px' }}>
              <span className="chart-tooltip-label">{multiData[tooltip.index].label}</span>
              <span style={{ fontSize: '0.7rem', color: '#10b981' }}>Sales: {prefix}{multiData[tooltip.index].sales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              <span style={{ fontSize: '0.7rem', color: '#3b82f6' }}>Purchases: {prefix}{multiData[tooltip.index].purchases.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ────────────────────────────────── BAR CHART ─────────────────────────────
  if (type === 'bar' && data && data.length > 0) {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const svgW = 500, svgH = height - 50;
    const barW = Math.min((svgW / data.length) * 0.55, 22);
    const padY = 10;

    return (
      <div className="chart-container" style={{ height }} ref={containerRef}>
        {title && <div className="chart-header"><span className="chart-title">{title}</span></div>}
        <div className="chart-wrapper">
          <svg className="chart-svg-element" viewBox={`0 0 ${svgW} ${svgH + 20}`}
            onMouseLeave={() => setTooltip(null)}>
            {[0, 0.5, 1].map((pct, i) => {
              const y = padY + (1 - pct) * (svgH - padY * 2);
              return (
                <g key={i}>
                  <line x1={0} y1={y} x2={svgW} y2={y} stroke="var(--border-color)"
                    strokeWidth={pct === 0 ? 1 : 0.5} strokeDasharray={pct === 0 ? '0' : '4 4'} />
                  <text x={4} y={y - 2} fill="var(--text-tertiary)" fontSize="8">
                    {prefix}{(maxVal * pct).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </text>
                </g>
              );
            })}
            {data.map((d, i) => {
              const cx = ((i + 0.5) / data.length) * svgW;
              const barH = animated ? ((d.value / maxVal) * (svgH - padY * 2)) : 0;
              const y = svgH - padY - barH;
              const isHovered = tooltip?.index === i;

              return (
                <g key={i} onMouseEnter={() => setTooltip({ x: cx, y, index: i })} style={{ cursor: 'pointer' }}>
                  <rect x={cx - barW / 2} y={y} width={barW} height={barH}
                    fill={isHovered ? strokeColor : `${strokeColor}cc`}
                    rx="3"
                    style={{ transition: `y ${0.35 + i * 0.015}s cubic-bezier(0.25,0.46,0.45,0.94), height ${0.35 + i * 0.015}s cubic-bezier(0.25,0.46,0.45,0.94)` }}
                  />
                  {(i === 0 || i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) && (
                    <text x={cx} y={svgH + 16} textAnchor="middle" fill="var(--text-tertiary)" fontSize="8">{d.label}</text>
                  )}
                </g>
              );
            })}
          </svg>
          {tooltip !== null && data[tooltip.index] && (
            <div className="chart-tooltip" style={{ left: `${(tooltip.index / data.length) * 100}%`, top: '30px' }}>
              <span className="chart-tooltip-label">{data[tooltip.index].label}</span>
              <span className="chart-tooltip-value">{prefix}{data[tooltip.index].value.toLocaleString(undefined, { maximumFractionDigits: 0 })}{suffix}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────── LINE / SPARKLINE ─────────────────────────
  const values = data.map(d => d.value);
  const max = Math.max(...values, 10);
  const min = Math.min(...values, 0);
  const range = max - min;

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
        No data available
      </div>
    );
  }

  const svgWidth = 500;
  const svgHeight = type === 'sparkline' ? height : height - 50;
  const paddingX = type === 'sparkline' ? 2 : 45;
  const paddingY = type === 'sparkline' ? 2 : 15;

  const points = data.map((dp, index) => {
    const x = paddingX + (index / Math.max(data.length - 1, 1)) * (svgWidth - 2 * paddingX);
    const normalizedY = range === 0 ? 0.5 : (dp.value - min) / range;
    const y = svgHeight - paddingY - normalizedY * (svgHeight - 2 * paddingY);
    return { x, y, dp, index };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
    : '';

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (type === 'sparkline' || !containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;
    let closest = points[0];
    let minDiff = Math.abs(points[0].x - mouseX);
    for (let i = 1; i < points.length; i++) {
      const diff = Math.abs(points[i].x - mouseX);
      if (diff < minDiff) { minDiff = diff; closest = points[i]; }
    }
    const clientX = ((closest.x - paddingX) / (svgWidth - 2 * paddingX)) * rect.width;
    setTooltip({ x: clientX, y: closest.y * (rect.height / svgHeight), index: closest.index });
  };

  if (type === 'sparkline') {
    return (
      <div className="chart-container" style={{ height }}>
        <svg className="chart-svg-element" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
          <defs>
            <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {areaPath && <path d={areaPath} fill="url(#sparkGradient)" />}
          {linePath && <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
        </svg>
      </div>
    );
  }

  const activePoint = tooltip !== null ? data[tooltip.index] : null;
  const gradientId = `chartGradient-${strokeColor.replace('#', '')}`;

  return (
    <div className="chart-container" style={{ height }} ref={containerRef}>
      {title && (
        <div className="chart-header">
          <span className="chart-title">{title}</span>
          <div className="chart-legend">
            <div className="chart-legend-item">
              <span className="chart-legend-color" style={{ backgroundColor: strokeColor }} />
              <span>Revenue</span>
            </div>
          </div>
        </div>
      )}
      <div className="chart-wrapper">
        <svg className="chart-svg-element" viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = paddingY + (1 - pct) * (svgHeight - 2 * paddingY);
            const val = min + pct * range;
            return (
              <g key={i}>
                <line x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y}
                  stroke="var(--border-color)" strokeWidth={i === 0 ? 1 : 0.5} strokeDasharray={i === 0 ? '0' : '4 4'} />
                <text x={paddingX - 4} y={y + 3} textAnchor="end" fill="var(--text-tertiary)" fontSize="8">
                  {prefix}{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
                </text>
              </g>
            );
          })}
          {/* X axis labels */}
          {data.map((dp, i) => {
            if (i % Math.ceil(data.length / 7) !== 0 && i !== data.length - 1) return null;
            const x = paddingX + (i / Math.max(data.length - 1, 1)) * (svgWidth - 2 * paddingX);
            return (
              <text key={i} x={x} y={svgHeight + 2} textAnchor="middle" fill="var(--text-secondary)" fontSize="8">{dp.label}</text>
            );
          })}
          {/* Area fill */}
          {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
          {/* Line */}
          {linePath && (
            <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {/* Hover indicator */}
          {tooltip !== null && (
            <>
              <line x1={points[tooltip.index].x} y1={paddingY} x2={points[tooltip.index].x} y2={svgHeight - paddingY}
                stroke="var(--text-tertiary)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx={points[tooltip.index].x} cy={points[tooltip.index].y} r="5"
                fill={strokeColor} stroke="var(--bg-panel)" strokeWidth="2" />
            </>
          )}
        </svg>
        {tooltip !== null && activePoint && (
          <div className="chart-tooltip" style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}>
            <span className="chart-tooltip-label">{activePoint.label}</span>
            <span className="chart-tooltip-value">{prefix}{activePoint.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}{suffix}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chart;
