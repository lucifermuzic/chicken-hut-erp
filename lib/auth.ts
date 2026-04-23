// ─── مركز إدارة الأدوار والبيانات الأمنية ───────────────────────
// ⚠️ في بيئة الإنتاج يجب نقل كلمات المرور والـ PINs إلى قاعدة بيانات server-side
// ولا تُخزَّن أبداً في كود العميل (client-side).

export interface RoleConfig {
  id: string;
  label: string;
  sublabel: string;
  route: string;
  password: string;
  color: string;
  bgColor: string;
  icon: string;
}

export const ROLES: RoleConfig[] = [
  {
    id: "ceo",
    label: "المدير العام",
    sublabel: "CEO / Director",
    route: "/ceo",
    password: "ceo@2026",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10 border-indigo-500/20",
    icon: "🏛️",
  },
  {
    id: "branch-manager",
    label: "مدير الفرع",
    sublabel: "Branch Manager",
    route: "/branch-manager",
    password: "manager@2026",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10 border-orange-500/20",
    icon: "🏪",
  },
  {
    id: "storekeeper",
    label: "أمين المخزن",
    sublabel: "Storekeeper",
    route: "/storekeeper",
    password: "store@2026",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    icon: "📦",
  },
  {
    id: "treasury",
    label: "المحاسب / الخزينة",
    sublabel: "Accountant / CFO",
    route: "/treasury",
    password: "treasury@2026",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
    icon: "💰",
  },
  {
    id: "cashier",
    label: "الكاشير",
    sublabel: "POS Cashier",
    route: "/cashier",
    password: "cashier@2026",
    color: "text-zinc-300",
    bgColor: "bg-zinc-500/10 border-zinc-500/20",
    icon: "🖥️",
  },
];

// PINs العملياتية داخل النظام (مركزية لتسهيل التعديل)
// يمكن تجاوزها عبر متغيرات البيئة NEXT_PUBLIC_*
export const OPERATION_PINS = {
  MANAGER:    process.env.NEXT_PUBLIC_MANAGER_PIN    ?? "1234",
  TREASURER:  process.env.NEXT_PUBLIC_TREASURER_PIN  ?? "9999",
  SUPERVISOR: process.env.NEXT_PUBLIC_SUPERVISOR_PIN ?? "5555",
} as const;

// ─── إدارة جلسة المستخدم عبر localStorage ───────────────────────
export const AUTH_SESSION_KEY = "chk_erp_session";

export interface UserSession {
  roleId: string;
  role: RoleConfig;
  loginTime: number;
}

export function getSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const session: UserSession = JSON.parse(raw);
    // انتهاء الجلسة تلقائياً بعد 8 ساعات
    if (Date.now() - session.loginTime > 8 * 60 * 60 * 1000) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(role: RoleConfig): void {
  const session: UserSession = { roleId: role.id, role, loginTime: Date.now() };
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
}
