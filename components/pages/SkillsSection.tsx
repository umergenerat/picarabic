import React, { useState, useEffect, useCallback } from 'react';
import { Skill, Specialization, User } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { iconMap, SparklesIcon, CheckCircleIcon, LightBulbIcon, XMarkIcon, ArrowPathIcon } from '../common/Icons';
import { useI18n } from '../../contexts/I18nContext';
import { useAi } from '../../contexts/AiContext';
import { generateSkillScenario, evaluateSkillAnswer } from '../../services/geminiService';
import { getFallbackScenario, getFallbackSkillEvaluation } from '../../data/fallbackData';

interface SkillPracticeModalProps {
    skill: Skill;
    specialization: string;
    onClose: () => void;
    onComplete: (skillId: number) => Promise<void>;
    onConsultExpert?: () => void;
}

const SkillPracticeModal: React.FC<SkillPracticeModalProps> = ({ skill, specialization, onClose, onComplete, onConsultExpert }) => {
    const { t, locale } = useI18n();
    const { getApiKey, handleAiError, clearApiKey } = useAi();
    const [scenario, setScenario] = useState('');
    const [question, setQuestion] = useState('');
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isLoadingScenario, setIsLoadingScenario] = useState(true);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [error, setError] = useState('');
    const [usedFallback, setUsedFallback] = useState(false);

    const fetchScenario = useCallback(async (useFallbackDirectly: boolean = false) => {
        setIsLoadingScenario(true);
        setError('');
        setUsedFallback(false);
        setScenario('');
        setQuestion('');
        setUserAnswer('');
        setFeedback('');

        // استخدام الـ fallback مباشرة إذا طُلب ذلك
        if (useFallbackDirectly) {
            const fallback = getFallbackScenario(skill.id, specialization);
            if (fallback) {
                setScenario(fallback.scenario);
                setQuestion(fallback.question);
                setUsedFallback(true);
            } else {
                setError(locale === 'ar' ? 'لا توجد سيناريوهات متاحة لهذه المهارة' : 'No scenarios available for this skill');
            }
            setIsLoadingScenario(false);
            return;
        }

        try {
            const execute = async (key: string) => {
                const result = await generateSkillScenario(skill.title[locale], skill.description[locale], specialization, key);
                if (result && result.scenario && result.question) {
                    setScenario(result.scenario);
                    setQuestion(result.question);
                } else {
                    throw new Error("Invalid scenario data");
                }
            };

            const apiKey = await getApiKey();
            try {
                await execute(apiKey);
            } catch (innerErr: any) {
                if (innerErr.message.includes('AUTH_ERROR')) {
                    clearApiKey();
                    const newKey = await getApiKey();
                    await execute(newKey);
                } else {
                    throw innerErr;
                }
            }
        } catch (err: any) {
            console.error('Error generating skill scenario:', err);
            // محاولة استخدام الـ fallback
            const fallback = getFallbackScenario(skill.id, specialization);
            if (fallback) {
                setScenario(fallback.scenario);
                setQuestion(fallback.question);
                setUsedFallback(true);
                setError(''); // مسح الخطأ لأننا نستخدم الـ fallback
            } else {
                setError(err.message || t('skills.errorScenario'));
            }
        } finally {
            setIsLoadingScenario(false);
        }
    }, [skill, specialization, locale, t, getApiKey]);

    useEffect(() => {
        fetchScenario();
    }, [fetchScenario]);

    const handleEvaluate = async () => {
        if (!userAnswer.trim()) return;
        setIsEvaluating(true);
        setError('');
        setFeedback('');

        try {
            const execute = async (key: string) => {
                const result = await evaluateSkillAnswer(skill.title[locale], `${scenario}\n${question}`, userAnswer, key);
                setFeedback(result);
            };

            const apiKey = await getApiKey();
            try {
                await execute(apiKey);
            } catch (innerErr: any) {
                if (innerErr.message.includes('AUTH_ERROR')) {
                    clearApiKey();
                    const newKey = await getApiKey();
                    await execute(newKey);
                } else {
                    throw innerErr;
                }
            }
        } catch (err: any) {
            console.error('Evaluation error:', err);
            // استخدام تقييم بديل عند الفشل
            const fallbackEval = getFallbackSkillEvaluation(skill.title[locale], userAnswer);
            setFeedback(fallbackEval);
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleComplete = async () => {
        setIsEvaluating(true);
        try {
            await onComplete(skill.id);
        } catch (err) {
            setError(t('skills.errorSavingProgress'));
        } finally {
            setIsEvaluating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
            <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-huge border-none ring-1 ring-white/20 dark:ring-slate-700/50 bg-white/90 dark:bg-slate-900/90 rounded-[28px]">
                <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('skills.practiceTitle', { skillName: skill.title[locale] })}</h3>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    {isLoadingScenario && (
                        <div className="text-center py-8">
                            <Spinner />
                            <p className="mt-4 text-slate-500 dark:text-slate-400">
                                {locale === 'ar' ? 'جاري إنشاء سيناريو التدريب...' : 'Generating training scenario...'}
                            </p>
                        </div>
                    )}

                    {error && !scenario && (
                        <div className="text-center py-8">
                            <p className="text-red-500 mb-4">{error}</p>
                            <div className="flex gap-2 justify-center">
                                <Button onClick={() => fetchScenario(false)} variant="secondary">
                                    <ArrowPathIcon className="h-5 w-5 mx-1" />
                                    {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                                </Button>
                                <Button onClick={() => fetchScenario(true)}>
                                    <SparklesIcon className="h-5 w-5 mx-1" />
                                    {locale === 'ar' ? 'استخدم سيناريو جاهز' : 'Use preset scenario'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {scenario && (
                        <>
                            {usedFallback && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-300 text-sm">
                                    {locale === 'ar'
                                        ? '💡 تم استخدام سيناريو جاهز. يمكنك المحاولة لاحقاً للحصول على سيناريو مُخصص بالذكاء الاصطناعي.'
                                        : '💡 Preset scenario used. You can try again later for an AI-generated scenario.'}
                                </div>
                            )}

                            <div className="p-6 rounded-2xl glass-panel bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 shadow-sm animate-slide-in-bottom">
                                <h4 className="font-extrabold text-sm uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-3">{t('skills.scenario')}</h4>
                                <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed text-[15px]">{scenario}</p>
                                <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                                    <p className="text-slate-900 dark:text-white whitespace-pre-wrap font-bold leading-relaxed">{question}</p>
                                </div>
                            </div>

                            <div className="animate-slide-in-bottom" style={{ animationDelay: '0.1s' }}>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 ms-2">{t('skills.yourResponse')}</label>
                                <textarea
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    rows={5}
                                    className="input-premium resize-none custom-scrollbar text-[15px] leading-relaxed shadow-sm dark:bg-slate-800/80"
                                    placeholder={t('skills.yourResponsePlaceholder')}
                                    disabled={isEvaluating || !!feedback}
                                />
                            </div>

                            {!feedback && (
                                <Button onClick={handleEvaluate} isLoading={isEvaluating} disabled={!userAnswer.trim()}>
                                    {t('skills.submitForFeedback')}
                                </Button>
                            )}

                            {isEvaluating && <Spinner size="sm" />}
                            {error && feedback === '' && <p className="text-red-500 mt-2">{error}</p>}

                            {feedback && (
                                <div className="mt-6 p-6 border border-primary-200/50 dark:border-primary-900/30 rounded-2xl bg-gradient-to-br from-primary-50/80 to-emerald-50/80 dark:from-slate-800/90 dark:to-primary-900/20 shadow-sm animate-zoom-in">
                                    <div className="flex items-center gap-3 mb-4 border-b border-primary-100 dark:border-primary-800/30 pb-3">
                                        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                            <LightBulbIcon className="h-6 w-6 text-primary-500" />
                                        </div>
                                        <h5 className="font-bold text-lg text-primary-900 dark:text-primary-100">{t('skills.aiFeedback')}</h5>
                                    </div>
                                    <p className="text-slate-800 dark:text-slate-200 mt-2 whitespace-pre-wrap leading-relaxed text-[15px]">{feedback}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-5 flex flex-wrap justify-between items-center gap-4 border-t border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex gap-2">
                        {onConsultExpert && (
                            <button
                                onClick={onConsultExpert}
                                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold text-sm bg-white dark:bg-slate-800 shadow-sm border border-primary-100 dark:border-primary-900/50 px-4 py-2 rounded-xl transition-all hover:shadow-md hover:scale-105 active:scale-95"
                            >
                                <SparklesIcon className="h-4 w-4" />
                                {t('skills.consultExpert') || 'استشارة الخبير'}
                            </button>
                        )}
                        {scenario && !feedback && (
                            <button
                                onClick={() => fetchScenario(false)}
                                className="flex items-center gap-2 text-slate-600 hover:text-slate-700 font-medium text-sm px-3 py-1.5 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                                <ArrowPathIcon className="h-4 w-4" />
                                {locale === 'ar' ? 'سيناريو جديد' : 'New scenario'}
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="secondary" onClick={onClose}>{t('skills.close')}</Button>
                        {feedback && <Button onClick={handleComplete}>{t('skills.markAsCompleted')}</Button>}
                    </div>
                </div>
            </Card>
        </div>
    );
};

const SpecializationSelectionModal: React.FC<{ specializations: Specialization[]; onSelect: (specialization: string) => void, onClose: () => void }> = ({ specializations, onSelect, onClose }) => {
    const { t, locale } = useI18n();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <Card className="w-full max-w-lg">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('skills.selectSpecializationTitle')}</h3>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-center text-slate-600 dark:text-slate-400">
                        {t('skills.selectSpecializationPrompt')}
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                        {specializations.map(spec => (
                            <Button key={spec.id} variant="secondary" className="w-full !justify-start !p-4 !text-base" onClick={() => onSelect(spec.name[locale])}>
                                {spec.name[locale]}
                            </Button>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
};


interface SkillCardProps {
    skill: Skill;
    isCompleted: boolean;
    onPractice: () => void;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill, isCompleted, onPractice }) => {
    const { locale, t } = useI18n();
    const Icon = iconMap[skill.iconName] || SparklesIcon;
    return (
        <Card className="p-8 flex flex-col justify-between h-full group card-hover border-none ring-1 ring-slate-200/50 dark:ring-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm relative overflow-hidden rounded-3xl">
            {/* Soft decorative background element */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-400 rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
            
            <div className="relative z-10 w-full mb-6">
                <div className="flex items-center justify-center h-20 w-20 rounded-[20px] bg-gradient-to-br from-primary-50 to-primary-100 dark:from-slate-700 dark:to-slate-800 text-primary-500 mx-auto mb-6 shadow-sm border border-primary-100/50 dark:border-slate-600 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-300">
                    <Icon className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white text-center">{skill.title[locale]}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-center mb-6">{skill.description[locale]}</p>
            </div>
            <div className="mt-auto relative z-10">
                {isCompleted ? (
                    <div className="flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm animate-fade-in">
                        <CheckCircleIcon className="h-5 w-5" />
                        <span>{t('skills.completed')}</span>
                    </div>
                ) : (
                    <Button onClick={onPractice} className="w-full !rounded-2xl !py-3.5 shadow-sm group-hover:shadow-md group-hover:bg-primary-600 transition-all font-bold tracking-wide">
                        {t('skills.startPractice')}
                    </Button>
                )}
            </div>
        </Card>
    );
};

interface SkillsSectionProps {
    skills: Skill[];
    completedSkills: number[];
    setCompletedSkills: React.Dispatch<React.SetStateAction<number[]>>;
    specializations: Specialization[];
    user: User | null;
    onConsultExpert?: () => void;
}

const SkillsSection: React.FC<SkillsSectionProps> = ({ skills, completedSkills, setCompletedSkills, specializations, user, onConsultExpert }) => {
    const { t } = useI18n();
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
    const [skillForPractice, setSkillForPractice] = useState<Skill | null>(null);
    const [isSpecializationModalOpen, setIsSpecializationModalOpen] = useState(false);
    const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');


    const handlePractice = (skill: Skill) => {
        setSkillForPractice(skill);
        setIsSpecializationModalOpen(true);
    };

    const handleStartPracticeWithSpecialization = (specialization: string) => {
        if (skillForPractice) {
            setSelectedSpecialization(specialization);
            setSelectedSkill(skillForPractice);
        }
        setIsSpecializationModalOpen(false);
        setSkillForPractice(null);
    };

    const handleCloseModal = () => {
        setSelectedSkill(null);
        setSelectedSpecialization('');
    };

    const handleCompleteSkill = async (skillId: number) => {
        if (!completedSkills.includes(skillId) && user) {
            try {
                const { saveCompletedSkill } = await import('../../services/dataService');
                await saveCompletedSkill(user.id, skillId);
                setCompletedSkills(prev => [...prev, skillId]);
            } catch (err) {
                console.error("Failed to save completed skill:", err);
                throw err;
            }
        }
        setSelectedSkill(null);
        setSelectedSpecialization('');
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">{t('skills.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {skills.map(skill => (
                    <SkillCard
                        key={skill.id}
                        skill={skill}
                        isCompleted={completedSkills.includes(skill.id)}
                        onPractice={() => handlePractice(skill)}
                    />
                ))}
            </div>

            {isSpecializationModalOpen && (
                <SpecializationSelectionModal
                    specializations={specializations}
                    onSelect={handleStartPracticeWithSpecialization}
                    onClose={() => setIsSpecializationModalOpen(false)}
                />
            )}

            {selectedSkill && selectedSpecialization && (
                <SkillPracticeModal
                    skill={selectedSkill}
                    specialization={selectedSpecialization}
                    onClose={handleCloseModal}
                    onComplete={handleCompleteSkill}
                    onConsultExpert={onConsultExpert}
                />
            )}
        </div>
    );
};

export default SkillsSection;