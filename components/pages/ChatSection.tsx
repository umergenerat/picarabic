
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { ChatMessage, User, ChatChannel } from '../../types';
import { LockClosedIcon, SparklesIcon, iconMap, Cog6ToothIcon, XMarkIcon, PencilIcon } from '../common/Icons';
import { useI18n } from '../../contexts/I18nContext';
import { GoogleGenAI, Chat } from '@google/genai';
import Spinner from '../common/Spinner';
import { getChatHistory, saveChatHistory } from '../../services/dataService';

const AI_AVATAR_URL = 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a69034.svg';

interface ChatSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    channel: ChatChannel;
    onSave: (updatedChannel: ChatChannel) => void;
    onReset: (channelToReset: ChatChannel) => void;
}

const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({ isOpen, onClose, channel, onSave, onReset }) => {
    const { t, locale } = useI18n();
    const [localChannel, setLocalChannel] = useState(channel);
    const availableModels = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-flash-lite-latest'];

    useEffect(() => {
        setLocalChannel(channel);
    }, [channel]);

    const handleSave = () => {
        onSave(localChannel);
    };

    const handleReset = () => {
        const resetChannel = { ...localChannel, systemPrompt: channel.defaultSystemPrompt };
        setLocalChannel(resetChannel);
        onReset(resetChannel); 
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <Card className="w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('chat.settingsTitle')} - {channel.name[locale]}</h3>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div>
                        <label htmlFor="model-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('chat.model')}</label>
                        <select
                            id="model-select"
                            value={localChannel.model}
                            onChange={(e) => setLocalChannel(prev => ({ ...prev, model: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"
                        >
                            {availableModels.map(model => <option key={model} value={model}>{model}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="system-prompt" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('chat.systemPrompt')}</label>
                        <textarea
                            id="system-prompt"
                            rows={8}
                            value={localChannel.systemPrompt[locale]}
                            onChange={(e) => setLocalChannel(prev => ({ ...prev, systemPrompt: { ...prev.systemPrompt, [locale]: e.target.value } }))}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 font-mono"
                        />
                        <p className="mt-2 text-xs text-slate-500">{t('chat.systemPromptInfo')}</p>
                    </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-between items-center rounded-b-xl">
                    <Button type="button" variant="secondary" onClick={handleReset}>{t('chat.resetToDefault')}</Button>
                    <div className="flex gap-3">
                        <Button type="button" variant="secondary" onClick={onClose}>{t('global.cancel')}</Button>
                        <Button type="button" onClick={handleSave}>{t('global.save')}</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

interface ChatSectionProps {
    user: User | null;
    chatChannels: ChatChannel[];
    setChatChannels: React.Dispatch<React.SetStateAction<ChatChannel[]>>;
}

const ChatSection: React.FC<ChatSectionProps> = ({ user, chatChannels, setChatChannels }) => {
    const { t, locale } = useI18n();
    const [activeChannelId, setActiveChannelId] = useState<string | null>(chatChannels.length > 0 ? chatChannels[0].id : null);
    const activeChannel = chatChannels.find(c => c.id === activeChannelId) || null;
    
    // AI Chat State
    const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const chatSession = useRef<Chat | null>(null);
    const [storageErrorShown, setStorageErrorShown] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [aiMessages, isAiThinking]);
    
    // Persist chat history to localStorage
    useEffect(() => {
        if (activeChannel && aiMessages.length > 0) {
            try {
                saveChatHistory(activeChannel.id, aiMessages);
            } catch (e: any) {
                if (e.message === 'global.storageFullError' && !storageErrorShown) {
                    alert(t('global.storageFullErrorChat'));
                    setStorageErrorShown(true);
                }
            }
        }
    }, [aiMessages, activeChannel, storageErrorShown, t]);

    const initializeChannel = useCallback((channel: ChatChannel) => {
        if (!process.env.API_KEY) {
            console.error("API_KEY is not set in environment variables.");
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            chatSession.current = ai.chats.create({
                model: channel.model || 'gemini-2.5-flash',
                config: {
                    systemInstruction: channel.systemPrompt[locale],
                },
            });
        } catch (error) {
             console.error("Failed to initialize AI client:", error);
        }
        
        const savedHistory = getChatHistory(channel.id);
        if (savedHistory && savedHistory.length > 0) {
            setAiMessages(savedHistory);
        } else {
             const initialAiMessage: ChatMessage = {
                id: 0,
                user: t('chat.aiName'),
                avatar: AI_AVATAR_URL,
                text: t('chat.aiWelcome'),
                timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            };
            setAiMessages([initialAiMessage]);
        }
    }, [locale, t]);

    useEffect(() => {
        if (activeChannel) {
            initializeChannel(activeChannel);
        }
    }, [activeChannel, initializeChannel]);

    const handleChannelChange = (channel: ChatChannel) => {
        setActiveChannelId(channel.id);
    };

    const handleSaveSettings = (updatedChannel: ChatChannel) => {
        setChatChannels(prevChannels =>
            prevChannels.map(c => c.id === updatedChannel.id ? updatedChannel : c)
        );
        setIsSettingsModalOpen(false);
    };

    const handleResetSettings = (channelToReset: ChatChannel) => {
        const resetChannel = {
            ...channelToReset,
            systemPrompt: channelToReset.defaultSystemPrompt,
        };
         setChatChannels(prevChannels =>
            prevChannels.map(c => c.id === resetChannel.id ? resetChannel : c)
        );
    };


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user || !activeChannel) return;
        
        const userMessage: ChatMessage = {
            id: Date.now(),
            user: user.displayName,
            avatar: user.photoURL,
            text: newMessage,
            timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        };

        const messageToSend = newMessage;
        setAiMessages(prev => [...prev, userMessage]);
        setNewMessage('');
        setIsAiThinking(true);
        
        try {
            if (!chatSession.current) {
                 if (!process.env.API_KEY) {
                     throw new Error("API Key is missing. Please configure the application.");
                 }
                 throw new Error("Chat session not initialized.");
            }
            const response = await chatSession.current.sendMessage({ message: messageToSend });
            
            const aiResponse: ChatMessage = {
                id: Date.now() + 1,
                user: t('chat.aiName'),
                avatar: AI_AVATAR_URL,
                text: response.text,
                timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            };
            setAiMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error("Error sending message to AI:", error);
            const errorResponse: ChatMessage = {
                    id: Date.now() + 1,
                user: t('chat.aiName'),
                avatar: AI_AVATAR_URL,
                text: t('chat.aiError'),
                timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            };
            setAiMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsAiThinking(false);
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">{t('chat.title')}</h2>
            <Card className="flex flex-col md:flex-row h-[calc(100vh-200px)]">
                {/* Channels */}
                <div className="w-full md:w-1/4 border-b md:border-b-0 md:border-e border-slate-200 dark:border-slate-700 p-4">
                    <h3 className="font-bold mb-4">{t('chat.channels')}</h3>
                    <ul className="flex flex-row md:flex-col gap-1">
                       {chatChannels.map(channel => {
                           const isCustomized = JSON.stringify(channel.systemPrompt) !== JSON.stringify(channel.defaultSystemPrompt);
                           return (
                                <ChannelButton 
                                    key={channel.id}
                                    name={channel.name[locale]} 
                                    channelId={channel.id} 
                                    activeChannelId={activeChannel?.id || ''} 
                                    onClick={() => handleChannelChange(channel)} 
                                    icon={iconMap[channel.iconName] || SparklesIcon}
                                    isCustomized={isCustomized}
                                />
                           );
                       })}
                    </ul>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                     <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{activeChannel?.name[locale]}</h3>
                        {user && activeChannel && (
                            <Button variant="secondary" size="sm" onClick={() => setIsSettingsModalOpen(true)} className="!p-2">
                                <Cog6ToothIcon className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto mb-4 p-4 ps-2">
                        {aiMessages.map(msg => (
                            <div key={msg.id} className={`flex items-start mb-4 ${msg.user === user?.displayName ? 'justify-end' : ''}`}>
                                {msg.user !== user?.displayName && <img src={msg.avatar} alt={msg.user} className="w-10 h-10 rounded-full me-3 object-cover" />}
                                <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${msg.user === user?.displayName ? 'bg-primary-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-sm">{msg.user}</p>
                                        <p className="text-xs opacity-70 ms-2">{msg.timestamp}</p>
                                    </div>
                                    <p className="mt-1 whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                {msg.user === user?.displayName && <img src={msg.avatar} alt={msg.user} className="w-10 h-10 rounded-full ms-3 object-cover" />}
                            </div>
                        ))}
                        {isAiThinking && (
                             <div className="flex items-start mb-4">
                                <img src={AI_AVATAR_URL} alt={t('chat.aiName')} className="w-10 h-10 rounded-full me-3" />
                                <div className="max-w-xs lg:max-w-md p-3 rounded-lg bg-slate-200 dark:bg-slate-700">
                                    <div className="flex items-center">
                                        <p className="font-bold text-sm">{t('chat.aiName')}</p>
                                    </div>
                                    <div className="mt-2 flex items-center space-x-2 rtl:space-x-reverse">
                                        <span className="h-2 w-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="h-2 w-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="h-2 w-2 bg-primary-500 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    <div className="p-4 pt-0">
                        {user ? (
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={t('chat.messagePlaceholder')}
                                    className="flex-1 p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary-500"
                                    disabled={isAiThinking}
                                />
                                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50" disabled={isAiThinking}>{t('chat.send')}</button>
                            </form>
                        ) : (
                            <div className="p-4 text-center text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50 rounded-md">
                                <LockClosedIcon className="h-6 w-6 mx-auto mb-2" />
                                <p>{t('chat.loginPrompt')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
            {isSettingsModalOpen && activeChannel && (
                <ChatSettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    channel={activeChannel}
                    onSave={handleSaveSettings}
                    onReset={handleResetSettings}
                />
            )}
        </div>
    );
};

interface ChannelButtonProps {
    name: string;
    channelId: string;
    activeChannelId: string;
    onClick: () => void;
    icon: React.ElementType;
    isCustomized: boolean;
}
const ChannelButton: React.FC<ChannelButtonProps> = ({ name, channelId, activeChannelId, onClick, icon: Icon, isCustomized }) => {
    const { t } = useI18n();
    return (
        <li className="flex-1 md:flex-none">
            <button
                onClick={onClick}
                className={`w-full text-center md:text-start p-2 rounded-md text-sm md:text-base flex items-center gap-2 ${activeChannelId === channelId ? 'bg-primary-100 dark:bg-slate-700 font-bold text-primary-700 dark:text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-600'}`}
            >
                <Icon className="h-5 w-5" />
                <span className="flex-grow">{name}</span>
                {isCustomized && (
                    <PencilIcon className="h-3 w-3 text-slate-500 flex-shrink-0" title={t('chat.customizedPrompt')} />
                )}
            </button>
        </li>
    );
};

export default ChatSection;
