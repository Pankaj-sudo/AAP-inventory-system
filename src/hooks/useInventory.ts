import { useState, useEffect, useMemo } from 'react';
import type { Part, Category, Supplier, VehicleModel, StockMovement, ProductHistoryLog } from '../database/schema';
import { DB } from '../database/db';

export interface InventoryFilters {
  query: string;
  categoryId: string;
  vehicleId: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  stockStatus: 'all' | 'instock' | 'lowstock' | 'outofstock';
  sortBy: 'name' | 'sku' | 'stockLevel' | 'salePrice';
  sortOrder: 'asc' | 'desc';
}

export function useInventory() {
  const [parts, setParts] = useState<Part[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [vehicles, setVehicles] = useState<VehicleModel[]>([]);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [filters, setFilters] = useState<InventoryFilters>({
    query: '',
    categoryId: '',
    vehicleId: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    stockStatus: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const refreshData = () => {
    setParts(DB.getParts());
    setCategories(DB.getCategories());
    setSuppliers(DB.getSuppliers());
    setVehicles(DB.getVehicles());
  };

  useEffect(() => {
    refreshData();
    const handleStorage = () => refreshData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Reset page to 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [
    filters.query,
    filters.categoryId,
    filters.vehicleId,
    filters.brand,
    filters.minPrice,
    filters.maxPrice,
    filters.stockStatus
  ]);

  // 1. Process all filter rules and sort orders on the raw array
  const allFilteredPartsRaw = useMemo(() => {
    let result = [...parts];

    // Search query matches SKU, name, OEM, description, barcode
    if (filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter(
        p => p.name.toLowerCase().includes(q) ||
             p.sku.toLowerCase().includes(q) ||
             p.oemNumber.toLowerCase().includes(q) ||
             p.barcode.toLowerCase().includes(q) ||
             p.description.toLowerCase().includes(q)
      );
    }

    // Category Filter
    if (filters.categoryId) {
      result = result.filter(p => p.categoryId === filters.categoryId);
    }

    // Brand Filter
    if (filters.brand) {
      result = result.filter(p => p.brand.toLowerCase() === filters.brand.toLowerCase());
    }

    // Vehicle Compatibility Filter
    if (filters.vehicleId) {
      result = result.filter(p => p.compatibilityIds.includes(filters.vehicleId));
    }

    // Price Bounds
    if (filters.minPrice) {
      const min = parseFloat(filters.minPrice);
      if (!isNaN(min)) {
        result = result.filter(p => p.salePrice >= min);
      }
    }
    if (filters.maxPrice) {
      const max = parseFloat(filters.maxPrice);
      if (!isNaN(max)) {
        result = result.filter(p => p.salePrice <= max);
      }
    }

    // Stock Status Filter
    if (filters.stockStatus !== 'all') {
      result = result.filter(p => {
        if (filters.stockStatus === 'outofstock') return p.stockLevel === 0;
        if (filters.stockStatus === 'lowstock') return p.stockLevel > 0 && p.stockLevel <= p.reorderPoint;
        return p.stockLevel > p.reorderPoint;
      });
    }

    // Sorting
    result.sort((a, b) => {
      let valA: any = a[filters.sortBy];
      let valB: any = b[filters.sortBy];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return filters.sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [parts, filters]);

  // 2. Paginate the filtered list
  const paginatedParts = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return allFilteredPartsRaw.slice(startIndex, startIndex + pageSize);
  }, [allFilteredPartsRaw, page, pageSize]);

  // Total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(allFilteredPartsRaw.length / pageSize));
  }, [allFilteredPartsRaw, pageSize]);

  // Statistics
  const stats = useMemo(() => {
    const totalParts = parts.length;
    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    parts.forEach(p => {
      totalStockValue += p.stockLevel * p.costPrice;
      if (p.stockLevel === 0) {
        outOfStockCount++;
      } else if (p.stockLevel <= p.reorderPoint) {
        lowStockCount++;
      }
    });

    return {
      totalParts,
      totalStockValue,
      lowStockCount,
      outOfStockCount
    };
  }, [parts]);

  // CRUD actions wrappers
  const addPart = (partData: Omit<Part, 'id'>) => {
    const newPart = DB.createPart(partData);
    refreshData();
    window.dispatchEvent(new Event('storage'));
    return newPart;
  };

  const updatePart = (part: Part) => {
    DB.updatePart(part);
    refreshData();
    window.dispatchEvent(new Event('storage'));
  };

  const deletePart = (id: string) => {
    DB.deletePart(id);
    refreshData();
    window.dispatchEvent(new Event('storage'));
  };

  const addCategory = (name: string, description: string) => {
    const newCat = DB.createCategory({ name, description });
    refreshData();
    window.dispatchEvent(new Event('storage'));
    return newCat;
  };

  const deleteCategory = (id: string) => {
    DB.deleteCategory(id);
    refreshData();
    window.dispatchEvent(new Event('storage'));
  };

  const addVehicle = (make: string, model: string, year: string, engineCC: string) => {
    const newVeh = DB.createVehicle({ make, model, year, engineCC });
    refreshData();
    window.dispatchEvent(new Event('storage'));
    return newVeh;
  };

  const deleteVehicle = (id: string) => {
    DB.deleteVehicle(id);
    refreshData();
    window.dispatchEvent(new Event('storage'));
  };

  // --- Phase 2: Log Queries & CSV Handlers ---
  const getStockMovements = (partId: string): StockMovement[] => {
    return DB.getStockMovements().filter(sm => sm.partId === partId);
  };

  const getProductHistory = (partId: string): ProductHistoryLog[] => {
    return DB.getHistoryLogs().filter(ph => ph.partId === partId);
  };

  const importCSV = (csvText: string): { successCount: number; errors: string[] } => {
    const result = DB.importFromCSV(csvText);
    refreshData();
    window.dispatchEvent(new Event('storage'));
    return result;
  };

  const exportCSV = (): string => {
    return DB.exportToCSV();
  };

  return {
    parts: paginatedParts,
    allFilteredPartsRaw,
    allPartsRaw: parts,
    categories,
    suppliers,
    vehicles,
    filters,
    setFilters,
    stats,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    addPart,
    updatePart,
    deletePart,
    addCategory,
    deleteCategory,
    addVehicle,
    deleteVehicle,
    getStockMovements,
    getProductHistory,
    importCSV,
    exportCSV,
    refreshData
  };
}
