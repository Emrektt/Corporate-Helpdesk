import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../auth/msal-config';
import { LogIn, AlertCircle } from 'lucide-react';


export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { instance, accounts, inProgress } = useMsal();
    const [error, setError] = useState('');

    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const isLocalAuthenticated = !!localStorage.getItem('token');

    React.useEffect(() => {
        const handleAzureToken = async () => {
            if (accounts.length > 0 && !isLocalAuthenticated && inProgress === 'none') {
                try {
                    setIsLoggingIn(true);
                    let response;
                    try {
                        response = await instance.acquireTokenSilent({
                            ...loginRequest,
                            account: accounts[0]
                        });
                    } catch (silentError) {
                        console.warn("Silent token acquisition failed, falling back to popup", silentError);
                        response = await instance.acquireTokenPopup({
                            ...loginRequest,
                            account: accounts[0]
                        });
                    }
                    
                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
                    const res = await fetch(`${apiUrl}/api/v1/auth/azure`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ access_token: response.accessToken })
                    });
                    
                    if (!res.ok) {
                        const errData = await res.json().catch(() => null);
                        throw new Error(errData?.detail || 'Sunucu ile iletişim hatası');
                    }
                    
                    const data = await res.json();
                    localStorage.setItem('token', data.access_token);
                    navigate('/dashboard', { replace: true });
                } catch (e) {
                    console.error("Azure Token Backend Error:", e);
                    const errorMessage = e instanceof Error ? e.message : String(e);
                    setError("Giriş işlemi başarısız oldu: " + errorMessage);
                    // Hata durumunda MSAL hesabını temizle ki kullanıcı tekrar deneyebilsin
                    sessionStorage.clear();
                } finally {
                    setIsLoggingIn(false);
                }
            } else if (isLocalAuthenticated) {
                navigate('/dashboard', { replace: true });
            }
        };
        
        handleAzureToken();
    }, [accounts, instance, inProgress, isLocalAuthenticated, navigate]);

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

                <button 
                    onClick={handleMicrosoftLogin}
                    disabled={inProgress !== 'none' || isLoggingIn}
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



            </div>
        </div>
    );
};
