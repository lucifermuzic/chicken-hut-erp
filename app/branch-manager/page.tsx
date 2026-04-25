"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, ArrowRightLeft, Users, Monitor,
  TrendingUp, AlertCircle, CheckCircle2, Building, DollarSign,
  ArrowLeftRight, LogOut, Truck, ShoppingBag, CreditCard, Banknote
} from "lucide-react";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { clearSession, getSession } from "@/lib/auth";

// ─── الأنواع والثوابت ──────────────────────────────────────────────
type TabType = "إجمالي المبيعات" | "مخزن الفرع" | "نقل المخزون" | "إدارة الخزائن" | "خصومات الموظفين";
const BRANCHES = ["فرع وسط البلاد", "فرع الحدائق", "فرع فينيسيا"];


// ─── المكون الرئيسي ──────────────────────────────────────────
export default function BranchManagerPage() {
  const [activeTab, setActiveTab] = useState<TabType>("إجمالي المبيعات");
  const [successMsg, setSuccessMsg] = useState("");
  
  const session = getSession();
  const currentBranch = session?.branch || "فرع وسط البلاد";

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div className="flex h-screen bg-[#f8f9fd] text-gray-900 font-sans" dir="rtl">
      
      {/* ── القائمة الجانبية (Sidebar) ── */}
      <aside className="w-72 bg-white border-l border-gray-100 flex flex-col shadow-[rgba(0,0,0,0.02)_0px_0px_20px] shrink-0 z-20">
        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#ff6b00] to-orange-400 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-tight">Chicken Hut</h1>
            <p className="text-xs text-orange-500 font-bold uppercase tracking-wider">بوابة مدير الفرع</p>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-1">
          <p className="text-[10px] font-extrabold text-gray-400 mb-3 px-3 tracking-widest uppercase">العمليات والأقسام</p>
          
          {[
            { id: "إجمالي المبيعات", icon: TrendingUp },
            { id: "إدارة الخزائن", icon: Monitor },
            { id: "مخزن الفرع", icon: Package },
            { id: "نقل المخزون", icon: ArrowRightLeft },
            { id: "خصومات الموظفين", icon: Users },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm relative ${
                  isActive ? "bg-orange-50 text-[#ff6b00] shadow-sm" : "text-gray-500 hover:bg-[#f8f9fd] hover:text-gray-900"
                }`}>
                <Icon className={`w-5 h-5 ${isActive ? "text-[#ff6b00]" : "text-gray-400"}`} strokeWidth={isActive ? 2.5 : 2} />
                <span>{tab.id}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-50">
          <button onClick={() => { clearSession(); window.location.href = "/"; }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm">
            <LogOut className="w-5 h-5" /> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ── منطقة المحتوى الرئيسي ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* شريط الإشعارات المؤقت */}
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
            <span className="text-sm font-bold text-gray-500">مرحباً بك،</span>
            <span className="bg-gray-100 text-gray-800 text-sm font-extrabold px-3 py-1.5 rounded-lg border border-gray-200">الفرع الرئيسي</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            {activeTab === "إجمالي المبيعات" && <SalesStatsView branch={currentBranch} />}
            {activeTab === "إدارة الخزائن" && <TillTransferView branch={currentBranch} showSuccess={showSuccess} />}
            {activeTab === "مخزن الفرع" && <InventoryView branch={currentBranch} showSuccess={showSuccess} />}
            {activeTab === "نقل المخزون" && <InventoryTransferView branch={currentBranch} showSuccess={showSuccess} />}
            {activeTab === "خصومات الموظفين" && <HRDeductionsView branch={currentBranch} showSuccess={showSuccess} />}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── 1. مكون إجمالي المبيعات ──────────────────────────────────
function SalesStatsView({ branch }: { branch: string }) {
  const orders = useLiveQuery(
    () => db.orders.filter(o => o.branchId === branch).toArray(),
    [branch]
  ) || [];
  const todayTotal = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full translate-x-32 -translate-y-32 opacity-50" />
        <div className="relative z-10">
          <p className="text-gray-500 font-bold mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" /> إجمالي مبيعات الفرع (اليوم)
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-gray-900 font-mono tracking-tight">{todayTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span className="text-xl font-bold text-orange-500">د.ل</span>
          </div>
        </div>
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border-4 border-white shadow-sm relative z-10">
          <DollarSign className="w-10 h-10 text-green-500" strokeWidth={2.5} />
        </div>
      </div>
      <p className="text-sm text-gray-400 font-medium text-center">أرقام المبيعات الحالية (مباشرة من قاعدة بيانات الـ POS)</p>
    </div>
  );
}

function TillTransferView({ branch, showSuccess }: { branch: string; showSuccess: (m: string) => void }) {
  const [fromTill, setFromTill] = useState("");
  const [toTill, setToTill] = useState("");
  const [amount, setAmount] = useState("");

  // بناء قائمة الخزائن من كاشيري الفرع الفعليين
  const branchCashiers = useLiveQuery(
    () => db.employees.filter(e => e.branch === branch && e.role === "كاشير").toArray(),
    [branch]
  ) || [];
  const tills = branchCashiers.map((emp, idx) => ({
    no: String(idx + 1).padStart(2, "0"),
    user: emp.name,
    amount: 0
  }));

  // قراءة سجل الحركات من قاعدة البيانات للحظات
  const tillLogs = useLiveQuery(() => db.tillTransfers.orderBy('id').reverse().toArray()) || [];

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || !fromTill || !toTill || fromTill === toTill) return;
    
    const fromUser = tills.find(t => t.no === fromTill)?.user || "مجهول";
    const toUser = tills.find(t => t.no === toTill)?.user || "مجهول";
    
    // تسجيل النقل في قاعدة البيانات
    await db.tillTransfers.add({
      fromTill,
      toTill,
      fromUser,
      toUser,
      amount: val,
      branchId: branch,
      createdAt: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })
    });
    
    showSuccess(`تم نقل ${val} د.ل من درج #${fromTill} إلى درج #${toTill} بنجاح`);
    setFromTill(""); setToTill(""); setAmount("");
  };


  return (
    <div className="space-y-8">
      {/* عرض الخزائن بصرياً */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {tills.map(till => (
          <div key={till.no} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-400 bg-[#f8f9fd] px-2 py-1 rounded-md">درج #{till.no}</span>
              <Monitor className="w-5 h-5 text-gray-300" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">{till.user}</h3>
            <p className="text-xl font-extrabold text-[#ff6b00] font-mono mt-2" dir="ltr">{till.amount.toFixed(2)} د.ل</p>
          </div>
        ))}
      </div>

      {/* نموذج النقل */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-orange-500" /> نقل السيولة بين الأدراج
        </h3>
        <form onSubmit={handleTransfer} className="flex flex-col md:flex-row items-end gap-4 mb-8">
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-gray-500 block mb-2">من درج (المصدر)</label>
            <select value={fromTill} onChange={e => setFromTill(e.target.value)} required className="w-full bg-[#f8f9fd] border-2 border-gray-100 focus:border-[#ff6b00] rounded-xl px-4 py-3 outline-none font-bold">
              <option value="">اختار خصم من...</option>
              {tills.map(t => <option key={t.no} value={t.no}>درج #{t.no} ({t.user})</option>)}
            </select>
          </div>
          <div className="w-10 h-10 mb-2 shrink-0 bg-[#f8f9fd] rounded-full flex items-center justify-center text-gray-400 hidden md:flex">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-gray-500 block mb-2">إلى درج (المستلم)</label>
            <select value={toTill} onChange={e => setToTill(e.target.value)} required className="w-full bg-[#f8f9fd] border-2 border-gray-100 focus:border-[#ff6b00] rounded-xl px-4 py-3 outline-none font-bold">
              <option value="">اختار إضافة لـ...</option>
              {tills.map(t => <option key={t.no} value={t.no} disabled={t.no === fromTill}>درج #{t.no} ({t.user})</option>)}
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-gray-500 block mb-2">القيمة النقدية</label>
            <input type="number" step="0.5" min="1" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" className="w-full bg-white border-2 border-orange-200 focus:border-[#ff6b00] rounded-xl px-4 py-3 outline-none font-mono text-center text-lg" />
          </div>
          <button type="submit" disabled={!fromTill || !toTill || !amount} className="w-full md:w-auto bg-gray-900 hover:bg-black text-white px-8 py-3.5 rounded-xl font-bold transition disabled:opacity-50 h-[52px]">
            تأكيد النقل
          </button>
        </form>

        {/* سجل الدفع */}
        {tillLogs.length > 0 && (
          <div className="border-t border-gray-100 pt-6">
            <h4 className="text-xs font-extrabold text-gray-400 mb-4 px-2 uppercase tracking-widest">سجل حركات الخزائن</h4>
            <div className="space-y-2">
              {tillLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between bg-[#f8f9fd] p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <p className="text-sm font-bold text-gray-900">
                      تم نقل <span className="text-orange-600 font-mono">{log.amount.toFixed(2)} د.ل</span> من درج <span className="font-mono">#{log.fromTill}</span> إلى درج <span className="font-mono">#{log.toTill}</span>
                    </p>
                  </div>
                  <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-200">{log.createdAt}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 3. مكون مخزن الفرع ───────────────────────────────────────
function InventoryView({ branch, showSuccess }: { branch: string; showSuccess: (m: string) => void }) {
  const [requesting, setRequesting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("");

  const mainStock = useLiveQuery(() => db.inventory.toArray()) || [];

  const requestStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || !qty) return;
    
    const item = mainStock.find(i => i.id === Number(itemId));
    if (!item) return;
    
    setRequesting(true);
    try {
      const newReqId = `REQ-${Math.floor(Math.random() * 1000)}`;
      await db.branchRequests.add({
        id: newReqId,
        branch: branch,
        itemId: Number(itemId),
        qtyRequested: Number(qty),
        status: "جديد",
        isSynced: false
      });
      setShowForm(false);
      showSuccess(`تم طلب إمداد (${qty} ${item.unit} من ${item.name}) بنجاح! سيظهر الإشعار في لوحة أمين المخزن.`);
      setItemId(""); setQty("");
    } catch(err) {
      console.error(err);
    }
    setRequesting(false);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
      <div className="px-6 py-5 border-b border-gray-50 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">رصيد المواد في المخزن الداخلي</h3>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="bg-[#ff6b00] hover:bg-[#e65c00] text-white font-bold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition">
              <Truck className="w-4 h-4" /> طلب إمداد من الرئيسي
            </button>
          )}
        </div>

        {/* نموذج طلب البضاعة */}
        {showForm && (
          <form onSubmit={requestStock} className="bg-[#f8f9fd] border border-gray-100 rounded-2xl p-5 flex flex-col md:flex-row items-end gap-3 mt-2">
            <div className="flex-1 w-full">
              <label className="text-xs font-bold text-gray-500 block mb-2">اختار الصنف الناقص</label>
              <select value={itemId} onChange={e => setItemId(e.target.value)} required className="w-full bg-white border-2 border-gray-100 focus:border-[#ff6b00] rounded-xl px-4 py-3 outline-none font-bold text-sm">
                <option value="">-- يرجى الاختيار --</option>
                {mainStock.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div className="w-full md:w-32 shrink-0">
              <label className="text-xs font-bold text-gray-500 block mb-2">الكمية المطلوبة</label>
              <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} required placeholder="10..." className="w-full bg-white border-2 border-gray-100 focus:border-[#ff6b00] rounded-xl px-4 py-3 outline-none font-mono text-center" />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button type="submit" disabled={requesting} className="flex-1 md:flex-none bg-[#ff6b00] hover:bg-[#e65c00] disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition flex justify-center items-center h-[52px]">
                {requesting ? "جاري الإرسال..." : "تأكيد واستدعاء"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 font-bold px-4 rounded-xl transition flex justify-center items-center h-[52px]">
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>
      <table className="w-full text-right border-collapse">
        <thead>
          <tr className="bg-[#f8f9fd] border-b border-gray-100">
            <th className="px-6 py-3 text-xs font-bold text-gray-500 w-16">#</th>
            <th className="px-6 py-3 text-xs font-bold text-gray-500">الصنف</th>
            <th className="px-6 py-3 text-xs font-bold text-gray-500">التصنيف</th>
            <th className="px-6 py-3 text-xs font-bold text-gray-500 text-center">الرصيد المتاح</th>
            <th className="px-6 py-3 text-xs font-bold text-gray-500 text-center">الحد الأدنى</th>
            <th className="px-6 py-3 text-xs font-bold text-gray-500 text-center">الحالة</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {mainStock.map((item, idx) => {
            const branchQty = item.branchQtys?.[branch] ?? 0;
            const isLow = branchQty <= item.min;
            return (
              <tr key={item.id} className="hover:bg-[#f8f9fd]/50 transition">
                <td className="px-6 py-4 text-xs font-bold text-gray-400">{String(idx + 1).padStart(2, '0')}</td>
                <td className="px-6 py-4 text-sm font-extrabold text-gray-900">{item.name}</td>
                <td className="px-6 py-4 text-xs font-bold text-gray-500"><span className="bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">{item.category}</span></td>
                <td className="px-6 py-4 text-sm font-mono font-bold text-center" dir="ltr">{branchQty} <span className="text-[10px] text-gray-400 font-sans">{item.unit}</span></td>
                <td className="px-6 py-4 text-sm font-mono font-bold text-center text-gray-400" dir="ltr">{item.min}</td>
                <td className="px-6 py-4 text-center">
                  {isLow ? (
                    <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded-lg text-xs font-bold">
                      <AlertCircle className="w-3.5 h-3.5" /> نقص
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 border border-green-100 px-2 py-1 rounded-lg text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> متوفر
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function InventoryTransferView({ branch, showSuccess }: { branch: string; showSuccess: (m: string) => void }) {
  const [selectedItem, setSelectedItem] = useState("");
  const [targetBranch, setTargetBranch] = useState("");
  const [qty, setQty] = useState("");
  const [invLogs, setInvLogs] = useState<any[]>([]);

  // استخدام بيانات المخزن الفعلية من Dexie بدل البيانات الوهمية
  const mainStock = useLiveQuery(() => db.inventory.toArray()) || [];

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const item = mainStock.find(i => i.id === Number(selectedItem));
    if (!item) return;

    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      itemName: item.name,
      qty: qty,
      unit: item.unit,
      target: targetBranch
    };
    setInvLogs(prev => [newLog, ...prev]);
    showSuccess(`تم نقل ${qty} ${item.unit} من (${item.name}) إلى (${targetBranch})`);
    setSelectedItem(""); setTargetBranch(""); setQty("");
  };

  return (
    <div className="space-y-6">
      <div className="max-w-3xl bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
        <div className="w-16 h-16 bg-orange-50 text-orange-500 flex items-center justify-center rounded-2xl mb-6">
          <ArrowRightLeft className="w-8 h-8" strokeWidth={2} />
        </div>
        <h3 className="text-xl font-extrabold text-gray-900 mb-2">إرسال مواد لخارج الفرع</h3>
        <p className="text-sm text-gray-500 font-medium mb-8">اختر الصنف المراد نقله والفرع المستلم لإثبات عهدة خروج مواد.</p>

        <form onSubmit={handleTransfer} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-2">الصنف المُراد إرساله</label>
            <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)} required className="w-full bg-[#f8f9fd] border-2 border-gray-100 focus:border-[#ff6b00] rounded-xl px-4 py-3 outline-none font-bold">
              <option value="">-- يرجى الاختيار --</option>
              {mainStock.map(i => <option key={i.id} value={i.id}>{i.name} (المتاح: {i.qty} {i.unit})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-2">الكمية المسحوبة</label>
              <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} required placeholder="أدخل الكمية..." className="w-full bg-[#f8f9fd] border-2 border-gray-100 focus:border-[#ff6b00] rounded-xl px-4 py-3 outline-none font-mono text-lg" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-2">الفرع المُستلم</label>
              <select value={targetBranch} onChange={e => setTargetBranch(e.target.value)} required className="w-full bg-[#f8f9fd] border-2 border-gray-100 focus:border-[#ff6b00] rounded-xl px-4 py-3 outline-none font-bold">
                <option value="">-- تحديد الفرع --</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-50">
            <button type="submit" className="w-full bg-[#ff6b00] hover:bg-[#e65c00] text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/30 transition flex justify-center items-center gap-2">
              <Package className="w-5 h-5"/> تأكيد عملية النقل المخزني
            </button>
          </div>
        </form>
      </div>

      {/* سجل نقل المخزون */}
      {invLogs.length > 0 && (
        <div className="max-w-3xl bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-50">
            <h3 className="text-sm font-extrabold text-gray-900">سجل حركات خروج المخزون</h3>
          </div>
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#f8f9fd] border-b border-gray-100">
                <th className="px-6 py-3 text-xs font-bold text-gray-500 w-24">الوقت</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500">الصنف</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 text-center">الكمية</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500">إلى مسار</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 text-center">حالة العملية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invLogs.map(log => (
                <tr key={log.id} className="hover:bg-[#f8f9fd]/50 transition">
                  <td className="px-6 py-4 text-xs font-bold text-gray-400 bg-[#f8f9fd]/50">{log.time}</td>
                  <td className="px-6 py-4 text-sm font-extrabold text-gray-900">{log.itemName}</td>
                  <td className="px-6 py-4 text-sm font-mono font-bold text-center text-[#ff6b00]">{log.qty} <span className="text-[10px] text-gray-400">{log.unit}</span></td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-500"><span className="bg-orange-50 px-2 py-1 rounded border border-orange-100">{log.target}</span></td>
                  <td className="px-6 py-4 text-center">
                    <span className="flex items-center justify-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-md text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" /> تم الإرسال
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function HRDeductionsView({ branch, showSuccess }: { branch: string; showSuccess: (m: string) => void }) {
  const [empId, setEmpId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  
  // قراءة موظفي الفرع من DB
  const branchEmployees = useLiveQuery(
    () => db.employees.filter(e => e.branch === branch).toArray(),
    [branch]
  ) || [];
  // قراءة سجلات الخصومات لهذا الفرع
  const hrLogs = useLiveQuery(
    () => db.hrDeductions.filter(h => h.branch === branch).reverse().toArray(),
    [branch]
  ) || [];

  const handleDeduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = branchEmployees.find(e => e.id === empId);
    if (!emp) return;

    await db.hrDeductions.add({
      empName: emp.name,
      empId: emp.id,
      amount: parseFloat(amount),
      reason: reason,
      branch: branch,
      createdAt: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      status: "مسجل"
    });

    showSuccess(`تم تسجيل حسم بقيمة ${amount} د.ل على الموظف (${emp.name})`);
    setEmpId(""); setAmount(""); setReason("");
  };

  return (
    <div className="space-y-8">
      {/* القسم العلوي: النموذج والموظفين */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-extrabold text-gray-900 mb-2">تسجيل إيصال حسم/خصم</h3>
          <p className="text-sm text-gray-500 font-medium mb-6">يتم إرسال هذا الخصم تلقائياً لمدير الموارد البشرية لخصمه من راتب الموظف.</p>
          
          <form onSubmit={handleDeduct} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-2">الموظف المعني</label>
              <select value={empId} onChange={e => setEmpId(e.target.value)} required className="w-full bg-[#f8f9fd] border-2 border-gray-100 focus:border-red-500 rounded-xl px-4 py-3 outline-none font-bold">
                <option value="">اختر الموظف...</option>
                {branchEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-red-500 block mb-2">قيمة الخصم المطلوبة (د.ل)</label>
              <input type="number" step="0.5" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" className="w-full bg-red-50 border-2 border-red-200 focus:border-red-500 rounded-xl px-4 py-3 outline-none font-mono text-red-900 text-lg" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-2">البيان / السبب</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} required placeholder="مثال: سحب نقدي مباشر، أو تحميل قيمة طلب مسترد..." rows={3} className="w-full bg-[#f8f9fd] border-2 border-gray-100 focus:border-red-500 rounded-xl px-4 py-3 outline-none font-medium resize-none" />
            </div>
            <button type="submit" className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/20 transition focus:ring border-0">
              <AlertCircle className="w-5 h-5"/> تأكيد خصم القيمة
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-extrabold text-gray-400 uppercase tracking-widest px-2">موظفي الفرع للاستدلال</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {branchEmployees.map(emp => (
              <div key={emp.id} className="bg-white border text-right border-gray-100 p-4 rounded-2xl flex items-center gap-4 hover:shadow-sm transition">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                   <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-extrabold text-gray-900">{emp.name}</p>
                  <p className="text-xs font-bold text-orange-500">{emp.role}</p>
                </div>
                <div className="mr-auto text-left">
                  <span className="text-[10px] font-bold text-gray-400 block mb-0.5">الأساسي</span>
                  <span className="text-sm font-mono font-bold text-gray-800">{emp.baseSalary} د.ل</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* سجل الخصومات */}
      {hrLogs.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm mt-8">
          <div className="px-6 py-4 border-b border-gray-50 bg-red-50/30">
            <h3 className="text-sm font-extrabold text-red-900">سجل الخصومات والعهد (النشطة اليوم)</h3>
          </div>
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#f8f9fd] border-b border-gray-100">
                <th className="px-6 py-3 text-xs font-bold text-gray-500 w-24">الوقت</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500">اسم الموظف</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 text-center">الخصم</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500">بيان مسجل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {hrLogs.map(log => (
                <tr key={log.id} className="hover:bg-red-50/50 transition">
                  <td className="px-6 py-4 text-xs font-bold text-gray-400 bg-[#f8f9fd]/50">{log.createdAt}</td>
                  <td className="px-6 py-4 text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-300" /> {log.empName}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono font-extrabold text-center text-red-600 bg-red-50/30" dir="ltr">
                    - {log.amount.toFixed(2)} د.ل
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-600 max-w-[200px] truncate">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
