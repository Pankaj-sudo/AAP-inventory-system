import type { Category, Supplier, VehicleModel, Part, PurchaseOrder, PurchaseOrderItem, SalesOrder, SalesOrderItem, StockMovement, ProductHistoryLog, Customer, Return, DamagedStock, StockAdjustment, AppNotification, Helmet } from './schema';

export const INITIAL_HELMETS: Helmet[] = [
  {
    id: 'hlm-101',
    productName: 'SMK Stellar Gloss Black',
    brand: 'SMK',
    model: 'Stellar',
    sku: 'SMK-001',
    barcode: '890123400001',
    purchasePrice: 4200,
    wholesalePrice: 5000,
    salePrice: 5800,
    stockLevel: 18,
    reorderPoint: 5,
    maxStock: 50,
    weight: '1450g',
    size: 'L',
    colour: 'Gloss Black',
    category: 'Full Face',
    gearType: 'Helmets',
    description: 'Aerodynamic energy-impact thermoplastic shell helmet with Pinlock-ready visor, breath deflector, and removable hypoallergenic liner.',
    imageUrl: '',
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-07-29T10:00:00Z'
  },
  {
    id: 'hlm-102',
    productName: 'LS2 FF353 Rapid Solid Matte Black',
    brand: 'LS2',
    model: 'Rapid FF353',
    sku: 'LS2-101',
    barcode: '890123400002',
    purchasePrice: 5100,
    wholesalePrice: 6100,
    salePrice: 7200,
    stockLevel: 4,
    reorderPoint: 8,
    maxStock: 40,
    weight: '1300g',
    size: 'M',
    colour: 'Matte Black',
    category: 'Full Face',
    gearType: 'Helmets',
    description: 'Ultra-light HPTT composite shell with quick release visor system, dynamic flow-through ventilation, and breath guard.',
    imageUrl: '',
    createdAt: '2026-07-03T11:00:00Z',
    updatedAt: '2026-07-29T10:00:00Z'
  },
  {
    id: 'hlm-103',
    productName: 'Axor Apex Venom Neon Yellow',
    brand: 'Axor',
    model: 'Apex Venom',
    sku: 'AX-201',
    barcode: '890123400003',
    purchasePrice: 4800,
    wholesalePrice: 5600,
    salePrice: 6500,
    stockLevel: 24,
    reorderPoint: 8,
    maxStock: 60,
    weight: '1500g',
    size: 'XL',
    colour: 'Neon Yellow / Black',
    category: 'Full Face',
    gearType: 'Helmets',
    description: 'ECE 22.05 & DOT certified aggressive graphic helmet featuring integrated dual-visor system and chin curtain.',
    imageUrl: '',
    createdAt: '2026-07-05T09:30:00Z',
    updatedAt: '2026-07-29T10:00:00Z'
  },
  {
    id: 'hlm-104',
    productName: 'Steelbird SBA-7 7SEVEN Flip-Up',
    brand: 'Steelbird',
    model: 'SBA-7 7SEVEN',
    sku: 'SB-301',
    barcode: '890123400004',
    purchasePrice: 2600,
    wholesalePrice: 3100,
    salePrice: 3799,
    stockLevel: 0,
    reorderPoint: 6,
    maxStock: 35,
    weight: '1400g',
    size: 'L',
    colour: 'Titanium Grey',
    category: 'Modular',
    gearType: 'Helmets',
    description: 'Versatile modular flip-up helmet with high-impact engineering ABS casing, micro-metric buckle, and anti-scratch visor.',
    imageUrl: '',
    createdAt: '2026-07-08T14:15:00Z',
    updatedAt: '2026-07-29T10:00:00Z'
  },
  {
    id: 'hlm-105',
    productName: 'MT Helmets Thunder 4 SV Solid',
    brand: 'MT',
    model: 'Thunder 4 SV',
    sku: 'MT-401',
    barcode: '890123400005',
    purchasePrice: 7500,
    wholesalePrice: 8800,
    salePrice: 9900,
    stockLevel: 12,
    reorderPoint: 4,
    maxStock: 25,
    weight: '1550g',
    size: 'M',
    colour: 'Pearl White',
    category: 'Full Face',
    gearType: 'Helmets',
    description: 'ECE 22.06 certified next-generation touring helmet with internal drop-down sun visor and emergency release cheek pads.',
    imageUrl: '',
    createdAt: '2026-07-10T16:00:00Z',
    updatedAt: '2026-07-29T10:00:00Z'
  },
  {
    id: 'hlm-106',
    productName: 'Studds Thunder D1 Open Face',
    brand: 'Studds',
    model: 'Thunder D1',
    sku: 'ST-501',
    barcode: '890123400006',
    purchasePrice: 1400,
    wholesalePrice: 1750,
    salePrice: 2150,
    stockLevel: 35,
    reorderPoint: 10,
    maxStock: 80,
    weight: '980g',
    size: 'M',
    colour: 'Matt Blue',
    category: 'Open Face',
    gearType: 'Helmets',
    description: 'Lightweight urban commuter helmet with high-density EPS liner, wide peripheral vision, and quick-release strap.',
    imageUrl: '',
    createdAt: '2026-07-12T12:00:00Z',
    updatedAt: '2026-07-29T10:00:00Z'
  },
  {
    id: 'hlm-107',
    productName: 'AGV K1 S Speed Red',
    brand: 'AGV',
    model: 'K1 S',
    sku: 'AGV-601',
    barcode: '890123400007',
    purchasePrice: 18500,
    wholesalePrice: 21000,
    salePrice: 24500,
    stockLevel: 5,
    reorderPoint: 3,
    maxStock: 15,
    weight: '1500g',
    size: 'L',
    colour: 'Speed Red / Black',
    category: 'Dual Sport',
    gearType: 'Helmets',
    description: 'MotoGP-derived aero spoiler, high-resistance thermoplastic shell, and 190° horizontal field of vision.',
    imageUrl: '',
    createdAt: '2026-07-15T09:00:00Z',
    updatedAt: '2026-07-29T10:00:00Z'
  },
  {
    id: 'hlm-108',
    productName: 'Arai Tour-X4 Adventure Matte White',
    brand: 'Arai',
    model: 'Tour-X4',
    sku: 'AR-701',
    barcode: '890123400008',
    purchasePrice: 42000,
    wholesalePrice: 48000,
    salePrice: 55000,
    stockLevel: 6,
    reorderPoint: 2,
    maxStock: 10,
    weight: '1620g',
    size: 'XL',
    colour: 'Matte White',
    category: 'Adventure',
    gearType: 'Helmets',
    description: 'Flagship adventure helmet built with Super Complex Laminate Construction (SCLC) for unmatched impact protection.',
    imageUrl: '',
    createdAt: '2026-07-20T14:30:00Z',
    updatedAt: '2026-07-29T10:00:00Z'
  },
  {
    id: 'hlm-109',
    productName: 'HJC RPHA 11 Carbon Solid',
    brand: 'HJC',
    model: 'RPHA 11',
    sku: 'HJC-801',
    barcode: '890123400009',
    purchasePrice: 28000,
    wholesalePrice: 32000,
    salePrice: 36500,
    stockLevel: 8,
    reorderPoint: 3,
    maxStock: 20,
    weight: '1250g',
    size: 'L',
    colour: 'Carbon Weave',
    category: 'Full Face',
    gearType: 'Helmets',
    description: 'Full Carbon Fiber Outer Shell racing helmet with RapidFire II visor replacement system and max airflow ventilation.',
    imageUrl: '',
    createdAt: '2026-07-22T08:00:00Z',
    updatedAt: '2026-07-29T10:00:00Z'
  }
];


