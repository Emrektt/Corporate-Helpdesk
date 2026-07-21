import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../api/auth-service';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, Notification } from '../api/notification-service';
import { LayoutDashboard, PlusCircle, LogOut, Ticket, Settings as SettingsIcon, Bell, Check, CheckCircle2, BarChart2, BookOpen } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { instance, accounts } = useMsal();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('local-login'));
    const msalAccount = instance.getActiveAccount() || instance.getAllAccounts()[0];
    if (msalAccount) {
      instance.logoutRedirect({ postLogoutRedirectUri: '/login' }).catch(console.error);
    } else {
      window.location.href = '/login';
    }
  };

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: getMe
  });

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Yeni Talep', path: '/create-ticket', icon: PlusCircle },
    { name: 'Bilgi Bankası', path: '/knowledge-base', icon: BookOpen },
  ];

  navItems.push({ name: 'Raporlar', path: '/reports', icon: BarChart2 });

  if (me?.role === 'ADMIN') {
    navItems.push({ name: 'Ayarlar', path: '/settings', icon: SettingsIcon });
  }

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 30000, // Her 30 saniyede bir kontrol et
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setShowNotifications(false);
    }
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id);
    }
    setShowNotifications(false);
    if (notification.ticket_id) {
      navigate(`/ticket/${notification.ticket_id}`);
    }
  };

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const currentAccount = accounts[0];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Sol Kısım: Logo ve Menü */}
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-800 tracking-tight hidden sm:block">
                CorpHelpdesk
              </span>
            </div>

            {/* Menü Öğeleri */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium transition-colors ${
                      isActive 
                        ? 'text-blue-600 border-b-2 border-blue-600' 
                        : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent hover:border-slate-300'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 mr-2 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Sağ Kısım: Bildirimler, Kullanıcı ve Çıkış */}
          <div className="flex items-center gap-4">
            
            {/* Bildirim Zili */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
              </button>

              {/* Bildirim Açılır Menüsü */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden z-50 transform origin-top-right transition-all">
                  <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-sm font-semibold text-slate-800">Bildirimler</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); markAllReadMutation.mutate(); }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
                      >
                        <Check className="w-3 h-3 mr-1" /> Tümünü Okundu İşaretle
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications && notifications.length > 0 ? (
                      <ul className="divide-y divide-slate-100">
                        {notifications.map((notif) => (
                          <li 
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.is_read ? 'bg-blue-50/50' : ''}`}
                          >
                            <div className="flex gap-3">
                              <div className="flex-shrink-0 mt-1">
                                {!notif.is_read ? (
                                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5"></div>
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium text-slate-900 ${!notif.is_read ? 'font-semibold' : ''}`}>
                                  {notif.title}
                                </p>
                                <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">
                                  {notif.message}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                  {new Date(notif.created_at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-4 py-8 text-center text-slate-500">
                        <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm">Bildiriminiz bulunmuyor</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden md:flex flex-col items-end border-l pl-4 border-slate-200">
              <span className="text-sm font-semibold text-slate-700">
                {currentAccount?.name || 'Kullanıcı'}
              </span>
              <span className="text-xs text-slate-500">
                {currentAccount?.username}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
              title="Çıkış Yap"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:block">Çıkış</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
