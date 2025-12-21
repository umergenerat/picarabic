
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Card from '../common/Card';
import { 
    DocumentTextIcon, UsersIcon, ChartPieIcon, Cog6ToothIcon, PencilIcon, TrashIcon, 
    ArrowUpTrayIcon, ArrowDownTrayIcon, XMarkIcon,
    BookOpenIcon, SparklesIcon, PresentationChartBarIcon, BeakerIcon, iconMap, MagnifyingGlassIcon,
    PlusCircleIcon, ExclamationTriangleIcon, LinkIcon, ChatBubbleLeftRightIcon, Bars3Icon,
    AcademicCapIcon, CheckCircleIcon
} from '../common/Icons';
import ChangePasswordModal from '../auth/ChangePasswordModal';
import { useI18n } from '../../contexts/I18nContext';
import { getUsers, addUser, updateUser, deleteUser, deleteMultipleUsers } from '../../services/authService';
import Spinner from '../common/Spinner';
import ConfirmationModal from '../common/ConfirmationModal';
import { TextData, PlatformUser, UserRole, Skill, Team, TestContext, Question, QuestionType, ProgressDataPoint, MultilingualString, ChatChannel, Resource, AnswerOption, Specialization } from '../../types';
import Button from '../common/Button';

// --- Simple Chart Components ---

