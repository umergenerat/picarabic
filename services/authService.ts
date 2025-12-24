
import { User, PlatformUser } from '../types';
import { supabase } from './supabaseClient';

export const ADMIN_EMAIL = 'aitloutouaom@gmail.com';

/**
 * تسجيل الدخول باستخدام Supabase Auth
 */
export const signIn = async (email: string, password: string): Promise<User> => {
    // Demo Mode: allow admin login if Supabase is not configured
    if (!supabase) {
        if (email === ADMIN_EMAIL && password === 'admin') {
            return {
                displayName: 'المدير (Demo)',
                email: ADMIN_EMAIL,
                photoURL: 'https://i.pravatar.cc/150?u=admin',
                mustChangePassword: false
            };
        }
        throw new Error('login.error');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
    });

    if (error) throw new Error('login.error');

    const user = data.user;
    return {
        displayName: user.user_metadata?.display_name || user.email?.split('@')[0],
        email: user.email || '',
        photoURL: user.user_metadata?.photo_url || `https://i.pravatar.cc/150?u=${user.id}`,
        mustChangePassword: user.user_metadata?.must_change_password || false
    };
};

/**
 * تسجيل الخروج
 */
export const signOut = async (): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error signing out:", error);
};

/**
 * تغيير كلمة المرور للمستخدم الحالي
 */
export const changePassword = async (currentPass: string, newPass: string, confirmPass: string): Promise<void> => {
    if (newPass !== confirmPass) throw new Error('changePassword.errorMatch');
    if (!supabase) throw new Error('Action not available in demo mode');
    
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) throw new Error(error.message);
};

/**
 * فرض تغيير كلمة المرور عند أول دخول
 */
export const forceChangePassword = async (email: string, newPass: string, confirmPass: string): Promise<User> => {
    if (newPass !== confirmPass) throw new Error('changePassword.errorMatch');
    if (!supabase) throw new Error('Action not available in demo mode');
    
    const { data, error } = await supabase.auth.updateUser({ 
        password: newPass,
        data: { must_change_password: false }
    });

    if (error) throw new Error(error.message);

    return {
        displayName: data.user.user_metadata?.display_name,
        email: data.user.email || '',
        photoURL: data.user.user_metadata?.photo_url,
        mustChangePassword: false
    };
};

/**
 * جلب قائمة المستخدمين (للمدير)
 */
export const getUsers = async (): Promise<PlatformUser[]> => {
    if (!supabase) {
        return [
            { id: 1, name: 'أحمد العلمي', email: 'ahmed@example.com', phone: '0612345678', specialization: 'كهرباء الصيانة الصناعية', role: 'متدرب', status: 'نشط' },
            { id: 2, name: 'سارة الإدريسي', email: 'sara@example.com', phone: '0687654321', specialization: 'المحاسبة والتدبير', role: 'متدرب', status: 'نشط' },
            { id: 3, name: 'عمر أيت لوتو', email: ADMIN_EMAIL, phone: '0600000000', specialization: 'الإدارة', role: 'مدير', status: 'نشط' },
        ];
    }
    const { data, error } = await supabase.from('profiles').select('*').order('id', { ascending: false });
    if (error) throw error;
    return data || [];
};

/**
 * حفظ أو تحديث بيانات مستخدم
 */
export const saveUser = async (user: PlatformUser): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase.from('profiles').upsert(user);
    if (error) throw error;
};

/**
 * حذف مستخدم
 */
export const deleteUser = async (id: number): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
};
