import React from 'react';
import Card from '../common/Card';
import { BookOpenIcon, SparklesIcon, BeakerIcon } from '../common/Icons';
import { useI18n } from '../../contexts/I18nContext';

const HomePage: React.FC = () => {
    const { t } = useI18n();
    return (
        <div className="container mx-auto space-y-12">
            {/* Hero Section */}
            <Card className="p-8 text-center bg-gradient-to-br from-primary-500 to-teal-600 text-white shadow-2xl">
                <h1 className="text-4xl font-bold mb-4">{t('home.welcomeTitle')}</h1>
                <p className="text-lg text-primary-50 max-w-4xl mx-auto">
                    {t('home.welcomeSubtitle')}
                </p>
            </Card>

            {/* About Section */}
            <Card className="p-8">
                <h2 className="text-3xl font-bold text-center mb-6 text-slate-900 dark:text-white">{t('home.aboutTitle')}</h2>
                <p className="text-lg text-center max-w-3xl mx-auto text-slate-600 dark:text-slate-300 leading-relaxed">
                    {t('home.aboutDesc')}
                </p>
            </Card>

            {/* Features Section */}
            <div>
                <h2 className="text-3xl font-bold text-center mb-8 text-slate-900 dark:text-white">{t('home.featuresTitle')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={BookOpenIcon}
                        title={t('home.feature1Title')}
                        description={t('home.feature1Desc')}
                    />
                    <FeatureCard
                        icon={SparklesIcon}
                        title={t('home.feature2Title')}
                        description={t('home.feature2Desc')}
                    />
                    <FeatureCard
                        icon={BeakerIcon}
                        title={t('home.feature3Title')}
                        description={t('home.feature3Desc')}
                    />
                </div>
            </div>
        </div>
    );
};

interface FeatureCardProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => (
    <Card className="p-6 text-center">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 dark:bg-slate-700 text-primary-500 mx-auto mb-4">
            <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{title}</h3>
        <p className="text-slate-600 dark:text-slate-300">{description}</p>
    </Card>
);

export default HomePage;