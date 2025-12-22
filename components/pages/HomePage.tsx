
import React from 'react';
import Card from '../common/Card';
import { BookOpenIcon, SparklesIcon, BeakerIcon, ChatBubbleLeftRightIcon, PresentationChartBarIcon, ChartPieIcon } from '../common/Icons';
import { useI18n } from '../../contexts/I18nContext';

const HomePage: React.FC = () => {
    const { t } = useI18n();
    return (
        <div className="container mx-auto space-y-12 pb-12">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-teal-700 text-white shadow-2xl">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-black/10 blur-3xl"></div>
                
                <div className="relative z-10 p-8 sm:p-12 md:flex items-center gap-12">
                    <div className="md:w-3/5 text-center md:text-start">
                        <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 leading-tight">
                            {t('home.welcomeTitle')}
                        </h1>
                        <p className="text-lg sm:text-xl text-primary-50 mb-8 max-w-2xl leading-relaxed">
                            {t('home.welcomeSubtitle')}
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                            <button className="px-8 py-3 bg-white text-primary-700 rounded-xl font-bold shadow-lg hover:bg-primary-50 transition-all active:scale-95">
                                {t('nav.texts')}
                            </button>
                            <button className="px-8 py-3 bg-primary-500/30 border border-white/30 text-white rounded-xl font-bold backdrop-blur-sm hover:bg-primary-500/50 transition-all active:scale-95">
                                {t('nav.dashboard')}
                            </button>
                        </div>
                    </div>
                    <div className="hidden md:flex md:w-2/5 justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full"></div>
                            <ChartPieIcon className="h-48 w-48 text-white animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div>
                <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white flex items-center justify-center gap-3">
                    <SparklesIcon className="h-8 w-8 text-primary-500" />
                    {t('home.featuresTitle')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={BookOpenIcon}
                        title={t('home.feature1Title')}
                        description={t('home.feature1Desc')}
                        color="bg-blue-500"
                    />
                    <FeatureCard
                        icon={ChatBubbleLeftRightIcon}
                        title={t('chat.title')}
                        description={t('home.feature2Desc')}
                        color="bg-teal-500"
                    />
                    <FeatureCard
                        icon={BeakerIcon}
                        title={t('home.feature3Title')}
                        description={t('home.feature3Desc')}
                        color="bg-amber-500"
                    />
                    <FeatureCard
                        icon={PresentationChartBarIcon}
                        title={t('nav.presentations')}
                        description={t('presentations.title')}
                        color="bg-indigo-500"
                    />
                    <FeatureCard
                        icon={SparklesIcon}
                        title={t('nav.skills')}
                        description={t('home.feature2Desc')}
                        color="bg-pink-500"
                    />
                    <FeatureCard
                        icon={ChartPieIcon}
                        title={t('nav.dashboard')}
                        description={t('dashboard.progressChartTitle')}
                        color="bg-emerald-500"
                    />
                </div>
            </div>

             {/* About Section */}
             <Card className="p-8 border-none bg-slate-50 dark:bg-slate-800/40">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">{t('home.aboutTitle')}</h2>
                    <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        "{t('home.aboutDesc')}"
                    </p>
                </div>
            </Card>
        </div>
    );
};

interface FeatureCardProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    color: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, color }) => (
    <Card className="group p-8 transition-all hover:-translate-y-2">
        <div className={`flex items-center justify-center h-16 w-16 rounded-2xl ${color} text-white shadow-lg mb-6 group-hover:rotate-6 transition-transform`}>
            <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
    </Card>
);

export default HomePage;