export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Brake System', description: 'Disc pads, calipers, rotors, brake lines, and master cylinders.' },
  { id: 'cat-2', name: 'Engine Parts', description: 'Pistons, rings, valves, gaskets, filters, and spark plugs.' },
  { id: 'cat-3', name: 'Electrical', description: 'Stators, CDI units, wiring harnesses, starter motors, and batteries.' },
  { id: 'cat-4', name: 'Transmission', description: 'Chains, sprockets, clutches, gearbox gears, and belts.' },
  { id: 'cat-5', name: 'Suspension', description: 'Fork seals, shock absorbers, swingarms, and linkages.' },
  { id: 'cat-6', name: 'Filters', description: 'Air filters, oil filters, fuel filters.' },
  { id: 'cat-7', name: 'Wheels', description: 'Tires, rims, spokes, bearings, and axles.' },
  { id: 'cat-8', name: 'Body Parts', description: 'Fairings, mudguards, mirrors, frames.' },
  { id: 'cat-9', name: 'Accessories', description: 'Luggage racks, phone mounts, crash guards.' },
  { id: 'cat-10', name: 'Lubricants', description: 'Engine oil, chain lube, brake fluid, coolant.' },
  { id: 'cat-11', name: 'Others', description: 'General nuts, bolts, and miscellaneous washers.' }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'Nippon Performance Parts', email: 'orders@nipponparts.jp', phone: '+81-3-5555-0192', contactPerson: 'Takeshi Sato', leadTimeDays: 7 },
  { id: 'sup-2', name: 'Brembo Racing Supply', email: 'wholesale@bremboracing.it', phone: '+39-035-123456', contactPerson: 'Luca Rossi', leadTimeDays: 14 },
  { id: 'sup-3', name: 'Apex Drive Logistics', email: 'sales@apexdrive.com', phone: '+1-800-555-0143', contactPerson: 'Sarah Jenkins', leadTimeDays: 5 },
  { id: 'sup-4', name: 'MotoShield Electricals', email: 'support@motoshield.tw', phone: '+886-2-2777-1234', contactPerson: 'David Chen', leadTimeDays: 10 }
];

export const INITIAL_VEHICLES: VehicleModel[] = [
  { id: 'veh-1', make: 'Yamaha', model: 'YZF-R1', year: '2020-2024', engineCC: '998cc' },
  { id: 'veh-2', make: 'Honda', model: 'CB500X', year: '2019-2023', engineCC: '471cc' },
  { id: 'veh-3', make: 'Kawasaki', model: 'Ninja 400', year: '2018-2024', engineCC: '399cc' },
  { id: 'veh-4', make: 'Suzuki', model: 'V-Strom 650', year: '2017-2023', engineCC: '645cc' },
  { id: 'veh-5', make: 'KTM', model: 'Duke 390', year: '2020-2024', engineCC: '373cc' },
  { id: 'veh-6', make: 'Bajaj', model: 'Pulsar 150', year: '2015-2024', engineCC: '149.5cc' },
  { id: 'veh-7', make: 'Bajaj', model: 'Pulsar 180', year: '2015-2023', engineCC: '178.6cc' },
  { id: 'veh-8', make: 'Bajaj', model: 'Pulsar 220', year: '2016-2024', engineCC: '220cc' },
  { id: 'veh-9', make: 'Bajaj', model: 'Discover 150', year: '2014-2020', engineCC: '144.8cc' },
  { id: 'veh-10', make: 'TVS', model: 'Apache 200', year: '2018-2024', engineCC: '197.7cc' },
  { id: 'veh-11', make: 'Yamaha', model: 'FZSv3', year: '2019-2024', engineCC: '149cc' },
  { id: 'veh-12', make: 'Yamaha', model: 'FZS V4', year: '2023-2025', engineCC: '149cc' },
  { id: 'veh-13', make: 'Yamaha', model: 'Rayz', year: '2018-2024', engineCC: '125cc' },
  { id: 'veh-14', make: 'Honda', model: 'Dio', year: '2017-2024', engineCC: '109.5cc' },
  { id: 'veh-15', make: 'KTM', model: 'Duke 200', year: '2018-2024', engineCC: '199.5cc' },
  { id: 'veh-16', make: 'KTM', model: 'Duke 250', year: '2019-2024', engineCC: '248.8cc' },
  { id: 'veh-17', make: 'Royal Enfield', model: 'Bullet 350', year: '2016-2024', engineCC: '349cc' }
];

