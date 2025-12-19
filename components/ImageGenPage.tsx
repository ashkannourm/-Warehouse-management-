
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
      if (err.message === "RESELECT_KEY") {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
        }
      } else {
        setError("خطا در تولید تصویر. لطفاً مجدداً تلاش کنید.");
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
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-2xl shadow-sm border">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          ✨ تولید هوشمند تصویر کالا
        </h2>
        <p className="text-gray-500 mb-8">
          با استفاده از هوش مصنوعی Gemini 3 Pro، برای کالاهای جدید خود تصاویر واقع‌گرایانه بسازید.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">توصیف کالا (به انگلیسی نتایج بهتری دارد)</label>
            <textarea
              className="w-full p-4 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-32"
              placeholder="مثال: A professional high-tech mechanical keyboard with RGB lighting on a wooden desk, studio photography..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">کیفیت تصویر</label>
              <div className="flex gap-4">
                {(['1K', '2K', '4K'] as ImageSize[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`px-6 py-2 rounded-lg border transition ${
                      size === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt}
              className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition disabled:opacity-50"
            >
              {loading ? 'در حال تولید...' : 'شروع تولید تصویر'}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border min-h-[400px] flex items-center justify-center relative overflow-hidden">
        {loading ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 font-medium">هوش مصنوعی در حال خلق تصویر شماست...</p>
          </div>
        ) : generatedImageUrl ? (
          <div className="w-full h-full flex flex-col items-center gap-6">
            <img 
                src={generatedImageUrl} 
                alt="Generated Product" 
                className="max-w-full max-h-[500px] rounded-xl shadow-2xl transition transform hover:scale-[1.02]" 
            />
            <a 
                href={generatedImageUrl} 
                download="product-ai.png"
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              📥 دانلود تصویر کالا
            </a>
          </div>
        ) : (
          <div className="text-center text-gray-300 space-y-2">
            <div className="text-6xl">🖼️</div>
            <p>تصویر تولید شده در اینجا نمایش داده می‌شود</p>
          </div>
        )}
      </div>

      <div className="text-center text-sm text-gray-400">
        <p>برای استفاده از این بخش نیاز به تنظیم کلید API در پنل هوش مصنوعی گوگل دارید.</p>
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline hover:text-blue-500">مشاهده مستندات پرداخت</a>
      </div>
    </div>
  );
};

export default ImageGenPage;
