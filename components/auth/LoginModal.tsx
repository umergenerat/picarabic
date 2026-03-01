import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { XMarkIcon, EnvelopeIcon, LockClosedIcon } from '../common/Icons';
import { useI18n } from '../../contexts/I18nContext';
import { resetPassword, initializeAdmin, ADMIN_EMAIL } from '../../services/authService';

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
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [resetError, setResetError] = useState('');
    const [showAdminInit, setShowAdminInit] = useState(false);
    const [adminInitPass, setAdminInitPass] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onLoginAttempt(email, password);
        } finally {
            // Note: If login is successful, the modal will be closed by the parent component
            // We only set isLoading to false if an error occurred or if it's still open
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetStatus('loading');
        setResetError('');
        try {
            await resetPassword(resetEmail);
            setResetStatus('success');
        } catch (err: any) {
            setResetStatus('error');
            setResetError(t(err.message) || t('resetPassword.error'));
        }
    };

    const handleBackToLogin = () => {
        setShowForgotPassword(false);
        setShowAdminInit(false);
        setResetStatus('idle');
        setResetError('');
        setResetEmail('');
    };

    const handleAdminInit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await initializeAdmin(adminInitPass);
            alert("تمت تهيئة حساب المدير بنجاح! يمكنك الآن تسجيل الدخول.");
            setShowAdminInit(false);
        } catch (err: any) {
            alert("فشل التهيئة: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 overflow-y-auto">
            {/* Dynamic Background Overlay */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg mb-12 animate-in fade-in zoom-in-95 duration-500">
                {/* Decorative Elements */}
                <div className="absolute -top-12 -left-12 w-48 h-48 premium-gradient rounded-full blur-3xl opacity-20 animate-pulse-soft" />
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-primary-500 rounded-full blur-3xl opacity-20 animate-float" />

                <Card className="overflow-hidden glass-effect shadow-2xl border-white/20 dark:border-white/5 rounded-3xl">

                    <div className="relative p-8 md:p-10">
                        {/* Header Section */}
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                                    {showForgotPassword ? t('login.resetPassword') : showAdminInit ? 'تهيئة النظام' : t('login.title')}
                                </h3>
                                <div className="h-1.5 w-12 premium-gradient rounded-full" />
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-all"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {showForgotPassword ? (
                            <form onSubmit={handleResetPassword} className="space-y-6">
                                {resetStatus === 'success' ? (
                                    <div className="text-center py-8 animate-in zoom-in-95">
                                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
                                            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <p className="text-xl font-bold text-slate-900 dark:text-white mb-2">تم إرسال الطلب بنجاح</p>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                            تم إرسال إشعار إلى مدير المنصة على بريده الإلكتروني.<br />
                                            <span className="font-bold text-primary-600 dark:text-primary-400">{ADMIN_EMAIL}</span><br />
                                            سيتواصل معك في أقرب وقت لإعادة تعيين كلمة المرور.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{t('login.resetPasswordDesc')}</p>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 px-1">{t('login.email')}</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 end-0 flex items-center pe-4 pointer-events-none">
                                                    <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <input
                                                    type="email"
                                                    value={resetEmail}
                                                    onChange={(e) => setResetEmail(e.target.value)}
                                                    required
                                                    className="input-premium"
                                                    placeholder="name@example.com"
                                                />
                                            </div>
                                            {resetError && <p className="text-xs text-red-500 font-bold px-1">{resetError}</p>}
                                        </div>
                                    </>
                                )}
                                <div className="pt-4 flex flex-col gap-3">
                                    {resetStatus !== 'success' && (
                                        <Button type="submit" isLoading={resetStatus === 'loading'} className="w-full py-4 rounded-2xl shadow-lg premium-gradient border-none transform active:scale-95 transition-all">
                                            {t('login.sendResetLink')}
                                        </Button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleBackToLogin}
                                        className="text-sm font-bold text-slate-500 hover:text-primary-600 py-2 transition-colors"
                                    >
                                        {t('login.backToLogin')}
                                    </button>
                                </div>
                            </form>
                        ) : showAdminInit ? (
                            <form onSubmit={handleAdminInit} className="space-y-6">
                                <p className="text-slate-600 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm leading-relaxed border border-blue-100 dark:border-blue-800">
                                    سيتم إعداد حساب المسؤول للبريد: <span className="font-extrabold text-blue-600 dark:text-blue-400">{ADMIN_EMAIL}</span>
                                </p>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 px-1">كلمة المرور الجديدة</label>
                                    <input
                                        type="password"
                                        value={adminInitPass}
                                        onChange={(e) => setAdminInitPass(e.target.value)}
                                        className="input-premium"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <div className="pt-4 flex flex-col gap-3">
                                    <Button type="submit" isLoading={isLoading} className="w-full py-4 rounded-2xl shadow-lg premium-gradient border-none transform active:scale-95 transition-all">
                                        تهيئة الحساب الآن
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={handleBackToLogin}
                                        className="text-sm font-bold text-slate-500 hover:text-primary-600 py-2 transition-colors"
                                    >
                                        {t('login.backToLogin')}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Account Type Switcher */}
                                <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex border border-slate-200 dark:border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => setAccountType('trainee')}
                                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all duration-300 ${accountType === 'trainee'
                                            ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-md'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        {t('login.trainee')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAccountType('admin')}
                                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all duration-300 ${accountType === 'admin'
                                            ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-md'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        {t('login.admin')}
                                    </button>
                                </div>

                                {/* Inputs */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 px-1">{t('login.email')}</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 end-0 flex items-center pe-4 pointer-events-none transition-colors group-focus-within:text-primary-500">
                                                <EnvelopeIcon className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500" />
                                            </div>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="input-premium"
                                                placeholder="you@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 px-1">{t('login.password')}</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 end-0 flex items-center pe-4 pointer-events-none transition-colors group-focus-within:text-primary-500">
                                                <LockClosedIcon className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500" />
                                            </div>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="input-premium"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl animate-in fade-in slide-in-from-right-4">
                                        <p className="text-xs font-bold text-red-600 dark:text-red-400 leading-relaxed">{error}</p>
                                    </div>
                                )}

                                <div className="flex flex-col gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 tracking-tight"
                                    >
                                        {t('login.forgotPassword')}
                                    </button>

                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={onClose}
                                            className="flex-1 py-4 rounded-2xl border-slate-200 dark:border-slate-700 font-bold"
                                        >
                                            {t('global.cancel')}
                                        </Button>
                                        <Button
                                            type="submit"
                                            isLoading={isLoading}
                                            className="flex-[2] py-4 rounded-2xl shadow-xl premium-gradient border-none font-black text-lg transform active:scale-95 transition-all"
                                        >
                                            {t('global.login')}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default LoginModal;