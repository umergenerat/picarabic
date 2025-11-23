import React, { useState, useCallback } from 'react';
import { QuizQuestion, TestContext } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { generateQuiz } from '../../services/geminiService';
import { ArrowPathIcon } from '../common/Icons';
import { useI18n } from '../../contexts/I18nContext';

interface TestsSectionProps {
    testContexts: TestContext[];
}

const TestsSection: React.FC<TestsSectionProps> = ({ testContexts }) => {
    const { t, locale } = useI18n();
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<string[]>([]);
    const [showScore, setShowScore] = useState(false);
    
    const sampleContext = testContexts[0]?.content[locale] || 'لا يوجد محتوى لإنشاء اختبار منه.';
    const sampleContextTitle = testContexts[0]?.title[locale] || 'اختبار عام';

    const handleGenerateQuiz = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setQuestions([]);
        setUserAnswers([]);
        setCurrentQuestionIndex(0);
        setShowScore(false);
        try {
            const generatedQuestions = await generateQuiz(sampleContext);
            setQuestions(generatedQuestions);
        } catch (err: any) {
            setError(err.message || t('texts.errorQuiz'));
        } finally {
            setIsLoading(false);
        }
    }, [sampleContext, t]);

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

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t('tests.title')}</h2>
                <Button onClick={handleGenerateQuiz} isLoading={isLoading}>
                    <ArrowPathIcon className="h-5 w-5 mx-2"/>
                    {questions.length > 0 ? t('tests.generateNew') : t('tests.generateSmart')}
                </Button>
            </div>

            <Card className="p-6 min-h-[400px] flex flex-col justify-center items-center">
                {isLoading && <Spinner />}
                {error && <p className="text-red-500">{error}</p>}
                
                {!isLoading && !error && questions.length === 0 && (
                    <div className="text-center">
                        <p className="text-slate-500 dark:text-slate-400">{t('tests.startPrompt')}</p>
                        <details className="mt-4 text-sm text-slate-500 dark:text-slate-400 cursor-pointer">
                            <summary>{t('tests.referenceText')}: {sampleContextTitle}</summary>
                            <p className="mt-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-md text-start">{sampleContext}</p>
                        </details>
                    </div>
                )}

                {!isLoading && questions.length > 0 && !showScore && (
                    <div className="w-full">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('tests.questionOf').replace('{current}', String(currentQuestionIndex + 1)).replace('{total}', String(questions.length))}</p>
                        <h3 className="text-2xl font-semibold my-4 text-slate-900 dark:text-white">{questions[currentQuestionIndex].question}</h3>
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
                        <Button onClick={handleGenerateQuiz} isLoading={isLoading} className="mt-8">
                           {t('tests.retakeQuiz')}
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default TestsSection;