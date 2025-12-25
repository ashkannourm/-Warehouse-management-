
import React, { useState } from 'react';
import { User, UserRole, AppConfig, TelegramConfig } from '../types';

interface SettingsPageProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  appConfig: AppConfig;
  setAppConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ users = [], setUsers, appConfig, setAppConfig }) => {
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({ name: '', username: '', password: '', role: UserRole.SALES });

  // Extremely robust fallbacks to prevent crashes during state synchronization
  const safeConfig = appConfig || { 
    uploadUrl: '', 
    telegram: { botToken: '', adminChatId: '', stockmanChatId: '', enabled: false } 
  };
  const safeTelegram = safeConfig.telegram || { 
    botToken: '', adminChatId: '', stockmanChatId: '', enabled: false 
  };
  
  // High-level safety guard for users list
  const safeUsers = Array.isArray(users) ? users.filter(u => u && typeof u === 'object' && u.id) : [];

  const handleOpenAdd = () => {
    setEditingUserId(null);
    setUserForm({ name: '', username: '', password: '', role: UserRole.SALES });
    setShowUserModal(true);
  };

  const handleOpenEdit = (u: User) => {
    if (!u) return;
    setEditingUserId(u.id);
    setUserForm({ 
      name: u.name || '', 
      username: u.username || '', 
      password: u.password || '', 
      role: u.role || UserRole.SALES 
    });
    setShowUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUserId) {
      setUsers(prev => {
        const current = Array.isArray(prev) ? prev : [];
        return current.map(u => u && u.id === editingUserId ? { ...u, ...userForm } : u);
      });
    } else {
      setUsers(prev => {
        const current = Array.isArray(prev) ? prev : [];
        return [...current, { ...userForm, id: Date.now().toString() }];
      });
    }
    setShowUserModal(false);
    setUserForm({ name: '', username: '', password: '', role: UserRole.SALES });
    setEditingUserId(null);
  };

  const handleTestUbuntu = async () => {
    if (!safeConfig.uploadUrl) return alert('ابتدا آدرس سرور را وارد کنید.');
    try {
      const res = await fetch(safeConfig.uploadUrl, { method: 'OPTIONS' });
      if (res.ok || res.status === 405) alert('✅ اتصال به سرور اوبونتو برقرار است!');
      else alert('❌ سرور پاسخگو نیست.');
    } catch {
      alert('❌ خطا در برقراری ارتباط با سرور.');
    }
  };

  const handleTestTelegram = async (id: string) => {
    const { botToken } = safeTelegram;
    if (!botToken || !id) return alert('اطلاعات توکن یا چت‌آیدی ناقص است.');

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: id,
          text: '✅ تست اتصال سامانه انبارداری هوشمند با موفقیت انجام شد!'
        })
      });
      const result = await response.json();
      if (result.ok) alert('✅ پیام تست با موفقیت ارسال شد.');
      else alert(`❌ خطا از طرف تلگرام: ${result.description}`);
    } catch (error) {
      alert('❌ خطا در برقراری ارتباط با تلگرام.');
    }
  };

  const updateConfig = (updates: Partial<AppConfig>) => {
    setAppConfig(prev => {
      const current = prev || { uploadUrl: '', telegram: { botToken: '', adminChatId: '', stockmanChatId: '', enabled: false } };
      return { ...current, ...updates };
    });
  };

  const updateTelegram = (updates: Partial<TelegramConfig>) => {
    setAppConfig(prev => {
      const current = prev || { uploadUrl: '', telegram: { botToken: '', adminChatId: '', stockmanChatId: '', enabled: false } };
      const currentTg = current.telegram || { botToken: '', adminChatId: '', stockmanChatId: '', enabled: false };
      return {
        ...current,
        telegram: { ...currentTg, ...updates }
      };
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 text-right animate-fadeIn font-['IRANSans']" dir="rtl">
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border dark:border-slate-800">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-3 dark:text-white">
          <span className="bg-orange-100 text-orange-600 p-2 rounded-xl text-xl">🖥️</span>
          تنظیمات سرور اوبونتو (تصاویر)
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-bold pr-2">آدرس سرور جهت ذخیره‌سازی تصاویر حواله‌ها و کالاها:</p>
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="https://your-ubuntu-server.com/upload"
            className="flex-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border dark:border-slate-700 outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm font-bold shadow-inner"
            value={safeConfig.uploadUrl || ''}
            onChange={e => updateConfig({ uploadUrl: e.target.value })}
          />
          <button onClick={handleTestUbuntu} className="bg-orange-500 text-white px-6 py-4 rounded-2xl font-bold hover:bg-orange-600 transition shadow-lg text-sm">تست اتصال</button>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border dark:border-slate-800 space-y-8">
        <h3 className="text-xl font-bold flex items-center gap-3 dark:text-white">
          <span className="bg-blue-100 text-blue-600 p-2 rounded-xl text-xl">✈️</span>
          پیکربندی اعلان‌های تلگرام
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 pr-2 font-bold">توکن ربات (Bot Token)</label>
            <input 
              type="text" 
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border dark:border-slate-700 font-mono text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
              placeholder="123456:ABC-DEF..."
              value={safeTelegram.botToken || ''}
              onChange={e => updateTelegram({ botToken: e.target.value })}
            />
          </div>
          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 pr-2 font-bold">Chat ID مدیر سیستم</label>
            <div className="flex gap-2">
              <input type="text" className="flex-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border dark:border-slate-700 font-mono text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={safeTelegram.adminChatId || ''} onChange={e => updateTelegram({ adminChatId: e.target.value })} />
              <button onClick={() => handleTestTelegram(safeTelegram.adminChatId || '')} className="bg-blue-100 text-blue-600 px-5 rounded-xl text-xs font-bold hover:bg-blue-200 transition">تست</button>
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 pr-2 font-bold">Chat ID انباردار</label>
            <div className="flex gap-2">
              <input type="text" className="flex-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border dark:border-slate-700 font-mono text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={safeTelegram.stockmanChatId || ''} onChange={e => updateTelegram({ stockmanChatId: e.target.value })} />
              <button onClick={() => handleTestTelegram(safeTelegram.stockmanChatId || '')} className="bg-blue-100 text-blue-600 px-5 rounded-xl text-xs font-bold hover:bg-blue-200 transition">تست</button>
            </div>
          </div>
          <div className="md:col-span-2 flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border dark:border-slate-700">
             <input type="checkbox" id="tg-en" className="w-6 h-6 rounded accent-blue-600 cursor-pointer" checked={!!safeTelegram.enabled} onChange={e => updateTelegram({ enabled: e.target.checked })} />
             <label htmlFor="tg-en" className="font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none">ارسال خودکار گزارش صدور و تایید حواله‌ها به تلگرام</label>
          </div>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="text-xl font-bold dark:text-white flex items-center gap-3">
             <span className="bg-purple-100 text-purple-600 p-2 rounded-xl text-xl">👥</span>
             مدیریت حساب‌های کاربری
          </h3>
          <button onClick={handleOpenAdd} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition">➕ افزودن حساب جدید</button>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border dark:border-slate-800 overflow-hidden overflow-x-auto shadow-md">
          <table className="w-full text-right">
            <thead className="bg-gray-100 dark:bg-slate-800 text-gray-500 font-bold">
                <tr>
                    <th className="p-5">نام نمایشی</th>
                    <th className="p-5">نام کاربری</th>
                    <th className="p-5">نقش سیستمی</th>
                    <th className="p-5">عملیات</th>
                </tr>
            </thead>
            <tbody className="dark:text-gray-300">
              {safeUsers.map(u => (
                <tr key={u.id} className="border-t dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-5 font-bold">{u.name || 'بدون نام'}</td>
                  <td className="p-5 font-mono text-sm font-bold">{u.username || '---'}</td>
                  <td className="p-5">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          u.role === UserRole.ADMIN ? 'bg-red-100 text-red-600' : 
                          u.role === UserRole.SALES ? 'bg-blue-100 text-blue-600' : 
                          'bg-emerald-100 text-emerald-600'
                      }`}>
                        {u.role === UserRole.ADMIN ? 'مدیر ارشد' : u.role === UserRole.SALES ? 'فروشنده' : 'انباردار'}
                      </span>
                  </td>
                  <td className="p-5">
                    <div className="flex gap-4">
                      <button onClick={() => handleOpenEdit(u)} className="text-blue-500 font-bold text-xs hover:underline">ویرایش</button>
                      <button onClick={() => { if(window.confirm(`آیا از حذف کاربر ${u.name} مطمئن هستید؟`)) setUsers(prev => prev.filter(x => x.id !== u.id)); }} className="text-red-500 font-bold text-xs hover:underline">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
              {safeUsers.length === 0 && (
                  <tr>
                      <td colSpan={4} className="p-10 text-center text-gray-400 font-bold">هیچ کاربری در سیستم یافت نشد.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl scale-in border dark:border-slate-800 font-['IRANSans']">
            <h3 className="text-xl font-bold mb-6 dark:text-white">{editingUserId ? 'ویرایش مشخصات کاربر' : 'ایجاد حساب کاربری جدید'}</h3>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <input type="text" placeholder="نام نمایشی (مثال: محمد علی‌نژاد)" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold shadow-inner" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} required />
              <input type="text" placeholder="نام کاربری جهت ورود" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold shadow-inner" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} required />
              <input type="text" placeholder="رمز عبور" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold shadow-inner" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required />
              <select className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border dark:border-slate-700 outline-none font-bold" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}>
                <option value={UserRole.ADMIN}>مدیر سیستم</option>
                <option value={UserRole.SALES}>کارشناس فروش</option>
                <option value={UserRole.STOCKMAN}>انباردار</option>
              </select>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition">{editingUserId ? 'ذخیره تغییرات' : 'ایجاد حساب'}</button>
                <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-500 py-4 rounded-2xl font-bold">لغو</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
