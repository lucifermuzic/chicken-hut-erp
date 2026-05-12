"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type ManufacturedProduct, type ProductionBatch, type OperationalStockItem } from "@/lib/db";
import { Factory, FlaskConical, Beaker, CheckCircle2, ArrowDownUp, AlertCircle, Plus, Search, Layers, Clock } from "lucide-react";

export function ManufacturingModuleView({ showSuccess }: { showSuccess: (m: string) => void }) {
  const [activeTab, setActiveTab] = useState<"recipes" | "production" | "operational_stock" | "meals">("recipes");

  const products = useLiveQuery(() => db.manufacturedProducts.toArray()) || [];
  const batches = useLiveQuery(() => db.productionBatches.toArray()) || [];
  const opStock = useLiveQuery(() => db.operationalStock.toArray()) || [];
  const mainInventory = useLiveQuery(() => db.inventory.toArray()) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: "recipes", label: "وصفات المنتجات الوسيطة (BOM)", icon: FlaskConical },
          { id: "production", label: "أوامر التشغيل والإنتاج", icon: Factory },
          { id: "operational_stock", label: "المخزن التشغيلي (الجاهز)", icon: Layers },
          { id: "meals", label: "استوديو الوجبات النهائية", icon: Beaker },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all font-bold text-sm ${
              activeTab === tab.id
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        {activeTab === "recipes" && (
          <RecipesManagementView products={products} mainInventory={mainInventory} showSuccess={showSuccess} />
        )}
        {activeTab === "production" && (
          <ProductionBatchesView batches={batches} products={products} mainInventory={mainInventory} showSuccess={showSuccess} />
        )}
        {activeTab === "operational_stock" && (
          <OperationalStockView opStock={opStock} />
        )}
        {activeTab === "meals" && (
          <MealStudioView showSuccess={showSuccess} />
        )}
      </div>
    </div>
  );
}

