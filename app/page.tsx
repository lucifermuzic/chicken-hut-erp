"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight, ChefHat, ChevronRight, Eye, EyeOff, AlertCircle } from "lucide-react";
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
        // التحقق من أن الموظف يحاول الدخول للواجهة المخصصة له
        const isCashierMatch = selectedRole.id === "cashier" && employee.role === "كاشير";
        const isManagerMatch = selectedRole.id === "branch-manager" && employee.role === "مدير فرع";

        if (isCashierMatch || isManagerMatch) {
          // حفظ الجلسة مع بيانات الموظف
          saveSession({ 
            ...selectedRole, 
            employeeId: employee.id, 
            employeeName: employee.name, 
            branch: employee.branch 
          } as any);
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

  return (
    <div className="flex min-h-screen w-full bg-[#0a0a0a] text-white" dir="rtl">

      {/* ── الجانب الأيسر (زخرفي) ── */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex flex-col justify-between p-16">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0a0a0a]/90 to-orange-950/80 -z-10" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-orange-500/10 -z-10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-amber-600/10 -z-10 blur-3xl" />

        {/* الشعار */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-4 relative z-10"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-[0_0_30px_rgba(249,115,22,0.3)]">
            <ChefHat className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-3xl font-bold tracking-tight">
            Chicken Hut <span className="font-light text-orange-400">ERP</span>
          </span>
        </motion.div>

        {/* محتوى تعريفي */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 max-w-lg mb-10"
        >
          <h2 className="text-4xl font-bold leading-[1.3] mb-6">
            إدارة سلسلتك الغذائية <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              بكفاءة واحترافية عالية
            </span>
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed mb-10">
            النظام المتكامل لإدارة مطاعم تشيكن هات. تابع المبيعات، راقب المخزون،
            وأدر الموارد البشرية من شاشة واحدة بكل سهولة.
          </p>

          {/* بطاقات الأدوار */}
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((role) => (
              <div
                key={role.id}
                className={`flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-xl border backdrop-blur-md ${role.bgColor}`}
              >
                <span className="text-base">{role.icon}</span>
                <span className={role.color}>{role.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── الجانب الأيمن (نموذج الدخول) ── */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-[460px] p-8 sm:p-10 rounded-[2.5rem] border border-white/[0.08] bg-[#111111]/80 backdrop-blur-2xl shadow-2xl"
        >
          {/* شعار الموبايل */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                <ChefHat className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-bold text-white">
                Chicken Hut <span className="font-light text-orange-400">ERP</span>
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
                <div className="mb-8">
                  <h1 className="text-2xl font-bold mb-2 text-white">اختر دورك الوظيفي</h1>
                  <p className="text-zinc-400 text-sm">حدد واجهتك للوصول إلى النظام المناسب لك.</p>
                </div>

                <div className="space-y-2.5">
                  {ROLES.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => handleRoleSelect(role)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all hover:scale-[1.01] active:scale-[0.99] ${role.bgColor} hover:border-white/20 group`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{role.icon}</span>
                        <div className="text-right">
                          <p className={`font-bold text-sm ${role.color}`}>{role.label}</p>
                          <p className="text-zinc-500 text-xs">{role.sublabel}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors rotate-180" />
                    </button>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-xl border border-white/5 bg-white/[0.02]" dir="rtl">
                  <p className="text-xs text-zinc-600 text-center flex items-center justify-center gap-2">
                    <Lock className="w-3 h-3" />
                    هذا النظام مخصص لموظفي ومدراء تشيكن هات فقط.
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
                  className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium mb-6 transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  العودة لاختيار الدور
                </button>

                {/* بادج الدور المختار */}
                <div className={`flex items-center gap-3 p-4 rounded-2xl border mb-6 ${selectedRole.bgColor}`}>
                  <span className="text-2xl">{selectedRole.icon}</span>
                  <div>
                    <p className={`font-bold text-sm ${selectedRole.color}`}>{selectedRole.label}</p>
                    <p className="text-zinc-500 text-xs">{selectedRole.sublabel}</p>
                  </div>
                </div>

                <h1 className="text-2xl font-bold mb-1 text-white">كلمة المرور</h1>
                <p className="text-zinc-400 text-sm mb-6">أدخل كلمة مرورك للدخول إلى لوحتك.</p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-zinc-500 group-focus-within:text-orange-400 transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(""); }}
                      placeholder="••••••••"
                      autoFocus
                      required
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 hover:border-white/20 transition-all font-mono tracking-widest text-lg text-right"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-red-400 text-sm font-medium bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={isLoading || !password}
                    className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-4 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(249,115,22,0.2)] hover:shadow-[0_0_40px_rgba(249,115,22,0.4)]"
                  >
                    <span className="relative z-10 text-[15px]">
                      {isLoading ? "جاري التحقق..." : "دخول إلى النظام"}
                    </span>
                    {!isLoading && (
                      <ArrowRight className="w-5 h-5 relative z-10 group-hover:-translate-x-1 transition-transform rotate-180" />
                    )}
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity z-0" />
                  </button>
                </form>

                {/* تلميح كلمة المرور (للتجربة فقط - احذفه في الإنتاج) */}
                <div className="mt-4 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                  <p className="text-[10px] text-zinc-600 font-mono text-center">
                    <span className="text-zinc-500">Demo: </span>
                    {selectedRole.password}
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
