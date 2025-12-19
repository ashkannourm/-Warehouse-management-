
import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-slate-900 p-4 font-['IRANSans','Vazirmatn',sans-serif]">
      <div className="bg-white/10 backdrop-blur-md w-full max-w-md p-8 rounded-3xl shadow-2xl border border-white/20">
        <div className="text-center mb-10">
          <div className="inline-block p-4 rounded-full bg-blue-500/20 mb-4 text-blue-400">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
             </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">ورود به سامانه انبارداری</h1>
          <p className="text-blue-200 mt-2">خوش آمدید، لطفاً وارد شوید</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">نام کاربری</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="Admin / Seller / Warehouse"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-white font-medium mb-2">رمز عبور</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-left placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
              dir="ltr"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition transform active:scale-95"
          >
            ورود به سیستم
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