// ─── 1. إدارة وصفات المنتجات (Recipes / BOM) ───────────────────
function RecipesManagementView({ products, mainInventory, showSuccess }: { products: ManufacturedProduct[], mainInventory: any[], showSuccess: any }) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("صوصات");
  const [outputUnit, setOutputUnit] = useState("كيلو");
  const [outputQtyPerBatch, setOutputQtyPerBatch] = useState(1);
  const [ingredients, setIngredients] = useState<any[]>([]);

  const [selInvId, setSelInvId] = useState("");
  const [selQty, setSelQty] = useState("");
  const [selUnit, setSelUnit] = useState("");

  const addIngredient = () => {
    const item = mainInventory.find(i => i.id === Number(selInvId));
    const qty = parseFloat(selQty);
    if (!item || !qty) return;

    let finalUnit = selUnit || item.unit;
    let finalCostPerUnit = item.avgPrice;

    if (item.unit === "كيلو" && finalUnit === "جرام") finalCostPerUnit = item.avgPrice / 1000;
    else if (item.unit === "لتر" && finalUnit === "مل") finalCostPerUnit = item.avgPrice / 1000;

    setIngredients([...ingredients, { inventoryItemId: item.id, name: item.name, qty, unit: finalUnit, costPerUnit: finalCostPerUnit }]);
    setSelInvId(""); setSelQty(""); setSelUnit("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || ingredients.length === 0) {
      alert("يرجى إدخال اسم المنتج وإضافة مكون واحد على الأقل.");
      return;
    }
    
    await db.manufacturedProducts.add({
      name, category, outputUnit, outputQtyPerBatch, ingredients, createdAt: new Date().toISOString()
    });

    showSuccess(`تم حفظ وصفة ${name} بنجاح.`);
    setIsAdding(false);
    setName(""); setIngredients([]); setOutputQtyPerBatch(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2"><FlaskConical className="w-6 h-6 text-purple-500" /> المنتجات الوسيطة (BOM)</h3>
          <p className="text-sm text-gray-500 font-medium">تعريف المنتجات التي تُصنع داخل المطعم قبل إضافتها للوجبات (مثل: الكول سلو، الثومية).</p>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-purple-500/20">
            <Plus className="w-5 h-5" /> إضافة وصفة جديدة
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSave} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
          <h4 className="font-extrabold text-gray-900 border-b border-gray-100 pb-3">تعريف منتج وسيط جديد</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500 block mb-2">اسم المنتج المصنع</label>
              <input required value={name} onChange={e => setName(e.target.value)} placeholder="مثال: سلطة كول سلو" className="w-full bg-[#f8f9fd] border border-gray-200 focus:border-purple-500 rounded-xl px-4 py-3 text-gray-900 outline-none font-bold" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-2">الفئة</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[#f8f9fd] border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none font-bold">
                <option value="سلطات">سلطات</option>
                <option value="صوصات">صوصات</option>
                <option value="مخبوزات داخلية">مخبوزات داخلية</option>
                <option value="تجهيز لحوم">تجهيز لحوم ومتبلات</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-2">وحدة القياس للمنتج النهائي</label>
              <select value={outputUnit} onChange={e => setOutputUnit(e.target.value)} className="w-full bg-[#f8f9fd] border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none font-bold">
                <option value="كيلو">كيلو (Kg)</option>
                <option value="لتر">لتر (L)</option>
                <option value="قطعة">قطعة (Pcs)</option>
                <option value="وجبة">وجبة تجهيز</option>
              </select>
            </div>
          </div>

          <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5">
            <h5 className="text-sm font-bold text-purple-900 mb-4 flex items-center gap-2"><Beaker className="w-4 h-4" /> المكونات المسحوبة من المخزن الرئيسي للدفعة الواحدة (الطبخة)</h5>
            <div className="flex gap-3 mb-4">
              <select value={selInvId} onChange={e => {
                setSelInvId(e.target.value);
                const item = mainInventory.find(i => i.id === Number(e.target.value));
                if (item) setSelUnit(item.unit === "كيلو" ? "جرام" : item.unit === "لتر" ? "مل" : item.unit);
              }} className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none text-sm font-bold">
                <option value="">-- اختر مادة خام --</option>
                {mainInventory.map(inv => <option key={inv.id} value={inv.id}>{inv.name} ({inv.qty} {inv.unit} متاح)</option>)}
              </select>
              <input type="number" step="any" value={selQty} onChange={e => setSelQty(e.target.value)} placeholder="الكمية" className="w-24 bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none font-mono text-center" />
              <select value={selUnit} onChange={e => setSelUnit(e.target.value)} className="w-24 bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none font-bold">
                 {selInvId && (() => {
                  const item = mainInventory.find(i => i.id === Number(selInvId));
                  if (!item) return <option value="">الوحدة</option>;
                  if (item.unit === "كيلو") return <><option value="جرام">جرام</option><option value="كيلو">كيلو</option></>;
                  if (item.unit === "لتر") return <><option value="مل">مل</option><option value="لتر">لتر</option></>;
                  return <option value={item.unit}>{item.unit}</option>;
                })()}
                {!selInvId && <option value="">الوحدة</option>}
              </select>
              <button type="button" onClick={addIngredient} className="bg-gray-900 hover:bg-black text-white px-6 rounded-xl font-bold text-sm transition">إضافة</button>
            </div>

            {ingredients.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-4">
                <table className="w-full text-right text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr><th className="p-3 text-gray-500">المادة</th><th className="p-3 text-gray-500">الكمية لكل دفعة</th><th className="p-3"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ingredients.map((ing, i) => (
                      <tr key={i}>
                        <td className="p-3 font-bold text-gray-900">{ing.name}</td>
                        <td className="p-3 font-mono text-gray-600">{ing.qty} {ing.unit}</td>
                        <td className="p-3 text-left"><button type="button" onClick={() => setIngredients(ingredients.filter((_, idx) => idx !== i))} className="text-red-500 font-bold hover:bg-red-50 px-3 py-1 rounded">حذف</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition">إلغاء</button>
            <button type="submit" className="bg-purple-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-purple-500/30">حفظ المنتج بكتيب الوصفات</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(p => {
          const totalBaseCost = p.ingredients.reduce((acc, ing) => acc + (ing.qty * ing.costPerUnit), 0);
          return (
            <div key={p.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1 h-full bg-purple-500"></div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-extrabold text-gray-900">{p.name}</h4>
                  <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md font-bold mt-1 inline-block">{p.category}</span>
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-gray-400 font-bold mb-1">وحدة التخزين</p>
                  <p className="font-bold text-gray-900 bg-[#f8f9fd] px-2 py-1 rounded text-xs">{p.outputUnit}</p>
                </div>
              </div>
              <div className="bg-[#f8f9fd] rounded-xl p-4 mb-4 flex-1">
                <p className="text-xs font-bold text-gray-500 mb-2 border-b border-gray-200 pb-2">المكونات المسحوبة من الرئيسي:</p>
                <ul className="space-y-1.5 text-xs">
                  {p.ingredients.map((ing, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span className="text-gray-700 font-bold">{ing.name}</span>
                      <span className="font-mono text-gray-500">{ing.qty} {ing.unit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-400">التكلفة التقديرية للوحدة</span>
                <span className="font-mono text-orange-500 font-extrabold">{totalBaseCost.toFixed(2)} د.ل</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 2. أوامر التشغيل (Production Batches) ───────────────────────
function ProductionBatchesView({ batches, products, mainInventory, showSuccess }: any) {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [batchCount, setBatchCount] = useState("");

  const handleProduce = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p:any) => p.id === Number(selectedProduct));
    const count = Number(batchCount);
    if (!product || count <= 0) return;

    // Check inventory availability
    for (const ing of product.ingredients) {
      const invItem = mainInventory.find((i:any) => i.id === ing.inventoryItemId);
      if (!invItem) {
         alert(`الصنف الخام ${ing.name} غير موجود في المخزن الرئيسي!`);
         return;
      }
      
      let qtyNeededInMainUnit = ing.qty * count;
      if (invItem.unit === "كيلو" && ing.unit === "جرام") qtyNeededInMainUnit = (ing.qty * count) / 1000;
      else if (invItem.unit === "لتر" && ing.unit === "مل") qtyNeededInMainUnit = (ing.qty * count) / 1000;

      if (invItem.qty < qtyNeededInMainUnit) {
        alert(`لا توجد كمية كافية من ${ing.name} في المخزن الرئيسي. المطلوب: ${qtyNeededInMainUnit} ${invItem.unit} ، المتوفر: ${invItem.qty} ${invItem.unit}`);
        return;
      }
    }

    // Process Deduction from Main Inventory
    let totalCost = 0;
    const consumed = [];
    for (const ing of product.ingredients) {
      const invItem = mainInventory.find((i:any) => i.id === ing.inventoryItemId);
      
      let qtyNeededInMainUnit = ing.qty * count;
      if (invItem.unit === "كيلو" && ing.unit === "جرام") qtyNeededInMainUnit = (ing.qty * count) / 1000;
      else if (invItem.unit === "لتر" && ing.unit === "مل") qtyNeededInMainUnit = (ing.qty * count) / 1000;

      await db.inventory.update(invItem.id, { qty: invItem.qty - qtyNeededInMainUnit });
      
      const costForThisIngredient = qtyNeededInMainUnit * invItem.avgPrice;
      totalCost += costForThisIngredient;
      
      consumed.push({
        inventoryItemId: invItem.id,
        name: invItem.name,
        qtyConsumed: qtyNeededInMainUnit,
        unit: invItem.unit
      });
    }

    const outputQty = product.outputQtyPerBatch * count;
    
    // Create Production Batch Record
    const batchIdCount = await db.productionBatches.count();
    const bNumber = `PB-${String(batchIdCount + 1).padStart(4, "0")}`;
    
    await db.productionBatches.add({
      batchNumber: bNumber,
      productId: product.id,
      productName: product.name,
      batchCount: count,
      outputQty,
      outputUnit: product.outputUnit,
      totalCost,
      consumedIngredients: consumed,
      status: "مكتمل",
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    });

    // Add to Operational Stock
    const existingOpStock = await db.operationalStock.where('productId').equals(product.id).first();
    const unitCost = totalCost / outputQty;

    if (existingOpStock) {
      const oldTotalValue = existingOpStock.qty * existingOpStock.avgCost;
      const newQty = existingOpStock.qty + outputQty;
      const newAvgCost = (oldTotalValue + totalCost) / newQty;

      await db.operationalStock.update(existingOpStock.id!, {
        qty: newQty,
        avgCost: newAvgCost,
        lastUpdated: new Date().toISOString()
      });
    } else {
      await db.operationalStock.add({
        productId: product.id,
        productName: product.name,
        category: product.category,
        qty: outputQty,
        unit: product.outputUnit,
        avgCost: unitCost,
        lastUpdated: new Date().toISOString()
      });
    }

    showSuccess(`تم تشغيل ${count} دفعات من ${product.name} بنجاح وتحويلها للمخزن التشغيلي.`);
    setSelectedProduct("");
    setBatchCount("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm h-fit">
        <h3 className="text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2"><Factory className="w-5 h-5 text-purple-500" /> تنفيذ أمر تشغيل جديد</h3>
        <p className="text-xs text-gray-500 mb-6 font-bold leading-relaxed">حدد المنتج المطلوب تجهيزه لتتم عملية السحب التلقائي من المخزن الرئيسي وإضافته للتشغيلي.</p>
        
        <form onSubmit={handleProduce} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-2">المنتج المراد تصنيعه</label>
            <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} required className="w-full bg-[#f8f9fd] border-2 border-gray-100 focus:border-purple-500 rounded-xl px-4 py-3 outline-none font-bold text-gray-900">
              <option value="">اختار المنتج (الوصفة)...</option>
              {products.map((p:any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-2">عدد الدفعات (الطبخات)</label>
            <input type="number" min="1" step="0.5" value={batchCount} onChange={e => setBatchCount(e.target.value)} required placeholder="1" className="w-full bg-[#f8f9fd] border-2 border-gray-100 focus:border-purple-500 rounded-xl px-4 py-3 outline-none font-mono text-center text-xl text-gray-900" />
            {selectedProduct && batchCount && (
              <p className="text-[10px] text-green-600 font-bold mt-2 bg-green-50 p-2 rounded-lg text-center">
                الكمية الناتجة: <span className="font-mono text-sm">{(Number(batchCount) * products.find((p:any)=>p.id===Number(selectedProduct))?.outputQtyPerBatch).toFixed(2)} {products.find((p:any)=>p.id===Number(selectedProduct))?.outputUnit}</span>
              </p>
            )}
          </div>
          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 mt-4">
            <ArrowDownUp className="w-5 h-5" /> تنفيذ أمر التشغيل والنقل
          </button>
        </form>
      </div>

      <div className="lg:col-span-8 bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-50 bg-[#f8f9fd]/50 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-gray-900">سجل أوامر التشغيل (الإنتاج) السابقة</h3>
          <span className="text-xs font-bold text-gray-400">{batches.length} عمليات</span>
        </div>
        <table className="w-full text-right">
          <thead>
            <tr className="bg-white border-b border-gray-100">
              <th className="px-5 py-3 text-xs font-bold text-gray-400">رقم الأمر</th>
              <th className="px-5 py-3 text-xs font-bold text-gray-400">المنتج</th>
              <th className="px-5 py-3 text-xs font-bold text-gray-400 text-center">الكمية المنتجة</th>
              <th className="px-5 py-3 text-xs font-bold text-gray-400 text-center">التكلفة الإجمالية</th>
              <th className="px-5 py-3 text-xs font-bold text-gray-400 text-center">التاريخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {batches.slice().reverse().map((b:any) => (
              <tr key={b.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-4 font-mono text-xs text-purple-600 font-bold">{b.batchNumber}</td>
                <td className="px-5 py-4 font-extrabold text-sm text-gray-900">{b.productName}</td>
                <td className="px-5 py-4 text-center font-mono font-bold text-gray-700">{b.outputQty} <span className="text-[10px] font-sans text-gray-500">{b.outputUnit}</span></td>
                <td className="px-5 py-4 text-center font-mono font-bold text-orange-500">{b.totalCost.toFixed(2)} د.ل</td>
                <td className="px-5 py-4 text-center text-[10px] text-gray-400 font-bold">{new Date(b.createdAt).toLocaleDateString()} {new Date(b.createdAt).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {batches.length === 0 && (
          <div className="p-12 text-center text-gray-400 font-bold">لا توجد عمليات تشغيل سابقة.</div>
        )}
      </div>
    </div>
  );
}

// ─── 3. المخزن التشغيلي (Operational Stock) ───────────────────────
function OperationalStockView({ opStock }: { opStock: OperationalStockItem[] }) {
  const totalValue = opStock.reduce((acc, item) => acc + (item.qty * item.avgCost), 0);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-50 border border-purple-100 text-purple-500 rounded-2xl flex items-center justify-center">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-500 font-bold text-xs mb-1">إجمالي قيمة المواد في المخزن التشغيلي</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 font-mono tracking-tight">{totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              <span className="text-base font-bold text-purple-500">د.ل</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {opStock.map(item => (
          <div key={item.id} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-extrabold text-gray-900 text-base">{item.productName}</h4>
              <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded font-bold">{item.category}</span>
            </div>
            
            <div className="bg-[#f8f9fd] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-end border-b border-gray-200 pb-3">
                <span className="text-xs font-bold text-gray-500">الكمية الجاهزة</span>
                <span className="text-xl font-mono font-black text-gray-900">{item.qty.toFixed(2)} <span className="text-[10px] font-sans text-gray-500">{item.unit}</span></span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-500">متوسط تكلفة الوحدة</span>
                <span className="font-mono font-bold text-orange-500">{item.avgCost.toFixed(3)} د.ل</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-400">
                <span>تاريخ آخر حركة</span>
                <span className="font-mono">{new Date(item.lastUpdated).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
        {opStock.length === 0 && (
          <div className="col-span-full bg-white border border-gray-100 rounded-3xl p-12 text-center">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-bold">المخزن التشغيلي فارغ. قم بإنشاء أوامر تشغيل لإضافة منتجات جاهزة.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 4. استوديو الوجبات النهائية ───────────────────────
function MealStudioView({ showSuccess }: { showSuccess: (msg: string) => void }) {
  const menuItems = useLiveQuery(() => db.menuItems.toArray()) ?? [];
  const rawInventory = useLiveQuery(() => db.inventory.toArray()) ?? [];
  const opStock = useLiveQuery(() => db.operationalStock.toArray()) ?? [];
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: "", category: "الطبق الرئيسي", price: 0, image: "🍔" });
  const [ingredients, setIngredients] = useState<{ type: 'raw'|'op'; itemId: number; qty: number; unit: string; costPerUnit: number; name: string }[]>([]);

  const handleAddIngredient = (type: 'raw'|'op') => {
    setIngredients([...ingredients, { type, itemId: 0, qty: 1, unit: "", costPerUnit: 0, name: "" }]);
  };

  const handleIngredientChange = (index: number, field: string, value: any) => {
    const newIngs = [...ingredients];
    const ing = newIngs[index];
    (ing as any)[field] = value;
    
    if (field === 'itemId') {
      if (ing.type === 'raw') {
        const item = rawInventory.find(i => i.id === value);
        if (item) { ing.name = item.name; ing.unit = item.unit; ing.costPerUnit = item.avgPrice; }
      } else {
        const item = opStock.find(i => i.productId === value);
        if (item) { ing.name = item.productName; ing.unit = item.unit; ing.costPerUnit = item.avgCost; }
      }
    }
    setIngredients(newIngs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const cost = ingredients.reduce((acc, curr) => acc + (curr.qty * curr.costPerUnit), 0);
    
    await db.menuItems.add({
      ...formData,
      cost,
      isAvailable: true,
      ingredients: ingredients.map(i => ({ itemId: i.itemId, name: i.name, qty: i.qty, unit: i.unit, costPerUnit: i.costPerUnit, type: i.type })) as any
    });
    
    setIsAdding(false);
    showSuccess("تم بناء الوجبة النهائية بنجاح.");
    setFormData({ name: "", category: "الطبق الرئيسي", price: 0, image: "🍔" });
    setIngredients([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Beaker className="w-6 h-6 text-purple-500" />
            استوديو الوجبات النهائية (قائمة الطعام)
          </h3>
          <p className="text-sm text-gray-500 font-medium">بناء الوجبات النهائية وربط مكوناتها بالمخزن الرئيسي والتشغيلي (BOM Level 2).</p>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-purple-500/20">
            <Plus className="w-5 h-5" /> بناء وجبة جديدة
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">اسم الوجبة</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#f8f9fd] border border-gray-200 rounded-xl px-4 py-3 outline-none font-bold text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">الفئة</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-[#f8f9fd] border border-gray-200 rounded-xl px-4 py-3 outline-none font-bold text-sm">
                <option value="الطبق الرئيسي">الطبق الرئيسي</option>
                <option value="برجر">برجر</option>
                <option value="سناك">سناك ومقبلات</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">سعر البيع (د.ل)</label>
              <input required type="number" min="0" step="0.5" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full bg-[#f8f9fd] border border-gray-200 rounded-xl px-4 py-3 outline-none font-bold text-sm" />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-gray-700">مكونات الوجبة (BOM Level 2)</h4>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleAddIngredient('raw')} className="text-xs bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold px-3 py-1.5 rounded-lg shadow-sm">+ مادة خام</button>
                <button type="button" onClick={() => handleAddIngredient('op')} className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold px-3 py-1.5 rounded-lg border border-purple-200 shadow-sm">+ منتج وسيط</button>
              </div>
            </div>
            {ingredients.map((ing, idx) => (
              <div key={idx} className={`flex gap-4 mb-2 items-center p-2 rounded-xl border ${ing.type === 'raw' ? 'bg-white border-gray-200' : 'bg-purple-50 border-purple-100'}`}>
                <span className={`text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap ${ing.type==='raw'?'bg-gray-100 text-gray-500':'bg-purple-100 text-purple-700'}`}>
                  {ing.type === 'raw' ? 'مخزن رئيسي' : 'مخزن تشغيلي'}
                </span>
                <select required value={ing.itemId} onChange={e => handleIngredientChange(idx, "itemId", Number(e.target.value))} className="flex-1 bg-white border rounded-xl px-3 py-2 text-sm font-bold">
                  <option value={0}>-- اختر --</option>
                  {ing.type === 'raw' 
                    ? rawInventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)
                    : opStock.map(i => <option key={i.productId} value={i.productId}>{i.productName}</option>)
                  }
                </select>
                <input required type="number" min="0.01" step="0.01" placeholder="الكمية" value={ing.qty} onChange={e => handleIngredientChange(idx, "qty", Number(e.target.value))} className="w-24 bg-white border rounded-xl px-3 py-2 text-sm font-bold" />
                <span className="w-16 text-xs text-gray-500 text-center font-bold">{ing.unit || '-'}</span>
                <button type="button" onClick={() => setIngredients(ingredients.filter((_, i) => i !== idx))} className="text-red-500 font-bold p-2 bg-red-50 rounded-xl hover:bg-red-100">✕</button>
              </div>
            ))}
            {ingredients.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between font-bold text-sm">
                <span className="text-gray-500">التكلفة التقديرية للوجبة:</span>
                <span className="text-orange-500">{ingredients.reduce((acc, curr) => acc + (curr.qty * curr.costPerUnit), 0).toFixed(2)} د.ل</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition">إلغاء</button>
            <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-purple-500/30">حفظ الوجبة في الـ Menu</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map(m => (
          <div key={m.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-purple-500"></div>
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl">{m.image}</div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-extrabold text-gray-900">{m.name}</h4>
                  <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md font-bold">{m.category}</span>
                </div>
                <p className="text-orange-500 font-black text-lg mb-2">{m.price} د.ل</p>
                <p className="text-[11px] text-gray-500 font-bold bg-[#f8f9fd] px-2 py-1 rounded inline-block">التكلفة: {m.cost?.toFixed(2) || 0} د.ل</p>
              </div>
            </div>
            
            {(m.ingredients && m.ingredients.length > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 mb-2">المكونات (الوصفة)</p>
                <ul className="space-y-1">
                  {m.ingredients.map((ing: any, i: number) => (
                    <li key={i} className="flex justify-between text-xs">
                      <span className="text-gray-600 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${ing.type === 'raw' ? 'bg-gray-400' : 'bg-purple-400'}`}></span>
                        {ing.name}
                      </span>
                      <span className="font-mono text-gray-500">{ing.qty} {ing.unit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
