import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getDepartments, createTicket, Department } from '../api/ticket-service';
import { searchArticles, Article } from '../api/article-service';
import { Send, AlertCircle, CheckCircle2, Lightbulb, ChevronRight, PlusCircle } from 'lucide-react';
import { getMe } from '../api/auth-service';
import { Link } from 'react-router-dom';
const ticketSchema = z.object({
  department_id: z.string().min(1, 'Lütfen departman seçin'),
  category_id:   z.string().min(1, 'Lütfen kategori seçin'),
  title:         z.string().min(5, 'Başlık en az 5 karakter olmalıdır').max(150),
  description:   z.string().min(10, 'Lütfen detaylı açıklama girin'),
});
type TicketFormData = z.infer<typeof ticketSchema>;

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', fontSize: '0.8125rem', fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: '6px',
};
const ERR_STYLE: React.CSSProperties = {
  fontSize: '0.75rem', color: 'var(--danger)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px',
};

export const CreateTicket: React.FC = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [suggestedArticles, setSuggestedArticles] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });



  const { data: allDepartments, isLoading: isDeptsLoading } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });

  const departments = (me?.role === 'ADMIN' || me?.role === 'SUPPORT_AGENT') ? allDepartments : allDepartments?.filter(d => d.id === me?.department_id);

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
  });

  const selectedDeptId = watch('department_id');
  const selectedDepartment = departments?.find(d => d.id.toString() === selectedDeptId);
  const titleValue = watch('title');

  // Ticket Deflection debounce
  useEffect(() => {
    if (!titleValue || titleValue.length < 3) { setSuggestedArticles([]); return; }
    setIsSearching(true);
    const t = setTimeout(async () => {
      try { setSuggestedArticles(await searchArticles(titleValue)); }
      catch { /* ignore */ }
      finally { setIsSearching(false); }
    }, 500);
    return () => clearTimeout(t);
  }, [titleValue]);

  const mutation = useMutation({
    mutationFn: (data: TicketFormData) => createTicket({
      title: data.title,
      description: data.description,
      category_id: parseInt(data.category_id),
    }),
    onSuccess: () => {
      setIsSuccess(true);
      reset();
      setSuggestedArticles([]);
      setTimeout(() => setIsSuccess(false), 6000);
    },
  });

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }} className="animate-fade-in">

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlusCircle size={18} color="white" />
          </div>
          Yeni Destek Talebi
        </h1>
        <p className="page-subtitle">Sorununuzu veya talebinizi detaylıca açıklayın, ekibimiz en kısa sürede yanıtlayacaktır.</p>
      </div>

      {/* Success Alert */}
      {isSuccess && (
        <div style={{
          display: 'flex', gap: '12px', alignItems: 'flex-start',
          padding: '16px', borderRadius: '12px', marginBottom: '20px',
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          <CheckCircle2 size={20} color="var(--success)" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--success)', marginBottom: '2px' }}>Talebiniz Alındı!</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Destek ekibimiz en kısa sürede sizinle iletişime geçecektir.</div>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="card" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Dept + Category row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={LABEL_STYLE}>İlgili Departman</label>
              <select {...register('department_id')} className="input-field" disabled={isDeptsLoading} style={{ cursor: 'pointer' }}>
                <option value="">Seçiniz...</option>
                {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {errors.department_id && <div style={ERR_STYLE}><AlertCircle size={12}/>{errors.department_id.message}</div>}
            </div>
            <div>
              <label style={LABEL_STYLE}>Talep Kategorisi</label>
              <select {...register('category_id')} className="input-field" disabled={!selectedDeptId} style={{ cursor: 'pointer' }}>
                <option value="">Seçiniz...</option>
                {selectedDepartment?.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.category_id && <div style={ERR_STYLE}><AlertCircle size={12}/>{errors.category_id.message}</div>}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={LABEL_STYLE}>Talep Başlığı</label>
            <input
              {...register('title')}
              className="input-field"
              placeholder="Örn: Outlook e-posta gönderemiyorum"
              style={errors.title ? { borderColor: 'var(--danger)' } : {}}
            />
            {errors.title && <div style={ERR_STYLE}><AlertCircle size={12}/>{errors.title.message}</div>}
          </div>

          {/* Smart Suggestion (Ticket Deflection) */}
          {(suggestedArticles.length > 0 || isSearching) && (
            <div style={{
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '12px',
              padding: '16px',
              animation: 'slideInUp 0.3s ease-out',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Lightbulb size={17} color="var(--warning)" />
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  Bu makaleler sorununuzu çözebilir mi?
                </span>
                {isSearching && <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite', marginLeft: '4px' }} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {suggestedArticles.map(a => (
                  <Link key={a.id} to="/knowledge-base" target="_blank" style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateX(2px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
                    >
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{a.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{a.department.name}</div>
                      </div>
                      <ChevronRight size={16} color="var(--text-muted)" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label style={LABEL_STYLE}>Detaylı Açıklama</label>
            <textarea
              {...register('description')}
              rows={6}
              className="input-field"
              placeholder="Lütfen sorununuzu, aldığınız hataları ve denediğiniz çözüm yollarını yazın..."
              style={{ resize: 'vertical', ...(errors.description ? { borderColor: 'var(--danger)' } : {}) }}
            />
            {errors.description && <div style={ERR_STYLE}><AlertCircle size={12}/>{errors.description.message}</div>}
          </div>

          {/* Error */}
          {mutation.isError && (
            <div style={{ display: 'flex', gap: '8px', padding: '12px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', fontSize: '0.875rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              Bir hata oluştu. Lütfen tekrar deneyin.
            </div>
          )}

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
              {mutation.isPending
                ? <><div style={{ width: '15px', height: '15px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} /> Gönderiliyor...</>
                : <><Send size={15} /> Talebi Gönder</>
              }
            </button>
          </div>

        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
