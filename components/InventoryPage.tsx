
import React, { useState, useMemo } from 'react';
import { Product, UserRole, Category } from '../types';

interface InventoryPageProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: Category[];
  userRole: UserRole;
  uploadUrl: string;
}

const InventoryPage: React.FC<InventoryPageProps> = ({ products, setProducts, categories, userRole, uploadUrl }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', stock: 0, unit: 'عدد', image: '' });

  // Alphabetical sort for categories
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name, 'fa'));
  }, [categories]);

  const nextId = useMemo(() => {
    const ids = products.map(p => parseInt(p.id)).filter(id => !isNaN(id));
    return (ids.length > 0 ? Math.max(...ids) + 1 : 1001).toString();
  }, [products]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploadUrl) {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      
      try {
        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        if (result.url) {
          setForm(prev => ({ ...prev, image: result.url }));
        }
      } catch (error) {
        alert('خطا در آپلود به سرور اوبونتو. فایل به صورت داخلی ذخیره می‌شود.');
        const reader = new FileReader();
        reader.onloadend = () => setForm(prev => ({ ...prev, image: reader.result as string }));
        reader.readAsDataURL(file);
      } finally {
        setUploading(false);
      }
    } else {
      const reader = new FileReader();
      reader.onloadend = () => setForm(prev => ({ ...prev, image: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { ...form, id: p.id } : p));
    } else {
      setProducts([...products, { ...form, id: nextId }]);
    }
    setShowModal(false);
  };

  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    // Sort categories alphabetically before grouping
    const cats = [...categories].sort((a, b) => a.name.localeCompare(b.name, 'fa'));
    
    cats.forEach(cat => {
      groups[cat.name] = products.filter(p => p.category === cat.name).sort((a, b) => a.name.localeCompare(b.name, 'fa'));
    });
    
    const others = products.filter(p => !categories.some(cat => cat.name === p.category)).sort((a, b) => a.name.localeCompare(b.name, 'fa'));
    if (others.length > 0) groups['سایر موارد'] = others;
    return groups;
  }, [products, categories]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold dark:text-white">موجودی انبار کالا</h2>
        {userRole !== UserRole.STOCKMAN && (
          <button onClick={() => { setEditingProduct(null); setForm({name:'', category:'', stock:0, unit:'عدد', image:''}); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">➕ کالا جدید</button>
        )}
      </div>

      <div className="space-y-12">
        {(Object.entries(groupedProducts) as [string, Product[]][]).map(([catName, items]) => (
          items.length > 0 && (
            <div key={catName} className="space-y-4">
              <h3 className="text-lg font-bold border-r-4 border-blue-600 pr-3 dark:text-gray-200">{catName}</h3>
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border dark:border-slate-800 overflow-hidden">
                <table className="w-full text-right">
                  <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="p-4">تصویر</th>
                      <th className="p-4">نام</th>
                      <th className="p-4">موجودی</th>
                      <th className="p-4">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(p => (
                      <tr key={p.id} className="border-t dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-4">
                          <img src={p.image || 'https://via.placeholder.com/100'} className="w-12 h-12 object-cover rounded-xl border dark:border-slate-700" alt={p.name} />
                        </td>
                        <td className="p-4 font-bold dark:text-white">{p.name}</td>
                        <td className="p-4 font-bold text-blue-600 dark:text-blue-400">{p.stock} {p.unit}</td>
                        <td className="p-4">
                          {userRole === UserRole.ADMIN && (
                            <button onClick={() => { setEditingProduct(p); setForm({ name: p.name, category: p.category, stock: p.stock, unit: p.unit, image: p.image || '' }); setShowModal(true); }} className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded-lg font-bold dark:text-gray-300">ویرایش</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 w-full max-w-md shadow-2xl scale-in" dir="rtl">
            <h3 className="text-xl font-bold mb-6 dark:text-white">{editingProduct ? 'ویرایش کالا' : 'ثبت کالای جدید'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="نام کالا" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border-none outline-none focus:ring-2 focus:ring-blue-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <select className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border-none outline-none" value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
                <option value="">دسته کالا...</option>
                {sortedCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="موجودی" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border-none" value={form.stock} onChange={e => setForm({...form, stock: parseInt(e.target.value)})} />
                <input type="text" placeholder="واحد" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border-none" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} />
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed dark:border-slate-700 text-center">
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="file-up" />
                <label htmlFor="file-up" className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 font-bold">
                  {uploading ? 'در حال آپلود به اوبونتو...' : '📸 انتخاب تصویر کالا'}
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition transform active:scale-95">ذخیره نهایی</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 py-4 rounded-2xl font-bold transition">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
