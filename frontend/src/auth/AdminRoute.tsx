import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminMode } from '../context/AdminModeContext';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../api/auth-service';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAdminMode } = useAdminMode();
    const { data: me, isLoading } = useQuery({ queryKey: ['me'], queryFn: getMe, staleTime: Infinity });

    if (isLoading) {
        return (
            <div className="flex justify-center p-20">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    const isAdmin = me?.role === 'ADMIN';

    if (!isAdmin || !isAdminMode) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};
