import React from 'react';
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
import { initialProgressData } from '../../data/courseData';
import ConfirmationModal from '../common/ConfirmationModal';
import { TextData, PlatformUser, UserRole, Skill, Team, TestContext, Question, QuestionType, ProgressDataPoint, MultilingualString, ChatChannel, Resource, AnswerOption, Specialization } from '../../types';
import Button from '../common/Button';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, Legend, CartesianGrid } from 'recharts';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

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

// Reusable component for multilingual input fields
// FIX: Widened the onChange event type to include HTMLSelectElement to resolve type conflicts in consuming components.
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


// TextEditForm implementation
const TextEditForm: React.FC<{ text: TextData; onSave: (text: TextData) => void; onCancel: () => void; }> = ({ text, onSave, onCancel }) => {
    const { t } = useI18n();
    const [formData, setFormData] = useState<TextData>(text);
    const questionTypes: QuestionType[] = ['فهم', 'تحليل', 'مناقشة', 'مفاهيم', 'ابداء الرأي'];

    // Refs for drag and drop
    const draggedQuestion = useRef<Question | null>(null);
    const dragOverQuestion = useRef<Question | null>(null);

    useEffect(() => {
        setFormData(text);
    }, [text]);

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
    
    // New handlers for multiple-choice options
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


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    // Drag and drop handlers for questions
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
        document.querySelectorAll('.question-item').forEach(el => {
            el.classList.remove('bg-primary-50', 'dark:bg-slate-700', '!border-primary-500');
        });
        draggedQuestion.current = null;
        dragOverQuestion.current = null;
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold">{text.id ? t('global.edit') : t('global.add')} {t('nav.texts')}</h3>
            
            <MultilingualInput label={t('admin.skills.formTitle')} name="title" value={formData.title} onChange={handleChange} />
            <MultilingualInput label={t('admin.users.specialization')} name="specialization" value={formData.specialization} onChange={handleChange} />
            <MultilingualInput label={t('admin.tabs.content')} name="content" value={formData.content} onChange={handleChange} type="textarea" />

            <div className="pt-4 border-t dark:border-slate-700">
                 <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-lg">{t('admin.texts.manageQuestions')} ({formData.questions.length})</h4>
                    <p className="text-xs text-slate-500">{t('admin.skills.dragToReorder')}</p>
                 </div>
                 <div className="space-y-4">
                     {formData.questions.map((q, index) => (
                         <div 
                             key={q.id} 
                             className="question-item p-4 border-2 border-dashed rounded-md dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 relative cursor-grab transition-colors"
                             draggable
                             onDragStart={(e) => handleDragStart(e, q)}
                             onDragEnter={(e) => handleDragEnter(e, q)}
                             onDragLeave={handleDragLeave}
                             onDragOver={handleDragOver}
                             onDrop={handleDrop}
                             onDragEnd={handleDragEnd}
                         >
                              <div className="absolute top-3 start-3 text-slate-400" aria-hidden="true">
                                <Bars3Icon className="h-5 w-5" />
                              </div>
                              <div className="absolute top-2 end-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="!p-1.5 !bg-red-100 !text-red-700 hover:!bg-red-200"
                                    onClick={() => handleRemoveQuestion(q.id)}
                                    aria-label={t('admin.texts.removeQuestion')}
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </Button>
                             </div>
                             <div className="space-y-4 ms-6">
                                <MultilingualInput 
                                    label={`${t('admin.texts.questionText')} ${index + 1}`} 
                                    name={`question-${q.id}`} 
                                    value={q.text} 
                                    onChange={(e, lang) => handleQuestionChange(e, lang, q.id)} 
                                    type="textarea" 
                                    optionalLangs={['fr']}
                                />
                                <div>
                                    <label htmlFor={`q-type-${q.id}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('admin.texts.questionType')}</label>
                                    <select 
                                        id={`q-type-${q.id}`} 
                                        value={q.type} 
                                        onChange={(e) => handleQuestionTypeChange(e, q.id)}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"
                                    >
                                        {questionTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-600">
                                    <h5 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">{t('admin.texts.answerOptions')}</h5>
                                    <div className="space-y-3">
                                        {(q.options || []).map((opt) => (
                                            <div key={opt.id} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-700/50 rounded-md">
                                                <input
                                                    type="radio"
                                                    name={`correct-answer-${q.id}`}
                                                    id={`correct-answer-${q.id}-${opt.id}`}
                                                    checked={q.correctAnswerId === opt.id}
                                                    onChange={() => handleCorrectAnswerChange(q.id, opt.id)}
                                                    className="mt-5 h-4 w-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                                                />
                                                <div className="flex-grow">
                                                    <MultilingualInput
                                                        label={t('admin.texts.optionText')}
                                                        name={`option-${q.id}-${opt.id}`}
                                                        value={opt.text}
                                                        onChange={(e, lang) => handleOptionChange(e, lang, q.id, opt.id)}
                                                        optionalLangs={['fr']}
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    className="!p-1.5 !bg-red-100 !text-red-700 hover:!bg-red-200 mt-5"
                                                    onClick={() => handleRemoveOption(q.id, opt.id)}
                                                    aria-label={t('admin.texts.removeOption')}
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>

                                    <Button type="button" variant="secondary" onClick={() => handleAddOption(q.id)} className="mt-3 text-sm">
                                        <PlusCircleIcon className="h-4 w-4 me-2" />
                                        {t('admin.texts.addOption')}
                                    </Button>
                                    <p className="text-xs text-slate-500 mt-2">
                                        {t('admin.texts.optionsHint')}
                                    </p>
                                </div>
                             </div>
                         </div>
                     ))}
                 </div>
                 <Button type="button" variant="secondary" onClick={handleAddQuestion} className="mt-4">
                    <PlusCircleIcon className="h-5 w-5 me-2" />
                    {t('admin.texts.addQuestion')}
                 </Button>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                <Button type="button" variant="secondary" onClick={onCancel}>{t('global.cancel')}</Button>
                <Button type="submit">{t('global.save')}</Button>
            </div>
        </form>
    );
};


// TestContextEditForm implementation
const TestContextEditForm: React.FC<{ context: TestContext; onSave: (context: TestContext) => void; onCancel: () => void; }> = ({ context, onSave, onCancel }) => {
    const { t } = useI18n();
    const [formData, setFormData] = useState<TestContext>(context);

    useEffect(() => {
        setFormData(context);
    }, [context]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, lang: 'ar' | 'fr') => {
        const { name, value } = e.target;
        const [field] = name.split('.');
        setFormData(prev => ({
            ...prev,
            [field]: {
                ...(prev[field as keyof Pick<TestContext, 'title' | 'content'>]),
                [lang]: value
            }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold">{context.id ? t('global.edit') : t('global.add')} {t('nav.tests')}</h3>
            
            <MultilingualInput label={t('admin.skills.formTitle')} name="title" value={formData.title} onChange={handleChange} />
            <MultilingualInput label={t('admin.tabs.content')} name="content" value={formData.content} onChange={handleChange} type="textarea" />
            
            <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                <Button type="button" variant="secondary" onClick={onCancel}>{t('global.cancel')}</Button>
                <Button type="submit">{t('global.save')}</Button>
            </div>
        </form>
    );
};

const SkillEditForm: React.FC<{ skill: Skill; onSave: (skill: Skill) => void; onCancel: () => void; }> = ({ skill, onSave, onCancel }) => {
    const { t } = useI18n();
    const [formData, setFormData] = useState<Skill>(skill);

    useEffect(() => {
        setFormData(skill);
    }, [skill]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, lang?: 'ar' | 'fr') => {
        const { name, value } = e.target;
        if (lang) {
            const [field] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [field]: {
                    ...(prev[field as keyof Pick<Skill, 'title' | 'description'>]),
                    [lang]: value
                }
            }));
        } else {
             setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const availableIcons = Object.keys(iconMap);
    const SelectedIcon = formData.iconName ? iconMap[formData.iconName] : null;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold">{skill.id ? t('admin.skills.editSkill') : t('admin.skills.addSkill')}</h3>
            
            <div>
                <label htmlFor="iconName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('admin.skills.formIcon')}</label>
                <div className="flex items-center gap-4 mt-1">
                    <select
                        name="iconName"
                        id="iconName"
                        value={formData.iconName}
                        onChange={handleChange}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"
                    >
                        <option value="">{t('admin.skills.selectIcon')}</option>
                        {availableIcons.map(iconKey => (
                            <option key={iconKey} value={iconKey}>{iconKey}</option>
                        ))}
                    </select>
                    {SelectedIcon && (
                        <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-md">
                            <SelectedIcon className="h-6 w-6 text-primary-500" />
                        </div>
                    )}
                </div>
            </div>

            <MultilingualInput label={t('admin.skills.formTitle')} name="title" value={formData.title} onChange={(e, l) => handleChange(e,l)} />
            <MultilingualInput label={t('admin.skills.formDescription')} name="description" value={formData.description} onChange={(e, l) => handleChange(e,l)} type="textarea" />

            <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                <Button type="button" variant="secondary" onClick={onCancel}>{t('global.cancel')}</Button>
                <Button type="submit">{t('global.save')}</Button>
            </div>
        </form>
    );
};

const ResourceEditForm: React.FC<{ resource: Resource; onSave: (resource: Resource) => void; onCancel: () => void; }> = ({ resource, onSave, onCancel }) => {
    const { t } = useI18n();
    const [formData, setFormData] = useState<Resource>(resource);

    useEffect(() => {
        setFormData(resource);
    }, [resource]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, lang?: 'ar' | 'fr') => {
        const { name, value } = e.target;
        if (lang) {
            const [field] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [field]: {
                    ...(prev[field as keyof Pick<Resource, 'title' | 'type'>]),
                    [lang]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold">{resource.id ? t('admin.resources.editResource') : t('admin.resources.addResource')}</h3>
            <MultilingualInput label={t('admin.resources.formTitle')} name="title" value={formData.title} onChange={(e, l) => handleChange(e, l)} />
            <MultilingualInput label={t('admin.resources.formType')} name="type" value={formData.type} onChange={(e, l) => handleChange(e, l)} />
             <div>
                <label htmlFor="link" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('admin.resources.formLink')}</label>
                <input
                    type="url"
                    name="link"
                    id="link"
                    value={formData.link}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"
                    placeholder="https://example.com"
                />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                <Button type="button" variant="secondary" onClick={onCancel}>{t('global.cancel')}</Button>
                <Button type="submit">{t('global.save')}</Button>
            </div>
        </form>
    );
};

const SpecializationEditForm: React.FC<{ specialization: Specialization; onSave: (specialization: Specialization) => void; onCancel: () => void; }> = ({ specialization, onSave, onCancel }) => {
    const { t } = useI18n();
    const [formData, setFormData] = useState<Specialization>(specialization);

    useEffect(() => {
        setFormData(specialization);
    }, [specialization]);

    // FIX: Widened event type to handle events from MultilingualInput
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, lang: 'ar' | 'fr') => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            name: { ...prev.name, [lang]: value }
        }));
    };

    const handleTraineeCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            traineeCount: parseInt(e.target.value, 10) || 0
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold">{specialization.id ? t('admin.specializations.editSpecialization') : t('admin.specializations.addSpecialization')}</h3>
            <MultilingualInput label={t('admin.specializations.formName')} name="name" value={formData.name} onChange={(e, l) => handleNameChange(e, l)} />
            <div>
                <label htmlFor="traineeCount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('admin.specializations.traineeCount')}</label>
                <input
                    type="number"
                    name="traineeCount"
                    id="traineeCount"
                    value={formData.traineeCount || 0}
                    onChange={handleTraineeCountChange}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"
                    min="0"
                />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                <Button type="button" variant="secondary" onClick={onCancel}>{t('global.cancel')}</Button>
                <Button type="submit">{t('global.save')}</Button>
            </div>
        </form>
    );
};


const AdminPage: React.FC<AdminPageProps> = (props) => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<AdminTab>('users');
    const [confirmAction, setConfirmAction] = useState<{ message: string; onConfirm: () => void } | null>(null);

    const renderContent = () => {
        const sharedProps = { confirmAction, setConfirmAction };
        switch (activeTab) {
            case 'content':
                return <ContentManagement {...props} {...sharedProps} />;
            case 'users':
                return <UserManagement {...sharedProps} />;
            case 'reports':
                return <ReportsAndAnalytics progressData={props.progressData} setProgressData={props.setProgressData} specializations={props.specializations} />;
            case 'settings':
                return <SystemSettings logoSrc={props.logoSrc} setLogoSrc={props.setLogoSrc} />;
            default:
                return null;
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">{t('admin.title')}</h2>
            <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-700 mb-6">
                <TabButton icon={ChartPieIcon} label={t('admin.tabs.reports')} isActive={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
                <TabButton icon={DocumentTextIcon} label={t('admin.tabs.content')} isActive={activeTab === 'content'} onClick={() => setActiveTab('content')} />
                <TabButton icon={UsersIcon} label={t('admin.tabs.users')} isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                <TabButton icon={Cog6ToothIcon} label={t('admin.tabs.settings')} isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            </div>
            <div>
                {renderContent()}
            </div>
            {confirmAction && (
                <ConfirmationModal
                    message={confirmAction.message}
                    onConfirm={confirmAction.onConfirm}
                    onCancel={() => setConfirmAction(null)}
                    confirmButtonText={t('global.delete')}
                />
            )}
        </div>
    );
};

const TabButton: React.FC<{ icon: React.ElementType, label: string, isActive: boolean, onClick: () => void }> = ({ icon: Icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
            isActive 
                ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
    >
        <Icon className="h-5 w-5" />
        {label}
    </button>
);


// Section Components
interface ManagementProps {
    confirmAction: { message: string; onConfirm: () => void; } | null;
    setConfirmAction: React.Dispatch<React.SetStateAction<{ message: string; onConfirm: () => void; } | null>>;
}

const ContentManagement: React.FC<Omit<AdminPageProps, 'logoSrc' | 'setLogoSrc' | 'progressData' | 'setProgressData'> & ManagementProps> = (props) => {
    const { t } = useI18n();
    const [activeContentTab, setActiveContentTab] = useState<'texts' | 'skills' | 'presentations' | 'tests' | 'chat' | 'resources' | 'specializations'>('texts');

    const renderContentTab = () => {
        switch (activeContentTab) {
            case 'texts':
                return <TextsManagement texts={props.texts} setTexts={props.setTexts} setConfirmAction={props.setConfirmAction} />;
            case 'skills':
                return <SkillsManagement skills={props.skills} setSkills={props.setSkills} setConfirmAction={props.setConfirmAction}/>;
            case 'presentations':
                 return <PresentationsManagement teams={props.teams} setTeams={props.setTeams} setConfirmAction={props.setConfirmAction} />;
            case 'tests':
                 return <TestsManagement testContexts={props.testContexts} setTestContexts={props.setTestContexts} setConfirmAction={props.setConfirmAction} />;
            case 'chat':
                 return <ChatManagement chatChannels={props.chatChannels} setChatChannels={props.setChatChannels} setConfirmAction={props.setConfirmAction} />;
            case 'resources':
                 return <ResourcesManagement resources={props.resources} setResources={props.setResources} setConfirmAction={props.setConfirmAction} />;
            case 'specializations':
                 return <SpecializationsManagement specializations={props.specializations} setSpecializations={props.setSpecializations} setConfirmAction={props.setConfirmAction} />;
            default:
                return null;
        }
    };

    return (
        <Card className="p-6">
             <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-700 mb-6 -mt-2 -mx-2">
                <ContentTabButton icon={BookOpenIcon} label={t('nav.texts')} isActive={activeContentTab === 'texts'} onClick={() => setActiveContentTab('texts')} />
                <ContentTabButton icon={SparklesIcon} label={t('nav.skills')} isActive={activeContentTab === 'skills'} onClick={() => setActiveContentTab('skills')} />
                <ContentTabButton icon={AcademicCapIcon} label={t('admin.specializations.manageTitle')} isActive={activeContentTab === 'specializations'} onClick={() => setActiveContentTab('specializations')} />
                <ContentTabButton icon={PresentationChartBarIcon} label={t('nav.presentations')} isActive={activeContentTab === 'presentations'} onClick={() => setActiveContentTab('presentations')} />
                <ContentTabButton icon={BeakerIcon} label={t('nav.tests')} isActive={activeContentTab === 'tests'} onClick={() => setActiveContentTab('tests')} />
                <ContentTabButton icon={ChatBubbleLeftRightIcon} label={t('nav.chat')} isActive={activeContentTab === 'chat'} onClick={() => setActiveContentTab('chat')} />
                <ContentTabButton icon={LinkIcon} label={t('nav.resources')} isActive={activeContentTab === 'resources'} onClick={() => setActiveContentTab('resources')} />
            </div>
            {renderContentTab()}
        </Card>
    );
};

const ContentTabButton: React.FC<{ icon: React.ElementType, label: string, isActive: boolean, onClick: () => void }> = ({ icon: Icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 rounded-t-md ${
            isActive 
                ? 'border-primary-500 text-primary-600 bg-primary-50 dark:bg-slate-700/50 dark:text-primary-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700/30'
        }`}
    >
        <Icon className="h-5 w-5" />
        {label}
    </button>
);

const TextsManagement: React.FC<{ texts: TextData[], setTexts: React.Dispatch<React.SetStateAction<TextData[]>>, setConfirmAction: ManagementProps['setConfirmAction'] }> = ({ texts, setTexts, setConfirmAction }) => {
    const { t, locale } = useI18n();
    const [editingText, setEditingText] = useState<TextData | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleSave = (textToSave: TextData) => {
        if (isCreating) {
            setTexts([...texts, { ...textToSave, id: Date.now().toString() }]);
        } else {
            setTexts(texts.map(text => text.id === textToSave.id ? textToSave : text));
        }
        setEditingText(null);
        setIsCreating(false);
    };

    const handleDelete = (textId: string) => {
        setConfirmAction({
            message: t('admin.texts.confirmDelete'),
            onConfirm: () => {
                setTexts(texts.filter(text => text.id !== textId));
                setConfirmAction(null);
            }
        });
    };

    const handleAddNew = () => {
        setIsCreating(true);
        const newText: TextData = {
            id: '', 
            title: { ar: '', fr: '' }, 
            specialization: { ar: '', fr: '' }, 
            content: { ar: '<p>اكتب المحتوى هنا...</p>', fr: '<p>Écrivez le contenu ici...</p>' }, 
            questions: []
        };
        setEditingText(newText);
    };
    
    if (editingText) {
        return <TextEditForm text={editingText} onSave={handleSave} onCancel={() => { setEditingText(null); setIsCreating(false); }} />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{t('admin.tabs.content')} - {t('nav.texts')}</h3>
                <Button onClick={handleAddNew}>{t('global.add')} {t('nav.texts')}</Button>
            </div>
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {texts.map(text => (
                    <li key={text.id} className="py-4 flex items-center justify-between">
                        <div>
                            <p className="text-lg font-medium text-slate-900 dark:text-white">{text.title[locale]}</p>
                            <p className="text-sm text-slate-500">{text.specialization[locale]}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={() => { setIsCreating(false); setEditingText(text); }}><PencilIcon className="h-4 w-4 me-1"/>{t('global.edit')}</Button>
                            <Button variant="secondary" size="sm" className="!bg-red-100 !text-red-700 hover:!bg-red-200 focus:!ring-red-500" onClick={() => handleDelete(text.id)}><TrashIcon className="h-4 w-4 me-1"/>{t('global.delete')}</Button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const SkillsManagement: React.FC<{ skills: Skill[], setSkills: React.Dispatch<React.SetStateAction<Skill[]>>, setConfirmAction: ManagementProps['setConfirmAction'] }> = ({ skills, setSkills, setConfirmAction }) => {
    const { t, locale } = useI18n();
    const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Refs for drag and drop
    const draggedItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleSave = (skillToSave: Skill) => {
        if (isCreating) {
            setSkills([...skills, { ...skillToSave, id: Date.now() }]);
        } else {
            setSkills(skills.map(s => s.id === skillToSave.id ? skillToSave : s));
        }
        setEditingSkill(null);
        setIsCreating(false);
    };

    const handleDelete = (skillId: number) => {
        setConfirmAction({
            message: t('admin.skills.confirmDelete'),
            onConfirm: () => {
                setSkills(skills.filter(s => s.id !== skillId));
                setConfirmAction(null);
            }
        });
    };

    const handleAddNew = () => {
        setIsCreating(true);
        const newSkill: Skill = {
            id: 0, 
            title: { ar: '', fr: '' }, 
            description: { ar: '', fr: '' }, 
            iconName: '',
        };
        setEditingSkill(newSkill);
    };
    
    const filteredSkills = skills.filter(skill => 
        skill.title.ar.toLowerCase().includes(searchTerm.toLowerCase()) || 
        skill.title.fr.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
        draggedItem.current = index;
        e.currentTarget.classList.add('opacity-50', 'bg-slate-100', 'dark:bg-slate-700');
    };

    const handleDragEnter = (e: React.DragEvent<HTMLLIElement>, index: number) => {
        if (draggedItem.current !== index) {
            dragOverItem.current = index;
             e.currentTarget.classList.add('!border-primary-500');
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLIElement>) => {
        e.currentTarget.classList.remove('!border-primary-500');
    };

    // FIX: Changed event type from HTMLLIElement to HTMLUListElement to match the onDragOver event on the `ul` element.
    const handleDragOver = (e: React.DragEvent<HTMLUListElement>) => {
        e.preventDefault();
    };

    const handleDrop = () => {
        if (draggedItem.current === null || dragOverItem.current === null || draggedItem.current === dragOverItem.current) {
            return;
        }

        const newSkillsList = [...skills];
        const draggedSkill = filteredSkills[draggedItem.current];
        const dragOverSkill = filteredSkills[dragOverItem.current];
        
        const originalDraggedIndex = newSkillsList.findIndex(s => s.id === draggedSkill.id);
        const originalDragOverIndex = newSkillsList.findIndex(s => s.id === dragOverSkill.id);

        if (originalDraggedIndex === -1 || originalDragOverIndex === -1) return;

        const [reorderedItem] = newSkillsList.splice(originalDraggedIndex, 1);
        newSkillsList.splice(originalDragOverIndex, 0, reorderedItem);

        setSkills(newSkillsList);

        draggedItem.current = null;
        dragOverItem.current = null;
    };

    const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
        e.currentTarget.classList.remove('opacity-50', 'bg-slate-100', 'dark:bg-slate-700');
        document.querySelectorAll('.skill-list-item').forEach(el => {
            el.classList.remove('!border-primary-500');
        });
    };

    if (editingSkill) {
        return <SkillEditForm skill={editingSkill} onSave={handleSave} onCancel={() => { setEditingSkill(null); setIsCreating(false); }} />;
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                 <div className="relative w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder={t('admin.skills.searchPlaceholder')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 ps-10 p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary-500"
                    />
                     <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute top-1/2 start-3 transform -translate-y-1/2" />
                </div>
                <Button onClick={handleAddNew} className="w-full sm:w-auto"><PlusCircleIcon className="h-5 w-5 me-2" />{t('admin.skills.addSkill')}</Button>
            </div>
             <p className="text-xs text-slate-500 mb-2">{t('admin.skills.dragToReorder')}</p>
            <ul onDrop={handleDrop} onDragOver={handleDragOver} className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredSkills.map((skill, index) => {
                    const Icon = iconMap[skill.iconName] || SparklesIcon;
                    return (
                        <li 
                            key={skill.id} 
                            className="skill-list-item py-4 flex items-center justify-between cursor-grab border-2 border-transparent"
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragLeave={handleDragLeave}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-md">
                                    <Icon className="h-6 w-6 text-primary-500" />
                                </div>
                                <div>
                                    <p className="text-lg font-medium text-slate-900 dark:text-white">{skill.title[locale]}</p>
                                    <p className="text-sm text-slate-500">{skill.description[locale]}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" size="sm" onClick={() => { setIsCreating(false); setEditingSkill(skill); }}><PencilIcon className="h-4 w-4 me-1"/>{t('global.edit')}</Button>
                                <Button variant="secondary" size="sm" className="!bg-red-100 !text-red-700 hover:!bg-red-200 focus:!ring-red-500" onClick={() => handleDelete(skill.id)}><TrashIcon className="h-4 w-4 me-1"/>{t('global.delete')}</Button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

const SpecializationsManagement: React.FC<{ specializations: Specialization[], setSpecializations: React.Dispatch<React.SetStateAction<Specialization[]>>, setConfirmAction: ManagementProps['setConfirmAction'] }> = ({ specializations, setSpecializations, setConfirmAction }) => {
    const { t, locale } = useI18n();
    const [editingSpecialization, setEditingSpecialization] = useState<Specialization | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const draggedItem = useRef<Specialization | null>(null);
    const dragOverItem = useRef<Specialization | null>(null);

    const handleSave = (specToSave: Specialization) => {
        if (isCreating) {
            setSpecializations([...specializations, { ...specToSave, id: `spec-${Date.now()}` }]);
        } else {
            setSpecializations(specializations.map(s => s.id === specToSave.id ? specToSave : s));
        }
        setEditingSpecialization(null);
        setIsCreating(false);
    };

    const handleDelete = (specId: string) => {
        setConfirmAction({
            message: t('admin.specializations.confirmDelete'),
            onConfirm: () => {
                setSpecializations(specializations.filter(s => s.id !== specId));
                setConfirmAction(null);
            }
        });
    };

    const handleAddNew = () => {
        setIsCreating(true);
        const newSpec: Specialization = { id: '', name: { ar: '', fr: '' }, traineeCount: 0 };
        setEditingSpecialization(newSpec);
    };

    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, spec: Specialization) => {
        draggedItem.current = spec;
        e.currentTarget.classList.add('opacity-50');
    };
    const handleDragEnter = (e: React.DragEvent<HTMLLIElement>, spec: Specialization) => {
        if (draggedItem.current?.id !== spec.id) {
            dragOverItem.current = spec;
            e.currentTarget.classList.add('bg-primary-50', 'dark:bg-slate-700');
        }
    };
    const handleDragLeave = (e: React.DragEvent<HTMLLIElement>) => {
        e.currentTarget.classList.remove('bg-primary-50', 'dark:bg-slate-700');
    };
    // FIX: Changed event type from HTMLLIElement to HTMLUListElement to match the onDragOver event on the `ul` element.
    const handleDragOver = (e: React.DragEvent<HTMLUListElement>) => e.preventDefault();
    const handleDrop = () => {
        if (draggedItem.current && dragOverItem.current && draggedItem.current.id !== dragOverItem.current.id) {
            const newSpecializationsList = [...specializations];
            const draggedIndex = specializations.findIndex(s => s.id === draggedItem.current!.id);
            const dropIndex = specializations.findIndex(s => s.id === dragOverItem.current!.id);
            if (draggedIndex === -1 || dropIndex === -1) return;
            const [reorderedItem] = newSpecializationsList.splice(draggedIndex, 1);
            newSpecializationsList.splice(dropIndex, 0, reorderedItem);
            setSpecializations(newSpecializationsList);
        }
        draggedItem.current = null;
        dragOverItem.current = null;
    };
    const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
        e.currentTarget.classList.remove('opacity-50');
        document.querySelectorAll('.spec-list-item').forEach(el => el.classList.remove('bg-primary-50', 'dark:bg-slate-700'));
    };

    if (editingSpecialization) {
        return <SpecializationEditForm specialization={editingSpecialization} onSave={handleSave} onCancel={() => { setEditingSpecialization(null); setIsCreating(false); }} />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{t('admin.specializations.manageTitle')}</h3>
                <Button onClick={handleAddNew}><PlusCircleIcon className="h-5 w-5 me-2" />{t('admin.specializations.addSpecialization')}</Button>
            </div>
            <p className="text-xs text-slate-500 mb-2">{t('admin.skills.dragToReorder')}</p>
            <ul onDrop={handleDrop} onDragOver={handleDragOver} className="divide-y divide-slate-200 dark:divide-slate-700">
                {specializations.map((spec) => (
                    <li 
                        key={spec.id} 
                        className="spec-list-item py-4 flex items-center justify-between cursor-grab"
                        draggable
                        onDragStart={(e) => handleDragStart(e, spec)}
                        onDragEnter={(e) => handleDragEnter(e, spec)}
                        onDragLeave={handleDragLeave}
                        onDragEnd={handleDragEnd}
                    >
                         <div className="flex items-center gap-4">
                            <Bars3Icon className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-lg font-medium text-slate-900 dark:text-white">{spec.name[locale]}</p>
                                <p className="text-sm text-slate-500">{t('admin.specializations.traineeCountLabel', { count: spec.traineeCount || 0 })}</p>
                            </div>
                         </div>
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={() => { setIsCreating(false); setEditingSpecialization(spec); }}><PencilIcon className="h-4 w-4 me-1"/>{t('global.edit')}</Button>
                            <Button variant="secondary" size="sm" className="!bg-red-100 !text-red-700 hover:!bg-red-200 focus:!ring-red-500" onClick={() => handleDelete(spec.id)}><TrashIcon className="h-4 w-4 me-1"/>{t('global.delete')}</Button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};


const PresentationsManagement: React.FC<{ teams: Team[], setTeams: React.Dispatch<React.SetStateAction<Team[]>>, setConfirmAction: ManagementProps['setConfirmAction'] }> = ({ teams, setTeams, setConfirmAction }) => {
    const { t, locale } = useI18n();
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    const [selectedFiles, setSelectedFiles] = useState<{ [key: number]: File | null }>({});
    type ActionStatus = 'idle' | 'uploading' | 'success' | 'error';
    interface ActionState { progress: number; status: ActionStatus; message: string; }
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

        setTimeout(() => {
            clearInterval(interval);
            const isSuccess = Math.random() > 0.1;

            if (isSuccess) {
                setTeams(currentTeams => currentTeams.map(team => 
                    team.id === teamId ? { ...team, presentation: file.name } : team
                ));
                setActionStates(prev => ({ ...prev, [teamId]: { progress: 100, status: 'success', message: t('presentations.uploadSuccess') } }));
            } else {
                setActionStates(prev => ({ ...prev, [teamId]: { progress: 100, status: 'error', message: t('presentations.uploadError') } }));
            }
            
            setTimeout(() => {
                 setActionStates(prev => ({ ...prev, [teamId]: { progress: 0, status: 'idle', message: '' } }));
                 setSelectedFiles(prev => ({ ...prev, [teamId]: null }));
            }, 4000);
        }, 2200); 
    };

    const TeamEditForm: React.FC<{ team: Team; onSave: (team: Team) => void; onCancel: () => void; }> = ({ team, onSave, onCancel }) => {
        const [formData, setFormData] = useState({ ...team, members: team.members.join('\n') });
        const currentMembers = useMemo(() => formData.members.split('\n').filter(m => m.trim() !== ''), [formData.members]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, lang?: 'ar' | 'fr') => {
            const { name, value } = e.target;
            if (lang) {
                const [field] = name.split('.');
                setFormData(prev => ({ 
                    ...prev, 
                    [field]: { 
                        ...(prev[field as keyof Pick<Team, 'name' | 'specialization' | 'presentationTitle'>]), 
                        [lang]: value 
                    } 
                }));
            } else if (name === 'members') {
                 const newMembersList = value.split('\n').map(m => m.trim()).filter(Boolean);
                 const leaderStillExists = newMembersList.includes(formData.teamLeader);
                 setFormData(prev => ({
                     ...prev,
                     members: value,
                     teamLeader: leaderStillExists ? prev.teamLeader : ''
                 }));
            } else {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            onSave({ ...formData, members: formData.members.split('\n').filter(m => m.trim() !== '') });
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-6">
                <h3 className="text-xl font-bold">{isCreating ? t('admin.presentations.addTeam') : t('admin.presentations.editTeam')}</h3>
                <MultilingualInput label={t('admin.presentations.teamName')} name="name" value={formData.name} onChange={(e, l) => handleChange(e, l)} />
                <MultilingualInput label={t('admin.presentations.presentationTitle')} name="presentationTitle" value={formData.presentationTitle} onChange={(e, l) => handleChange(e, l)} />
                <MultilingualInput label={t('admin.users.specialization')} name="specialization" value={formData.specialization} onChange={(e, l) => handleChange(e, l)} />
                
                <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('admin.presentations.dueDate')}</label>
                    <input
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('presentations.members')}</label>
                    <textarea name="members" value={formData.members} onChange={handleChange} rows={4} placeholder={t('admin.presentations.membersPlaceholder')} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600" />
                </div>

                <div>
                    <label htmlFor="teamLeader" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('admin.presentations.teamLeader')}</label>
                    <select
                        id="teamLeader"
                        name="teamLeader"
                        value={formData.teamLeader}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"
                    >
                        <option value="" disabled>{t('admin.presentations.selectLeader')}</option>
                        {currentMembers.map(member => (
                            <option key={member} value={member}>{member}</option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                    <Button type="button" variant="secondary" onClick={onCancel}>{t('global.cancel')}</Button>
                    <Button type="submit">{t('global.save')}</Button>
                </div>
            </form>
        );
    };

    const handleSave = (teamToSave: Team) => {
        if (isCreating) {
            setTeams([...teams, { ...teamToSave, id: Date.now() }]);
        } else {
            setTeams(teams.map(team => team.id === teamToSave.id ? teamToSave : team));
        }
        setEditingTeam(null);
        setIsCreating(false);
    };

    const handleDelete = (team: Team) => {
        setConfirmAction({
            message: t('admin.presentations.confirmDelete', { name: team.name[locale] }),
            onConfirm: () => {
                setTeams(teams.filter(t => t.id !== team.id));
                setConfirmAction(null);
            }
        });
    };

    const handleAddNew = () => {
        setIsCreating(true);
        setEditingTeam({ 
            id: 0, 
            name: { ar: '', fr: '' }, 
            specialization: { ar: '', fr: '' }, 
            members: [], 
            presentation: null, 
            presentationData: null,
            videoSummaryUrl: null,
            presentationTitle: { ar: '', fr: '' },
            dueDate: new Date().toISOString().split('T')[0],
            teamLeader: '' 
        });
    };

    const handleClearSubmission = (teamId: number) => {
        setTeams(teams.map(team => team.id === teamId ? { ...team, presentation: null, presentationData: null } : team));
    };
    
    if (editingTeam) {
        return <TeamEditForm team={editingTeam} onSave={handleSave} onCancel={() => { setEditingTeam(null); setIsCreating(false); }} />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{t('admin.presentations.manageTitle')}</h3>
                <Button onClick={handleAddNew}><PlusCircleIcon className="h-5 w-5 me-2" />{t('admin.presentations.addTeam')}</Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.presentations.teamName')}</th>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.presentations.presentationTitle')}</th>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.presentations.teamLeader')}</th>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.presentations.dueDate')}</th>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 uppercase tracking-wider">{t('presentations.submittedPresentation')}</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {teams.map(team => {
                            const selectedFile = selectedFiles[team.id];
                            const actionState = actionStates[team.id] || { status: 'idle', progress: 0, message: '' };
                            return (
                                <tr key={team.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                                        {team.name[locale]}
                                        <div className="text-xs text-slate-500">{team.specialization[locale]}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{team.presentationTitle[locale]}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{team.teamLeader}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(team.dueDate).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {team.presentation ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-green-700 dark:text-green-300">{team.presentation}</span>
                                                <Button variant="secondary" size="sm" onClick={() => handleClearSubmission(team.id)}>{t('admin.presentations.clearSubmission')}</Button>
                                            </div>
                                        ) : actionState.status === 'idle' ? (
                                            <div className="flex items-center gap-2">
                                                <input type="file" id={`admin-upload-${team.id}`} onChange={(e) => handleFileChange(e, team.id)} className="block w-full text-sm text-slate-500 file:me-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-slate-600 dark:file:text-primary-300 dark:hover:file:bg-slate-500"/>
                                                <Button size="sm" onClick={() => handleUpload(team.id)} disabled={!selectedFile} className="flex-shrink-0">{t('presentations.uploadButton')}</Button>
                                            </div>
                                        ) : actionState.status === 'uploading' ? (
                                            <div>
                                                <p className="text-xs font-medium text-center mb-1">{t('presentations.uploading')} {actionState.progress}%</p>
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5"><div className="bg-primary-600 h-1.5 rounded-full transition-all duration-300" style={{width: `${actionState.progress}%`}} /></div>
                                            </div>
                                        ) : actionState.status === 'success' ? (
                                            <div className="flex items-center gap-2 text-green-800 dark:text-green-200"><CheckCircleIcon className="h-4 w-4" /><p className="text-xs font-semibold">{actionState.message}</p></div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-red-800 dark:text-red-200"><ExclamationTriangleIcon className="h-4 w-4" /><p className="text-xs font-semibold">{actionState.message}</p></div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="secondary" size="sm" onClick={() => { setIsCreating(false); setEditingTeam(team); }}><PencilIcon className="h-4 w-4" /></Button>
                                            <Button variant="secondary" size="sm" className="!bg-red-100 !text-red-700 hover:!bg-red-200 focus:!ring-red-500" onClick={() => handleDelete(team)}><TrashIcon className="h-4 w-4" /></Button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TestsManagement: React.FC<{ testContexts: TestContext[], setTestContexts: React.Dispatch<React.SetStateAction<TestContext[]>>, setConfirmAction: ManagementProps['setConfirmAction'] }> = ({ testContexts, setTestContexts }) => {
    const { t, locale } = useI18n();
    const [editingContext, setEditingContext] = useState<TestContext | null>(null);

    const handleSave = (contextToSave: TestContext) => {
        setTestContexts(testContexts.map(c => c.id === contextToSave.id ? contextToSave : c));
        setEditingContext(null);
    };
    
    if (editingContext) {
        return <TestContextEditForm context={editingContext} onSave={handleSave} onCancel={() => setEditingContext(null)} />;
    }

    return (
        <div>
            <h3 className="text-xl font-bold mb-4">{t('admin.tabs.content')} - {t('nav.tests')}</h3>
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {testContexts.map(context => (
                    <li key={context.id} className="py-4 flex items-center justify-between">
                        <div>
                            <p className="text-lg font-medium text-slate-900 dark:text-white">{context.title[locale]}</p>
                            <p className="text-sm text-slate-500 truncate max-w-md">{context.content[locale]}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={() => setEditingContext(context)}><PencilIcon className="h-4 w-4 me-1"/>{t('global.edit')}</Button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const ChatChannelEditForm: React.FC<{ channel: ChatChannel; onSave: (channel: ChatChannel) => void; onCancel: () => void; }> = ({ channel, onSave, onCancel }) => {
    const { t } = useI18n();
    const [formData, setFormData] = useState<ChatChannel>(channel);
    const availableModels = ['gemini-2.5-flash', 'gemini-2.5-pro'];
    const availableIcons = Object.keys(iconMap);

    useEffect(() => {
        setFormData(channel);
    }, [channel]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, lang?: 'ar' | 'fr') => {
        const { name, value } = e.target;
        if (lang) {
            const [field] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [field]: {
                    ...(prev[field as keyof Pick<ChatChannel, 'name' | 'systemPrompt' | 'defaultSystemPrompt'>]),
                    [lang]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // When admin saves, systemPrompt becomes the new default
        const dataToSave = {
            ...formData,
            defaultSystemPrompt: formData.systemPrompt
        };
        onSave(dataToSave);
    };

    const SelectedIcon = formData.iconName ? iconMap[formData.iconName] : null;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold">{channel.id ? t('admin.chat.editChannel') : t('admin.chat.addChannel')}</h3>
            
            <MultilingualInput label={t('admin.chat.channelName')} name="name" value={formData.name} onChange={(e, l) => handleChange(e, l)} />

            <div>
                <label htmlFor="iconName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('admin.skills.formIcon')}</label>
                <div className="flex items-center gap-4 mt-1">
                    <select
                        name="iconName"
                        id="iconName"
                        value={formData.iconName}
                        onChange={handleChange}
                        required
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"
                    >
                        <option value="">{t('admin.skills.selectIcon')}</option>
                        {availableIcons.map(iconKey => (
                            <option key={iconKey} value={iconKey}>{iconKey}</option>
                        ))}
                    </select>
                    {SelectedIcon && (
                        <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-md">
                            <SelectedIcon className="h-6 w-6 text-primary-500" />
                        </div>
                    )}
                </div>
            </div>

            <div>
                <label htmlFor="model" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('chat.model')}</label>
                <select
                    name="model"
                    id="model"
                    value={formData.model}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"
                >
                    {availableModels.map(model => <option key={model} value={model}>{model}</option>)}
                </select>
            </div>

            <MultilingualInput label={t('admin.chat.systemPrompt')} name="systemPrompt" value={formData.systemPrompt} onChange={(e, l) => handleChange(e, l)} type="textarea" />

            <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                <Button type="button" variant="secondary" onClick={onCancel}>{t('global.cancel')}</Button>
                <Button type="submit">{t('global.save')}</Button>
            </div>
        </form>
    );
};

const ChatManagement: React.FC<{ chatChannels: ChatChannel[], setChatChannels: React.Dispatch<React.SetStateAction<ChatChannel[]>>, setConfirmAction: ManagementProps['setConfirmAction'] }> = ({ chatChannels, setChatChannels, setConfirmAction }) => {
    const { t, locale } = useI18n();
    const [editingChannel, setEditingChannel] = useState<ChatChannel | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleSave = (channelToSave: ChatChannel) => {
        if (isCreating) {
            setChatChannels([...chatChannels, { ...channelToSave, id: `channel-${Date.now()}` }]);
        } else {
            setChatChannels(chatChannels.map(c => c.id === channelToSave.id ? channelToSave : c));
        }
        setEditingChannel(null);
        setIsCreating(false);
    };

    const handleDelete = (channelId: string) => {
        setConfirmAction({
            message: t('admin.chat.confirmDelete'),
            onConfirm: () => {
                setChatChannels(chatChannels.filter(c => c.id !== channelId));
                setConfirmAction(null);
            }
        });
    };
    
    const handleAddNew = () => {
        setIsCreating(true);
        const newChannel: ChatChannel = {
            id: '',
            name: { ar: '', fr: '' },
            iconName: '',
            model: 'gemini-2.5-flash',
            systemPrompt: { ar: '', fr: '' },
            defaultSystemPrompt: { ar: '', fr: '' },
        };
        setEditingChannel(newChannel);
    };

    if (editingChannel) {
        return <ChatChannelEditForm channel={editingChannel} onSave={handleSave} onCancel={() => { setEditingChannel(null); setIsCreating(false); }} />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{t('admin.chat.manageTitle')}</h3>
                <Button onClick={handleAddNew}><PlusCircleIcon className="h-5 w-5 me-2" />{t('admin.chat.addChannel')}</Button>
            </div>
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {chatChannels.map(channel => {
                    const Icon = iconMap[channel.iconName] || ChatBubbleLeftRightIcon;
                    return (
                        <li key={channel.id} className="py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-md">
                                    <Icon className="h-6 w-6 text-primary-500" />
                                </div>
                                <div>
                                    <p className="text-lg font-medium text-slate-900 dark:text-white">{channel.name[locale]}</p>
                                    <p className="text-sm text-slate-500">{channel.systemPrompt[locale]?.substring(0, 70) + '...' || t('admin.chat.noPrompt')}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" size="sm" onClick={() => { setIsCreating(false); setEditingChannel(channel); }}><PencilIcon className="h-4 w-4 me-1"/>{t('global.edit')}</Button>
                                <Button variant="secondary" size="sm" className="!bg-red-100 !text-red-700 hover:!bg-red-200 focus:!ring-red-500" onClick={() => handleDelete(channel.id)}><TrashIcon className="h-4 w-4 me-1"/>{t('global.delete')}</Button>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    );
};


const ResourcesManagement: React.FC<{ resources: Resource[], setResources: React.Dispatch<React.SetStateAction<Resource[]>>, setConfirmAction: ManagementProps['setConfirmAction'] }> = ({ resources, setResources, setConfirmAction }) => {
    const { t, locale } = useI18n();
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [selectedResources, setSelectedResources] = useState<string[]>([]);

    const draggedItem = useRef<Resource | null>(null);
    const dragOverItem = useRef<Resource | null>(null);

    const handleSave = (resourceToSave: Resource) => {
        if (isCreating) {
            setResources([...resources, { ...resourceToSave, id: Date.now().toString() }]);
        } else {
            setResources(resources.map(r => r.id === resourceToSave.id ? resourceToSave : r));
        }
        setEditingResource(null);
        setIsCreating(false);
    };

    const handleDelete = (resourceId: string) => {
        setConfirmAction({
            message: t('admin.resources.confirmDelete'),
            onConfirm: () => {
                setResources(resources.filter(r => r.id !== resourceId));
                setConfirmAction(null);
            }
        });
    };

    const handleAddNew = () => {
        setIsCreating(true);
        const newResource: Resource = { id: '', title: { ar: '', fr: '' }, type: { ar: '', fr: '' }, link: '' };
        setEditingResource(newResource);
    };
    
    const uniqueTypes = useMemo(() => {
        const types = new Set(resources.map(r => r.type[locale]));
        return Array.from(types);
    }, [resources, locale]);

    const filteredResources = useMemo(() => {
        return resources.filter(resource => {
            const lowerSearchTerm = searchTerm.toLowerCase();
            const matchesSearch =
                resource.title.ar.toLowerCase().includes(lowerSearchTerm) ||
                resource.title.fr.toLowerCase().includes(lowerSearchTerm) ||
                resource.link.toLowerCase().includes(lowerSearchTerm);
            const matchesType = typeFilter === 'all' || resource.type[locale] === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [resources, searchTerm, typeFilter, locale]);

    const handleSelect = (resourceId: string) => {
        setSelectedResources(prev => prev.includes(resourceId) ? prev.filter(id => id !== resourceId) : [...prev, resourceId]);
    };
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedResources(e.target.checked ? filteredResources.map(r => r.id) : []);
    };
    const handleDeleteSelected = () => {
        setConfirmAction({
            message: t('admin.resources.confirmDeleteMultiple', { count: selectedResources.length }),
            onConfirm: () => {
                setResources(resources.filter(r => !selectedResources.includes(r.id)));
                setSelectedResources([]);
                setConfirmAction(null);
            }
        });
    };

    const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, resource: Resource) => {
        draggedItem.current = resource;
        e.currentTarget.classList.add('opacity-50');
    };
    const handleDragEnter = (e: React.DragEvent<HTMLTableRowElement>, resource: Resource) => {
        if (draggedItem.current?.id !== resource.id) {
            dragOverItem.current = resource;
            e.currentTarget.classList.add('bg-primary-50', 'dark:bg-slate-700');
        }
    };
    const handleDragLeave = (e: React.DragEvent<HTMLTableRowElement>) => {
        e.currentTarget.classList.remove('bg-primary-50', 'dark:bg-slate-700');
    };
    // FIX: Changed event type from HTMLTableRowElement to HTMLTableSectionElement to match the onDragOver event on the `tbody` element.
    const handleDragOver = (e: React.DragEvent<HTMLTableSectionElement>) => e.preventDefault();
    const handleDrop = () => {
        if (draggedItem.current && dragOverItem.current && draggedItem.current.id !== dragOverItem.current.id) {
            setResources(prev => {
                const newResourceList = [...prev];
                const draggedIndex = newResourceList.findIndex(r => r.id === draggedItem.current!.id);
                const dropIndex = newResourceList.findIndex(r => r.id === dragOverItem.current!.id);
                if (draggedIndex === -1 || dropIndex === -1) return prev;
                const [reorderedItem] = newResourceList.splice(draggedIndex, 1);
                newResourceList.splice(dropIndex, 0, reorderedItem);
                return newResourceList;
            });
        }
        draggedItem.current = null;
        dragOverItem.current = null;
    };
    const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
        e.currentTarget.classList.remove('opacity-50');
        document.querySelectorAll('.resource-row').forEach(el => {
            el.classList.remove('bg-primary-50', 'dark:bg-slate-700');
        });
    };


    if (editingResource) {
        return <ResourceEditForm resource={editingResource} onSave={handleSave} onCancel={() => { setEditingResource(null); setIsCreating(false); }} />;
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <div className="w-full sm:w-auto flex-grow flex items-center gap-4">
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder={t('admin.resources.searchPlaceholder')}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full ps-10 p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary-500"
                        />
                        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute top-1/2 start-3 transform -translate-y-1/2" />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        className="w-full sm:w-40 p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">{t('admin.resources.allTypes')}</option>
                        {uniqueTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <Button onClick={handleAddNew} className="w-full sm:w-auto flex-shrink-0"><PlusCircleIcon className="h-5 w-5 me-2" />{t('admin.resources.addResource')}</Button>
            </div>
             {selectedResources.length > 0 && (
                <div className="bg-primary-50 dark:bg-slate-700 p-3 rounded-md mb-4 flex justify-between items-center">
                    <p className="text-sm font-medium text-primary-700 dark:text-primary-300">{t('admin.resources.deleteSelected', { count: selectedResources.length })}</p>
                    <Button onClick={handleDeleteSelected} className="!bg-red-600 hover:!bg-red-700 focus:!ring-red-500"><TrashIcon className="h-4 w-4 me-2"/>{t('global.delete')}</Button>
                </div>
            )}
            <p className="text-xs text-slate-500 mb-2">{t('admin.skills.dragToReorder')}</p>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                            <th scope="col" className="p-4"><span className="sr-only">Drag</span></th>
                            <th scope="col" className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={selectedResources.length > 0 && selectedResources.length === filteredResources.length} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" /></th>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.resources.resource')}</th>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.resources.type')}</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700" onDrop={handleDrop} onDragOver={handleDragOver}>
                        {filteredResources.map(resource => (
                            <tr
                                key={resource.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, resource)}
                                onDragEnter={(e) => handleDragEnter(e, resource)}
                                onDragLeave={handleDragLeave}
                                onDragEnd={handleDragEnd}
                                className="resource-row hover:bg-slate-50 dark:hover:bg-slate-700/50"
                            >
                                <td className="p-4 text-slate-400 cursor-grab"><Bars3Icon className="h-5 w-5" /></td>
                                <td className="p-4"><input type="checkbox" checked={selectedResources.includes(resource.id)} onChange={() => handleSelect(resource.id)} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" /></td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">{resource.title[locale]}</div>
                                    <div className="text-sm text-slate-500"><a href={resource.link} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline truncate max-w-xs block">{resource.link}</a></div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{resource.type[locale]}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="secondary" size="sm" onClick={() => { setIsCreating(false); setEditingResource(resource); }}><PencilIcon className="h-4 w-4" /></Button>
                                        <Button variant="secondary" size="sm" className="!bg-red-100 !text-red-700 hover:!bg-red-200 focus:!ring-red-500" onClick={() => handleDelete(resource.id)}><TrashIcon className="h-4 w-4" /></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredResources.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                        {t('admin.resources.noResourcesFound')}
                    </div>
                )}
            </div>
        </div>
    );
};

const UserEditModal: React.FC<{
    isOpen: boolean;
    user: PlatformUser | null;
    onSave: (user: Omit<PlatformUser, 'id'> | PlatformUser) => Promise<void>;
    onClose: () => void;
    error: string | null;
}> = ({ isOpen, user, onSave, onClose, error }) => {
    const { t } = useI18n();
    const isEditing = user !== null;
    const [formData, setFormData] = useState<Omit<PlatformUser, 'id'>>({
        name: '', email: '', phone: '', specialization: '', role: 'متدرب', status: 'نشط', password: '', mustChangePassword: true,
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (isEditing) {
                setFormData({ ...user, password: '' });
            } else {
                setFormData({ name: '', email: '', phone: '', specialization: '', role: 'متدرب', status: 'نشط', password: '', mustChangePassword: true });
            }
        }
    }, [isOpen, user, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        setFormData(prev => ({
            ...prev,
            [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const dataToSave = isEditing ? { ...formData, id: user.id } : formData;
        await onSave(dataToSave);
        setIsLoading(false);
    };

    if (!isOpen) return null;

    const roles: UserRole[] = ['متدرب', 'أستاذ', 'مدير'];
    const statuses: Array<'نشط' | 'غير نشط'> = ['نشط', 'غير نشط'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <Card className="w-full max-w-lg max-h-[90vh] flex flex-col">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {isEditing ? t('admin.users.editUser') : t('admin.users.addUser')}
                            </h3>
                            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                    <div className="px-6 space-y-4 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('admin.users.name')}</label><input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600" /></div>
                            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('admin.users.email')}</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600" /></div>
                            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('admin.users.phone')}</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600" /></div>
                            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('admin.users.specialization')}</label><input type="text" name="specialization" value={formData.specialization} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600" /></div>
                            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('admin.users.role')}</label><select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600">{roles.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('admin.users.status')}</label><select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600">{statuses.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{isEditing ? t('login.password') : t('admin.users.tempPassword')}</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} required={!isEditing} placeholder={isEditing ? 'اتركه فارغًا للاحتفاظ بكلمة المرور الحالية' : ''} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600" />
                        </div>
                        <div className="flex items-start">
                            <div className="flex h-5 items-center"><input id="mustChangePassword" name="mustChangePassword" type="checkbox" checked={formData.mustChangePassword} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" /></div>
                            <div className="ms-3 text-sm"><label htmlFor="mustChangePassword" className="font-medium text-slate-700 dark:text-slate-300">{t('admin.users.tempPasswordNote')}</label></div>
                        </div>
                        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 mt-6 flex justify-end gap-3 rounded-b-xl">
                        <Button type="button" variant="secondary" onClick={onClose}>{t('global.cancel')}</Button>
                        <Button type="submit" isLoading={isLoading}>{t('global.save')}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

const UserManagement: React.FC<ManagementProps> = ({ setConfirmAction }) => {
    const { t } = useI18n();
    const [users, setUsers] = useState<PlatformUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedUsers = await getUsers();
            setUsers(fetchedUsers);
        } catch (e) {
            setError(t('admin.users.errorFetch'));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const lowerSearchTerm = searchTerm.toLowerCase();
            const matchesSearch =
                user.name.toLowerCase().includes(lowerSearchTerm) ||
                user.email.toLowerCase().includes(lowerSearchTerm) ||
                user.specialization.toLowerCase().includes(lowerSearchTerm);
            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [users, searchTerm, roleFilter]);

    const handleAddUser = () => { setEditingUser(null); setModalError(null); setIsModalOpen(true); };
    const handleEditUser = (user: PlatformUser) => { setEditingUser(user); setModalError(null); setIsModalOpen(true); };
    const handleSaveUser = async (userToSave: Omit<PlatformUser, 'id'> | PlatformUser) => {
        setModalError(null);
        try {
            if ('id' in userToSave) {
                await updateUser(userToSave);
            } else {
                await addUser(userToSave);
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (e: any) { setModalError(t(e.message)); }
    };
    const handleDeleteUser = (user: PlatformUser) => {
        setConfirmAction({
            message: t('admin.users.confirmDelete', { name: user.name }),
            onConfirm: async () => {
                await deleteUser(user.id);
                fetchUsers();
                setConfirmAction(null);
            }
        });
    };
    const handleSelect = (userId: number) => {
        setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedUsers(e.target.checked ? filteredUsers.map(u => u.id) : []);
    };
    const handleDeleteSelected = () => {
        setConfirmAction({
            message: t('admin.users.confirmDeleteMultiple', { count: selectedUsers.length }),
            onConfirm: async () => {
                await deleteMultipleUsers(selectedUsers);
                setSelectedUsers([]);
                fetchUsers();
                setConfirmAction(null);
            }
        });
    };

    const roles: Array<UserRole | 'all'> = ['all', 'متدرب', 'أستاذ', 'مدير'];

    return (
        <Card className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <div className="w-full sm:w-auto flex-grow flex items-center gap-4">
                    <div className="relative w-full sm:w-64"><input type="text" placeholder={t('admin.users.searchPlaceholder')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full ps-10 p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary-500" /><MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute top-1/2 start-3 transform -translate-y-1/2" /></div>
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as UserRole | 'all')} className="w-full sm:w-40 p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary-500">
                        {roles.map(r => <option key={r} value={r}>{r === 'all' ? t('admin.users.allRoles') : r}</option>)}
                    </select>
                </div>
                <Button onClick={handleAddUser} className="w-full sm:w-auto flex-shrink-0"><PlusCircleIcon className="h-5 w-5 me-2" />{t('admin.users.addUser')}</Button>
            </div>
            {selectedUsers.length > 0 && (
                <div className="bg-primary-50 dark:bg-slate-700 p-3 rounded-md mb-4 flex justify-between items-center">
                    <p className="text-sm font-medium text-primary-700 dark:text-primary-300">{t('admin.users.deleteSelected', { count: selectedUsers.length })}</p>
                    <Button onClick={handleDeleteSelected} className="!bg-red-600 hover:!bg-red-700 focus:!ring-red-500"><TrashIcon className="h-4 w-4 me-2"/>{t('global.delete')}</Button>
                </div>
            )}
            <div className="overflow-x-auto">
                {isLoading ? <div className="flex justify-center p-8"><Spinner /></div> : error ? <p className="text-center text-red-500">{error}</p> : (
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                                <th scope="col" className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={selectedUsers.length > 0 && selectedUsers.length === filteredUsers.length} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" /></th>
                                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.users.user')}</th>
                                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.users.specialization')}</th>
                                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.users.status')}</th>
                                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.users.role')}</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="p-4"><input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => handleSelect(user.id)} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" /></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="flex-shrink-0 h-10 w-10"><img className="h-10 w-10 rounded-full object-cover" src={`https://i.pravatar.cc/150?u=${user.email}`} alt="" /></div><div className="ms-4"><div className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</div><div className="text-sm text-slate-500">{user.email}</div></div></div></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.specialization}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'نشط' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`}>{user.status}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium"><div className="flex items-center justify-end gap-2"><Button variant="secondary" size="sm" onClick={() => handleEditUser(user)}><PencilIcon className="h-4 w-4" /></Button><Button variant="secondary" size="sm" className="!bg-red-100 !text-red-700 hover:!bg-red-200 focus:!ring-red-500" onClick={() => handleDeleteUser(user)}><TrashIcon className="h-4 w-4" /></Button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            {isModalOpen && <UserEditModal isOpen={isModalOpen} user={editingUser} onSave={handleSaveUser} onClose={() => setIsModalOpen(false)} error={modalError} />}
        </Card>
    );
};


const ReportsAndAnalytics: React.FC<Pick<AdminPageProps, 'progressData' | 'setProgressData' | 'specializations'>> = ({ progressData, setProgressData, specializations }) => {
    const { t, locale } = useI18n();
    const [isEditing, setIsEditing] = useState(false);
    const [editingData, setEditingData] = useState<ProgressDataPoint[]>(progressData);
    const [isConfirmingReset, setIsConfirmingReset] = useState(false);
    
    const traineesBySpecialization = useMemo(() => {
        if (!specializations || specializations.length === 0) {
            return [{ name: t('admin.reports.noData'), value: 1 }];
        }
        return specializations
            .filter(spec => (spec.traineeCount || 0) > 0)
            .map(spec => ({
                name: spec.name[locale],
                value: spec.traineeCount || 0,
            }));
    }, [specializations, locale, t]);
    const COLORS = ['#14b8a6', '#38bdf8', '#fbbf24', '#f87171', '#a78bfa'];

    const totalUsers = useMemo(() => {
        return specializations.reduce((sum, spec) => sum + (spec.traineeCount || 0), 0);
    }, [specializations]);

    const totalTexts = 12; // Placeholder
    const totalSkills = 8; // Placeholder

    const handleEditToggle = () => {
        if (isEditing) {
            setProgressData(editingData);
        }
        setIsEditing(!isEditing);
    };

    const handleDataChange = (index: number, field: keyof ProgressDataPoint, value: string) => {
        const newData = [...editingData];
        newData[index] = { ...newData[index], [field]: Number(value) };
        setEditingData(newData);
    };

    const handleResetData = () => {
        setProgressData(initialProgressData);
        setEditingData(initialProgressData);
        setIsConfirmingReset(false);
    };

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6"><h4 className="text-sm text-slate-500">{t('admin.reports.totalUsers')}</h4><p className="text-3xl font-bold">{totalUsers}</p></Card>
                <Card className="p-6"><h4 className="text-sm text-slate-500">{t('admin.reports.totalTexts')}</h4><p className="text-3xl font-bold">{totalTexts}</p></Card>
                <Card className="p-6"><h4 className="text-sm text-slate-500">{t('admin.reports.totalSkills')}</h4><p className="text-3xl font-bold">{totalSkills}</p></Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="p-4">
                    <h3 className="text-xl font-bold mb-4">{t('admin.reports.userSpecDist')}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={traineesBySpecialization} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {traineesBySpecialization.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
                <Card className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">{t('admin.reports.avgProgress')}</h3>
                        <div className="flex gap-2">
                             <Button variant="secondary" size="sm" onClick={handleEditToggle}>{isEditing ? t('global.save') : t('global.edit')}</Button>
                             <Button variant="secondary" size="sm" className="!bg-red-100 !text-red-700 hover:!bg-red-200" onClick={() => setIsConfirmingReset(true)}>{t('admin.reports.resetData')}</Button>
                        </div>
                    </div>
                     <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={progressData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="completedTexts" name={t('dashboard.completedTexts')} stroke="#14b8a6" />
                            <Line type="monotone" dataKey="acquiredSkills" name={t('dashboard.acquiredSkills')} stroke="#38bdf8" />
                            <Line type="monotone" dataKey="testScores" name={t('dashboard.avgScore')} stroke="#f59e0b" unit="%" />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
            </div>
             {isEditing && (
                <Card className="p-4">
                    <h3 className="text-xl font-bold mb-4">{t('admin.reports.editProgressData')}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {editingData.map((dataPoint, index) => (
                            <div key={dataPoint.month} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                                <h4 className="font-bold">{t(`dashboard.months.${dataPoint.month}`)}</h4>
                                <div className="mt-2 space-y-2">
                                    <div><label className="text-xs text-slate-500">{t('dashboard.completedTexts')}</label><input type="number" value={dataPoint.completedTexts} onChange={e => handleDataChange(index, 'completedTexts', e.target.value)} className="w-full p-1 border rounded-md dark:bg-slate-700 dark:border-slate-600" /></div>
                                    <div><label className="text-xs text-slate-500">{t('dashboard.acquiredSkills')}</label><input type="number" value={dataPoint.acquiredSkills} onChange={e => handleDataChange(index, 'acquiredSkills', e.target.value)} className="w-full p-1 border rounded-md dark:bg-slate-700 dark:border-slate-600" /></div>
                                    <div><label className="text-xs text-slate-500">{t('dashboard.avgScore')}</label><input type="number" value={dataPoint.testScores} onChange={e => handleDataChange(index, 'testScores', e.target.value)} className="w-full p-1 border rounded-md dark:bg-slate-700 dark:border-slate-600" /></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
            {isConfirmingReset && (
                <ConfirmationModal
                    title="تأكيد إعادة التعيين"
                    message="هل أنت متأكد من أنك تريد إعادة تعيين بيانات التقدم إلى الحالة الأولية؟ لا يمكن التراجع عن هذا الإجراء."
                    onConfirm={handleResetData}
                    onCancel={() => setIsConfirmingReset(false)}
                />
            )}
        </div>
    );
};

const SystemSettings: React.FC<Pick<AdminPageProps, 'logoSrc' | 'setLogoSrc'>> = ({ logoSrc, setLogoSrc }) => {
    const { t } = useI18n();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
    const [fileToImport, setFileToImport] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setLogoSrc(base64String);
                localStorage.setItem('platformLogo', base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setLogoSrc(null);
        localStorage.removeItem('platformLogo');
    };

    const handleExportData = () => {
        const keysToExport = [
            'platformTexts', 'platformSkills', 'platformTeams', 'platformTestContexts', 
            'platformChatChannels', 'platformResources', 'platformProgressData', 
            'platformCompletedSkills', 'platformSpecializations', 'platformUsers', 
            'adminPassword', 'platformLogo', 'theme'
        ];
        const allKeys = Object.keys(localStorage);
        const chatHistoryKeys = allKeys.filter(key => key.startsWith('platformChatHistory_'));
        
        const dataToExport: { [key: string]: any } = {};

        [...keysToExport, ...chatHistoryKeys].forEach(key => {
            const data = localStorage.getItem(key);
            if (data !== null) {
                try {
                    dataToExport[key] = JSON.parse(data);
                } catch (e) {
                    dataToExport[key] = data;
                }
            }
        });

        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        const date = new Date().toISOString().split('T')[0];
        link.download = `pica-backup-${date}.json`;
        link.click();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileToImport(file);
            setIsImportConfirmOpen(true);
            event.target.value = ''; 
        }
    };

    const handleConfirmImport = () => {
        if (!fileToImport) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not readable text.");
                
                const importedData = JSON.parse(text);
                if (!importedData.platformUsers) throw new Error("Invalid backup file format.");

                Object.keys(importedData).forEach(key => {
                    const value = importedData[key];
                    const valueString = typeof value === 'string' ? value : JSON.stringify(value);
                    localStorage.setItem(key, valueString);
                });

                setIsImportConfirmOpen(false);
                setFileToImport(null);
                alert(t('admin.settings.importSuccess'));
                window.location.reload();
            } catch (error) {
                console.error("Failed to import data:", error);
                alert(t('admin.settings.importError'));
                setIsImportConfirmOpen(false);
                setFileToImport(null);
            }
        };
        reader.readAsText(fileToImport);
    };

    return (
        <Card className="p-6">
            <div className="space-y-8 divide-y divide-slate-200 dark:divide-slate-700">
                {/* Logo Settings */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold">{t('admin.settings.logoTitle')}</h3>
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center">
                            {logoSrc ? (
                                <img src={logoSrc} alt={t('admin.settings.logoAlt')} className="max-w-full max-h-full object-contain" />
                            ) : (
                                <span className="text-sm text-slate-500">{t('global.add')} Logo</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-slate-500 mb-2">{t('admin.settings.logoDesc')}</p>
                            <div className="flex gap-2">
                                <Button onClick={() => fileInputRef.current?.click()}>{t('admin.settings.changeLogo')}</Button>
                                <input type="file" ref={fileInputRef} onChange={handleLogoChange} accept="image/png, image/jpeg" className="hidden" />
                                {logoSrc && <Button variant="secondary" onClick={handleRemoveLogo}>{t('admin.settings.removeLogo')}</Button>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Management */}
                <div className="pt-8 space-y-4">
                    <h3 className="text-xl font-bold">{t('admin.settings.dataManagement')}</h3>
                    <p className="text-sm text-slate-500">{t('admin.settings.dataManagementDesc')}</p>
                    <div className="flex gap-2">
                        <Button onClick={handleExportData} variant="secondary">
                            <ArrowDownTrayIcon className="h-5 w-5 me-2" />
                            {t('admin.settings.exportData')}
                        </Button>
                        <Button onClick={handleImportClick}>
                            <ArrowUpTrayIcon className="h-5 w-5 me-2" />
                            {t('admin.settings.importData')}
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelected} accept="application/json" className="hidden" />
                    </div>
                </div>

                {/* Account Settings */}
                <div className="pt-8 space-y-4">
                    <h3 className="text-xl font-bold">{t('admin.settings.accountTitle')}</h3>
                    <p className="text-sm text-slate-500">{t('admin.settings.accountDesc')}</p>
                    <Button onClick={() => setIsPasswordModalOpen(true)}>{t('admin.settings.changePassword')}</Button>
                </div>
            </div>

            {isPasswordModalOpen && <ChangePasswordModal onClose={() => setIsPasswordModalOpen(false)} />}
            {isImportConfirmOpen && (
                <ConfirmationModal
                    title={t('admin.settings.importConfirmTitle')}
                    message={t('admin.settings.importConfirmMessage')}
                    onConfirm={handleConfirmImport}
                    onCancel={() => setIsImportConfirmOpen(false)}
                    confirmButtonText={t('admin.settings.importData')}
                />
            )}
        </Card>
    );
};

export default AdminPage;
