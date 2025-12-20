
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, UserRole } from '../types';

interface FloatingChatBoxProps {
  messages: ChatMessage[];
  currentUser: User;
  onSendMessage: (text: string) => void;
  lastReadTimestamp: number;
  onOpen: () => void;
  onClearHistory?: () => void;
}

const FloatingChatBox: React.FC<FloatingChatBoxProps> = ({ 
  messages, 
  currentUser, 
  onSendMessage, 
  lastReadTimestamp, 
  onOpen,
  onClearHistory 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // منطق تشخیص پیام‌های جدید: پیامی که زمان آن بعد از آخرین مشاهده باشد و فرستنده آن خود کاربر نباشد
  const unreadMessages = messages.filter(
    m => m.timestamp > lastReadTimestamp && m.senderId !== currentUser.id
  );
  const hasUnread = unreadMessages.length > 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // وقتی چت باز است، اگر پیام جدیدی بیاید بلافاصله تایم‌استمپ را آپدیت می‌کنیم تا اعلان نشان داده نشود
      const latestMsg = messages[messages.length - 1];
      if (latestMsg && latestMsg.timestamp > lastReadTimestamp) {
        onOpen();
      }
    }
  }, [messages, isOpen, lastReadTimestamp, onOpen]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      onOpen();
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleClear = () => {
    if (window.confirm('آیا از پاک کردن تمامی پیام‌ها اطمینان دارید؟')) {
      onClearHistory?.();
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed bottom-6 left-6 z-[100] font-['IRANSans']" dir="rtl">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 left-0 w-[320px] sm:w-[380px] h-[450px] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border dark:border-slate-800 flex flex-col overflow-hidden animate-scaleIn origin-bottom-left">
          <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <span>💬</span> گفتگو با همکاران
            </h3>
            <div className="flex items-center gap-3">
              {currentUser.role === UserRole.ADMIN && (
                <button 
                  onClick={handleClear} 
                  title="پاک کردن تاریخچه"
                  className="p-1 hover:bg-blue-700 rounded-lg transition text-sm"
                >
                  🗑️
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-2xl hover:text-blue-100">&times;</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50 space-y-2">
                <span className="text-4xl">📨</span>
                <p className="text-xs font-bold">هنوز پیامی ارسال نشده است</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-tl-none border dark:border-slate-700'
                    }`}>
                      {!isMe && (
                        <p className="text-[9px] font-bold text-blue-500 mb-1">{msg.senderName}</p>
                      )}
                      <p className="text-xs leading-relaxed">{msg.text}</p>
                      <p className={`text-[8px] mt-1 text-left ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 border-t dark:border-slate-800 flex gap-2 bg-white dark:bg-slate-900">
            <input 
              type="text" 
              placeholder="پیام خود را بنویسید..."
              className="flex-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-white border-none focus:ring-1 focus:ring-blue-500 outline-none text-xs"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={!inputText.trim()}
              className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
            >
              <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={handleToggle}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-2xl transition-all active:scale-95 ${
          isOpen ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isOpen ? '✕' : '💬'}
        
        {/* نقطه قرمز اعلان پیام جدید با انیمیشن و تعداد پیام‌ها */}
        {!isOpen && hasUnread && (
          <span className="absolute -top-1 -right-1 flex h-6 w-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 border-2 border-white dark:border-slate-950 flex items-center justify-center shadow-lg">
               <span className="text-[10px] text-white font-black leading-none">{unreadMessages.length > 9 ? '+9' : unreadMessages.length}</span>
            </span>
          </span>
        )}
      </button>
    </div>
  );
};

export default FloatingChatBox;
