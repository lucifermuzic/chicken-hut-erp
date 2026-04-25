#!/usr/bin/env python3
# -*- coding: utf-8 -*-

ceo_path = r'c:\Users\Huwiyyaa\Downloads\CHN\nextjs-project-app\app\ceo\page.tsx'

new_component = '''
// ─── اعتماد طلبات الشراء من أمين المخزن (CEO) ───────────────────
function PurchaseRequestsApprovalView({ showSuccess }: { showSuccess: (msg: string) => void }) {
  const purchaseRequests = useLiveQuery(() =>
    db.purchaseRequests.orderBy("id").reverse().toArray()
  ) ?? [];

  const pending   = purchaseRequests.filter((r) => r.status === "\u0645\u0639\u0644\u0642");
  const processed = purchaseRequests.filter((r) => r.status !== "\u0645\u0639\u0644\u0642");

  const handleApproveDebt = async (req: any) => {
    await db.purchaseRequests.update(req.id, {
      status: "\u0645\u0639\u062a\u0645\u062f - \u062f\u064a\u0646",
      approvedAt: new Date().toISOString(),
      approvedBy: "CEO",
    });
    showSuccess("\u062a\u0645 \u0627\u0639\u062a\u0645\u0627\u062f \u0643\u062f\u064a\u0646 \u2713 \u2014 " + req.requestNumber);
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
      status: "\u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u062e\u0632\u064a\u0646\u0629",
      createdAt: now,
      notes: req.notes,
    });
    await db.purchaseRequests.update(req.id, {
      status: "\u0645\u0639\u062a\u0645\u062f - \u0635\u0631\u0641",
      approvedAt: now,
      approvedBy: "CEO",
      paymentOrderId: paymentId as number,
    });
    showSuccess("\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0623\u0645\u0631 \u0635\u0631\u0641 " + voucherNumber + " \u0648\u0625\u0631\u0633\u0627\u0644\u0647 \u0644\u0623\u0645\u064a\u0646 \u0627\u0644\u062e\u0632\u064a\u0646\u0629 \u2713");
  };

  const handleReject = async (id: number) => {
    await db.purchaseRequests.update(id, { status: "\u0645\u0631\u0641\u0648\u0636" });
    showSuccess("\u062a\u0645 \u0631\u0641\u0636 \u0637\u0644\u0628 \u0627\u0644\u0634\u0631\u0627\u0621");
  };

  const statusStyle: Record<string, string> = {
    "\u0645\u0639\u0644\u0642":          "bg-amber-500/10 text-amber-400 border-amber-500/30",
    "\u0645\u0639\u062a\u0645\u062f - \u062f\u064a\u0646":   "bg-blue-500/10 text-blue-400 border-blue-500/30",
    "\u0645\u0639\u062a\u0645\u062f - \u0635\u0631\u0641":   "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    "\u0645\u0631\u0641\u0648\u0636":         "bg-red-500/10 text-red-400 border-red-500/30",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-xl">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-orange-400" /> \u0637\u0644\u0628\u0627\u062a \u0634\u0631\u0627\u0621 \u0623\u0645\u064a\u0646 \u0627\u0644\u0645\u062e\u0632\u0646
          </h3>
          <p className="text-sm text-gray-400 font-medium mt-1">
            \u0637\u0644\u0628\u0627\u062a \u0645\u0631\u0633\u0644\u0629 \u0645\u0646 \u0623\u0645\u064a\u0646 \u0627\u0644\u0645\u062e\u0632\u0646 \u2014 \u0627\u062e\u062a\u0631: \u0627\u0639\u062a\u0645\u0627\u062f \u0643\u062f\u064a\u0646 \u0623\u0648 \u0627\u0639\u062a\u0645\u0627\u062f \u0648\u0635\u0631\u0641 (\u064a\u064f\u0646\u0634\u0626 \u0623\u0645\u0631 \u0635\u0631\u0641 \u0644\u0623\u0645\u064a\u0646 \u0627\u0644\u062e\u0632\u064a\u0646\u0629)
          </p>
        </div>
        <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border ${
          pending.length > 0
            ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
            : "bg-gray-50 border-gray-100 text-gray-400"
        }`}>
          <AlertCircle className="w-4 h-4" /> {pending.length > 0 ? `${pending.length} \u0637\u0644\u0628 \u0645\u0639\u0644\u0642` : "\u0644\u0627 \u0637\u0644\u0628\u0627\u062a \u0645\u0639\u0644\u0642\u0629"}
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
                <div className="flex justify-between"><span className="text-gray-400">\u0627\u0644\u0635\u0646\u0641</span><strong className="text-gray-900">{req.itemName}</strong></div>
                <div className="flex justify-between"><span className="text-gray-400">\u0627\u0644\u0643\u0645\u064a\u0629</span><strong className="text-gray-900">{req.qty} {req.unit}</strong></div>
                <div className="flex justify-between"><span className="text-gray-400">\u0633\u0639\u0631 \u0627\u0644\u0648\u062d\u062f\u0629</span><strong className="text-gray-900">{req.unitPrice.toFixed(2)} \u062f.\u0644</strong></div>
                <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
                  <span className="font-extrabold text-gray-900">\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a</span>
                  <strong className="text-orange-400 text-sm font-mono">{req.totalAmount.toFixed(2)} \u062f.\u0644</strong>
                </div>
              </div>
              {req.notes && (
                <p className="text-[10px] bg-blue-500/5 border border-blue-500/20 rounded-lg px-2 py-1.5 mb-3 text-gray-400">
                  \u0645\u0644\u0627\u062d\u0638\u0629: {req.notes}
                </p>
              )}
              <div className="grid grid-cols-3 gap-2 mt-auto">
                <button onClick={() => handleApproveDebt(req)}
                  className="flex flex-col items-center justify-center gap-0.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] py-3 px-1 rounded-xl transition active:scale-95 shadow-lg shadow-blue-600/20">
                  <CreditCard className="w-4 h-4 mb-0.5" />
                  \u0627\u0639\u062a\u0645\u0627\u062f \u062f\u064a\u0646
                </button>
                <button onClick={() => handleApprovePay(req)}
                  className="flex flex-col items-center justify-center gap-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] py-3 px-1 rounded-xl transition active:scale-95 shadow-lg shadow-emerald-600/20">
                  <Banknote className="w-4 h-4 mb-0.5" />
                  \u0627\u0639\u062a\u0645\u0627\u062f \u0648\u0635\u0631\u0641
                </button>
                <button onClick={() => handleReject(req.id!)}
                  className="flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 text-lg font-bold py-3 rounded-xl border border-red-500/20 transition active:scale-95">
                  \u2715
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {processed.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-gray-900">\u0633\u062c\u0644 \u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0634\u0631\u0627\u0621 \u0627\u0644\u0645\u0639\u0627\u0644\u062c\u0629</h3>
            <span className="text-xs font-bold text-gray-400">{processed.length} \u0637\u0644\u0628</span>
          </div>
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-400 border-b border-gray-100">
                <th className="px-5 py-3">\u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628</th>
                <th className="px-5 py-3">\u0627\u0644\u0645\u0648\u0631\u062f</th>
                <th className="px-5 py-3">\u0627\u0644\u0635\u0646\u0641</th>
                <th className="px-5 py-3 text-center">\u0627\u0644\u0641\u0631\u0639</th>
                <th className="px-5 py-3 text-center">\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a</th>
                <th className="px-5 py-3 text-center">\u0627\u0644\u062d\u0627\u0644\u0629</th>
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
                    {req.totalAmount.toFixed(2)} \u062f.\u0644
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
'''

with open(ceo_path, 'a', encoding='utf-8') as f:
    f.write(new_component)

print("CEO component added successfully")
