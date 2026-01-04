
import React from 'react';
import { AcademicCapIcon, ArrowRightOnRectangleIcon, Bars3Icon, SunIcon, MoonIcon } from '../common/Icons';
import { User } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

interface HeaderProps {
    user: User | null;
    onLogin: () => void;
    onLogout: () => void;
    logoSrc: string | null;
    onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogin, onLogout, logoSrc, onToggleSidebar }) => {
    const { theme, toggleTheme } = useTheme();
    const { t } = useI18n();

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-white/20 dark:border-slate-800/50 shadow-sm transition-all duration-300">
            <div className="flex items-center gap-4">
                <button
                    onClick={onToggleSidebar}
                    className="md:hidden p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    aria-label="Toggle menu"
                >
                    <Bars3Icon className="h-7 w-7" />
                </button>

                <div className="flex items-center gap-3 md:hidden">
                    {logoSrc ? (
                        <img src={logoSrc} alt="شعار المنصة" className="h-8 object-contain" />
                    ) : (
                        <AcademicCapIcon className="h-8 w-8 text-primary-500" />
                    )}
                    <h1 className="text-lg font-bold text-slate-800 dark:text-white truncate max-w-[150px]">{t('global.platformTitle')}</h1>
                </div>

                <div className="hidden md:block">
                    {/* Placeholder for future breadcrumbs or page title if needed */}
                </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
                <button
                    onClick={toggleTheme}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-full transition-all duration-300 focus:outline-none transform hover:rotate-12"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
                </button>

                {user ? (
                    <div className="flex items-center gap-3 pl-1">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{user.displayName}</span>
                            <span className="text-[10px] text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                {user.email === 'admin@picarabic.com' || user.email === 'aitloutouaom@gmail.com' ? 'مدير النظام' : 'متدرب'}
                            </span>
                        </div>
                        <div className="relative group cursor-pointer">
                            <div className="ring-2 ring-white dark:ring-slate-800 ring-offset-2 ring-offset-primary-500 rounded-full transition-all duration-300 group-hover:ring-offset-4">
                                <Avatar name={user.displayName} src={user.photoURL} size="md" />
                            </div>

                            {/* Dropdown Menu */}
                            <div className="absolute top-full right-0 mt-3 w-48 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                                <button onClick={onLogout} className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                                    {t('global.logout')}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Button
                        onClick={onLogin}
                        variant="primary"
                        size="md"
                        className="shadow-lg shadow-primary-500/20"
                    >
                        <div className="flex items-center gap-2">
                            <ArrowRightOnRectangleIcon className="h-5 w-5" />
                            <span>{t('global.login')}</span>
                        </div>
                    </Button>
                )}
            </div>
        </header>
    );
};

export default Header;
