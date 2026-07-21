import React, { useState, useMemo } from 'react';
import { useSales } from '../hooks/useSales';
import { useInventory } from '../hooks/useInventory';
import { useCustomers } from '../hooks/useCustomers';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { 
  Plus, Printer, Search, Eye
} from 'lucide-react';
import type { SalesOrder } from '../database/schema';

interface SalesProps {
  isOpenAddSalesModal: boolean;
  setIsOpenAddSalesModal: (open: boolean) => void;
}

export const Sales: React.FC<SalesProps> = ({
  isOpenAddSalesModal,
  setIsOpenAddSalesModal
}) => {
  const {
    salesOrders,
    createSalesOrder,
    updateSalesStatus,
    getItemsForSale
  } = useSales();

  const { allPartsRaw } = useInventory();
  const { customers } = useCustomers();

  // Selected Sales Order for Details Popup
  const [selectedSOForDetail, setSelectedSOForDetail] = useState<any | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // New Sales Order Form State
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formCustomerName, setFormCustomerName] = useState('Retail Counter Walk-in');
  const [formItems, setFormItems] = useState<{ partId: string; quantity: number; unitPrice: number }[]>([]);
  const [formDiscountValue, setFormDiscountValue] = useState(0);
  const [formDiscountType, setFormDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [formTaxRate, setFormTaxRate] = useState(6); // 6% SST
  const [formPaymentMethod, setFormPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CREDIT_ACCOUNT' | 'QR_PAY'>('CASH');
  const [formNotes, setFormNotes] = useState('');

  const filteredOrders = useMemo(() => {
    return salesOrders.filter(so => {
      const matchesSearch = so.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            so.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || so.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [salesOrders, searchTerm, statusFilter]);

  const handleCustomerIdChange = (val: string) => {
    setFormCustomerId(val);
    if (val === 'walkin' || val === '') {
      setFormCustomerName('Retail Counter Walk-in');
    } else {
      const cust = customers.find(c => c.id === val);
      if (cust) setFormCustomerName(cust.name);
    }
  };

  const handleAddSOItem = () => {
    const defaultPart = allPartsRaw.find(p => p.stockLevel > 0) || allPartsRaw[0];
    if (!defaultPart) return;

    setFormItems(prev => [
      ...prev,
      { partId: defaultPart.id, quantity: 1, unitPrice: defaultPart.salePrice }
    ]);
  };

  const handleRemoveSOItem = (index: number) => {
    setFormItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSOItemChange = (index: number, field: string, value: any) => {
    setFormItems(prev => {
      const list = [...prev];
      if (field === 'partId') {
        const targetPart = allPartsRaw.find(p => p.id === value);
        list[index] = {
          partId: value,
          quantity: list[index].quantity,
          unitPrice: targetPart ? targetPart.salePrice : 0
        };
      } else {
        list[index] = {
          ...list[index],
          [field]: value
        };
      }
      return list;
    });
  };

  const formCalculations = useMemo(() => {
    const subtotal = formItems.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
    let discountAmount = 0;
    if (formDiscountValue > 0) {
      discountAmount = formDiscountType === 'PERCENTAGE' 
        ? subtotal * (formDiscountValue / 100) 
        : formDiscountValue;
    }
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (formTaxRate / 100);
    const grandTotal = taxableAmount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal
    };
  }, [formItems, formDiscountValue, formDiscountType, formTaxRate]);

  const handleCreateSOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formItems.length === 0) {
      alert('Please add at least one spare part.');
      return;
    }

    // Validate quantities against physical stock
    for (const item of formItems) {
      const part = allPartsRaw.find(p => p.id === item.partId);
      if (!part) {
        alert('Invalid part selection.');
        return;
      }
      if (item.quantity <= 0) {
        alert('Item quantity must be greater than 0.');
        return;
      }
      if (part.stockLevel < item.quantity) {
        alert(`Insufficient stock for "${part.name}". Available: ${part.stockLevel} units.`);
        return;
      }
    }

    const result = createSalesOrder(formCustomerName, formItems, {
      customerId: formCustomerId === 'walkin' ? undefined : formCustomerId,
      discount: formDiscountValue,
      discountType: formDiscountType,
      taxRate: formTaxRate,
      paymentMethod: formPaymentMethod,
      notes: formNotes
    });

    if (result) {
      setIsOpenAddSalesModal(false);
      // Reset Form
      setFormCustomerId('');
      setFormCustomerName('Retail Counter Walk-in');
      setFormItems([]);
      setFormDiscountValue(0);
      setFormNotes('');
    } else {
      alert('Failed to log sales sheet. Please check stock levels and try again.');
    }
  };

  const handlePrint = (so: SalesOrder) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const items = getItemsForSale(so.id);

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${so.id}</title>
          <style>
            body { font-family: sans-serif; color: #1e293b; padding: 20px; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 8px; text-align: left; }
            .totals { margin-top: 15px; text-align: right; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>ANJU AUTO PARTS</h2>
            <div style="color: #64748b; font-size: 14px;">Beltar, Udayapur</div>
            <div>Transaction #: <strong>${so.id}</strong></div>
            <div>Date: ${so.saleDate}</div>
            <div>Customer: ${so.customerName}</div>
          </div>
          <table>
            <thead>
              <tr><th>Part</th><th>Qty</th><th>Unit</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.part ? item.part.name : 'Unknown Part'}</td>
                  <td>${item.quantity}</td>
                  <td>Rs. ${item.unitPrice.toFixed(2)}</td>
                  <td>Rs. ${(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            Total Paid: Rs. ${so.totalAmount.toFixed(2)}
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="heading-display" style={{ fontSize: '1.625rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.25 }}>
            Sales Orders
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Fulfill invoices for repair workshops, trade accounts, and retail sales.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsOpenAddSalesModal(true)}>
          <Plus size={16} style={{ marginRight: '6px' }} /> Create Sales Invoice
        </Button>
      </div>

      {/* Filter panel */}
      <div className="panel" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search dispatch logs..."
            className="form-input"
            style={{ paddingLeft: '36px' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ width: '160px' }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending Dispatch</option>
          <option value="DISPATCHED">Dispatched</option>
          <option value="DELIVERED">Delivered</option>
        </select>
      </div>

      {/* Sales Orders Table */}
      <div className="panel">
        <Table
          columns={[
            {
              header: 'Invoice ID / Date',
              render: (row) => (
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.id}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Date: {row.saleDate}</div>
                </div>
              )
            },
            {
              header: 'Customer / Workshop Account',
              accessor: 'customerName',
              render: (row) => <span style={{ fontWeight: 600 }}>{row.customerName}</span>
            },
            {
              header: 'Invoice Sum',
              render: (row) => <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontFeatureSettings: "'tnum'" }}>Rs. {row.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            },
            {
              header: 'Logistics Status',
              render: (row) => {
                let bClass = 'badge-secondary';
                if (row.status === 'DELIVERED') bClass = 'badge-success';
                if (row.status === 'DISPATCHED') bClass = 'badge-warning';
                if (row.status === 'PENDING') bClass = 'badge-danger';
                return <span className={`badge ${bClass}`}>{row.status}</span>;
              }
            },
            {
              header: 'Actions',
              render: (row) => (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button variant="ghost" size="sm" style={{ padding: '4px' }} onClick={() => {
                    const saleItems = getItemsForSale(row.id);
                    setSelectedSOForDetail({ ...row, items: saleItems });
                  }}>
                    <Eye size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" style={{ padding: '4px' }} onClick={() => handlePrint(row)}>
                    <Printer size={14} />
                  </Button>
                  {row.status === 'PENDING' && (
                    <Button variant="secondary" size="sm" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => updateSalesStatus(row.id, 'DISPATCHED')}>
                      Dispatch
                    </Button>
                  )}
                  {row.status === 'DISPATCHED' && (
                    <Button variant="primary" size="sm" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => updateSalesStatus(row.id, 'DELIVERED')}>
                      Complete
                    </Button>
                  )}
                </div>
              )
            }
          ]}
          data={filteredOrders}
          keyExtractor={(row) => row.id}
          emptyMessage="No sales dispatch invoices logged in system database."
        />
      </div>

      {/* Record Sales Invoice Modal */}
      <Modal
        isOpen={isOpenAddSalesModal}
        onClose={() => setIsOpenAddSalesModal(false)}
        title="Record Sales Dispatch Sheet"
      >
        <form onSubmit={handleCreateSOSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div className="form-group">
            <label className="form-label">Client Account Profile *</label>
            <select
              className="form-select"
              value={formCustomerId}
              onChange={e => handleCustomerIdChange(e.target.value)}
              required
            >
              <option value="walkin">Retail Counter Walk-in</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Invoice Items</label>
              <Button 
                variant="secondary" 
                size="sm" 
                type="button" 
                onClick={handleAddSOItem}
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                disabled={allPartsRaw.length === 0}
              >
                + Add Item
              </Button>
            </div>

            {formItems.length === 0 ? (
              <div style={{ padding: '2rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                No parts selected. Click "+ Add Item" to add items to invoice.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                {formItems.map((item, idx) => {
                  const part = allPartsRaw.find(p => p.id === item.partId);
                  const isStockDeficit = part && part.stockLevel < item.quantity;
                  
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select
                        className="form-select"
                        style={{ flex: 2, fontSize: '0.8rem' }}
                        value={item.partId}
                        onChange={e => handleSOItemChange(idx, 'partId', e.target.value)}
                      >
                        {allPartsRaw.map(p => (
                          <option key={p.id} value={p.id} disabled={p.stockLevel <= 0}>
                            {p.name} (Stock: {p.stockLevel} units | Price: Rs. {p.salePrice})
                          </option>
                        ))}
                      </select>
                      
                      <input
                        type="number"
                        className="form-input"
                        style={{ flex: 0.8, fontSize: '0.8rem', borderColor: isStockDeficit ? 'var(--color-danger)' : 'var(--border-color)' }}
                        placeholder="Qty"
                        value={item.quantity}
                        min={1}
                        onChange={e => handleSOItemChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                      />

                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        style={{ flex: 1, fontSize: '0.8rem' }}
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={e => handleSOItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />

                      <button 
                        type="button" 
                        onClick={() => handleRemoveSOItem(idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Discount</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="number"
                  className="form-input"
                  style={{ fontSize: '0.8rem' }}
                  value={formDiscountValue}
                  onChange={e => setFormDiscountValue(parseFloat(e.target.value) || 0)}
                />
                <select
                  className="form-select"
                  style={{ width: '55px', fontSize: '0.8rem', padding: '4px' }}
                  value={formDiscountType}
                  onChange={e => setFormDiscountType(e.target.value as any)}
                >
                  <option value="PERCENTAGE">%</option>
                  <option value="FIXED">Rs.</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Tax Rate</label>
              <select
                className="form-select"
                style={{ fontSize: '0.8rem' }}
                value={formTaxRate}
                onChange={e => setFormTaxRate(parseInt(e.target.value) || 0)}
              >
                <option value={0}>0% Tax</option>
                <option value={6}>6% SST</option>
                <option value={10}>10% Tax</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Method</label>
              <select
                className="form-select"
                style={{ fontSize: '0.8rem' }}
                value={formPaymentMethod}
                onChange={e => setFormPaymentMethod(e.target.value as any)}
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CARD">Card</option>
                <option value="CREDIT_ACCOUNT">Credit Account</option>
                <option value="QR_PAY">QR Pay</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifySelf: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Net Grand Total: </span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Rs. {formCalculations.grandTotal.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="secondary" size="sm" type="button" onClick={() => setIsOpenAddSalesModal(false)}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit" disabled={formItems.length === 0}>Generate Invoice</Button>
            </div>
          </div>

        </form>
      </Modal>

      {/* Sales Invoice details Popup */}
      <Modal
        isOpen={selectedSOForDetail !== null}
        onClose={() => setSelectedSOForDetail(null)}
        title={`Sales Invoice Details: ${selectedSOForDetail?.id}`}
      >
        {selectedSOForDetail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Customer Account</label>
                <div style={{ fontWeight: 600 }}>{selectedSOForDetail.customerName}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Invoice Status</label>
                <div>
                  <span className={`badge ${selectedSOForDetail.status === 'DELIVERED' ? 'badge-success' : 'badge-warning'}`}>
                    {selectedSOForDetail.status}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ textAlign: 'left', padding: '4px 0' }}>Part Spec</th>
                    <th style={{ textAlign: 'center', padding: '4px 0' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '4px 0' }}>Unit Retail</th>
                    <th style={{ textAlign: 'right', padding: '4px 0' }}>Net Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSOForDetail.items.map((item: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '6px 0' }}>{item.part ? item.part.name : 'Unknown Part'}</td>
                      <td style={{ textAlign: 'center', padding: '6px 0' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', padding: '6px 0' }}>Rs. {item.unitPrice.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '6px 0' }}>Rs. {(item.quantity * item.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedSOForDetail.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Discount applied:</span>
                <span style={{ color: 'var(--color-danger)' }}>
                  {selectedSOForDetail.discountType === 'PERCENTAGE' ? `${selectedSOForDetail.discount}%` : `Rs. ${selectedSOForDetail.discount}`}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '8px', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Grand Total Invoice:</span>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-brand)' }}>
                Rs. {selectedSOForDetail.totalAmount.toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1rem' }}>
              <Button variant="secondary" size="sm" onClick={() => setSelectedSOForDetail(null)}>Close</Button>
              <Button variant="primary" size="sm" onClick={() => { handlePrint(selectedSOForDetail); setSelectedSOForDetail(null); }}>
                Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};
export default Sales;
