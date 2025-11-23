import React, { createContext, useEffect, useContext } from 'react';
import translations from '../i18n/translations';

type Locale = 'ar' | 'fr';

// FIX: Updated I18nContextType to accept an optional replacements object for variable substitution in translations.
interface I18nContextType {
    locale: Locale;
    t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const locale: Locale = 'ar';

    useEffect(() => {
        const root = window.document.documentElement;
        root.lang = locale;
        root.dir = 'rtl';
    }, [locale]);

    // FIX: Updated the `t` function to handle placeholder replacements (e.g., {name}) in translation strings.
    const t = (key: string, replacements?: { [key: string]: string | number }): string => {
        const keys = key.split('.');
        let result: any = translations[locale];
        for (const k of keys) {
            result = result?.[k];
            if (result === undefined) {
                return key;
            }
        }

        if (typeof result === 'string' && replacements) {
            return Object.keys(replacements).reduce((acc, currentKey) => {
                return acc.replace(new RegExp(`{${currentKey}}`, 'g'), String(replacements[currentKey]));
            }, result);
        }

        return result || key;
    };

    return (
        <I18nContext.Provider value={{ locale, t }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = (): I18nContextType => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
};
