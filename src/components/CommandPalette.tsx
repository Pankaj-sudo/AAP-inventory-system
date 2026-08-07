import React, { useState, useEffect, useRef } from 'react';
import './components.css';
import { DB } from '../database/db';
import type { Part } from '../database/schema';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  onTriggerAction: (action: string) => void;
  onSelectPart: (part: Part) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onTriggerAction,
  onSelectPart
}) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands and parts
  const allParts = DB.getParts();
  const allHelmets = DB.getHelmets();

  const navigationCommands = [
    { label: 'Go to Dashboard Overview', shortcut: 'G D', action: () => onNavigate('dashboard') },
    { label: 'Go to Parts Inventory Catalog', shortcut: 'G I', action: () => onNavigate('inventory') },
    { label: 'Go to 🪖 Helmets Catalogue', shortcut: 'G H', action: () => onNavigate('helmets') },
    { label: 'Go to Customers List', shortcut: 'G C', action: () => onNavigate('customers') },
    { label: 'Go to Tax Invoices Ledger', shortcut: 'G F', action: () => onNavigate('invoices') },
    { label: 'Go to Supplier Channels', shortcut: 'G V', action: () => onNavigate('suppliers') },
    { label: 'Go to Sales Dispatch Ledger', shortcut: 'G R', action: () => onNavigate('sales') },
    { label: 'Go to Returns & Stock Control', shortcut: 'G T', action: () => onNavigate('returns') },
    { label: 'Go to Financial Analytics', shortcut: 'G A', action: () => onNavigate('analytics') },
    { label: 'Go to Settings Configuration', shortcut: 'G S', action: () => onNavigate('settings') }
  ];

  const actionCommands = [
    { label: 'Add New Spare Part', shortcut: 'A P', action: () => onTriggerAction('add-part') },
    { label: 'Create Purchase Order (Restock)', shortcut: 'C P', action: () => onTriggerAction('create-po') },
    { label: 'Record Sales Dispatch Sheet', shortcut: 'R S', action: () => onTriggerAction('create-sales') }
  ];

  const filteredItems = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    
    // Commands matching search
    const matchedNavs = navigationCommands.filter(c => c.label.toLowerCase().includes(q));
    const matchedActions = actionCommands.filter(c => c.label.toLowerCase().includes(q));

    // Parts matching search
    const matchedParts = q.length > 0 
      ? allParts.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.oemNumber.toLowerCase().includes(q))
      : [];

    // Helmets matching search
    const matchedHelmets = q.length > 0
      ? allHelmets.filter(h => h.productName.toLowerCase().includes(q) || h.sku.toLowerCase().includes(q) || h.brand.toLowerCase().includes(q))
      : [];

    return [
      ...matchedNavs.map(c => ({ type: 'command' as const, label: c.label, shortcut: c.shortcut, execute: c.action })),
      ...matchedActions.map(c => ({ type: 'action' as const, label: c.label, shortcut: c.shortcut, execute: c.action })),
      ...matchedHelmets.map(h => ({
        type: 'part' as const,
        label: `🪖 ${h.productName} (${h.brand})`,
        shortcut: h.sku,
        execute: () => onNavigate('helmets')
      })),
      ...matchedParts.map(p => ({
        type: 'part' as const,
        label: p.name,
        shortcut: p.sku,
        execute: () => onSelectPart(p)
      }))
    ];
  }, [query]);

  // Reset active index on query change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Auto-focus input
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [isOpen]);

  // Handle keyboard events inside command list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[activeIndex]) {
          filteredItems[activeIndex].execute();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, activeIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;
    const activeEl = listEl.querySelector('.cmd-item-active');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  if (!isOpen) return null;

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-content" onClick={e => e.stopPropagation()}>
        <div className="cmd-input-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Search commands, screens, parts (SKU, OEM)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <span className="cmd-shortcut">ESC</span>
        </div>

        <div className="cmd-list" ref={listRef}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
              No matches found for "{query}"
            </div>
          ) : (
            <>
              {/* Group Rendering based on search/types */}
              {filteredItems.map((item, index) => {
                const isActive = index === activeIndex;
                const isNewGroup = index === 0 || filteredItems[index - 1].type !== item.type;
                
                return (
                  <React.Fragment key={index}>
                    {isNewGroup && (
                      <div className="cmd-group-label">
                        {item.type === 'command' && 'Navigation'}
                        {item.type === 'action' && 'Quick Operations'}
                        {item.type === 'part' && 'Spare Parts Catalog'}
                      </div>
                    )}
                    <div
                      className={`cmd-item ${isActive ? 'cmd-item-active' : ''}`}
                      onClick={() => {
                        item.execute();
                        onClose();
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="cmd-item-left">
                        {item.type === 'command' && (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        )}
                        {item.type === 'action' && (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        )}
                        {item.type === 'part' && (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.552 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        )}
                        <span>{item.label}</span>
                      </div>
                      <span className="cmd-shortcut">{item.shortcut}</span>
                    </div>
                  </React.Fragment>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default CommandPalette;
