import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../auth/msal-config';
import { LogIn, AlertCircle } from 'lucide-react';
import { useIsAuthenticated } from '@azure/msal-react';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { instance, inProgress } = useMsal();
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const isMsalAuthenticated = useIsAuthenticated();
    const isLocalAuthenticated = !!localStorage.getItem('token');
    React.useEffect(() => {
        if (isMsalAuthenticated || isLocalAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isMsalAuthenticated, isLocalAuthenticated, navigate]);

    const handleMicrosoftLogin = () => {
        if (inProgress === 'none') {
            instance.loginRedirect(loginRequest).catch(e => {
                console.error("Giriş sırasında hata:", e);
                setError("Microsoft ile giriş başarısız oldu.");
            });
        }
    };

    const handleTestLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return setError('Lütfen bir e-posta adresi girin.');
        
        try {
            setIsLoggingIn(true);
            setError('');
            const { testLogin } = await import('../api/auth-service');
            const res = await testLogin(email);
            localStorage.setItem('token', res.access_token);
            window.location.href = '/dashboard';
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Giriş başarısız.');
        } finally {
            setIsLoggingIn(false);
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

                <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                    <div style={{ padding: '0 10px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>VEYA (Test)</div>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                </div>

                <form onSubmit={handleTestLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input 
                        type="email" 
                        placeholder="E-posta adresi (örn: emreeken486@gmail.com)" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 12px', borderRadius: '8px',
                            background: 'var(--bg-app)', border: '1px solid var(--border)',
                            color: 'var(--text-primary)', outline: 'none'
                        }}
                    />
                    <button 
                        type="submit"
                        disabled={isLoggingIn}
                        style={{ 
                            width: '100%', padding: '10px 16px', borderRadius: '8px', 
                            background: 'var(--accent)', color: 'white', fontWeight: 600,
                            border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
                            opacity: isLoggingIn ? 0.7 : 1
                        }}
                    >
                        {isLoggingIn ? 'Giriş Yapılıyor...' : 'Test Girişi Yap'}
                    </button>
                </form>

            </div>
        </div>
    );
};
