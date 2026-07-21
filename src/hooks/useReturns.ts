import { useState, useEffect } from 'react';
import type { Return, DamagedStock, StockAdjustment, Part } from '../database/schema';
import { DB } from '../database/db';

export function useReturns() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [damagedStock, setDamagedStock] = useState<DamagedStock[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [parts, setParts] = useState<Part[]>([]);

  const refreshData = () => {
    setReturns(DB.getReturns());
    setDamagedStock(DB.getDamagedStock());
    setAdjustments(DB.getStockAdjustments());
    setParts(DB.getParts());
  };

  useEffect(() => {
    refreshData();
    const handleStorage = () => refreshData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const createReturn = (returnData: Omit<Return, 'id' | 'returnNumber' | 'createdAt'>) => {
    const newRet = DB.createReturn(returnData);
    refreshData();
    window.dispatchEvent(new Event('storage'));
    return newRet;
  };

  const updateReturnStatus = (id: string, status: Return['status']) => {
    DB.updateReturnStatus(id, status);
    refreshData();
    window.dispatchEvent(new Event('storage'));
  };

  const reportDamage = (damageData: Omit<DamagedStock, 'id' | 'reportNumber' | 'timestamp'>) => {
    const newDmg = DB.reportDamage(damageData);
    refreshData();
    window.dispatchEvent(new Event('storage'));
    return newDmg;
  };

  const resolveDamage = (id: string) => {
    DB.resolveDamage(id);
    refreshData();
    window.dispatchEvent(new Event('storage'));
  };

  const createAdjustment = (adjustmentData: Omit<StockAdjustment, 'id' | 'adjustmentNumber' | 'timestamp'>) => {
    const newAdj = DB.createStockAdjustment(adjustmentData);
    refreshData();
    window.dispatchEvent(new Event('storage'));
    return newAdj;
  };

  return {
    returns,
    damagedStock,
    adjustments,
    parts,
    createReturn,
    updateReturnStatus,
    reportDamage,
    resolveDamage,
    createAdjustment,
    refreshData
  };
}
