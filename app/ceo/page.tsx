"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, Activity, Settings, UserPlus, Building,
  Phone, Calendar, Image as ImageIcon, FileBadge, DollarSign, Wallet,
  Coffee, CreditCard, CheckCircle2, ChevronRight, X, ShieldCheck, UserMinus,
  AlertCircle, TrendingUp, RefreshCcw, Lock, Unlock, Percent, Banknote, Map, Package, LogOut, ShoppingBag
} from "lucide-react";
import { db, type Employee } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { clearSession } from "@/lib/auth";

// ─── أنواع ───────────────────────────────────────────────────
type TabType = "النظرة العامة" | "الهيكل التنظيمي والموظفين" | "إعدادات الصلاحيات" | "اعتماد المشتريات والتوريد" | "قائمة الطعام والوجبات (Menu)" | "إدارة المخازن والمواد الخام";

const BRANCHES = ["فرع وسط البلاد", "فرع الحدائق", "فرع فينيسيا"];
const ROLES = ["كاشير", "مدير فرع", "محاسب / خزينة", "أمين مخزن", "مساعد شيف"];



export default function CEODashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("الهيكل التنظيمي والموظفين");

  // قراءة الموظفين من Dexie — تحديث تلقائي لجميع التبويبات
  const employees = useLiveQuery(() => db.employees.toArray()) ?? [];

  const [isAdding, setIsAdding] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  // ── اعتماد المشتريات: بيانات حقيقية من db.invoices (يُسجّلها أمين المخزن) ──
  const pendingInvoices = useLiveQuery(() => db.invoices.where('status').equals('قيد المراجعة').toArray()) ?? [];
  const allInventoryItems = useLiveQuery(() => db.inventory.toArray()) ?? [];
  const pendingPurchaseRequests = useLiveQuery(() =>
    db.purchaseRequests.filter((r) => r.status === "معلق").toArray()
  ) ?? [];

  const defaultBranchesControl = [
    { id: "B1", name: "فرع وسط البلاد", active: true },
    { id: "B2", name: "فرع الحدائق", active: true },
    { id: "B3", name: "فرع فينيسيا", active: false },
  ];

  const dbSettings = useLiveQuery(() => db.settings.get("system_settings"));
  const branchesControl = dbSettings?.branchesControl || defaultBranchesControl;
  const systemSettings = dbSettings || { deliveryFee: 10, taxRate: 0, hospitalityLimit: 150 };

  const updateSettings = async (updates: any) => {
    const oldSettings = await db.settings.get("system_settings") || { 
      id: "system_settings", 
      deliveryFee: 10, 
      taxRate: 0, 
      hospitalityLimit: 150, 
      branchesControl: defaultBranchesControl 
    };
    await db.settings.put({ ...oldSettings, ...updates });
  };

  const [successMsg, setSuccessMsg] = useState("");

  // تأسيس قاعدة البيانات الأولية عبر seedDatabase المركزي
  useEffect(() => {
    import('@/lib/db').then(({ seedDatabase }) => seedDatabase().catch(console.error));
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const handleCreateEmployee = async (emp: Omit<Employee, "id">) => {
    const newId = `EMP-${Math.floor(Math.random() * 900) + 100}`;
    await db.employees.add({ ...emp, id: newId, createdAt: new Date().toISOString() } as Employee);
    setIsAdding(false);
    showSuccess("تم إضافة الموظف ومنحه الصلاحيات بنجاح!");
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف وإلغاء حساب هذا الموظف وملفه نهائياً؟")) return;
    await db.employees.delete(id);
    setSelectedEmp(null);
    showSuccess("تم حذف ملف الموظف من النظام.");
  };

  return (
    <div className="flex h-screen bg-[#f8f9fd] text-gray-900 font-sans" dir="rtl">

      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 z-50 bg-[#ff6b00] text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-orange-500/20 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar القائمة الجانبية */}
      <aside className="w-72 bg-white border-l border-gray-100 flex flex-col shrink-0 z-20">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#ff6b00] to-[#ff985c] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 relative overflow-hidden">
            <Shield className="w-6 h-6 text-gray-900 relative z-10" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-screen"></div>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">منصة CEO</h1>
            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mt-1"><ShieldCheck className="w-3 h-3 inline pb-0.5" /> تحكم إداري كامل</p>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-2 mt-4">
          <p className="text-[10px] font-extrabold text-gray-500 mb-4 px-3 tracking-widest uppercase">غرفة العمليات</p>

          {[
            { id: "الهيكل التنظيمي والموظفين", icon: Users },
            { id: "قائمة الطعام والوجبات (Menu)", icon: Coffee },
            { id: "إدارة المخازن والمواد الخام", icon: Package },
            { id: "اعتماد المشتريات والتوريد", icon: FileBadge },
            { id: "النظرة العامة", icon: Activity },
            { id: "إعدادات الصلاحيات", icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const badge = tab.id === "اعتماد المشتريات والتوريد" && (pendingInvoices.length + pendingPurchaseRequests.length) > 0
              ? pendingInvoices.length + pendingPurchaseRequests.length : 0;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm relative ${isActive ? "bg-orange-500/10 text-orange-400 shadow-sm border border-orange-500/20" : "text-gray-400 hover:bg-gray-50 hover:text-gray-200"
                  }`}>
                <Icon className={`w-5 h-5 ${isActive ? "text-orange-400" : "text-gray-500"}`} />
                <span>{tab.id}</span>
                {badge > 0 && (
                  <span className="mr-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{badge}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* زر تسجيل الخروج */}
        <div className="p-4 border-t border-gray-100 shrink-0">
          <button
            onClick={() => { clearSession(); window.location.href = "/"; }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-bold text-sm border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* المحتوى */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-blend-overlay bg-[#f8f9fd]/95">
        <header className="h-20 border-b border-gray-100 shrink-0 flex items-center px-8 justify-between relative overflow-hidden">
          <h2 className="text-2xl font-extrabold text-gray-900 relative z-10">{activeTab}</h2>
          <div className="flex items-center gap-3 relative z-10">
            <div className="text-left bg-gray-900/50 px-4 py-2 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-400">Chief Executive Officer</p>
              <p className="text-sm font-extrabold text-gray-900">المدير العام</p>
            </div>
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="CEO" className="w-12 h-12 rounded-full border-2 border-orange-500 shadow-lg shadow-orange-500/20" />
            <button
              onClick={() => { clearSession(); window.location.href = "/"; }}
              title="تسجيل الخروج"
              className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 flex items-center justify-center transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {activeTab === "الهيكل التنظيمي والموظفين" && !isAdding && !selectedEmp && (
              <EmployeesDirectoryView
                employees={employees}
                onAddClick={() => setIsAdding(true)}
                onEmpClick={setSelectedEmp}
              />
            )}

            {activeTab === "الهيكل التنظيمي والموظفين" && isAdding && (
              <AddEmployeeForm
                onCancel={() => setIsAdding(false)}
                onSubmit={handleCreateEmployee}
              />
            )}

            {activeTab === "الهيكل التنظيمي والموظفين" && selectedEmp && !isAdding && (
              <EmployeeReceiptDetails
                employee={selectedEmp}
                onClose={() => setSelectedEmp(null)}
                onDelete={() => handleDeleteEmployee(selectedEmp.id)}
                onUpdate={(updated: any) => setSelectedEmp(updated)}
              />
            )}
            {activeTab === "اعتماد المشتريات والتوريد" && (
              <div className="space-y-8">
                {/* --- طلبات شراء أمين المخزن --- */}
                <PurchaseRequestsApprovalView showSuccess={showSuccess} />

                {/* --- فواتير التوريد القديمة --- */}
                <PurchasesApprovalView
                  invoices={pendingInvoices}
                  inventory={allInventoryItems}
                  onApprove={async (id: string) => {
                    const inv = await db.invoices.get(id);
                    if (!inv) return;
                    const item = await db.inventory.get(inv.itemId);
                    if (item) {
                      const newTotalValue = (item.qty * item.avgPrice) + (inv.qty * inv.unitPrice);
                      const newQty = item.qty + inv.qty;
                      const newAvg = newQty > 0 ? newTotalValue / newQty : inv.unitPrice;
                      await db.inventory.update(inv.itemId, { qty: newQty, avgPrice: newAvg });
                    }
                    await db.invoices.update(id, { status: "معتمدة" });
                    showSuccess(`✅ تم اعتماد الفاتورة [${id}] وتحديث المخزون والمتوسط المرجح.`);
                  }}
                />
              </div>
            )}

            {activeTab === "النظرة العامة" && (
              <GlobalCommandCenterView branchesControl={branchesControl} pendingInvoicesCount={pendingInvoices.length} />
            )}

            {activeTab === "إعدادات الصلاحيات" && (
              <SystemControlSettingsView
                settings={systemSettings}
                updateSettings={updateSettings}
                branchesControl={branchesControl}
                toggleBranch={async (id: string) => {
                  const newBranches = branchesControl.map(b => b.id === id ? { ...b, active: !b.active } : b);
                  await updateSettings({ branchesControl: newBranches });
                }}
                showSuccess={showSuccess}
              />
            )}

            {activeTab === "قائمة الطعام والوجبات (Menu)" && (
              <MenuItemsManagementView showSuccess={showSuccess} />
            )}

            {activeTab === "إدارة المخازن والمواد الخام" && (
              <InventoryManagementView showSuccess={showSuccess} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── شاشة الإعدادات المتقدمة وصلاحية النظام ──────────────────
function SystemControlSettingsView({ settings, updateSettings, branchesControl, toggleBranch, showSuccess }: any) {
  const update = (f: string, v: any) => updateSettings({ [f]: v });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-xl">
        <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2"><Settings className="w-6 h-6 text-orange-400" /> الإعدادات المتقدمة وضوابط النظام والتشغيل</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 1. نظام إيقاف وتشغيل الفروع */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 top-0 opacity-5"><Building className="w-40 h-40" /></div>
          <h4 className="text-sm font-extrabold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3 relative z-10">إدارة التشغيل المركزية للفروع (الربط المباشر)</h4>

          <div className="space-y-4 relative z-10">
            {branchesControl.map((b: any) => (
              <div key={b.id} className="flex justify-between items-center p-4 rounded-xl border border-gray-100 bg-[#f8f9fd]">
                <div>
                  <h5 className="font-bold text-gray-200">{b.name}</h5>
                  <p className="text-[10px] text-gray-500 font-bold mt-1">حالة نظام الـ POS في الفرع: <span className={b.active ? 'text-emerald-400' : 'text-red-400'}>{b.active ? 'متصل وحي' : 'مُجمد ومقفول مركزياً'}</span></p>
                </div>
                <button onClick={() => {
                  toggleBranch(b.id);
                  showSuccess(b.active ? `تم تجميد نظام نقاط البيع في ${b.name}!` : `تم إعادة تفعيل سيستم الفرع ${b.name}`);
                }}
                  className={`flex items-center gap-2 px-4 py-2 font-bold text-xs rounded-xl transition ${b.active ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-gray-900' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-gray-900'}`}>
                  {b.active ? <><Lock className="w-4 h-4" /> إيقاف مؤقت للفرع</> : <><Unlock className="w-4 h-4" /> تشغيل السيستم والمطعم</>}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 2. تسعيرات وأرقام ثابتة مركزية */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-2xl">
          <h4 className="text-sm font-extrabold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3"><Settings className="w-4 h-4 text-orange-400" /> قواعد التجارة الثابتة (تطبع لكل الفروع)</h4>
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2 flex items-center gap-1"><Map className="w-3 h-3" /> تسعيرة خدمة التوصيل الموحدة (د.ل)</label>
              <input type="number" value={settings.deliveryFee} onChange={e => update('deliveryFee', Number(e.target.value))} className="w-full bg-[#f8f9fd] border border-gray-100 rounded-xl px-4 py-3 outline-none font-mono text-gray-200 font-bold" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2 flex items-center gap-1"><Percent className="w-3 h-3" /> ضريبة القيمة المضافة / الخدمات (%)</label>
              <input type="number" value={settings.taxRate} onChange={e => update('taxRate', Number(e.target.value))} className="w-full bg-[#f8f9fd] border border-gray-100 rounded-xl px-4 py-3 outline-none font-mono text-gray-200 font-bold" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2 flex items-center gap-1"><Coffee className="w-3 h-3" /> سقف مسموحات ضيافة مدير الفرع (د.ل لكل وردية)</label>
              <input type="number" value={settings.hospitalityLimit} onChange={e => update('hospitalityLimit', Number(e.target.value))} className="w-full bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3 outline-none font-mono text-orange-300 font-bold" />
              <p className="text-[10px] font-bold text-gray-500 mt-2">مدير الفرع لن يتمكن من إخراج ضيافة تفوق هذا الرقم للوردية الواحدة.</p>
            </div>
            <button onClick={() => showSuccess("تم اعتماد الأسعار الثابتة وأُرسلت لجميع كاشيرية الفروع.")} className="w-full bg-orange-600 hover:bg-orange-500 text-gray-900 font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2">
              <RefreshCcw className="w-4 h-4" /> تحديث ومزامنة الشبكة بالكامل
            </button>
          </div>
        </div>
      </div>
      {/* 3. الإعدادات شديدة الحساسية */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 shadow-2xl">
        <h4 className="text-sm font-extrabold text-red-500 mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> منطقة الخطر (صلاحية مالك النظام فقط)</h4>
        <p className="text-xs text-gray-400 font-bold mb-6">هذه الإجراءات تؤثر بشكل فوري وحاسم ولا رجوع فيها.</p>
        <button onClick={() => { if (confirm("مستحيل الاسترجاع! هل تود تفريغ الخزائن وبدء داتا مالية جديدة؟")) showSuccess("تم تصفير الدفاتر."); }} className="bg-red-600 hover:bg-red-500 text-gray-900 font-bold px-6 py-3 rounded-xl transition text-sm flex items-center gap-2 shadow-lg shadow-red-600/20">
          <Banknote className="w-4 h-4" /> إغلاق يوميات المطعم وتصفير صناديق السيولة المركزية للبدء من جديد
        </button>
      </div>
    </div>
  );
}

// ─── شاشة الكوماند سنتر والنظرة العامة ───────────────────────
function GlobalCommandCenterView({ branchesControl, pendingInvoicesCount }: { branchesControl: any[]; pendingInvoicesCount: number }) {
  // استعلام لحظي من Dexie
  const orders = useLiveQuery(() => db.orders.toArray()) ?? [];
  const empCount = useLiveQuery(() => db.employees.count()) ?? 0;
  const lowStock = useLiveQuery(() =>
    db.inventory.filter(i => i.qty <= i.min).toArray()
  ) ?? [];

  const globalRev = orders.reduce((acc, o) => acc + (o.totalAmount ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* المؤشرات الرئيسية للحظة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-emerald-500/30 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-110 transition duration-500"><TrendingUp className="w-24 h-24 text-emerald-500" /></div>
          <h4 className="text-[11px] font-extrabold tracking-widest uppercase text-emerald-400/80 mb-2">إجمالي المبيعات (لحظي من DB)</h4>
          <p className="text-4xl font-mono font-black text-gray-900">{globalRev.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-sm text-emerald-500">د.ل</span></p>
        </div>
        <div className="bg-white border border-orange-500/30 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-110 transition duration-500"><Wallet className="w-24 h-24 text-orange-500" /></div>
          <h4 className="text-[11px] font-extrabold tracking-widest uppercase text-orange-400/80 mb-2">عدد الطلبات الكلي</h4>
          <p className="text-4xl font-mono font-black text-gray-900">{orders.length} <span className="text-sm text-orange-500">طلب</span></p>
        </div>
        <div className="bg-white border border-orange-500/30 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-110 transition duration-500"><Users className="w-24 h-24 text-orange-500" /></div>
          <h4 className="text-[11px] font-extrabold tracking-widest uppercase text-orange-400/80 mb-2">مجموع الموظفين في النظام</h4>
          <p className="text-4xl font-mono font-black text-gray-900">{empCount} <span className="text-sm text-orange-500">موظف</span></p>
        </div>
        <div className="bg-white border-l-4 border-red-500 border-gray-100 p-6 rounded-3xl shadow-lg flex flex-col justify-center">
          <h4 className="text-[11px] font-extrabold tracking-widest uppercase text-red-500 mb-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> أصناف تحت الحد الأدنى</h4>
          <p className="text-sm font-bold text-gray-600">يوجد <span className="text-red-400 font-extrabold text-xl">{lowStock.length}</span> صنف بحاجة توريد عاجل.</p>
          {pendingInvoicesCount > 0 && (
            <p className="text-[10px] font-bold text-amber-400 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {pendingInvoicesCount} فاتورة تنتظر اعتمادك
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* رادار أداء الفروع */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-2xl">
          <h3 className="text-lg font-extrabold text-gray-900 mb-6 flex items-center gap-2"><Building className="w-5 h-5 text-orange-400" /> رادار أداء ونبض الفروع</h3>
          <div className="space-y-4">
            {branchesControl.map((b: any) => (
              <div key={b.id} className={`p-5 rounded-2xl border flex items-center justify-between transition ${b.active ? 'bg-orange-500/5 border-orange-500/20' : 'bg-red-500/5 border-red-500/20 opacity-70'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${b.active ? 'bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse' : 'bg-red-500'}`}></div>
                  <div>
                    <h4 className="text-base font-extrabold text-gray-900 mb-0.5">{b.name}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">{b.active ? 'متصل وحي - يستقبل الـ POS الطلبات' : 'مغلق ومُجمد إلكترونياً'}</p>
                  </div>
                </div>
                <div className="flex gap-6 items-center text-left">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold">المبيعات (لحظي)</p>
                    <p className="font-mono font-extrabold text-emerald-400">
                      {orders.filter((o: any) => o.branchId === b.id).reduce((a: any, o: any) => a + (o.totalAmount ?? 0), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} د.ل
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold">عدد الطلبات</p>
                    <p className="font-mono font-extrabold text-orange-400">{orders.filter((o: any) => o.branchId === b.id).length}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* إنذارات المخزن — بيانات حقيقية من db.inventory */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-2xl flex flex-col">
          <h3 className="text-lg font-extrabold text-gray-900 mb-6 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-orange-400" /> إنذار نواقص المستودع (Live)</h3>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-60">
            {lowStock.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mb-3" />
                <p className="text-gray-500 font-bold text-sm">لا توجد نواقص حرجة في المستودع.</p>
              </div>
            ) : (
              lowStock.map((item: any, i: number) => {
                const pct = Math.round((item.qty / item.min) * 100);
                const isCritical = pct <= 50;
                return (
                  <div key={item.id} className={`${isCritical ? 'bg-red-500/10 border-red-500/20' : 'bg-orange-500/10 border-orange-500/20'} border rounded-xl p-4 flex gap-3 items-start`}>
                    <div className="mt-1"><AlertCircle className={`w-4 h-4 ${isCritical ? 'text-red-400' : 'text-orange-400'}`} /></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h5 className={`font-bold text-xs ${isCritical ? 'text-red-400' : 'text-orange-400'}`}>{item.name}</h5>
                        <span className="text-[10px] font-mono bg-gray-800 px-2 py-0.5 rounded text-gray-400">{item.category}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                        المتبقي: <strong className="text-gray-900">{item.qty} {item.unit}</strong> من أصل <strong className="text-gray-600">{item.min}</strong> حد أدنى مطلوب ({pct}%)
                      </p>
                      <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isCritical ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <button className="w-full bg-gray-50 hover:bg-[#2A3757] text-gray-900 font-bold text-xs py-3 rounded-lg transition">
              استدعاء مدير المستودعات فوراً
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── شاشة تأكيد المشتريات والتوريد للـ CEO — مربوطة بـ db.invoices ──
function PurchasesApprovalView({ invoices, inventory, onApprove }: {
  invoices: any[];
  inventory: any[];
  onApprove: (id: string) => Promise<void>;
}) {
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    await onApprove(id);
    setLoadingId(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-xl">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900">اعتماد وتأكيد المشتريات والتوريد</h3>
          <p className="text-sm text-gray-400 font-medium mt-1">فواتير مُسجَّلة من أمين المخزن — تحتاج موافقة المدير العام لتُدمج في المخزون.</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> فواتير معلّقة: {invoices.length}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-extrabold text-gray-900">سجل فواتير التوريد المعلقة للموافقة</h3>
        </div>

        {invoices.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500/50 mb-4" />
            <p className="text-gray-400 font-bold">لا توجد فواتير معلقة لاعتمادها. تمت مراجعة جميع المشتريات.</p>
          </div>
        ) : (
          <table className="w-full text-right border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400">
              <tr>
                <th className="px-6 py-4 text-xs font-bold w-24">رقم الفاتورة</th>
                <th className="px-6 py-4 text-xs font-bold">المورد والمادة المُوردة</th>
                <th className="px-6 py-4 text-xs font-bold text-center">الكمية / السعر</th>
                <th className="px-6 py-4 text-xs font-bold text-center text-orange-400">الإجمالي المالي (د.ل)</th>
                <th className="px-6 py-4 text-xs font-bold text-center w-40">القرار الإداري</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {invoices.map((inv: any) => {
                const invItem = inventory.find((i: any) => i.id === inv.itemId);
                const total = inv.qty * inv.unitPrice;
                const isLoading = loadingId === inv.id;
                return (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-6 text-xs font-mono font-bold text-orange-400">{inv.id}</td>
                    <td className="px-6 py-6 text-sm font-extrabold text-gray-900">
                      {inv.supplier}
                      <p className="text-[10px] text-gray-500 font-bold mt-1">الصنف: ({invItem?.name ?? `#${inv.itemId}`})</p>
                      <p className="text-[10px] text-gray-600 font-bold">{inv.date}</p>
                    </td>
                    <td className="px-6 py-6 text-sm font-mono font-bold text-center text-gray-600">
                      {inv.qty} <span className="text-[10px] text-gray-500 font-sans">{invItem?.unit ?? 'وحدة'}</span>
                      <p className="text-[10px] text-gray-500 font-sans mt-1">× {inv.unitPrice.toFixed(2)} د.ل للوحدة</p>
                    </td>
                    <td className="px-6 py-6 text-base font-mono font-extrabold text-center text-orange-400">
                      {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-6 text-center">
                      <button
                        onClick={() => handleApprove(String(inv.id))}
                        disabled={isLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-gray-900 font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 w-full"
                      >
                        {isLoading ? (
                          <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <><ShieldCheck className="w-4 h-4" /> اعتماد وصرف</>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── 1. شاشة استعراض الموظفين والفروع ────────────────────────
function EmployeesDirectoryView({ employees, onAddClick, onEmpClick }: any) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-xl">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900">الكادر الوظيفي والهيكل</h3>
          <p className="text-sm text-gray-400 font-medium mt-1">إجمالي الموظفين المسجلين حالياً: <strong className="text-orange-400">{employees.length}</strong> موظف.</p>
        </div>
        <button onClick={onAddClick} className="bg-orange-600 hover:bg-orange-500 text-gray-900 px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 transition shadow-lg shadow-orange-600/20">
          <UserPlus className="w-5 h-5" /> بناء حساب موظف جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((emp: Employee) => (
          <div key={emp.id} onClick={() => onEmpClick(emp)} className="bg-white border border-gray-100 hover:border-orange-500/50 rounded-3xl p-6 cursor-pointer transition relative overflow-hidden group hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition group-hover:opacity-10 group-hover:scale-110">
              <ShieldCheck className="w-24 h-24" />
            </div>

            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 bg-gray-800 rounded-2xl shrink-0 flex items-center justify-center overflow-hidden border border-gray-200 relative">
                {emp.avatar ? <img src={emp.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <Users className="w-8 h-8 text-gray-500" />}
              </div>
              <div className="flex-1 w-full truncate">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-extrabold text-gray-900 text-lg truncate flex-1">{emp.name}</h4>
                  <span className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded ml-2 whitespace-nowrap">{emp.id}</span>
                </div>
                <p className="text-xs text-emerald-400 font-bold bg-emerald-500/10 inline-block px-2 py-1 rounded-md">{emp.role}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <p className="text-xs text-gray-400 flex items-center gap-2"><Building className="w-3.5 h-3.5 text-gray-500" /> الفرع التابع له: <strong className="text-gray-200">{emp.branch}</strong></p>
              <p className="text-xs text-gray-400 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-500" /> رقم الاتصال: <strong className="text-gray-200">{emp.phone}</strong></p>
            </div>

            <div className="mt-5 pt-5 border-t border-gray-100 flex justify-between items-center text-sm font-bold text-gray-500 group-hover:text-orange-400 transition">
              <span>عرض الكشف والإيصال المفصل</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2. شاشة إضافة الموظف (الاستمارة) ───────────────────────
function AddEmployeeForm({ onCancel, onSubmit }: any) {
  const [formData, setFormData] = useState({
    name: "", phone: "", dob: "", branch: BRANCHES[0], role: "", accessLevel: "", pin: "",
    baseSalary: 0, deductHalfDay: 0, deductFullDay: 0,
    mealsEnabled: false, mealsLimit: 0, cashWithdrawEnabled: false, cashWithdrawLimit: 0,
    totalAdvance: 0, monthlyAdvanceCut: 0
  });

  const [avatarUrl, setAvatarUrl] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false); // هل يحتاج الموظف للدخول للنظام (كاشير/مدير)؟

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'doc') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'avatar') setIsUploadingAvatar(true);
    else setIsUploadingDoc(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("https://api.imgbb.com/1/upload?key=212f753d3cf173e43b7b9def547f7c9c", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        if (type === 'avatar') setAvatarUrl(data.data.url);
        else setDocUrl(data.data.url);
      } else {
        alert("فشل الرفع: " + data.error.message);
      }
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء رفع الصورة. تأكد من اتصالك بالإنترنت.");
    } finally {
      if (type === 'avatar') setIsUploadingAvatar(false);
      else setIsUploadingDoc(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role) return;
    if (needsLogin) {
      if (!formData.accessLevel) {
        alert("الرجاء اختيار 'نوع الواجهة' التي سيُسمح للموظف بالدخول إليها.");
        return;
      }
      if (!formData.pin) {
        alert("الرجاء إدخال رقم سري (PIN) للدخول إلى النظام.");
        return;
      }
    }

    onSubmit({
      ...formData,
      accessLevel: needsLogin ? formData.accessLevel : "", // تصفير لوحة الدخول إذا لم يتم تفعيل الدخول
      pin: needsLogin ? formData.pin : "",
      avatar: avatarUrl || "https://i.pravatar.cc/150?img=44",
      documentId: docUrl || "passport_scan.png"
    });
  };

  const update = (field: string, value: any) => setFormData(p => ({ ...p, [field]: value }));

  return (
    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2 mb-1"><UserPlus className="w-6 h-6 text-orange-400" /> استمارة تعيين وتخصيص موظف جديد</h3>
          <p className="text-sm text-gray-400 font-medium">بناء هوية الموظف في النظام الخاص بالمطعم ومنحه الصلاحيات المحاسبية وسقوفه المالية.</p>
        </div>
        <button onClick={onCancel} className="w-10 h-10 bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-full flex items-center justify-center transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-12">
        {/* قسم 1: البيانات الشخصية والمرفقات */}
        <div>
          <h4 className="text-base font-extrabold text-orange-400 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
            <span className="bg-orange-500/20 w-8 h-8 flex items-center justify-center rounded-lg text-orange-300">1</span>
            البيانات الشخصية والثبوتية
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">اسم الموظف الرباعي</label>
              <input type="text" value={formData.name} onChange={e => update('name', e.target.value)} required placeholder="إدخال الاسم..." className="w-full bg-[#f8f9fd] border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-bold text-gray-900" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">رقم الهاتف (للتواصل السريع)</label>
              <input type="tel" value={formData.phone} onChange={e => update('phone', e.target.value)} required placeholder="09X XXX XXXX" className="w-full bg-[#f8f9fd] border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-bold text-gray-900" dir="ltr" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">تاريخ الميلاد</label>
              <input type="date" value={formData.dob} onChange={e => update('dob', e.target.value)} required className="w-full bg-[#f8f9fd] border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-bold text-gray-900" />
            </div>
          </div>

          {/* المرفقات الحقيقية عبر ImgBB */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className={`relative overflow-hidden w-full py-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 transition font-bold text-sm ${avatarUrl ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-gray-200 bg-[#f8f9fd] text-gray-500 hover:border-orange-400'}`}>
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'avatar')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isUploadingAvatar} title="اختر الصورة الشخصية" />
              {isUploadingAvatar ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent"></div> جاري رفع الصورة...</>
              ) : avatarUrl ? (
                <><CheckCircle2 className="w-5 h-5" /> تم رفع وتأكيد الصورة الشخصية بنجاح</>
              ) : (
                <><ImageIcon className="w-5 h-5 text-orange-400" /> إرفاق صورة شخصية للموظف (حقيقي)</>
              )}
            </div>
            
            <div className={`relative overflow-hidden w-full py-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 transition font-bold text-sm ${docUrl ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-gray-200 bg-[#f8f9fd] text-gray-500 hover:border-orange-400'}`}>
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'doc')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isUploadingDoc} title="اختر مستند الهوية" />
              {isUploadingDoc ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent"></div> جاري رفع المستند...</>
              ) : docUrl ? (
                <><CheckCircle2 className="w-5 h-5" /> تم رفع صورة الهوية / الجواز بنجاح</>
              ) : (
                <><FileBadge className="w-5 h-5 text-orange-400" /> تصوير وإرفاق مستند الهوية (حقيقي)</>
              )}
            </div>
          </div>
        </div>

        {/* قسم 2: الصلاحية وإدارة الحساب */}
        <div>
          <h4 className="text-base font-extrabold text-orange-400 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
            <span className="bg-orange-500/20 w-8 h-8 flex items-center justify-center rounded-lg text-orange-300">2</span>
            الصلاحية وتوجيه الفرع
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">الدور / المسمى الوظيفي</label>
              <select value={formData.role} onChange={e => update('role', e.target.value)} required className="w-full bg-[#f8f9fd] border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-bold text-gray-900">
                <option value="">-- اختيار المسمى الوظيفي --</option>
                <option value="كاشير">كاشير</option>
                <option value="مدير فرع">مدير فرع</option>
                <option value="أمين مخزن">أمين مخزن</option>
                <option value="محاسب">محاسب</option>
                <option value="شيف">شيف</option>
                <option value="عامل نظافة">عامل نظافة</option>
                <option value="سائق توصيل">سائق توصيل</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">توجيه إلى فرع</label>
              <select value={formData.branch} onChange={e => update('branch', e.target.value)} className="w-full bg-[#f8f9fd] border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-bold text-gray-900">
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex flex-col justify-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={needsLogin} onChange={e => setNeedsLogin(e.target.checked)} className="w-5 h-5 accent-orange-500" />
                <span className="text-sm font-bold text-orange-300">هذه الوظيفة تتطلب تسجيل الدخول للنظام (كاشير، إدارة)</span>
              </label>
            </div>

            {/* إدخال كلمة المرور ونوع الواجهة يظهر فقط إذا اختار الـ CEO تفعيله */}
            {needsLogin && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="md:col-span-3 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                  <div>
                    <label className="text-xs font-bold text-orange-400 block mb-2">تحديد الواجهة التي يعمل عليها (System Access)</label>
                    <select value={formData.accessLevel} onChange={e => update('accessLevel', e.target.value)} required={needsLogin} className="w-full bg-[#f8f9fd] border border-orange-500/50 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-bold text-gray-900">
                      <option value="">-- اختار نوع لوحة التحكم الخاصة به --</option>
                      <option value="كاشير">واجهة الكاشير (POS)</option>
                      <option value="مدير فرع">لوحة تحكم مدير الفرع (Dashboard)</option>
                      <option value="أمين مخزن">لوحة أمين المخزن المركزية</option>
                      <option value="محاسب">إدارة الخزينة والمحاسبة</option>
                      <option value="مدير عام">الإدارة العليا (CEO)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-orange-400 block mb-2 flex items-center gap-1"><Shield className="w-3 h-3" /> تعيين كلمة مرور وبطاقة الدخول (PIN)</label>
                    <input type="text" value={formData.pin} onChange={e => update('pin', e.target.value)} required={needsLogin} placeholder="رمز سري للدخول..." className="w-full bg-orange-500/10 border border-orange-500/50 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-mono tracking-widest text-orange-300" />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* قسم 3: الخطة المالية والراتب والسقوف */}
        <div>
          <h4 className="text-base font-extrabold text-orange-400 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
            <span className="bg-orange-500/20 w-8 h-8 flex items-center justify-center rounded-lg text-orange-300">3</span>
            البناء المحاسبي (الرواتب، السقف، الديون)
          </h4>

          <div className="bg-[#f8f9fd] border border-gray-100 rounded-2xl p-6 mb-8">
            <h5 className="text-sm font-bold text-emerald-400 mb-4 pb-2 border-b border-gray-100">قيمة الدخل والحسم الأساسي (تلقائي الحساب كل شهر)</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-2">قيمة الراتب الأساسي الإجمالي</label>
                <div className="relative">
                  <input type="number" min="0" value={formData.baseSalary === 0 ? "" : formData.baseSalary} onChange={e => update('baseSalary', Number(e.target.value))} required placeholder="0" className="w-full bg-white border border-gray-200 focus:border-emerald-500 rounded-xl pl-12 pr-4 py-3 outline-none font-mono text-lg text-gray-900" />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">د.ل</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-red-400 block mb-2">إعداد الغرامة: خصم توقيع (نصف يوم)</label>
                <input type="number" min="0" value={formData.deductHalfDay === 0 ? "" : formData.deductHalfDay} onChange={e => update('deductHalfDay', Number(e.target.value))} required placeholder="0" className="w-full bg-red-500/5 border border-red-900/50 focus:border-red-500 rounded-xl px-4 py-3 outline-none font-mono text-red-300" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-red-400 block mb-2">إعداد الغرامة: خصم توقيع (غياب يوم)</label>
                <input type="number" min="0" value={formData.deductFullDay === 0 ? "" : formData.deductFullDay} onChange={e => update('deductFullDay', Number(e.target.value))} required placeholder="0" className="w-full bg-red-500/5 border border-red-900/50 focus:border-red-500 rounded-xl px-4 py-3 outline-none font-mono text-red-300" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* الامتيازات التموينية (الوجبات) */}
            <div className="bg-[#f8f9fd] border border-gray-100 rounded-2xl p-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                <h5 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Coffee className="w-4 h-4 text-orange-400" /> سحب الوجبات وإطعام الموظف</h5>
                <button type="button" onClick={() => update('mealsEnabled', !formData.mealsEnabled)} className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold transition ${formData.mealsEnabled ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-gray-800 text-gray-500'}`}>
                  {formData.mealsEnabled ? 'مفعل (يعمل)' : 'إيقاف الصلاحية'}
                </button>
              </div>
              <div className={formData.mealsEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}>
                <label className="text-xs font-bold text-gray-400 block mb-2">تحديد السقف الأعلى للصرف الشهري (د.ل)</label>
                <input type="number" value={formData.mealsLimit === 0 ? "" : formData.mealsLimit} onChange={e => update('mealsLimit', Number(e.target.value))} placeholder="قيمة السقف المسموح" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none font-mono text-gray-200" />
                <p className="text-[9px] text-gray-500 mt-2 font-bold leading-relaxed">أي مبلغ وجبات يستهلكه الموظف ضمن هذا السقف يعتبر (على حساب المطعم). أي تجاوز لهذا السقف يُعد (دين آجل) يُحتفظ به.</p>
              </div>
            </div>

            {/* الامتيازات المالية (السحب النقدي) */}
            <div className="bg-[#f8f9fd] border border-gray-100 rounded-2xl p-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                <h5 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-400" /> صرف سحب نقدي (مصروف جيب)</h5>
                <button type="button" onClick={() => update('cashWithdrawEnabled', !formData.cashWithdrawEnabled)} className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold transition ${formData.cashWithdrawEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-gray-800 text-gray-500'}`}>
                  {formData.cashWithdrawEnabled ? 'مفعل (يعمل)' : 'إيقاف الصلاحية'}
                </button>
              </div>
              <div className={formData.cashWithdrawEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}>
                <label className="text-xs font-bold text-gray-400 block mb-2">تحديد السقف النقدي المسموح شهرياً (د.ل)</label>
                <input type="number" value={formData.cashWithdrawLimit === 0 ? "" : formData.cashWithdrawLimit} onChange={e => update('cashWithdrawLimit', Number(e.target.value))} placeholder="قيمة السقف المستقطع النقدي المسموح" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none font-mono text-gray-200" />
                <p className="text-[9px] text-gray-500 mt-2 font-bold leading-relaxed">بمجرد تفعيله، سيتمكن الموظف من طلب سحب نقدي لا يتجاوز مبلغه هذا السقف، وسيتم خصم المسحوبات (في نهاية الشهر) من راتبه الأساسي مباشرة تلقائياً.</p>
              </div>
            </div>
          </div>

          {/* نظام السلفة والديون */}
          <div className="bg-orange-900/10 border border-orange-500/20 rounded-2xl p-6">
            <h5 className="text-sm font-bold text-orange-300 mb-4 pb-2 border-b border-orange-900/50 flex items-center gap-2"><CreditCard className="w-4 h-4" /> سلفة الموظف (تأسيس دين مؤجل إن وجد)</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-orange-200 block mb-2">إجمالي قيمة السلفة المطلوبة/الحالية (د.ل)</label>
                <input type="number" value={formData.totalAdvance === 0 ? "" : formData.totalAdvance} onChange={e => update('totalAdvance', Number(e.target.value))} placeholder="قيمة الدين الكامل" className="w-full bg-[#f8f9fd] border border-orange-500/30 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-mono text-orange-300" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-pink-300 block mb-2">القسط القابل للخصم الشهري تلقائياً (د.ل)</label>
                <input type="number" value={formData.monthlyAdvanceCut === 0 ? "" : formData.monthlyAdvanceCut} onChange={e => update('monthlyAdvanceCut', Number(e.target.value))} placeholder="قيمة الاستقطاع في تسوية رواتب كل شهر" className="w-full bg-[#f8f9fd] border border-pink-500/30 focus:border-pink-500 rounded-xl px-4 py-3 outline-none font-mono text-pink-300" />
              </div>
            </div>
            {formData.totalAdvance > 0 && formData.monthlyAdvanceCut > 0 && (
              <p className="text-[10px] font-bold text-orange-400 mt-4 bg-orange-500/10 p-3 rounded-lg border border-orange-500/20">
                سيتم خصم مبلغ ( {formData.monthlyAdvanceCut} د.ل ) تلقائياً في نهاية كل شهر ضمن جدول الرواتب لمدة تقريبية تبلغ {Math.ceil(formData.totalAdvance / formData.monthlyAdvanceCut)} أشهر لسداد سلفة بقيمة ( {formData.totalAdvance} د.ل ).
              </p>
            )}
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 flex justify-end gap-4">
          <button type="button" onClick={onCancel} className="px-8 py-4 font-bold text-gray-400 hover:text-gray-900 transition">إلغاء التعيين</button>
          <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-gray-900 px-12 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-orange-600/30 transition">
            حفظ وإنشاء السجل الوظيفي للموظف
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── 3. الإيصال التفصيلي وكشف راتب الموظف ─────────────────────
function EmployeeReceiptDetails({ employee, onClose, onDelete, onUpdate }: any) {
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [monthlyCut, setMonthlyCut] = useState(employee.monthlyAdvanceCut?.toString() || "");

  const handleGrantAdvance = async () => {
    if (!advanceAmount || !monthlyCut) return;
    const advVal = Number(advanceAmount);
    const cutVal = Number(monthlyCut);
    if (advVal <= 0 || cutVal <= 0) {
      alert("الرجاء إدخال قيم صحيحة وموجبة للسلفة وقسط الاستقطاع.");
      return;
    }

    const newTotal = employee.totalAdvance + advVal;
    
    // تحديث بيانات الموظف في قاعدة البيانات
    await db.employees.update(employee.id, {
      totalAdvance: newTotal,
      monthlyAdvanceCut: cutVal
    });

    // تسجيل السلفة كصادر في الخزينة
    await db.treasuryOutgoing.add({
      type: "مسحوبات شخصية",
      amount: advVal,
      description: `منح سلفة / مسحوبات شخصية للموظف ${employee.name} (${employee.id})`,
      branch: employee.branch || "المقر الرئيسي",
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      isSynced: false
    });

    alert(`تم منح وتسجيل السلفة بقيمة ${advVal} د.ل بنجاح! تم خصمها من الخزينة.`);
    
    if (onUpdate) {
      const updated = await db.employees.get(employee.id);
      onUpdate(updated);
    }
    
    setShowAdvanceForm(false);
    setAdvanceAmount("");
  };

  // محاكاة خصم بسيط لغرض العرض الجمالي للمعادلة
  const testUsedAdvCut = employee.monthlyAdvanceCut;
  const testUsedCash = employee.cashWithdrawEnabled ? employee.cashWithdrawLimit * 0.3 : 0; // استخدم 30% من الكاش للتجربة
  const testUsedMeals = employee.mealsEnabled ? employee.mealsLimit * 0.9 : 0; // استخدم 90%
  const netSalary = employee.baseSalary - testUsedAdvCut - testUsedCash;

  return (
    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl relative max-w-4xl mx-auto">
      <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <FileBadge className="w-6 h-6 text-orange-400" /> الإيصال الوظيفي وكشف الراتب التفصيلي
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-900">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-8">
        <div className="flex justify-between items-start mb-8 pb-8 border-b border-gray-100 border-dashed">
          <div className="flex gap-5">
            <div className="w-20 h-20 bg-[#f8f9fd] border-2 border-orange-500 rounded-2xl flex items-center justify-center">
              <Users className="w-10 h-10 text-orange-500" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{employee.name}</h2>
              <p className="text-sm font-bold text-orange-400">{employee.role} — {employee.branch}</p>
              <div className="flex gap-4 mt-3 text-xs font-bold text-gray-500">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {employee.phone}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> ميلاد: {employee.dob}</span>
              </div>
            </div>
          </div>
          <div className="text-center bg-[#f8f9fd] p-4 rounded-2xl border border-gray-100">
            <p className="text-[10px] text-gray-500 font-extrabold tracking-widest uppercase mb-1">الراتب الصافي التقريبي (هذا الشهر)</p>
            <p className="text-3xl font-mono font-extrabold text-emerald-400">{netSalary.toLocaleString()} <span className="text-sm">د.ل</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* العمود الأيمن: المعادلة الحسابية */}
          <div>
            <h4 className="text-sm font-extrabold text-gray-600 mb-6 uppercase tracking-widest bg-gray-800/30 px-3 py-1.5 inline-block rounded">معادلة المعاش</h4>
            <div className="space-y-4 text-sm font-bold">
              <div className="flex justify-between items-center text-gray-200">
                <span>الراتب الأساسي الثابت</span>
                <span className="font-mono">{employee.baseSalary.toLocaleString()} د.ل</span>
              </div>
              <div className="flex justify-between items-center text-red-400 border-l-2 border-red-500/30 pl-3">
                <span>قسط السلفة التلقائي المستقطع الشهر</span>
                <span className="font-mono"> - {employee.monthlyAdvanceCut.toLocaleString()} د.ل</span>
              </div>
              <div className="flex justify-between items-center text-red-400 border-l-2 border-red-500/30 pl-3">
                <span>مسحوبات جيب نقدية سحبت هذا الشهر</span>
                <span className="font-mono"> - {testUsedCash.toLocaleString()} د.ل</span>
              </div>
              <div className="flex justify-between items-center text-orange-400 border-t border-gray-100/50 pt-4 mt-4">
                <span>إجمالي الخصومات</span>
                <span className="font-mono">- {(employee.monthlyAdvanceCut + testUsedCash).toLocaleString()} د.ل</span>
              </div>
            </div>

            <div className="mt-8 bg-pink-500/10 border border-pink-500/20 p-5 rounded-2xl text-xs font-bold text-pink-300">
              <p className="mb-2">💡 غرامات الغياب والتأقير المحتملة:</p>
              <ul className="list-disc pr-4 space-y-1 text-pink-400/80">
                <li>سيتم خصم <span className="font-mono">{employee.deductHalfDay} د.ل</span> عن كل يوم فيه (عتبة تأخير/نصف يوم).</li>
                <li>سيتم خصم <span className="font-mono">{employee.deductFullDay} د.ل</span> عن كل (غياب كامل بدون إذن).</li>
              </ul>
            </div>
          </div>

          {/* العمود الأيسر: تقرير السقوف */}
          <div>
            <h4 className="text-sm font-extrabold text-gray-600 mb-6 uppercase tracking-widest bg-gray-800/30 px-3 py-1.5 inline-block rounded">موقف السقوف التشغيلية والاستهلاك</h4>

            <div className="space-y-6">
              {/* الوجبات */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-xs font-bold text-gray-400 flex items-center gap-2"><Coffee className="w-4 h-4" /> سقف الوجبات الفندقي {employee.mealsEnabled ? '' : <span className="text-red-500 text-[10px] bg-red-500/10 px-1 rounded">موقوف للموظف</span>}</p>
                  <p className="text-[10px] font-mono font-bold text-orange-400">استهلك {testUsedMeals} / {employee.mealsLimit} د.ل</p>
                </div>
                <div className={`h-2 bg-[#f8f9fd] rounded-full overflow-hidden ${!employee.mealsEnabled && 'opacity-30'}`}>
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${employee.mealsLimit === 0 ? 0 : (testUsedMeals / employee.mealsLimit) * 100}%` }}></div>
                </div>
              </div>

              {/* النقدية */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-xs font-bold text-gray-400 flex items-center gap-2"><Wallet className="w-4 h-4" /> سقف المسحوبات النقدية للجيب {employee.cashWithdrawEnabled ? '' : <span className="text-red-500 text-[10px] bg-red-500/10 px-1 rounded">موقوف للموظف</span>}</p>
                  <p className="text-[10px] font-mono font-bold text-orange-400">سحب {testUsedCash} / {employee.cashWithdrawLimit} د.ل</p>
                </div>
                <div className={`h-2 bg-[#f8f9fd] rounded-full overflow-hidden ${!employee.cashWithdrawEnabled && 'opacity-30'}`}>
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${employee.cashWithdrawLimit === 0 ? 0 : (testUsedCash / employee.cashWithdrawLimit) * 100}%` }}></div>
                </div>
              </div>

              {/* الدين والسلف */}
              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mt-6 transition-all duration-300">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs font-bold text-orange-400 flex items-center gap-2"><CreditCard className="w-4 h-4" /> موقف السلف المتراكمة</p>
                  <button onClick={() => setShowAdvanceForm(!showAdvanceForm)} className="text-[10px] font-bold bg-orange-500 hover:bg-orange-400 text-gray-900 px-3 py-1.5 rounded-lg transition shadow-sm">
                    {showAdvanceForm ? "إلغاء" : "منح سلفة جديدة"}
                  </button>
                </div>
                <div className="flex justify-between items-center text-sm font-bold mb-2">
                  <span className="text-gray-400">إجمالي السلفة المقيدة</span>
                  <span className="font-mono text-gray-900">{employee.totalAdvance.toLocaleString()} د.ل</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-gray-400">قسط الاستقطاع الشهري الثابت</span>
                  <span className="font-mono text-red-500">{employee.monthlyAdvanceCut.toLocaleString()} د.ل</span>
                </div>

                {showAdvanceForm && (
                  <div className="mt-4 pt-4 border-t border-orange-500/20 space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1">المبلغ المطلوب منحه كـ سلفة (د.ل)</label>
                      <input type="number" min="1" required value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 outline-none text-sm font-mono text-gray-900 focus:border-orange-500" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1">تحديد / تعديل قيمة القسط المستقطع شهرياً</label>
                      <input type="number" min="1" required value={monthlyCut} onChange={e => setMonthlyCut(e.target.value)} className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 outline-none text-sm font-mono text-gray-900 focus:border-orange-500" placeholder="0.00" />
                    </div>
                    <button onClick={handleGrantAdvance} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-lg text-xs mt-2 transition shadow-lg shadow-orange-500/20">
                      تأكيد الصرف وتسجيل العهدة
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-gray-100 flex justify-between">
          <button onClick={() => alert("سيتم إرسال بطاقة توقيع الكترونية (PIN) برسالة نصية.")} className="bg-orange-500 hover:bg-orange-400 text-gray-900 font-bold px-6 py-2.5 rounded-lg text-sm transition shadow-lg shadow-orange-500/20">تعديل ملف وتجديد الـ PIN المقفل لـ ({'●'.repeat(employee.pin?.length || 4)})</button>
          <button onClick={onDelete} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-gray-900 font-bold px-6 py-2.5 rounded-lg text-sm transition flex items-center gap-2"><UserMinus className="w-4 h-4" /> فصل وإلغاء القيد</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. إدارة قائمة الطعام والوجبات (Menu Items)
// ─────────────────────────────────────────────────────────────
function MenuItemsManagementView({ showSuccess }: { showSuccess: (m: string) => void }) {
  const menuItems = useLiveQuery(() => db.menuItems.toArray()) || [];
  const inventoryItems = useLiveQuery(() => db.inventory.toArray()) || [];

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("الطبق الرئيسي");
  const [newCategory, setNewCategory] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("🍔");

  const [ingredients, setIngredients] = useState<{ itemId: number, name: string, qty: number, unit: string, costPerUnit: number }[]>([]);
  const [selInvId, setSelInvId] = useState("");
  const [selQty, setSelQty] = useState("");
  const [selUnit, setSelUnit] = useState(""); // الوحدة التي سيتم الخصم بها

  // Categories extraction
  const existingCategories = Array.from(new Set(menuItems.map(m => m.category)));
  if (!existingCategories.includes("الطبق الرئيسي")) existingCategories.push("الطبق الرئيسي");

  const totalCost = ingredients.reduce((sum, ing) => sum + (ing.qty * ing.costPerUnit), 0);
  const parsedPrice = parseFloat(price) || 0;
  const profitMargin = parsedPrice > 0 ? ((parsedPrice - totalCost) / parsedPrice) * 100 : 0;

  const addIngredient = () => {
    const item = inventoryItems.find(i => i.id === Number(selInvId));
    const qty = parseFloat(selQty);
    if (!item || !qty) return;

    let finalUnit = selUnit || item.unit;
    let finalCostPerUnit = item.avgPrice;

    // الحساب الذكي للوحدات
    if (item.unit === "كيلو" && finalUnit === "جرام") {
      finalCostPerUnit = item.avgPrice / 1000;
    } else if (item.unit === "لتر" && finalUnit === "مل") {
      finalCostPerUnit = item.avgPrice / 1000;
    }

    setIngredients([...ingredients, { itemId: item.id!, name: item.name, qty, unit: finalUnit, costPerUnit: finalCostPerUnit }]);
    setSelInvId(""); setSelQty(""); setSelUnit("");
  };

  const removeIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    const finalCategory = newCategory.trim() !== "" ? newCategory.trim() : category;

    await db.menuItems.add({
      name,
      category: finalCategory,
      price: parseFloat(price),
      cost: totalCost,
      image,
      ingredients,
      isAvailable: true
    });
    showSuccess(`تمت إضافة ${name} للقائمة بنجاح!`);
    setIsAdding(false);
    setName(""); setPrice(""); setImage("🍔"); setIngredients([]); setNewCategory(""); setCategory("الطبق الرئيسي");
  };

  const toggleAvailability = async (id: number, current: boolean) => {
    await db.menuItems.update(id, { isAvailable: !current });
    showSuccess("تم تحديث حالة الصنف في جميع فروع الكاشير.");
  };

  const deleteItem = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الصنف من القائمة؟")) {
      await db.menuItems.delete(id);
      showSuccess("تم حذف الصنف.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2"><Coffee className="w-6 h-6 text-orange-500" /> هندسة المنيو والتكاليف (Menu Engineering)</h3>
          <p className="text-xs font-bold text-gray-500 mt-1">إضافة الأصناف، تحديد مكوناتها من المخزن، وتسعيرها لتُحسب التكلفة والأرباح آلياً.</p>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="bg-orange-600 hover:bg-orange-500 text-gray-900 font-bold px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 transition flex items-center gap-2">
            إضافة صنف جديد / وصفة
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
          <h4 className="font-extrabold text-gray-900">إضافة صنف جديد وتحديد التكلفة</h4>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">اسم الصنف</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="اسم الوجبة/المنتج" className="w-full bg-[#f8f9fd] border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 text-gray-900 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">التصنيف</label>
              <div className="flex gap-2">
                <select value={category} onChange={e => { setCategory(e.target.value); setNewCategory(""); }} className="w-1/2 bg-[#f8f9fd] border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 text-gray-900 outline-none">
                  {existingCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="NEW">تصنيف جديد...</option>
                </select>
                {category === "NEW" && (
                  <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="اسم التصنيف..." required className="w-1/2 bg-[#f8f9fd] border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 text-gray-900 outline-none" />
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">سعر البيع للزبون (د.ل)</label>
              <input type="number" step="0.25" value={price} onChange={e => setPrice(e.target.value)} required placeholder="0.00" className="w-full bg-[#f8f9fd] border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 text-gray-900 outline-none font-mono text-emerald-400 font-bold" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">أيقونة / صورة</label>
              <input type="text" value={image} onChange={e => setImage(e.target.value)} required className="w-full bg-[#f8f9fd] border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 text-gray-900 outline-none text-center text-xl" />
            </div>
          </div>

          <div className="border border-gray-100 rounded-2xl p-5 bg-[#f8f9fd]/50">
            <h5 className="text-sm font-bold text-gray-600 mb-4 flex items-center gap-2">مكونات الوصفة من المخزن (لحساب التكلفة)</h5>

            <div className="flex gap-4 mb-4">
              <select value={selInvId} onChange={e => {
                setSelInvId(e.target.value);
                const selectedItem = inventoryItems.find(i => i.id === Number(e.target.value));
                if (selectedItem) {
                  if (selectedItem.unit === "كيلو") setSelUnit("جرام"); // افتراضياً جرام لتسهيل العمل
                  else if (selectedItem.unit === "لتر") setSelUnit("مل");
                  else setSelUnit(selectedItem.unit);
                }
              }} className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none text-sm">
                <option value="">-- اختر مادة خام --</option>
                {inventoryItems.map(inv => (
                  <option key={inv.id} value={inv.id}>{inv.name} (متوسط التكلفة: {inv.avgPrice} د.ل / {inv.unit})</option>
                ))}
              </select>

              <input type="number" step="0.01" value={selQty} onChange={e => setSelQty(e.target.value)} placeholder="الكمية" className="w-24 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none text-sm font-mono" />

              <select value={selUnit} onChange={e => setSelUnit(e.target.value)} className="w-24 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none text-sm">
                {selInvId && (() => {
                  const item = inventoryItems.find(i => i.id === Number(selInvId));
                  if (!item) return <option value="">الوحدة</option>;
                  if (item.unit === "كيلو") return <><option value="جرام">جرام</option><option value="كيلو">كيلو</option></>;
                  if (item.unit === "لتر") return <><option value="مل">مل</option><option value="لتر">لتر</option></>;
                  return <option value={item.unit}>{item.unit}</option>;
                })()}
                {!selInvId && <option value="">الوحدة</option>}
              </select>

              <button type="button" onClick={addIngredient} className="bg-orange-600 hover:bg-orange-500 text-gray-900 font-bold px-4 rounded-xl text-sm transition">إضافة للصنف</button>
            </div>

            {ingredients.length > 0 && (
              <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
                <table className="w-full text-right text-sm">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="py-2 px-4 text-xs text-gray-400">المكون</th>
                      <th className="py-2 px-4 text-xs text-gray-400">الكمية المسحوبة</th>
                      <th className="py-2 px-4 text-xs text-gray-400">تكلفة المكون (د.ل)</th>
                      <th className="py-2 px-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {ingredients.map((ing, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-4 text-gray-600">{ing.name}</td>
                        <td className="py-2 px-4 font-mono text-gray-400">{ing.qty} {ing.unit}</td>
                        <td className="py-2 px-4 font-mono text-red-400 font-bold">{(ing.qty * ing.costPerUnit).toFixed(2)}</td>
                        <td className="py-2 px-4 text-left"><button type="button" onClick={() => removeIngredient(idx)} className="text-red-500 hover:text-red-400">×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
            <div className="flex gap-8">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">إجمالي التكلفة</p>
                <p className="font-mono text-xl text-red-400 font-black">{totalCost.toFixed(2)} د.ل</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">هامش الربح الإجمالي</p>
                <p className="font-mono text-xl text-emerald-400 font-black">{profitMargin.toFixed(1)}%</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" className="bg-emerald-600 hover:bg-[#ff6b00] text-white font-bold px-8 py-3 rounded-xl transition">تأكيد وحفظ الصنف</button>
              <button type="button" onClick={() => setIsAdding(false)} className="bg-gray-800 hover:bg-gray-700 text-gray-900 font-bold px-6 py-3 rounded-xl transition">إلغاء</button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map(item => {
          const margin = item.price > 0 ? ((item.price - (item.cost || 0)) / item.price) * 100 : 0;
          return (
            <div key={item.id} className={`bg-white border ${item.isAvailable ? 'border-gray-100' : 'border-red-900/30 opacity-70'} rounded-3xl p-5 hover:shadow-lg transition flex flex-col`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-inner ${item.isAvailable ? 'bg-[#f8f9fd]' : 'bg-red-950/20 grayscale'}`}>
                  {item.image}
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-gray-900 text-base">{item.name}</h4>
                  <p className="text-[10px] font-bold text-orange-400 mb-1">{item.category}</p>
                  <p className="text-xl font-mono font-black text-emerald-400">{item.price.toFixed(2)} <span className="text-[10px] font-sans text-gray-500">د.ل</span></p>
                </div>
              </div>

              <div className="bg-[#f8f9fd] rounded-xl p-3 mb-4 flex justify-between items-center text-xs border border-gray-100">
                <div>
                  <span className="text-gray-500 block mb-0.5">التكلفة الفعلية</span>
                  <span className="font-mono text-red-400 font-bold">{(item.cost || 0).toFixed(2)} د.ل</span>
                </div>
                <div className="text-left border-l border-gray-100 pl-3">
                  <span className="text-gray-500 block mb-0.5">الربح (%)</span>
                  <span className={`font-mono font-bold ${margin >= 60 ? 'text-emerald-400' : margin >= 40 ? 'text-orange-400' : 'text-red-500'}`}>{margin.toFixed(1)}%</span>
                </div>
              </div>

              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => toggleAvailability(item.id!, item.isAvailable)}
                  className={`flex-1 text-[11px] font-bold px-3 py-2 rounded-xl border ${item.isAvailable ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'}`}
                >
                  {item.isAvailable ? 'متاح للبيع (إيقاف)' : 'موقوف (إتاحة)'}
                </button>
                <button onClick={() => deleteItem(item.id!)} className="text-[11px] font-bold px-4 py-2 rounded-xl border bg-gray-800 text-gray-400 border-gray-200 hover:text-gray-900 hover:bg-gray-700 transition">
                  حذف
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. إدارة المخازن والمواد الخام (Inventory Management)
// ─────────────────────────────────────────────────────────────
function InventoryManagementView({ showSuccess }: { showSuccess: (m: string) => void }) {
  const inventoryItems = useLiveQuery(() => db.inventory.toArray()) || [];

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("خضروات");
  const [newCategory, setNewCategory] = useState("");
  const [unit, setUnit] = useState("كيلو");
  const [newUnit, setNewUnit] = useState("");
  const [quantity, setQuantity] = useState("");
  const [minAlert, setMinAlert] = useState("");
  const [avgPrice, setAvgPrice] = useState("");

  const [supplyItem, setSupplyItem] = useState<any>(null);
  const [supplyQty, setSupplyQty] = useState("");
  const [supplyPrice, setSupplyPrice] = useState("");

  const existingCategories = Array.from(new Set(inventoryItems.map(i => i.category)));
  if (!existingCategories.includes("خضروات")) existingCategories.push("خضروات");

  const existingUnits = Array.from(new Set(inventoryItems.map(i => i.unit)));
  if (!existingUnits.includes("كيلو")) existingUnits.push("كيلو");
  if (!existingUnits.includes("لتر")) existingUnits.push("لتر");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !avgPrice || !quantity) return;

    const finalCategory = newCategory.trim() !== "" ? newCategory.trim() : category;
    const finalUnit = newUnit.trim() !== "" ? newUnit.trim() : unit;

    await db.inventory.add({
      name,
      category: finalCategory,
      unit: finalUnit,
      qty: parseFloat(quantity) || 0,
      min: parseFloat(minAlert) || 0,
      avgPrice: parseFloat(avgPrice) || 0,
      isSynced: false
    });

    showSuccess(`تمت إضافة ${name} للمخزن بنجاح!`);
    setIsAdding(false);
    setName(""); setQuantity(""); setMinAlert(""); setAvgPrice(""); setNewCategory(""); setNewUnit("");
  };

  const handleSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplyItem || !supplyQty || !supplyPrice) return;

    const addedQty = parseFloat(supplyQty);
    const addedPrice = parseFloat(supplyPrice); // هذا السعر للوحدة الواحدة في التوريد الجديد

    if (addedQty <= 0 || addedPrice < 0) return;

    // حساب المتوسط المرجح للتكلفة
    const currentQty = supplyItem.qty;
    const currentAvgPrice = supplyItem.avgPrice;

    const totalCurrentValue = currentQty * currentAvgPrice;
    const totalAddedValue = addedQty * addedPrice;

    const newQty = currentQty + addedQty;
    const newAvgPrice = (totalCurrentValue + totalAddedValue) / newQty;

    await db.inventory.update(supplyItem.id, {
      qty: newQty,
      avgPrice: newAvgPrice
    });

    showSuccess(`تم توريد ${addedQty} ${supplyItem.unit} من ${supplyItem.name} وتحديث متوسط التكلفة إلى ${newAvgPrice.toFixed(2)} د.ل.`);
    setSupplyItem(null);
    setSupplyQty("");
    setSupplyPrice("");
  };

  const deleteItem = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه المادة؟ قد يؤثر ذلك على تكلفة الوجبات المرتبطة بها.")) {
      await db.inventory.delete(id);
      showSuccess("تم حذف المادة بنجاح.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2"><Package className="w-6 h-6 text-orange-500" /> إدارة المخازن والمواد الخام</h3>
          <p className="text-xs font-bold text-gray-500 mt-1">إضافة مواد خام جديدة، وتحديد أسعار التكلفة للربط التلقائي مع هندسة المنيو.</p>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="bg-orange-600 hover:bg-orange-500 text-gray-900 font-bold px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 transition flex items-center gap-2">
            إضافة مادة خام جديدة
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
          <h4 className="font-extrabold text-gray-900">إضافة مادة خام جديدة</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">اسم المادة</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="مثال: دجاج كامل مبرد" className="w-full bg-[#f8f9fd] border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 text-gray-900 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">التصنيف</label>
              <div className="flex gap-2">
                <select value={category} onChange={e => { setCategory(e.target.value); setNewCategory(""); }} className="w-1/2 bg-[#f8f9fd] border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 text-gray-900 outline-none">
                  {existingCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="NEW">تصنيف جديد...</option>
                </select>
                {category === "NEW" && (
                  <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="اسم التصنيف..." required className="w-1/2 bg-[#f8f9fd] border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 text-gray-900 outline-none" />
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">وحدة القياس الكبرى (مثال: كيلو، لتر، صندوق)</label>
              <div className="flex gap-2">
                <select value={unit} onChange={e => { setUnit(e.target.value); setNewUnit(""); }} className="w-1/2 bg-[#f8f9fd] border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 text-gray-900 outline-none">
                  {existingUnits.map(u => <option key={u} value={u}>{u}</option>)}
                  <option value="NEW">وحدة جديدة...</option>
                </select>
                {unit === "NEW" && (
                  <input type="text" value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="اسم الوحدة..." required className="w-1/2 bg-[#f8f9fd] border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 text-gray-900 outline-none" />
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">الكمية الافتتاحية</label>
              <input type="number" step="0.1" value={quantity} onChange={e => setQuantity(e.target.value)} required placeholder="0" className="w-full bg-[#f8f9fd] border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 text-gray-900 outline-none font-mono" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">حد التنبيه (النواقص)</label>
              <input type="number" step="0.1" value={minAlert} onChange={e => setMinAlert(e.target.value)} required placeholder="0" className="w-full bg-[#f8f9fd] border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 text-gray-900 outline-none font-mono" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">متوسط التكلفة للوحدة (د.ل)</label>
              <input type="number" step="0.01" value={avgPrice} onChange={e => setAvgPrice(e.target.value)} required placeholder="0.00" className="w-full bg-[#f8f9fd] border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 text-gray-900 outline-none font-mono text-emerald-400 font-bold" />
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-gray-100 pt-6 mt-6">
            <button type="submit" className="bg-emerald-600 hover:bg-[#ff6b00] text-white font-bold px-8 py-3 rounded-xl transition">حفظ في المخزن</button>
            <button type="button" onClick={() => setIsAdding(false)} className="bg-gray-800 hover:bg-gray-700 text-gray-900 font-bold px-6 py-3 rounded-xl transition">إلغاء</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#f8f9fd]/80 border-b border-gray-100">
              <tr>
                <th className="py-4 px-6 font-extrabold text-gray-600">اسم المادة</th>
                <th className="py-4 px-6 font-extrabold text-gray-600">التصنيف</th>
                <th className="py-4 px-6 font-extrabold text-gray-600">الكمية المتاحة</th>
                <th className="py-4 px-6 font-extrabold text-gray-600">متوسط التكلفة</th>
                <th className="py-4 px-6 font-extrabold text-gray-600">إجمالي القيمة</th>
                <th className="py-4 px-6 font-extrabold text-gray-600 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {inventoryItems.map(item => {
                const totalValue = item.qty * item.avgPrice;
                const isLow = item.qty <= item.min;
                return (
                  <tr key={item.id} className="hover:bg-[#f8f9fd]/50 transition group">
                    <td className="py-4 px-6 text-gray-900 font-bold">{item.name}</td>
                    <td className="py-4 px-6 text-orange-300 text-xs">{item.category}</td>
                    <td className="py-4 px-6">
                      <span className={`font-mono font-bold px-3 py-1 rounded-lg ${isLow ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {item.qty} {item.unit}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-gray-600">{item.avgPrice.toFixed(2)} د.ل/{item.unit}</td>
                    <td className="py-4 px-6 font-mono text-emerald-400 font-bold">{totalValue.toFixed(2)} د.ل</td>
                    <td className="py-4 px-6 text-left flex gap-2 justify-end">
                      <button onClick={() => { setSupplyItem(item); setSupplyQty(""); setSupplyPrice(""); }} className="text-xs font-bold text-orange-400 hover:text-gray-900 hover:bg-orange-500 px-3 py-1.5 rounded-lg border border-orange-500/20 transition opacity-0 group-hover:opacity-100">
                        توريد كمية
                      </button>
                      <button onClick={() => deleteItem(item.id!)} className="text-xs font-bold text-red-500 hover:text-gray-900 hover:bg-red-500 px-3 py-1.5 rounded-lg border border-red-500/20 transition opacity-0 group-hover:opacity-100">
                        حذف
                      </button>
                    </td>
                  </tr>
                );
              })}
              {inventoryItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 font-bold">المخزن فارغ حالياً</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal: توريد كمية جديدة ─── */}
      {supplyItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSupplyItem(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            onClick={e => e.stopPropagation()}
            className="bg-white border border-orange-500/30 rounded-3xl p-8 shadow-2xl shadow-orange-500/10 w-full max-w-md mx-4"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-400" />
                  توريد كمية جديدة
                </h3>
                <p className="text-xs font-bold text-orange-400 mt-1">{supplyItem.name}</p>
              </div>
              <button onClick={() => setSupplyItem(null)} className="w-9 h-9 rounded-full bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#f8f9fd] rounded-2xl p-4 mb-6 flex gap-6 text-sm font-bold">
              <div>
                <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">الرصيد الحالي</p>
                <p className="font-mono text-gray-900">{supplyItem.qty} <span className="text-gray-500">{supplyItem.unit}</span></p>
              </div>
              <div>
                <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">متوسط التكلفة الحالي</p>
                <p className="font-mono text-orange-400">{supplyItem.avgPrice.toFixed(2)} د.ل/{supplyItem.unit}</p>
              </div>
            </div>

            <form onSubmit={handleSupply} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-2">الكمية الواردة ({supplyItem.unit})</label>
                <input
                  type="number" step="0.01" min="0.01"
                  value={supplyQty}
                  onChange={e => setSupplyQty(e.target.value)}
                  required
                  placeholder="0"
                  className="w-full bg-[#f8f9fd] border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-mono text-lg text-gray-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-2">سعر الشراء للوحدة الواحدة (د.ل / {supplyItem.unit})</label>
                <input
                  type="number" step="0.01" min="0"
                  value={supplyPrice}
                  onChange={e => setSupplyPrice(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full bg-[#f8f9fd] border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-mono text-lg text-emerald-400 font-bold"
                />
              </div>

              {supplyQty && supplyPrice && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-xs font-bold">
                  <p className="text-gray-400 mb-1">المتوسط المرجح الجديد المُتوقع:</p>
                  <p className="font-mono text-orange-300 text-base">
                    {(((supplyItem.qty * supplyItem.avgPrice) + (parseFloat(supplyQty) * parseFloat(supplyPrice))) / (supplyItem.qty + parseFloat(supplyQty))).toFixed(2)} د.ل/{supplyItem.unit}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-500 text-gray-900 font-bold py-3.5 rounded-xl transition shadow-lg shadow-orange-600/20">
                  تأكيد الاستلام والتوريد
                </button>
                <button type="button" onClick={() => setSupplyItem(null)} className="px-6 py-3.5 bg-gray-800 hover:bg-gray-700 text-gray-900 font-bold rounded-xl transition">
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─── اعتماد طلبات الشراء من أمين المخزن (CEO) ───────────────────
function PurchaseRequestsApprovalView({ showSuccess }: { showSuccess: (msg: string) => void }) {
  const purchaseRequests = useLiveQuery(() =>
    db.purchaseRequests.orderBy("id").reverse().toArray()
  ) ?? [];

  const pending   = purchaseRequests.filter((r) => r.status === "معلق");
  const processed = purchaseRequests.filter((r) => r.status !== "معلق");

  const handleApproveDebt = async (req: any) => {
    await db.purchaseRequests.update(req.id, {
      status: "معتمد - دين",
      approvedAt: new Date().toISOString(),
      approvedBy: "CEO",
    });
    showSuccess("تم اعتماد كدين ✓ — " + req.requestNumber);
  };

  const handleApprovePay = async (req: any) => {
    const now = new Date().toISOString();
    const count = await db.paymentOrders.count();
    const voucherNumber = "PV-" + String(count + 1).padStart(4, "0");
    const paymentId = await db.paymentOrders.add({
      voucherNumber,
      purchaseRequestId: req.id,
      requestNumber: req.requestNumber,
      supplierName: req.supplierName,
      itemName: req.itemName,
      qty: req.qty,
      unit: req.unit,
      unitPrice: req.unitPrice,
      totalAmount: req.totalAmount,
      branch: req.branch,
      status: "بانتظار الخزينة",
      createdAt: now,
      notes: req.notes,
    });
    await db.purchaseRequests.update(req.id, {
      status: "معتمد - صرف",
      approvedAt: now,
      approvedBy: "CEO",
      paymentOrderId: paymentId as number,
    });
    showSuccess("تم إنشاء أمر صرف " + voucherNumber + " وإرساله لأمين الخزينة ✓");
  };

  const handleReject = async (id: number) => {
    await db.purchaseRequests.update(id, { status: "مرفوض" });
    showSuccess("تم رفض طلب الشراء");
  };

  const statusStyle: Record<string, string> = {
    "معلق":          "bg-amber-500/10 text-amber-400 border-amber-500/30",
    "معتمد - دين":   "bg-blue-500/10 text-blue-400 border-blue-500/30",
    "معتمد - صرف":   "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    "مرفوض":         "bg-red-500/10 text-red-400 border-red-500/30",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-xl">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-orange-400" /> طلبات شراء أمين المخزن
          </h3>
          <p className="text-sm text-gray-400 font-medium mt-1">
            طلبات مرسلة من أمين المخزن — اختر: اعتماد كدين أو اعتماد وصرف (يُنشئ أمر صرف لأمين الخزينة)
          </p>
        </div>
        <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border ${
          pending.length > 0
            ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
            : "bg-gray-50 border-gray-100 text-gray-400"
        }`}>
          <AlertCircle className="w-4 h-4" /> {pending.length > 0 ? `${pending.length} طلب معلق` : "لا طلبات معلقة"}
        </div>
      </div>

      {pending.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {pending.map((req) => (
            <div key={req.id} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col hover:border-orange-500/30 transition">
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
              <div className="flex justify-between items-start mt-2 mb-3">
                <div>
                  <p className="text-xs font-extrabold text-orange-400 font-mono">{req.requestNumber}</p>
                  <p className="text-base font-extrabold text-gray-900 mt-0.5">{req.supplierName}</p>
                </div>
                <span className="text-[10px] font-bold bg-gray-50 text-gray-400 border border-gray-100 px-2 py-1 rounded-lg">{req.branch}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs space-y-1.5 flex-1">
                <div className="flex justify-between"><span className="text-gray-400">الصنف</span><strong className="text-gray-900">{req.itemName}</strong></div>
                <div className="flex justify-between"><span className="text-gray-400">الكمية</span><strong className="text-gray-900">{req.qty} {req.unit}</strong></div>
                <div className="flex justify-between"><span className="text-gray-400">سعر الوحدة</span><strong className="text-gray-900">{req.unitPrice.toFixed(2)} د.ل</strong></div>
                <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
                  <span className="font-extrabold text-gray-900">الإجمالي</span>
                  <strong className="text-orange-400 text-sm font-mono">{req.totalAmount.toFixed(2)} د.ل</strong>
                </div>
              </div>
              {req.notes && (
                <p className="text-[10px] bg-blue-500/5 border border-blue-500/20 rounded-lg px-2 py-1.5 mb-3 text-gray-400">
                  ملاحظة: {req.notes}
                </p>
              )}
              <div className="grid grid-cols-3 gap-2 mt-auto">
                <button onClick={() => handleApproveDebt(req)}
                  className="flex flex-col items-center justify-center gap-0.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] py-3 px-1 rounded-xl transition active:scale-95 shadow-lg shadow-blue-600/20">
                  <CreditCard className="w-4 h-4 mb-0.5" />
                  اعتماد دين
                </button>
                <button onClick={() => handleApprovePay(req)}
                  className="flex flex-col items-center justify-center gap-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] py-3 px-1 rounded-xl transition active:scale-95 shadow-lg shadow-emerald-600/20">
                  <Banknote className="w-4 h-4 mb-0.5" />
                  اعتماد وصرف
                </button>
                <button onClick={() => handleReject(req.id!)}
                  className="flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 text-lg font-bold py-3 rounded-xl border border-red-500/20 transition active:scale-95">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {processed.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-gray-900">سجل طلبات الشراء المعالجة</h3>
            <span className="text-xs font-bold text-gray-400">{processed.length} طلب</span>
          </div>
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-400 border-b border-gray-100">
                <th className="px-5 py-3">رقم الطلب</th>
                <th className="px-5 py-3">المورد</th>
                <th className="px-5 py-3">الصنف</th>
                <th className="px-5 py-3 text-center">الفرع</th>
                <th className="px-5 py-3 text-center">الإجمالي</th>
                <th className="px-5 py-3 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {processed.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4 font-mono text-xs text-orange-400">{req.requestNumber}</td>
                  <td className="px-5 py-4 font-bold text-sm text-gray-900">{req.supplierName}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{req.itemName}</td>
                  <td className="px-5 py-4 text-center text-xs text-gray-400">{req.branch}</td>
                  <td className="px-5 py-4 text-center font-mono font-bold text-orange-400">
                    {req.totalAmount.toFixed(2)} د.ل
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusStyle[req.status] || ""}`}>
                      {req.status}
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
