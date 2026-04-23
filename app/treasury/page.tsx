"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, PieChart, Activity, FileText, Banknote, ShieldAlert,
  TrendingDown, TrendingUp, DollarSign, Target, Receipt, Truck,
  ChefHat, AlertCircle, Percent, ArrowRightLeft, CreditCard, 
  CheckCircle2, Users, Flame, Utensils, Boxes, ClipboardList, Clock, BarChart4, LogOut
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db";
import { clearSession } from "../../lib/auth";

// ─── أنواع البيانات ───────────────────────────────────────────
type TabType = 
  | "لوحة الأداء اليومي (Dashboard)"
  | "شجرة الحسابات (Chart of Accounts)"
  | "مبيعات وتسويات الـ POS"
  | "تكلفة الوصفات والمخزون"
  | "المشتريات والموردين"
  | "الرواتب والشئون (Payroll)";

const BRANCHES = ["فرع وسط البلاد", "فرع الحدائق", "فرع فينيسيا"];

// ─── المكون الرئيسي للصفحة ─────────────────────────────────────
export default function UltimateAccountantPage() {
  const [activeTab, setActiveTab] = useState<TabType>("لوحة الأداء اليومي (Dashboard)");
  const [successMsg, setSuccessMsg] = useState("");

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] text-gray-900 font-sans selection:bg-emerald-500/30 selection:text-emerald-900" dir="rtl">
      
      {/* ── القائمة الجانبية (Sidebar) ── */}
      <aside className="w-[300px] bg-[#0F172A] border-l border-gray-800 flex flex-col shrink-0 z-20 shadow-2xl overflow-y-auto">
        <div className="p-8 border-b border-gray-800 flex items-center gap-4 sticky top-0 bg-[#0F172A]/90 backdrop-blur-md">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/30">
            <BarChart4 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">النظام المالي</h1>
            <p className="text-[10px] text-emerald-400 font-bold tracking-widest bg-emerald-400/10 px-2 py-1 rounded inline-block mt-1">CFO / FINANCE ERP</p>
          </div>
        </div>

        <div className="p-5 flex-1 space-y-2">
          <p className="text-[10px] font-black text-gray-500 mb-4 px-3 tracking-widest uppercase pb-2">التبويبات الـ 12 المتكاملة</p>
          
          {[
            { id: "لوحة الأداء اليومي (Dashboard)", icon: Activity, desc: "المؤشرات والأوقات الذروة والمبيعات" },
            { id: "شجرة الحسابات (Chart of Accounts)", icon: FileText, desc: "قائمة الدخل، الفروع، والقيود" },
            { id: "مبيعات وتسويات الـ POS", icon: Receipt, desc: "صالة، سفري، وتطابق الكاشير" },
            { id: "تكلفة الوصفات والمخزون", icon: ChefHat, desc: "التكلفة، الهدر، و Food Cost" },
            { id: "المشتريات والموردين", icon: Truck, desc: "الفواتير، الديون وعروض الأسعار" },
            { id: "الرواتب والشئون (Payroll)", icon: Users, desc: "سلف الموظفين، عمولات وراتب" },
          ].map((tab: any) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)}
                className={`w-full flex items-start gap-4 px-5 py-4 rounded-2xl transition-all text-right group ${
                  isActive ? "bg-emerald-600 text-white shadow-xl shadow-emerald-900/50" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}>
                <div className={`mt-0.5 ${isActive ? 'text-white' : 'text-emerald-500'}`}>
                   <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <div>
                  <span className={`block font-extrabold text-sm ${isActive ? 'text-white' : 'text-gray-300'}`}>{tab.id}</span>
                  <span className={`block text-[10px] font-bold mt-1 ${isActive ? 'text-emerald-200' : 'text-gray-500'}`}>{tab.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="p-6 border-t border-gray-800 space-y-4">
           <div className="text-[10px] font-mono text-gray-500 bg-gray-900 rounded-xl p-4 flex gap-3 border border-gray-800">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981] mt-1 shrink-0"></div>
             <div>
                <p className="text-gray-300 font-bold">التكامل مع النظام الفعلي: <span className="text-emerald-400">نشط</span></p>
                <p className="mt-1 leading-relaxed">رقابة داخلية، منع التلاعب (Audit Trail فعال للوردية).</p>
             </div>
           </div>
           <button
             onClick={() => { clearSession(); window.location.href = "/"; }}
             className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-bold text-sm border border-transparent hover:border-red-500/20"
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
              className="absolute top-0 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-emerald-400 px-6 py-4 rounded-xl font-bold shadow-2xl flex items-center gap-3 border border-emerald-500 min-w-[300px] justify-center text-sm">
              <CheckCircle2 className="w-5 h-5" /> {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <header className="h-20 bg-white border-b border-gray-200 px-10 flex items-center justify-between shrink-0 z-10 shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-gray-900">{activeTab}</h2>
            <p className="text-xs text-gray-500 font-bold mt-1">رقابة الإدارة العليا والتسيير المالي الاحترافي</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-orange-50 text-orange-700 border border-orange-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-inner">
                <AlertCircle className="w-4 h-4"/> إغلاق يوميات: 2 فروع معلقة
             </div>
             <button className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg">
                <FileText className="w-4 h-4"/> تصدير تقرير الضرائب والمنظومة
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10">
          <div className="max-w-[1500px] mx-auto h-full">
            {activeTab === "لوحة الأداء اليومي (Dashboard)" && <DailyDashboardView />}
            {activeTab === "شجرة الحسابات (Chart of Accounts)" && <ChartOfAccountsView />}
            {activeTab === "مبيعات وتسويات الـ POS" && <POSControlView showSuccess={showSuccess} />}
            {activeTab === "تكلفة الوصفات والمخزون" && <FoodCostInventoryView showSuccess={showSuccess} />}
            {activeTab === "المشتريات والموردين" && <PurchasesPayablesView showSuccess={showSuccess} />}
            {activeTab === "الرواتب والشئون (Payroll)" && <PayrollHRView showSuccess={showSuccess} />}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. لوحة الأداء اليومي والتحليل (Daily Dashboard)
// ─────────────────────────────────────────────────────────────
function DailyDashboardView() {
  const orders = useLiveQuery(() => db.orders.toArray());
  const sysTotalDisplay = orders && orders.length > 0 ? orders.reduce((s,o)=>s+(o.totalAmount || 0),0) : 42500;
  
  const dineIn = orders && orders.length > 0 ? orders.filter(o => o.type === 'Dine-in').reduce((s,o)=>s+o.totalAmount,0) : 15000;
  const takeAway = orders && orders.length > 0 ? orders.filter(o => o.type === 'Takeaway').reduce((s,o)=>s+o.totalAmount,0) : 10500;
  const delivery = orders && orders.length > 0 ? orders.filter(o => o.type === 'Delivery').reduce((s,o)=>s+o.totalAmount,0) : 17000;

  const getPercent = (val: number) => sysTotalDisplay > 0 ? ((val / sysTotalDisplay) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-6 py-4 rounded-xl flex items-center justify-between font-bold shadow-sm">
          <span>يتم الآن استرجاع المبيعات اللحظية مباشرةً من قاعدة البيانات المحلية (Offline DB) دون الحاجة للإنترنت. اذهب لعمل طلب في الكاشير وستتغير الأرقام فوراً هنا!</span>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-xl">
             <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4"><DollarSign className="w-6 h-6"/></div>
             <h4 className="text-xs font-black text-gray-400 tracking-widest mb-1">مبيعات المطاعم - المباشرة</h4>
             <p className="text-3xl font-mono font-black text-gray-900">{sysTotalDisplay.toLocaleString()} <span className="text-sm font-sans text-gray-500">د.ل</span></p>
             <p className="text-[10px] text-emerald-600 font-bold mt-2 bg-emerald-50 inline-block px-2 py-1 rounded">▲ مقروءة مباشره من الـ DB</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
             <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4"><Flame className="w-6 h-6"/></div>
             <h4 className="text-xs font-black text-gray-400 tracking-widest mb-1">نسبة تكلفة المبيعات (Food Cost)</h4>
             <p className="text-3xl font-mono font-black text-gray-900">28.4<span className="text-lg font-sans text-gray-500">%</span></p>
             <p className="text-[10px] text-emerald-600 font-bold mt-2 bg-emerald-50 inline-block px-2 py-1 rounded">✔ ضمن الهدف (أقل من 32%)</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
             <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Clock className="w-6 h-6"/></div>
             <h4 className="text-xs font-black text-gray-400 tracking-widest mb-1">أوقات الذروة المكتشفة (Peak Hours)</h4>
             <p className="text-2xl font-black text-gray-900" dir="ltr">08:00 PM - 11:30 PM</p>
             <p className="text-[10px] text-blue-600 font-bold mt-2 bg-blue-50 inline-block px-2 py-1 rounded">تمثل 65% من الدخل اليومي</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-[2rem] border border-gray-800 shadow-xl shadow-gray-900/30">
             <div className="w-12 h-12 bg-gray-800 text-red-400 border border-gray-700 rounded-xl flex items-center justify-center mb-4"><TrendingDown className="w-6 h-6"/></div>
             <h4 className="text-xs font-black text-gray-400 tracking-widest mb-1">معدل الهدر والفاقد (Waste %)</h4>
             <p className="text-3xl font-mono font-black text-white">1.2<span className="text-lg font-sans text-gray-500">%</span></p>
             <p className="text-[10px] text-red-400 font-bold mt-2 bg-red-900/30 inline-block px-2 py-1 border border-red-800/50 rounded">يعادل خسارة 510 د.ل اليوم</p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-[2rem] p-8 border border-gray-200 shadow-sm">
             <h3 className="text-base font-black text-gray-900 mb-6 flex items-center gap-2"><PieChart className="w-5 h-5 text-orange-500"/> تقسيم قنوات المبيعات (Sales Channels)</h3>
             <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-xs font-bold mb-2"><span className="text-gray-600">طاولات الصالة (Dine-in)</span><span className="text-gray-900 font-mono">{dineIn.toLocaleString()} د.ل ({getPercent(dineIn)}%)</span></div>
                    <div className="w-full bg-gray-100 rounded-full h-3"><div className="bg-indigo-500 h-3 rounded-full transition-all duration-1000" style={{width: `${getPercent(dineIn)}%`}}></div></div>
                 </div>
                 <div>
                    <div className="flex justify-between text-xs font-bold mb-2"><span className="text-gray-600">طلب سفري (Takeaway)</span><span className="text-gray-900 font-mono">{takeAway.toLocaleString()} د.ل ({getPercent(takeAway)}%)</span></div>
                    <div className="w-full bg-gray-100 rounded-full h-3"><div className="bg-emerald-500 h-3 rounded-full transition-all duration-1000" style={{width: `${getPercent(takeAway)}%`}}></div></div>
                 </div>
                 <div>
                    <div className="flex justify-between text-xs font-bold mb-2"><span className="text-gray-600">الدليفري والتطبيقات المشتركة (Delivery)</span><span className="text-gray-900 font-mono">{delivery.toLocaleString()} د.ل ({getPercent(delivery)}%)</span></div>
                    <div className="w-full bg-gray-100 rounded-full h-3"><div className="bg-orange-500 h-3 rounded-full transition-all duration-1000" style={{width: `${getPercent(delivery)}%`}}></div></div>
                 </div>
             </div>
          </div>
       </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. الهيكل المحاسبي (Chart of Accounts & PnL)
// ─────────────────────────────────────────────────────────────
function ChartOfAccountsView() {
  const [selectedBranch, setSelectedBranch] = useState("المركزيات الشاملة (المجمعة)");
  
  const orders = useLiveQuery(() => db.orders.toArray());
  const sysTotalDisplay = orders && orders.length > 0 ? orders.reduce((s,o)=>s+(o.totalAmount||0),0) : 42500;
  const foodCost = sysTotalDisplay * 0.284;
  const netProfit = sysTotalDisplay - foodCost - 8500;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="flex items-center justify-between bg-white p-6 border border-gray-200 rounded-[2rem] shadow-sm">
          <div>
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><FileText className="w-6 h-6 text-emerald-600"/> أدلة الحسابات وقائمة الدخل</h3>
            <p className="text-xs font-bold text-gray-400 mt-1">تحديد الحسابات وفصل البيانات المالية استنتاجاً لتقرير أرباح كل فرع بدقة.</p>
          </div>
          <select value={selectedBranch} onChange={e=>setSelectedBranch(e.target.value)} className="bg-gray-50 border-2 border-gray-200 rounded-xl px-6 py-3 font-extrabold text-gray-700 outline-none focus:border-emerald-500 shadow-inner">
             <option value="المركزيات الشاملة (المجمعة)">كل الفروع معاً</option>
             {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
       </div>

       {/* PnL Statement Mini */}
       <div className="bg-gray-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden border border-gray-800">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Target className="w-48 h-48"/></div>
          <h4 className="text-lg font-black mb-6 border-b border-gray-700 pb-4 relative z-10">استخراج قائمة الدخل (P&L) - {selectedBranch}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10 text-center divide-x divide-x-reverse divide-gray-700 font-mono">
             <div>
                <p className="text-xs font-bold text-indigo-300 font-sans tracking-widest uppercase mb-2">إجمالي الدخل (إيرادات المبيعات)</p>
                <p className="text-2xl font-black text-white">{sysTotalDisplay.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
             </div>
             <div>
                <p className="text-xs font-bold text-orange-300 font-sans tracking-widest uppercase mb-2">- تكلفة المبيعات (Food Cost)</p>
                <p className="text-2xl font-black text-orange-400">{(sysTotalDisplay * 0.284).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
             </div>
             <div>
                <p className="text-xs font-bold text-blue-300 font-sans tracking-widest uppercase mb-2">- أجور ومصاريف تشغيل (Labor/Overhead)</p>
                <p className="text-2xl font-black text-blue-400">8,500.00</p>
             </div>
             <div>
                <p className="text-xs font-black text-emerald-400 font-sans tracking-widest uppercase mb-2">= صافي الربح الشامل (Net Profit)</p>
                <p className={`text-3xl font-black ${netProfit > 0 ? 'text-emerald-400 bg-emerald-900/50 border-emerald-500/30' : 'text-red-400 bg-red-900/50 border-red-500/30'} rounded-xl py-1 border`}>{netProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
             </div>
          </div>
       </div>

       {/* شجرة الحسابات الأساسية للفرع */}
       <div className="bg-white rounded-[2rem] p-8 border border-gray-200 shadow-sm">
          <h4 className="text-base font-black text-gray-900 mb-6 flex items-center gap-2"><CreditCard className="w-5 h-5 text-gray-400"/> دفتر أستاذ وحسابات قيود الفروع - {selectedBranch}</h4>
          <table className="w-full text-right text-sm">
             <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                   <th className="py-4 px-6 text-xs text-center font-black text-gray-400 uppercase tracking-widest w-20">كود الأستاذ</th>
                   <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">نوع الحساب الجاري / الأصل</th>
                   <th className="py-4 px-6 text-[10px] text-center font-black text-emerald-600 uppercase tracking-widest bg-emerald-50/50">مدين (Debit) د.ل</th>
                   <th className="py-4 px-6 text-[10px] text-center font-black text-red-600 uppercase tracking-widest bg-red-50/50">دائن (Credit) د.ل</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
                <tr className="hover:bg-gray-50 transition">
                   <td className="py-4 px-6 font-mono text-center bg-gray-50/80">1100</td>
                   <td className="py-4 px-6">[أصول] الصندوق والخزينة السائلة في الفرع</td>
                   <td className="py-4 px-6 text-center font-mono text-gray-900">12,500.00</td>
                   <td className="py-4 px-6 text-center font-mono text-gray-400">0.00</td>
                </tr>
                <tr className="hover:bg-gray-50 transition">
                   <td className="py-4 px-6 font-mono text-center bg-gray-50/80">4100</td>
                   <td className="py-4 px-6">[إيرادات] مبيعات الكاشير المباشرة للطعام</td>
                   <td className="py-4 px-6 text-center font-mono text-gray-400">0.00</td>
                   <td className="py-4 px-6 text-center font-mono text-gray-900">42,500.00</td>
                </tr>
                <tr className="hover:bg-gray-50 transition">
                   <td className="py-4 px-6 font-mono text-center bg-gray-50/80">5100</td>
                   <td className="py-4 px-6">[تكاليف] تكلفة المواد المشتراة / تكلفة الوجبات المصروفة</td>
                   <td className="py-4 px-6 text-center font-mono text-gray-900">12,070.00</td>
                   <td className="py-4 px-6 text-center font-mono text-gray-400">0.00</td>
                </tr>
                <tr className="hover:bg-gray-50 transition">
                   <td className="py-4 px-6 font-mono text-center bg-gray-50/80">5200</td>
                   <td className="py-4 px-6">[مصاريف] رواتب وأجور موظفي الفرع المباشرة</td>
                   <td className="py-4 px-6 text-center font-mono text-gray-900">4,500.00</td>
                   <td className="py-4 px-6 text-center font-mono text-gray-400">0.00</td>
                </tr>
             </tbody>
          </table>
       </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. مبيعات وتسويات الـ POS (Reconciliation)
// ─────────────────────────────────────────────────────────────
function POSControlView({ showSuccess }: any) {
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0]);
  const [isClosed, setIsClosed] = useState(false);
  const [inputCash, setInputCash] = useState(14950);
  
  // Data simulating a typical Cash/POS mismatch
  const orders = useLiveQuery(() => db.orders.toArray());
  const sysTotal = orders && orders.length > 0 ? orders.reduce((s,o)=>s+(o.totalAmount||0),0) : 15000;
  const dineIn = orders && orders.length > 0 ? orders.filter(o => o.type === 'Dine-in').reduce((s,o)=>s+(o.totalAmount||0),0) : 5000;
  const takeAway = orders && orders.length > 0 ? orders.filter(o => o.type === 'Takeaway').reduce((s,o)=>s+(o.totalAmount||0),0) : 4000;
  const delivery = orders && orders.length > 0 ? orders.filter(o => o.type === 'Delivery').reduce((s,o)=>s+(o.totalAmount||0),0) : 6000;

  // New precise accounting for Cash/Bank
  const totalCashExpected = orders && orders.length > 0 ? orders.reduce((s,o)=>s+(o.cashAmount||0),0) : 14950;
  const totalBankExpected = orders && orders.length > 0 ? orders.reduce((s,o)=>s+(o.bankAmount||0),0) : 50;

  const discrepancy = inputCash - totalCashExpected; // Reconcile Physical Cash vs Expected Cash ONLY.

  const handleClose = () => {
    setIsClosed(true);
    showSuccess("تم تحميل العجز على الكاشير المسئول وإقفال ورديته بنجاح.");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
             <div>
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><ArrowRightLeft className="w-6 h-6 text-indigo-500"/> جرد ومطابقة النقدية مع الكاشير</h3>
                <p className="text-xs font-bold text-gray-500 mt-2">تسجيل المبيعات في السيستم مقابل الإيداع النقدي الفعلي بالدرج لاكتشاف العجوزات.</p>
             </div>
             <select disabled={isClosed} value={selectedBranch} onChange={e=>setSelectedBranch(e.target.value)} className="bg-gray-50 border-2 border-gray-200 rounded-xl px-6 py-3 font-extrabold text-gray-700 outline-none focus:border-indigo-500 disabled:opacity-50">
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
             </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* السيستم */}
             <div className="bg-gray-50 rounded-3xl p-6 border border-gray-200 opacity-90 relative">
                {isClosed && <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center"><div className="bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> وردية مغلقة</div></div>}
                <h4 className="text-sm font-black text-gray-800 mb-6 flex items-center gap-2"><Receipt className="w-5 h-5 text-indigo-400"/> إجمالي النظام المبيعات الآلية (System)</h4>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="bg-white p-4 rounded-xl border border-gray-100 text-center">
                      <p className="text-[10px] font-black text-gray-400 mb-1">المدفوع كاش (نقد)</p>
                      <p className="text-lg font-mono font-black text-emerald-600">{totalCashExpected.toLocaleString()}</p>
                   </div>
                   <div className="bg-white p-4 rounded-xl border border-gray-100 text-center">
                      <p className="text-[10px] font-black text-gray-400 mb-1">المدفوع بطاقة (مصرف)</p>
                      <p className="text-lg font-mono font-black text-blue-600">{totalBankExpected.toLocaleString()}</p>
                   </div>
                </div>

                <div className="space-y-3 mb-6">
                   <div className="flex justify-between font-bold text-xs p-3 bg-white rounded-xl border border-gray-100"><span className="text-gray-500">شيكات الصالة (Dine-in)</span> <span className="font-mono text-gray-900">{dineIn.toLocaleString()}</span></div>
                   <div className="flex justify-between font-bold text-xs p-3 bg-white rounded-xl border border-gray-100"><span className="text-gray-500">طلب سفري (Takeaway)</span> <span className="font-mono text-gray-900">{takeAway.toLocaleString()}</span></div>
                   <div className="flex justify-between font-bold text-xs p-3 bg-white rounded-xl border border-gray-100"><span className="text-gray-500">طلب توصيل ودليفري</span> <span className="font-mono text-gray-900">{delivery.toLocaleString()}</span></div>
                </div>
                <div className="flex justify-between items-center bg-gray-900 text-white p-4 rounded-2xl shadow-inner">
                   <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">إجمالي المبيعات الشامل</span>
                   <span className="text-2xl font-mono font-black">{sysTotal.toLocaleString()} <span className="text-xs text-gray-400">د.ل</span></span>
                </div>
             </div>

             {/* الجرد الفعلي للمحاسب */}
             <div className="bg-indigo-600 rounded-3xl p-6 border-4 border-indigo-500 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute -left-10 opacity-10"><Banknote className="w-64 h-64"/></div>
                <h4 className="text-sm font-black text-white mb-6 flex items-center gap-2 relative z-10"><Wallet className="w-5 h-5 text-indigo-300"/> المطابقة المادية للخزنة والأدراج (Physical)</h4>
                
                <div className="space-y-4 relative z-10">
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2 block">الكاش النقدي المودع باليد</label>
                      <input type="number" value={inputCash} onChange={(e)=>setInputCash(Number(e.target.value))} disabled={isClosed} className="w-full bg-indigo-800/80 border border-indigo-400 rounded-xl px-5 py-4 font-mono font-black text-xl outline-none focus:ring-2 focus:ring-emerald-400 transition-all text-white" />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2 block text-red-200">إيصالات إثبات سحوبات من الدرج للمصروفات</label>
                      <input type="number" readOnly value={0} disabled={isClosed} className="w-full bg-indigo-800/80 border border-indigo-400 rounded-xl px-5 py-3 font-mono font-black outline-none text-red-100" />
                   </div>
                </div>

                <div className="mt-6 relative z-10">
                   {discrepancy === 0 ? (
                      <div className="bg-emerald-500 text-white p-4 rounded-xl flex items-center font-bold gap-3 border border-emerald-400">
                         <CheckCircle2 className="w-6 h-6"/> الكاشير متطابق مع المنظومة
                      </div>
                   ) : discrepancy < 0 ? (
                      <div className="bg-red-500 text-white p-4 rounded-xl flex items-center justify-between font-bold border border-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                         <div className="flex items-center gap-3"><AlertCircle className="w-6 h-6"/> اكتشاف عجز دفتري!</div>
                         <span className="font-mono text-xl text-white">{discrepancy} د.ل</span>
                      </div>
                   ) : (
                      <div className="bg-emerald-600 text-white p-4 rounded-xl flex items-center justify-between font-bold">
                         <div className="flex items-center gap-3">يوجد زيادات أموال بالدرج (فائض)</div>
                         <span className="font-mono text-xl text-white">+{discrepancy} د.ل</span>
                      </div>
                   )}
                </div>

                {!isClosed ? (
                  <button onClick={handleClose} className="w-full bg-white hover:bg-gray-100 text-indigo-900 font-black py-4 mt-6 rounded-xl transition relative z-10 shadow-lg">
                     اعتماد التسوية وإقفال الكاشير وتسجيل العجز/الفائض باليومية
                  </button>
                ) : (
                  <button disabled className="w-full bg-indigo-900/50 text-indigo-300 font-black py-4 mt-6 rounded-xl relative z-10 cursor-not-allowed">
                     الوردية مُقفلة ومسجلة بدفتر الأستاذ
                  </button>
                )}
             </div>
          </div>
       </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. تكلفة الوصفات والمخزون المالي (Food Cost & Inventory)
// ─────────────────────────────────────────────────────────────
function FoodCostInventoryView({ showSuccess }: any) {
  const [sellPrice, setSellPrice] = useState(12);
  const [ingredients, setIngredients] = useState([
    { id: 1, name: "صدر دجاج استربس", qty: "200 جرام", cost: 2.50, color: "indigo" },
    { id: 2, name: "خبر برجر / تورتيلا", qty: "1 حبة", cost: 0.50, color: "orange" },
    { id: 3, name: "صوص كوكتيل (ديناميت)", qty: "40 جرام", cost: 0.40, color: "green" },
    { id: 4, name: "تغليف ورقي ولوجو المطعم", qty: "1 علبة", cost: 0.40, color: "yellow" },
  ]);

  const totalCost = ingredients.reduce((sum, item) => sum + item.cost, 0);

  const addIngredient = () => {
    const newIng = { id: Date.now(), name: "إضافة جديدة (خس/طماطم)", qty: "20 جرام", cost: 0.20, color: "gray" };
    setIngredients([...ingredients, newIng]);
    showSuccess("تم إضافة مكون خام جديد للوصفة");
  };

  const removeIngredient = (id: number) => {
    setIngredients(ingredients.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-200 rounded-[2rem] p-8 shadow-sm">
             <h3 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-2"><ChefHat className="w-6 h-6 text-orange-500"/> تسعير هندسة المنيو (Recipe Costing)</h3>
             <p className="text-xs font-bold text-gray-500 mb-8 border-b border-gray-100 pb-4">تحديد مقادير الطبق بالجرام ليقوم النظام بسحب السعر من المخزن ومنحك تكلفة Food Cost دقيقة لمعرفة هامش ربحيتك.</p>
             
             <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-6 font-bold text-sm">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> الوجبة المراد تسعيرها: <span className="text-emerald-700">وجبة كريسبي زينجر (3 قطع)</span>
             </div>

             <div className="space-y-4 mb-6">
                <div>
                   <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">سعر بيع الوجبة بالمطعم (Menu Price) د.ل</label>
                   <input type="number" value={sellPrice} onChange={e=>setSellPrice(Number(e.target.value))} className="w-full bg-white border-2 border-gray-100 focus:border-orange-500 rounded-xl px-5 py-4 font-mono font-black text-xl outline-none" />
                </div>
             </div>
             
             {/* Simulated Plate Cost */}
             <div className="bg-gray-900 text-white p-6 rounded-2xl flex justify-between items-center shadow-xl transition-all">
                 <div>
                    <h4 className="text-[10px] text-gray-400 font-extrabold tracking-widest uppercase mb-1">إجمالي تكلفة المكونات من المخزن</h4>
                    <span className="text-2xl font-mono font-black text-orange-400">{totalCost.toFixed(2)} د.ل</span>
                 </div>
                 <div className="text-left border-l border-gray-700 pl-6">
                    <h4 className="text-[10px] text-gray-400 font-extrabold tracking-widest uppercase mb-1">نسبة التكلفة (Food Cost %)</h4>
                    <span className="text-3xl font-mono font-black text-emerald-400">{((totalCost / sellPrice)*100).toFixed(1)}%</span>
                 </div>
             </div>
             {((totalCost / sellPrice)*100) > 33 && <p className="text-xs font-bold text-red-500 mt-3 text-center bg-red-50 py-2 rounded-lg border border-red-100 animate-pulse">⚠ تنبيه: تعدت النسبة خط 33% وهو الحد الأقصى للمطاعم المحترفة.</p>}
          </div>

          <div className="bg-white border border-gray-200 rounded-[2rem] p-8 shadow-sm flex flex-col">
             <h3 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-6"><Boxes className="w-6 h-6 text-gray-400"/> استهلاك الوجبة المربوط بالتكلفة (Ingredients)</h3>
             
             <div className="flex-1 overflow-x-auto min-h-[250px]">
                <table className="w-full text-right text-sm">
                   <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                         <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">المكون الخام</th>
                         <th className="py-3 px-4 text-[10px] font-black text-gray-400 text-center uppercase tracking-widest">الكمية المسحوبة</th>
                         <th className="py-3 px-4 text-[10px] font-black text-gray-400 text-left uppercase tracking-widest">سعر التكلفة للطبق</th>
                         <th className="py-3 px-4 w-10"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 font-bold">
                      <AnimatePresence>
                        {ingredients.map(ing => (
                          <motion.tr initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0}} key={ing.id} className="hover:bg-gray-50">
                             <td className="py-4 px-4 text-indigo-900 truncate max-w-[150px]">{ing.name}</td>
                             <td className="py-4 px-4 text-center font-mono text-gray-500">{ing.qty}</td>
                             <td className="py-4 px-4 text-left font-mono font-black text-gray-900">{ing.cost.toFixed(2)} د.ل</td>
                             <td className="py-4 px-4 text-left">
                                <button onClick={()=>removeIngredient(ing.id)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition">×</button>
                             </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                   </tbody>
                </table>
             </div>
             
             <button onClick={addIngredient} className="mt-4 border-2 border-dashed border-gray-300 text-gray-500 hover:text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50 font-bold py-3 rounded-xl transition flex justify-center items-center gap-2 text-sm">
                <ChefHat className="w-4 h-4"/> إضافة مادة خام للوصفة لمعادلة التكلفة
             </button>

             <button onClick={()=>showSuccess("تم حفظ سياسة تكلفة الطبق وتعميمها على الخزينة لمنع الهدر والتلاعب المخزني.")} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl shadow-lg mt-6 transition">
                شبط وسحب المكونات من المخزن آلياً بمجرد البيع في الكاشير
             </button>
          </div>
       </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. قسم المشتريات والموردين والديون (Payables)
// ─────────────────────────────────────────────────────────────
function PurchasesPayablesView({ showSuccess }: any) {
   const invoices = useLiveQuery(() => db.invoices.toArray()) || [];

   const payInvoice = async (id: string) => {
     // الدفع هنا يوازي اعتمادها مالياً ومخزنياً في هذا النظام المبسط
     await db.invoices.update(id, { status: "معتمدة" });
     showSuccess("تم تنفيذ حوالة مصرفية للمورد واعتماد الفاتورة مالياً ومخزنياً.");
   };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-emerald-700 text-white p-8 rounded-[2rem] shadow-xl overflow-hidden relative">
         <div className="absolute -left-10 opacity-10"><Truck className="w-64 h-64"/></div>
         <div className="relative z-10">
            <h3 className="text-2xl font-black mb-1">الالتزامات الآجلة للموردين (Accounts Payable)</h3>
            <p className="font-bold text-emerald-200 text-sm">متابعة الفواتير الموردة غير المدفوعة أو المشتريات الآجلة للحفاظ على النقد المتاح.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {invoices.map((vnd: any) => {
            const isPaid = vnd.status === "معتمدة";
            const urgent = !isPaid; // تبسيط
            const amount = (vnd.qty || 0) * (vnd.unitPrice || 0);
            return (
            <div key={vnd.id} className={`border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group ${isPaid ? 'bg-gray-100 opacity-60' : 'bg-white'}`}>
               <div>
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <h4 className={`font-black mb-1 ${isPaid ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{vnd.supplier}</h4>
                        <p className="text-[10px] font-mono font-bold text-gray-400">فاتورة إيراد مخزني: {vnd.id}</p>
                     </div>
                     <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${isPaid ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : urgent ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        {isPaid ? 'مُسددة' : 'بانتظار الدفع'}
                     </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-[10px] text-gray-500 font-bold mb-6">
                     <div><span className="block mb-0.5 text-gray-400">تاريخ الشراء:</span><span className="text-gray-900">{vnd.date}</span></div>
                     <div><span className="block mb-0.5 text-gray-400">الحالة:</span><span className={`${urgent && !isPaid ? 'text-red-500' : 'text-gray-900'}`}>{vnd.status}</span></div>
                  </div>
               </div>
               
               <div className="flex border-t border-gray-100 pt-4 items-center justify-between">
                  <div className={`font-mono font-black text-xl ${isPaid ? 'text-gray-400' : 'text-gray-900'}`}>{amount.toLocaleString()} <span className="text-xs text-gray-400">د.ل</span></div>
                  {!isPaid ? (
                    <button onClick={() => payInvoice(vnd.id)} className="bg-emerald-50 text-emerald-600 font-extrabold hover:bg-emerald-600 hover:text-white px-4 py-2 hover:shadow-lg transition rounded-xl text-xs">سداد واعتماد الدفعة</button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> تم الدفع</span>
                  )}
               </div>
            </div>
          )})}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. مركز الرواتب والاتش ار (Payroll & HR)
