
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

    // Resolve queue for pending API key requests
    const resolvers = useRef<((value: string) => void)[]>([]);

    const setApiKey = useCallback((key: string) => {
        localStorage.setItem('VITE_GEMINI_API_KEY', key);
        _setApiKey(key);
        setIsModalOpen(false);
        // Resolve all pending requests
        resolvers.current.forEach(resolve => resolve(key));
        resolvers.current = [];
    }, []);

    const clearApiKey = useCallback(() => {
        localStorage.removeItem('VITE_GEMINI_API_KEY');
        _setApiKey(null);
    }, []);

    const getApiKey = useCallback((): Promise<string> => {
        if (apiKey) return Promise.resolve(apiKey);

        // If no key, show modal and return a promise
        return new Promise((resolve) => {
            resolvers.current.push(resolve);
            if (!isModalOpen) {
                setIsModalOpen(true);
            }
        });
    }, [apiKey, isModalOpen]);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        // Optionally reject pending requests or just leave them hanging/reset
        resolvers.current = [];
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
