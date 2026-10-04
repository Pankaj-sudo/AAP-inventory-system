import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { 
  Bell, Check, Trash2, ShieldAlert, AlertTriangle, 
  Receipt, ShoppingCart, RotateCcw, Sliders, AlertOctagon 
} from 'lucide-react';
import type { AppNotification } from '../database/schema';

interface NotificationBellProps {
  onNavigate: (screen: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigate }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'STOCK' | 'ORDERS' | 'RETURNS'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotifIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'OUT_OF_STOCK':
        return <ShieldAlert size={14} style={{ color: '#ef4444' }} />;
      case 'LOW_STOCK':
        return <AlertTriangle size={14} style={{ color: '#f59e0b' }} />;
      case 'NEW_SALE':
        return <Receipt size={14} style={{ color: '#10b981' }} />;
      case 'PO_DELIVERY':
        return <ShoppingCart size={14} style={{ color: '#3b82f6' }} />;
      case 'RETURN':
        return <RotateCcw size={14} style={{ color: '#8b5cf6' }} />;
      case 'STOCK_ADJUST':
        return <Sliders size={14} style={{ color: '#14b8a6' }} />;
      case 'DAMAGED_STOCK':
        return <AlertOctagon size={14} style={{ color: '#6b7280' }} />;
      default:
        return <Bell size={14} />;
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'STOCK') return ['LOW_STOCK', 'OUT_OF_STOCK', 'STOCK_ADJUST', 'DAMAGED_STOCK'].includes(n.type);
    if (filter === 'ORDERS') return ['NEW_SALE', 'PO_DELIVERY'].includes(n.type);
    if (filter === 'RETURNS') return n.type === 'RETURN';
    return true;
  });

  const handleNotifClick = (n: AppNotification) => {
    markAsRead(n.id);
    setIsOpen(false);
    if (n.navigateTo) {
      onNavigate(n.navigateTo);
    }
  };

  return (
    <div className="notif-bell-container" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        className="notif-bell-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        style={{
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', padding: '6px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span 
            className="notif-badge"
            style={{
              position: 'absolute', top: '2px', right: '2px',
              backgroundColor: 'var(--color-danger)', color: '#ffffff',
              fontSize: '0.62rem', fontWeight: 800, minWidth: '15px', height: '15px',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1px', border: '2px solid var(--bg-panel)'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          className="notif-dropdown animate-fade-in"
          style={{
            position: 'absolute', right: 0, top: '40px', width: '360px',
            backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
            zIndex: 999, display: 'flex', flexDirection: 'column',
            maxHeight: '480px', overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>System Notifications</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={markAllAsRead}
                style={{ background: 'none', border: 'none', color: 'var(--color-brand)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <Check size={12} /> Mark all read
              </button>
              <button 
                onClick={clearAll}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <Trash2 size={12} /> Clear all
              </button>
            </div>
          </div>

          {/* Filters tabs bar */}
          <div style={{ display: 'flex', padding: '6px 8px', borderBottom: '1px solid var(--border-color)', gap: '4px', overflowX: 'auto', backgroundColor: 'var(--bg-hover)' }}>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'UNREAD', label: 'Unread' },
              { id: 'STOCK', label: 'Stock' },
              { id: 'ORDERS', label: 'Orders' },
              { id: 'RETURNS', label: 'Returns' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                style={{
                  padding: '3px 8px', borderRadius: 'var(--radius-full)', border: 'none',
                  fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
                  backgroundColor: filter === tab.id ? 'var(--color-brand)' : 'transparent',
                  color: filter === tab.id ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.15s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: '350px' }}>
            {filteredNotifs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                No notifications to display.
              </div>
            ) : (
              filteredNotifs.map(n => (
                <div 
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  style={{
                    display: 'flex', gap: '12px', padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)', cursor: 'pointer',
                    backgroundColor: n.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.03)',
                    transition: 'background-color 0.2s', position: 'relative'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = n.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.03)'}
                >
                  {/* Read/Unread Indicator dot */}
                  {!n.isRead && (
                    <span 
                      style={{
                        position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)',
                        width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-brand)'
                      }}
                    />
                  )}

                  {/* Icon */}
                  <div 
                    style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      backgroundColor: 'var(--bg-hover)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}
                  >
                    {getNotifIcon(n.type)}
                  </div>

                  {/* Text Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-primary)' }}>{n.title}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
                      {n.message}
                    </p>
                  </div>

                  {/* Individual Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n.id);
                    }}
                    style={{
                      background: 'none', border: 'none', color: 'var(--text-tertiary)',
                      cursor: 'pointer', padding: '4px', alignSelf: 'center', opacity: 0.7
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
