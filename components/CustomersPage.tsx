
import React, { useState, useEffect, useRef } from 'react';
import { Customer, UserRole } from '../types';

interface CustomersPageProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  userRole: UserRole;
}

const MapPickerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (url: string) => void;
  initialUrl?: string;
}> = ({ isOpen, onClose, onConfirm, initialUrl }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    if (isOpen && mapContainerRef.current) {
      // Default to Tehran if no initial URL
      let lat = 35.6892;
      let lng = 51.3890;

      if (initialUrl) {
        const match = initialUrl.match(/query=([-+]?\d*\.\d+|\d+),([-+]?\d*\.\d+|\d+)/);
        if (match) {
          lat = parseFloat(match[1]);
          lng = parseFloat(match[2]);
        }
      }

      const L = (window as any).L;
      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current).setView([lat, lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapRef.current);

        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
        setSelectedCoords({ lat, lng });

        mapRef.current.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          markerRef.current.setLatLng([lat, lng]);
          setSelectedCoords({ lat, lng });
        });

        markerRef.current.on('dragend', () => {
          const pos = markerRef.current.getLatLng();
          setSelectedCoords({ lat: pos.lat, lng: pos.lng });
        });
      }

      // Cleanup on unmount or close
      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (selectedCoords) {
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${selectedCoords.lat},${selectedCoords.lng}`;
      onConfirm(googleMapsUrl);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-white/20">
        <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2">📍 انتخاب لوکیشن مشتری</h3>
          <button onClick={onClose} className="text-2xl">&times;</button>
        </div>
        <div className="p-4 space-y-4">
          <div 
            ref={mapContainerRef} 
            className="w-full h-[400px] rounded-2xl overflow-hidden border-4 border-slate-100 dark:border-slate-800"
          ></div>
          <p className="text-xs text-gray-500 text-center font-bold">نشانگر را روی محل دقیق مشتری قرار دهید یا روی نقشه کلیک کنید.</p>
          <div className="flex gap-3">
            <button 
              onClick={handleConfirm}
              className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg"
            >
              تایید و ثبت موقعیت
            </button>
            <button 
              onClick={onClose}
              className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 py-4 rounded-xl font-bold hover:bg-gray-200 transition"
            >
              انصراف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomersPage: React.FC<CustomersPageProps> = ({ customers, setCustomers, userRole }) => {
  const [showModal, setShowModal] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', locationUrl: '' });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', phone: '', address: '', locationUrl: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingId(c.id);
    setFormData({ name: c.name, phone: c.phone, address: c.address, locationUrl: c.locationUrl || '' });
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
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  const openMap = (url?: string) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('لوکیشن برای این مشتری ثبت نشده است.');
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg lg:text-xl font-bold text-gray-800 dark:text-gray-100">بانک مشتریان</h2>
        <button onClick={handleOpenAdd} className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition font-bold shadow-lg">➕ مشتری جدید</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map(customer => (
          <div key={customer.id} className="bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-2xl lg:rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 space-y-4 relative group hover:shadow-xl transition-all text-right">
            <h3 className="font-bold text-lg lg:text-xl text-gray-800 dark:text-gray-100">{customer.name}</h3>
            <div className="space-y-2">
              <p className="text-gray-600 dark:text-gray-400 text-xs lg:text-sm flex items-center gap-2">
                <span className="text-blue-500">📞</span> {customer.phone}
              </p>
              <p className="text-gray-400 text-[10px] lg:text-xs min-h-[40px] leading-relaxed">
                <span className="text-blue-500">📍</span> {customer.address}
              </p>
            </div>
            <div className="pt-4 border-t dark:border-slate-800 grid grid-cols-2 gap-2">
               <button onClick={() => openMap(customer.locationUrl)} className="flex items-center justify-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 py-2 rounded-xl text-xs font-bold border border-emerald-100 dark:border-emerald-800 transition">
                  📍 نقشه
               </button>
               <button onClick={() => handleOpenEdit(customer)} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 py-2 rounded-xl text-xs font-bold border border-blue-50 dark:border-slate-800 transition">
                  ویرایش
               </button>
               <button 
                type="button"
                onClick={() => handleDelete(customer.id)} 
                className="col-span-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 rounded-xl text-xs font-bold border border-red-50 dark:border-slate-800 transition"
               >
                 حذف مشتری
               </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-right overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl lg:rounded-3xl p-6 lg:p-8 w-full max-w-md shadow-2xl scale-in my-auto">
            <h3 className="text-xl lg:text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">{editingId ? 'ویرایش مشتری' : 'ثبت مشتری جدید'}</h3>
            <form onSubmit={handleSave} className="space-y-4 lg:space-y-5">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5 font-bold">نام و نام خانوادگی / شرکت</label>
                <input 
                  type="text" 
                  className="w-full p-3 lg:p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-white border-none outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5 font-bold">شماره تماس</label>
                <input 
                  type="text" 
                  className="w-full p-3 lg:p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5 font-bold">لوکیشن مشتری</label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    placeholder="https://maps.google.com/..."
                    className="flex-1 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-blue-500 text-xs font-mono" 
                    value={formData.locationUrl} 
                    onChange={(e) => setFormData({...formData, locationUrl: e.target.value})} 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className="bg-emerald-600 text-white px-4 rounded-xl hover:bg-emerald-700 transition shadow-md text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    <span>🗺️</span> انتخاب
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5 font-bold">آدرس دقیق</label>
                <textarea 
                  className="w-full p-3 lg:p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  rows={3} 
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                  required 
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-6 lg:mt-8">
                <button type="submit" className="w-full sm:flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">ذخیره مشتری</button>
                <button type="button" onClick={() => setShowModal(false)} className="w-full sm:flex-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 py-4 rounded-xl font-bold hover:bg-gray-200 transition">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Map Picker Modal Component */}
      <MapPickerModal 
        isOpen={showMapPicker} 
        onClose={() => setShowMapPicker(false)}
        onConfirm={(url) => setFormData({...formData, locationUrl: url})}
        initialUrl={formData.locationUrl}
      />
    </div>
  );
};

export default CustomersPage;
