
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
    return data || [];
};

export const saveSkills = async (skills: Skill[]) => {
    if (!isSupabaseReady()) return;
    const { error } = await supabase!.from('skills').upsert(skills);
    if (error) throw error;
};

export const deleteSkill = async (id: number) => {
    if (!isSupabaseReady()) return;
    const { error } = await supabase!.from('skills').delete().eq('id', id);
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

export const deleteText = async (id: string) => {
    if (!isSupabaseReady()) return;
    const { error } = await supabase!.from('texts').delete().eq('id', id);
    if (error) throw error;
};

// الفرق (Teams)
export const getTeams = async (): Promise<Team[]> => {
    if (!isSupabaseReady()) return initialData.initialTeams;
    const { data, error } = await supabase!.from('teams').select('*');
    if (error) throw error;
    return data || [];
};

export const saveTeams = async (teams: Team[]) => {
    if (!isSupabaseReady()) return;
    const { error } = await supabase!.from('teams').upsert(teams);
    if (error) throw error;
};

export const deleteTeam = async (id: number) => {
    if (!isSupabaseReady()) return;
    const { error } = await supabase!.from('teams').delete().eq('id', id);
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

export const deleteResource = async (id: string) => {
    if (!isSupabaseReady()) return;
    const { error } = await supabase!.from('resources').delete().eq('id', id);
    if (error) throw error;
};

// التخصصات (Specializations)
export const getSpecializations = async (): Promise<Specialization[]> => {
    if (!isSupabaseReady()) return initialData.initialSpecializations;
    const { data, error } = await supabase!.from('specializations').select('*');
    if (error) throw error;
    return data || [];
};

export const saveSpecializations = async (specs: Specialization[]) => {
    if (!isSupabaseReady()) return;
    const { error } = await supabase!.from('specializations').upsert(specs);
    if (error) throw error;
};

export const deleteSpecialization = async (id: string) => {
    if (!isSupabaseReady()) return;
    const { error } = await supabase!.from('specializations').delete().eq('id', id);
    if (error) throw error;
};

// قنوات الدردشة
export const getChatChannels = async (): Promise<ChatChannel[]> => {
    if (!isSupabaseReady()) return initialData.initialChatChannels;
    const { data, error } = await supabase!.from('chat_channels').select('*');
    if (error) throw error;
    return data || [];
};

export const saveChatChannels = async (channels: ChatChannel[]) => {
    if (!isSupabaseReady()) return;
    const { error } = await supabase!.from('chat_channels').upsert(channels);
    if (error) throw error;
};

export const deleteChatChannel = async (id: string) => {
    if (!isSupabaseReady()) return;
    const { error } = await supabase!.from('chat_channels').delete().eq('id', id);
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
    return data || [];
};

// سياقات الاختبارات (Test Contexts)
export const getTestContexts = async (): Promise<TestContext[]> => {
    if (!isSupabaseReady()) return initialData.initialTestContexts;
    const { data, error } = await supabase!.from('test_contexts').select('*').order('id', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const saveTestContexts = async (contexts: TestContext[]) => {
    if (!isSupabaseReady()) return;
    const { error } = await supabase!.from('test_contexts').upsert(contexts);
    if (error) throw error;
};

export const deleteTestContext = async (id: string) => {
    if (!isSupabaseReady()) return;
    const { error } = await supabase!.from('test_contexts').delete().eq('id', id);
    if (error) throw error;
};

export const getChatHistory = (channelId: string): any[] => {
    const saved = localStorage.getItem(`platformChatHistory_${channelId}`);
    return saved ? JSON.parse(saved) : [];
};

export const saveChatHistory = (channelId: string, history: any[]) => {
    try {
        localStorage.setItem(`platformChatHistory_${channelId}`, JSON.stringify(history));
    } catch (e) {
        throw new Error('global.storageFullError');
    }
};
