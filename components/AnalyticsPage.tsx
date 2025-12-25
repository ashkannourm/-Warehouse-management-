
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, LabelList } from 'recharts';
import { Invoice, User, UserRole, InvoiceStatus } from '../types';

interface AnalyticsPageProps {
  invoices: Invoice[];
  currentUser: User;
  isDarkMode: boolean;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ invoices, currentUser, isDarkMode }) => {
  // فیلتر کردن حواله‌ها بر اساس دسترسی
  const visibleInvoices = useMemo(() => {
    const shipped = invoices.filter(inv => inv.status === InvoiceStatus.SHIPPED);
    if (currentUser.role === UserRole.SALES) {
      return shipped.filter(inv => inv.sellerName === currentUser.name);
    }
    return shipped;
  }, [invoices, currentUser]);

  // ۱. آمار حواله‌های ماهانه - مرتب‌سازی صعودی برای نمایش از چپ به راست
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    visibleInvoices.forEach(inv => {
      const parts = inv.date.split('/');
      if (parts.length >= 2) {
        const key = `${parts[0]}/${parts[1]}`;
        months[key] = (months[key] || 0) + 1;
      }
    });

    return Object.entries(months)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name)); // ترتیب صعودی (قدیمی به جدید)
  }, [visibleInvoices]);

  // ۲. آمار حواله‌ها برای هر مشتری + محاسبه فاصله زمانی
  const customerStats = useMemo(() => {
    const stats: Record<string, { count: number, dates: number[] }> = {};
    
    visibleInvoices.forEach(inv => {
      if (!stats[inv.customerName]) {
        stats[inv.customerName] = { count: 0, dates: [] };
      }
      stats[inv.customerName].count += 1;
      
      const parts = inv.date.split('/').map(p => parseInt(p));
      const fakeTimestamp = parts[0] * 365 + parts[1] * 30 + parts[2];
      stats[inv.customerName].dates.push(fakeTimestamp);
    });

    return Object.entries(stats).map(([name, data]) => {
      let avgInterval = 0;
      if (data.dates.length > 1) {
        const sorted = data.dates.sort((a, b) => a - b);
        const diffs = [];
        for (let i = 1; i < sorted.length; i++) {
          diffs.push(sorted[i] - sorted[i-1]);
        }
        avgInterval = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
      }

      return {
        name,
        count: data.count,
        avgInterval: avgInterval || '-'
      };
    }).sort((a, b) => b.count - a.count);
  }, [visibleInvoices]);

  // ۳. تحلیل جزئیات کالاها به تفکیک مشتری
  const customerProductDetails = useMemo(() => {
    const details: Record<string, Record<string, number>> = {};
    
    visibleInvoices.forEach(inv => {
      if (!details[inv.customerName]) {
        details[inv.customerName] = {};
      }
      inv.items.forEach(item => {
        details[inv.customerName][item.productName] = (details[inv.customerName][item.productName] || 0) + item.quantity;
      });
    });

    return details;
  }, [visibleInvoices]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981'];
  const textColor = isDarkMode ? '#94a3b8' : '#64748b';
  const gridColor = isDarkMode ? '#1e293b' : '#e2e8f0';

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-3">
          <span className="text-blue-600">📈</span> آمار و تحلیل عملکرد
        </h2>
        <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl border border-blue-100 dark:border-blue-800 transition-colors">
          <span className="text-xs font-bold text-blue-700 dark:text-blue-300">کل حواله‌های نهایی: {visibleInvoices.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* نمودار زمانی ماهانه - تنظیم شده برای نمایش از چپ به راست */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 transition-all">
          <h3 className="text-lg font-bold mb-6 dark:text-gray-100 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            تعداد حواله‌های ارسال شده در ماه
          </h3>
          <div className="h-72 w-full" dir="ltr"> {/* اجبار به نمایش چپ به راست برای جریان زمان */}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: textColor, fontFamily: 'Tahoma' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: textColor }} 
                  orientation="left"
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                    direction: 'rtl',
                    textAlign: 'right',
                    color: isDarkMode ? '#f8fafc' : '#1e293b'
                  }}
                  itemStyle={{ color: '#2563eb' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: isDarkMode ? '#cbd5e1' : '#475569' }}
                />
                <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* نمودار مشتریان پر سفارش */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 transition-all">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold dark:text-gray-100 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
              مشتریان پر سفارش (تعداد حواله)
            </h3>
            <span className="text-[10px] text-gray-400 font-bold">۵ مشتری برتر</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={customerStats.slice(0, 5)} 
                layout="vertical" 
                margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                barCategoryGap="30%"
              >
                <XAxis type="number" hide />
                <YAxis 
                   dataKey="name" 
                   type="category" 
                   axisLine={false} 
                   tickLine={false} 
                   width={120}
                   orientation="right"
                   tick={(props) => {
                     const { x, y, payload } = props;
                     return (
                       <g transform={`translate(${x},${y})`}>
                         <text 
                           x={-10} 
                           y={0} 
                           dy={4} 
                           textAnchor="end" 
                           fill={textColor} 
                           fontSize={11} 
                           fontWeight="bold"
                         >
                           {payload.value.length > 15 ? `${payload.value.slice(0, 12)}...` : payload.value}
                         </text>
                       </g>
                     );
                   }}
                />
                <Tooltip 
                  cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                    direction: 'rtl' 
                  }}
                  labelStyle={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[10, 0, 0, 10]} 
                  background={{ fill: isDarkMode ? '#1e293b' : '#f1f5f9', radius: 10 }}
                  isAnimationActive={true}
                >
                  {customerStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <LabelList 
                    dataKey="count" 
                    position="right" 
                    style={{ fontSize: '10px', fontWeight: 'bold', fill: textColor }}
                    formatter={(val: number) => `${val} حواله`}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* جدول تفصیلی فواصل زمانی */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold dark:text-gray-100 flex items-center gap-2">
             <span className="text-xl">⏳</span>
             تحلیل فاصله زمانی سفارشات مشتریان
          </h3>
          <p className="text-xs text-gray-400 mt-1 font-medium">میانگین روزهای سپری شده بین هر بار خروج بار برای هر مشتری</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 font-bold">
              <tr>
                <th className="p-4">نام مشتری</th>
                <th className="p-4 text-center">تعداد کل حواله‌ها</th>
                <th className="p-4 text-center">میانگین فاصله (روز)</th>
                <th className="p-4 text-center">وضعیت وفاداری</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customerStats.map((stat, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-bold dark:text-gray-200">{stat.name}</td>
                  <td className="p-4 text-center font-mono font-bold text-blue-600 dark:text-blue-400">{stat.count}</td>
                  <td className="p-4 text-center">
                    <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg font-bold text-gray-600 dark:text-gray-400">
                      {stat.avgInterval}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {typeof stat.avgInterval === 'number' ? (
                      stat.avgInterval <= 7 ? (
                        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-2 py-1 rounded-md font-bold">بسیار فعال (هفتگی)</span>
                      ) : stat.avgInterval <= 30 ? (
                        <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-1 rounded-md font-bold">فعال (ماهانه)</span>
                      ) : (
                        <span className="text-[10px] bg-orange-50 dark:bg-orange-900/20 text-orange-600 px-2 py-1 rounded-md font-bold">سفارشات موردی</span>
                      )
                    ) : (
                      <span className="text-[10px] text-gray-400 italic font-medium">داده ناکافی</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* تفکیک دقیق اقلام ارسالی */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold dark:text-white flex items-center gap-3">
          <span className="text-blue-600">📑</span> تفکیک اقلام ارسالی به تفکیک مشتری
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(customerProductDetails).map(([customerName, prods]) => (
            <div key={customerName} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-center mb-4 border-b border-slate-50 dark:border-slate-800 pb-3">
                <h4 className="font-bold text-gray-800 dark:text-gray-100 truncate max-w-[70%] group-hover:text-blue-600 transition-colors">{customerName}</h4>
                <span className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded-lg font-bold shadow-sm">
                  {Object.keys(prods).length} قلم کالا
                </span>
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {Object.entries(prods).map(([prodName, totalQty]) => (
                  <div key={prodName} className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400 truncate max-w-[75%] font-medium" title={prodName}>{prodName}</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">{totalQty} عدد</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(customerProductDetails).length === 0 && (
            <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-slate-800/50 rounded-[2rem] text-gray-400 font-bold border-2 border-dashed border-slate-200 dark:border-slate-700">
              هیچ داده‌ای برای نمایش جزئیات کالاها یافت نشد.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
