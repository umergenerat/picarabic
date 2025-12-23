
import { TextData, Skill, Team, TestContext, ProgressDataPoint, ChatChannel, Resource, Specialization } from '../types';
import { supabase } from './supabaseClient';
import * as initialData from '../data/courseData';

// Helper to check if supabase is ready
const isSupabaseReady = () => !!supabase;

// المهارات (Skills)
export const getSkills = async (): Promise<Skill[]> => {
    if (!isSupabaseReady()) return initialData.initialSkills;
    const { data, error } = await supabase!.from('skills').select('*').order('id', { ascending: true });
    if (error) throw error;
    return (data || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        iconName: item.icon_name
    }));
};

export const saveSkills = async (skills: Skill[]) => {
    if (!isSupabaseReady()) return;
    const items = skills.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        icon_name: s.iconName
    }));
    const { error } = await supabase!.from('skills').upsert(items);
    if (error) throw error;
};

// النصوص (Texts)
export const getTexts = async (): Promise<TextData[]> => {
    if (!isSupabaseReady()) return initialData.initialTexts;
    const { data, error } = await supabase!.from('texts').select('*');
    if (error) throw error;
    return data || [];
};

export const saveTexts = async (texts: TextData[]) => {
    if (!isSupabaseReady()) return;
    const { error } = await supabase!.from('texts').upsert(texts);
    if (error) throw error;
};

// الفرق (Teams)
export const getTeams = async (): Promise<Team[]> => {
    if (!isSupabaseReady()) return initialData.initialTeams;
    const { data, error } = await supabase!.from('teams').select('*');
    if (error) throw error;
    return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        specialization: item.specialization,
        members: item.members,
        presentation: item.presentation,
        presentationData: item.presentation_data,
        videoSummaryUrl: item.video_summary_url,
        presentationTitle: item.presentation_title,
        dueDate: item.due_date,
        teamLeader: item.team_leader
    }));
};

export const saveTeams = async (teams: Team[]) => {
    if (!isSupabaseReady()) return;
    const items = teams.map(t => ({
        id: t.id,
        name: t.name,
        specialization: t.specialization,
        members: t.members,
        presentation: t.presentation,
        presentation_data: t.presentationData,
        video_summary_url: t.videoSummaryUrl,
        presentation_title: t.presentationTitle,
        due_date: t.dueDate,
        team_leader: t.teamLeader
    }));
    const { error } = await supabase!.from('teams').upsert(items);
    if (error) throw error;
};

// المصادر (Resources)
export const getResources = async (): Promise<Resource[]> => {
    if (!isSupabaseReady()) return initialData.initialResources;
    const { data, error } = await supabase!.from('resources').select('*');
    if (error) throw error;
    return data || [];
};

export const saveResources = async (resources: Resource[]) => {
    if (!isSupabaseReady()) return;
    const { error } = await supabase!.from('resources').upsert(resources);
    if (error) throw error;
};

// التخصصات (Specializations)
export const getSpecializations = async (): Promise<Specialization[]> => {
    if (!isSupabaseReady()) return initialData.initialSpecializations;
    const { data, error } = await supabase!.from('specializations').select('*');
    if (error) throw error;
    return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        traineeCount: item.trainee_count
    }));
};

export const saveSpecializations = async (specs: Specialization[]) => {
    if (!isSupabaseReady()) return;
    const items = specs.map(s => ({
        id: s.id,
        name: s.name,
        trainee_count: s.traineeCount
    }));
    const { error } = await supabase!.from('specializations').upsert(items);
    if (error) throw error;
};

// قنوات الدردشة
export const getChatChannels = async (): Promise<ChatChannel[]> => {
    if (!isSupabaseReady()) return initialData.initialChatChannels;
    const { data, error } = await supabase!.from('chat_channels').select('*');
    if (error) throw error;
    return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        defaultSystemPrompt: item.default_system_prompt,
        systemPrompt: item.system_prompt,
        iconName: item.icon_name,
        model: item.model
    }));
};

export const saveChatChannels = async (channels: ChatChannel[]) => {
    if (!isSupabaseReady()) return;
    const items = channels.map(c => ({
        id: c.id,
        name: c.name,
        default_system_prompt: c.defaultSystemPrompt,
        system_prompt: c.systemPrompt,
        icon_name: c.iconName,
        model: c.model
    }));
    const { error } = await supabase!.from('chat_channels').upsert(items);
    if (error) throw error;
};

// المهارات المكتملة
export const getCompletedSkills = async (userId: string): Promise<number[]> => {
    if (!isSupabaseReady()) return [];
    const { data, error } = await supabase!.from('completed_skills').select('skill_id').eq('user_id', userId);
    if (error) throw error;
    return data.map(item => item.skill_id);
};

export const saveCompletedSkill = async (userId: string, skillId: number) => {
    if (!isSupabaseReady()) return;
    const { error } = await supabase!.from('completed_skills').insert({ user_id: userId, skill_id: skillId });
    if (error) throw error;
};

// بيانات التقدم
export const getProgressData = async (): Promise<ProgressDataPoint[]> => {
    if (!isSupabaseReady()) return initialData.initialProgressData;
    const { data, error } = await supabase!.from('progress_data').select('*').order('id', { ascending: true });
    if (error) throw error;
    return (data || []).map(item => ({
        month: item.month,
        completedTexts: item.completed_texts,
        acquiredSkills: item.acquired_skills,
        testScores: item.test_scores
    }));
};

// سياقات الاختبارات (Test Contexts)
export const getTestContexts = async (): Promise<TestContext[]> => {
    if (!isSupabaseReady()) return initialData.initialTestContexts;
    const { data, error } = await supabase!.from('test_contexts').select('*');
    if (error) throw error;
    return data || [];
};

export const saveTestContexts = async (contexts: TestContext[]) => {
    if (!isSupabaseReady()) return;
    const { error } = await supabase!.from('test_contexts').upsert(contexts);
    if (error) throw error;
};

// FIX: Added getChatHistory to retrieve persisted chat messages from localStorage.
export const getChatHistory = (channelId: string): any[] => {
    const saved = localStorage.getItem(`platformChatHistory_${channelId}`);
    return saved ? JSON.parse(saved) : [];
};

// FIX: Added saveChatHistory to persist chat messages to localStorage.
export const saveChatHistory = (channelId: string, history: any[]) => {
    try {
        localStorage.setItem(`platformChatHistory_${channelId}`, JSON.stringify(history));
    } catch (e) {
        throw new Error('global.storageFullError');
    }
};
