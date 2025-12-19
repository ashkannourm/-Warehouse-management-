
import React, { useState } from 'react';
import { Customer, UserRole } from '../types';

interface CustomersPageProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  userRole: UserRole;
}

const CustomersPage: React.FC<CustomersPageProps> = ({ customers, setCustomers, userRole }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', phone: '', address: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingId(c.id);
    setFormData({ name: c.name, phone: c.phone, address: c.address });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setCustomers(customers.map(c => c.id === editingId ? { ...c, ...formData } : c));
    } else {
      setCustomers([...customers, { ...formData, id: Date.now().toString() }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    const isConfirmed = window.confirm('آیا مایل به حذف این مشتری از لیست هستید؟');
    if (isConfirmed) {
      const filtered = customers.filter(c => c.id !== id);
      setCustomers([...filtered]);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg lg:text-xl font-bold text-gray-800">بانک مشتریان</h2>
        <button onClick={handleOpenAdd} className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition font-bold shadow-lg">➕ مشتری جدید</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map(customer => (
          <div key={customer.id} className="bg-white p-5 lg:p-6 rounded-2xl lg:rounded-3xl shadow-sm border border-gray-100 space-y-4 relative group hover:shadow-xl hover:translate-y-[-4px] transition-all text-right">
            <h3 className="font-bold text-lg lg:text-xl text-gray-800">{customer.name}</h3>
            <div className="space-y-2">
              <p className="text-gray-600 text-xs lg:text-sm flex items-center gap-2">
                <span className="text-blue-500">📞</span> {customer.phone}
              </p>
              <p className="text-gray-400 text-[10px] lg:text-xs h-10 overflow-hidden leading-relaxed">
                <span className="text-blue-500">📍</span> {customer.address}
              </p>
            </div>
            <div className="pt-4 border-t flex justify-between items-center gap-2">
               <button onClick={() => handleOpenEdit(customer)} className="flex-1 text-blue-600 hover:bg-blue-50 py-2 rounded-xl text-xs lg:text-sm font-bold border border-blue-50 transition">ویرایش</button>
               <button 
                type="button"
                onClick={() => handleDelete(customer.id)} 
                className="flex-1 text-red-500 hover:bg-red-50 py-2 rounded-xl text-xs lg:text-sm font-bold border border-red-50 transition"
               >
                 حذف
               </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-right overflow-y-auto">
          <div className="bg-white rounded-2xl lg:rounded-3xl p-6 lg:p-8 w-full max-w-md shadow-2xl scale-in my-auto">
            <h3 className="text-xl lg:text-2xl font-bold mb-6 text-gray-900">{editingId ? 'ویرایش مشتری' : 'ثبت مشتری جدید'}</h3>
            <form onSubmit={handleSave} className="space-y-4 lg:space-y-5">
              <div>
                <label className="block text-sm text-gray-700 mb-1.5 font-bold">نام و نام خانوادگی / شرکت</label>
                <input 
                  type="text" 
                  className="w-full p-3 lg:p-3.5 rounded-xl bg-slate-800 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5 font-bold">شماره تماس</label>
                <input 
                  type="text" 
                  className="w-full p-3 lg:p-3.5 rounded-xl bg-slate-800 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5 font-bold">آدرس</label>
                <textarea 
                  className="w-full p-3 lg:p-3.5 rounded-xl bg-slate-800 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  rows={3} 
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                  required 
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-6 lg:mt-8">
                <button type="submit" className="w-full sm:flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition">ذخیره</button>
                <button type="button" onClick={() => setShowModal(false)} className="w-full sm:flex-1 bg-gray-100 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-200 transition">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
