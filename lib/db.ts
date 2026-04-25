import Dexie, { type Table } from 'dexie';

// ─── الجداول الأساسية ────────────────────────────────────────
export interface Order {
  id?: number;
  orderNumber: string;
  type: string;
  items: any[];
  totalAmount: number;
  paymentMethod: string;
  cashAmount: number;
  bankAmount: number;
  createdAt: string;
  isSynced: boolean;
  status: string;
  branchId: string;
  customerName?: string;
  tableNumber?: string;
}

export interface InventoryItem {
  id?: number;
  name: string;
  category: string;
  unit: string;
  qty: number;
  min: number;
  avgPrice: number;
  isSynced: boolean;
  branchQtys?: Record<string, number>;
}

export interface TreasuryLog {
  id?: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  isSynced: boolean;
  branchId: string;
}

export interface Invoice {
  id?: string;
  supplier: string;
  itemId: number;
  qty: number;
  unitPrice: number;
  date: string;
  status: "قيد المراجعة" | "معتمدة";
  isSynced: boolean;
}

export interface BranchRequest {
  id?: string;
  branch: string;
  itemId: number;
  qtyRequested: number;
  status: "جديد" | "منفذ";
  isSynced: boolean;
}

// ─── جداول جديدة للتكامل بين الأقسام ────────────────────────

export interface Employee {
  id: string;           // "EMP-XXX"
  name: string;
  phone: string;
  dob: string;
  branch: string;
  role: string;
  accessLevel: string;
  pin: string;
  baseSalary: number;
  deductHalfDay: number;
  deductFullDay: number;
  mealsEnabled: boolean;
  mealsLimit: number;
  cashWithdrawEnabled: boolean;
  cashWithdrawLimit: number;
  totalAdvance: number;
  monthlyAdvanceCut: number;
  avatar: string;
  documentId: string;
  createdAt: string;
}

export interface HRDeduction {
  id?: number;
  empName: string;
  empId: string;
  amount: number;
  reason: string;
  branch: string;
  createdAt: string;
  status: "مسجل" | "مُعتمد" | "مُطبَّق";
}

export interface TillTransfer {
  id?: number;
  fromTill: string;
  toTill: string;
  fromUser: string;
  toUser: string;
  amount: number;
  branchId: string;
  createdAt: string;
}

export interface ShiftLog {
  id?: number;
  cashierName: string;
  tillNo: string;
  date: string;
  openingBalance: number;
  deliveredAmount: number;
  expectedBalance: number;
  deficit: number;
  surplus: number;
  branchId: string;
}

export interface MenuItem {
  id?: number;
  name: string;
  category: string;
  price: number;
  image: string;
  ingredients: { itemId: number; name: string; qty: number; unit: string; costPerUnit: number }[];
  cost: number;
  isAvailable: boolean;
}

export interface TreasuryOutgoing {
  id?: number;
  type: string; // مشتريات | مصروفات عامة | رواتب | مسحوبات شخصية | أقساط وجمعيات
  amount: number;
  description: string;
  branch: string;
  payeeName?: string;
  referenceNo?: string;
  date: string;
  notes?: string;
  createdAt: string;
  isSynced: boolean;
}

export interface TreasuryIncoming {
  id?: number;
  type: string; // تحصيل مبيعات | إيجار | إيراد خارجي | نقل بين خزائن
  amount: number;
  description: string;
  branch: string;
  date: string;
  notes?: string;
  createdAt: string;
  isSynced: boolean;
}

// ─── موردون ─────────────────────────────────────────────
export interface Supplier {
  id?: number;
  name: string;
  phone?: string;
  address?: string;
  category?: string;    // فئة المورد (لحوم، مخبوزات، ...)
  notes?: string;
  createdAt: string;
}

// ─── طلبات شراء من أمين المخزن ────────────────────────────
export interface PurchaseRequest {
  id?: number;
  requestNumber: string;
  supplierId?: number;
  supplierName: string;
  itemId?: number;
  itemName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  branch: string;
  notes?: string;
  status: "معلق" | "معتمد - دين" | "معتمد - صرف" | "مرفوض";
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  paymentOrderId?: number;
}

