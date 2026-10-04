import type { Category, Supplier, VehicleModel, Part, PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus, SalesOrder, SalesOrderItem, SalesOrderStatus, StockMovement, StockMovementType, ProductHistoryLog, Customer, Invoice, Return, DamagedStock, StockAdjustment, AppNotification, NotificationType, NotificationPriority, Helmet } from './schema';
import {
  INITIAL_CATEGORIES,
  INITIAL_SUPPLIERS,
  INITIAL_VEHICLES,
  INITIAL_PARTS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_PURCHASE_ORDER_ITEMS,
  INITIAL_SALES_ORDERS,
  INITIAL_SALES_ORDER_ITEMS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_HISTORY_LOGS,
  INITIAL_CUSTOMERS,
  INITIAL_RETURNS,
  INITIAL_DAMAGED_STOCK,
  INITIAL_STOCK_ADJUSTMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_HELMETS
} from './mockData';

const KEYS = {
  CATEGORIES: 'inv_categories',
  SUPPLIERS: 'inv_suppliers',
  VEHICLES: 'inv_vehicles',
  PARTS: 'inv_parts',
  PURCHASE_ORDERS: 'inv_purchase_orders',
  PURCHASE_ORDER_ITEMS: 'inv_purchase_order_items',
  SALES_ORDERS: 'inv_sales_orders',
  SALES_ORDER_ITEMS: 'inv_sales_order_items',
  STOCK_MOVEMENTS: 'inv_stock_movements',
  HISTORY_LOGS: 'inv_history_logs',
  CUSTOMERS: 'inv_customers',
  INVOICES: 'inv_invoices',
  RETURNS: 'inv_returns',
  DAMAGED_STOCK: 'inv_damaged_stock',
  STOCK_ADJUSTMENTS: 'inv_stock_adjustments',
  NOTIFICATIONS: 'inv_notifications',
  HELMETS: 'inv_helmets'
};

// ── Data Version: bump this to force a reseed on all browsers ──────────────
const DATA_VERSION = '7.1'; // 3x3 Catalogue Grid Layout & 9 Helmet Products
const VERSION_KEY = 'inv_data_version';
const SHEET_URL_KEY = 'inv_google_sheet_url';

(function ensureFreshSeed() {
  const stored = localStorage.getItem(VERSION_KEY);
  if (stored !== DATA_VERSION) {
    // Clear all old data so mock data reseeds with Phase 3 history
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    localStorage.setItem(VERSION_KEY, DATA_VERSION);
    localStorage.setItem(SHEET_URL_KEY, 'https://script.google.com/macros/s/AKfycbywTDidj9kH4D2yZUbIiIIiYVZujsqKiqO-UQhCoO6buMc5Mo3_lBLkXAu8xX6eEztiPA/exec');
  } else if (!localStorage.getItem(SHEET_URL_KEY)) {
    localStorage.setItem(SHEET_URL_KEY, 'https://script.google.com/macros/s/AKfycbywTDidj9kH4D2yZUbIiIIiYVZujsqKiqO-UQhCoO6buMc5Mo3_lBLkXAu8xX6eEztiPA/exec');
  }
})();

function getOrSeed<T>(key: string, initialData: T[]): T[] {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) throw new Error('Cache value is not an array');
    return parsed;
  } catch (e) {
    console.warn(`[DB] Corrupted storage entry for "${key}", resetting to initial state.`, e);
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
}

// ── Debounced auto-push: coalesces rapid saves into a single push ───────────
let _syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
  // Debounce auto-push — waits 2s after the LAST save before pushing
  const sheetUrl = DB.getGoogleSheetUrl();
  if (sheetUrl) {
    if (_syncDebounceTimer) clearTimeout(_syncDebounceTimer);
    _syncDebounceTimer = setTimeout(() => {
      _syncDebounceTimer = null;
      if (typeof DB !== 'undefined' && DB.syncPush) {
        DB.syncPush().catch(err => console.error('Auto push failed', err));
      }
    }, 2000);
  }
}

