
import React, { useState, useMemo } from 'react';
import { Category, UserRole } from '../types';

interface CategoriesPageProps {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  userRole: UserRole;
}

const CategoriesPage: React.FC<CategoriesPageProps> = ({ categories, setCategories, userRole }) => {
  const [newCat, setNewCat] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name, 'fa'));
  }, [categories]);

  const add = () => {
    if (!newCat.trim()) return;
    setCategories([...categories, { id: Date.now().toString(), name: newCat }]);
    setNewCat('');
  };

  const handleEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditValue(currentName);
  };

  const saveEdit = () => {
    if (!editValue.trim()) return;
    setCategories(categories.map(c => c.id === editingId ? { ...c, name: editValue } : c));
    setEditingId(null);
  };

  const del = (id: string) => {
    if (window.confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-right" dir="rtl">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">مدیریت دسته‌بندی‌ها</h2>
      <div className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-3xl shadow-sm border dark:border-slate-800 space-y-6">
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="نام دسته‌بندی جدید..." 
            className="flex-1 p-4 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-white border dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
          />
          <button onClick={add} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">افزودن</button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {sortedCategories.map(c => (
            <div key={c.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border dark:border-slate-700 group hover:border-blue-200 dark:hover:border-blue-900 transition-all">
              {editingId === c.id ? (
                <div className="flex-1 flex gap-2">
                  <input type="text" className="flex-1 p-2 rounded-lg bg-white dark:bg-slate-700 dark:text-white outline-none ring-1 ring-blue-500" value={editValue} onChange={e => setEditValue(e.target.value)} />
                  <button onClick={saveEdit} className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold">تایید</button>
                  <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white px-4 py-2 rounded-lg text-xs font-bold">لغو</button>
                </div>
              ) : (
                <>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{c.name}</span>
                  <div className="flex gap-2">
                    {userRole === UserRole.ADMIN && (
                      <>
                        <button onClick={() => handleEdit(c.id, c.name)} className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-bold">ویرایش</button>
                        <button onClick={() => del(c.id)} className="text-red-600 dark:text-red-400 hover:underline text-xs font-bold">حذف</button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
