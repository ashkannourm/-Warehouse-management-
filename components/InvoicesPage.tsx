
import React, { useState, useMemo } from 'react';
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

const InvoicesPage: React.FC<InvoicesPageProps> = ({ invoices, setInvoices, products, setProducts, customers, categories, currentUser, telegramConfig }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    type: InvoiceType.OUTGOING,
    customerName: '',
    items: [],
    description: '',
  });

  const [searchCustomer, setSearchCustomer] = useState('');
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [activeCategory, setActiveCategory] = useState('');
  const [activeItem, setActiveItem] = useState<{ productId: string, quantity: number }>({ productId: '', quantity: 1 });

  const filteredProducts = useMemo(() => {
    if (!activeCategory) return [];
    return products.filter(p => p.category === activeCategory);
  }, [activeCategory, products]);

  const filteredCustomers = useMemo(() => {
    if (!searchCustomer) return [];
    return customers.filter(c => c.name.includes(searchCustomer));
  }, [searchCustomer, customers]);

  const selectedProductPreview = useMemo(() => {
    return products.find(p => p.id === activeItem.productId);
  }, [activeItem.productId, products]);

  const sendTelegramNotification = async (invoice: Invoice, isInitial: boolean = false) => {
    const token = telegramConfig?.botToken?.trim();
    const chat = telegramConfig?.chatId?.trim();

    if (!telegramConfig?.enabled || !token || !chat) return;

    const itemsText = invoice.items.map(i => `▫️ <b>${i.productName}</b>: ${i.quantity} عدد`).join('\n');
    const typeLabel = invoice.type === InvoiceType.INCOMING ? '📥 ورود' : '📤 خروج';
    
    const message = `
${isInitial ? '🆕 <b>ثبت حواله جدید (در انتظار تایید انبار)</b>' : '✅ <b>حواله تایید و خارج شد</b>'}

🆔 شماره: <code>${invoice.id}</code>
📂 نوع: ${typeLabel}
👤 مشتری: <b>${invoice.customerName}</b>
📅 تاریخ: ${invoice.date}

📋 <b>اقلام:</b>
${itemsText}

👤 صادر کننده: ${invoice.sellerName}
${!isInitial ? `📦 تایید انبار: ${currentUser.name}` : '⏳ وضعیت: منتظر تایید انباردار'}
${invoice.description ? `\n📝 توضیحات فروشنده: <i>${invoice.description}</i>` : ''}
    `;

    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat,
          text: message,
          parse_mode: 'HTML'
        })
      });
    } catch (error) {
      console.error('Telegram notification failed:', error);
    }
  };

  const addItem = () => {
    if (!activeItem.productId || activeItem.quantity <= 0) return;
    const prod = products.find(p => p.id === activeItem.productId);
    if (!prod) return;

    if (newInvoice.type === InvoiceType.OUTGOING && prod.stock < activeItem.quantity) {
        alert(`موجودی کالا کافی نیست. موجودی فعلی: ${prod.stock}`);
        return;
    }

    const items = [...(newInvoice.items || [])];
    items.push({
      productId: prod.id,
      productName: prod.name,
      quantity: activeItem.quantity,
      image: prod.image
    });
    setNewInvoice({ ...newInvoice, items });
    setActiveItem({ productId: '', quantity: 1 });
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || (newInvoice.items?.length === 0)) return;

    const now = new Date();
    let finalInvoice: Invoice;
    
    if (editingInvoiceId) {
      const updatedInvoices = invoices.map(inv => {
        if (inv.id === editingInvoiceId) {
          finalInvoice = {
            ...inv,
            type: newInvoice.type as InvoiceType,
            customerName: selectedCustomer.name,
            customerPhone: selectedCustomer.phone,
            customerAddress: selectedCustomer.address,
            items: newInvoice.items as InvoiceItem[],
            description: newInvoice.description || '',
          };
          return finalInvoice;
        }
        return inv;
      });
      setInvoices(updatedInvoices);
    } else {
      finalInvoice = {
        id: `INV-${now.getTime().toString().slice(-6)}`,
        type: newInvoice.type as InvoiceType,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        customerAddress: selectedCustomer.address,
        sellerName: currentUser.name,
        date: now.toLocaleDateString('fa-IR'),
        time: now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        status: InvoiceStatus.PENDING,
        items: newInvoice.items as InvoiceItem[],
        description: newInvoice.description || '',
      };
      setInvoices([finalInvoice, ...invoices]);
      // ارسال پیام اطلاع رسانی اولیه برای مدیر
      sendTelegramNotification(finalInvoice, true);
    }

    setShowForm(false);
    resetForm();
  };

  const handleEditInvoice = (inv: Invoice) => {
    setEditingInvoiceId(inv.id);
    setNewInvoice({
      type: inv.type,
      customerName: inv.customerName,
      items: [...inv.items],
      description: inv.description
    });
    setSearchCustomer(inv.customerName);
    const cust = customers.find(c => c.name === inv.customerName);
    setSelectedCustomer(cust || null);
    setShowForm(true);
  };

  const resetForm = () => {
    setNewInvoice({ type: InvoiceType.OUTGOING, customerName: '', items: [], description: '' });
    setSelectedCustomer(null);
    setSearchCustomer('');
    setActiveCategory('');
    setActiveItem({ productId: '', quantity: 1 });
    setEditingInvoiceId(null);
  };

  const confirmShipment = (id: string) => {
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) return;

    const updatedProducts = products.map(p => {
      const item = invoice.items.find(i => i.productId === p.id);
      if (item) {
        return invoice.type === InvoiceType.OUTGOING 
          ? { ...p, stock: p.stock - item.quantity }
          : { ...p, stock: p.stock + item.quantity };
      }
      return p;
    });

    setProducts(updatedProducts);
    
    const updatedInvoices = invoices.map(inv => 
      inv.id === id ? { ...inv, status: InvoiceStatus.SHIPPED } : inv
    );
    setInvoices(updatedInvoices);

    const confirmedInvoice = updatedInvoices.find(inv => inv.id === id);
    if (confirmedInvoice) {
      sendTelegramNotification(confirmedInvoice, false);
    }
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm('آیا مایل به حذف دائمی این حواله از سیستم هستید؟')) {
      const filtered = invoices.filter(i => i.id !== id);
      setInvoices([...filtered]);
    }
  };

  const handleDownloadPDF = (inv: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html dir="rtl" lang="fa">
      <head>
        <title>حواله شماره ${inv.id}</title>
        <style>
          body { font-family: Tahoma, sans-serif; padding: 20px; color: #333; line-height: 1.6; font-size: 14px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e40af; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; color: #1e40af; }
          .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .label { font-weight: bold; color: #1e3a8a; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: center; }
          th { background-color: #f1f5f9; }
          .desc-area { margin-top: 20px; padding: 10px; background: #f8fafc; border-right: 3px solid #1e40af; }
          .footer-signs { margin-top: 50px; display: grid; grid-template-cols: 1fr 1fr; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div><div class="title">برگه حواله انبار</div></div>
          <div style="text-align: left;">
            <div>شماره: ${inv.id}</div>
            <div>تاریخ: ${inv.date}</div>
          </div>
        </div>
        <div class="info-grid">
          <div>
            <p><span class="label">مشتری:</span> ${inv.customerName}</p>
          </div>
          <div style="text-align: left;">
            <p><span class="label">نوع:</span> ${inv.type === 'INCOMING' ? 'ورود' : 'خروج'}</p>
          </div>
        </div>
        <table>
          <thead><tr><th>نام محصول</th><th>تعداد</th></tr></thead>
          <tbody>${inv.items.map((item) => `<tr><td>${item.productName}</td><td>${item.quantity}</td></tr>`).join('')}</tbody>
        </table>
        ${inv.description ? `<div class="desc-area">توضیحات فروشنده: ${inv.description}</div>` : ''}
        <div class="footer-signs">
          <div>امضای واحد فروش</div>
          <div>تاییدیه انباردار</div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg lg:text-xl font-bold text-gray-800 dark:text-gray-100">تاریخچه حواله‌ها</h2>
        {currentUser.role !== UserRole.STOCKMAN && (
          <button onClick={() => { resetForm(); setShowForm(true); }} className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition font-bold shadow-lg shadow-blue-50">➕ ثبت حواله جدید</button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {invoices.map(inv => (
          <div 
            key={inv.id} 
            onClick={() => setSelectedInvoice(inv)}
            className="bg-white dark:bg-slate-900 p-4 lg:p-6 rounded-2xl lg:rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-blue-400 hover:shadow-lg transition-all"
          >
            <div className="flex gap-4 items-center">
              <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center text-xl lg:text-2xl shadow-inner shrink-0 ${inv.type === InvoiceType.INCOMING ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                {inv.type === InvoiceType.INCOMING ? '📥' : '📤'}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm lg:text-lg text-gray-800 dark:text-gray-100 truncate">{inv.customerName}</h4>
                <p className="text-[10px] lg:text-xs text-gray-400 font-medium">{inv.date} | {inv.sellerName}</p>
              </div>
            </div>
            <div className={`text-[10px] lg:text-xs font-bold px-3 py-1.5 lg:px-5 lg:py-2 rounded-full border shrink-0 self-start sm:self-center ${inv.status === InvoiceStatus.PENDING ? 'bg-red-50 dark:bg-red-900/30 text-red-600 border-red-100 dark:border-red-900/50' : 'bg-green-50 dark:bg-green-900/30 text-green-600 border-green-100 dark:border-green-900/50'}`}>
                {inv.status === InvoiceStatus.PENDING ? 'انتظار تایید' : 'ارسال شده'}
            </div>
            <div className="flex gap-2 justify-end" onClick={e => e.stopPropagation()}>
                {((currentUser.role === UserRole.SALES && inv.status === InvoiceStatus.PENDING) || currentUser.role === UserRole.ADMIN) && (
                  <button onClick={() => handleEditInvoice(inv)} className="p-2 lg:p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg lg:rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-600 transition border border-gray-100 dark:border-slate-700">✏️</button>
                )}
                <button onClick={() => handleDownloadPDF(inv)} className="p-2 lg:p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg lg:rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition border border-gray-100 dark:border-slate-700">🖨️</button>
                {currentUser.role === UserRole.ADMIN && (
                   <button onClick={() => handleDeleteInvoice(inv.id)} className="p-2 lg:p-2.5 bg-red-50 text-red-500 rounded-lg lg:rounded-xl hover:bg-red-600 hover:text-white transition border border-red-100 dark:border-red-900/50">🗑️</button>
                )}
            </div>
          </div>
        ))}
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] overflow-y-auto">
           <div className="bg-white dark:bg-slate-900 rounded-2xl lg:rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl my-auto">
              <div className="p-5 lg:p-7 bg-gray-50 dark:bg-slate-800 border-b dark:border-slate-700 flex justify-between items-center text-gray-900 dark:text-gray-100">
                 <h3 className="font-bold text-lg lg:text-2xl flex items-center gap-2">
                    <span className="text-blue-600">📄</span> حواله {selectedInvoice.id}
                 </h3>
                 <button onClick={() => setSelectedInvoice(null)} className="text-3xl font-bold text-gray-400 hover:text-red-500 transition">&times;</button>
              </div>
              <div className="p-6 lg:p-8 space-y-6 lg:space-y-8 text-right" dir="rtl">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-8 text-xs lg:text-sm text-gray-900 dark:text-gray-100">
                    <div className="space-y-1">
                        <p className="text-gray-400 font-medium">مشتری:</p>
                        <p className="font-bold text-base lg:text-xl">{selectedInvoice.customerName}</p>
                        <p className="text-gray-500 dark:text-gray-400">{selectedInvoice.customerPhone}</p>
                    </div>
                    <div className="sm:text-left space-y-1">
                        <p className="text-gray-400 font-medium">زمان ثبت:</p>
                        <p className="font-bold">{selectedInvoice.date} - {selectedInvoice.time}</p>
                        <p className="text-blue-600 dark:text-blue-400 font-bold">توسط: {selectedInvoice.sellerName}</p>
                    </div>
                 </div>
                 
                 {selectedInvoice.description && (
                   <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mb-1">توضیحات حواله:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">"{selectedInvoice.description}"</p>
                   </div>
                 )}

                 <div className="border border-gray-100 dark:border-slate-800 rounded-xl lg:rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-right text-xs lg:text-sm">
                       <thead className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300">
                          <tr><th className="p-3 lg:p-4 text-right">شرح کالا</th><th className="p-3 lg:p-4 text-center">تعداد</th></tr>
                       </thead>
                       <tbody className="text-gray-800 dark:text-gray-200">
                          {selectedInvoice.items.map((item, i) => (
                             <tr key={i} className="border-t border-gray-50 dark:border-slate-800"><td className="p-3 lg:p-4 font-bold">{item.productName}</td><td className="p-3 lg:p-4 font-bold text-blue-600 dark:text-blue-400 text-center">{item.quantity}</td></tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
                 <div className="flex flex-col gap-3 pt-4">
                    {currentUser.role === UserRole.STOCKMAN && selectedInvoice.status === InvoiceStatus.PENDING && (
                      <button onClick={() => {confirmShipment(selectedInvoice.id); setSelectedInvoice(null);}} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 shadow-lg transition">تایید و ارسال بار</button>
                    )}
                    <button onClick={() => handleDownloadPDF(selectedInvoice)} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition flex items-center justify-center gap-2">🖨️ چاپ حواله</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-2 lg:p-4 z-50 overflow-y-auto" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-2xl lg:rounded-[2.5rem] p-0 w-full max-w-4xl shadow-2xl my-4 lg:my-8 overflow-hidden scale-in border border-white/20">
            <div className="bg-slate-900 p-6 lg:p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl lg:text-3xl font-bold flex items-center gap-3">
                  <span className="bg-blue-600 p-2 rounded-lg lg:rounded-xl text-lg lg:text-2xl">{editingInvoiceId ? '✏️' : '📝'}</span> 
                  {editingInvoiceId ? 'ویرایش حواله' : 'صدور حواله انبار'}
                </h3>
              </div>
              <button onClick={() => { resetForm(); setShowForm(false); }} className="text-3xl lg:text-4xl text-slate-500 hover:text-white transition">&times;</button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 lg:p-8 space-y-6 lg:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 bg-slate-50 dark:bg-slate-800 p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-slate-100 dark:border-slate-700">
                <div className="space-y-3">
                  <label className="block text-xs lg:text-sm text-gray-600 dark:text-gray-300 font-bold pr-2">نوع تراکنش</label>
                  <div className="flex p-1 bg-white dark:bg-slate-900 rounded-xl lg:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button 
                      type="button" 
                      onClick={() => setNewInvoice({...newInvoice, type: InvoiceType.INCOMING})} 
                      className={`flex-1 py-2 lg:py-3 rounded-lg lg:rounded-xl text-xs lg:text-sm font-bold transition-all ${newInvoice.type === InvoiceType.INCOMING ? 'bg-green-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      📥 ورود
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setNewInvoice({...newInvoice, type: InvoiceType.OUTGOING})} 
                      className={`flex-1 py-2 lg:py-3 rounded-lg lg:rounded-xl text-xs lg:text-sm font-bold transition-all ${newInvoice.type === InvoiceType.OUTGOING ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      📤 خروج
                    </button>
                  </div>
                </div>

                <div className="relative space-y-3">
                  <label className="block text-xs lg:text-sm text-gray-600 dark:text-gray-300 font-bold pr-2">طرف حساب</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-slate-800 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner text-sm" 
                      placeholder="جستجوی مشتری..."
                      value={searchCustomer}
                      onChange={(e) => {setSearchCustomer(e.target.value); setShowCustomerList(true);}}
                    />
                    {showCustomerList && filteredCustomers.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-56 overflow-y-auto font-['IRANSans']">
                        {filteredCustomers.map(c => (
                          <div key={c.id} className="p-4 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer border-b border-slate-50 dark:border-slate-700 last:border-0 text-gray-900 dark:text-gray-100 font-bold text-sm" onClick={() => {setSelectedCustomer(c); setSearchCustomer(c.name); setShowCustomerList(false);}}>{c.name}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 lg:p-8 rounded-2xl lg:rounded-3xl border-2 border-dashed border-blue-200 dark:border-blue-900/50 space-y-4 lg:space-y-6">
                <h4 className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2 text-base lg:text-lg">
                  <span>📦</span> اقلام حواله
                </h4>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select className="w-full p-3 lg:p-4 rounded-xl bg-slate-800 text-white outline-none font-bold shadow-md text-sm" value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)}>
                        <option value="" className="bg-white text-gray-900">دسته کالا...</option>
                        {categories.map(c => <option key={c.id} value={c.name} className="bg-white text-gray-900">{c.name}</option>)}
                    </select>
                    <select className="w-full p-3 lg:p-4 rounded-xl bg-slate-800 text-white outline-none font-bold shadow-md text-sm" value={activeItem.productId} onChange={(e) => setActiveItem({...activeItem, productId: e.target.value})}>
                        <option value="" className="bg-white text-gray-900">انتخاب کالا...</option>
                        {filteredProducts.map(p => <option key={p.id} value={p.id} className="bg-white text-gray-900">{p.name} ({p.stock})</option>)}
                    </select>
                  </div>

                  {selectedProductPreview && (
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-700 animate-fadeIn shadow-sm">
                      <div className="w-16 h-16 lg:w-20 lg:h-20 shrink-0">
                        {selectedProductPreview.image ? (
                          <img src={selectedProductPreview.image} className="w-full h-full object-cover rounded-xl shadow-inner border dark:border-slate-800" alt={selectedProductPreview.name} />
                        ) : (
                          <div className="w-full h-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center rounded-xl text-gray-300 dark:text-gray-600 text-[10px] font-bold border dark:border-slate-800">NO IMAGE</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm lg:text-base font-bold text-gray-800 dark:text-gray-100 truncate">{selectedProductPreview.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] lg:text-xs text-gray-400 bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg border dark:border-slate-700">دسته: {selectedProductPreview.category}</span>
                          <span className={`text-[10px] lg:text-xs font-bold px-2 py-0.5 rounded-lg ${selectedProductPreview.stock < 10 ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'}`}>
                            موجودی: {selectedProductPreview.stock} {selectedProductPreview.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 font-bold mb-1 pr-1">تعداد</label>
                      <input 
                          type="number" 
                          min="1" 
                          className="w-full p-3 lg:p-4 rounded-xl bg-slate-800 text-white outline-none font-bold text-center shadow-md text-sm" 
                          value={activeItem.quantity} 
                          placeholder="تعداد"
                          onChange={(e) => setActiveItem({...activeItem, quantity: parseInt(e.target.value) || 1})} 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={addItem} 
                      className="bg-blue-600 text-white px-6 lg:px-8 h-[46px] lg:h-[58px] rounded-xl font-bold hover:bg-blue-700 transition shadow-lg text-sm"
                    >
                      افزودن به لیست
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mt-4 max-h-48 overflow-y-auto">
                  {newInvoice.items?.map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-blue-100 dark:border-blue-900 flex justify-between items-center text-gray-900 dark:text-gray-100 shadow-sm text-sm">
                        <div className="flex items-center gap-3">
                           <span className="font-bold text-gray-800 dark:text-gray-100 truncate max-w-[120px] sm:max-w-none">{item.productName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 lg:px-5 lg:py-2 rounded-xl text-xs font-bold">{item.quantity} عدد</span>
                            <button 
                                type="button" 
                                onClick={() => setNewInvoice({...newInvoice, items: newInvoice.items?.filter((_, i) => i !== idx)})}
                                className="text-red-500 hover:text-red-700"
                            >🗑️</button>
                        </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description Field */}
              <div className="space-y-3">
                <label className="block text-xs lg:text-sm text-gray-600 dark:text-gray-300 font-bold pr-2">📝 توضیحات فروشنده (برای انباردار)</label>
                <textarea 
                  className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-gray-800 dark:text-white border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" 
                  rows={3}
                  placeholder="نکاتی درباره ارسال، فوریت بار، یا شماره تماس دوم مشتری..."
                  value={newInvoice.description || ''}
                  onChange={(e) => setNewInvoice({...newInvoice, description: e.target.value})}
                ></textarea>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="submit" 
                  disabled={!selectedCustomer || !newInvoice.items?.length} 
                  className="w-full sm:flex-[2] bg-green-600 text-white py-4 lg:py-5 rounded-xl lg:rounded-2xl font-bold hover:bg-green-700 shadow-xl transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  تایید نهایی و ثبت حواله
                </button>
                <button 
                  type="button" 
                  onClick={() => { resetForm(); setShowForm(false); }} 
                  className="w-full sm:flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-4 lg:py-5 rounded-xl lg:rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
