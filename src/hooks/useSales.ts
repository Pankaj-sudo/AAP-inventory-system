import { useState, useEffect, useMemo } from 'react';
import type { SalesOrder, SalesOrderItem, Part } from '../database/schema';
import { DB } from '../database/db';

export function useSales() {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [parts, setParts] = useState<Part[]>([]);

  const refreshData = () => {
    setSalesOrders(DB.getSalesOrders());
    setParts(DB.getParts());
  };

  useEffect(() => {
    refreshData();
    const handleStorage = () => refreshData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const getItemsForSale = (orderId: string): (SalesOrderItem & { part?: Part })[] => {
    const items = DB.getSalesOrderItems().filter(item => item.salesOrderId === orderId);
    return items.map(item => ({
      ...item,
      part: parts.find(p => p.id === item.partId)
    }));
  };

  const createSalesOrder = (
    customerName: string,
    items: { partId: string; quantity: number; unitPrice: number }[],
    extra?: { customerId?: string; discount?: number; discountType?: 'PERCENTAGE' | 'FIXED'; taxRate?: number; paymentMethod?: string; notes?: string }
  ): SalesOrder | null => {
    const result = DB.createSalesOrder(customerName, items, extra);
    if (result) {
      // Auto-generate invoice
      const customer = DB.getCustomers().find(c => c.id === extra?.customerId);
      const calculatedItems = items.map(item => {
        const part = parts.find(p => p.id === item.partId);
        const costPrice = part ? part.costPrice : 0;
        const sub = item.quantity * item.unitPrice;
        return {
          partId: item.partId,
          partName: part ? part.name : 'Unknown Part',
          sku: part ? part.sku : '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costPrice,
          discount: 0,
          lineTotal: sub,
          lineProfit: sub - (item.quantity * costPrice)
        };
      });

      const subtotal = calculatedItems.reduce((s, i) => s + i.lineTotal, 0);
      const discountAmount = extra?.discount && extra.discount > 0
        ? (extra.discountType === 'PERCENTAGE' ? subtotal * (extra.discount / 100) : extra.discount)
        : 0;
      const taxAmount = extra?.taxRate ? (subtotal - discountAmount) * (extra.taxRate / 100) : 0;
      const grandTotal = subtotal - discountAmount + taxAmount;
      const totalCost = calculatedItems.reduce((s, i) => s + (i.quantity * i.costPrice), 0);

      const invoice = DB.createInvoice({
        salesOrderId: result.id,
        customerId: extra?.customerId || 'counter',
        customerName: customerName,
        customerEmail: customer?.email || 'walkin@apexmoto.com',
        customerPhone: customer?.phone || 'N/A',
        customerAddress: customer?.address || 'Counter Walk-in',
        items: calculatedItems,
        subtotal,
        discountType: extra?.discountType || 'PERCENTAGE',
        discountValue: extra?.discount || 0,
        discountAmount,
        taxRate: extra?.taxRate || 0,
        taxAmount,
        grandTotal,
        profit: grandTotal - totalCost,
        paymentMethod: (extra?.paymentMethod as any) || 'CASH',
        notes: extra?.notes || '',
        status: 'PAID'
      });

      // Update SalesOrder with invoiceId
      const soList = DB.getSalesOrders();
      const soIdx = soList.findIndex(so => so.id === result.id);
      if (soIdx !== -1) {
        soList[soIdx].invoiceId = invoice.id;
        DB.saveSalesOrders(soList);
      }

      refreshData();
      window.dispatchEvent(new Event('storage'));
    }
    return result;
  };

  const updateSalesStatus = (id: string, status: any) => {
    DB.updateSalesOrderStatus(id, status);
    refreshData();
    window.dispatchEvent(new Event('storage'));
  };

  const stats = useMemo(() => {
    const activeOrdersCount = salesOrders.filter(so => so.status === 'PENDING' || so.status === 'DISPATCHED').length;
    const totalSalesRevenue = salesOrders
      .filter(so => so.status === 'DELIVERED' || so.status === 'DISPATCHED')
      .reduce((sum, so) => sum + so.totalAmount, 0);

    return {
      activeOrdersCount,
      totalSalesRevenue
    };
  }, [salesOrders]);

  return {
    salesOrders,
    createSalesOrder,
    updateSalesStatus,
    getItemsForSale,
    stats,
    refreshData
  };
}
