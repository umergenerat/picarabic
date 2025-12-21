
import React from 'react';
import { AcademicCapIcon } from '../common/Icons';
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
}

const NavLink: React.FC<{
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => {
    const baseClasses = 'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800';
    const activeClasses = 'bg-primary-50 dark:bg-slate-700 text-primary-600 dark:text-white font-semibold';
    const inactiveClasses = 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700';

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
            <Icon className="h-5 w-5 mx-2" aria-hidden="true" />
            <span className="truncate">{label}</span>
        </a>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isAdmin, logoSrc, isOpen, setIsOpen, navItems }) => {
    const { t, locale } = useI18n();
    const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

    const handleLinkClick = (page: Page) => {
        setActivePage(page);
        // Always close sidebar on selection. On desktop this is harmless as sidebar is fixed/relative visible.
        // On mobile this ensures the menu closes after selection.
        setIsOpen(false);
    };

    const sidebarDirectionClasses = locale === 'ar' 
        ? `right-0 border-l ${isOpen ? 'translate-x-0' : 'translate-x-full'}`
        : `left-0 border-r ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;

    return (
        <>
            {/* Overlay for mobile */}
            <div 
                className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
            ></div>

            <aside 
                className={`fixed md:relative inset-y-0 z-40 w-64 flex-shrink-0 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-4 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${sidebarDirectionClasses}`}
                aria-label="Sidebar"
            >
                <div className="flex items-center justify-center mb-6 h-12">
                    {logoSrc ? (
                        <img src={logoSrc} alt={t('global.platformTitle')} className="h-12 object-contain" />
                    ) : (
                        <>
                            <AcademicCapIcon className="h-10 w-10 text-primary-500" />
                            <span className="mx-2 text-lg font-bold">ISTA TATA</span>
                        </>
                    )}
                </div>
                <nav className="flex-1 space-y-2">
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
                <div className="mt-auto text-center text-xs text-slate-500">
                    <p>{t('global.copyright')}</p>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
