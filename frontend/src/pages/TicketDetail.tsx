import React, { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTicket, getComments, addComment, updateTicketStatus, uploadAttachment, deleteTicket, Ticket } from '../api/ticket-service';
import { getMe } from '../api/auth-service';
import { ArrowLeft, Clock, MessageSquare, AlertCircle, RefreshCw, CheckCircle, Send, Paperclip, Download, FileText } from 'lucide-react';

export const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verileri Çek
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: getMe
  });

  const { data: ticket, isLoading: isTicketLoading, isError } = useQuery<Ticket>({
    queryKey: ['ticket', ticketId],
    queryFn: () => getTicket(ticketId),
    enabled: !!ticketId
  });

  const { data: comments, isLoading: isCommentsLoading } = useQuery({
    queryKey: ['comments', ticketId],
    queryFn: () => getComments(ticketId),
    enabled: !!ticketId
  });

  // Yorum Ekleme Mutasyonu
  const addCommentMutation = useMutation({
    mutationFn: ({ content, isInternal }: { content: string, isInternal: boolean }) => addComment(ticketId, content, isInternal),
    onSuccess: () => {
      setCommentText('');
      setIsInternal(false);
      queryClient.invalidateQueries({ queryKey: ['comments', ticketId] });
    }
  });

  // Dosya Yükleme Mutasyonu
  const uploadAttachmentMutation = useMutation({
    mutationFn: (file: File) => uploadAttachment(ticketId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    }
  });

  // Durum Güncelleme Mutasyonu
  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => updateTicketStatus(ticketId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    }
  });

  const deleteTicketMutation = useMutation({
    mutationFn: () => deleteTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      navigate('/dashboard', { replace: true });
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Bilet silinirken bir hata oluştu.");
    }
  });

  const handleDeleteTicket = () => {
    if (window.confirm('Bu bileti kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
      deleteTicketMutation.mutate();
    }
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ content: commentText, isInternal });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateStatusMutation.mutate(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAttachmentMutation.mutate(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Input'u temizle
    }
  };

  // Duruma göre etiketler
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"><AlertCircle className="w-4 h-4 mr-1.5" /> Açık</span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800"><RefreshCw className="w-4 h-4 mr-1.5" /> İşlemde</span>;
      case 'RESOLVED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800"><CheckCircle className="w-4 h-4 mr-1.5" /> Çözüldü</span>;
      case 'CLOSED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800">Kapatıldı</span>;
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (isTicketLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Bilet detayları yüklenemedi veya bu bileti görüntüleme yetkiniz yok.
        </div>
        <Link to="/dashboard" className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard'a Dön
        </Link>
      </div>
    );
  }

  const isSupportOrAdmin = me?.role === 'SUPPORT_AGENT' || me?.role === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Üst Kısım: Geri Dön ve Bilet Numarası */}
      <div className="mb-6">
        <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Taleplere Dön
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="text-blue-600">{ticket.ticket_number}</span>
          </h1>
          <div>
            {getStatusBadge(ticket.status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Sol Kısım: Bilet Detayları ve Yorumlar */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white shadow-sm ring-1 ring-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{ticket.title}</h2>
            <div className="prose max-w-none text-slate-600 mb-6">
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {/* Ekli Dosyalar Alanı */}
            <div className="border-t border-slate-100 pt-4 mt-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-slate-400" /> Ekler ({ticket.attachments?.length || 0})
              </h3>
              
              {ticket.attachments && ticket.attachments.length > 0 && (
                <ul className="mt-2 divide-y divide-slate-100 rounded-md border border-slate-200">
                  {ticket.attachments.map((attachment) => (
                    <li key={attachment.id} className="flex items-center justify-between py-3 pl-3 pr-4 text-sm hover:bg-slate-50 transition-colors">
                      <div className="flex w-0 flex-1 items-center gap-2">
                        <FileText className="w-5 h-5 flex-shrink-0 text-slate-400" />
                        <span className="truncate font-medium text-slate-600">{attachment.file_name}</span>
                        <span className="text-xs text-slate-400">({Math.round(attachment.size / 1024)} KB)</span>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <a 
                          href={`http://localhost:8001/api/v1/tickets/${ticket.id}/attachments/${attachment.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-500 inline-flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" /> İndir
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Dosya Yükleme Butonu */}
              {ticket.status !== 'CLOSED' && (
                <div className="mt-4">
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadAttachmentMutation.isPending}
                    className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {uploadAttachmentMutation.isPending ? (
                      <span className="flex items-center"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600 mr-2"></div> Yükleniyor...</span>
                    ) : (
                      <span className="flex items-center"><Paperclip className="w-4 h-4 mr-2" /> Dosya Ekle</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Yorumlar Alanı (Chat Arayüzü) */}
          <div className="bg-white shadow-sm ring-1 ring-slate-200 rounded-xl p-6 flex flex-col h-[500px]">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-3">
              <MessageSquare className="w-5 h-5 text-blue-600" /> Mesajlar
            </h3>
            
            {/* Mesaj Listesi */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
              {isCommentsLoading ? (
                <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>
              ) : comments?.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>Henüz bir mesaj bulunmuyor.</p>
                </div>
              ) : (
                comments?.map((comment) => {
                  const isMine = comment.user.id === me?.id;
                  const isInternalNote = comment.is_internal;

                  return (
                    <div key={comment.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-baseline gap-2 mb-1 px-1">
                        <span className="text-xs font-semibold text-slate-600">{isMine ? 'Siz' : comment.user.full_name}</span>
                        {isInternalNote && <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-medium border border-amber-200">🔒 İç Yazışma</span>}
                        {!isMine && !isInternalNote && <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{comment.user.role === 'SUPPORT_AGENT' ? 'Destek' : 'Kullanıcı'}</span>}
                        <span className="text-[10px] text-slate-400">
                          {new Date(comment.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={`px-4 py-2.5 max-w-[85%] ${
                        isInternalNote
                          ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl rounded-bl-none'
                          : isMine 
                            ? 'bg-blue-600 text-white rounded-2xl rounded-br-none' 
                            : 'bg-slate-100 text-slate-800 rounded-2xl rounded-bl-none'
                      }`}>
                        <p className="whitespace-pre-wrap text-sm">{comment.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Mesaj Gönderme Formu */}
            <form onSubmit={handleSendComment} className="mt-auto border-t pt-4 flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={addCommentMutation.isPending || ticket.status === 'CLOSED'}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || addCommentMutation.isPending || ticket.status === 'CLOSED'}
                  className="inline-flex items-center justify-center p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              {isSupportOrAdmin && ticket.status !== 'CLOSED' && (
                <div className="flex items-center mt-1 ml-1">
                  <input
                    id="is_internal"
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_internal" className="ml-2 block text-xs text-slate-600">
                    🔒 Sadece Destek Ekibi Görsün (İç Yazışma)
                  </label>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Sağ Kısım: Bilgi Paneli ve İşlemler */}
        <div className="space-y-6">
          
          {/* Sadece yetkililere görünen durum güncelleme paneli */}
          {isSupportOrAdmin && (
            <div className="bg-blue-50 shadow-sm ring-1 ring-blue-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Bilet Yönetimi
              </h3>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Durumu Değiştir</label>
                <select
                  value={ticket.status}
                  onChange={handleStatusChange}
                  disabled={updateStatusMutation.isPending}
                  className="mt-1 block w-full rounded-md border-slate-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="OPEN">Açık</option>
                  <option value="IN_PROGRESS">İşlemde</option>
                  <option value="WAITING_FOR_USER">Kullanıcı Bekleniyor</option>
                  <option value="RESOLVED">Çözüldü</option>
                  <option value="CLOSED">Kapatıldı</option>
                </select>
              </div>
              
              {me?.role === 'ADMIN' && (
                <div className="mt-4 pt-4 border-t border-blue-100">
                  <button
                    onClick={handleDeleteTicket}
                    disabled={deleteTicketMutation.isPending}
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    Bileti Kalıcı Olarak Sil
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="bg-white shadow-sm ring-1 ring-slate-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Talep Bilgileri</h3>
            
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-slate-500">Departman</dt>
                <dd className="mt-1 text-sm text-slate-900">{ticket.department.name}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-slate-500">Kategori</dt>
                <dd className="mt-1 text-sm text-slate-900">{ticket.category.name}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-slate-500">Öncelik</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {ticket.priority === 'URGENT' ? 'Acil' : ticket.priority === 'HIGH' ? 'Yüksek' : ticket.priority === 'LOW' ? 'Düşük' : 'Orta'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> Açılış Tarihi
                </dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {new Date(ticket.created_at).toLocaleString('tr-TR', { 
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </dd>
              </div>
            </dl>
          </div>
        </div>

      </div>
    </div>
  );
};

