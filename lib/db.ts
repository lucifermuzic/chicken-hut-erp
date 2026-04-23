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
  }
}

export const db = new ERPDatabase();

// ─── دالة تهيئة البيانات التجريبية (Seed Data) ────────────────────────────────
export async function seedDatabase() {
  const employeesCount = await db.employees.count();
  if (employeesCount === 0) {
    await db.employees.bulkAdd([
      { id: "EMP-001", name: "محمد العماري", phone: "0911234567", dob: "1990-01-01", branch: "فرع وسط البلاد", role: "كاشير", accessLevel: "مستخدم", pin: "1111", baseSalary: 1200, deductHalfDay: 20, deductFullDay: 40, mealsEnabled: true, mealsLimit: 1, cashWithdrawEnabled: true, cashWithdrawLimit: 200, totalAdvance: 0, monthlyAdvanceCut: 100, avatar: "https://i.pravatar.cc/150?img=11", documentId: "doc-1", createdAt: new Date().toISOString() },
      { id: "EMP-002", name: "أحمد الفيتوري", phone: "0921234567", dob: "1985-05-05", branch: "المطبخ المركزي", role: "شيف شواية", accessLevel: "مستخدم", pin: "2222", baseSalary: 1800, deductHalfDay: 30, deductFullDay: 60, mealsEnabled: true, mealsLimit: 2, cashWithdrawEnabled: true, cashWithdrawLimit: 300, totalAdvance: 0, monthlyAdvanceCut: 0, avatar: "https://i.pravatar.cc/150?img=12", documentId: "doc-2", createdAt: new Date().toISOString() },
      { id: "EMP-003", name: "خالد عبدالله", phone: "0931234567", dob: "1992-03-03", branch: "فرع وسط البلاد", role: "كاشير", accessLevel: "مستخدم", pin: "3333", baseSalary: 1500, deductHalfDay: 25, deductFullDay: 50, mealsEnabled: true, mealsLimit: 1, cashWithdrawEnabled: true, cashWithdrawLimit: 250, totalAdvance: 0, monthlyAdvanceCut: 0, avatar: "https://i.pravatar.cc/150?img=13", documentId: "doc-3", createdAt: new Date().toISOString() },
      { id: "EMP-004", name: "محمود سالم", phone: "0941234567", dob: "1995-07-07", branch: "فرع وسط البلاد", role: "كاشير", accessLevel: "مستخدم", pin: "4444", baseSalary: 1400, deductHalfDay: 20, deductFullDay: 40, mealsEnabled: true, mealsLimit: 1, cashWithdrawEnabled: true, cashWithdrawLimit: 200, totalAdvance: 0, monthlyAdvanceCut: 0, avatar: "https://i.pravatar.cc/150?img=14", documentId: "doc-4", createdAt: new Date().toISOString() },
      { id: "EMP-005", name: "عصام فرج", phone: "0951234567", dob: "1980-08-08", branch: "فرع وسط البلاد", role: "مدير فرع", accessLevel: "مدير", pin: "5555", baseSalary: 3500, deductHalfDay: 50, deductFullDay: 100, mealsEnabled: true, mealsLimit: 3, cashWithdrawEnabled: true, cashWithdrawLimit: 500, totalAdvance: 0, monthlyAdvanceCut: 0, avatar: "https://i.pravatar.cc/150?img=15", documentId: "doc-5", createdAt: new Date().toISOString() }
    ]);
  }

  const inventoryCount = await db.inventory.count();
  if (inventoryCount === 0) {
    await db.inventory.bulkAdd([
      { id: 1, name: "دجاج كامل (مبرّد)", category: "لحوم", unit: "كيلو", qty: 250, min: 100, avgPrice: 8.5, isSynced: false, branchQtys: { "فرع وسط البلاد": 50, "فرع الحدائق": 20 } },
      { id: 2, name: "شريحة برجر لحم", category: "لحوم", unit: "قطعة", qty: 1500, min: 500, avgPrice: 1.2, isSynced: false, branchQtys: { "فرع وسط البلاد": 200 } },
      { id: 3, name: "خبز برجر (سمسم)", category: "مخبوزات", unit: "قطعة", qty: 1000, min: 300, avgPrice: 0.35, isSynced: false, branchQtys: { "فرع وسط البلاد": 150 } },
      { id: 4, name: "طماطم", category: "خضراوات", unit: "كيلو", qty: 40, min: 50, avgPrice: 5.0, isSynced: false, branchQtys: { "فرع وسط البلاد": 10 } },
      { id: 5, name: "جبنة شيدر (شرائح)", category: "ألبان", unit: "شريحة", qty: 3000, min: 800, avgPrice: 0.4, isSynced: false, branchQtys: { "فرع وسط البلاد": 300 } }
    ]);
  }

  const ordersCount = await db.orders.count();
  if (ordersCount === 0) {
    await db.orders.bulkAdd([
      { orderNumber: "001", type: "Dine-in", paymentMethod: "كاش", cashAmount: 120, bankAmount: 0, items: [{name: "وجبة كريسبي", quantity: 2, price: 60}], totalAmount: 120, createdAt: new Date().toISOString(), isSynced: false, status: "مكتمل", branchId: "فرع وسط البلاد" },
      { orderNumber: "002", type: "Takeaway", paymentMethod: "كاش", cashAmount: 45, bankAmount: 0, items: [{name: "برجر لحم", quantity: 3, price: 15}], totalAmount: 45, createdAt: new Date().toISOString(), isSynced: false, status: "مكتمل", branchId: "فرع وسط البلاد" },
      { orderNumber: "003", type: "Delivery", paymentMethod: "مصرف", cashAmount: 0, bankAmount: 80, items: [{name: "دجاج كامل", quantity: 1, price: 80}], totalAmount: 80, createdAt: new Date().toISOString(), isSynced: false, status: "مكتمل", branchId: "فرع الحدائق" }
    ]);
  }

  const invoicesCount = await db.invoices.count();
  if (invoicesCount === 0) {
     await db.invoices.bulkAdd([
        { id: "INV-9921", supplier: "الشركة المتحدة للحوم والدواجن", itemId: 1, qty: 500, unitPrice: 8.0, date: "2026-04-10", status: "قيد المراجعة", isSynced: false },
        { id: "INV-8832", supplier: "المخابز الحديثة", itemId: 3, qty: 2000, unitPrice: 0.3, date: "2026-04-12", status: "معتمدة", isSynced: false }
     ]);
  }

  const hrCount = await db.hrDeductions.count();
  if (hrCount === 0) {
     await db.hrDeductions.bulkAdd([
        { empName: "محمد العماري", empId: "EMP-001", amount: 50, reason: "سحب نقدي", branch: "فرع وسط البلاد", createdAt: new Date().toLocaleTimeString("ar-SA"), status: "مُعتمد" }
     ]);
  }

  const menuCount = await db.menuItems.count();
  if (menuCount === 0) {
     await db.menuItems.bulkAdd([
        { name: "برجر كلاسيك (سنجل)", category: "برجر", price: 15, cost: 5.5, image: "🍔", ingredients: [{ itemId: 2, name: "شريحة برجر لحم", qty: 1, unit: "قطعة", costPerUnit: 1.2 }, { itemId: 3, name: "خبز برجر (سمسم)", qty: 1, unit: "قطعة", costPerUnit: 0.35 }], isAvailable: true },
        { name: "وجبة كريسبي زينجر (3 قطع)", category: "الطبق الرئيسي", price: 25, cost: 8.5, image: "🍗", ingredients: [{ itemId: 1, name: "دجاج كامل (مبرّد)", qty: 0.25, unit: "كيلو", costPerUnit: 8.5 }], isAvailable: true },
        { name: "بيتزا مارغريتا", category: "بيتزا", price: 20, cost: 6.0, image: "🍕", ingredients: [{ itemId: 5, name: "جبنة شيدر (شرائح)", qty: 2, unit: "شريحة", costPerUnit: 0.4 }, { itemId: 4, name: "طماطم", qty: 0.1, unit: "كيلو", costPerUnit: 5.0 }], isAvailable: true }
     ]);
  }
}
