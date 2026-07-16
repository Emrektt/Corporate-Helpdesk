import React, { useState, useEffect } from "react";
import { useIsAuthenticated } from "@azure/msal-react";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const isMsalAuthenticated = useIsAuthenticated();
    const [isLocalAuthenticated, setIsLocalAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
    const location = useLocation();

    // LocalStorage değişikliklerini dinlemek için (aynı sekmede login olduktan sonra render tetiklensin diye)
    useEffect(() => {
        const checkToken = () => {
            setIsLocalAuthenticated(!!localStorage.getItem('token'));
        };
        
        window.addEventListener('storage', checkToken);
        // Custom event for same-window updates
        window.addEventListener('local-login', checkToken);
        
        return () => {
            window.removeEventListener('storage', checkToken);
            window.removeEventListener('local-login', checkToken);
        };
    }, []);

    const isAuthenticated = isMsalAuthenticated || isLocalAuthenticated;

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
