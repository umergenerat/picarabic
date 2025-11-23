import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { UsersIcon, LockClosedIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowDownTrayIcon } from '../common/Icons';
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

const PresentationsSection: React.FC<PresentationsSectionProps> = ({ teams, setTeams, user, isAdmin }) => {
    const { t, locale } = useI18n();
    const [selectedFiles, setSelectedFiles] = useState<{ [key: number]: File | null }>({});
    const [actionStates, setActionStates] = useState<{ [key: number]: ActionState }>({});

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, teamId: number) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFiles(prev => ({ ...prev, [teamId]: event.target.files[0] }));
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

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">{t('presentations.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map(team => {
                    const selectedFile = selectedFiles[team.id];
                    const actionState = actionStates[team.id] || { status: 'idle', progress: 0, message: '' };
                    const isTeamMember = user ? team.members.includes(user.displayName) || team.teamLeader === user.displayName : false;
                    const canUpload = isTeamMember || isAdmin;

                    return (
                        <Card key={team.id} className="p-6 flex flex-col">
                            <div className="flex items-start mb-4">
                                <div className="p-2 bg-primary-100 dark:bg-slate-700 rounded-full me-3 flex-shrink-0">
                                    <UsersIcon className="h-6 w-6 text-primary-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{team.name[locale]}</h3>
                                    <span className="text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 py-0.5 px-2 rounded-full mt-1 inline-block">
                                        {team.specialization[locale]}
                                    </span>
                                </div>
                            </div>
                            
                             <div className="space-y-3 mb-4 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-4">
                                <div>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{t('presentations.presentationTitle')}</span>
                                    <p>{team.presentationTitle[locale]}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">{t('presentations.dueDate')}</span>
                                        <p>{new Date(team.dueDate).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">{t('presentations.teamLeader')}</span>
                                        <p>{team.teamLeader}</p>
                                    </div>
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{t('presentations.members')}</span>
                                    <p>{team.members.join('، ')}</p>
                                </div>
                            </div>

                            <div className="flex-grow space-y-4">
                                {team.presentation ? (
                                    <div className="p-3 bg-green-50 dark:bg-slate-700/50 rounded-md">
                                        <div className="flex justify-between items-center gap-2">
                                            <div>
                                                <p className="text-sm font-medium text-green-800 dark:text-green-300">{t('presentations.submittedPresentation')}</p>
                                                <p className="text-sm text-green-700 dark:text-green-200 break-all">{team.presentation}</p>
                                            </div>
                                            {user && team.presentationData && (
                                                <a
                                                    href={team.presentationData}
                                                    download={team.presentation}
                                                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 dark:bg-slate-600 dark:text-primary-300 dark:hover:bg-slate-500 transition-colors"
                                                    title={t('presentations.download')}
                                                >
                                                    <ArrowDownTrayIcon className="h-4 w-4" />
                                                    <span>{t('presentations.download')}</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-yellow-50 dark:bg-slate-700/50 rounded-md">
                                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">{t('presentations.notSubmitted')}</p>
                                    </div>
                                )}
                                
                                {canUpload ? (
                                    <div className="pt-4 border-t border-slate-200 dark:border-slate-600 space-y-3">
                                      {!team.presentation && actionState.status === 'idle' && (
                                            <>
                                                <label htmlFor={`file-upload-${team.id}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    {t('presentations.uploadLabel')}
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <input id={`file-upload-${team.id}`} name={`file-upload-${team.id}`} type="file" onChange={(e) => handleFileChange(e, team.id)} className="block w-full text-sm text-slate-500 file:me-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-slate-600 dark:file:text-primary-300 dark:hover:file:bg-slate-500"/>
                                                </div>
                                                <Button onClick={() => handleUpload(team.id)} className="w-full mt-3" disabled={!selectedFile}>{t('presentations.uploadButton')}</Button>
                                            </>
                                        )}
    
                                        {actionState.status === 'uploading' && (
                                            <div>
                                                <p className="text-sm font-medium text-center mb-2">{t('presentations.uploading')} {actionState.progress}%</p>
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                                    <div className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" style={{width: `${actionState.progress}%`}} />
                                                </div>
                                            </div>
                                        )}
    
                                        {actionState.status === 'success' && (
                                            <div className="flex items-center gap-3 p-3 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-md">
                                                <CheckCircleIcon className="h-6 w-6" />
                                                <p className="text-sm font-semibold">{actionState.message}</p>
                                            </div>
                                        )}
    
                                        {actionState.status === 'error' && (
                                            <div className="flex items-center gap-3 p-3 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-md">
                                                <ExclamationTriangleIcon className="h-6 w-6" />
                                                <p className="text-sm font-semibold">{actionState.message}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : !user ? (
                                    <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-600">
                                        <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                                            <LockClosedIcon className="h-6 w-6 mx-auto mb-2 text-slate-400" />
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {t('presentations.loginPrompt')}
                                            </p>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default PresentationsSection;