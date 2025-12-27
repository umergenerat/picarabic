
import React, { useState, useEffect, useMemo } from 'react';
import Card from '../common/Card';
import {
    DocumentTextIcon, UsersIcon, ChartPieIcon, Cog6ToothIcon, PencilIcon, TrashIcon,
    XMarkIcon, BookOpenIcon, SparklesIcon, PresentationChartBarIcon, BeakerIcon, iconMap, MagnifyingGlassIcon,
    PlusCircleIcon, LockClosedIcon, CheckIcon, CheckCircleIcon, ExclamationTriangleIcon, AcademicCapIcon
} from '../common/Icons';
import { useI18n } from '../../contexts/I18nContext';
import * as authService from '../../services/authService';
import * as db from '../../services/dataService';
import { supabase } from '../../services/supabaseClient';
import Spinner from '../common/Spinner';
import {
    TextData, PlatformUser, UserRole, Skill, Team, Specialization, MultilingualString,
    ProgressDataPoint, ChatChannel, Resource, TestContext, Question, CognitiveLevel, QuestionType, DifficultyLevel
} from '../../types';
import Button from '../common/Button';
import Avatar from '../common/Avatar';

// --- Simple Pie Chart ---
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
            <div className="w-48 h-48 rounded-full shadow-lg relative" style={{ background: gradientString }}>
                <div className="absolute inset-0 m-auto w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-700 dark:text-slate-200">
                    {total}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-md">
                {data.map(item => (
                    <div key={item.name} className="flex items-center text-xs">
                        <span className="w-3 h-3 rounded-full me-2 flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                        <span className="text-slate-600 dark:text-slate-300 truncate">{item.name} ({item.value})</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DifficultyBadge: React.FC<{ level: DifficultyLevel }> = ({ level }) => {
    const colors = {
        'مبتدئ': 'bg-green-100 text-green-700 border-green-200',
        'متوسط': 'bg-blue-100 text-blue-700 border-blue-200',
        'متقدم': 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] border ${colors[level]}`}>{level}</span>;
};

// --- Multilingual Input (French Optional) ---
const MultilingualInput: React.FC<{ label: string; value: MultilingualString; name: string; onChange: (e: any, lang: 'ar' | 'fr') => void; type?: 'input' | 'textarea' }> = ({ label, value, name, onChange, type = 'input' }) => {
    const Component = type === 'input' ? 'input' : 'textarea';
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Component
                    value={value.ar}
                    onChange={(e: any) => onChange(e, 'ar')}
                    placeholder="العربية (إلزامي)"
                    className="block w-full rounded-md border-slate-300 dark:bg-slate-700 dark:border-slate-600 text-sm"
                    required
                />
                <Component
                    value={value.fr}
                    onChange={(e: any) => onChange(e, 'fr')}
                    placeholder="Français (اختياري)"
                    className="block w-full rounded-md border-slate-300 dark:bg-slate-700 dark:border-slate-600 text-sm"
                />
            </div>
        </div>
    );
};

const UserEditForm: React.FC<{ user: PlatformUser; specializations: Specialization[]; onSave: (u: PlatformUser) => void; onCancel: () => void }> = ({ user, specializations, onSave, onCancel }) => {
    const { t, locale } = useI18n();
    const [formData, setFormData] = useState<PlatformUser>(user);

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
            <h3 className="text-xl font-bold border-b pb-2">{formData.id ? 'تعديل بيانات المتدرب' : 'إضافة متدرب جديد'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">الاسم الكامل</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-md border-slate-300 dark:bg-slate-700" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full rounded-md border-slate-300 dark:bg-slate-700" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">التخصص</label>
                    <select value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} className="w-full rounded-md border-slate-300 dark:bg-slate-700">
                        <option value="">-- اختر التخصص --</option>
                        {specializations.map(s => <option key={s.id} value={s.name[locale]}>{s.name[locale]}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">كلمة المرور</label>
                    <input
                        type="password"
                        value={formData.password || ''}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full rounded-md border-slate-300 dark:bg-slate-700"
                        placeholder="••••••••"
                        required={!formData.id}
                    />
                    <p className="text-[10px] text-slate-500 mt-1">سيتم تعيين هذه الكلمة ككلمة مرور افتراضية للحساب.</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" id="forcePass" checked={formData.mustChangePassword} onChange={(e) => setFormData({ ...formData, mustChangePassword: e.target.checked })} className="rounded text-primary-600" />
                <label htmlFor="forcePass" className="text-sm">فرض تغيير كلمة المرور عند أول دخول</label>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="secondary" onClick={onCancel}>إلغاء</Button>
                <Button type="submit">حفظ المتدرب</Button>
            </div>
        </form>
    );
};

const TextEditForm: React.FC<{ text: TextData; skills: Skill[]; specializations: Specialization[]; onSave: (t: TextData) => void; onCancel: () => void }> = ({ text, skills, specializations, onSave, onCancel }) => {
    const { t, locale } = useI18n();
    const [formData, setFormData] = useState<TextData>(text);

    const handleAddObjective = () => {
        setFormData({ ...formData, learningObjectives: [...formData.learningObjectives, { ar: '', fr: '' }] });
    };

    const handleRemoveObjective = (index: number) => {
        const newObjs = [...formData.learningObjectives];
        newObjs.splice(index, 1);
        setFormData({ ...formData, learningObjectives: newObjs });
    };

    const handleAddQuestion = () => {
        const newQ: Question = {
            id: `q-${Date.now()}`,
            text: { ar: '', fr: '' },
            type: 'فهم',
            cognitiveLevel: 'فهم',
            options: []
        };
        setFormData({ ...formData, questions: [...formData.questions, newQ] });
    };

    const handleRemoveQuestion = (index: number) => {
        const newQs = [...formData.questions];
        newQs.splice(index, 1);
        setFormData({ ...formData, questions: newQs });
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-8">
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-2xl font-bold">{formData.id ? 'تعديل المحتوى التعليمي' : 'إضافة محتوى جديد'}</h3>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={onCancel}>إلغاء</Button>
                    <Button type="submit">حفظ المحتوى</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MultilingualInput label="عنوان النص" value={formData.title} name="title" onChange={(e, lang) => setFormData({ ...formData, title: { ...formData.title, [lang]: e.target.value } })} />

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">التخصص</label>
                        <select
                            value={formData.specialization.ar}
                            onChange={(e) => {
                                const spec = specializations.find(s => s.name.ar === e.target.value);
                                if (spec) setFormData({ ...formData, specialization: spec.name });
                            }}
                            className="w-full rounded-md border-slate-300 dark:bg-slate-700 text-sm"
                        >
                            <option value="">-- اختر التخصص --</option>
                            {specializations.map(s => <option key={s.id} value={s.name.ar}>{s.name.ar}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">المستوى</label>
                        <select value={formData.difficulty} onChange={(e: any) => setFormData({ ...formData, difficulty: e.target.value })} className="w-full rounded-md border-slate-300 dark:bg-slate-700 text-sm">
                            <option value="مبتدئ">مبتدئ</option>
                            <option value="متوسط">متوسط</option>
                            <option value="متقدم">متقدم</option>
                        </select>
                    </div>
                </div>
            </div>

            <MultilingualInput label="المحتوى النصي (HTML مدعوم)" type="textarea" value={formData.content} name="content" onChange={(e, lang) => setFormData({ ...formData, content: { ...formData.content, [lang]: e.target.value } })} />

            <div>
                <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">الأهداف التعلمية</label>
                    <Button type="button" size="sm" variant="secondary" onClick={handleAddObjective}>+ إضافة هدف</Button>
                </div>
                <div className="space-y-3">
                    {formData.learningObjectives.map((obj, idx) => (
                        <div key={idx} className="flex gap-2 items-start bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                            <div className="flex-grow">
                                <MultilingualInput label={`الهدف ${idx + 1}`} value={obj} name={`obj-${idx}`} onChange={(e, lang) => {
                                    const newObjs = [...formData.learningObjectives];
                                    newObjs[idx] = { ...newObjs[idx], [lang]: e.target.value };
                                    setFormData({ ...formData, learningObjectives: newObjs });
                                }} />
                            </div>
                            <button type="button" onClick={() => handleRemoveObjective(idx)} className="mt-7 p-2 text-red-500 hover:bg-red-50 rounded"><TrashIcon className="h-4 w-4" /></button>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold mb-4">المهارات المرتبطة</label>
                <div className="flex flex-wrap gap-3">
                    {skills.map(skill => (
                        <label key={skill.id} className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${formData.skillIds.includes(skill.id) ? 'bg-primary-50 border-primary-500 font-bold' : 'bg-white border-slate-200 dark:bg-slate-800'}`}>
                            <input
                                type="checkbox"
                                checked={formData.skillIds.includes(skill.id)}
                                onChange={(e) => {
                                    const newIds = e.target.checked
                                        ? [...formData.skillIds, skill.id]
                                        : formData.skillIds.filter(id => id !== skill.id);
                                    setFormData({ ...formData, skillIds: newIds });
                                }}
                                className="hidden"
                            />
                            {iconMap[skill.iconName] && React.createElement(iconMap[skill.iconName], { className: "h-4 w-4" })}
                            <span className="text-xs">{skill.title[locale]}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-6 border-t pt-6">
                    <label className="text-lg font-bold">الأسئلة التفاعلية</label>
                    <Button type="button" size="sm" onClick={handleAddQuestion}>+ إضافة سؤال</Button>
                </div>
                <div className="space-y-6">
                    {formData.questions.map((q, idx) => (
                        <Card key={q.id} className="p-4 border-s-4 border-s-primary-500">
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded text-[10px] font-bold">سؤال {idx + 1}</span>
                                <button type="button" onClick={() => handleRemoveQuestion(idx)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-4 w-4" /></button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                <div className="sm:col-span-2">
                                    <MultilingualInput label="نص السؤال" value={q.text} name={`q-${idx}-text`} onChange={(e, lang) => {
                                        const newQs = [...formData.questions];
                                        newQs[idx] = { ...newQs[idx], text: { ...newQs[idx].text, [lang]: e.target.value } };
                                        setFormData({ ...formData, questions: newQs });
                                    }} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">المجال الإدراكي (تصنيف بلوم)</label>
                                    <select
                                        value={q.cognitiveLevel}
                                        onChange={(e: any) => {
                                            const newQs = [...formData.questions];
                                            newQs[idx] = { ...newQs[idx], cognitiveLevel: e.target.value };
                                            setFormData({ ...formData, questions: newQs });
                                        }}
                                        className="w-full rounded-md border-slate-300 dark:bg-slate-700 text-xs"
                                    >
                                        {(['تذكر', 'فهم', 'تطبيق', 'تحليل', 'تقييم', 'إبداع'] as CognitiveLevel[]).map(lv => <option key={lv} value={lv}>{lv}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">نوع السؤال</label>
                                    <select
                                        value={q.type}
                                        onChange={(e: any) => {
                                            const newQs = [...formData.questions];
                                            newQs[idx] = { ...newQs[idx], type: e.target.value };
                                            setFormData({ ...formData, questions: newQs });
                                        }}
                                        className="w-full rounded-md border-slate-300 dark:bg-slate-700 text-xs"
                                    >
                                        {(['فهم', 'تحليل', 'مناقشة', 'مفاهيم', 'ابداء الرأي'] as QuestionType[]).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <MultilingualInput label="تلميح للمتدرب (اختياري)" value={q.hint || { ar: '', fr: '' }} name={`q-${idx}-hint`} onChange={(e, lang) => {
                                    const newQs = [...formData.questions];
                                    newQs[idx] = { ...newQs[idx], hint: { ...(newQs[idx].hint || { ar: '', fr: '' }), [lang]: e.target.value } };
                                    setFormData({ ...formData, questions: newQs });
                                }} />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t">
                <Button variant="secondary" onClick={onCancel}>إلغاء</Button>
                <Button type="submit">حفظ المحتوى</Button>
            </div>
        </form>
    );
};

const SkillEditForm: React.FC<{ skill: Skill; onSave: (s: Skill) => void; onCancel: () => void }> = ({ skill, onSave, onCancel }) => {
    const { t, locale } = useI18n();
    const [formData, setFormData] = useState<Skill>(skill);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-xl font-bold">
                    {formData.id && typeof formData.id === 'number' && formData.id < 1000000000
                        ? 'تعديل المهارة'
                        : 'إضافة مهارة جديدة'}
                </h3>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={onCancel} size="sm">إلغاء</Button>
                    <Button type="submit" size="sm">حفظ المهارة</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <MultilingualInput
                    label="عنوان المهارة"
                    value={formData.title}
                    name="title"
                    onChange={(e, lang) => setFormData({ ...formData, title: { ...formData.title, [lang]: e.target.value } })}
                />

                <MultilingualInput
                    label="وصف المهارة"
                    type="textarea"
                    value={formData.description}
                    name="description"
                    onChange={(e, lang) => setFormData({ ...formData, description: { ...formData.description, [lang]: e.target.value } })}
                />

                <div>
                    <label className="block text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">أيقونة المهارة</label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 max-h-60 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                        {Object.keys(iconMap).map(iconName => {
                            const IconComponent = iconMap[iconName];
                            const isSelected = formData.iconName === iconName;
                            return (
                                <button
                                    key={iconName}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, iconName })}
                                    className={`group flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${isSelected
                                        ? 'bg-primary-500 text-white ring-2 ring-primary-500 shadow-md transform scale-105'
                                        : 'bg-white dark:bg-slate-700 text-slate-400 hover:bg-primary-50 dark:hover:bg-slate-600 hover:text-primary-600'
                                        }`}
                                >
                                    <IconComponent className="h-6 w-6" />
                                    <span className={`text-[8px] mt-1 truncate w-full text-center ${isSelected ? 'text-white' : 'text-slate-400 opacity-0 group-hover:opacity-100'}`}>
                                        {iconName.replace('Icon', '')}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </form>
    );
};

const SpecializationEditForm: React.FC<{ specialization: Specialization; onSave: (s: Specialization) => void; onCancel: () => void }> = ({ specialization, onSave, onCancel }) => {
    const { t, locale } = useI18n();
    const [formData, setFormData] = useState<Specialization>(specialization);

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-xl font-bold">{formData.id && formData.id.length < 20 ? 'تعديل التخصص' : 'إضافة تخصص جديد'}</h3>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={onCancel} size="sm">إلغاء</Button>
                    <Button type="submit" size="sm">حفظ التخصص</Button>
                </div>
            </div>
            <div className="space-y-4">
                <MultilingualInput
                    label="اسم التخصص"
                    value={formData.name}
                    name="name"
                    onChange={(e, lang) => setFormData({ ...formData, name: { ...formData.name, [lang]: e.target.value } })}
                />
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">عدد المتدربين (تقديري)</label>
                    <input
                        type="number"
                        value={formData.traineeCount || 0}
                        onChange={(e) => setFormData({ ...formData, traineeCount: parseInt(e.target.value) || 0 })}
                        className="block w-full rounded-md border-slate-300 dark:bg-slate-700 dark:border-slate-600 text-sm"
                    />
                </div>
            </div>
        </form>
    );
};

type AdminTab = 'content' | 'users' | 'reports' | 'settings';

const AdminPage: React.FC<any> = (props) => {
    const { t, locale } = useI18n();
    const [activeTab, setActiveTab] = useState<AdminTab>('content');
    const [activeContentType, setActiveContentType] = useState<'texts' | 'skills' | 'specializations'>('texts');
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>([]);

    // Admin Settings States
    const [adminCurrentPass, setAdminCurrentPass] = useState('');
    const [adminNewPass, setAdminNewPass] = useState('');
    const [adminMsg, setAdminMsg] = useState({ text: '', type: '' });

    useEffect(() => {
        if (activeTab === 'users' || activeTab === 'reports') {
            loadUsers();
        }

        // Diagnostic: Check current user role in DB to verify RLS
        const checkUserRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                console.log('Current Auth User ID:', user.id);
                console.log('Profile Role in DB:', profile?.role);
                if (profile?.role !== 'مدير') {
                    console.warn('Warning: Your role in the "profiles" table is not "مدير". RLS policies may block some operations.');
                }
            }
        };
        checkUserRole();
    }, [activeTab]);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const users = await authService.getUsers();
            setPlatformUsers(users);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const handleSaveUser = async (user: PlatformUser) => {
        setIsLoading(true);
        try {
            await authService.saveUser(user);
            await loadUsers();
            setEditingItem(null);
        } catch (e) { alert("حدث خطأ أثناء الحفظ"); }
        finally { setIsLoading(false); }
    };

    const handleSaveText = async (text: TextData) => {
        setIsLoading(true);
        try {
            const updatedTexts = props.texts.some((t: any) => t.id === text.id)
                ? props.texts.map((t: any) => t.id === text.id ? text : t)
                : [...props.texts, text];
            await db.saveTexts(updatedTexts);
            setEditingItem(null);
            if (props.refreshData) props.refreshData();
        } catch (e: any) {
            console.error('Error saving text:', e);
            alert(`حدث خطأ أثناء حفظ النص: ${e.message || 'خطأ غير معروف'}`);
        }
        finally { setIsLoading(false); }
    };

    const handleSaveSkill = async (skill: Skill) => {
        setIsLoading(true);
        try {
            const updatedSkills = props.skills.some((s: any) => s.id === skill.id)
                ? props.skills.map((s: any) => s.id === skill.id ? skill : s)
                : [...props.skills, skill];

            await db.saveSkills(updatedSkills);
            setEditingItem(null);
            if (props.refreshData) props.refreshData();
        } catch (e: any) {
            console.error('Error saving skill:', e);
            alert(`حدث خطأ أثناء حفظ المهارة: ${e.message || 'خطأ غير معروف'}`);
        }
        finally { setIsLoading(false); }
    };

    const handleDeleteSkill = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذه المهارة؟')) return;
        setIsLoading(true);
        try {
            await db.deleteSkill(id);
            if (props.refreshData) props.refreshData();
        } catch (e: any) {
            console.error('Error deleting skill:', e);
            alert(`حدث خطأ أثناء حذف المهارة: ${e.message || 'خطأ غير معروف'}`);
        }
        finally { setIsLoading(false); }
    };

    const handleSaveSpecialization = async (spec: Specialization) => {
        setIsLoading(true);
        try {
            const updatedSpecs = props.specializations.some((s: any) => s.id === spec.id)
                ? props.specializations.map((s: any) => s.id === spec.id ? spec : s)
                : [...props.specializations, spec];

            console.log('Sending specializations to save:', updatedSpecs);
            await db.saveSpecializations(updatedSpecs);
            setEditingItem(null);
            if (props.refreshData) props.refreshData();
        } catch (e: any) {
            console.error('Catch error in handleSaveSpecialization:', e);
            alert(`حدث خطأ أثناء حفظ التخصص: ${e.message || 'خطأ غير معروف'}`);
        }
        finally { setIsLoading(false); }
    };

    const handleDeleteSpecialization = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا التخصص؟')) return;
        setIsLoading(true);
        try {
            await db.deleteSpecialization(id);
            if (props.refreshData) props.refreshData();
        } catch (e) { alert("حدث خطأ أثناء حذف التخصص"); }
        finally { setIsLoading(false); }
    };

    const handleAdminPassChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdminMsg({ text: '', type: '' });
        try {
            await authService.changePassword(adminCurrentPass, adminNewPass, adminNewPass);
            setAdminMsg({ text: 'تم تحديث كلمة المرور بنجاح', type: 'success' });
            setAdminCurrentPass(''); setAdminNewPass('');
        } catch (err: any) {
            setAdminMsg({ text: 'فشل التحديث: تأكد من كلمة المرور الحالية', type: 'error' });
        }
    };

    const specDistribution = useMemo(() => {
        const counts: Record<string, number> = {};
        platformUsers.forEach(u => {
            const spec = u.specialization || 'غير محدد';
            counts[spec] = (counts[spec] || 0) + 1;
        });
        const colors = ['#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316'];
        return Object.entries(counts).map(([name, value], idx) => ({
            name, value, color: colors[idx % colors.length]
        }));
    }, [platformUsers]);

    return (
        <div className="space-y-6 pb-20">
            <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                {(['content', 'users', 'reports', 'settings'] as AdminTab[]).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === tab ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500'}`}>
                        {t(`admin.tabs.${tab}`)}
                    </button>
                ))}
            </div>

            {activeTab === 'content' && (
                <div className="space-y-6">
                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
                        {['texts', 'skills', 'specializations'].map((type: any) => (
                            <button key={type} onClick={() => { setActiveContentType(type); setEditingItem(null); }} className={`px-4 py-2 text-xs font-bold rounded-md ${activeContentType === type ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500'}`}>
                                {t(`nav.${type}`)}
                            </button>
                        ))}
                    </div>

                    {editingItem ? (
                        <Card className="p-6">
                            {activeContentType === 'texts' ? (
                                <TextEditForm
                                    text={editingItem}
                                    skills={props.skills}
                                    specializations={props.specializations}
                                    onSave={handleSaveText}
                                    onCancel={() => setEditingItem(null)}
                                />
                            ) : activeContentType === 'skills' ? (
                                <SkillEditForm
                                    skill={editingItem}
                                    onSave={handleSaveSkill}
                                    onCancel={() => setEditingItem(null)}
                                />
                            ) : (
                                <SpecializationEditForm
                                    specialization={editingItem}
                                    onSave={handleSaveSpecialization}
                                    onCancel={() => setEditingItem(null)}
                                />
                            )}
                        </Card>
                    ) : (
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold">قائمة العناصر</h3>
                                <Button size="sm" onClick={() => {
                                    if (activeContentType === 'texts') {
                                        setEditingItem({
                                            id: `txt-${Date.now()}`,
                                            title: { ar: '', fr: '' },
                                            specialization: { ar: '', fr: '' },
                                            difficulty: 'متوسط',
                                            learningObjectives: [],
                                            skillIds: [],
                                            content: { ar: '', fr: '' },
                                            questions: []
                                        });
                                    } else if (activeContentType === 'skills') {
                                        setEditingItem({
                                            id: Date.now(),
                                            title: { ar: '', fr: '' },
                                            description: { ar: '', fr: '' },
                                            iconName: 'SparklesIcon'
                                        });
                                    } else {
                                        setEditingItem({ id: Date.now().toString(), name: { ar: '', fr: '' } });
                                    }
                                }}>إضافة جديد</Button>
                            </div>
                            <div className="divide-y dark:divide-slate-700">
                                {activeContentType === 'texts' && props.texts.map((t: any) => (
                                    <div key={t.id} className="py-3 flex justify-between items-center text-sm">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{t.title[locale]}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{t.specialization[locale]}</span>
                                                <DifficultyBadge level={t.difficulty} />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingItem(t)} className="p-2 hover:bg-slate-100 rounded-full"><PencilIcon className="h-4 w-4" /></button>
                                            <button onClick={() => { if (confirm('هل أنت متأكد؟')) db.deleteText(t.id).then(() => window.location.reload()); }} className="p-2 hover:bg-red-50 text-red-500 rounded-full"><TrashIcon className="h-4 w-4" /></button>
                                        </div>
                                    </div>
                                ))}
                                {activeContentType === 'skills' && props.skills.map((s: any) => (
                                    <div key={s.id} className="py-4 flex justify-between items-center text-sm border-b last:border-0 border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors px-2 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-primary-50 dark:bg-slate-700 text-primary-600 rounded-xl shadow-sm">
                                                {iconMap[s.iconName] && React.createElement(iconMap[s.iconName], { className: "h-6 w-6" })}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-slate-100 text-base">{s.title[locale]}</span>
                                                <span className="text-xs text-slate-500 line-clamp-1 max-w-[400px] mt-0.5">{s.description[locale]}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setEditingItem(s)}
                                                className="p-2 hover:bg-primary-100 hover:text-primary-600 text-slate-400 rounded-lg transition-colors"
                                                title="تعديل"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSkill(s.id)}
                                                className="p-2 hover:bg-red-100 hover:text-red-600 text-slate-400 rounded-lg transition-colors"
                                                title="حذف"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {activeContentType === 'specializations' && props.specializations.map((s: any) => (
                                    <div key={s.id} className="py-4 flex justify-between items-center text-sm border-b last:border-0 border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors px-2 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-primary-50 dark:bg-slate-700 text-primary-600 rounded-xl shadow-sm">
                                                <AcademicCapIcon className="h-6 w-6" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-slate-100 text-base">{s.name[locale]}</span>
                                                <span className="text-xs text-slate-500 mt-0.5">عدد المتدربين: {s.traineeCount || 0}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setEditingItem(s)}
                                                className="p-2 hover:bg-primary-100 hover:text-primary-600 text-slate-400 rounded-lg transition-colors"
                                                title="تعديل"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSpecialization(s.id)}
                                                className="p-2 hover:bg-red-100 hover:text-red-600 text-slate-400 rounded-lg transition-colors"
                                                title="حذف"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {activeTab === 'users' && (
                <div className="space-y-6">
                    {editingItem ? (
                        <Card className="p-6">
                            <UserEditForm user={editingItem} specializations={props.specializations} onSave={handleSaveUser} onCancel={() => setEditingItem(null)} />
                        </Card>
                    ) : (
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold">إدارة المتدربين الحالية</h3>
                                <Button size="sm" onClick={() => setEditingItem({ name: '', email: '', role: 'متدرب', status: 'نشط', mustChangePassword: true })}>
                                    + متدرب جديد
                                </Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead><tr className="text-slate-500 border-b"><th className="pb-3 text-start">الاسم</th><th className="pb-3 text-start">التخصص</th><th className="pb-3 text-start">الحالة</th><th className="pb-3 text-center">الإجراءات</th></tr></thead>
                                    <tbody className="divide-y">
                                        {platformUsers.map(u => (
                                            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                                <td className="py-3 font-medium">{u.name}</td>
                                                <td className="py-3">{u.specialization}</td>
                                                <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] ${u.status === 'نشط' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.status}</span></td>
                                                <td className="py-3 text-center">
                                                    <button onClick={() => setEditingItem(u)} className="p-1 hover:text-primary-600"><PencilIcon className="h-4 w-4" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {activeTab === 'reports' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard icon={UsersIcon} value={platformUsers.length} label="إجمالي المتدربين" />
                        <StatCard icon={BookOpenIcon} value={props.texts.length} label="النصوص المنشورة" />
                        <StatCard icon={CheckCircleIcon} value={platformUsers.filter(u => u.status === 'نشط').length} label="المتدربين النشطين" />
                        <StatCard icon={AcademicCapIcon} value={props.specializations.length} label="الشعب المتاحة" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h3 className="font-bold mb-6 flex items-center gap-2"><ChartPieIcon className="h-5 w-5 text-primary-500" /> توزيع المتدربين الفعلي</h3>
                            <div className="h-[350px]"><SimplePieChart data={specDistribution} /></div>
                        </Card>
                        <Card className="p-6">
                            <h3 className="font-bold mb-4">نظرة عامة على النشاط</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                                    <p className="text-xs text-slate-500 mb-1">نسبة التسجيل في "تدبير المقاولات"</p>
                                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                        <div className="bg-primary-500 h-full" style={{ width: '65%' }}></div>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                                    <p className="text-xs text-slate-500 mb-1">نسبة التسجيل في "الكهرباء"</p>
                                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                        <div className="bg-blue-500 h-full" style={{ width: '40%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <Card className="p-8 max-w-xl mx-auto">
                    <div className="flex items-center gap-3 mb-8 border-b pb-4">
                        <LockClosedIcon className="h-6 w-6 text-primary-600" />
                        <h3 className="text-xl font-bold">إعدادات أمن الحساب (المدير)</h3>
                    </div>
                    <form onSubmit={handleAdminPassChange} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">كلمة المرور الحالية</label>
                            <input type="password" value={adminCurrentPass} onChange={(e) => setAdminCurrentPass(e.target.value)} className="w-full rounded-md border-slate-300 dark:bg-slate-700" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">كلمة المرور الجديدة</label>
                            <input type="password" value={adminNewPass} onChange={(e) => setAdminNewPass(e.target.value)} className="w-full rounded-md border-slate-300 dark:bg-slate-700" required />
                        </div>
                        {adminMsg.text && (
                            <div className={`p-3 rounded-md text-xs flex items-center gap-2 ${adminMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {adminMsg.type === 'success' ? <CheckIcon className="h-4 w-4" /> : <ExclamationTriangleIcon className="h-4 w-4" />}
                                {adminMsg.text}
                            </div>
                        )}
                        <Button type="submit" className="w-full">تحديث كلمة مرور المدير</Button>
                    </form>
                </Card>
            )}
        </div>
    );
};

const StatCard: React.FC<any> = ({ icon: Icon, value, label }) => (
    <Card className="p-6 flex items-center shadow-sm">
        <div className="p-3 bg-primary-100 dark:bg-slate-700 text-primary-600 rounded-lg me-4"><Icon className="h-6 w-6" /></div>
        <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-slate-500">{label}</p></div>
    </Card>
);

export default AdminPage;
