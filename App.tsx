
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
import { signIn, signOut, ADMIN_EMAIL } from './services/authService';
import * as db from './services/dataService';
import { HomeIcon, BookOpenIcon, SparklesIcon, PresentationChartBarIcon, BeakerIcon, ChatBubbleLeftRightIcon, LinkIcon, ChartPieIcon, Cog6ToothIcon } from './components/common/Icons';
import { useI18n } from './contexts/I18nContext';
import { supabase } from './services/supabaseClient';

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
                    const u = session.user;
                    setUser({
                        displayName: u.user_metadata?.display_name || u.email?.split('@')[0],
                        email: u.email || '',
                        photoURL: u.user_metadata?.photo_url || `https://i.pravatar.cc/150?u=${u.id}`,
                        mustChangePassword: u.user_metadata?.must_change_password
                    });
                }
                loadData();
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                if (session) {
                    const u = session.user;
                    setUser({
                        displayName: u.user_metadata?.display_name,
                        email: u.email || '',
                        photoURL: u.user_metadata?.photo_url,
                        mustChangePassword: u.user_metadata?.must_change_password
                    });
                } else {
                    setUser(null);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [t, s, tm, rc, sp, pd, cc] = await Promise.all([
                db.getTexts(),
                db.getSkills(),
                db.getTeams(),
                db.getResources(),
                db.getSpecializations(),
                db.getProgressData(),
                db.getChatChannels()
            ]);
            setTexts(t);
            setSkills(s);
            setTeams(tm);
            setResources(rc);
            setSpecializations(sp);
            setStudentProgressData(pd);
            setChatChannels(cc);
        } catch (err) {
            console.error("Error loading data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenLoginModal = () => {
        setLoginError('');
        setIsLoginModalOpen(true);
    };

    const handleAttemptLogin = async (email: string, pass: string) => {
        try {
            const loggedInUser = await signIn(email, pass);
            if (loggedInUser.mustChangePassword) {
                setUserForPasswordChange(loggedInUser);
                setIsLoginModalOpen(false);
                setIsForceChangePasswordModalOpen(true);
            } else {
                setUser(loggedInUser);
                setIsLoginModalOpen(false);
                if (loggedInUser.email === ADMIN_EMAIL) {
                    setActivePage('admin');
                }
            }
        } catch (error: any) {
            setLoginError(t(error.message));
        }
    };

    const handleLogout = async () => {
        await signOut();
        setUser(null);
        setActivePage('home');
    };
    
    const isAdmin = user?.email === ADMIN_EMAIL;

    const renderPage = () => {
        if (isLoading) return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
        
        switch (activePage) {
            case 'home': return <HomePage />;
            case 'texts': return user ? <TextsSection texts={texts} /> : <LoginRequired onLogin={handleOpenLoginModal} />;
            case 'skills': return user ? <SkillsSection skills={skills} completedSkills={completedSkills} setCompletedSkills={setCompletedSkills} specializations={specializations} /> : <LoginRequired onLogin={handleOpenLoginModal} />;
            case 'presentations': return <PresentationsSection teams={teams} setTeams={setTeams} user={user} isAdmin={isAdmin} />;
            case 'tests': return user ? <TestsSection testContexts={testContexts} /> : <LoginRequired onLogin={handleOpenLoginModal} />;
            case 'chat': return <ChatSection user={user} chatChannels={chatChannels} setChatChannels={setChatChannels} />;
            case 'resources': return user ? <ResourcesSection resources={resources} /> : <LoginRequired onLogin={handleOpenLoginModal} />;
            case 'dashboard': return <DashboardPage progressData={studentProgressData} />;
            case 'admin': return isAdmin ? <AdminPage 
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
                                /> : <HomePage />;
            default: return <HomePage />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans overflow-hidden">
            <Sidebar activePage={activePage} setActivePage={setActivePage} isAdmin={isAdmin} logoSrc={logoSrc} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} navItems={navItems} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header user={user} onLogin={handleOpenLoginModal} onLogout={handleLogout} logoSrc={logoSrc} onToggleSidebar={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
                    {renderPage()}
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
        </div>
    );
};

export default App;