export const INITIAL_PARTS: Part[] = [
  {
    id: 'part-1', sku: 'BRK-PAD-YAM-001', name: 'Brembo Sintered Front Brake Pads',
    oemNumber: '4B8-W0045-00-00', categoryId: 'cat-1', supplierId: 'sup-2',
    costPrice: 42.50, wholesalePrice: 62.00, salePrice: 79.99,
    stockLevel: 14, reorderPoint: 15, maxStock: 100, unit: 'Set', binLocation: 'A-12-04',
    description: 'High-performance sintered brake pads for outstanding stopping power in both wet and dry conditions.',
    brand: 'Yamaha', barcode: '743210984321', imageUrl: '/parts_thumbnail.png',
    compatibilityIds: ['veh-1', 'veh-3']
  },
  {
    id: 'part-2', sku: 'ENG-PIS-HON-052', name: 'Honda OEM Piston Ring Set (STD)',
    oemNumber: '13011-MKP-D01', categoryId: 'cat-2', supplierId: 'sup-1',
    costPrice: 28.00, wholesalePrice: 38.50, salePrice: 49.95,
    stockLevel: 4, reorderPoint: 5, maxStock: 50, unit: 'Set', binLocation: 'B-03-11',
    description: 'Genuine Honda standard-size replacement piston rings. Pack of 2.',
    brand: 'Honda', barcode: '490250800123', imageUrl: '/parts_thumbnail.png',
    compatibilityIds: ['veh-2']
  },
  {
    id: 'part-3', sku: 'ELE-CDI-KAW-809', name: 'MotoShield Digital CDI Unit',
    oemNumber: '21119-0084', categoryId: 'cat-3', supplierId: 'sup-4',
    costPrice: 85.00, wholesalePrice: 125.00, salePrice: 159.00,
    stockLevel: 3, reorderPoint: 3, maxStock: 20, unit: 'Pcs', binLocation: 'C-01-02',
    description: 'Advanced microchip-controlled CDI unit with optimized ignition curves.',
    brand: 'Kawasaki', barcode: '071234567890', imageUrl: '/parts_thumbnail.png',
    compatibilityIds: ['veh-3']
  },
  {
    id: 'part-4', sku: 'DRV-CHN-DID-520', name: 'DID 520 VX3 Pro-Street X-Ring Chain',
    oemNumber: 'DID-520-VX3-120', categoryId: 'cat-4', supplierId: 'sup-3',
    costPrice: 55.00, wholesalePrice: 78.00, salePrice: 99.50,
    stockLevel: 25, reorderPoint: 10, maxStock: 150, unit: 'Pcs', binLocation: 'D-08-01',
    description: 'Gold & Black extreme longevity chain. 120 Links. Features patented X-ring sealing technology.',
    brand: 'Others', barcode: '880123456789', imageUrl: '/parts_thumbnail.png',
    compatibilityIds: ['veh-1', 'veh-2', 'veh-3', 'veh-4', 'veh-5']
  },
  {
    id: 'part-5', sku: 'SUS-FSE-NOK-041', name: 'NOK Fork Seal Kit 41mm',
    oemNumber: '51153-14D00', categoryId: 'cat-5', supplierId: 'sup-1',
    costPrice: 12.00, wholesalePrice: 18.00, salePrice: 24.99,
    stockLevel: 30, reorderPoint: 12, maxStock: 200, unit: 'Set', binLocation: 'A-02-15',
    description: 'Japanese-made premium fork seals and dust covers. Kit contains seals for both fork legs.',
    brand: 'Suzuki', barcode: '497123456789', imageUrl: '/parts_thumbnail.png',
    compatibilityIds: ['veh-2', 'veh-4']
  },
  {
    id: 'part-6', sku: 'ENG-FLT-KNE-044', name: 'K&N Premium Oil Filter KN-204',
    oemNumber: 'KN-204-C', categoryId: 'cat-6', supplierId: 'sup-3',
    costPrice: 7.50, wholesalePrice: 12.00, salePrice: 16.95,
    stockLevel: 45, reorderPoint: 20, maxStock: 300, unit: 'Pcs', binLocation: 'B-01-04',
    description: 'High-flow oil filter with heavy-duty construction and 17mm hex nut for easy removal.',
    brand: 'Honda', barcode: '024844002046', imageUrl: '/parts_thumbnail.png',
    compatibilityIds: ['veh-1', 'veh-2', 'veh-3', 'veh-4']
  },
  {
    id: 'part-7', sku: 'ENG-SPK-NGK-009', name: 'NGK Laser Iridium Spark Plug LMAR8A-9',
    oemNumber: 'NGK-LMAR8A9', categoryId: 'cat-2', supplierId: 'sup-1',
    costPrice: 9.80, wholesalePrice: 14.50, salePrice: 19.99,
    stockLevel: 62, reorderPoint: 30, maxStock: 500, unit: 'Pcs', binLocation: 'B-02-09',
    description: 'Laser iridium tipped spark plug for extreme combustion efficiency and longer life.',
    brand: 'KTM', barcode: '087295948911', imageUrl: '/parts_thumbnail.png',
    compatibilityIds: ['veh-1', 'veh-2', 'veh-5']
  },
  {
    id: 'part-8', sku: 'DRV-SPR-JTR-130', name: 'JT Rear Steel Sprocket 45T',
    oemNumber: 'JTR1304.45', categoryId: 'cat-4', supplierId: 'sup-3',
    costPrice: 22.00, wholesalePrice: 31.00, salePrice: 42.50,
    stockLevel: 8, reorderPoint: 8, maxStock: 40, unit: 'Pcs', binLocation: 'D-02-04',
    description: 'High-carbon steel rear sprocket. 45 teeth, 520 pitch.',
    brand: 'Bajaj', barcode: '501234567890', imageUrl: '/parts_thumbnail.png',
    compatibilityIds: ['veh-2', 'veh-5']
  },
  {
    id: 'part-9', sku: 'ELE-BAT-YUA-012', name: 'Yuasa YTZ10S Factory Activated Battery',
    oemNumber: 'YTZ10S-BS', categoryId: 'cat-3', supplierId: 'sup-4',
    costPrice: 65.00, wholesalePrice: 92.00, salePrice: 119.99,
    stockLevel: 0, reorderPoint: 6, maxStock: 30, unit: 'Pcs', binLocation: 'C-04-10',
    description: 'Absorbed Glass Mat (AGM) high-performance maintenance-free battery. Spillsafe design.',
    brand: 'Yamaha', barcode: '497665012345', imageUrl: '/parts_thumbnail.png',
    compatibilityIds: ['veh-1', 'veh-5']
  },
  {
    id: 'part-10', sku: 'SUS-SHK-YSS-456', name: 'YSS Top-Line Mono Shock Absorber',
    oemNumber: 'MZ456-310TRL', categoryId: 'cat-5', supplierId: 'sup-1',
    costPrice: 240.00, wholesalePrice: 325.00, salePrice: 419.00,
    stockLevel: 2, reorderPoint: 2, maxStock: 10, unit: 'Pcs', binLocation: 'E-01-02',
    description: 'Gas-charged rear monoshock with rebound, preload, and length adjustments.',
    brand: 'Suzuki', barcode: '885871234567', imageUrl: '/parts_thumbnail.png',
    compatibilityIds: ['veh-2', 'veh-4']
  }
];

