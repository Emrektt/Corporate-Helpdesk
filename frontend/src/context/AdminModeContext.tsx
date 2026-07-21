/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AdminModeContextType {
    isAdminMode: boolean;
    toggleAdminMode: () => void;
}

const AdminModeContext = createContext<AdminModeContextType>({
    isAdminMode: true,
    toggleAdminMode: () => {},
});

export const AdminModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
        const stored = localStorage.getItem('isAdminMode');
        return stored !== null ? stored === 'true' : true;
    });

    const toggleAdminMode = () => {
        setIsAdminMode(prev => {
            const next = !prev;
            localStorage.setItem('isAdminMode', String(next));
            return next;
        });
    };

    return (
        <AdminModeContext.Provider value={{ isAdminMode, toggleAdminMode }}>
            {children}
        </AdminModeContext.Provider>
    );
};

export const useAdminMode = () => useContext(AdminModeContext);
