import React, { useState, useMemo } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { UsersIcon, LockClosedIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowDownTrayIcon, ClockIcon, DocumentIcon, ChartBarIcon, CalendarDaysIcon, UserGroupIcon } from '../common/Icons';
import { Team, User } from '../../types';
import { useI18n } from '../../contexts/I18nContext';

interface PresentationsSectionProps {
    teams: Team[];
    setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
    user: User | null;
    isAdmin: boolean;
}

type ActionStatus = 'idle' | 'uploading' | 'success' | 'error';
interface ActionState {
    progress: number;
    status: ActionStatus;
    message: string;
}

// Stats Card Component
const StatCard: React.FC<{ icon: React.ElementType; value: number | string; label: string; colorClass: string }> = ({ icon: Icon, value, label, colorClass }) => (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${colorClass} shadow-lg`}>
        <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-sm text-white/80">{label}</p>
            </div>
        </div>
    </div>
);

// Progress bar for deadline
const DeadlineProgress: React.FC<{ dueDate: string; locale: string }> = ({ dueDate, locale }) => {
    const now = new Date();
    const due = new Date(dueDate);
    const total = due.getTime() - new Date('2024-12-01').getTime();
    const elapsed = now.getTime() - new Date('2024-12-01').getTime();
    const progress = Math.min(Math.max((elapsed / total) * 100, 0), 100);
    const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const isOverdue = daysLeft < 0;
    const isUrgent = daysLeft >= 0 && daysLeft <= 3;

    return (
        <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {locale === 'ar' ? 'الموعد النهائي' : 'Deadline'}
                </span>
                <span className={`text-xs font-bold ${isOverdue ? 'text-red-500' : isUrgent ? 'text-amber-500' : 'text-green-500'}`}>
                    {isOverdue
                        ? (locale === 'ar' ? `متأخر بـ ${Math.abs(daysLeft)} يوم` : `${Math.abs(daysLeft)} days late`)
                        : (locale === 'ar' ? `${daysLeft} يوم متبقي` : `${daysLeft} days left`)}
                </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${isOverdue ? 'bg-red-500' : isUrgent ? 'bg-amber-500' : 'bg-green-500'}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

const PresentationsSection: React.FC<PresentationsSectionProps> = ({ teams, setTeams, user, isAdmin }) => {
    const { t, locale } = useI18n();
    const [selectedFiles, setSelectedFiles] = useState<{ [key: number]: File | null }>({});
    const [actionStates, setActionStates] = useState<{ [key: number]: ActionState }>({});

    // Calculate stats
    const stats = useMemo(() => {
        const total = teams.length;
        const submitted = teams.filter(t => t.presentation).length;
        const pending = total - submitted;
        const totalMembers = teams.reduce((acc, t) => acc + (t.members?.length || 0), 0);
        return { total, submitted, pending, totalMembers };
    }, [teams]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, teamId: number) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFiles(prev => ({ ...prev, [teamId]: event.target.files![0] }));
            setActionStates(prev => ({ ...prev, [teamId]: { progress: 0, status: 'idle', message: '' } }));
        }
    };

    const handleUpload = (teamId: number) => {
        const file = selectedFiles[teamId];
        if (!file) return;

        setActionStates(prev => ({ ...prev, [teamId]: { progress: 0, status: 'uploading', message: '' } }));

        // Simulate upload progress
        const interval = setInterval(() => {
            setActionStates(prev => {
                const currentProgress = prev[teamId]?.progress ?? 0;
                const newProgress = Math.min(currentProgress + 10, 100);
                if (newProgress >= 100) {
                    clearInterval(interval);
                }
                return { ...prev, [teamId]: { ...prev[teamId], progress: newProgress, status: 'uploading' } };
            });
        }, 200);

        // Simulate upload completion
        setTimeout(() => {
            clearInterval(interval);

            const reader = new FileReader();
            reader.onload = (e) => {
                const fileDataUrl = e.target?.result as string;
                setTeams(currentTeams => currentTeams.map(team =>
                    team.id === teamId ? { ...team, presentation: file.name, presentationData: fileDataUrl } : team
                ));
                setActionStates(prev => ({ ...prev, [teamId]: { progress: 100, status: 'success', message: t('presentations.uploadSuccess') } }));

                setTimeout(() => {
                    setActionStates(prev => ({ ...prev, [teamId]: { progress: 0, status: 'idle', message: '' } }));
                    setSelectedFiles(prev => ({ ...prev, [teamId]: null }));
                }, 4000);
            };
            reader.onerror = () => {
                setActionStates(prev => ({ ...prev, [teamId]: { progress: 100, status: 'error', message: t('presentations.uploadError') } }));
                setTimeout(() => {
                    setActionStates(prev => ({ ...prev, [teamId]: { progress: 0, status: 'idle', message: '' } }));
                    setSelectedFiles(prev => ({ ...prev, [teamId]: null }));
                }, 4000);
            };
            reader.readAsDataURL(file);

        }, 2200);
    };

    if (teams.length === 0) {
        return (
            <div>
                <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">{t('presentations.title')}</h2>
                <Card className="p-12 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center">
                            <UsersIcon className="h-10 w-10 text-primary-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            {locale === 'ar' ? 'لا توجد فرق حالياً' : 'No Teams Yet'}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400">
                            {locale === 'ar'
                                ? 'سيتم عرض فرق العمل والعروض التقديمية هنا بمجرد إنشائها من قبل المسؤول.'
                                : 'Teams and presentations will appear here once created by the administrator.'}
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div>
            {/* Header with stats */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">{t('presentations.title')}</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        icon={UserGroupIcon}
                        value={stats.total}
                        label={locale === 'ar' ? 'فريق عمل' : 'Teams'}
                        colorClass="from-slate-700 to-slate-800"
                    />
                    <StatCard
                        icon={CheckCircleIcon}
                        value={stats.submitted}
                        label={locale === 'ar' ? 'عرض مُسلّم' : 'Submitted'}
                        colorClass="from-emerald-500 to-emerald-600"
                    />
                    <StatCard
                        icon={ClockIcon}
                        value={stats.pending}
                        label={locale === 'ar' ? 'في الانتظار' : 'Pending'}
                        colorClass="from-teal-500 to-teal-600"
                    />
                    <StatCard
                        icon={UsersIcon}
                        value={stats.totalMembers}
                        label={locale === 'ar' ? 'متدرب مشارك' : 'Participants'}
                        colorClass="from-primary-600 to-primary-700"
                    />
                </div>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map(team => {
                    const selectedFile = selectedFiles[team.id];
                    const actionState = actionStates[team.id] || { status: 'idle', progress: 0, message: '' };
                    const isTeamMember = user ? team.members?.includes(user.displayName) || team.teamLeader === user.displayName : false;
                    const canUpload = isTeamMember || isAdmin;
                    const hasPresentation = !!team.presentation;

                    return (
                        <Card key={team.id} className={`p-0 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl ${hasPresentation ? 'ring-2 ring-green-200 dark:ring-green-900/50' : ''}`}>
                            {/* Header gradient */}
                            <div className={`h-2 ${hasPresentation ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700'}`} />

                            <div className="p-6 flex-1 flex flex-col">
                                {/* Team Info */}
                                <div className="flex items-start mb-4">
                                    <div className={`p-3 rounded-xl me-3 flex-shrink-0 ${hasPresentation ? 'bg-green-100 dark:bg-green-900/30' : 'bg-primary-100 dark:bg-slate-700'}`}>
                                        <UsersIcon className={`h-6 w-6 ${hasPresentation ? 'text-green-600 dark:text-green-400' : 'text-primary-500'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{team.name[locale]}</h3>
                                        <span className="text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 py-0.5 px-2 rounded-full mt-1 inline-block">
                                            {team.specialization[locale]}
                                        </span>
                                    </div>
                                </div>

                                {/* Presentation Title */}
                                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <DocumentIcon className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{t('presentations.presentationTitle')}</p>
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{team.presentationTitle[locale]}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Team Details */}
                                <div className="space-y-3 mb-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                                        <span className="text-slate-600 dark:text-slate-400">
                                            {new Date(team.dueDate).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <UsersIcon className="h-4 w-4 text-slate-400" />
                                        <span className="text-slate-600 dark:text-slate-400">{team.teamLeader} ({locale === 'ar' ? 'القائد' : 'Leader'})</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {team.members?.map((member, idx) => (
                                            <span key={idx} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                                                {member}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Deadline Progress */}
                                <DeadlineProgress dueDate={team.dueDate} locale={locale} />

                                {/* Divider */}
                                <div className="border-t border-slate-200 dark:border-slate-700 my-4" />

                                {/* Status & Actions */}
                                <div className="flex-grow space-y-4">
                                    {team.presentation ? (
                                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900/30">
                                            <div className="flex justify-between items-center gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-green-600 dark:text-green-400">{t('presentations.submittedPresentation')}</p>
                                                        <p className="text-sm font-medium text-green-800 dark:text-green-200 truncate">{team.presentation}</p>
                                                    </div>
                                                </div>
                                                {user && team.presentationData && (
                                                    <a
                                                        href={team.presentationData}
                                                        download={team.presentation}
                                                        className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-800/50 dark:text-green-300 dark:hover:bg-green-800 transition-colors"
                                                        title={t('presentations.download')}
                                                    >
                                                        <ArrowDownTrayIcon className="h-4 w-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/30 flex items-center gap-2">
                                            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                                            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t('presentations.notSubmitted')}</p>
                                        </div>
                                    )}

                                    {canUpload ? (
                                        <div className="space-y-3">
                                            {!team.presentation && actionState.status === 'idle' && (
                                                <>
                                                    <label htmlFor={`file-upload-${team.id}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        {t('presentations.uploadLabel')}
                                                    </label>
                                                    <input
                                                        id={`file-upload-${team.id}`}
                                                        name={`file-upload-${team.id}`}
                                                        type="file"
                                                        onChange={(e) => handleFileChange(e, team.id)}
                                                        className="block w-full text-sm text-slate-500 file:me-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-slate-600 dark:file:text-primary-300 dark:hover:file:bg-slate-500 cursor-pointer"
                                                    />
                                                    <Button onClick={() => handleUpload(team.id)} className="w-full" disabled={!selectedFile}>
                                                        {t('presentations.uploadButton')}
                                                    </Button>
                                                </>
                                            )}

                                            {actionState.status === 'uploading' && (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-center text-primary-600 dark:text-primary-400">
                                                        {t('presentations.uploading')} {actionState.progress}%
                                                    </p>
                                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                                        <div
                                                            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full transition-all duration-300"
                                                            style={{ width: `${actionState.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {actionState.status === 'success' && (
                                                <div className="flex items-center gap-3 p-3 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-lg">
                                                    <CheckCircleIcon className="h-5 w-5" />
                                                    <p className="text-sm font-semibold">{actionState.message}</p>
                                                </div>
                                            )}

                                            {actionState.status === 'error' && (
                                                <div className="flex items-center gap-3 p-3 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-lg">
                                                    <ExclamationTriangleIcon className="h-5 w-5" />
                                                    <p className="text-sm font-semibold">{actionState.message}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : !user ? (
                                        <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                            <LockClosedIcon className="h-6 w-6 mx-auto mb-2 text-slate-400" />
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {t('presentations.loginPrompt')}
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default PresentationsSection;