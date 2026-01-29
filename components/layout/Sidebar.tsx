
import React from 'react';
import { AcademicCapIcon, PowerIcon } from '../common/Icons';
import { Page, NavItem } from '../../types';
import { useI18n } from '../../contexts/I18nContext';

interface SidebarProps {
    activePage: Page;
    setActivePage: (page: Page) => void;
    isAdmin: boolean;
    logoSrc: string | null;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    navItems: Omit<NavItem, 'label'>[];
    onExit: () => void;
}

const NavLink: React.FC<{
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => {
    // Premium NavLink Styles
    const baseClasses = 'flex items-center px-4 py-3.5 mx-2 text-sm font-medium rounded-xl transition-all duration-300 group relative overflow-hidden mb-1';
    const activeClasses = 'bg-gradient-to-r from-primary-500/15 via-primary-500/10 to-transparent text-primary-700 dark:text-primary-400 font-bold shadow-sm ring-1 ring-primary-500/20';
    const inactiveClasses = 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200';

    return (
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
            aria-current={isActive ? 'page' : undefined}
        >
            {isActive && (
                <span className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-primary-400 to-primary-600 rounded-r-full" aria-hidden="true" />
            )}
            <div className="relative">
                <Icon className={`h-5 w-5 mx-3 transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-sm text-primary-600' : 'group-hover:scale-110 group-hover:rotate-3'}`} aria-hidden="true" />
                {isActive && <div className="absolute -inset-1 bg-primary-400/20 blur-md rounded-full animate-pulse-soft" />}
            </div>
            <span className={`truncate ${isActive ? 'translate-x-0.5 transition-transform' : ''}`}>{label}</span>
        </a>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isAdmin, logoSrc, isOpen, setIsOpen, navItems, onExit }) => {
    const { t, locale } = useI18n();
    const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

    const handleLinkClick = (page: Page) => {
        setActivePage(page);
        setIsOpen(false);
    };

    const sidebarDirectionClasses = locale === 'ar'
        ? `right-0 border-l ${isOpen ? 'translate-x-0' : 'translate-x-full'}`
        : `left-0 border-r ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-500 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
            ></div>

            <aside
                className={`fixed md:sticky top-0 inset-y-0 z-50 w-72 h-[100dvh] md:h-[calc(100vh-2rem)] md:m-4 flex-shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:translate-x-0 shadow-2xl md:shadow-lg md:rounded-3xl ${sidebarDirectionClasses}`}
                aria-label="Sidebar"
                style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
            >
                {/* Logo Area */}
                <div className="flex items-center justify-center h-20 border-b border-slate-100 dark:border-slate-800 mb-2">
                    {logoSrc ? (
                        <img src={logoSrc} alt={t('global.platformTitle')} className="h-14 object-contain animate-fade-in" />
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="bg-primary-500/10 p-2 rounded-xl">
                                <AcademicCapIcon className="h-8 w-8 text-primary-600" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-400">
                                ISTA TATA
                            </span>
                        </div>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 space-y-1 px-2 overflow-y-auto py-4">
                    {visibleNavItems.map(item => (
                        <NavLink
                            key={item.id}
                            icon={item.icon}
                            label={t(item.labelKey)}
                            isActive={activePage === item.id}
                            onClick={() => handleLinkClick(item.id as Page)}
                        />
                    ))}
                </nav>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 mt-auto">
                    <button
                        onClick={onExit}
                        className="flex items-center justify-center w-full px-4 py-3.5 text-sm font-bold text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-2xl transition-all duration-300 group shadow-sm hover:shadow-red-500/10"
                    >
                        <PowerIcon className="h-5 w-5 mx-2 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                        <span>{t('global.exit')}</span>
                    </button>
                    <div className="mt-4 text-center">
                        <div className="h-1 w-12 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-2 opacity-50" />
                        <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase opacity-70">
                            {t('global.copyright')} &copy; 2025
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
