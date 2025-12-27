
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

    // Map snake_case from DB to camelCase for frontend
    return (data || []).map((skill: any) => ({
        ...skill,
        iconName: skill.iconName || skill.icon_name
    }));
};

export const saveSkill = async (skill: Skill) => {
    if (!isSupabaseReady()) return;

    const skillToSave = {
        id: skill.id,
        title: skill.title,
        description: skill.description,
        icon_name: skill.iconName
    };

    console.log('Attempting to save skill:', skillToSave);

    const { error } = await supabase!.from('skills').upsert(skillToSave);
    if (error) {
        console.error('Detailed Supabase Error (Skill):', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        throw error;
    }
};
// Alias for backward compatibility if needed, but we'll update AdminPage
export const saveSkills = async (skills: Skill[]) => {
    for (const skill of skills) await saveSkill(skill);
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

    return (data || []).map((text: any) => ({
        ...text,
        learningObjectives: text.learning_objectives || [],
        skillIds: text.skill_ids || []
    }));
};

export const saveText = async (text: TextData) => {
    if (!isSupabaseReady()) return;

    const textToSave = {
        id: text.id,
        title: text.title,
        specialization: text.specialization,
        content: text.content,
        questions: text.questions || [],
        difficulty: text.difficulty || 'متوسط',
        learning_objectives: text.learningObjectives || [],
        skill_ids: text.skillIds || []
    };

    console.log('Attempting to save text:', textToSave);

    const { error } = await supabase!.from('texts').upsert(textToSave);
    if (error) {
        console.error('Detailed Supabase Error (Text):', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        throw error;
    }
};

export const saveTexts = async (texts: TextData[]) => {
    for (const text of texts) await saveText(text);
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

export const saveTeam = async (team: Team) => {
    if (!isSupabaseReady()) return;

    const teamToSave = {
        id: team.id,
        name: team.name,
        specialization: team.specialization,
        members: team.members,
        presentation: team.presentation,
        presentation_data: team.presentationData,
        video_summary_url: team.videoSummaryUrl,
        presentation_title: team.presentationTitle,
        due_date: team.dueDate,
        team_leader: team.teamLeader
    };

    console.log('Attempting to save team:', teamToSave);

    const { error } = await supabase!.from('teams').upsert(teamToSave);
    if (error) {
        console.error('Detailed Supabase Error (Team):', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        throw error;
    }
};

export const saveTeams = async (teams: Team[]) => {
    for (const team of teams) await saveTeam(team);
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

export const saveResource = async (res: Resource) => {
    if (!isSupabaseReady()) return;

    const resToSave = {
        id: res.id,
        title: res.title,
        type: res.type,
        link: res.link
    };

    console.log('Attempting to save resource:', resToSave);

    const { error } = await supabase!.from('resources').upsert(resToSave);
    if (error) {
        console.error('Detailed Supabase Error (Resource):', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        throw error;
    }
};

export const saveResources = async (resources: Resource[]) => {
    for (const res of resources) await saveResource(res);
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

    // Map snake_case to camelCase
    return (data || []).map((spec: any) => ({
        ...spec,
        traineeCount: spec.trainee_count || spec.traineeCount || 0
    }));
};

export const saveSpecialization = async (spec: Specialization) => {
    if (!isSupabaseReady()) return;

    const specToSave = {
        id: spec.id,
        name: spec.name,
        trainee_count: spec.traineeCount || 0
    };

    console.log('Attempting to save specialization:', specToSave);

    const { error } = await supabase!.from('specializations').upsert(specToSave);
    if (error) {
        console.error('Detailed Supabase Error (Specialization):', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        throw error;
    }
};

export const saveSpecializations = async (specs: Specialization[]) => {
    for (const spec of specs) await saveSpecialization(spec);
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

    // Map snake_case to camelCase
    return (data || []).map((channel: any) => ({
        ...channel,
        iconName: channel.iconName || channel.icon_name,
        defaultSystemPrompt: channel.default_system_prompt,
        systemPrompt: channel.system_prompt
    }));
};

export const saveChatChannels = async (channels: ChatChannel[]) => {
    if (!isSupabaseReady()) return;

    const channelsToSave = channels.map(channel => {
        return {
            id: channel.id,
            name: channel.name,
            icon_name: channel.iconName,
            default_system_prompt: channel.defaultSystemPrompt,
            system_prompt: channel.systemPrompt,
            model: channel.model
        };
    });

    console.log('Attempting to save chat channels:', channelsToSave);

    const { error } = await supabase!.from('chat_channels').upsert(channelsToSave);
    if (error) {
        console.error('Detailed Supabase Error (ChatChannels):', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        throw error;
    }
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

export const saveTestContext = async (ctx: TestContext) => {
    if (!isSupabaseReady()) return;

    const ctxToSave = {
        id: ctx.id,
        title: ctx.title,
        content: ctx.content
    };

    console.log('Attempting to save test context:', ctxToSave);

    const { error } = await supabase!.from('test_contexts').upsert(ctxToSave);
    if (error) {
        console.error('Detailed Supabase Error (TestContext):', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        throw error;
    }
};

export const saveTestContexts = async (contexts: TestContext[]) => {
    for (const ctx of contexts) await saveTestContext(ctx);
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
