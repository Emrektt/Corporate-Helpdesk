import React from 'react';
import { logEvent } from '../api/event-service';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_error: Error): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught Error:", error, errorInfo);
        
        // Log to backend event collector
        logEvent(
            "ERROR", 
            "FRONTEND", 
            error.message, 
            errorInfo.componentStack || undefined
        ).catch(e => console.error("Failed to send error to collector:", e));
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-primary)' }}>
                    <h2>Beklenmeyen Bir Hata Oluştu</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Ekibimiz durumdan haberdar edildi ve konuyla ilgileniyor.</p>
                    <button 
                        onClick={() => window.location.href = '/'}
                        style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        Ana Sayfaya Dön
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
