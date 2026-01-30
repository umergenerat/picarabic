
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
    // Premium Card Styles with Glassmorphism
    const cardClasses = `
        relative
        bg-white/80 dark:bg-slate-800/80 
        backdrop-blur-sm
        rounded-2xl 
        shadow-sm hover:shadow-lg 
        border border-slate-100 dark:border-slate-700/60
        transition-all duration-300 ease-out
        ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:border-primary-200 dark:hover:border-primary-900' : ''} 
        ${className}
    `;

    return (
        <div className={cardClasses} onClick={onClick}>
            {/* Optional subtle gradient overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none" />

            {children}
        </div>
    );
};

export default Card;