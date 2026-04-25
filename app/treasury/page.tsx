"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, Activity, FileText, Banknote,
  TrendingDown, TrendingUp,
  ArrowRightLeft,
  CheckCircle2, Users, LogOut, Printer, Plus, ShoppingBag, X
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db";
import { clearSession } from "../../lib/auth";

// ─── أنواع البيانات ───────────────────────────────────────────
type TabType =
  | "لوحة الأداء المالي (Dashboard)"
  | "قسم الوارد (التحصيلات)"
  | "قسم الصادر (المصروفات والمرتبات)"
  | "نقل بين الخزائن"
  | "تقارير الخزائن الشاملة";

const BRANCHES = ["فرع وسط البلاد", "فرع الحدائق", "فرع فينيسيا"];

// ─── المكون الرئيسي للصفحة ─────────────────────────────────────
export default function TreasuryDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("لوحة الأداء المالي (Dashboard)");
  const [successMsg, setSuccessMsg] = useState("");

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  return (
    <div className="flex h-screen bg-[#f8f9fd] text-gray-800 font-sans selection:bg-orange-500/30 selection:text-orange-900 print:bg-white print:h-auto" dir="rtl">
      
      {/* ── القائمة الجانبية (Sidebar) ── */}
      <aside className="w-[300px] bg-white border-l border-gray-100 flex flex-col shrink-0 z-20 shadow-[-2px_0_20px_rgba(0,0,0,0.04)] overflow-y-auto print:hidden">
        <div className="p-8 border-b border-gray-100 flex items-center gap-4 sticky top-0 bg-white/90 backdrop-blur-md">
          <div className="w-14 h-14 bg-gradient-to-br from-[#ff6b00] to-[#ff985c] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Wallet className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">إدارة الخزينة</h1>
            <p className="text-[10px] text-orange-500 font-bold tracking-widest bg-orange-50 px-2 py-1 rounded inline-block mt-1">TREASURY SYSTEM</p>
          </div>
        </div>

        <div className="p-5 flex-1 space-y-2">
          <p className="text-[10px] font-black text-gray-400 mb-4 px-3 tracking-widest uppercase pb-2">التبويبات المالية</p>
          
          {[
            { id: "لوحة الأداء المالي (Dashboard)", icon: Activity, desc: "نظرة عامة على السيولة والخزائن" },
            { id: "قسم الوارد (التحصيلات)", icon: TrendingUp, desc: "المبيعات، الإيجارات، والإيرادات" },
            { id: "قسم الصادر (المصروفات والمرتبات)", icon: TrendingDown, desc: "المشتريات، المرتبات، والمسحوبات" },
            { id: "نقل بين الخزائن", icon: ArrowRightLeft, desc: "تحويل السيولة بين خزائن الفروع" },
            { id: "تقارير الخزائن الشاملة", icon: FileText, desc: "طباعة وتحليل الحركات" },
          ].map((tab: any) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)}
                className={`w-full flex items-start gap-4 px-5 py-4 rounded-2xl transition-all text-right group ${
                  isActive ? "bg-[#fff0e6] text-[#ff6b00]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}>
                <div className={`mt-0.5 ${isActive ? 'text-[#ff6b00]' : 'text-gray-400 group-hover:text-gray-600'}`}>
                   <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <div>
                  <span className={`block font-extrabold text-sm ${isActive ? 'text-[#ff6b00]' : 'text-gray-600 group-hover:text-gray-900'}`}>{tab.id}</span>
                  <span className={`block text-[10px] font-bold mt-1 ${isActive ? 'text-orange-400' : 'text-gray-400'}`}>{tab.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="p-6 border-t border-gray-100 space-y-4">
           <button
             onClick={() => { clearSession(); window.location.href = "/"; }}
             className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-sm"
           >
             <LogOut className="w-5 h-5" /> تسجيل الخروج
           </button>
        </div>
      </aside>

      {/* ── المحتوى الرئيسي ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative print:h-auto print:overflow-visible print:block">
        <AnimatePresence>
          {successMsg && (
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 z-50 bg-white text-orange-600 px-6 py-4 rounded-xl font-bold shadow-xl flex items-center gap-3 border border-orange-100 min-w-[300px] justify-center text-sm">
              <CheckCircle2 className="w-5 h-5" /> {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <header className="h-20 bg-white border-b border-gray-200 px-10 flex items-center justify-between shrink-0 z-10 shadow-sm print:hidden">
          <div>
            <h2 className="text-2xl font-black text-gray-900">{activeTab}</h2>
            <p className="text-xs text-gray-500 font-bold mt-1">التحكم المالي والإدارة النقدية</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 print:overflow-visible print:p-0 print:m-0">
          <div className="max-w-[1500px] mx-auto h-full">
            {activeTab === "لوحة الأداء المالي (Dashboard)" && <DashboardView />}
            {activeTab === "قسم الوارد (التحصيلات)" && <IncomingView showSuccess={showSuccess} />}
            {activeTab === "قسم الصادر (المصروفات والمرتبات)" && <OutgoingView showSuccess={showSuccess} />}
            {activeTab === "نقل بين الخزائن" && <TreasuryTransferView showSuccess={showSuccess} />}
            {activeTab === "تقارير الخزائن الشاملة" && <ReportsView />}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. لوحة الأداء المالي (Dashboard)
// ─────────────────────────────────────────────────────────────
function DashboardView() {
  const orders = useLiveQuery(() => db.orders.toArray()) || [];
  const outgoings = useLiveQuery(() => db.treasuryOutgoing.toArray()) || [];
  const incomings = useLiveQuery(() => db.treasuryIncoming.toArray()) || [];

  const totalSales = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const totalIn = incomings.reduce((s, i) => s + i.amount, 0) + totalSales;
  const totalOut = outgoings.reduce((s, o) => s + o.amount, 0);
  const currentBalance = totalIn - totalOut;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
             <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4"><Banknote className="w-6 h-6"/></div>
             <h4 className="text-xs font-black text-gray-400 tracking-widest mb-1">الرصيد الفعلي الحالي</h4>
             <p className="text-3xl font-mono font-black text-gray-900">{currentBalance.toLocaleString()} <span className="text-sm font-sans text-gray-500">د.ل</span></p>
          </div>
          <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100 shadow-sm">
             <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4"><TrendingUp className="w-6 h-6"/></div>
             <h4 className="text-xs font-black text-orange-700 tracking-widest mb-1">إجمالي الواردات والمبيعات</h4>
             <p className="text-3xl font-mono font-black text-orange-900">{totalIn.toLocaleString()} <span className="text-sm font-sans text-orange-700">د.ل</span></p>
          </div>
          <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 shadow-sm">
             <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4"><TrendingDown className="w-6 h-6"/></div>
             <h4 className="text-xs font-black text-red-700 tracking-widest mb-1">إجمالي المنصرفات</h4>
             <p className="text-3xl font-mono font-black text-red-900">{totalOut.toLocaleString()} <span className="text-sm font-sans text-red-700">د.ل</span></p>
          </div>
       </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. قسم الوارد (التحصيلات)
// ─────────────────────────────────────────────────────────────
function IncomingView({ showSuccess }: { showSuccess: (msg: string) => void }) {
  const [type, setType] = useState("إيراد خارجي");
  const [amount, setAmount] = useState("");
  const [branch, setBranch] = useState("المقر الرئيسي");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const orders = useLiveQuery(() => db.orders.toArray()) || [];
  const incomings = useLiveQuery(() => db.treasuryIncoming.toArray()) || [];

  const handleAddIncoming = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    await db.treasuryIncoming.add({
      type,
      amount: parseFloat(amount),
      description,
      branch,
      notes,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      isSynced: false
    });

    showSuccess(`تم تسجيل إيراد بقيمة ${amount} بنجاح`);
    setAmount(""); setDescription(""); setNotes("");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm">
         <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-orange-500"/> إضافة إيراد / تحصيل جديد</h3>
         
         <form onSubmit={handleAddIncoming} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-2">نوع الإيراد</label>
              <select value={type} onChange={e=>setType(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-orange-500">
                <option value="إيراد خارجي">إيراد خارجي</option>
                <option value="إيجار">إيجار</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-2">الفرع المُرتبط</label>
              <select value={branch} onChange={e=>setBranch(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-orange-500">
                <option value="المقر الرئيسي">المقر الرئيسي</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-2">القيمة (د.ل)</label>
              <input type="number" required value={amount} onChange={e=>setAmount(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-mono text-lg outline-none focus:border-orange-500" placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-2">البيان (الوصف)</label>
              <input type="text" required value={description} onChange={e=>setDescription(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-orange-500" placeholder="مثال: تحصيل إيجار محل..." />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/30 flex justify-center items-center gap-2">
                 <Plus className="w-5 h-5"/> تسجيل الإيراد
              </button>
            </div>
         </form>
       </div>

       {/* جدول الواردات والمبيعات */}
       <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
         <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-gray-900">سجل الإيرادات اللحظي</h3>
         </div>
         <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
                <th className="px-6 py-3">التاريخ</th>
                <th className="px-6 py-3">النوع</th>
                <th className="px-6 py-3">الفرع</th>
                <th className="px-6 py-3">البيان</th>
                <th className="px-6 py-3 text-center">القيمة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {incomings.map((inc) => (
                 <tr key={inc.id} className="hover:bg-gray-50 transition">
                   <td className="px-6 py-4 text-xs font-mono text-gray-500">{new Date(inc.createdAt).toLocaleDateString('ar-SA')}</td>
                   <td className="px-6 py-4 text-sm font-bold text-gray-900"><span className="bg-orange-50 text-orange-600 px-2 py-1 rounded">{inc.type}</span></td>
                   <td className="px-6 py-4 text-sm font-bold text-gray-600">{inc.branch}</td>
                   <td className="px-6 py-4 text-sm font-bold text-gray-700">{inc.description}</td>
                   <td className="px-6 py-4 text-sm font-mono font-black text-orange-600 text-center">+{inc.amount.toLocaleString()}</td>
                 </tr>
               ))}
               {orders.slice(0, 5).map((ord) => (
                 <tr key={ord.id} className="hover:bg-gray-50 transition opacity-80">
                   <td className="px-6 py-4 text-xs font-mono text-gray-500">{new Date(ord.createdAt).toLocaleDateString('ar-SA')}</td>
                   <td className="px-6 py-4 text-sm font-bold text-gray-900"><span className="bg-orange-50 text-orange-600 px-2 py-1 rounded">مبيعات ({ord.type})</span></td>
                   <td className="px-6 py-4 text-sm font-bold text-gray-600">{ord.branchId}</td>
                   <td className="px-6 py-4 text-sm font-bold text-gray-700">طلب رقم #{ord.orderNumber}</td>
                   <td className="px-6 py-4 text-sm font-mono font-black text-orange-600 text-center">+{ord.totalAmount.toLocaleString()}</td>
                 </tr>
               ))}
            </tbody>
         </table>
       </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. قسم الصادر (المصروفات والمرتبات)
// ─────────────────────────────────────────────────────────────
function OutgoingView({ showSuccess }: { showSuccess: (msg: string) => void }) {
  const [subTab, setSubTab] = useState<"general"|"salaries"|"payment-orders">("payment-orders");

  const [type, setType] = useState("مصروفات عامة");
  const [amount, setAmount] = useState("");
  const [branch, setBranch] = useState("المقر الرئيسي");
  const [description, setDescription] = useState("");

  const outgoings = useLiveQuery(() => db.treasuryOutgoing.toArray()) || [];
  const employees = useLiveQuery(() => db.employees.toArray()) || [];

  const handleAddOutgoing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    await db.treasuryOutgoing.add({
      type,
      amount: parseFloat(amount),
      description,
      branch,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      isSynced: false
    });

    showSuccess(`تم صرف مبلغ ${amount} بنجاح`);
    setAmount(""); setDescription("");
  };

  const handlePaySalaries = async (branchFilter: string) => {
    const emps = branchFilter === "all" ? employees : employees.filter(e => e.branch === branchFilter);
    const total = emps.reduce((s, e) => s + e.baseSalary, 0);
    
    if(confirm(`هل أنت متأكد من صرف رواتب لعدد ${emps.length} موظف بإجمالي ${total} د.ل؟`)) {
      await db.treasuryOutgoing.add({
        type: "رواتب وأجور",
        amount: total,
        description: `صرف رواتب شهر ${new Date().getMonth()+1} - ${branchFilter === 'all' ? 'جميع الفروع' : branchFilter}`,
        branch: branchFilter === "all" ? "متعدد" : branchFilter,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        isSynced: false
      });
      showSuccess("تم صرف وإثبات الرواتب بنجاح");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="flex gap-4 mb-6 flex-wrap">
          <button onClick={()=>setSubTab("payment-orders")} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition flex gap-2 items-center ${subTab==='payment-orders' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
            <ShoppingBag className="w-4 h-4"/> أوامر الصرف {subTab !== 'payment-orders' && <PaymentOrdersBadge />}
          </button>
          <button onClick={()=>setSubTab("general")} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${subTab==='general' ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>مصروفات وصادر عام</button>
          <button onClick={()=>setSubTab("salaries")} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition flex gap-2 items-center ${subTab==='salaries' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
            <Users className="w-4 h-4"/> كشف الرواتب والأجور
          </button>
       </div>

       {subTab === "payment-orders" && <PaymentOrdersView showSuccess={showSuccess} />}

       {subTab === "general" && (
         <>
           <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm">
             <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><TrendingDown className="w-5 h-5 text-red-500"/> صرف نقدية من الخزينة</h3>
             <form onSubmit={handleAddOutgoing} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-2">نوع المصروف / الصادر</label>
                  <select value={type} onChange={e=>setType(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-red-500">
                    <option value="مصروفات عامة">مصروفات تشغيلية وعامة</option>
                    <option value="مشتريات">مشتريات وموردين</option>
                    <option value="مسحوبات شخصية">مسحوبات شخصية (عُهد)</option>
                    <option value="أقساط وجمعيات">أقساط والتزامات وجمعيات</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-2">الفرع المُرتبط</label>
                  <select value={branch} onChange={e=>setBranch(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-red-500">
                    <option value="المقر الرئيسي">المقر الرئيسي / الإدارة</option>
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-2">القيمة (د.ل)</label>
                  <input type="number" required value={amount} onChange={e=>setAmount(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-mono text-lg outline-none focus:border-red-500 text-red-600" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-2">البيان (سبب الصرف)</label>
                  <input type="text" required value={description} onChange={e=>setDescription(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-red-500" placeholder="مثال: فاتورة كهرباء، شراء معدات..." />
                </div>
                <div className="md:col-span-2">
                  <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-500/30 flex justify-center items-center gap-2">
                     <TrendingDown className="w-5 h-5"/> إعتماد الصرف النطدي
                  </button>
                </div>
             </form>
           </div>
           
           <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-extrabold text-gray-900">سجل المصروفات الأخير</h3>
             </div>
             <table className="w-full text-right">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
                    <th className="px-6 py-3">التاريخ</th>
                    <th className="px-6 py-3">النوع</th>
                    <th className="px-6 py-3">الفرع</th>
                    <th className="px-6 py-3">البيان</th>
                    <th className="px-6 py-3 text-center">القيمة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {outgoings.map((out) => (
                     <tr key={out.id} className="hover:bg-gray-50 transition">
                       <td className="px-6 py-4 text-xs font-mono text-gray-500">{new Date(out.createdAt).toLocaleDateString('ar-SA')}</td>
                       <td className="px-6 py-4 text-sm font-bold text-gray-900"><span className="bg-red-50 text-red-600 px-2 py-1 rounded">{out.type}</span></td>
                       <td className="px-6 py-4 text-sm font-bold text-gray-600">{out.branch}</td>
                       <td className="px-6 py-4 text-sm font-bold text-gray-700">{out.description}</td>
                       <td className="px-6 py-4 text-sm font-mono font-black text-red-600 text-center">-{out.amount.toLocaleString()}</td>
                     </tr>
                   ))}
                </tbody>
             </table>
           </div>
         </>
       )}

       {subTab === "salaries" && (
         <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 print:space-y-0 print:block">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm print:p-0 print:border-none print:shadow-none print:rounded-none">
               <div className="flex justify-between items-center mb-8 print:border-b-2 print:border-gray-900 print:pb-6 print:mb-6">
                  <div>
                    <h2 className="hidden print:block text-2xl font-black text-gray-900 mb-2">شركة تشيكن هات - كشف رواتب الموظفين</h2>
                    <h3 className="text-xl font-black text-gray-900">كشف رواتب شهر {new Date().getMonth() + 1} / {new Date().getFullYear()}</h3>
                    <p className="text-sm text-gray-500 mt-1 font-bold">إدارة وصرف واستخراج تقارير الأجور الشاملة</p>
                  </div>
                  <div className="flex gap-3 print:hidden">
                     <button onClick={()=>window.print()} className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-amber-100 transition border border-amber-200">
                        <Printer className="w-4 h-4"/> طباعة الكل
                     </button>
                     <button onClick={()=>handlePaySalaries("all")} className="bg-amber-600 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-amber-700 transition">
                        صرف رواتب الجميع
                     </button>
                  </div>
               </div>

               <div className="space-y-6 print:space-y-4">
                  {["فرع وسط البلاد", "فرع الحدائق", "فرع فينيسيا", "المطبخ المركزي"].map(branch => {
                    const branchEmps = employees.filter(e => e.branch === branch);
                    if(branchEmps.length === 0) return null;
                    const branchTotal = branchEmps.reduce((s,e)=>s+e.baseSalary, 0);

                    return (
                      <div key={branch} className="border-2 border-gray-100 rounded-2xl overflow-hidden print:border-gray-900 print:border print:rounded-none print:mb-6">
                        <div className="bg-gray-50 px-6 py-4 border-b-2 border-gray-100 flex justify-between items-center print:bg-white print:border-gray-900 print:border-b">
                           <h4 className="font-extrabold text-gray-900">{branch} <span className="text-xs text-gray-500 font-bold mr-2">({branchEmps.length} موظف)</span></h4>
                           <div className="flex items-center gap-4">
                             <span className="font-mono font-black text-amber-700 text-lg">{branchTotal.toLocaleString()} د.ل</span>
                             <button onClick={()=>handlePaySalaries(branch)} className="text-xs font-bold bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100 print:hidden">صرف لفرع فقط</button>
                           </div>
                        </div>
                        <table className="w-full text-right text-sm">
                           <thead className="bg-white text-gray-400 font-bold text-xs border-b border-gray-100 print:text-black">
                             <tr>
                               <th className="px-6 py-3">الرقم الوظيفي</th>
                               <th className="px-6 py-3">اسم الموظف</th>
                               <th className="px-6 py-3">الوظيفة</th>
                               <th className="px-6 py-3 text-center">الراتب الأساسي</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50 bg-white">
                             {branchEmps.map(emp => (
                               <tr key={emp.id} className="hover:bg-gray-50">
                                 <td className="px-6 py-3 font-mono text-gray-500">{emp.id}</td>
                                 <td className="px-6 py-3 font-bold text-gray-900">{emp.name}</td>
                                 <td className="px-6 py-3 text-gray-600">{emp.role}</td>
                                 <td className="px-6 py-3 font-mono font-bold text-amber-600 text-center">{emp.baseSalary.toLocaleString()}</td>
                               </tr>
                             ))}
                           </tbody>
                        </table>
                      </div>
                    );
                  })}
               </div>
            </div>
         </div>
       )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. نقل بين الخزائن
// ─────────────────────────────────────────────────────────────
function TreasuryTransferView({ showSuccess }: { showSuccess: (msg: string) => void }) {
  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch]     = useState("");
  const [amount, setAmount]         = useState("");
  const [notes, setNotes]           = useState("");
  const outgoings = useLiveQuery(() => db.treasuryOutgoing.filter(o => o.type === "تحويل داخلي").reverse().toArray()) || [];

  const ALL_TREASURIES = ["المقر الرئيسي / الإدارة", ...BRANCHES];

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromBranch || !toBranch || fromBranch === toBranch || !amount) return;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    const now = new Date().toISOString();
    const dateStr = now.split('T')[0];

    // خصم من المحول
    await db.treasuryOutgoing.add({
      type: "تحويل داخلي",
      amount: val,
      description: `تحويل صادر إلى (${toBranch})`,
      branch: fromBranch,
      date: dateStr,
      notes,
      createdAt: now,
      isSynced: false
    });

    // إضافة للمستلم
    await db.treasuryIncoming.add({
      type: "تحويل داخلي",
      amount: val,
      description: `تحويل وارد من (${fromBranch})`,
      branch: toBranch,
      date: dateStr,
      notes,
      createdAt: now,
      isSynced: false
    });

    showSuccess(`تم نقل ${val.toLocaleString()} د.ل من ${fromBranch} إلى ${toBranch} بنجاح`);
    setFromBranch(""); setToBranch(""); setAmount(""); setNotes("");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* نموذج النقل */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-orange-50 text-[#ff6b00] flex items-center justify-center rounded-2xl">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">نقل السيولة بين الخزائن</h3>
            <p className="text-sm text-gray-500 font-bold mt-0.5">يمكنك تحويل الأموال من أي خزينة فرع إلى أخرى أو للمقر الرئيسي</p>
          </div>
        </div>

        <form onSubmit={handleTransfer} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* من */}
            <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-5">
              <label className="text-xs font-black text-red-600 block mb-3 uppercase tracking-widest">من خزينة (المصدر)</label>
              <select
                value={fromBranch}
                onChange={e => setFromBranch(e.target.value)}
                required
                className="w-full bg-white border-2 border-red-100 focus:border-red-400 rounded-xl px-4 py-3 font-bold outline-none transition"
              >
                <option value="">— اختر مصدر النقل —</option>
                {ALL_TREASURIES.map(b => (
                  <option key={b} value={b} disabled={b === toBranch}>{b}</option>
                ))}
              </select>
            </div>

            {/* إلى */}
            <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-5">
              <label className="text-xs font-black text-green-700 block mb-3 uppercase tracking-widest">إلى خزينة (الوجهة)</label>
              <select
                value={toBranch}
                onChange={e => setToBranch(e.target.value)}
                required
                className="w-full bg-white border-2 border-green-100 focus:border-green-400 rounded-xl px-4 py-3 font-bold outline-none transition"
              >
                <option value="">— اختر وجهة النقل —</option>
                {ALL_TREASURIES.map(b => (
                  <option key={b} value={b} disabled={b === fromBranch}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* السهم البصري */}
          {fromBranch && toBranch && (
            <div className="flex items-center justify-center gap-4 py-2">
              <span className="bg-red-100 text-red-700 font-black px-4 py-2 rounded-xl text-sm">{fromBranch}</span>
              <ArrowRightLeft className="w-6 h-6 text-gray-400" />
              <span className="bg-green-100 text-green-700 font-black px-4 py-2 rounded-xl text-sm">{toBranch}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-2">قيمة النقل (د.ل)</label>
              <input
                type="number" min="1" step="0.5" required
                value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-50 border-2 border-gray-100 focus:border-[#ff6b00] rounded-xl px-4 py-4 font-mono text-2xl font-black outline-none transition text-center text-gray-900"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-2">البيان / سبب النقل</label>
              <input
                type="text"
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="مثال: تغطية عجز، تحويل فائض..."
                className="w-full bg-gray-50 border-2 border-gray-100 focus:border-[#ff6b00] rounded-xl px-4 py-4 font-bold outline-none transition h-full"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!fromBranch || !toBranch || !amount || fromBranch === toBranch}
            className="w-full bg-[#ff6b00] hover:bg-[#e65c00] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition shadow-lg shadow-orange-500/30 flex items-center justify-center gap-3 text-lg"
          >
            <ArrowRightLeft className="w-6 h-6" />
            تأكيد عملية النقل
          </button>
        </form>
      </div>

      {/* سجل النقل */}
      {outgoings.length > 0 && (
        <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-extrabold text-gray-900">سجل عمليات النقل الداخلية</h3>
          </div>
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
                <th className="px-6 py-3">الوقت</th>
                <th className="px-6 py-3">من</th>
                <th className="px-6 py-3">إلى</th>
                <th className="px-6 py-3">البيان</th>
                <th className="px-6 py-3 text-center">القيمة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {outgoings.map(log => {
                const toBranchMatch = log.description.match(/إلى \((.*?)\)/);
                const toBranch = toBranchMatch ? toBranchMatch[1] : "—";
                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-xs font-mono text-gray-400">
                      {new Date(log.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-red-600">
                      <span className="bg-red-50 px-2 py-1 rounded">{log.branch}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">
                      <span className="bg-green-50 px-2 py-1 rounded">{toBranch}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-600">{log.notes || "—"}</td>
                    <td className="px-6 py-4 text-sm font-mono font-black text-[#ff6b00] text-center">{log.amount.toLocaleString()} د.ل</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. التقارير الشاملة
// ─────────────────────────────────────────────────────────────
function ReportsView() {
  const outgoings = useLiveQuery(() => db.treasuryOutgoing.toArray()) || [];
  const incomings = useLiveQuery(() => db.treasuryIncoming.toArray()) || [];
  const orders = useLiveQuery(() => db.orders.toArray()) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 print:space-y-0 print:block">
       <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm flex justify-between items-center print:hidden">
          <div>
             <h3 className="text-xl font-black text-gray-900">تقرير حركة الخزينة الشامل</h3>
             <p className="text-sm text-gray-500 font-bold mt-1">يعرض إجمالي الحركات والمبيعات لطباعتها وأرشفتها</p>
          </div>
          <button onClick={()=>window.print()} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition shadow-lg">
             <Printer className="w-5 h-5"/> طباعة التقرير الكامل
          </button>
       </div>

       <div className="bg-white p-10 rounded-[2rem] border border-gray-200 shadow-sm min-h-[500px] print:p-0 print:border-none print:shadow-none print:rounded-none print:min-h-0" id="print-area">
          <div className="text-center mb-10 border-b-2 border-gray-900 pb-6 print:mb-6">
             <h2 className="text-2xl font-black text-gray-900 mb-2">شركة تشيكن هات - تقرير الخزينة الشامل</h2>
             <p className="text-gray-600 font-mono">تاريخ الإصدار: {new Date().toLocaleString('ar-SA')}</p>
          </div>

          <div className="grid grid-cols-2 gap-10 mb-10">
             <div>
                <h4 className="font-bold text-lg border-b border-orange-200 pb-2 mb-4 text-orange-800">إجمالي الواردات (تشمل المبيعات)</h4>
                <ul className="space-y-3">
                   {incomings.map(i => (
                     <li key={i.id} className="flex justify-between font-mono text-sm border-b border-dashed border-gray-200 pb-1">
                       <span className="font-sans font-bold text-gray-700">{i.description} ({i.type})</span>
                       <span className="text-orange-600">+{i.amount.toLocaleString()}</span>
                     </li>
                   ))}
                   <li className="flex justify-between font-mono text-sm border-b border-dashed border-gray-200 pb-1">
                       <span className="font-sans font-bold text-gray-700">مبيعات المطاعم المجمعة</span>
                       <span className="text-orange-600">+{orders.reduce((s,o)=>s+(o.totalAmount||0),0).toLocaleString()}</span>
                   </li>
                </ul>
             </div>
             <div>
                <h4 className="font-bold text-lg border-b border-red-200 pb-2 mb-4 text-red-800">إجمالي المنصرفات</h4>
                <ul className="space-y-3">
                   {outgoings.map(o => (
                     <li key={o.id} className="flex justify-between font-mono text-sm border-b border-dashed border-gray-200 pb-1">
                       <span className="font-sans font-bold text-gray-700">{o.description} ({o.type})</span>
                       <span className="text-red-600">-{o.amount.toLocaleString()}</span>
                     </li>
                   ))}
                </ul>
             </div>
          </div>

          <div className="bg-gray-50 border-2 border-gray-900 p-6 rounded-2xl flex justify-between items-center print:bg-white print:rounded-none print:border-2">
             <span className="text-xl font-black text-gray-900">صافي الخزينة النهائي:</span>
             <span className="text-3xl font-mono font-black text-gray-900">
               {((incomings.reduce((s,i)=>s+i.amount,0) + orders.reduce((s,o)=>s+(o.totalAmount||0),0)) - outgoings.reduce((s,o)=>s+o.amount,0)).toLocaleString()} د.ل
             </span>
          </div>
       </div>
    </div>
  );
}

// ─── شارة عدد أوامر الصرف المعلقة ─────────────────────────────
function PaymentOrdersBadge() {
  const orders = useLiveQuery(() =>
    db.paymentOrders.filter((o) => o.status === "بانتظار الخزينة").toArray()
  ) || [];
  if (orders.length === 0) return null;
  return (
    <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
      {orders.length}
    </span>
  );
}

// ─── عرض أوامر الصرف ───────────────────────────────────────────
function PaymentOrdersView({ showSuccess }: { showSuccess: (msg: string) => void }) {
  const paymentOrders =
    useLiveQuery(() => db.paymentOrders.orderBy("id").reverse().toArray()) || [];
  const pending = paymentOrders.filter((o) => o.status === "بانتظار الخزينة");
  const processed = paymentOrders.filter((o) => o.status !== "بانتظار الخزينة");

  const printVoucher = (order: any) => {
    const win = window.open("", "_blank", "width=520,height=680");
    if (!win) return;
    win.document.write(
      `<html dir="rtl"><head><title>سند صرف ${order.voucherNumber}</title>` +
      `<style>body{font-family:Arial;padding:30px;font-size:13px}` +
      `h2{text-align:center;color:#ff6b00;border-bottom:2px solid #ff6b00;padding-bottom:10px}` +
      `.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #eee}` +
      `.total{font-size:18px;font-weight:bold;text-align:center;margin:20px 0;background:#fff7ed;padding:15px;border-radius:8px}` +
      `.sig{margin-top:40px;display:flex;justify-content:space-between;font-size:12px;color:#555;border-top:1px solid #ccc;padding-top:15px}` +
      `</style></head><body>` +
      `<h2>تشيكن هات — سند صرف نقدي</h2>` +
      `<div class="row"><span>رقم السند:</span><strong>${order.voucherNumber}</strong></div>` +
      `<div class="row"><span>رقم الطلب:</span><strong>${order.requestNumber}</strong></div>` +
      `<div class="row"><span>المورد:</span><strong>${order.supplierName}</strong></div>` +
      `<div class="row"><span>الصنف:</span><strong>${order.itemName}</strong></div>` +
      `<div class="row"><span>الكمية:</span><strong>${order.qty} ${order.unit}</strong></div>` +
      `<div class="row"><span>سعر الوحدة:</span><strong>${order.unitPrice.toFixed(2)} د.ل</strong></div>` +
      `<div class="total">إجمالي المبلغ: ${order.totalAmount.toFixed(2)} د.ل</div>` +
      `<div class="row"><span>الفرع:</span><strong>${order.branch}</strong></div>` +
      `<div class="row"><span>التاريخ:</span><strong>${new Date().toLocaleDateString("ar-SA")}</strong></div>` +
      `<div class="sig"><div>أمين الخزينة: ___________</div><div>المستلم: ___________</div><div>المدير: ___________</div></div>` +
      `</body></html>`
    );
    win.document.close();
    win.print();
  };

  const handleApprove = async (order: any) => {
    const now = new Date().toISOString();
    await db.paymentOrders.update(order.id, {
      status: "تم الصرف",
      paidAt: now,
      paidBy: "أمين الخزينة",
    });
    await db.treasuryOutgoing.add({
      type: "مشتريات",
      amount: order.totalAmount,
      description: `سند ${order.voucherNumber} - ${order.supplierName} - ${order.itemName}`,
      branch: order.branch,
      date: now.split("T")[0],
      createdAt: now,
      isSynced: false,
    });
    showSuccess(`تم صرف ${order.totalAmount.toFixed(2)} د.ل للمورد "${order.supplierName}"`);
    printVoucher(order);
  };

  const handleReject = async (id: number) => {
    await db.paymentOrders.update(id, { status: "مرفوض" });
    showSuccess("تم رفض أمر الصرف");
  };

  return (
    <div className="space-y-8">
      {/* أوامر بانتظار الاعتماد */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-[2rem] p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-black text-indigo-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" /> أوامر صرف بانتظار الخزينة
            </h3>
            <p className="text-xs text-indigo-600 font-bold mt-1">
              صادرة من مدير الفرع — تحتاج موافقتك وطباعة السند
            </p>
          </div>
          <span
            className={`text-sm font-extrabold px-4 py-1.5 rounded-full border ${
              pending.length > 0
                ? "bg-indigo-600 text-white border-indigo-600 animate-pulse"
                : "bg-white text-indigo-500 border-indigo-200"
            }`}
          >
            {pending.length} أمر معلق
          </span>
        </div>

        {pending.length === 0 ? (
          <div className="bg-white border border-dashed border-indigo-200 rounded-2xl p-10 text-center">
            <CheckCircle2 className="w-12 h-12 text-indigo-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-bold">لا توجد أوامر صرف معلقة حالياً</p>
            <p className="text-xs text-gray-400 mt-1">
              ستظهر هنا عند اعتماد المدير لطلبات الشراء بخيار اعتماد وصرف
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {pending.map((order) => (
              <div
                key={order.id}
                className="bg-white border-2 border-indigo-200 rounded-2xl p-5 shadow-lg shadow-indigo-100 relative overflow-hidden flex flex-col"
              >
                <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
                <div className="flex justify-between items-start mt-1 mb-3">
                  <div>
                    <p className="text-xs font-extrabold text-indigo-600 font-mono">{order.voucherNumber}</p>
                    <p className="text-base font-extrabold text-gray-900 mt-0.5">{order.supplierName}</p>
                    <p className="text-xs text-gray-400 font-mono">{order.requestNumber}</p>
                  </div>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-1 rounded-lg">
                    {order.branch}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 mb-3 text-xs space-y-1.5 flex-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">الصنف</span>
                    <strong>{order.itemName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">الكمية</span>
                    <strong>{order.qty} {order.unit}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">سعر الوحدة</span>
                    <strong>{order.unitPrice.toFixed(2)} د.ل</strong>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
                    <span className="font-extrabold text-gray-900">الإجمالي</span>
                    <strong className="text-[#ff6b00] text-sm font-mono">
                      {order.totalAmount.toFixed(2)} د.ل
                    </strong>
                  </div>
                </div>
                {order.notes && (
                  <p className="text-[10px] bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 mb-3 text-gray-500">
                    {order.notes}
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2 mt-auto">
                  <button
                    onClick={() => handleApprove(order)}
                    className="col-span-2 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-md active:scale-[0.97]"
                  >
                    <Printer className="w-3.5 h-3.5" /> موافقة وطباعة السند
                  </button>
                  <button
                    onClick={() => handleReject(order.id!)}
                    className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 text-lg font-bold py-3 rounded-xl border border-red-200 transition active:scale-[0.97]"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* سجل الأوامر المعالجة */}
      {processed.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-gray-900">سجل أوامر الصرف المعالجة</h3>
            <span className="text-xs text-gray-400 font-bold">{processed.length} أمر</span>
          </div>
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
                <th className="px-5 py-3">رقم السند</th>
                <th className="px-5 py-3">المورد</th>
                <th className="px-5 py-3">الصنف</th>
                <th className="px-5 py-3 text-center">المبلغ</th>
                <th className="px-5 py-3 text-center">الحالة</th>
                <th className="px-5 py-3 text-center">طباعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {processed.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4 font-mono text-xs text-gray-400">{order.voucherNumber}</td>
                  <td className="px-5 py-4 font-bold text-sm text-gray-900">{order.supplierName}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{order.itemName}</td>
                  <td className="px-5 py-4 text-center font-mono font-bold text-red-600">
                    {order.totalAmount.toFixed(2)} د.ل
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        order.status === "تم الصرف"
                          ? "bg-green-50 text-green-600 border-green-200"
                          : "bg-red-50 text-red-500 border-red-200"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {order.status === "تم الصرف" && (
                      <button
                        onClick={() => printVoucher(order)}
                        className="text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1 mx-auto transition"
                      >
                        <Printer className="w-3.5 h-3.5" /> إعادة طباعة
                      </button>
                    )}
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

