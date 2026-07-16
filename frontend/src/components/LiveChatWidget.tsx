import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMsal } from '@azure/msal-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../api/auth-service';
import { createChatRoom, getMyRoom, getAllRooms, closeChatRoom, claimChatRoom, ChatMessage, ChatRoom } from '../api/chat-service';
import {
  MessageCircle, X, Send, Minimize2, Maximize2,
  ChevronDown, Users, Headphones, CheckCircle2, Loader2
} from 'lucide-react';
import { loginRequest } from '../auth/msal-config';

// ─── Yardımcı: Zaman formatı ──────────────────────────────────────────────────

function formatTime(isoString: string) {
  try {
    return new Date(isoString).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────

export const LiveChatWidget: React.FC = () => {
  const { instance, accounts } = useMsal();
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [view, setView] = useState<'main' | 'chat' | 'rooms'>('main');
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [wsStatus, setWsStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [unreadCount, setUnreadCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const isSupport = me?.role === 'ADMIN' || me?.role === 'SUPPORT_AGENT';

  // Admin/Support: Aktif odalar listesi
  const { data: allRooms, refetch: refetchRooms } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: getAllRooms,
    enabled: isOpen && isSupport,
    refetchInterval: isOpen && isSupport ? 5000 : false,
  });

  // Mesajları en alta kaydır
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Chat açıldığında okunmamış sayısını sıfırla
  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  // ─── WebSocket Bağlantısı ──────────────────────────────────────────────────

  const connectWebSocket = useCallback(async (room: ChatRoom) => {
    if (wsRef.current) wsRef.current.close();

    setWsStatus('connecting');

    let token = '';
    try {
      // Önce yerel JWT token'ı dene
      const localToken = localStorage.getItem('token');
      if (localToken) {
        token = localToken;
      } else if (accounts[0]) {
        // MSAL token'ı dene
        const tokenResponse = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        });
        token = tokenResponse.accessToken;
      }
    } catch {
      setWsStatus('error');
      return;
    }

    const ws = new WebSocket(`ws://localhost:8001/api/v1/chat/ws/${room.id}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => setWsStatus('connected');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'history') {
        setMessages(data.messages);
        if (data.room) setActiveRoom(data.room);
        return;
      }

      if (data.type === 'message' || data.type === 'system') {
        setMessages(prev => [...prev, data]);
        if (!isOpen) {
          setUnreadCount(c => c + 1);
        }
        return;
      }

      if (data.type === 'typing') {
        if (data.user_id !== me?.id) {
          setOtherTyping(data.is_typing);
          if (data.is_typing) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
          }
        }
      }
    };

    ws.onerror = () => setWsStatus('error');
    ws.onclose = () => {
      setWsStatus('idle');
      wsRef.current = null;
    };
  }, [instance, accounts, me?.id, isOpen]);

  // Bileşen kapanırken WS'i kapat
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // ─── Sohbet Başlatma ──────────────────────────────────────────────────────

  const startChatMutation = useMutation({
    mutationFn: async () => {
      const existing = await getMyRoom();
      if (existing) return existing;
      return createChatRoom();
    },
    onSuccess: (room) => {
      setActiveRoom(room);
      setView('chat');
      connectWebSocket(room);
    }
  });

  const claimMutation = useMutation({
    mutationFn: (roomId: number) => claimChatRoom(roomId),
    onSuccess: (room) => {
      setActiveRoom(room);
      setView('chat');
      connectWebSocket(room);
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    }
  });

  const closeRoomMutation = useMutation({
    mutationFn: (roomId: number) => closeChatRoom(roomId),
    onSuccess: () => {
      if (wsRef.current) wsRef.current.close();
      setActiveRoom(null);
      setMessages([]);
      setView('main');
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    }
  });

  // ─── Mesaj Gönderme ───────────────────────────────────────────────────────

  const sendMessage = () => {
    if (!inputText.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: 'message',
      content: inputText.trim()
    }));
    setInputText('');

    // Typing durumunu temizle
    wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: false }));
    setIsTyping(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    if (!isTyping) {
      setIsTyping(true);
      wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: true }));
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: false }));
      }
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── Destek paneli odaya bağlanma ─────────────────────────────────────────
  const joinRoom = (room: ChatRoom) => {
    setActiveRoom(room);
    setView('chat');
    connectWebSocket(room);
  };

  const activeRoomCount = allRooms?.filter(r => r.status === 'ACTIVE').length || 0;

  // ─── UI ──────────────────────────────────────────────────────────────────

  if (!me) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Penceresi */}
      {isOpen && !isMinimized && (
        <div className="w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
          style={{ height: '520px' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Canlı Destek</h3>
                <p className="text-blue-100 text-xs flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-400' : wsStatus === 'connecting' ? 'bg-amber-400' : 'bg-slate-300'}`}></span>
                  {wsStatus === 'connected' ? 'Bağlandı' : wsStatus === 'connecting' ? 'Bağlanıyor...' : 'Bağlantı bekleniyor'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {view === 'chat' && (
                <button onClick={() => { setView(isSupport ? 'rooms' : 'main'); }} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Geri">
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </button>
              )}
              <button onClick={() => setIsMinimized(true)} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <Minimize2 className="w-4 h-4" />
              </button>
              <button onClick={() => { setIsOpen(false); }} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Gövde */}
          <div className="flex-1 overflow-hidden flex flex-col">

            {/* ANA EKRAN */}
            {view === 'main' && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-5">
                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
                  <MessageCircle className="w-10 h-10 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800">Merhaba, {me.full_name.split(' ')[0]}! 👋</h4>
                  <p className="text-sm text-slate-500 mt-2">Destek ekibimizle anında iletişime geçin. Size yardımcı olmaktan mutluluk duyarız.</p>
                </div>
                {isSupport ? (
                  <div className="w-full space-y-3">
                    <button
                      onClick={() => { setView('rooms'); refetchRooms(); }}
                      className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                    >
                      <Users className="w-4 h-4" />
                      Aktif Sohbetler {activeRoomCount > 0 && <span className="bg-white text-blue-600 text-xs rounded-full px-1.5 py-0.5 font-bold">{activeRoomCount}</span>}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startChatMutation.mutate()}
                    disabled={startChatMutation.isPending}
                    className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                  >
                    {startChatMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                    Sohbet Başlat
                  </button>
                )}
              </div>
            )}

            {/* ODALAR LİSTESİ (Destek Ekibi için) */}
            {view === 'rooms' && isSupport && (
              <div className="flex-1 overflow-y-auto">
                <div className="p-3 border-b border-slate-100 bg-slate-50">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aktif Sohbetler</h4>
                </div>
                {!allRooms || allRooms.filter(r => r.status === 'ACTIVE').length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                    <CheckCircle2 className="w-10 h-10 mb-3 text-slate-200" />
                    <p className="text-sm">Şu an bekleyen sohbet yok.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {allRooms.filter(r => r.status === 'ACTIVE').map(room => (
                      <div key={room.id} className="p-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                {room.user_name?.[0] || '?'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-800">{room.user_name}</p>
                                <p className="text-xs text-slate-400">{formatTime(room.created_at)}</p>
                              </div>
                            </div>
                            {room.last_message && (
                              <p className="text-xs text-slate-500 mt-2 ml-10 truncate">{room.last_message.content}</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 ml-2 flex-shrink-0">
                            {!room.agent_id ? (
                              <button
                                onClick={() => claimMutation.mutate(room.id)}
                                disabled={claimMutation.isPending}
                                className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-1 rounded-md font-medium transition-colors"
                              >
                                Üstlen
                              </button>
                            ) : (
                              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md">{room.agent_name}</span>
                            )}
                            <button
                              onClick={() => joinRoom(room)}
                              className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 px-2 py-1 rounded-md font-medium transition-colors"
                            >
                              Katıl
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SOHBET EKRANI */}
            {view === 'chat' && (
              <>
                {/* Mesajlar */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                  {messages.map((msg) => {
                    if (msg.is_system) {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{msg.content}</span>
                        </div>
                      );
                    }
                    const isMine = msg.sender_id === me?.id;
                    return (
                      <div key={msg.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${isMine ? 'bg-blue-500 text-white' : 'bg-slate-300 text-slate-700'}`}>
                          {msg.sender_name?.[0] || '?'}
                        </div>
                        <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                          {!isMine && <p className="text-xs text-slate-500 font-medium px-1">{msg.sender_name}</p>}
                          <div className={`px-3 py-2 rounded-2xl text-sm ${isMine ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'}`}>
                            {msg.content}
                          </div>
                          <p className="text-xs text-slate-400 px-1">{formatTime(msg.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Yazıyor... göstergesi */}
                  {otherTyping && (
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-300 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-700">...</div>
                      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-2.5 flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Kapat butonu */}
                {activeRoom && activeRoom.status === 'ACTIVE' && (
                  <div className="px-3 pt-2 flex justify-end">
                    <button
                      onClick={() => closeRoomMutation.mutate(activeRoom.id)}
                      disabled={closeRoomMutation.isPending}
                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
                    >
                      Sohbeti Sonlandır
                    </button>
                  </div>
                )}

                {/* Mesaj gönderme kutusu */}
                <div className="p-3 border-t border-slate-100 bg-white flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Mesajınızı yazın..."
                    disabled={wsStatus !== 'connected' || activeRoom?.status === 'CLOSED'}
                    className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputText.trim() || wsStatus !== 'connected' || activeRoom?.status === 'CLOSED'}
                    className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Küçültülmüş bar */}
      {isOpen && isMinimized && (
        <div
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-3 cursor-pointer hover:bg-blue-700 transition-colors"
          onClick={() => setIsMinimized(false)}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Canlı Destek</span>
          <Maximize2 className="w-3.5 h-3.5 opacity-70" />
        </div>
      )}

      {/* Yüzen buton */}
      <button
        onClick={() => { setIsOpen(o => !o); setIsMinimized(false); }}
        className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl shadow-blue-200 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        title="Canlı Destek"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};
