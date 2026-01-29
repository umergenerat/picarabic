
import React, { useState, useEffect, useMemo } from 'react';
import Card from '../common/Card';
import {
    DocumentTextIcon, UsersIcon, ChartPieIcon, Cog6ToothIcon, PencilIcon, TrashIcon,
    XMarkIcon, BookOpenIcon, SparklesIcon, PresentationChartBarIcon, BeakerIcon, iconMap, MagnifyingGlassIcon,
    PlusCircleIcon, LockClosedIcon, CheckIcon, CheckCircleIcon, ExclamationTriangleIcon, AcademicCapIcon
} from '../common/Icons';
import { useI18n } from '../../contexts/I18nContext';
import { useAi } from '../../contexts/AiContext';
import * as authService from '../../services/authService';
import * as db from '../../services/dataService';
import * as aiService from '../../services/geminiService';
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
                    <label className="block text-sm font-medium mb-1">الهاتف</label>
                    <input type="text" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full rounded-md border-slate-300 dark:bg-slate-700" placeholder="06..." />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">الحالة</label>
                    <select value={formData.status} onChange={(e: any) => setFormData({ ...formData, status: e.target.value })} className="w-full rounded-md border-slate-300 dark:bg-slate-700">
                        <option value="نشط">نشط</option>
                        <option value="غير نشط">غير نشط</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">كلمة المرور {formData.id && <span className="text-xs text-slate-500 font-normal">(اتركها فارغة للإبقاء على الحالية)</span>}</label>
                    <input
                        type="password"
                        value={formData.password || ''}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full rounded-md border-slate-300 dark:bg-slate-700"
                        placeholder={formData.id ? "تعيين كلمة مرور جديدة" : "أدخل كلمة مرور"}
                        required={!formData.id}
                    />
                    <div className="flex flex-col gap-1 mt-1">
                        <p className="text-[10px] text-slate-500">
                            {formData.id
                                ? "لأسباب أمنية، لا يمكن للمدير تغيير كلمة المرور مباشرة."
                                : "سيتم تعيين هذه الكلمة ككلمة مرور افتراضية للحساب."}
                        </p>
                        {formData.id && (
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        await authService.resetPassword(formData.email);
                                        alert("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريد المتدرب بنجاح.");
                                    } catch (err: any) {
                                        alert("فشل إرسال البريد: " + err.message);
                                    }
                                }}
                                className="text-start text-[10px] font-bold text-primary-600 hover:text-primary-700 underline"
                            >
                                إرسال رابط إعادة تعيين كلمة المرور للمتدرب
                            </button>
                        )}
                    </div>
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

                            {/* MCQ Answer Options */}
                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                                        خيارات الإجابة (اختيار من متعدد)
                                    </label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => {
                                            const newQs = [...formData.questions];
                                            const currentOptions = newQs[idx].options || [];
                                            newQs[idx] = {
                                                ...newQs[idx],
                                                options: [
                                                    ...currentOptions,
                                                    {
                                                        id: `opt-${Date.now()}-${currentOptions.length}`,
                                                        text: { ar: '', fr: '' }
                                                    }
                                                ]
                                            };
                                            setFormData({ ...formData, questions: newQs });
                                        }}
                                    >
                                        + إضافة خيار
                                    </Button>
                                </div>

                                {(!q.options || q.options.length === 0) ? (
                                    <p className="text-xs text-slate-500 italic">
                                        أضف خيارات لتحويل هذا السؤال إلى اختيار من متعدد. إذا لم تضف خيارات، سيكون سؤالاً مفتوحاً.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {q.options.map((option, optIdx) => (
                                            <div
                                                key={option.id}
                                                className="flex gap-3 items-start bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all"
                                            >
                                                {/* Radio button for correct answer */}
                                                <div className="flex items-center pt-7">
                                                    <input
                                                        type="radio"
                                                        name={`correct-answer-${idx}`}
                                                        checked={q.correctAnswerId === option.id}
                                                        onChange={() => {
                                                            const newQs = [...formData.questions];
                                                            newQs[idx] = { ...newQs[idx], correctAnswerId: option.id };
                                                            setFormData({ ...formData, questions: newQs });
                                                        }}
                                                        className="h-5 w-5 text-green-600 focus:ring-green-500 focus:ring-2"
                                                        title="حدد كإجابة صحيحة"
                                                    />
                                                </div>

                                                {/* Option text inputs */}
                                                <div className="flex-grow">
                                                    <MultilingualInput
                                                        label={`الخيار ${optIdx + 1}`}
                                                        value={option.text}
                                                        name={`q-${idx}-opt-${optIdx}`}
                                                        onChange={(e, lang) => {
                                                            const newQs = [...formData.questions];
                                                            const newOptions = [...(newQs[idx].options || [])];
                                                            newOptions[optIdx] = {
                                                                ...newOptions[optIdx],
                                                                text: { ...newOptions[optIdx].text, [lang]: e.target.value }
                                                            };
                                                            newQs[idx] = { ...newQs[idx], options: newOptions };
                                                            setFormData({ ...formData, questions: newQs });
                                                        }}
                                                    />
                                                    {q.correctAnswerId === option.id && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] text-green-600 font-bold mt-1">
                                                            <CheckCircleIcon className="h-3 w-3" />
                                                            الإجابة الصحيحة
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Remove option button */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newQs = [...formData.questions];
                                                        const newOptions = (newQs[idx].options || []).filter((_, i) => i !== optIdx);
                                                        newQs[idx] = {
                                                            ...newQs[idx],
                                                            options: newOptions,
                                                            correctAnswerId: newQs[idx].correctAnswerId === option.id ? undefined : newQs[idx].correctAnswerId
                                                        };
                                                        setFormData({ ...formData, questions: newQs });
                                                    }}
                                                    className="mt-7 p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="حذف الخيار"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}

                                        {q.options && q.options.length > 0 && !q.correctAnswerId && (
                                            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-xs">
                                                <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                                                <span>تنبيه: لم تحدد الإجابة الصحيحة بعد. استخدم الدائرة بجانب الخيار الصحيح.</span>
                                            </div>
                                        )}
                                    </div>
                                )}
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

const ChatChannelEditForm: React.FC<{ channel: ChatChannel; onSave: (c: ChatChannel) => void; onCancel: () => void }> = ({ channel, onSave, onCancel }) => {
    const { t, locale } = useI18n();
    const [formData, setFormData] = useState<ChatChannel>(channel);

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-xl font-bold">{formData.id ? 'تعديل قناة الذكاء الاصطناعي' : 'إضافة قناة جديدة'}</h3>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={onCancel} size="sm">إلغاء</Button>
                    <Button type="submit" size="sm">حفظ الإعدادات</Button>
                </div>
            </div>
            <div className="space-y-4">
                <MultilingualInput
                    label="اسم القناة"
                    value={formData.name}
                    name="name"
                    onChange={(e, lang) => setFormData({ ...formData, name: { ...formData.name, [lang]: e.target.value } })}
                />
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">الموديل (AI Model)</label>
                        <select
                            value={formData.model}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            className="w-full rounded-md border-slate-300 dark:bg-slate-700 text-sm"
                        >
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Powerful)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">الأيقونة</label>
                        <select
                            value={formData.iconName}
                            onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                            className="w-full rounded-md border-slate-300 dark:bg-slate-700 text-sm"
                        >
                            {Object.keys(iconMap).map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                    </div>
                </div>
                <MultilingualInput
                    label="التعليمات البرمجية (System Prompt)"
                    type="textarea"
                    value={formData.systemPrompt}
                    name="systemPrompt"
                    onChange={(e, lang) => setFormData({ ...formData, systemPrompt: { ...formData.systemPrompt, [lang]: e.target.value } })}
                />
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



const TeamEditForm: React.FC<{ team: Team; specializations: Specialization[]; users: PlatformUser[]; onSave: (t: Team) => void; onCancel: () => void }> = ({ team, specializations, users, onSave, onCancel }) => {
    const { t, locale } = useI18n();
    const [formData, setFormData] = useState<Team>(team);

    const handleMemberToggle = (userName: string) => {
        const currentMembers = formData.members || [];
        const newMembers = currentMembers.includes(userName)
            ? currentMembers.filter(m => m !== userName)
            : [...currentMembers, userName];
        setFormData({ ...formData, members: newMembers });
    };

    const filteredTrainees = useMemo(() => {
        if (!formData.specialization.ar) return [];
        return users.filter(u => u.specialization === formData.specialization.ar);
    }, [users, formData.specialization.ar]);

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-xl font-bold">{formData.id ? 'تعديل الفريق' : 'إنضافة فريق جديد'}</h3>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={onCancel} size="sm">إلغاء</Button>
                    <Button type="submit" size="sm">حفظ الفريق</Button>
                </div>
            </div>

            <div className="space-y-4">
                <MultilingualInput
                    label="اسم الفريق"
                    value={formData.name}
                    name="name"
                    onChange={(e, lang) => setFormData({ ...formData, name: { ...formData.name, [lang]: e.target.value } })}
                />

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
                    <label className="block text-sm font-bold mb-2 text-primary-600">اختيار التخصص التعليمي</label>
                    <select
                        value={formData.specialization.ar}
                        onChange={(e) => {
                            const spec = specializations.find(s => s.name.ar === e.target.value);
                            if (spec) setFormData({ ...formData, specialization: spec.name, members: [], teamLeader: '' });
                        }}
                        className="w-full rounded-md border-slate-300 dark:bg-slate-700 text-sm shadow-sm focus:ring-primary-500"
                    >
                        <option value="">-- اختر التخصص لتحميل المتدربين --</option>
                        {specializations.map(s => <option key={s.id} value={s.name.ar}>{s.name.ar}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">الموعد النهائي للعرض</label>
                        <input
                            type="date"
                            value={formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => setFormData({ ...formData, dueDate: new Date(e.target.value).toISOString() })}
                            className="w-full rounded-md border-slate-300 dark:bg-slate-700 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">قائد الفريق</label>
                        <select
                            value={formData.teamLeader}
                            onChange={(e) => setFormData({ ...formData, teamLeader: e.target.value })}
                            className="w-full rounded-md border-slate-300 dark:bg-slate-700 text-sm disabled:opacity-50"
                            disabled={!formData.members || formData.members.length === 0}
                        >
                            <option value="">-- اختر القائد من الأعضاء --</option>
                            {(formData.members || []).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>

                <MultilingualInput
                    label="عنوان العرض (اختياري)"
                    value={formData.presentationTitle || { ar: '', fr: '' }}
                    name="presentationTitle"
                    onChange={(e, lang) => setFormData({ ...formData, presentationTitle: { ...(formData.presentationTitle || { ar: '', fr: '' }), [lang]: e.target.value } })}
                />

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-bold">أعضاء الفريق المتخصصين</label>
                        <span className="text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                            {filteredTrainees.length} متدرب متاح
                        </span>
                    </div>

                    {filteredTrainees.length === 0 ? (
                        <div className="text-center py-8 border rounded-md bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs italic">
                            {formData.specialization.ar ? 'لا يوجد متدربون مسجلون في هذا التخصص حالياً' : 'يرجى اختيار تخصص لعرض المتدربين'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-3 border rounded-md dark:border-slate-700 bg-white dark:bg-slate-900 shadow-inner">
                            {filteredTrainees.map(u => (
                                <label
                                    key={u.id}
                                    className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${(formData.members || []).includes(u.name)
                                        ? 'bg-primary-50 border-primary-500 ring-1 ring-primary-500'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={(formData.members || []).includes(u.name)}
                                        onChange={() => handleMemberToggle(u.name)}
                                        className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                                    />
                                    <div className="flex flex-col">
                                        <span className={`text-xs font-bold ${(formData.members || []).includes(u.name) ? 'text-primary-700' : ''}`}>
                                            {u.name}
                                        </span>
                                        {u.phone && <span className="text-[9px] text-slate-400">{u.phone}</span>}
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
};

const AdminPage: React.FC<any> = (props) => {
    const { t, locale } = useI18n();
    const { getApiKey, clearApiKey } = useAi();
    const [activeTab, setActiveTab] = useState<AdminTab>('content');
    const [activeContentType, setActiveContentType] = useState<'texts' | 'skills' | 'specializations' | 'chat-channels' | 'teams'>('texts');
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>([]);
    const [chatChannels, setChatChannels] = useState<ChatChannel[]>([]);

    // Admin Settings States
    const [adminCurrentPass, setAdminCurrentPass] = useState('');
    const [adminNewPass, setAdminNewPass] = useState('');
    const [adminMsg, setAdminMsg] = useState({ text: '', type: '' });

    useEffect(() => {
        if (activeTab === 'users' || activeTab === 'reports') {
            loadUsers();
        }
        if (activeTab === 'content') {
            loadChatChannels();
            // Load users for team management if needed
            if (activeContentType === 'teams') loadUsers();
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

    const loadChatChannels = async () => {
        try {
            const channels = await db.getChatChannels();
            setChatChannels(channels);
        } catch (e) { console.error(e); }
    };

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
        } catch (e: any) {
            console.error('Error saving user:', e);
            alert(`حدث خطأ أثناء حفظ المتدرب: ${e.message || 'خطأ غير معروف'}`);
        }
        finally { setIsLoading(false); }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المتدرب؟')) return;
        setIsLoading(true);
        try {
            await authService.deleteUser(id);
            await loadUsers();
        } catch (e: any) {
            console.error('Error deleting user:', e);
            alert(`حدث خطأ أثناء حذف المتدرب: ${e.message || 'خطأ غير معروف'}`);
        }
        finally { setIsLoading(false); }
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const reader = new FileReader();

            const processData = async (content: string, isText: boolean) => {
                let trainees: any[] = [];
                try {
                    if (file.type === 'application/json' || file.name.endsWith('.json')) {
                        trainees = JSON.parse(content);
                    } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                        const lines = content.split('\n').filter(l => l.trim());
                        if (lines.length > 0) {
                            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                            trainees = lines.slice(1).map(line => {
                                const values = line.split(',').map(v => v.trim());
                                const t: any = {};
                                headers.forEach((h, i) => {
                                    if (h.includes('name') || h.includes('اسم')) t.name = values[i];
                                    if (h.includes('email') || h.includes('بريد') || h.includes('ايميل')) t.email = values[i];
                                    if (h.includes('spec') || h.includes('تخصص')) t.specialization = values[i];
                                    if (h.includes('phone') || h.includes('هاتف')) t.phone = values[i];
                                });
                                return t;
                            });
                        }
                    } else {
                        // AI Extraction
                        const base64 = content.split(',')[1] || content;

                        const executeExtraction = async (key: string) => {
                            return await aiService.extractTraineesFromDocument(base64, file.type, key);
                        };

                        const currentApiKey = await getApiKey();
                        try {
                            trainees = await executeExtraction(currentApiKey);
                        } catch (innerErr: any) {
                            if (innerErr.message.includes('AUTH_ERROR')) {
                                clearApiKey();
                                const newKey = await getApiKey();
                                trainees = await executeExtraction(newKey);
                            } else {
                                throw innerErr;
                            }
                        }
                    }

                    if (trainees && trainees.length > 0) {
                        const confirmed = confirm(`تم العثور على ${trainees.length} متدربين. هل تود استيرادهم الآن؟`);
                        if (confirmed) {
                            let count = 0;
                            for (const t of trainees) {
                                try {
                                    if (t.name && t.email) {
                                        await authService.saveUser({
                                            id: '',
                                            name: t.name,
                                            email: t.email,
                                            specialization: t.specialization || '',
                                            phone: t.phone || '',
                                            role: 'متدرب',
                                            status: 'نشط',
                                            mustChangePassword: true
                                        });
                                        count++;
                                    }
                                } catch (err) {
                                    console.error(`Error importing ${t.email}:`, err);
                                }
                            }
                            alert(`تم استيراد ${count} متدربين بنجاح.`);
                            await loadUsers();
                        }
                    } else {
                        alert('لم يتم العثور على بيانات صالحة في الملف.');
                    }
                } catch (err: any) {
                    alert(`فشل في معالجة الملف: ${err.message}`);
                } finally {
                    setIsLoading(false);
                    e.target.value = '';
                }
            };

            if (file.type === 'application/json' || file.type === 'text/csv' || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
                reader.onload = (event) => processData(event.target?.result as string, true);
                reader.readAsText(file);
            } else {
                reader.onload = (event) => processData(event.target?.result as string, false);
                reader.readAsDataURL(file);
            }
        } catch (e: any) {
            alert(`حدث خطأ: ${e.message}`);
            setIsLoading(false);
        }
    };

    const handleSaveText = async (text: TextData) => {
        setIsLoading(true);
        try {
            console.log('Saving individual text:', text);
            await db.saveText(text);
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
            console.log('Saving individual skill:', skill);
            await db.saveSkill(skill);
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
            console.log('Saving individual specialization:', spec);
            await db.saveSpecialization(spec);
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

    const handleSaveChatChannel = async (channel: ChatChannel) => {
        setIsLoading(true);
        try {
            await db.saveChatChannels([...chatChannels.filter(c => c.id !== channel.id), channel]);
            await loadChatChannels();
            setEditingItem(null);
            if (props.refreshData) props.refreshData();
        } catch (e: any) {
            alert(`حدث خطأ أثناء حفظ القناة: ${e.message}`);
        } finally { setIsLoading(false); }
    };

    const handleDeleteChatChannel = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه القناة؟')) return;
        setIsLoading(true);
        try {
            await db.deleteChatChannel(id);
            await loadChatChannels();
        } catch (e) { alert("حدث خطأ أثناء حذف القناة"); }
        finally { setIsLoading(false); }
    };

    const handleSaveTeam = async (team: Team) => {
        setIsLoading(true);
        try {
            await db.saveTeam(team);
            setEditingItem(null);
            if (props.refreshData) props.refreshData();
        } catch (e: any) {
            alert(`حدث خطأ أثناء حفظ الفريق: ${e.message}`);
        } finally { setIsLoading(false); }
    };

    const handleDeleteTeam = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا الفريق؟')) return;
        setIsLoading(true);
        try {
            await db.deleteTeam(id);
            if (props.refreshData) props.refreshData();
        } catch (e) { alert("حدث خطأ أثناء حذف الفريق"); }
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
                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit flex-wrap">
                        {['texts', 'skills', 'specializations', 'chat-channels', 'teams'].map((type: any) => (
                            <button key={type} onClick={() => { setActiveContentType(type); setEditingItem(null); }} className={`px-4 py-2 text-xs font-bold rounded-md ${activeContentType === type ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500'}`}>
                                {type === 'chat-channels' ? 'قنوات الذكاء الاصطناعي' : type === 'teams' ? 'الفرق والمجموعات' : t(`nav.${type}`)}
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
                            ) : activeContentType === 'chat-channels' ? (
                                <ChatChannelEditForm
                                    channel={editingItem}
                                    onSave={handleSaveChatChannel}
                                    onCancel={() => setEditingItem(null)}
                                />
                            ) : activeContentType === 'teams' ? (
                                <TeamEditForm
                                    team={editingItem}
                                    specializations={props.specializations}
                                    users={platformUsers}
                                    onSave={handleSaveTeam}
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
                                    } else if (activeContentType === 'chat-channels') {
                                        setEditingItem({
                                            id: `ai-${Date.now()}`,
                                            name: { ar: '', fr: '' },
                                            iconName: 'SparklesIcon',
                                            model: 'gemini-1.5-flash',
                                            defaultSystemPrompt: { ar: '', fr: '' },
                                            systemPrompt: { ar: '', fr: '' }
                                        });
                                    } else if (activeContentType === 'teams') {
                                        setEditingItem({
                                            id: Date.now(),
                                            name: { ar: '', fr: '' },
                                            specialization: { ar: '', fr: '' },
                                            members: [],
                                            teamLeader: '',
                                            dueDate: new Date().toISOString(),
                                            presentationTitle: { ar: '', fr: '' },
                                            presentation: null,
                                            presentationData: null,
                                            videoSummaryUrl: null
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
                                {activeContentType === 'chat-channels' && chatChannels.map((c: any) => (
                                    <div key={c.id} className="py-4 flex justify-between items-center text-sm border-b last:border-0 border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors px-2 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-primary-50 dark:bg-slate-700 text-primary-600 rounded-xl shadow-sm">
                                                {iconMap[c.iconName] && React.createElement(iconMap[c.iconName], { className: "h-6 w-6" })}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-slate-100 text-base">{c.name[locale]}</span>
                                                <span className="text-xs text-slate-500 mt-0.5">الموديل: {c.model}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => setEditingItem(c)} className="p-2 hover:bg-primary-100 hover:text-primary-600 text-slate-400 rounded-lg"><PencilIcon className="h-5 w-5" /></button>
                                            <button onClick={() => handleDeleteChatChannel(c.id)} className="p-2 hover:bg-red-100 hover:text-red-600 text-slate-400 rounded-lg"><TrashIcon className="h-5 w-5" /></button>
                                        </div>
                                    </div>
                                ))}
                                {activeContentType === 'teams' && props.teams.map((team: any) => (
                                    <div key={team.id} className="py-4 flex justify-between items-center text-sm border-b last:border-0 border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors px-2 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-primary-50 dark:bg-slate-700 text-primary-600 rounded-xl shadow-sm">
                                                <UsersIcon className="h-6 w-6" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-slate-100 text-base">{team.name[locale]}</span>
                                                <span className="text-xs text-slate-500 mt-0.5">{team.members?.length || 0} أعضاء - قائد: {team.teamLeader || 'غير محدد'}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setEditingItem(team)}
                                                className="p-2 hover:bg-primary-100 hover:text-primary-600 text-slate-400 rounded-lg transition-colors"
                                                title="تعديل"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTeam(team.id)}
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
            )
            }

            {
                activeTab === 'users' && (
                    <div className="space-y-6">
                        {editingItem ? (
                            <Card className="p-6">
                                <UserEditForm user={editingItem} specializations={props.specializations} onSave={handleSaveUser} onCancel={() => setEditingItem(null)} />
                            </Card>
                        ) : (
                            <Card className="glass-panel border-none shadow-soft">
                                <div className="flex items-center justify-between mb-4 flex-wrap gap-2 p-6 pb-0">
                                    <h3 className="font-bold text-lg">{t('admin.traineesList')}</h3>
                                    <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-bold">{platformUsers.length} متدرب</span>
                                </div>
                                <div className="flex justify-end items-center mb-6 px-6">
                                    <div className="flex gap-2">
                                        <label className="cursor-pointer">
                                            <input type="file" className="hidden" onChange={handleImportFile} accept=".csv,.json,.pdf,.png,.jpg,.jpeg,.xlsx,.xls" />
                                            <Button size="sm" variant="secondary" as="div" className="flex items-center gap-1">
                                                <PlusCircleIcon className="h-4 w-4" />
                                                استيراد (AI)
                                            </Button>
                                        </label>
                                        <Button size="sm" onClick={() => setEditingItem({ name: '', email: '', role: 'متدرب', status: 'نشط', mustChangePassword: true })}>
                                            + متدرب جديد
                                        </Button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto p-6 pt-2">
                                    <table className="w-full text-sm min-w-[600px]">
                                        <thead><tr className="text-slate-500 border-b dark:border-slate-700"><th className="pb-3 text-start">الاسم</th><th className="pb-3 text-start">التخصص</th><th className="pb-3 text-start">الحالة</th><th className="pb-3 text-center">الإجراءات</th></tr></thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {platformUsers.map(u => (
                                                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="py-3 font-medium">{u.name}</td>
                                                    <td className="py-3 text-slate-600 dark:text-slate-400">{u.specialization}</td>
                                                    <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.status === 'نشط' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{u.status}</span></td>
                                                    <td className="py-3 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => setEditingItem(u)} className="p-1.5 hover:bg-primary-50 rounded-lg text-primary-600 hover:text-primary-700 transition-colors" title="تعديل"><PencilIcon className="h-4 w-4" /></button>
                                                            <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors" title="حذف"><TrashIcon className="h-4 w-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}
                    </div>
                )
            }

            {
                activeTab === 'reports' && (
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
                )
            }

            {
                activeTab === 'settings' && (
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
                )
            }
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
