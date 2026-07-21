import React, { useState, useMemo } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { 
  Users, Mail, Phone, MapPin, Briefcase, Search, Edit, Trash2, 
  UserPlus, UserCheck, Award, Eye
} from 'lucide-react';
import type { Customer } from '../database/schema';

export const Customers: React.FC = () => {
  const {
    customers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerStats
  } = useCustomers();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals / Drawer State
  const [isOpenAddEditModal, setIsOpenAddEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Form State
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    type: 'RETAIL' as Customer['type'],
    notes: ''
  });

  // KPI Summary
  const statsSummary = useMemo(() => {
    const total = customers.length;
    const retail = customers.filter(c => c.type === 'RETAIL').length;
    const wholesale = customers.filter(c => c.type === 'WHOLESALE').length;
    const trade = customers.filter(c => c.type === 'TRADE').length;
    return { total, retail, wholesale, trade };
  }, [customers]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.phone.includes(searchTerm);
      const matchesType = typeFilter === 'ALL' || c.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [customers, searchTerm, typeFilter]);

  // Open modal for Adding Customer
  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setCustomerForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      type: 'RETAIL',
      notes: ''
    });
    setIsOpenAddEditModal(true);
  };

  // Open modal for Editing Customer
  const handleOpenEdit = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation(); // Prevent opening detail row
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      type: customer.type,
      notes: customer.notes
    });
    setIsOpenAddEditModal(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this customer account?')) {
      deleteCustomer(id);
      if (selectedCustomerId === id) setSelectedCustomerId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name || !customerForm.email) {
      alert('Name and Email are required.');
      return;
    }

    if (editingCustomer) {
      updateCustomer({
        ...editingCustomer,
        ...customerForm
      });
    } else {
      createCustomer(customerForm);
    }
    setIsOpenAddEditModal(false);
  };

  const selectedCustomerDetail = useMemo(() => {
    if (!selectedCustomerId) return null;
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return null;
    const stats = getCustomerStats(selectedCustomerId);
    return { customer, stats };
  }, [selectedCustomerId, customers, getCustomerStats]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="heading-display" style={{ fontSize: '1.625rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.25 }}>
            Customers
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Manage client profiles, trade account discounts, and purchase history.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAdd}>
          <UserPlus size={16} style={{ marginRight: '6px' }} /> Add Customer Profile
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="dashboard-kpi-grid">
        <div className="kpi-card kpi-glow-blue" style={{ '--accent-from': '#3b82f6', '--accent-to': '#8b5cf6' } as any}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Total Active Accounts</span>
            <div className="kpi-card-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{statsSummary.total}</div>
          <div className="kpi-card-footer">
            <span className="kpi-card-meta">Registered partners &amp; walk-ins</span>
          </div>
        </div>

        <div className="kpi-card kpi-glow-green" style={{ '--accent-from': '#10b981', '--accent-to': '#34d399' } as any}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Trade Workshops</span>
            <div className="kpi-card-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Briefcase size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{statsSummary.trade}</div>
          <div className="kpi-card-footer">
            <span className="kpi-card-meta">Eligible for Trade discount</span>
          </div>
        </div>

        <div className="kpi-card kpi-glow-amber" style={{ '--accent-from': '#f59e0b', '--accent-to': '#f59e0b' } as any}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Wholesale Accounts</span>
            <div className="kpi-card-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Award size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{statsSummary.wholesale}</div>
          <div className="kpi-card-footer">
            <span className="kpi-card-meta">Bulk spare parts distributors</span>
          </div>
        </div>

        <div className="kpi-card kpi-glow-blue" style={{ '--accent-from': '#06b6d4', '--accent-to': '#06b6d4' } as any}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Retail Buyers</span>
            <div className="kpi-card-icon" style={{ backgroundColor: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4' }}>
              <UserCheck size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{statsSummary.retail}</div>
          <div className="kpi-card-footer">
            <span className="kpi-card-meta">Regular counter sales customers</span>
          </div>
        </div>
      </div>

      {/* Main Filter & List Section */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedCustomerId ? '1.7fr 1.3fr' : '1fr', gap: '1.25rem', alignItems: 'start', transition: 'all 0.3s' }}>
        
        {/* Table List Card */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search by name, email, or phone number..."
                className="form-input"
                style={{ paddingLeft: '36px' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="form-select"
              style={{ width: '160px' }}
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="RETAIL">Retail</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="TRADE">Trade</option>
            </select>
          </div>

          <Table
            columns={[
              {
                header: 'Customer Details',
                render: (row) => (
                  <div style={{ cursor: 'pointer' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Mail size={12} /> {row.email}
                    </div>
                  </div>
                )
              },
              {
                header: 'Phone / Location',
                render: (row) => (
                  <div style={{ fontSize: '0.8rem' }}>
                    <div style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={12} /> {row.phone || 'N/A'}
                    </div>
                    {row.address && (
                      <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                        <MapPin size={11} /> {row.address}
                      </div>
                    )}
                  </div>
                )
              },
              {
                header: 'Account Type',
                render: (row) => {
                  let bClass = 'badge-secondary';
                  if (row.type === 'WHOLESALE') bClass = 'badge-warning';
                  if (row.type === 'TRADE') bClass = 'badge-success';
                  return <span className={`badge ${bClass}`}>{row.type}</span>;
                }
              },
              {
                header: 'Actions',
                render: (row) => (
                  <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" style={{ padding: '4px' }} onClick={() => setSelectedCustomerId(row.id === selectedCustomerId ? null : row.id)}>
                      <Eye size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" style={{ padding: '4px' }} onClick={(e) => handleOpenEdit(e, row)}>
                      <Edit size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" style={{ padding: '4px', color: 'var(--color-danger)' }} onClick={(e) => handleDelete(e, row.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                )
              }
            ]}
            data={filteredCustomers}
            keyExtractor={row => row.id}
            emptyMessage="No customer records matched your query."
          />
        </div>

        {/* Customer Detail Sidebar */}
        {selectedCustomerDetail && (
          <div className="panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'sticky', top: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Customer Profile</span>
              <button 
                onClick={() => setSelectedCustomerId(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>

            {/* Profile Overview */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand)', fontWeight: 800, fontSize: '1.25rem' }}>
                {selectedCustomerDetail.customer.name.charAt(0)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{selectedCustomerDetail.customer.name}</div>
                <span className={`badge ${selectedCustomerDetail.customer.type === 'WHOLESALE' ? 'badge-warning' : selectedCustomerDetail.customer.type === 'TRADE' ? 'badge-success' : 'badge-secondary'}`} style={{ marginTop: '4px' }}>
                  {selectedCustomerDetail.customer.type} Account
                </span>
              </div>
            </div>

            {/* Contact Specs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', backgroundColor: 'var(--bg-hover)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', gap: '8px', color: 'var(--text-secondary)' }}>
                <Mail size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ wordBreak: 'break-all' }}>{selectedCustomerDetail.customer.email}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', color: 'var(--text-secondary)' }}>
                <Phone size={14} style={{ flexShrink: 0 }} />
                <span>{selectedCustomerDetail.customer.phone || 'No phone recorded'}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', color: 'var(--text-secondary)' }}>
                <MapPin size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{selectedCustomerDetail.customer.address || 'No shipping address'}</span>
              </div>
              {selectedCustomerDetail.customer.notes && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                  <strong>Notes:</strong> {selectedCustomerDetail.customer.notes}
                </div>
              )}
            </div>

            {/* KPI Spend Statistics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ backgroundColor: 'var(--bg-hover)', padding: '10px', borderRadius: 'var(--radius-xs)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>Total Spent</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  ${selectedCustomerDetail.stats.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              
              <div style={{ backgroundColor: 'var(--bg-hover)', padding: '10px', borderRadius: 'var(--radius-xs)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>Invoices</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {selectedCustomerDetail.stats.orderCount}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-hover)', padding: '10px', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Average Value:</span>
              <strong style={{ color: 'var(--text-primary)' }}>${selectedCustomerDetail.stats.avgOrderValue.toFixed(2)}</strong>
            </div>

            <div style={{ backgroundColor: 'var(--bg-hover)', padding: '10px', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Last Sale Date:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{selectedCustomerDetail.stats.lastPurchaseDate}</strong>
            </div>

            {/* Invoices Feed */}
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>Recent Sales Ledger</span>
              {selectedCustomerDetail.stats.orders.length === 0 ? (
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', padding: '12px 0', textAlign: 'center' }}>No sales logged under this customer.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {selectedCustomerDetail.stats.orders.map((o) => (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: 'var(--bg-hover)', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.id}</span>
                        <span style={{ color: 'var(--text-tertiary)', marginLeft: '6px' }}>{o.saleDate}</span>
                      </div>
                      <strong style={{ color: 'var(--text-primary)' }}>${o.totalAmount.toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>

      {/* Add / Edit Customer Dialog Modal */}
      <Modal
        isOpen={isOpenAddEditModal}
        onClose={() => setIsOpenAddEditModal(false)}
        title={editingCustomer ? 'Edit Customer Profile' : 'Register Customer Profile'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Full Name / Corporate Entity *</label>
            <input
              type="text"
              placeholder="e.g. SpeedKings Workshop Ltd"
              className="form-input"
              value={customerForm.name}
              onChange={e => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              placeholder="e.g. invoice@speedkings.my"
              className="form-input"
              value={customerForm.email}
              onChange={e => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              placeholder="e.g. +60-3-XXXX-XXXX"
              className="form-input"
              value={customerForm.phone}
              onChange={e => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Corporate Account Type *</label>
            <select
              className="form-select"
              value={customerForm.type}
              onChange={e => setCustomerForm(prev => ({ ...prev, type: e.target.value as Customer['type'] }))}
              required
            >
              <option value="RETAIL">Retail Counter Walk-in</option>
              <option value="TRADE">Trade Account (Workshop Partner)</option>
              <option value="WHOLESALE">Wholesale Distributor</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Shipping / Billing Address</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Full mailing or drop-off address"
              value={customerForm.address}
              onChange={e => setCustomerForm(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Internal Relationship Notes</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="e.g. Net-30 credit terms. Preferred 15% trade discount on engine parts."
              value={customerForm.notes}
              onChange={e => setCustomerForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsOpenAddEditModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">
              {editingCustomer ? 'Update Profile' : 'Register Profile'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Customers;
