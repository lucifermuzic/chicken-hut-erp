"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, ArrowLeftRight, Search, Monitor, Building, FileDigit,
  Lock, AlertCircle, ShieldCheck, LogOut, Trash2, CheckCircle2,
  Receipt, Clock, Package, Eye, EyeOff, X, Plus, Minus, Volume2,
  ChevronDown, Filter
} from "lucide-react";
import { db } from "../../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { OPERATION_PINS, clearSession, getSession } from "../../lib/auth";
import { useEffect } from "react";

// ─── أنواع ─────────────────────────────────────────────────
type TabType = 'الطلبات' | 'المعاملات';
type OrderStatus = 'قيد التحضير' | 'جاري التوصيل' | 'مكتمل';
type ModalType = 'NONE' | 'TRANSFER_CASHIER' | 'TRANSFER_MAIN' | 'CLOSE_SHIFT' | 'ORDER_SUCCESS' | 'SHOW_BALANCE' | 'PAYMENT_METHODS' | 'REFUND_ORDER';

interface Product { id: number; name: string; category: string; price: number; image: string; ingredients?: any[]; }
interface CartItem extends Product { quantity: number; }
interface Order { id: string; customer: string; table: string; items: CartItem[]; total: number; status: OrderStatus; time: string; }
interface ShiftLog {
  id?: number;
  cashierName: string;
  tillNo: string;
  date: string;
  openingBalance: number;
  deliveredAmount: number;
  expectedBalance: number;
  deficit: number;
  surplus: number;
}

// ─── بيانات ثابتة ──────────────────────────────────────────
const CASHIER_INFO = { name: "فاي ستيفاني", role: "كاشير", tillNo: "03", avatar: "https://i.pravatar.cc/150?img=44" };
// PINs مُستوردة من الإعداد المركزي (lib/auth.ts)
const MANAGER_PIN    = OPERATION_PINS.MANAGER;
const TREASURER_PIN  = OPERATION_PINS.TREASURER;
const SUPERVISOR_PIN = OPERATION_PINS.SUPERVISOR;

const BANKS = ["مصرف الجمهورية", "مصرف التجارة والتنمية", "مصرف الأمان", "مصرف الوحدة", "مصرف النوران", "مصرف اليقين"];
const MENU_CATEGORIES = ["الكل", "سناك", "قهوة", "حليب", "الطبق الرئيسي", "برجر", "بيتزا"];
// يتم جلب قائمة المنتجات من قاعدة البيانات الآن

