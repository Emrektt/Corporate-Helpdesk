import React from "react";
import { useIsAuthenticated, useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from "./msal-config";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const isAuthenticated = useIsAuthenticated();
    const { instance, inProgress } = useMsal();

    const handleLogin = () => {
        if (inProgress === InteractionStatus.None && !isAuthenticated) {
            // Popup yerine Redirect kullanıyoruz — daha güvenilir
            instance.loginRedirect(loginRequest).catch(e => {
                console.error("Giriş sırasında hata:", e);
            });
        }
    };

    return (
        <>
            <AuthenticatedTemplate>
                {children}
            </AuthenticatedTemplate>

            <UnauthenticatedTemplate>
                <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
                    <div className="text-center bg-white p-10 rounded-2xl shadow-md border border-slate-200 max-w-md w-full mx-4">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Giriş Gerekli</h2>
                        <p className="text-slate-500 mb-6 text-sm">
                            Bu sayfayı görüntülemek için Microsoft kurumsal hesabınızla giriş yapmanız gerekmektedir.
                        </p>
                        <button
                            onClick={handleLogin}
                            disabled={inProgress !== InteractionStatus.None}
                            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {inProgress !== InteractionStatus.None ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                                        <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                                        <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                                        <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                                    </svg>
                                    Microsoft ile Giriş Yap
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </UnauthenticatedTemplate>
        </>
    );
};