// ─── 12-Month Rich Sales Order History ────────────────────────────────────────
export const INITIAL_SALES_ORDERS: SalesOrder[] = [
  // August 2025
  { id: 'so-101', customerName: 'DownTown Moto Workshop', status: 'DELIVERED', saleDate: '2025-08-05', totalAmount: 359.47 },
  { id: 'so-102', customerName: 'Road & Track Rentals', status: 'DELIVERED', saleDate: '2025-08-12', totalAmount: 638.00 },
  { id: 'so-103', customerName: 'SpeedZone Garage', status: 'DELIVERED', saleDate: '2025-08-22', totalAmount: 249.90 },
  // September 2025
  { id: 'so-104', customerName: 'MegaMoto Parts Hub', status: 'DELIVERED', saleDate: '2025-09-03', totalAmount: 1199.50 },
  { id: 'so-105', customerName: 'Alex Mercer (Retail)', status: 'DELIVERED', saleDate: '2025-09-14', totalAmount: 79.99 },
  { id: 'so-106', customerName: 'DownTown Moto Workshop', status: 'DELIVERED', saleDate: '2025-09-28', totalAmount: 834.00 },
  // October 2025
  { id: 'so-107', customerName: 'Road & Track Rentals', status: 'DELIVERED', saleDate: '2025-10-07', totalAmount: 1478.50 },
  { id: 'so-108', customerName: 'City Bikes Pvt Ltd', status: 'DELIVERED', saleDate: '2025-10-19', totalAmount: 423.80 },
  // November 2025
  { id: 'so-109', customerName: 'SpeedZone Garage', status: 'DELIVERED', saleDate: '2025-11-02', totalAmount: 998.00 },
  { id: 'so-110', customerName: 'MegaMoto Parts Hub', status: 'DELIVERED', saleDate: '2025-11-15', totalAmount: 1750.45 },
  { id: 'so-111', customerName: 'Alex Mercer (Retail)', status: 'DELIVERED', saleDate: '2025-11-27', totalAmount: 159.00 },
  // December 2025
  { id: 'so-112', customerName: 'DownTown Moto Workshop', status: 'DELIVERED', saleDate: '2025-12-03', totalAmount: 2100.00 },
  { id: 'so-113', customerName: 'Road & Track Rentals', status: 'DELIVERED', saleDate: '2025-12-18', totalAmount: 896.50 },
  { id: 'so-114', customerName: 'City Bikes Pvt Ltd', status: 'DELIVERED', saleDate: '2025-12-29', totalAmount: 319.90 },
  // January 2026
  { id: 'so-115', customerName: 'SpeedZone Garage', status: 'DELIVERED', saleDate: '2026-01-08', totalAmount: 1320.00 },
  { id: 'so-116', customerName: 'MegaMoto Parts Hub', status: 'DELIVERED', saleDate: '2026-01-21', totalAmount: 599.75 },
  // February 2026
  { id: 'so-117', customerName: 'DownTown Moto Workshop', status: 'DELIVERED', saleDate: '2026-02-05', totalAmount: 1089.00 },
  { id: 'so-118', customerName: 'Alex Mercer (Retail)', status: 'DELIVERED', saleDate: '2026-02-19', totalAmount: 239.90 },
  // March 2026
  { id: 'so-119', customerName: 'Road & Track Rentals', status: 'DELIVERED', saleDate: '2026-03-04', totalAmount: 2340.00 },
  { id: 'so-120', customerName: 'City Bikes Pvt Ltd', status: 'DELIVERED', saleDate: '2026-03-17', totalAmount: 756.80 },
  { id: 'so-121', customerName: 'SpeedZone Garage', status: 'DELIVERED', saleDate: '2026-03-28', totalAmount: 469.50 },
  // April 2026
  { id: 'so-122', customerName: 'MegaMoto Parts Hub', status: 'DELIVERED', saleDate: '2026-04-09', totalAmount: 1678.00 },
  { id: 'so-123', customerName: 'DownTown Moto Workshop', status: 'DELIVERED', saleDate: '2026-04-23', totalAmount: 894.95 },
  // May 2026
  { id: 'so-124', customerName: 'Road & Track Rentals', status: 'DELIVERED', saleDate: '2026-05-06', totalAmount: 3100.00 },
  { id: 'so-125', customerName: 'Alex Mercer (Retail)', status: 'DELIVERED', saleDate: '2026-05-18', totalAmount: 99.50 },
  { id: 'so-126', customerName: 'City Bikes Pvt Ltd', status: 'DELIVERED', saleDate: '2026-05-29', totalAmount: 1247.00 },
  // June 2026
  { id: 'so-127', customerName: 'SpeedZone Garage', status: 'DELIVERED', saleDate: '2026-06-03', totalAmount: 2198.00 },
  { id: 'so-128', customerName: 'MegaMoto Parts Hub', status: 'DELIVERED', saleDate: '2026-06-14', totalAmount: 1350.00 },
  { id: 'so-129', customerName: 'DownTown Moto Workshop', status: 'DELIVERED', saleDate: '2026-06-25', totalAmount: 680.00 },
  // July 2026 (recent)
  { id: 'so-201', customerName: 'DownTown Moto Workshop', status: 'DELIVERED', saleDate: '2026-07-10', totalAmount: 359.47 },
  { id: 'so-202', customerName: 'Road & Track Rentals', status: 'DISPATCHED', saleDate: '2026-07-16', totalAmount: 1478.50 },
  { id: 'so-203', customerName: 'Alex Mercer (Retail)', status: 'PENDING', saleDate: '2026-07-18', totalAmount: 79.99 },
];

