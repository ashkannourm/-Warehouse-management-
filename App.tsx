
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, remove, get } from 'firebase/database';
import { firebaseConfig } from './firebaseConfig';
import { User, UserRole, Product, Customer, Invoice, Category, AppConfig, ChatMessage } from './types';
import { INITIAL_USERS, INITIAL_CATEGORIES } from './constants';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import InventoryPage from './components/InventoryPage';
import CustomersPage from './components/CustomersPage';
import InvoicesPage from './components/InvoicesPage';
import Dashboard from './components/Dashboard';
import CategoriesPage from './components/CategoriesPage';
import SettingsPage from './components/SettingsPage';
import BackupPage from './components/BackupPage';
import FloatingChatBox from './components/FloatingChatBox';

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [lastReadTimestamp, setLastReadTimestamp] = useState<number>(() => Number(localStorage.getItem('lastReadChat')) || 0);
  
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig>({
    uploadUrl: '',
    telegram: { botToken: '', adminChatId: '', stockmanChatId: '', enabled: false }
  });

  // Auto-cleanup old messages (older than 10 days)
  useEffect(() => {
    if (currentUser?.role === UserRole.ADMIN) {
      const cleanupOldMessages = async () => {
        const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const threshold = now - TEN_DAYS_MS;
        
        const messagesRef = ref(db, 'messages');
        const snapshot = await get(messagesRef);
        const data = snapshot.val();
        
        if (data) {
          Object.keys(data).forEach((key) => {
            if (data[key].timestamp < threshold) {
              remove(ref(db, `messages/${key}`));
            }
          });
        }
      };
      cleanupOldMessages();
    }
  }, [currentUser]);

  useEffect(() => {
    const syncRefs = [
      { path: 'users', setter: setUsers, initial: INITIAL_USERS },
      { path: 'categories', setter: setCategories, initial: INITIAL_CATEGORIES },
      { path: 'products', setter: setProducts },
      { path: 'customers', setter: setCustomers },
      { path: 'invoices', setter: setInvoices },
      { path: 'messages', setter: setMessages },
      {
        path: 'config',
        setter: (val: any) => {
          const safeConfig: AppConfig = {
            uploadUrl: val?.uploadUrl || '',
            telegram: {
              botToken: val?.telegram?.botToken || '',
              adminChatId: val?.telegram?.adminChatId || '',
              stockmanChatId: val?.telegram?.stockmanChatId || '',
              enabled: !!val?.telegram?.enabled,
            },
          };
          setAppConfig(safeConfig);
        },
      },
    ];

    let loadedCount = 0;
    syncRefs.forEach(({ path, setter, initial }) => {
      onValue(ref(db, path), (snapshot) => {
        const val = snapshot.val();
        if (val) {
          const dataArray = typeof val === 'object' && !Array.isArray(val) ? Object.values(val) : val;
          if (path === 'config') {
            setter(val);
          } else {
            setter(dataArray as any);
          }
        } else if (initial) {
          set(ref(db, path), initial);
        } else {
          if (path === 'config') {
            setter({ uploadUrl: '', telegram: { botToken: '', adminChatId: '', stockmanChatId: '', enabled: false } } as any);
          } else {
            setter([] as any);
          }
        }
        
        loadedCount++;
        if (loadedCount >= syncRefs.length) setLoading(false);
      });
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const handleLogin = (username: string, password: string) => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (user) setCurrentUser(user);
    else alert('نام کاربری یا رمز عبور اشتباه است.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-right" dir="rtl">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 font-['IRANSans']">در حال اتصال به انبار...</h2>
      </div>
    );
  }

  const renderContent = () => {
    if (!currentUser) return null;
    const updateDb = (path: string, data: any) => set(ref(db, path), data);

    switch (activeTab) {
      case 'dashboard': return <Dashboard invoices={invoices} products={products} currentUser={currentUser} />;
      case 'inventory': 
        return <InventoryPage 
          products={products} 
          setProducts={(update) => {
            const next = typeof update === 'function' ? update(products) : update;
            updateDb('products', next);
          }}
          categories={categories}
          userRole={currentUser.role}
          uploadUrl={appConfig.uploadUrl}
        />;
      case 'categories':
        return <CategoriesPage 
          categories={categories} 
          setCategories={(update) => {
            const next = typeof update === 'function' ? update(categories) : update;
            updateDb('categories', next);
          }}
          userRole={currentUser.role} 
        />;
      case 'customers':
        return <CustomersPage 
          customers={customers} 
          setCustomers={(update) => {
            const next = typeof update === 'function' ? update(customers) : update;
            updateDb('customers', next);
          }}
          userRole={currentUser.role} 
        />;
      case 'invoices':
        return <InvoicesPage 
          invoices={invoices} 
          setInvoices={(update) => {
            const next = typeof update === 'function' ? update(invoices) : update;
            updateDb('invoices', next);
          }}
          products={products}
          setProducts={(update) => {
            const next = typeof update === 'function' ? update(products) : update;
            updateDb('products', next);
          }}
          customers={customers}
          categories={categories}
          currentUser={currentUser}
          telegramConfig={appConfig.telegram}
        />;
      case 'settings':
        return <SettingsPage 
          users={users} 
          setUsers={(update) => {
            const next = typeof update === 'function' ? update(users) : update;
            updateDb('users', next);
          }}
          appConfig={appConfig}
          setAppConfig={(update) => {
            const next = typeof update === 'function' ? update(appConfig) : update;
            updateDb('config', next);
          }}
        />;
      case 'backup':
        return <BackupPage 
          data={{ users, categories, products, customers, invoices }} 
          setData={async (newData) => {
            if (newData.users) updateDb('users', newData.users);
            if (newData.products) updateDb('products', newData.products);
            if (newData.categories) updateDb('categories', newData.categories);
            if (newData.customers) updateDb('customers', newData.customers);
            if (newData.invoices) updateDb('invoices', newData.invoices);
          }} 
        />;
      default: return <Dashboard invoices={invoices} products={products} currentUser={currentUser} />;
    }
  };

  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 text-right transition-colors duration-300" dir="rtl">
      <Sidebar 
        currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} 
        onLogout={() => setCurrentUser(null)} isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} isDarkMode={isDarkMode} 
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
      />
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        <header className="flex items-center justify-between mb-8 border-b dark:border-slate-800 pb-4">
           <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 dark:text-gray-400">
             <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
           </button>
           <h1 className="text-xl font-bold dark:text-white font-['IRANSans']">سامانه هوشمند انبارداری</h1>
           <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-800">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">اتصال زنده فایربیس</span>
           </div>
        </header>
        {renderContent()}
      </main>

      <FloatingChatBox 
        messages={messages}
        currentUser={currentUser}
        lastReadTimestamp={lastReadTimestamp}
        onOpen={() => {
          const now = Date.now();
          setLastReadTimestamp(now);
          localStorage.setItem('lastReadChat', String(now));
        }}
        onSendMessage={(text) => {
          const msgRef = ref(db, 'messages');
          const newMsg = push(msgRef);
          set(newMsg, {
            id: newMsg.key,
            senderId: currentUser.id,
            senderName: currentUser.name,
            text,
            timestamp: Date.now()
          });
          setLastReadTimestamp(Date.now());
          localStorage.setItem('lastReadChat', String(Date.now()));
        }}
        onClearHistory={() => {
          const msgRef = ref(db, 'messages');
          remove(msgRef);
        }}
      />
    </div>
  );
};

export default App;
