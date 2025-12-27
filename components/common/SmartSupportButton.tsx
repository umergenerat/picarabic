import React from 'react';
import { InformationCircleIcon } from './Icons';
import { useI18n } from '../../contexts/I18nContext';

interface SmartSupportButtonProps {
    onClick: () => void;
}

const SmartSupportButton: React.FC<SmartSupportButtonProps> = ({ onClick }) => {
    const { t } = useI18n();

    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden"
            title={t('nav.support')}
        >
            <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-full"></div>
            <InformationCircleIcon className="h-7 w-7 relative z-10 group-hover:rotate-12 transition-transform" />

            {/* Tooltip-like label on hover (for LTR/RTL) */}
            <span className="absolute right-full mr-3 px-3 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {t('nav.support') || 'مركز الدعم الذكي'}
            </span>
        </button>
    );
};

export default SmartSupportButton;
