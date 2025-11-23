import React from 'react';
import Card from './Card';
import Button from './Button';
import { ExclamationTriangleIcon } from './Icons';
import { useI18n } from '../../contexts/I18nContext';

interface ConfirmationModalProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmButtonText?: string;
    cancelButtonText?: string;
    title?: string;
    confirmButtonClassName?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    message, 
    onConfirm, 
    onCancel,
    confirmButtonText,
    cancelButtonText,
    title,
    confirmButtonClassName = '!bg-red-600 hover:!bg-red-700 focus:!ring-red-500',
}) => {
    const { t } = useI18n();
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirmation-dialog-title">
            <Card className="w-full max-w-md">
                 <div className="p-6">
                    <div className="text-center">
                        <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                        <h3 id="confirmation-dialog-title" className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title || t('global.confirm')}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">{message}</p>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={onCancel}>{cancelButtonText || t('global.cancel')}</Button>
                        <Button className={confirmButtonClassName} onClick={onConfirm}>{confirmButtonText || t('global.confirm')}</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ConfirmationModal;
