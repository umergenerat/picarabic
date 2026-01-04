
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
    const baseClasses = 'flex items-center px-4 py-3.5 mx-2 text-sm font-medium rounded-xl transition-all duration-300 group relative overflow-hidden';
    const activeClasses = 'bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold shadow-sm';
    const inactiveClasses = 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200';

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
                <span className="absolute inset-y-0 left-0 w-1 bg-primary-500 rounded-r-full" aria-hidden="true" />
            )}
            <Icon className={`h-5 w-5 mx-3 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} aria-hidden="true" />
            <span className="truncate">{label}</span>
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
                className={`fixed md:relative inset-y-0 z-50 w-72 flex-shrink-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 flex flex-col transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:translate-x-0 shadow-2xl md:shadow-none ${sidebarDirectionClasses}`}
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
                <nav className="flex-1 space-y-1 px-2 overflow-y-auto scrollbar-hide py-4">
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
                <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/30">
                    <button
                        onClick={onExit}
                        className="flex items-center justify-center w-full px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 group hover:shadow-sm"
                    >
                        <PowerIcon className="h-5 w-5 mx-2 group-hover:scale-110 transition-transform" />
                        <span>{t('global.exit')}</span>
                    </button>
                    <div className="mt-4 text-center">
                        <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase opacity-70 hover:opacity-100 transition-opacity">
                            {t('global.copyright')} &copy; 2025
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
