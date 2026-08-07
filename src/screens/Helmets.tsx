import React, { useState, useEffect, useMemo } from 'react';
import { DB } from '../database/db';
import type { Helmet, HelmetCategory, HelmetBrand } from '../database/schema';
import Modal from '../components/Modal';
import { 
  Plus, 
  Upload, 
  Download, 
  RefreshCw, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HardHat, 
  PackageCheck, 
  TrendingUp, 
  ShieldAlert, 
  Sparkles, 
  Layers, 
  BarChart3
} from 'lucide-react';

const HELMET_CATEGORIES: HelmetCategory[] = [
  'Full Face',
  'Open Face',
  'Modular',
  'Off Road',
  'Adventure',
  'Half Face',
  'Motocross',
  'Dual Sport'
];

const HELMET_BRANDS: HelmetBrand[] = [
  'SMK',
  'LS2',
  'Steelbird',
  'Studds',
  'Axor',
  'MT',
  'AGV',
  'HJC',
  'Shoei',
  'Arai',
  'Others'
];

function resolveImageUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  // Google Drive link handling
  const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }
  return trimmed;
}

function formatCurrency(val: number): string {
  return `Rs. ${val.toLocaleString('en-IN')}`;
}

export const Helmets: React.FC = () => {
  const [helmets, setHelmets] = useState<Helmet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'catalogue' | 'analytics'>('catalogue');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'alphabetical' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc'>('newest');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingHelmet, setEditingHelmet] = useState<Helmet | null>(null);
  const [viewingHelmet, setViewingHelmet] = useState<Helmet | null>(null);
  const [deletingHelmet, setDeletingHelmet] = useState<Helmet | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // CSV Import State
  const [importCsvText, setImportCsvText] = useState<string>('');
  const [importResults, setImportResults] = useState<{ successCount: number; errors: string[] } | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    productName: string;
    brand: string;
    model: string;
    sku: string;
    barcode: string;
    purchasePrice: number;
    wholesalePrice: number;
    salePrice: number;
    stockLevel: number;
    reorderPoint: number;
    maxStock: number;
    weight: string;
    size: string;
    colour: string;
    category: string;
    description: string;
    imageUrl: string;
  }>({
    productName: '',
    brand: 'SMK',
    model: '',
    sku: '',
    barcode: '',
    purchasePrice: 0,
    wholesalePrice: 0,
    salePrice: 0,
    stockLevel: 0,
    reorderPoint: 5,
    maxStock: 50,
    weight: '1450g',
    size: 'L',
    colour: 'Gloss Black',
    category: 'Full Face',
    description: '',
    imageUrl: ''
  });

  const loadData = () => {
    setIsLoading(true);
    const data = DB.getHelmets();
    setHelmets(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => {
      setHelmets(DB.getHelmets());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Google Sheets Bi-directional Sync
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const pullOk = await DB.syncPull();
      const pushOk = await DB.syncPush();
      setHelmets(DB.getHelmets());
      if (pullOk || pushOk) {
        showToast('Google Sheets synchronized successfully!');
      } else {
        showToast('Sync completed (local data active).');
      }
    } catch (err) {
      console.error('Sync failed:', err);
      showToast('Sync encountered an issue.');
    } finally {
      setIsSyncing(false);
    }
  };

  // KPI Computations
  const totalModels = helmets.length;
  const totalStock = helmets.reduce((acc, h) => acc + h.stockLevel, 0);
  const totalRetailValue = helmets.reduce((acc, h) => acc + (h.stockLevel * h.salePrice), 0);
  const totalCostValue = helmets.reduce((acc, h) => acc + (h.stockLevel * h.purchasePrice), 0);
  const lowStockCount = helmets.filter(h => h.stockLevel <= h.reorderPoint).length;
  const outOfStockCount = helmets.filter(h => h.stockLevel === 0).length;

  // Filtered & Sorted Helmets
  const filteredHelmets = useMemo(() => {
    return helmets.filter(h => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = h.productName.toLowerCase().includes(q);
        const matchesBrand = h.brand.toLowerCase().includes(q);
        const matchesSKU = h.sku.toLowerCase().includes(q);
        const matchesModel = h.model.toLowerCase().includes(q);
        const matchesBarcode = h.barcode.toLowerCase().includes(q);
        const matchesCat = h.category.toLowerCase().includes(q);
        if (!matchesName && !matchesBrand && !matchesSKU && !matchesModel && !matchesBarcode && !matchesCat) {
          return false;
        }
      }

      // Brand filter
      if (selectedBrand !== 'ALL' && h.brand !== selectedBrand) return false;

      // Category filter
      if (selectedCategory !== 'ALL' && h.category !== selectedCategory) return false;

      // Status filter
      if (selectedStatus === 'IN_STOCK' && h.stockLevel <= h.reorderPoint) return false;
      if (selectedStatus === 'LOW_STOCK' && (h.stockLevel === 0 || h.stockLevel > h.reorderPoint)) return false;
      if (selectedStatus === 'OUT_OF_STOCK' && h.stockLevel > 0) return false;

      // Price filter
      if (minPrice && h.salePrice < parseFloat(minPrice)) return false;
      if (maxPrice && h.salePrice > parseFloat(maxPrice)) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'alphabetical') return a.productName.localeCompare(b.productName);
      if (sortBy === 'price-asc') return a.salePrice - b.salePrice;
      if (sortBy === 'price-desc') return b.salePrice - a.salePrice;
      if (sortBy === 'stock-asc') return a.stockLevel - b.stockLevel;
      if (sortBy === 'stock-desc') return b.stockLevel - a.stockLevel;
      return 0;
    });
  }, [helmets, searchQuery, selectedBrand, selectedCategory, selectedStatus, minPrice, maxPrice, sortBy]);

  // Form Handlers
  const handleOpenCreateModal = () => {
    setEditingHelmet(null);
    setFormData({
      productName: '',
      brand: 'SMK',
      model: '',
      sku: `HM-${Date.now().toString().slice(-4)}`,
      barcode: `890${Date.now().toString().slice(-9)}`,
      purchasePrice: 4200,
      wholesalePrice: 5000,
      salePrice: 5800,
      stockLevel: 10,
      reorderPoint: 5,
      maxStock: 50,
      weight: '1450g',
      size: 'L',
      colour: 'Gloss Black',
      category: 'Full Face',
      description: '',
      imageUrl: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (h: Helmet) => {
    setEditingHelmet(h);
    setFormData({
      productName: h.productName,
      brand: h.brand,
      model: h.model,
      sku: h.sku,
      barcode: h.barcode,
      purchasePrice: h.purchasePrice,
      wholesalePrice: h.wholesalePrice,
      salePrice: h.salePrice,
      stockLevel: h.stockLevel,
      reorderPoint: h.reorderPoint,
      maxStock: h.maxStock,
      weight: h.weight,
      size: h.size,
      colour: h.colour,
      category: h.category,
      description: h.description,
      imageUrl: h.imageUrl
    });
    setIsFormOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName || !formData.sku) {
      alert('Product Name and SKU are required.');
      return;
    }

    if (editingHelmet) {
      DB.updateHelmet({
        ...editingHelmet,
        ...formData
      });
      showToast(`Updated "${formData.productName}"`);
    } else {
      DB.createHelmet(formData);
      showToast(`Created "${formData.productName}"`);
    }

    setHelmets(DB.getHelmets());
    setIsFormOpen(false);
  };

  const handleDuplicate = (h: Helmet) => {
    const dup = DB.duplicateHelmet(h.id);
    if (dup) {
      setHelmets(DB.getHelmets());
      showToast(`Duplicated "${h.productName}"`);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingHelmet) return;
    DB.deleteHelmet(deletingHelmet.id);
    setHelmets(DB.getHelmets());
    showToast(`Deleted "${deletingHelmet.productName}"`);
    setDeletingHelmet(null);
  };

  const handleQuickAdjustStock = (h: Helmet, delta: number) => {
    DB.adjustHelmetStock(h.id, delta, 'MANUAL_ADJUST', `Quick adjustment ${delta > 0 ? '+' : ''}${delta} from catalogue view`);
    setHelmets(DB.getHelmets());
    if (viewingHelmet?.id === h.id) {
      const updated = DB.getHelmets().find(item => item.id === h.id);
      if (updated) setViewingHelmet(updated);
    }
    showToast(`Stock updated for ${h.productName}`);
  };

  // CSV Export
  const handleExportCSV = () => {
    const csvStr = DB.exportHelmetsCSV();
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Helmet_Catalogue_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported helmet catalogue to CSV');
  };

  // CSV Import
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importCsvText.trim()) return;
    const res = DB.importHelmetsCSV(importCsvText);
    setImportResults(res);
    if (res.successCount > 0) {
      setHelmets(DB.getHelmets());
      showToast(`Imported ${res.successCount} helmets successfully!`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%' }}>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div 
          style={{ 
            position: 'fixed', 
            bottom: '24px', 
            right: '24px', 
            zIndex: 3000, 
            backgroundColor: 'var(--bg-panel)', 
            color: 'var(--text-primary)',
            padding: '12px 20px', 
            borderRadius: 'var(--radius-sm)', 
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--color-brand)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 200ms ease'
          }}
        >
          <Sparkles size={18} color="var(--color-brand)" />
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.75rem' }}>🪖</span>
            <h1 className="heading-display" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Helmet Inventory
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Manage helmet catalogue, pricing, stock levels, and inventory.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleOpenCreateModal} 
            className="btn btn-primary"
            style={{ borderRadius: '9999px', padding: '10px 18px', gap: '8px' }}
          >
            <Plus size={16} />
            <span>Add Helmet</span>
          </button>

          <button 
            onClick={() => { setIsImportModalOpen(true); setImportResults(null); }} 
            className="btn btn-secondary"
            style={{ borderRadius: '9999px', padding: '10px 16px', gap: '8px' }}
          >
            <Upload size={15} />
            <span>Import</span>
          </button>

          <button 
            onClick={handleExportCSV} 
            className="btn btn-secondary"
            style={{ borderRadius: '9999px', padding: '10px 16px', gap: '8px' }}
          >
            <Download size={15} />
            <span>Export</span>
          </button>

          <button 
            onClick={handleSync} 
            disabled={isSyncing}
            className="btn btn-ghost"
            style={{ 
              borderRadius: '9999px', 
              padding: '10px 16px', 
              gap: '8px', 
              border: '1px solid var(--border-color)',
              backgroundColor: isSyncing ? 'var(--bg-hover)' : 'var(--bg-panel)'
            }}
            title="Bi-directional Google Sheets Synchronization"
          >
            <RefreshCw size={15} className={isSyncing ? 'spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Top 4 Statistics) */}
      <div className="dashboard-kpi-grid">
        {/* KPI 1: Total Helmet Models */}
        <div className="kpi-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Helmet Models
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.12)', color: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardHat size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {totalModels}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            Across {HELMET_BRANDS.length} riding gear brands
          </div>
        </div>

        {/* KPI 2: Total Helmet Stock */}
        <div className="kpi-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Helmet Stock
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--color-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PackageCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {totalStock.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>units</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '4px', fontWeight: 600 }}>
            ✓ Ready for instant dispatch
          </div>
        </div>

        {/* KPI 3: Inventory Value */}
        <div className="kpi-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Inventory Value
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(217, 70, 239, 0.12)', color: '#d946ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(totalRetailValue)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            Cost Value: <strong style={{ color: 'var(--text-secondary)' }}>{formatCurrency(totalCostValue)}</strong>
          </div>
        </div>

        {/* KPI 4: Low Stock Helmets */}
        <div className="kpi-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Low Stock Helmets
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: lowStockCount > 0 ? 'var(--color-warning-bg)' : 'var(--color-success-bg)', color: lowStockCount > 0 ? 'var(--color-warning)' : 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: lowStockCount > 0 ? 'var(--color-warning)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {lowStockCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {outOfStockCount > 0 ? `${outOfStockCount} completely out of stock` : 'No out-of-stock items'}
          </div>
        </div>
      </div>

      {/* Main View Tabs (Catalogue vs Reports) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setActiveTab('catalogue')}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              border: 'none',
              background: activeTab === 'catalogue' ? 'var(--color-brand)' : 'transparent',
              color: activeTab === 'catalogue' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 150ms ease'
            }}
          >
            <Layers size={15} />
            <span>Product Catalogue</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              border: 'none',
              background: activeTab === 'analytics' ? 'var(--color-brand)' : 'transparent',
              color: activeTab === 'analytics' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 150ms ease'
            }}
          >
            <BarChart3 size={15} />
            <span>Analytics & Reports</span>
          </button>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
          Showing {filteredHelmets.length} of {helmets.length} products
        </div>
      </div>

      {activeTab === 'catalogue' ? (
        <>
          {/* Filtering Toolbar */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              
              {/* Search Bar */}
              <div style={{ flex: '1 1 240px', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input 
                  type="text"
                  placeholder="Search by name, brand, SKU, barcode..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input"
                  style={{ paddingLeft: '40px', height: '42px', borderRadius: '9999px' }}
                />
              </div>

              {/* Brand Filter */}
              <div style={{ minWidth: '130px' }}>
                <select 
                  value={selectedBrand} 
                  onChange={e => setSelectedBrand(e.target.value)}
                  className="input"
                  style={{ height: '42px', borderRadius: '9999px', fontSize: '0.85rem' }}
                >
                  <option value="ALL">All Brands</option>
                  {HELMET_BRANDS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div style={{ minWidth: '140px' }}>
                <select 
                  value={selectedCategory} 
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="input"
                  style={{ height: '42px', borderRadius: '9999px', fontSize: '0.85rem' }}
                >
                  <option value="ALL">All Categories</option>
                  {HELMET_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div style={{ minWidth: '130px' }}>
                <select 
                  value={selectedStatus} 
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="input"
                  style={{ height: '42px', borderRadius: '9999px', fontSize: '0.85rem' }}
                >
                  <option value="ALL">All Status</option>
                  <option value="IN_STOCK">In Stock</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
              </div>

              {/* Sort By */}
              <div style={{ minWidth: '150px' }}>
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value as any)}
                  className="input"
                  style={{ height: '42px', borderRadius: '9999px', fontSize: '0.85rem' }}
                >
                  <option value="newest">Newest First</option>
                  <option value="alphabetical">Alphabetical (A-Z)</option>
                  <option value="price-desc">Highest Price</option>
                  <option value="price-asc">Lowest Price</option>
                  <option value="stock-desc">Highest Stock</option>
                  <option value="stock-asc">Lowest Stock</option>
                </select>
              </div>

            </div>

            {/* Price Range Sub-row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <Filter size={14} color="var(--text-tertiary)" />
              <span style={{ fontWeight: 600 }}>Price Range:</span>
              <input 
                type="number" 
                placeholder="Min Rs." 
                value={minPrice} 
                onChange={e => setMinPrice(e.target.value)}
                className="input"
                style={{ width: '110px', height: '32px', borderRadius: '9999px', fontSize: '0.8rem', padding: '0 12px' }}
              />
              <span>to</span>
              <input 
                type="number" 
                placeholder="Max Rs." 
                value={maxPrice} 
                onChange={e => setMaxPrice(e.target.value)}
                className="input"
                style={{ width: '110px', height: '32px', borderRadius: '9999px', fontSize: '0.8rem', padding: '0 12px' }}
              />
              {(minPrice || maxPrice || searchQuery || selectedBrand !== 'ALL' || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedBrand('ALL');
                    setSelectedCategory('ALL');
                    setSelectedStatus('ALL');
                    setMinPrice('');
                    setMaxPrice('');
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ borderRadius: '9999px', color: 'var(--color-danger)', fontSize: '0.75rem', padding: '4px 12px' }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Catalogue Grid */}
          {isLoading ? (
            <div className="helmet-catalogue-grid">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="helmet-card" style={{ height: '380px', opacity: 0.5, animation: 'pulse 1.5s infinite' }}>
                  <div className="helmet-image-frame" />
                  <div className="helmet-card-body" />
                </div>
              ))}
            </div>
          ) : filteredHelmets.length === 0 ? (
            <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--text-tertiary)' }}>
                <HardHat size={32} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                No Helmets Found
              </h3>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
                We couldn't find any helmet products matching your filter criteria. Try adjusting search or reset filters.
              </p>
              <button 
                onClick={handleOpenCreateModal} 
                className="btn btn-primary"
                style={{ borderRadius: '9999px', padding: '10px 20px' }}
              >
                <Plus size={16} />
                <span>Add First Helmet</span>
              </button>
            </div>
          ) : (
            <div className="helmet-catalogue-grid">
              {filteredHelmets.map(h => {
                const img = resolveImageUrl(h.imageUrl);
                const isOut = h.stockLevel === 0;
                const isLow = h.stockLevel > 0 && h.stockLevel <= h.reorderPoint;
                const stockPct = Math.min(100, Math.round((h.stockLevel / h.maxStock) * 100));

                return (
                  <div key={h.id} className="helmet-card">
                    {/* Image Area */}
                    <div className="helmet-image-frame">
                      {/* Top Left: Category Pill */}
                      <div className="helmet-card-badge-top-left">
                        <span className="badge badge-secondary" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(22, 16, 38, 0.75)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.7rem' }}>
                          {h.category}
                        </span>
                      </div>

                      {/* Top Right: Stock Status Badge */}
                      <div className="helmet-card-badge-top-right">
                        {isOut ? (
                          <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '0.7rem' }}>
                            <XCircle size={11} /> Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '0.7rem' }}>
                            <AlertTriangle size={11} /> Low Stock
                          </span>
                        ) : (
                          <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '0.7rem' }}>
                            <CheckCircle2 size={11} /> In Stock
                          </span>
                        )}
                      </div>

                      {/* Image Render / SVG Placeholder */}
                      {img ? (
                        <img 
                          src={img} 
                          alt={h.productName} 
                          className="helmet-image-element"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '1rem' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand)' }}>
                            <HardHat size={26} />
                          </div>
                          <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            {h.brand} · Frame Ready
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Content Body */}
                    <div className="helmet-card-body">
                      <div className="helmet-brand-tag">{h.brand}</div>
                      <h3 className="helmet-title" title={h.productName}>{h.productName}</h3>

                      <div className="helmet-sku-row">
                        <span>SKU: <strong style={{ color: 'var(--text-secondary)' }}>{h.sku}</strong></span>
                        <span>Size: <strong style={{ color: 'var(--text-secondary)' }}>{h.size}</strong></span>
                      </div>

                      {/* Price Matrix Stack */}
                      <div className="helmet-price-grid">
                        <div className="helmet-price-item">
                          <span className="helmet-price-label">Purchase</span>
                          <span className="helmet-price-val">{formatCurrency(h.purchasePrice)}</span>
                        </div>
                        <div className="helmet-price-item">
                          <span className="helmet-price-label">Wholesale</span>
                          <span className="helmet-price-val">{formatCurrency(h.wholesalePrice)}</span>
                        </div>
                        <div className="helmet-price-item">
                          <span className="helmet-price-label" style={{ color: 'var(--color-brand)' }}>Selling</span>
                          <span className="helmet-price-val highlight">{formatCurrency(h.salePrice)}</span>
                        </div>
                      </div>

                      {/* Stock Level Progress */}
                      <div className="helmet-stock-bar-wrapper">
                        <div className="helmet-stock-label-row">
                          <span>Stock Level</span>
                          <span style={{ color: isOut ? 'var(--color-danger)' : isLow ? 'var(--color-warning)' : 'var(--text-primary)', fontWeight: 700 }}>
                            {h.stockLevel} units
                          </span>
                        </div>
                        <div className="helmet-stock-progress-track">
                          <div 
                            className="helmet-stock-progress-fill" 
                            style={{ 
                              width: `${stockPct}%`, 
                              backgroundColor: isOut ? 'var(--color-danger)' : isLow ? 'var(--color-warning)' : 'var(--color-success)' 
                            }} 
                          />
                        </div>
                      </div>

                      {/* Quick Actions Bar */}
                      <div className="helmet-card-footer">
                        <button 
                          onClick={() => setViewingHelmet(h)}
                          className="btn btn-ghost btn-sm"
                          style={{ flex: 1, borderRadius: '9999px', fontSize: '0.75rem', gap: '4px' }}
                          title="View Details"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>

                        <button 
                          onClick={() => handleOpenEditModal(h)}
                          className="btn btn-ghost btn-sm"
                          style={{ flex: 1, borderRadius: '9999px', fontSize: '0.75rem', gap: '4px' }}
                          title="Edit Helmet"
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>

                        <button 
                          onClick={() => handleDuplicate(h)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '6px', borderRadius: '50%' }}
                          title="Duplicate Product"
                        >
                          <Copy size={13} />
                        </button>

                        <button 
                          onClick={() => setDeletingHelmet(h)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '6px', borderRadius: '50%', color: 'var(--color-danger)' }}
                          title="Delete Helmet"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Analytics & Reports Section */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 className="heading-display" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Helmet Analytics & Performance Overview
            </h2>

            <div className="table-container">
              <table className="table">
                <thead className="table-head">
                  <tr>
                    <th>Helmet Model</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Stock Units</th>
                    <th>Cost Price</th>
                    <th>Retail Price</th>
                    <th>Valuation</th>
                    <th>Stock Health</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {helmets.map(h => {
                    const isOut = h.stockLevel === 0;
                    const isLow = h.stockLevel <= h.reorderPoint;
                    const val = h.stockLevel * h.salePrice;

                    return (
                      <tr key={h.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{h.productName}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>SKU: {h.sku}</div>
                        </td>
                        <td><span className="badge badge-secondary">{h.brand}</span></td>
                        <td>{h.category}</td>
                        <td><strong style={{ fontFamily: 'var(--font-mono)' }}>{h.stockLevel}</strong></td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(h.purchasePrice)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brand)', fontWeight: 700 }}>{formatCurrency(h.salePrice)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{formatCurrency(val)}</td>
                        <td>
                          {isOut ? (
                            <span className="badge badge-danger">Out of Stock</span>
                          ) : isLow ? (
                            <span className="badge badge-warning">Low Stock</span>
                          ) : (
                            <span className="badge badge-success">Optimal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ─── Modal 1: Add / Edit Helmet Form Modal ────────────────────────────── */}
      {isFormOpen && (
        <Modal 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)}
          title={editingHelmet ? `Edit Helmet: ${editingHelmet.productName}` : 'Add New Helmet Product'}
        >
          <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              
              <div>
                <label className="form-label">Product Name *</label>
                <input 
                  type="text" 
                  required 
                  value={formData.productName}
                  onChange={e => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="e.g. SMK Stellar Gloss Black"
                  className="input"
                />
              </div>

              <div>
                <label className="form-label">Brand *</label>
                <select 
                  value={formData.brand}
                  onChange={e => setFormData({ ...formData, brand: e.target.value })}
                  className="input"
                >
                  {HELMET_BRANDS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Model *</label>
                <input 
                  type="text" 
                  required
                  value={formData.model}
                  onChange={e => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g. Stellar"
                  className="input"
                />
              </div>

              <div>
                <label className="form-label">Category *</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="input"
                >
                  {HELMET_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">SKU *</label>
                <input 
                  type="text" 
                  required
                  value={formData.sku}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g. SMK-001"
                  className="input"
                />
              </div>

              <div>
                <label className="form-label">Barcode</label>
                <input 
                  type="text" 
                  value={formData.barcode}
                  onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="e.g. 890123400001"
                  className="input"
                />
              </div>

              <div>
                <label className="form-label">Purchase Price (Cost Rs.) *</label>
                <input 
                  type="number" 
                  required
                  value={formData.purchasePrice}
                  onChange={e => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                  className="input"
                />
              </div>

              <div>
                <label className="form-label">Wholesale Price (Rs.) *</label>
                <input 
                  type="number" 
                  required
                  value={formData.wholesalePrice}
                  onChange={e => setFormData({ ...formData, wholesalePrice: parseFloat(e.target.value) || 0 })}
                  className="input"
                />
              </div>

              <div>
                <label className="form-label">Retail Selling Price (Rs.) *</label>
                <input 
                  type="number" 
                  required
                  value={formData.salePrice}
                  onChange={e => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                  className="input"
                />
              </div>

              <div>
                <label className="form-label">Current Stock Level *</label>
                <input 
                  type="number" 
                  required
                  value={formData.stockLevel}
                  onChange={e => setFormData({ ...formData, stockLevel: parseInt(e.target.value) || 0 })}
                  className="input"
                />
              </div>

              <div>
                <label className="form-label">Minimum Stock (Reorder Point)</label>
                <input 
                  type="number" 
                  value={formData.reorderPoint}
                  onChange={e => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) || 0 })}
                  className="input"
                />
              </div>

              <div>
                <label className="form-label">Maximum Stock Capacity</label>
                <input 
                  type="number" 
                  value={formData.maxStock}
                  onChange={e => setFormData({ ...formData, maxStock: parseInt(e.target.value) || 0 })}
                  className="input"
                />
              </div>

              <div>
                <label className="form-label">Weight</label>
                <input 
                  type="text" 
                  value={formData.weight}
                  onChange={e => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="e.g. 1450g"
                  className="input"
                />
              </div>

              <div>
                <label className="form-label">Size</label>
                <input 
                  type="text" 
                  value={formData.size}
                  onChange={e => setFormData({ ...formData, size: e.target.value })}
                  placeholder="e.g. M, L, XL"
                  className="input"
                />
              </div>

              <div>
                <label className="form-label">Colour</label>
                <input 
                  type="text" 
                  value={formData.colour}
                  onChange={e => setFormData({ ...formData, colour: e.target.value })}
                  placeholder="e.g. Gloss Black"
                  className="input"
                />
              </div>

              <div>
                <label className="form-label">Google Drive Image URL</label>
                <input 
                  type="url" 
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://drive.google.com/file/d/..."
                  className="input"
                />
              </div>

            </div>

            <div>
              <label className="form-label">Description</label>
              <textarea 
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product overview, materials, and safety certification details..."
                className="input"
                style={{ height: 'auto', padding: '10px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '1rem' }}>
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)} 
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ borderRadius: '9999px', padding: '10px 24px' }}
              >
                {editingHelmet ? 'Save Changes' : 'Create Helmet Product'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Modal 2: View Helmet Specs & Stock Manager Drawer ───────────────── */}
      {viewingHelmet && (
        <Modal
          isOpen={!!viewingHelmet}
          onClose={() => setViewingHelmet(null)}
          title={`Helmet Product Details: ${viewingHelmet.productName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Top Image Preview & Specs */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '1.5rem' }}>
              
              <div className="helmet-image-frame" style={{ borderRadius: 'var(--radius-md)', height: '180px' }}>
                {resolveImageUrl(viewingHelmet.imageUrl) ? (
                  <img src={resolveImageUrl(viewingHelmet.imageUrl)} alt={viewingHelmet.productName} className="helmet-image-element" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand)' }}>
                    <HardHat size={40} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Placeholder Frame</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="badge badge-secondary" style={{ width: 'fit-content' }}>{viewingHelmet.category}</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{viewingHelmet.productName}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{viewingHelmet.description || 'No description added yet.'}</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: 'auto', background: 'var(--bg-hover)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', display: 'block' }}>Cost Price</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{formatCurrency(viewingHelmet.purchasePrice)}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', display: 'block' }}>Wholesale Price</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{formatCurrency(viewingHelmet.wholesalePrice)}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-brand)', display: 'block' }}>Retail Price</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--color-brand)' }}>{formatCurrency(viewingHelmet.salePrice)}</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Stock Controls */}
            <div style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, display: 'block' }}>
                  Stock Management
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {viewingHelmet.stockLevel} units in inventory
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleQuickAdjustStock(viewingHelmet, -1)} className="btn btn-secondary btn-sm" style={{ borderRadius: '9999px' }}>-1 Unit</button>
                <button onClick={() => handleQuickAdjustStock(viewingHelmet, -5)} className="btn btn-secondary btn-sm" style={{ borderRadius: '9999px' }}>-5 Units</button>
                <button onClick={() => handleQuickAdjustStock(viewingHelmet, 1)} className="btn btn-primary btn-sm" style={{ borderRadius: '9999px' }}>+1 Restock</button>
                <button onClick={() => handleQuickAdjustStock(viewingHelmet, 5)} className="btn btn-primary btn-sm" style={{ borderRadius: '9999px' }}>+5 Restock</button>
              </div>
            </div>

            {/* Technical Specs List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.85rem' }}>
              <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>SKU: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{viewingHelmet.sku}</strong>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Barcode: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{viewingHelmet.barcode}</strong>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Weight: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{viewingHelmet.weight}</strong>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Size / Colour: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{viewingHelmet.size} / {viewingHelmet.colour}</strong>
              </div>
            </div>

            {/* Google Drive Link */}
            {viewingHelmet.imageUrl && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', wordBreak: 'break-all' }}>
                Image Source: <a href={viewingHelmet.imageUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-brand)', textDecoration: 'underline' }}>{viewingHelmet.imageUrl}</a>
              </div>
            )}

          </div>
        </Modal>
      )}

      {/* ─── Modal 3: CSV Import Modal ────────────────────────────────────────── */}
      {isImportModalOpen && (
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Import Helmet Catalogue via CSV"
        >
          <form onSubmit={handleImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Paste raw CSV data or CSV format rows. Expected headers include: <code>Product Name, Brand, SKU, Purchase Price, Wholesale Price, Retail Price, Current Stock, Category, Google Drive Image URL</code>
            </p>

            <textarea 
              rows={8}
              value={importCsvText}
              onChange={e => setImportCsvText(e.target.value)}
              placeholder={`"Product Name","Brand","SKU","Purchase Price","Wholesale Price","Retail Price","Current Stock","Category"\n"SMK Stellar Gloss Black","SMK","SMK-001",4200,5000,5800,18,"Full Face"`}
              className="input"
              style={{ height: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
            />

            {importResults && (
              <div style={{ padding: '10px', borderRadius: 'var(--radius-xs)', backgroundColor: importResults.successCount > 0 ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: importResults.successCount > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  Successfully imported {importResults.successCount} product(s).
                </strong>
                {importResults.errors.length > 0 && (
                  <ul style={{ fontSize: '0.75rem', marginTop: '6px', color: 'var(--color-danger)', paddingLeft: '1.2rem' }}>
                    {importResults.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => setIsImportModalOpen(false)} className="btn btn-ghost">Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ borderRadius: '9999px', padding: '8px 20px' }}>Process CSV Import</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Modal 4: Delete Confirmation Dialog ────────────────────────────── */}
      {deletingHelmet && (
        <Modal
          isOpen={!!deletingHelmet}
          onClose={() => setDeletingHelmet(null)}
          title="Confirm Helmet Deletion"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>"{deletingHelmet.productName}"</strong> (SKU: {deletingHelmet.sku}) from your helmet catalogue?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setDeletingHelmet(null)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleDeleteConfirm} className="btn btn-danger" style={{ borderRadius: '9999px', padding: '8px 20px' }}>
                Delete Helmet
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default Helmets;
