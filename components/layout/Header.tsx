import React from 'react';
import { AcademicCapIcon, ArrowRightOnRectangleIcon, Bars3Icon, SunIcon, MoonIcon } from '../common/Icons';
import { User } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';

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
        <header className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggleSidebar}
                    className="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none"
                    aria-label="Toggle menu"
                >
                    <Bars3Icon className="h-6 w-6" />
                </button>
                {logoSrc ? (
                    <img src={logoSrc} alt="شعار المنصة" className="h-10 object-contain" />
                ) : (
                    <AcademicCapIcon className="h-8 w-8 text-primary-500" />
                )}
                <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">{t('global.platformTitle')}</h1>
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTheme}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
                </button>
                
                {user ? (
                    <div className="flex items-center">
                        <span className="text-sm font-medium hidden sm:block">{user.displayName}</span>
                        <img className="h-10 w-10 rounded-full object-cover mx-3" src={user.photoURL} alt="User Avatar" />
                        <button onClick={onLogout} className="text-sm text-slate-600 dark:text-slate-300 hover:text-primary-500 dark:hover:text-primary-400">
                            {t('global.logout')}
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={onLogin} 
                        className="flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                        {t('global.login')}
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;