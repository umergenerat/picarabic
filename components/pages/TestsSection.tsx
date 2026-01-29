import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { CheckCircleIcon, XMarkIcon, ClockIcon, ArrowPathIcon, ExclamationTriangleIcon, AcademicCapIcon, SparklesIcon } from '../common/Icons';
import { TextData, Skill, TestContext, Question, QuizResult } from '../../types';
import { useI18n } from '../../contexts/I18nContext';
import { useAi } from '../../contexts/AiContext';
import * as aiService from '../../services/geminiService';
import Spinner from '../common/Spinner';

interface TestsSectionProps {
    texts: TextData[];
    skills: Skill[];
}

const TestsSection: React.FC<TestsSectionProps> = ({ texts, skills }) => {
    const { t, locale } = useI18n();
    const { generateQuiz, isLoading: isAiLoading, error: aiError } = useAi();

    const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
    const [selectedContext, setSelectedContext] = useState<any>({ type: 'general' });
    const [currentQuiz, setCurrentQuiz] = useState<Question[] | null>(null);
    const [userAnswers, setUserAnswers] = useState<{ [questionId: string]: string }>({});
    const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
    const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
    const [timer, setTimer] = useState<number>(0);
    const [isQuizActive, setIsQuizActive] = useState(false);

    // Timer effect
    useEffect(() => {
        let interval: any;
        if (isQuizActive) {
            interval = setInterval(() => {
                setTimer((prev) => prev + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isQuizActive]);

    const handleGenerateQuiz = async () => {
        setIsQuizActive(false);
        setQuizResult(null);
        setUserAnswers({});
        setTimer(0);

        try {
            // Prepare context with readable titles for AI
            const contextForAi = { ...selectedContext };
            if (selectedContext.type === 'text' && selectedContext.textId) {
                const text = texts.find(t => t.id === selectedContext.textId);
                if (text) {
                    contextForAi.textTitle = text.title[locale] || text.title.ar;
                    contextForAi.objectives = text.learningObjectives.map(obj => obj[locale] || obj.ar);
                }
            } else if (selectedContext.type === 'skill' && selectedContext.skillId) {
                const skill = skills.find(s => s.id === selectedContext.skillId);
                if (skill) {
                    contextForAi.skillTitle = skill.title[locale] || skill.title.ar;
                    contextForAi.description = skill.description[locale] || skill.description.ar;
                }
            }

            const questions = await generateQuiz(contextForAi);
            if (questions && questions.length > 0) {
                setCurrentQuiz(questions);
                setIsQuizActive(true);
            }
        } catch (err) {
            console.error(t('tests.generationError'), err);
        }
    };

    const handleAnswerSelect = (questionId: string, optionId: string) => {
        setUserAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const handleSubmitQuiz = () => {
        if (!currentQuiz) return;

        setIsQuizActive(false);
        let correctCount = 0;

        currentQuiz.forEach(q => {
            if (q.correctAnswerId && userAnswers[q.id] === q.correctAnswerId) {
                correctCount++;
            }
        });

        const score = (correctCount / currentQuiz.length) * 100;
        const result: QuizResult = {
            id: `res-${Date.now()}`,
            date: new Date().toISOString(),
            score,
            totalQuestions: currentQuiz.length,
            correctAnswers: correctCount,
            context: selectedContext,
            timeSpentSeconds: timer
        };

        setQuizResult(result);
        setQuizHistory(prev => [result, ...prev]);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="container mx-auto max-w-5xl px-4 pb-20 space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-4">
                <div className="inline-flex p-3 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 mb-2 shadow-inner">
                    <AcademicCapIcon className="h-8 w-8" />
                </div>
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300">
                    {t('tests.title')}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    {t('tests.description')}
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-center border-b border-slate-200 dark:border-slate-700 mb-8">
                <button
                    onClick={() => setActiveTab('generate')}
                    className={`pb-4 px-6 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'generate'
                        ? 'text-primary-600'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
                        }`}
                >
                    {t('tests.newTest')}
                    {activeTab === 'generate' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-4 px-6 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'history'
                        ? 'text-primary-600'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
                        }`}
                >
                    {t('tests.history')}
                    {activeTab === 'history' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-t-full" />
                    )}
                </button>
            </div>

            {activeTab === 'generate' && (
                <div className="space-y-8 animate-fade-in">
                    {!isQuizActive && !quizResult ? (
                        <Card className="glass-panel border-none shadow-soft max-w-3xl mx-auto p-6 sm:p-8">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <SparklesIcon className="h-6 w-6 text-amber-500" />
                                <span>{t('tests.configureTest')}</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                                        {t('tests.typeLabel')}
                                    </label>
                                    <div className="space-y-4">
                                        {[
                                            { id: 'general', label: t('tests.general'), icon: SparklesIcon },
                                            { id: 'text', label: t('tests.basedOnText'), icon: AcademicCapIcon },
                                            { id: 'skill', label: t('tests.basedOnSkill'), icon: CheckCircleIcon }
                                        ].map((type) => (
                                            <div
                                                key={type.id}
                                                onClick={() => setSelectedContext({ type: type.id })}
                                                className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${selectedContext.type === type.id
                                                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 shadow-glow ring-4 ring-primary-500/10'
                                                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                                                    }`}
                                            >
                                                <div className={`p-3 rounded-xl transition-colors ${selectedContext.type === type.id ? 'bg-primary-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                                    <type.icon className="h-6 w-6" />
                                                </div>
                                                <span className={`font-bold text-base ${selectedContext.type === type.id ? 'text-primary-700 dark:text-primary-300' : 'text-slate-600 dark:text-slate-400'}`}>
                                                    {type.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {selectedContext.type === 'text' && (
                                        <div className="animate-slide-in-right">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('tests.selectText')}</label>
                                            <select
                                                className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:bg-slate-800 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-slate-700 dark:text-slate-200"
                                                onChange={(e) => setSelectedContext({ ...selectedContext, textId: e.target.value })}
                                                value={selectedContext.textId || ''}
                                            >
                                                <option value="">-- {t('tests.selectText')} --</option>
                                                {texts.map(t => (
                                                    <option key={t.id} value={t.id}>{t.title[locale]}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {selectedContext.type === 'skill' && (
                                        <div className="animate-slide-in-right">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('tests.selectSkill')}</label>
                                            <select
                                                className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:bg-slate-800 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-slate-700 dark:text-slate-200"
                                                onChange={(e) => setSelectedContext({ ...selectedContext, skillId: Number(e.target.value) })}
                                                value={selectedContext.skillId || ''}
                                            >
                                                <option value="">-- {t('tests.selectSkill')} --</option>
                                                {skills.map(s => (
                                                    <option key={s.id} value={s.id}>{s.title[locale]}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                                        <div className="flex gap-3 text-amber-600 dark:text-amber-400 mb-3">
                                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                                <ExclamationTriangleIcon className="h-5 w-5" />
                                            </div>
                                            <span className="text-sm font-black mt-1">{t('tests.importantNote')}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                            {t('tests.aiNote')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleGenerateQuiz}
                                isLoading={isAiLoading}
                                disabled={
                                    (selectedContext.type === 'text' && !selectedContext.textId) ||
                                    (selectedContext.type === 'skill' && !selectedContext.skillId)
                                }
                                fullWidth
                                size="lg"
                                className="shadow-2xl shadow-primary-500/30 py-4 h-16 text-lg tracking-wide rounded-[2rem]"
                            >
                                <SparklesIcon className="h-6 w-6 mx-3 animate-pulse" />
                                {t('tests.startTest')}
                            </Button>

                            {aiError && (
                                <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 animate-pulse">
                                    <ExclamationTriangleIcon className="h-5 w-5" />
                                    <span>{aiError}</span>
                                </div>
                            )}
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {/* Quiz Interface */}
                            {currentQuiz && !quizResult && (
                                <div className="animate-fade-in">
                                    <div className="flex justify-between items-center mb-6 sticky top-20 bg-slate-50 dark:bg-slate-900 z-20 py-4 px-2 backdrop-blur-sm bg-opacity-90">
                                        <div className="flex items-center gap-2 text-primary-600 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm">
                                            <ClockIcon className="h-5 w-5" />
                                            <span className="font-bold font-mono text-lg">{formatTime(timer)}</span>
                                        </div>
                                        <div className="text-sm font-bold text-slate-500">
                                            سؤال {Object.keys(userAnswers).length} / {currentQuiz.length}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {currentQuiz.map((question, idx) => (
                                            <Card key={question.id} className="p-6 sm:p-8 glass-panel border-none shadow-soft transition-all hover:shadow-lg">
                                                <div className="flex gap-4">
                                                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary-100 text-primary-700 rounded-full font-bold text-sm">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="flex-grow space-y-4">
                                                        <h3 className="text-lg font-bold leading-relaxed">{question.text[locale]}</h3>

                                                        {question.options && (
                                                            <div className="grid grid-cols-1 gap-3 mt-4">
                                                                {question.options.map(option => (
                                                                    <label
                                                                        key={option.id}
                                                                        className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${userAnswers[question.id] === option.id
                                                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md transform scale-[1.01]'
                                                                            : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300'
                                                                            }`}
                                                                    >
                                                                        <input
                                                                            type="radio"
                                                                            name={question.id}
                                                                            value={option.id}
                                                                            checked={userAnswers[question.id] === option.id}
                                                                            onChange={() => handleAnswerSelect(question.id, option.id)}
                                                                            className="hidden"
                                                                        />
                                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center me-3 flex-shrink-0 ${userAnswers[question.id] === option.id ? 'border-primary-500' : 'border-slate-300'
                                                                            }`}>
                                                                            {userAnswers[question.id] === option.id && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                                                                        </div>
                                                                        <span className="text-sm font-medium">{option.text[locale]}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>

                                    <div className="sticky bottom-4 z-20 mt-8 flex justify-end">
                                        <Button
                                            onClick={handleSubmitQuiz}
                                            size="lg"
                                            className="shadow-xl"
                                            disabled={Object.keys(userAnswers).length < currentQuiz.length}
                                        >
                                            {t('tests.submitAnswers')} ({Object.keys(userAnswers).length}/{currentQuiz.length})
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Quiz Results */}
                            {quizResult && (
                                <Card className="glass-panel border-none shadow-soft text-center p-8 sm:p-12 animate-in zoom-in-95 duration-300">
                                    <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 shadow-xl ${quizResult.score >= 50 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                        }`}>
                                        {quizResult.score >= 50 ? <CheckCircleIcon className="h-12 w-12" /> : <XMarkIcon className="h-12 w-12" />}
                                    </div>

                                    <h3 className="text-3xl font-extrabold mb-2">
                                        {quizResult.score >= 50 ? 'أحسنت!' : 'حاول مرة أخرى'}
                                    </h3>
                                    <p className="text-slate-500 mb-8 max-w-md mx-auto">
                                        {quizResult.score >= 50
                                            ? 'لقد أتممت الاختبار بنجاح. استمر في التقدم!'
                                            : 'لا بأس، الممارسة ستجعلك أفضل. راجع إجاباتك وحاول مجدداً.'}
                                    </p>

                                    <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                            <div className="text-sm text-slate-500 mb-1">النتيجة</div>
                                            <div className={`text-2xl font-bold ${quizResult.score >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                                                {Math.round(quizResult.score)}%
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                            <div className="text-sm text-slate-500 mb-1">الإجابات الصحيحة</div>
                                            <div className="text-2xl font-bold text-slate-800 dark:text-white">
                                                {quizResult.correctAnswers}/{quizResult.totalQuestions}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                            <div className="text-sm text-slate-500 mb-1">الوقت المستغرق</div>
                                            <div className="text-2xl font-bold text-slate-800 dark:text-white font-mono">
                                                {formatTime(quizResult.timeSpentSeconds)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-center gap-4">
                                        <Button onClick={() => setQuizResult(null)} variant="secondary">
                                            مراجعة الإجابات
                                        </Button>
                                        <Button onClick={handleGenerateQuiz} variant="primary">
                                            <ArrowPathIcon className="h-4 w-4 mx-2" />
                                            اختبار جديد
                                        </Button>
                                    </div>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-4">
                    {quizHistory.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <ClockIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>لم تقم بأي اختبارات بعد</p>
                        </div>
                    ) : (
                        quizHistory.map(res => (
                            <Card key={res.id} className="p-4 flex justify-between items-center glass-panel border-none shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl font-bold text-lg ${res.score >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {Math.round(res.score)}%
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 dark:text-white">
                                            {res.context.type === 'general' ? 'اختبار عام' :
                                                res.context.type === 'text' ? 'اختبار نص' : 'اختبار مهارة'}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {new Date(res.date).toLocaleDateString('ar-MA')} • {formatTime(res.timeSpentSeconds)}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm text-slate-500">
                                    {res.correctAnswers} / {res.totalQuestions} صحيح
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default TestsSection;