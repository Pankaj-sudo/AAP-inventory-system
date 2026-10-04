import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../hooks/useInventory';
import type { Part } from '../database/schema';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import Barcode from '../components/Barcode';
import ProductThumbnail from '../components/ProductThumbnail';
import { 
  SlidersHorizontal, 
  Download, 
  Upload,
  Edit2
} from 'lucide-react';

interface InventoryProps {
  selectedPartFromGlobal: Part | null;
  clearGlobalPartSelection: () => void;
  isOpenAddModal: boolean;
  setIsOpenAddModal: (open: boolean) => void;
}

export const Inventory: React.FC<InventoryProps> = ({
  selectedPartFromGlobal,
  clearGlobalPartSelection,
  isOpenAddModal,
  setIsOpenAddModal
}) => {
  const {
    parts,
    allFilteredPartsRaw,
    allPartsRaw,
    categories,
    suppliers,
    vehicles,
    filters,
    setFilters,
    stats,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    addPart,
    updatePart,
    deletePart,
    getStockMovements,
    getProductHistory,
    importCSV,
    exportCSV
  } = useInventory();

  // Advanced Filters toggle
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Selected Part for Drawer
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'specs' | 'movements' | 'history'>('specs');

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ partId: string; field: 'stockLevel' | 'wholesalePrice' | 'salePrice' } | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Bulk Import Modal State
  const [isOpenImportModal, setIsOpenImportModal] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [importReport, setImportReport] = useState<{ success: number; errors: string[] } | null>(null);

  // Sync global selection (e.g. from Dashboard click or command palette search)
  useEffect(() => {
    if (selectedPartFromGlobal) {
      setSelectedPartId(selectedPartFromGlobal.id);
      setActiveDrawerTab('specs');
      clearGlobalPartSelection();
    }
  }, [selectedPartFromGlobal]);

  const activePart = useMemo(() => {
    return allPartsRaw.find(p => p.id === selectedPartId) || null;
  }, [selectedPartId, allPartsRaw]);

  // Drawer Stock Quick Adjust Form State
  const [adjustQty, setAdjustQty] = useState('');

  // Add Part Form State
  const [newPartForm, setNewPartForm] = useState({
    sku: '',
    name: '',
    oemNumber: '',
    categoryId: '',
    supplierId: '',
    costPrice: 0,
    wholesalePrice: 0,
    salePrice: 0,
    stockLevel: 0,
    reorderPoint: 3,
    maxStock: 50,
    unit: 'Pcs',
    binLocation: '',
    description: '',
    brand: 'Yamaha',
    barcode: '',
    imageUrl: '/parts_thumbnail.png',
    compatibilityIds: [] as string[]
  });

  // Edit Part Form State (for detail sheet edit toggle)
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Part | null>(null);

  const handleRowClick = (part: Part, e: React.MouseEvent) => {
    // Prevent opening drawer if clicking inline input
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    
    setSelectedPartId(part.id);
    setIsEditing(false);
    setEditForm(null);
    setActiveDrawerTab('specs');
    setAdjustQty('');
  };

  const handleCloseDrawer = () => {
    setSelectedPartId(null);
    setIsEditing(false);
    setEditForm(null);
    setAdjustQty('');
  };

  const handleQuickAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePart) return;
    const qty = parseInt(adjustQty);
    if (isNaN(qty)) return;

    const updated = {
      ...activePart,
      stockLevel: Math.max(0, activePart.stockLevel + qty)
    };
    updatePart(updated);
    setAdjustQty('');
  };

  const startEditing = () => {
    if (!activePart) return;
    setEditForm({ ...activePart });
    setIsEditing(true);
  };

  const handleEditCompatToggle = (vehId: string) => {
    if (!editForm) return;
    const list = editForm.compatibilityIds.includes(vehId)
      ? editForm.compatibilityIds.filter(id => id !== vehId)
      : [...editForm.compatibilityIds, vehId];
    setEditForm({ ...editForm, compatibilityIds: list });
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    updatePart(editForm);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!activePart) return;
    if (window.confirm(`Are you sure you want to delete ${activePart.name}?`)) {
      deletePart(activePart.id);
      handleCloseDrawer();
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartForm.name.trim() || !newPartForm.categoryId || !newPartForm.supplierId) {
      alert('Please fill in all required fields (Part Name, Category, Supplier).');
      return;
    }

    // Auto-generate SKU if left blank
    const selectedCategory = categories.find(c => c.id === newPartForm.categoryId);
    const catCode = selectedCategory
      ? selectedCategory.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()
      : 'PRT';
    const brandCode = newPartForm.brand
      ? newPartForm.brand.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()
      : 'GEN';
    const randomSuffix = Math.floor(100 + Math.random() * 900);

    const finalSKU = newPartForm.sku.trim()
      ? newPartForm.sku.trim().toUpperCase()
      : `${catCode}-${brandCode}-${randomSuffix}`;

    const finalOEM = newPartForm.oemNumber.trim()
      ? newPartForm.oemNumber.trim().toUpperCase()
      : `OEM-${brandCode}-${Date.now().toString().slice(-6)}`;

    const generatedBarcode = newPartForm.barcode.trim() || `74${Date.now().toString().slice(-10)}`;
    addPart({
      ...newPartForm,
      name: newPartForm.name.trim(),
      sku: finalSKU,
      oemNumber: finalOEM,
      barcode: generatedBarcode,
      imageUrl: newPartForm.imageUrl.trim() || '/parts_thumbnail.png',
      wholesalePrice: newPartForm.wholesalePrice || newPartForm.costPrice,
      salePrice: newPartForm.salePrice || newPartForm.wholesalePrice
    });
    
    setIsOpenAddModal(false);
    // Reset Form
    setNewPartForm({
      sku: '',
      name: '',
      oemNumber: '',
      categoryId: '',
      supplierId: '',
      costPrice: 0,
      wholesalePrice: 0,
      salePrice: 0,
      stockLevel: 0,
      reorderPoint: 3,
      maxStock: 50,
      unit: 'Pcs',
      binLocation: '',
      description: '',
      brand: 'Yamaha',
      barcode: '',
      imageUrl: '/parts_thumbnail.png',
      compatibilityIds: []
    });
  };

  // CSV Operations
  const handleExportCSV = () => {
    const csvContent = exportCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Motorcycle_Parts_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSVSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvInput.trim()) {
      alert('Please paste some CSV content.');
      return;
    }
    const report = importCSV(csvInput);
    setImportReport({
      success: report.successCount,
      errors: report.errors
    });
    setCsvInput('');
  };

  // Inline Cell Edits
  const handleDoubleCellClick = (partId: string, field: 'stockLevel' | 'wholesalePrice' | 'salePrice', currentVal: number) => {
    setEditingCell({ partId, field });
    setEditingValue(String(currentVal));
  };

  const handleInlineSave = (part: Part) => {
    if (!editingCell) return;
    const { field } = editingCell;
    let numericVal: number;
    if (field === 'stockLevel') {
      numericVal = parseInt(editingValue);
    } else {
      numericVal = parseFloat(editingValue);
    }

    if (isNaN(numericVal) || numericVal < 0) {
      setEditingCell(null);
      return;
    }

    const updated = {
      ...part,
      [field]: numericVal
    };
    updatePart(updated);
    setEditingCell(null);
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent, part: Part) => {
    if (e.key === 'Enter') {
      handleInlineSave(part);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // UI Helpers
  const getCategoryName = (catId: string) => categories.find(c => c.id === catId)?.name || 'N/A';
  const getSupplierName = (supId: string) => suppliers.find(s => s.id === supId)?.name || 'N/A';

  const motorcycleBrands = [
    'Yamaha', 'Honda', 'Hero Honda', 'Suzuki', 'TVS', 'Bajaj', 'Royal Enfield', 'KTM', 'Kawasaki', 'Benelli', 'CFMoto', 'Others'
  ];

  const handleSort = (key: string) => {
    setFilters(prev => {
      const isSame = prev.sortBy === key;
      const order = isSame && prev.sortOrder === 'asc' ? 'desc' : 'asc';
      return {
        ...prev,
        sortBy: key as any,
        sortOrder: order
      };
    });
  };

  // Brand Badge Style Helper (Requirement 12)
  const getBrandBadgeStyle = (brand: string) => {
    const b = (brand || '').toLowerCase().trim();
    if (b.includes('honda')) return { backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5' };
    if (b.includes('yamaha')) return { backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' };
    if (b.includes('suzuki')) return { backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' };
    if (b.includes('ktm')) return { backgroundColor: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa' };
    if (b.includes('tvs')) return { backgroundColor: '#ecfeff', color: '#155e75', border: '1px solid #a5f3fc' };
    if (b.includes('hero')) return { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
    if (b.includes('royal')) return { backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' };
    if (b.includes('bajaj')) return { backgroundColor: '#faf5ff', color: '#6b21a8', border: '1px solid #e9d5ff' };
    return { backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0' };
  };

  // Calculate current range description
  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, allFilteredPartsRaw.length);
  const totalStockUnits = allFilteredPartsRaw.reduce((sum, p) => sum + p.stockLevel, 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Page Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="heading-display" style={{ fontSize: '1.625rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.25 }}>Parts Inventory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px', fontWeight: 450 }}>
            Manage inventory, pricing, stock levels, and warehouse locations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
          <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={() => { setIsOpenImportModal(true); setImportReport(null); }}>Import CSV</Button>
          <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={handleExportCSV}>Export CSV</Button>
          <Button variant="primary" size="sm" style={{ marginLeft: '6px' }} onClick={() => setIsOpenAddModal(true)}>+ Add Spare Part</Button>
        </div>
      </div>

      {/* ── Micro Statistics Summary Bar ⭐ ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '0.875rem 1.25rem', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>📦 Total Parts</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontFeatureSettings: "'tnum'", marginTop: '2px' }}>
              {stats.totalParts.toLocaleString()}
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16a34a', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>▲ 2%</span>
        </div>

        <div className="card" style={{ padding: '0.875rem 1.25rem', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>⚠️ Low Stock</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: stats.lowStockCount > 0 ? '#ea580c' : 'var(--text-primary)', fontFamily: 'var(--font-display)', fontFeatureSettings: "'tnum'", marginTop: '2px' }}>
              {stats.lowStockCount}
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#ea580c', backgroundColor: '#fff7ed', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #fed7aa', fontWeight: 600 }}>Restock</span>
        </div>

        <div className="card" style={{ padding: '0.875rem 1.25rem', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>💰 Inventory Value</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontFeatureSettings: "'tnum'", marginTop: '2px' }}>
              Rs. {stats.totalStockValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>At cost</span>
        </div>

        <div className="card" style={{ padding: '0.875rem 1.25rem', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>🟢 In Stock</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#16a34a', fontFamily: 'var(--font-display)', fontFeatureSettings: "'tnum'", marginTop: '2px' }}>
              {totalStockUnits.toLocaleString()}
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #a7f3d0', fontWeight: 600 }}>Units</span>
        </div>
      </div>

      {/* Main Search & Advanced Filter Toggle */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Main Search */}
          <div style={{ flex: 1.5, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px' }}
              placeholder="Search by SKU, OEM, Barcode, or name..."
              value={filters.query}
              onChange={e => setFilters(prev => ({ ...prev, query: e.target.value }))}
            />
            <svg 
              style={{ position: 'absolute', left: '10px', top: '10px', width: '16px', height: '16px', color: 'var(--text-tertiary)' }}
              xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
            </svg>
          </div>

          {/* Quick Category drop */}
          <div style={{ width: '160px' }}>
            <select
              className="form-select"
              value={filters.categoryId}
              onChange={e => setFilters(prev => ({ ...prev, categoryId: e.target.value }))}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Quick Stock Level filter */}
          <div style={{ width: '160px' }}>
            <select
              className="form-select"
              value={filters.stockStatus}
              onChange={e => setFilters(prev => ({ ...prev, stockStatus: e.target.value as any }))}
            >
              <option value="all">All stock items</option>
              <option value="instock">In Stock only</option>
              <option value="lowstock">Low Stock Warnings</option>
              <option value="outofstock">Out Of Stock</option>
            </select>
          </div>

          {/* Advanced filters button toggle */}
          <Button 
            variant="secondary" 
            size="md" 
            icon={<SlidersHorizontal size={14} />} 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={showAdvancedFilters || filters.brand || filters.minPrice || filters.maxPrice || filters.vehicleId ? 'border-brand' : ''}
          >
            Filters
          </Button>

        </div>

        {/* Filter Drawer Section */}
        {showAdvancedFilters && (
          <div className="animate-fade-in" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            
            {/* Brand Filter */}
            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>Brand Manufacturer</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['All', ...motorcycleBrands].map(b => {
                  const isSelected = (b === 'All' && !filters.brand) || filters.brand.toLowerCase() === b.toLowerCase();
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setFilters(prev => ({ ...prev, brand: b === 'All' ? '' : b }))}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        borderRadius: 'var(--radius-xs)',
                        border: isSelected ? '1px solid var(--color-brand)' : '1px solid var(--border-color)',
                        backgroundColor: isSelected ? 'var(--color-brand-glow)' : 'var(--bg-panel)',
                        color: isSelected ? 'var(--color-brand)' : 'var(--text-secondary)',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer'
                      }}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Bounds */}
            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>Price Range (Rs.)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="Min"
                  className="form-input"
                  value={filters.minPrice}
                  onChange={e => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                />
                <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="form-input"
                  value={filters.maxPrice}
                  onChange={e => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                {(filters.minPrice || filters.maxPrice) && (
                  <Button variant="ghost" size="sm" onClick={() => setFilters(p => ({ ...p, minPrice: '', maxPrice: '' }))} style={{ color: 'var(--color-danger)' }}>Clear Prices</Button>
                )}
              </div>
            </div>

            {/* Motorcycle Model Compatibility */}
            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>Bike Spec Compatibility</label>
              <select
                className="form-select"
                value={filters.vehicleId}
                onChange={e => setFilters(prev => ({ ...prev, vehicleId: e.target.value }))}
              >
                <option value="">Choose Motorcycle Model...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.make} {v.model} ({v.year}) - {v.engineCC}</option>
                ))}
              </select>
            </div>

          </div>
        )}
      </div>

      {/* High Density Table Grid */}
      <Table
        columns={[
          {
            header: 'Item Image',
            width: '60px',
            render: (row) => (
              <ProductThumbnail 
                name={row.name} 
                categoryName={getCategoryName(row.categoryId)} 
                imageUrl={row.imageUrl} 
                size={42} 
              />
            )
          },
          { 
            header: 'SKU / Part Name', 
            sortable: true,
            sortKey: 'name',
            render: (row) => (
              <div onClick={(e) => handleRowClick(row, e)} style={{ cursor: 'pointer' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  SKU: <code style={{ padding: '1px 4px', fontSize: '0.7rem' }}>{row.sku}</code> | OEM: {row.oemNumber || 'N/A'}
                </div>
              </div>
            )
          },
          {
            header: 'Brand / Cat',
            render: (row) => {
              const bStyle = getBrandBadgeStyle(row.brand);
              return (
                <div>
                  <span 
                    style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 600, 
                      padding: '2px 8px', 
                      borderRadius: '9999px', 
                      display: 'inline-block',
                      ...bStyle 
                    }}
                  >
                    {row.brand}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{getCategoryName(row.categoryId)}</div>
                </div>
              );
            }
          },
          {
            header: 'Cost / Wholesale',
            render: (row) => {
              const isEditingWholesale = editingCell?.partId === row.id && editingCell?.field === 'wholesalePrice';
              return (
                <div 
                  onDoubleClick={() => handleDoubleCellClick(row.id, 'wholesalePrice', row.wholesalePrice)}
                  style={{ cursor: 'pointer' }}
                  title="Double-click to edit Wholesale Price"
                >
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontFeatureSettings: "'tnum'" }}>Cost: Rs. {row.costPrice.toFixed(2)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>W/S:</span>
                    {isEditingWholesale ? (
                      <input
                        type="text"
                        className="inline-edit-input"
                        autoFocus
                        value={editingValue}
                        onChange={e => setEditingValue(e.target.value)}
                        onBlur={() => handleInlineSave(row)}
                        onKeyDown={e => handleInlineKeyDown(e, row)}
                      />
                    ) : (
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontFeatureSettings: "'tnum'", display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        Rs. {row.wholesalePrice.toFixed(2)}
                        <Edit2 size={10} style={{ opacity: 0.3 }} />
                      </span>
                    )}
                  </div>
                </div>
              );
            }
          },
          {
            header: 'Retail Price',
            sortable: true,
            sortKey: 'salePrice',
            render: (row) => {
              const isEditingRetail = editingCell?.partId === row.id && editingCell?.field === 'salePrice';
              return (
                <div 
                  onDoubleClick={() => handleDoubleCellClick(row.id, 'salePrice', row.salePrice)}
                  style={{ cursor: 'pointer' }}
                  title="Double-click to edit Retail Price"
                >
                  {isEditingRetail ? (
                    <input
                      type="text"
                      className="inline-edit-input"
                      autoFocus
                      value={editingValue}
                      onChange={e => setEditingValue(e.target.value)}
                      onBlur={() => handleInlineSave(row)}
                      onKeyDown={e => handleInlineKeyDown(e, row)}
                    />
                  ) : (
                    <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#10b981', fontFamily: 'var(--font-mono)', fontFeatureSettings: "'tnum'", display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      Rs. {row.salePrice.toFixed(2)}
                      <Edit2 size={11} style={{ opacity: 0.4 }} />
                    </span>
                  )}
                </div>
              );
            }
          },
          {
            header: 'Stock Status',
            sortable: true,
            sortKey: 'stockLevel',
            render: (row) => {
              const isEditingStock = editingCell?.partId === row.id && editingCell?.field === 'stockLevel';
              let badgeBg = '#ecfdf5';
              let badgeColor = '#15803d';
              let badgeBorder = '#a7f3d0';
              let statusSymbol = '✓';

              if (row.stockLevel === 0) {
                badgeBg = '#fef2f2';
                badgeColor = '#dc2626';
                badgeBorder = '#fca5a5';
                statusSymbol = '✕';
              } else if (row.stockLevel <= row.reorderPoint) {
                badgeBg = '#fff7ed';
                badgeColor = '#c2410c';
                badgeBorder = '#fed7aa';
                statusSymbol = '●';
              }

              return (
                <div 
                  onDoubleClick={() => handleDoubleCellClick(row.id, 'stockLevel', row.stockLevel)}
                  style={{ cursor: 'pointer' }}
                  title="Double-click to adjust Stock Units inline"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isEditingStock ? (
                      <input
                        type="text"
                        className="inline-edit-input"
                        autoFocus
                        value={editingValue}
                        onChange={e => setEditingValue(e.target.value)}
                        onBlur={() => handleInlineSave(row)}
                        onKeyDown={e => handleInlineKeyDown(e, row)}
                      />
                    ) : (
                      <span 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '3px 9px',
                          borderRadius: '9999px',
                          backgroundColor: badgeBg,
                          color: badgeColor,
                          border: `1px solid ${badgeBorder}`
                        }}
                      >
                        <span>{statusSymbol}</span>
                        <span>{row.stockLevel} {row.unit}</span>
                        <Edit2 size={9} style={{ opacity: 0.4 }} />
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Min: {row.reorderPoint} | Max: {row.maxStock}</div>
                </div>
              );
            }
          },
          {
            header: 'Warehouse Bin',
            accessor: 'binLocation',
            render: (row) => <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{row.binLocation || 'N/A'}</span>
          }
        ]}
        data={parts}
        keyExtractor={(row) => row.id}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSort={handleSort}
        emptyMessage="No spare parts match the filter parameters."
      />

      {/* Custom Pagination bottom toolbar card */}
      <div className="card" style={{ padding: '0.75rem 1.25rem', marginTop: '-0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Showing <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{allFilteredPartsRaw.length > 0 ? rangeStart : 0}</span> to{' '}
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rangeEnd}</span> of{' '}
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{allFilteredPartsRaw.length}</span> parts
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button variant="secondary" size="sm" onClick={() => setPage(1)} disabled={page === 1}>« First</Button>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹ Prev</Button>
            
            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600, padding: '0 8px' }}>
              Page {page} of {totalPages}
            </span>

            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next ›</Button>
            <Button variant="secondary" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last »</Button>

            {/* Page Size selector */}
            <select
              className="form-select"
              style={{ width: '80px', height: '32px', padding: '0 8px', fontSize: '0.8rem', marginLeft: '12px' }}
              value={pageSize}
              onChange={e => {
                setPageSize(parseInt(e.target.value) || 25);
                setPage(1);
              }}
            >
              <option value="10">10 / pg</option>
              <option value="25">25 / pg</option>
              <option value="50">50 / pg</option>
              <option value="100">100 / pg</option>
            </select>
          </div>

        </div>
      </div>

      {/* Part details Sidebar Drawer */}
      <Modal
        isOpen={activePart !== null}
        onClose={handleCloseDrawer}
        title={isEditing ? 'Modify Parts Record' : 'Spare Part details'}
        type="drawer"
      >
        {activePart && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* View State */}
            {!isEditing ? (
              <>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <ProductThumbnail 
                    name={activePart.name} 
                    categoryName={getCategoryName(activePart.categoryId)} 
                    imageUrl={activePart.imageUrl} 
                    size={60} 
                  />
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{activePart.name}</h2>
                    <span className="badge badge-secondary" style={{ marginTop: '4px', textTransform: 'capitalize' }}>{activePart.brand}</span>
                  </div>
                </div>

                {/* Sub Tab Navigation */}
                <div className="tabs-list">
                  <button 
                    onClick={() => setActiveDrawerTab('specs')} 
                    className={`tab-btn ${activeDrawerTab === 'specs' ? 'tab-btn-active' : ''}`}
                  >
                    Specs & Comp
                  </button>
                  <button 
                    onClick={() => setActiveDrawerTab('movements')} 
                    className={`tab-btn ${activeDrawerTab === 'movements' ? 'tab-btn-active' : ''}`}
                  >
                    Movements Ledger
                  </button>
                  <button 
                    onClick={() => setActiveDrawerTab('history')} 
                    className={`tab-btn ${activeDrawerTab === 'history' ? 'tab-btn-active' : ''}`}
                  >
                    Edit History
                  </button>
                </div>

                {/* Tab Content 1: Specs */}
                {activeDrawerTab === 'specs' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    {/* Alphanumeric and Visual Barcode */}
                    <div className="barcode-visual">
                      <Barcode value={activePart.barcode} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '12px 0' }}>
                      <div>
                        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block' }}>SKU Code</label>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{activePart.sku}</span>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block' }}>OEM Number</label>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{activePart.oemNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block' }}>Bin Location</label>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, fontFamily: 'monospace' }}>{activePart.binLocation || 'None'}</span>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block' }}>Unit Indicator</label>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{activePart.unit}</span>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block' }}>Category</label>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{getCategoryName(activePart.categoryId)}</span>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block' }}>Supplier</label>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{getSupplierName(activePart.supplierId)}</span>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block' }}>Cost Price</label>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Rs. {activePart.costPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block' }}>Wholesale Price</label>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Rs. {activePart.wholesalePrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block' }}>Retail Price</label>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-brand)' }}>Rs. {activePart.salePrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block' }}>Stock Range limits</label>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Min: {activePart.reorderPoint} | Max: {activePart.maxStock}</span>
                      </div>
                    </div>

                    {/* Stock Level Quick Adjustment form */}
                    <div className="card" style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-hover)' }}>
                      <form onSubmit={handleQuickAdjust} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Physical Quantity Control</span>
                          <span className={`badge ${activePart.stockLevel === 0 ? 'badge-danger' : activePart.stockLevel <= activePart.reorderPoint ? 'badge-warning' : 'badge-success'}`}>
                            {activePart.stockLevel} units
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="number"
                            className="form-input"
                            style={{ height: '36px', flex: 1 }}
                            placeholder="Qty change (+5, -2)..."
                            value={adjustQty}
                            onChange={e => setAdjustQty(e.target.value)}
                          />
                          <Button variant="secondary" size="sm" type="submit" style={{ height: '36px' }}>Adjust</Button>
                        </div>
                      </form>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '6px' }}>Part Description</h4>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{activePart.description || 'No description available.'}</p>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Bike Model Compatibility</h4>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {activePart.compatibilityIds.length === 0 ? (
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Fits all universal motorcycle specifications.</span>
                        ) : (
                          activePart.compatibilityIds.map(vid => {
                            const v = vehicles.find(x => x.id === vid);
                            return v ? (
                              <span key={vid} className="badge badge-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                                {v.make} {v.model} ({v.year})
                              </span>
                            ) : null;
                          })
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      <Button variant="secondary" size="sm" onClick={startEditing} style={{ flex: 1 }}>Edit Part</Button>
                      <Button variant="danger" size="sm" onClick={handleDelete} style={{ flex: 1 }}>Delete Record</Button>
                    </div>

                  </div>
                )}

                {/* Tab Content 2: Stock Movements */}
                {activeDrawerTab === 'movements' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Stock Movement Ledger</h4>
                    {getStockMovements(activePart.id).length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>No stock movements registered.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto' }}>
                        {getStockMovements(activePart.id).map(sm => {
                          const date = new Date(sm.timestamp).toLocaleString();
                          const isAdd = sm.quantity > 0;
                          
                          return (
                            <div key={sm.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--bg-hover)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className={`badge ${isAdd ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                                  {isAdd ? '+' : ''}{sm.quantity} units
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{date}</span>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginTop: '4px', fontWeight: 500 }}>
                                {sm.notes}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                Type: {sm.type} | Ref: {sm.referenceId}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab Content 3: Change Logs */}
                {activeDrawerTab === 'history' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Relational Edit Change Logs</h4>
                    {getProductHistory(activePart.id).length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>No edit logs compiled.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto' }}>
                        {getProductHistory(activePart.id).map(ph => {
                          const date = new Date(ph.timestamp).toLocaleString();
                          
                          return (
                            <div key={ph.id} style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--bg-hover)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                                <span>Action: <b>{ph.changeType}</b></span>
                                <span>{date}</span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{ph.details}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Operator: {ph.user}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </>
            ) : (
              /* Edit State Form */
              <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Part Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm?.name || ''}
                    onChange={e => setEditForm(prev => prev ? { ...prev, name: e.target.value } : null)}
                    required
                  />
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">SKU Code *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm?.sku || ''}
                      onChange={e => setEditForm(prev => prev ? { ...prev, sku: e.target.value } : null)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">OEM Part Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm?.oemNumber || ''}
                      onChange={e => setEditForm(prev => prev ? { ...prev, oemNumber: e.target.value } : null)}
                    />
                  </div>
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-select"
                      value={editForm?.categoryId || ''}
                      onChange={e => setEditForm(prev => prev ? { ...prev, categoryId: e.target.value } : null)}
                      required
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Supplier *</label>
                    <select
                      className="form-select"
                      value={editForm?.supplierId || ''}
                      onChange={e => setEditForm(prev => prev ? { ...prev, supplierId: e.target.value } : null)}
                      required
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-cols-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div className="form-group">
                    <label className="form-label">Motorcycle Brand *</label>
                    <select
                      className="form-select"
                      value={editForm?.brand || 'Yamaha'}
                      onChange={e => setEditForm(prev => prev ? { ...prev, brand: e.target.value } : null)}
                      required
                    >
                      {motorcycleBrands.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit Spec *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm?.unit || 'Pcs'}
                      onChange={e => setEditForm(prev => prev ? { ...prev, unit: e.target.value } : null)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Warehouse Bin</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm?.binLocation || ''}
                      onChange={e => setEditForm(prev => prev ? { ...prev, binLocation: e.target.value } : null)}
                    />
                  </div>
                </div>

                <div className="grid-cols-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div className="form-group">
                    <label className="form-label">Cost Price (Rs.) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={editForm?.costPrice || 0}
                      onChange={e => setEditForm(prev => prev ? { ...prev, costPrice: parseFloat(e.target.value) || 0 } : null)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Wholesale (Rs.) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={editForm?.wholesalePrice || 0}
                      onChange={e => setEditForm(prev => prev ? { ...prev, wholesalePrice: parseFloat(e.target.value) || 0 } : null)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Retail (Rs.) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={editForm?.salePrice || 0}
                      onChange={e => setEditForm(prev => prev ? { ...prev, salePrice: parseFloat(e.target.value) || 0 } : null)}
                      required
                    />
                  </div>
                </div>

                <div className="grid-cols-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div className="form-group">
                    <label className="form-label">Stock Level *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editForm?.stockLevel || 0}
                      onChange={e => setEditForm(prev => prev ? { ...prev, stockLevel: parseInt(e.target.value) || 0 } : null)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Min Stock *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editForm?.reorderPoint || 0}
                      onChange={e => setEditForm(prev => prev ? { ...prev, reorderPoint: parseInt(e.target.value) || 0 } : null)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Stock *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editForm?.maxStock || 0}
                      onChange={e => setEditForm(prev => prev ? { ...prev, maxStock: parseInt(e.target.value) || 0 } : null)}
                      required
                    />
                  </div>
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Barcode / QR Alphanumeric</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm?.barcode || ''}
                      onChange={e => setEditForm(prev => prev ? { ...prev, barcode: e.target.value } : null)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Image Thumbnail URL</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm?.imageUrl || ''}
                      onChange={e => setEditForm(prev => prev ? { ...prev, imageUrl: e.target.value } : null)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    value={editForm?.description || ''}
                    onChange={e => setEditForm(prev => prev ? { ...prev, description: e.target.value } : null)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Motorcycle Model Links <span style={{ fontSize: '0.75rem', color: 'var(--color-brand)', fontWeight: 600 }}>({editForm?.compatibilityIds.length || 0} linked)</span>
                  </label>
                  <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '8px', backgroundColor: 'var(--bg-subtle)' }}>
                    {vehicles.map(v => (
                      <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 6px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '4px' }}>
                        <input
                          type="checkbox"
                          checked={editForm?.compatibilityIds.includes(v.id) || false}
                          onChange={() => handleEditCompatToggle(v.id)}
                        />
                        <span style={{ fontWeight: 500 }}>{v.make} {v.model}</span> <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>({v.year} • {v.engineCC})</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                  <Button variant="secondary" size="sm" type="button" onClick={() => setIsEditing(false)} style={{ flex: 1 }}>Cancel</Button>
                  <Button variant="primary" size="sm" type="submit" style={{ flex: 1 }}>Save Changes</Button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>

      {/* Add Part Overlay Modal */}
      <Modal
        isOpen={isOpenAddModal}
        onClose={() => setIsOpenAddModal(false)}
        title="Add New Spare Part"
      >
        <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div className="form-group" style={{ marginBottom: '2px' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.875rem' }}>Part Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. SPRAY - Black, SPRAY - White"
              value={newPartForm.name}
              onChange={e => {
                const val = e.target.value;
                setNewPartForm(prev => {
                  let rp = prev.reorderPoint;
                  if (/spray.*(black|white)/i.test(val)) {
                    if (rp === 3 || rp === 0) rp = 5;
                  } else if (rp === 5 && /spray/i.test(prev.name) && !/spray.*(black|white)/i.test(val)) {
                    rp = 3;
                  }
                  return { ...prev, name: val, reorderPoint: rp };
                });
              }}
              autoFocus
              required
            />
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">
                SKU Code <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>(auto-generated if blank)</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Leave blank to auto-generate"
                value={newPartForm.sku}
                onChange={e => setNewPartForm(prev => ({ ...prev, sku: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                OEM Part Number <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>(auto-generated if blank)</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Leave blank to auto-generate"
                value={newPartForm.oemNumber}
                onChange={e => setNewPartForm(prev => ({ ...prev, oemNumber: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                value={newPartForm.categoryId}
                onChange={e => {
                  const catId = e.target.value;
                  const cat = categories.find(c => c.id === catId);
                  const isSpray = cat && /spray|lube/i.test(cat.name);
                  setNewPartForm(prev => ({
                    ...prev,
                    categoryId: catId,
                    unit: isSpray ? 'Can' : prev.unit,
                    brand: isSpray && prev.brand === 'Yamaha' ? 'Universal' : prev.brand
                  }));
                }}
                required
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Supplier *</label>
              <select
                className="form-select"
                value={newPartForm.supplierId}
                onChange={e => setNewPartForm(prev => ({ ...prev, supplierId: e.target.value }))}
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-cols-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div className="form-group">
              <label className="form-label">Bike Brand *</label>
              <select
                className="form-select"
                value={newPartForm.brand}
                onChange={e => setNewPartForm(prev => ({ ...prev, brand: e.target.value }))}
                required
              >
                {motorcycleBrands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit Spec *</label>
              <input
                type="text"
                className="form-input"
                value={newPartForm.unit}
                onChange={e => setNewPartForm(prev => ({ ...prev, unit: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Warehouse Location</label>
              <input
                type="text"
                className="form-input"
                placeholder="A-12-04"
                value={newPartForm.binLocation}
                onChange={e => setNewPartForm(prev => ({ ...prev, binLocation: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid-cols-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div className="form-group">
              <label className="form-label">Purchase Price (Rs.) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={newPartForm.costPrice}
                onChange={e => setNewPartForm(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Wholesale Price (Rs.)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={newPartForm.wholesalePrice}
                onChange={e => setNewPartForm(prev => ({ ...prev, wholesalePrice: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Selling Price (Rs.)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={newPartForm.salePrice}
                onChange={e => setNewPartForm(prev => ({ ...prev, salePrice: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="grid-cols-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div className="form-group">
              <label className="form-label">Initial Stock *</label>
              <input
                type="number"
                className="form-input"
                value={newPartForm.stockLevel}
                onChange={e => setNewPartForm(prev => ({ ...prev, stockLevel: parseInt(e.target.value) || 0 }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Minimum Stock *</label>
              <input
                type="number"
                className="form-input"
                value={newPartForm.reorderPoint}
                onChange={e => setNewPartForm(prev => ({ ...prev, reorderPoint: parseInt(e.target.value) || 0 }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Maximum Stock *</label>
              <input
                type="number"
                className="form-input"
                value={newPartForm.maxStock}
                onChange={e => setNewPartForm(prev => ({ ...prev, maxStock: parseInt(e.target.value) || 0 }))}
                required
              />
            </div>
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Barcode</label>
              <input
                type="text"
                className="form-input"
                placeholder="Leave blank to auto-generate"
                value={newPartForm.barcode}
                onChange={e => setNewPartForm(prev => ({ ...prev, barcode: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Image Thumbnail Path <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>(URL or /parts_thumbnail.png)</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="/parts_thumbnail.png or https://..."
                value={newPartForm.imageUrl}
                onChange={e => setNewPartForm(prev => ({ ...prev, imageUrl: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Part Description</label>
            <textarea
              className="form-textarea"
              placeholder="Provide specifications, material info, compatibility notes..."
              value={newPartForm.description}
              onChange={e => setNewPartForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Compatible Motorcycle Models <span style={{ fontSize: '0.75rem', color: 'var(--color-brand)', fontWeight: 600 }}>({newPartForm.compatibilityIds.length} selected)</span>
            </label>
            <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '8px', backgroundColor: 'var(--bg-subtle)' }}>
              {vehicles.map(v => (
                <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 6px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '4px' }}>
                  <input
                    type="checkbox"
                    checked={newPartForm.compatibilityIds.includes(v.id)}
                    onChange={() => {
                      const list = newPartForm.compatibilityIds.includes(v.id)
                        ? newPartForm.compatibilityIds.filter(id => id !== v.id)
                        : [...newPartForm.compatibilityIds, v.id];
                      setNewPartForm(prev => ({ ...prev, compatibilityIds: list }));
                    }}
                  />
                  <span style={{ fontWeight: 500 }}>{v.make} {v.model}</span> <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>({v.year} • {v.engineCC})</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsOpenAddModal(false)} style={{ flex: 1 }}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" style={{ flex: 1 }}>Add Part</Button>
          </div>
        </form>
      </Modal>

      {/* CSV Bulk Import Modal */}
      <Modal
        isOpen={isOpenImportModal}
        onClose={() => setIsOpenImportModal(false)}
        title="Bulk Import Motorcycle Parts via CSV"
      >
        <form onSubmit={handleImportCSVSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Paste your raw CSV spreadsheet values directly below. Ensure your CSV columns contain these exact headers in the first line:
            </span>
            <code style={{ fontSize: '0.75rem', display: 'block', padding: '6px', backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', wordBreak: 'break-all' }}>
              sku,name,brand,category,supplier,unit,cost price,wholesale price,retail price,current stock,min stock,max stock,location,description,compatibility
            </code>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">CSV Data Content *</label>
            <textarea
              className="form-textarea"
              style={{ minHeight: '160px', fontFamily: 'monospace', fontSize: '0.75rem' }}
              placeholder={`"sku","name","brand","category","supplier","unit","cost price","retail price"\n"ENG-SPK-NGK-999","NGK Spark Plug XL","Yamaha","Engine Parts","Nippon Performance Parts","Pcs",9.50,19.99\n"BRK-DIS-BRE-101","Brembo Disc Rotor Front","KTM","Brake System","Brembo Racing Supply","Pcs",120.00,240.00`}
              value={csvInput}
              onChange={e => setCsvInput(e.target.value)}
            />
          </div>

          {importReport && (
            <div style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', backgroundColor: importReport.errors.length > 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)' }} className="animate-fade-in">
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: importReport.errors.length > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                Import Status: Successfully loaded {importReport.success} records!
              </div>
              {importReport.errors.length > 0 && (
                <div style={{ marginTop: '6px', maxHeight: '80px', overflowY: 'auto', fontSize: '0.7rem', color: 'var(--color-danger)' }}>
                  <b>Errors encountered:</b>
                  <ul style={{ paddingLeft: '14px', marginTop: '2px' }}>
                    {importReport.errors.slice(0, 5).map((err, idx) => <li key={idx}>{err}</li>)}
                    {importReport.errors.length > 5 && <li>...and {importReport.errors.length - 5} more warnings.</li>}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsOpenImportModal(false)} style={{ flex: 1 }}>Close</Button>
            <Button variant="primary" size="sm" type="submit" style={{ flex: 1 }} disabled={!csvInput.trim()}>Parse & Import</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
export default Inventory;
