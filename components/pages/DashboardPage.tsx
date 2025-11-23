import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import Card from '../common/Card';
import { BookOpenIcon, BeakerIcon, SparklesIcon } from '../common/Icons';
import { ProgressDataPoint } from '../../types';
import { useI18n } from '../../contexts/I18nContext';

interface DashboardPageProps {
    progressData: ProgressDataPoint[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({ progressData }) => {
    const { t } = useI18n();
    const latestProgress = progressData.length > 0 ? progressData[progressData.length - 1] : { completedTexts: 0, acquiredSkills: 0, testScores: 0 };
    
    const translatedData = progressData.map(item => ({
        ...item,
        month: t(`dashboard.months.${item.month}`)
    }));

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">{t('dashboard.title')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard icon={BookOpenIcon} value={String(latestProgress.completedTexts)} label={t('dashboard.completedTexts')} />
                <StatCard icon={SparklesIcon} value={String(latestProgress.acquiredSkills)} label={t('dashboard.acquiredSkills')} />
                <StatCard icon={BeakerIcon} value={`${latestProgress.testScores}%`} label={t('dashboard.avgScore')} />
            </div>

            <Card className="p-4">
                <h3 className="text-xl font-bold mb-4">{t('dashboard.progressChartTitle')}</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={translatedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
                        <XAxis dataKey="month" stroke="rgb(156 163 175)" />
                        <YAxis yAxisId="left" stroke="#0d9488" />
                        <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" unit="%" />
                        <Tooltip 
                            wrapperClassName="!bg-slate-700 !border-slate-600 !rounded-lg shadow-xl" 
                            contentStyle={{ backgroundColor: 'rgb(30 41 59)', border: 'none' }} 
                            labelStyle={{ color: 'white', fontWeight: 'bold' }} 
                            itemStyle={{ color: 'white' }} 
                        />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="completedTexts" name={t('dashboard.completedTexts')} stroke="#14b8a6" strokeWidth={3} activeDot={{ r: 8 }} />
                        <Line yAxisId="left" type="monotone" dataKey="acquiredSkills" name={t('dashboard.acquiredSkills')} stroke="#38bdf8" strokeWidth={3} activeDot={{ r: 8 }} />
                        <Line yAxisId="right" type="monotone" dataKey="testScores" name={t('dashboard.avgScore')} stroke="#f59e0b" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};

interface StatCardProps {
    icon: React.ElementType;
    value: string;
    label: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, value, label }) => (
    <Card className="p-6 flex items-center">
        <div className="p-4 rounded-full bg-primary-100 dark:bg-slate-700 text-primary-500 me-4">
            <Icon className="h-7 w-7" />
        </div>
        <div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        </div>
    </Card>
);

export default DashboardPage;