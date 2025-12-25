
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
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    let timeoutId: number;
    let isActive = true;
    
    if (isOpen && mapContainerRef.current) {
      timeoutId = window.setTimeout(() => {
        if (!isActive || !mapContainerRef.current) return;

        const L = (window as any).L;
        if (!L) return;

        // Leaflet Cleanup Check
        const container = mapContainerRef.current;
        if ((container as any)._leaflet_id) return;

        let lat = 35.6892;
        let lng = 51.3890;

        if (initialUrl) {
          const match = initialUrl.match(/query=([-+]?\d*\.\d+|\d+),([-+]?\d*\.\d+|\d+)/);
          if (match) {
            lat = parseFloat(match[1]);
            lng = parseFloat(match[2]);
          }
        }

        try {
          mapRef.current = L.map(container, {
            zoomControl: false,
            attributionControl: false
          }).setView([lat, lng], 15);

          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
          }).addTo(mapRef.current);

          markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
          setSelectedCoords({ lat, lng });
          setIsMapReady(true);

          setTimeout(() => {
              if (mapRef.current) mapRef.current.invalidateSize();
          }, 100);

          mapRef.current.on('click', (e: any) => {
            const { lat, lng } = e.latlng;
            if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
            setSelectedCoords({ lat, lng });
          });

          markerRef.current.on('dragend', () => {
            const pos = markerRef.current.getLatLng();
            setSelectedCoords({ lat: pos.lat, lng: pos.lng });
          });
        } catch (error) {
          console.error("Map creation failed:", error);
        }
      }, 400);
    }

    return () => {
      isActive = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (mapRef.current) {
        try { 
            mapRef.current.off();
            mapRef.current.remove(); 
        } catch (e) {}
        mapRef.current = null;
      }
      setIsMapReady(false);
    };
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[1000] animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border dark:border-slate-800">
        <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2 font-['IRANSans']">📍 انتخاب لوکیشن دقیق مشتری</h3>
          <button onClick={onClose} className="text-2xl leading-none">&times;</button>
        </div>
        <div className="p-4 space-y-4">
          <div ref={mapContainerRef} className="relative w-full h-[380px] sm:h-[450px] rounded-2xl overflow-hidden border-4 border-slate-100 dark:border-slate-800 bg-slate-200 shadow-inner">
            {!isMapReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-100 dark:bg-slate-800">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={handleConfirm} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg active:scale-95 font-['IRANSans']">تایید و ثبت موقعیت</button>
            <button onClick={onClose} className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-600 py-4 rounded-xl font-bold font-['IRANSans']">انصراف</button>
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

  const openMap = (url?: string) => {
    if (!url) return alert('لوکیشن ثبت نشده است.');
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 text-right animate-fadeIn" dir="rtl">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 font-['IRANSans']">بانک مشتریان</h2>
        <button onClick={() => { setEditingId(null); setFormData({name:'', phone:'', address:'', locationUrl:''}); setShowModal(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg">➕ افزودن مشتری</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map(customer => (
          <div key={customer.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 space-y-4 transition-all hover:shadow-xl">
            <h3 className="font-bold text-lg dark:text-white">{customer.name}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">📞 {customer.phone}</p>
            <p className="text-gray-400 text-xs leading-relaxed">📍 {customer.address}</p>
            <div className="pt-4 border-t dark:border-slate-800 grid grid-cols-2 gap-3">
               <button onClick={() => openMap(customer.locationUrl)} className="bg-emerald-50 text-emerald-600 py-2.5 rounded-xl text-xs font-bold transition hover:bg-emerald-100">📍 مسیریابی</button>
               <button onClick={() => handleOpenEdit(customer)} className="text-blue-600 py-2.5 rounded-xl text-xs font-bold border border-blue-50 transition hover:bg-blue-50">ویرایش</button>
               <button onClick={() => { if(window.confirm('حذف؟')) setCustomers(customers.filter(c => c.id !== customer.id)); }} className="col-span-2 text-red-500 py-2.5 rounded-xl text-xs font-bold border border-red-50">حذف</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[500] overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl my-auto border dark:border-slate-800">
            <h3 className="text-xl font-bold mb-6 dark:text-white">مشخصات مشتری</h3>
            <form onSubmit={handleSave} className="space-y-5 font-['IRANSans']">
              <input type="text" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border-none outline-none font-bold" placeholder="نام مشتری" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              <input type="text" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border-none outline-none font-bold" placeholder="شماره تماس" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
              <div className="flex gap-2">
                <input type="url" placeholder="لینک نقشه..." className="flex-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border-none font-mono text-[10px]" value={formData.locationUrl} onChange={(e) => setFormData({...formData, locationUrl: e.target.value})} />
                <button type="button" onClick={() => setShowMapPicker(true)} className="bg-emerald-600 text-white px-5 rounded-2xl text-xs font-bold">🗺️ نقشه</button>
              </div>
              <textarea className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border-none outline-none font-bold text-sm" placeholder="آدرس پستی" rows={3} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required />
              <div className="flex gap-4">
                <button type="submit" className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-bold">ذخیره</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-500 py-4 rounded-2xl font-bold">لغو</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MapPickerModal isOpen={showMapPicker} onClose={() => setShowMapPicker(false)} onConfirm={(url) => setFormData({...formData, locationUrl: url})} initialUrl={formData.locationUrl} />
    </div>
  );
};

export default CustomersPage;
