
import React from 'react';
import Card from '../common/Card';
import { BookOpenIcon, SparklesIcon, BeakerIcon, ChatBubbleLeftRightIcon, PresentationChartBarIcon, ChartPieIcon, ChevronRightIcon } from '../common/Icons';
import { useI18n } from '../../contexts/I18nContext';

const HomePage: React.FC = () => {
    const { t } = useI18n();
    return (
        <div className="container mx-auto space-y-12 pb-12 max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary-600 via-primary-700 to-teal-900 text-white shadow-[0_20px_50px_-10px_rgba(16,185,129,0.3)] transition-all hover:shadow-[0_25px_60px_-10px_rgba(16,185,129,0.4)] duration-700 group/hero">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-white/10 blur-[100px] group-hover/hero:bg-white/15 transition-colors duration-700 animate-pulse-soft"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-black/20 blur-[100px] animate-pulse-soft" style={{ animationDelay: '1.5s' }}></div>

                {/* Floating decorative elements */}
                <div className="absolute top-1/4 right-1/4 h-2 w-2 bg-primary-300 rounded-full animate-float opacity-40"></div>
                <div className="absolute bottom-1/4 left-1/3 h-3 w-3 bg-teal-300 rounded-full animate-float opacity-30" style={{ animationDelay: '2s' }}></div>

                <div className="relative z-10 p-8 sm:p-14 md:flex items-center gap-12">
                    <div className="md:w-3/5 text-center md:text-start space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold tracking-widest uppercase animate-fade-in">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                            </span>
                            {t('global.platformTitle')} 2025
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight text-white drop-shadow-sm">
                            {t('home.welcomeTitle')}
                        </h1>
                        <p className="text-lg sm:text-xl text-primary-50/90 max-w-2xl leading-relaxed font-medium">
                            {t('home.welcomeSubtitle')}
                        </p>
                        <div className="flex flex-wrap gap-5 justify-center md:justify-start pt-4">
                            <button className="px-10 py-4 bg-white text-primary-900 rounded-2xl font-black shadow-xl shadow-black/10 hover:bg-primary-50 transition-all transform hover:-translate-y-1.5 active:scale-95 flex items-center gap-2 group">
                                {t('nav.texts')}
                                <ChevronRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="px-10 py-4 bg-white/10 border border-white/20 text-white rounded-2xl font-black backdrop-blur-md hover:bg-white/20 transition-all transform hover:-translate-y-1.5 active:scale-95">
                                {t('nav.dashboard')}
                            </button>
                        </div>
                    </div>
                    <div className="hidden md:flex md:w-2/5 justify-center relative">
                        <div className="absolute inset-0 bg-primary-400/20 blur-[120px] rounded-full animate-pulse-soft"></div>
                        <div className="relative group/icon transition-transform duration-700 hover:scale-110">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-primary-400/30 to-teal-400/30 blur-2xl rounded-full opacity-0 group-hover/icon:opacity-100 transition-opacity"></div>
                            <ChartPieIcon className="h-56 w-56 text-white drop-shadow-[0_20px_30px_rgba(255,255,255,0.3)] animate-float" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div>
                <h2 className="text-3xl font-bold text-center mb-12 text-slate-800 dark:text-white flex items-center justify-center gap-3">
                    <SparklesIcon className="h-8 w-8 text-primary-500" />
                    <span className="text-gradient">{t('home.featuresTitle')}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    <FeatureCard
                        icon={BookOpenIcon}
                        title={t('home.feature1Title')}
                        description={t('home.feature1Desc')}
                        delay={0}
                    />
                    <FeatureCard
                        icon={ChatBubbleLeftRightIcon}
                        title={t('chat.title')}
                        description={t('home.feature2Desc')}
                        delay={100}
                    />
                    <FeatureCard
                        icon={BeakerIcon}
                        title={t('home.feature3Title')}
                        description={t('home.feature3Desc')}
                        delay={200}
                    />
                    <FeatureCard
                        icon={PresentationChartBarIcon}
                        title={t('nav.presentations')}
                        description={t('presentations.title')}
                        delay={300}
                    />
                    <FeatureCard
                        icon={SparklesIcon}
                        title={t('nav.skills')}
                        description={t('home.feature2Desc')}
                        delay={400}
                    />
                    <FeatureCard
                        icon={ChartPieIcon}
                        title={t('nav.dashboard')}
                        description={t('dashboard.progressChartTitle')}
                        delay={500}
                    />
                </div>
            </div>

            {/* About Section */}
            <div className="max-w-4xl mx-auto">
                <Card className="p-8 sm:p-12 border-none glass-panel text-center">
                    <h2 className="text-3xl font-bold mb-6 text-slate-800 dark:text-white">{t('home.aboutTitle')}</h2>
                    <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed italic relative">
                        <span className="text-6xl text-primary-500/20 absolute -top-4 -left-4 font-serif">"</span>
                        {t('home.aboutDesc')}
                        <span className="text-6xl text-primary-500/20 absolute -bottom-8 -right-4 font-serif">"</span>
                    </p>
                </Card>
            </div>
        </div>
    );
};

interface FeatureCardProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, delay = 0 }) => (
    <Card className="group p-8 transition-all hover:translate-y-[-10px] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1),0_0_20px_rgba(16,185,129,0.15)] h-full glass-panel border-white/80 dark:border-white/5 hover:border-primary-400/30 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100/20 dark:bg-primary-900/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

        <div
            className="flex items-center justify-center h-16 w-16 rounded-[1.25rem] bg-gradient-to-br from-primary-500 to-teal-600 text-white shadow-lg shadow-primary-500/20 mb-8 group-hover:rotate-6 group-hover:scale-110 transition-all duration-500 ease-out relative z-10"
        >
            <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-black mb-4 text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors relative z-10">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium relative z-10">{description}</p>

        <div className="absolute bottom-4 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
            <ChevronRightIcon className="h-5 w-5 text-primary-500" />
        </div>
    </Card>
);

export default HomePage;
