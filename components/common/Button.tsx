import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    isLoading?: boolean;
    size?: 'sm' | 'md' | 'lg';
    as?: any;
    fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    isLoading = false,
    size = 'md',
    className = '',
    as: Component = 'button',
    fullWidth = false,
    ...props
}) => {

    // Base classes for consistent layout and transitions
    const baseClasses = "relative inline-flex items-center justify-center font-bold rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform active:scale-[0.98]";

    // Variant-specific visual styles
    const variantClasses = {
        primary: "text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-primary-500/25 hover:shadow-primary-500/40 focus:ring-primary-500 border border-transparent",
        secondary: "text-primary-700 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-primary-200 dark:hover:border-slate-600 focus:ring-slate-500",
        danger: "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-red-500/20 border border-transparent",
        ghost: "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-white border border-transparent shadow-none"
    };

    // Size-specific padding and text sizes
    const sizeClasses = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-6 py-3 text-base"
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <Component
            type={Component === 'button' ? 'button' : undefined}
            className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            <span className={isLoading ? 'opacity-80' : ''}>{children}</span>
        </Component>
    );
};

export default Button;