const SimpleLineChart: React.FC<{ data: any[], lines: { key: string, color: string, name: string }[], height?: number }> = ({ data, lines, height = 300 }) => {
    if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-slate-400">لا توجد بيانات</div>;

    const padding = 40;
    const width = 800; 
    const chartHeight = height;
    const effectiveWidth = width - padding * 2;
    const effectiveHeight = chartHeight - padding * 2;

    const xStep = effectiveWidth / (data.length - 1 || 1);
    
    const allValues = data.flatMap(d => lines.map(l => Number(d[l.key] || 0)));
    const maxValue = Math.max(...allValues, 10) * 1.1;

    const getY = (val: number) => chartHeight - padding - (val / maxValue) * effectiveHeight;
    const getX = (idx: number) => padding + idx * xStep;

    return (
        <div className="w-full h-full overflow-hidden">
             <div className="flex flex-wrap justify-center gap-4 mb-4">
                {lines.map(line => (
                    <div key={line.key} className="flex items-center text-sm">
                        <span className="w-3 h-3 rounded-full me-2" style={{ backgroundColor: line.color }}></span>
                        <span className="text-slate-600 dark:text-slate-300">{line.name}</span>
                    </div>
                ))}
            </div>

            <svg viewBox={`0 0 ${width} ${chartHeight}`} className="w-full h-auto" style={{ maxHeight: height }}>
                {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
                    <line 
                        key={tick}
                        x1={padding} 
                        y1={getY(maxValue * tick)} 
                        x2={width - padding} 
                        y2={getY(maxValue * tick)} 
                        stroke="#e2e8f0" 
                        strokeWidth="1" 
                        className="dark:stroke-slate-700"
                    />
                ))}

                {data.map((d, i) => (
                    <text 
                        key={i} 
                        x={getX(i)} 
                        y={chartHeight - 10} 
                        textAnchor="middle" 
                        fontSize="12" 
                        className="fill-slate-500 dark:fill-slate-400"
                    >
                        {typeof d.month === 'string' ? d.month.substring(0, 3) : i}
                    </text>
                ))}

                {lines.map(line => {
                    const points = data.map((d, i) => `${getX(i)},${getY(Number(d[line.key] || 0))}`).join(' ');
                    return (
                        <g key={line.key}>
                            <polyline 
                                fill="none" 
                                stroke={line.color} 
                                strokeWidth="3" 
                                points={points} 
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                             {data.map((d, i) => (
                                <circle 
                                    key={i}
                                    cx={getX(i)} 
                                    cy={getY(Number(d[line.key] || 0))} 
                                    r="4" 
                                    fill={line.color} 
                                    stroke="white"
                                    strokeWidth="2"
                                    className="dark:stroke-slate-800"
                                />
                             ))}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

const SimplePieChart: React.FC<{ data: { name: string, value: number, color: string }[] }> = ({ data }) => {
    if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-slate-400">لا توجد بيانات</div>;

    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;

    const gradientParts = data.map(item => {
        const percentage = (item.value / total) * 100;
        const start = currentAngle;
        const end = currentAngle + percentage;
        currentAngle = end;
        return `${item.color} ${start}% ${end}%`;
    });
    
    const gradientString = `conic-gradient(${gradientParts.join(', ')})`;

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div 
                className="w-48 h-48 rounded-full shadow-inner relative"
                style={{ background: gradientString }}
            >
                <div className="absolute inset-0 m-auto w-24 h-24 bg-white dark:bg-slate-800 rounded-full"></div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 mt-6">
                {data.map(item => (
                    <div key={item.name} className="flex items-center text-sm">
                        <span className="w-3 h-3 rounded-full me-2" style={{ backgroundColor: item.color }}></span>
                        <span className="text-slate-600 dark:text-slate-300">{item.name} ({Math.round((item.value / total) * 100)}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

type AdminTab = 'content' | 'users' | 'reports' | 'settings';

interface AdminPageProps {
    texts: TextData[];
    setTexts: React.Dispatch<React.SetStateAction<TextData[]>>;
    skills: Skill[];
    setSkills: React.Dispatch<React.SetStateAction<Skill[]>>;
    teams: Team[];
    setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
    testContexts: TestContext[];
    setTestContexts: React.Dispatch<React.SetStateAction<TestContext[]>>;
    chatChannels: ChatChannel[];
    setChatChannels: React.Dispatch<React.SetStateAction<ChatChannel[]>>;
    resources: Resource[];
    setResources: React.Dispatch<React.SetStateAction<Resource[]>>;
    specializations: Specialization[];
    setSpecializations: React.Dispatch<React.SetStateAction<Specialization[]>>;
    logoSrc: string | null;
    setLogoSrc: React.Dispatch<React.SetStateAction<string | null>>;
    progressData: ProgressDataPoint[];
    setProgressData: React.Dispatch<React.SetStateAction<ProgressDataPoint[]>>;
}

const MultilingualInput: React.FC<{ label: string; value: MultilingualString; name: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, lang: 'ar' | 'fr') => void; type?: 'input' | 'textarea'; optionalLangs?: ('ar' | 'fr')[] }> = ({ label, value, name, onChange, type = 'input', optionalLangs = [] }) => {
    const Component = type === 'input' ? 'input' : 'textarea';
    const commonProps = {
        className: "block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600",
        rows: type === 'textarea' ? 4 : undefined,
    };
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
            <div className="grid grid-cols-2 gap-4 mt-1">
                <Component
                    name={`${name}.ar`}
                    value={value.ar}
                    onChange={(e) => onChange(e, 'ar')}
                    placeholder="العربية"
                    {...commonProps}
                    required={!optionalLangs.includes('ar')}
                />
                <Component
                    name={`${name}.fr`}
                    value={value.fr}
                    onChange={(e) => onChange(e, 'fr')}
                    placeholder="Français"
                    {...commonProps}
                    required={!optionalLangs.includes('fr')}
                />
            </div>
        </div>
    );
};

const TextEditForm: React.FC<{ text: TextData; onSave: (text: TextData) => void; onCancel: () => void; }> = ({ text, onSave, onCancel }) => {
    const { t } = useI18n();
    const [formData, setFormData] = useState<TextData>(text);
    const questionTypes: QuestionType[] = ['فهم', 'تحليل', 'مناقشة', 'مفاهيم', 'ابداء الرأي'];

    const draggedQuestion = useRef<Question | null>(null);
    const dragOverQuestion = useRef<Question | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, lang: 'ar' | 'fr') => {
        const { name, value } = e.target;
        const [field] = name.split('.');
        setFormData(prev => ({
            ...prev,
            [field]: {
                ...(prev[field as keyof Pick<TextData, 'title' | 'specialization' | 'content'>]),
                [lang]: value
            }
        }));
    };

    const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, lang: 'ar' | 'fr', questionId: string) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.map(q =>
                q.id === questionId
                ? { ...q, text: { ...q.text, [lang]: value } }
                : q
            )
        }));
    };

    const handleQuestionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>, questionId: string) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.map(q =>
                q.id === questionId
                ? { ...q, type: value as QuestionType }
                : q
            )
        }));
    };

    const handleAddQuestion = () => {
        const newQuestion: Question = {
            id: `new-${Date.now()}`,
            text: { ar: '', fr: '' },
            type: 'فهم',
            options: [],
        };
        setFormData(prev => ({
            ...prev,
            questions: [...prev.questions, newQuestion]
        }));
    };

    const handleRemoveQuestion = (idToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.filter(q => q.id !== idToRemove)
        }));
    };

    const handleAddOption = (questionId: string) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.map(q => {
                if (q.id === questionId) {
                    const newOption: AnswerOption = { id: `opt-${Date.now()}`, text: { ar: '', fr: '' } };
                    const updatedOptions = [...(q.options || []), newOption];
                    return { ...q, options: updatedOptions };
                }
                return q;
            })
        }));
    };

    const handleRemoveOption = (questionId: string, optionId: string) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.map(q => {
                if (q.id === questionId) {
                    const updatedOptions = (q.options || []).filter(opt => opt.id !== optionId);
                    const newCorrectAnswerId = q.correctAnswerId === optionId ? undefined : q.correctAnswerId;
                    return { ...q, options: updatedOptions, correctAnswerId: newCorrectAnswerId };
                }
                return q;
            })
        }));
    };
    
    const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, lang: 'ar' | 'fr', questionId: string, optionId: string) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.map(q => {
                if (q.id === questionId) {
                    const updatedOptions = (q.options || []).map(opt => 
                        opt.id === optionId 
                        ? { ...opt, text: { ...opt.text, [lang]: value } } 
                        : opt
                    );
                    return { ...q, options: updatedOptions };
                }
                return q;
            })
        }));
    };

    const handleCorrectAnswerChange = (questionId: string, optionId: string) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.map(q => 
                q.id === questionId ? { ...q, correctAnswerId: optionId } : q
            )
        }));
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, question: Question) => {
        draggedQuestion.current = question;
        e.currentTarget.classList.add('opacity-50');
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, question: Question) => {
        if (draggedQuestion.current?.id !== question.id) {
            dragOverQuestion.current = question;
            e.currentTarget.classList.add('bg-primary-50', 'dark:bg-slate-700', '!border-primary-500');
        }
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('bg-primary-50', 'dark:bg-slate-700', '!border-primary-500');
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = () => {
        if (draggedQuestion.current && dragOverQuestion.current && draggedQuestion.current.id !== dragOverQuestion.current.id) {
            setFormData(prev => {
                const questions = [...prev.questions];
                const draggedIndex = questions.findIndex(q => q.id === draggedQuestion.current!.id);
                const dropIndex = questions.findIndex(q => q.id === dragOverQuestion.current!.id);
                if (draggedIndex === -1 || dropIndex === -1) return prev;
                const [draggedItem] = questions.splice(draggedIndex, 1);
                questions.splice(dropIndex, 0, draggedItem);
                return { ...prev, questions };
            });
        }
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('opacity-50');
        draggedQuestion.current = null;
        dragOverQuestion.current = null;
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
            <h3 className="text-xl font-bold">{formData.id ? t('global.edit') : t('global.add')} {t('nav.texts')}</h3>
            <MultilingualInput label={t('admin.skills.formTitle')} name="title" value={formData.title} onChange={handleChange} />
            <MultilingualInput label={t('admin.users.specialization')} name="specialization" value={formData.specialization} onChange={handleChange} />
            <MultilingualInput label={t('admin.tabs.content')} name="content" value={formData.content} onChange={handleChange} type="textarea" />

            <div className="pt-4 border-t dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-lg">{t('admin.texts.manageQuestions')} ({formData.questions.length})</h4>
                </div>
                <div className="space-y-4">
                    {formData.questions.map((q, index) => (
                        <div 
                            key={q.id} 
                            className="p-4 border-2 border-dashed rounded-md dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 relative cursor-grab transition-colors"
                            draggable
                            onDragStart={(e) => handleDragStart(e, q)}
                            onDragEnter={(e) => handleDragEnter(e, q)}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="absolute top-2 end-2">
                                <Button type="button" variant="secondary" size="sm" onClick={() => handleRemoveQuestion(q.id)}>
                                    <TrashIcon className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="space-y-4">
                                <MultilingualInput label={`${t('admin.texts.questionText')} ${index + 1}`} name={`question-${q.id}`} value={q.text} onChange={(e, lang) => handleQuestionChange(e, lang, q.id)} type="textarea" />
                                <div>
                                    <label className="block text-sm font-medium">{t('admin.texts.questionType')}</label>
                                    <select value={q.type} onChange={(e) => handleQuestionTypeChange(e, q.id)} className="mt-1 block w-full rounded-md border-slate-300 dark:bg-slate-700">
                                        {questionTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-600">
                                    <h5 className="text-sm font-semibold mb-2">{t('admin.texts.answerOptions')}</h5>
                                    {(q.options || []).map((opt) => (
                                        <div key={opt.id} className="flex items-center gap-3 p-2 bg-white dark:bg-slate-700 rounded-md mb-2">
                                            <input type="radio" checked={q.correctAnswerId === opt.id} onChange={() => handleCorrectAnswerChange(q.id, opt.id)} />
                                            <div className="flex-grow">
                                                <MultilingualInput label="" name={`opt-${opt.id}`} value={opt.text} onChange={(e, lang) => handleOptionChange(e, lang, q.id, opt.id)} />
                                            </div>
                                            <Button variant="secondary" size="sm" onClick={() => handleRemoveOption(q.id, opt.id)}>
                                                <TrashIcon className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="secondary" size="sm" onClick={() => handleAddOption(q.id)}>{t('admin.texts.addOption')}</Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <Button type="button" variant="secondary" onClick={handleAddQuestion} className="mt-4">{t('admin.texts.addQuestion')}</Button>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="secondary" onClick={onCancel}>{t('global.cancel')}</Button>
                <Button type="submit">{t('global.save')}</Button>
            </div>
        </form>
    );
};

const AdminPage: React.FC<AdminPageProps> = (props) => {
    const { t, locale } = useI18n();
    const [activeTab, setActiveTab] = useState<AdminTab>('content');
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [editingText, setEditingText] = useState<TextData | null>(null);

    const stats = useMemo(() => [
        { label: t('admin.reports.totalUsers'), value: 120, icon: UsersIcon, color: 'text-blue-500' },
        { label: t('admin.reports.totalTexts'), value: props.texts.length, icon: BookOpenIcon, color: 'text-teal-500' },
        { label: t('admin.reports.totalSkills'), value: props.skills.length, icon: SparklesIcon, color: 'text-amber-500' },
    ], [props.texts, props.skills, t]);

    const specDistData = useMemo(() => props.specializations.map((spec, i) => ({
        name: spec.name[locale],
        value: spec.traineeCount || 10,
        color: ['#14b8a6', '#0ea5e9', '#f59e0b', '#8b5cf6'][i % 4]
    })), [props.specializations, locale]);

    const handleSaveText = (text: TextData) => {
        if (text.id.startsWith('new-')) {
            props.setTexts(prev => [...prev, { ...text, id: String(Date.now()) }]);
        } else {
            props.setTexts(prev => prev.map(t => t.id === text.id ? text : t));
        }
        setEditingText(null);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t('admin.title')}</h2>
            
            <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar">
                {(['content', 'users', 'reports', 'settings'] as AdminTab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                            activeTab === tab 
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        {t(`admin.tabs.${tab}`)}
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {activeTab === 'reports' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {stats.map((stat, i) => (
                                <Card key={i} className="p-6 flex items-center">
                                    <div className={`p-3 rounded-full bg-slate-100 dark:bg-slate-700 me-4 ${stat.color}`}>
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stat.value}</p>
                                        <p className="text-sm text-slate-500">{stat.label}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="p-6">
                                <h3 className="text-lg font-bold mb-6">{t('admin.reports.userSpecDist')}</h3>
                                <div className="h-80">
                                    <SimplePieChart data={specDistData} />
                                </div>
                            </Card>
                            <Card className="p-6">
                                <h3 className="text-lg font-bold mb-6">{t('admin.reports.avgProgress')}</h3>
                                <div className="h-80">
                                    <SimpleLineChart 
                                        data={props.progressData} 
                                        lines={[
                                            { key: 'completedTexts', color: '#14b8a6', name: t('dashboard.completedTexts') },
                                            { key: 'testScores', color: '#f59e0b', name: t('dashboard.avgScore') }
                                        ]}
                                    />
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="space-y-6">
                        {editingText ? (
                            <Card className="p-6">
                                <TextEditForm text={editingText} onSave={handleSaveText} onCancel={() => setEditingText(null)} />
                            </Card>
                        ) : (
                            <Card className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold">{t('nav.texts')}</h3>
                                    <Button onClick={() => setEditingText({ id: `new-${Date.now()}`, title: {ar:'',fr:''}, specialization:{ar:'',fr:''}, content:{ar:'',fr:''}, questions:[] })}>
                                        <PlusCircleIcon className="h-5 w-5 me-2" />
                                        {t('global.add')}
                                    </Button>
                                </div>
                                <div className="divide-y dark:divide-slate-700">
                                    {props.texts.map(text => (
                                        <div key={text.id} className="py-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold">{text.title[locale]}</p>
                                                <p className="text-sm text-slate-500">{text.specialization[locale]}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="secondary" size="sm" onClick={() => setEditingText(text)}><PencilIcon className="h-4 w-4" /></Button>
                                                <Button variant="secondary" size="sm" className="!bg-red-100 !text-red-600" onClick={() => props.setTexts(prev => prev.filter(t => t.id !== text.id))}><TrashIcon className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {activeTab === 'users' && (
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">{t('admin.tabs.users')}</h3>
                            <Button><PlusCircleIcon className="h-5 w-5 me-2" />{t('admin.users.addUser')}</Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-start">
                                <thead className="bg-slate-50 dark:bg-slate-700">
                                    <tr>
                                        <th className="p-3 text-start">{t('admin.users.name')}</th>
                                        <th className="p-3 text-start">{t('admin.users.email')}</th>
                                        <th className="p-3 text-start">{t('admin.users.role')}</th>
                                        <th className="p-3 text-start">{t('global.edit')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b dark:border-slate-700">
                                        <td className="p-3">أحمد المتدرب</td>
                                        <td className="p-3">trainee@example.com</td>
                                        <td className="p-3"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">متدرب</span></td>
                                        <td className="p-3"><Button variant="secondary" size="sm"><PencilIcon className="h-4 w-4" /></Button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-xl font-bold mb-4">{t('admin.settings.logoTitle')}</h3>
                            <div className="flex items-center gap-6">
                                <div className="h-24 w-24 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center border">
                                    {props.logoSrc ? <img src={props.logoSrc} className="max-h-full" alt="logo" /> : <AcademicCapIcon className="h-12 w-12 text-slate-400" />}
                                </div>
                                <div>
                                    <Button variant="secondary" size="sm" className="mb-2">{t('admin.settings.changeLogo')}</Button>
                                    <p className="text-xs text-slate-500">{t('admin.settings.logoDesc')}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-6">
                            <h3 className="text-xl font-bold mb-4">{t('admin.settings.accountTitle')}</h3>
                            <Button variant="secondary" onClick={() => setIsPasswordModalOpen(true)}>{t('admin.settings.changePassword')}</Button>
                        </Card>
                    </div>
                )}
            </div>

            {isPasswordModalOpen && <ChangePasswordModal onClose={() => setIsPasswordModalOpen(false)} />}
        </div>
    );
};

export default AdminPage;