// ─── أوامر الصرف (تُنشأ من المدير عند اعتماد الصرف) ────────────
export interface PaymentOrder {
  id?: number;
  voucherNumber: string;
  purchaseRequestId: number;
  requestNumber: string;
  supplierName: string;
  itemName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  branch: string;
  status: "بانتظار الخزينة" | "تم الصرف" | "مرفوض";
  createdAt: string;
  paidAt?: string;
  paidBy?: string;
  notes?: string;
}

// ─── عملاء مركز الاتصالات ────────────────────────────────────────
export interface Customer {
  id?: number;
  name: string;
  phone: string;           // مفتاح التعريف الأساسي
  address?: string;
  preferredBranch?: string;
  notes?: string;
  totalOrders: number;
  lastOrderAt: string;
  createdAt: string;
}

// ─── طلبات مركز الاتصالات ────────────────────────────────────────
export interface CallCenterOrder {
  id?: number;
  orderNumber: string;          // رقم الطلب التسلسلي
  customerName: string;
  customerPhone: string;
  targetBranch: string;          // الفرع المستهدف
  orderType: "توصيل" | "استلام من الفرع";
  address?: string;
  items: any[];
  totalAmount: number;
  notes?: string;
  status: "جديد" | "موافق عليه" | "مرفوض" | "مكتمل";
  agentName: string;             // اسم موظف مركز الاتصالات
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;           // اسم الكاشير الذي وافق
}

export interface SystemSetting {
  id: string; // The key e.g., 'system_settings'
  deliveryFee: number;
  taxRate: number;
  hospitalityLimit: number;
  branchesControl: { id: string; name: string; active: boolean }[];
}

// ─── تعريف قاعدة البيانات ─────────────────────────────────────
export class ERPDatabase extends Dexie {
  orders!: Table<Order>;
  inventory!: Table<InventoryItem>;
  treasuryLogs!: Table<TreasuryLog>;
  invoices!: Table<Invoice>;
  branchRequests!: Table<BranchRequest>;
  employees!: Table<Employee>;
  hrDeductions!: Table<HRDeduction>;
  tillTransfers!: Table<TillTransfer>;
  shiftLogs!: Table<ShiftLog>;
  menuItems!: Table<MenuItem>;
  treasuryOutgoing!: Table<TreasuryOutgoing>;
  treasuryIncoming!: Table<TreasuryIncoming>;
  callCenterOrders!: Table<CallCenterOrder>;
  customers!: Table<Customer>;
  suppliers!: Table<Supplier>;
  purchaseRequests!: Table<PurchaseRequest>;
  paymentOrders!: Table<PaymentOrder>;
  settings!: Table<SystemSetting>;

