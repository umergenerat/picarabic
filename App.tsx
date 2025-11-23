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
import { getTexts, saveTexts, getSkills, saveSkills, getTeams, saveTeams, getTestContexts, saveTestContexts, getProgressData, saveProgressData, getChatChannels, saveChatChannels, getResources, saveResources, getCompletedSkills, saveCompletedSkills, getSpecializations, saveSpecializations } from './services/dataService';
import { HomeIcon, BookOpenIcon, SparklesIcon, PresentationChartBarIcon, BeakerIcon, ChatBubbleLeftRightIcon, LinkIcon, ChartPieIcon, Cog6ToothIcon } from './components/common/Icons';
import { useI18n } from './contexts/I18nContext';

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
    const [texts, setTexts] = useState<TextData[]>(getTexts());
    const [skills, setSkills] = useState<Skill[]>(getSkills());
    const [completedSkills, setCompletedSkills] = useState<number[]>(getCompletedSkills());
    const [teams, setTeams] = useState<Team[]>(getTeams());
    const [testContexts, setTestContexts] = useState<TestContext[]>(getTestContexts());
    const [chatChannels, setChatChannels] = useState<ChatChannel[]>(getChatChannels());
    const [resources, setResources] = useState<Resource[]>(getResources());
    const [specializations, setSpecializations] = useState<Specialization[]>(getSpecializations());
    const [studentProgressData, setStudentProgressData] = useState<ProgressDataPoint[]>(getProgressData());
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isForceChangePasswordModalOpen, setIsForceChangePasswordModalOpen] = useState(false);
    const [userForPasswordChange, setUserForPasswordChange] = useState<User | null>(null);
    const [loginError, setLoginError] = useState('');
    const [logoSrc, setLogoSrc] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { t } = useI18n();
    const storageErrorAlertShown = useRef(false);

    const handleStorageError = (e: any) => {
        if (e instanceof Error && e.message === 'global.storageFullError') {
            if (!storageErrorAlertShown.current) {
                storageErrorAlertShown.current = true;
                alert(t('global.storageFullError'));
                setTimeout(() => {
                    storageErrorAlertShown.current = false;
                }, 3000);
            }
        }
    };


    useEffect(() => {
        const savedLogo = localStorage.getItem('platformLogo');
        if (savedLogo) {
            setLogoSrc(savedLogo);
        }
    }, []);

    // Persist content changes to localStorage
    useEffect(() => { try { saveTexts(texts); } catch (e) { handleStorageError(e); } }, [texts]);
    useEffect(() => { try { saveSkills(skills); } catch (e) { handleStorageError(e); } }, [skills]);
    useEffect(() => { try { saveCompletedSkills(completedSkills); } catch (e) { handleStorageError(e); } }, [completedSkills]);
    useEffect(() => { try { saveTeams(teams); } catch (e) { handleStorageError(e); } }, [teams]);
    useEffect(() => { try { saveTestContexts(testContexts); } catch (e) { handleStorageError(e); } }, [testContexts]);
    useEffect(() => { try { saveChatChannels(chatChannels); } catch (e) { handleStorageError(e); } }, [chatChannels]);
    useEffect(() => { try { saveResources(resources); } catch (e) { handleStorageError(e); } }, [resources]);
    useEffect(() => { try { saveProgressData(studentProgressData); } catch (e) { handleStorageError(e); } }, [studentProgressData]);
    useEffect(() => { try { saveSpecializations(specializations); } catch (e) { handleStorageError(e); } }, [specializations]);


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

    const handlePasswordChanged = (updatedUser: User) => {
        setUser(updatedUser);
        setIsForceChangePasswordModalOpen(false);
        setUserForPasswordChange(null);
    }


    const handleLogout = async () => {
        await signOut();
        setUser(null);
        setActivePage('home'); // Redirect to home on logout
    };
    
    const isAdmin = user?.email === ADMIN_EMAIL;

    useEffect(() => {
        // Prevent accessing admin page if not admin
        if (activePage === 'admin' && !isAdmin) {
            setActivePage('home');
        }
    }, [activePage, isAdmin]);


    const renderPage = () => {
        switch (activePage) {
            case 'home':
                return <HomePage />;
            case 'texts':
                return user ? <TextsSection texts={texts} /> : <LoginRequired onLogin={handleOpenLoginModal} />;
            case 'skills':
                return user ? <SkillsSection skills={skills} completedSkills={completedSkills} setCompletedSkills={setCompletedSkills} specializations={specializations} /> : <LoginRequired onLogin={handleOpenLoginModal} />;
            case 'presentations':
                return <PresentationsSection teams={teams} setTeams={setTeams} user={user} isAdmin={isAdmin} />;
            case 'tests':
                return user ? <TestsSection testContexts={testContexts} /> : <LoginRequired onLogin={handleOpenLoginModal} />;
            case 'chat':
                return <ChatSection user={user} chatChannels={chatChannels} setChatChannels={setChatChannels} />;
            case 'resources':
                return user ? <ResourcesSection resources={resources} /> : <LoginRequired onLogin={handleOpenLoginModal} />;
            case 'dashboard':
                return <DashboardPage progressData={studentProgressData} />;
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
                                /> : <HomePage />;
            default:
                return <HomePage />;
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
                <LoginModal
                    isOpen={isLoginModalOpen}
                    onClose={() => setIsLoginModalOpen(false)}
                    onLoginAttempt={handleAttemptLogin}
                    error={loginError}
                />
            )}
            {isForceChangePasswordModalOpen && userForPasswordChange && (
                <ForceChangePasswordModal 
                    user={userForPasswordChange}
                    onClose={() => setIsForceChangePasswordModalOpen(false)} 
                    onSuccess={handlePasswordChanged} 
                />
            )}
        </div>
    );
};

export default App;