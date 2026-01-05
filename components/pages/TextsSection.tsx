import React, { useState, useRef, useMemo, useEffect } from 'react';
import { TextData, Question, QuestionType, Skill, DifficultyLevel } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Drawer from '../common/Drawer';
import { evaluateAnswer, textToSpeech, decodeBase64, decodeAudioData } from '../../services/geminiService';
import { LightBulbIcon, XMarkIcon, CheckCircleIcon, SpeakerWaveIcon, SparklesIcon, BookOpenIcon, iconMap, ChevronRightIcon, ChevronLeftIcon, PlayCircleIcon } from '../common/Icons';
import { useI18n } from '../../contexts/I18nContext';
import { useAi } from '../../contexts/AiContext';
import ConfirmationModal from '../common/ConfirmationModal';

interface TextsSectionProps {
    texts: TextData[];
    skills: Skill[];
}

const DifficultyBadge: React.FC<{ level: DifficultyLevel }> = ({ level }) => {
    const colors = {
        'مبتدئ': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
        'متوسط': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
        'متقدم': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30'
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${colors[level]} shadow-sm`}>{level}</span>;
};

// Extracted Detail View Component
const TextDetailView: React.FC<{ text: TextData; skills: Skill[] }> = ({ text, skills }) => {
    const { t, locale } = useI18n();
    const { getApiKey } = useAi();
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState('');
    const [isConfirmingClear, setIsConfirmingClear] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            stopAudio();
        };
    }, []);

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
            const apiKey = await getApiKey();
            const base64Audio = await textToSpeech(textToSpeak, apiKey);
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
        if (!userAnswer.trim() || !text || !selectedQuestion) return;

        const isMultipleChoice = selectedQuestion?.options && selectedQuestion.options.length > 0;

        if (isMultipleChoice) {
            const isCorrect = userAnswer === selectedQuestion.correctAnswerId;
            setFeedback(isCorrect ? t('texts.correctAnswer') : t('texts.incorrectAnswer'));
        } else {
            setIsLoading(true);
            setError('');
            setFeedback('');
            try {
                const apiKey = await getApiKey();
                const result = await evaluateAnswer(text.content[locale], selectedQuestion.text[locale], userAnswer.trim(), apiKey);
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

    const groupedQuestions = useMemo(() => {
        return text.questions.reduce((acc, q) => {
            (acc[q.type] = acc[q.type] || []).push(q);
            return acc;
        }, {} as Record<QuestionType, Question[]>);
    }, [text]);

    const isMultipleChoice = selectedQuestion?.options && selectedQuestion.options.length > 0;

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 py-1 px-3 rounded-full font-medium border border-slate-200 dark:border-slate-700">{text.specialization[locale]}</span>
                    <DifficultyBadge level={text.difficulty} />
                </div>
                <div className="flex justify-between items-start gap-4">
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">{text.title[locale]}</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleListen(text.content[locale])}
                        className={`!p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${isSpeaking ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/20' : 'text-slate-500'}`}
                        title={t('texts.listen')}
                    >
                        <SpeakerWaveIcon className={`h-6 w-6 ${isSpeaking ? 'animate-pulse' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Content Section */}
            <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-lg leading-loose font-relaxed bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50" dangerouslySetInnerHTML={{ __html: text.content[locale] }} />

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {text.learningObjectives.length > 0 && (
                    <div className="bg-primary-50/50 dark:bg-primary-900/10 p-5 rounded-2xl border border-primary-100 dark:border-primary-800/30">
                        <h4 className="font-bold text-primary-900 dark:text-primary-100 mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
                            <LightBulbIcon className="h-4 w-4" /> {locale === 'ar' ? 'ماذا ستتعلم؟' : 'What will you learn?'}
                        </h4>
                        <ul className="space-y-2">
                            {text.learningObjectives.map((obj, i) => (
                                <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                                    <CheckCircleIcon className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" />
                                    <span>{obj[locale]}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {text.skillIds.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3 text-xs uppercase tracking-wider">
                            {locale === 'ar' ? 'المهارات المستهدفة' : 'Targeted Skills'}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {text.skillIds.map(id => {
                                const skill = skills.find(s => s.id === id);
                                if (!skill) return null;
                                const Icon = iconMap[skill.iconName] || SparklesIcon;
                                return (
                                    <div key={id} className="flex items-center gap-1.5 bg-white dark:bg-slate-700 px-2.5 py-1 rounded-md text-xs font-medium shadow-sm border border-slate-100 dark:border-slate-600">
                                        <Icon className="h-3.5 w-3.5 text-primary-500" />
                                        {skill.title[locale]}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Interactive Questions */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-xl mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
                        <BookOpenIcon className="h-5 w-5" />
                    </span>
                    {t('texts.interactiveQuestions')}
                </h4>

                <div className="space-y-4">
                    {groupedQuestions && (Object.keys(groupedQuestions) as QuestionType[]).map(type => (
                        <div key={type}>
                            <h5 className="font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-1">{type}</h5>
                            <div className="grid gap-3">
                                {(groupedQuestions[type] || []).map(q => (
                                    <button
                                        key={q.id}
                                        onClick={() => handleSelectQuestion(q)}
                                        className={`w-full text-start p-4 rounded-xl transition-all duration-200 border relative group ${selectedQuestion?.id === q.id
                                            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 shadow-sm'
                                            : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center gap-3">
                                            <span className={`font-medium text-sm ${selectedQuestion?.id === q.id ? 'text-primary-900 dark:text-primary-100' : 'text-slate-700 dark:text-slate-300'}`}>{q.text[locale]}</span>
                                            {q.cognitiveLevel && (
                                                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                                                    {q.cognitiveLevel}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {selectedQuestion && (
                    <div className="mt-8 animate-slide-in-right">
                        <div className="p-1 rounded-2xl bg-gradient-to-br from-primary-500/5 to-blue-500/5 border border-primary-100 dark:border-slate-700">
                            <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl p-6">
                                <h4 className="font-bold text-lg mb-4 text-slate-900 dark:text-white leading-snug">{selectedQuestion.text[locale]}</h4>

                                {isMultipleChoice ? (
                                    <div className="space-y-3">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{t('texts.selectAnswerPrompt')}</p>
                                        {selectedQuestion.options.map(option => (
                                            <label
                                                key={option.id}
                                                className={`flex items-center p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${userAnswer === option.id
                                                    ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-500 shadow-inner'
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                                    }`}
                                            >
                                                <div className={`flex items-center justify-center w-5 h-5 rounded-full border transition-colors ${userAnswer === option.id ? 'border-primary-500 bg-primary-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                                    {userAnswer === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                                </div>
                                                <input
                                                    type="radio"
                                                    name={`question-${selectedQuestion.id}`}
                                                    value={option.id}
                                                    checked={userAnswer === option.id}
                                                    onChange={(e) => setUserAnswer(e.target.value)}
                                                    className="sr-only"
                                                />
                                                <span className="ms-3 text-sm text-slate-700 dark:text-slate-200 font-medium">{option.text[locale]}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <textarea
                                            value={userAnswer}
                                            onChange={(e) => setUserAnswer(e.target.value)}
                                            rows={4}
                                            className="w-full p-4 text-sm border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                                            placeholder={t('texts.yourAnswerPlaceholder')}
                                        />
                                        <div className="absolute bottom-3 end-3 text-xs text-slate-400">{userAnswer.length} chars</div>
                                    </div>
                                )}

                                {selectedQuestion.hint && selectedQuestion.hint[locale] && (
                                    <div className="mt-3 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-800/30">
                                        <LightBulbIcon className="h-4 w-4 shrink-0 mt-0.5" />
                                        <span><span className="font-bold">{locale === 'ar' ? 'تلميح: ' : 'Hint: '}</span>{selectedQuestion.hint[locale]}</span>
                                    </div>
                                )}

                                <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-700/50 pt-6">
                                    {(userAnswer || feedback) ? (
                                        <Button variant="ghost" size="sm" onClick={() => setIsConfirmingClear(true)} className="text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                            {t('texts.clearAnswerButton')}
                                        </Button>
                                    ) : <div></div>}

                                    <Button onClick={handleEvaluate} isLoading={isLoading} disabled={!userAnswer.trim()} className="px-6 rounded-xl">
                                        {isMultipleChoice ? t('texts.checkAnswerButton') : t('texts.evaluateButton')}
                                    </Button>
                                </div>

                                {error && <p className="text-red-500 text-sm mt-3 bg-red-50 p-2 rounded">{error}</p>}

                                {feedback && (
                                    <div className={`mt-6 p-5 rounded-xl border ${feedback === t('texts.correctAnswer')
                                        ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            {feedback === t('texts.correctAnswer')
                                                ? <div className="p-1 rounded-full bg-emerald-100 text-emerald-600"><CheckCircleIcon className="h-5 w-5" /></div>
                                                : <div className="p-1 rounded-full bg-blue-100 text-blue-600"><SparklesIcon className="h-5 w-5" /></div>
                                            }
                                            <h5 className={`font-bold ${feedback === t('texts.correctAnswer') ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-800 dark:text-white'}`}>
                                                {isMultipleChoice ? t('texts.resultTitle') : t('texts.evaluationTitle')}
                                            </h5>
                                        </div>
                                        <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed pl-9">
                                            {feedback}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

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
};

const TextsSection: React.FC<TextsSectionProps> = ({ texts, skills }) => {
    const { t, locale } = useI18n();

    // UI State
    const [selectedText, setSelectedText] = useState<TextData | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

    const handleOpenText = (text: TextData) => {
        setSelectedText(text);
        setIsDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        // Optional: clear selected text after animation to save memory, implies setTimeout
        // But for now keeping it is fine for ensuring content doesn't flash empty on close
    };

    return (
        <div className="space-y-8 min-h-[600px]">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">{t('nav.texts')}</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-md">{t('texts.selectQuestionPrompt')}</p>
                </div>

                <div className="w-full md:w-auto relative group">
                    <input
                        type="text"
                        placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-80 pl-10 pr-10 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm shadow-sm group-hover:shadow-md"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSpecFilter('')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${specFilter === '' ? 'bg-slate-900 text-white shadow-lg ring-2 ring-slate-900 ring-offset-2 dark:bg-white dark:text-slate-900 dark:ring-white dark:ring-offset-slate-900' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
                    >
                        {locale === 'ar' ? 'الكل' : 'All'}
                    </button>
                    {uniqueSpecs.map(spec => (
                        <button
                            key={spec}
                            onClick={() => setSpecFilter(spec)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${specFilter === spec ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-slate-900' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
                        >
                            {spec}
                        </button>
                    ))}
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                <div className="flex flex-wrap gap-2">
                    {(['مبتدئ', 'متوسط', 'متقدم'] as DifficultyLevel[]).map(diff => (
                        <button
                            key={diff}
                            onClick={() => setDiffFilter(diffFilter === diff ? '' : diff)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${diffFilter === diff ? 'bg-slate-100 border-slate-300 text-slate-900 dark:bg-slate-700 dark:border-slate-500 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            {diff}
                        </button>
                    ))}
                </div>
            </div>

            {filteredTexts.length === 0 ? (
                <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700/50">
                    <div className="bg-white dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <BookOpenIcon className="h-10 w-10 text-slate-300" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{locale === 'ar' ? 'لا توجد نتائج تطابق بحثك' : 'No results matching your search'}</p>
                    <button onClick={() => { setSearchTerm(''); setSpecFilter(''); setDiffFilter(''); }} className="mt-4 text-primary-600 font-bold text-sm hover:underline">{locale === 'ar' ? 'مسح التصفية' : 'Clear filters'}</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTexts.map(text => (
                        <Card
                            key={text.id}
                            onClick={() => handleOpenText(text)}
                            className="group relative hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden cursor-pointer h-full border border-slate-100 dark:border-slate-700/50 hover:border-primary-200/50 dark:hover:border-primary-900/50"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>

                            <div className="p-6 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 py-1 px-2 rounded-md">{text.specialization[locale]}</span>
                                    <DifficultyBadge level={text.difficulty} />
                                </div>

                                <h3 className="text-xl font-bold mb-3 text-slate-900 group-hover:text-primary-600 transition-colors dark:text-white line-clamp-2 leading-tight">
                                    {text.title[locale]}
                                </h3>

                                <div className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 mb-6 leading-relaxed opacity-80" dangerouslySetInnerHTML={{ __html: text.content[locale].replace(/<[^>]*>?/gm, ' ') }}></div>

                                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                                        <BookOpenIcon className="h-4 w-4" />
                                        <span>{text.questions.length} {locale === 'ar' ? 'أسئلة' : 'Questions'}</span>
                                    </div>
                                    <div className={`p-2 rounded-full bg-slate-50 text-slate-400 group-hover:bg-primary-500 group-hover:text-white transition-all duration-300 transform ${locale === 'ar' ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}>
                                        {locale === 'ar' ? <ChevronLeftIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Side Drawer for Details */}
            <Drawer
                isOpen={isDrawerOpen}
                onClose={handleCloseDrawer}
                title={selectedText?.title[locale]}
                side={locale === 'ar' ? 'right' : 'right'}
                size="xl"
            >
                {selectedText && (
                    <TextDetailView text={selectedText} skills={skills} />
                )}
            </Drawer>
        </div>
    );
};

export default TextsSection;
