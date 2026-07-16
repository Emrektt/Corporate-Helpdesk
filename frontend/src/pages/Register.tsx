import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { axiosClient } from '../api/axios-client';
import { Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useIsAuthenticated } from '@azure/msal-react';

export const Register: React.FC = () => {
    const navigate = useNavigate();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const isMsalAuthenticated = useIsAuthenticated();
    const isLocalAuthenticated = !!localStorage.getItem('token');

    React.useEffect(() => {
        if (isMsalAuthenticated || isLocalAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isMsalAuthenticated, isLocalAuthenticated, navigate]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await axiosClient.post('/api/v1/auth/register', { 
                email, 
                full_name: fullName, 
                password 
            });
            setSuccess('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { detail?: string } } };
            setError(axiosErr.response?.data?.detail || 'Kayıt olurken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', padding: '20px' }}>
            <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <User size={24} color="white" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Hesap Oluştur</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Helpdesk sistemine kayıt olun</p>
                </div>

                {error && (
                    <div style={{ display: 'flex', gap: '8px', padding: '12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', fontSize: '0.875rem' }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{ display: 'flex', gap: '8px', padding: '12px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--success)', fontSize: '0.875rem' }}>
                        <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        {success}
                    </div>
                )}

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Ad Soyad</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                <User size={18} />
                            </div>
                            <input 
                                type="text" 
                                className="input-field" 
                                style={{ paddingLeft: '40px' }} 
                                placeholder="Ahmet Yılmaz"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required 
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>E-posta Adresi</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                <Mail size={18} />
                            </div>
                            <input 
                                type="email" 
                                className="input-field" 
                                style={{ paddingLeft: '40px' }} 
                                placeholder="ornek@sirket.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Şifre</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                <Lock size={18} />
                            </div>
                            <input 
                                type="password" 
                                className="input-field" 
                                style={{ paddingLeft: '40px' }} 
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                required 
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} disabled={loading}>
                        {loading ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Zaten hesabınız var mı? <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Giriş Yap</Link>
                </div>
            </div>
        </div>
    );
};