// ─── المكوّن الرئيسي ────────────────────────────────────────
export default function POSDashboard() {
  const style = { fontFamily: "var(--font-cairo), sans-serif" };

  const [sessionBranch, setSessionBranch] = useState("فرع وسط البلاد");
  const [cashierName, setCashierName] = useState(CASHIER_INFO.name);

  useEffect(() => {
    const session = getSession();
    if (session) {
      if (session.branch) setSessionBranch(session.branch);
      if (session.employeeName) setCashierName(session.employeeName);
    }
  }, []);

  // ─ الوردية الافتتاحية
  const [openingDone,      setOpeningDone]      = useState(false);
  const [openingAmount,    setOpeningAmount]    = useState("");
  const [openingConfirmed, setOpeningConfirmed] = useState<number | null>(null);
  const [openingLoading,   setOpeningLoading]   = useState(false);

  // ─ التبويب والفئة
  const [activeTab,      setActiveTab]      = useState<TabType>("الطلبات");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [searchQuery,    setSearchQuery]    = useState("");

  // ─ العميل والطاولة
  const [customerName, setCustomerName] = useState("");
  const [tableNumber,  setTableNumber]  = useState("1");

  // ─ السلة
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // ─ الطلبات
  const dbOrders = useLiveQuery(() => db.orders.toArray()) || [];
  const orders: Order[] = useMemo(() => {
    return [...dbOrders].sort((a, b) => (b.id || 0) - (a.id || 0)).map(o => {
      let timeStr = "";
      try { timeStr = new Date(o.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }); } catch(e){}
      return {
        id: o.orderNumber,
        customer: o.customerName || "زبون",
        table: o.tableNumber || o.type,
        items: o.items as CartItem[],
        total: o.totalAmount,
        status: o.status as OrderStatus,
        time: timeStr
      };
    });
  }, [dbOrders]);

  const lastOrderId = dbOrders.length > 0 ? Math.max(...dbOrders.map(o => parseInt(o.orderNumber, 10) || 0)) : 0;

  // ─ الخزينة والمعاملات
  const [tillCash,     setTillCash]     = useState<number | null>(null);
  const [modal,        setModal]        = useState<ModalType>("NONE");
  const [pin,          setPin]          = useState("");
  const [pinErr,       setPinErr]       = useState("");
  const [amount,       setAmount]       = useState("");
  const [targetTill,   setTargetTill]   = useState("");
  const [actualCash,   setActualCash]   = useState("");
  const [txLoading,    setTxLoading]    = useState(false);
  const [txSuccess,    setTxSuccess]    = useState("");
  // سجل الورديات
  const dbShiftLogs = useLiveQuery(() => db.shiftLogs.toArray()) || [];
  const shiftLog: ShiftLog[] = useMemo(() => {
    return [...dbShiftLogs].sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [dbShiftLogs]);
  const [showLogModal,     setShowLogModal]     = useState(false);
  const [logPinInput,      setLogPinInput]      = useState("");
  const [logPinErr,        setLogPinErr]        = useState("");
  const [logPinStep,       setLogPinStep]       = useState(true);  // true = PIN screen, false = log screen

  // إظهار/إخفاء الرصيد
  const [balanceVisible,     setBalanceVisible]     = useState(false);
  const [balancePinInput,    setBalancePinInput]    = useState("");
  const [balancePinErr,      setBalancePinErr]      = useState("");
  const [showBalancePinModal,setShowBalancePinModal]= useState(false);

  // ─ الدفع وتأكيد الطلب
  const [paymentMethod, setPaymentMethod] = useState<"كاش" | "مصرف" | "موظفين" | "نص نص" | "ضيافة" | null>("كاش");
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedSplitBank, setSelectedSplitBank] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [splitCashAmount, setSplitCashAmount] = useState("");
  const [splitBankAmount, setSplitBankAmount] = useState("");
  const [splitEmpAmount, setSplitEmpAmount] = useState("");
  const [splitEmpId, setSplitEmpId] = useState<string | null>(null);
  const [hospitalityPin, setHospitalityPin] = useState("");
  const [hospitalityPinErr, setHospitalityPinErr] = useState("");

  const handleRevealBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (balancePinInput === MANAGER_PIN) {
      setBalanceVisible(true);
      setShowBalancePinModal(false);
      setBalancePinInput("");
      setBalancePinErr("");
    } else {
      setBalancePinErr("كلمة مرور خاطئة!");
    }
  };

  const formatBalance = (val: number): string => balanceVisible ? val.toFixed(2) : "•••••";
  // ─ محاسبة السلة
  const subTotal    = useMemo(() => cartItems.reduce((s, i) => s + i.price * i.quantity, 0), [cartItems]);
  const totalAmount = subTotal;

  // ─ فلترة المنتجات المجلوبة من قاعدة البيانات
  const allProductsLive = useLiveQuery(() => db.menuItems.filter(item => item.isAvailable).toArray()) || [];
  const productsWithId: Product[] = allProductsLive.map(p => ({ ...p, id: p.id as number }));
  
  const dbEmployees = useLiveQuery(() => db.employees.toArray()) || [];
  const ALL_EMPLOYEES = dbEmployees;
  const OTHER_CASHIERS = useMemo(() => {
    return dbEmployees.filter(e => e.role === "كاشير" && e.name !== cashierName).map((e, index) => ({
      id: e.id,
      name: e.name,
      tillNo: `0${index + 1}`,
      avatar: e.avatar,
      status: "نشط"
    }));
  }, [dbEmployees]);

  const filteredProducts = useMemo(() =>
    productsWithId.filter(p =>
      (activeCategory === "الكل" || p.category === activeCategory) &&
      (searchQuery === "" || p.name.includes(searchQuery))
    ), [activeCategory, searchQuery, productsWithId]);
  // ─ الوردية الافتتاحية ───────────────────────────────────
  const handleOpeningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(openingAmount);
    if (isNaN(val) || val < 0) return;
    setOpeningLoading(true);
    setTimeout(() => {
      setOpeningConfirmed(val);
      setTillCash(val);
      setOpeningLoading(false);
      setTimeout(() => setOpeningDone(true), 1500);
    }, 800);
  };

  // ─ السلة ────────────────────────────────────────────────
  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const found = prev.find(i => i.id === product.id);
      if (found) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const changeQty = (id: number, delta: number) => {
    setCartItems(prev =>
      prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
    );
  };

  const removeFromCart = (id: number) => setCartItems(prev => prev.filter(i => i.id !== id));

  const isInCart = (id: number) => cartItems.some(i => i.id === id);

  // ─ تأكيد الطلب ──────────────────────────────────────────
  // ─ تأكيد الطلب وفرز الدفع المفصل ──────────────────────────
  const confirmOrder = () => {
    if (cartItems.length === 0) return;
    setPaymentMethod("كاش");
    setHospitalityPin("");
    setHospitalityPinErr("");
    setSelectedBank("");
    setSelectedSplitBank("");
    setSelectedEmployee(null);
    setSplitCashAmount("");
    setSplitBankAmount("");
    setSplitEmpAmount("");
    setSplitEmpId(null);
    setModal("PAYMENT_METHODS");
  };

  const finalizeOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (paymentMethod === "ضيافة" && hospitalityPin !== MANAGER_PIN) {
      setHospitalityPinErr("الرقم السري للمدير غير صحيح!");
      return;
    }
    const newId = String(lastOrderId + 1).padStart(3, "0");
    const now = new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    
    const displayOrder = {
      id: newId,
      customer: customerName || "زبون",
      table: tableNumber,
      items: [...cartItems],
      total: totalAmount,
      status: "قيد التحضير" as const,
      time: now,
    };
    
    let finalCash = 0;
    let finalBank = 0;
    
    if (paymentMethod === "كاش") { finalCash = totalAmount; }
    else if (paymentMethod === "مصرف") { finalBank = totalAmount; }
    else if (paymentMethod === "نص نص") {
       finalCash = parseFloat(splitCashAmount) || 0;
       finalBank = parseFloat(splitBankAmount) || 0;
    }

    // حفظ الطلب في قاعدة البيانات المحلية (Dexie) لربطه بالشاشات الأخرى (CFO/Dashboard)
    try {
      await db.orders.add({
        orderNumber: newId,
        type: tableNumber === "توصيل" ? "Delivery" : tableNumber === "سفري" ? "Takeaway" : "Dine-in",
        paymentMethod: paymentMethod || "كاش",
        cashAmount: finalCash,
        bankAmount: finalBank,
        items: [...cartItems],
        totalAmount: totalAmount,
        createdAt: new Date().toISOString(),
        isSynced: false,
        status: "قيد التحضير",
        branchId: sessionBranch,
        customerName: customerName || "زبون",
        tableNumber: tableNumber
      });

      // Recipe Auto-Deduction Engine (Storekeeper Sync)
      for (const cartItem of cartItems) {
        if (cartItem.ingredients && Array.isArray(cartItem.ingredients)) {
          for (const ingredient of cartItem.ingredients) {
            const deductQty = ingredient.qty * cartItem.quantity;
            const invItem = await db.inventory.get(ingredient.itemId);
            if (invItem) {
              const currentBranchQtys = invItem.branchQtys || {};
              const currentQty = currentBranchQtys[sessionBranch] || 0;
              
              if (currentQty > 0) {
                const newBranchQtys = { ...currentBranchQtys, [sessionBranch]: Math.max(0, currentQty - deductQty) };
                await db.inventory.update(ingredient.itemId, { branchQtys: newBranchQtys });
              }
            }
          }
        }
      }

    } catch (err) {
      console.error("خطأ أثناء حفظ الطلب في القاعدة المحلية Dexie:", err);
    }

    // إضافة الكاش فقط للخزينة
    let addedCash = finalCash;
    if (addedCash > 0) {
      setTillCash(prev => (prev ?? 0) + addedCash);
    }

    setCartItems([]);
    setCustomerName("");
    setModal("ORDER_SUCCESS");
    setTimeout(() => setModal("NONE"), 2500);
  };

  // ─ تحديث حالة الطلب ─────────────────────────────────────
  const cycleStatus = async (id: string) => {
    const orderToUpdate = await db.orders.where("orderNumber").equals(id).first();
    if (!orderToUpdate) return;
    const next: Record<OrderStatus, OrderStatus> = {
      "قيد التحضير": "جاري التوصيل",
      "جاري التوصيل": "مكتمل",
      "مكتمل": "مكتمل"
    };
    const nextStatus = next[orderToUpdate.status as OrderStatus] || orderToUpdate.status;
    if (nextStatus !== orderToUpdate.status && orderToUpdate.id) {
       await db.orders.update(orderToUpdate.id, { status: nextStatus });
    }
  };

  // ─ معاملة مالية ─────────────────────────────────────────
  const [refundOrderId, setRefundOrderId] = useState("");
  const closeModal = () => { setModal("NONE"); setPin(""); setPinErr(""); setAmount(""); setTargetTill(""); setActualCash(""); setTxSuccess(""); setRefundOrderId(""); };

  const handleTransferCashier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTill) { setPinErr("يجب اختيار الكاشير المستلم أولاً"); return; }
    if (pin !== MANAGER_PIN) { setPinErr("الرقم السري للمدير غير صحيح!"); return; }
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    const cashier = OTHER_CASHIERS.find(c => c.tillNo === targetTill);
    setTxLoading(true);
    setTimeout(() => {
      setTillCash(prev => (prev ?? 0) - val);
      setTxSuccess(`تم تحويل ${val.toFixed(2)} د.ل إلى ${cashier?.name ?? "الكاشير"} (خزينة #${targetTill}) بنجاح`);
      setTxLoading(false);
      setTimeout(closeModal, 2500);
    }, 900);
  };

  const handleTransferMain = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin !== TREASURER_PIN) { setPinErr("الرقم السري لأمين الخزينة غير صحيح!"); return; }
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    setTxLoading(true);
    setTimeout(() => {
      setTillCash(prev => (prev ?? 0) - val);
      setTxSuccess(`تم توريد ${val.toFixed(2)} د.ل للخزينة الرئيسية بنجاح`);
      setTxLoading(false);
      setTimeout(closeModal, 2000);
    }, 900);
  };

  const handleRefundOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin !== SUPERVISOR_PIN) { setPinErr("الرقم السري للمشرف غير صحيح!"); return; }
    const order = orders.find(o => o.id === refundOrderId);
    if (!order) { setPinErr("رقم الطلب غير موجود!"); return; }
    
    setTxLoading(true);
    setTimeout(async () => {
      const orderToRefund = await db.orders.where("orderNumber").equals(refundOrderId).first();
      if (orderToRefund && orderToRefund.id) {
        await db.orders.delete(orderToRefund.id);
      }
      setTillCash(prev => (prev ?? 0) - order.total);
      setTxSuccess(`تم استرجاع الطلب #${order.id} بقيمة ${order.total.toFixed(2)} د.ل بنجاح`);
      setTxLoading(false);
      setTimeout(closeModal, 2500);
    }, 800);
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    const actual = parseFloat(actualCash) || 0;
    const expected = tillCash ?? 0;
    const diff = actual - expected;
    setTxLoading(true);
    setTimeout(async () => {
      // تسجيل الوردية في السجل
      const now = new Date().toLocaleString("ar-SA", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
      const newLog = {
        cashierName: cashierName,
        tillNo: CASHIER_INFO.tillNo,
        date: now,
        openingBalance: openingConfirmed ?? 0,
        deliveredAmount: actual,
        expectedBalance: expected,
        deficit: diff < 0 ? Math.abs(diff) : 0,
        surplus: diff > 0 ? diff : 0,
        branchId: sessionBranch
      };
      
      await db.shiftLogs.add(newLog);

      setTxSuccess("تم تسجيل وإغلاق الوردية بنجاح");
      setTxLoading(false);
      setTimeout(() => {
        setOpeningDone(false); setOpeningAmount(""); setOpeningConfirmed(null);
        setTillCash(null); setBalanceVisible(false); closeModal();
      }, 2500);
    }, 1000);
  };

  const actualCashNum = parseFloat(actualCash) || 0;
  const cashDiff = actualCashNum - (tillCash ?? 0);

  // ─ شاشة الوردية الافتتاحية ──────────────────────────────
  if (!openingDone) {
    return (
      <div className="min-h-screen bg-[#f8f9fd] flex items-center justify-center p-6" dir="rtl" style={style}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#ff6b00] to-[#ff985c] mx-auto mb-4 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <div className="w-6 h-6 bg-white rounded-full" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">تشيكن هات POS</h1>
            <p className="text-gray-500 text-sm">أدخل المبلغ الافتتاحي لبدء الوردية</p>
          </div>

          <AnimatePresence mode="wait">
            {!openingConfirmed ? (
              <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                  <img src={CASHIER_INFO.avatar} alt="avatar" className="w-10 h-10 rounded-xl object-cover" />
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{cashierName}</p>
                    <p className="text-xs text-orange-500 font-semibold">{sessionBranch} — خزينة {CASHIER_INFO.tillNo}</p>
                  </div>
                </div>

                <form onSubmit={handleOpeningSubmit} className="space-y-5">
                  <div>
                    <label className="text-sm font-bold text-gray-800 block mb-2">المبلغ الافتتاحي في الدرج (د.ل)</label>
                    <div className="relative">
                      <input type="number" min="0" step="0.5" value={openingAmount}
                        onChange={e => setOpeningAmount(e.target.value)}
                        placeholder="0.00" dir="ltr" required autoFocus
                        className="w-full bg-gray-50 border-2 border-gray-100 focus:border-[#ff6b00] rounded-2xl px-5 py-4 text-3xl font-bold text-gray-900 text-center outline-none transition-colors tracking-wider" />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-gray-400">د.ل</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[100, 200, 500, 1000].map(v => (
                      <button key={v} type="button" onClick={() => setOpeningAmount(String(v))}
                        className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${openingAmount === String(v) ? "bg-[#ff6b00] text-white border-[#ff6b00] shadow-md" : "bg-gray-50 text-gray-600 border-gray-100 hover:border-orange-300 hover:text-orange-500"}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                  <button type="submit" disabled={!openingAmount || openingLoading}
                    className="w-full bg-[#ff6b00] hover:bg-[#e66000] text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50 text-lg">
                    {openingLoading ? "جاري التسجيل..." : "بدء الوردية"}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl border border-gray-100 p-10 shadow-sm text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 mx-auto mb-5 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">تم تسجيل الوردية!</h2>
                <p className="text-gray-500 mb-4 font-medium">المبلغ الافتتاحي:</p>
                <div className="bg-orange-50 border border-orange-100 rounded-2xl px-8 py-5 inline-block mb-4">
                  <span className="text-4xl font-bold text-[#ff6b00]">{openingConfirmed?.toFixed(2)}</span>
                  <span className="text-lg font-bold text-orange-400 mr-2">د.ل</span>
                </div>
                <p className="text-xs text-gray-400 font-medium">جاري الانتقال للواجهة الرئيسية...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ─ الواجهة الرئيسية ─────────────────────────────────────
  return (
    <div className="flex h-screen w-full bg-[#f8f9fd] text-gray-800 overflow-hidden" dir="rtl" style={style}>

      {/* ── الشريط الجانبي ──────────────────────────────── */}
      <aside className="w-60 bg-white border-l border-gray-100 flex flex-col justify-between py-6 px-4 shadow-[-2px_0_20px_rgba(0,0,0,0.04)] z-10 shrink-0 h-full">
        <div>
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#ff6b00] to-[#ff985c] flex items-center justify-center shadow-lg shadow-orange-500/30">
              <div className="w-3.5 h-3.5 bg-white rounded-full" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 block leading-none">تشيكن هات</span>
              <span className="text-[10px] text-gray-400 font-medium">نظام الكاشير</span>
            </div>
          </div>

          {/* بادج الكاشير */}
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 mb-6 flex items-center gap-3">
            <img src={CASHIER_INFO.avatar} alt="avatar" className="w-9 h-9 rounded-xl object-cover" />
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none mb-0.5">{cashierName}</p>
              <p className="text-xs text-orange-500 font-semibold">{sessionBranch} · خزينة #{CASHIER_INFO.tillNo}</p>
            </div>
          </div>

          {/* رصيد الخزينة */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 mb-6">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-400 font-semibold">رصيد الدرج الحالي</p>
              <button
                onClick={() => { if (balanceVisible) { setBalanceVisible(false); } else { setShowBalancePinModal(true); setBalancePinErr(""); setBalancePinInput(""); } }}
                className="text-gray-400 hover:text-orange-500 transition-colors p-0.5 rounded-lg"
                title={balanceVisible ? "إخفاء الرصيد" : "إظهار الرصيد"}
              >
                {balanceVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xl font-bold text-gray-900 font-mono tracking-wider">
              {formatBalance(tillCash ?? 0)}
              {balanceVisible && <span className="text-sm text-orange-500 font-sans mr-1">د.ل</span>}
            </p>
          </div>

          {/* القائمة */}
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-gray-400 mb-3 px-3 tracking-widest uppercase">صلاحياتك</p>
            {(["الطلبات", "المعاملات"] as TabType[]).map(tab => {
              const Icon = tab === "الطلبات" ? ClipboardList : ArrowLeftRight;
              return (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${activeTab === tab ? "bg-[#fff0e6] text-[#ff6b00] font-semibold" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium"}`}>
                  <Icon className={`w-5 h-5 ${activeTab === tab ? "text-[#ff6b00]" : "text-gray-400"}`} strokeWidth={activeTab === tab ? 2.5 : 2} />
                  <span className="text-sm">{tab}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <button
            onClick={() => { setShowLogModal(true); setLogPinStep(true); setLogPinInput(""); setLogPinErr(""); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-gray-500 hover:bg-amber-50 hover:text-amber-700 font-medium text-sm group">
            <FileDigit className="w-5 h-5 text-gray-400 group-hover:text-amber-500" strokeWidth={2} />
            <span>سجل الورديات</span>
            <span className="mr-auto text-[10px] bg-amber-100 text-amber-600 font-bold px-1.5 py-0.5 rounded-lg">مدير</span>
          </button>

          <button onClick={() => { clearSession(); setOpeningDone(false); setOpeningAmount(""); setOpeningConfirmed(null); setTillCash(null); setBalanceVisible(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-all font-semibold text-sm">
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </div>
      </aside>


      {/* ── المحتوى الرئيسي ─────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-14 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between border-b border-gray-100 z-10 shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400 font-medium">تشيكن هات</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-bold">{activeTab}</span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-full px-3 py-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-600 font-bold">وردية نشطة</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {activeTab === "الطلبات" && (
            <OrderTab
              orders={orders}
              filteredProducts={filteredProducts}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              cartItems={cartItems}
              addToCart={addToCart}
              isInCart={isInCart}
              cycleStatus={cycleStatus}
            />
          )}
          {activeTab === "المعاملات" && (
            <TillTab
              tillCash={tillCash}
              balanceVisible={balanceVisible}
              formatBalance={formatBalance}
              onRevealBalance={() => { setShowBalancePinModal(true); setBalancePinErr(""); setBalancePinInput(""); }}
              onHideBalance={() => setBalanceVisible(false)}
              openModal={m => { setModal(m); setPinErr(""); setTxSuccess(""); }}
            />
          )}
        </div>
      </main>

      {/* ── سلة الطلبات (تظهر فقط في تبويب الطلبات) ─────── */}
      {activeTab === "الطلبات" && (
        <aside className="w-80 bg-white border-r border-gray-100 flex flex-col shadow-[2px_0_20px_rgba(0,0,0,0.04)] z-10 shrink-0 h-full">
          <div className="p-5 flex items-center justify-between border-b border-gray-50">
            <h2 className="text-lg font-bold text-gray-900">طلب جديد</h2>
            {cartItems.length > 0 && (
              <button onClick={() => setCartItems([])} className="text-red-400 hover:text-red-600 text-xs font-bold flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> مسح الكل
              </button>
            )}
          </div>

          {/* العميل والطاولة */}
          <div className="px-5 py-4 border-b border-gray-50 flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-400 block mb-1">اسم العميل</label>
              <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                placeholder="اختياري"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#ff6b00]" />
            </div>
            <div className="w-20">
              <label className="text-xs font-bold text-gray-400 block mb-1">الطاولة</label>
              <select value={tableNumber} onChange={e => setTableNumber(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-2 py-2 text-sm text-gray-900 outline-none focus:border-[#ff6b00]">
                {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={String(n)}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* عناصر السلة */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-3 py-12">
                <Package className="w-14 h-14" />
                <p className="text-sm font-medium">لم تضف أي منتج بعد</p>
              </div>
            ) : (
              cartItems.map(item => (
                <div key={item.id} className="flex gap-3 items-start">
                  <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-orange-500 font-semibold mt-0.5">{(item.price * item.quantity).toFixed(2)} د.ل</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1">
                        <button onClick={() => changeQty(item.id, -1)} className="text-[#ff6b00] hover:bg-orange-100 rounded p-0.5 transition">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-gray-900 w-4 text-center">{item.quantity}</span>
                        <button onClick={() => changeQty(item.id, 1)} className="text-[#ff6b00] hover:bg-orange-100 rounded p-0.5 transition">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-400 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* الملخص */}
          <div className="p-5 border-t border-gray-100 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-gray-900">الإجمالي</span>
              <span className="text-xl font-bold text-[#ff6b00]">{totalAmount.toFixed(2)} د.ل</span>
            </div>
            <button onClick={confirmOrder} disabled={cartItems.length === 0}
              className="w-full bg-[#ff6b00] hover:bg-[#e66000] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <Receipt className="w-5 h-5" />
              تأكيد الطلب
            </button>
          </div>
        </aside>
      )}

      {/* نافذة سجل الورديات */}
      <AnimatePresence>
        {showLogModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl relative flex flex-col max-h-[85vh]">

              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <FileDigit className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">سجل الورديات</h3>
                    <p className="text-xs text-gray-400 font-medium">خاص بمدير الفرع</p>
                  </div>
                </div>
                <button onClick={() => { setShowLogModal(false); setLogPinStep(true); setLogPinInput(""); }}
                  className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {logPinStep ? (
                  /* شاشة الـ PIN */
                  <div className="max-w-xs mx-auto text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-amber-500" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-1">صلاحية محدودة</h4>
                    <p className="text-sm text-gray-400 mb-6 font-medium">هذا الجزء مخصص لمدير الفرع فقط. أدخل كلمة المرور</p>
                    <form onSubmit={e => {
                      e.preventDefault();
                      if (logPinInput === MANAGER_PIN) { setLogPinStep(false); setLogPinErr(""); }
                      else { setLogPinErr("كلمة مرور غير صحيحة!"); }
                    }} className="space-y-3">
                      <div className="relative">
                        <Lock className="w-4 h-4 text-gray-300 absolute right-3 top-1/2 -translate-y-1/2" />
                        <input type="password" value={logPinInput}
                          onChange={e => { setLogPinInput(e.target.value); setLogPinErr(""); }}
                          maxLength={4} placeholder="••••" autoFocus dir="ltr"
                          className="w-full bg-gray-50 border-2 border-gray-100 focus:border-amber-400 rounded-2xl px-4 py-3 text-center text-gray-900 outline-none font-mono tracking-[0.5em] text-2xl transition" />
                      </div>
                      {logPinErr && <p className="text-red-500 text-xs font-bold flex items-center justify-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {logPinErr}</p>}
                      <button type="submit" disabled={logPinInput.length < 4}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-2xl transition disabled:opacity-40">
                        دخول
                      </button>
                    </form>
                  </div>
                ) : (
                  /* جدول الورديات بإطلالة احترافية */
                  <div className="flex flex-col flex-1 pb-2">
                    {/* رأس وإحصائيات سريعة */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xl font-extrabold text-gray-900">سجل الورديات — فرع تشيكن هات</h4>
                        <span className="bg-gray-100 text-gray-600 font-bold px-3 py-1.5 rounded-full text-xs box-content border border-gray-200 shadow-sm">{shiftLog.length} وردية مسجلة</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400">
                            <FileDigit className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-bold mb-0.5">إجمالي الورديات</p>
                            <p className="text-xl font-extrabold text-gray-900">{shiftLog.length}</p>
                          </div>
                        </div>
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-500">
                            <Minus className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs text-red-400 font-bold mb-0.5">إجمالي العجز</p>
                            <p className="text-xl font-extrabold text-red-600 font-mono">{shiftLog.reduce((acc, curr) => acc + curr.deficit, 0).toFixed(2)} د.ل</p>
                          </div>
                        </div>
                        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-green-500">
                            <Plus className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs text-green-500 font-bold mb-0.5">إجمالي الزيادة</p>
                            <p className="text-xl font-extrabold text-green-600 font-mono">{shiftLog.reduce((acc, curr) => acc + curr.surplus, 0).toFixed(2)} د.ل</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* الجدول */}
                    <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
                      <div className="overflow-auto flex-1">
                        <table className="w-full text-sm text-right">
                          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                              {["التاريخ والوقت", "الكاشير", "الخزينة #", "الافتتاحي", "المتوقع بالنظام", "المسلّم فعلياً", "عجز 🔴", "زيادة 🟢"].map((h, i) => (
                                <th key={h} className={`text-xs font-bold text-gray-500 px-5 py-4 whitespace-nowrap ${i >= 3 ? "text-center" : ""}`}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {shiftLog.map(log => (
                              <tr key={log.id} className="hover:bg-orange-50/30 transition-colors group">
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                  <div className="flex flex-col">
                                    <span className="text-gray-900 font-bold text-xs">{log.date.split(" ")[0]}</span>
                                    <span className="text-gray-400 text-[10px] font-semibold">{log.date.split(" ")[1]} {log.date.split(" ")[2]}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-700 text-xs font-extrabold shadow-sm border border-orange-200">
                                      {log.cashierName.charAt(0)}
                                    </div>
                                    <span className="font-bold text-gray-900 text-sm whitespace-nowrap">{log.cashierName}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                  <span className="bg-gray-100 border border-gray-200 text-gray-600 font-bold text-xs px-2.5 py-1 rounded-lg shadow-sm">#{log.tillNo}</span>
                                </td>
                                <td className="px-5 py-3.5 text-center font-mono font-bold text-gray-500">{log.openingBalance.toFixed(2)}</td>
                                <td className="px-5 py-3.5 text-center font-mono font-bold text-gray-900 bg-gray-50/50">{log.expectedBalance.toFixed(2)}</td>
                                <td className="px-5 py-3.5 text-center font-mono font-bold text-blue-600 bg-blue-50/20">{log.deliveredAmount.toFixed(2)}</td>
                                <td className="px-5 py-3.5 text-center">
                                  {log.deficit > 0
                                    ? <span className="inline-block bg-red-50 text-red-600 border border-red-200 font-bold text-xs px-2.5 py-1 rounded-lg font-mono min-w-[70px] shadow-sm">-{log.deficit.toFixed(2)}</span>
                                    : <span className="text-gray-300 text-sm font-bold">—</span>}
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                  {log.surplus > 0
                                    ? <span className="inline-block bg-green-50 text-green-600 border border-green-200 font-bold text-xs px-2.5 py-1 rounded-lg font-mono min-w-[70px] shadow-sm">+{log.surplus.toFixed(2)}</span>
                                    : <span className="text-gray-300 text-sm font-bold">—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        
                        {shiftLog.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                            <FileDigit className="w-16 h-16 mx-auto mb-4 text-gray-200" strokeWidth={1} />
                            <p className="font-medium text-lg text-gray-400">لا توجد ورديات مسجلة بعد</p>
                            <p className="text-sm text-gray-300 mt-1">سيتم ظهور الورديات هنا بمجرد إغلاقها.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* نافذة إظهار الرصيد بكلمة مرور */}
      <AnimatePresence>
        {showBalancePinModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-xs bg-white rounded-3xl shadow-2xl p-7 relative">
              <button onClick={() => { setShowBalancePinModal(false); setBalancePinInput(""); setBalancePinErr(""); }}
                className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full p-1.5 transition">
                <X className="w-4 h-4" />
              </button>
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-3">
                  <Eye className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">إظهار رصيد الدرج</h3>
                <p className="text-xs text-gray-400 mt-1 font-medium">أدخل رقم سري مدير الفرع</p>
              </div>
              <form onSubmit={handleRevealBalance} className="space-y-3">
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-300 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={balancePinInput}
                    onChange={e => { setBalancePinInput(e.target.value); setBalancePinErr(""); }}
                    maxLength={4}
                    placeholder="••••"
                    autoFocus
                    dir="ltr"
                    className="w-full bg-gray-50 border-2 border-gray-100 focus:border-[#ff6b00] rounded-2xl px-4 py-3 text-center text-gray-900 outline-none font-mono tracking-[0.5em] text-2xl transition"
                  />
                </div>
                {balancePinErr && (
                  <p className="text-red-500 text-xs text-center font-bold flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {balancePinErr}
                  </p>
                )}
                <button type="submit" disabled={balancePinInput.length < 4}
                  className="w-full bg-[#ff6b00] hover:bg-[#e66000] text-white font-bold py-3 rounded-2xl transition disabled:opacity-40">
                  عرض الرصيد
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── نوافذ المعاملات ─────────────────────────────── */}
      <AnimatePresence>
        {modal !== "NONE" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-md bg-white border border-gray-100 rounded-3xl shadow-2xl relative p-8">
              <button onClick={closeModal} className="absolute top-5 left-5 text-gray-400 hover:text-gray-900 transition bg-gray-50 hover:bg-gray-100 rounded-full p-2">
                <X className="w-4 h-4" />
              </button>

              {/* نجاح الطلب */}
              {modal === "ORDER_SUCCESS" && (
                <div className="text-center pt-4">
                  <div className="w-20 h-20 rounded-full bg-green-100 mx-auto mb-5 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">تم إنشاء الطلب!</h2>
                  <p className="text-gray-500 font-medium">تم إرسال الطلب للمطبخ بنجاح</p>
                </div>
              )}

              {/* نافذة طرق الدفع */}
              {modal === "PAYMENT_METHODS" && (
                <div>
                  <h3 className="text-xl font-bold mb-1">تأكيد الطلب والدفع</h3>
                  <p className="text-sm text-gray-500 mb-5 font-medium">الإجمالي: <span className="font-bold text-[#ff6b00]">{totalAmount.toFixed(2)} د.ل</span></p>

                  {/* تبويبات دفع */}
                  <div className="flex gap-2 mb-5 overflow-x-auto pb-2 flex-wrap">
                    {["كاش", "مصرف", "موظفين", "نص نص", "ضيافة"].map(pm => (
                      <button key={pm} type="button" onClick={() => { setPaymentMethod(pm as any); }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors flex-1 ${paymentMethod === pm ? "bg-[#ff6b00] text-white shadow-md shadow-orange-500/20" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                        {pm}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={finalizeOrder} className="space-y-4">
                    {paymentMethod === "كاش" && (
                      <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-100 text-sm font-bold flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 mx-auto lg:mx-0" />
                        سيتم إضافة القيمة النقدية إلى الخزينة الحالية.
                      </div>
                    )}

                    {paymentMethod === "مصرف" && (
                      <div>
                        <label className="text-xs font-bold text-gray-500 block mb-2">اختر المصرف</label>
                        <select value={selectedBank} onChange={e => setSelectedBank(e.target.value)} required className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-[#ff6b00] font-bold">
                          <option value="">-- يرجى الاختبار --</option>
                          {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                    )}

                    {paymentMethod === "موظفين" && (
                      <div>
                        <label className="text-xs font-bold text-gray-500 block mb-2">اسم الموظف المستلم لطلب</label>
                        <select value={selectedEmployee || ""} onChange={e => setSelectedEmployee(e.target.value)} required className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-[#ff6b00] font-bold">
                          <option value="">-- قائمة الموظفين --</option>
                          {ALL_EMPLOYEES.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                        </select>
                      </div>
                    )}

                    {paymentMethod === "نص نص" && (
                      <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-gray-500 block mb-1">دفع نقداً</label>
                            <input type="number" step="0.5" value={splitCashAmount} onChange={e => setSplitCashAmount(e.target.value)} placeholder="0.00" className="w-full bg-white border border-gray-200 focus:border-[#ff6b00] rounded-xl px-3 py-2 text-center outline-none font-mono" />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-500 block mb-1">دفع إلكتروني</label>
                            <input type="number" step="0.5" value={splitBankAmount} onChange={e => setSplitBankAmount(e.target.value)} placeholder="0.00" className="w-full bg-white border border-gray-200 focus:border-[#ff6b00] rounded-xl px-3 py-2 text-center outline-none font-mono" />
                          </div>
                        </div>
                        {splitBankAmount && Number(splitBankAmount) > 0 && (
                          <div>
                            <label className="text-xs font-bold text-gray-500 block mb-1 mt-1">أي بنك استخدم في الدفع؟</label>
                            <select value={selectedSplitBank} onChange={e => setSelectedSplitBank(e.target.value)} required={Number(splitBankAmount) > 0} className="w-full bg-white border border-gray-200 focus:border-[#ff6b00] rounded-xl px-3 py-2 outline-none font-bold">
                              <option value="">اختر المصرف...</option>
                              {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                          </div>
                        )}
                        <hr className="border-gray-200 my-2" />
                        <div>
                          <label className="text-[10px] font-bold text-[#ff6b00] block mb-2 uppercase">تحميل جزء على موظف (اختياري!)</label>
                          <div className="flex gap-2">
                            <input type="number" step="0.5" value={splitEmpAmount} onChange={e => setSplitEmpAmount(e.target.value)} placeholder="مبلغ الخصم" className="w-1/3 bg-white border border-red-200 focus:border-red-400 rounded-xl px-3 py-2 text-center outline-none font-mono" />
                            <select value={splitEmpId || ""} onChange={e => setSplitEmpId(e.target.value)} className="w-2/3 bg-white border border-red-200 focus:border-red-400 rounded-xl px-3 py-2 outline-none font-bold">
                              <option value="">من الموظف؟ (لا أحد)</option>
                              {ALL_EMPLOYEES.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === "ضيافة" && (
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                        <label className="text-xs font-bold text-amber-700 block mb-2 flex items-center gap-1"><Lock className="w-3.5 h-3.5"/> لا يتم تأكيد الطلبات المجانية (الضيافة) إلا برقم سر المدير</label>
                        <input type="password" value={hospitalityPin} onChange={e => { setHospitalityPin(e.target.value); setHospitalityPinErr(""); }} maxLength={4} required placeholder="••••" dir="ltr" className="w-full bg-white border-2 border-amber-200 focus:border-amber-500 rounded-xl px-4 py-3 text-center text-gray-900 outline-none font-mono tracking-widest text-2xl" />
                        {hospitalityPinErr && <p className="text-red-500 text-xs mt-2 font-bold text-center">{hospitalityPinErr}</p>}
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-100 mt-6">
                      <button type="submit" className="w-full bg-[#ff6b00] hover:bg-[#e66000] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 active:scale-95">
                        <Receipt className="w-5 h-5"/>
                        تأكيد وإتمام الطلب
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* تحويل لكاشير آخر */}
              {modal === "TRANSFER_CASHIER" && (
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 border border-orange-100">
                    <Monitor className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">نقل نقدية لكاشير آخر</h3>
                  <p className="text-sm text-gray-500 mb-5 font-medium">اختر الكاشير المستلم ثم أدخل المبلغ ورقم سري المدير</p>

                  {txSuccess ? (
                    <div className="bg-green-50 border border-green-100 text-green-600 p-5 rounded-2xl text-center">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-bold text-sm">{txSuccess}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleTransferCashier} className="space-y-4">

                      {/* اختيار الكاشير */}
                      <div>
                        <label className="text-xs font-bold text-gray-500 block mb-2">الكاشير المستلم</label>
                        <div className="grid grid-cols-2 gap-2">
                          {OTHER_CASHIERS.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              disabled={c.status === "غير نشط"}
                              onClick={() => setTargetTill(c.tillNo)}
                              className={`flex items-center gap-2.5 p-3 rounded-2xl border-2 transition-all text-right ${
                                c.status === "غير نشط"
                                  ? "opacity-40 cursor-not-allowed border-gray-100 bg-gray-50"
                                  : targetTill === c.tillNo
                                    ? "border-[#ff6b00] bg-orange-50 shadow-md shadow-orange-100"
                                    : "border-gray-100 bg-gray-50 hover:border-orange-200 hover:bg-orange-50/40"
                              }`}
                            >
                              <img src={c.avatar} alt={c.name} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate">{c.name}</p>
                                <p className={`text-[10px] font-semibold mt-0.5 ${
                                  c.status === "غير نشط" ? "text-gray-400" : "text-orange-500"
                                }`}>خزينة #{c.tillNo} · {c.status}</p>
                              </div>
                              {targetTill === c.tillNo && (
                                <CheckCircle2 className="w-4 h-4 text-[#ff6b00] shrink-0 mr-auto" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* المبلغ */}
                      <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1.5">المبلغ (د.ل)</label>
                        <input type="number" min="1" step="0.5" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" dir="ltr"
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-[#ff6b00] font-mono text-lg" />
                      </div>

                      {/* PIN المدير */}
                      <div className="pt-3 border-t border-gray-100">
                        <label className="text-xs font-bold text-orange-500 block mb-1.5 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> رقم سري المدير (PIN)
                        </label>
                        <input type="password" value={pin} onChange={e => { setPin(e.target.value); setPinErr(""); }} maxLength={4} placeholder="••••" dir="ltr"
                          className="w-full bg-gray-50 border border-orange-200 focus:border-orange-500 rounded-xl px-4 py-3 text-center text-gray-900 outline-none font-mono tracking-widest text-xl" />
                        {pinErr && <p className="text-red-500 text-xs mt-1 font-semibold">{pinErr}</p>}
                      </div>

                      <button type="submit" disabled={txLoading || !targetTill}
                        className="w-full bg-[#ff6b00] hover:bg-[#e66000] text-white font-bold py-3.5 rounded-2xl transition disabled:opacity-50">
                        {txLoading ? "جاري التحقق..." : !targetTill ? "اختر الكاشير أولاً" : "تأكيد النقل"}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* توريد للخزينة الرئيسية */}
              {modal === "TRANSFER_MAIN" && (
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-5 border border-amber-100">
                    <Building className="w-6 h-6 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">توريد للخزينة الرئيسية</h3>
                  <p className="text-sm text-gray-500 mb-6 font-medium">يتطلب رقم سري من أمين الخزينة</p>
                  {txSuccess ? <div className="bg-green-50 border border-green-100 text-green-600 p-4 rounded-2xl text-center text-sm font-bold">{txSuccess}</div> : (
                    <form onSubmit={handleTransferMain} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1.5">المبلغ المراد توريده (د.ل)</label>
                        <input type="number" min="1" step="0.5" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" dir="ltr"
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-amber-500 font-mono text-lg" />
                      </div>
                      <div className="pt-3 border-t border-gray-100">
                        <label className="text-xs font-bold text-amber-500 block mb-1.5 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> رقم سري أمين الخزينة (PIN)</label>
                        <input type="password" value={pin} onChange={e => { setPin(e.target.value); setPinErr(""); }} maxLength={4} placeholder="••••" dir="ltr"
                          className="w-full bg-gray-50 border border-amber-200 focus:border-amber-500 rounded-xl px-4 py-3 text-center text-gray-900 outline-none font-mono tracking-widest text-xl" />
                        {pinErr && <p className="text-red-500 text-xs mt-1 font-semibold">{pinErr}</p>}
                      </div>
                      <button type="submit" disabled={txLoading}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-2xl transition disabled:opacity-50">
                        {txLoading ? "جاري التوريد..." : "إتمام التوريد"}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* استرجاع طلب */}
              {modal === "REFUND_ORDER" && (
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 border border-gray-200">
                    <ClipboardList className="w-6 h-6 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">استرداد وإلغاء طلب</h3>
                  <p className="text-sm text-gray-500 mb-5 font-medium">يتطلب رقم الطلب وكلمة مرور المشرف للاعتماد</p>

                  {txSuccess ? (
                    <div className="bg-green-50 border border-green-100 text-green-600 p-5 rounded-2xl text-center">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-bold text-sm">{txSuccess}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleRefundOrder} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1.5">رقم الطلب المسترد</label>
                        <input type="text" value={refundOrderId} onChange={e => { setRefundOrderId(e.target.value); setPinErr(""); }} required placeholder="مثال: 042" dir="ltr"
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-gray-400 font-mono text-lg" />
                      </div>
                      <div className="pt-3 border-t border-gray-100">
                        <label className="text-xs font-bold text-gray-500 block mb-1.5 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> رقم سري المشرف (PIN)
                        </label>
                        <input type="password" value={pin} onChange={e => { setPin(e.target.value); setPinErr(""); }} maxLength={4} placeholder="••••" dir="ltr" required
                          className="w-full bg-gray-50 border border-gray-300 focus:border-gray-500 rounded-xl px-4 py-3 text-center text-gray-900 outline-none font-mono tracking-widest text-xl" />
                        {pinErr && <p className="text-red-500 text-xs mt-1 font-semibold">{pinErr}</p>}
                      </div>
                      <button type="submit" disabled={txLoading}
                        className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3.5 rounded-2xl transition disabled:opacity-50">
                        {txLoading ? "جاري التحقق..." : "تأكيد الاسترداد"}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* إغلاق الوردية */}
              {modal === "CLOSE_SHIFT" && (
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-5 border border-red-100">
                    <FileDigit className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">إغلاق الوردية</h3>
                  <p className="text-sm text-gray-500 mb-5 font-medium">أدخل المبلغ الفعلي في الدرج لحساب الفرق</p>
                  {txSuccess ? (
                    <div className="bg-green-50 border border-green-100 text-green-600 p-4 rounded-2xl text-center text-sm font-bold">{txSuccess}</div>
                  ) : (
                    <form onSubmit={handleCloseShift} className="space-y-4">
                      {/* ملخص الوردية (محمي) */}
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2.5 relative">
                        {!balanceVisible && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/80 backdrop-blur-[1px] rounded-2xl">
                            <button type="button" onClick={() => { setShowBalancePinModal(true); setBalancePinErr(""); setBalancePinInput(""); }}
                              className="bg-white border border-gray-200 text-gray-600 font-bold text-xs px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors">
                              <Eye className="w-4 h-4" /> إظهار القيم (للمدير)
                            </button>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-semibold">الرصيد الافتتاحي</span>
                          <span className="font-bold text-gray-900 font-mono">{formatBalance(openingConfirmed ?? 0)} {balanceVisible && "د.ل"}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-t border-dashed border-gray-200 pt-2.5">
                          <span className="text-gray-500 font-semibold">المتوقع في الدرج (بعد المبيعات)</span>
                          <span className="font-bold text-[#ff6b00] font-mono">{formatBalance(tillCash ?? 0)} {balanceVisible && "د.ل"}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-800 block mb-2">الفعلي بالدرج (د.ل)</label>
                        <input type="number" min="0" step="0.01" value={actualCash} onChange={e => setActualCash(e.target.value)} required placeholder="0.00" dir="ltr"
                          className="w-full bg-gray-50 border-2 border-blue-200 focus:border-blue-500 rounded-2xl px-4 py-4 text-2xl font-bold text-gray-900 text-center outline-none font-mono" />
                      </div>
                      {actualCash !== "" && (
                        <div className={`p-4 rounded-2xl border flex items-start gap-3 ${cashDiff < 0 ? "bg-red-50 border-red-100 text-red-600" : cashDiff > 0 ? "bg-green-50 border-green-100 text-green-600" : "bg-blue-50 border-blue-100 text-blue-600"}`}>
                          {cashDiff < 0 ? <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />}
                          <div>
                            <p className="font-bold text-sm">{cashDiff < 0 ? "عجز في الدرج!" : cashDiff > 0 ? "زيادة في الدرج" : "الدرج مطابق تماماً ✓"}</p>
                            {cashDiff !== 0 && <p className="font-mono font-bold text-xl mt-1" dir="ltr">{Math.abs(cashDiff).toFixed(2)} د.ل</p>}
                            {cashDiff < 0 && <p className="text-xs mt-1 opacity-80">سيتم تسجيل العجز في سجل الكاشير</p>}
                          </div>
                        </div>
                      )}
                      <button type="submit" disabled={txLoading || !actualCash}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-2xl transition disabled:opacity-50">
                        {txLoading ? "جاري الحفظ..." : "تأكيد إغلاق الوردية"}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── تبويب الطلبات ──────────────────────────────────────────
function OrderTab({ orders, filteredProducts, activeCategory, setActiveCategory, searchQuery, setSearchQuery, cartItems, addToCart, isInCart, cycleStatus }: {
  orders: Order[]; filteredProducts: Product[]; activeCategory: string; setActiveCategory: (c: string) => void;
  searchQuery: string; setSearchQuery: (q: string) => void; cartItems: any[]; addToCart: (p: Product) => void;
  isInCart: (id: number) => boolean; cycleStatus: (id: string) => void;
}) {
  const statusColor: Record<OrderStatus, string> = {
    "قيد التحضير":   "bg-red-50 text-red-500 border-red-100",
    "جاري التوصيل": "bg-blue-50 text-blue-500 border-blue-100",
    "مكتمل":         "bg-green-50 text-green-600 border-green-100",
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* قائمة الطلبات النشطة الواردة م نمركز الاتصالات */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 bg-orange-50 border border-orange-100 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2.5 rounded-xl shadow-sm border border-orange-100">
              <Volume2 className="w-6 h-6 text-[#ff6b00]" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#ff6b00]">طلبات مركز المبيعات والاتصالات</h2>
              <p className="text-xs text-gray-500 font-bold">الطلبات الواردة للدليفري واستلام عبر الفرع</p>
            </div>
          </div>
          <span className="bg-white border border-[#ff6b00]/30 text-[#ff6b00] text-sm font-extrabold px-3 py-1.5 rounded-full shadow-sm mt-3 md:mt-0">
            {orders.filter(o => o.status !== "مكتمل").length} طلبات جديدة
          </span>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2">
          {orders.map(order => (
            <button key={order.id} onClick={() => cycleStatus(order.id)}
              className="min-w-[190px] bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#ff6b00]/30 transition-all text-right group relative overflow-hidden">
              {order.status === "قيد التحضير" && <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-red-400 to-[#ff6b00]" />}
              {order.status === "جاري التوصيل" && <div className="absolute top-0 right-0 w-full h-1 bg-blue-400" />}
              
              <div className="flex justify-between items-center mt-1 mb-2">
                <div className="flex items-center gap-1.5 text-gray-900 font-bold text-sm">
                  <ClipboardList className="w-4 h-4 text-gray-400" />
                  {order.customer}
                </div>
                <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 rounded-md border border-gray-100">#{order.id}</span>
              </div>
              <div className="text-xs text-[#ff6b00] font-bold mb-3 flex items-center justify-between">
                <span>طاولة {order.table}</span>
                <span className="text-gray-400">{order.time}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${statusColor[order.status]}`}>{order.status}</span>
                <span className="text-sm font-bold text-gray-900">{order.total.toFixed(2)} <span className="text-[10px] text-gray-400">د.ل</span></span>
              </div>
              {order.status !== "مكتمل" && (
                <p className="text-[10px] text-gray-400 mt-3 opacity-0 group-hover:opacity-100 transition-opacity font-bold">اضغط لتحديث الحالة ←</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* قائمة المنتجات */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
          <h2 className="text-lg font-extrabold text-gray-900">قائمة الطعام</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="ابحث في القائمة..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="bg-white border border-gray-200 text-sm font-medium rounded-full pr-9 pl-4 py-2 outline-none focus:border-[#ff6b00] w-56 shadow-sm transition" />
          </div>
        </div>

        <div className="flex items-center gap-5 border-b border-gray-200 mb-5 overflow-x-auto">
          {MENU_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`pb-3 text-sm font-bold whitespace-nowrap transition-colors relative ${activeCategory === cat ? "text-[#ff6b00]" : "text-gray-500 hover:text-gray-900"}`}>
              {cat}
              {activeCategory === cat && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff6b00]" />}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => {
            const inCart = isInCart(product.id);
            return (
              <button key={product.id} onClick={() => addToCart(product)}
                className={`bg-white rounded-3xl p-3 border-2 transition-all text-right group relative ${inCart ? "border-[#ff6b00]/40 shadow-lg shadow-orange-100" : "border-transparent shadow-sm hover:shadow-md hover:border-orange-100"}`}>
                <div className="h-32 w-full rounded-2xl mb-3 overflow-hidden bg-gray-50 relative flex items-center justify-center">
                  <img src={product.image} alt={product.name}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
                  {inCart && (
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#ff6b00] flex items-center justify-center text-white border-2 border-white shadow">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-2xl" />
                </div>
                <h3 className="text-xs font-extrabold text-gray-900 mb-1 leading-tight line-clamp-2">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-gray-400 font-semibold">{product.category}</p>
                  <span className="text-[#ff6b00] font-extrabold text-sm">{product.price} د.ل</span>
                </div>
              </button>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="col-span-4 text-center py-16 text-gray-300">
              <Search className="w-12 h-12 mx-auto mb-3" />
              <p className="font-medium">لا توجد منتجات</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── تبويب المعاملات / إدارة الخزينة ────────────────────────
function TillTab({ tillCash, balanceVisible, formatBalance, onRevealBalance, onHideBalance, openModal }: {
  tillCash: number | null;
  balanceVisible: boolean;
  formatBalance: (val: number) => string;
  onRevealBalance: () => void;
  onHideBalance: () => void;
  openModal: (m: "TRANSFER_CASHIER" | "TRANSFER_MAIN" | "CLOSE_SHIFT" | "REFUND_ORDER") => void;
}) {
  return (
    <div className="p-6 h-full overflow-y-auto" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">إدارة الخزينة</h2>
          <p className="text-gray-500 text-sm font-medium">إدارة درج الكاشير وتسديد الوردية</p>
        </div>

        {/* بطاقة رصيد الدرج */}
        <div className="bg-white border border-gray-100 rounded-3xl p-7 mb-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-orange-50 rounded-full -translate-x-32 -translate-y-32 opacity-50" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                  <Monitor className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold text-gray-900">الخزينة الحالية</h3>
              </div>
              <p className="text-gray-500 text-sm font-medium max-w-xs">الرصيد محسوب بناءً على المبلغ الافتتاحي والمبيعات</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 min-w-[240px]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-xs font-bold">الرصيد المتوقع</p>
                <button
                  onClick={balanceVisible ? onHideBalance : onRevealBalance}
                  className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg transition-all border
                    border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50"
                >
                  {balanceVisible
                    ? <><EyeOff className="w-3.5 h-3.5" /> إخفاء</>
                    : <><Eye className="w-3.5 h-3.5" /> عرض الرصيد</>}
                </button>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold font-mono tracking-wider ${
                  balanceVisible ? "text-gray-900" : "text-gray-300 select-none"
                }`}>{formatBalance(tillCash ?? 0)}</span>
                {balanceVisible && <span className="text-orange-500 font-extrabold">د.ل</span>}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-xs font-bold text-gray-400">
                <span>خزينة #03</span>
                <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded-full">نشطة</span>
              </div>
            </div>
          </div>
        </div>

        {/* أزرار العمليات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button onClick={() => openModal("TRANSFER_CASHIER")}
            className="bg-white border border-gray-100 rounded-3xl p-6 text-right shadow-sm hover:shadow-lg hover:border-orange-200 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Monitor className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900 mb-1">نقل لكاشير آخر</h3>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">يتطلب PIN من مدير الفرع</p>
          </button>

          <button onClick={() => openModal("TRANSFER_MAIN")}
            className="bg-white border border-gray-100 rounded-3xl p-6 text-right shadow-sm hover:shadow-lg hover:border-amber-200 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900 mb-1">توريد للخزينة الرئيسية</h3>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">يتطلب PIN من أمين الخزينة</p>
          </button>

          <button onClick={() => openModal("REFUND_ORDER")}
            className="bg-white border border-gray-100 rounded-3xl p-6 text-right shadow-sm hover:shadow-lg hover:border-gray-300 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900 mb-1">استرداد طلب</h3>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">يتطلب إضافة رقم الطلب و PIN مشرف</p>
          </button>

          <button onClick={() => openModal("CLOSE_SHIFT")}
            className="bg-gradient-to-br from-red-500 to-red-600 rounded-3xl p-6 text-right shadow-lg shadow-red-500/20 hover:shadow-xl transition-all group text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform backdrop-blur-sm">
              <FileDigit className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold mb-1 relative z-10">إغلاق الوردية</h3>
            <p className="text-xs text-red-100 font-medium leading-relaxed relative z-10">حساب العجز أو الزيادة وتصفية الدرج</p>
          </button>
        </div>
      </div>
    </div>
  );
}
