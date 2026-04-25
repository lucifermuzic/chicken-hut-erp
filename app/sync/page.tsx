"use client";

import React, { useState } from 'react';
import { syncAllToSupabase } from '@/lib/sync';
import { Database, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function SyncPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<{ successCount: number; failCount: number } | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setResult(null);
    try {
      const res = await syncAllToSupabase();
      setResult(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fd] flex items-center justify-center p-6 font-sans" dir="rtl">
      <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
        <div className="mx-auto w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <Database className="w-10 h-10 text-blue-600" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">مزامنة البيانات</h1>
        <p className="text-gray-500 mb-8 font-bold">
          مزامنة البيانات المحلية (Dexie) مع قاعدة البيانات السحابية (Supabase).
        </p>

        {result && (
          <div className={`p-4 rounded-xl mb-6 font-bold flex flex-col items-center gap-2 ${result.failCount === 0 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
            {result.failCount === 0 ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 text-orange-500" />
            )}
            <p>تمت المزامنة بنجاح لـ {result.successCount} جدول.</p>
            {result.failCount > 0 && <p>فشل مزامنة {result.failCount} جدول.</p>}
          </div>
        )}

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="w-full bg-[#ff6b00] hover:bg-[#e65c00] text-white font-bold py-4 rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-3 shadow-lg shadow-orange-500/30"
        >
          {isSyncing ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              جاري المزامنة...
            </>
          ) : (
            <>
              <Database className="w-6 h-6" />
              بدء المزامنة الآن
            </>
          )}
        </button>

        <p className="mt-6 text-xs text-gray-400 font-bold">
          تأكد من إنشاء الجداول في Supabase قبل بدء المزامنة باستخدام ملف supabase-schema.sql
        </p>
      </div>
    </div>
  );
}
