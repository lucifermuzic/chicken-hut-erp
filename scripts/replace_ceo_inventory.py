import re

ceo_path = r'c:\Users\Huwiyyaa\Downloads\CHN\nextjs-project-app\app\ceo\page.tsx'

with open(ceo_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The function to replace is InventoryManagementView
# We will find the start of function InventoryManagementView
start_idx = content.find('function InventoryManagementView({ showSuccess }: { showSuccess: (m: string) => void }) {')
if start_idx == -1:
    print("Could not find InventoryManagementView")
    exit(1)

# Find the start of the next function to know where it ends
end_idx = content.find('// ─── اعتماد طلبات الشراء من أمين المخزن (CEO) ───────────────────', start_idx)
if end_idx == -1:
    print("Could not find the end of InventoryManagementView")
    exit(1)

new_component = '''function InventoryManagementView({ showSuccess }: { showSuccess: (m: string) => void }) {
  const stock = useLiveQuery(() => db.inventory.toArray()) || [];
  const totalValue = stock.reduce((acc, item) => acc + (item.qty * item.avgPrice), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
                    {Number.isInteger(item.qty) ? item.qty : item.qty.toFixed(3).replace(/\.?0+$/, '')} <span className="text-[10px] text-gray-400 font-sans">{item.unit}</span>
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

'''

new_full_content = content[:start_idx] + new_component + content[end_idx:]

with open(ceo_path, 'w', encoding='utf-8') as f:
    f.write(new_full_content)

print("InventoryManagementView replaced successfully!")
