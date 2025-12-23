
import React from 'react';

interface AvatarProps {
    name: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className = '' }) => {
    // الحصول على الحروف الأولى (الأول من كل كلمة، بحد أقصى حرفين)
    const getInitials = (userName: string) => {
        if (!userName) return '?';
        const parts = userName.trim().split(/\s+/);
        if (parts.length === 0) return '?';
        if (parts.length === 1) return parts[0].substring(0, 1).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    // توليد لون خلفية ثابت بناءً على الاسم لضمان استمرارية اللون لنفس المستخدم
    const getColor = (userName: string) => {
        if (!userName) return 'bg-slate-500';
        const colors = [
            'bg-primary-600',
            'bg-teal-600',
            'bg-indigo-600',
            'bg-blue-600',
            'bg-emerald-600',
            'bg-slate-700'
        ];
        let hash = 0;
        for (let i = 0; i < userName.length; i++) {
            hash = userName.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const sizeClasses = {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base'
    };

    return (
        <div
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-700 shrink-0 ${getColor(name)} ${className}`}
            title={name}
        >
            {getInitials(name)}
        </div>
    );
};

export default Avatar;
