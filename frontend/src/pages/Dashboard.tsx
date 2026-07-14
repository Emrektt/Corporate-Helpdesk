import React, { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getTickets, Ticket, TicketFilters } from '../api/ticket-service';
import { getAnalyticsSummary } from '../api/analytics-service';
import { getMe } from '../api/auth-service';
import {
  CheckCircle, AlertCircle, RefreshCw, Eye,
  Ticket as TicketIcon, Search, X, PlusCircle
} from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  OPEN:        { label: 'Açık',      cls: 'badge badge-open' },
  IN_PROGRESS: { label: 'İşlemde',   cls: 'badge badge-progress' },
  RESOLVED:    { label: 'Çözüldü',   cls: 'badge badge-resolved' },
  CLOSED:      { label: 'Kapatıldı', cls: 'badge badge-closed' },
};

const PRIORITY_MAP: Record<string, { label: string; cls: string }> = {
  LOW:      { label: 'Düşük',  cls: 'badge badge-low' },
  MEDIUM:   { label: 'Orta',   cls: 'badge badge-medium' },
  HIGH:     { label: 'Yüksek', cls: 'badge badge-high' },
  CRITICAL: { label: 'Kritik', cls: 'badge badge-critical' },
};

// Animated counter
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 20);
    const timer = setInterval(() => {
      start = Math.min(start + step, value);
      setDisplay(start);
      if (start >= value) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
}

export const Dashboard: React.FC = () => {
  const [filters, setFilters] = useState<TicketFilters>({ search: '', status: '', priority: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setFilters(prev => ({ ...prev, search: searchTerm })), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const { data: summary } = useQuery({ queryKey: ['analytics_summary'], queryFn: getAnalyticsSummary });
  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => getTickets(filters),
    placeholderData: keepPreviousData,
  });

  const tickets: Ticket[] = ticketsData ?? [];

  const statCards = [
    { label: 'Toplam Bilet', value: summary?.total_tickets ?? 0, icon: TicketIcon, color: 'stat-gradient-indigo', iconColor: '#6366F1' },
    { label: 'Açık',        value: summary?.open_tickets ?? 0,   icon: AlertCircle, color: 'stat-gradient-blue',   iconColor: '#3B82F6' },
    { label: 'İşlemde',     value: summary?.in_progress_tickets ?? 0, icon: RefreshCw, color: 'stat-gradient-amber', iconColor: '#F59E0B' },
    { label: 'Çözüldü',     value: summary?.resolved_tickets ?? 0, icon: CheckCircle, color: 'stat-gradient-emerald', iconColor: '#10B981' },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 className="page-title">Genel Bakış</h1>
          <p className="page-subtitle">Hoş geldiniz, <strong style={{ color: 'var(--accent)' }}>{me?.full_name?.split(' ')[0]}</strong> 👋</p>
        </div>
        <Link to="/create-ticket">
          <button className="btn-primary">
            <PlusCircle size={16} />
            Yeni Talep
          </button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {statCards.map(card => (
          <div key={card.label} className={`card ${card.color}`} style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${card.iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <card.icon size={20} color={card.iconColor} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '4px' }}>{card.label}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1 }}>
                <AnimatedNumber value={card.value} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input-field"
              style={{ paddingLeft: '36px', paddingRight: searchTerm ? '36px' : '12px' }}
              placeholder="Bilet ara..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status filter */}
          <select
            className="input-field"
            style={{ flex: '0 1 160px', cursor: 'pointer' }}
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            <option value="">Tüm Durumlar</option>
            <option value="OPEN">Açık</option>
            <option value="IN_PROGRESS">İşlemde</option>
            <option value="RESOLVED">Çözüldü</option>
            <option value="CLOSED">Kapatıldı</option>
          </select>

          {/* Priority filter */}
          <select
            className="input-field"
            style={{ flex: '0 1 160px', cursor: 'pointer' }}
            value={filters.priority}
            onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
          >
            <option value="">Tüm Öncelikler</option>
            <option value="LOW">Düşük</option>
            <option value="MEDIUM">Orta</option>
            <option value="HIGH">Yüksek</option>
            <option value="CRITICAL">Kritik</option>
          </select>

          {(filters.status || filters.priority || filters.search) && (
            <button className="btn-ghost" onClick={() => { setFilters({ search: '', status: '', priority: '' }); setSearchTerm(''); }}>
              <X size={14} /> Temizle
            </button>
          )}
        </div>
      </div>

      {/* Ticket Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>Taleplerim</h2>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{tickets.length} sonuç</span>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <TicketIcon size={40} className="empty-state-icon" />
            <div className="empty-state-title">Bilet Bulunamadı</div>
            <div className="empty-state-desc">Arama kriterlerinize uygun talep yok.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Başlık</th>
                  <th>Durum</th>
                  <th>Öncelik</th>
                  <th>Tarih</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>#{ticket.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ticket.title}
                      </div>
                      {ticket.category && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ticket.category.name}</div>
                      )}
                    </td>
                    <td>
                      <span className={STATUS_MAP[ticket.status]?.cls || 'badge'}>
                        {STATUS_MAP[ticket.status]?.label || ticket.status}
                      </span>
                    </td>
                    <td>
                      <span className={PRIORITY_MAP[ticket.priority]?.cls || 'badge'}>
                        {PRIORITY_MAP[ticket.priority]?.label || ticket.priority}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                      {new Date(ticket.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <Link to={`/ticket/${ticket.id}`}>
                        <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                          <Eye size={13} /> Görüntüle
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
