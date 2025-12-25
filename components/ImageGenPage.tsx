
import React, { useState, useEffect } from 'react';
import { generateProductImage } from '../geminiService';
import { ImageSize } from '../types';

const ImageGenPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>('1K');
  const [loading, setLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const url = await generateProductImage(prompt, size);
      setGeneratedImageUrl(url);
    } catch (err: any) {
      console.error("Full Error Info:", err);
      const errorMessage = err.message || "";
      
      if (errorMessage === "RESELECT_KEY" || errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("401")) {
        setError("⚠️ کلید API شما نامعتبر یا منقضی شده است. لطفاً یک کلید معتبر از پروژه‌های Paid انتخاب کنید.");
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
        }
      } else if (errorMessage.includes("Safety") || errorMessage.includes("blocked")) {
        setError("🚫 تولید تصویر به دلیل محدودیت‌های ایمنی و اخلاقی هوش مصنوعی مسدود شد. لطفاً توصیف خود را تغییر دهید (مثلاً از کلمات حساس استفاده نکنید).");
      } else if (errorMessage.includes("quota") || errorMessage.includes("429") || errorMessage.includes("exhausted")) {
        setError("⏳ سهمیه استفاده شما از مدل Gemini به پایان رسیده است. لطفاً دقایقی دیگر مجدداً تلاش کنید.");
      } else if (errorMessage.includes("failed to fetch") || errorMessage.includes("network")) {
        setError("🌐 خطا در برقراری ارتباط با سرورهای گوگل. لطفاً اتصال اینترنت یا ابزار تغییر IP خود را بررسی کنید.");
      } else {
        setError(`❌ خطای غیرمنتظره: ${errorMessage || "مشکلی در تولید تصویر به وجود آمد. لطفاً دوباره تلاش کنید."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkAndOpenKey = async () => {
    if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await window.aistudio.openSelectKey();
        }
    }
  };

  useEffect(() => {
    checkAndOpenKey();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-24 px-4" dir="rtl">
      <div className="bg-white dark:bg-slate-900 p-6 lg:p-10 rounded-[2.5rem] shadow-sm border dark:border-slate-800 transition-all">
        <h2 className="text-xl lg:text-3xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-3">
          <span className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-2xl text-2xl lg:text-3xl">✨</span>
          تولید هوشمند تصویر کالا
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium">
          با استفاده از هوش مصنوعی قدرتمند Gemini 3 Pro، برای کالاهای خود تصاویر آتلیه‌ای و حرفه‌ای خلق کنید.
        </p>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 pr-2">توصیف کالا (انگلیسی بنویسید)</label>
            <textarea
              className="w-full p-5 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-3xl outline-none focus:ring-2 focus:ring-blue-500 h-32 text-sm lg:text-base transition-all resize-none shadow-inner"
              placeholder="مثال: A cinematic studio photo of a modern gaming mouse with neon lighting, 8k resolution, white background..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1 space-y-3">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 pr-2">کیفیت خروجی</label>
              <div className="flex p-1.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border dark:border-slate-700">
                {(['1K', '2K', '4K'] as ImageSize[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      size === s 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full lg:w-auto mt-auto bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-12 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-30 active:scale-95"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  در حال تولید...
                </span>
              ) : '🚀 شروع خلق تصویر'}
            </button>
          </div>

          {error && (
            <div className="p-5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/50 text-xs lg:text-sm font-bold animate-shake leading-loose">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 lg:p-8 rounded-[2.5rem] shadow-sm border dark:border-slate-800 min-h-[400px] flex items-center justify-center relative overflow-hidden transition-all">
        {loading ? (
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center text-xl">🎨</div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-bold animate-pulse">هوش مصنوعی در حال پردازش درخواست شماست...</p>
          </div>
        ) : generatedImageUrl ? (
          <div className="w-full h-full flex flex-col items-center gap-6 animate-scaleIn">
            <img 
                src={generatedImageUrl} 
                alt="Generated Product" 
                className="max-w-full max-h-[550px] rounded-3xl shadow-2xl transition transform hover:scale-[1.01] border-4 border-white dark:border-slate-800" 
            />
            <div className="flex gap-4">
              <a 
                  href={generatedImageUrl} 
                  download={`ai-product-${Date.now()}.png`}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-xl hover:bg-emerald-700 transition font-bold shadow-lg flex items-center gap-2"
              >
                <span>📥</span> دانلود تصویر
              </a>
              <button 
                onClick={() => setGeneratedImageUrl(null)}
                className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition"
              >
                پاکسازی
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-300 dark:text-slate-700 space-y-4">
            <div className="text-8xl">🖼️</div>
            <p className="font-bold">تصویر تولید شده در این کادر نمایش داده می‌شود</p>
            <p className="text-[10px] opacity-60">توصیه‌های متنی دقیق‌تر منجر به نتایج با کیفیت‌تری خواهد شد.</p>
          </div>
        )}
      </div>

      <div className="text-center space-y-2">
        <p className="text-xs text-gray-400 font-medium">این بخش از API مستقیم گوگل استفاده می‌کند.</p>
        <div className="flex justify-center gap-4 text-[10px] font-bold">
           <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-blue-500 underline">مستندات پرداخت گوگل</a>
           <button onClick={() => window.aistudio?.openSelectKey()} className="text-purple-500 underline">تغییر کلید API</button>
        </div>
      </div>
    </div>
  );
};

export default ImageGenPage;
