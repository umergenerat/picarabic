import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { LockClosedIcon } from '../common/Icons';
import { useI18n } from '../../contexts/I18nContext';

interface LoginRequiredProps {
    onLogin: () => void;
}

const LoginRequired: React.FC<LoginRequiredProps> = ({ onLogin }) => {
    const { t } = useI18n();

    return (
        <div className="flex items-center justify-center h-full">
            <Card className="max-w-md w-full p-8 text-center">
                <LockClosedIcon className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {t('loginRequired.title')}
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                    {t('loginRequired.message')}
                </p>
                <Button onClick={onLogin} className="w-full">
                    {t('global.login')}
                </Button>
            </Card>
        </div>
    );
};

export default LoginRequired;
