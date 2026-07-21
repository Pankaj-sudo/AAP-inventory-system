import { useState, useEffect } from 'react';
import type { Customer, SalesOrder } from '../database/schema';

import { DB } from '../database/db';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);

  const refreshData = () => {
    setCustomers(DB.getCustomers());
    setSalesOrders(DB.getSalesOrders());
  };

  useEffect(() => {
    refreshData();
    const handleStorage = () => refreshData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const createCustomer = (custData: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCust = DB.createCustomer(custData);
    refreshData();
    window.dispatchEvent(new Event('storage'));
    return newCust;
  };

  const updateCustomer = (cust: Customer) => {
    DB.updateCustomer(cust);
    refreshData();
    window.dispatchEvent(new Event('storage'));
  };

  const deleteCustomer = (id: string) => {
    DB.deleteCustomer(id);
    refreshData();
    window.dispatchEvent(new Event('storage'));
  };

  const getCustomerStats = (customerId: string) => {
    const customerOrders = salesOrders.filter(so => so.customerId === customerId || so.customerName === customers.find(c => c.id === customerId)?.name);
    const orderCount = customerOrders.length;
    const totalSpent = customerOrders.reduce((sum, so) => sum + so.totalAmount, 0);
    const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
    const lastPurchaseDate = customerOrders.length > 0 
      ? [...customerOrders].sort((a, b) => b.saleDate.localeCompare(a.saleDate))[0].saleDate 
      : 'No purchases';

    return {
      orderCount,
      totalSpent,
      avgOrderValue,
      lastPurchaseDate,
      orders: customerOrders
    };
  };

  return {
    customers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerStats,
    refreshData
  };
}
