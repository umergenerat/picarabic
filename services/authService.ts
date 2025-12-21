
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
        throw new Error('Supabase is not configured. Use demo credentials (admin email + "admin" password) for testing.');
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

// وظائف إدارة المستخدمين (للمدير)
export const getUsers = async (): Promise<any[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data;
};

// FIX: Added addUser function to insert a new user profile into Supabase.
export const addUser = async (userData: Omit<PlatformUser, 'id'>): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase.from('profiles').insert(userData);
    if (error) throw error;
};

// FIX: Added updateUser function to update an existing user profile in Supabase.
export const updateUser = async (userData: PlatformUser): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase.from('profiles').update(userData).eq('id', userData.id);
    if (error) throw error;
};

// FIX: Added deleteUser function to remove a user profile from Supabase.
export const deleteUser = async (id: number): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
};

// FIX: Added deleteMultipleUsers function to remove multiple user profiles from Supabase.
export const deleteMultipleUsers = async (ids: number[]): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase.from('profiles').delete().in('id', ids);
    if (error) throw error;
};
