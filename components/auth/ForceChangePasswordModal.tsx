import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { XMarkIcon, LockClosedIcon, CheckCircleIcon } from '../common/Icons';
import { forceChangePassword } from '../../services/authService';
import { useI18n } from '../../contexts/I18nContext';
import { User } from '../../types';

interface ForceChangePasswordModalProps {
    user: User;
    onClose: () => void;
    onSuccess: (user: User) => void;
}

const ForceChangePasswordModal: React.FC<ForceChangePasswordModalProps> = ({ user, onClose, onSuccess }) => {
    const { t } = useI18n();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            const updatedUser = await forceChangePassword(user.email, newPassword, confirmPassword);
            setSuccess(t('changePassword.success'));
            setTimeout(() => {
                onSuccess(updatedUser);
            }, 1500);
        } catch (err: any) {
            setError(t(err.message));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <Card className="w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('forceChangePassword.title')}</h3>
                            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        
                        {success ? (
                            <div className="text-center p-4">
                                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                <p className="text-lg font-medium text-green-600 dark:text-green-400">{success}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="text-center bg-blue-50 dark:bg-gray-800 p-4 rounded-md">
                                    <h4 className="font-bold text-lg text-blue-800 dark:text-blue-300">{t('forceChangePassword.welcome', {name: user.displayName})}</h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">{t('forceChangePassword.instruction')}</p>
                                </div>
                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('changePassword.new')}</label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3">
                                            <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input type="password" name="newPassword" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="block w-full rounded-md border-gray-300 ps-3 pe-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('changePassword.confirm')}</label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3">
                                            <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input type="password" name="confirmPassword" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="block w-full rounded-md border-gray-300 ps-3 pe-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                </div>
                                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                            </div>
                        )}
                    </div>
                    {!success && (
                        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end gap-3">
                            <Button type="button" variant="secondary" onClick={onClose}>{t('global.cancel')}</Button>
                            <Button type="submit" isLoading={isLoading}>{t('changePassword.save')}</Button>
                        </div>
                    )}
                </form>
            </Card>
        </div>
    );
};

export default ForceChangePasswordModal;
