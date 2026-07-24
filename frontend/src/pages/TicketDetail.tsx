import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTicket, getComments, addComment, updateTicketStatus,
  uploadAttachment, deleteTicket, getSLAStatus, submitCSAT, Ticket
} from '../api/ticket-service';
import { getCannedResponses } from '../api/canned-response-service';
import { getMe } from '../api/auth-service';
import {
  ArrowLeft, Clock, MessageSquare, AlertCircle,
  CheckCircle, Send, Paperclip, Download, FileText,
  Star, BookOpen, Search, X, ShieldAlert, CheckCircle2, Timer
} from 'lucide-react';
import { useAdminMode } from '../context/AdminModeContext';

// ── SLA Badge ────────────────────────────────────────────────────────────────
const SLABadge: React.FC<{ ticketId: number }> = ({ ticketId }) => {
  const { data: sla } = useQuery({
    queryKey: ['sla', ticketId],
    queryFn: () => getSLAStatus(ticketId),
    refetchInterval: 60_000,
  });

  if (!sla?.has_sla) return null;

  const colorMap = {
    ok: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#059669', icon: <Timer size={13} /> },
    warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#d97706', icon: <AlertCircle size={13} /> },
    breached: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#dc2626', icon: <ShieldAlert size={13} /> },
    resolved: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', text: '#6366f1', icon: <CheckCircle2 size={13} /> },
  };
  const c = colorMap[sla.status ?? 'ok'];

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '5px 10px', borderRadius: '8px',
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      fontSize: '0.78rem', fontWeight: 600,
    }}>
      {c.icon}
      SLA: {sla.status === 'resolved' ? 'Çözüldü' : sla.remaining_label}
      {sla.is_breached && ' ⚠️'}
    </div>
  );
};

// ── Star Rating (CSAT) ───────────────────────────────────────────────────────
const StarRating: React.FC<{ value: number; onChange: (v: number) => void; readOnly?: boolean }> = ({ value, onChange, readOnly }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => !readOnly && onChange(n)}
          onMouseEnter={() => !readOnly && setHovered(n)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          style={{
            background: 'none', border: 'none', cursor: readOnly ? 'default' : 'pointer',
            padding: '2px', transition: 'transform 0.1s',
            transform: (hovered || value) >= n ? 'scale(1.2)' : 'scale(1)',
          }}
        >
          <Star
            size={28}
            fill={(hovered || value) >= n ? '#f59e0b' : 'none'}
            color={(hovered || value) >= n ? '#f59e0b' : 'var(--border)'}
          />
        </button>
      ))}
    </div>
  );
};