export const INITIAL_SALES_ORDER_ITEMS: SalesOrderItem[] = [
  // Legacy items
  { id: 'soi-101', salesOrderId: 'so-101', partId: 'part-1', quantity: 2, unitPrice: 79.99 },
  { id: 'soi-102', salesOrderId: 'so-101', partId: 'part-4', quantity: 2, unitPrice: 99.50 },
  { id: 'soi-103', salesOrderId: 'so-102', partId: 'part-6', quantity: 12, unitPrice: 16.95 },
  { id: 'soi-104', salesOrderId: 'so-102', partId: 'part-7', quantity: 20, unitPrice: 19.99 },
  { id: 'soi-105', salesOrderId: 'so-103', partId: 'part-5', quantity: 10, unitPrice: 24.99 },
  { id: 'soi-106', salesOrderId: 'so-104', partId: 'part-10', quantity: 2, unitPrice: 419.00 },
  { id: 'soi-107', salesOrderId: 'so-104', partId: 'part-8', quantity: 5, unitPrice: 42.50 },
  { id: 'soi-108', salesOrderId: 'so-104', partId: 'part-3', quantity: 1, unitPrice: 159.00 },
  { id: 'soi-109', salesOrderId: 'so-105', partId: 'part-1', quantity: 1, unitPrice: 79.99 },
  { id: 'soi-110', salesOrderId: 'so-106', partId: 'part-9', quantity: 4, unitPrice: 119.99 },
  { id: 'soi-111', salesOrderId: 'so-106', partId: 'part-2', quantity: 8, unitPrice: 49.95 },
  { id: 'soi-112', salesOrderId: 'so-107', partId: 'part-10', quantity: 3, unitPrice: 419.00 },
  { id: 'soi-113', salesOrderId: 'so-107', partId: 'part-8', quantity: 5, unitPrice: 42.50 },
  { id: 'soi-114', salesOrderId: 'so-108', partId: 'part-7', quantity: 12, unitPrice: 19.99 },
  { id: 'soi-115', salesOrderId: 'so-108', partId: 'part-5', quantity: 8, unitPrice: 24.99 },
  { id: 'soi-116', salesOrderId: 'so-109', partId: 'part-4', quantity: 6, unitPrice: 99.50 },
  { id: 'soi-117', salesOrderId: 'so-109', partId: 'part-6', quantity: 20, unitPrice: 16.95 },
  { id: 'soi-118', salesOrderId: 'so-110', partId: 'part-10', quantity: 3, unitPrice: 419.00 },
  { id: 'soi-119', salesOrderId: 'so-110', partId: 'part-9', quantity: 5, unitPrice: 119.99 },
  { id: 'soi-120', salesOrderId: 'so-110', partId: 'part-3', quantity: 2, unitPrice: 159.00 },
  { id: 'soi-121', salesOrderId: 'so-111', partId: 'part-3', quantity: 1, unitPrice: 159.00 },
  { id: 'soi-122', salesOrderId: 'so-112', partId: 'part-10', quantity: 5, unitPrice: 419.00 },
  { id: 'soi-123', salesOrderId: 'so-113', partId: 'part-4', quantity: 9, unitPrice: 99.50 },
  { id: 'soi-124', salesOrderId: 'so-114', partId: 'part-7', quantity: 16, unitPrice: 19.99 },
  { id: 'soi-125', salesOrderId: 'so-115', partId: 'part-9', quantity: 4, unitPrice: 119.99 },
  { id: 'soi-126', salesOrderId: 'so-115', partId: 'part-10', quantity: 2, unitPrice: 419.00 },
  { id: 'soi-127', salesOrderId: 'so-116', partId: 'part-1', quantity: 5, unitPrice: 79.99 },
  { id: 'soi-128', salesOrderId: 'so-116', partId: 'part-6', quantity: 15, unitPrice: 16.95 },
  { id: 'soi-129', salesOrderId: 'so-117', partId: 'part-10', quantity: 2, unitPrice: 419.00 },
  { id: 'soi-130', salesOrderId: 'so-117', partId: 'part-4', quantity: 2, unitPrice: 99.50 },
  { id: 'soi-131', salesOrderId: 'so-118', partId: 'part-7', quantity: 12, unitPrice: 19.99 },
  { id: 'soi-132', salesOrderId: 'so-119', partId: 'part-10', quantity: 4, unitPrice: 419.00 },
  { id: 'soi-133', salesOrderId: 'so-119', partId: 'part-9', quantity: 6, unitPrice: 119.99 },
  { id: 'soi-134', salesOrderId: 'so-120', partId: 'part-4', quantity: 4, unitPrice: 99.50 },
  { id: 'soi-135', salesOrderId: 'so-120', partId: 'part-6', quantity: 20, unitPrice: 16.95 },
  { id: 'soi-136', salesOrderId: 'so-121', partId: 'part-8', quantity: 6, unitPrice: 42.50 },
  { id: 'soi-137', salesOrderId: 'so-121', partId: 'part-5', quantity: 10, unitPrice: 24.99 },
  { id: 'soi-138', salesOrderId: 'so-122', partId: 'part-10', quantity: 4, unitPrice: 419.00 },
  { id: 'soi-139', salesOrderId: 'so-123', partId: 'part-9', quantity: 5, unitPrice: 119.99 },
  { id: 'soi-140', salesOrderId: 'so-123', partId: 'part-1', quantity: 3, unitPrice: 79.99 },
  { id: 'soi-141', salesOrderId: 'so-124', partId: 'part-10', quantity: 5, unitPrice: 419.00 },
  { id: 'soi-142', salesOrderId: 'so-124', partId: 'part-9', quantity: 8, unitPrice: 119.99 },
  { id: 'soi-143', salesOrderId: 'so-125', partId: 'part-4', quantity: 1, unitPrice: 99.50 },
  { id: 'soi-144', salesOrderId: 'so-126', partId: 'part-10', quantity: 2, unitPrice: 419.00 },
  { id: 'soi-145', salesOrderId: 'so-126', partId: 'part-3', quantity: 2, unitPrice: 159.00 },
  { id: 'soi-146', salesOrderId: 'so-126', partId: 'part-9', quantity: 2, unitPrice: 119.99 },
  { id: 'soi-147', salesOrderId: 'so-127', partId: 'part-10', quantity: 3, unitPrice: 419.00 },
  { id: 'soi-148', salesOrderId: 'so-127', partId: 'part-4', quantity: 8, unitPrice: 99.50 },
  { id: 'soi-149', salesOrderId: 'so-128', partId: 'part-9', quantity: 6, unitPrice: 119.99 },
  { id: 'soi-150', salesOrderId: 'so-128', partId: 'part-10', quantity: 2, unitPrice: 419.00 },
  { id: 'soi-151', salesOrderId: 'so-129', partId: 'part-1', quantity: 4, unitPrice: 79.99 },
  { id: 'soi-152', salesOrderId: 'so-129', partId: 'part-7', quantity: 18, unitPrice: 19.99 },
  // Current month items
  { id: 'soi-1', salesOrderId: 'so-201', partId: 'part-1', quantity: 2, unitPrice: 79.99 },
  { id: 'soi-2', salesOrderId: 'so-201', partId: 'part-4', quantity: 2, unitPrice: 99.50 },
  { id: 'soi-3', salesOrderId: 'so-202', partId: 'part-10', quantity: 3, unitPrice: 419.00 },
  { id: 'soi-4', salesOrderId: 'so-202', partId: 'part-8', quantity: 5, unitPrice: 42.50 },
  { id: 'soi-5', salesOrderId: 'so-203', partId: 'part-1', quantity: 1, unitPrice: 79.99 },
];

