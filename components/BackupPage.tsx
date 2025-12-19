
import React, { useRef, useState } from 'react';
import { User, Category, Product, Customer, Invoice } from '../types';

interface BackupData {
  users: User[];
  categories: Category[];
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
}

interface BackupPageProps {
  data: BackupData;
  setData: (data: Partial<BackupData>) => Promise<void>;
}

const BackupPage: React.FC<BackupPageProps> = ({ data, setData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExport = () => {
    try {
      const backupString = JSON.stringify(data, null, 2);
      const blob = new Blob([backupString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      const now = new Date();
      const dateString = now.toLocaleDateString('fa-IR').replace(/\//g, '-');
      link.href = url;
      link.download = `Warehouse-Backup-${dateString}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setStatus({ type: 'success', message: 'فایل پشتیبان با موفقیت ایجاد شد.' });
    } catch (err) {
      setStatus({ type: 'error', message: 'خطا در خروجی گرفتن از اطلاعات.' });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsProcessing(true);
        const content = event.target?.result as string;
        const importedData = JSON.parse(content) as BackupData;

        const confirmed = window.confirm(
          'هشدار: بازگردانی اطلاعات باعث حذف تمامی داده‌های فعلی در پنل فایربیس خواهد شد. آیا مطمئن هستید؟'
        );

        if (confirmed) {
          await setData(importedData);
          setStatus({ type: 'success', message: 'اطلاعات با موفقیت در دیتابیس بازنویسی شد.' });
        }
      } catch (err) {
        setStatus({ type: 'error', message: 'فرمت فایل پشتیبان نامعتبر است.' });
      } finally {
        setIsProcessing(false);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn" dir="rtl">
      <div className="bg-white dark:bg-slate-900 p-6 lg:p-10 rounded-3xl shadow-sm border dark:border-slate-800">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
          <span className="bg-blue-100 text-blue-600 p-2 rounded-xl text-xl">💾</span>
          پشتیبان‌گیری فایربیس
        </h2>
        
        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          اطلاعات شما به صورت خودکار در فضای ابری فایربیس ذخیره می‌شود. با این حال می‌توانید یک نسخه آفلاین برای امنیت بیشتر نزد خود نگه دارید.
        </p>

        {status.type && (
          <div className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 font-bold text-sm ${
            status.type === 'success' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20' : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20'
          }`}>
            <span>{status.type === 'success' ? '✅' : '❌'}</span>
            {status.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/50 flex flex-col justify-between">
            <h3 className="font-bold text-blue-900 dark:text-blue-300 text-lg mb-4">خروجی کامل داده‌ها</h3>
            <button 
              onClick={handleExport}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition"
            >
              دانلود نسخه پشتیبان (.json)
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 flex flex-col justify-between">
            <h3 className="font-bold text-slate-900 dark:text-slate-200 text-lg mb-4">بازیابی از فایل</h3>
            <input type="file" ref={fileInputRef} accept=".json" onChange={handleImport} className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full bg-slate-800 dark:bg-slate-700 text-white py-4 rounded-xl font-bold hover:bg-slate-900 transition disabled:opacity-50"
            >
              {isProcessing ? 'در حال پردازش...' : 'انتخاب فایل و بازیابی'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupPage;
