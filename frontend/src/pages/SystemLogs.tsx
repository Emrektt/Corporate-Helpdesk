import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEvents, EventLog } from '../api/event-service';
import {
    Activity, AlertTriangle, XCircle, Info, Search,
    User, Monitor, Globe, Clock, ChevronDown, ChevronRight,
    LogIn, LogOut, Shield, Wifi, Filter, Server, Laptop
} from 'lucide-react';

// ─── Badge & Icon helpers ─────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<string, { bg: string; color: string; border: string }> = {
    INFO:     { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6', border: 'rgba(59,130,246,0.25)' },
    WARNING:  { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
    ERROR:    { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
    CRITICAL: { bg: 'rgba(220,38,38,0.15)',  color: '#dc2626', border: 'rgba(220,38,38,0.35)' },
};

const SOURCE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    AUTH:             { label: 'Auth',        color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    BACKEND:          { label: 'Backend',     color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
    FRONTEND:         { label: 'Frontend',    color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    TICKET:           { label: 'Bilet',       color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    TICKET_COMMENT:   { label: 'Yorum',       color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
    DEPARTMENT:       { label: 'Departman',   color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    ARTICLE:          { label: 'Makale',      color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
};

const EVENT_TYPE_CONFIG: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
    LOGIN_SUCCESS:        { label: 'Giriş Başarılı',    Icon: LogIn,      color: '#10b981' },
    LOGIN_FAILED:         { label: 'Giriş Başarısız',  Icon: Shield,     color: '#f59e0b' },
    LOGIN_BLOCKED:        { label: 'Giriş Engellendi', Icon: Shield,     color: '#ef4444' },
    LOGOUT:               { label: 'Çıkış',              Icon: LogOut,     color: '#6b7280' },
    ERROR:                { label: 'Hata',              Icon: XCircle,   color: '#ef4444' },
    PAGE_LOAD:            { label: 'Sayfa Yüklendi',    Icon: Monitor,   color: '#3b82f6' },
    TICKET_CREATED:       { label: 'Bilet Oluşturuldu',  Icon: Info,      color: '#10b981' },
    STATUS_UPDATED:       { label: 'Durum Güncellendi',  Icon: Info,      color: '#f59e0b' },
    TICKET_DELETED:       { label: 'Bilet Silindi',      Icon: XCircle,   color: '#ef4444' },
    COMMENT_ADDED:        { label: 'Yorum Eklendi',      Icon: Info,      color: '#3b82f6' },
    DEPARTMENT_CREATED:   { label: 'Departman Oluşturuldu', Icon: Info,   color: '#10b981' },
    DEPARTMENT_UPDATED:   { label: 'Departman Güncellendi', Icon: Info,   color: '#f59e0b' },
    ARTICLE_CREATED:      { label: 'Makale Oluşturuldu',   Icon: Info,   color: '#10b981' },
    ARTICLE_UPDATED:      { label: 'Makale Güncellendi',   Icon: Info,   color: '#f59e0b' },
    ARTICLE_DELETED:      { label: 'Makale Silindi',       Icon: XCircle, color: '#ef4444' },
};

const LevelBadge = ({ level }: { level: string }) => {
    const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.INFO;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '8px',
            background: cfg.bg, color: cfg.color,
            border: `1px solid ${cfg.border}`,
            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.03em'
        }}>
            {level === 'INFO' && <Info size={14} />}
            {level === 'WARNING' && <AlertTriangle size={14} />}
            {(level === 'ERROR' || level === 'CRITICAL') && <XCircle size={14} />}
            {level}
        </span>
    );
};

const SourceBadge = ({ source }: { source: string }) => {
    const cfg = SOURCE_CONFIG[source] || { label: source, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
    return (
        <span style={{
            display: 'inline-block', padding: '3px 8px', borderRadius: '6px',
            background: cfg.bg, color: cfg.color,
            fontSize: '0.72rem', fontWeight: 600
        }}>
            {cfg.label}
        </span>
    );
};

function parseBrowser(ua: string | undefined): string {
    if (!ua) return '—';
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
    return ua.slice(0, 40);
}

function parseOS(ua: string | undefined): string {
    if (!ua) return '';
    if (ua.includes('Windows NT 10')) return 'Windows 10/11';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac OS X')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return '';
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const SystemLogs: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [levelFilter, setLevelFilter] = useState('ALL');
    const [sourceFilter, setSourceFilter] = useState('ALL');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const { data: events = [], isLoading, isError, refetch, isFetching } = useQuery<EventLog[]>({
        queryKey: ['system-events'],
        queryFn: getEvents,
        refetchInterval: false,
        staleTime: 0, 
    });

    const stats = useMemo(() => ({
        total: events.length,
        info: events.filter(e => e.level === 'INFO').length,
        warning: events.filter(e => e.level === 'WARNING').length,
        error: events.filter(e => e.level === 'ERROR' || e.level === 'CRITICAL').length,
        logins: events.filter(e => e.event_type === 'LOGIN_SUCCESS').length,
    }), [events]);

    const filtered = useMemo(() => events.filter(e => {
        const term = searchTerm.toLowerCase();
        const matchSearch = !term ||
            e.message.toLowerCase().includes(term) ||
            (e.user_name?.toLowerCase().includes(term) ?? false) ||
            (e.user_email?.toLowerCase().includes(term) ?? false) ||
            (e.ip_address?.includes(term) ?? false);
        const matchLevel = levelFilter === 'ALL' || e.level === levelFilter;
        const matchSource = sourceFilter === 'ALL' || e.source === sourceFilter;
        return matchSearch && matchLevel && matchSource;
    }), [events, searchTerm, levelFilter, sourceFilter]);

    return (
        <div className="animate-fade-in pb-10">
            {/* Header Section */}
            <div className="mb-8 p-6 sm:p-8 rounded-[24px] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-app)] border border-[var(--border)] shadow-[var(--shadow-sm)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)] opacity-[0.03] blur-[60px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] flex items-center gap-3 mb-2 tracking-tight">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-gradient)] flex items-center justify-center shadow-[var(--shadow-accent)] text-white">
                                <Activity size={24} />
                            </div>
                            Sistem Logları
                        </h1>
                        <p className="text-[var(--text-secondary)] text-sm sm:text-base ml-[60px] font-medium">Giriş olayları, API hataları ve sistem aktivitesini eşzamanlı izleyin.</p>
                    </div>
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] font-semibold shadow-sm hover:shadow-md hover:border-[var(--accent)] transition-all duration-300"
                        style={{ opacity: isFetching ? 0.7 : 1 }}
                    >
                        <Activity size={18} className={isFetching ? 'animate-spin text-[var(--accent)]' : 'text-[var(--text-secondary)]'} />
                        {isFetching ? 'Senkronize Ediliyor...' : 'Logları Yenile'}
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-8 pt-6 border-t border-[var(--border)]">
                    {[
                        { label: 'Toplam', value: stats.total, color: 'text-[var(--text-primary)]', icon: <Server size={18} /> },
                        { label: 'Bilgi', value: stats.info, color: 'text-blue-500', icon: <Info size={18} /> },
                        { label: 'Uyarı', value: stats.warning, color: 'text-amber-500', icon: <AlertTriangle size={18} /> },
                        { label: 'Hata', value: stats.error, color: 'text-red-500', icon: <XCircle size={18} /> },
                        { label: 'Başarılı Giriş', value: stats.logins, color: 'text-emerald-500', icon: <LogIn size={18} /> },
                    ].map((s, i) => (
                        <div key={i} className="flex flex-col gap-1 p-3 rounded-xl bg-[var(--bg-muted)] border border-[transparent] hover:border-[var(--border)] transition-colors">
                            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider">
                                {s.icon} {s.label}
                            </div>
                            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Premium Filter Bar */}
            <div className="mb-6 p-4 rounded-[20px] bg-[var(--bg-card)] border border-[var(--border)] shadow-[var(--shadow-sm)] flex flex-col md:flex-row gap-4 items-center">
                <div className="relative w-full md:w-96 flex-shrink-0">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        placeholder="Loglarda arama yapın (IP, kullanıcı, mesaj...)"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)] outline-none text-[var(--text-primary)] font-medium transition-all"
                    />
                </div>
                
                <div className="flex w-full md:w-auto gap-3 flex-wrap sm:flex-nowrap">
                    <div className="relative w-full sm:w-48">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                        <select 
                            value={levelFilter} 
                            onChange={e => setLevelFilter(e.target.value)} 
                            className="w-full pl-9 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--accent)] outline-none text-[var(--text-primary)] text-sm font-semibold appearance-none cursor-pointer"
                        >
                            <option value="ALL">Tüm Seviyeler</option>
                            <option value="INFO">Sadece Bilgi (INFO)</option>
                            <option value="WARNING">Sadece Uyarı (WARNING)</option>
                            <option value="ERROR">Sadece Hata (ERROR)</option>
                            <option value="CRITICAL">Kritik (CRITICAL)</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                    <div className="relative w-full sm:w-56">
                        <Activity size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                        <select 
                            value={sourceFilter} 
                            onChange={e => setSourceFilter(e.target.value)} 
                            className="w-full pl-9 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--accent)] outline-none text-[var(--text-primary)] text-sm font-semibold appearance-none cursor-pointer"
                        >
                            <option value="ALL">Tüm Kaynaklar</option>
                            <option value="AUTH">Auth (Giriş / Çıkış)</option>
                            <option value="TICKET">Bilet İşlemleri</option>
                            <option value="TICKET_COMMENT">Yorum İşlemleri</option>
                            <option value="BACKEND">Backend (API)</option>
                            <option value="FRONTEND">Frontend (Arayüz)</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                </div>

                <div className="md:ml-auto text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-muted)] px-3 py-2 rounded-lg">
                    {filtered.length} Sonuç
                </div>
            </div>

            {/* Results Area */}
            {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center text-[var(--text-secondary)]">
                    <div className="w-16 h-16 relative mb-6">
                        <div className="absolute inset-0 border-4 border-[var(--accent-muted)] rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-[var(--accent)] rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Loglar Yükleniyor</h3>
                    <p className="text-sm">Sistem geçmişi analiz ediliyor...</p>
                </div>
            ) : isError ? (
                <div className="py-20 flex flex-col items-center justify-center text-[var(--danger)] bg-[var(--bg-card)] border border-[var(--border)] rounded-[24px]">
                    <XCircle size={48} className="mb-4 opacity-80" />
                    <h3 className="text-xl font-bold mb-2">Bağlantı Hatası</h3>
                    <p className="text-sm opacity-80">Loglar yüklenirken sunucu hatası oluştu.</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border)] rounded-[24px]">
                    <Search size={48} className="mb-4 opacity-20" />
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Sonuç Bulunamadı</h3>
                    <p className="text-sm">Seçtiğiniz filtrelere uygun bir sistem kaydı mevcut değil.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Desktop Table View (Hidden on mobile) */}
                    <div className="hidden lg:block bg-[var(--bg-card)] border border-[var(--border)] rounded-[24px] overflow-hidden shadow-[var(--shadow-sm)]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[var(--bg-app)] border-b-2 border-[var(--border)]">
                                    <th className="p-4 w-12"></th>
                                    <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Zaman</th>
                                    <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Seviye</th>
                                    <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Kaynak</th>
                                    <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Kullanıcı</th>
                                    <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Network</th>
                                    <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider w-1/3">Olay Özeti</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {filtered.map(event => {
                                    const isExpanded = expandedId === event.id;
                                    const browser = parseBrowser(event.user_agent);
                                    const os = parseOS(event.user_agent);
                                    const eventTypeCfg = event.event_type ? EVENT_TYPE_CONFIG[event.event_type] : null;

                                    return (
                                        <React.Fragment key={event.id}>
                                            <tr 
                                                className={`group cursor-pointer transition-colors ${isExpanded ? 'bg-[var(--bg-hover)]' : 'hover:bg-[var(--bg-muted)]'}`}
                                                onClick={() => setExpandedId(isExpanded ? null : event.id)}
                                            >
                                                <td className="p-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
                                                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <div className="font-semibold text-[var(--text-primary)] text-sm">{new Date(event.created_at).toLocaleDateString('tr-TR')}</div>
                                                    <div className="text-[var(--text-secondary)] text-xs font-medium">{new Date(event.created_at).toLocaleTimeString('tr-TR')}</div>
                                                </td>
                                                <td className="p-4"><LevelBadge level={event.level} /></td>
                                                <td className="p-4"><SourceBadge source={event.source} /></td>
                                                <td className="p-4">
                                                    {event.user_name ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-[var(--accent-gradient)] flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                                                                {event.user_name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <div className="font-semibold text-[var(--text-primary)] text-sm truncate">{event.user_name}</div>
                                                                <div className="text-[var(--text-secondary)] text-xs truncate">{event.user_email}</div>
                                                            </div>
                                                        </div>
                                                    ) : <span className="text-[var(--text-muted)] text-sm font-medium">Sistem</span>}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-primary)] bg-[var(--bg-muted)] px-2 py-0.5 rounded w-fit">
                                                            <Globe size={10} className="text-[var(--text-muted)]" /> {event.ip_address || 'Bilinmiyor'}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[0.7rem] font-medium text-[var(--text-secondary)]">
                                                            <Laptop size={10} /> {browser} {os ? `· ${os}` : ''}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-start flex-col gap-1.5">
                                                        {eventTypeCfg && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.65rem] font-bold tracking-wider uppercase" style={{ background: `${eventTypeCfg.color}15`, color: eventTypeCfg.color }}>
                                                                <eventTypeCfg.Icon size={10} /> {eventTypeCfg.label}
                                                            </span>
                                                        )}
                                                        <p className="text-sm text-[var(--text-primary)] font-medium line-clamp-2 leading-relaxed">{event.message}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <ExpandedDetailRow event={event} browser={browser} os={os} />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View (Visible on sm & md) */}
                    <div className="lg:hidden flex flex-col gap-4">
                        {filtered.map(event => {
                            const isExpanded = expandedId === event.id;
                            const browser = parseBrowser(event.user_agent);
                            const os = parseOS(event.user_agent);
                            const eventTypeCfg = event.event_type ? EVENT_TYPE_CONFIG[event.event_type] : null;

                            return (
                                <div key={event.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[20px] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <div 
                                        className="p-5 cursor-pointer flex flex-col gap-4"
                                        onClick={() => setExpandedId(isExpanded ? null : event.id)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <LevelBadge level={event.level} />
                                                <SourceBadge source={event.source} />
                                            </div>
                                            <div className="text-[var(--text-muted)]">
                                                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                            </div>
                                        </div>

                                        <div>
                                            {eventTypeCfg && (
                                                <span className="inline-flex items-center gap-1.5 mb-2 text-[0.7rem] font-bold tracking-wider uppercase" style={{ color: eventTypeCfg.color }}>
                                                    <eventTypeCfg.Icon size={12} /> {eventTypeCfg.label}
                                                </span>
                                            )}
                                            <p className="text-[var(--text-primary)] font-semibold text-sm leading-snug line-clamp-3">
                                                {event.message}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                                            <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
                                                <Clock size={14} className="text-[var(--accent)]" />
                                                {new Date(event.created_at).toLocaleString('tr-TR')}
                                            </div>
                                            {event.user_name && (
                                                <div className="w-6 h-6 rounded-full bg-[var(--accent-gradient)] flex items-center justify-center text-white text-[0.6rem] font-bold shadow-sm">
                                                    {event.user_name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mobile Expanded Details */}
                                    {isExpanded && (
                                        <div className="p-5 bg-[var(--bg-app)] border-t border-[var(--border)]">
                                            <div className="flex flex-col gap-5">
                                                {/* User Info block */}
                                                {(event.user_name || event.user_email) && (
                                                    <div>
                                                        <div className="text-[0.65rem] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                            <User size={12} /> Kullanıcı Detayı
                                                        </div>
                                                        <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)] text-sm space-y-1">
                                                            {event.user_name && <div className="font-semibold text-[var(--text-primary)]">{event.user_name}</div>}
                                                            {event.user_email && <div className="text-[var(--text-secondary)]">{event.user_email}</div>}
                                                            {event.user_id && <div className="text-xs text-[var(--text-muted)] mt-1">ID: #{event.user_id}</div>}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Network block */}
                                                <div>
                                                    <div className="text-[0.65rem] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                        <Wifi size={12} /> Ağ & Cihaz
                                                    </div>
                                                    <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)] text-sm space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[var(--text-secondary)]">IP Adresi</span>
                                                            <code className="bg-[var(--bg-muted)] px-2 py-0.5 rounded text-[var(--text-primary)] font-mono text-xs">{event.ip_address || '—'}</code>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[var(--text-secondary)]">Cihaz</span>
                                                            <span className="text-[var(--text-primary)] font-medium">{os || '—'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[var(--text-secondary)]">Tarayıcı</span>
                                                            <span className="text-[var(--text-primary)] font-medium">{browser}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Full Message */}
                                                <div>
                                                    <div className="text-[0.65rem] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Tam Mesaj</div>
                                                    <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] whitespace-pre-wrap break-words">
                                                        {event.message}
                                                    </div>
                                                </div>

                                                {/* Stack Trace */}
                                                {event.stack_trace && (
                                                    <div>
                                                        <div className="text-[0.65rem] font-bold text-red-500 uppercase tracking-widest mb-2">Hata Detayı (Stack Trace)</div>
                                                        <div className="bg-[#0f172a] p-4 rounded-xl text-xs text-slate-300 font-mono whitespace-pre-wrap overflow-x-auto">
                                                            {event.stack_trace}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper component for desktop expanded row
const ExpandedDetailRow = ({ event, browser, os }: { event: EventLog, browser: string, os: string }) => (
    <tr className="bg-[var(--bg-app)] border-b-2 border-[var(--border)] shadow-inner">
        <td colSpan={7} className="p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                
                {/* User Info */}
                {(event.user_name || event.user_email) && (
                    <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-sm">
                        <div className="text-[0.7rem] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-[var(--accent-muted)] text-[var(--accent)]"><User size={14} /></div> Kullanıcı Profili
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-black text-lg border border-indigo-200">
                                    {event.user_name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-bold text-[var(--text-primary)] text-base">{event.user_name}</div>
                                    <div className="text-[var(--text-secondary)] text-sm">{event.user_email}</div>
                                </div>
                            </div>
                            {event.user_id && (
                                <div className="pt-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
                                    Kullanıcı ID: <code className="font-mono bg-[var(--bg-muted)] px-1.5 py-0.5 rounded text-[var(--text-primary)]">#{event.user_id}</code>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Network & Device */}
                <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-sm">
                    <div className="text-[0.7rem] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-blue-500 bg-opacity-10 text-blue-500"><Wifi size={14} /></div> Ağ ve Cihaz
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-1">
                            <span className="text-sm text-[var(--text-secondary)] font-medium">IP Adresi</span>
                            <code className="text-sm font-mono text-[var(--text-primary)] bg-[var(--bg-muted)] px-2 py-1 rounded-md border border-[var(--border)]">{event.ip_address || 'Bilinmiyor'}</code>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-[var(--border)] pt-2">
                            <span className="text-sm text-[var(--text-secondary)] font-medium">İşletim Sistemi</span>
                            <span className="text-sm font-semibold text-[var(--text-primary)]">{os || 'Bilinmiyor'}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-[var(--border)] pt-2">
                            <span className="text-sm text-[var(--text-secondary)] font-medium">Tarayıcı</span>
                            <span className="text-sm font-semibold text-[var(--text-primary)]">{browser}</span>
                        </div>
                    </div>
                </div>

                {/* Event Message */}
                <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-sm xl:col-span-1 md:col-span-2">
                    <div className="text-[0.7rem] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-emerald-500 bg-opacity-10 text-emerald-500"><Info size={14} /></div> Tam Mesaj İçeriği
                    </div>
                    <div className="text-sm text-[var(--text-primary)] font-medium leading-relaxed whitespace-pre-wrap break-words">
                        {event.message}
                    </div>
                </div>

                {/* Stack Trace (if exists) */}
                {event.stack_trace && (
                    <div className="bg-[#0f172a] rounded-2xl p-5 shadow-inner md:col-span-2 xl:col-span-3 border border-slate-700">
                        <div className="text-[0.7rem] font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-red-500 bg-opacity-20 text-red-400"><AlertTriangle size={14} /></div> Hata Detayı (Stack Trace)
                        </div>
                        <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-words leading-relaxed overflow-x-auto p-4 bg-[#1e293b] rounded-xl border border-slate-700">
                            {event.stack_trace}
                        </pre>
                    </div>
                )}
                
                {/* Raw User Agent */}
                {event.user_agent && (
                    <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-sm md:col-span-2 xl:col-span-3">
                        <div className="text-[0.7rem] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Monitor size={14} className="text-[var(--text-secondary)]" /> Ham User-Agent Başlığı
                        </div>
                        <code className="block text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-muted)] p-3 rounded-xl border border-[var(--border)] break-all">
                            {event.user_agent}
                        </code>
                    </div>
                )}
            </div>
        </td>
    </tr>
);
