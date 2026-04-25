"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight, ChefHat, ChevronRight, Eye, EyeOff, AlertCircle, Building, Store, Package, Wallet, Monitor, Headphones } from "lucide-react";
import { ROLES, saveSession, getSession, type RoleConfig } from "../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleConfig | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // إذا كانت هناك جلسة نشطة وجّه مباشرة
  useEffect(() => {
    // تشغيل تهيئة البيانات الوهمية لتجربة التطبيق
    import('@/lib/db').then(({ seedDatabase }) => {
      seedDatabase().catch(console.error);
    });

    const session = getSession();
    if (session) router.replace(session.role.route);
  }, [router]);

  const handleRoleSelect = (role: RoleConfig) => {
    setSelectedRole(role);
    setPassword("");
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setError("");
    setIsLoading(true);

    try {
      // 1. فحص كلمات المرور الافتراضية (Master Passwords)
      if (password === selectedRole.password) {
        saveSession(selectedRole);
        router.push(selectedRole.route);
        return;
      }

      // 2. فحص قاعدة البيانات للموظفين
      const { db } = await import('@/lib/db');
      // نفترض أن كلمة المرور المُدخلة هي الـ PIN الخاص بالموظف
      const employees = await db.employees.toArray();
      const employee = employees.find(emp => emp.pin === password);

      if (employee) {
        // التحقق من أن الموظف يحاول الدخول للواجهة المخصصة له عبر accessLevel
        const isCashierMatch = selectedRole.id === "cashier" && (employee.accessLevel === "واجهة الكاشير" || employee.accessLevel === "كاشير");
        const isManagerMatch = selectedRole.id === "branch-manager" && (employee.accessLevel === "لوحة مدير الفرع" || employee.accessLevel === "مدير فرع");

        if (isCashierMatch || isManagerMatch) {
          // حفظ الجلسة مع بيانات الموظف
          saveSession(selectedRole, {
            employeeId: employee.id,
            employeeName: employee.name,
            branch: employee.branch,
          });
          router.push(selectedRole.route);
          return;
        } else {
          setError("عذراً، صلاحياتك لا تسمح بالدخول لهذه الواجهة.");
          setIsLoading(false);
          setPassword("");
          return;
        }
      }
    } catch (err) {
      console.error("Login Error:", err);
    }

    setError("كلمة المرور غير صحيحة. حاول مرة أخرى.");
    setIsLoading(false);
    setPassword("");
  };

  const getRoleIcon = (id: string, className: string = "w-6 h-6") => {
    switch(id) {
      case "ceo": return <Building className={className} />;
      case "branch-manager": return <Store className={className} />;
      case "storekeeper": return <Package className={className} />;
      case "treasury": return <Wallet className={className} />;
      case "cashier": return <Monitor className={className} />;
      case "call-center": return <Headphones className={className} />;
      default: return <ChefHat className={className} />;
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#f8f9fd] text-gray-900 font-sans" dir="rtl">
      
      {/* ── الجانب الأيمن (تعريفي ورسمي) ── */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex flex-col justify-between p-16 bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-[#0f172a]" />
        
        {/* خلفية زخرفية رسمية (أنماط هندسية خفيفة) */}
        <div className="absolute top-0 right-0 w-full h-full opacity-5 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        
        {/* الشعار */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-4 relative z-10"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-xl">
            <ChefHat className="w-7 h-7 text-[#ff6b00]" strokeWidth={2.5} />
          </div>
          <span className="text-3xl font-black text-white tracking-tight">
            Chicken Hut <span className="font-light opacity-80">ERP</span>
          </span>
        </motion.div>

        {/* محتوى تعريفي */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 max-w-lg mb-10"
        >
          <h2 className="text-4xl font-extrabold text-white leading-[1.3] mb-6">
            النظام الإداري الشامل <br />
            <span className="text-white/80 font-bold text-3xl">
              إدارة، متابعة، وتطوير
            </span>
          </h2>
          <p className="text-white/80 text-lg leading-relaxed mb-10 font-medium">
            المنصة المركزية المعتمدة لإدارة مطاعم تشيكن هات. وصول آمن، بيانات لحظية، ورقابة شاملة على كافة الفروع والإدارات.
          </p>

          {/* بطاقات الأدوار */}
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((role) => (
              <div
                key={role.id}
                className="flex items-center gap-3 text-sm font-bold px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md text-white border border-white/20"
              >
                {getRoleIcon(role.id, "w-5 h-5 text-white/90")}
                <span>{role.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
        
        <div className="relative z-10">
          <p className="text-white/60 text-sm font-bold">© {new Date().getFullYear()} Chicken Hut Corporation. All rights reserved.</p>
        </div>
      </div>

      {/* ── الجانب الأيسر (نموذج الدخول) ── */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* زخرفة خلفية بسيطة */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-500/5 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-[460px] p-8 sm:p-12 rounded-[2rem] border border-gray-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-10"
        >
          {/* شعار الموبايل */}
          <div className="lg:hidden flex justify-center mb-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff6b00] shadow-lg shadow-orange-500/30">
                <ChefHat className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-black text-gray-900">
                Chicken Hut <span className="font-light text-[#ff6b00]">ERP</span>
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* ── شاشة اختيار الدور ── */}
            {!selectedRole ? (
              <motion.div
                key="role-select"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-8 text-center sm:text-right">
                  <h1 className="text-2xl font-black mb-2 text-gray-900">بوابة الدخول الرسمية</h1>
                  <p className="text-gray-500 text-sm font-bold">الرجاء اختيار الصلاحية الوظيفية للمتابعة</p>
                </div>

                <div className="space-y-3">
                  {ROLES.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => handleRoleSelect(role)}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-orange-50 hover:border-orange-200 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-600 group-hover:text-[#ff6b00] shadow-sm">
                          {getRoleIcon(role.id, "w-5 h-5")}
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-sm text-gray-900 group-hover:text-[#ff6b00]">{role.label}</p>
                          <p className="text-gray-500 text-xs font-bold">{role.sublabel}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#ff6b00] transition-colors" />
                    </button>
                  ))}
                </div>

                <div className="mt-8 p-4 rounded-xl bg-orange-50 border border-orange-100" dir="rtl">
                  <p className="text-xs text-orange-800 font-bold text-center flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    تم تأمين هذا النظام والمراقبة من قبل الإدارة العليا.
                  </p>
                </div>
              </motion.div>
            ) : (
              /* ── شاشة كلمة المرور ── */
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* زر العودة */}
                <button
                  onClick={() => { setSelectedRole(null); setError(""); }}
                  className="flex items-center gap-2 text-gray-500 hover:text-[#ff6b00] text-sm font-bold mb-8 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  العودة لاختيار الدور
                </button>

                {/* بادج الدور المختار */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 mb-8">
                  <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[#ff6b00] shadow-sm">
                    {getRoleIcon(selectedRole.id, "w-6 h-6")}
                  </div>
                  <div>
                    <p className="font-extrabold text-base text-gray-900">{selectedRole.label}</p>
                    <p className="text-gray-500 text-xs font-bold">{selectedRole.sublabel}</p>
                  </div>
                </div>

                <h1 className="text-2xl font-black mb-2 text-gray-900">مصادقة الدخول</h1>
                <p className="text-gray-500 text-sm font-bold mb-8">أدخل رمز المرور السري الخاص بك للمتابعة.</p>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="relative group">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 group-focus-within:text-[#ff6b00] transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(""); }}
                      placeholder="••••••••"
                      autoFocus
                      required
                      className="w-full bg-white border-2 border-gray-100 rounded-xl py-4 pl-12 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#ff6b00] hover:border-gray-200 transition-all font-mono tracking-widest text-lg text-center font-bold shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-red-600 text-sm font-bold bg-red-50 border border-red-100 px-4 py-3 rounded-xl"
                      >
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={isLoading || !password}
                    className="w-full relative overflow-hidden rounded-xl bg-[#ff6b00] hover:bg-[#e65c00] text-white font-bold py-4 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30"
                  >
                    <span className="text-[15px]">
                      {isLoading ? "جاري المصادقة..." : "تسجيل الدخول"}
                    </span>
                  </button>
                </form>

                {/* تلميح كلمة المرور (للتجربة فقط - احذفه في الإنتاج) */}
                <div className="mt-6 p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                  <p className="text-[11px] text-gray-500 font-mono text-center font-bold">
                    <span>DEMO PIN: </span>
                    <span className="text-gray-900">{selectedRole.password}</span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
