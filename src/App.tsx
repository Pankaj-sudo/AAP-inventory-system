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
      
      {/* 1. Desktop Sidebar Panel */}
      <aside 
        className="app-sidebar"
        style={{ 
          width: '250px', 
          backgroundColor: 'var(--bg-panel)', 
          borderRight: '1px solid var(--border-color)', 
          display: 'flex', 
          flexDirection: 'column', 
          flexShrink: 0 
        }}
      >
        {/* Brand/Logo */}
        <div 
          style={{ 
            padding: '1.25rem 1.5rem', 
            borderBottom: '1px solid var(--border-color)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px' 
          }}
        >
          <div 
            style={{ 
              width: '34px', 
              height: '34px', 
              borderRadius: 'var(--radius-sm)', 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.05rem',
              fontFamily: 'var(--font-display)',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
            }}
          >
            A
          </div>
          <div>
            <span className="heading-display" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', letterSpacing: '-0.03em' }}>Anju Auto Parts</span>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Beltar, Udayapur</span>
          </div>
        </div>

        {/* Sidebar Nav items */}
        <nav style={{ flex: 1, padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
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
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: '-0.01em',
                  transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                  backgroundColor: isActive ? 'rgba(16, 185, 129, 0.10)' : 'transparent',
                  color: isActive ? 'var(--color-brand)' : 'var(--text-secondary)',
                  borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent',
                  boxShadow: isActive ? '-2px 0 10px rgba(16, 185, 129, 0.4)' : 'none',
                  paddingLeft: isActive ? '9px' : '12px',
                }}
              >
                <Icon size={18} color={isActive ? 'var(--color-brand)' : 'currentColor'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User profile info */}
        <div 
          style={{ 
            padding: '1rem', 
            borderTop: '1px solid var(--border-color)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-hover)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div 
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: 'var(--radius-full)', 
                backgroundColor: 'rgba(16, 185, 129, 0.15)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.8rem',
                color: 'var(--color-brand)'
              }}
            >
              PY
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', color: 'var(--text-primary)' }}>Pankaj</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Pankaj.ydv707@gmail.com</span>
            </div>
          </div>
          <span 
            style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--color-success)', 
              boxShadow: '0 0 8px var(--color-success)' 
            }}
            title="Online Admin"
          />
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
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>A</div>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', display: 'block' }}>Anju Auto Parts</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Beltar, Udayapur</span>
                </div>
              </div>
              <button onClick={() => setIsMobileNavOpen(false)} className="btn btn-ghost" style={{ padding: '6px' }}>
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
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '14px',
                      fontWeight: isActive ? 700 : 500,
                      backgroundColor: isActive ? 'rgba(16, 185, 129, 0.10)' : 'transparent',
                      color: isActive ? 'var(--color-brand)' : 'var(--text-secondary)',
                      borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent'
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Navigation Header */}
        <header 
          className="app-header"
          style={{ 
            height: '64px', 
            backgroundColor: 'var(--bg-panel)', 
            borderBottom: '1px solid var(--border-color)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '0 1.5rem',
            gap: '1rem',
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
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-hover)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <Menu size={20} />
          </button>

          {/* Quick Search - Centered SaaS style */}
          <div className="header-search-container" style={{ flex: 1, maxWidth: '440px' }}>
            <button 
              type="button"
              onClick={() => setIsCmdOpen(true)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                padding: '10px 14px', 
                height: '44px',
                borderRadius: 'var(--radius-sm)', 
                backgroundColor: 'var(--bg-hover)', 
                border: '1px solid var(--border-color)', 
                color: 'var(--text-tertiary)',
                fontSize: '0.825rem',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 120ms ease'
              }}
              className="search-cmd-btn"
            >
              <Search size={18} style={{ color: 'var(--text-tertiary)' }} />
              <span className="search-cmd-text" style={{ flex: 1, fontWeight: 400, color: 'var(--text-secondary)' }}>Search parts, orders, clients, or commands...</span>
              <span 
                className="cmd-k-shortcut"
                style={{ 
                  fontSize: '0.625rem', 
                  backgroundColor: 'var(--bg-panel)', 
                  padding: '2px 5px', 
                  borderRadius: '4px',
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
