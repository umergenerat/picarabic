
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
    const cardClasses = `bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 border border-slate-200/80 dark:border-slate-700/80 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600 ${onClick ? 'cursor-pointer' : ''} ${className}`;

    return (
        <div className={cardClasses} onClick={onClick}>
            {children}
        </div>
    );
};

export default Card;