

import React from 'react';
import Card from '../common/Card';
import { LinkIcon } from '../common/Icons';
import { useI18n } from '../../contexts/I18nContext';
import { Resource } from '../../types';

interface ResourcesSectionProps {
    resources: Resource[];
}

const getTypeColorClasses = (type: string): string => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('فيديو') || lowerType.includes('vidéo') || lowerType.includes('youtube')) {
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    }
    if (lowerType.includes('مقالة') || lowerType.includes('article')) {
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    }
    return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300';
};


const ResourcesSection: React.FC<ResourcesSectionProps> = ({ resources }) => {
    const { t, locale } = useI18n();

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">{t('resources.title')}</h2>
            
            <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{t('resources.suggested')}</h3>
                    <p className="text-sm text-primary-500 font-bold">{t('resources.weekly')}</p>
                </div>
                <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                    {resources.map((resource) => (
                        <li key={resource.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                            <div className="mb-2 sm:mb-0">
                                <p className="text-lg font-medium text-slate-900 dark:text-white">{resource.title[locale]}</p>
                                <span className={`text-sm py-0.5 px-2 rounded-full ${getTypeColorClasses(resource.type[locale])}`}>
                                    {resource.type[locale]}
                                </span>
                            </div>
                            <a 
                                href={resource.link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex-shrink-0 flex items-center gap-2 px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-100 dark:bg-slate-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-slate-600"
                            >
                                <LinkIcon className="h-4 w-4" />
                                {t('resources.visit')}
                            </a>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
};

export default ResourcesSection;