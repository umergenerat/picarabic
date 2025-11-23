import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
    isLoading?: boolean;
    // FIX: Added optional 'size' prop to support different button sizes.
    size?: 'sm' | 'md';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', isLoading = false, size = 'md', className = '', ...props }) => {
    // FIX: Removed size-specific classes (padding and font size) from baseClasses to be handled by size variants.
    const baseClasses = "flex items-center justify-center border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200";

    const variantClasses = {
        primary: "text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500",
        secondary: "text-primary-700 bg-primary-100 hover:bg-primary-200 focus:ring-primary-500 dark:bg-slate-700 dark:text-primary-300 dark:hover:bg-slate-600",
    };

    // FIX: Added size classes to control padding and font-size for different button sizes.
    const sizeClasses = {
        sm: "p-2 text-sm", // Ideal for icon-only buttons
        md: "px-4 py-2 text-sm", // Default button size
    };

    return (
        <button
            type="button"
            className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {children}
        </button>
    );
};

export default Button;
