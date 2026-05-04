import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';
import { MdClose, MdSend, MdChat } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';

export function ChatButton({ onClick, unreadCount }) {
  return (
    <button onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
      title="Boshliqlar chati">
      <MdChat size={22} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}

export default function BossChat({ open, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/auth/boss-chat/');
      setMessages(res.data.results || res.data);
      api.post('/auth/boss-chat/mark-read/').catch(() => {});
    } catch (err) {}
  }, []);

  useEffect(() => {
    if (!open) return;
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [open, load]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await api.post('/auth/boss-chat/', { content: text });
      setInput('');
      load();
    } catch (err) {}
    finally { setSending(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 bg-black/30" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-bread-600 to-bread-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MdChat size={22} />
            <div>
              <h3 className="font-semibold">Boshliqlar chati</h3>
              <p className="text-xs opacity-80">Admin ↔ Menejer</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">
            <MdClose size={22} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.length === 0 ? (
            <p className="text-center text-gray-400 text-sm mt-10">
              Hozircha xabarlar yo'q. Birinchi bo'lib yozing!
            </p>
          ) : (
            messages.map(m => (
              <div key={m.id} className={`flex ${m.is_mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  m.is_mine
                    ? 'bg-bread-600 text-white rounded-br-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                }`}>
                  {!m.is_mine && (
                    <div className="text-xs font-semibold mb-1 text-bread-700">
                      {m.sender_name}
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
                  <div className={`text-[10px] mt-1 ${m.is_mine ? 'text-white/70' : 'text-gray-400'}`}>
                    {new Date(m.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="border-t p-3 flex gap-2 bg-white">
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder="Xabar yozing..."
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:border-bread-500" />
          <button type="submit" disabled={!input.trim() || sending}
            className="bg-bread-600 text-white rounded-full p-2 hover:bg-bread-700 disabled:opacity-50">
            <MdSend size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
