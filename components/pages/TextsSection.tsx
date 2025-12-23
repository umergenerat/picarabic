
import React, { useState, useRef } from 'react';
import { TextData, Question, QuestionType } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { evaluateAnswer, textToSpeech, decodeBase64, decodeAudioData } from '../../services/geminiService';
import { LightBulbIcon, XMarkIcon, CheckCircleIcon, SpeakerWaveIcon } from '../common/Icons';
import { useI18n } from '../../contexts/I18nContext';
import ConfirmationModal from '../common/ConfirmationModal';

interface TextsSectionProps {
    texts: TextData[];
}

const TextsSection: React.FC<TextsSectionProps> = ({ texts }) => {
    const { t, locale } = useI18n();
    const [selectedText, setSelectedText] = useState<TextData | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState('');
    const [isConfirmingClear, setIsConfirmingClear] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const handleSelectText = (text: TextData) => {
        setSelectedText(text);
        setSelectedQuestion(null);
        setUserAnswer('');
        setFeedback('');
        setError('');
        stopAudio();
    }

    const stopAudio = () => {
        if (currentSourceRef.current) {
            currentSourceRef.current.stop();
            currentSourceRef.current = null;
        }
        setIsSpeaking(false);
    };

    const handleListen = async (textToSpeak: string) => {
        if (isSpeaking) {
            stopAudio();
            return;
        }

        setIsSpeaking(true);
        try {
            const base64Audio = await textToSpeech(textToSpeak);
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const audioData = decodeBase64(base64Audio);
            const audioBuffer = await decodeAudioData(audioData, audioContextRef.current);

            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.onended = () => setIsSpeaking(false);
            source.start();
            currentSourceRef.current = source;
        } catch (err: any) {
            console.error("Audio error:", err);
            setError(t('texts.errorAudio'));
            setIsSpeaking(false);
        }
    };

    const handleSelectQuestion = (question: Question) => {
        setSelectedQuestion(question);
        setUserAnswer('');
        setFeedback('');
        setError('');
    };

    const handleEvaluate = async () => {
        if (!userAnswer.trim() || !selectedText || !selectedQuestion) return;

        const isMultipleChoice = selectedQuestion?.options && selectedQuestion.options.length > 0;

        if (isMultipleChoice) {
            const isCorrect = userAnswer === selectedQuestion.correctAnswerId;
            setFeedback(isCorrect ? t('texts.correctAnswer') : t('texts.incorrectAnswer'));
        } else {
            setIsLoading(true);
            setError('');
            setFeedback('');
            try {
                const result = await evaluateAnswer(selectedText.content[locale], selectedQuestion.text[locale], userAnswer.trim());
                setFeedback(result);
            } catch (err: any) {
                setError(err.message || t('texts.errorEval'));
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleClearAnswer = () => {
        setUserAnswer('');
        setFeedback('');
        setError('');
        setIsConfirmingClear(false);
    };

    if (selectedText) {
        const groupedQuestions = selectedText.questions.reduce((acc, q) => {
            (acc[q.type] = acc[q.type] || []).push(q);
            return acc;
        }, {} as Record<QuestionType, Question[]>);

        const isMultipleChoice = selectedQuestion?.options && selectedQuestion.options.length > 0;

        return (
            <div>
                <Button variant="secondary" onClick={() => handleSelectText(null)} className="mb-4">
                    {locale === 'ar' ? '→' : '←'} {t('texts.backToList')}
                </Button>
                <Card className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-sm bg-primary-100 text-primary-800 dark:bg-slate-700 dark:text-primary-300 py-1 px-3 rounded-full">{selectedText.specialization[locale]}</span>
                            <h3 className="text-2xl font-bold mt-3 mb-4 text-slate-900 dark:text-white">{selectedText.title[locale]}</h3>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleListen(selectedText.content[locale])}
                            className={`!p-3 ${isSpeaking ? 'animate-pulse bg-primary-100' : ''}`}
                            title={t('texts.listen')}
                        >
                            <SpeakerWaveIcon className={`h-6 w-6 ${isSpeaking ? 'text-primary-600' : ''}`} />
                        </Button>
                    </div>
                    <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed mt-4" dangerouslySetInnerHTML={{ __html: selectedText.content[locale] }} />

                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-xl mb-4 text-slate-900 dark:text-white">{t('texts.interactiveQuestions')}</h4>
                        <p className="text-sm text-slate-500 mb-4">{t('texts.selectQuestionPrompt')}</p>

                        {groupedQuestions && (Object.keys(groupedQuestions) as QuestionType[]).map(type => (
                            <div key={type} className="mb-4">
                                <h5 className="font-semibold text-md text-primary-600 dark:text-primary-400 mb-2">{type}</h5>
                                <div className="space-y-2">
                                    {(groupedQuestions[type] || []).map(q => (
                                        <button
                                            key={q.id}
                                            onClick={() => handleSelectQuestion(q)}
                                            className={`w-full text-start p-3 rounded-lg transition-all duration-200 text-slate-800 dark:text-slate-200 ${selectedQuestion?.id === q.id
                                                    ? 'bg-primary-100 dark:bg-slate-700 ring-2 ring-primary-500 shadow-md'
                                                    : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                                                }`}
                                        >
                                            {q.text[locale]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {selectedQuestion && (
                            <div className="mt-6 pt-6 border-t border-dashed border-slate-300 dark:border-slate-600">
                                <h4 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">{selectedQuestion.text[locale]}</h4>

                                {isMultipleChoice ? (
                                    <div className="space-y-3 mt-4">
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('texts.selectAnswerPrompt')}</p>
                                        {selectedQuestion.options.map(option => (
                                            <label
                                                key={option.id}
                                                htmlFor={`option-${option.id}`}
                                                className={`flex items-center p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${userAnswer === option.id
                                                        ? 'bg-primary-50 dark:bg-slate-700 border-primary-500'
                                                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    id={`option-${option.id}`}
                                                    name={`question-${selectedQuestion.id}`}
                                                    value={option.id}
                                                    checked={userAnswer === option.id}
                                                    onChange={(e) => setUserAnswer(e.target.value)}
                                                    className="h-4 w-4 text-primary-600 border-slate-400 focus:ring-primary-500"
                                                />
                                                <span className="ms-3 text-slate-800 dark:text-slate-200">{option.text[locale]}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <textarea
                                        value={userAnswer}
                                        onChange={(e) => setUserAnswer(e.target.value)}
                                        rows={4}
                                        className="w-full p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                                        placeholder={t('texts.yourAnswerPlaceholder')}
                                    />
                                )}

                                <div className="mt-4 flex items-center gap-2">
                                    <Button onClick={handleEvaluate} isLoading={isLoading} disabled={!userAnswer.trim()}>
                                        {isMultipleChoice ? t('texts.checkAnswerButton') : t('texts.evaluateButton')}
                                    </Button>
                                    {(userAnswer || feedback) && (
                                        <Button variant="secondary" onClick={() => setIsConfirmingClear(true)}>
                                            <XMarkIcon className="h-5 w-5 me-2" />
                                            {t('texts.clearAnswerButton')}
                                        </Button>
                                    )}
                                </div>
                                {error && <p className="text-red-500 mt-2">{error}</p>}
                                {isLoading && <Spinner size="sm" />}
                                {feedback && (
                                    <div className={`mt-4 p-4 border-s-4 rounded-md bg-green-50 dark:bg-slate-800 border-green-500`}>
                                        <div className="flex items-center gap-2">
                                            {feedback === t('texts.correctAnswer') ? <CheckCircleIcon className="h-6 w-6 text-green-500" /> : <LightBulbIcon className="h-6 w-6 text-green-500" />}
                                            <h5 className="font-bold text-green-800 dark:text-green-300">
                                                {isMultipleChoice ? t('texts.resultTitle') : t('texts.evaluationTitle')}
                                            </h5>
                                        </div>
                                        <p className="text-slate-700 dark:text-slate-300 mt-2 whitespace-pre-wrap">{feedback}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Card>
                {isConfirmingClear && (
                    <ConfirmationModal
                        title={t('texts.clearConfirmation.title')}
                        message={t('texts.clearConfirmation.message')}
                        onConfirm={handleClearAnswer}
                        onCancel={() => setIsConfirmingClear(false)}
                        confirmButtonText={t('texts.clearConfirmation.confirm')}
                    />
                )}
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">{t('nav.texts')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {texts.map(text => (
                    <Card key={text.id} onClick={() => handleSelectText(text)}>
                        <div className="p-6">
                            <span className="text-xs bg-primary-100 text-primary-800 dark:bg-slate-700 dark:text-primary-300 py-1 px-2 rounded-full">{text.specialization[locale]}</span>
                            <h3 className="text-xl font-bold mt-3 mb-2 text-slate-900 dark:text-white">{text.title[locale]}</h3>
                            <div className="text-slate-600 dark:text-slate-400 h-20 overflow-hidden text-ellipsis" dangerouslySetInnerHTML={{ __html: text.content[locale].replace(/<[^>]*>?/gm, ' ') }}></div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default TextsSection;
