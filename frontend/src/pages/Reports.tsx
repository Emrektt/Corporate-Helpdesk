import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAnalyticsSummary, getDepartmentDistribution, getTicketTrend } from '../api/analytics-service';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';
import { AlertCircle, Ticket, Clock, CheckCircle, RefreshCw, BarChart2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAdminMode } from '../context/AdminModeContext';

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#10B981', '#3B82F6'];

export const Reports: React.FC = () => {

  const { isDark } = useTheme();
  const { isAdminMode } = useAdminMode();

  const { data: summary, isLoading: l1 } = useQuery({ queryKey: ['analytics_summary', !isAdminMode], queryFn: () => getAnalyticsSummary(!isAdminMode), staleTime: 5 * 60 * 1000 });
  const { data: deptData, isLoading: l2 } = useQuery({ queryKey: ['analytics_departments'], queryFn: () => getDepartmentDistribution(), staleTime: 5 * 60 * 1000 });
  const { data: trendData, isLoading: l3 } = useQuery({ queryKey: ['analytics_trend'], queryFn: () => getTicketTrend(), staleTime: 5 * 60 * 1000 });

  if (l1 || l2 || l3) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const chartTextColor = isDark ? '#94A3B8' : '#64748B';
  const chartGridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';

  const formattedTrend = trendData?.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  })) || [];

  const statCards = [
    { label: 'Toplam Bilet',  value: summary?.total_tickets || 0,        icon: Ticket,      color: 'stat-gradient-indigo', iconColor: '#6366F1' },
    { label: 'Açık',          value: summary?.open_tickets || 0,          icon: AlertCircle, color: 'stat-gradient-blue',   iconColor: '#3B82F6' },
    { label: 'İşlemde',       value: summary?.in_progress_tickets || 0,   icon: RefreshCw,   color: 'stat-gradient-amber',  iconColor: '#F59E0B' },
    { label: 'Çözüldü',       value: summary?.resolved_tickets || 0,      icon: CheckCircle, color: 'stat-gradient-emerald',iconColor: '#10B981' },
    { label: 'Kapatıldı',     value: summary?.closed_tickets || 0,        icon: Clock,       color: 'stat-gradient-rose',   iconColor: '#F43F5E' },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">

      <div style={{ marginBottom: '28px' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart2 size={18} color="white" />
          </div>
          Raporlar ve Analizler
        </h1>
        <p className="page-subtitle">Destek masası performansını ve bilet yoğunluğunu analiz edin.</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {statCards.map(c => (
          <div key={c.label} className={`card ${c.color}`} style={{ padding: '18px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${c.iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <c.icon size={18} color={c.iconColor} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{c.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.1 }}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Trend Chart */}
        <div className="card xl:col-span-2" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '20px' }}>Son 30 Günlük Bilet Trendi</h3>
          <div style={{ height: '280px' }}>
            {formattedTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 11, fill: chartTextColor }} axisLine={false} tickLine={false} tickMargin={8} />
                  <YAxis tick={{ fontSize: 11, fill: chartTextColor }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', boxShadow: 'var(--shadow-md)', color: 'var(--text-primary)' }}
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '16px', fontSize: '0.8125rem', color: chartTextColor }} />
                  <Line type="monotone" name="Açılan" dataKey="total" stroke="#6366F1" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#6366F1' }} />
                  <Line type="monotone" name="Çözülen" dataKey="resolved" stroke="#10B981" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#10B981' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ height: '100%' }}>
                <div className="empty-state-title">Veri yok</div>
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '20px' }}>Departman Dağılımı</h3>
          <div style={{ height: '280px' }}>
            {deptData && deptData.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deptData.filter(d => d.count > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="count" nameKey="name">
                    {deptData.filter(d => d.count > 0).map((_entry, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number | string | ReadonlyArray<number | string> | undefined) => [`${value ?? 0} Bilet`]}
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)' }}
                  />
                  <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: '0.75rem', color: chartTextColor }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ height: '100%' }}>
                <div className="empty-state-title">Bilet yok</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
