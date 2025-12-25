
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Invoice, InvoiceStatus, InvoiceType, User, UserRole, Product, InvoiceItem, Customer, Category, TelegramConfig } from '../types';

interface InvoicesPageProps {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  customers: Customer[];
  categories: Category[];
  currentUser: User;
  telegramConfig: TelegramConfig;
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
    let timeoutId: number;
    let isActive = true;

    if (isOpen && mapContainerRef.current) {
      timeoutId = window.setTimeout(() => {
        if (!isActive || !mapContainerRef.current) return;
        const L = (window as any).L;
        if (!L) return;
        const container = mapContainerRef.current;
        if ((container as any)._leaflet_id) return;

        let lat = 35.6892, lng = 51.3890;
        if (initialUrl) {
          const match = initialUrl.match(/query=([-+]?\d*\.\d+|\d+),([-+]?\d*\.\d+|\d+)/);
          if (match) { lat = parseFloat(match[1]); lng = parseFloat(match[2]); }
        }

        try {
            mapRef.current = L.map(container, { zoomControl: false, attributionControl: false }).setView([lat, lng], 15);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(mapRef.current);
            markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
            setSelectedCoords({ lat, lng });
            setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 100);
            mapRef.current.on('click', (e: any) => {
              const { lat, lng } = e.latlng;
              if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
              setSelectedCoords({ lat, lng });
            });
            markerRef.current.on('dragend', () => {
              const pos = markerRef.current.getLatLng();
              setSelectedCoords({ lat: pos.lat, lng: pos.lng });
            });
        } catch (e) { console.error("Map Error:", e); }
      }, 400);
    }
    
    return () => {
      isActive = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [isOpen]);

  const handleConfirm = () => {
    if (selectedCoords) {
      onConfirm(`https://www.google.com/maps/search/?api=1&query=${selectedCoords.lat},${selectedCoords.lng}`);
      onClose();
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[1000]">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border dark:border-slate-800 font-['IRANSans']">
        <div className="p-5 bg-blue-600 text-white flex justify-between items-center font-bold">
          <h3>📍 تعیین موقعیت تحویل</h3>
          <button onClick={onClose} className="text-2xl leading-none">&times;</button>
        </div>
        <div className="p-4 space-y-4">
          <div ref={mapContainerRef} className="w-full h-[350px] sm:h-[450px] rounded-2xl bg-slate-200"></div>
          <div className="flex gap-3">
            <button onClick={handleConfirm} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg">تایید موقعیت</button>
            <button onClick={onClose} className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-600 py-4 rounded-xl font-bold">انصراف</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InvoicesPage: React.FC<InvoicesPageProps> = ({ invoices, setInvoices, products, setProducts, customers, categories, currentUser, telegramConfig }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [shipmentImages, setShipmentImages] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    type: InvoiceType.OUTGOING, items: [], description: '', isAlternativeAddress: false, recipientName: '', recipientPhone: '', alternativeLocationUrl: ''
  });

  const [searchCustomer, setSearchCustomer] = useState('');
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [activeItem, setActiveItem] = useState<{ productId: string, quantity: number }>({ productId: '', quantity: 1 });

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const visibleInvoices = useMemo(() => {
    if (currentUser.role === UserRole.SALES) return invoices.filter(inv => inv.sellerName === currentUser.name);
    return invoices;
  }, [invoices, currentUser]);

  const filteredCustomers = useMemo(() => searchCustomer ? customers.filter(c => c.name.includes(searchCustomer)) : [], [searchCustomer, customers]);
  const selectedProduct = useMemo(() => products.find(p => p.id === activeItem.productId), [products, activeItem.productId]);
  
  const isOutOfStock = useMemo(() => {
    if (newInvoice.type === InvoiceType.OUTGOING && selectedProduct) {
        return activeItem.quantity > selectedProduct.stock;
    }
    return false;
  }, [newInvoice.type, selectedProduct, activeItem.quantity]);

  // تابع ارسال اعلان به تلگرام
  const sendTelegramNotification = async (message: string) => {
    if (!telegramConfig || !telegramConfig.enabled || !telegramConfig.botToken) return;
    const chatIds = [telegramConfig.adminChatId, telegramConfig.stockmanChatId].filter(id => id);
    for (const chatId of chatIds) {
      try {
        await fetch(`https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
        });
      } catch (err) { console.error("Telegram error:", err); }
    }
  };

  const adjustStock = (productId: string, quantity: number, type: InvoiceType, isRemoving: boolean = false) => {
    setProducts(prev => {
      const current = Array.isArray(prev) ? prev : [];
      return current.map(p => {
        if (p.id === productId) {
          const factor = type === InvoiceType.OUTGOING ? -1 : 1;
          const change = isRemoving ? -quantity : quantity;
          return { ...p, stock: p.stock + (factor * change) };
        }
        return p;
      });
    });
  };

  const handleAddItem = () => {
    const p = products.find(x => x.id === activeItem.productId);
    if (!p) return;
    adjustStock(p.id, activeItem.quantity, newInvoice.type as InvoiceType, false);
    setNewInvoice(prev => ({
      ...prev, 
      items: [...(prev.items || []), { productId: p.id, productName: p.name, quantity: activeItem.quantity, image: p.image }]
    }));
    setActiveItem({ productId: '', quantity: 1 });
  };

  const handleRemoveItem = (index: number) => {
    const item = newInvoice.items?.[index];
    if (!item) return;
    adjustStock(item.productId, item.quantity, newInvoice.type as InvoiceType, true);
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index)
    }));
  };

  const handleCancelForm = () => {
    if (newInvoice.items && newInvoice.items.length > 0) {
      newInvoice.items.forEach(item => {
        adjustStock(item.productId, item.quantity, newInvoice.type as InvoiceType, true);
      });
    }
    resetForm();
    setShowForm(false);
  };

  // تابع تایید انباردار برای خروج بار
  const confirmShipment = async (id: string) => {
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) return;
    
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: InvoiceStatus.SHIPPED, shipmentImages: shipmentImages } : inv));
    
    const now = new Date();
    const jalaliDate = now.toLocaleDateString('fa-IR');
    const jalaliTime = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    const itemDetails = invoice.items.map(it => `🔹 ${it.productName} (<b>تعداد: ${it.quantity}</b>)`).join('\n');
    const recipientInfo = invoice.isAlternativeAddress 
      ? `👤 <b>تحویل‌گیرنده:</b> ${invoice.recipientName}\n📞 <b>تماس:</b> ${invoice.recipientPhone}` 
      : `👤 <b>تحویل به:</b> مشتری (${invoice.customerName})`;
    
    const tgMsg = `🚚 <b>خروج کالا تایید شد</b>\n` +
                  `🆔 حواله: <code>${invoice.id}</code>\n` +
                  `👤 <b>فروشنده:</b> ${invoice.sellerName}\n` +
                  `👤 <b>طرف حساب:</b> ${invoice.customerName}\n` +
                  `${recipientInfo}\n` +
                  `📅 <b>تاریخ خروج:</b> ${jalaliDate}\n` +
                  `⏰ <b>ساعت خروج:</b> ${jalaliTime}\n` +
                  `📦 <b>اطلاعات بار:</b>\n${itemDetails}\n` +
                  `✅ <b>تایید نهایی توسط:</b> ${currentUser.name}`;
    
    sendTelegramNotification(tgMsg);
    setShipmentImages([]);
    setToast({ message: 'خروج کالا با موفقیت تایید و گزارش ارسال شد', type: 'success' });
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newInvoice.items?.length) return;

    const finalLocation = newInvoice.isAlternativeAddress ? (newInvoice.alternativeLocationUrl || selectedCustomer.locationUrl) : selectedCustomer.locationUrl;
    const invoiceData: Partial<Invoice> = {
      type: newInvoice.type as InvoiceType, customerName: selectedCustomer.name, customerPhone: selectedCustomer.phone, customerAddress: selectedCustomer.address, customerLocation: finalLocation || '',
      items: newInvoice.items as InvoiceItem[], description: newInvoice.description || '', isAlternativeAddress: !!newInvoice.isAlternativeAddress,
      recipientName: newInvoice.isAlternativeAddress ? newInvoice.recipientName : selectedCustomer.name, recipientPhone: newInvoice.isAlternativeAddress ? newInvoice.recipientPhone : selectedCustomer.phone,
      alternativeLocationUrl: newInvoice.isAlternativeAddress ? newInvoice.alternativeLocationUrl || '' : ''
    };

    if (editingInvoiceId) {
      setInvoices(prev => prev.map(inv => inv.id === editingInvoiceId ? { ...inv, ...invoiceData, isEdited: true } : inv));
      setToast({ message: 'تغییرات حواله با موفقیت اعمال شد', type: 'success' });
    } else {
      const now = new Date();
      const invoiceId = `INV-${now.getTime().toString().slice(-6)}`;
      const jalaliDate = now.toLocaleDateString('fa-IR');
      const jalaliTime = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
      const final: Invoice = { ...invoiceData as any, id: invoiceId, sellerName: currentUser.name, date: jalaliDate, time: jalaliTime, status: InvoiceStatus.PENDING, isEdited: false, isAccountingDone: false };
      
      setInvoices(prev => [final, ...prev]);
      
      // گزارش ثبت حواله به تلگرام
      const itemNames = final.items.map(it => `🔸 ${it.productName} (<b>تعداد: ${it.quantity}</b>)`).join('\n');
      const tgMsg = `🔔 <b>حواله جدید ثبت شد</b>\n🆔 شناسه: <code>${final.id}</code>\n👤 <b>فروشنده:</b> ${currentUser.name}\n👤 <b>مشتری:</b> ${final.customerName}\n📅 <b>تاریخ:</b> ${final.date}\n📦 <b>لیست کالاها:</b>\n${itemNames}`;
      sendTelegramNotification(tgMsg);
      
      setToast({ message: 'حواله با موفقیت ثبت شد', type: 'success' });
    }
    setShowForm(false); resetForm();
  };

  const resetForm = () => {
    setNewInvoice({ type: InvoiceType.OUTGOING, items: [], description: '', isAlternativeAddress: false, recipientName: '', recipientPhone: '', alternativeLocationUrl: '' });
    setSelectedCustomer(null); setSearchCustomer(''); setActiveCategory(''); setActiveItem({ productId: '', quantity: 1 }); setEditingInvoiceId(null);
  };

  const handleOpenEdit = (inv: Invoice) => {
    setEditingInvoiceId(inv.id);
    setNewInvoice({ ...inv, items: [...inv.items] });
    const c = customers.find(x => x.name === inv.customerName);
    if (c) { setSelectedCustomer(c); setSearchCustomer(c.name); }
    setShowForm(true);
  };

  const triggerNavigation = (url: string) => {
    const match = url.match(/query=([-+]?\d*\.\d+|\d+),([-+]?\d*\.\d+|\d+)/);
    if (match && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = `geo:${match[1]},${match[2]}?q=${match[1]},${match[2]}`;
    } else window.open(url, '_blank');
  };

  const handleDownloadPDF = (inv: Invoice) => {
    const w = window.open('', '_blank'); if (!w) return;
    const imgs = inv.shipmentImages?.map(i => `<img src="${i}" style="width:280px; margin:5px; border-radius:10px; border:1px solid #ddd;">`).join('') || '';
    w.document.write(`
      <html dir="rtl">
        <head><style>body { font-family: Tahoma; padding: 20px; color:#333; } table { width:100%; border-collapse:collapse; margin-top:20px; } th, td { border:1px solid #ddd; padding:12px; text-align:right; } th { background:#f4f4f4; }</style></head>
        <body onload="window.print()">
          <h2>حواله انبار: ${inv.id}</h2>
          <p><strong>مشتری:</strong> ${inv.customerName} | <strong>تاریخ:</strong> ${inv.date}</p>
          <p><strong>فروشنده:</strong> ${inv.sellerName}</p>
          <table>
            <thead><tr><th>نام کالا</th><th style="text-align:center;">تعداد</th></tr></thead>
            <tbody>${inv.items.map(i => `<tr><td>${i.productName}</td><td style="text-align:center;">${i.quantity}</td></tr>`).join('')}</tbody>
          </table>
          <p><strong>توضیحات:</strong> ${inv.description || '-'}</p>
          ${imgs ? `<div style="margin-top:30px;"><h3>تصاویر تایید خروج (انبار):</h3>${imgs}</div>` : ''}
        </body>
      </html>
    `);
    w.document.close();
  };

  const handleShipmentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + shipmentImages.length > 3) {
      alert('حداکثر ۳ تصویر مجاز است.');
      return;
    }
    files.forEach((file: any) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setShipmentImages(prev => [...prev, reader.result as string].slice(0, 3));
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-6 relative pb-20 font-['IRANSans']">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1100] px-6 py-3 rounded-2xl shadow-2xl bg-emerald-500 text-white font-bold animate-bounceIn">
          {toast.message}
        </div>
      )}

      {fullScreenImage && (
        <div className="fixed inset-0 bg-black/95 z-[2000] flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setFullScreenImage(null)}>
          <img src={fullScreenImage} className="max-w-full max-h-full rounded-2xl shadow-2xl" alt="Preview" />
        </div>
      )}

      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-bold dark:text-gray-100">تاریخچه حواله‌ها</h2>
        {currentUser.role !== UserRole.STOCKMAN && (
          <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg active:scale-95 transition">➕ ثبت حواله جدید</button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {visibleInvoices.map(inv => {
          const isAdmin = currentUser.role === UserRole.ADMIN;
          const canEdit = isAdmin || (currentUser.role === UserRole.SALES && inv.status === InvoiceStatus.PENDING);
          return (
            <div key={inv.id} onClick={() => setSelectedInvoice(inv)} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-blue-400 transition-all group">
              <div className="flex gap-4 items-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${inv.type === InvoiceType.INCOMING ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{inv.type === InvoiceType.INCOMING ? '📥' : '📤'}</div>
                <div>
                  <h4 className="font-bold dark:text-white truncate">{inv.customerName}</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">{inv.date} | {inv.sellerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                {isAdmin && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800">
                    <input type="checkbox" checked={!!inv.isAccountingDone} onChange={(e) => setInvoices(prev => prev.map(i => i.id === inv.id ? {...i, isAccountingDone: e.target.checked} : i))} className="w-4 h-4 accent-emerald-500" />
                    <label className="text-[10px] font-black text-emerald-700 dark:text-emerald-400">سند حسابداری</label>
                  </div>
                )}
                <div className={`text-[10px] font-bold px-3 py-1.5 rounded-full ${inv.status === InvoiceStatus.PENDING ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{inv.status === InvoiceStatus.PENDING ? 'در انتظار' : 'ارسال شده'}</div>
                <div className="flex gap-1">
                    <button onClick={() => handleDownloadPDF(inv)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">🖨️</button>
                    {canEdit && <button onClick={() => handleOpenEdit(inv)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">✏️</button>}
                    {canEdit && <button onClick={() => { if(window.confirm('آیا از حذف این حواله مطمئن هستید؟')) { setInvoices(prev => prev.filter(x => x.id !== inv.id)); } }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">🗑️</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 z-[400] overflow-y-auto">
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl my-auto scale-in border dark:border-slate-800">
              <div className="p-5 bg-gray-50 dark:bg-slate-800 border-b dark:border-slate-700 flex justify-between items-center">
                 <h3 className="font-bold">📄 جزئیات حواله {selectedInvoice.id}</h3>
                 <button onClick={() => { setSelectedInvoice(null); setShipmentImages([]); }} className="text-3xl text-gray-400">&times;</button>
              </div>
              <div className="p-6 space-y-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700">
                       <p className="text-blue-600 text-[10px] font-bold mb-2 uppercase">اطلاعات تحویل</p>
                       <p className="font-bold text-sm dark:text-white">{selectedInvoice.isAlternativeAddress ? `👤 تحویل‌گیرنده: ${selectedInvoice.recipientName}` : `👤 مشتری: ${selectedInvoice.customerName}`}</p>
                       <p className="text-xs text-slate-400 mt-1">📍 {selectedInvoice.isAlternativeAddress ? 'آدرس جایگزین ثبت شده' : selectedInvoice.customerAddress}</p>
                       {(selectedInvoice.isAlternativeAddress ? selectedInvoice.alternativeLocationUrl : selectedInvoice.customerLocation) && (
                         <button onClick={() => triggerNavigation(selectedInvoice.isAlternativeAddress ? selectedInvoice.alternativeLocationUrl! : selectedInvoice.customerLocation!)} className="mt-4 w-full bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold shadow-lg">📍 مسیریابی مستقیم</button>
                       )}
                    </div>
                    <div className="py-2 text-right">
                       <p className="text-gray-400 text-[10px]">زمان ثبت:</p>
                       <p className="font-bold text-sm dark:text-white">{selectedInvoice.date} - {selectedInvoice.time}</p>
                       <p className="text-gray-400 text-[10px] mt-2">فروشنده:</p>
                       <p className="font-bold text-sm dark:text-white">{selectedInvoice.sellerName}</p>
                    </div>
                 </div>
                 <div className="border dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900">
                    <table className="w-full text-right text-xs">
                       <thead className="bg-gray-100 dark:bg-slate-800 text-gray-500 font-bold"><tr><th className="p-4">نام کالا</th><th className="p-4 text-center">تعداد واحد</th></tr></thead>
                       <tbody>{selectedInvoice.items.map((it, i) => (<tr key={i} className="border-t dark:border-slate-800"><td className="p-4 font-bold dark:text-gray-200">{it.productName}</td><td className="p-4 font-black text-center dark:text-white">{it.quantity}</td></tr>))}</tbody>
                    </table>
                 </div>

                 {selectedInvoice.shipmentImages && selectedInvoice.shipmentImages.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold dark:text-gray-300">📸 تصاویر تایید خروج:</p>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {selectedInvoice.shipmentImages.map((img, idx) => (
                          <img key={idx} src={img} className="w-20 h-20 object-cover rounded-xl border cursor-zoom-in shrink-0 shadow-sm" onClick={() => setFullScreenImage(img)} />
                        ))}
                      </div>
                    </div>
                 )}

                 {currentUser.role === UserRole.STOCKMAN && selectedInvoice.status === InvoiceStatus.PENDING && (
                   <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-800 space-y-4">
                     <p className="text-xs font-bold text-blue-600 dark:text-blue-400">📸 بارگیری تصاویر (حداکثر ۳ تصویر):</p>
                     <div className="flex gap-3 overflow-x-auto pb-2">
                        {shipmentImages.map((img, idx) => (
                          <div key={idx} className="relative shrink-0">
                            <img src={img} className="w-16 h-16 object-cover rounded-lg border shadow-sm" />
                            <button onClick={() => setShipmentImages(shipmentImages.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">&times;</button>
                          </div>
                        ))}
                        {shipmentImages.length < 3 && (
                          <label className="w-16 h-16 rounded-lg border-2 border-dashed border-blue-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer text-blue-400 hover:bg-blue-100 transition shadow-sm">
                            <input type="file" accept="image/*" multiple onChange={handleShipmentImageUpload} className="hidden" />
                            <span className="text-xl">➕</span>
                          </label>
                        )}
                     </div>
                     <button onClick={() => confirmShipment(selectedInvoice.id).then(() => setSelectedInvoice(null))} className="w-full bg-green-600 text-white py-4 rounded-xl font-black shadow-lg hover:bg-green-700 active:scale-95 transition">تایید نهایی و خروج بار</button>
                   </div>
                 )}
                 <button onClick={() => handleDownloadPDF(selectedInvoice)} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition">🖨️ چاپ رسید حواله</button>
              </div>
           </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 z-[600] overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden scale-in my-auto border dark:border-slate-800">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                <h3 className="text-xl font-bold">{editingInvoiceId ? 'ویرایش حواله' : 'ثبت حواله جدید'}</h3>
                <button onClick={handleCancelForm} className="text-3xl">&times;</button>
            </div>
            <form onSubmit={handleCreateInvoice} className="p-4 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 pr-2 font-black">نوع تراکنش</label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button type="button" onClick={() => setNewInvoice({...newInvoice, type: InvoiceType.INCOMING})} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${newInvoice.type === InvoiceType.INCOMING ? 'bg-green-600 text-white shadow-md' : 'text-slate-400'}`}>📥 ورود</button>
                    <button type="button" onClick={() => setNewInvoice({...newInvoice, type: InvoiceType.OUTGOING})} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${newInvoice.type === InvoiceType.OUTGOING ? 'bg-red-600 text-white shadow-md' : 'text-slate-400'}`}>📤 خروج</button>
                  </div>
                </div>
                <div className="relative space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 pr-2 font-black">طرف حساب</label>
                  <input type="text" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border-none outline-none focus:ring-2 focus:ring-blue-500 shadow-inner text-sm font-bold" placeholder="جستجوی مشتری..." value={searchCustomer} onChange={e => {setSearchCustomer(e.target.value); setShowCustomerList(true);}} />
                  {showCustomerList && filteredCustomers.length > 0 && (
                    <div className="absolute z-[700] w-full mt-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl shadow-2xl max-h-56 overflow-y-auto">
                      {filteredCustomers.map(c => <div key={c.id} className="p-4 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer font-bold border-b dark:border-slate-700 dark:text-white text-sm" onClick={() => {setSelectedCustomer(c); setSearchCustomer(c.name); setShowCustomerList(false);}}>{c.name}</div>)}
                    </div>
                  )}
                </div>
              </div>

              {newInvoice.type === InvoiceType.OUTGOING && (
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] space-y-4 border dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="alt" className="w-5 h-5 rounded accent-blue-600" checked={!!newInvoice.isAlternativeAddress} onChange={e => setNewInvoice({...newInvoice, isAlternativeAddress: e.target.checked})} />
                    <label htmlFor="alt" className="font-bold text-sm dark:text-white cursor-pointer">ارسال به آدرس و تحویل‌گیرنده جایگزین؟</label>
                  </div>
                  {newInvoice.isAlternativeAddress && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                       <input type="text" placeholder="نام تحویل‌گیرنده..." className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 dark:text-white border dark:border-slate-700 text-sm font-bold shadow-sm outline-none" value={newInvoice.recipientName || ''} onChange={e => setNewInvoice({...newInvoice, recipientName: e.target.value})} />
                       <input type="text" placeholder="شماره تماس..." className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 dark:text-white border dark:border-slate-700 text-sm font-bold shadow-sm outline-none" value={newInvoice.recipientPhone || ''} onChange={e => setNewInvoice({...newInvoice, recipientPhone: e.target.value})} />
                       <div className="sm:col-span-2">
                         <button type="button" onClick={() => setShowMapPicker(true)} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-sm shadow-md">📍 {newInvoice.alternativeLocationUrl ? '✅ لوکیشن ثبت شد' : 'تعیین محل تخلیه روی نقشه'}</button>
                       </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-[2rem] border-2 border-dashed border-blue-200 dark:border-blue-800 space-y-4">
                <h4 className="font-bold text-blue-900 dark:text-blue-300 text-sm">📦 لیست اقلام بار</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select className="w-full p-4 rounded-xl bg-white dark:bg-slate-800 dark:text-white border dark:border-slate-700 text-sm font-bold" value={activeCategory} onChange={e => setActiveCategory(e.target.value)}>
                    <option value="">همه دسته‌ها...</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <select className="w-full p-4 rounded-xl bg-white dark:bg-slate-800 dark:text-white border dark:border-slate-700 text-sm font-bold" value={activeItem.productId} onChange={e => setActiveItem({...activeItem, productId: e.target.value})}>
                    <option value="">نام کالا...</option>
                    {products.filter(p => !activeCategory || p.category === activeCategory).map(p => <option key={p.id} value={p.id}>{p.name} (موجودی: {p.stock})</option>)}
                  </select>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-2xl border dark:border-slate-700 shadow-sm w-full sm:w-auto">
                    <button 
                        type="button" 
                        onClick={() => setActiveItem(prev => ({...prev, quantity: Math.max(1, prev.quantity - 1)}))}
                        className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-xl text-2xl font-black text-gray-600 dark:text-gray-300 active:bg-gray-200 transition"
                    >
                      -
                    </button>
                    <input type="number" min="1" className={`w-20 text-center font-black bg-transparent dark:text-white outline-none text-lg ${isOutOfStock ? 'text-red-600 animate-pulse' : ''}`} value={activeItem.quantity} readOnly />
                    <button 
                        type="button" 
                        disabled={isOutOfStock}
                        onClick={() => setActiveItem(prev => ({...prev, quantity: prev.quantity + 1}))}
                        className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-xl text-2xl font-black text-gray-600 dark:text-gray-300 active:bg-gray-200 disabled:opacity-30 transition"
                    >
                      +
                    </button>
                  </div>
                  <button type="button" disabled={isOutOfStock || !activeItem.productId} onClick={handleAddItem} className="flex-1 w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-xl font-black shadow-lg transition active:scale-95 disabled:opacity-30">افزودن به حواله</button>
                </div>
                
                {isOutOfStock && (
                    <p className="text-[10px] text-red-500 font-black px-2 animate-pulse">⚠️ تعداد درخواستی بیشتر از موجودی انبار ({selectedProduct?.stock} واحد) است.</p>
                )}

                <div className="space-y-2 mt-4 max-h-48 overflow-y-auto scrollbar-hide">
                  {newInvoice.items?.map((it, ix) => (
                    <div key={ix} className="bg-white dark:bg-slate-900 p-3 rounded-xl border dark:border-slate-800 flex justify-between items-center text-sm shadow-sm animate-scaleIn">
                      <span className="font-bold dark:text-white">{it.productName}</span>
                      <div className="flex items-center gap-4">
                        <span className="bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-lg text-xs font-black">تعداد: {it.quantity}</span>
                        <button type="button" onClick={() => handleRemoveItem(ix)} className="text-red-500 font-bold p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t dark:border-slate-800">
                <button type="submit" disabled={!selectedCustomer || !newInvoice.items?.length} className="flex-[2] bg-green-600 text-white py-5 rounded-2xl font-bold shadow-xl active:scale-95 disabled:opacity-30 transition hover:bg-green-700">تایید و ثبت نهایی حواله</button>
                <button type="button" onClick={handleCancelForm} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 py-5 rounded-2xl font-bold active:scale-95 transition">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <MapPickerModal isOpen={showMapPicker} onClose={() => setShowMapPicker(false)} onConfirm={u => setNewInvoice(prev => ({...prev, alternativeLocationUrl: u}))} />
    </div>
  );
};

export default InvoicesPage;
