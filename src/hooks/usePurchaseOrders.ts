import { useState, useEffect, useMemo } from 'react';
import type { PurchaseOrder, PurchaseOrderItem, Supplier, Part } from '../database/schema';
import { DB } from '../database/db';

export function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [parts, setParts] = useState<Part[]>([]);

  const refreshData = () => {
    setPurchaseOrders(DB.getPurchaseOrders());
    setSuppliers(DB.getSuppliers());
    setParts(DB.getParts());
  };

  useEffect(() => {
    refreshData();
    const handleStorage = () => refreshData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const getItemsForOrder = (orderId: string): (PurchaseOrderItem & { part?: Part })[] => {
    const items = DB.getPurchaseOrderItems().filter(item => item.orderId === orderId);
    return items.map(item => ({
      ...item,
      part: parts.find(p => p.id === item.partId)
    }));
  };

  const createOrder = (
    supplierId: string,
    items: { partId: string; quantity: number; unitCost: number }[]
  ) => {
    const newPO = DB.createPurchaseOrder(supplierId, items);
    refreshData();
    // Dispatch custom event to notify other hooks
    window.dispatchEvent(new Event('storage'));
    return newPO;
  };

  const updateOrderStatus = (id: string, status: any) => {
    DB.updatePurchaseOrderStatus(id, status);
    refreshData();
    // Dispatch custom event to notify other hooks
    window.dispatchEvent(new Event('storage'));
  };

  const addSupplier = (supData: Omit<Supplier, 'id'>) => {
    const newSup = DB.createSupplier(supData);
    refreshData();
    window.dispatchEvent(new Event('storage'));
    return newSup;
  };

  const deleteSupplier = (id: string) => {
    DB.deleteSupplier(id);
    refreshData();
    window.dispatchEvent(new Event('storage'));
  };

  const stats = useMemo(() => {
    const pendingOrdersCount = purchaseOrders.filter(po => po.status === 'SENT').length;
    const totalPurchasedAmount = purchaseOrders
      .filter(po => po.status === 'RECEIVED')
      .reduce((sum, po) => sum + po.totalAmount, 0);

    return {
      pendingOrdersCount,
      totalPurchasedAmount
    };
  }, [purchaseOrders]);

  return {
    purchaseOrders,
    suppliers,
    createOrder,
    updateOrderStatus,
    getItemsForOrder,
    addSupplier,
    deleteSupplier,
    stats,
    refreshData
  };
}
