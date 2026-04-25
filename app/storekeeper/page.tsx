"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PackageSearch, FileText, Truck, ArrowRightLeft,
  CheckCircle2, AlertCircle, Building, DollarSign,
  ClipboardList, Search, Plus, Clock, LogOut, PackageCheck,
  Users, Package, ShoppingBag, Send
} from "lucide-react";

import { db, seedDatabase } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect } from "react";
import type { InventoryItem, Invoice, BranchRequest } from "@/lib/db";
import { clearSession } from "@/lib/auth";

// نوع محلي مختصر لسهولة قراءة الكود
type StockItem = InventoryItem;

// ─── أنواع ──────────────────────────────────────────────────
type TabType = "المخزون الرئيسي" | "توريد الموردين" | "اعتماد الفواتير" | "صرف المخزون" | "إدارة الموردين" | "طلبات الشراء";

const BRANCHES = ["فرع وسط البلاد", "فرع الحدائق", "فرع فينيسيا"];

// ─── المكون الرئيسي ─────────────────────────────────────────
export default function StorekeeperPage() {
  const [activeTab, setActiveTab] = useState<TabType>("المخزون الرئيسي");
  const [successMsg, setSuccessMsg] = useState("");
  const [outboundLogs, setOutboundLogs] = useState<any[]>([]);

  // استخدام Dexie مباشر
  const mainStock = useLiveQuery(() => db.inventory.toArray()) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray()) || [];
  const requests = useLiveQuery(() => db.branchRequests.toArray()) || [];
  const purchaseRequests = useLiveQuery(() => db.purchaseRequests.toArray()) || [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];

  // تأسيس قاعدة البيانات في حال كانت فارغة
  useEffect(() => {
    seedDatabase();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  // 1. إضافة فاتورة مورد
  const handleAddInvoice = async (inv: any) => {
    const newInvId = `INV-${Math.floor(Math.random() * 10000)}`;
    await db.invoices.add({
      ...inv,
      id: newInvId,
      date: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      status: "قيد المراجعة",
      isSynced: false
    });
    showSuccess("تم إرسال الفاتورة للمحاسب للمراجعة. المخزون لن يتأثر حتى تُعتمد.");
  };

  // 2. اعتماد الموافقة بنجاح وحساب المتوسط
  const handleApproveInvoice = async (invoiceId: string) => {
    const inv = await db.invoices.get(invoiceId);
    if (!inv) return;
    
    const item = await db.inventory.get(inv.itemId);
    if (item) {
      const oldTotalValue = item.qty * item.avgPrice;
      const newTotalValue = inv.qty * inv.unitPrice;
      const totalQty = item.qty + inv.qty;
      const newAvgPrice = (oldTotalValue + newTotalValue) / totalQty;
      
      await db.inventory.update(inv.itemId, { qty: totalQty, avgPrice: newAvgPrice });
    }
    
    await db.invoices.update(invoiceId, { status: "معتمدة" });
    showSuccess("تم الاعتماد! تحديث الرصيد وتكلفة المتوسط المرجح بنجاح.");
  };

  // 3. صرف البضائع للفروع
  const handleDispatch = async (itemId: number, qty: number, targetBranch: string, reqId?: string) => {
    const item = await db.inventory.get(itemId);
    if (!item) return;

    if (item.qty < qty) {
      alert("الكمية المطلوبة أكبر من المتوفر في المخزن الرئيسي!");
      return;
    }

    // خصم من المخزن وإضافة للفرع
    const newBranchQtys = { ...(item.branchQtys || {}) };
    newBranchQtys[targetBranch] = (newBranchQtys[targetBranch] || 0) + qty;

    await db.inventory.update(itemId, { 
      qty: item.qty - qty,
      branchQtys: newBranchQtys
    });

    // تسجيل خروج الوثيقة
    setOutboundLogs(prev => [{
      id: Date.now(),
      time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      itemName: item.name,
      qtyStr: `${qty} ${item.unit}`,
      target: targetBranch,
      costUsed: item.avgPrice
    }, ...prev]);

    // إذا كان تلبية لطلب فرع يُقفل
    if (reqId) {
      await db.branchRequests.update(reqId, { status: "منفذ" });
    }

    showSuccess(`تم الصرف بنجاح وتوجيه الإرسالية لـ (${targetBranch}).`);
  };

  return (
    <div className="flex h-screen bg-[#f8f9fd] text-gray-900 font-sans" dir="rtl">
      {/* ── القائمة الجانبية (Sidebar) ── */}
      <aside className="w-72 bg-white border-l border-gray-100 flex flex-col shadow-[rgba(0,0,0,0.02)_0px_0px_20px] shrink-0 z-20">
        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#ff6b00] to-[#ff985c] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <PackageSearch className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-tight">المخزن الرئيسي</h1>
            <p className="text-xs text-orange-500 font-bold uppercase tracking-wider">لوحة أمين المخازن</p>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-1">
          <p className="text-[10px] font-extrabold text-gray-400 mb-3 px-3 tracking-widest uppercase">العمليات والمتابعة</p>
          
          {
            [
              { id: "المخزون الرئيسي", icon: Building },
              { id: "توريد الموردين", icon: FileText },
              { id: "اعتماد الفواتير", icon: CheckCircle2 },
              { id: "صرف المخزون", icon: Truck },
              { id: "إدارة الموردين", icon: Users },
              { id: "طلبات الشراء", icon: ShoppingBag },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm relative ${
                    isActive
                      ? "bg-orange-50 text-orange-600 shadow-sm"
                      : "text-gray-500 hover:bg-[#f8f9fd] hover:text-gray-900"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? "text-orange-600" : "text-gray-400"
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span>{tab.id}</span>
                  {tab.id === "اعتماد الفواتير" &&
                    invoices.some((i) => i.status === "قيد المراجعة") && (
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full absolute left-4 border-2 border-white shadow-sm" />
                    )}
                  {tab.id === "صرف المخزون" &&
                    requests.some((r) => r.status === "جديد") && (
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full absolute left-4 border-2 border-white shadow-sm" />
                    )}
                  {tab.id === "طلبات الشراء" &&
                    purchaseRequests.some((r) => r.status === "معلق") && (
                      <span className="w-2.5 h-2.5 bg-orange-500 rounded-full absolute left-4 border-2 border-white shadow-sm" />
                    )}
                </button>
              );
            })
          }
        </div>

        <div className="p-4 border-t border-gray-50 shrink-0">
          <button
            onClick={() => { clearSession(); window.location.href = "/"; }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm border border-transparent hover:border-red-100"
          >
            <LogOut className="w-5 h-5" /> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ── المحتوى الرئيسي ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <AnimatePresence>
          {successMsg && (
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-green-500/20 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <header className="h-16 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-extrabold text-gray-800">{activeTab}</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-500">أمين المخزن:</span>
            <span className="bg-orange-50 text-orange-800 text-sm font-extrabold px-3 py-1.5 rounded-lg border border-orange-100">رائد حسن</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === "المخزون الرئيسي" && <MainStockView stock={mainStock} />}
            {activeTab === "توريد الموردين" && <IncomingInvoicesView stock={mainStock} onAddInvoice={handleAddInvoice} invoices={invoices} suppliers={suppliers} />}
            {activeTab === "اعتماد الفواتير" && <ApprovalsView stock={mainStock} invoices={invoices} onApprove={handleApproveInvoice} />}
            {activeTab === "صرف المخزون" && <OutboundFulfillmentView stock={mainStock} requests={requests} logs={outboundLogs} onDispatch={handleDispatch} />}
            {activeTab === "إدارة الموردين" && <SuppliersView suppliers={suppliers} onAdd={showSuccess} />}
            {activeTab === "طلبات الشراء" && <PurchaseRequestsView stock={mainStock} suppliers={suppliers} purchaseRequests={purchaseRequests} onAdd={showSuccess} />}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── 1. المكون: عرض المخزون الرئيسي ────────────────────────────
function MainStockView({ stock }: { stock: StockItem[] }) {
  const totalValue = stock.reduce((acc, item) => acc + (item.qty * item.avgPrice), 0);

  return (
    <div className="space-y-6">
      {/* ملخص المالي */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-50 border border-amber-100 text-amber-500 rounded-2xl flex items-center justify-center">
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-500 font-bold text-xs mb-1">إجمالي قيمة المواد المخزنة</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 font-mono tracking-tight">{totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              <span className="text-base font-bold text-amber-500">د.ل</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 max-w-[200px] text-left relative z-10 font-medium">مُحتسبة بناءً على المعادلة المالية (المتوسط المرجّح للمخزون).</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-[#f8f9fd]/50">
          <h3 className="text-lg font-bold text-gray-900">الأصناف الحالية (Main Warehouse)</h3>
        </div>
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-[#f8f9fd] border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 w-16">#</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500">الصنف</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500">التصنيف</th>
              <th className="px-6 py-4 text-xs font-bold text-orange-600 text-center">الرصيد المتاح</th>
              <th className="px-6 py-4 text-xs font-bold text-green-600 text-center">تكلفة الوحدة (المتوسط)</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 text-center">إجمالي القيمة</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 text-center">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {stock.map((item, idx) => {
              const isLow = item.qty <= item.min;
              const itemTotalValue = item.qty * item.avgPrice;
              return (
                <tr key={item.id} className="hover:bg-[#f8f9fd]/50 transition">
                  <td className="px-6 py-4 text-xs font-bold text-gray-400">{item.id}</td>
                  <td className="px-6 py-4 text-sm font-extrabold text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-500"><span className="bg-gray-100 px-2 py-1 rounded-md">{item.category}</span></td>
                  <td className="px-6 py-4 text-sm font-mono font-bold text-center text-orange-700 bg-orange-50/30">
                    {item.qty} <span className="text-[10px] text-gray-400 font-sans">{item.unit}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono font-bold text-center text-green-600 bg-green-50/30">
                    {item.avgPrice.toFixed(2)} <span className="text-[10px] text-green-500/60 font-sans">د.ل</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono font-bold text-center text-gray-700">
                    {itemTotalValue.toLocaleString(undefined, {minimumFractionDigits: 2})} <span className="text-[10px] text-gray-400 font-sans">د.ل</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {isLow ? (
                      <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded-lg text-[10px] font-bold">
                        <AlertCircle className="w-3.5 h-3.5" /> نفاد مبكر
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-[#f8f9fd] text-gray-500 border border-gray-100 px-2 py-1 rounded-lg text-[10px] font-bold">
                        متوفر
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 2. المكون: إدخال الفواتير والموردين ──────────────────────
function IncomingInvoicesView({ stock, onAddInvoice, invoices, suppliers }: { stock: StockItem[], onAddInvoice: any, invoices: Invoice[], suppliers: any[] }) {
  const [supplier, setSupplier] = useState("");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("كجم");
  const [newItemCategory, setNewItemCategory] = useState("مواد خام");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalItemId = Number(itemId);

    if (itemId === "NEW") {
      if (!newItemName) return;
      // إضافة الصنف الجديد فوراً للمخزون برصيد صفر
      const newId = await db.inventory.add({
        name: newItemName,
        category: newItemCategory,
        qty: 0,
        unit: newItemUnit,
        min: 10,
        avgPrice: 0,
        branchQtys: {},
        isSynced: false
      });
      finalItemId = newId as number;
    }

    onAddInvoice({ supplier, itemId: finalItemId, qty: Number(qty), unitPrice: parseFloat(unitPrice) });
    setSupplier(""); setItemId(""); setQty(""); setUnitPrice("");
    setNewItemName(""); setNewItemUnit("كجم"); setNewItemCategory("مواد خام");
  };

  const pendingInvoices = invoices.filter(i => i.status === "قيد المراجعة");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* النموذج المباشر لتوريد المواد */}
      <div className="lg:col-span-5 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm h-fit">
        <h3 className="text-xl font-extrabold text-gray-900 mb-2">تسجيل إيصال توريد مستلم</h3>
        <p className="text-xs text-gray-500 mb-6 font-bold leading-relaxed">قم بتسجيل الفاتورة الحقيقية للمواد المستلمة اليوم. لن يتم إضافة المورد للمخزن ولن يتأثر متوسط السعر إلا بعد مراجعة <strong className="text-orange-500">القسم المالي والمحاسبة</strong> للاعتماد النهائي.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-2">بيان واسم المُورّد</label>
            <select value={supplier} onChange={e => setSupplier(e.target.value)} required className="w-full bg-[#f8f9fd] border-2 border-gray-100 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-bold">
              <option value="">اختار المورد...</option>
              {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-2">الصنف والتعبئة</label>
            <select value={itemId} onChange={e => setItemId(e.target.value)} required className="w-full bg-[#f8f9fd] border-2 border-gray-100 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-bold">
              <option value="">تحديد المادة الغذائية/التشغيلية...</option>
              <option value="NEW">➕ إضافة صنف جديد (غير موجود بالقائمة)...</option>
              {stock.map(s => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
            </select>
          </div>

          {itemId === "NEW" && (
            <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-orange-600 mb-1">تفاصيل الصنف الجديد</h4>
              <div>
                <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} required placeholder="اسم الصنف الجديد (مثال: دقيق فاخر 50 كجم)" className="w-full bg-white border-2 border-gray-100 focus:border-orange-400 rounded-lg px-3 py-2 text-sm outline-none font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} className="w-full bg-white border-2 border-gray-100 focus:border-orange-400 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="مواد خام">مواد خام</option>
                  <option value="تغليف وتعبئة">تغليف وتعبئة</option>
                  <option value="مشروبات">مشروبات</option>
                  <option value="أخرى">أخرى</option>
                </select>
                <select value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} className="w-full bg-white border-2 border-gray-100 focus:border-orange-400 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="كجم">كجم</option>
                  <option value="جرام">جرام</option>
                  <option value="لتر">لتر</option>
                  <option value="قطعة">قطعة</option>
                  <option value="صندوق">صندوق</option>
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-2">الكمية المستلمة الفعليا</label>
              <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} required placeholder="عدد صحيح..." className="w-full bg-[#f8f9fd] border-2 border-gray-100 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-mono text-center text-lg" />
            </div>
            <div>
              <label className="text-xs font-bold text-amber-500 block mb-2">سعر الإفراد (حسب الفاتورة)</label>
              <input type="number" step="0.01" min="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} required placeholder="0.00 د.ل" className="w-full bg-amber-50 border-2 border-amber-100 focus:border-amber-500 rounded-xl px-4 py-3 outline-none font-mono text-center text-lg text-amber-900" />
            </div>
          </div>
          <button type="submit" className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-xl font-bold transition">
            <Plus className="w-5 h-5" /> تسجيل إذن توريد معلق للمراجعة
          </button>
        </form>
      </div>

      {/* الفواتير المعلّقة */}
      <div className="lg:col-span-7 space-y-4">
        <h3 className="text-lg font-extrabold text-orange-600 mb-2 flex items-center gap-2">
          <Clock className="w-5 h-5" /> فواتير قيد مراجعة المحاسبين ({pendingInvoices.length})
        </h3>
        {pendingInvoices.length === 0 ? (
          <div className="bg-[#f8f9fd] border border-gray-100 rounded-3xl p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 font-bold text-sm">ممتاز، لا يوجد إيصالات توريد معلقة ومحجوزة حالياً!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {pendingInvoices.map(inv => {
              const item = stock.find(i => i.id === inv.itemId);
              return (
                <div key={inv.id} className="bg-white border text-right border-orange-100 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-orange-400" />
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-extrabold text-gray-900 text-sm">{inv.supplier}</p>
                      <span className="text-[10px] font-mono text-gray-400 bg-[#f8f9fd] px-2 rounded">{inv.id}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-500 mb-2">{item?.name} — شراء {inv.qty} {item?.unit} بسعر {inv.unitPrice} د.ل للإفراد.</p>
                    <div className="flex justify-between items-center bg-[#f8f9fd] p-2 rounded-lg text-xs font-bold mt-2">
                      <span className="text-gray-400">إجمالي المطلوب سداده</span>
                      <span className="text-orange-600 font-mono text-sm">{(inv.qty * inv.unitPrice).toFixed(2)} د.ل</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <p className="text-[10px] text-center mt-2 text-gray-400">اذهب لتبويبة (اعتماد الفواتير) لمحاكاة عملية الاعتماد لرؤية حركة المتوسط المرجح.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 3. المكون: شاشة تجربة المحاسب لاعتماد الفواتير ───────────
function ApprovalsView({ stock, invoices, onApprove }: { stock: StockItem[], invoices: Invoice[], onApprove: any }) {
  const unapproved = invoices.filter(i => i.status === "قيد المراجعة");

  return (
    <div className="space-y-6">
<div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-amber-900 mb-2">اعتماد فواتير الموردين</h3>
          <p className="text-xs text-amber-700 font-medium">اعتماد الفواتير المستلمة من الموردين. عند الاعتماد ستُطبّق معادلة <strong>المتوسط المرجح للتكلفة</strong> وتُدمج في المخزون الرئيسي.</p>
        </div>

      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-50 bg-[#f8f9fd]/50">
          <h3 className="text-sm font-extrabold text-gray-900">سجل الإيصالات المعلقة</h3>
        </div>
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-[#f8f9fd] border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 w-24">رقم السجل</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500">المورد والمادة</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 text-center">الكمية</th>
              <th className="px-6 py-4 text-xs font-bold text-orange-600 text-center">التكلفة الجديدة للمادة الفردية</th>
              <th className="px-6 py-4 text-xs font-bold text-green-600 text-center">الإجراء (للتجربة)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {unapproved.map(inv => {
              const item = stock.find(i => i.id === inv.itemId);
              return (
                <tr key={inv.id} className="hover:bg-[#f8f9fd]/50 transition">
                  <td className="px-6 py-4 text-xs font-mono font-bold text-gray-400 bg-[#f8f9fd]/50">{inv.id}</td>
                  <td className="px-6 py-4 text-sm font-extrabold text-gray-900">
                    {inv.supplier}
                    <p className="text-[10px] text-gray-500 font-bold mt-1">المادة المستلمة: ({item?.name})</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono font-bold text-center text-gray-700 bg-[#f8f9fd]/30">
                    {inv.qty} <span className="text-[10px] text-gray-400 font-sans">{item?.unit}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono font-bold text-center text-orange-600 bg-orange-50/30">
                    {inv.unitPrice.toFixed(2)} <span className="text-[10px] text-orange-500/60 font-sans">د.ل</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => onApprove(inv.id)} className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-green-500/20 transition flex items-center justify-center gap-1.5 mx-auto">
                      <CheckCircle2 className="w-4 h-4" /> اعتماد وتمرير للمخزون
                    </button>
                  </td>
                </tr>
              );
            })}
            {unapproved.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm font-bold">كل الفواتير معتمدة!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

// ─── 5. إدارة الموردين ──────────────────────────────────────────
function SuppliersView({ suppliers, onAdd }: { suppliers: any[]; onAdd: (msg: string) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("مواد غذائية");
  const [notes, setNotes] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.suppliers.add({ name, phone, address, category, notes, createdAt: new Date().toISOString() });
    onAdd(`تم إضافة المورد "${name}" بنجاح`);
    setName(""); setPhone(""); setAddress(""); setNotes("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 bg-white border border-gray-100 rounded-3xl p-7 shadow-sm h-fit">
        <h3 className="text-xl font-extrabold text-gray-900 mb-1 flex items-center gap-2"><Users className="w-5 h-5 text-orange-500" /> إضافة مورد جديد</h3>
        <p className="text-xs text-gray-400 font-medium mb-6">أضف موردين لتستخدمهم في طلبات الشراء لاحقاً</p>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">اسم المورد *</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="مثال: شركة النسيم الغذائية"
              className="w-full bg-gray-50 border-2 border-gray-100 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-bold" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">رقم الهاتف</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="09xxxxxxxx" dir="ltr"
              className="w-full bg-gray-50 border-2 border-gray-100 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-bold" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">فئة المورد</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-100 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-bold">
              {["مواد غذائية","لحوم ودواجن","مخبوزات","تغليف ومواد","مشروبات","أخرى"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">العنوان</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="عنوان المورد..."
              className="w-full bg-gray-50 border-2 border-gray-100 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-bold" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">ملاحظات</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="أي ملاحظات إضافية..."
              className="w-full bg-gray-50 border-2 border-gray-100 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-bold" />
          </div>
          <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">
            <Plus className="w-5 h-5" /> إضافة المورد
          </button>
        </form>
      </div>

      <div className="lg:col-span-8">
        <h3 className="text-lg font-extrabold text-gray-900 mb-4">قائمة الموردين ({suppliers.length})</h3>
        {suppliers.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3" />
            <p className="font-bold">لم تُضف أي موردين بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.map((s: any) => (
              <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-extrabold text-gray-900">{s.name}</p>
                    {s.phone && <p className="text-xs text-gray-400 font-mono mt-0.5" dir="ltr">{s.phone}</p>}
                  </div>
                  <span className="text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-100 px-2 py-1 rounded-lg">{s.category}</span>
                </div>
                {s.address && <p className="text-xs text-gray-500 font-medium mt-2">{s.address}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 6. طلبات الشراء ────────────────────────────────────────────
function PurchaseRequestsView({ stock, suppliers, purchaseRequests, onAdd }: { stock: any[]; suppliers: any[]; purchaseRequests: any[]; onAdd: (msg: string) => void }) {
  const [supplierName, setSupplierName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("كجم");
  const [unitPrice, setUnitPrice] = useState("");
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [notes, setNotes] = useState("");

  const total = parseFloat(qty || "0") * parseFloat(unitPrice || "0");

  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("كجم");
  const [newItemCategory, setNewItemCategory] = useState("مواد خام");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = await db.purchaseRequests.count();
    const requestNumber = `PR-${String(count + 1).padStart(4, "0")}`;
    
    let finalItemId: number | undefined;
    let finalItemName = itemName;
    let finalUnit = unit;

    if (itemId === "NEW") {
      if (!newItemName) return;
      const newId = await db.inventory.add({
        name: newItemName,
        category: newItemCategory,
        qty: 0,
        unit: newItemUnit,
        min: 10,
        avgPrice: 0,
        branchQtys: {},
        isSynced: false
      });
      finalItemId = newId as number;
      finalItemName = newItemName;
      finalUnit = newItemUnit;
    } else {
      const selectedItem = stock.find(s => String(s.id) === itemId);
      finalItemId = selectedItem?.id;
      finalItemName = selectedItem?.name || itemName;
      finalUnit = selectedItem?.unit || unit;
    }

    await db.purchaseRequests.add({
      requestNumber,
      supplierName,
      itemId: finalItemId,
      itemName: finalItemName,
      qty: parseFloat(qty),
      unit: finalUnit,
      unitPrice: parseFloat(unitPrice),
      totalAmount: total,
      branch,
      notes: notes || undefined,
      status: "معلق",
      createdAt: new Date().toISOString(),
    });
    onAdd(`تم إرسال طلب الشراء ${requestNumber} للاعتماد`);
    setSupplierName(""); setItemId(""); setItemName(""); setQty(""); setUnitPrice(""); setNotes("");
    setNewItemName(""); setNewItemUnit("كجم"); setNewItemCategory("مواد خام");
  };

  const statusColor: Record<string, string> = {
    "معلق": "bg-amber-50 text-amber-600 border-amber-200",
    "معتمد - دين": "bg-blue-50 text-blue-600 border-blue-200",
    "معتمد - صرف": "bg-green-50 text-green-600 border-green-200",
    "مرفوض": "bg-red-50 text-red-500 border-red-200",
  };

  return (
    <div className="space-y-8">
      {/* نموذج إنشاء طلب شراء */}
      <div className="bg-white border border-gray-100 rounded-3xl p-7 shadow-sm">
        <h3 className="text-xl font-extrabold text-gray-900 mb-1 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-orange-500" /> إنشاء طلب شراء جديد
        </h3>
        <p className="text-xs text-gray-400 font-medium mb-6">سيُرسَل الطلب للمدير للاعتماد (دين أو صرف نقدي)</p>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">المورد *</label>
            <select value={supplierName} onChange={e => setSupplierName(e.target.value)} required
              className="w-full bg-gray-50 border-2 border-gray-100 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-bold">
              <option value="">اختر المورد...</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
              <option value="مورد آخر">مورد آخر</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">الصنف المطلوب *</label>
            <select value={itemId} onChange={e => setItemId(e.target.value)} required
              className="w-full bg-gray-50 border-2 border-gray-100 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-bold">
              <option value="">اختر الصنف...</option>
              <option value="NEW">➕ إضافة صنف جديد (غير موجود بالقائمة)...</option>
              {stock.map(s => <option key={s.id} value={String(s.id)}>{s.name} ({s.unit})</option>)}
            </select>
          </div>
          
          {itemId === "NEW" && (
            <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-xl space-y-3 md:col-span-2 lg:col-span-3">
              <h4 className="text-xs font-bold text-orange-600 mb-1">تفاصيل الصنف الجديد</h4>
              <div>
                <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} required placeholder="اسم الصنف الجديد (مثال: دقيق فاخر 50 كجم)" className="w-full bg-white border-2 border-gray-100 focus:border-orange-400 rounded-lg px-3 py-2 text-sm outline-none font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} className="w-full bg-white border-2 border-gray-100 focus:border-orange-400 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="مواد خام">مواد خام</option>
                  <option value="تغليف وتعبئة">تغليف وتعبئة</option>
                  <option value="مشروبات">مشروبات</option>
                  <option value="أخرى">أخرى</option>
                </select>
                <select value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} className="w-full bg-white border-2 border-gray-100 focus:border-orange-400 rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="كجم">كجم</option>
                  <option value="جرام">جرام</option>
                  <option value="لتر">لتر</option>
                  <option value="قطعة">قطعة</option>
                  <option value="صندوق">صندوق</option>
                </select>
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">الفرع</label>
            <select value={branch} onChange={e => setBranch(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-100 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-bold">
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">الكمية *</label>
            <input type="number" min="1" required value={qty} onChange={e => setQty(e.target.value)} placeholder="0"
              className="w-full bg-gray-50 border-2 border-gray-100 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-mono text-lg text-center" />
          </div>
          <div>
            <label className="text-xs font-bold text-amber-600 block mb-1">سعر الوحدة (د.ل) *</label>
            <input type="number" step="0.01" min="0.01" required value={unitPrice} onChange={e => setUnitPrice(e.target.value)} placeholder="0.00"
              className="w-full bg-amber-50 border-2 border-amber-100 focus:border-amber-500 rounded-xl px-4 py-3 outline-none font-mono text-lg text-center text-amber-900" />
          </div>
          <div>
            <label className="text-xs font-bold text-green-700 block mb-1">الإجمالي</label>
            <div className="w-full bg-green-50 border-2 border-green-100 rounded-xl px-4 py-3 font-mono text-lg text-center text-green-800 font-extrabold">
              {total.toFixed(2)} د.ل
            </div>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="text-xs font-bold text-gray-500 block mb-1">ملاحظات</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات للمدير..."
              className="w-full bg-gray-50 border-2 border-gray-100 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-bold" />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <button type="submit"
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg">
              <Send className="w-5 h-5" /> إرسال طلب الشراء للاعتماد
            </button>
          </div>
        </form>
      </div>

      {/* سجل الطلبات */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="font-extrabold text-gray-900">سجل طلبات الشراء ({purchaseRequests.length})</h3>
          <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full">
            {purchaseRequests.filter(r => r.status === "معلق").length} بانتظار الاعتماد
          </span>
        </div>
        <table className="w-full text-right">
          <thead>
            <tr className="bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
              <th className="px-5 py-3">رقم الطلب</th>
              <th className="px-5 py-3">المورد</th>
              <th className="px-5 py-3">الصنف</th>
              <th className="px-5 py-3 text-center">الكمية</th>
              <th className="px-5 py-3 text-center">الإجمالي</th>
              <th className="px-5 py-3 text-center">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {purchaseRequests.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-4 font-mono text-xs text-gray-400">{r.requestNumber}</td>
                <td className="px-5 py-4 font-bold text-sm text-gray-900">{r.supplierName}</td>
                <td className="px-5 py-4 text-sm text-gray-600">{r.itemName}</td>
                <td className="px-5 py-4 text-center font-mono text-sm">{r.qty} {r.unit}</td>
                <td className="px-5 py-4 text-center font-mono font-bold text-orange-600">{r.totalAmount.toFixed(2)} د.ل</td>
                <td className="px-5 py-4 text-center">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${statusColor[r.status] || ""}`}>{r.status}</span>
                </td>
              </tr>
            ))}
            {purchaseRequests.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm font-bold">لا توجد طلبات شراء بعد</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 4. المكون: صرف المخزون للفروع (Outbound) ─────────────────
function OutboundFulfillmentView({ stock, requests, logs, onDispatch }: { stock: StockItem[], requests: BranchRequest[], logs: any[], onDispatch: any }) {
  const pendingRequests = requests.filter(r => r.status === "جديد");

  const [selBranch, setSelBranch] = useState("");
  const [selItem, setSelItem] = useState("");
  const [qty, setQty] = useState("");

  const handleManualDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    onDispatch(Number(selItem), Number(qty), selBranch);
    setSelItem(""); setQty(""); setSelBranch("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      
      {/* القسم الأيمن: تلبية الطلبات */}
      <div className="space-y-6">
        <h3 className="text-xl font-extrabold text-gray-900 mb-2 flex items-center gap-2">
          نواقص فروعنا وطلبياتها <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
        </h3>
        {pendingRequests.map(req => {
          const item = stock.find(i => i.id === req.itemId);
          const hasEnough = (item?.qty || 0) >= req.qtyRequested;

          return (
            <div key={req.id} className={`bg-white border ${hasEnough ? 'border-gray-200' : 'border-red-200'} rounded-2xl p-5 shadow-sm`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-gray-400" /> {req.branch}
                  </h4>
                  <p className="text-xs font-bold text-gray-500 mt-1">يطلب: <strong className="text-orange-600">{item?.name}</strong> بكمية ({req.qtyRequested} {item?.unit})</p>
                </div>
                <span className="text-[10px] font-mono text-gray-400 bg-[#f8f9fd] px-2 rounded border border-gray-100">{req.id}</span>
              </div>

              {!hasEnough && (
                <div className="bg-red-50 text-red-600 text-[10px] p-2 rounded-lg font-bold mb-4 border border-red-100 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> تحذير: الكمية الموجودة بالمخزن الرئيسي ({item?.qty}) لا تكفي لتنفيذ الطلب!
                </div>
              )}

              <button disabled={!hasEnough} onClick={() => onDispatch(req.itemId, req.qtyRequested, req.branch, req.id)} className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-sm">
                <Truck className="w-4 h-4" /> أمر بتلبيــة وإرسال الشحنة
              </button>
            </div>
          );
        })}

        {pendingRequests.length === 0 && (
          <div className="bg-[#f8f9fd] border border-gray-100 rounded-3xl p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 font-bold text-sm">لا توجد طلبات معلّقة من الفروع اليوم.</p>
          </div>
        )}
      </div>

      {/* القسم الأيسر: الإرسال اليدوي والسجل */}
      <div className="space-y-8">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h3 className="text-base font-extrabold text-gray-900 mb-4">أو: إمداد فرع بشكل يدوي مباشر</h3>
          <form onSubmit={handleManualDispatch} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-2">إلى أي فرع؟</label>
              <select value={selBranch} onChange={e => setSelBranch(e.target.value)} required className="w-full bg-[#f8f9fd] border-2 border-gray-100 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-bold">
                <option value="">اختار الفرع المستلم...</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">الصنف المُراد إرساله</label>
                <select value={selItem} onChange={e => setSelItem(e.target.value)} required className="w-full bg-[#f8f9fd] border-2 border-gray-100 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-bold text-xs">
                  <option value="">-- المادة --</option>
                  {stock.filter(s => s.qty > 0).map(i => <option key={i.id} value={i.id}>{i.name} (متوفر: {i.qty})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">الكمية المسحوبة</label>
                <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} required placeholder="أدخل الكمية..." className="w-full bg-[#f8f9fd] border-2 border-gray-100 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-mono text-base" />
              </div>
            </div>
            <button type="submit" className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 rounded-xl transition flex justify-center items-center gap-2">
              تأكيد خروج عهدة للفرع
            </button>
          </form>
        </div>

        {logs.length > 0 && (
          <div>
             <h4 className="text-xs font-extrabold text-gray-400 mb-3 px-2 uppercase tracking-widest">سجل الشحن والمغادرة اليوم</h4>
             <div className="space-y-2">
               {logs.map(log => (
                 <div key={log.id} className="bg-white border text-right border-gray-100 p-4 rounded-xl flex flex-col justify-between shadow-sm">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-bold text-gray-400 bg-[#f8f9fd] px-2 py-1 rounded-md">{log.time}</span>
                     <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><Truck className="w-3 h-3 text-orange-500" /> {log.target}</span>
                   </div>
                   <p className="text-sm font-bold text-gray-900 border-t border-gray-50 pt-2 flex justify-between items-center">
                     <span>صرف <strong className="text-orange-600 font-mono ml-1">{log.qtyStr}</strong> من مادة ({log.itemName})</span>
                     <span className="text-[10px] font-bold text-gray-400 bg-[#f8f9fd] px-1 border border-gray-100 rounded">تكلفة الوحدة المنقولة: {log.costUsed.toFixed(2)}</span>
                   </p>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>
    
    </div>
  );
}
