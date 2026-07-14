import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, createCategory, deleteCategory } from '../api/ticket-service';
import { getMe } from '../api/auth-service';
import { Settings as SettingsIcon, Plus, Trash2, Edit2, AlertCircle, Building2, FolderTree, X } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeDept, setActiveDept] = useState<number | null>(null);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  
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
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Silme işlemi başarısız oldu");
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
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Silme işlemi başarısız oldu");
    }
  });

  const handleOpenDeptModal = (dept?: any) => {
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
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-slate-500" /> Sistem Ayarları
          </h1>
          <p className="mt-2 text-sm text-slate-700">
            Departmanları ve destek kategorilerini buradan yönetebilirsiniz.
          </p>
        </div>
      </div>

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
                    {selectedDepartment.categories.map((cat: any) => (
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
