
import React, { useMemo } from 'react';
import { Invoice, Product, InvoiceStatus, User, UserRole } from '../types';

interface DashboardProps {
  invoices: Invoice[];
  products: Product[];
  currentUser: User;
}

const Dashboard: React.FC<DashboardProps> = ({ invoices, products, currentUser }) => {
  const visibleInvoices = useMemo(() => {
    if (currentUser.role === UserRole.SALES) {
      return invoices.filter(inv => inv.sellerName === currentUser.name);
    }
    return invoices;
  }, [invoices, currentUser]);

  // مرتب‌سازی حواله‌ها: حواله‌های PENDING همیشه در ابتدای لیست برای بررسی انباردار
  const sortedInvoices = useMemo(() => {
    return [...visibleInvoices].sort((a, b) => {
      if (a.status === InvoiceStatus.PENDING && b.status !== InvoiceStatus.PENDING) return -1;
      if (a.status !== InvoiceStatus.PENDING && b.status === InvoiceStatus.PENDING) return 1;
      return 0;
    });
  }, [visibleInvoices]);

  const pendingCount = useMemo(() => {
    return visibleInvoices.filter(i => i.status === InvoiceStatus.PENDING).length;
  }, [visibleInvoices]);

  const stats = [
    { label: 'کل حواله‌ها', value: visibleInvoices.length, icon: '📄', color: 'bg-blue-600' },
    { label: 'در انتظار تایید', value: pendingCount, icon: '⏳', color: 'bg-amber-500' },
    { label: 'تنوع کالا', value: products.length, icon: '📦', color: 'bg-emerald-600' },
    { label: 'حواله‌های نهایی', value: visibleInvoices.filter(i => i.status === InvoiceStatus.SHIPPED).length, icon: '✅', color: 'bg-indigo-600' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn font-['IRANSans']">
      {currentUser.role === UserRole.STOCKMAN && pendingCount > 0 && (
        <div className="bg-purple-600 text-white p-5 rounded-3xl shadow-xl flex items-center justify-between animate-bounceIn border-b-4 border-purple-800">
           <div className="flex items-center gap-4">
             <span className="text-4xl">🔔</span>
             <div>
                <h4 className="font-black text-lg">همکار گرامی، حواله جدید رسید!</h4>
                <p className="text-xs opacity-90 font-bold">تعداد {pendingCount} حواله در انتظار بررسی و تایید بارگیری شماست.</p>
             </div>
           </div>
           <div className="bg-white/20 px-4 py-2 rounded-xl font-black text-xl">{pendingCount}</div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold dark:text-white">
          {currentUser.role === UserRole.SALES ? `وضعیت حواله‌های ${currentUser.name}` : 'وضعیت کلی سامانه'}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border dark:border-slate-800 flex items-center gap-4 transition hover:shadow-md">
            <div className={`w-12 h-12 lg:w-14 lg:h-14 ${stat.color} text-white rounded-2xl flex items-center justify-center text-2xl lg:text-3xl shadow-lg shrink-0`}>
              {stat.icon}
            </div>
            <div className="min-w-0">
              <p className="text-gray-500 dark:text-gray-400 text-xs lg:text-sm font-medium truncate">{stat.label}</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 lg:p-6 rounded-3xl shadow-sm border dark:border-slate-800">
        <h3 className="text-lg lg:text-xl font-bold mb-6 text-gray-800 dark:text-gray-100 border-b dark:border-slate-800 pb-4">
          آخرین وضعیت تمام حواله‌ها
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedInvoices.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-gray-50 dark:bg-slate-800/50 rounded-2xl text-gray-400">
              <span className="text-4xl block mb-2">📭</span>
              هنوز هیچ حواله‌ای برای نمایش وجود ندارد.
            </div>
          ) : (
            sortedInvoices.slice(0, 10).map(inv => (
              <div 
                key={inv.id} 
                className={`flex items-center justify-between p-4 lg:p-5 border dark:border-slate-700 rounded-2xl shadow-sm transition-all ${
                  inv.status === InvoiceStatus.PENDING 
                  ? 'bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-900/40 ring-1 ring-red-100 dark:ring-0' 
                  : 'bg-white dark:bg-slate-800 border-gray-100 hover:border-blue-200'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${inv.status === InvoiceStatus.SHIPPED ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
                    <p className="font-bold text-gray-800 dark:text-gray-200 truncate text-sm lg:text-base">{inv.customerName}</p>
                  </div>
                  <p className="text-[10px] lg:text-xs text-gray-400 font-medium truncate">{inv.date} | {inv.sellerName} | {inv.type === 'INCOMING' ? 'ورود' : 'خروج'}</p>
                </div>
                <span className={`text-[10px] lg:text-xs px-2 py-1 lg:px-4 lg:py-1.5 rounded-full font-bold shrink-0 ${inv.status === InvoiceStatus.SHIPPED ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 shadow-sm'}`}>
                  {inv.status === InvoiceStatus.SHIPPED ? 'ارسال شده' : 'در انتظار تایید'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
