import React, { useMemo } from 'react';
import { useInventory } from '../hooks/useInventory';
import { useSales } from '../hooks/useSales';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Chart } from '../components/Chart';

export const Analytics: React.FC = () => {
  const { allPartsRaw, categories } = useInventory();
  const { salesOrders, getItemsForSale } = useSales();

  // 1. Calculate Profit Margins
  const marginsData = useMemo(() => {
    let totalCostOfActiveStock = 0;
    let totalRetailValuation = 0;

    allPartsRaw.forEach(p => {
      totalCostOfActiveStock += p.stockLevel * p.costPrice;
      totalRetailValuation += p.stockLevel * p.salePrice;
    });

    const potentialProfit = totalRetailValuation - totalCostOfActiveStock;
    const averageMarginPct = totalRetailValuation > 0 
      ? (potentialProfit / totalRetailValuation) * 100 
      : 0;

    return {
      totalCostOfActiveStock,
      totalRetailValuation,
      potentialProfit,
      averageMarginPct
    };
  }, [allPartsRaw]);

  // 2. Category Share in Valuation
  const categoryChartData = useMemo(() => {
    const shareMap: Record<string, number> = {};
    categories.forEach(c => {
      shareMap[c.id] = 0;
    });

    allPartsRaw.forEach(p => {
      if (shareMap[p.categoryId] !== undefined) {
        shareMap[p.categoryId] += p.stockLevel * p.costPrice;
      }
    });

    return categories.map(c => ({
      label: c.name,
      value: shareMap[c.id]
    })).filter(item => item.value > 0);
  }, [allPartsRaw, categories]);

  // 3. Dead Stock (Parts that have zero sales logged)
  const deadStock = useMemo(() => {
    // Find all parts in Sales orders
    const soldPartIds = new Set<string>();
    salesOrders.forEach(so => {
      const items = getItemsForSale(so.id);
      items.forEach(item => soldPartIds.add(item.partId));
    });

    // Dead stock is active parts with stock > 0 but 0 sales
    return allPartsRaw
      .filter(p => p.stockLevel > 0 && !soldPartIds.has(p.id))
      .map(p => ({
        ...p,
        totalTiedCapital: p.stockLevel * p.costPrice
      }))
      .sort((a, b) => b.totalTiedCapital - a.totalTiedCapital);
  }, [allPartsRaw, salesOrders, getItemsForSale]);

  // 4. Sales Trends (Daily cumulative values)
  const dailySalesTrend = useMemo(() => {
    const salesByDate: Record<string, number> = {};
    
    salesOrders
      .filter(so => so.status === 'DELIVERED' || so.status === 'DISPATCHED')
      .forEach(so => {
        const date = so.saleDate;
        salesByDate[date] = (salesByDate[date] || 0) + so.totalAmount;
      });

    // Generate last 10 days
    const trend = [];
    for (let i = 9; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      trend.push({
        label,
        value: salesByDate[dateStr] || 0
      });
    }
    return trend;
  }, [salesOrders]);

  // COGS and Turnover rate simulation
  const financialKPIs = useMemo(() => {
    // COGS = sum of costPrice * qty sold
    let totalCOGS = 0;
    salesOrders
      .filter(so => so.status === 'DELIVERED' || so.status === 'DISPATCHED')
      .forEach(so => {
        const items = getItemsForSale(so.id);
        items.forEach(item => {
          if (item.part) {
            totalCOGS += item.quantity * item.part.costPrice;
          }
        });
      });

    const averageInventoryValue = marginsData.totalCostOfActiveStock || 500; // fallback to avoid division by zero
    // Turnover rate = COGS / Avg Inventory Value
    const turnoverRate = totalCOGS / averageInventoryValue;

    return {
      totalCOGS,
      turnoverRate
    };
  }, [salesOrders, getItemsForSale, marginsData]);


  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title */}
      <div>
        <h1 className="heading-display" style={{ fontSize: '1.625rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.25 }}>Financial Analytics</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Audit margins, cost of goods sold, turnover coefficients, and capital blocks.</p>
      </div>

      {/* KPI Stats Row */}
      <div className="dashboard-grid">
        <Card 
          title="Tied Stock Capital" 
          value={`Rs. ${marginsData.totalCostOfActiveStock.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          }
          meta="Net purchase cost value"
        />
        <Card 
          title="Retail Value Potential" 
          value={`Rs. ${marginsData.totalRetailValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          }
          meta="Net retail value projection"
        />
        <Card 
          title="Average Profit Margin" 
          value={`${marginsData.averageMarginPct.toFixed(1)}%`}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
            </svg>
          }
          glow
          meta={`Rs. ${marginsData.potentialProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} potential markup`}
        />
        <Card 
          title="Stock Turnover Coeff" 
          value={`${financialKPIs.turnoverRate.toFixed(2)}x`}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          }
          meta={`COGS: Rs. ${financialKPIs.totalCOGS.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        />
      </div>

      {/* Charts Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Sales trend chart */}
        <div className="card" style={{ minHeight: '340px' }}>
          <Chart 
            data={dailySalesTrend} 
            title="10-Day Sales Dispatch Velocity" 
            height={280}
            strokeColor="#3b82f6" /* Tech Blue */
          />
        </div>

        {/* Category Share Distribution */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <span className="card-title">Category Capital Share</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {categoryChartData.map((cat, i) => {
              const sharePct = marginsData.totalCostOfActiveStock > 0
                ? (cat.value / marginsData.totalCostOfActiveStock) * 100
                : 0;

              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{cat.label}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Rs. {cat.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({sharePct.toFixed(0)}%)</span>
                  </div>
                  
                  {/* Custom horizontal SVG/HTML Bar */}
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-hover)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${sharePct}%`, 
                        backgroundColor: i === 0 ? '#10b981' : i === 1 ? '#3b82f6' : i === 2 ? '#f59e0b' : '#a855f7',
                        borderRadius: '9999px',
                        transition: 'width 0.5s ease-out'
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Dead Stock Report Table */}
      <div className="card">
        <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="card-title">Capital Optimization: Dormant/Dead Stock Report</span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', textTransform: 'none', letterSpacing: 'none' }}>
              Parts holding quantity but generating zero registered transactions. Review to free tied capital.
            </div>
          </div>
          <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>
            Rs. {deadStock.reduce((s, p) => s + p.totalTiedCapital, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} Tied Capital
          </span>
        </div>

        <Table
          columns={[
            {
              header: 'Part Spec / SKU',
              render: (row) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{row.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SKU: <code>{row.sku}</code></div>
                </div>
              )
            },
            {
              header: 'Storage Location',
              accessor: 'binLocation',
              render: (row) => <span style={{ fontFamily: 'monospace' }}>{row.binLocation || 'N/A'}</span>
            },
            {
              header: 'Units Dormant',
              render: (row) => <span>{row.stockLevel} units</span>
            },
            {
              header: 'Cost per Unit',
              render: (row) => <span>Rs. {row.costPrice.toFixed(2)}</span>
            },
            {
              header: 'Tied Capital',
              render: (row) => <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>Rs. {row.totalTiedCapital.toFixed(2)}</span>
            }
          ]}
          data={deadStock}
          keyExtractor={(row) => row.id}
          emptyMessage="No dead stock detected. Excellent turnover."
        />
      </div>

    </div>
  );
};
export default Analytics;
