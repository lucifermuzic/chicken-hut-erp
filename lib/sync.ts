import { db } from './db';
import { supabase } from './supabase';

const tables = [
  'orders', 'inventory', 'treasuryLogs', 'invoices', 'branchRequests',
  'employees', 'hrDeductions', 'tillTransfers', 'shiftLogs', 'menuItems',
  'treasuryOutgoing', 'treasuryIncoming', 'suppliers', 'purchaseRequests',
  'paymentOrders', 'customers', 'callCenterOrders', 'settings'
];

/**
 * دالة مزامنة كلية: ترفع كل شيء وتُحدّث الحالة (تستخدم للبداية والمزامنة اليدوية)
 */
export async function syncAllToSupabase() {
  console.log("بدء عملية المزامنة الكلية مع Supabase...");
  let successCount = 0;
  let failCount = 0;

  for (const tableName of tables) {
    try {
      let records = await db.table(tableName).toArray();
      if (records.length > 0) {
        
        // تنظيف البيانات: إذا كان هناك تاريخ غير صالح (مثل التوقيت العربي المحلي) يتم حذفه ليأخذ وقت الخادم التلقائي
        records = records.map(record => {
          if (record.createdAt) {
            const d = new Date(record.createdAt);
            if (isNaN(d.getTime())) {
              delete record.createdAt;
            }
          }
          if (record.date) {
            const d = new Date(record.date);
            if (isNaN(d.getTime())) {
              delete record.date;
            }
          }
          return record;
        });

        const { error } = await supabase.from(tableName).upsert(records);
        if (error) {
          console.error(`❌ خطأ في مزامنة ${tableName}:`, error.message);
          failCount++;
        } else {
          successCount++;
          // تحديث السجلات التي تحتوي على isSynced فقط
          const needsUpdate = records.some(r => r.isSynced !== undefined && r.isSynced === false);
          if (needsUpdate) {
            const updatedRecords = records.map(r => r.isSynced !== undefined ? { ...r, isSynced: true } : r);
            await db.table(tableName).bulkPut(updatedRecords);
          }
        }
      }
    } catch (err) {
      console.error(`❌ فشل في جدول ${tableName}`, err);
      failCount++;
    }
  }
  return { successCount, failCount };
}

/**
 * دالة المزامنة الجزئية (للخلفية): تبحث فقط عن السجلات الجديدة أو غير المتزامنة وتدفعها لـ Supabase
 */
export async function syncUnsyncedData() {
  for (const tableName of tables) {
    try {
      const table = db.table(tableName);
      // نجلب السجلات التي تحتوي على isSynced === false بشكل صريح
      let unsyncedRecords = await table.filter(r => r.isSynced === false).toArray();
      
      // بعض الجداول قد لا تحتوي على حقل isSynced لكننا نريد مزامنتها إذا أضيفت مؤخراً
      // للتبسيط في هذا الإصدار، سنعتمد على حقل isSynced للجداول التي تدعمه (مثل الطلبات، الخزينة، المخزون)
      if (unsyncedRecords.length > 0) {
        
        // تنظيف البيانات
        unsyncedRecords = unsyncedRecords.map(record => {
          if (record.createdAt) {
            const d = new Date(record.createdAt);
            if (isNaN(d.getTime())) { delete record.createdAt; }
          }
          if (record.date) {
            const d = new Date(record.date);
            if (isNaN(d.getTime())) { delete record.date; }
          }
          return record;
        });

        const { error } = await supabase.from(tableName).upsert(unsyncedRecords);
        if (!error) {
          console.log(`✅ [Background Sync] تمت مزامنة ${unsyncedRecords.length} سجلات في ${tableName}`);
          const updated = unsyncedRecords.map(r => ({ ...r, isSynced: true }));
          await table.bulkPut(updated);
        }
      }
    } catch (err) {
      // التجاهل بصمت في الخلفية
    }
  }
}

/**
 * تشغيل المزامنة التلقائية في الخلفية كل فترة زمنية
 */
export function startBackgroundSync(intervalSeconds = 15) {
  if (typeof window !== 'undefined') {
    console.log(`🚀 تم تفعيل المزامنة التلقائية كل ${intervalSeconds} ثانية.`);
    
    // تشغيل فوري أول مرة (للتأكد)
    setTimeout(() => {
      syncUnsyncedData();
    }, 5000);

    // تشغيل دوري
    setInterval(() => {
      syncUnsyncedData();
    }, intervalSeconds * 1000);
  }
}
