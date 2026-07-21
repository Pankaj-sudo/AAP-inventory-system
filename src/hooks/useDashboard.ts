import { useState, useEffect, useMemo } from 'react';
import { DB } from '../database/db';

export function useDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [parts, setParts] = useState(DB.getParts());
  const [categories, setCategories] = useState(DB.getCategories());
  const [suppliers, setSuppliers] = useState(DB.getSuppliers());
  const [salesOrders, setSalesOrders] = useState(DB.getSalesOrders());
  const [salesItems, setSalesItems] = useState(DB.getSalesOrderItems());
  const [purchaseOrders, setPurchaseOrders] = useState(DB.getPurchaseOrders());

  useEffect(() => {
    // Simulate load shimmer for premium feel
    const timer = setTimeout(() => setIsLoading(false), 600);
    const handleStorage = () => {
      setParts(DB.getParts());
      setCategories(DB.getCategories());
      setSuppliers(DB.getSuppliers());
      setSalesOrders(DB.getSalesOrders());
      setSalesItems(DB.getSalesOrderItems());
      setPurchaseOrders(DB.getPurchaseOrders());
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // ─── Inventory KPIs ──────────────────────────────────────────────────────
  const inventoryKPIs = useMemo(() => {
    let totalStockValue = 0;
    let totalCurrentStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    parts.forEach(p => {
      totalStockValue += p.stockLevel * p.costPrice;
      totalCurrentStock += p.stockLevel;
      if (p.stockLevel === 0) outOfStockCount++;
      else if (p.stockLevel <= p.reorderPoint) lowStockCount++;
    });

    return { totalProducts: parts.length, totalStockValue, totalCurrentStock, lowStockCount, outOfStockCount };
  }, [parts]);

  // ─── Revenue KPIs ────────────────────────────────────────────────────────
  const revenueKPIs = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisYear = String(now.getFullYear());

    let dailyRevenue = 0;
    let monthlyRevenue = 0;
    let annualRevenue = 0;
    let totalSales = 0;

    const delivered = salesOrders.filter(so => so.status === 'DELIVERED' || so.status === 'DISPATCHED');
    delivered.forEach(so => {
      totalSales += so.totalAmount;
      if (so.saleDate === todayStr) dailyRevenue += so.totalAmount;
      if (so.saleDate.startsWith(thisMonth)) monthlyRevenue += so.totalAmount;
      if (so.saleDate.startsWith(thisYear)) annualRevenue += so.totalAmount;
    });

    return { dailyRevenue, monthlyRevenue, annualRevenue, totalSales };
  }, [salesOrders]);

  // ─── Profit KPIs ─────────────────────────────────────────────────────────
  const profitKPIs = useMemo(() => {
    let grossProfit = 0;
    let totalCOGS = 0;
    let totalPurchases = 0;

    // Gross profit from delivered sales: (salePrice - costPrice) * qty
    const delivered = salesOrders.filter(so => so.status === 'DELIVERED' || so.status === 'DISPATCHED');
    const deliveredIds = new Set(delivered.map(so => so.id));

    salesItems.forEach(item => {
      if (!deliveredIds.has(item.salesOrderId)) return;
      const part = parts.find(p => p.id === item.partId);
      if (!part) return;
      const revenue = item.quantity * item.unitPrice;
      const cogs = item.quantity * part.costPrice;
      grossProfit += revenue - cogs;
      totalCOGS += cogs;
    });

    // Total purchases (received POs)
    purchaseOrders
      .filter(po => po.status === 'RECEIVED')
      .forEach(po => { totalPurchases += po.totalAmount; });

    const netProfit = grossProfit - (totalPurchases * 0.15); // 15% operating costs approx
    const grossMarginPct = revenueKPIs.totalSales > 0 ? (grossProfit / revenueKPIs.totalSales) * 100 : 0;

    return { grossProfit, netProfit, totalPurchases, grossMarginPct, totalCOGS };
  }, [salesOrders, salesItems, parts, purchaseOrders, revenueKPIs.totalSales]);

  // ─── Monthly Sales Trend (12 months) ─────────────────────────────────────
  const monthlySalesTrend = useMemo(() => {
    const monthMap: Record<string, number> = {};
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = 0;
    }

    salesOrders
      .filter(so => so.status === 'DELIVERED' || so.status === 'DISPATCHED')
      .forEach(so => {
        const month = so.saleDate.substring(0, 7);
        if (month in monthMap) monthMap[month] += so.totalAmount;
      });

    return Object.entries(monthMap).map(([key, value]) => {
      const [year, month] = key.split('-');
      const label = new Date(parseInt(year), parseInt(month) - 1, 1)
        .toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
      return { label, value };
    });
  }, [salesOrders]);

  // ─── Daily Sales Trend (last 30 days) ────────────────────────────────────
  const dailySalesTrend = useMemo(() => {
    const dayMap: Record<string, number> = {};
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dayMap[d.toISOString().split('T')[0]] = 0;
    }

    salesOrders
      .filter(so => so.status === 'DELIVERED' || so.status === 'DISPATCHED')
      .forEach(so => {
        if (so.saleDate in dayMap) dayMap[so.saleDate] += so.totalAmount;
      });

    const entries = Object.entries(dayMap);
    return entries.map(([dateStr, value], i) => {
      const d = new Date(dateStr);
      // Show label for start of each week
      const label = (i % 7 === 0 || i === 0 || i === entries.length - 1)
        ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : '';
      return { label: label || d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), value };
    });
  }, [salesOrders]);

  // ─── Monthly Profit Trend ─────────────────────────────────────────────────
  const monthlyProfitTrend = useMemo(() => {
    const monthMap: Record<string, { revenue: number; cogs: number }> = {};
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = { revenue: 0, cogs: 0 };
    }

    const deliveredIds = new Set(
      salesOrders.filter(so => so.status === 'DELIVERED' || so.status === 'DISPATCHED').map(so => so.id)
    );
    const orderMonthMap: Record<string, string> = {};
    salesOrders.forEach(so => { orderMonthMap[so.id] = so.saleDate.substring(0, 7); });

    salesItems.forEach(item => {
      if (!deliveredIds.has(item.salesOrderId)) return;
      const month = orderMonthMap[item.salesOrderId];
      if (!month || !(month in monthMap)) return;
      const part = parts.find(p => p.id === item.partId);
      if (!part) return;
      monthMap[month].revenue += item.quantity * item.unitPrice;
      monthMap[month].cogs += item.quantity * part.costPrice;
    });

    return Object.entries(monthMap).map(([key, v]) => {
      const [year, month] = key.split('-');
      const label = new Date(parseInt(year), parseInt(month) - 1, 1)
        .toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
      return { label, value: v.revenue - v.cogs };
    });
  }, [salesOrders, salesItems, parts]);

  // ─── Purchase vs Sales by Month ───────────────────────────────────────────
  const purchaseVsSales = useMemo(() => {
    const monthMap: Record<string, { sales: number; purchases: number }> = {};
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = { sales: 0, purchases: 0 };
    }

    salesOrders
      .filter(so => so.status === 'DELIVERED' || so.status === 'DISPATCHED')
      .forEach(so => {
        const m = so.saleDate.substring(0, 7);
        if (m in monthMap) monthMap[m].sales += so.totalAmount;
      });

    purchaseOrders
      .filter(po => po.status === 'RECEIVED')
      .forEach(po => {
        const m = po.orderDate.substring(0, 7);
        if (m in monthMap) monthMap[m].purchases += po.totalAmount;
      });

    return Object.entries(monthMap).map(([key, v]) => {
      const [year, month] = key.split('-');
      const label = new Date(parseInt(year), parseInt(month) - 1, 1)
        .toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
      return { label, sales: v.sales, purchases: v.purchases };
    });
  }, [salesOrders, purchaseOrders]);

  // ─── Brand Distribution ───────────────────────────────────────────────────
  const brandDistribution = useMemo(() => {
    const map: Record<string, { count: number; value: number }> = {};
    parts.forEach(p => {
      if (!map[p.brand]) map[p.brand] = { count: 0, value: 0 };
      map[p.brand].count++;
      map[p.brand].value += p.stockLevel * p.costPrice;
    });

    const total = Object.values(map).reduce((s, v) => s + v.count, 0);
    return Object.entries(map)
      .map(([brand, v]) => ({ label: brand, value: v.count, stockValue: v.value, pct: Math.round((v.count / total) * 100) }))
      .sort((a, b) => b.value - a.value);
  }, [parts]);

  // ─── Category Distribution ────────────────────────────────────────────────
  const categoryDistribution = useMemo(() => {
    const map: Record<string, { count: number; value: number }> = {};
    parts.forEach(p => {
      const catName = categories.find(c => c.id === p.categoryId)?.name || 'Other';
      if (!map[catName]) map[catName] = { count: 0, value: 0 };
      map[catName].count++;
      map[catName].value += p.stockLevel * p.costPrice;
    });

    const total = Object.values(map).reduce((s, v) => s + v.count, 0);
    return Object.entries(map)
      .map(([cat, v]) => ({ label: cat, value: v.count, stockValue: v.value, pct: Math.round((v.count / total) * 100) }))
      .sort((a, b) => b.value - a.value);
  }, [parts, categories]);

  // ─── Inventory Value by Category ─────────────────────────────────────────
  const inventoryValueByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    parts.forEach(p => {
      const catName = categories.find(c => c.id === p.categoryId)?.name || 'Other';
      map[catName] = (map[catName] || 0) + p.stockLevel * p.costPrice;
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [parts, categories]);

  // ─── Top Selling Parts ────────────────────────────────────────────────────
  const topSellingParts = useMemo(() => {
    const map: Record<string, { qty: number; revenue: number }> = {};
    const deliveredIds = new Set(
      salesOrders.filter(so => so.status === 'DELIVERED' || so.status === 'DISPATCHED').map(so => so.id)
    );

    salesItems.forEach(item => {
      if (!deliveredIds.has(item.salesOrderId)) return;
      if (!map[item.partId]) map[item.partId] = { qty: 0, revenue: 0 };
      map[item.partId].qty += item.quantity;
      map[item.partId].revenue += item.quantity * item.unitPrice;
    });

    return Object.entries(map)
      .map(([partId, v]) => {
        const part = parts.find(p => p.id === partId);
        return { partId, name: part?.name || 'Unknown', sku: part?.sku || '', ...v };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [salesOrders, salesItems, parts]);

  // ─── Slow Moving Parts (low sales velocity) ───────────────────────────────
  const slowMovingParts = useMemo(() => {
    const soldPartIds = new Set(salesItems.map(i => i.partId));
    return parts
      .filter(p => !soldPartIds.has(p.id) || p.stockLevel > p.maxStock * 0.8)
      .slice(0, 5)
      .map(p => ({
        partId: p.id, name: p.name, sku: p.sku,
        stockLevel: p.stockLevel, value: p.stockLevel * p.costPrice
      }));
  }, [parts, salesItems]);

  // ─── Top Customers ────────────────────────────────────────────────────────
  const topCustomers = useMemo(() => {
    const map: Record<string, { orders: number; total: number }> = {};
    salesOrders
      .filter(so => so.status === 'DELIVERED' || so.status === 'DISPATCHED')
      .forEach(so => {
        if (!map[so.customerName]) map[so.customerName] = { orders: 0, total: 0 };
        map[so.customerName].orders++;
        map[so.customerName].total += so.totalAmount;
      });

    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [salesOrders]);

  // ─── Top Suppliers ────────────────────────────────────────────────────────
  const topSuppliers = useMemo(() => {
    const map: Record<string, { orders: number; total: number; name: string }> = {};
    purchaseOrders
      .filter(po => po.status === 'RECEIVED')
      .forEach(po => {
        const supName = suppliers.find(s => s.id === po.supplierId)?.name || po.supplierId;
        if (!map[po.supplierId]) map[po.supplierId] = { orders: 0, total: 0, name: supName };
        map[po.supplierId].orders++;
        map[po.supplierId].total += po.totalAmount;
      });

    return Object.entries(map)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [purchaseOrders, suppliers]);

  // ─── Recent Sales & Purchases ─────────────────────────────────────────────
  const recentSales = useMemo(() => {
    return [...salesOrders]
      .sort((a, b) => b.saleDate.localeCompare(a.saleDate))
      .slice(0, 8);
  }, [salesOrders]);

  const recentPurchases = useMemo(() => {
    return [...purchaseOrders]
      .sort((a, b) => b.orderDate.localeCompare(a.orderDate))
      .slice(0, 8)
      .map(po => ({
        ...po,
        supplierName: suppliers.find(s => s.id === po.supplierId)?.name || 'Unknown Supplier'
      }));
  }, [purchaseOrders, suppliers]);

  // ─── Best Selling Categories ──────────────────────────────────────────────
  const bestSellingCategories = useMemo(() => {
    const map: Record<string, { revenue: number; qty: number }> = {};
    const deliveredIds = new Set(
      salesOrders.filter(so => so.status === 'DELIVERED' || so.status === 'DISPATCHED').map(so => so.id)
    );

    salesItems.forEach(item => {
      if (!deliveredIds.has(item.salesOrderId)) return;
      const part = parts.find(p => p.id === item.partId);
      if (!part) return;
      const catName = categories.find(c => c.id === part.categoryId)?.name || 'Other';
      if (!map[catName]) map[catName] = { revenue: 0, qty: 0 };
      map[catName].revenue += item.quantity * item.unitPrice;
      map[catName].qty += item.quantity;
    });

    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [salesOrders, salesItems, parts, categories]);

  // ─── Low Stock Alerts ─────────────────────────────────────────────────────
  const lowStockAlerts = useMemo(() => {
    return parts
      .filter(p => p.stockLevel <= p.reorderPoint)
      .sort((a, b) => a.stockLevel - b.stockLevel)
      .slice(0, 6);
  }, [parts]);

  return {
    isLoading,
    // KPIs
    inventoryKPIs,
    revenueKPIs,
    profitKPIs,
    // Chart data
    monthlySalesTrend,
    dailySalesTrend,
    monthlyProfitTrend,
    purchaseVsSales,
    brandDistribution,
    categoryDistribution,
    inventoryValueByCategory,
    // Rankings
    topSellingParts,
    slowMovingParts,
    topCustomers,
    topSuppliers,
    bestSellingCategories,
    // Feeds
    recentSales,
    recentPurchases,
    lowStockAlerts,
    // Raw data
    parts,
    categories,
    suppliers
  };
}
