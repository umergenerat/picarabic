
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
import * as authService from '../../services/authService';
import * as db from '../../services/dataService';
import Spinner from '../common/Spinner';
import ConfirmationModal from '../common/ConfirmationModal';
import { TextData, PlatformUser, UserRole, Skill, Team, TestContext, Question, QuestionType, ProgressDataPoint, MultilingualString, ChatChannel, Resource, AnswerOption, Specialization } from '../../types';
import Button from '../common/Button';

// --- Simple Chart Components (Keep as defined before) ---
const SimpleLineChart: React.FC<{ data: any[], lines: { key: string, color: string, name: string }[], height?: number }> = ({ data, lines, height = 300 }) => {
    if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-slate-400">لا توجد بيانات</div>;
    const padding = 40; const width = 800; const chartHeight = height; const effectiveWidth = width - padding * 2; const effectiveHeight = chartHeight - padding * 2;
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
                    <line key={tick} x1={padding} y1={getY(maxValue * tick)} x2={width - padding} y2={getY(maxValue * tick)} stroke="#e2e8f0" strokeWidth="1" className="dark:stroke-slate-700" />
                ))}
                {data.map((d, i) => (
                    <text key={i} x={getX(i)} y={chartHeight - 10} textAnchor="middle" fontSize="12" className="fill-slate-500 dark:fill-slate-400">{typeof d.month === 'string' ? d.month.substring(0, 3) : i}</text>
                ))}
                {lines.map(line => {
                    const points = data.map((d, i) => `${getX(i)},${getY(Number(d[line.key] || 0))}`).join(' ');
                    return (
                        <g key={line.key}>
                            <polyline fill="none" stroke={line.color} strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round" />
                             {data.map((d, i) => (
                                <circle key={i} cx={getX(i)} cy={getY(Number(d[line.key] || 0))} r="4" fill={line.color} stroke="white" strokeWidth="2" className="dark:stroke-slate-800" />
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
            <div className="w-48 h-48 rounded-full shadow-inner relative" style={{ background: gradientString }}><div className="absolute inset-0 m-auto w-24 h-24 bg-white dark:bg-slate-800 rounded-full"></div></div>
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

// --- Form Helpers ---
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
                <Component name={`${name}.ar`} value={value.ar} onChange={(e) => onChange(e, 'ar')} placeholder="العربية" {...commonProps} required={!optionalLangs.includes('ar')} />
                <Component name={`${name}.fr`} value={value.fr} onChange={(e) => onChange(e, 'fr')} placeholder="Français" {...commonProps} required={!optionalLangs.includes('fr')} />
            </div>
        </div>
    );
};

// --- Entity Forms ---

const SkillEditForm: React.FC<{ skill: Skill; onSave: (skill: Skill) => void; onCancel: () => void }> = ({ skill, onSave, onCancel }) => {
    const { t } = useI18n();
    const [formData, setFormData] = useState<Skill>(skill);
    const availableIcons = Object.keys(iconMap);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, lang: 'ar' | 'fr') => {
        const { name, value } = e.target;
        const [field] = name.split('.');
        setFormData(prev => ({ ...prev, [field]: { ...(prev[field as keyof Skill] as MultilingualString), [lang]: value } }));
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
            <h3 className="text-xl font-bold">{formData.id ? t('global.edit') : t('global.add')} {t('nav.skills')}</h3>
            <MultilingualInput label={t('admin.skills.formTitle')} name="title" value={formData.title} onChange={handleChange} />
            <MultilingualInput label={t('admin.skills.formDesc')} name="description" value={formData.description} onChange={handleChange} type="textarea" />
            <div>
                <label className="block text-sm font-medium">{t('admin.skills.icon')}</label>
                <select value={formData.iconName} onChange={(e) => setFormData(prev => ({ ...prev, iconName: e.target.value }))} className="mt-1 block w-full rounded-md border-slate-300 dark:bg-slate-700">
                    {availableIcons.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                </select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t"><Button variant="secondary" onClick={onCancel}>{t('global.cancel')}</Button><Button type="submit">{t('global.save')}</Button></div>
        </form>
    );
};

const TeamEditForm: React.FC<{ team: Team; onSave: (team: Team) => void; onCancel: () => void }> = ({ team, onSave, onCancel }) => {
    const { t } = useI18n();
    const [formData, setFormData] = useState<Team>(team);
    const [newMember, setNewMember] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, lang: 'ar' | 'fr') => {
        const { name, value } = e.target;
        const [field] = name.split('.');
        setFormData(prev => ({ ...prev, [field]: { ...(prev[field as keyof Team] as MultilingualString), [lang]: value } }));
    };

    const addMember = () => { if (newMember.trim()) { setFormData(prev => ({ ...prev, members: [...prev.members, newMember.trim()] })); setNewMember(''); } };
    const removeMember = (idx: number) => { setFormData(prev => ({ ...prev, members: prev.members.filter((_, i) => i !== idx) })); };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
            <h3 className="text-xl font-bold">{formData.id ? t('global.edit') : t('global.add')} {t('nav.presentations')}</h3>
            <MultilingualInput label={t('presentations.name')} name="name" value={formData.name} onChange={handleChange} />
            <MultilingualInput label={t('presentations.presentationTitle')} name="presentationTitle" value={formData.presentationTitle} onChange={handleChange} />
            <MultilingualInput label={t('admin.users.specialization')} name="specialization" value={formData.specialization} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">{t('presentations.teamLeader')}</label>
                    <input type="text" value={formData.teamLeader} onChange={(e) => setFormData(prev => ({ ...prev, teamLeader: e.target.value }))} className="mt-1 block w-full rounded-md border-slate-300 dark:bg-slate-700" required />
                </div>
                <div>
                    <label className="block text-sm font-medium">{t('presentations.dueDate')}</label>
                    <input type="date" value={formData.dueDate} onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))} className="mt-1 block w-full rounded-md border-slate-300 dark:bg-slate-700" required />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium">{t('presentations.members')}</label>
                <div className="flex gap-2 mt-1">
                    <input type="text" value={newMember} onChange={(e) => setNewMember(e.target.value)} className="block w-full rounded-md border-slate-300 dark:bg-slate-700" placeholder="اسم العضو..." />
                    <Button type="button" onClick={addMember}>{t('global.add')}</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                    {formData.members.map((m, i) => (
                        <span key={i} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full flex items-center gap-2">
                            {m} <button type="button" onClick={() => removeMember(i)}><XMarkIcon className="h-4 w-4" /></button>
                        </span>
                    ))}
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t"><Button variant="secondary" onClick={onCancel}>{t('global.cancel')}</Button><Button type="submit">{t('global.save')}</Button></div>
        </form>
    );
};

