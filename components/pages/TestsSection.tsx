import React, { useState, useCallback } from 'react';
import { QuizQuestion, TestContext } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { generateQuiz } from '../../services/geminiService';
import { ArrowPathIcon, BeakerIcon, SparklesIcon } from '../common/Icons';
import { useI18n } from '../../contexts/I18nContext';
import { useAi } from '../../contexts/AiContext';
import { getFallbackQuiz } from '../../data/fallbackData';

interface TestsSectionProps {
    testContexts: TestContext[];
}

const TestsSection: React.FC<TestsSectionProps> = ({ testContexts }) => {
    const { t, locale } = useI18n();
    const { getApiKey } = useAi();
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<string[]>([]);
    const [showScore, setShowScore] = useState(false);
    const [selectedContextId, setSelectedContextId] = useState<string | null>(null);
    const [usedFallback, setUsedFallback] = useState(false);

    // الحصول على السياق المحدد أو الأول
    const selectedContext = testContexts.find(c => c.id === selectedContextId) || testContexts[0];
    const currentContext = selectedContext?.content[locale] || '';
    const currentContextTitle = selectedContext?.title[locale] || '';

    const handleGenerateQuiz = useCallback(async (useFallback: boolean = false) => {
        setIsLoading(true);
        setError('');
        setQuestions([]);
        setUserAnswers([]);
        setCurrentQuestionIndex(0);
        setShowScore(false);
        setUsedFallback(false);

        // إذا طُلب استخدام الـ fallback مباشرة
        if (useFallback) {
            const fallbackQuestions = getFallbackQuiz(selectedContext?.id);
            setQuestions(fallbackQuestions);
            setUsedFallback(true);
            setIsLoading(false);
            return;
        }

        try {
            const apiKey = await getApiKey();

            if (!currentContext || currentContext === 'لا يوجد محتوى لإنشاء اختبار منه.') {
                // لا يوجد محتوى، استخدم الـ fallback
                const fallbackQuestions = getFallbackQuiz(selectedContext?.id);
                setQuestions(fallbackQuestions);
                setUsedFallback(true);
                return;
            }

            const generatedQuestions = await generateQuiz(currentContext, apiKey);

            if (generatedQuestions && generatedQuestions.length > 0) {
                setQuestions(generatedQuestions);
            } else {
                // AI أرجع نتيجة فارغة، استخدم الـ fallback
                const fallbackQuestions = getFallbackQuiz(selectedContext?.id);
                setQuestions(fallbackQuestions);
                setUsedFallback(true);
            }
        } catch (err: any) {
            console.error('Quiz generation error:', err);
            // محاولة استخدام الـ fallback عند الفشل
            const fallbackQuestions = getFallbackQuiz(selectedContext?.id);
            if (fallbackQuestions.length > 0) {
                setQuestions(fallbackQuestions);
                setUsedFallback(true);
                setError(''); // مسح الخطأ لأننا نستخدم الـ fallback
            } else {
                setError(err.message || t('texts.errorQuiz'));
            }
        } finally {
            setIsLoading(false);
        }
    }, [currentContext, selectedContext?.id, t, getApiKey]);

    const handleAnswerSelect = (answer: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = answer;
        setUserAnswers(newAnswers);

        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else {
                setShowScore(true);
            }
        }, 300);
    };

    const calculateScore = () => {
        return questions.reduce((score, question, index) => {
            return score + (question.correctAnswer === userAnswers[index] ? 1 : 0);
        }, 0);
    };

    const getScoreMessage = () => {
        const score = calculateScore();
        const percentage = (score / questions.length) * 100;
        if (percentage >= 80) return locale === 'ar' ? '🎉 ممتاز! أداء رائع!' : '🎉 Excellent! Great performance!';
        if (percentage >= 60) return locale === 'ar' ? '👍 جيد! استمر في التعلم' : '👍 Good! Keep learning';
        return locale === 'ar' ? '💪 حاول مرة أخرى، يمكنك التحسن!' : '💪 Try again, you can improve!';
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t('tests.title')}</h2>
                <div className="flex gap-2">
                    <Button onClick={() => handleGenerateQuiz(false)} isLoading={isLoading}>
                        <SparklesIcon className="h-5 w-5 mx-2" />
                        {questions.length > 0 ? t('tests.generateNew') : t('tests.generateSmart')}
                    </Button>
                </div>
            </div>

            {/* اختيار الموضوع */}
            {testContexts.length > 1 && questions.length === 0 && !isLoading && (
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {locale === 'ar' ? 'اختر موضوع الاختبار:' : 'Choisir le sujet du test:'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {testContexts.map(ctx => (
                            <button
                                key={ctx.id}
                                onClick={() => setSelectedContextId(ctx.id)}
                                className={`px-4 py-2 rounded-lg border-2 transition-all ${(selectedContextId === ctx.id || (!selectedContextId && ctx.id === testContexts[0]?.id))
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                        : 'border-slate-300 dark:border-slate-600 hover:border-primary-300'
                                    }`}
                            >
                                {ctx.title[locale]}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <Card className="p-6 min-h-[400px] flex flex-col justify-center items-center">
                {isLoading && (
                    <div className="text-center">
                        <Spinner />
                        <p className="mt-4 text-slate-500 dark:text-slate-400">
                            {locale === 'ar' ? 'جاري إنشاء الاختبار بالذكاء الاصطناعي...' : 'Generating quiz with AI...'}
                        </p>
                    </div>
                )}

                {error && (
                    <div className="text-center">
                        <p className="text-red-500 mb-4">{error}</p>
                        <div className="flex gap-2 justify-center">
                            <Button onClick={() => handleGenerateQuiz(false)} variant="secondary">
                                <ArrowPathIcon className="h-5 w-5 mx-1" />
                                {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                            </Button>
                            <Button onClick={() => handleGenerateQuiz(true)}>
                                <BeakerIcon className="h-5 w-5 mx-1" />
                                {locale === 'ar' ? 'استخدم اختباراً جاهزاً' : 'Use preset quiz'}
                            </Button>
                        </div>
                    </div>
                )}

                {!isLoading && !error && questions.length === 0 && (
                    <div className="text-center max-w-lg">
                        <BeakerIcon className="h-16 w-16 mx-auto text-primary-400 dark:text-primary-500 mb-4" />
                        <p className="text-slate-600 dark:text-slate-400 text-lg mb-4">
                            {t('tests.startPrompt')}
                        </p>
                        {currentContextTitle && (
                            <details className="mt-4 text-sm text-slate-500 dark:text-slate-400 cursor-pointer text-start">
                                <summary className="font-medium">{t('tests.referenceText')}: {currentContextTitle}</summary>
                                <p className="mt-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-md max-h-48 overflow-y-auto">
                                    {currentContext}
                                </p>
                            </details>
                        )}
                    </div>
                )}

                {!isLoading && questions.length > 0 && !showScore && (
                    <div className="w-full">
                        {usedFallback && (
                            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-300 text-sm">
                                {locale === 'ar'
                                    ? '💡 تم استخدام أسئلة جاهزة. يمكنك المحاولة لاحقاً للحصول على أسئلة مُخصصة بالذكاء الاصطناعي.'
                                    : '💡 Preset questions used. You can try again later for AI-generated questions.'}
                            </div>
                        )}
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {t('tests.questionOf').replace('{current}', String(currentQuestionIndex + 1)).replace('{total}', String(questions.length))}
                        </p>
                        <h3 className="text-2xl font-semibold my-4 text-slate-900 dark:text-white">
                            {questions[currentQuestionIndex].question}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {questions[currentQuestionIndex].options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswerSelect(option)}
                                    className="p-4 w-full text-start bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg hover:bg-primary-50 dark:hover:bg-slate-600 hover:border-primary-500 transition-all duration-200"
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {showScore && (
                    <div className="text-center">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{t('tests.quizComplete')}</h3>
                        <p className="text-xl mt-4 text-slate-600 dark:text-slate-300">
                            {t('tests.yourScore').replace('{score}', String(calculateScore())).replace('{total}', String(questions.length))}
                        </p>
                        <p className="text-lg mt-2">{getScoreMessage()}</p>
                        <div className="flex gap-2 justify-center mt-8">
                            <Button onClick={() => handleGenerateQuiz(false)} isLoading={isLoading}>
                                <SparklesIcon className="h-5 w-5 mx-1" />
                                {t('tests.generateNew')}
                            </Button>
                            <Button onClick={() => {
                                setQuestions([]);
                                setUserAnswers([]);
                                setCurrentQuestionIndex(0);
                                setShowScore(false);
                            }} variant="secondary">
                                {t('tests.retakeQuiz')}
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default TestsSection;