
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
import Spinner from '../common/Spinner';
import { TextData, PlatformUser, UserRole, Skill, Team, Specialization, MultilingualString, ProgressDataPoint, ChatChannel, Resource, TestContext } from '../../types';
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
                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full rounded-md border-slate-300 dark:bg-slate-700" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full rounded-md border-slate-300 dark:bg-slate-700" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">التخصص</label>
                    <select value={formData.specialization} onChange={(e) => setFormData({...formData, specialization: e.target.value})} className="w-full rounded-md border-slate-300 dark:bg-slate-700">
                        <option value="">-- اختر التخصص --</option>
                        {specializations.map(s => <option key={s.id} value={s.name[locale]}>{s.name[locale]}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">كلمة المرور</label>
                    <input 
                        type="password" 
                        value={formData.password || ''} 
                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                        className="w-full rounded-md border-slate-300 dark:bg-slate-700" 
                        placeholder="••••••••"
                        required={!formData.id}
                    />
                    <p className="text-[10px] text-slate-500 mt-1">سيتم تعيين هذه الكلمة ككلمة مرور افتراضية للحساب.</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" id="forcePass" checked={formData.mustChangePassword} onChange={(e) => setFormData({...formData, mustChangePassword: e.target.checked})} className="rounded text-primary-600" />
                <label htmlFor="forcePass" className="text-sm">فرض تغيير كلمة المرور عند أول دخول</label>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="secondary" onClick={onCancel}>إلغاء</Button>
                <Button type="submit">حفظ المتدرب</Button>
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
                            <button key={type} onClick={() => {setActiveContentType(type); setEditingItem(null);}} className={`px-4 py-2 text-xs font-bold rounded-md ${activeContentType === type ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500'}`}>
                                {t(`nav.${type}`)}
                            </button>
                        ))}
                    </div>

                    {editingItem ? (
                        <Card className="p-6">
                            <form onSubmit={(e) => {e.preventDefault(); /* Logic to save text/skill */ setEditingItem(null);}} className="space-y-4">
                                <MultilingualInput label="العنوان" value={editingItem.title || editingItem.name} name="title" onChange={(e, lang) => {
                                    const field = editingItem.title ? 'title' : 'name';
                                    setEditingItem({...editingItem, [field]: {...editingItem[field], [lang]: e.target.value}});
                                }} />
                                <div className="flex justify-end gap-2">
                                    <Button variant="secondary" onClick={() => setEditingItem(null)}>إلغاء</Button>
                                    <Button type="submit">حفظ التغييرات</Button>
                                </div>
                            </form>
                        </Card>
                    ) : (
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold">قائمة العناصر</h3>
                                <Button size="sm" onClick={() => setEditingItem({id: Date.now(), name: {ar:'',fr:''}, title: {ar:'',fr:''}})}>إضافة جديد</Button>
                            </div>
                            <div className="divide-y dark:divide-slate-700">
                                {activeContentType === 'texts' && props.texts.map((t: any) => (
                                    <div key={t.id} className="py-3 flex justify-between items-center text-sm">
                                        <span>{t.title[locale]}</span>
                                        <div className="flex gap-2"><button onClick={() => setEditingItem(t)}><PencilIcon className="h-4 w-4" /></button></div>
                                    </div>
                                ))}
                                {activeContentType === 'specializations' && props.specializations.map((s: any) => (
                                    <div key={s.id} className="py-3 flex justify-between items-center text-sm">
                                        <span>{s.name[locale]}</span>
                                        <div className="flex gap-2"><button onClick={() => setEditingItem(s)}><PencilIcon className="h-4 w-4" /></button></div>
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
                                <Button size="sm" onClick={() => setEditingItem({name:'', email:'', role:'متدرب', status:'نشط', mustChangePassword:true})}>
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
                                        <div className="bg-primary-500 h-full" style={{width: '65%'}}></div>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                                    <p className="text-xs text-slate-500 mb-1">نسبة التسجيل في "الكهرباء"</p>
                                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                        <div className="bg-blue-500 h-full" style={{width: '40%'}}></div>
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