const SpecializationEditForm: React.FC<{ spec: Specialization; onSave: (spec: Specialization) => void; onCancel: () => void }> = ({ spec, onSave, onCancel }) => {
    const { t } = useI18n();
    const [formData, setFormData] = useState<Specialization>(spec);
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
            <h3 className="text-xl font-bold">{formData.id ? t('global.edit') : t('global.add')} {t('admin.users.specialization')}</h3>
            <MultilingualInput label={t('admin.users.name')} name="name" value={formData.name} onChange={(e, lang) => setFormData(prev => ({ ...prev, name: { ...prev.name, [lang]: e.target.value } }))} />
            <div>
                <label className="block text-sm font-medium">{t('admin.reports.traineeCount')}</label>
                <input type="number" value={formData.traineeCount} onChange={(e) => setFormData(prev => ({ ...prev, traineeCount: parseInt(e.target.value) }))} className="mt-1 block w-full rounded-md border-slate-300 dark:bg-slate-700" required />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t"><Button variant="secondary" onClick={onCancel}>{t('global.cancel')}</Button><Button type="submit">{t('global.save')}</Button></div>
        </form>
    );
};

// --- Main Component ---
type AdminTab = 'content' | 'users' | 'reports' | 'settings';
type ContentType = 'texts' | 'skills' | 'teams' | 'specializations';

