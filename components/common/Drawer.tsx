import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from './Icons';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    side?: 'left' | 'right';
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    className?: string;
}

const Drawer: React.FC<DrawerProps> = ({
    isOpen,
    onClose,
    title,
    children,
    side = 'right', // Default to right for Arabic generic feel (coming from "start" usually if pure LTR but often RTL apps use Right side for context)
    size = 'md',
    className = ''
}) => {
    const [isVisible, setIsVisible] = useState(false);

    // Size classes
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-full'
    };

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300); // Match transition duration
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const sideClass = side === 'right' ? 'right-0' : 'left-0';
    const translateClass = side === 'right'
        ? (isOpen ? 'translate-x-0' : 'translate-x-full')
        : (isOpen ? 'translate-x-0' : '-translate-x-full');

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-stretch justify-end isolate" aria-modal="true" role="dialog">
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {/* Panel */}
            <div
                className={`flex flex-col w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-[0_20px_70px_-10px_rgba(0,0,0,0.3)] ring-1 ring-slate-900/5 transform transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) absolute h-full ${sideClass} ${sizeClasses[size]} ${translateClass} ${className}`}
                style={{ transitionProperty: 'transform, opacity' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
                        {title}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Drawer;
