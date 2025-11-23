import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { XMarkIcon, EnvelopeIcon, LockClosedIcon } from '../common/Icons';
import { useI18n } from '../../contexts/I18nContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginAttempt: (email: string, pass: string) => Promise<void>;
    error: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginAttempt, error }) => {
    const { t } = useI18n();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [accountType, setAccountType] = useState<'trainee' | 'admin'>('trainee');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await onLoginAttempt(email, password);
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <Card className="w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('login.title')}</h3>
                            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                {t('login.accountType')}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAccountType('trainee')}
                                    className={`w-full p-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                                        accountType === 'trainee'
                                            ? 'bg-primary-600 text-white shadow-sm ring-2 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-800 ring-primary-500'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    {t('login.trainee')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAccountType('admin')}
                                    className={`w-full p-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                                        accountType === 'admin'
                                            ? 'bg-primary-600 text-white shadow-sm ring-2 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-800 ring-primary-500'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    {t('login.admin')}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('login.email')}</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3">
                                        <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="block w-full rounded-md border-slate-300 ps-3 pe-10 focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('login.password')}</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3">
                                        <LockClosedIcon className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="password"
                                        name="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="block w-full rounded-md border-slate-300 ps-3 pe-10 focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onClose}>{t('global.cancel')}</Button>
                        <Button type="submit" isLoading={isLoading}>{t('global.login')}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default LoginModal;