// ─── 12-Month Rich Purchase Order History ─────────────────────────────────────
export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  // Aug 2025
  { id: 'po-001', supplierId: 'sup-2', status: 'RECEIVED', orderDate: '2025-08-01', expectedDelivery: '2025-08-15', totalAmount: 850.00 },
  { id: 'po-002', supplierId: 'sup-1', status: 'RECEIVED', orderDate: '2025-08-20', expectedDelivery: '2025-08-27', totalAmount: 490.00 },
  // Sep 2025
  { id: 'po-003', supplierId: 'sup-3', status: 'RECEIVED', orderDate: '2025-09-05', expectedDelivery: '2025-09-10', totalAmount: 1100.00 },
  { id: 'po-004', supplierId: 'sup-4', status: 'RECEIVED', orderDate: '2025-09-22', expectedDelivery: '2025-10-02', totalAmount: 650.00 },
  // Oct 2025
  { id: 'po-005', supplierId: 'sup-1', status: 'RECEIVED', orderDate: '2025-10-08', expectedDelivery: '2025-10-15', totalAmount: 756.00 },
  { id: 'po-006', supplierId: 'sup-2', status: 'RECEIVED', orderDate: '2025-10-25', expectedDelivery: '2025-11-08', totalAmount: 425.00 },
  // Nov 2025
  { id: 'po-007', supplierId: 'sup-3', status: 'RECEIVED', orderDate: '2025-11-10', expectedDelivery: '2025-11-15', totalAmount: 2200.00 },
  { id: 'po-008', supplierId: 'sup-4', status: 'RECEIVED', orderDate: '2025-11-28', expectedDelivery: '2025-12-08', totalAmount: 780.00 },
  // Dec 2025
  { id: 'po-009', supplierId: 'sup-1', status: 'RECEIVED', orderDate: '2025-12-02', expectedDelivery: '2025-12-09', totalAmount: 980.00 },
  { id: 'po-010', supplierId: 'sup-2', status: 'RECEIVED', orderDate: '2025-12-15', expectedDelivery: '2025-12-29', totalAmount: 850.00 },
  // Jan 2026
  { id: 'po-011', supplierId: 'sup-3', status: 'RECEIVED', orderDate: '2026-01-07', expectedDelivery: '2026-01-12', totalAmount: 660.00 },
  { id: 'po-012', supplierId: 'sup-4', status: 'RECEIVED', orderDate: '2026-01-20', expectedDelivery: '2026-01-30', totalAmount: 1040.00 },
  // Feb 2026
  { id: 'po-013', supplierId: 'sup-1', status: 'RECEIVED', orderDate: '2026-02-03', expectedDelivery: '2026-02-10', totalAmount: 588.00 },
  // Mar 2026
  { id: 'po-014', supplierId: 'sup-3', status: 'RECEIVED', orderDate: '2026-03-10', expectedDelivery: '2026-03-15', totalAmount: 3300.00 },
  { id: 'po-015', supplierId: 'sup-2', status: 'RECEIVED', orderDate: '2026-03-25', expectedDelivery: '2026-04-08', totalAmount: 680.00 },
  // Apr 2026
  { id: 'po-016', supplierId: 'sup-4', status: 'RECEIVED', orderDate: '2026-04-12', expectedDelivery: '2026-04-22', totalAmount: 1300.00 },
  // May 2026
  { id: 'po-017', supplierId: 'sup-1', status: 'RECEIVED', orderDate: '2026-05-05', expectedDelivery: '2026-05-12', totalAmount: 880.00 },
  { id: 'po-018', supplierId: 'sup-3', status: 'RECEIVED', orderDate: '2026-05-20', expectedDelivery: '2026-05-25', totalAmount: 4400.00 },
  // Jun 2026
  { id: 'po-019', supplierId: 'sup-2', status: 'RECEIVED', orderDate: '2026-06-08', expectedDelivery: '2026-06-22', totalAmount: 850.00 },
  { id: 'po-020', supplierId: 'sup-4', status: 'RECEIVED', orderDate: '2026-06-20', expectedDelivery: '2026-06-30', totalAmount: 1950.00 },
  // Jul 2026 (current)
  { id: 'po-101', supplierId: 'sup-2', status: 'RECEIVED', orderDate: '2026-07-02', expectedDelivery: '2026-07-16', totalAmount: 425.00 },
  { id: 'po-102', supplierId: 'sup-4', status: 'SENT', orderDate: '2026-07-12', expectedDelivery: '2026-07-22', totalAmount: 1040.00 },
  { id: 'po-103', supplierId: 'sup-1', status: 'DRAFT', orderDate: '2026-07-17', expectedDelivery: '2026-07-24', totalAmount: 396.00 }
];

