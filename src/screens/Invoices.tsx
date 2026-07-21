import React, { useState, useMemo, useEffect } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { useInventory } from '../hooks/useInventory';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { DB } from '../database/db';
import { 
  Plus, Printer, Mail, Download, Search, Eye
} from 'lucide-react';
import type { Invoice } from '../database/schema';

export const Invoices: React.FC = () => {
  const { customers } = useCustomers();
  const { allPartsRaw } = useInventory();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // New Invoice Form state
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formItems, setFormItems] = useState<{ partId: string; quantity: number; unitPrice: number; discountPercent: number }[]>([]);
  const [formDiscountValue, setFormDiscountValue] = useState(0);
  const [formDiscountType, setFormDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [formTaxRate, setFormTaxRate] = useState(6); // 6% SST by default
  const [formPaymentMethod, setFormPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CREDIT_ACCOUNT' | 'QR_PAY'>('CASH');
  const [formNotes, setFormNotes] = useState('');

  const refreshData = () => {
    setInvoices(DB.getInvoices());
  };

  useEffect(() => {
    refreshData();
    const handleStorage = () => refreshData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            inv.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const availableParts = useMemo(() => {
    return allPartsRaw.filter(p => p.stockLevel > 0);
  }, [allPartsRaw]);

  // Form Calculations
  const formCalculations = useMemo(() => {
    let subtotal = 0;
    let costTotal = 0;
    
    const calculatedItems = formItems.map(item => {
      const part = allPartsRaw.find(p => p.id === item.partId);
      const costPrice = part ? part.costPrice : 0;
      const sku = part ? part.sku : '';
      const partName = part ? part.name : '';
      
      const lineSubtotal = item.quantity * item.unitPrice;
      const lineDiscountAmount = lineSubtotal * (item.discountPercent / 100);
      const lineTotal = lineSubtotal - lineDiscountAmount;
      const lineCost = item.quantity * costPrice;
      const lineProfit = lineTotal - lineCost;
      
      subtotal += lineTotal;
      costTotal += lineCost;
      
      return {
        partId: item.partId,
        partName,
        sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        costPrice,
        discount: item.discountPercent,
        lineTotal,
        lineProfit
      };
    });

    let discountAmount = 0;
    if (formDiscountValue > 0) {
      discountAmount = formDiscountType === 'PERCENTAGE' 
        ? subtotal * (formDiscountValue / 100) 
        : formDiscountValue;
    }
    
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (formTaxRate / 100);
    const grandTotal = taxableAmount + taxAmount;
    const profit = grandTotal - costTotal;

    return {
      items: calculatedItems,
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal,
      profit
    };
  }, [formItems, formDiscountValue, formDiscountType, formTaxRate, allPartsRaw]);

  // Add Item to Form
  const handleAddItem = () => {
    const defaultPart = availableParts[0];
    if (!defaultPart) return;
    setFormItems(prev => [
      ...prev,
      { partId: defaultPart.id, quantity: 1, unitPrice: defaultPart.salePrice, discountPercent: 0 }
    ]);
  };

  // Remove Item from Form
  const handleRemoveItem = (index: number) => {
    setFormItems(prev => prev.filter((_, i) => i !== index));
  };

  // Change Item fields
  const handleItemChange = (index: number, field: string, value: any) => {
    setFormItems(prev => {
      const next = [...prev];
      if (field === 'partId') {
        const part = allPartsRaw.find(p => p.id === value);
        next[index] = {
          partId: value,
          quantity: next[index].quantity,
          unitPrice: part ? part.salePrice : 0,
          discountPercent: next[index].discountPercent
        };
      } else {
        next[index] = {
          ...next[index],
          [field]: value
        };
      }
      return next;
    });
  };

  // Create Invoice Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerId) {
      alert('Please select a customer.');
      return;
    }
    if (formItems.length === 0) {
      alert('Please add at least one item.');
      return;
    }

    const customer = customers.find(c => c.id === formCustomerId);
    if (!customer) return;

    // Validate quantities
    for (const item of formItems) {
      const part = allPartsRaw.find(p => p.id === item.partId);
      if (!part || part.stockLevel < item.quantity) {
        alert(`Insufficient stock for "${part?.name || 'Item'}". Available: ${part?.stockLevel || 0}`);
        return;
      }
    }

    // Step 1: Create sales order first (which deducts stock automatically)
    const salesOrder = DB.createSalesOrder(customer.name, formItems.map(item => ({
      partId: item.partId,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    })), {
      customerId: customer.id,
      discount: formDiscountValue,
      discountType: formDiscountType,
      taxRate: formTaxRate,
      paymentMethod: formPaymentMethod,
      notes: formNotes
    });

    if (!salesOrder) {
      alert('Failed to log sales order.');
      return;
    }

    // Step 2: Create invoice linked to this sales order
    const invoice = DB.createInvoice({
      salesOrderId: salesOrder.id,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      items: formCalculations.items,
      subtotal: formCalculations.subtotal,
      discountType: formDiscountType,
      discountValue: formDiscountValue,
      discountAmount: formCalculations.discountAmount,
      taxRate: formTaxRate,
      taxAmount: formCalculations.taxAmount,
      grandTotal: formCalculations.grandTotal,
      profit: formCalculations.profit,
      paymentMethod: formPaymentMethod,
      notes: formNotes,
      status: 'PAID' // Defaults to paid on direct counter/invoice creation
    });

    // Link back sales order with invoice ID
    const soList = DB.getSalesOrders();
    const soIdx = soList.findIndex(so => so.id === salesOrder.id);
    if (soIdx !== -1) {
      soList[soIdx].invoiceId = invoice.id;
      soList[soIdx].status = 'DELIVERED';
      DB.saveSalesOrders(soList);
    }

    setIsOpenAddModal(false);
    refreshData();
    window.dispatchEvent(new Event('storage'));
    setSelectedInvoice(invoice);

    // Reset Form
    setFormCustomerId('');
    setFormItems([]);
    setFormDiscountValue(0);
    setFormNotes('');
  };

  const handlePrint = (inv: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Simple custom print layout for invoice receipt
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${inv.invoiceNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 20px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            .company { font-size: 1.5rem; font-weight: 800; color: #0f172a; }
            .details { margin: 20px 0; display: flex; justify-content: space-between; }
            .details div { line-height: 1.5; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            th { background-color: #f8fafc; font-weight: 600; }
            .totals { margin-top: 20px; text-align: right; width: 300px; margin-left: auto; line-height: 1.8; }
            .totals .row { display: flex; justify-content: space-between; }
            .totals .grand-total { font-size: 1.2rem; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 5px; }
            .footer { margin-top: 50px; text-align: center; font-size: 0.8rem; color: #64748b; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="company">ANJU AUTO PARTS</div>
              <div>Beltar, Udayapur</div>
              <div>contact@anjuautoparts.com</div>
            </div>
            <div style="text-align: right;">
              <h2 style="margin:0;color:#0f172a;">TAX INVOICE</h2>
              <div>Invoice #: <strong>${inv.invoiceNumber}</strong></div>
              <div>Date: ${new Date(inv.createdAt).toLocaleDateString()}</div>
              <div>Payment: ${inv.paymentMethod.replace('_', ' ')}</div>
            </div>
          </div>
          <div class="details">
            <div>
              <strong>Billed To:</strong><br>
              ${inv.customerName}<br>
              ${inv.customerPhone}<br>
              ${inv.customerAddress || ''}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Part Details</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${inv.items.map(item => `
                <tr>
                  <td>${item.partName}</td>
                  <td>${item.sku}</td>
                  <td>${item.quantity}</td>
                  <td>Rs. ${item.unitPrice.toFixed(2)}</td>
                  <td>${item.discount}%</td>
                  <td>Rs. ${item.lineTotal.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <div class="row">
              <span>Subtotal:</span>
              <span>Rs. ${inv.subtotal.toFixed(2)}</span>
            </div>
            ${inv.discountAmount > 0 ? `
              <div class="row">
                <span>Discount:</span>
                <span>-Rs. ${inv.discountAmount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="row">
              <span>Tax (${inv.taxRate}%):</span>
              <span>Rs. ${inv.taxAmount.toFixed(2)}</span>
            </div>
            <div class="row grand-total">
              <span>Grand Total:</span>
              <span>Rs. ${inv.grandTotal.toFixed(2)}</span>
            </div>
          </div>
          <div class="footer">
            Thank you for your business! Goods sold are not refundable unless verified damaged.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleEmail = (inv: Invoice) => {
    const subject = `Invoice ${inv.invoiceNumber} from Anju Auto Parts`;
    const body = `Hi ${inv.customerName},\n\nPlease find details of your recent transaction:\n\nInvoice Number: ${inv.invoiceNumber}\nDate: ${new Date(inv.createdAt).toLocaleDateString()}\nTotal Amount: Rs. ${inv.grandTotal.toFixed(2)}\nPayment Method: ${inv.paymentMethod.replace('_', ' ')}\n\nThank you for choosing Anju Auto Parts!`;
    const mailtoUrl = `mailto:${inv.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="heading-display" style={{ fontSize: '1.625rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.25 }}>
            Invoices
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Generate tax-compliant invoices, track transaction profit margins, export or print.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsOpenAddModal(true)}>
          <Plus size={16} style={{ marginRight: '6px' }} /> Create Sales Invoice
        </Button>
      </div>

      {/* Main Grid: Left List, Right preview */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedInvoice ? '1.2fr 1.8fr' : '1fr', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* Invoice List Panel */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search invoice # or client..."
                className="form-input"
                style={{ paddingLeft: '36px' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              style={{ width: '150px' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="ISSUED">Issued</option>
              <option value="VOID">Void</option>
            </select>
          </div>

          <Table
            columns={[
              {
                header: 'Invoice # / Date',
                render: (row) => (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.invoiceNumber}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {new Date(row.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                )
              },
              {
                header: 'Client / Account',
                render: (row) => (
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.customerName}</div>
                    <span className="badge badge-secondary" style={{ fontSize: '0.62rem', padding: '1px 5px', marginTop: '2px' }}>
                      {row.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                )
              },
              {
                header: 'Total Sum',
                render: (row) => (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontFeatureSettings: "'tnum'" }}>
                      Rs. {row.grandTotal.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-success)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontFeatureSettings: "'tnum'" }}>
                      Margin: +Rs. {row.profit.toFixed(0)}
                    </div>
                  </div>
                )
              },
              {
                header: 'Actions',
                render: (row) => (
                  <Button variant="ghost" size="sm" style={{ padding: '4px' }} onClick={() => setSelectedInvoice(row)}>
                    <Eye size={14} />
                  </Button>
                )
              }
            ]}
            data={filteredInvoices}
            keyExtractor={row => row.id}
            emptyMessage="No invoices generated yet."
          />
        </div>

        {/* Invoice Preview Section */}
        {selectedInvoice && (
          <div className="panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Header controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" size="sm" onClick={() => handlePrint(selectedInvoice)}>
                  <Printer size={14} style={{ marginRight: '4px' }} /> Print
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handlePrint(selectedInvoice)}>
                  <Download size={14} style={{ marginRight: '4px' }} /> Save PDF
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleEmail(selectedInvoice)}>
                  <Mail size={14} style={{ marginRight: '4px' }} /> Email client
                </Button>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {/* A4 Paper Container (mimicking a physical document) */}
            <div style={{ backgroundColor: '#ffffff', color: '#1e293b', padding: '2rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'sans-serif' }}>
              
              {/* Brand Section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontStyle: 'italic', fontWeight: 900, fontSize: '1.5rem', color: '#0f172a', letterSpacing: '-0.04em' }}>ANJU AUTO PARTS</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                    Beltar, Udayapur, Nepal<br/>
                    contact@anjuautoparts.com
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>TAX INVOICE</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px' }}>
                    Invoice #: <strong style={{ color: '#0f172a' }}>{selectedInvoice.invoiceNumber}</strong><br/>
                    Fulfillment Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()}<br/>
                    Method: {selectedInvoice.paymentMethod.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Billing details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', fontSize: '0.82rem' }}>
                <div>
                  <strong style={{ color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Billed To:</strong>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{selectedInvoice.customerName}</div>
                  <div style={{ color: '#475569', marginTop: '3px', lineHeight: 1.4 }}>
                    Email: {selectedInvoice.customerEmail}<br/>
                    Phone: {selectedInvoice.customerPhone}<br/>
                    Address: {selectedInvoice.customerAddress || 'N/A'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                  {/* Pseudo Barcode Strip */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ display: 'flex', height: '30px', gap: '1.5px', background: '#000000', padding: '2px 8px', borderRadius: '2px' }}>
                      {[4,1,3,2,1,4,2,3,1,4,1,2,4,2,1,3,2,4,1,2,3].map((w, idx) => (
                        <div key={idx} style={{ width: `${w}px`, height: '100%', backgroundColor: '#ffffff' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.2em', marginTop: '3px' }}>{selectedInvoice.id.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                      <th style={{ textAlign: 'left', padding: '8px 4px' }}>Spare Part Spec</th>
                      <th style={{ textAlign: 'left', padding: '8px 4px' }}>SKU</th>
                      <th style={{ textAlign: 'center', padding: '8px 4px' }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '8px 4px' }}>Unit Retail</th>
                      <th style={{ textAlign: 'right', padding: '8px 4px' }}>Disc</th>
                      <th style={{ textAlign: 'right', padding: '8px 4px' }}>Net Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                        <td style={{ padding: '10px 4px', fontWeight: 600, color: '#0f172a' }}>{item.partName}</td>
                        <td style={{ padding: '10px 4px', color: '#64748b' }}>{item.sku}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'right' }}>Rs. {item.unitPrice.toFixed(2)}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'right', color: '#e11d48' }}>{item.discount > 0 ? `${item.discount}%` : '-'}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>Rs. {item.lineTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculation Summary Footer */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginTop: '1rem', borderTop: '2px solid #f1f5f9', paddingTop: '1.25rem' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {selectedInvoice.notes && (
                    <div style={{ marginBottom: '10px' }}>
                      <strong style={{ color: '#475569' }}>Transaction Notes:</strong><br/>
                      {selectedInvoice.notes}
                    </div>
                  )}
                  <div>
                    <strong>Payment QR Verification</strong><br/>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                      {/* Generates a pseudo QR code using styled matrix blocks */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 3px)', gap: '1px', padding: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}>
                        {Array.from({ length: 144 }).map((_, i) => (
                          <div key={i} style={{ width: '3px', height: '3px', backgroundColor: (i % 3 === 0 || i % 7 === 0 || (i > 10 && i < 20) || i > 120) ? '#000000' : 'transparent' }} />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.62rem', color: '#94a3b8', lineHeight: 1.3 }}>Scan to verify<br/>SST registered invoice</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem', textAlign: 'right', color: '#475569' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal:</span>
                    <span style={{ fontWeight: 600 }}>Rs. {selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e11d48' }}>
                      <span>Discount:</span>
                      <span>-Rs. {selectedInvoice.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Service Tax ({selectedInvoice.taxRate}%):</span>
                    <span style={{ fontWeight: 600 }}>Rs. {selectedInvoice.taxAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '6px', marginTop: '4px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                    <span>Grand Total:</span>
                    <span>Rs. {selectedInvoice.grandTotal.toFixed(2)}</span>
                  </div>
                  
                  {/* Internal Admin Profit details */}
                  <div style={{ marginTop: '10px', backgroundColor: '#f0fdf4', padding: '6px 10px', borderRadius: '4px', border: '1px dashed #bbf7d0', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#166534' }}>
                    <span>Net Margin Profit:</span>
                    <strong>+Rs. {selectedInvoice.profit.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

      {/* Create Tax Invoice Modal */}
      <Modal
        isOpen={isOpenAddModal}
        onClose={() => setIsOpenAddModal(false)}
        title="Record Sales Tax Invoice"
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div className="form-group">
            <label className="form-label">Select Customer Account *</label>
            <select
              className="form-select"
              value={formCustomerId}
              onChange={e => setFormCustomerId(e.target.value)}
              required
            >
              <option value="">-- Choose Account --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Spare Part Items</label>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={handleAddItem}
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                disabled={availableParts.length === 0}
              >
                + Add Part
              </Button>
            </div>

            {formItems.length === 0 ? (
              <div style={{ padding: '2rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                No items selected. Click "+ Add Part" to add items to invoice.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {formItems.map((item, idx) => {
                  const part = allPartsRaw.find(p => p.id === item.partId);
                  const isStockDeficit = part && part.stockLevel < item.quantity;
                  
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <select
                        className="form-select"
                        style={{ flex: 2, fontSize: '0.8rem' }}
                        value={item.partId}
                        onChange={e => handleItemChange(idx, 'partId', e.target.value)}
                      >
                        {allPartsRaw.map(p => (
                          <option key={p.id} value={p.id} disabled={p.stockLevel <= 0}>
                            {p.name} (Stock: {p.stockLevel} units)
                          </option>
                        ))}
                      </select>
                      
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: '60px', fontSize: '0.8rem', borderColor: isStockDeficit ? 'var(--color-danger)' : 'var(--border-color)' }}
                        placeholder="Qty"
                        value={item.quantity}
                        min={1}
                        onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                      />

                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        style={{ width: '80px', fontSize: '0.8rem' }}
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={e => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />

                      <div style={{ display: 'flex', alignItems: 'center', width: '70px', gap: '2px' }}>
                        <input
                          type="number"
                          className="form-input"
                          style={{ width: '45px', fontSize: '0.8rem', padding: '4px' }}
                          placeholder="Disc"
                          value={item.discountPercent}
                          min={0}
                          max={100}
                          onChange={e => handleItemChange(idx, 'discountPercent', parseInt(e.target.value) || 0)}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>%</span>
                      </div>

                      <button 
                        type="button" 
                        onClick={() => handleRemoveItem(idx)}
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
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Invoice Discount</label>
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
                  style={{ width: '60px', fontSize: '0.8rem', padding: '4px' }}
                  value={formDiscountType}
                  onChange={e => setFormDiscountType(e.target.value as any)}
                >
                  <option value="PERCENTAGE">%</option>
                  <option value="FIXED">Rs.</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Service Tax Rate</label>
              <select
                className="form-select"
                style={{ fontSize: '0.8rem' }}
                value={formTaxRate}
                onChange={e => setFormTaxRate(parseInt(e.target.value) || 0)}
              >
                <option value={0}>0% Tax</option>
                <option value={5}>5% Tax</option>
                <option value={6}>6% SST (MY)</option>
                <option value={10}>10% Tax</option>
                <option value={15}>15% Tax</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Payment Type</label>
              <select
                className="form-select"
                style={{ fontSize: '0.8rem' }}
                value={formPaymentMethod}
                onChange={e => setFormPaymentMethod(e.target.value as any)}
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CARD">Debit/Credit Card</option>
                <option value="CREDIT_ACCOUNT">Credit Account</option>
                <option value="QR_PAY">QR Pay</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Invoice Memo / Notes</label>
            <input
              type="text"
              placeholder="e.g. Terms Net-30. Immediate cash release on receipt."
              className="form-input"
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
            />
          </div>

          {/* Form calculation totals overview */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-hover)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginTop: '4px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Net Grand Total: </span>
              <strong style={{ fontSize: '1.15rem', color: 'var(--text-primary)', display: 'block' }}>
                Rs. {formCalculations.grandTotal.toFixed(2)}
              </strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Projected Gross Margin: </span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--color-success)', display: 'block' }}>
                +Rs. {formCalculations.profit.toFixed(2)}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsOpenAddModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" disabled={formItems.length === 0}>Generate Receipt</Button>
          </div>

        </form>
      </Modal>

    </div>
  );
};

export default Invoices;
