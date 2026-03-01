
import { User, PlatformUser } from '../types';
import { supabase } from './supabaseClient';
import emailjs from '@emailjs/browser';

export const ADMIN_EMAIL = 'aitloutouaom@gmail.com';

export const signIn = async (email: string, password: string): Promise<User> => {
    const startTime = performance.now();
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

    const authTime = performance.now();
    console.log(`Supabase Auth took: ${authTime - startTime}ms`);

    if (error) {
        console.error("Supabase Auth sign-in failure:", error.message, error.status);
        throw new Error(error.message || 'login.error');
    }

    // Optimization: Trust metadata for EVERYTHING initially if possible
    const metadata = data.user.user_metadata;
    const initialUser: User = {
        id: data.user.id,
        displayName: metadata?.display_name || metadata?.name || data.user.email?.split('@')[0],
        email: data.user.email || '',
        photoURL: metadata?.photo_url || `https://i.pravatar.cc/150?u=${data.user.id}`,
        mustChangePassword: metadata?.must_change_password || false
    };

    // If we have enough metadata, we can actually return right now and fetch profile in background
    // This makes the transition feel instant!

    // Background profile fetch - don't await it if we have metadata
    // BUT we need must_change_password surely. If it's in metadata, we're good.
    if (metadata && metadata.display_name && metadata.must_change_password !== undefined) {
        console.log("Returning initial user from metadata... Profile fetch will continue in background.");
        supabase.from('profiles').select('name, display_name, photo_url, must_change_password').eq('id', data.user.id).single(); // Fire and forget
        return initialUser;
    }

    // If metadata is sparse, we must wait for profile
    console.log("Metadata sparse, waiting for profile fetch.");
    const profileStart = performance.now();
    const { data: profile } = await supabase
        .from('profiles')
        .select('name, display_name, photo_url, must_change_password')
        .eq('id', data.user.id)
        .single();

    const profileEnd = performance.now();
    console.log(`Profile fetch took: ${profileEnd - profileStart}ms`);

    if (profile) {
        return {
            ...initialUser,
            displayName: profile.name || profile.display_name || initialUser.displayName,
            photoURL: profile.photo_url || initialUser.photoURL,
            mustChangePassword: profile.must_change_password ?? initialUser.mustChangePassword
        };
    }

    return initialUser;
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

// EmailJS configuration - يمكن تعديل هذه القيم من لوحة تحكم emailjs.com
const EMAILJS_SERVICE_ID = 'service_picarabic';
const EMAILJS_TEMPLATE_ID = 'template_forgot_pw';
const EMAILJS_PUBLIC_KEY = 'mVv1MBmOI4j5u4xzW'; // ← ضع مفتاحك العام هنا

export const notifyAdminPasswordReset = async (userEmail: string): Promise<void> => {
    try {
        await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            {
                to_email: ADMIN_EMAIL,
                user_email: userEmail,
                request_time: new Date().toLocaleString('ar-DZ', {
                    timeZone: 'Africa/Algiers',
                    dateStyle: 'full',
                    timeStyle: 'short',
                }),
                platform_name: 'منصة بيك عربيك',
            },
            EMAILJS_PUBLIC_KEY
        );
        console.log(`Admin notified about password reset request from: ${userEmail}`);
    } catch (err) {
        // لا نوقف العملية إذا فشل الإشعار
        console.warn('Failed to notify admin about password reset:', err);
    }
};

export const resetPassword = async (email: string): Promise<void> => {
    // إرسال إشعار للمدير أولاً (بشكل متوازٍ)
    notifyAdminPasswordReset(email);

    if (!supabase) {
        // في وضع التجريبي نعيد رسالة نجاح
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
            // Case 2: Existing User - Update profile and password if provided
            if (user.password) {
                console.log("Updating password for existing user via Edge Function...");
                try {
                    await updateUserPassword(user.id, user.password);
                } catch (passErr: any) {
                    console.error("Password update failed:", passErr);
                    throw new Error(`تم تحديث البيانات ولكن فشل تحديث كلمة المرور: ${passErr.message}`);
                }
            }

            const { error } = await supabase.from('profiles').update({
                name: user.name,
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

export const updateUserPassword = async (userId: string, newPass: string): Promise<void> => {
    if (!supabase) throw new Error("Service not available");

    const { data, error } = await supabase.functions.invoke('admin-update-user', {
        body: { userId, newPassword: newPass }
    });

    if (error) {
        console.error("Edge Function Error:", error);
        throw new Error(error.message || "فشلت عملية تحديث كلمة المرور");
    }

    if (data?.error) {
        throw new Error(data.error);
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