  constructor() {
    super('ChickenHutERP_LocalDB');

    // الإصدارات السابقة (للتوافق)
    this.version(3).stores({
      orders: '++id, orderNumber, type, paymentMethod, createdAt, isSynced, branchId',
      inventory: '++id, name, category, isSynced',
      treasuryLogs: '++id, type, createdAt, isSynced, branchId',
      invoices: 'id, supplier, itemId, status, isSynced',
      branchRequests: 'id, branch, itemId, status, isSynced',
    });

    // الإصدار 4: إضافة جداول الموظفين والعمليات (بدون قائمة الطعام)
    this.version(4).stores({
      orders:        '++id, orderNumber, type, paymentMethod, createdAt, isSynced, branchId',
      inventory:     '++id, name, category, isSynced',
      treasuryLogs:  '++id, type, createdAt, isSynced, branchId',
      invoices:      'id, supplier, itemId, status, isSynced',
      branchRequests:'id, branch, itemId, status, isSynced',
      employees:     'id, name, branch, role, accessLevel',
      hrDeductions:  '++id, empName, empId, branch, createdAt, status',
      tillTransfers: '++id, fromTill, toTill, branchId, createdAt',
      shiftLogs:     '++id, cashierName, tillNo, branchId, date',
    });

    // الإصدار 5: إضافة جدول قائمة الطعام (Menu Items) للمدير العام
    this.version(5).stores({
      orders:        '++id, orderNumber, type, paymentMethod, createdAt, isSynced, branchId',
      inventory:     '++id, name, category, isSynced',
      treasuryLogs:  '++id, type, createdAt, isSynced, branchId',
      invoices:      'id, supplier, itemId, status, isSynced',
      branchRequests:'id, branch, itemId, status, isSynced',
      employees:     'id, name, branch, role, accessLevel',
      hrDeductions:  '++id, empName, empId, branch, createdAt, status',
      tillTransfers: '++id, fromTill, toTill, branchId, createdAt',
      shiftLogs:     '++id, cashierName, tillNo, branchId, date',
      menuItems:     '++id, name, category, isAvailable'
    });

    // الإصدار 6: إضافة جداول الخزينة المتكاملة (صادر + وارد)
    this.version(6).stores({
      orders:           '++id, orderNumber, type, paymentMethod, createdAt, isSynced, branchId',
      inventory:        '++id, name, category, isSynced',
      treasuryLogs:     '++id, type, createdAt, isSynced, branchId',
      invoices:         'id, supplier, itemId, status, isSynced',
      branchRequests:   'id, branch, itemId, status, isSynced',
      employees:        'id, name, branch, role, accessLevel',
      hrDeductions:     '++id, empName, empId, branch, createdAt, status',
      tillTransfers:    '++id, fromTill, toTill, branchId, createdAt',
      shiftLogs:        '++id, cashierName, tillNo, branchId, date',
      menuItems:        '++id, name, category, isAvailable',
      treasuryOutgoing: '++id, type, branch, date, createdAt, isSynced',
      treasuryIncoming: '++id, type, branch, date, createdAt, isSynced',
    });

    // الإصدار 7: إضافة جدول طلبات مركز الاتصالات
    this.version(7).stores({
      orders:             '++id, orderNumber, type, paymentMethod, createdAt, isSynced, branchId',
      inventory:          '++id, name, category, isSynced',
      treasuryLogs:       '++id, type, createdAt, isSynced, branchId',
      invoices:           'id, supplier, itemId, status, isSynced',
      branchRequests:     'id, branch, itemId, status, isSynced',
      employees:          'id, name, branch, role, accessLevel',
      hrDeductions:       '++id, empName, empId, branch, createdAt, status',
      tillTransfers:      '++id, fromTill, toTill, branchId, createdAt',
      shiftLogs:          '++id, cashierName, tillNo, branchId, date',
      menuItems:          '++id, name, category, isAvailable',
      treasuryOutgoing:   '++id, type, branch, date, createdAt, isSynced',
      treasuryIncoming:   '++id, type, branch, date, createdAt, isSynced',
      callCenterOrders:   '++id, orderNumber, targetBranch, status, createdAt',
    });

    // الإصدار 8: إضافة جدول العملاء
    this.version(8).stores({
      orders:             '++id, orderNumber, type, paymentMethod, createdAt, isSynced, branchId',
      inventory:          '++id, name, category, isSynced',
      treasuryLogs:       '++id, type, createdAt, isSynced, branchId',
      invoices:           'id, supplier, itemId, status, isSynced',
      branchRequests:     'id, branch, itemId, status, isSynced',
      employees:          'id, name, branch, role, accessLevel',
      hrDeductions:       '++id, empName, empId, branch, createdAt, status',
      tillTransfers:      '++id, fromTill, toTill, branchId, createdAt',
      shiftLogs:          '++id, cashierName, tillNo, branchId, date',
      menuItems:          '++id, name, category, isAvailable',
      treasuryOutgoing:   '++id, type, branch, date, createdAt, isSynced',
      treasuryIncoming:   '++id, type, branch, date, createdAt, isSynced',
      callCenterOrders:   '++id, orderNumber, targetBranch, status, createdAt',
      customers:          '++id, phone, name, lastOrderAt',
    });

    // الإصدار 9: موردون + طلبات شراء + أوامر صرف
    this.version(9).stores({
      orders:             '++id, orderNumber, type, paymentMethod, createdAt, isSynced, branchId',
      inventory:          '++id, name, category, isSynced',
      treasuryLogs:       '++id, type, createdAt, isSynced, branchId',
      invoices:           'id, supplier, itemId, status, isSynced',
      branchRequests:     'id, branch, itemId, status, isSynced',
      employees:          'id, name, branch, role, accessLevel',
      hrDeductions:       '++id, empName, empId, branch, createdAt, status',
      tillTransfers:      '++id, fromTill, toTill, branchId, createdAt',
      shiftLogs:          '++id, cashierName, tillNo, branchId, date',
      menuItems:          '++id, name, category, isAvailable',
      treasuryOutgoing:   '++id, type, branch, date, createdAt, isSynced',
      treasuryIncoming:   '++id, type, branch, date, createdAt, isSynced',
      callCenterOrders:   '++id, orderNumber, targetBranch, status, createdAt',
      customers:          '++id, phone, name, lastOrderAt',
      suppliers:          '++id, name, category, createdAt',
      purchaseRequests:   '++id, requestNumber, status, createdAt, branch',
      paymentOrders:      '++id, voucherNumber, status, createdAt, purchaseRequestId',
    });

    // الإصدار 10: إعدادات النظام
    this.version(10).stores({
      orders:             '++id, orderNumber, type, paymentMethod, createdAt, isSynced, branchId',
      inventory:          '++id, name, category, isSynced',
      treasuryLogs:       '++id, type, createdAt, isSynced, branchId',
      invoices:           'id, supplier, itemId, status, isSynced',
      branchRequests:     'id, branch, itemId, status, isSynced',
      employees:          'id, name, branch, role, accessLevel',
      hrDeductions:       '++id, empName, empId, branch, createdAt, status',
      tillTransfers:      '++id, fromTill, toTill, branchId, createdAt',
      shiftLogs:          '++id, cashierName, tillNo, branchId, date',
      menuItems:          '++id, name, category, isAvailable',
      treasuryOutgoing:   '++id, type, branch, date, createdAt, isSynced',
      treasuryIncoming:   '++id, type, branch, date, createdAt, isSynced',
      callCenterOrders:   '++id, orderNumber, targetBranch, status, createdAt',
      customers:          '++id, phone, name, lastOrderAt',
      suppliers:          '++id, name, category, createdAt',
      purchaseRequests:   '++id, requestNumber, status, createdAt, branch',
      paymentOrders:      '++id, voucherNumber, status, createdAt, purchaseRequestId',
      settings:           'id', // key-value for settings where id="system_settings"
    });
  }
}


