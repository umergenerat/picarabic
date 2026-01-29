
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { generateQuiz as aiGenerateQuiz, AUTH_ERROR_MESSAGE, QUOTA_ERROR_MESSAGE } from '../services/geminiService';
import { Question } from '../types';
import { useI18n } from './I18nContext';

interface AiContextType {
    apiKey: string | null;
    getApiKey: () => Promise<string>;
    setApiKey: (key: string) => void;
    clearApiKey: () => void;
    handleAiError: (error: any) => Promise<boolean>;
    isModalOpen: boolean;
    closeModal: () => void;
    openModal: () => void;
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
    const { t } = useI18n();

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

    const openModal = useCallback(() => setIsModalOpen(true), []);

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

    const translateAiError = useCallback((err: any): string => {
        if (err.message === AUTH_ERROR_MESSAGE) return t('chat.apiKeyInvalid');
        if (err.message === QUOTA_ERROR_MESSAGE) return t('chat.quotaExceeded');
        return err.message;
    }, [t]);

    const handleAiError = useCallback(async (err: any): Promise<boolean> => {
        if (err.message === AUTH_ERROR_MESSAGE) {
            clearApiKey();
            setIsModalOpen(true);
            return true;
        }
        return false;
    }, [clearApiKey]);

    const generateQuiz = useCallback(async (context: any): Promise<Question[]> => {
        setIsLoading(true);
        setError(null);

        // Prepare context object to string
        let contextStr = "";
        if (typeof context === 'string') {
            contextStr = context;
        } else if (context && typeof context === 'object') {
            if (context.type === 'general') {
                contextStr = "اختبار عام وشامل لمستوى متدربي التكنولوجيا التطبيقية في مهارات التواصل باللغة العربية";
            } else if (context.type === 'text') {
                contextStr = `اختبار بناء على نص تعليمي: ${context.textTitle || ''}\nالأهداف: ${(context.objectives || []).join(', ')}`;
            } else if (context.type === 'skill') {
                contextStr = `اختبار لمهارة: ${context.skillTitle || ''}\nالوصف: ${context.description || ''}`;
            } else {
                contextStr = JSON.stringify(context);
            }
        }

        const executeGeneration = async (key: string) => {
            const questions = await aiGenerateQuiz(contextStr, key);
            return questions.map((q: any, idx: number) => ({
                id: `q-${Date.now()}-${idx}`,
                text: { ar: q.question, fr: q.question },
                type: 'فهم' as any,
                options: q.options.map((opt: string, optIdx: number) => ({
                    id: `opt-${optIdx}`,
                    text: { ar: opt, fr: opt }
                })),
                correctAnswerId: `opt-${q.options.indexOf(q.correctAnswer)}`
            }));
        };

        try {
            const currentApiKey = await getApiKey();
            try {
                return await executeGeneration(currentApiKey);
            } catch (innerErr: any) {
                if (innerErr.message === AUTH_ERROR_MESSAGE) {
                    clearApiKey();
                    const newKey = await getApiKey(); // This will re-trigger the modal and wait
                    return await executeGeneration(newKey);
                }
                throw innerErr;
            }
        } catch (err: any) {
            const msg = translateAiError(err);
            setError(msg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [getApiKey, translateAiError, clearApiKey]);

    return (
        <AiContext.Provider value={{
            apiKey, getApiKey, setApiKey, clearApiKey, handleAiError, isModalOpen, closeModal, openModal,
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