// ─────────────────────────────────────────────────────────────
function PayrollHRView({ showSuccess }: any) {
  const employees = useLiveQuery(() => db.employees.toArray()) || [];
  const hrLogs = useLiveQuery(() => db.hrDeductions.filter(log => log.status === "مسجل" || log.status === "مُعتمد").toArray()) || [];
  
  const payrolls = employees.map(emp => {
     const empDeductions = hrLogs.filter(log => log.empId === emp.id).reduce((sum, log) => sum + log.amount, 0);
     const base = emp.baseSalary || 0;
     const cuts = empDeductions + (emp.monthlyAdvanceCut || 0);
     const bonus = 0; // Can be added later
     const net = base + bonus - cuts;
     return {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        loc: emp.branch,
        base: base,
        bonus: bonus,
        cuts: cuts,
        note: emp.monthlyAdvanceCut > 0 ? `قسط سلفة ${emp.monthlyAdvanceCut} + خصم ${empDeductions}` : (empDeductions > 0 ? `خصومات ${empDeductions}` : ""),
        net: net
     };
  });
  const [isPayrollClosed, setIsPayrollClosed] = useState(false);

  const closePayroll = () => {
     setIsPayrollClosed(true);
     showSuccess("تم إغلاق حسابات الشهر المالي وإرسال المسير الصافي لبنك الموظفين.");
  };

  return (
     <div className="space-y-8 animate-in fade-in duration-500">
        <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm flex items-center justify-between">
           <div>
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-1"><Users className="w-6 h-6 text-blue-500"/> مسير الرواتب المالي (Payroll & Incentives)</h3>
              <p className="text-xs font-bold text-gray-500">حساب الرواتب التلقائي باقتطاع السلف، الغيابات، وإضافة العمولات لتجنب الأخطاء البشرية.</p>
           </div>
           {!isPayrollClosed ? (
             <button onClick={closePayroll} className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition">إغلاق حسابات الشهر المالي وتصديرها للبنوك</button>
           ) : (
             <div className="bg-green-100 text-green-700 font-bold px-6 py-3 rounded-xl flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> تم ترحيل رواتب الشهر</div>
           )}
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden relative">
           {isPayrollClosed && <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center"></div>}
           <div className="overflow-x-auto relative z-0">
              <table className="w-full text-right text-sm">
                 <thead className="bg-gray-50">
                    <tr>
                       <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200">الموظف والفرع</th>
                       <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 text-center">الأساسي د.ل</th>
                       <th className="py-4 px-6 text-[10px] font-black text-emerald-500 uppercase tracking-widest border-b border-gray-200 text-center">بونص وإضافي</th>
                       <th className="py-4 px-6 text-[10px] font-black text-red-500 uppercase tracking-widest border-b border-gray-200 text-center">خصومات وسلف</th>
                       <th className="py-4 px-6 text-[10px] font-black text-indigo-500 uppercase tracking-widest border-b border-gray-200 text-left bg-indigo-50/50">الصافي للدفع (Net)</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100 font-bold">
                    {payrolls.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                         <td className="py-5 px-6">
                            <p className="font-extrabold text-gray-900">{p.name} <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 rounded mr-1">{p.role}</span></p>
                            <p className="text-[10px] text-gray-500 mt-1">{p.loc}</p>
                         </td>
                         <td className="py-5 px-6 text-center font-mono text-gray-800">{p.base.toFixed(2)}</td>
                         <td className="py-5 px-6 text-center font-mono text-emerald-500">+{p.bonus.toFixed(2)}</td>
                         <td className="py-5 px-6 text-center font-mono text-red-500">-{p.cuts.toFixed(2)} {p.note && <span className="text-[9px] block text-gray-400">({p.note})</span>}</td>
                         <td className="py-5 px-6 text-left font-mono font-black text-xl text-indigo-700 bg-indigo-50/50 border-r border-indigo-100">{p.net.toFixed(2)}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
     </div>
  );
}
