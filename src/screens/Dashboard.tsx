import React, { useEffect, useState } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { Chart } from '../components/Chart';
import {
  Package, Coins, Layers, AlertTriangle,
  XCircle, TrendingUp, Calendar, BarChart2,
  Wallet, Percent, ShoppingCart, ShoppingBag,
  ChevronRight, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import type { Part } from '../database/schema';

interface DashboardProps {
  onNavigate: (screen: string) => void;
  onTriggerAction: (action: string) => void;
  onSelectPart: (part: Part) => void;
}

// ── Reusable KPI Card ────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string | number;
  meta?: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral';
  isLoading?: boolean;
  glowClass?: string;
  accentFrom?: string;
  accentTo?: string;
  delay?: number;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title, value, meta, icon, iconBg = 'rgba(16,185,129,0.12)', iconColor = '#10b981',
  trend, trendType = 'neutral', isLoading = false, glowClass = '',
  accentFrom, accentTo, delay = 0
}) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const trendClass = trendType === 'up' ? 'trend-pill-up' : trendType === 'down' ? 'trend-pill-down' : 'trend-pill-neutral';
  const TrendIcon = trendType === 'up' ? ArrowUpRight : trendType === 'down' ? ArrowDownRight : Minus;

  const style: React.CSSProperties = {};
  if (accentFrom) { (style as any)['--accent-from'] = accentFrom; }
  if (accentTo)   { (style as any)['--accent-to']   = accentTo; }

  if (isLoading) {
    return (
      <div className="kpi-card">
        <div className="kpi-card-header">
          <div className="skeleton skeleton-text" style={{ width: '60%' }} />
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
        </div>
        <div className="skeleton skeleton-value" />
        <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: 0 }} />
      </div>
    );
  }

  return (
    <div className={`kpi-card ${glowClass} ${visible ? 'kpi-animate' : ''}`} style={style}>
      <div className="kpi-card-header">
        <span className="kpi-card-title">{title}</span>
        <div className="kpi-card-icon" style={{ backgroundColor: iconBg, color: iconColor }}>
          {icon}
        </div>
      </div>
      <div className={`kpi-card-value ${String(value).length > 10 ? 'kpi-card-value-sm' : ''}`}>
        {value}
      </div>
      <div className="kpi-card-footer">
        {meta && <span className="kpi-card-meta">{meta}</span>}
        {trend && (
          <span className={`trend-pill ${trendClass}`}>
            <TrendIcon size={10} />
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

// ── Leaderboard ──────────────────────────────────────────────────────────────
interface LeaderboardItem { name: string; value: number; subtext?: string; }
const Leaderboard: React.FC<{ items: LeaderboardItem[]; prefix?: string; colors?: string[] }> = ({
  items, prefix = 'Rs. ', colors = ['#10b981','#3b82f6','#f59e0b','#8b5cf6','#06b6d4']
}) => {
  const max = Math.max(...items.map(i => i.value), 1);
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, []);

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} className="leaderboard-row">
          <span className={`leaderboard-rank ${i === 0 ? 'leaderboard-rank-1' : i === 1 ? 'leaderboard-rank-2' : i === 2 ? 'leaderboard-rank-3' : 'leaderboard-rank-other'}`}>
            {i + 1}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.name}
            </div>
            {item.subtext && <div style={{ fontSize: '0.67rem', color: 'var(--text-tertiary)' }}>{item.subtext}</div>}
            <div className="leaderboard-bar-track" style={{ marginTop: '5px' }}>
              <div
                className="leaderboard-bar-fill"
                style={{ width: animated ? `${(item.value / max) * 100}%` : '0%', backgroundColor: colors[i % colors.length] }}
              />
            </div>
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0, minWidth: '70px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontFeatureSettings: "'tnum'" }}>
            {prefix}{item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Activity Feed ─────────────────────────────────────────────────────────────
interface ActivityFeedItem { id: string; title: string; meta: string; amount: number; dotColor: string; badge?: string; badgeClass?: string; }
const ActivityFeed: React.FC<{ items: ActivityFeedItem[]; prefix?: string }> = ({ items, prefix = 'Rs. ' }) => (
  <div>
    {items.map((item) => (
      <div key={item.id} className="activity-item">
        <div className="activity-dot" style={{ backgroundColor: item.dotColor }} />
        <div className="activity-content">
          <div className="activity-title">{item.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
            <span className="activity-meta">{item.meta}</span>
            {item.badge && <span className={`badge ${item.badgeClass}`} style={{ fontSize: '0.62rem', padding: '1px 5px' }}>{item.badge}</span>}
          </div>
        </div>
        <div className="activity-amount" style={{ fontFamily: 'var(--font-mono)', fontFeatureSettings: "'tnum'" }}>{prefix}{item.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
      </div>
    ))}
  </div>
);

// ── Panel wrapper ─────────────────────────────────────────────────────────────
const Panel: React.FC<{ title: string; action?: React.ReactNode; children: React.ReactNode; style?: React.CSSProperties }> = ({ title, action, children, style }) => (
  <div className="panel" style={style}>
    <div className="section-header" style={{ marginBottom: '0.875rem' }}>
      <span className="section-title">{title}</span>
      {action}
    </div>
    {children}
  </div>
);

// ─────────────────────────────────── MAIN ─────────────────────────────────────
export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onTriggerAction }) => {
  const {
    isLoading,
    inventoryKPIs, revenueKPIs, profitKPIs,
    monthlySalesTrend, dailySalesTrend, monthlyProfitTrend,
    purchaseVsSales, brandDistribution, categoryDistribution,
    inventoryValueByCategory, topSellingParts, topCustomers,
    topSuppliers, bestSellingCategories, recentSales, recentPurchases,
    lowStockAlerts
  } = useDashboard();

  // Recent sales feed items
  const salesFeedItems: ActivityFeedItem[] = recentSales.slice(0, 7).map(so => ({
    id: so.id,
    title: so.customerName,
    meta: so.saleDate,
    amount: so.totalAmount,
    dotColor: so.status === 'DELIVERED' ? 'var(--color-success)' : so.status === 'DISPATCHED' ? 'var(--color-warning)' : 'var(--text-tertiary)',
    badge: so.status,
    badgeClass: so.status === 'DELIVERED' ? 'badge-success' : so.status === 'DISPATCHED' ? 'badge-warning' : 'badge-secondary'
  }));

  const purchaseFeedItems: ActivityFeedItem[] = recentPurchases.slice(0, 7).map((po: any) => ({
    id: po.id,
    title: po.supplierName,
    meta: po.orderDate,
    amount: po.totalAmount,
    dotColor: po.status === 'RECEIVED' ? '#3b82f6' : po.status === 'SENT' ? 'var(--color-warning)' : 'var(--text-tertiary)',
    badge: po.status,
    badgeClass: po.status === 'RECEIVED' ? 'badge-success' : po.status === 'SENT' ? 'badge-warning' : 'badge-secondary'
  }));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '2.5rem' }}>

      {/* ── Page Header Greeting (Apple Liquid Glass Accent) ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 
            className="heading-display" 
            style={{ 
              fontSize: '2.1rem', 
              fontWeight: 700, 
              margin: 0, 
              color: 'var(--text-primary)', 
              letterSpacing: '-0.03em', 
              lineHeight: 1.2,
              fontFamily: 'var(--font-display)' 
            }}
          >
            {getGreeting()}, Anju Auto Parts! 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px', fontWeight: 500 }}>
            Here's what's happening with your business today · Anju Auto Parts
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary" 
            style={{ 
              fontSize: '0.85rem', 
              fontWeight: 600, 
              padding: '9px 18px', 
              borderRadius: '9999px',
            }} 
            onClick={() => onTriggerAction('create-po')}
          >
            <ShoppingCart size={15} /> Create PO
          </button>
          <button 
            className="btn btn-primary" 
            style={{ 
              fontSize: '0.85rem', 
              fontWeight: 600, 
              padding: '9px 20px', 
              borderRadius: '9999px',
            }} 
            onClick={() => onTriggerAction('create-sales')}
          >
            <ShoppingBag size={15} /> + New Invoice
          </button>
        </div>
      </div>

      {/* ── 3-Card Hero Banner Section (Apple Adaptive Liquid Glass) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        
        {/* Hero Card 1: Total Revenue (Emerald Theme) */}
        <div
          className="liquid-hero-card hero-card-emerald"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div 
              style={{ 
                width: '38px', height: '38px', borderRadius: '12px', 
                backgroundColor: 'var(--color-success-bg)', 
                border: '1px solid var(--color-success-border)',
                backdropFilter: 'blur(10px)',
                display: 'flex', 
                alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)', fontWeight: 800 
              }}
            >
              M
            </div>
            <span style={{ 
              fontSize: '0.75rem', 
              backgroundColor: 'var(--bg-hover)', 
              border: '1px solid var(--border-color)',
              backdropFilter: 'blur(10px)',
              padding: '4px 12px', 
              borderRadius: '9999px', 
              color: 'var(--text-secondary)', 
              fontWeight: 600 
            }}>
              This Month ∨
            </span>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>TOTAL REVENUE</span>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-sans)', letterSpacing: '-0.03em', marginTop: '4px', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
              Rs {revenueKPIs.monthlyRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-success)', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpRight size={14} /> 16.2% from last month
            </div>
          </div>

          {/* Decorative Sparkline Wave with liquid glow */}
          <svg style={{ position: 'absolute', right: 0, bottom: 0, width: '100%', height: '70px', opacity: 0.25, pointerEvents: 'none' }} viewBox="0 0 300 70" preserveAspectRatio="none">
            <path d="M0,50 Q60,10 120,40 T240,20 T300,35 L300,70 L0,70 Z" fill="url(#heroGrad)" />
            <defs>
              <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
            <button
              onClick={() => onNavigate('analytics')}
              className="btn btn-secondary"
              style={{
                padding: '8px 18px',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              View Report →
            </button>
          </div>
        </div>

        {/* Hero Card 2: Monsoon Stocking Campaign Card */}
        <div
          className="liquid-hero-card hero-card-aurora"
        >
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              CURRENTLY RUNNING
            </span>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, fontFamily: 'var(--font-sans)', margin: '4px 0 0 0', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Monsoon Season Stocking 🌸
            </h2>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '10px', 
            marginTop: '1rem', 
            backgroundColor: 'var(--bg-hover)', 
            border: '1px solid var(--border-color)',
            padding: '12px', 
            borderRadius: '16px', 
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
          }}>
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>BUDGET</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>Rs 1.2L</div>
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>PROGRESS</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-brand-coral)', marginTop: '2px' }}>68%</div>
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>ITEMS</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{inventoryKPIs.totalProducts} Pcs</div>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={() => onNavigate('inventory')}
              className="btn btn-secondary"
              style={{
                padding: '8px 18px',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              View Inventory →
            </button>
          </div>
        </div>

        {/* Hero Card 3: July 2026 Calendar & Schedule Widget */}
        <div
          className="liquid-hero-card hero-card-sapphire"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em' }}>
              July 2026
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', cursor: 'pointer', width: '26px', height: '26px', padding: 0, borderRadius: '50%', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              <button className="btn btn-secondary" style={{ fontSize: '0.75rem', cursor: 'pointer', width: '26px', height: '26px', padding: 0, borderRadius: '50%', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            </div>
          </div>

          {/* Date Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginTop: '0.75rem' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <span key={day} style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{day}</span>
            ))}
            {[18, 19, 20, 21, 22, 23, 24].map((date) => {
              const isToday = date === 22;
              return (
                <div
                  key={date}
                  style={{
                    padding: '6px 0',
                    fontSize: '0.8rem',
                    fontWeight: isToday ? 700 : 500,
                    borderRadius: '50%',
                    backgroundColor: isToday ? 'var(--color-brand)' : 'transparent',
                    color: isToday ? '#ffffff' : 'var(--text-primary)',
                    margin: '2px auto',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isToday ? '0 0 12px var(--color-brand-glow)' : 'none',
                    border: isToday ? '1px solid var(--color-brand)' : '1px solid transparent'
                  }}
                >
                  {date}
                </div>
              );
            })}
          </div>

          {/* Schedule Preview */}
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>10:00 AM</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Supplier Stock Audit</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>02:30 PM</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Weekly Margin Review</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Quick Action Dock (5 Liquid Glass Action Pills) ── */}
      <div 
        style={{ 
          backgroundColor: 'var(--bg-panel)', 
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
          borderRadius: '24px', 
          padding: '1.25rem 1.5rem', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
          gap: '1rem',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border-color)'
        }}
      >
        <button
          onClick={() => onTriggerAction('add-part')}
          className="liquid-action-pill"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            background: 'none', border: 'none', cursor: 'pointer',
            transition: 'transform 150ms ease'
          }}
        >
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '16px', 
            backgroundColor: 'rgba(255, 55, 95, 0.15)', 
            color: '#ff375f', 
            border: '1px solid rgba(255, 55, 95, 0.3)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            boxShadow: '0 4px 16px rgba(255,55,95,0.25), inset 0 1px 0 rgba(255,255,255,0.2)' 
          }}>
            <Package size={22} />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>+ Add Part</span>
        </button>

        <button
          onClick={() => onNavigate('customers')}
          className="liquid-action-pill"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            background: 'none', border: 'none', cursor: 'pointer',
            transition: 'transform 150ms ease'
          }}
        >
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '16px', 
            backgroundColor: 'rgba(48, 209, 88, 0.15)', 
            color: '#30d158', 
            border: '1px solid rgba(48, 209, 88, 0.3)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            boxShadow: '0 4px 16px rgba(48,209,88,0.25), inset 0 1px 0 rgba(255,255,255,0.2)' 
          }}>
            <Coins size={22} />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Add Client</span>
        </button>

        <button
          onClick={() => onTriggerAction('create-sales')}
          className="liquid-action-pill"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            background: 'none', border: 'none', cursor: 'pointer',
            transition: 'transform 150ms ease'
          }}
        >
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '16px', 
            backgroundColor: 'rgba(0, 113, 227, 0.18)', 
            color: '#2997ff', 
            border: '1px solid rgba(41, 151, 255, 0.35)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            boxShadow: '0 4px 16px rgba(0,113,227,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' 
          }}>
            <ShoppingBag size={22} />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>New Invoice</span>
        </button>

        <button
          onClick={() => onNavigate('invoices')}
          className="liquid-action-pill"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            background: 'none', border: 'none', cursor: 'pointer',
            transition: 'transform 150ms ease'
          }}
        >
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '16px', 
            backgroundColor: 'rgba(191, 90, 242, 0.15)', 
            color: '#bf5af2', 
            border: '1px solid rgba(191, 90, 242, 0.3)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            boxShadow: '0 4px 16px rgba(191,90,242,0.25), inset 0 1px 0 rgba(255,255,255,0.2)' 
          }}>
            <BarChart2 size={22} />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Invoices</span>
        </button>

        <button
          onClick={() => onNavigate('analytics')}
          className="liquid-action-pill"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            background: 'none', border: 'none', cursor: 'pointer',
            transition: 'transform 150ms ease'
          }}
        >
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '16px', 
            backgroundColor: 'rgba(255, 159, 10, 0.15)', 
            color: '#ff9f0a', 
            border: '1px solid rgba(255, 159, 10, 0.3)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            boxShadow: '0 4px 16px rgba(255,159,10,0.25), inset 0 1px 0 rgba(255,255,255,0.2)' 
          }}>
            <TrendingUp size={22} />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Analytics</span>
        </button>
      </div>

      {/* ── Section 1: Executive KPI Metrics ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Sub-Section A: Stock & Catalog Metrics */}
        <div>
          <div className="section-header" style={{ marginBottom: '10px' }}>
            <span className="section-title" style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--text-secondary)' }}>
              <Package size={16} style={{ color: 'var(--color-brand)' }} /> Stock & Catalog Metrics
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Live · Auto-refreshes on data change</span>
          </div>
          <div className="dashboard-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
            <KpiCard
              title="Products" value={inventoryKPIs.totalProducts}
              meta={inventoryKPIs.lowStockCount > 0 ? `${inventoryKPIs.lowStockCount} items need restocking` : 'All items in stock'}
              icon={<Package size={18} />}
              iconBg="rgba(16,185,129,0.12)" iconColor="#10b981"
              trend="Catalogued" trendType="neutral"
              glowClass="kpi-glow-green" accentFrom="#10b981" accentTo="#34d399"
              isLoading={isLoading} delay={0}
            />
            <KpiCard
              title="Inventory Value" value={`Rs ${inventoryKPIs.totalStockValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              meta="Based on average purchase cost"
              icon={<Coins size={18} />}
              iconBg="rgba(16,185,129,0.12)" iconColor="#10b981"
              trend="At cost" trendType="neutral"
              glowClass="kpi-glow-green" accentFrom="#10b981" accentTo="#06b6d4"
              isLoading={isLoading} delay={60}
            />
            <KpiCard
              title="Current Inventory" value={inventoryKPIs.totalCurrentStock.toLocaleString('en-US')}
              meta="Across all warehouse locations"
              icon={<Layers size={18} />}
              iconBg="rgba(59,130,246,0.12)" iconColor="#3b82f6"
              trend="All SKUs" trendType="neutral"
              glowClass="kpi-glow-blue" accentFrom="#3b82f6" accentTo="#8b5cf6"
              isLoading={isLoading} delay={120}
            />
            <KpiCard
              title="Low Stock Alerts" value={inventoryKPIs.lowStockCount}
              meta="Products below minimum stock"
              icon={<AlertTriangle size={18} />}
              iconBg="rgba(245,158,11,0.12)" iconColor="#f59e0b"
              trend={inventoryKPIs.lowStockCount > 0 ? 'Restock Soon' : 'Optimal'}
              trendType={inventoryKPIs.lowStockCount > 0 ? 'down' : 'up'}
              glowClass="kpi-glow-amber" accentFrom="#f59e0b" accentTo="#ef4444"
              isLoading={isLoading} delay={180}
            />
            <KpiCard
              title="Out of Stock Items" value={inventoryKPIs.outOfStockCount}
              meta={inventoryKPIs.outOfStockCount > 0 ? 'Immediate Attention Required' : 'Zero depleted SKUs'}
              icon={<XCircle size={18} />}
              iconBg="rgba(239,68,68,0.12)" iconColor="#ef4444"
              trend={inventoryKPIs.outOfStockCount > 0 ? 'Out of Stock' : 'Optimal'}
              trendType={inventoryKPIs.outOfStockCount > 0 ? 'down' : 'up'}
              glowClass="kpi-glow-red" accentFrom="#ef4444" accentTo="#f97316"
              isLoading={isLoading} delay={240}
            />
          </div>
        </div>

        {/* Sub-Section B: Financial & Revenue Intelligence */}
        <div>
          <div className="section-header" style={{ marginBottom: '10px' }}>
            <span className="section-title" style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--text-secondary)' }}>
              <TrendingUp size={16} style={{ color: '#3b82f6' }} /> Financial & Revenue Intelligence
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Real-time Margin & Cashflow</span>
          </div>
          <div className="dashboard-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
            <KpiCard
              title="Today's Revenue" value={`Rs ${revenueKPIs.dailyRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              meta="Dispatched sales today"
              icon={<TrendingUp size={18} />}
              iconBg="rgba(16,185,129,0.12)" iconColor="#10b981"
              trend="Today" trendType="neutral"
              glowClass="kpi-glow-green" accentFrom="#10b981" accentTo="#3b82f6"
              isLoading={isLoading} delay={300}
            />
            <KpiCard
              title="Revenue This Month" value={`Rs ${revenueKPIs.monthlyRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              meta="Current calendar month"
              icon={<Calendar size={18} />}
              iconBg="rgba(59,130,246,0.12)" iconColor="#3b82f6"
              trend={revenueKPIs.monthlyRevenue > 0 ? '+12.4% MoM' : 'No sales'}
              trendType={revenueKPIs.monthlyRevenue > 0 ? 'up' : 'neutral'}
              glowClass="kpi-glow-blue" accentFrom="#3b82f6" accentTo="#8b5cf6"
              isLoading={isLoading} delay={360}
            />
            <KpiCard
              title="Year-to-Date Revenue" value={`Rs ${revenueKPIs.annualRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              meta={`${new Date().getFullYear()} fiscal year revenue`}
              icon={<BarChart2 size={18} />}
              iconBg="rgba(139,92,246,0.12)" iconColor="#8b5cf6"
              trend="YTD" trendType="up"
              accentFrom="#8b5cf6" accentTo="#3b82f6"
              isLoading={isLoading} delay={420}
            />
            <KpiCard
              title="Gross Profit" value={`Rs ${profitKPIs.grossProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              meta={`Gross margin ${profitKPIs.grossMarginPct.toFixed(1)}%`}
              icon={<Wallet size={18} />}
              iconBg="rgba(16,185,129,0.12)" iconColor="#10b981"
              trend={`${profitKPIs.grossMarginPct.toFixed(0)}% margin`}
              trendType="up"
              glowClass="kpi-glow-green" accentFrom="#10b981" accentTo="#06b6d4"
              isLoading={isLoading} delay={480}
            />
            <KpiCard
              title="Net Profit" value={`Rs ${profitKPIs.netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              meta="Net after operating expenses"
              icon={<Percent size={18} />}
              iconBg={profitKPIs.netProfit >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'}
              iconColor={profitKPIs.netProfit >= 0 ? '#10b981' : '#ef4444'}
              trend={profitKPIs.netProfit >= 0 ? 'Profitable' : 'Net Loss'}
              trendType={profitKPIs.netProfit >= 0 ? 'up' : 'down'}
              glowClass={profitKPIs.netProfit >= 0 ? 'kpi-glow-green' : 'kpi-glow-red'}
              accentFrom={profitKPIs.netProfit >= 0 ? '#10b981' : '#ef4444'}
              accentTo={profitKPIs.netProfit >= 0 ? '#34d399' : '#f97316'}
              isLoading={isLoading} delay={540}
            />
          </div>
        </div>

        {/* Sub-Section C: Procurement & Fulfillment Ledger */}
        <div>
          <div className="section-header" style={{ marginBottom: '10px' }}>
            <span className="section-title" style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--text-secondary)' }}>
              <ShoppingCart size={16} style={{ color: '#8b5cf6' }} /> Procurement & Sales Ledger
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Orders & Invoicing Volume</span>
          </div>
          <div className="dashboard-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <KpiCard
              title="Purchase Value" value={`Rs ${profitKPIs.totalPurchases.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              meta="Total fulfilled purchase orders"
              icon={<ShoppingCart size={18} />}
              iconBg="rgba(59,130,246,0.12)" iconColor="#3b82f6"
              trend="Fulfilled POs" trendType="neutral"
              glowClass="kpi-glow-blue" accentFrom="#3b82f6" accentTo="#10b981"
              isLoading={isLoading} delay={600}
            />
            <KpiCard
              title="Sales Revenue" value={`Rs ${revenueKPIs.totalSales.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              meta="All fulfilled sales invoices"
              icon={<ShoppingBag size={18} />}
              iconBg="rgba(16,185,129,0.12)" iconColor="#10b981"
              trend="All time" trendType="up"
              glowClass="kpi-glow-green" accentFrom="#10b981" accentTo="#8b5cf6"
              isLoading={isLoading} delay={660}
            />
          </div>
        </div>

      </div>

      {/* ── Section 2: Primary Charts ── */}
      <div>
        <div className="section-header">
          <span className="section-title">Sales &amp; Revenue Trends</span>
        </div>
        <div className="dashboard-chart-row-2">
          {/* Daily Sales Bar */}
          <div className="panel" style={{ padding: '1rem' }}>
            {isLoading
              ? <div className="skeleton skeleton-chart" />
              : <Chart type="bar" data={dailySalesTrend} title="Daily Sales — Last 30 Days" height={240} strokeColor="#10b981" prefix="Rs. " />
            }
          </div>
          {/* Monthly Revenue Line */}
          <div className="panel" style={{ padding: '1rem' }}>
            {isLoading
              ? <div className="skeleton skeleton-chart" />
              : <Chart type="line" data={monthlySalesTrend} title="Monthly Revenue — 12 Months" height={240} strokeColor="#3b82f6" prefix="Rs. " />
            }
          </div>
        </div>
      </div>

      {/* ── Section 3: Distribution Charts ── */}
      <div>
        <div className="section-header">
          <span className="section-title">Inventory Distribution</span>
        </div>
        <div className="dashboard-chart-row-3">
          {/* Brand Donut */}
          <div className="panel" style={{ padding: '1rem' }}>
            {isLoading
              ? <div className="skeleton skeleton-chart" />
              : <Chart
                  type="donut"
                  donutData={brandDistribution.map(b => ({ label: b.label, value: b.value }))}
                  title="Parts by Brand"
                  height={220}
                />
            }
          </div>
          {/* Category Donut */}
          <div className="panel" style={{ padding: '1rem' }}>
            {isLoading
              ? <div className="skeleton skeleton-chart" />
              : <Chart
                  type="donut"
                  donutData={categoryDistribution.map(c => ({ label: c.label, value: c.value }))}
                  title="Parts by Category"
                  height={220}
                  colors={['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899']}
                />
            }
          </div>
          {/* Purchase vs Sales */}
          <div className="panel" style={{ padding: '1rem' }}>
            {isLoading
              ? <div className="skeleton skeleton-chart" />
              : <Chart
                  type="multiBar"
                  multiData={purchaseVsSales}
                  title="Purchase vs Sales — 12 Months"
                  height={220}
                  prefix="Rs. "
                />
            }
          </div>
        </div>
      </div>

      {/* ── Section 4: Analysis Charts ── */}
      <div>
        <div className="section-header">
          <span className="section-title">Financial Analysis</span>
        </div>
        <div className="dashboard-chart-row-2">
          {/* Profit Trend */}
          <div className="panel" style={{ padding: '1rem' }}>
            {isLoading
              ? <div className="skeleton skeleton-chart" />
              : <Chart type="bar" data={monthlyProfitTrend} title="Monthly Gross Profit — 12 Months" height={230} strokeColor="#8b5cf6" prefix="Rs. " />
            }
          </div>
          {/* Inventory Value by Category horizontal */}
          <div className="panel" style={{ padding: '1rem' }}>
            {isLoading
              ? <div className="skeleton skeleton-chart" />
              : <Chart
                  type="horizontalBar"
                  data={inventoryValueByCategory}
                  title="Stock Value by Category"
                  height={230}
                  prefix="Rs. "
                  colors={['#10b981','#3b82f6','#f59e0b','#8b5cf6','#06b6d4','#f97316','#ec4899','#84cc16']}
                />
            }
          </div>
        </div>
      </div>

      {/* ── Section 5: Leaderboards ── */}
      <div>
        <div className="section-header">
          <span className="section-title">Performance Leaderboards</span>
        </div>
        <div className="dashboard-chart-row-3">
          {/* Top Selling Parts */}
          <Panel
            title="Top Selling Parts"
            action={<button className="btn btn-ghost" style={{ fontSize: '0.72rem', padding: '3px 8px' }} onClick={() => onNavigate('inventory')}>View All <ChevronRight size={12} /></button>}
          >
            {isLoading
              ? [1,2,3,4,5].map(i => <div key={i} className="skeleton skeleton-text" style={{ marginBottom: '14px', width: `${60 + i * 6}%` }} />)
              : <Leaderboard
                  items={topSellingParts.map(p => ({ name: p.name, value: p.revenue, subtext: `${p.qty} units sold · ${p.sku}` }))}
                  colors={['#10b981','#3b82f6','#f59e0b','#8b5cf6','#06b6d4']}
                />
            }
          </Panel>

          {/* Top Customers */}
          <Panel title="Top Customers">
            {isLoading
              ? [1,2,3,4,5].map(i => <div key={i} className="skeleton skeleton-text" style={{ marginBottom: '14px', width: `${60 + i * 6}%` }} />)
              : <Leaderboard
                  items={topCustomers.map(c => ({ name: c.name, value: c.total, subtext: `${c.orders} orders` }))}
                  colors={['#f59e0b','#10b981','#3b82f6','#8b5cf6','#06b6d4']}
                />
            }
          </Panel>

          {/* Top Suppliers */}
          <Panel title="Top Suppliers">
            {isLoading
              ? [1,2,3,4,5].map(i => <div key={i} className="skeleton skeleton-text" style={{ marginBottom: '14px', width: `${60 + i * 6}%` }} />)
              : <Leaderboard
                  items={topSuppliers.map(s => ({ name: s.name, value: s.total, subtext: `${s.orders} POs received` }))}
                  colors={['#3b82f6','#10b981','#8b5cf6','#f59e0b','#06b6d4']}
                />
            }
          </Panel>
        </div>
      </div>

      {/* ── Section 6: Activity Feeds + Low Stock ── */}
      <div>
        <div className="section-header">
          <span className="section-title">Activity &amp; Alerts</span>
        </div>
        <div className="dashboard-feed-row">
          {/* Recent Sales Feed */}
          <Panel
            title="Recent Sales"
            action={<button className="btn btn-ghost" style={{ fontSize: '0.72rem', padding: '3px 8px' }} onClick={() => onNavigate('sales')}>View All <ChevronRight size={12} /></button>}
          >
            {isLoading
              ? [1,2,3,4,5].map(i => <div key={i} className="skeleton skeleton-text" style={{ marginBottom: '18px' }} />)
              : <ActivityFeed items={salesFeedItems} />
            }
          </Panel>

          {/* Recent Purchases Feed */}
          <Panel
            title="Recent Purchases"
            action={<button className="btn btn-ghost" style={{ fontSize: '0.72rem', padding: '3px 8px' }} onClick={() => onNavigate('suppliers')}>View All <ChevronRight size={12} /></button>}
          >
            {isLoading
              ? [1,2,3,4,5].map(i => <div key={i} className="skeleton skeleton-text" style={{ marginBottom: '18px' }} />)
              : <ActivityFeed items={purchaseFeedItems} />
            }
          </Panel>

          {/* Low Stock Alerts + Best Categories */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Low Stock Alerts */}
            <Panel
              title="Stock Alerts"
              action={<button className="btn btn-ghost" style={{ fontSize: '0.72rem', padding: '3px 8px' }} onClick={() => onNavigate('inventory')}>View All <ChevronRight size={12} /></button>}
            >
              {isLoading
                ? [1,2,3].map(i => <div key={i} className="skeleton skeleton-text" style={{ marginBottom: '12px' }} />)
                : lowStockAlerts.length === 0
                  ? <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem 0' }}>✓ All stock levels optimal</div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {lowStockAlerts.slice(0, 4).map(part => (
                        <div key={part.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: 'var(--bg-hover)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                          <div style={{ overflow: 'hidden', flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{part.name}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Min: {part.reorderPoint}</div>
                          </div>
                          <span className={`badge ${part.stockLevel === 0 ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.65rem', marginLeft: '8px', flexShrink: 0 }}>
                            {part.stockLevel} {part.unit}
                          </span>
                        </div>
                      ))}
                    </div>
              }
            </Panel>

            {/* Best Selling Categories */}
            <Panel title="Best Categories">
              {isLoading
                ? [1,2,3,4].map(i => <div key={i} className="skeleton skeleton-text" style={{ marginBottom: '10px' }} />)
                : <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {bestSellingCategories.slice(0, 5).map((cat, i) => (
                      <div key={cat.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: ['#10b981','#3b82f6','#f59e0b','#8b5cf6','#06b6d4'][i], flexShrink: 0 }} />
                          <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0, marginLeft: '8px' }}>
                          Rs. {cat.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    ))}
                  </div>
              }
            </Panel>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