export const db = new ERPDatabase();

// ─── قائمة موظفي الفروع الكاملة ───────────────────────────────
const ALL_EMPLOYEES = [
  // ══════════════ فرع وسط البلاد ══════════════
  { id: "EMP-101", name: "محمد العماري",  phone: "0911001001", dob: "1990-01-15", branch: "فرع وسط البلاد", role: "كاشير",     accessLevel: "كاشير",     pin: "1111", baseSalary: 1200, deductHalfDay: 20, deductFullDay: 40, mealsEnabled: true, mealsLimit: 150, cashWithdrawEnabled: true,  cashWithdrawLimit: 200, totalAdvance: 0, monthlyAdvanceCut: 0, avatar: "https://i.pravatar.cc/150?img=11", documentId: "doc-101", createdAt: new Date().toISOString() },
  { id: "EMP-102", name: "سارة الكوني",   phone: "0911001002", dob: "1995-03-20", branch: "فرع وسط البلاد", role: "كاشير",     accessLevel: "كاشير",     pin: "1122", baseSalary: 1200, deductHalfDay: 20, deductFullDay: 40, mealsEnabled: true, mealsLimit: 150, cashWithdrawEnabled: true,  cashWithdrawLimit: 200, totalAdvance: 0, monthlyAdvanceCut: 0, avatar: "https://i.pravatar.cc/150?img=25", documentId: "doc-102", createdAt: new Date().toISOString() },
  { id: "EMP-103", name: "عصام فرج",      phone: "0911001003", dob: "1980-08-08", branch: "فرع وسط البلاد", role: "مدير فرع", accessLevel: "مدير فرع", pin: "1199", baseSalary: 3500, deductHalfDay: 50, deductFullDay: 100, mealsEnabled: true, mealsLimit: 300, cashWithdrawEnabled: true,  cashWithdrawLimit: 500, totalAdvance: 0, monthlyAdvanceCut: 0, avatar: "https://i.pravatar.cc/150?img=15", documentId: "doc-103", createdAt: new Date().toISOString() },

  // ══════════════ فرع الحدائق ══════════════
  { id: "EMP-201", name: "أحمد الفيتوري", phone: "0922002001", dob: "1985-05-10", branch: "فرع الحدائق",    role: "كاشير",     accessLevel: "كاشير",     pin: "2211", baseSalary: 1200, deductHalfDay: 20, deductFullDay: 40, mealsEnabled: true, mealsLimit: 150, cashWithdrawEnabled: true,  cashWithdrawLimit: 200, totalAdvance: 0, monthlyAdvanceCut: 0, avatar: "https://i.pravatar.cc/150?img=12", documentId: "doc-201", createdAt: new Date().toISOString() },
  { id: "EMP-202", name: "نورة السلمي",   phone: "0922002002", dob: "1993-07-22", branch: "فرع الحدائق",    role: "كاشير",     accessLevel: "كاشير",     pin: "2222", baseSalary: 1200, deductHalfDay: 20, deductFullDay: 40, mealsEnabled: true, mealsLimit: 150, cashWithdrawEnabled: true,  cashWithdrawLimit: 200, totalAdvance: 0, monthlyAdvanceCut: 0, avatar: "https://i.pravatar.cc/150?img=26", documentId: "doc-202", createdAt: new Date().toISOString() },
  { id: "EMP-203", name: "خالد البوسيفي", phone: "0922002003", dob: "1978-12-05", branch: "فرع الحدائق",    role: "مدير فرع", accessLevel: "مدير فرع", pin: "2299", baseSalary: 3500, deductHalfDay: 50, deductFullDay: 100, mealsEnabled: true, mealsLimit: 300, cashWithdrawEnabled: true,  cashWithdrawLimit: 500, totalAdvance: 0, monthlyAdvanceCut: 0, avatar: "https://i.pravatar.cc/150?img=67", documentId: "doc-203", createdAt: new Date().toISOString() },

  // ══════════════ فرع فينيسيا ══════════════
  { id: "EMP-301", name: "يوسف الطيب",    phone: "0933003001", dob: "1992-04-18", branch: "فرع فينيسيا",   role: "كاشير",     accessLevel: "كاشير",     pin: "3311", baseSalary: 1200, deductHalfDay: 20, deductFullDay: 40, mealsEnabled: true, mealsLimit: 150, cashWithdrawEnabled: true,  cashWithdrawLimit: 200, totalAdvance: 0, monthlyAdvanceCut: 0, avatar: "https://i.pravatar.cc/150?img=13", documentId: "doc-301", createdAt: new Date().toISOString() },
  { id: "EMP-302", name: "ريم الزروق",    phone: "0933003002", dob: "1996-09-14", branch: "فرع فينيسيا",   role: "كاشير",     accessLevel: "كاشير",     pin: "3322", baseSalary: 1200, deductHalfDay: 20, deductFullDay: 40, mealsEnabled: true, mealsLimit: 150, cashWithdrawEnabled: true,  cashWithdrawLimit: 200, totalAdvance: 0, monthlyAdvanceCut: 0, avatar: "https://i.pravatar.cc/150?img=20", documentId: "doc-302", createdAt: new Date().toISOString() },
  { id: "EMP-303", name: "سامي العبار",   phone: "0933003003", dob: "1982-02-28", branch: "فرع فينيسيا",   role: "مدير فرع", accessLevel: "مدير فرع", pin: "3399", baseSalary: 3500, deductHalfDay: 50, deductFullDay: 100, mealsEnabled: true, mealsLimit: 300, cashWithdrawEnabled: true,  cashWithdrawLimit: 500, totalAdvance: 0, monthlyAdvanceCut: 0, avatar: "https://i.pravatar.cc/150?img=56", documentId: "doc-303", createdAt: new Date().toISOString() },

  // ══════════════ موظفو المطبخ المركزي (بدون دخول للنظام) ══════════════
  { id: "EMP-001", name: "علي الشريف",    phone: "0900001111", dob: "1988-06-10", branch: "المطبخ المركزي", role: "شيف شواية", accessLevel: "",           pin: "",     baseSalary: 1800, deductHalfDay: 30, deductFullDay: 60, mealsEnabled: true, mealsLimit: 200, cashWithdrawEnabled: false, cashWithdrawLimit: 0,   totalAdvance: 0, monthlyAdvanceCut: 0, avatar: "https://i.pravatar.cc/150?img=14", documentId: "doc-001", createdAt: new Date().toISOString() },
  { id: "EMP-002", name: "عمر الفاروق",   phone: "0900002222", dob: "1991-11-25", branch: "المطبخ المركزي", role: "طباخ",      accessLevel: "",           pin: "",     baseSalary: 1400, deductHalfDay: 25, deductFullDay: 50, mealsEnabled: true, mealsLimit: 150, cashWithdrawEnabled: false, cashWithdrawLimit: 0,   totalAdvance: 0, monthlyAdvanceCut: 0, avatar: "https://i.pravatar.cc/150?img=60", documentId: "doc-002", createdAt: new Date().toISOString() },
];

