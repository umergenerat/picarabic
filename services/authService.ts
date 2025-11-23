import { User, PlatformUser } from '../types';

// This is the designated admin email for Omar Ait Loutou
export const ADMIN_EMAIL = 'aitloutouaom@gmail.com';
const USERS_STORAGE_KEY = 'platformUsers';
const ADMIN_PASSWORD_STORAGE_KEY = 'adminPassword';


// --- Admin Password Persistence ---
let ADMIN_PASSWORD = localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) || '123456A';
// Seed admin password on first run
if (!localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY)) {
    localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, ADMIN_PASSWORD);
}

// --- User Data Persistence ---
const initialPlatformUsers: PlatformUser[] = [
    { id: 1, name: 'أحمد علي', email: 'ahmed.ali@example.com', phone: '0611223344', specialization: 'كهرباء الصيانة الصناعية', role: 'متدرب', status: 'نشط', password: 'password123' },
    { id: 2, name: 'فاطمة الزهراء', email: 'fatima.z@example.com', phone: '0655667788', specialization: 'إصلاح المركبات', role: 'متدرب', status: 'نشط', password: 'password456', mustChangePassword: true },
    { id: 3, name: 'يوسف محمد', email: 'youssef.m@example.com', phone: '0699887766', specialization: 'كهرباء الصيانة الصناعية', role: 'متدرب', status: 'غير نشط', password: 'password789' },
    { id: 4, name: 'خالد إبراهيم', email: 'khaled.i@example.com', phone: '0612345678', specialization: 'N/A', role: 'أستاذ', status: 'نشط', password: 'profpassword' },
];

const getUsersFromStorage = (): PlatformUser[] => {
    try {
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (storedUsers) {
            return JSON.parse(storedUsers);
        }
        // If no users in storage, initialize with default and save
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialPlatformUsers));
        return initialPlatformUsers;
    } catch (error) {
        console.error("Failed to parse users from localStorage", error);
        return initialPlatformUsers;
    }
};

const saveUsersToStorage = (users: PlatformUser[]) => {
    try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
        console.error("Failed to save users to localStorage", error);
        if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
            throw new Error('global.storageFullError');
        }
        throw error;
    }
};

// Initialize on load to ensure storage is seeded if empty.
getUsersFromStorage();

/**
 * Signs in a user with email and password.
 */
export const signIn = async (email: string, password: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (trimmedEmail === ADMIN_EMAIL && trimmedPassword === ADMIN_PASSWORD) {
        return { displayName: 'عمر أيت لوتو', email: ADMIN_EMAIL, photoURL: 'https://picsum.photos/seed/omar/100' };
    }

    const platformUsersDB = getUsersFromStorage(); // Always get fresh data
    const foundUser = platformUsersDB.find(user => user.email === trimmedEmail && user.password === trimmedPassword && user.status === 'نشط');
    if (foundUser) {
        return {
            displayName: foundUser.name,
            email: foundUser.email,
            photoURL: `https://i.pravatar.cc/150?u=${foundUser.email}`,
            mustChangePassword: foundUser.mustChangePassword,
        };
    }

    throw new Error('login.error');
};

/**
 * Changes the admin's password.
 */
export const changePassword = async (currentPass: string, newPass: string, confirmPass: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (currentPass.trim() !== ADMIN_PASSWORD) throw new Error('changePassword.errorCurrent');
    if (!newPass || newPass.trim().length < 6) throw new Error('changePassword.errorShort');
    if (newPass.trim() !== confirmPass.trim()) throw new Error('changePassword.errorMatch');
    ADMIN_PASSWORD = newPass.trim();
    localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, ADMIN_PASSWORD);
};

/**
 * Forces a user to change their initial/temporary password.
 */
export const forceChangePassword = async (email: string, newPass: string, confirmPass: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!newPass || newPass.trim().length < 6) throw new Error('changePassword.errorShort');
    if (newPass.trim() !== confirmPass.trim()) throw new Error('changePassword.errorMatch');
    
    const platformUsersDB = getUsersFromStorage();
    const userIndex = platformUsersDB.findIndex(u => u.email === email);
    if (userIndex === -1) throw new Error('login.error');
    
    platformUsersDB[userIndex].password = newPass.trim();
    platformUsersDB[userIndex].mustChangePassword = false;

    saveUsersToStorage(platformUsersDB);

    const updatedUser = platformUsersDB[userIndex];
    return {
        displayName: updatedUser.name,
        email: updatedUser.email,
        photoURL: `https://i.pravatar.cc/150?u=${updatedUser.email}`,
        mustChangePassword: false,
    };
};

/**
 * Mocks signing out.
 */
export const signOut = async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));
};

// --- Admin User Management Functions ---

export const getUsers = async (): Promise<PlatformUser[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getUsersFromStorage();
};

export const addUser = async (user: Omit<PlatformUser, 'id'>): Promise<PlatformUser> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const platformUsersDB = getUsersFromStorage();
    if (platformUsersDB.some(u => u.email === user.email)) {
        throw new Error('admin.users.errorExists');
    }
    const newUser: PlatformUser = { ...user, id: Date.now() };
    const updatedUsers = [...platformUsersDB, newUser];
    saveUsersToStorage(updatedUsers);
    return newUser;
};

export const updateUser = async (user: PlatformUser): Promise<PlatformUser> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const platformUsersDB = getUsersFromStorage();
    const userIndex = platformUsersDB.findIndex(u => u.id === user.id);
    if (userIndex === -1) throw new Error("User not found");
    
    // Check for email collision
    if (platformUsersDB.some(u => u.email === user.email && u.id !== user.id)) {
        throw new Error('admin.users.errorExists');
    }

    platformUsersDB[userIndex] = user;
    saveUsersToStorage(platformUsersDB);
    return user;
};

export const deleteUser = async (userId: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const platformUsersDB = getUsersFromStorage();
    const updatedUsers = platformUsersDB.filter(u => u.id !== userId);
    saveUsersToStorage(updatedUsers);
};

export const deleteMultipleUsers = async (userIds: number[]): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const platformUsersDB = getUsersFromStorage();
    const idsToDelete = new Set(userIds);
    const updatedUsers = platformUsersDB.filter(u => !idsToDelete.has(u.id));
    saveUsersToStorage(updatedUsers);
};