// Write directly to localStorage without triggering auto-push (used by syncPull)
function saveLocal(key: string, data: unknown[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export class DB {
  // --- Categories ---
  static getCategories(): Category[] {
    const list = getOrSeed(KEYS.CATEGORIES, INITIAL_CATEGORIES);
    let hasChanges = false;
    for (const initCat of INITIAL_CATEGORIES) {
      if (!list.some(c => c.id === initCat.id || c.name.toLowerCase() === initCat.name.toLowerCase())) {
        list.push(initCat);
        hasChanges = true;
      }
    }
    if (hasChanges) {
      this.saveCategories(list);
    }
    return list;
  }
  static saveCategories(data: Category[]) {
    save(KEYS.CATEGORIES, data);
  }
  static createCategory(cat: Omit<Category, 'id'>): Category {
    const list = this.getCategories();
    // Case insensitive search
    const existing = list.find(c => c.name.toLowerCase() === cat.name.toLowerCase());
    if (existing) return existing;

    const newCat = { ...cat, id: `cat-${Date.now()}` };
    list.push(newCat);
    this.saveCategories(list);
    return newCat;
  }
  static deleteCategory(id: string) {
    const list = this.getCategories().filter(c => c.id !== id);
    this.saveCategories(list);
  }

  // --- Suppliers ---
  static getSuppliers(): Supplier[] {
    return getOrSeed(KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  }
  static saveSuppliers(data: Supplier[]) {
    save(KEYS.SUPPLIERS, data);
  }
  static createSupplier(sup: Omit<Supplier, 'id'>): Supplier {
    const list = this.getSuppliers();
    const existing = list.find(s => s.name.toLowerCase() === sup.name.toLowerCase());
    if (existing) return existing;

    const newSup = { ...sup, id: `sup-${Date.now()}` };
    list.push(newSup);
    this.saveSuppliers(list);
    return newSup;
  }
  static deleteSupplier(id: string) {
    const list = this.getSuppliers().filter(s => s.id !== id);
    this.saveSuppliers(list);
    // Remove purchase orders associated with this deleted supplier
    const remainingPOs = this.getPurchaseOrders().filter(po => po.supplierId !== id);
    this.savePurchaseOrders(remainingPOs);
    // Unlink supplier from parts
    const parts = this.getParts().map(p => p.supplierId === id ? { ...p, supplierId: '' } : p);
    this.saveParts(parts);
  }

  // --- Vehicle Models ---
  static getVehicles(): VehicleModel[] {
    const list = getOrSeed(KEYS.VEHICLES, INITIAL_VEHICLES);
    let hasChanges = false;
    for (const initVeh of INITIAL_VEHICLES) {
      const exists = list.some(
        v => v.id === initVeh.id || 
             (v.make.toLowerCase() === initVeh.make.toLowerCase() && 
              v.model.toLowerCase() === initVeh.model.toLowerCase())
      );
      if (!exists) {
        list.push(initVeh);
        hasChanges = true;
      }
    }
    if (hasChanges) {
      this.saveVehicles(list);
    }
    return list;
  }
  static saveVehicles(data: VehicleModel[]) {
    save(KEYS.VEHICLES, data);
  }
  static createVehicle(veh: Omit<VehicleModel, 'id'>): VehicleModel {
    const list = this.getVehicles();
    const newVeh = { ...veh, id: `veh-${Date.now()}` };
    list.push(newVeh);
    this.saveVehicles(list);
    return newVeh;
  }
  static deleteVehicle(id: string) {
    const list = this.getVehicles().filter(v => v.id !== id);
    this.saveVehicles(list);
    const parts = this.getParts().map(p => ({
      ...p,
      compatibilityIds: p.compatibilityIds.filter(cid => cid !== id)
    }));
    this.saveParts(parts);
  }

  // --- Stock Movements ---
  static getStockMovements(): StockMovement[] {
    return getOrSeed(KEYS.STOCK_MOVEMENTS, INITIAL_STOCK_MOVEMENTS);
  }
  static saveStockMovements(data: StockMovement[]) {
    save(KEYS.STOCK_MOVEMENTS, data);
  }
  static logStockMovement(partId: string, type: StockMovementType, quantity: number, referenceId: string, notes: string): void {
    if (quantity === 0) return;
    const list = this.getStockMovements();
    const newMovement: StockMovement = {
      id: `sm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      partId,
      type,
      quantity,
      timestamp: new Date().toISOString(),
      referenceId,
      notes
    };
    list.unshift(newMovement); // Add to top (descending order)
    this.saveStockMovements(list);
  }

  // --- Product Edit History Logs ---
  static getHistoryLogs(): ProductHistoryLog[] {
    return getOrSeed(KEYS.HISTORY_LOGS, INITIAL_HISTORY_LOGS);
  }
  static saveHistoryLogs(data: ProductHistoryLog[]) {
    save(KEYS.HISTORY_LOGS, data);
  }
  static logProductHistory(partId: string, changeType: 'CREATED' | 'EDITED' | 'DELETED', user: string, details: string): void {
    const list = this.getHistoryLogs();
    const newLog: ProductHistoryLog = {
      id: `ph-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      partId,
      changeType,
      timestamp: new Date().toISOString(),
      user,
      details
    };
    list.unshift(newLog); // Add to top
    this.saveHistoryLogs(list);
  }

  // --- Parts ---
  static getParts(): Part[] {
    const list = getOrSeed(KEYS.PARTS, INITIAL_PARTS);
    let hasChanges = false;

    // Auto-merge any newly defined initial parts (e.g. cable catalog)
    for (const initPart of INITIAL_PARTS) {
      const exists = list.some(
        p => p.id === initPart.id || 
             p.sku.toLowerCase() === initPart.sku.toLowerCase() ||
             p.name.toLowerCase() === initPart.name.toLowerCase()
      );
      if (!exists) {
        list.push(initPart);
        hasChanges = true;
      }
    }

    let migrated = false;
    const migratedList = list.map(p => {
      let isPartOutdated = false;
      const updated = { ...p };
      
      if (updated.wholesalePrice === undefined) {
        updated.wholesalePrice = updated.costPrice || 0;
        isPartOutdated = true;
      }
      if (updated.maxStock === undefined) {
        updated.maxStock = (updated.reorderPoint || 10) * 5;
        isPartOutdated = true;
      }
      if (updated.unit === undefined) {
        updated.unit = 'Pcs';
        isPartOutdated = true;
      }
      if (updated.brand === undefined) {
        updated.brand = 'Yamaha';
        isPartOutdated = true;
      }
      if (updated.barcode === undefined) {
        updated.barcode = `74${Date.now().toString().slice(-10)}`;
        isPartOutdated = true;
      }
      if (updated.imageUrl === undefined) {
        updated.imageUrl = '/parts_thumbnail.png';
        isPartOutdated = true;
      }
      if (isPartOutdated) migrated = true;
      return updated;
    });

    if (migrated || hasChanges) {
      this.saveParts(migratedList);
      return migratedList;
    }
    return list;
  }
  static saveParts(data: Part[]) {
    save(KEYS.PARTS, data);
  }
  static createPart(part: Omit<Part, 'id'>): Part {
    const list = this.getParts();
    const newPart = { ...part, id: `part-${Date.now()}` };
    list.push(newPart);
    this.saveParts(list);

    // Logs
    this.logProductHistory(newPart.id, 'CREATED', 'Pankaj.ydv707@gmail.com', `Part created with SKU: ${newPart.sku}.`);
    if (newPart.stockLevel > 0) {
      this.logStockMovement(newPart.id, 'MANUAL_ADJUST', newPart.stockLevel, 'MANUAL', 'Initial stock level load.');
    }
    return newPart;
  }
  static updatePart(part: Part): void {
    const list = this.getParts();
    const oldIndex = list.findIndex(p => p.id === part.id);
    if (oldIndex === -1) return;

    const oldPart = list[oldIndex];
    list[oldIndex] = part;
    this.saveParts(list);

    // Track Changes
    const changes: string[] = [];
    if (oldPart.sku !== part.sku) changes.push(`SKU (${oldPart.sku} → ${part.sku})`);
    if (oldPart.name !== part.name) changes.push(`Name (${oldPart.name} → ${part.name})`);
    if (oldPart.costPrice !== part.costPrice) changes.push(`Cost Price ($${oldPart.costPrice} → $${part.costPrice})`);
    if (oldPart.wholesalePrice !== part.wholesalePrice) changes.push(`Wholesale Price ($${oldPart.wholesalePrice} → $${part.wholesalePrice})`);
    if (oldPart.salePrice !== part.salePrice) changes.push(`Retail Price ($${oldPart.salePrice} → $${part.salePrice})`);
    if (oldPart.reorderPoint !== part.reorderPoint) changes.push(`Min Stock (${oldPart.reorderPoint} → ${part.reorderPoint})`);
    if (oldPart.maxStock !== part.maxStock) changes.push(`Max Stock (${oldPart.maxStock} → ${part.maxStock})`);
    if (oldPart.binLocation !== part.binLocation) changes.push(`Bin Location (${oldPart.binLocation || 'Empty'} → ${part.binLocation || 'Empty'})`);
    if (oldPart.brand !== part.brand) changes.push(`Brand (${oldPart.brand} → ${part.brand})`);

    if (changes.length > 0) {
      this.logProductHistory(part.id, 'EDITED', 'Pankaj.ydv707@gmail.com', `Updated attributes: ${changes.join(', ')}.`);
    }

    // Track stock change
    if (oldPart.stockLevel !== part.stockLevel) {
      const diff = part.stockLevel - oldPart.stockLevel;
      this.logStockMovement(
        part.id, 
        'MANUAL_ADJUST', 
        diff, 
        'MANUAL', 
        `Manual stock adjustment: ${diff > 0 ? '+' : ''}${diff} units.`
      );
    }
  }
  static deletePart(id: string): void {
    const parts = this.getParts();
    const target = parts.find(p => p.id === id);
    if (!target) return;
    
    const list = parts.filter(p => p.id !== id);
    this.saveParts(list);

    // Log deletion
    this.logProductHistory(id, 'DELETED', 'Pankaj.ydv707@gmail.com', `Part "${target.name}" deleted from catalog.`);
  }

  // --- Purchase Orders ---
  static getPurchaseOrders(): PurchaseOrder[] {
    const pos = getOrSeed(KEYS.PURCHASE_ORDERS, INITIAL_PURCHASE_ORDERS);
    const validSupplierIds = new Set(this.getSuppliers().map(s => s.id));
    // Filter out any orphaned purchase orders without a valid registered supplier
    const validPOs = pos.filter(po => validSupplierIds.has(po.supplierId));
    if (validPOs.length !== pos.length) {
      save(KEYS.PURCHASE_ORDERS, validPOs);
    }
    return validPOs;
  }
  static savePurchaseOrders(data: PurchaseOrder[]) {
    save(KEYS.PURCHASE_ORDERS, data);
  }
  static getPurchaseOrderItems(): PurchaseOrderItem[] {
    return getOrSeed(KEYS.PURCHASE_ORDER_ITEMS, INITIAL_PURCHASE_ORDER_ITEMS);
  }
  static savePurchaseOrderItems(data: PurchaseOrderItem[]) {
    save(KEYS.PURCHASE_ORDER_ITEMS, data);
  }

  static createPurchaseOrder(
    supplierId: string,
    items: { partId: string; quantity: number; unitCost: number }[]
  ): PurchaseOrder {
    const poId = `po-${Date.now()}`;
    const dateStr = new Date().toISOString().split('T')[0];

    const suppliers = this.getSuppliers();
    const sup = suppliers.find(s => s.id === supplierId);
    const leadTime = sup ? sup.leadTimeDays : 7;
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + leadTime);
    const expDateStr = expDate.toISOString().split('T')[0];

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

    const newPO: PurchaseOrder = {
      id: poId,
      supplierId,
      status: 'SENT',
      orderDate: dateStr,
      expectedDelivery: expDateStr,
      totalAmount
    };

    const newItems: PurchaseOrderItem[] = items.map((item, index) => ({
      id: `poi-${Date.now()}-${index}`,
      orderId: poId,
      partId: item.partId,
      quantity: item.quantity,
      unitCost: item.unitCost
    }));

    const poList = this.getPurchaseOrders();
    poList.push(newPO);
    this.savePurchaseOrders(poList);

    const poItemsList = this.getPurchaseOrderItems();
    poItemsList.push(...newItems);
    this.savePurchaseOrderItems(poItemsList);

    return newPO;
  }

  static updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus): void {
    const poList = this.getPurchaseOrders();
    const poIndex = poList.findIndex(p => p.id === id);
    if (poIndex === -1) return;

    const oldStatus = poList[poIndex].status;
    poList[poIndex].status = status;
    this.savePurchaseOrders(poList);

    if (status === 'RECEIVED' && oldStatus !== 'RECEIVED') {
      const items = this.getPurchaseOrderItems().filter(item => item.orderId === id);
      const parts = this.getParts();
      let itemCount = 0;
      let totalUnits = 0;

      items.forEach(item => {
        const part = parts.find(p => p.id === item.partId);
        if (part) {
          part.stockLevel += item.quantity;
          totalUnits += item.quantity;
          itemCount++;
          this.logStockMovement(part.id, 'PO_RECEIVED', item.quantity, id, `Restock arrived via purchase order.`);
        }
      });
      this.saveParts(parts);

      // Fire PO delivery notification
      const suppliers = this.getSuppliers();
      const po = poList[poIndex];
      const supName = suppliers.find(s => s.id === po.supplierId)?.name || 'Supplier';
      this.createNotification(
        'PO_DELIVERY',
        'Purchase Order Received',
        `PO #${id} from ${supName} received. ${itemCount} product(s), ${totalUnits} units restocked.`,
        id,
        'MEDIUM',
        'suppliers'
      );
    }
  }

  // --- Sales Orders ---
  static getSalesOrders(): SalesOrder[] {
    const list = getOrSeed(KEYS.SALES_ORDERS, INITIAL_SALES_ORDERS);
    // Purge legacy mock sales orders (e.g. so-101 .. so-129, so-201, so-202, so-203)
    const filtered = list.filter(so => !/^so-(1\d\d|20[123])$/.test(so.id));
    if (filtered.length !== list.length) {
      save(KEYS.SALES_ORDERS, filtered);
    }
    return filtered;
  }
  static saveSalesOrders(data: SalesOrder[]) {
    save(KEYS.SALES_ORDERS, data);
  }
  static getSalesOrderItems(): SalesOrderItem[] {
    const list = getOrSeed(KEYS.SALES_ORDER_ITEMS, INITIAL_SALES_ORDER_ITEMS);
    // Purge legacy mock sales order items (e.g. soi-101 .. soi-152, soi-1 .. soi-5)
    const filtered = list.filter(item => !/^soi-(1\d\d|[1-5])$/.test(item.id));
    if (filtered.length !== list.length) {
      save(KEYS.SALES_ORDER_ITEMS, filtered);
    }
    return filtered;
  }
  static saveSalesOrderItems(data: SalesOrderItem[]) {
    save(KEYS.SALES_ORDER_ITEMS, data);
  }

  static deleteSalesOrder(id: string): void {
    const soList = this.getSalesOrders();
    const targetSO = soList.find(so => so.id === id);
    const list = soList.filter(so => so.id !== id);
    this.saveSalesOrders(list);

    const items = this.getSalesOrderItems().filter(item => item.salesOrderId !== id);
    this.saveSalesOrderItems(items);

    if (targetSO?.invoiceId) {
      const invoices = this.getInvoices().filter(inv => inv.id !== targetSO.invoiceId);
      this.saveInvoices(invoices);
    }
  }

  static clearAllSalesOrders(): void {
    this.saveSalesOrders([]);
    this.saveSalesOrderItems([]);
  }


  static createSalesOrder(
    customerName: string,
    items: { partId: string; quantity: number; unitPrice: number }[],
    extra?: { customerId?: string; discount?: number; discountType?: 'PERCENTAGE'|'FIXED'; taxRate?: number; paymentMethod?: string; notes?: string }
  ): SalesOrder | null {
    const soId = `so-${Date.now()}`;
    const dateStr = new Date().toISOString().split('T')[0];
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    let discountAmt = 0;
    if (extra?.discount && extra.discount > 0) {
      discountAmt = extra.discountType === 'PERCENTAGE' ? subtotal * (extra.discount / 100) : extra.discount;
    }
    const afterDiscount = subtotal - discountAmt;
    const taxAmt = extra?.taxRate ? afterDiscount * (extra.taxRate / 100) : 0;
    const totalAmount = afterDiscount + taxAmt;

    const parts = this.getParts();
    for (const item of items) {
      const part = parts.find(p => p.id === item.partId);
      if (!part || part.stockLevel < item.quantity) return null;
    }

    // Auto-deduct stock and check thresholds
    items.forEach(item => {
      const part = parts.find(p => p.id === item.partId);
      if (part) {
        part.stockLevel -= item.quantity;
        this.logStockMovement(part.id, 'SALE_DISPATCHED', -item.quantity, soId, `Dispatched to ${customerName}.`);
        // Auto notification: low stock / out of stock
        if (part.stockLevel === 0) {
          this.createNotification('OUT_OF_STOCK', 'Out of Stock', `${part.name} (${part.sku}) is now completely out of stock.`, part.id, 'HIGH', 'inventory');
        } else if (part.stockLevel <= part.reorderPoint) {
          this.createNotification('LOW_STOCK', 'Low Stock Alert', `${part.name} (${part.sku}) is below reorder point. Stock: ${part.stockLevel}, Min: ${part.reorderPoint}.`, part.id, 'HIGH', 'inventory');
        }
      }
    });
    this.saveParts(parts);

    const newSO: SalesOrder = {
      id: soId,
      customerId: extra?.customerId,
      customerName,
      status: 'PENDING',
      saleDate: dateStr,
      totalAmount,
      discount: extra?.discount,
      discountType: extra?.discountType,
      taxRate: extra?.taxRate,
      paymentMethod: extra?.paymentMethod as any,
      notes: extra?.notes
    };

    const newItems: SalesOrderItem[] = items.map((item, index) => ({
      id: `soi-${Date.now()}-${index}`,
      salesOrderId: soId,
      partId: item.partId,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }));

    const soList = this.getSalesOrders();
    soList.push(newSO);
    this.saveSalesOrders(soList);

    const soItemsList = this.getSalesOrderItems();
    soItemsList.push(...newItems);
    this.saveSalesOrderItems(soItemsList);

    // Fire new sale notification
    this.createNotification('NEW_SALE', 'New Sale Created', `Invoice recorded for ${customerName} — $${totalAmount.toFixed(2)}.`, soId, 'LOW', 'sales');

    return newSO;
  }

  static updateSalesOrderStatus(id: string, status: SalesOrderStatus): void {
    const soList = this.getSalesOrders();
    const soIndex = soList.findIndex(s => s.id === id);
    if (soIndex === -1) return;

    soList[soIndex].status = status;
    this.saveSalesOrders(soList);
  }

  // --- Bulk CSV Import/Export Engine ---
  static exportToCSV(): string {
    const parts = this.getParts();
    const categories = this.getCategories();
    const suppliers = this.getSuppliers();
    const vehicles = this.getVehicles();

    const headers = [
      'SKU', 'Name', 'OEM Number', 'Brand', 'Category', 'Supplier', 'Unit',
      'Cost Price', 'Wholesale Price', 'Retail Price', 'Current Stock', 'Min Stock', 'Max Stock',
      'Location', 'Description', 'Compatibility'
    ];

    const rows = parts.map(p => {
      const catName = categories.find(c => c.id === p.categoryId)?.name || '';
      const supName = suppliers.find(s => s.id === p.supplierId)?.name || '';
      const compatStr = p.compatibilityIds.map(vid => {
        const v = vehicles.find(x => x.id === vid);
        return v ? `${v.make} ${v.model} (${v.year})` : '';
      }).filter(Boolean).join('; ');

      const fields = [
        p.sku,
        p.name,
        p.oemNumber,
        p.brand,
        catName,
        supName,
        p.unit,
        p.costPrice.toString(),
        p.wholesalePrice.toString(),
        p.salePrice.toString(),
        p.stockLevel.toString(),
        p.reorderPoint.toString(),
        p.maxStock.toString(),
        p.binLocation,
        p.description.replace(/"/g, '""'), // escape quotes
        compatStr
      ];

      return fields.map(f => `"${f}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  static importFromCSV(csvText: string): { successCount: number; errors: string[] } {
    const lines = csvText.split('\n');
    if (lines.length < 2) return { successCount: 0, errors: ['CSV has no records.'] };

    // Simple header check
    const headers = lines[0].split(',').map(h => h.replace(/["]/g, '').trim().toLowerCase());
    const expected = ['sku', 'name', 'brand', 'category', 'supplier'];
    
    // Verify required headers exist
    for (const req of expected) {
      if (!headers.includes(req)) {
        return { successCount: 0, errors: [`Missing required header column: "${req}"`] };
      }
    }

    const partsList = this.getParts();
    const categoriesList = this.getCategories();
    const suppliersList = this.getSuppliers();
    const vehiclesList = this.getVehicles();
    
    let successCount = 0;
    const errors: string[] = [];

    // Helper to parse double-quoted CSV row fields
    const parseCSVRow = (text: string): string[] => {
      const result: string[] = [];
      let cell = '';
      let insideQuote = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          result.push(cell.trim());
          cell = '';
        } else {
          cell += char;
        }
      }
      result.push(cell.trim());
      return result;
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cells = parseCSVRow(line).map(c => c.replace(/^"|"$/g, ''));
      if (cells.length < headers.length) {
        errors.push(`Row ${i + 1}: Insufficient columns.`);
        continue;
      }

      // Map values
      const rowData: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowData[h] = cells[idx] || '';
      });

      const sku = rowData['sku'];
      const name = rowData['name'];
      const brand = rowData['brand'];
      const catName = rowData['category'];
      const supName = rowData['supplier'];

      if (!sku || !name || !brand || !catName || !supName) {
        errors.push(`Row ${i + 1}: Missing required fields (SKU, Name, Brand, Category, Supplier).`);
        continue;
      }

      // 1. Resolve Category
      let category = categoriesList.find(c => c.name.toLowerCase() === catName.toLowerCase());
      if (!category) {
        category = this.createCategory({ name: catName, description: 'Auto-created via bulk CSV import.' });
        categoriesList.push(category);
      }

      // 2. Resolve Supplier
      let supplier = suppliersList.find(s => s.name.toLowerCase() === supName.toLowerCase());
      if (!supplier) {
        supplier = this.createSupplier({
          name: supName,
          email: `${supName.toLowerCase().replace(/\s+/g, '')}@supplier.com`,
          phone: 'N/A',
          contactPerson: 'CSV Auto-Generated',
          leadTimeDays: 7
        });
        suppliersList.push(supplier);
      }

      // 3. Resolve Compatibility
      const compatStr = rowData['compatibility'] || '';
      const compatibilityIds: string[] = [];
      if (compatStr) {
        const models = compatStr.split(';').map(m => m.trim().toLowerCase());
        models.forEach(modelStr => {
          // Find matching bike model
          const found = vehiclesList.find(v => {
            const full = `${v.make} ${v.model}`.toLowerCase();
            return full.includes(modelStr) || modelStr.includes(full);
          });
          if (found) compatibilityIds.push(found.id);
        });
      }

      // Attributes
      const costPrice = parseFloat(rowData['cost price'] || rowData['costprice']) || 0;
      const wholesalePrice = parseFloat(rowData['wholesale price'] || rowData['wholesaleprice']) || costPrice;
      const salePrice = parseFloat(rowData['retail price'] || rowData['retailprice'] || rowData['saleprice']) || wholesalePrice;
      const stockLevel = parseInt(rowData['current stock'] || rowData['currentstock'] || rowData['stock']) || 0;
      const reorderPoint = parseInt(rowData['min stock'] || rowData['minstock'] || rowData['reorderpoint']) || 0;
      const maxStock = parseInt(rowData['max stock'] || rowData['maxstock'] || rowData['maxstock']) || (reorderPoint * 5);
      const unit = rowData['unit'] || 'Pcs';
      const binLocation = rowData['location'] || rowData['binlocation'] || '';
      const description = rowData['description'] || '';
      const oemNumber = rowData['oem number'] || rowData['oemnumber'] || '';
      const barcode = rowData['barcode'] || `74${Date.now().toString().slice(-10)}`;
      const imageUrl = '/parts_thumbnail.png';

      // Check if SKU exists
      const existingIdx = partsList.findIndex(p => p.sku === sku);
      if (existingIdx !== -1) {
        // Update part
        const oldPart = partsList[existingIdx];
        const updatedPart: Part = {
          ...oldPart,
          name,
          oemNumber: oemNumber || oldPart.oemNumber,
          categoryId: category.id,
          supplierId: supplier.id,
          costPrice,
          wholesalePrice,
          salePrice,
          stockLevel,
          reorderPoint,
          maxStock,
          unit,
          binLocation,
          description,
          brand,
          barcode,
          imageUrl,
          compatibilityIds
        };
        partsList[existingIdx] = updatedPart;
        
        // Log changes
        this.logProductHistory(oldPart.id, 'EDITED', 'Pankaj.ydv707@gmail.com', `Updated via Bulk CSV Import.`);
        if (oldPart.stockLevel !== stockLevel) {
          this.logStockMovement(oldPart.id, 'BULK_IMPORT', stockLevel - oldPart.stockLevel, 'IMPORT', `Stock sync from bulk import.`);
        }
      } else {
        // Create new part
        const newPart: Part = {
          id: `part-${Date.now()}-${successCount}`,
          sku,
          name,
          oemNumber,
          categoryId: category.id,
          supplierId: supplier.id,
          costPrice,
          wholesalePrice,
          salePrice,
          stockLevel,
          reorderPoint,
          maxStock,
          unit,
          binLocation,
          description,
          brand,
          barcode,
          imageUrl,
          compatibilityIds
        };
        partsList.push(newPart);

        this.logProductHistory(newPart.id, 'CREATED', 'Pankaj.ydv707@gmail.com', `Catalogued via Bulk CSV Import.`);
        if (newPart.stockLevel > 0) {
          this.logStockMovement(newPart.id, 'BULK_IMPORT', newPart.stockLevel, 'IMPORT', `Initial stock from bulk import.`);
        }
      }

      successCount++;
    }

    // Save lists
    this.saveParts(partsList);
    this.saveCategories(categoriesList);
    this.saveSuppliers(suppliersList);

    return { successCount, errors };
  }

  // ─── Phase 4: Customers ──────────────────────────────────────────────────────
  static getCustomers(): Customer[] {
    return getOrSeed(KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }
  static saveCustomers(data: Customer[]) {
    save(KEYS.CUSTOMERS, data);
  }
  static createCustomer(cust: Omit<Customer, 'id' | 'createdAt'>): Customer {
    const list = this.getCustomers();
    const newCust: Customer = { ...cust, id: `cust-${Date.now()}`, createdAt: new Date().toISOString() };
    list.push(newCust);
    this.saveCustomers(list);
    return newCust;
  }
  static updateCustomer(cust: Customer): void {
    const list = this.getCustomers();
    const idx = list.findIndex(c => c.id === cust.id);
    if (idx !== -1) { list[idx] = cust; this.saveCustomers(list); }
  }
  static deleteCustomer(id: string): void {
    this.saveCustomers(this.getCustomers().filter(c => c.id !== id));
  }

  // ─── Phase 4: Invoices ───────────────────────────────────────────────────────
  static getInvoices(): Invoice[] {
    return getOrSeed(KEYS.INVOICES, []);
  }
  static saveInvoices(data: Invoice[]) {
    save(KEYS.INVOICES, data);
  }
  static createInvoice(inv: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>): Invoice {
    const list = this.getInvoices();
    const num = String(list.length + 1).padStart(5, '0');
    const year = new Date().getFullYear();
    const newInv: Invoice = { ...inv, id: `inv-${Date.now()}`, invoiceNumber: `INV-${year}-${num}`, createdAt: new Date().toISOString() };
    list.push(newInv);
    this.saveInvoices(list);
    return newInv;
  }
  static voidInvoice(id: string): void {
    const list = this.getInvoices();
    const idx = list.findIndex(i => i.id === id);
    if (idx !== -1) { list[idx].status = 'VOID'; this.saveInvoices(list); }
  }
  static markInvoicePaid(id: string): void {
    const list = this.getInvoices();
    const idx = list.findIndex(i => i.id === id);
    if (idx !== -1) { list[idx].status = 'PAID'; this.saveInvoices(list); }
  }

  // ─── Phase 4: Returns ────────────────────────────────────────────────────────
  static getReturns(): Return[] {
    const list = getOrSeed(KEYS.RETURNS, INITIAL_RETURNS);
    const filtered = list.filter(r => r.id !== 'ret-1');
    if (filtered.length !== list.length) {
      save(KEYS.RETURNS, filtered);
    }
    return filtered;
  }
  static saveReturns(data: Return[]) {
    save(KEYS.RETURNS, data);
  }
  static createReturn(ret: Omit<Return, 'id' | 'returnNumber' | 'createdAt'>): Return {
    const list = this.getReturns();
    const num = String(list.length + 1).padStart(5, '0');
    const year = new Date().getFullYear();
    const newRet: Return = { ...ret, id: `ret-${Date.now()}`, returnNumber: `RET-${year}-${num}`, createdAt: new Date().toISOString() };
    list.push(newRet);
    this.saveReturns(list);

    // Auto-restock if applicable
    if (ret.restockItems) {
      const parts = this.getParts();
      ret.items.forEach(item => {
        const part = parts.find(p => p.id === item.partId);
        if (part) {
          part.stockLevel += item.quantity;
          this.logStockMovement(part.id, 'RETURN_RESTOCK', item.quantity, newRet.id, `Stock returned via ${newRet.returnNumber}.`);
        }
      });
      this.saveParts(parts);
    }

    // Notification
    this.createNotification('RETURN', 'Return Processed', `${newRet.returnNumber} from ${ret.customerName} — ${ret.type}. Refund: $${ret.refundAmount.toFixed(2)}.`, newRet.id, 'MEDIUM', 'returns');
    return newRet;
  }
  static updateReturnStatus(id: string, status: Return['status']): void {
    const list = this.getReturns();
    const idx = list.findIndex(r => r.id === id);
    if (idx !== -1) { list[idx].status = status; this.saveReturns(list); }
  }

  // ─── Phase 4: Damaged Stock ─────────────────────────────────────────────────
  static getDamagedStock(): DamagedStock[] {
    return getOrSeed(KEYS.DAMAGED_STOCK, INITIAL_DAMAGED_STOCK);
  }
  static saveDamagedStock(data: DamagedStock[]) {
    save(KEYS.DAMAGED_STOCK, data);
  }
  static reportDamage(dmg: Omit<DamagedStock, 'id' | 'reportNumber' | 'timestamp'>): DamagedStock {
    const list = this.getDamagedStock();
    const num = String(list.length + 1).padStart(5, '0');
    const year = new Date().getFullYear();
    const newDmg: DamagedStock = { ...dmg, id: `dmg-${Date.now()}`, reportNumber: `DMG-${year}-${num}`, timestamp: new Date().toISOString() };
    list.push(newDmg);
    this.saveDamagedStock(list);

    // Deduct from stock
    const parts = this.getParts();
    const part = parts.find(p => p.id === dmg.partId);
    if (part) {
      part.stockLevel = Math.max(0, part.stockLevel - dmg.quantity);
      this.logStockMovement(part.id, 'DAMAGE_WRITE_OFF', -dmg.quantity, newDmg.id, `Damaged: ${dmg.reason}`);
      this.saveParts(parts);
    }

    this.createNotification('DAMAGED_STOCK', 'Damaged Stock Reported', `${newDmg.reportNumber}: ${dmg.quantity}× ${dmg.partName} written off. Est. loss: $${dmg.estimatedLoss.toFixed(2)}.`, newDmg.id, 'MEDIUM', 'returns');
    return newDmg;
  }
  static resolveDamage(id: string): void {
    const list = this.getDamagedStock();
    const idx = list.findIndex(d => d.id === id);
    if (idx !== -1) { list[idx].resolved = true; this.saveDamagedStock(list); }
  }

  // ─── Phase 4: Stock Adjustments ─────────────────────────────────────────────
  static getStockAdjustments(): StockAdjustment[] {
    return getOrSeed(KEYS.STOCK_ADJUSTMENTS, INITIAL_STOCK_ADJUSTMENTS);
  }
  static saveStockAdjustments(data: StockAdjustment[]) {
    save(KEYS.STOCK_ADJUSTMENTS, data);
  }
  static createStockAdjustment(adj: Omit<StockAdjustment, 'id' | 'adjustmentNumber' | 'timestamp'>): StockAdjustment {
    const list = this.getStockAdjustments();
    const num = String(list.length + 1).padStart(5, '0');
    const year = new Date().getFullYear();
    const newAdj: StockAdjustment = { ...adj, id: `adj-${Date.now()}`, adjustmentNumber: `ADJ-${year}-${num}`, timestamp: new Date().toISOString() };
    list.push(newAdj);
    this.saveStockAdjustments(list);

    // Apply to part
    const parts = this.getParts();
    const part = parts.find(p => p.id === adj.partId);
    if (part) {
      part.stockLevel = adj.adjustedQty;
      this.logStockMovement(part.id, 'MANUAL_ADJUST', adj.delta, newAdj.id, `Stock adjustment: ${adj.reason}`);
      this.saveParts(parts);
    }

    this.createNotification('STOCK_ADJUST', 'Stock Adjustment Applied', `${newAdj.adjustmentNumber}: ${adj.partName} adjusted ${adj.delta > 0 ? '+' : ''}${adj.delta} units. New stock: ${adj.adjustedQty}.`, newAdj.id, 'LOW', 'returns');
    return newAdj;
  }

  // ─── Phase 4: Notifications ──────────────────────────────────────────────────
  static getNotifications(): AppNotification[] {
    return getOrSeed(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }
  static saveNotifications(data: AppNotification[]) {
    save(KEYS.NOTIFICATIONS, data);
  }
  static createNotification(type: NotificationType, title: string, message: string, referenceId: string, priority: NotificationPriority = 'MEDIUM', navigateTo?: string): AppNotification {
    const list = this.getNotifications();
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      title,
      message,
      referenceId,
      isRead: false,
      createdAt: new Date().toISOString(),
      priority,
      navigateTo
    };
    list.unshift(newNotif);
    // Keep max 100 notifications
    if (list.length > 100) list.splice(100);
    this.saveNotifications(list);
    return newNotif;
  }
  static markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const idx = list.findIndex(n => n.id === id);
    if (idx !== -1) { list[idx].isRead = true; this.saveNotifications(list); }
  }
  static markAllNotificationsRead(): void {
    const list = this.getNotifications().map(n => ({ ...n, isRead: true }));
    this.saveNotifications(list);
  }
  static deleteNotification(id: string): void {
    this.saveNotifications(this.getNotifications().filter(n => n.id !== id));
  }
  static clearAllNotifications(): void {
    this.saveNotifications([]);
  }
  static getUnreadCount(): number {
    return this.getNotifications().filter(n => !n.isRead).length;
  }

  // --- Helmets & Riding Gear Catalog ---
  static getHelmets(): Helmet[] {
    return getOrSeed(KEYS.HELMETS, INITIAL_HELMETS);
  }
  static saveHelmets(data: Helmet[]) {
    save(KEYS.HELMETS, data);
  }
  static createHelmet(h: Omit<Helmet, 'id' | 'createdAt' | 'updatedAt'>): Helmet {
    const list = this.getHelmets();
    const now = new Date().toISOString();
    const newHelmet: Helmet = {
      ...h,
      id: `hlm-${Date.now()}`,
      gearType: h.gearType || 'Helmets',
      createdAt: now,
      updatedAt: now
    };
    list.push(newHelmet);
    this.saveHelmets(list);

    this.logProductHistory(newHelmet.id, 'CREATED', 'Pankaj.ydv707@gmail.com', `Helmet catalogued: ${newHelmet.productName} (SKU: ${newHelmet.sku}).`);
    if (newHelmet.stockLevel > 0) {
      this.logStockMovement(newHelmet.id, 'MANUAL_ADJUST', newHelmet.stockLevel, 'INITIAL_LOAD', `Initial stock recorded for ${newHelmet.productName}.`);
    }
    return newHelmet;
  }
  static updateHelmet(h: Helmet): void {
    const list = this.getHelmets();
    const idx = list.findIndex(item => item.id === h.id);
    if (idx === -1) return;

    const old = list[idx];
    const updated: Helmet = {
      ...h,
      updatedAt: new Date().toISOString()
    };
    list[idx] = updated;
    this.saveHelmets(list);

    // Track stock changes
    if (old.stockLevel !== updated.stockLevel) {
      const diff = updated.stockLevel - old.stockLevel;
      this.logStockMovement(
        updated.id,
        'MANUAL_ADJUST',
        diff,
        'MANUAL',
        `Helmet stock adjustment: ${diff > 0 ? '+' : ''}${diff} units for ${updated.productName}.`
      );
      if (updated.stockLevel === 0) {
        this.createNotification('OUT_OF_STOCK', 'Helmet Out of Stock', `${updated.productName} (${updated.sku}) is now out of stock.`, updated.id, 'HIGH', 'helmets');
      } else if (updated.stockLevel <= updated.reorderPoint) {
        this.createNotification('LOW_STOCK', 'Helmet Low Stock Alert', `${updated.productName} (${updated.sku}) is low on stock (${updated.stockLevel} left, Min: ${updated.reorderPoint}).`, updated.id, 'HIGH', 'helmets');
      }
    }
    this.logProductHistory(updated.id, 'EDITED', 'Pankaj.ydv707@gmail.com', `Updated attributes for helmet "${updated.productName}".`);
  }
  static deleteHelmet(id: string): void {
    const list = this.getHelmets();
    const target = list.find(h => h.id === id);
    if (!target) return;

    const filtered = list.filter(h => h.id !== id);
    this.saveHelmets(filtered);
    this.logProductHistory(id, 'DELETED', 'Pankaj.ydv707@gmail.com', `Helmet "${target.productName}" deleted from catalogue.`);
  }
  static duplicateHelmet(id: string): Helmet | null {
    const list = this.getHelmets();
    const target = list.find(h => h.id === id);
    if (!target) return null;

    const now = new Date().toISOString();
    const dup: Helmet = {
      ...target,
      id: `hlm-${Date.now()}`,
      productName: `${target.productName} (Copy)`,
      sku: `${target.sku}-COPY-${Math.floor(Math.random() * 1000)}`,
      barcode: `890${Date.now().toString().slice(-9)}`,
      createdAt: now,
      updatedAt: now
    };
    list.push(dup);
    this.saveHelmets(list);
    this.logProductHistory(dup.id, 'CREATED', 'Pankaj.ydv707@gmail.com', `Duplicated from "${target.productName}".`);
    return dup;
  }
  static adjustHelmetStock(id: string, delta: number, type: StockMovementType = 'MANUAL_ADJUST', notes: string = ''): void {
    const list = this.getHelmets();
    const idx = list.findIndex(h => h.id === id);
    if (idx === -1) return;

    const helmet = list[idx];
    const newStock = Math.max(0, helmet.stockLevel + delta);
    helmet.stockLevel = newStock;
    helmet.updatedAt = new Date().toISOString();
    this.saveHelmets(list);

    this.logStockMovement(helmet.id, type, delta, 'ADJUSTMENT', notes || `Stock adjusted ${delta > 0 ? '+' : ''}${delta} units.`);
  }

  static exportHelmetsCSV(): string {
    const helmets = this.getHelmets();
    const headers = [
      'Product Name', 'Brand', 'Model', 'SKU', 'Barcode',
      'Purchase Price', 'Wholesale Price', 'Retail Price',
      'Current Stock', 'Min Stock', 'Max Stock',
      'Weight', 'Size', 'Colour', 'Category', 'Description', 'Google Drive Image URL'
    ];
    const rows = helmets.map(h => [
      `"${h.productName.replace(/"/g, '""')}"`,
      `"${h.brand}"`,
      `"${h.model}"`,
      `"${h.sku}"`,
      `"${h.barcode}"`,
      h.purchasePrice,
      h.wholesalePrice,
      h.salePrice,
      h.stockLevel,
      h.reorderPoint,
      h.maxStock,
      `"${h.weight}"`,
      `"${h.size}"`,
      `"${h.colour}"`,
      `"${h.category}"`,
      `"${h.description.replace(/"/g, '""')}"`,
      `"${h.imageUrl}"`
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
  }

  static importHelmetsCSV(csvText: string): { successCount: number; errors: string[] } {
    const lines = csvText.split('\n');
    if (lines.length < 2) return { successCount: 0, errors: ['CSV file is empty or missing header/rows.'] };

    const parseRow = (text: string): string[] => {
      const res: string[] = [];
      let cell = '';
      let insideQuote = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') insideQuote = !insideQuote;
        else if (char === ',' && !insideQuote) { res.push(cell.trim()); cell = ''; }
        else cell += char;
      }
      res.push(cell.trim());
      return res;
    };

    const headers = parseRow(lines[0]).map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
    const list = this.getHelmets();
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cells = parseRow(line).map(c => c.replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = cells[idx] || ''; });

      const name = row['product name'] || row['name'] || row['productname'];
      const brand = row['brand'] || 'SMK';
      const sku = row['sku'] || `SKU-${Date.now()}-${i}`;
      if (!name) {
        errors.push(`Row ${i + 1}: Missing product name.`);
        continue;
      }

      const existingIdx = list.findIndex(h => h.sku === sku || h.productName.toLowerCase() === name.toLowerCase());
      const purchasePrice = parseFloat(row['purchase price'] || row['purchaseprice'] || row['cost price'] || '0') || 0;
      const wholesalePrice = parseFloat(row['wholesale price'] || row['wholesaleprice'] || '0') || purchasePrice;
      const salePrice = parseFloat(row['retail price'] || row['retailprice'] || row['selling price'] || '0') || wholesalePrice;
      const stockLevel = parseInt(row['current stock'] || row['currentstock'] || row['stock'] || '0') || 0;
      const reorderPoint = parseInt(row['min stock'] || row['minstock'] || row['reorderpoint'] || '5') || 5;
      const maxStock = parseInt(row['max stock'] || row['maxstock'] || '50') || 50;

      const helmetData: Helmet = {
        id: existingIdx !== -1 ? list[existingIdx].id : `hlm-${Date.now()}-${i}`,
        productName: name,
        brand,
        model: row['model'] || brand,
        sku,
        barcode: row['barcode'] || `890${Date.now().toString().slice(-9)}`,
        purchasePrice,
        wholesalePrice,
        salePrice,
        stockLevel,
        reorderPoint,
        maxStock,
        weight: row['weight'] || '1400g',
        size: row['size'] || 'L',
        colour: row['colour'] || row['color'] || 'Black',
        category: row['category'] || 'Full Face',
        gearType: 'Helmets',
        description: row['description'] || '',
        imageUrl: row['google drive image url'] || row['image url'] || row['imageurl'] || '',
        createdAt: existingIdx !== -1 ? list[existingIdx].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingIdx !== -1) {
        list[existingIdx] = helmetData;
      } else {
        list.push(helmetData);
      }
      successCount++;
    }

    this.saveHelmets(list);
    return { successCount, errors };
  }

  // ─── Google Sheets Sync Methods ────────────────────────────────────────────
  static getGoogleSheetUrl(): string {
    return localStorage.getItem(SHEET_URL_KEY) || 'https://script.google.com/macros/s/AKfycbywTDidj9kH4D2yZUbIiIIiYVZujsqKiqO-UQhCoO6buMc5Mo3_lBLkXAu8xX6eEztiPA/exec';
  }

  static setGoogleSheetUrl(url: string) {
    localStorage.setItem(SHEET_URL_KEY, url);
  }

  static async syncPush(): Promise<boolean> {
    const url = this.getGoogleSheetUrl();
    if (!url) return false;

    const payload = {
      categories: this.getCategories(),
      suppliers: this.getSuppliers(),
      vehicles: this.getVehicles(),
      parts: this.getParts(),
      helmets: this.getHelmets(),
      purchase_orders: this.getPurchaseOrders(),
      purchase_order_items: this.getPurchaseOrderItems(),
      sales_orders: this.getSalesOrders(),
      sales_order_items: this.getSalesOrderItems(),
      stock_movements: this.getStockMovements(),
      history_logs: this.getHistoryLogs(),
      customers: this.getCustomers(),
      invoices: this.getInvoices(),
      returns: this.getReturns(),
      damaged_stock: this.getDamagedStock(),
      stock_adjustments: this.getStockAdjustments(),
      notifications: this.getNotifications()
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });
      if (!response.ok) {
        console.error('Sync push HTTP error:', response.status, response.statusText);
        return false;
      }
      const result = await response.json().catch(() => null);
      return result?.status === 'success';
    } catch (e) {
      console.error('Sync push error', e);
      return false;
    }
  }

  static async syncPull(): Promise<boolean> {
    const url = this.getGoogleSheetUrl();
    if (!url) return false;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Sync pull HTTP error:', response.status, response.statusText);
        return false;
      }

      const text = await response.text();
      let data: Record<string, unknown[]>;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error('Sync pull JSON parse error. Endpoint returned non-JSON content.', err);
        return false;
      }
      
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        if (data.categories && Array.isArray(data.categories)) saveLocal(KEYS.CATEGORIES, data.categories);
        if (data.suppliers && Array.isArray(data.suppliers)) saveLocal(KEYS.SUPPLIERS, data.suppliers);
        if (data.vehicles && Array.isArray(data.vehicles)) saveLocal(KEYS.VEHICLES, data.vehicles);
        if (data.parts && Array.isArray(data.parts)) saveLocal(KEYS.PARTS, data.parts);
        if (data.helmets && Array.isArray(data.helmets)) saveLocal(KEYS.HELMETS, data.helmets);
        if (data.purchase_orders && Array.isArray(data.purchase_orders)) saveLocal(KEYS.PURCHASE_ORDERS, data.purchase_orders);
        if (data.purchase_order_items && Array.isArray(data.purchase_order_items)) saveLocal(KEYS.PURCHASE_ORDER_ITEMS, data.purchase_order_items);
        if (data.sales_orders && Array.isArray(data.sales_orders)) saveLocal(KEYS.SALES_ORDERS, data.sales_orders);
        if (data.sales_order_items && Array.isArray(data.sales_order_items)) saveLocal(KEYS.SALES_ORDER_ITEMS, data.sales_order_items);
        if (data.stock_movements && Array.isArray(data.stock_movements)) saveLocal(KEYS.STOCK_MOVEMENTS, data.stock_movements);
        if (data.history_logs && Array.isArray(data.history_logs)) saveLocal(KEYS.HISTORY_LOGS, data.history_logs);
        if (data.customers && Array.isArray(data.customers)) saveLocal(KEYS.CUSTOMERS, data.customers);
        if (data.invoices && Array.isArray(data.invoices)) saveLocal(KEYS.INVOICES, data.invoices);
        if (data.returns && Array.isArray(data.returns)) saveLocal(KEYS.RETURNS, data.returns);
        if (data.damaged_stock && Array.isArray(data.damaged_stock)) saveLocal(KEYS.DAMAGED_STOCK, data.damaged_stock);
        if (data.stock_adjustments && Array.isArray(data.stock_adjustments)) saveLocal(KEYS.STOCK_ADJUSTMENTS, data.stock_adjustments);
        if (data.notifications && Array.isArray(data.notifications)) saveLocal(KEYS.NOTIFICATIONS, data.notifications);
        
        window.dispatchEvent(new Event('storage'));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Sync pull error', e);
      return false;
    }
  }
}
