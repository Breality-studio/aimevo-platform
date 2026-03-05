'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { GlobalLoader } from '@/components/ui/GlobalLoader';

type LoadingContextType = {
    isLoading: boolean;
    setLoading: (loading: boolean, message?: string) => void;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('Chargement en cours...');

    const setLoading = (loading: boolean, message?: string) => {
        setIsLoading(loading);
        if (message) setLoadingMessage(message);
    };

    return (
        <LoadingContext.Provider value={{ isLoading, setLoading }}>
            {children}
            {isLoading && <GlobalLoader message={loadingMessage} />}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading doit être utilisé à l’intérieur de LoadingProvider');
    }
    return context;
}