export const INITIAL_PURCHASE_ORDER_ITEMS: PurchaseOrderItem[] = [
  { id: 'poi-1', orderId: 'po-101', partId: 'part-1', quantity: 10, unitCost: 42.50 },
  { id: 'poi-2', orderId: 'po-102', partId: 'part-9', quantity: 16, unitCost: 65.00 },
  { id: 'poi-3', orderId: 'po-103', partId: 'part-2', quantity: 10, unitCost: 28.00 },
  { id: 'poi-4', orderId: 'po-103', partId: 'part-7', quantity: 10, unitCost: 9.80 }
];

// ─── Phase 2: Seeding logs ───────────────────────────────────────────────────
export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  { id: 'sm-1', partId: 'part-1', type: 'MANUAL_ADJUST', quantity: 6, timestamp: '2026-07-01T10:00:00Z', referenceId: 'MANUAL', notes: 'Initial stock load adjustment' },
  { id: 'sm-2', partId: 'part-1', type: 'PO_RECEIVED', quantity: 10, timestamp: '2026-07-16T15:30:00Z', referenceId: 'po-101', notes: 'Received Restock PO' },
  { id: 'sm-3', partId: 'part-1', type: 'SALE_DISPATCHED', quantity: -2, timestamp: '2026-07-10T09:15:00Z', referenceId: 'so-201', notes: 'Fulfilled DownTown Moto Workshop order' },
  { id: 'sm-4', partId: 'part-2', type: 'MANUAL_ADJUST', quantity: 4, timestamp: '2026-07-02T11:00:00Z', referenceId: 'MANUAL', notes: 'Stock counting correction' },
  { id: 'sm-5', partId: 'part-9', type: 'MANUAL_ADJUST', quantity: 0, timestamp: '2026-07-03T14:00:00Z', referenceId: 'MANUAL', notes: 'Marked as out of stock' }
];

export const INITIAL_HISTORY_LOGS: ProductHistoryLog[] = [
  { id: 'ph-1', partId: 'part-1', changeType: 'CREATED', timestamp: '2026-07-01T09:00:00Z', user: 'Pankaj.ydv707@gmail.com', details: 'Part catalogued in system database.' },
  { id: 'ph-2', partId: 'part-1', changeType: 'EDITED', timestamp: '2026-07-05T12:00:00Z', user: 'Pankaj.ydv707@gmail.com', details: 'Updated Bin Location from B-12 to A-12-04.' },
  { id: 'ph-3', partId: 'part-2', changeType: 'CREATED', timestamp: '2026-07-02T10:30:00Z', user: 'Pankaj.ydv707@gmail.com', details: 'Part catalogued in system database.' }
];

// ─── Phase 4: Customers ───────────────────────────────────────────────────────
export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cust-1', name: 'DownTown Moto Workshop', email: 'orders@dtmoto.com', phone: '+60-3-2145-6789', address: '12 Jalan Bukit Bintang, Kuala Lumpur', type: 'TRADE', notes: 'Primary trade customer. Net-30 credit terms.', createdAt: '2026-01-15T09:00:00Z' },
  { id: 'cust-2', name: 'SpeedKings Racing', email: 'parts@speedkings.my', phone: '+60-4-7123-4567', address: '88 Jalan Raja Laut, Penang', type: 'WHOLESALE', notes: 'Bulk orders for racing season. Priority customer.', createdAt: '2026-02-01T10:30:00Z' },
  { id: 'cust-3', name: 'Ahmad Faruqi', email: 'ahmad.faruqi@gmail.com', phone: '+60-12-345-6789', address: '45 Taman Melati, Ampang', type: 'RETAIL', notes: 'Regular retail buyer. Honda CB500X enthusiast.', createdAt: '2026-03-10T14:00:00Z' },
  { id: 'cust-4', name: 'MotoFix Garage Klang', email: 'motofix.klang@gmail.com', phone: '+60-3-3371-9900', address: '7 Jalan Meru, Klang', type: 'TRADE', notes: 'Workshop specializing in Kawasaki & Suzuki.', createdAt: '2026-04-05T11:00:00Z' },
  { id: 'cust-5', name: 'Hafiz Motorsports', email: 'hafiz@hafizmotors.com', phone: '+60-11-2233-4455', address: '23 Jalan Cheras, Kuala Lumpur', type: 'WHOLESALE', notes: 'Preferred wholesale discount 15%.', createdAt: '2026-05-20T09:00:00Z' },
  { id: 'cust-6', name: 'Lee Ming Parts Sdn Bhd', email: 'lee.ming@leeparts.com.my', phone: '+60-3-7887-1122', address: '55 Jalan SS2, Petaling Jaya', type: 'TRADE', notes: 'Premium trade partner.', createdAt: '2026-06-01T08:00:00Z' }
];

