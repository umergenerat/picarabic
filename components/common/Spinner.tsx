
import React from 'react';

const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-12 w-12',
        lg: 'h-24 w-24',
    };
    return (
        <div className="flex justify-center items-center p-4">
            <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-blue-400 border-t-transparent`}></div>
        </div>
    );
};

export default Spinner;
