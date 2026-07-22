import React, { useState, useEffect } from 'react';
import './index.css';
import './components/components.css';
import { 
  LayoutGrid, 
  Boxes, 
  Building2, 
  TrendingUp, 
  Settings as SettingsIcon, 
  ShoppingBag,
  Search, 
  Sun,
  Moon,
  Command,
  Users,
  FileText,
  RotateCcw,
  Menu,
  X
} from 'lucide-react';

import type { Part } from './database/schema';

// Import Screens
import Dashboard from './screens/Dashboard';
import Inventory from './screens/Inventory';
import Suppliers from './screens/Suppliers';
import Sales from './screens/Sales';
import Analytics from './screens/Analytics';
import Settings from './screens/Settings';
import Customers from './screens/Customers';
import Invoices from './screens/Invoices';
import Returns from './screens/Returns';

// Import Components
import CommandPalette from './components/CommandPalette';
import { NotificationBell } from './components/NotificationBell';
import InitialSplashScreen from './components/InitialSplashScreen';

export const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  const [currentScreen, setCurrentScreen] = useState<string>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isCmdOpen, setIsCmdOpen] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  
  // Cross-screen triggers
  const [selectedPartFromGlobal, setSelectedPartFromGlobal] = useState<Part | null>(null);
  
  // Specific Modal Open triggers passed to sub-screens
  const [isOpenAddModal, setIsOpenAddModal] = useState<boolean>(false);
  const [isOpenAddPOModal, setIsOpenAddPOModal] = useState<boolean>(false);
  const [isOpenAddSalesModal, setIsOpenAddSalesModal] = useState<boolean>(false);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const dark = savedTheme === 'dark';
    setIsDarkMode(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  // Keyboard shortcut listener for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (screenId: string) => {
    setCurrentScreen(screenId);
    setIsMobileNavOpen(false);
  };

  const handleTriggerAction = (action: string) => {
    setIsMobileNavOpen(false);
    if (action === 'add-part') {
      setCurrentScreen('inventory');
      setIsOpenAddModal(true);
    } else if (action === 'create-po') {
      setCurrentScreen('suppliers');
      setIsOpenAddPOModal(true);
    } else if (action === 'create-sales') {
      setCurrentScreen('sales');
      setIsOpenAddSalesModal(true);
    }
  };

  const handleSelectPartFromGlobal = (part: Part) => {
    setSelectedPartFromGlobal(part);
    setCurrentScreen('inventory');
    setIsMobileNavOpen(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutGrid },
    { id: 'inventory', label: 'Parts Inventory', icon: Boxes },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'suppliers', label: 'Suppliers', icon: Building2 },
    { id: 'sales', label: 'Sales Orders', icon: ShoppingBag },
    { id: 'returns', label: 'Inventory Adjustments', icon: RotateCcw },
    { id: 'analytics', label: 'Financial Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <>
      {isAppLoading && (
        <InitialSplashScreen onComplete={() => setIsAppLoading(false)} />
      )}
      <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      
      {/* 1. Desktop Sidebar Panel (Velora Luxury Deep Forest Theme) */}
      <aside 
        className="app-sidebar"
        style={{ 
          width: '260px', 
          backgroundColor: 'var(--bg-sidebar)', 
          display: 'flex', 
          flexDirection: 'column', 
          flexShrink: 0,
          color: 'var(--text-sidebar-item)'
        }}
      >
        {/* Brand/Logo */}
        <div 
          style={{ 
            padding: '1.75rem 1.5rem 1.25rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px' 
          }}
        >
          <div 
            style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '50%', 
              background: '#f6ddd6', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#13352f',
              fontWeight: 800,
              fontSize: '1.15rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            🌸
          </div>
          <div>
            <span className="heading-display" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', display: 'block', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
              Anju Auto Parts
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-sidebar-sub)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
              Premium Experience · Beltar
            </span>
          </div>
        </div>

        {/* Sidebar Nav items */}
        <nav style={{ flex: 1, padding: '1rem 1rem', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className="btn btn-ghost"
                style={{
                  justifyContent: 'flex-start',
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '9999px',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: '-0.01em',
                  transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                  backgroundColor: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                  color: isActive ? 'var(--text-sidebar-active)' : 'var(--text-sidebar-item)',
                  boxShadow: isActive ? '0 4px 14px rgba(0,0,0,0.15)' : 'none',
                  border: 'none',
                }}
              >
                <Icon size={17} color={isActive ? 'var(--text-sidebar-active)' : 'currentColor'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Quote Card & User profile */}
        <div style={{ padding: '1rem' }}>
          <div
            style={{
              padding: '1.15rem 1rem',
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ fontSize: '1rem', color: '#f6ddd6', opacity: 0.8, marginBottom: '4px' }}>“</div>
            <p style={{ fontSize: '0.725rem', color: '#d8e5e2', fontStyle: 'italic', lineHeight: 1.4, margin: 0 }}>
              The secret of getting ahead is getting started.
            </p>
            <span style={{ fontSize: '0.625rem', color: 'var(--text-sidebar-sub)', display: 'block', marginTop: '6px', fontWeight: 600 }}>— Mark Twain</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  backgroundColor: '#f6ddd6', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: '#13352f'
                }}
              >
                PY
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Pankaj</span>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-sidebar-sub)' }}>Store Admin</span>
              </div>
              <span 
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#34d399', 
                  boxShadow: '0 0 8px #34d399' 
                }}
                title="Online Admin"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Mobile Nav Drawer Overlay */}
      {isMobileNavOpen && (
        <div 
          className="mobile-nav-overlay"
          onClick={() => setIsMobileNavOpen(false)}
        >
          <aside 
            className="mobile-nav-drawer"
            onClick={e => e.stopPropagation()}
            style={{ backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-sidebar-item)' }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f6ddd6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#13352f', fontWeight: 800 }}>🌸</div>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff', display: 'block', fontFamily: 'var(--font-display)' }}>Anju Auto Parts</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-sidebar-sub)' }}>Beltar, Udayapur</span>
                </div>
              </div>
              <button onClick={() => setIsMobileNavOpen(false)} className="btn btn-ghost" style={{ padding: '6px', color: '#ffffff' }}>
                <X size={20} />
              </button>
            </div>

            <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className="btn btn-ghost"
                    style={{
                      justifyContent: 'flex-start',
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '9999px',
                      fontSize: '14px',
                      fontWeight: isActive ? 700 : 500,
                      backgroundColor: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                      color: isActive ? 'var(--text-sidebar-active)' : 'var(--text-sidebar-item)'
                    }}
                  >
                    <Icon size={18} color={isActive ? 'var(--text-sidebar-active)' : 'currentColor'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* 3. Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--bg-app)' }}>
        
        {/* Navigation Header */}
        <header 
          className="app-header"
          style={{ 
            height: '72px', 
            backgroundColor: 'var(--bg-app)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '0 2rem',
            gap: '1.5rem',
            flexShrink: 0 
          }}
        >
          {/* Mobile Hamburger Toggle Button */}
          <button 
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            style={{ 
              display: 'none',
              padding: '8px',
              borderRadius: '9999px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-panel)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <Menu size={20} />
          </button>

          {/* Quick Search - Centered SaaS style */}
          <div className="header-search-container" style={{ flex: 1, maxWidth: '460px' }}>
            <button 
              type="button"
              onClick={() => setIsCmdOpen(true)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                padding: '10px 18px', 
                height: '44px',
                borderRadius: '9999px', 
                backgroundColor: 'var(--bg-panel)', 
                border: '1px solid var(--border-color)', 
                color: 'var(--text-tertiary)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 150ms ease'
              }}
              className="search-cmd-btn"
            >
              <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
              <span className="search-cmd-text" style={{ flex: 1, fontWeight: 450, color: 'var(--text-secondary)' }}>Search anything...</span>
              <span 
                className="cmd-k-shortcut"
                style={{ 
                  fontSize: '0.625rem', 
                  backgroundColor: 'var(--bg-app)', 
                  padding: '2px 7px', 
                  borderRadius: '9999px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontWeight: 600,
                  color: 'var(--text-tertiary)'
                }}
              >
                <Command size={9} /> K
              </span>
            </button>
          </div>

          {/* Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            
            {/* Notification Bell Center */}
            <NotificationBell onNavigate={handleNavigate} />

            <button 
              type="button" 
              onClick={toggleDarkMode}
              className="btn btn-ghost" 
              style={{ padding: '7px 9px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            
          </div>
        </header>

        {/* Dynamic Screen View Content */}
        <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          {currentScreen === 'dashboard' && (
            <Dashboard 
              onNavigate={handleNavigate}
              onTriggerAction={handleTriggerAction}
              onSelectPart={handleSelectPartFromGlobal}
            />
          )}

          {currentScreen === 'inventory' && (
            <Inventory 
              selectedPartFromGlobal={selectedPartFromGlobal}
              clearGlobalPartSelection={() => setSelectedPartFromGlobal(null)}
              isOpenAddModal={isOpenAddModal}
              setIsOpenAddModal={setIsOpenAddModal}
            />
          )}

          {currentScreen === 'customers' && (
            <Customers />
          )}

          {currentScreen === 'invoices' && (
            <Invoices />
          )}

          {currentScreen === 'suppliers' && (
            <Suppliers 
              isOpenAddPOModal={isOpenAddPOModal}
              setIsOpenAddPOModal={setIsOpenAddPOModal}
            />
          )}

          {currentScreen === 'sales' && (
            <Sales 
              isOpenAddSalesModal={isOpenAddSalesModal}
              setIsOpenAddSalesModal={setIsOpenAddSalesModal}
            />
          )}

          {currentScreen === 'returns' && (
            <Returns />
          )}

          {currentScreen === 'analytics' && (
            <Analytics />
          )}

          {currentScreen === 'settings' && (
            <Settings 
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
            />
          )}
        </main>

      </div>

      {/* Global Command Palette */}
      <CommandPalette 
        isOpen={isCmdOpen}
        onClose={() => setIsCmdOpen(false)}
        onNavigate={handleNavigate}
        onTriggerAction={handleTriggerAction}
        onSelectPart={handleSelectPartFromGlobal}
      />

    </div>
  </>
);
};

export default App;
