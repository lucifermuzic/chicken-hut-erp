"""
يُصلح عرض الكميات في branch-manager و storekeeper
لتظهر بالأرقام العشرية مع وحدة القياس
مثال: 5.95 كيلو  بدلاً من  5.95
"""
import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def fix_file(path, replacements):
    with open(path, encoding='utf-8') as f:
        content = f.read()
    original = content
    for old, new in replacements:
        content = content.replace(old, new)
    if content == original:
        print(f'[WARN] No changes in {path}')
    else:
        with open(path, 'w', encoding='utf-8', newline='') as f:
            f.write(content)
        print(f'[OK] Updated {path}')

# ─── branch-manager/page.tsx ───────────────────────────────────────
BM_PATH = 'app/branch-manager/page.tsx'
bm_fixes = [
    # عرض كمية المادة في جدول مخزن الفرع (InventoryView)
    (
        '                  <span className={`text-lg font-mono font-bold ${isLow ? \'text-red-600\' : \'text-gray-900\'}`}>\n                    {item.branchQty}\n                  </span>',
        '                  <span className={`text-lg font-mono font-bold ${isLow ? \'text-red-600\' : \'text-gray-900\'}`}>\n                    {Number.isInteger(item.branchQty) ? item.branchQty : item.branchQty.toFixed(3).replace(/\\.?0+$/, \'\')}\n                  </span>'
    ),
    # عرض كمية المادة في بطاقات نقل المخزون (InventoryTransferView - cards)
    (
        '                <span className={`text-2xl font-bold font-mono ${isLow ? \'text-red-500\' : \'text-[#ff6b00]\'}`}>\n                  {item.branchQty}\n                </span>',
        '                <span className={`text-2xl font-bold font-mono ${isLow ? \'text-red-500\' : \'text-[#ff6b00]\'}`}>\n                  {Number.isInteger(item.branchQty) ? item.branchQty : item.branchQty.toFixed(3).replace(/\\.?0+$/, \'\')}\n                </span>'
    ),
    # عرض الكمية في dropdown مخزن الفرع
    (
        '                  {item.name} — متوفر في الفرع: {item.branchQty} {item.unit}',
        '                  {item.name} — متوفر في الفرع: {Number.isInteger(item.branchQty) ? item.branchQty : item.branchQty.toFixed(3).replace(/\\.?0+$/, \'\')} {item.unit}'
    ),
    # عرض الكمية في dropdown نقل المخزون
    (
        '                    {item.name} — متاح: {item.branchQty} {item.unit}',
        '                    {item.name} — متاح: {Number.isInteger(item.branchQty) ? item.branchQty : item.branchQty.toFixed(3).replace(/\\.?0+$/, \'\')} {item.unit}'
    ),
    # ملخص عملية النقل - المتبقي
    (
        '              سيتم نقل <span className=\"font-mono\">{qtyNum} {selectedItem.unit}</span> من {selectedItem.name} إلى {targetBranch}.\n              المتبقي: <span className=\"font-mono text-orange-600\">{Math.max(0, maxQty - qtyNum)} {selectedItem.unit}</span>',
        '              سيتم نقل <span className=\"font-mono\">{qtyNum} {selectedItem.unit}</span> من {selectedItem.name} إلى {targetBranch}.\n              المتبقي: <span className=\"font-mono text-orange-600\">{(Math.max(0, maxQty - qtyNum)).toFixed(3).replace(/\\.?0+$/, \'\')} {selectedItem.unit}</span>'
    ),
]

fix_file(BM_PATH, bm_fixes)

# ─── storekeeper/page.tsx ───────────────────────────────────────────
SK_PATH = 'app/storekeeper/page.tsx'

with open(SK_PATH, encoding='utf-8') as f:
    sk = f.read()

original_sk = sk

# 1. {item.qty} في بطاقات المخزون الرئيسي (مع span للوحدة)
sk = sk.replace(
    '{item.qty} <span className=\"text-[10px] text-gray-400 font-sans\">{item.unit}</span>',
    '{Number.isInteger(item.qty) ? item.qty : item.qty.toFixed(3).replace(/\\.?0+$/, \'\')} <span className=\"text-[10px] text-gray-400 font-sans\">{item.unit}</span>'
)

# 2. كمية في جدول الفواتير {inv.qty} مع span وحدة
sk = sk.replace(
    '{inv.qty} <span className=\"text-[10px] text-gray-400 font-sans\">{item?.unit}</span>',
    '{Number.isInteger(inv.qty) ? inv.qty : inv.qty.toFixed(3).replace(/\\.?0+$/, \'\')} <span className=\"text-[10px] text-gray-400 font-sans\">{item?.unit}</span>'
)

# 3. {r.qty} {r.unit} في جدول طلبات الشراء
sk = sk.replace(
    '{r.qty} {r.unit}',
    '{Number.isInteger(r.qty) ? r.qty : r.qty.toFixed(3).replace(/\\.?0+$/, \'\')} {r.unit}'
)

# 4. كمية المخزن في تحذير النقل وقائمة الاختيار
sk = sk.replace(
    'تحذير: الكمية الموجودة بالمخزن الرئيسي ({item?.qty}) لا تكفي',
    'تحذير: الكمية الموجودة بالمخزن الرئيسي ({typeof item?.qty === \'number\' && !Number.isInteger(item.qty) ? item.qty.toFixed(3).replace(/\\.?0+$/, \'\') : item?.qty}) لا تكفي'
)

# 5. قائمة dropdown المواد: متوفر: {i.qty}
sk = sk.replace(
    '{i.name} (متوفر: {i.qty})',
    '{i.name} (متوفر: {Number.isInteger(i.qty) ? i.qty : i.qty.toFixed(3).replace(/\\.?0+$/, \'\')} {i.unit})'
)

# 6. الكمية في وصف الفاتورة (نص prose) : شراء {inv.qty}
sk = sk.replace(
    'شراء {inv.qty} {item?.unit}',
    'شراء {Number.isInteger(inv.qty) ? inv.qty : inv.qty.toFixed(3).replace(/\\.?0+$/, \'\')} {item?.unit}'
)

# 7. req.qty في بطاقات طلبات الفروع
sk = re.sub(
    r'\{req\.qty\}(\s*\{[^}]+unit[^}]*\})?',
    lambda m: '{Number.isInteger(req.qty) ? req.qty : req.qty.toFixed(3).replace(/\\.?0+$/, \'\')}' + (m.group(1) or ''),
    sk
)

if sk == original_sk:
    print('[WARN] No changes in storekeeper/page.tsx')
else:
    with open(SK_PATH, 'w', encoding='utf-8', newline='') as f:
        f.write(sk)
    print('[OK] Updated storekeeper/page.tsx')

print('All done.')
