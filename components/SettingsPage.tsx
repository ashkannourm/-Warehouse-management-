
import React, { useState } from 'react';
import { User, UserRole, AppConfig } from '../types';

interface SettingsPageProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  appConfig: AppConfig;
  setAppConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ users, setUsers, appConfig, setAppConfig }) => {
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: UserRole.SALES });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUsers([...users, { ...newUser, id: Date.now().toString() }]);
    setShowUserModal(false);
    setNewUser({ name: '', username: '', password: '', role: UserRole.SALES });
  };

  const handleTestUbuntu = async () => {
    if (!appConfig?.uploadUrl) return alert('ابتدا آدرس سرور را وارد کنید.');
    try {
      const res = await fetch(appConfig.uploadUrl, { method: 'OPTIONS' });
      if (res.ok || res.status === 405) alert('✅ اتصال به سرور اوبونتو برقرار است!');
      else alert('❌ سرور پاسخگو نیست.');
    } catch {
      alert('❌ خطا در برقراری ارتباط با سرور.');
    }
  };

  const handleTestTelegram = async () => {
    const { botToken, chatId } = appConfig?.telegram || { botToken: '', chatId: '' };
    if (!botToken || !chatId) return alert('ابتدا توکن ربات و Chat ID را وارد کنید.');

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '✅ تست اتصال سامانه انبارداری با موفقیت انجام شد!\n\nاین ربات اکنون آماده ارسال گزارشات است.'
        })
      });
      
      const result = await response.json();
      if (result.ok) {
        alert('✅ اتصال برقرار است! پیام تست به تلگرام شما ارسال شد.');
      } else {
        alert(`❌ خطا از طرف تلگرام: ${result.description}`);
      }
    } catch (error) {
      alert('❌ خطا در برقراری ارتباط با سرور تلگرام.');
    }
  };

  // Safe update logic to prevent crashes
  const updateConfig = (updates: Partial<AppConfig>) => {
    setAppConfig(prev => {
      const current = prev || { uploadUrl: '', telegram: { botToken: '', chatId: '', enabled: false } };
      return { ...current, ...updates };
    });
  };

  const updateTelegram = (updates: Partial<typeof appConfig.telegram>) => {
    setAppConfig(prev => {
      const current = prev || { uploadUrl: '', telegram: { botToken: '', chatId: '', enabled: false } };
      const currentTelegram = current.telegram || { botToken: '', chatId: '', enabled: false };
      return {
        ...current,
        telegram: { ...currentTelegram, ...updates }
      };
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 text-right animate-fadeIn" dir="rtl">
      {/* Ubuntu Image Server Settings */}
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border dark:border-slate-800">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-3 dark:text-white">
          <span className="bg-orange-100 text-orange-600 p-2 rounded-xl text-xl">🖥️</span>
          تنظیمات سرور تصاویر (اوبونتو)
        </h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">آدرس فایل API آپلود که روی سرور Ubuntu خود نوشته‌اید را اینجا وارد کنید. این آدرس برای ذخیره فیزیکی تصاویر کالاها استفاده می‌شود.</p>
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="https://your-server.com/api/upload.php"
            className="flex-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border dark:border-slate-700 outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
            value={appConfig?.uploadUrl || ''}
            onChange={e => updateConfig({ uploadUrl: e.target.value })}
          />
          <button onClick={handleTestUbuntu} className="bg-orange-500 text-white px-6 py-4 rounded-2xl font-bold hover:bg-orange-600 transition shadow-lg">تست اتصال</button>
        </div>
      </section>

      {/* Telegram Notification Settings */}
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border dark:border-slate-800 space-y-8">
        <div>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3 dark:text-white">
            <span className="bg-blue-100 text-blue-600 p-2 rounded-xl text-xl">✈️</span>
            گزارشات تلگرام
          </h3>
          
          {/* Detailed Tutorial Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-6 rounded-2xl mb-8 space-y-4 shadow-sm">
            <h4 className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2 text-base">
              <span>📚</span> راهنمای گام‌به‌گام اتصال به تلگرام:
            </h4>
            <div className="text-xs lg:text-sm text-blue-800 dark:text-blue-300 leading-loose space-y-3">
              <p>برای دریافت گزارش‌های خودکار انبار در تلگرام، این مراحل ساده را انجام دهید:</p>
              <ol className="list-decimal pr-5 space-y-3 font-medium">
                <li>
                  <strong>ساخت ربات:</strong> در تلگرام به آیدی <a href="https://t.me/BotFather" target="_blank" className="underline font-bold text-blue-600">@BotFather</a> پیام دهید، دستور <code>/newbot</code> را بزنید و یک نام برای ربات خود انتخاب کنید.
                </li>
                <li>
                  <strong>دریافت Token:</strong> در انتهای مراحل، یک کد طولانی (مثلاً <code>123456:ABC...</code>) به شما می‌دهد. این همان <span className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded font-bold">Bot Token</span> است. آن را کپی کرده و در کادر پایین وارد کنید.
                </li>
                <li>
                  <strong>دریافت Chat ID:</strong> به ربات <a href="https://t.me/userinfobot" target="_blank" className="underline font-bold text-blue-600">@userinfobot</a> پیام دهید. عددی که به شما نمایش می‌دهد (مثلاً <code>987654321</code>) آیدی عددی شماست. آن را در کادر <span className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded font-bold">Chat ID</span> وارد کنید.
                </li>
                <li>
                  <strong>فعال‌سازی و تست:</strong> پس از وارد کردن مقادیر، دکمه "تست اتصال" را بزنید. اگر پیام در تلگرام شما دریافت شد، تیک "فعال‌سازی" را بزنید.
                </li>
              </ol>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 pr-2">Bot Token (از BotFather)</label>
              <input 
                type="text" 
                placeholder="مثلاً: 12345678:AAH-xXyYzZ..."
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs lg:text-sm"
                value={appConfig?.telegram?.botToken || ''}
                onChange={e => updateTelegram({ botToken: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 pr-2">Chat ID (آیدی عددی شما)</label>
              <input 
                type="text" 
                placeholder="مثلاً: 987654321"
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                value={appConfig?.telegram?.chatId || ''}
                onChange={e => updateTelegram({ chatId: e.target.value })}
              />
            </div>
            
            <div className="md:col-span-2 flex flex-col sm:flex-row gap-4">
               <button 
                  type="button" 
                  onClick={handleTestTelegram} 
                  className="flex-1 bg-blue-500 text-white py-4 rounded-2xl font-bold hover:bg-blue-600 transition shadow-lg flex items-center justify-center gap-2"
                >
                  📡 تست اتصال تلگرام
                </button>
               <div className="flex-[2] flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border dark:border-slate-700">
                  <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full shadow-inner bg-gray-300 dark:bg-slate-700">
                    <input 
                      type="checkbox" 
                      id="tg-en" 
                      className="absolute z-10 w-6 h-6 opacity-0 cursor-pointer peer"
                      checked={!!appConfig?.telegram?.enabled} 
                      onChange={e => updateTelegram({ enabled: e.target.checked })}
                    />
                    <div className={`absolute left-0 w-6 h-6 transition-all duration-200 bg-white rounded-full shadow-md peer-checked:left-6 ${appConfig?.telegram?.enabled ? 'bg-blue-600' : 'bg-white'}`}></div>
                    <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${appConfig?.telegram?.enabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-700'}`}></div>
                  </div>
                  <label htmlFor="tg-en" className="font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none">ارسال خودکار گزارش حواله‌ها به تلگرام</label>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Management */}
      <section>
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="text-xl font-bold dark:text-white flex items-center gap-3">
             <span className="bg-purple-100 text-purple-600 p-2 rounded-xl text-xl">👥</span>
             مدیریت دسترسی کاربران
          </h3>
          <button onClick={() => setShowUserModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition">➕ کاربر جدید</button>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border dark:border-slate-800 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500">
              <tr>
                <th className="p-5">نام</th>
                <th className="p-5">نام کاربری</th>
                <th className="p-5">نقش</th>
                <th className="p-5">عملیات</th>
              </tr>
            </thead>
            <tbody className="dark:text-gray-300">
              {users.map(u => (
                <tr key={u.id} className="border-t dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition">
                  <td className="p-5 font-bold">{u.name}</td>
                  <td className="p-5 font-mono text-sm">{u.username}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
                      u.role === UserRole.ADMIN ? 'bg-red-100 text-red-600 dark:bg-red-900/20' : 
                      u.role === UserRole.SALES ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20' : 
                      'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20'
                    }`}>
                      {u.role === UserRole.ADMIN ? 'مدیر' : u.role === UserRole.SALES ? 'فروشنده' : 'انباردار'}
                    </span>
                  </td>
                  <td className="p-5">
                    <button 
                      onClick={() => {
                        if(window.confirm(`آیا از حذف کاربر ${u.name} مطمئن هستید؟`)) {
                          setUsers(users.filter(x => x.id !== u.id));
                        }
                      }} 
                      className="text-red-500 hover:text-red-700 font-bold transition"
                    >حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 w-full max-w-md shadow-2xl scale-in border dark:border-slate-800">
            <h3 className="text-xl font-bold mb-6 dark:text-white">افزودن حساب کاربری</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <input type="text" placeholder="نام نمایشی" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
              <input type="text" placeholder="نام کاربری" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} required />
              <input type="text" placeholder="رمز عبور" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
              <select className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border dark:border-slate-700 outline-none" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                <option value={UserRole.ADMIN}>مدیر سیستم</option>
                <option value={UserRole.SALES}>کارشناس فروش</option>
                <option value={UserRole.STOCKMAN}>انباردار</option>
              </select>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition">ایجاد حساب</button>
                <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-500 py-4 rounded-2xl font-bold hover:bg-gray-200 transition">لغو</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