interface AdminPageProps {
    texts: TextData[]; setTexts: React.Dispatch<React.SetStateAction<TextData[]>>;
    skills: Skill[]; setSkills: React.Dispatch<React.SetStateAction<Skill[]>>;
    teams: Team[]; setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
    testContexts: TestContext[]; setTestContexts: React.Dispatch<React.SetStateAction<TestContext[]>>;
    chatChannels: ChatChannel[]; setChatChannels: React.Dispatch<React.SetStateAction<ChatChannel[]>>;
    resources: Resource[]; setResources: React.Dispatch<React.SetStateAction<Resource[]>>;
    specializations: Specialization[]; setSpecializations: React.Dispatch<React.SetStateAction<Specialization[]>>;
    logoSrc: string | null; setLogoSrc: React.Dispatch<React.SetStateAction<string | null>>;
    progressData: ProgressDataPoint[]; setProgressData: React.Dispatch<React.SetStateAction<ProgressDataPoint[]>>;
}

const AdminPage: React.FC<AdminPageProps> = (props) => {
    const { t, locale } = useI18n();
    const [activeTab, setActiveTab] = useState<AdminTab>('content');
    const [activeContentType, setActiveContentType] = useState<ContentType>('texts');
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async (item: any) => {
        setIsLoading(true);
        try {
            if (activeContentType === 'texts') {
                const updated = item.id.startsWith('new-') ? { ...item, id: String(Date.now()) } : item;
                await db.saveTexts(props.texts.map(t => t.id === item.id ? updated : t).concat(item.id.startsWith('new-') ? [updated] : []).filter((v,i,a) => a.findIndex(x=>x.id===v.id)===i));
                props.setTexts(prev => item.id.startsWith('new-') ? [...prev, updated] : prev.map(t => t.id === item.id ? updated : t));
            } else if (activeContentType === 'skills') {
                const updated = !item.id ? { ...item, id: Date.now() } : item;
                await db.saveSkills([updated]);
                props.setSkills(prev => !item.id ? [...prev, updated] : prev.map(s => s.id === item.id ? updated : s));
            } else if (activeContentType === 'teams') {
                const updated = !item.id ? { ...item, id: Date.now() } : item;
                await db.saveTeams([updated]);
                props.setTeams(prev => !item.id ? [...prev, updated] : prev.map(tm => tm.id === item.id ? updated : tm));
            } else if (activeContentType === 'specializations') {
                await db.saveSpecializations([item]);
                props.setSpecializations(prev => prev.some(s=>s.id===item.id) ? prev.map(s => s.id === item.id ? item : s) : [...prev, item]);
            }
            setEditingItem(null);
        } catch (err) { console.error("Save failed:", err); }
        finally { setIsLoading(false); }
    };

    const handleDelete = async (id: any) => {
        if (!window.confirm(t('global.confirmDelete'))) return;
        setIsLoading(true);
        try {
            if (activeContentType === 'texts') { await db.deleteText(id); props.setTexts(prev => prev.filter(t => t.id !== id)); }
            else if (activeContentType === 'skills') { await db.deleteSkill(id); props.setSkills(prev => prev.filter(s => s.id !== id)); }
            else if (activeContentType === 'teams') { await db.deleteTeam(id); props.setTeams(prev => prev.filter(tm => tm.id !== id)); }
            else if (activeContentType === 'specializations') { await db.deleteSpecialization(id); props.setSpecializations(prev => prev.filter(s => s.id !== id)); }
        } catch (err) { console.error("Delete failed:", err); }
        finally { setIsLoading(false); }
    };

    return (
        <div className="space-y-6">
            <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar">
                {(['content', 'users', 'reports', 'settings'] as AdminTab[]).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500'}`}>{t(`admin.tabs.${tab}`)}</button>
                ))}
            </div>

            {activeTab === 'content' && (
                <div className="space-y-6">
                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
                        {(['texts', 'skills', 'teams', 'specializations'] as ContentType[]).map(type => (
                            <button key={type} onClick={() => { setActiveContentType(type); setEditingItem(null); }} className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${activeContentType === type ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}>{t(`nav.${type}`)}</button>
                        ))}
                    </div>

                    {editingItem ? (
                        <Card className="p-6">
                            {activeContentType === 'texts' && <TextEditForm text={editingItem} onSave={handleSave} onCancel={() => setEditingItem(null)} />}
                            {activeContentType === 'skills' && <SkillEditForm skill={editingItem} onSave={handleSave} onCancel={() => setEditingItem(null)} />}
                            {activeContentType === 'teams' && <TeamEditForm team={editingItem} onSave={handleSave} onCancel={() => setEditingItem(null)} />}
                            {activeContentType === 'specializations' && <SpecializationEditForm spec={editingItem} onSave={handleSave} onCancel={() => setEditingItem(null)} />}
                        </Card>
                    ) : (
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">{t(`nav.${activeContentType}`)}</h3>
                                <Button onClick={() => setEditingItem(activeContentType === 'texts' ? { id: `new-${Date.now()}`, title: {ar:'',fr:''}, specialization:{ar:'',fr:''}, content:{ar:'',fr:''}, questions:[] } : activeContentType === 'skills' ? { title: {ar:'',fr:''}, description: {ar:'',fr:''}, iconName: 'SparklesIcon' } : activeContentType === 'teams' ? { name: {ar:'',fr:''}, specialization: {ar:'',fr:''}, members: [], presentationTitle: {ar:'',fr:''}, dueDate: '', teamLeader: '' } : { id: `spec-${Date.now()}`, name: {ar:'',fr:''}, traineeCount: 0 })}>
                                    <PlusCircleIcon className="h-5 w-5 me-2" /> {t('global.add')}
                                </Button>
                            </div>
                            <div className="divide-y dark:divide-slate-700">
                                {activeContentType === 'texts' && props.texts.map(item => (
                                    <div key={item.id} className="py-4 flex justify-between items-center">
                                        <div><p className="font-bold">{item.title[locale]}</p><p className="text-sm text-slate-500">{item.specialization[locale]}</p></div>
                                        <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => setEditingItem(item)}><PencilIcon className="h-4 w-4" /></Button><Button variant="secondary" size="sm" className="!bg-red-50 !text-red-600" onClick={() => handleDelete(item.id)}><TrashIcon className="h-4 w-4" /></Button></div>
                                    </div>
                                ))}
                                {activeContentType === 'skills' && props.skills.map(item => (
                                    <div key={item.id} className="py-4 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            {React.createElement(iconMap[item.iconName] || SparklesIcon, { className: "h-8 w-8 text-primary-500 p-1 bg-primary-50 rounded" })}
                                            <div><p className="font-bold">{item.title[locale]}</p></div>
                                        </div>
                                        <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => setEditingItem(item)}><PencilIcon className="h-4 w-4" /></Button><Button variant="secondary" size="sm" className="!bg-red-50 !text-red-600" onClick={() => handleDelete(item.id)}><TrashIcon className="h-4 w-4" /></Button></div>
                                    </div>
                                ))}
                                {activeContentType === 'teams' && props.teams.map(item => (
                                    <div key={item.id} className="py-4 flex justify-between items-center">
                                        <div><p className="font-bold">{item.name[locale]}</p><p className="text-sm text-slate-500">{item.members.length} {t('presentations.members')}</p></div>
                                        <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => setEditingItem(item)}><PencilIcon className="h-4 w-4" /></Button><Button variant="secondary" size="sm" className="!bg-red-50 !text-red-600" onClick={() => handleDelete(item.id)}><TrashIcon className="h-4 w-4" /></Button></div>
                                    </div>
                                ))}
                                {activeContentType === 'specializations' && props.specializations.map(item => (
                                    <div key={item.id} className="py-4 flex justify-between items-center">
                                        <div><p className="font-bold">{item.name[locale]}</p><p className="text-sm text-slate-500">{item.traineeCount} {t('admin.reports.totalUsers')}</p></div>
                                        <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => setEditingItem(item)}><PencilIcon className="h-4 w-4" /></Button><Button variant="secondary" size="sm" className="!bg-red-50 !text-red-600" onClick={() => handleDelete(item.id)}><TrashIcon className="h-4 w-4" /></Button></div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {activeTab === 'reports' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="p-6 flex items-center"><div className="p-3 rounded-full bg-blue-100 me-4"><UsersIcon className="h-6 w-6 text-blue-600" /></div><div><p className="text-2xl font-bold">{props.specializations.reduce((a,b)=>a+(b.traineeCount||0),0)}</p><p className="text-sm text-slate-500">{t('admin.reports.totalUsers')}</p></div></Card>
                        <Card className="p-6 flex items-center"><div className="p-3 rounded-full bg-teal-100 me-4"><BookOpenIcon className="h-6 w-6 text-teal-600" /></div><div><p className="text-2xl font-bold">{props.texts.length}</p><p className="text-sm text-slate-500">{t('admin.reports.totalTexts')}</p></div></Card>
                        <Card className="p-6 flex items-center"><div className="p-3 rounded-full bg-amber-100 me-4"><SparklesIcon className="h-6 w-6 text-amber-600" /></div><div><p className="text-2xl font-bold">{props.skills.length}</p><p className="text-sm text-slate-500">{t('admin.reports.totalSkills')}</p></div></Card>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Re-used TextEditForm Component from previous version (Expanded for Drag & Drop support) ---
const TextEditForm: React.FC<{ text: TextData; onSave: (text: TextData) => void; onCancel: () => void; }> = ({ text, onSave, onCancel }) => {
    const { t } = useI18n();
    const [formData, setFormData] = useState<TextData>(text);
    const questionTypes: QuestionType[] = ['فهم', 'تحليل', 'مناقشة', 'مفاهيم', 'ابداء الرأي'];
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, lang: 'ar' | 'fr') => {
        const { name, value } = e.target; const [field] = name.split('.');
        setFormData(prev => ({ ...prev, [field]: { ...(prev[field as keyof Pick<TextData, 'title' | 'specialization' | 'content'>]), [lang]: value } }));
    };
    const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>, lang: 'ar' | 'fr', id: string) => {
        setFormData(prev => ({ ...prev, questions: prev.questions.map(q => q.id === id ? { ...q, text: { ...q.text, [lang]: e.target.value } } : q) }));
    };
    const handleAddQuestion = () => { setFormData(prev => ({ ...prev, questions: [...prev.questions, { id: `q-${Date.now()}`, text: { ar: '', fr: '' }, type: 'فهم', options: [] }] })); };
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
            <MultilingualInput label={t('admin.skills.formTitle')} name="title" value={formData.title} onChange={handleChange} />
            <MultilingualInput label={t('admin.users.specialization')} name="specialization" value={formData.specialization} onChange={handleChange} />
            <MultilingualInput label={t('admin.tabs.content')} name="content" value={formData.content} onChange={handleChange} type="textarea" />
            <div className="space-y-4">
                <h4 className="font-bold">{t('admin.texts.manageQuestions')}</h4>
                {formData.questions.map((q, i) => (
                    <div key={q.id} className="p-4 border rounded-md bg-slate-50 dark:bg-slate-800 relative">
                        <button type="button" onClick={() => setFormData(p => ({ ...p, questions: p.questions.filter(x => x.id !== q.id) }))} className="absolute top-2 left-2 text-red-500"><TrashIcon className="h-4 w-4" /></button>
                        <MultilingualInput label={`${t('admin.texts.questionText')} ${i+1}`} name={`q-${q.id}`} value={q.text} onChange={(e, l) => handleQuestionChange(e as any, l, q.id)} type="textarea" />
                    </div>
                ))}
                <Button variant="secondary" onClick={handleAddQuestion}>{t('admin.texts.addQuestion')}</Button>
            </div>
            <div className="flex justify-end gap-3"><Button variant="secondary" onClick={onCancel}>{t('global.cancel')}</Button><Button type="submit">{t('global.save')}</Button></div>
        </form>
    );
};

export default AdminPage;