// ─── دالة تهيئة البيانات التجريبية (Seed Data) ─────────────────
export async function seedDatabase() {
  const employeesCount = await db.employees.count();
  if (employeesCount === 0) {
    await db.employees.bulkAdd(ALL_EMPLOYEES as any);
  }

  const inventoryCount = await db.inventory.count();
  if (inventoryCount === 0) {
    await db.inventory.bulkAdd([
      // كميات المخزن الرئيسي + كميات منفصلة لكل فرع في branchQtys
      { id: 1, name: "دجاج كامل (مبرّد)",   category: "لحوم",      unit: "كيلو",   qty: 250,  min: 100, avgPrice: 8.5,  isSynced: false,
        branchQtys: { "فرع وسط البلاد": 50, "فرع الحدائق": 35, "فرع فينيسيا": 25 } },
      { id: 2, name: "شريحة برجر لحم",      category: "لحوم",      unit: "قطعة",   qty: 1500, min: 500, avgPrice: 1.2,  isSynced: false,
        branchQtys: { "فرع وسط البلاد": 200, "فرع الحدائق": 140, "فرع فينيسيا": 100 } },
      { id: 3, name: "خبز برجر (سمسم)",     category: "مخبوزات",   unit: "قطعة",   qty: 1000, min: 300, avgPrice: 0.35, isSynced: false,
        branchQtys: { "فرع وسط البلاد": 150, "فرع الحدائق": 120, "فرع فينيسيا": 90 } },
      { id: 4, name: "طماطم",               category: "خضراوات",   unit: "كيلو",   qty: 40,   min: 50,  avgPrice: 5.0,  isSynced: false,
        branchQtys: { "فرع وسط البلاد": 10,  "فرع الحدائق": 8,   "فرع فينيسيا": 6 } },
      { id: 5, name: "جبنة شيدر (شرائح)",   category: "ألبان",     unit: "شريحة",  qty: 3000, min: 800, avgPrice: 0.4,  isSynced: false,
        branchQtys: { "فرع وسط البلاد": 300, "فرع الحدائق": 200, "فرع فينيسيا": 150 } },
    ]);
  }

  const ordersCount = await db.orders.count();
  if (ordersCount === 0) {
    await db.orders.bulkAdd([
      { orderNumber: "001", type: "Dine-in",  paymentMethod: "كاش",   cashAmount: 120, bankAmount: 0,  items: [{name:"وجبة كريسبي", quantity:2, price:60}],  totalAmount: 120, createdAt: new Date().toISOString(), isSynced: false, status: "مكتمل", branchId: "فرع وسط البلاد", customerName: "زبون", tableNumber: "3" },
      { orderNumber: "002", type: "Takeaway", paymentMethod: "كاش",   cashAmount: 45,  bankAmount: 0,  items: [{name:"برجر لحم",    quantity:3, price:15}],  totalAmount: 45,  createdAt: new Date().toISOString(), isSynced: false, status: "مكتمل", branchId: "فرع وسط البلاد", customerName: "زبون", tableNumber: "سفري" },
      { orderNumber: "003", type: "Delivery", paymentMethod: "مصرف",  cashAmount: 0,   bankAmount: 80, items: [{name:"دجاج كامل",   quantity:1, price:80}],  totalAmount: 80,  createdAt: new Date().toISOString(), isSynced: false, status: "مكتمل", branchId: "فرع الحدائق",    customerName: "زبون", tableNumber: "توصيل" },
      { orderNumber: "004", type: "Dine-in",  paymentMethod: "كاش",   cashAmount: 55,  bankAmount: 0,  items: [{name:"برجر كلاسيك", quantity:2, price:27.5}],totalAmount: 55,  createdAt: new Date().toISOString(), isSynced: false, status: "مكتمل", branchId: "فرع الحدائق",    customerName: "زبون", tableNumber: "1" },
      { orderNumber: "005", type: "Takeaway", paymentMethod: "كاش",   cashAmount: 40,  bankAmount: 0,  items: [{name:"بطاطس كبير",  quantity:2, price:20}],  totalAmount: 40,  createdAt: new Date().toISOString(), isSynced: false, status: "مكتمل", branchId: "فرع فينيسيا",    customerName: "زبون", tableNumber: "سفري" },
      { orderNumber: "006", type: "Dine-in",  paymentMethod: "مصرف",  cashAmount: 0,   bankAmount: 95, items: [{name:"وجبة زينجر",  quantity:2, price:47.5}],totalAmount: 95,  createdAt: new Date().toISOString(), isSynced: false, status: "مكتمل", branchId: "فرع فينيسيا",    customerName: "زبون", tableNumber: "5" },
    ]);
  }

  const invoicesCount = await db.invoices.count();
  if (invoicesCount === 0) {
    await db.invoices.bulkAdd([
      { id: "INV-9921", supplier: "الشركة المتحدة للحوم والدواجن", itemId: 1, qty: 500, unitPrice: 8.0, date: "2026-04-10", status: "قيد المراجعة", isSynced: false },
      { id: "INV-8832", supplier: "المخابز الحديثة",               itemId: 3, qty: 2000, unitPrice: 0.3, date: "2026-04-12", status: "معتمدة",       isSynced: false },
    ]);
  }

  const hrCount = await db.hrDeductions.count();
  if (hrCount === 0) {
    await db.hrDeductions.bulkAdd([
      { empName: "محمد العماري",  empId: "EMP-101", amount: 50, reason: "سحب نقدي",   branch: "فرع وسط البلاد", createdAt: new Date().toLocaleTimeString("ar-SA"), status: "مُعتمد" },
      { empName: "أحمد الفيتوري", empId: "EMP-201", amount: 30, reason: "سحب نقدي",   branch: "فرع الحدائق",    createdAt: new Date().toLocaleTimeString("ar-SA"), status: "مُعتمد" },
      { empName: "يوسف الطيب",    empId: "EMP-301", amount: 40, reason: "سلفة جزئية", branch: "فرع فينيسيا",    createdAt: new Date().toLocaleTimeString("ar-SA"), status: "مسجل"   },
    ]);
  }

  const menuCount = await db.menuItems.count();
  if (menuCount === 0) {
    await db.menuItems.bulkAdd([
      { name: "برجر كلاسيك (سنجل)",        category: "برجر",          price: 15, cost: 5.5,  image: "🍔", ingredients: [{ itemId: 2, name: "شريحة برجر لحم", qty: 1, unit: "قطعة", costPerUnit: 1.2 }, { itemId: 3, name: "خبز برجر (سمسم)", qty: 1, unit: "قطعة", costPerUnit: 0.35 }], isAvailable: true },
      { name: "برجر تشيكن هات (تروي)",     category: "برجر",          price: 18, cost: 6.5,  image: "🍔", ingredients: [{ itemId: 1, name: "دجاج كامل (مبرّد)", qty: 0.2, unit: "كيلو", costPerUnit: 8.5 }, { itemId: 3, name: "خبز برجر (سمسم)", qty: 1, unit: "قطعة", costPerUnit: 0.35 }], isAvailable: true },
      { name: "برجر دبل كلاسيك",           category: "برجر",          price: 22, cost: 8.5,  image: "🍔", ingredients: [{ itemId: 2, name: "شريحة برجر لحم", qty: 2, unit: "قطعة", costPerUnit: 1.2 }, { itemId: 3, name: "خبز برجر (سمسم)", qty: 1, unit: "قطعة", costPerUnit: 0.35 }, { itemId: 5, name: "جبنة شيدر (شرائح)", qty: 2, unit: "شريحة", costPerUnit: 0.4 }], isAvailable: true },
      { name: "وجبة كريسبي زينجر (3 قطع)", category: "الطبق الرئيسي", price: 25, cost: 8.5,  image: "🍗", ingredients: [{ itemId: 1, name: "دجاج كامل (مبرّد)", qty: 0.25, unit: "كيلو", costPerUnit: 8.5 }], isAvailable: true },
      { name: "وجبة كريسبي زينجر (6 قطع)", category: "الطبق الرئيسي", price: 40, cost: 14.0, image: "🍗", ingredients: [{ itemId: 1, name: "دجاج كامل (مبرّد)", qty: 0.5, unit: "كيلو", costPerUnit: 8.5 }], isAvailable: true },
      { name: "دجاج مشوي كامل",             category: "الطبق الرئيسي", price: 35, cost: 12.0, image: "🍗", ingredients: [{ itemId: 1, name: "دجاج كامل (مبرّد)", qty: 0.4, unit: "كيلو", costPerUnit: 8.5 }], isAvailable: true },
      { name: "بيتزا مارغريتا",             category: "بيتزا",         price: 20, cost: 6.0,  image: "🍕", ingredients: [{ itemId: 5, name: "جبنة شيدر (شرائح)", qty: 2, unit: "شريحة", costPerUnit: 0.4 }, { itemId: 4, name: "طماطم", qty: 0.1, unit: "كيلو", costPerUnit: 5.0 }], isAvailable: true },
      { name: "بيتزا لحم فاخرة",            category: "بيتزا",         price: 28, cost: 9.5,  image: "🍕", ingredients: [{ itemId: 5, name: "جبنة شيدر (شرائح)", qty: 3, unit: "شريحة", costPerUnit: 0.4 }, { itemId: 2, name: "شريحة برجر لحم", qty: 1, unit: "قطعة", costPerUnit: 1.2 }, { itemId: 4, name: "طماطم", qty: 0.15, unit: "كيلو", costPerUnit: 5.0 }], isAvailable: true },
      { name: "بطاطس مقلية (وسط)",          category: "سناك",          price: 8,  cost: 2.5,  image: "🍟", ingredients: [], isAvailable: true },
      { name: "بطاطس مقلية (كبير)",         category: "سناك",          price: 12, cost: 3.5,  image: "🍟", ingredients: [], isAvailable: true },
      { name: "wings حارة (6 قطع)",         category: "سناك",          price: 15, cost: 5.0,  image: "🍗", ingredients: [{ itemId: 1, name: "دجاج كامل (مبرّد)", qty: 0.15, unit: "كيلو", costPerUnit: 8.5 }], isAvailable: true },
      { name: "كوكا كولا",                   category: "مشروبات",       price: 3,  cost: 1.0,  image: "🥤", ingredients: [], isAvailable: true },
      { name: "عصير برتقال",                category: "مشروبات",       price: 5,  cost: 1.5,  image: "🧃", ingredients: [], isAvailable: true },
      { name: "ماء معدني",                  category: "مشروبات",       price: 2,  cost: 0.5,  image: "💧", ingredients: [], isAvailable: true },
      { name: "إسبريسو",                    category: "قهوة",          price: 4,  cost: 1.2,  image: "☕", ingredients: [], isAvailable: true },
      { name: "لاتيه",                      category: "قهوة",          price: 6,  cost: 2.0,  image: "☕", ingredients: [], isAvailable: true },
    ]);
  }
}

