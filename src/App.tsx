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
  X,
  HardHat
} from 'lucide-react';

import type { Part } from './database/schema';

// Import Screens
import Dashboard from './screens/Dashboard';
import Inventory from './screens/Inventory';
import Helmets from './screens/Helmets';
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
    { id: 'helmets', label: '🪖 Helmets', icon: HardHat },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'suppliers', label: 'Suppliers', icon: Building2 },
    { id: 'sales', label: 'Sales Orders', icon: ShoppingBag },
    { id: 'returns', label: 'Inventory Adjustments', icon: RotateCcw },
    { id: 'analytics', label: 'Financial Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  if (isAppLoading) {
    return <InitialSplashScreen onComplete={() => setIsAppLoading(false)} />;
  }

  return (
    <>
      <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      
      {/* 1. Desktop Sidebar Panel (Apple Liquid Glass Theme) */}
      <aside 
        className="app-sidebar"
        style={{ 
          width: '260px', 
          backgroundColor: 'var(--bg-sidebar)', 
          backdropFilter: 'blur(32px) saturate(190%)',
          WebkitBackdropFilter: 'blur(32px) saturate(190%)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex', 
          flexDirection: 'column', 
          flexShrink: 0,
          color: 'var(--text-sidebar-item)',
          zIndex: 20
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
              width: '40px', 
              height: '40px', 
              borderRadius: '12px', 
              backgroundColor: 'var(--bg-hover)', 
              border: '1px solid var(--border-color)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
              padding: '3px'
            }}
          >
            <img 
              src="/logo.png" 
              alt="AAP Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
          <div>
            <span className="heading-display" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-sidebar-title)', display: 'block', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
              Anju Auto Parts
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-sidebar-sub)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
              Premium Experience · Beltar
            </span>
          </div>
        </div>

        {/* Sidebar Nav items */}
        <nav style={{ flex: 1, padding: '1rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '5px', overflowY: 'auto' }}>
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
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: '-0.01em',
                  transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                  background: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                  color: isActive ? 'var(--text-sidebar-active)' : 'var(--text-sidebar-item)',
                  boxShadow: isActive ? '0 2px 10px var(--color-brand-glow)' : 'none',
                  border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                  backdropFilter: isActive ? 'blur(16px)' : 'none',
                  WebkitBackdropFilter: isActive ? 'blur(16px)' : 'none',
                }}
              >
                <Icon size={17} color={isActive ? 'var(--color-brand)' : 'currentColor'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom User profile */}
        <div style={{ padding: '1rem' }}>
          <div
            style={{
              padding: '1rem',
              borderRadius: '16px',
              backgroundColor: 'var(--bg-hover)',
              border: '1px solid var(--border-color)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--color-brand)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  color: '#ffffff',
                  boxShadow: '0 2px 8px var(--color-brand-glow)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                AAP
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Anju Auto Parts</span>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-sidebar-sub)' }}>Executive Inventory</span>
              </div>
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
            style={{ 
              backgroundColor: 'var(--bg-sidebar)', 
              color: 'var(--text-sidebar-item)',
              backdropFilter: 'blur(32px) saturate(190%)',
              WebkitBackdropFilter: 'blur(32px) saturate(190%)',
              borderRight: '1px solid var(--border-color)'
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px' }}>
                  <img src="/logo.png" alt="AAP Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-sidebar-title)', display: 'block', fontFamily: 'var(--font-display)' }}>Anju Auto Parts</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-sidebar-sub)' }}>Beltar, Udayapur</span>
                </div>
              </div>
              <button onClick={() => setIsMobileNavOpen(false)} className="btn btn-ghost" style={{ padding: '6px', color: 'var(--text-primary)' }}>
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
                      fontWeight: isActive ? 600 : 500,
                      backgroundColor: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                      color: isActive ? 'var(--text-sidebar-active)' : 'var(--text-sidebar-item)',
                      border: isActive ? '1px solid var(--border-color)' : 'none',
                      boxShadow: isActive ? '0 2px 8px var(--color-brand-glow)' : 'none'
                    }}
                  >
                    <Icon size={18} color={isActive ? 'var(--color-brand)' : 'currentColor'} />
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
            backgroundColor: 'transparent', 
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border-subtle)',
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
            className="btn btn-ghost mobile-nav-toggle"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Open navigation drawer"
            style={{ color: 'var(--text-primary)' }}
          >
            <Menu size={20} />
          </button>

          {/* Search Trigger */}
          <div style={{ flex: 1, maxWidth: '400px', display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setIsCmdOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '9px 16px',
                borderRadius: '9999px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                color: 'var(--text-tertiary)',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.06)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={15} />
                <span>Search parts, invoices, customers...</span>
              </div>
              <kbd 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '2px', 
                  padding: '2px 7px', 
                  borderRadius: '6px', 
                  backgroundColor: 'var(--bg-subtle)', 
                  border: '1px solid var(--border-color)', 
                  fontSize: '11px', 
                  fontFamily: 'inherit',
                  color: 'var(--text-secondary)'
                }}
              >
                <Command size={11} /> K
              </kbd>
            </button>
          </div>

          {/* Header Action Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <NotificationBell onNavigate={handleNavigate} />

            <button
              onClick={toggleDarkMode}
              className="btn btn-ghost"
              style={{
                width: '38px',
                height: '38px',
                padding: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)'
              }}
              title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Apple Liquid Glass Dark Theme'}
            >
              {isDarkMode ? <Sun size={17} color="#fbbf24" /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        {/* Dynamic Route Screen Panel */}
        <main className="app-main-content" style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem 3rem' }}>
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

          {currentScreen === 'helmets' && (
            <Helmets />
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
