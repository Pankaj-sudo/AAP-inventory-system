import React, { useState, useMemo } from 'react';
import { useReturns } from '../hooks/useReturns';
import { useCustomers } from '../hooks/useCustomers';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { 
  RotateCcw, AlertOctagon, Sliders, Search, ArrowRightLeft 
} from 'lucide-react';
import type { Return, StockAdjustment } from '../database/schema';

export const Returns: React.FC = () => {
  const {
    returns,
    damagedStock,
    adjustments,
    parts,
    createReturn,
    reportDamage,
    resolveDamage,
    createAdjustment
  } = useReturns();

  const { customers } = useCustomers();

  // Tab State: 'RETURNS' | 'DAMAGE' | 'ADJUSTMENTS'
  const [activeTab, setActiveTab] = useState<'RETURNS' | 'DAMAGE' | 'ADJUSTMENTS'>('RETURNS');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isOpenReturnModal, setIsOpenReturnModal] = useState(false);
  const [isOpenDamageModal, setIsOpenDamageModal] = useState(false);
  const [isOpenAdjustModal, setIsOpenAdjustModal] = useState(false);

  // Return Form State
  const [retForm, setRetForm] = useState({
    customerId: '',
    originalOrderId: '',
    items: [] as { partId: string; quantity: number; unitPrice: number }[],
    reason: '',
    type: 'REFUND' as Return['type'],
    restockItems: true
  });

  // Damaged Form State
  const [dmgForm, setDmgForm] = useState({
    partId: '',
    quantity: 1,
    reason: ''
  });

  // Adjustment Form State
  const [adjForm, setAdjForm] = useState({
    partId: '',
    type: 'CORRECTION' as StockAdjustment['type'],
    quantity: 0,
    reason: ''
  });

  // Filtered lists
  const filteredReturns = useMemo(() => {
    return returns.filter(r => 
      r.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [returns, searchTerm]);

  const filteredDamage = useMemo(() => {
    return damagedStock.filter(d => 
      d.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [damagedStock, searchTerm]);

  const filteredAdjustments = useMemo(() => {
    return adjustments.filter(a => 
      a.adjustmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [adjustments, searchTerm]);

  // Return Form Helper: Add Item
  const handleAddReturnItem = () => {
    const defaultPart = parts[0];
    if (!defaultPart) return;
    setRetForm(prev => ({
      ...prev,
      items: [...prev.items, { partId: defaultPart.id, quantity: 1, unitPrice: defaultPart.salePrice }]
    }));
  };

  // Return Form Helper: Remove Item
  const handleRemoveReturnItem = (idx: number) => {
    setRetForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  // Return Form Helper: Field change
  const handleReturnItemChange = (idx: number, field: string, value: any) => {
    setRetForm(prev => {
      const items = [...prev.items];
      if (field === 'partId') {
        const part = parts.find(p => p.id === value);
        items[idx] = {
          partId: value,
          quantity: items[idx].quantity,
          unitPrice: part ? part.salePrice : 0
        };
      } else {
        items[idx] = {
          ...items[idx],
          [field]: value
        };
      }
      return { ...prev, items };
    });
  };

  // Return Submit
  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!retForm.customerId) {
      alert('Please select a customer.');
      return;
    }
    if (retForm.items.length === 0) {
      alert('Please add at least one returned part.');
      return;
    }

    const customer = customers.find(c => c.id === retForm.customerId);
    if (!customer) return;

    const refundAmount = retForm.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);

    createReturn({
      originalSalesOrderId: retForm.originalOrderId || 'Counter Sale',
      customerId: customer.id,
      customerName: customer.name,
      items: retForm.items.map(item => {
        const part = parts.find(p => p.id === item.partId);
        return {
          partId: item.partId,
          partName: part ? part.name : 'Unknown Part',
          quantity: item.quantity,
          unitPrice: item.unitPrice
        };
      }),
      reason: retForm.reason,
      type: retForm.type,
      status: 'COMPLETED',
      refundAmount,
      restockItems: retForm.restockItems
    });

    setIsOpenReturnModal(false);
    setRetForm({
      customerId: '',
      originalOrderId: '',
      items: [],
      reason: '',
      type: 'REFUND',
      restockItems: true
    });
  };

  // Damage Submit
  const handleDamageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dmgForm.partId || dmgForm.quantity <= 0) {
      alert('Please fill out required fields.');
      return;
    }

    const part = parts.find(p => p.id === dmgForm.partId);
    if (!part) return;

    if (part.stockLevel < dmgForm.quantity) {
      alert(`Cannot write off more units than physically exist. Stock: ${part.stockLevel}`);
      return;
    }

    reportDamage({
      partId: dmgForm.partId,
      partName: part.name,
      quantity: dmgForm.quantity,
      reason: dmgForm.reason,
      reportedBy: 'Pankaj.ydv707@gmail.com',
      resolved: false,
      estimatedLoss: dmgForm.quantity * part.costPrice
    });

    setIsOpenDamageModal(false);
    setDmgForm({ partId: '', quantity: 1, reason: '' });
  };

  // Adjustment Submit
  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjForm.partId) {
      alert('Please select a spare part.');
      return;
    }

    const part = parts.find(p => p.id === adjForm.partId);
    if (!part) return;

    const previousQty = part.stockLevel;
    let adjustedQty = adjForm.quantity;
    let delta = adjustedQty - previousQty;

    if (adjForm.type === 'ADDITION') {
      delta = adjForm.quantity;
      adjustedQty = previousQty + delta;
    } else if (adjForm.type === 'REDUCTION') {
      delta = -adjForm.quantity;
      adjustedQty = Math.max(0, previousQty + delta);
    }

    createAdjustment({
      partId: adjForm.partId,
      partName: part.name,
      previousQty,
      adjustedQty,
      delta,
      reason: adjForm.reason,
      type: adjForm.type,
      adjustedBy: 'Pankaj.ydv707@gmail.com'
    });

    setIsOpenAdjustModal(false);
    setAdjForm({ partId: '', type: 'CORRECTION', quantity: 0, reason: '' });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="heading-display" style={{ fontSize: '1.625rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.25 }}>
            Inventory Adjustments
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Process workshop returns, record warehouse stock damages, and apply inventory adjustments.
          </p>
        </div>
        
        {/* Quick action triggers */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {activeTab === 'RETURNS' && (
            <Button variant="primary" size="sm" onClick={() => setIsOpenReturnModal(true)}>
              <RotateCcw size={15} style={{ marginRight: '6px' }} /> Record Return Slip
            </Button>
          )}
          {activeTab === 'DAMAGE' && (
            <Button variant="primary" size="sm" onClick={() => setIsOpenDamageModal(true)}>
              <AlertOctagon size={15} style={{ marginRight: '6px' }} /> Report Damage Loss
            </Button>
          )}
          {activeTab === 'ADJUSTMENTS' && (
            <Button variant="primary" size="sm" onClick={() => setIsOpenAdjustModal(true)}>
              <Sliders size={15} style={{ marginRight: '6px' }} /> New Adjustment
            </Button>
          )}
        </div>
      </div>

      {/* Tab Strip */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '16px' }}>
        <button
          onClick={() => { setActiveTab('RETURNS'); setSearchTerm(''); }}
          style={{
            padding: '10px 4px', fontSize: '0.85rem', fontWeight: 600, background: 'none', border: 'none',
            color: activeTab === 'RETURNS' ? 'var(--color-brand)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'RETURNS' ? '2px solid var(--color-brand)' : 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <RotateCcw size={14} /> Returns &amp; Refunds
        </button>
        <button
          onClick={() => { setActiveTab('DAMAGE'); setSearchTerm(''); }}
          style={{
            padding: '10px 4px', fontSize: '0.85rem', fontWeight: 600, background: 'none', border: 'none',
            color: activeTab === 'DAMAGE' ? 'var(--color-brand)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'DAMAGE' ? '2px solid var(--color-brand)' : 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <AlertOctagon size={14} /> Damaged Stock
        </button>
        <button
          onClick={() => { setActiveTab('ADJUSTMENTS'); setSearchTerm(''); }}
          style={{
            padding: '10px 4px', fontSize: '0.85rem', fontWeight: 600, background: 'none', border: 'none',
            color: activeTab === 'ADJUSTMENTS' ? 'var(--color-brand)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'ADJUSTMENTS' ? '2px solid var(--color-brand)' : 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <Sliders size={14} /> Stock Adjustments Log
        </button>
      </div>

      {/* Toolbar / Search */}
      <div style={{ position: 'relative', maxWidth: '360px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
        <input
          type="text"
          placeholder={`Search ${activeTab === 'RETURNS' ? 'returns by code or client' : activeTab === 'DAMAGE' ? 'damages by code or part' : 'adjustments by code or part'}...`}
          className="form-input"
          style={{ paddingLeft: '36px' }}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Panels for tables */}
      <div className="panel">
        
        {/* Tab 1: Returns list */}
        {activeTab === 'RETURNS' && (
          <Table
            columns={[
              {
                header: 'Return Code',
                render: (row) => (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.returnNumber}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Ref: {row.originalSalesOrderId}
                    </div>
                  </div>
                )
              },
              {
                header: 'Client Account',
                accessor: 'customerName',
                render: (row) => <span style={{ fontWeight: 600 }}>{row.customerName}</span>
              },
              {
                header: 'Reason & Action',
                render: (row) => (
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>{row.reason}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ArrowRightLeft size={10} /> Type: {row.type} · Restocked: {row.restockItems ? 'Yes' : 'No'}
                    </div>
                  </div>
                )
              },
              {
                header: 'Refund Amount',
                render: (row) => <strong style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-mono)', fontFeatureSettings: "'tnum'" }}>-Rs. {row.refundAmount.toFixed(2)}</strong>
              },
              {
                header: 'Items',
                render: (row) => (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {row.items.map((it: any, idx: number) => (
                      <div key={idx}>{it.quantity}× {it.partName}</div>
                    ))}
                  </div>
                )
              }
            ]}
            data={filteredReturns}
            keyExtractor={row => row.id}
            emptyMessage="No customer returns logged."
          />
        )}

        {/* Tab 2: Damaged list */}
        {activeTab === 'DAMAGE' && (
          <Table
            columns={[
              {
                header: 'Report Code / Date',
                render: (row) => (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.reportNumber}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {new Date(row.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                )
              },
              {
                header: 'Part Details',
                accessor: 'partName',
                render: (row) => <span style={{ fontWeight: 600 }}>{row.partName}</span>
              },
              {
                header: 'Qty Written Off',
                render: (row) => <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>-{row.quantity} units</span>
              },
              {
                header: 'Estimated Loss',
                render: (row) => <span>Rs. {row.estimatedLoss.toFixed(2)}</span>
              },
              {
                header: 'Damage Reason',
                accessor: 'reason'
              },
              {
                header: 'Status',
                render: (row) => (
                  row.resolved 
                    ? <span className="badge badge-success">Written Off</span> 
                    : <span className="badge badge-warning">Pending Review</span>
                )
              },
              {
                header: 'Actions',
                render: (row) => (
                  !row.resolved && (
                    <Button variant="secondary" size="sm" style={{ padding: '2px 8px', fontSize: '0.72rem' }} onClick={() => resolveDamage(row.id)}>
                      Approve write-off
                    </Button>
                  )
                )
              }
            ]}
            data={filteredDamage}
            keyExtractor={row => row.id}
            emptyMessage="No damaged stock records found."
          />
        )}

        {/* Tab 3: Adjustments list */}
        {activeTab === 'ADJUSTMENTS' && (
          <Table
            columns={[
              {
                header: 'Adjustment #',
                render: (row) => (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.adjustmentNumber}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {new Date(row.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                )
              },
              {
                header: 'Spare Part Spec',
                accessor: 'partName',
                render: (row) => <span style={{ fontWeight: 600 }}>{row.partName}</span>
              },
              {
                header: 'Type',
                render: (row) => {
                  let bClass = 'badge-secondary';
                  if (row.type === 'ADDITION') bClass = 'badge-success';
                  if (row.type === 'REDUCTION') bClass = 'badge-danger';
                  return <span className={`badge ${bClass}`}>{row.type}</span>;
                }
              },
              {
                header: 'Audit details',
                render: (row) => (
                  <div>
                    <div style={{ fontSize: '0.75rem' }}>
                      Audit count: {row.previousQty} → <strong>{row.adjustedQty}</strong>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: row.delta > 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                      Delta: {row.delta > 0 ? '+' : ''}{row.delta} units
                    </div>
                  </div>
                )
              },
              {
                header: 'Adjustment Reason',
                accessor: 'reason'
              },
              {
                header: 'Operator',
                accessor: 'adjustedBy',
                render: (row) => <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.adjustedBy}</span>
              }
            ]}
            data={filteredAdjustments}
            keyExtractor={row => row.id}
            emptyMessage="No stock adjustments found."
          />
        )}

      </div>

      {/* Record Customer Return Modal */}
      <Modal
        isOpen={isOpenReturnModal}
        onClose={() => setIsOpenReturnModal(false)}
        title="Record Spare Part Return Slip"
      >
        <form onSubmit={handleReturnSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div className="form-group">
            <label className="form-label">Client Account *</label>
            <select
              className="form-select"
              value={retForm.customerId}
              onChange={e => setRetForm(prev => ({ ...prev, customerId: e.target.value }))}
              required
            >
              <option value="">-- Select Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Original Sales Invoice # (Optional)</label>
            <input
              type="text"
              placeholder="e.g. INV-2026-00010"
              className="form-input"
              value={retForm.originalOrderId}
              onChange={e => setRetForm(prev => ({ ...prev, originalOrderId: e.target.value }))}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Returned Parts List</label>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={handleAddReturnItem}
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                disabled={parts.length === 0}
              >
                + Add Item
              </Button>
            </div>

            {retForm.items.length === 0 ? (
              <div style={{ padding: '1.5rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                No parts selected. Click "+ Add Item".
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto' }}>
                {retForm.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <select
                      className="form-select"
                      style={{ flex: 2, fontSize: '0.8rem' }}
                      value={item.partId}
                      onChange={e => handleReturnItemChange(idx, 'partId', e.target.value)}
                    >
                      {parts.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '60px', fontSize: '0.8rem' }}
                      placeholder="Qty"
                      value={item.quantity}
                      min={1}
                      onChange={e => handleReturnItemChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                    />

                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      style={{ width: '85px', fontSize: '0.8rem' }}
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={e => handleReturnItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />

                    <button 
                      type="button" 
                      onClick={() => handleRemoveReturnItem(idx)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">Return Action *</label>
              <select
                className="form-select"
                value={retForm.type}
                onChange={e => setRetForm(prev => ({ ...prev, type: e.target.value as any }))}
                required
              >
                <option value="REFUND">Cash Refund</option>
                <option value="EXCHANGE">Part Exchange</option>
                <option value="STORE_CREDIT">Store Credit Account</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none', marginTop: '10px' }}>
                <input
                  type="checkbox"
                  checked={retForm.restockItems}
                  onChange={e => setRetForm(prev => ({ ...prev, restockItems: e.target.checked }))}
                />
                Restock to inventory
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason for Return *</label>
            <input
              type="text"
              placeholder="e.g. Wrong fitting for Ninja 250 engine casing"
              className="form-input"
              value={retForm.reason}
              onChange={e => setRetForm(prev => ({ ...prev, reason: e.target.value }))}
              required
            />
          </div>

          {/* Refund estimate */}
          <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'var(--bg-hover)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
            <span>Projected Refund: </span>
            <strong style={{ color: 'var(--color-danger)' }}>
              -Rs. {retForm.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0).toFixed(2)}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsOpenReturnModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" disabled={retForm.items.length === 0}>Process Return</Button>
          </div>

        </form>
      </Modal>

      {/* Report Damage Modal */}
      <Modal
        isOpen={isOpenDamageModal}
        onClose={() => setIsOpenDamageModal(false)}
        title="Report Damaged Warehouse Stock"
      >
        <form onSubmit={handleDamageSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div className="form-group">
            <label className="form-label">Select Damaged Part *</label>
            <select
              className="form-select"
              value={dmgForm.partId}
              onChange={e => setDmgForm(prev => ({ ...prev, partId: e.target.value }))}
              required
            >
              <option value="">-- Select Part --</option>
              {parts.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockLevel})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Damaged Quantity *</label>
            <input
              type="number"
              className="form-input"
              value={dmgForm.quantity}
              min={1}
              onChange={e => setDmgForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Damage Reason / Report Notes *</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="e.g. Flooding in Bin Rack B, boxes soaked and stators rusted."
              value={dmgForm.reason}
              onChange={e => setDmgForm(prev => ({ ...prev, reason: e.target.value }))}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsOpenDamageModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Report Loss</Button>
          </div>

        </form>
      </Modal>

      {/* Create Adjustment Modal */}
      <Modal
        isOpen={isOpenAdjustModal}
        onClose={() => setIsOpenAdjustModal(false)}
        title="New Manual Stock Adjustment"
      >
        <form onSubmit={handleAdjustmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div className="form-group">
            <label className="form-label">Select Spare Part *</label>
            <select
              className="form-select"
              value={adjForm.partId}
              onChange={e => setAdjForm(prev => ({ ...prev, partId: e.target.value }))}
              required
            >
              <option value="">-- Select Part --</option>
              {parts.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Current Stock: {p.stockLevel} {p.unit})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Adjustment Formula *</label>
            <select
              className="form-select"
              value={adjForm.type}
              onChange={e => setAdjForm(prev => ({ ...prev, type: e.target.value as any }))}
              required
            >
              <option value="CORRECTION">Correction (Overrides Current Count)</option>
              <option value="ADDITION">Addition (+ delta units)</option>
              <option value="REDUCTION">Reduction (- delta units)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Adjustment Value / Count *</label>
            <input
              type="number"
              className="form-input"
              value={adjForm.quantity}
              onChange={e => setAdjForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Audit Adjustment Reason *</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="e.g. Physical inventory check showed 2 extra units due to supplier pack sizing."
              value={adjForm.reason}
              onChange={e => setAdjForm(prev => ({ ...prev, reason: e.target.value }))}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsOpenAdjustModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Apply Adjustment</Button>
          </div>

        </form>
      </Modal>

    </div>
  );
};

export default Returns;
