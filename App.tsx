
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import HomePage from './components/pages/HomePage';
import TextsSection from './components/pages/TextsSection';
import SkillsSection from './components/pages/SkillsSection';
import PresentationsSection from './components/pages/PresentationsSection';
import TestsSection from './components/pages/TestsSection';
import ChatSection from './components/pages/ChatSection';
import ResourcesSection from './components/pages/ResourcesSection';
import DashboardPage from './components/pages/DashboardPage';
import AdminPage from './components/pages/AdminPage';
import LoginModal from './components/auth/LoginModal';
import ForceChangePasswordModal from './components/auth/ForceChangePasswordModal';
import LoginRequired from './components/auth/LoginRequired';
import { User, TextData, Skill, Team, TestContext, Page, NavItem, ProgressDataPoint, ChatChannel, Resource, Specialization } from './types';
import { signIn, signOut, getUserProfile, ADMIN_EMAIL } from './services/authService';
import * as db from './services/dataService';
import { HomeIcon, BookOpenIcon, SparklesIcon, PresentationChartBarIcon, BeakerIcon, ChatBubbleLeftRightIcon, LinkIcon, ChartPieIcon, Cog6ToothIcon } from './components/common/Icons';
import { useI18n } from './contexts/I18nContext';
import { supabase } from './services/supabaseClient';
import SmartSupportButton from './components/common/SmartSupportButton';
import AiKeyModal from './components/common/AiKeyModal';

const navItems: Omit<NavItem, 'label'>[] = [
    { id: 'home', labelKey: 'nav.home', icon: HomeIcon, adminOnly: false },
    { id: 'dashboard', labelKey: 'nav.dashboard', icon: ChartPieIcon, adminOnly: false },
    { id: 'texts', labelKey: 'nav.texts', icon: BookOpenIcon, adminOnly: false },
    { id: 'skills', labelKey: 'nav.skills', icon: SparklesIcon, adminOnly: false },
    { id: 'presentations', labelKey: 'nav.presentations', icon: PresentationChartBarIcon, adminOnly: false },
    { id: 'tests', labelKey: 'nav.tests', icon: BeakerIcon, adminOnly: false },
    { id: 'chat', labelKey: 'nav.chat', icon: ChatBubbleLeftRightIcon, adminOnly: false },
    { id: 'resources', labelKey: 'nav.resources', icon: LinkIcon, adminOnly: false },
    { id: 'admin', labelKey: 'nav.admin', icon: Cog6ToothIcon, adminOnly: true },
];

