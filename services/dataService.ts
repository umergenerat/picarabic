import { TextData, Skill, Team, TestContext, ProgressDataPoint, ChatChannel, Resource, ChatMessage, Specialization } from '../types';
import { initialTexts, initialSkills, initialTeams, initialTestContexts, initialProgressData, initialChatChannels, initialResources, initialSpecializations } from '../data/courseData';

// Keys for localStorage
const TEXTS_STORAGE_KEY = 'platformTexts';
const SKILLS_STORAGE_KEY = 'platformSkills';
const TEAMS_STORAGE_KEY = 'platformTeams';
const TEST_CONTEXTS_STORAGE_KEY = 'platformTestContexts';
const CHAT_CHANNELS_STORAGE_KEY = 'platformChatChannels';
const RESOURCES_STORAGE_KEY = 'platformResources';
const PROGRESS_DATA_STORAGE_KEY = 'platformProgressData';
const CHAT_HISTORY_STORAGE_KEY_PREFIX = 'platformChatHistory_';
const COMPLETED_SKILLS_STORAGE_KEY = 'platformCompletedSkills';
const SPECIALIZATIONS_STORAGE_KEY = 'platformSpecializations';


// Generic getter function to read from localStorage or initialize it
function getDataFromStorage<T>(key: string, initialData: T): T {
    try {
        const storedData = localStorage.getItem(key);
        if (storedData) {
            let parsedData = JSON.parse(storedData);

            // Migration logic for chat channels to ensure new fields are added to old saved data
            if (key === CHAT_CHANNELS_STORAGE_KEY && Array.isArray(parsedData) && Array.isArray(initialData)) {
                const initialChannelsMap = new Map((initialData as any[]).map(c => [c.id, c]));
                parsedData = (parsedData as any[]).map(storedChannel => {
                    const initialChannel = initialChannelsMap.get(storedChannel.id);
                    if (initialChannel) {
                        // Merge initial data as defaults for any missing properties
                        return { ...initialChannel, ...storedChannel };
                    }
                    return storedChannel;
                });
            }
            
            return parsedData as T;
        }
        // If no data in storage, initialize with default and save it
        localStorage.setItem(key, JSON.stringify(initialData));
        return initialData;
    } catch (error) {
        console.error(`Failed to parse ${key} from localStorage`, error);
        return initialData;
    }
}

// Generic setter function to save data to localStorage
function saveDataToStorage<T>(key: string, data: T) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Failed to save ${key} to localStorage`, error);
        if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
            throw new Error('global.storageFullError');
        }
        throw error;
    }
}

// Texts
export const getTexts = (): TextData[] => getDataFromStorage(TEXTS_STORAGE_KEY, initialTexts);
export const saveTexts = (texts: TextData[]) => saveDataToStorage(TEXTS_STORAGE_KEY, texts);

// Skills
export const getSkills = (): Skill[] => getDataFromStorage(SKILLS_STORAGE_KEY, initialSkills);
export const saveSkills = (skills: Skill[]) => saveDataToStorage(SKILLS_STORAGE_KEY, skills);

// Completed Skills
export const getCompletedSkills = (): number[] => getDataFromStorage(COMPLETED_SKILLS_STORAGE_KEY, []);
export const saveCompletedSkills = (skillIds: number[]) => saveDataToStorage(COMPLETED_SKILLS_STORAGE_KEY, skillIds);

// Specializations
export const getSpecializations = (): Specialization[] => getDataFromStorage(SPECIALIZATIONS_STORAGE_KEY, initialSpecializations);
export const saveSpecializations = (specializations: Specialization[]) => saveDataToStorage(SPECIALIZATIONS_STORAGE_KEY, specializations);

// Teams
export const getTeams = (): Team[] => getDataFromStorage(TEAMS_STORAGE_KEY, initialTeams);
export const saveTeams = (teams: Team[]) => saveDataToStorage(TEAMS_STORAGE_KEY, teams);

// Test Contexts
export const getTestContexts = (): TestContext[] => getDataFromStorage(TEST_CONTEXTS_STORAGE_KEY, initialTestContexts);
export const saveTestContexts = (testContexts: TestContext[]) => saveDataToStorage(TEST_CONTEXTS_STORAGE_KEY, testContexts);

// Chat Channels
export const getChatChannels = (): ChatChannel[] => getDataFromStorage(CHAT_CHANNELS_STORAGE_KEY, initialChatChannels);
export const saveChatChannels = (channels: ChatChannel[]) => saveDataToStorage(CHAT_CHANNELS_STORAGE_KEY, channels);

// Resources
export const getResources = (): Resource[] => getDataFromStorage(RESOURCES_STORAGE_KEY, initialResources);
export const saveResources = (resources: Resource[]) => saveDataToStorage(RESOURCES_STORAGE_KEY, resources);

// Progress Data
export const getProgressData = (): ProgressDataPoint[] => getDataFromStorage(PROGRESS_DATA_STORAGE_KEY, initialProgressData);
export const saveProgressData = (data: ProgressDataPoint[]) => saveDataToStorage(PROGRESS_DATA_STORAGE_KEY, data);

// Chat History
export const getChatHistory = (channelId: string): ChatMessage[] | null => {
    const key = `${CHAT_HISTORY_STORAGE_KEY_PREFIX}${channelId}`;
    try {
        const storedData = localStorage.getItem(key);
        if (storedData) {
            return JSON.parse(storedData);
        }
        return null; // Return null if no history exists
    } catch (error) {
        console.error(`Failed to parse chat history for ${channelId}`, error);
        return null;
    }
}

export const saveChatHistory = (channelId: string, messages: ChatMessage[]) => {
    const key = `${CHAT_HISTORY_STORAGE_KEY_PREFIX}${channelId}`;
    saveDataToStorage(key, messages);
}