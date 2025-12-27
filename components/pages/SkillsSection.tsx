import React, { useState, useEffect } from 'react';
import { Skill, Specialization, User } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { iconMap, SparklesIcon, CheckCircleIcon, LightBulbIcon, XMarkIcon } from '../common/Icons';
import { useI18n } from '../../contexts/I18nContext';
import { generateSkillScenario, evaluateSkillAnswer } from '../../services/geminiService';

interface SkillPracticeModalProps {
    skill: Skill;
    specialization: string;
    onClose: () => void;
    onComplete: (skillId: number) => Promise<void>;
    onConsultExpert?: () => void;
}

const SkillPracticeModal: React.FC<SkillPracticeModalProps> = ({ skill, specialization, onClose, onComplete, onConsultExpert }) => {
    const { t, locale } = useI18n();
    const [scenario, setScenario] = useState('');
    const [question, setQuestion] = useState('');
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isLoadingScenario, setIsLoadingScenario] = useState(true);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchScenario = async () => {
            setIsLoadingScenario(true);
            setError('');
            try {
                const result = await generateSkillScenario(skill.title[locale], skill.description[locale], specialization);
                setScenario(result.scenario);
                setQuestion(result.question);
            } catch (err) {
                setError(t('skills.errorScenario'));
            } finally {
                setIsLoadingScenario(false);
            }
        };
        fetchScenario();
    }, [skill, specialization, locale, t]);

    const handleEvaluate = async () => {
        if (!userAnswer.trim()) return;
        setIsEvaluating(true);
        setError('');
        setFeedback('');
        try {
            const result = await evaluateSkillAnswer(skill.title[locale], `${scenario}\n${question}`, userAnswer);
            setFeedback(result);
        } catch (err) {
            setError(t('texts.errorEval'));
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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('skills.practiceTitle', { skillName: skill.title[locale] })}</h3>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    {isLoadingScenario && <Spinner />}
                    {error && !scenario && <p className="text-red-500 text-center">{error}</p>}

                    {scenario && (
                        <>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <h4 className="font-bold text-primary-600 dark:text-primary-400 mb-2">{t('skills.scenario')}</h4>
                                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{scenario}</p>
                                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap mt-3 font-semibold">{question}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('skills.yourResponse')}</label>
                                <textarea
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    rows={5}
                                    className="w-full p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary-500"
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
                                <div className="mt-4 p-4 border-s-4 rounded-md bg-green-50 dark:bg-slate-800 border-green-500">
                                    <div className="flex items-center gap-2">
                                        <LightBulbIcon className="h-6 w-6 text-green-500" />
                                        <h5 className="font-bold text-green-800 dark:text-green-300">{t('skills.aiFeedback')}</h5>
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-300 mt-2 whitespace-pre-wrap">{feedback}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex flex-wrap justify-between items-center gap-3 rounded-b-xl border-t border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2">
                        {onConsultExpert && (
                            <button
                                onClick={onConsultExpert}
                                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold text-sm bg-primary-50 dark:bg-primary-900/30 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <SparklesIcon className="h-4 w-4" />
                                {t('skills.consultExpert') || 'استشارة الخبير'}
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
        <Card className="p-6 flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 dark:bg-slate-700 text-primary-500 mx-auto mb-4">
                    <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white text-center">{skill.title[locale]}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-center mb-6">{skill.description[locale]}</p>
            </div>
            <div className="mt-auto">
                {isCompleted ? (
                    <div className="flex items-center justify-center gap-2 p-2 rounded-md bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-semibold">
                        <CheckCircleIcon className="h-5 w-5" />
                        <span>{t('skills.completed')}</span>
                    </div>
                ) : (
                    <Button onClick={onPractice} className="w-full">
                        {t('skills.startPractice')}
                    </Button>
                )}
            </div>
        </Card>
    );
};

interface SkillsSectionProps {
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