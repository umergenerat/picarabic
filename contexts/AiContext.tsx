
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

interface AiContextType {
    apiKey: string | null;
    getApiKey: () => Promise<string>;
    setApiKey: (key: string) => void;
    clearApiKey: () => void;
    isModalOpen: boolean;
    closeModal: () => void;
}

const AiContext = createContext<AiContextType | undefined>(undefined);

export const AiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [apiKey, _setApiKey] = useState<string | null>(localStorage.getItem('VITE_GEMINI_API_KEY'));
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Resolve/Reject queue for pending API key requests
    const pendingRequests = useRef<{ resolve: (value: string) => void, reject: (reason?: any) => void }[]>([]);

    const setApiKey = useCallback((key: string) => {
        localStorage.setItem('VITE_GEMINI_API_KEY', key);
        _setApiKey(key);
        setIsModalOpen(false);
        // Resolve all pending requests
        pendingRequests.current.forEach(({ resolve }) => resolve(key));
        pendingRequests.current = [];
    }, []);

    const clearApiKey = useCallback(() => {
        localStorage.removeItem('VITE_GEMINI_API_KEY');
        _setApiKey(null);
    }, []);

    const getApiKey = useCallback((): Promise<string> => {
        if (apiKey) return Promise.resolve(apiKey);

        // If no key, show modal and return a promise
        return new Promise((resolve, reject) => {
            pendingRequests.current.push({ resolve, reject });
            if (!isModalOpen) {
                setIsModalOpen(true);
            }
        });
    }, [apiKey, isModalOpen]);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        // Reject all pending requests as the user cancelled
        pendingRequests.current.forEach(({ reject }) => reject(new Error('User cancelled API key entry')));
        pendingRequests.current = [];
    }, []);

    return (
        <AiContext.Provider value={{ apiKey, getApiKey, setApiKey, clearApiKey, isModalOpen, closeModal }}>
            {children}
        </AiContext.Provider>
    );
};

export const useAi = () => {
    const context = useContext(AiContext);
    if (context === undefined) {
        throw new Error('useAi must be used within an AiProvider');
    }
    return context;
};
