import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../api/auth-service';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, Notification } from '../api/notification-service';
import { useTheme } from '../context/ThemeContext';
import { useAdminMode } from '../context/AdminModeContext';
import {
  LayoutDashboard, PlusCircle, BookOpen, BarChart2,
  Settings, LogOut, Bell, Sun, Moon, ChevronRight,
  CheckCircle2, Ticket, ExternalLink,
  PanelLeftClose, PanelLeftOpen, X, Check, Activity,
  ShieldCheck, UserCircle2, Users
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { instance, accounts } = useMsal();
  const { isDark, toggleTheme } = useTheme();
  const { isAdminMode, toggleAdminMode } = useAdminMode();
  const queryClient = useQueryClient();

  const [collapsed, setCollapsed] = useState(window.innerWidth < 1024);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    staleTime: Infinity, // Kullanıcı bilgisi oturum boyunca değişmez, tekrar çekilmesin
  });
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 60 * 1000, // 30s yerine 60s — gereksiz istek sayısını yarıya indir
    staleTime: 30 * 1000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markNotificationAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setShowNotifPanel(false);
    },
  });

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  // Close notification panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    // Hem yerel JWT token'ı hem de MSAL oturumunu temizle
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('local-login'));
    // Eğer MSAL oturumu da açıksa onu da kapat, yoksa sadece login'e yönlendir
    const msalAccount = instance.getActiveAccount() || instance.getAllAccounts()[0];
    if (msalAccount) {
      instance.logoutRedirect({ postLogoutRedirectUri: '/login' }).catch(console.error);
    } else {
      window.location.href = '/login';
    }
  };

  const handleNotifClick = (n: Notification) => {
    if (!n.is_read) markReadMutation.mutate(n.id);
    setShowNotifPanel(false);
    if (n.ticket_id) navigate(`/ticket/${n.ticket_id}`);
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Yeni Talep', path: '/create-ticket', icon: PlusCircle },
    { name: 'Bilgi Bankası', path: '/knowledge-base', icon: BookOpen },
  ];

  const isAdmin = me?.role === 'ADMIN';
  // Admin User-Mode'da iken sadece normal kullanıcı menüsünü göster
  if (!isAdmin || isAdminMode) {
    navItems.push({ name: 'Raporlar', path: '/reports', icon: BarChart2 });
  }
  if (isAdmin && isAdminMode) {
    navItems.push({ name: 'Sistem Logları', path: '/admin/logs', icon: Activity });
    navItems.push({ name: 'Kullanıcılar', path: '/admin/users', icon: Users });
    navItems.push({ name: 'Ayarlar', path: '/settings', icon: Settings });
  }

  const currentAccount = accounts[0];
  const initials = (currentAccount?.name || 'U').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      {/* Sidebar */}
      <aside
        style={{
          width: collapsed ? '72px' : '260px',
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border)',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── Header (Logo + Collapse) ── */}
        <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', overflow: 'hidden' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
              background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-accent)',
            }}>
              <Ticket size={18} color="white" />
            </div>
            {!collapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                  CorpHelpdesk
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  Yönetim Portalı
                </div>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }}
          >
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        </div>

        <div className="divider" style={{ margin: '0 16px' }} />

        {/* ── Navigation ── */}
        <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto', overflowX: 'hidden' }}>
          {!collapsed && (
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 4px 6px' }}>
              Menü
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item${isActive ? ' active' : ''}`}
                  style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon size={18} style={{ flexShrink: 0 }} />
                  {!collapsed && <span>{item.name}</span>}
                  {!collapsed && isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.7 }} />}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="divider" style={{ margin: '0 16px' }} />

        {/* ── Bottom Section ── */}
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 10px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: 500,
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'all 0.15s ease',
              width: '100%',
            }}
            title={collapsed ? (isDark ? 'Aydınlık Tema' : 'Karanlık Tema') : undefined}
          >
            {isDark
              ? <Sun size={17} color="var(--warning)" />
              : <Moon size={17} color="var(--accent)" />
            }
            {!collapsed && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                <span>{isDark ? 'Aydınlık Tema' : 'Karanlık Tema'}</span>
                {/* Mini toggle indicator */}
                <div style={{
                  width: '32px', height: '18px', borderRadius: '999px',
                  background: isDark ? 'var(--accent)' : 'var(--bg-muted)',
                  border: '1px solid var(--border)',
                  position: 'relative',
                }}>
                  <div style={{
                    width: '12px', height: '12px', borderRadius: '50%',
                    background: 'white',
                    position: 'absolute', top: '2px',
                    left: isDark ? '16px' : '2px',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  }} />
                </div>
              </div>
            )}
          </button>

          {/* Notification Bell */}
          <div style={{ position: 'relative' }} ref={notifRef}>
            <button
              onClick={() => setShowNotifPanel(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 10px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: showNotifPanel ? 'var(--accent-muted)' : 'transparent',
                cursor: 'pointer',
                color: showNotifPanel ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: 500,
                justifyContent: collapsed ? 'center' : 'flex-start',
                width: '100%',
                position: 'relative',
              }}
              title={collapsed ? 'Bildirimler' : undefined}
            >
              <div style={{ position: 'relative', display: 'flex' }}>
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-6px', right: '-6px',
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: 'var(--danger)', color: 'white',
                    fontSize: '0.6rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid var(--bg-sidebar)',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              {!collapsed && (
                <>
                  <span>Bildirimler</span>
                  {unreadCount > 0 && (
                    <span style={{
                      marginLeft: 'auto', padding: '1px 7px', borderRadius: '999px',
                      background: 'var(--danger)', color: 'white',
                      fontSize: '0.7rem', fontWeight: 700,
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifPanel && (
              <div style={{
                position: 'fixed',
                bottom: '120px',
                left: collapsed ? '80px' : '272px',
                width: '340px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 100,
                overflow: 'hidden',
                animation: 'fadeIn 0.2s ease-out',
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-muted)' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Bildirimler</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {unreadCount > 0 && (
                      <button onClick={() => markAllMutation.mutate()} style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={12} /> Tümünü Oku
                      </button>
                    )}
                    <button onClick={() => setShowNotifPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  {notifications && notifications.length > 0 ? (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--border)',
                          cursor: 'pointer',
                          background: !n.is_read ? 'var(--accent-muted)' : 'transparent',
                          display: 'flex', gap: '12px',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <div style={{ flexShrink: 0, marginTop: '2px' }}>
                          {!n.is_read
                            ? <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', marginTop: '4px' }} />
                            : <CheckCircle2 size={15} color="var(--text-muted)" />
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: n.is_read ? 500 : 600, fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{n.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {new Date(n.created_at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        {n.ticket_id && <ExternalLink size={12} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '4px' }} />}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Bell size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                      <div style={{ fontSize: '0.875rem' }}>Bildirim yok</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Admin Mode Toggle - sadece admin kullanıcılara göster */}
          {isAdmin && (
            <button
              onClick={() => {
                toggleAdminMode();
                if (isAdminMode) {
                  const adminPaths = ['/admin/logs', '/admin/users', '/settings', '/reports'];
                  if (adminPaths.includes(location.pathname)) {
                    navigate('/dashboard');
                  }
                }
              }}
              title={isAdminMode ? 'Kullanıcı Moduna Geç' : 'Admin Moduna Geç'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: `1.5px solid ${isAdminMode ? 'rgba(139,92,246,0.4)' : 'rgba(16,185,129,0.4)'}`,
                background: isAdminMode ? 'rgba(139,92,246,0.08)' : 'rgba(16,185,129,0.08)',
                cursor: 'pointer',
                marginBottom: '6px',
                transition: 'all 0.2s ease',
                overflow: 'hidden',
              }}
            >
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                background: isAdminMode ? 'linear-gradient(135deg,#8b5cf6,#6d28d9)' : 'linear-gradient(135deg,#10b981,#059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isAdminMode ? '0 2px 8px rgba(139,92,246,0.35)' : '0 2px 8px rgba(16,185,129,0.35)',
                transition: 'all 0.2s ease',
              }}>
                {isAdminMode
                  ? <ShieldCheck size={14} color="white" />
                  : <UserCircle2 size={14} color="white" />}
              </div>
              {!collapsed && (
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isAdminMode ? '#8b5cf6' : '#10b981', lineHeight: 1.2 }}>
                    {isAdminMode ? 'Admin Modu' : 'Kullanıcı Modu'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {isAdminMode ? 'Kullanıcı moduna geç →' : '← Admin moduna dön'}
                  </div>
                </div>
              )}
            </button>
          )}

          {/* User Info + Logout */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 10px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            marginTop: '4px',
          }}>
            {/* Avatar */}
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
            }}>
              {initials}
            </div>
            {!collapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentAccount?.name || 'Kullanıcı'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {me?.role?.replace('_', ' ') || ''}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Çıkış Yap"
                  style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', transition: 'color 0.15s ease', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <LogOut size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main content offset */}
      <div style={{ marginLeft: collapsed ? '72px' : '260px', transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)', minHeight: '100vh', background: 'var(--bg-app)' }} id="main-content-area" />
    </>
  );
};
