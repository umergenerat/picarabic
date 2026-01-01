
import { User, PlatformUser } from '../types';
import { supabase } from './supabaseClient';

export const ADMIN_EMAIL = 'aitloutouaom@gmail.com';

export const signIn = async (email: string, password: string): Promise<User> => {
    console.log("Sign-in attempt:", email, "Supabase connected:", !!supabase);

    if (!supabase) {
        console.warn("SUPABASE NOT CONNECTED - Running in demo/offline mode");
        if (email === ADMIN_EMAIL && password === 'admin') {
            return { id: 'demo-admin', displayName: 'المدير (Demo)', email: ADMIN_EMAIL, photoURL: '', mustChangePassword: false };
        }
        throw new Error('login.error');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
    });

    if (error) {
        console.error("Supabase Auth sign-in failure:", error.message, error.status);
        throw new Error(error.message || 'login.error');
    }

    console.log("Supabase Auth success, fetching profile for:", data.user.id);

    // Fetch profile data by user ID (more robust than email)
    const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();

    if (profileError) {
        console.error("Profile fetch error during sign-in:", profileError);
        // We don't throw here to avoid locking out users with missing profiles,
        // but it helps diagnose why 'admin' role might be missing.
    }

    return {
        id: data.user.id,
        displayName: profile?.name || profile?.display_name || data.user.email?.split('@')[0],
        email: data.user.email || '',
        photoURL: profile?.photo_url || `https://i.pravatar.cc/150?u=${data.user.id}`,
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

export const resetPassword = async (email: string): Promise<void> => {
    if (!supabase) {
        // Mock success in demo mode
        console.log(`Reset password email would be sent to ${email}`);
        return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
};

// FIX: Implemented forceChangePassword to support password updates and profile synchronization.
export const forceChangePassword = async (email: string, newPass: string, confirmPass: string): Promise<User> => {
    if (newPass !== confirmPass) throw new Error('changePassword.errorMatch');

    if (!supabase) {
        // Fallback for demo mode
        return { id: 'demo-user', displayName: email.split('@')[0], email, photoURL: '', mustChangePassword: false };
    }

    // Update the password in Auth and sync metadata
    const { data: authData, error: authError } = await supabase.auth.updateUser({
        password: newPass,
        data: { must_change_password: false }
    });
    if (authError) throw new Error(authError.message);

    // Update the must_change_password flag in the profile
    const { error: profileError } = await supabase.from('profiles').update({ must_change_password: false }).eq('email', email);
    if (profileError) throw new Error(profileError.message);

    // Fetch updated profile data
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).single();

    return {
        id: profile?.id || authData.user.id,
        displayName: profile?.name || profile?.display_name || email.split('@')[0],
        email: email,
        photoURL: profile?.photo_url || `https://i.pravatar.cc/150?u=${authData.user.id}`,
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

    try {
        if (!user.id) {
            // Case 1: New User - Must create in Auth first
            const userPassword = user.password || '12345678';
            if (userPassword.length < 6) throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");

            const mustChange = user.mustChangePassword !== undefined ? user.mustChangePassword : true;

            const { data, error } = await supabase.auth.signUp({
                email: user.email,
                password: userPassword,
                options: {
                    data: {
                        display_name: user.name,
                        role: user.role,
                        specialization: user.specialization,
                        phone: user.phone,
                        status: user.status,
                        must_change_password: mustChange
                    }
                }
            });

            if (error) throw error;
            if (!data.user) throw new Error("فشل إنشاء مستخدم جديد في نظام الهوية");

            // Explicitly insert/upsert the profile to ensure data persistence
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: data.user.id,
                email: user.email,
                name: user.name, // Added 'name' for compatibility
                display_name: user.name,
                role: user.role,
                specialization: user.specialization,
                phone: user.phone || null,
                status: user.status || 'نشط',
                must_change_password: mustChange
            });

            if (profileError) {
                console.error('Manual profile creation failed:', profileError);
                throw new Error(`فشل إنشاء ملف المستخدم: ${profileError.message}`);
            }
        } else {
            // Case 2: Existing User - Update profile data
            // Note: We don't update password here because client-side supabase.auth.updateUser 
            // only works for the currently logged-in user.
            if (user.password) {
                console.warn("Attempted to update password for existing user. This is not supported through saveUser for security reasons.");
            }

            const { error } = await supabase.from('profiles').update({
                name: user.name, // Added 'name' for compatibility
                display_name: user.name,
                email: user.email,
                phone: user.phone,
                specialization: user.specialization,
                role: user.role,
                status: user.status,
                must_change_password: user.mustChangePassword || false
            }).eq('id', user.id);

            if (error) throw error;
        }
    } catch (err: any) {
        console.error('Error in saveUser:', err);
        throw err;
    }
};

export const deleteUser = async (id: string): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
};

// Emergency function to initialize admin account from frontend
export const initializeAdmin = async (password: string): Promise<void> => {
    if (!supabase) return;

    const { data, error } = await supabase.auth.signUp({
        email: ADMIN_EMAIL,
        password: password,
        options: {
            data: {
                display_name: 'المدير',
                role: 'مدير',
                status: 'نشط'
            }
        }
    });

    if (error) throw error;

    // Ensure profile is created
    if (data.user) {
        await supabase.from('profiles').upsert({
            id: data.user.id,
            email: ADMIN_EMAIL,
            name: 'المدير',
            display_name: 'المدير',
            role: 'مدير',
            status: 'نشط',
            must_change_password: false
        });
    }
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
    if (!supabase) return null;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!profile) return null;

    return {
        id: profile.id,
        displayName: profile.name || profile.display_name || profile.email.split('@')[0],
        email: profile.email,
        photoURL: profile.photo_url || `https://i.pravatar.cc/150?u=${profile.id}`,
        mustChangePassword: profile.must_change_password || false
    };
};
