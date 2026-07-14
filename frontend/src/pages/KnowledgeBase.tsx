import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getArticles, getArticle, createArticle, updateArticle, deleteArticle, Article } from '../api/article-service';
import { getDepartments } from '../api/ticket-service';
import { getMe } from '../api/auth-service';
import { BookOpen, Search, PlusCircle, Edit2, Trash2, Eye, ChevronRight, Save, X, ArrowLeft } from 'lucide-react';

const LABEL: React.CSSProperties = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' };

export const KnowledgeBase: React.FC = () => {
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const queryClient = useQueryClient();

  const [selectedDept, setSelectedDept] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewArticle, setViewArticle] = useState<Article | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ id: 0, title: '', content: '', department_id: 0, is_published: true });

  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: getDepartments });
  const { data: articles, isLoading } = useQuery({ queryKey: ['articles', selectedDept], queryFn: () => getArticles(selectedDept) });

  const createMutation = useMutation({ mutationFn: createArticle, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['articles'] }); setIsEditing(false); } });
  const updateMutation = useMutation({ mutationFn: (d: any) => updateArticle(d.id, d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['articles'] }); setIsEditing(false); setViewArticle(null); } });
  const deleteMutation = useMutation({ mutationFn: deleteArticle, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['articles'] }); setViewArticle(null); } });

  const handleSave = (e: React.FormEvent) => { e.preventDefault(); editForm.id ? updateMutation.mutate(editForm) : createMutation.mutate(editForm); };
  const handleEdit = (a: Article) => { setEditForm({ id: a.id, title: a.title, content: a.content, department_id: a.department_id, is_published: a.is_published }); setIsEditing(true); setViewArticle(null); };
  const isStaff = me?.role === 'ADMIN' || me?.role === 'SUPPORT_AGENT';
  const filtered = articles?.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.content.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '24px', alignItems: 'flex-start' }} className="animate-fade-in">

      {/* Sidebar */}
      <div className="card" style={{ width: '220px', flexShrink: 0, padding: '20px', position: 'sticky', top: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <BookOpen size={16} color="var(--accent)" />
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>Bilgi Bankası</span>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-field" style={{ paddingLeft: '30px', fontSize: '0.8rem' }} placeholder="Makalelerde ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>

        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Departmanlar</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {[{ id: undefined, name: 'Tümü' }, ...(departments || [])].map(d => (
            <button key={d.id ?? 'all'} onClick={() => setSelectedDept(d.id)} style={{
              textAlign: 'left', padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: selectedDept === d.id ? 'var(--accent-muted)' : 'transparent',
              color: selectedDept === d.id ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: selectedDept === d.id ? 600 : 400,
              fontSize: '0.8125rem', transition: 'all 0.15s ease',
            }}>
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)' }}>{editForm.id ? 'Makaleyi Düzenle' : 'Yeni Makale'}</h2>
              <button onClick={() => setIsEditing(false)} className="btn-ghost" style={{ padding: '6px' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><label style={LABEL}>Başlık</label><input required className="input-field" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div>
                <label style={LABEL}>Departman</label>
                <select required className="input-field" value={editForm.department_id} onChange={e => setEditForm(f => ({ ...f, department_id: Number(e.target.value) }))}>
                  <option value={0}>Seçin...</option>
                  {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div><label style={LABEL}>İçerik</label><textarea required rows={12} className="input-field" style={{ resize: 'vertical' }} value={editForm.content} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="pub" checked={editForm.is_published} onChange={e => setEditForm(f => ({ ...f, is_published: e.target.checked }))} />
                <label htmlFor="pub" style={{ ...LABEL, marginBottom: 0 }}>Yayınla</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsEditing(false)} className="btn-ghost">İptal</button>
                <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}><Save size={14} />Kaydet</button>
              </div>
            </form>
          </div>
        ) : viewArticle ? (
          <div className="card" style={{ padding: '32px' }}>
            <button onClick={() => setViewArticle(null)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, marginBottom: '20px' }}>
              <ArrowLeft size={15} /> Listeye Dön
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>{viewArticle.title}</h1>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span className="badge" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>{viewArticle.department.name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={13} /> {viewArticle.view_count} görüntülenme</span>
                  <span>{viewArticle.author.full_name}</span>
                  <span>{new Date(viewArticle.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
              {isStaff && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEdit(viewArticle)} className="btn-ghost" style={{ padding: '6px 10px' }}><Edit2 size={14} /></button>
                  <button onClick={() => { if (window.confirm('Silinsin mi?')) deleteMutation.mutate(viewArticle.id); }} className="btn-danger" style={{ padding: '6px 10px' }}><Trash2 size={14} /></button>
                </div>
              )}
            </div>
            <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{viewArticle.content}</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
              <div>
                <h1 className="page-title">Makaleler</h1>
                <p className="page-subtitle">Sık karşılaşılan sorunlar ve çözümleri.</p>
              </div>
              {isStaff && (
                <button className="btn-primary" onClick={() => { setEditForm({ id: 0, title: '', content: '', department_id: departments?.[0]?.id || 0, is_published: true }); setIsEditing(true); }}>
                  <PlusCircle size={15} /> Yeni Makale
                </button>
              )}
            </div>

            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : (filtered?.length ?? 0) === 0 ? (
              <div className="empty-state card">
                <BookOpen size={36} className="empty-state-icon" />
                <div className="empty-state-title">Makale Bulunamadı</div>
                <div className="empty-state-desc">Bu kriterlere uygun makale yok.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filtered?.map(article => (
                  <div
                    key={article.id}
                    className="card-hover"
                    onClick={() => { setViewArticle(article); getArticle(article.id).catch(() => {}); }}
                    style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span className="badge" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>{article.department.name}</span>
                        {!article.is_published && <span className="badge" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--warning)' }}>Taslak</span>}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{article.title}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{article.content.slice(0, 100)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={13} /> {article.view_count}</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