// ─── Phase 4: Returns ────────────────────────────────────────────────────────
export const INITIAL_RETURNS: Return[] = [
  {
    id: 'ret-1',
    returnNumber: 'RET-2026-00001',
    originalSalesOrderId: 'so-201',
    customerId: 'cust-1',
    customerName: 'DownTown Moto Workshop',
    items: [{ partId: 'part-1', partName: 'Brembo Sintered Front Brake Pads', quantity: 1, unitPrice: 79.99 }],
    reason: 'Wrong specification ordered - needed rear pads instead.',
    type: 'EXCHANGE',
    status: 'COMPLETED',
    refundAmount: 79.99,
    restockItems: true,
    createdAt: '2026-07-10T14:00:00Z'
  }
];

// ─── Phase 4: Damaged Stock ───────────────────────────────────────────────────
export const INITIAL_DAMAGED_STOCK: DamagedStock[] = [
  {
    id: 'dmg-1',
    reportNumber: 'DMG-2026-00001',
    partId: 'part-3',
    partName: 'NGK Iridium Spark Plug CR9EIX',
    quantity: 2,
    reason: 'Received broken from supplier packaging - transit damage.',
    reportedBy: 'Pankaj.ydv707@gmail.com',
    timestamp: '2026-07-05T10:00:00Z',
    resolved: true,
    estimatedLoss: 34.00
  }
];

// ─── Phase 4: Stock Adjustments ───────────────────────────────────────────────
export const INITIAL_STOCK_ADJUSTMENTS: StockAdjustment[] = [
  {
    id: 'adj-1',
    adjustmentNumber: 'ADJ-2026-00001',
    partId: 'part-1',
    partName: 'Brembo Sintered Front Brake Pads',
    previousQty: 10,
    adjustedQty: 14,
    delta: 4,
    reason: 'Physical stock count discrepancy corrected after quarterly audit.',
    type: 'ADDITION',
    adjustedBy: 'Pankaj.ydv707@gmail.com',
    timestamp: '2026-07-01T09:30:00Z'
  },
  {
    id: 'adj-2',
    adjustmentNumber: 'ADJ-2026-00002',
    partId: 'part-4',
    partName: 'KTM Stator Coil Generator',
    previousQty: 5,
    adjustedQty: 4,
    delta: -1,
    reason: 'Write-off — display unit used for showroom demo.',
    type: 'REDUCTION',
    adjustedBy: 'Pankaj.ydv707@gmail.com',
    timestamp: '2026-07-08T15:00:00Z'
  }
];

// ─── Phase 4: Notifications ───────────────────────────────────────────────────
export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'LOW_STOCK',
    title: 'Restock Soon',
    message: 'Brembo Sintered Front Brake Pads (BRK-PAD-YAM-001) is below reorder point. Current: 14, Min: 15.',
    referenceId: 'part-1',
    isRead: false,
    createdAt: '2026-07-18T08:00:00Z',
    priority: 'HIGH',
    navigateTo: 'inventory'
  },
  {
    id: 'notif-2',
    type: 'OUT_OF_STOCK',
    title: 'Out of Stock Items — Immediate Attention Required',
    message: 'KTM Stator Coil Generator (ELC-STA-KTM-009) is completely out of stock. Immediate reorder required.',
    referenceId: 'part-9',
    isRead: false,
    createdAt: '2026-07-17T14:30:00Z',
    priority: 'HIGH',
    navigateTo: 'inventory'
  },
  {
    id: 'notif-3',
    type: 'NEW_SALE',
    title: 'New Sale Created',
    message: 'Invoice recorded for SpeedKings Racing — $2,450.00. Order #so-215.',
    referenceId: 'so-215',
    isRead: false,
    createdAt: '2026-07-18T10:15:00Z',
    priority: 'LOW',
    navigateTo: 'sales'
  },
  {
    id: 'notif-4',
    type: 'PO_DELIVERY',
    title: 'Purchase Order Received',
    message: 'PO #po-101 from Brembo Racing Supply received. 10 items restocked to inventory.',
    referenceId: 'po-101',
    isRead: true,
    createdAt: '2026-07-16T15:30:00Z',
    priority: 'MEDIUM',
    navigateTo: 'suppliers'
  },
  {
    id: 'notif-5',
    type: 'RETURN',
    title: 'Return Request Approved',
    message: 'RET-2026-00001 from DownTown Moto Workshop processed. 1 × Brake Pads restocked.',
    referenceId: 'ret-1',
    isRead: true,
    createdAt: '2026-07-10T14:00:00Z',
    priority: 'MEDIUM',
    navigateTo: 'returns'
  },
  {
    id: 'notif-6',
    type: 'DAMAGED_STOCK',
    title: 'Damaged Stock Reported',
    message: 'DMG-2026-00001: 2× NGK Iridium Spark Plugs written off. Estimated loss: $34.00.',
    referenceId: 'dmg-1',
    isRead: true,
    createdAt: '2026-07-05T10:00:00Z',
    priority: 'MEDIUM',
    navigateTo: 'returns'
  },
  {
    id: 'notif-7',
    type: 'STOCK_ADJUST',
    title: 'Stock Adjustment Applied',
    message: 'ADJ-2026-00001: Brembo Brake Pads adjusted +4 units after quarterly audit. New stock: 14.',
    referenceId: 'adj-1',
    isRead: true,
    createdAt: '2026-07-01T09:30:00Z',
    priority: 'LOW',
    navigateTo: 'returns'
  }
];