const App: React.FC = () => {
    const [activePage, setActivePage] = useState<Page>('home');
    const [activeChatChannelId, setActiveChatChannelId] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [texts, setTexts] = useState<TextData[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [completedSkills, setCompletedSkills] = useState<number[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [testContexts, setTestContexts] = useState<TestContext[]>([]);
    const [chatChannels, setChatChannels] = useState<ChatChannel[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [specializations, setSpecializations] = useState<Specialization[]>([]);
    const [studentProgressData, setStudentProgressData] = useState<ProgressDataPoint[]>([]);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isForceChangePasswordModalOpen, setIsForceChangePasswordModalOpen] = useState(false);
    const [userForPasswordChange, setUserForPasswordChange] = useState<User | null>(null);
    const [loginError, setLoginError] = useState('');
    const [logoSrc, setLogoSrc] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useI18n();

    // التحقق من الجلسة عند بدء التطبيق
    useEffect(() => {
        if (!supabase) {
            loadData();
            return;
        }

        let mounted = true;

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted) {
                if (session) {
                    const metadata = session.user.user_metadata;
                    const loggedInUser: User = {
                        id: session.user.id,
                        displayName: metadata?.display_name || metadata?.name || session.user.email?.split('@')[0] || 'User',
                        email: session.user.email || '',
                        photoURL: metadata?.photo_url || `https://i.pravatar.cc/150?u=${session.user.id}`,
                        mustChangePassword: metadata?.must_change_password
                    };
                    setUser(loggedInUser);

                    // Fetch full profile in background but set user now
                    getUserProfile(session.user.id).then(profile => {
                        if (mounted && profile) setUser(prev => ({ ...prev, ...profile }));
                    });
                }
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (mounted) {
                if (event === 'SIGNED_IN' && session) {
                    const metadata = session.user.user_metadata;
                    const loggedInUser: User = {
                        id: session.user.id,
                        displayName: metadata?.display_name || metadata?.name,
                        email: session.user.email || '',
                        photoURL: metadata?.photo_url,
                        mustChangePassword: metadata?.must_change_password
                    };
                    setUser(loggedInUser);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setCompletedSkills([]);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const loadData = async (userId?: string) => {
        const startTime = performance.now();
        // We only set isLoading(true) if we don't have any data yet (first load)
        const isInitialLoad = texts.length === 0;
        if (isInitialLoad) setIsLoading(true);

        console.log(`loadData triggered for user: ${userId || 'anonymous'} at ${startTime}`);

        try {
            // Define fetchers with their corresponding setters
            const fetchers = [
                { id: 'texts', fn: db.getTexts, set: setTexts },
                { id: 'skills', fn: db.getSkills, set: setSkills },
                { id: 'teams', fn: db.getTeams, set: setTeams },
                { id: 'resources', fn: db.getResources, set: setResources },
                { id: 'specializations', fn: db.getSpecializations, set: setSpecializations },
                { id: 'progress', fn: db.getProgressData, set: setStudentProgressData },
                { id: 'chat', fn: db.getChatChannels, set: setChatChannels },
                { id: 'tests', fn: db.getTestContexts, set: setTestContexts }
            ];

            // Start all fetches in parallel and update state as each one completes
            const promises = fetchers.map(async (f) => {
                const s = performance.now();
                try {
                    const data = await f.fn();
                    f.set(data);
                    console.log(`Fetch ${f.id} took: ${performance.now() - s}ms`);
                } catch (err) {
                    console.error(`Error loading data from ${f.id}:`, err);
                }
            });

            // Handle user-specific data
            if (userId) {
                promises.push((async () => {
                    const s = performance.now();
                    try {
                        const cs = await db.getCompletedSkills(userId);
                        setCompletedSkills(cs);
                        console.log(`Fetch completedSkills took: ${performance.now() - s}ms`);
                    } catch (err) {
                        console.error("Error loading completed skills:", err);
                    }
                })());
            }

            // We await all promises to know when the BIG loading operation is finished
            await Promise.all(promises);
            console.log(`Core data load finished in: ${performance.now() - startTime}ms`);
        } catch (err) {
            console.error("Error in loadData:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Effect to handle data loading when user changes
    // This centralizes loading and prevents multiple calls
    useEffect(() => {
        loadData(user?.id);
    }, [user?.id]);

    const handleOpenLoginModal = () => {
        setLoginError('');
        setIsLoginModalOpen(true);
    };

    const handleAttemptLogin = async (email: string, pass: string) => {
        try {
            const loggedInUser = await signIn(email, pass);
            // Close modal IMMEDIATELY for better perceived performance
            setIsLoginModalOpen(false);

            if (loggedInUser.mustChangePassword) {
                setUserForPasswordChange(loggedInUser);
                setIsForceChangePasswordModalOpen(true);
            } else {
                setUser(loggedInUser);
                if (loggedInUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
                    setActivePage('admin');
                }
                // loadData(loggedInUser.id); // Removed: useEffect handles this
            }
        } catch (error: any) {
            console.error("Login attempt failed:", error);
            const errorMessage = t(error.message);
            // If translation returns the key itself or empty (depending on i18n implementation), show raw message
            setLoginError(errorMessage !== error.message ? errorMessage : `${t('login.error')} (${error.message})`);
        }
    };

    const handleLogout = async () => {
        await signOut();
        setUser(null);
        setActivePage('home');
    };

    const handleExit = async () => {
        if (window.confirm(t('global.exitConfirm'))) {
            setIsLoading(true);
            try {
                await signOut();
                setUser(null);
                setCompletedSkills([]);
                setActivePage('home');
                // Redirect to a clean state or show a temporary farewell if needed
                window.location.reload(); // Optional: force a full reload to clear all memory states
            } catch (error) {
                console.error("Exit failed:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Prompt user before closing tab if logged in
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (user) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [user]);

    const isAdmin = user?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    const navigateToChat = (channelId: string) => {
        setActiveChatChannelId(channelId);
        setActivePage('chat');
    };

    const renderPage = () => {
        // Home page is always instantly available
        if (activePage === 'home') return <HomePage />;

        // Helper to render a page with a partial loading state if it's the first time
        const withLoader = (component: React.ReactNode, isDataReady: boolean) => {
            if (activePage === 'admin' && isLoading) {
                // Admin page usually needs everything, so keep the global loader
                return (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                );
            }

            if (!isDataReady && isLoading) {
                return (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                );
            }
            return component;
        };

        switch (activePage) {
            case 'texts':
                return user ? withLoader(<TextsSection texts={texts} skills={skills} />, texts.length > 0) : <LoginRequired onLogin={handleOpenLoginModal} />;
            case 'skills':
                return user ? withLoader(<SkillsSection skills={skills} completedSkills={completedSkills} setCompletedSkills={setCompletedSkills} specializations={specializations} user={user} onConsultExpert={() => navigateToChat('soft-skills-expert')} />, skills.length > 0) : <LoginRequired onLogin={handleOpenLoginModal} />;
            case 'presentations':
                return withLoader(<PresentationsSection teams={teams} setTeams={setTeams} user={user} isAdmin={isAdmin} />, teams.length > 0);
            case 'tests':
                return user ? withLoader(<TestsSection texts={texts} skills={skills} />, texts.length > 0 && skills.length > 0) : <LoginRequired onLogin={handleOpenLoginModal} />;
            case 'chat':
                return withLoader(<ChatSection user={user} chatChannels={chatChannels} setChatChannels={setChatChannels} />, chatChannels.length > 0);
            case 'resources':
                return user ? withLoader(<ResourcesSection resources={resources} texts={texts} skills={skills} specializations={specializations} />, resources.length >= 0) : <LoginRequired onLogin={handleOpenLoginModal} />;
            case 'dashboard':
                return withLoader(<DashboardPage progressData={studentProgressData} />, studentProgressData.length > 0);
            case 'admin':
                return isAdmin ? <AdminPage
                    texts={texts} setTexts={setTexts}
                    skills={skills} setSkills={setSkills}
                    teams={teams} setTeams={setTeams}
                    testContexts={testContexts} setTestContexts={setTestContexts}
                    chatChannels={chatChannels} setChatChannels={setChatChannels}
                    resources={resources} setResources={setResources}
                    specializations={specializations} setSpecializations={setSpecializations}
                    logoSrc={logoSrc} setLogoSrc={setLogoSrc}
                    progressData={studentProgressData}
                    setProgressData={setStudentProgressData}
                    refreshData={loadData}
                /> : <HomePage />;
            default: return <HomePage />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans overflow-hidden">
            <Sidebar
                activePage={activePage}
                setActivePage={setActivePage}
                isAdmin={isAdmin}
                logoSrc={logoSrc}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                navItems={navItems}
                onExit={handleExit}
            />
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <Header user={user} onLogin={handleOpenLoginModal} onLogout={handleLogout} logoSrc={logoSrc} onToggleSidebar={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 p-4 sm:p-6 lg:p-8 scroll-smooth will-change-transform">
                    <div key={activePage} className="animate-slide-in-bottom">
                        {renderPage()}
                    </div>
                </main>
            </div>
            {isLoginModalOpen && (
                <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLoginAttempt={handleAttemptLogin} error={loginError} />
            )}
            {isForceChangePasswordModalOpen && userForPasswordChange && (
                <ForceChangePasswordModal
                    user={userForPasswordChange}
                    onClose={() => setIsForceChangePasswordModalOpen(false)}
                    onSuccess={(u) => { setUser(u); setIsForceChangePasswordModalOpen(false); }}
                />
            )}
            <SmartSupportButton onClick={() => {
                setActiveChatChannelId('smart-support');
                setActivePage('chat');
            }} />
            <AiKeyModal />
        </div>
    );
};

export default App;
