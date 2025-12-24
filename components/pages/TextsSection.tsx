
import React, { useState, useRef, useMemo } from 'react';
import { TextData, Question, QuestionType, Skill, DifficultyLevel } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { evaluateAnswer, textToSpeech, decodeBase64, decodeAudioData } from '../../services/geminiService';
import { LightBulbIcon, XMarkIcon, CheckCircleIcon, SpeakerWaveIcon, SparklesIcon, BookOpenIcon, iconMap } from '../common/Icons';
import { useI18n } from '../../contexts/I18nContext';
import ConfirmationModal from '../common/ConfirmationModal';

interface TextsSectionProps {
    texts: TextData[];
    skills: Skill[];
}

const DifficultyBadge: React.FC<{ level: DifficultyLevel }> = ({ level }) => {
    const colors = {
        'مبتدئ': 'bg-green-100 text-green-700 border-green-200',
        'متوسط': 'bg-blue-100 text-blue-700 border-blue-200',
        'متقدم': 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[level]}`}>{level}</span>;
};

const TextsSection: React.FC<TextsSectionProps> = ({ texts, skills }) => {
    const { t, locale } = useI18n();
    const [selectedText, setSelectedText] = useState<TextData | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState('');
    const [isConfirmingClear, setIsConfirmingClear] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [specFilter, setSpecFilter] = useState('');
    const [diffFilter, setDiffFilter] = useState('');

    const filteredTexts = useMemo(() => {
        return texts.filter(text => {
            const matchesSearch = searchTerm.trim() === '' ||
                text.title[locale].toLowerCase().includes(searchTerm.toLowerCase()) ||
                text.content[locale].toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSpec = specFilter === '' || text.specialization.ar === specFilter;
            const matchesDiff = diffFilter === '' || text.difficulty === diffFilter;
            return matchesSearch && matchesSpec && matchesDiff;
        });
    }, [texts, searchTerm, specFilter, diffFilter, locale]);

    const uniqueSpecs = useMemo(() => {
        const specs = new Set<string>();
        texts.forEach(t => specs.add(t.specialization.ar));
        return Array.from(specs);
    }, [texts]);

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
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-grow">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="text-xs bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 py-1 px-3 rounded-full font-medium border border-slate-200 dark:border-slate-600">{selectedText.specialization[locale]}</span>
                                <DifficultyBadge level={selectedText.difficulty} />
                            </div>
                            <h3 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white leading-tight">{selectedText.title[locale]}</h3>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleListen(selectedText.content[locale])}
                            className={`!p-4 shadow-sm hover:shadow-md transition-shadow ${isSpeaking ? 'animate-pulse bg-primary-100 ring-4 ring-primary-50' : ''}`}
                            title={t('texts.listen')}
                        >
                            <SpeakerWaveIcon className={`h-7 w-7 ${isSpeaking ? 'text-primary-600' : ''}`} />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedText.content[locale] }} />
                        </div>

                        <div className="space-y-6">
                            {selectedText.learningObjectives.length > 0 && (
                                <div className="bg-primary-50 dark:bg-primary-900/10 p-5 rounded-2xl border border-primary-100 dark:border-primary-800/50">
                                    <h4 className="font-bold text-primary-900 dark:text-primary-100 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                        <LightBulbIcon className="h-5 w-5" /> {locale === 'ar' ? 'ماذا ستتعلم؟' : 'What will you learn?'}
                                    </h4>
                                    <ul className="space-y-3">
                                        {selectedText.learningObjectives.map((obj, i) => (
                                            <li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                                                <CheckCircleIcon className="h-5 w-5 text-primary-500 flex-shrink-0" />
                                                <span>{obj[locale]}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedText.skillIds.length > 0 && (
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-4 text-sm uppercase tracking-wider">
                                        {locale === 'ar' ? 'المهارات المستهدفة' : 'Targeted Skills'}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedText.skillIds.map(id => {
                                            const skill = skills.find(s => s.id === id);
                                            if (!skill) return null;
                                            const Icon = iconMap[skill.iconName] || SparklesIcon;
                                            return (
                                                <div key={id} className="flex items-center gap-2 bg-white dark:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm border border-slate-100 dark:border-slate-600">
                                                    <Icon className="h-4 w-4 text-primary-500" />
                                                    {skill.title[locale]}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

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
                                            className={`w-full text-start p-4 rounded-xl transition-all duration-300 border-2 ${selectedQuestion?.id === q.id
                                                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 shadow-md transform scale-[1.01]'
                                                : 'bg-white dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center gap-2">
                                                <span className="font-medium text-slate-800 dark:text-slate-200">{q.text[locale]}</span>
                                                {q.cognitiveLevel && (
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded shrink-0">
                                                        {q.cognitiveLevel}
                                                    </span>
                                                )}
                                            </div>
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
                                        className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-800 dark:text-slate-100"
                                        placeholder={t('texts.yourAnswerPlaceholder')}
                                    />
                                )}

                                {selectedQuestion.hint && selectedQuestion.hint[locale] && (
                                    <div className="mt-3 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 italic">
                                        <LightBulbIcon className="h-4 w-4 text-amber-500 mt-0.5" />
                                        <span>{locale === 'ar' ? 'تلميح: ' : 'Hint: '}{selectedQuestion.hint[locale]}</span>
                                    </div>
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t('nav.texts')}</h2>
                <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={() => setSpecFilter('')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border-2 ${specFilter === '' ? 'bg-primary-500 border-primary-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-200'}`}
                >
                    {locale === 'ar' ? 'الكل' : 'All'}
                </button>
                {uniqueSpecs.map(spec => (
                    <button
                        key={spec}
                        onClick={() => setSpecFilter(spec)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border-2 ${specFilter === spec ? 'bg-primary-500 border-primary-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-200'}`}
                    >
                        {spec}
                    </button>
                ))}

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>

                {(['مبتدئ', 'متوسط', 'متقدم'] as DifficultyLevel[]).map(diff => (
                    <button
                        key={diff}
                        onClick={() => setDiffFilter(diffFilter === diff ? '' : diff)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border-2 ${diffFilter === diff ? 'bg-slate-900 border-slate-900 text-white shadow-md dark:bg-white dark:border-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                    >
                        {diff}
                    </button>
                ))}
            </div>

            {filteredTexts.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <BookOpenIcon className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">{locale === 'ar' ? 'لا توجد نتائج تطابق بحثك' : 'No results matching your search'}</p>
                    <button onClick={() => { setSearchTerm(''); setSpecFilter(''); setDiffFilter(''); }} className="mt-4 text-primary-600 font-bold text-sm hover:underline">{locale === 'ar' ? 'مسح التصفية' : 'Clear filters'}</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTexts.map(text => (
                        <Card key={text.id} onClick={() => handleSelectText(text)} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                            <div className="h-2 bg-primary-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                            <div className="p-6">
                                <div className="flex justify-between items-start gap-2 mb-4">
                                    <span className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 py-1 px-2 rounded-lg font-bold uppercase tracking-tight">{text.specialization[locale]}</span>
                                    <DifficultyBadge level={text.difficulty} />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-slate-900 group-hover:text-primary-600 transition-colors dark:text-white line-clamp-2">{text.title[locale]}</h3>
                                <div className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 mb-6" dangerouslySetInnerHTML={{ __html: text.content[locale].replace(/<[^>]*>?/gm, ' ') }}></div>

                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <span className="flex items-center gap-1"><BookOpenIcon className="h-3 w-3" /> {text.questions.length} {locale === 'ar' ? 'أسئلة' : 'Questions'}</span>
                                    <span className="flex items-center gap-1 uppercase">{locale === 'ar' ? 'ابدأ القراءة' : 'Start Reading'} →</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TextsSection;
