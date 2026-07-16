import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../auth/msal-config';
import { axiosClient } from '../api/axios-client';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useIsAuthenticated } from '@azure/msal-react';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { instance, inProgress } = useMsal();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const isMsalAuthenticated = useIsAuthenticated();
    const isLocalAuthenticated = !!localStorage.getItem('token');

    React.useEffect(() => {
        if (isMsalAuthenticated || isLocalAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isMsalAuthenticated, isLocalAuthenticated, navigate]);

    const handleLocalLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axiosClient.post('/api/v1/auth/login', { email, password });
            if (res.data.access_token) {
                localStorage.setItem('token', res.data.access_token);
                // Dispatch custom event to tell ProtectedRoute to re-check
                window.dispatchEvent(new Event('local-login'));
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Giriş yapılamadı. E-posta veya şifre hatalı olabilir.');
        } finally {
            setLoading(false);
        }
    };

    const handleMicrosoftLogin = () => {
        if (inProgress === 'none') {
            instance.loginRedirect(loginRequest).catch(e => {
                console.error("Giriş sırasında hata:", e);
                setError("Microsoft ile giriş başarısız oldu.");
            });
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', padding: '20px' }}>
            <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <LogIn size={24} color="white" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Kurumsal Helpdesk</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Lütfen hesabınıza giriş yapın</p>
                </div>

                {error && (
                    <div style={{ display: 'flex', gap: '8px', padding: '12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', fontSize: '0.875rem' }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleLocalLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                                required 
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} disabled={loading}>
                        {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                    <span style={{ padding: '0 12px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>VEYA</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                </div>

                <button 
                    onClick={handleMicrosoftLogin}
                    disabled={inProgress !== 'none'}
                    style={{ 
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        padding: '10px 16px', borderRadius: '8px', background: 'var(--bg-card)', 
                        border: '1px solid var(--border)', color: 'var(--text-primary)', fontWeight: 500,
                        cursor: 'pointer', transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
                >
                    <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                        <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                        <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                        <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                    </svg>
                    Microsoft ile Giriş Yap
                </button>

                <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Hesabınız yok mu? <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Kayıt Ol</Link>
                </div>
            </div>
        </div>
    );
};