// ─── دالة إعادة تهيئة حسابات الموظفين (للمدير العام) ──────────
export async function reseedEmployees(): Promise<void> {
  await db.employees.clear();
  await db.employees.bulkAdd(ALL_EMPLOYEES as any);
}

// ─── دالة إعادة تهيئة المخزون (للمدير العام) ──────────────────
export async function reseedInventory(): Promise<void> {
  await db.inventory.clear();
  await db.inventory.bulkAdd([
    { id: 1, name: "دجاج كامل (مبرّد)",  category: "لحوم",    unit: "كيلو",  qty: 250,  min: 100, avgPrice: 8.5,  isSynced: false, branchQtys: { "فرع وسط البلاد": 50, "فرع الحدائق": 35, "فرع فينيسيا": 25 } },
    { id: 2, name: "شريحة برجر لحم",     category: "لحوم",    unit: "قطعة",  qty: 1500, min: 500, avgPrice: 1.2,  isSynced: false, branchQtys: { "فرع وسط البلاد": 200, "فرع الحدائق": 140, "فرع فينيسيا": 100 } },
    { id: 3, name: "خبز برجر (سمسم)",    category: "مخبوزات", unit: "قطعة",  qty: 1000, min: 300, avgPrice: 0.35, isSynced: false, branchQtys: { "فرع وسط البلاد": 150, "فرع الحدائق": 120, "فرع فينيسيا": 90 } },
    { id: 4, name: "طماطم",              category: "خضراوات", unit: "كيلو",  qty: 40,   min: 50,  avgPrice: 5.0,  isSynced: false, branchQtys: { "فرع وسط البلاد": 10, "فرع الحدائق": 8, "فرع فينيسيا": 6 } },
    { id: 5, name: "جبنة شيدر (شرائح)",  category: "ألبان",   unit: "شريحة", qty: 3000, min: 800, avgPrice: 0.4,  isSynced: false, branchQtys: { "فرع وسط البلاد": 300, "فرع الحدائق": 200, "فرع فينيسيا": 150 } },
  ]);
}


