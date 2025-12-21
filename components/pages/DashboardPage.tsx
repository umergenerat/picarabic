
import React from 'react';
import Card from '../common/Card';
import { BookOpenIcon, BeakerIcon, SparklesIcon } from '../common/Icons';
import { ProgressDataPoint } from '../../types';
import { useI18n } from '../../contexts/I18nContext';

interface DashboardPageProps {
    progressData: ProgressDataPoint[];
}

// Simple Custom Line Chart Component
const SimpleLineChart: React.FC<{ data: any[], lines: { key: string, color: string, name: string }[], height?: number }> = ({ data, lines, height = 300 }) => {
    if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-slate-400">لا توجد بيانات</div>;

    const padding = 40;
    const width = 800; // arbitrary internal width for SVG coordinate system
    const chartHeight = height;
    const effectiveWidth = width - padding * 2;
    const effectiveHeight = chartHeight - padding * 2;

    const xStep = effectiveWidth / (data.length - 1 || 1);
    
    // Find max value for Y scaling (add 10% buffer)
    const allValues = data.flatMap(d => lines.map(l => Number(d[l.key] || 0)));
    const maxValue = Math.max(...allValues, 10) * 1.1;

    const getY = (val: number) => chartHeight - padding - (val / maxValue) * effectiveHeight;
    const getX = (idx: number) => padding + idx * xStep;

    return (
        <div className="w-full h-full overflow-hidden">
             {/* Legend */}
             <div className="flex flex-wrap justify-center gap-4 mb-4">
                {lines.map(line => (
                    <div key={line.key} className="flex items-center text-sm">
                        <span className="w-3 h-3 rounded-full me-2" style={{ backgroundColor: line.color }}></span>
                        <span className="text-slate-600 dark:text-slate-300">{line.name}</span>
                    </div>
                ))}
            </div>

            <svg viewBox={`0 0 ${width} ${chartHeight}`} className="w-full h-auto" style={{ maxHeight: height }}>
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
                    <line 
                        key={tick}
                        x1={padding} 
                        y1={getY(maxValue * tick)} 
                        x2={width - padding} 
                        y2={getY(maxValue * tick)} 
                        stroke="#e2e8f0" 
                        strokeWidth="1" 
                        className="dark:stroke-slate-700"
                    />
                ))}

                {/* X Axis Labels */}
                {data.map((d, i) => (
                    <text 
                        key={i} 
                        x={getX(i)} 
                        y={chartHeight - 10} 
                        textAnchor="middle" 
                        fontSize="12" 
                        className="fill-slate-500 dark:fill-slate-400"
                    >
                        {d.month.substring(0, 3)}
                    </text>
                ))}

                {/* Lines */}
                {lines.map(line => {
                    const points = data.map((d, i) => `${getX(i)},${getY(Number(d[line.key] || 0))}`).join(' ');
                    return (
                        <g key={line.key}>
                            <polyline 
                                fill="none" 
                                stroke={line.color} 
                                strokeWidth="3" 
                                points={points} 
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                             {/* Dots */}
                             {data.map((d, i) => (
                                <circle 
                                    key={i}
                                    cx={getX(i)} 
                                    cy={getY(Number(d[line.key] || 0))} 
                                    r="4" 
                                    fill={line.color} 
                                    stroke="white"
                                    strokeWidth="2"
                                    className="dark:stroke-slate-800"
                                />
                             ))}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

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
                <div className="w-full h-[400px]">
                    <SimpleLineChart 
                        data={translatedData} 
                        lines={[
                            { key: 'completedTexts', color: '#14b8a6', name: t('dashboard.completedTexts') },
                            { key: 'acquiredSkills', color: '#38bdf8', name: t('dashboard.acquiredSkills') },
                            { key: 'testScores', color: '#f59e0b', name: t('dashboard.avgScore') }
                        ]}
                    />
                </div>
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
