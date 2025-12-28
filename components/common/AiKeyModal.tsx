
import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import { XMarkIcon, SparklesIcon, KeyIcon, InformationCircleIcon } from './Icons';
import { useI18n } from '../../contexts/I18nContext';
import { useAi } from '../../contexts/AiContext';

const AiKeyModal: React.FC = () => {
    const { t, locale } = useI18n();
    const { isModalOpen, setApiKey, closeModal, apiKey } = useAi();
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (apiKey) {
            setInputValue(apiKey);
        }
    }, [apiKey]);

    if (!isModalOpen) return null;

    const handleSave = () => {
        if (!inputValue.trim()) {
            setError(t('chat.apiKeyRequired') || 'يرجى إدخال مفتاح API');
            return;
        }
        if (!inputValue.startsWith('AIza')) {
            setError(t('chat.apiKeyInvalid') || 'مفتاح API غير صالح. يجب أن يبدأ بـ AIza');
            return;
        }
        setApiKey(inputValue.trim());
        setError('');
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 animate-in fade-in duration-300">
            <Card className="w-full max-w-md shadow-2xl border-primary-100 dark:border-primary-900/30 overflow-hidden transform animate-in zoom-in-95 duration-300">
                <div className="relative h-2 bg-gradient-to-r from-primary-500 via-purple-500 to-primary-500 animate-gradient-x"></div>

                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                            <SparklesIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            {locale === 'ar' ? 'تفعيل خدمات الذكاء الاصطناعي' : 'Activate AI Services'}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={closeModal}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                            {locale === 'ar'
                                ? 'لأداء هذه الخدمة، نحتاج إلى مفتاح API الخاص بك لـ Gemini. سيتم حفظ المفتاح محلياً في متصفحك فقط.'
                                : 'To perform this service, we need your Gemini API key. The key will be saved locally in your browser only.'}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ms-1">
                                {locale === 'ar' ? 'مفتاح API الخاص بك' : 'Your API Key'}
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                                    <KeyIcon className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={inputValue}
                                    onChange={(e) => {
                                        setInputValue(e.target.value);
                                        setError('');
                                    }}
                                    className={`w-full ps-10 pe-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-2 rounded-xl transition-all outline-none text-slate-900 dark:text-white font-mono text-sm ${error
                                            ? 'border-red-500 ring-4 ring-red-500/10'
                                            : 'border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10'
                                        }`}
                                    placeholder="AIzaSyB..."
                                />
                            </div>
                            {error && (
                                <p className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1 animate-in slide-in-from-top-1">
                                    <InformationCircleIcon className="h-4 w-4" />
                                    {error}
                                </p>
                            )}
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20 flex gap-3">
                            <InformationCircleIcon className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                                <p className="font-bold mb-1">
                                    {locale === 'ar' ? 'كيف تحصل على مفتاح؟' : 'How to get a key?'}
                                </p>
                                <a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline hover:text-amber-600 dark:hover:text-amber-100 transition-colors"
                                >
                                    {locale === 'ar' ? 'اضغط هنا للحصول على مفتاح Gemini مجاني من Google AI Studio' : 'Click here to get a free Gemini API key from Google AI Studio'}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 flex justify-end items-center gap-3 border-t border-slate-100 dark:border-slate-800/50">
                    <Button variant="secondary" onClick={closeModal} className="!px-6">
                        {t('global.cancel') || 'إلغاء'}
                    </Button>
                    <Button onClick={handleSave} className="!px-8 shadow-lg shadow-primary-500/20">
                        {locale === 'ar' ? 'حفظ وتفعيل' : 'Save and Activate'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default AiKeyModal;
