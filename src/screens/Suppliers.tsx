import React, { useState, useMemo, useEffect } from 'react';
import { usePurchaseOrders } from '../hooks/usePurchaseOrders';
import { useInventory } from '../hooks/useInventory';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Trash2, Building2 } from 'lucide-react';

interface SuppliersProps {
  isOpenAddPOModal: boolean;
  setIsOpenAddPOModal: (open: boolean) => void;
}

export const Suppliers: React.FC<SuppliersProps> = ({
  isOpenAddPOModal,
  setIsOpenAddPOModal
}) => {
  const {
    purchaseOrders,
    suppliers,
    createOrder,
    updateOrderStatus,
    getItemsForOrder,
    addSupplier,
    deleteSupplier
  } = usePurchaseOrders();

  const { allPartsRaw } = useInventory();

  // Selected Supplier for Detail View
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  // Modals state
  const [isOpenAddSupplierModal, setIsOpenAddSupplierModal] = useState(false);
  const [selectedPOForDetail, setSelectedPOForDetail] = useState<any | null>(null);

  // New Supplier Form
  const [newSupplierForm, setNewSupplierForm] = useState({
    name: '',
    email: '',
    phone: '',
    contactPerson: '',
    leadTimeDays: 7
  });

  // New PO Form
  const [newPOForm, setNewPOForm] = useState({
    supplierId: '',
    items: [] as { partId: string; quantity: number; unitCost: number }[]
  });

  // Set default supplier when PO modal opens
  useEffect(() => {
    if (isOpenAddPOModal && suppliers.length > 0 && !newPOForm.supplierId) {
      setNewPOForm({
        supplierId: suppliers[0].id,
        items: []
      });
    }
  }, [isOpenAddPOModal, suppliers, newPOForm.supplierId]);

  const handleDeleteSupplier = (id: string, name: string) => {
    const itemsSupplied = allPartsRaw.filter(p => p.supplierId === id).length;
    const poCount = purchaseOrders.filter(po => po.supplierId === id).length;

    let confirmMsg = `Are you sure you want to delete supplier "${name}"?`;
    if (itemsSupplied > 0 || poCount > 0) {
      confirmMsg += `\n\nWarning: This supplier is currently associated with ${itemsSupplied} catalogued part(s) and ${poCount} purchase order(s).`;
    }

    if (window.confirm(confirmMsg)) {
      deleteSupplier(id);
      if (selectedSupplierId === id) {
        setSelectedSupplierId(null);
      }
    }
  };

  // Filter parts based on selected supplier in PO
  const availablePartsForSupplier = useMemo(() => {
    if (!newPOForm.supplierId) return [];
    return allPartsRaw.filter(p => p.supplierId === newPOForm.supplierId);
  }, [newPOForm.supplierId, allPartsRaw]);

  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierForm.name || !newSupplierForm.email) {
      alert('Please fill in required fields (Name, Email).');
      return;
    }
    addSupplier(newSupplierForm);
    setIsOpenAddSupplierModal(false);
    setNewSupplierForm({
      name: '',
      email: '',
      phone: '',
      contactPerson: '',
      leadTimeDays: 7
    });
  };

  const handleCreatePOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPOForm.items.length === 0) {
      alert('Please add at least one spare part to this order.');
      return;
    }

    // Verify all item quantities are greater than zero
    for (const item of newPOForm.items) {
      if (item.quantity <= 0) {
        alert('Quantity must be greater than 0.');
        return;
      }
    }

    createOrder(newPOForm.supplierId, newPOForm.items);
    setIsOpenAddPOModal(false);
    setNewPOForm({
      supplierId: '',
      items: []
    });
  };

  const handleAddPOItem = () => {
    if (availablePartsForSupplier.length === 0) return;
    const defaultPart = availablePartsForSupplier[0];
    setNewPOForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { partId: defaultPart.id, quantity: 5, unitCost: defaultPart.costPrice }
      ]
    }));
  };

  const handleRemovePOItem = (index: number) => {
    setNewPOForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handlePOItemChange = (index: number, field: string, value: any) => {
    setNewPOForm(prev => {
      const list = [...prev.items];
      if (field === 'partId') {
        const targetPart = allPartsRaw.find(p => p.id === value);
        list[index] = {
          partId: value,
          quantity: list[index].quantity,
          unitCost: targetPart ? targetPart.costPrice : 0
        };
      } else {
        list[index] = {
          ...list[index],
          [field]: value
        };
      }
      return { ...prev, items: list };
    });
  };

  const activeSupplier = useMemo(() => {
    return suppliers.find(s => s.id === selectedSupplierId) || null;
  }, [selectedSupplierId, suppliers]);

  const supplierPOs = useMemo(() => {
    if (!selectedSupplierId) return [];
    return purchaseOrders.filter(po => po.supplierId === selectedSupplierId);
  }, [selectedSupplierId, purchaseOrders]);

  const getSupplierName = (id: string) => {
    return suppliers.find(s => s.id === id)?.name || 'Unknown Supplier';
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="heading-display" style={{ fontSize: '1.625rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.25 }}>Suppliers</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Place restock orders, manage lead times, audit supplier history logs.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" size="sm" onClick={() => setIsOpenAddSupplierModal(true)}>
            Add Supplier
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsOpenAddPOModal(true)}>
            Create Purchase Order
          </Button>
        </div>
      </div>

      {/* Supplier Grid & Active POs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Suppliers Directory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 className="heading-display" style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Suppliers Directory</h3>
          {suppliers.length === 0 ? (
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              No suppliers found. Click "Add Supplier" to create one.
            </div>
          ) : (
            suppliers.map(sup => {
              const isActive = selectedSupplierId === sup.id;
              const itemsSupplied = allPartsRaw.filter(p => p.supplierId === sup.id).length;
              const openOrders = purchaseOrders.filter(po => po.supplierId === sup.id && po.status === 'SENT').length;

              return (
                <div
                  key={sup.id}
                  onClick={() => setSelectedSupplierId(isActive ? null : sup.id)}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    borderColor: isActive ? 'var(--color-brand)' : 'var(--border-color)',
                    backgroundColor: isActive ? 'var(--color-brand-glow)' : 'var(--bg-panel)',
                    padding: '1rem',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{sup.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>{sup.leadTimeDays}d lead</span>
                      <button
                        type="button"
                        title={`Delete ${sup.name}`}
                        aria-label={`Delete ${sup.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSupplier(sup.id, sup.name);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-tertiary)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.15s, background-color 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--color-danger, #ef4444)';
                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-tertiary)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Contact: {sup.contactPerson}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Phone: {sup.phone}</div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '6px', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                    <span>{itemsSupplied} Parts catalogued</span>
                    <span>•</span>
                    <span style={{ color: openOrders > 0 ? 'var(--color-warning)' : 'inherit', fontWeight: openOrders > 0 ? 600 : 400 }}>
                      {openOrders} pending restocks
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Active Supplier View OR Clean Empty State */}
        {activeSupplier ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Active Supplier Profile Card */}
            <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h2 className="heading-display" style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {activeSupplier.name}
                    </h2>
                    <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                      {activeSupplier.leadTimeDays}d standard lead
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {activeSupplier.contactPerson && (
                      <span><strong>Contact:</strong> {activeSupplier.contactPerson}</span>
                    )}
                    {activeSupplier.phone && (
                      <span><strong>Phone:</strong> {activeSupplier.phone}</span>
                    )}
                    {activeSupplier.email && (
                      <span><strong>Email:</strong> {activeSupplier.email}</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setNewPOForm({
                        supplierId: activeSupplier.id,
                        items: []
                      });
                      setIsOpenAddPOModal(true);
                    }}
                  >
                    + Create PO
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<Trash2 size={14} />}
                    onClick={() => handleDeleteSupplier(activeSupplier.id, activeSupplier.name)}
                  >
                    Delete Supplier
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Supplier Orders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="heading-display" style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Purchase Orders ({supplierPOs.length})
                </h3>
              </div>

              <Table
                columns={[
                  {
                    header: 'PO ID / Date',
                    render: (row) => (
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.id}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ordered: {row.orderDate}</div>
                      </div>
                    )
                  },
                  {
                    header: 'Net Total',
                    render: (row) => <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontFeatureSettings: "'tnum'" }}>Rs. {row.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  },
                  {
                    header: 'Expected Arrival',
                    accessor: 'expectedDelivery'
                  },
                  {
                    header: 'Status',
                    render: (row) => {
                      let bClass = 'badge-secondary';
                      if (row.status === 'RECEIVED') bClass = 'badge-success';
                      if (row.status === 'SENT') bClass = 'badge-warning';
                      if (row.status === 'CANCELLED') bClass = 'badge-danger';
                      return <span className={`badge ${bClass}`}>{row.status}</span>;
                    }
                  },
                  {
                    header: 'Actions',
                    render: (row) => (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button variant="ghost" size="sm" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => {
                          const orderItems = getItemsForOrder(row.id);
                          setSelectedPOForDetail({ ...row, items: orderItems });
                        }}>
                          View Items
                        </Button>
                        {row.status === 'SENT' && (
                          <Button variant="primary" size="sm" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => {
                            if (window.confirm('Mark this purchase order as RECEIVED? Stock levels will be updated.')) {
                              updateOrderStatus(row.id, 'RECEIVED');
                            }
                          }}>
                            Receive
                          </Button>
                        )}
                      </div>
                    )
                  }
                ]}
                data={supplierPOs}
                keyExtractor={(row) => row.id}
                emptyMessage={`No purchase orders logged for ${activeSupplier.name}.`}
              />
            </div>

          </div>
        ) : (
          /* Clean Selection Placeholder */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div 
              className="card"
              style={{ 
                padding: '3.5rem 2rem', 
                textAlign: 'center', 
                backgroundColor: 'var(--bg-panel)', 
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px'
              }}
            >
              <div 
                style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '14px', 
                  backgroundColor: 'var(--bg-hover)', 
                  border: '1px solid var(--border-color)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--text-tertiary)'
                }}
              >
                <Building2 size={26} />
              </div>
              <h3 className="heading-display" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Select a Supplier
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '380px', margin: 0, lineHeight: 1.5 }}>
                Click any supplier from the directory on the left to view their profile, contact details, and specific purchase orders.
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <Button variant="secondary" size="sm" onClick={() => setIsOpenAddSupplierModal(true)}>
                  Add Supplier
                </Button>
                <Button variant="primary" size="sm" onClick={() => setIsOpenAddPOModal(true)}>
                  Create Purchase Order
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={isOpenAddSupplierModal}
        onClose={() => setIsOpenAddSupplierModal(false)}
        title="Register New Supplier Channel"
      >
        <form onSubmit={handleAddSupplierSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Supplier Brand Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Apex Performance Inc"
              value={newSupplierForm.name}
              onChange={e => setNewSupplierForm(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          
          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Sarah Connor"
                value={newSupplierForm.contactPerson}
                onChange={e => setNewSupplierForm(prev => ({ ...prev, contactPerson: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Lead Time (Days) *</label>
              <input
                type="number"
                className="form-input"
                value={newSupplierForm.leadTimeDays}
                onChange={e => setNewSupplierForm(prev => ({ ...prev, leadTimeDays: parseInt(e.target.value) || 0 }))}
                required
              />
            </div>
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                placeholder="orders@apex.com"
                value={newSupplierForm.email}
                onChange={e => setNewSupplierForm(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Telephone Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="+1-555-9082"
                value={newSupplierForm.phone}
                onChange={e => setNewSupplierForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsOpenAddSupplierModal(false)} style={{ flex: 1 }}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" style={{ flex: 1 }}>Register Brand</Button>
          </div>
        </form>
      </Modal>

      {/* Create Purchase Order Modal */}
      <Modal
        isOpen={isOpenAddPOModal}
        onClose={() => setIsOpenAddPOModal(false)}
        title="Compose Restock Purchase Order"
      >
        <form onSubmit={handleCreatePOSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div className="form-group">
            <label className="form-label">Select Supply Channel *</label>
            <select
              className="form-select"
              value={newPOForm.supplierId}
              onChange={e => setNewPOForm({ supplierId: e.target.value, items: [] })}
              required
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
              Only spare parts mapped to this supplier can be restocked in this transaction sheet.
            </span>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Restock Items Ledger</label>
              <Button 
                variant="secondary" 
                size="sm" 
                type="button" 
                onClick={handleAddPOItem}
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                disabled={availablePartsForSupplier.length === 0}
              >
                + Add Part
              </Button>
            </div>

            {newPOForm.items.length === 0 ? (
              <div style={{ padding: '2rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                {availablePartsForSupplier.length === 0 
                  ? 'No parts catalogued under this supplier. Map parts first!' 
                  : 'No items added. Click "+ Add Part" to add items.'
                }
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                {newPOForm.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      className="form-select"
                      style={{ flex: 2, fontSize: '0.8rem' }}
                      value={item.partId}
                      onChange={e => handlePOItemChange(idx, 'partId', e.target.value)}
                    >
                      {availablePartsForSupplier.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Cost: Rs. {p.costPrice})</option>
                      ))}
                    </select>
                    
                    <input
                      type="number"
                      className="form-input"
                      style={{ flex: 0.8, fontSize: '0.8rem' }}
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={e => handlePOItemChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                    />

                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      style={{ flex: 1, fontSize: '0.8rem' }}
                      placeholder="Cost"
                      value={item.unitCost}
                      onChange={e => handlePOItemChange(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                    />

                    <button 
                      type="button" 
                      onClick={() => handleRemovePOItem(idx)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifySelf: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Net Total: </span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Rs. {newPOForm.items.reduce((s, i) => s + (i.quantity * i.unitCost), 0).toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="secondary" size="sm" type="button" onClick={() => setIsOpenAddPOModal(false)}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit" disabled={newPOForm.items.length === 0}>Send Order</Button>
            </div>
          </div>

        </form>
      </Modal>

      {/* PO View Detail Modal */}
      <Modal
        isOpen={selectedPOForDetail !== null}
        onClose={() => setSelectedPOForDetail(null)}
        title={`Purchase Order: ${selectedPOForDetail?.id}`}
      >
        {selectedPOForDetail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Supplier Name</label>
                <div style={{ fontWeight: 600 }}>{getSupplierName(selectedPOForDetail.supplierId)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Order Status</label>
                <div>
                  <span className={`badge ${selectedPOForDetail.status === 'RECEIVED' ? 'badge-success' : 'badge-warning'}`}>
                    {selectedPOForDetail.status}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ textAlign: 'left', padding: '4px 0' }}>Spare Part</th>
                    <th style={{ textAlign: 'center', padding: '4px 0' }}>Order Qty</th>
                    <th style={{ textAlign: 'right', padding: '4px 0' }}>Unit Cost</th>
                    <th style={{ textAlign: 'right', padding: '4px 0' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPOForDetail.items.map((item: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '6px 0' }}>{item.part ? item.part.name : 'Unknown Part'}</td>
                      <td style={{ textAlign: 'center', padding: '6px 0' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', padding: '6px 0' }}>Rs. {item.unitCost.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '6px 0' }}>Rs. {(item.quantity * item.unitCost).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '8px', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Grand Total Amount:</span>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-brand)' }}>
                Rs. {selectedPOForDetail.totalAmount.toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button variant="secondary" size="sm" onClick={() => setSelectedPOForDetail(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};
export default Suppliers;
