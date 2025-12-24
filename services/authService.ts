
import { User, PlatformUser } from '../types';
import { supabase } from './supabaseClient';

export const ADMIN_EMAIL = 'aitloutouaom@gmail.com';

export const signIn = async (email: string, password: string): Promise<User> => {
    if (!supabase) {
        if (email === ADMIN_EMAIL && password === 'admin') {
            return { displayName: 'المدير (Demo)', email: ADMIN_EMAIL, photoURL: '', mustChangePassword: false };
        }
        throw new Error('login.error');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
    });

    if (error) throw new Error('login.error');

    // Fetch profile data
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).single();

    return {
        displayName: profile?.name || data.user.email?.split('@')[0],
        email: data.user.email || '',
        photoURL: `https://i.pravatar.cc/150?u=${data.user.id}`,
        mustChangePassword: profile?.must_change_password || false
    };
};

export const signOut = async (): Promise<void> => {
    if (!supabase) return;
    await supabase.auth.signOut();
};

export const changePassword = async (currentPass: string, newPass: string, confirmPass: string): Promise<void> => {
    if (newPass !== confirmPass) throw new Error('changePassword.errorMatch');
    if (!supabase) throw new Error('Action not available in demo mode');
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) throw new Error(error.message);
};

// FIX: Implemented forceChangePassword to support password updates and profile synchronization.
export const forceChangePassword = async (email: string, newPass: string, confirmPass: string): Promise<User> => {
    if (newPass !== confirmPass) throw new Error('changePassword.errorMatch');
    
    if (!supabase) {
        // Fallback for demo mode
        return { displayName: email.split('@')[0], email, photoURL: '', mustChangePassword: false };
    }

    // Update the password in Auth
    const { data: authData, error: authError } = await supabase.auth.updateUser({ password: newPass });
    if (authError) throw new Error(authError.message);

    // Update the must_change_password flag in the profile
    const { error: profileError } = await supabase.from('profiles').update({ must_change_password: false }).eq('email', email);
    if (profileError) throw new Error(profileError.message);

    // Fetch updated profile data
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).single();

    return {
        displayName: profile?.name || email.split('@')[0],
        email: email,
        photoURL: `https://i.pravatar.cc/150?u=${authData.user.id}`,
        mustChangePassword: false
    };
};

export const getUsers = async (): Promise<PlatformUser[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const saveUser = async (user: PlatformUser): Promise<void> => {
    if (!supabase) return;
    
    // In production, setting another user's password usually happens via a trigger or Edge Function.
    // Here we ensure the profile data is synchronized.
    const { error } = await supabase.from('profiles').upsert({
        id: user.id || undefined, // Supabase uses UUID for ID if linked to Auth
        name: user.name,
        email: user.email,
        phone: user.phone,
        specialization: user.specialization,
        role: user.role,
        status: user.status,
        must_change_password: user.mustChangePassword || false
    });
    
    if (error) throw error;
};

export const deleteUser = async (id: any): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
};
