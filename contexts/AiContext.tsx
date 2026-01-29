
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { generateQuiz as aiGenerateQuiz } from '../services/geminiService';
import { Question } from '../types';

interface AiContextType {
    apiKey: string | null;
    getApiKey: () => Promise<string>;
    setApiKey: (key: string) => void;
    clearApiKey: () => void;
    isModalOpen: boolean;
    closeModal: () => void;
    generateQuiz: (contextOrObj: any) => Promise<Question[]>;
    isLoading: boolean;
    error: string | null;
}

const AiContext = createContext<AiContextType | undefined>(undefined);

export const AiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [apiKey, _setApiKey] = useState<string | null>(localStorage.getItem('VITE_GEMINI_API_KEY'));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const generateQuiz = useCallback(async (context: any): Promise<Question[]> => {
        setIsLoading(true);
        setError(null);
        try {
            const currentApiKey = await getApiKey();

            // Convert context object to string if needed
            let contextStr = "";
            if (typeof context === 'string') {
                contextStr = context;
            } else if (context && typeof context === 'object') {
                if (context.type === 'general') {
                    contextStr = "اختبار عام وشامل لمستوى متدربي التكنولوجيا التطبيقية في مهارات التواصل باللغة العربية";
                } else if (context.type === 'text') {
                    contextStr = `اختبار بناء على نص تعليمي: ${context.textTitle || ''}`;
                } else if (context.type === 'skill') {
                    contextStr = `اختبار بناء على مهارة: ${context.skillTitle || ''}`;
                } else {
                    contextStr = JSON.stringify(context);
                }
            }

            const questions = await aiGenerateQuiz(contextStr, currentApiKey);
            // Map QuizQuestion (service type) to Question (app type)
            return questions.map((q: any, idx: number) => ({
                id: `q-${Date.now()}-${idx}`,
                text: { ar: q.question, fr: q.question },
                type: 'فهم',
                options: q.options.map((opt: string, optIdx: number) => ({
                    id: `opt-${optIdx}`,
                    text: { ar: opt, fr: opt }
                })),
                correctAnswerId: `opt-${q.options.indexOf(q.correctAnswer)}`
            }));
        } catch (err: any) {
            const msg = err.message || 'Error generating quiz';
            setError(msg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [getApiKey]);

    return (
        <AiContext.Provider value={{
            apiKey, getApiKey, setApiKey, clearApiKey, isModalOpen, closeModal,
            generateQuiz, isLoading, error
        }}>
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
