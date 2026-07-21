import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, createCategory, deleteCategory } from '../api/ticket-service';
import { getCannedResponses, createCannedResponse, deleteCannedResponse, CannedResponse } from '../api/canned-response-service';
import { getMe } from '../api/auth-service';
import { Settings as SettingsIcon, Plus, Trash2, Edit2, AlertCircle, Building2, FolderTree, X, BookOpen } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'departments' | 'canned'>('departments');
  const [activeDept, setActiveDept] = useState<number | null>(null);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isCannedModalOpen, setIsCannedModalOpen] = useState(false);
  const [cannedTitle, setCannedTitle] = useState('');
  const [cannedContent, setCannedContent] = useState('');
  const [cannedCategory, setCannedCategory] = useState('');
  
  // Department Form
  const [deptName, setDeptName] = useState('');
  const [editingDeptId, setEditingDeptId] = useState<number | null>(null);

  // Category Form
  const [catName, setCatName] = useState('');
  const [catPriority, setCatPriority] = useState('MEDIUM');

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe
  });

  const { data: departments, isLoading: deptsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments
  });

  // Mutations
  const createDeptMutation = useMutation({
    mutationFn: (name: string) => createDepartment(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsDeptModalOpen(false);
      setDeptName('');
    }
  });

  const updateDeptMutation = useMutation({
    mutationFn: ({ id, name }: { id: number, name: string }) => updateDepartment(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsDeptModalOpen(false);
      setDeptName('');
      setEditingDeptId(null);
    }
  });

  const deleteDeptMutation = useMutation({
    mutationFn: (id: number) => deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      if (activeDept) setActiveDept(null);
    },
    onError: (error: unknown) => {
      const axiosErr = error as { response?: { data?: { detail?: string } } };
      alert(axiosErr.response?.data?.detail || "Silme işlemi başarısız oldu");
    }
  });

  const createCatMutation = useMutation({
    mutationFn: () => createCategory(catName, activeDept!, catPriority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsCatModalOpen(false);
      setCatName('');
      setCatPriority('MEDIUM');
    }
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error: unknown) => {
      const axiosErr = error as { response?: { data?: { detail?: string } } };
      alert(axiosErr.response?.data?.detail || "Silme işlemi başarısız oldu");
    }
  });

  const handleOpenDeptModal = (dept?: { id: number; name: string }) => {
    if (dept) {
      setEditingDeptId(dept.id);
      setDeptName(dept.name);
    } else {
      setEditingDeptId(null);
      setDeptName('');
    }
    setIsDeptModalOpen(true);
  };

  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;
    
    if (editingDeptId) {
      updateDeptMutation.mutate({ id: editingDeptId, name: deptName });
    } else {
      createDeptMutation.mutate(deptName);
    }
  };

  const handleSaveCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !activeDept) return;
    createCatMutation.mutate();
  };

  // Canned Responses
  const { data: cannedResponses = [] } = useQuery({
    queryKey: ['canned-responses'],
    queryFn: () => getCannedResponses(),
  });

  const createCannedMutation = useMutation({
    mutationFn: () => createCannedResponse({ title: cannedTitle, content: cannedContent, category: cannedCategory || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canned-responses'] });
      setIsCannedModalOpen(false);
      setCannedTitle(''); setCannedContent(''); setCannedCategory('');
    }
  });

  const deleteCannedMutation = useMutation({
    mutationFn: (id: number) => deleteCannedResponse(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['canned-responses'] }),
  });

  if (meLoading || deptsLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  if (me?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  const selectedDepartment = departments?.find(d => d.id === activeDept);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SettingsIcon size={22} style={{ color: 'var(--text-muted)' }} /> Sistem Ayarları
          </h1>
          <p className="page-subtitle">Departmanlar, kategoriler ve hazır cevapları yönetin.</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg-muted)', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {[
          { key: 'departments', label: 'Departmanlar & Kategoriler', icon: <Building2 size={14} /> },
          { key: 'canned', label: 'Hazır Cevaplar', icon: <BookOpen size={14} /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '0.8375rem', fontWeight: 600, transition: 'all 0.2s ease',
              background: activeTab === tab.key ? 'var(--bg-card)' : 'transparent',
              color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-muted)',
              boxShadow: activeTab === tab.key ? 'var(--shadow)' : 'none',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'canned' ? (
        /* Hazır Cevaplar Sekmesi */
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <BookOpen size={18} color="var(--accent)" /> Hazır Cevap Şablonları
            </h2>
            <button className="btn-primary" style={{ fontSize: '0.8125rem' }} onClick={() => setIsCannedModalOpen(true)}>
              <Plus size={14} /> Yeni Şablon
            </button>
          </div>
          {cannedResponses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              <BookOpen size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: '0.875rem' }}>Henüz hazır cevap şablonu yok.</p>
              <p style={{ fontSize: '0.78rem' }}>Sık kullanılan yanıtlarınızı buraya ekleyin.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cannedResponses.map((cr: CannedResponse) => (
                <div key={cr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 16px', background: 'var(--bg-muted)', borderRadius: '10px', border: '1px solid var(--border)', gap: '12px' }}>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{cr.title}</div>
                    {cr.category && (
                      <span style={{ fontSize: '0.7rem', background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', padding: '1px 6px', borderRadius: '4px', marginBottom: '4px', display: 'inline-block' }}>{cr.category}</span>
                    )}
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{cr.content}</p>
                  </div>
                  <button
                    onClick={() => { if (window.confirm('Bu şablonu silmek istediğinize emin misiniz?')) deleteCannedMutation.mutate(cr.id); }}
                    style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#dc2626', flexShrink: 0 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Canned Response Modal */}
          {isCannedModalOpen && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
              <div className="card" style={{ padding: '28px', width: '100%', maxWidth: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>Yeni Hazır Cevap</h3>
                  <button onClick={() => setIsCannedModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={18} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Başlık *</label>
                    <input className="input-field" value={cannedTitle} onChange={e => setCannedTitle(e.target.value)} placeholder="Ör: Şifre Sıfırlama Adımları" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Kategori (İsteğe Bağlı)</label>
                    <input className="input-field" value={cannedCategory} onChange={e => setCannedCategory(e.target.value)} placeholder="Ör: Genel, Network, Yazılım" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>İçerik *</label>
                    <textarea className="input-field" value={cannedContent} onChange={e => setCannedContent(e.target.value)} placeholder="Şablon metnini buraya yazın..." rows={5} style={{ width: '100%', resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button className="btn-ghost" onClick={() => setIsCannedModalOpen(false)}>İptal</button>
                    <button className="btn-primary" onClick={() => createCannedMutation.mutate()} disabled={!cannedTitle.trim() || !cannedContent.trim() || createCannedMutation.isPending}>
                      {createCannedMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sol Sütun: Departmanlar */}
        <div className="md:col-span-1">
          <div className="bg-white shadow ring-1 ring-slate-200 rounded-xl overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" /> Departmanlar
              </h2>
              <button 
                onClick={() => handleOpenDeptModal()}
                className="p-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                title="Yeni Departman Ekle"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              <ul className="space-y-1">
                {departments?.map((dept) => (
                  <li key={dept.id}>
                    <div 
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        activeDept === dept.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'hover:bg-slate-50 border border-transparent'
                      }`}
                      onClick={() => setActiveDept(dept.id)}
                    >
                      <span className={`font-medium ${activeDept === dept.id ? 'text-blue-700' : 'text-slate-700'}`}>
                        {dept.name}
                      </span>
                      <div className="flex items-center gap-1 opacity-60 hover:opacity-100">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenDeptModal(dept); }}
                          className="p-1 text-slate-500 hover:text-blue-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if(window.confirm('Bu departmanı silmek istediğinize emin misiniz?')) {
                              deleteDeptMutation.mutate(dept.id);
                            }
                          }}
                          className="p-1 text-slate-500 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
                {departments?.length === 0 && (
                  <div className="text-center py-6 text-sm text-slate-500">
                    Henüz departman eklenmemiş.
                  </div>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Sağ Sütun: Kategoriler */}
        <div className="md:col-span-2">
          {activeDept ? (
            <div className="bg-white shadow ring-1 ring-slate-200 rounded-xl overflow-hidden h-[600px] flex flex-col">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-indigo-600" /> 
                  <span className="font-bold text-indigo-600">{selectedDepartment?.name}</span> Kategorileri
                </h2>
                <button 
                  onClick={() => setIsCatModalOpen(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none"
                >
                  <Plus className="w-4 h-4 mr-1" /> Kategori Ekle
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {selectedDepartment?.categories && selectedDepartment.categories.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedDepartment.categories.map((cat: { id: number; name: string }) => (
                      <div key={cat.id} className="border border-slate-200 rounded-lg p-4 flex items-start justify-between bg-white hover:border-slate-300 transition-colors shadow-sm">
                        <div>
                          <h4 className="font-medium text-slate-900">{cat.name}</h4>
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                            ID: {cat.id}
                          </span>
                        </div>
                        <button 
                          onClick={() => {
                            if(window.confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) {
                              deleteCatMutation.mutate(cat.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Kategoriyi Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <AlertCircle className="w-12 h-12 mb-3 text-slate-300" />
                    <p className="text-lg font-medium text-slate-700 mb-1">Kategori Bulunmuyor</p>
                    <p className="text-sm">Bu departmana henüz bir destek kategorisi eklenmemiş.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl h-[600px] flex flex-col items-center justify-center text-slate-500">
              <Building2 className="w-16 h-16 mb-4 text-slate-300" />
              <p className="text-lg font-medium">Kategorileri görmek için</p>
              <p>soldaki listeden bir departman seçin.</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Departman Ekleme/Düzenleme Modalı */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingDeptId ? 'Departmanı Düzenle' : 'Yeni Departman Ekle'}
              </h3>
              <button onClick={() => setIsDeptModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveDept} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Departman Adı</label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border shadow-sm"
                  placeholder="Örn: Bilgi İşlem (IT)"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={createDeptMutation.isPending || updateDeptMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingDeptId ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kategori Ekleme Modalı */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">Yeni Kategori Ekle</h3>
              <button onClick={() => setIsCatModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCat} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategori Adı</label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border shadow-sm"
                  placeholder="Örn: Yazıcı Sorunları"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Varsayılan Öncelik</label>
                <select
                  value={catPriority}
                  onChange={(e) => setCatPriority(e.target.value)}
                  className="w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border shadow-sm"
                >
                  <option value="LOW">Düşük</option>
                  <option value="MEDIUM">Orta</option>
                  <option value="HIGH">Yüksek</option>
                  <option value="URGENT">Acil</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Kullanıcı bu kategoriyi seçtiğinde talebe otomatik verilecek öncelik.</p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={createCatMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  Kategori Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

