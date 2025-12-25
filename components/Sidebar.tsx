
import React from 'react';
import { User, UserRole } from '../types';

interface SidebarProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, activeTab, setActiveTab, onLogout, isOpen, onClose, isDarkMode, toggleDarkMode }) => {
  const menuItems = [
    { id: 'dashboard', label: 'پیشخوان', icon: '📊', roles: [UserRole.ADMIN, UserRole.SALES, UserRole.STOCKMAN] },
    { id: 'analytics', label: 'آمار و تحلیل', icon: '📈', roles: [UserRole.ADMIN, UserRole.SALES] }, // STOCKMAN removed
    { id: 'invoices', label: 'صدور حواله', icon: '📝', roles: [UserRole.ADMIN, UserRole.SALES, UserRole.STOCKMAN] },
    { id: 'inventory', label: 'انبار و موجودی', icon: '📦', roles: [UserRole.ADMIN, UserRole.SALES, UserRole.STOCKMAN] },
    { id: 'categories', label: 'دسته‌بندی‌ها', icon: '📂', roles: [UserRole.ADMIN, UserRole.SALES] },
    { id: 'customers', label: 'مشتریان', icon: '👥', roles: [UserRole.ADMIN, UserRole.SALES] },
    { id: 'backup', label: 'پشتیبان‌گیری', icon: '💾', roles: [UserRole.ADMIN] },
    { id: 'settings', label: 'تنظیمات کاربران', icon: '⚙️', roles: [UserRole.ADMIN] },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (onClose) onClose(); 
  };

  return (
    <aside className={`
      fixed inset-y-0 right-0 z-[100] w-64 bg-white dark:bg-slate-900 border-l dark:border-slate-800 shadow-sm flex flex-col transition-all duration-300 lg:translate-x-0 lg:static lg:inset-0
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}
    `}>
      <div className="p-6 border-b dark:border-slate-800 text-center relative">
        <button 
          onClick={onClose}
          className="lg:hidden absolute top-4 left-4 text-gray-400 hover:text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg">
          {currentUser.name.charAt(0)}
        </div>
        <h2 className="font-bold text-gray-800 dark:text-gray-100 font-['IRANSans']">{currentUser.name}</h2>
        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['IRANSans']">
          {currentUser.role === UserRole.ADMIN ? 'مدیر' : currentUser.role === UserRole.SALES ? 'فروشنده' : 'انباردار'}
        </span>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems
          .filter(item => item.roles.includes(currentUser.role))
          .map(item => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-['IRANSans'] ${
                activeTab === item.id 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-bold' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
      </nav>

      <div className="p-4 border-t dark:border-slate-800 space-y-2 font-['IRANSans']">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition font-bold"
        >
          <div className="flex items-center gap-3">
            <span>{isDarkMode ? '🌙' : '☀️'}</span>
            <span>{isDarkMode ? 'حالت شب' : 'حالت روز'}</span>
          </div>
          <div className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? 'left-6' : 'left-1'}`}></div>
          </div>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition font-bold"
        >
          <span>🚪</span>
          <span>خروج از حساب</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
