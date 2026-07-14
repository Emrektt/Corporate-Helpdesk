import React from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { loginRequest } from "./msal-config";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const isAuthenticated = useIsAuthenticated();
    const { instance } = useMsal();

    // Kullanıcı giriş yapmamışsa, MSAL popup üzerinden giriş yapılmasını tetikliyoruz
    React.useEffect(() => {
        if (!isAuthenticated) {
            instance.loginPopup(loginRequest).catch(e => {
                console.error("Giriş sırasında hata oluştu: ", e);
            });
        }
    }, [isAuthenticated, instance]);

    // Kullanıcı doğrulanmışsa alt component'leri göster
    if (isAuthenticated) {
        return <>{children}</>;
    }

    // Doğrulanana kadar boş veya yükleniyor ekranı dönebilir
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Giriş Yapılıyor...</h2>
                <p className="text-slate-600">Lütfen Microsoft hesabınızla oturum açın.</p>
            </div>
        </div>
    );
};
