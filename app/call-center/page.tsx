"use client";
import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Search, ShoppingCart, Plus, Minus, Trash2, Send, CheckCircle2, Clock, MapPin, X, Package, LogOut, Bell, Headphones } from "lucide-react";
import { db } from "../../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { clearSession, getSession } from "../../lib/auth";
import { useRouter } from "next/navigation";

const BRANCHES = ["فرع وسط البلاد", "فرع الحدائق", "فرع فينيسيا"];

interface CartItem { id: number; name: string; price: number; category: string; image: string; quantity: number; }

export default function CallCenterPage() {
  const router = useRouter();
  const style = { fontFamily: "var(--font-cairo), sans-serif" };
  const [agentName, setAgentName] = useState("موظف مركز الاتصالات");

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace("/"); return; }
    if (session.employeeName) setAgentName(session.employeeName);
  }, [router]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0]);
  const [orderType, setOrderType] = useState<"توصيل" | "استلام من الفرع">("توصيل");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [activeTab, setActiveTab] = useState<"new-order" | "tracking">("new-order");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [existingCustomer, setExistingCustomer] = useState<any>(null);

  // البحث عن عميل عند تغيير رقم الهاتف
  const handlePhoneChange = async (phone: string) => {
    setCustomerPhone(phone);
    if (phone.length >= 7) {
      const found = await db.customers.where("phone").equals(phone).first();
      if (found) {
        setExistingCustomer(found);
        setCustomerName(found.name);
        if (found.address) setAddress(found.address);
        if (found.preferredBranch) setSelectedBranch(found.preferredBranch);
      } else {
        setExistingCustomer(null);
      }
    } else {
      setExistingCustomer(null);
    }
  };

  const allMenuItems = useLiveQuery(() => db.menuItems.filter(i => i.isAvailable).toArray()) || [];
  const ccOrders = useLiveQuery(() => db.callCenterOrders.orderBy("id").reverse().toArray()) || [];
  const myOrders = useMemo(() => ccOrders.filter(o => o.agentName === agentName), [ccOrders, agentName]);
  const newCount = myOrders.filter(o => o.status === "جديد").length;

  const categories = useMemo(() => {
    const cats = new Set(allMenuItems.map(i => i.category));
    return ["الكل", ...Array.from(cats)];
  }, [allMenuItems]);

  const filteredMenu = useMemo(() =>
    allMenuItems.filter(p =>
      (activeCategory === "الكل" || p.category === activeCategory) &&
      (searchQuery === "" || p.name.includes(searchQuery))
    ), [allMenuItems, activeCategory, searchQuery]);

  const totalAmount = useMemo(() => cartItems.reduce((s, i) => s + i.price * i.quantity, 0), [cartItems]);

  const addToCart = (p: any) => {
    setCartItems(prev => {
      const found = prev.find(i => i.id === p.id);
      if (found) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: p.id as number, name: p.name, price: p.price, category: p.category, image: p.image, quantity: 1 }];
    });
  };
  const changeQty = (id: number, d: number) => setCartItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i));
  const removeFromCart = (id: number) => setCartItems(prev => prev.filter(i => i.id !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    setSubmitting(true);
    const now = new Date().toISOString();
    const count = await db.callCenterOrders.count();
    const orderNumber = `CC-${String(count + 1).padStart(4, "0")}`;
    await db.callCenterOrders.add({
      orderNumber, customerName, customerPhone, targetBranch: selectedBranch, orderType,
      address: orderType === "توصيل" ? address : undefined,
      items: cartItems, totalAmount, notes: notes || undefined,
      status: "جديد", agentName, createdAt: now,
    });
    // ── حفظ / تحديث بيانات العميل ──
    const existing = await db.customers.where("phone").equals(customerPhone).first();
    if (existing && existing.id) {
      await db.customers.update(existing.id, {
        name: customerName,
        address: orderType === "توصيل" ? address : existing.address,
        preferredBranch: selectedBranch,
        totalOrders: (existing.totalOrders || 0) + 1,
        lastOrderAt: now,
      });
    } else {
      await db.customers.add({
        name: customerName,
        phone: customerPhone,
        address: orderType === "توصيل" ? address : undefined,
        preferredBranch: selectedBranch,
        totalOrders: 1,
        lastOrderAt: now,
        createdAt: now,
      });
    }
    setSuccessMsg(`✓ تم إرسال ${orderNumber} إلى ${selectedBranch}`);
    setCartItems([]); setCustomerName(""); setCustomerPhone(""); setAddress(""); setNotes(""); setExistingCustomer(null);
    setSubmitting(false); setActiveTab("tracking");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const statusColor: Record<string, string> = {
    "جديد": "bg-blue-50 text-blue-600 border-blue-200",
    "موافق عليه": "bg-green-50 text-green-600 border-green-200",
    "مرفوض": "bg-red-50 text-red-500 border-red-200",
    "مكتمل": "bg-gray-100 text-gray-500 border-gray-200",
  };

  return (
    <div className="flex h-screen w-full bg-[#f8f9fd] text-gray-800 overflow-hidden" dir="rtl" style={style}>
      {/* Sidebar */}
      <aside className="w-60 bg-white border-l border-gray-100 flex flex-col justify-between py-6 px-4 shadow-[-2px_0_20px_rgba(0,0,0,0.04)] z-10 shrink-0 h-full">
        <div>
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#ff6b00] to-[#ff985c] flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 block leading-none">تشيكن هات</span>
              <span className="text-[10px] text-gray-400 font-medium">مركز الاتصالات</span>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ff6b00] flex items-center justify-center">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none mb-0.5">{agentName}</p>
              <p className="text-xs text-orange-500 font-semibold">مركز الاتصالات</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-bold text-gray-400 mb-3 px-3 tracking-widest uppercase">القائمة</p>
            {[{ id: "new-order", label: "طلب جديد", icon: <Phone className="w-5 h-5" /> },
              { id: "tracking", label: `متابعة الطلبات${newCount > 0 ? ` (${newCount})` : ""}`, icon: <Clock className="w-5 h-5" /> }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${activeTab === tab.id ? "bg-[#fff0e6] text-[#ff6b00] font-semibold" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium"}`}>
                <span className={activeTab === tab.id ? "text-[#ff6b00]" : "text-gray-400"}>{tab.icon}</span>
                <span className="text-sm">{tab.label}</span>
                {tab.id === "tracking" && newCount > 0 && (
                  <span className="mr-auto bg-[#ff6b00] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{newCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => { clearSession(); router.replace("/"); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-all font-semibold text-sm">
          <LogOut className="w-5 h-5" /> تسجيل الخروج
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-14 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between border-b border-gray-100 z-10 shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400 font-medium">تشيكن هات</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-bold">{activeTab === "new-order" ? "طلب جديد" : "متابعة الطلبات"}</span>
          </div>
          <div className="flex items-center gap-3">
            {successMsg && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> {successMsg}
              </motion.div>
            )}
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-full px-3 py-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-600 font-bold">متصل</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex">

          {/* ── New Order Tab ── */}
          {activeTab === "new-order" && (
            <>
              {/* Menu */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-5 pb-3 border-b border-gray-100 bg-white space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="ابحث في القائمة..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-9 pl-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#ff6b00] font-medium" />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {categories.map(cat => (
                      <button key={cat} onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat ? "bg-[#ff6b00] text-white" : "bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-[#ff6b00]"}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredMenu.map(p => {
                    const inCart = cartItems.some(i => i.id === p.id);
                    return (
                      <button key={p.id} onClick={() => addToCart(p)}
                        className={`bg-white rounded-3xl p-3 border-2 transition-all text-right group relative ${inCart ? "border-[#ff6b00]/40 shadow-lg shadow-orange-100" : "border-transparent shadow-sm hover:shadow-md hover:border-orange-100"}`}>
                        <div className="h-28 w-full rounded-2xl mb-3 overflow-hidden bg-gray-50 flex items-center justify-center">
                          {typeof p.image === "string" && p.image.length <= 4
                            ? <span className="text-4xl">{p.image}</span>
                            : <img src={p.image} alt={p.name} className="w-full h-full object-cover" />}
                          {inCart && <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[#ff6b00] flex items-center justify-center border-2 border-white shadow"><CheckCircle2 className="w-3 h-3 text-white" /></div>}
                        </div>
                        <h3 className="text-xs font-extrabold text-gray-900 mb-1 line-clamp-2">{p.name}</h3>
                        <span className="text-[#ff6b00] font-extrabold text-sm">{p.price} د.ل</span>
                      </button>
                    );
                  })}
                  {filteredMenu.length === 0 && (
                    <div className="col-span-4 text-center py-16 text-gray-300">
                      <Package className="w-12 h-12 mx-auto mb-3" /><p>لا توجد منتجات</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Form + Cart */}
              <aside className="w-80 bg-white border-r border-gray-100 flex flex-col shadow-[2px_0_20px_rgba(0,0,0,0.04)] z-10 shrink-0 h-full">
                <div className="p-5 border-b border-gray-50">
                  <h2 className="text-lg font-bold text-gray-900">طلب جديد</h2>
                </div>

                {/* Customer info */}
                <div className="px-5 py-4 border-b border-gray-50 space-y-3">
                  {/* رقم الهاتف - يبحث تلقائياً */}
                  <div className="relative">
                    <input value={customerPhone} onChange={e => handlePhoneChange(e.target.value)}
                      placeholder="رقم الهاتف *" type="tel" dir="ltr"
                      className={`w-full bg-gray-50 border rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#ff6b00] ${existingCustomer ? "border-green-400 bg-green-50" : "border-gray-100"}`} />
                    {existingCustomer && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> عميل معروف · {existingCustomer.totalOrders} طلب
                      </div>
                    )}
                  </div>
                  <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                    placeholder="اسم العميل *"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#ff6b00]" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-2 py-2 text-xs text-gray-900 outline-none focus:border-[#ff6b00] font-bold">
                      {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <select value={orderType} onChange={e => setOrderType(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-2 py-2 text-xs text-gray-900 outline-none focus:border-[#ff6b00] font-bold">
                      {["توصيل", "استلام من الفرع"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  {orderType === "توصيل" && (
                    <input value={address} onChange={e => setAddress(e.target.value)}
                      placeholder="عنوان التوصيل *"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#ff6b00]" />
                  )}
                  <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#ff6b00]" />
                </div>

                {/* Cart items */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {cartItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-3 py-12">
                      <ShoppingCart className="w-14 h-14" /><p className="text-sm font-medium">لم تضف أي منتج بعد</p>
                    </div>
                  ) : cartItems.map(item => (
                    <div key={item.id} className="flex gap-3 items-center bg-gray-50 rounded-xl p-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-orange-500 font-semibold">{(item.price * item.quantity).toFixed(2)} د.ل</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => changeQty(item.id, -1)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 text-[#ff6b00] flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                        <span className="text-xs font-bold text-gray-900 w-4 text-center">{item.quantity}</span>
                        <button onClick={() => changeQty(item.id, 1)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 text-[#ff6b00] flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                        <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded-lg text-gray-300 hover:text-red-400 transition"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit */}
                <div className="p-5 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-gray-900">الإجمالي</span>
                    <span className="text-xl font-bold text-[#ff6b00]">{totalAmount.toFixed(2)} د.ل</span>
                  </div>
                  <form onSubmit={handleSubmit}>
                    <button type="submit"
                      disabled={cartItems.length === 0 || !customerName || !customerPhone || submitting || (orderType === "توصيل" && !address)}
                      className="w-full bg-[#ff6b00] hover:bg-[#e66000] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-orange-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]">
                      <Send className="w-5 h-5" />
                      {submitting ? "جاري الإرسال..." : `إرسال إلى ${selectedBranch}`}
                    </button>
                  </form>
                </div>
              </aside>
            </>
          )}

          {/* ── Tracking Tab ── */}
          {activeTab === "tracking" && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900">طلباتي</h2>
                <div className="flex gap-2">
                  <span className="bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold px-3 py-1 rounded-full">{myOrders.filter(o => o.status === "جديد").length} في الانتظار</span>
                  <span className="bg-green-50 border border-green-100 text-green-600 text-xs font-bold px-3 py-1 rounded-full">{myOrders.filter(o => o.status === "موافق عليه").length} مقبول</span>
                </div>
              </div>

              {myOrders.length === 0 ? (
                <div className="text-center py-24 text-gray-300">
                  <Phone className="w-16 h-16 mx-auto mb-4" strokeWidth={1} />
                  <p className="text-lg font-medium">لا توجد طلبات بعد</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {myOrders.map(order => (
                    <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-xs font-extrabold text-[#ff6b00]">{order.orderNumber}</p>
                          <p className="text-base font-extrabold text-gray-900 mt-0.5">{order.customerName}</p>
                          <p className="text-xs text-gray-400 font-medium">{new Date(order.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusColor[order.status] || ""}`}>{order.status}</span>
                      </div>

                      <div className="space-y-1.5 mb-3 text-xs text-gray-500">
                        <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#ff6b00]" /><span dir="ltr">{order.customerPhone}</span></div>
                        <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400" /><span>{order.targetBranch} — {order.orderType}</span></div>
                        {order.address && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-red-400" /><span>{order.address}</span></div>}
                      </div>

                      <div className="bg-gray-50 rounded-2xl p-3 text-xs">
                        {(order.items as any[]).map((item: any, i: number) => (
                          <div key={i} className="flex justify-between py-0.5 text-gray-600">
                            <span>{item.name} × {item.quantity}</span>
                            <span className="font-bold text-[#ff6b00]">{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-extrabold text-gray-900">
                          <span>الإجمالي</span>
                          <span className="text-[#ff6b00]">{order.totalAmount.toFixed(2)} د.ل</span>
                        </div>
                      </div>

                      {order.approvedBy && (
                        <p className="text-green-600 text-xs font-bold mt-2 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> وافق عليه: {order.approvedBy}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