// ── Canned Response Picker ───────────────────────────────────────────────────
const CannedResponsePicker: React.FC<{ onSelect: (content: string) => void; onClose: () => void }> = ({ onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const { data: responses = [] } = useQuery({
    queryKey: ['canned-responses', search],
    queryFn: () => getCannedResponses(search || undefined),
  });

  return (
    <div style={{
      position: 'absolute', bottom: '110%', left: 0, right: 0, zIndex: 50,
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '12px', boxShadow: 'var(--shadow-lg)',
      overflow: 'hidden', animation: 'fadeIn 0.15s ease-out',
    }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Search size={14} color="var(--text-muted)" />
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Şablon ara..."
          style={{
            flex: 1, border: 'none', background: 'none', outline: 'none',
            fontSize: '0.875rem', color: 'var(--text-primary)',
          }}
        />
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
          <X size={14} />
        </button>
      </div>
      <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
        {responses.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Şablon bulunamadı
          </div>
        ) : (
          responses.map(r => (
            <button
              key={r.id}
              onClick={() => { onSelect(r.content); onClose(); }}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 14px',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.1s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-muted)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{r.title}</div>
              {r.category && (
                <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginTop: '1px' }}>{r.category}</div>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.content}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isAdminMode } = useAdminMode();

  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [showCannedPicker, setShowCannedPicker] = useState(false);
  const [csatScore, setCsatScore] = useState(0);
  const [csatComment, setCsatComment] = useState('');
  const [csatSubmitted, setCsatSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const { data: ticket, isLoading: isTicketLoading, isError } = useQuery<Ticket>({
    queryKey: ['ticket', ticketId],
    queryFn: () => getTicket(ticketId),
    enabled: !!ticketId
  });
  const { data: comments, isLoading: isCommentsLoading } = useQuery({
    queryKey: ['comments', ticketId],
    queryFn: () => getComments(ticketId),
    enabled: !!ticketId,
    refetchInterval: 5000
  });

  // Mark CSAT as already submitted if ticket has score
  useEffect(() => {
    if (ticket?.csat_score !== null && ticket?.csat_score !== undefined) {
      setCsatSubmitted(true);
      setCsatScore(ticket.csat_score);
    }
  }, [ticket]);

  // If in user mode and trying to view someone else's ticket, kick them out
  const isTicketOwner = me?.id === ticket?.created_by_id;
  useEffect(() => {
    if (ticket && me && !isAdminMode && !isTicketOwner) {
      navigate('/dashboard', { replace: true });
    }
  }, [ticket, me, isAdminMode, isTicketOwner, navigate]);

  const addCommentMutation = useMutation({
    mutationFn: ({ content, isInternal }: { content: string; isInternal: boolean }) =>
      addComment(ticketId, content, isInternal),
    onSuccess: () => {
      setCommentText('');
      setIsInternal(false);
      queryClient.invalidateQueries({ queryKey: ['comments', ticketId] });
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: (file: File) => uploadAttachment(ticketId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => updateTicketStatus(ticketId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['sla', ticketId] });
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: () => deleteTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      navigate('/dashboard', { replace: true });
    },
    onError: (error: unknown) => {
      const axiosErr = error as { response?: { data?: { detail?: string } } };
      alert(axiosErr.response?.data?.detail || 'Bilet silinirken bir hata oluştu.');
    },
  });

  const csatMutation = useMutation({
    mutationFn: () => submitCSAT(ticketId, csatScore, csatComment),
    onSuccess: () => {
      setCsatSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    },
    onError: (error) => {
      const err = error as { response?: { data?: { detail?: string } } };
      const msg = err.response?.data?.detail || 'Değerlendirme gönderilirken bir hata oluştu.';
      alert(msg);
      console.error("CSAT Error:", err.response?.data);
    }
  });

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
    if (file) uploadAttachmentMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteTicket = () => {
    if (window.confirm('Bu bileti kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
      deleteTicketMutation.mutate();
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      OPEN: { label: 'Açık', cls: 'badge badge-open' },
      IN_PROGRESS: { label: 'İşlemde', cls: 'badge badge-progress' },
      RESOLVED: { label: 'Çözüldü', cls: 'badge badge-resolved' },
      CLOSED: { label: 'Kapatıldı', cls: 'badge badge-closed' },
      ASSIGNED: { label: 'Atandı', cls: 'badge badge-progress' },
      WAITING_FOR_USER: { label: 'Kullanıcı Bekleniyor', cls: 'badge badge-medium' },
      CANCELLED: { label: 'İptal', cls: 'badge badge-closed' },
    };
    const m = map[status];
    return m ? <span className={m.cls}>{m.label}</span> : <span className="badge">{status}</span>;
  };

  if (isTicketLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div style={{ maxWidth: '800px', margin: '32px auto', padding: '0 20px' }}>
        <div className="card" style={{ padding: '24px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} /> Bilet detayları yüklenemedi.
        </div>
        <Link to="/dashboard" style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', textDecoration: 'none', fontSize: '0.875rem' }}>
          <ArrowLeft size={15} /> Dashboard'a Dön
        </Link>
      </div>
    );
  }

  const isSupportOrAdmin = isAdminMode && (me?.role === 'ADMIN' || me?.role === 'SUPPORT_AGENT');
  const showCSAT = isTicketOwner && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED');

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }} className="animate-fade-in">

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '12px' }}>
          <ArrowLeft size={15} /> Taleplere Dön
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h1 className="page-title" style={{ margin: 0 }}>
            <span style={{ color: 'var(--accent)' }}>{ticket.ticket_number}</span>
          </h1>
          {getStatusBadge(ticket.status)}
          <SLABadge ticketId={ticketId} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

        {/* Left: Detail + Comments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Ticket Info */}
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '12px' }}>{ticket.title}</h2>
            <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.9rem' }}>{ticket.description}</p>

            {/* Attachments */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '20px' }}>
              <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Paperclip size={14} /> Ekler ({ticket.attachments?.length || 0})
              </h3>
              {ticket.attachments?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {ticket.attachments.map(att => (
                    <div key={att.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-muted)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <FileText size={14} color="var(--text-muted)" />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.file_name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>({Math.round(att.size / 1024)} KB)</span>
                      </div>
                      <a href={`http://localhost:8001/api/v1/tickets/${ticket.id}/attachments/${att.id}`} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 500, flexShrink: 0 }}>
                        <Download size={13} /> İndir
                      </a>
                    </div>
                  ))}
                </div>
              )}
              {ticket.status !== 'CLOSED' && (
                <div style={{ marginTop: '10px' }}>
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploadAttachmentMutation.isPending}
                    className="btn-ghost" style={{ fontSize: '0.8rem' }}>
                    <Paperclip size={14} /> {uploadAttachmentMutation.isPending ? 'Yükleniyor...' : 'Dosya Ekle'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* CSAT Card */}
          {showCSAT && (
            <div className="card" style={{ padding: '24px', border: csatSubmitted ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(245,158,11,0.3)', background: csatSubmitted ? 'rgba(16,185,129,0.05)' : 'rgba(245,158,11,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Star size={18} color={csatSubmitted ? '#10b981' : '#f59e0b'} fill={csatSubmitted ? '#10b981' : '#f59e0b'} />
                <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', margin: 0 }}>
                  {csatSubmitted ? 'Değerlendirmeniz Alındı' : 'Talebinizi Değerlendirin'}
                </h3>
              </div>
              {csatSubmitted ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <StarRating value={csatScore} onChange={() => {}} readOnly />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Teşekkürler! {csatScore}/5 yıldız verdiniz.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                    Bu destek deneyiminizi nasıl buldunuz?
                  </p>
                  <StarRating value={csatScore} onChange={setCsatScore} />
                  <textarea
                    placeholder="İsteğe bağlı yorum ekleyin..."
                    value={csatComment}
                    onChange={e => setCsatComment(e.target.value)}
                    className="input-field"
                    rows={2}
                    style={{ resize: 'none', fontSize: '0.875rem' }}
                  />
                  <button
                    onClick={() => csatMutation.mutate()}
                    disabled={csatScore === 0 || csatMutation.isPending}
                    className="btn-primary"
                    style={{ alignSelf: 'flex-start', fontSize: '0.875rem' }}
                  >
                    <CheckCircle size={15} />
                    {csatMutation.isPending ? 'Kaydediliyor...' : 'Değerlendirmeyi Gönder'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <MessageSquare size={16} color="var(--accent)" /> Mesajlar
            </h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px', marginBottom: '16px' }}>
              {isCommentsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : comments?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  <MessageSquare size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                  Henüz mesaj yok.
                </div>
              ) : (
                comments?.map(comment => {
                  const isMine = comment.user.id === me?.id;
                  return (
                    <div key={comment.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', padding: '0 4px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{isMine ? 'Siz' : comment.user.full_name}</span>
                        {comment.is_internal && (
                          <span style={{ fontSize: '0.65rem', color: '#92400e', background: 'rgba(245,158,11,0.15)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>🔒 İç Yazışma</span>
                        )}
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {new Date(comment.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{
                        padding: '10px 14px', maxWidth: '80%', borderRadius: '14px',
                        borderBottomRightRadius: isMine ? '4px' : '14px',
                        borderBottomLeftRadius: isMine ? '14px' : '4px',
                        background: comment.is_internal
                          ? 'rgba(245,158,11,0.1)'
                          : isMine
                            ? 'var(--accent)'
                            : 'var(--bg-muted)',
                        border: comment.is_internal ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent',
                        color: isMine && !comment.is_internal ? 'white' : 'var(--text-primary)',
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                      }}>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{comment.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSendComment} style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
              {showCannedPicker && (
                <CannedResponsePicker
                  onSelect={content => setCommentText(prev => prev + (prev ? '\n' : '') + content)}
                  onClose={() => setShowCannedPicker(false)}
                />
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                {isSupportOrAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowCannedPicker(v => !v)}
                    className="btn-ghost"
                    title="Hazır Cevap Seç"
                    style={{ padding: '8px 10px', flexShrink: 0 }}
                  >
                    <BookOpen size={15} />
                  </button>
                )}
                <input
                  type="text"
                  placeholder={ticket.status === 'CLOSED' ? 'Bu bilet kapatıldı.' : 'Mesajınızı yazın...'}
                  className="input-field"
                  style={{ flex: 1 }}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  disabled={addCommentMutation.isPending || ticket.status === 'CLOSED'}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || addCommentMutation.isPending || ticket.status === 'CLOSED'}
                  className="btn-primary"
                  style={{ padding: '8px 14px', flexShrink: 0 }}
                >
                  <Send size={15} />
                </button>
              </div>
              {isSupportOrAdmin && ticket.status !== 'CLOSED' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '2px' }}>
                  <input id="is_internal" type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} style={{ cursor: 'pointer' }} />
                  <label htmlFor="is_internal" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    🔒 Sadece Destek Ekibi Görsün (İç Yazışma)
                  </label>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right: Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Ticket Management (Support/Admin) */}
          {isSupportOrAdmin && (
            <div className="card" style={{ padding: '20px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={13} /> Bilet Yönetimi
              </h3>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Durumu Değiştir</label>
              <select
                value={ticket.status}
                onChange={handleStatusChange}
                disabled={updateStatusMutation.isPending}
                className="input-field"
                style={{ width: '100%' }}
              >
                <option value="OPEN">Açık</option>
                <option value="ASSIGNED">Atandı</option>
                <option value="IN_PROGRESS">İşlemde</option>
                <option value="WAITING_FOR_USER">Kullanıcı Bekleniyor</option>
                <option value="RESOLVED">Çözüldü</option>
                <option value="CLOSED">Kapatıldı</option>
              </select>
              {me?.role === 'ADMIN' && (
                <button onClick={handleDeleteTicket} disabled={deleteTicketMutation.isPending}
                  style={{ marginTop: '12px', width: '100%', padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#dc2626', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 }}>
                  Bileti Kalıcı Sil
                </button>
              )}
            </div>
          )}

          {/* Ticket Info */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
              Talep Bilgileri
            </h3>
            <dl style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Departman', value: ticket.department.name },
                { label: 'Kategori', value: ticket.category.name },
                {
                  label: 'Öncelik', value:
                    ticket.priority === 'CRITICAL' ? '🔴 Kritik' :
                      ticket.priority === 'HIGH' ? '🟠 Yüksek' :
                        ticket.priority === 'MEDIUM' ? '🟡 Orta' : '🟢 Düşük'
                },
              ].map(item => (
                <div key={item.label}>
                  <dt style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</dt>
                  <dd style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>{item.value}</dd>
                </div>
              ))}
              <div>
                <dt style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> Açılış Tarihi
                </dt>
                <dd style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
                  {new Date(ticket.created_at).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </dd>
              </div>
              {ticket.due_at && (
                <div>
                  <dt style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Timer size={12} /> SLA Bitiş
                  </dt>
                  <dd style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
                    {new Date(ticket.due_at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </dd>
                </div>
              )}
              {ticket.csat_score !== null && (
                <div>
                  <dt style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={12} /> Memnuniyet
                  </dt>
                  <dd style={{ fontSize: '0.875rem', color: '#f59e0b', fontWeight: 700, marginTop: '2px' }}>
                    {'⭐'.repeat(ticket.csat_score)} ({ticket.csat_score}/5)
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};
