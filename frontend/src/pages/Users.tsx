import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUsers, User } from '../api/user-service';
import { Users as UsersIcon, Shield, Search, User as UserIcon, Mail, CheckCircle, XCircle } from 'lucide-react';

export const Users: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: users = [], isLoading, isError, refetch, isFetching } = useQuery<User[]>({
        queryKey: ['admin-users'],
        queryFn: getUsers,
    });

    const filtered = useMemo(() => users.filter(u => {
        const term = searchTerm.toLowerCase();
        return !term ||
            u.full_name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            u.role.toLowerCase().includes(term);
    }), [users, searchTerm]);

    const stats = useMemo(() => ({
        total: users.length,
        admins: users.filter(u => u.role === 'ADMIN').length,
        agents: users.filter(u => u.role === 'SUPPORT_AGENT').length,
        active: users.filter(u => u.is_active).length,
    }), [users]);

    return (
        <div className="animate-fade-in pb-10">
            {/* Header */}
            <div className="mb-8 p-6 sm:p-8 rounded-[24px] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-app)] border border-[var(--border)] shadow-[var(--shadow-sm)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-[0.03] blur-[60px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] flex items-center gap-3 mb-2 tracking-tight">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm text-white">
                                <UsersIcon size={24} />
                            </div>
                            Kullanıcı Yönetimi
                        </h1>
                        <p className="text-[var(--text-secondary)] text-sm sm:text-base ml-[60px] font-medium">Sistemdeki tüm üyeleri ve yetkilerini görüntüleyin.</p>
                    </div>
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] font-semibold shadow-sm hover:shadow-md hover:border-indigo-500 transition-all duration-300"
                    >
                        <UsersIcon size={18} className={isFetching ? 'animate-spin text-indigo-500' : 'text-[var(--text-secondary)]'} />
                        {isFetching ? 'Yenileniyor...' : 'Listeyi Yenile'}
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-[var(--border)]">
                    <StatCard label="Toplam Üye" value={stats.total} color="text-indigo-500" />
                    <StatCard label="Aktif Kullanıcı" value={stats.active} color="text-emerald-500" />
                    <StatCard label="Admin Sayısı" value={stats.admins} color="text-purple-500" />
                    <StatCard label="Destek Uzmanı" value={stats.agents} color="text-blue-500" />
                </div>
            </div>

            {/* Filter Bar */}
            <div className="mb-6 p-4 rounded-[20px] bg-[var(--bg-card)] border border-[var(--border)] shadow-[var(--shadow-sm)] flex items-center">
                <div className="relative w-full max-w-md">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        placeholder="İsim, e-posta veya rol ara..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-[var(--text-primary)] font-medium transition-all"
                    />
                </div>
            </div>

            {/* Results Area */}
            {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center text-[var(--text-secondary)]">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                    <h3 className="font-bold">Kullanıcılar Yükleniyor</h3>
                </div>
            ) : isError ? (
                <div className="py-20 flex flex-col items-center justify-center text-red-500 bg-[var(--bg-card)] rounded-[24px]">
                    <XCircle size={48} className="mb-4 opacity-80" />
                    <h3 className="font-bold">Bağlantı Hatası</h3>
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border)] rounded-[24px]">
                    <Search size={48} className="mb-4 opacity-20" />
                    <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Sonuç Bulunamadı</h3>
                    <p>Filtrenize uygun kullanıcı bulunamadı.</p>
                </div>
            ) : (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[24px] overflow-hidden shadow-[var(--shadow-sm)]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-[var(--bg-app)] border-b-2 border-[var(--border)]">
                                    <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider pl-8">Kullanıcı</th>
                                    <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">İletişim</th>
                                    <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Rol / Yetki</th>
                                    <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Durum</th>
                                    <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Kayıt Tarihi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {filtered.map(user => (
                                    <tr key={user.id} className="hover:bg-[var(--bg-muted)] transition-colors">
                                        <td className="p-4 pl-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-black text-sm border border-indigo-200">
                                                    {user.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-[var(--text-primary)] text-sm">{user.full_name}</div>
                                                    <div className="text-[var(--text-muted)] text-xs font-mono mt-0.5">ID: #{user.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] font-medium">
                                                <Mail size={14} className="text-[var(--text-muted)]" />
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <RoleBadge role={user.role} />
                                        </td>
                                        <td className="p-4">
                                            {user.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold border border-emerald-500/20">
                                                    <CheckCircle size={12} /> Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20">
                                                    <XCircle size={12} /> Pasif
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-[var(--text-secondary)] font-medium">
                                            {new Date(user.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="flex flex-col gap-1 p-4 rounded-xl bg-[var(--bg-muted)] hover:shadow-md transition-shadow">
        <div className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider">{label}</div>
        <div className={`text-3xl font-black ${color}`}>{value}</div>
    </div>
);

const RoleBadge = ({ role }: { role: string }) => {
    let color = 'text-gray-500';
    let bg = 'bg-gray-500/10';
    let border = 'border-gray-500/20';
    let icon = <UserIcon size={12} />;

    if (role === 'ADMIN') {
        color = 'text-purple-600';
        bg = 'bg-purple-500/10';
        border = 'border-purple-500/20';
        icon = <Shield size={12} />;
    } else if (role === 'SUPPORT_AGENT') {
        color = 'text-blue-600';
        bg = 'bg-blue-500/10';
        border = 'border-blue-500/20';
        icon = <Shield size={12} />;
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg ${bg} ${color} text-xs font-bold border ${border}`}>
            {icon} {role}
        </span>
    );
};
