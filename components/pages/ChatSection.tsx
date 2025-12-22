
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { ChatMessage, User, ChatChannel } from '../../types';
import { LockClosedIcon, SparklesIcon, iconMap, Cog6ToothIcon, XMarkIcon, SpeakerWaveIcon, ChatBubbleLeftRightIcon } from '../common/Icons';
import { useI18n } from '../../contexts/I18nContext';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { textToSpeech, decodeBase64, decodeAudioData } from '../../services/geminiService';
import Avatar from '../common/Avatar';
import { getChatHistory, saveChatHistory } from '../../services/dataService';

const AI_AVATAR_ICON = 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a69034.svg';

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
    const availableModels = ['gemini-3-pro-preview', 'gemini-3-flash-preview', 'gemini-flash-lite-latest'];

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
    
    const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [speakingId, setSpeakingId] = useState<number | null>(null);
    const chatSession = useRef<Chat | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [aiMessages, isAiThinking]);

    const stopAudio = () => {
        if (currentSourceRef.current) {
            currentSourceRef.current.stop();
            currentSourceRef.current = null;
        }
        setSpeakingId(null);
    };

    const handleListen = async (message: ChatMessage) => {
        if (speakingId === message.id) {
            stopAudio();
            return;
        }

        stopAudio();
        setSpeakingId(message.id);
        
        try {
            const base64Audio = await textToSpeech(message.text);
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const audioData = decodeBase64(base64Audio);
            const audioBuffer = await decodeAudioData(audioData, audioContextRef.current);
            
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.onended = () => setSpeakingId(null);
            source.start();
            currentSourceRef.current = source;
        } catch (err) {
            console.error("Audio error:", err);
            setSpeakingId(null);
        }
    };

    const initializeChannel = useCallback((channel: ChatChannel) => {
        const apiKey = process.env.API_KEY;
        if (!apiKey) return;

        try {
            const ai = new GoogleGenAI({ apiKey });
            chatSession.current = ai.chats.create({
                model: channel.model || 'gemini-3-flash-preview',
                config: { 
                    systemInstruction: channel.systemPrompt[locale],
                    temperature: 0.7
                },
            });
        } catch (error) {
             console.error("AI Init Failed:", error);
        }
        
        const savedHistory = getChatHistory(channel.id);
        if (savedHistory && savedHistory.length > 0) {
            setAiMessages(savedHistory);
        } else {
             setAiMessages([{
                id: 0,
                user: t('chat.aiName'),
                avatar: AI_AVATAR_ICON,
                text: t('chat.aiWelcome'),
                timestamp: new Date().toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }),
                hasAudio: true
            }]);
        }
    }, [locale, t]);

    useEffect(() => {
        if (activeChannel) {
            initializeChannel(activeChannel);
        }
        return () => stopAudio();
    }, [activeChannel, initializeChannel]);

    useEffect(() => {
        if (activeChannelId && aiMessages.length > 1) {
            saveChatHistory(activeChannelId, aiMessages);
        }
    }, [aiMessages, activeChannelId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user || !activeChannel || !chatSession.current) return;
        
        const timestamp = new Date().toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'fr-FR', { hour: '2-digit', minute: '2-digit' });
        const userMsg: ChatMessage = {
            id: Date.now(),
            user: user.displayName,
            avatar: '', // نستخدم الحروف بدلاً من الصورة
            text: newMessage,
            timestamp: timestamp,
        };

        setAiMessages(prev => [...prev, userMsg]);
        setNewMessage('');
        setIsAiThinking(true);
        
        try {
            const result: GenerateContentResponse = await chatSession.current.sendMessage({ message: userMsg.text });
            const aiMsg: ChatMessage = {
                id: Date.now() + 1,
                user: t('chat.aiName'),
                avatar: AI_AVATAR_ICON, // المساعد يحتفظ بأيقونته المميزة
                text: result.text || t('chat.aiError'),
                timestamp: new Date().toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }),
                hasAudio: true
            };
            setAiMessages(prev => [...prev, aiMsg]);
        } catch (error: any) {
            console.error("Chat error:", error);
            const errMsg: ChatMessage = {
                id: Date.now() + 2,
                user: t('chat.aiName'),
                avatar: AI_AVATAR_ICON,
                text: t('chat.aiError'),
                timestamp: timestamp,
            };
            setAiMessages(prev => [...prev, errMsg]);
        } finally {
            setIsAiThinking(false);
        }
    };

    const handleSaveSettings = (updatedChannel: ChatChannel) => {
        setChatChannels(prev => prev.map(c => c.id === updatedChannel.id ? updatedChannel : c));
        setIsSettingsOpen(false);
        initializeChannel(updatedChannel);
    };

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-primary-500" />
                {t('chat.title')}
            </h2>
            <Card className="flex flex-col md:flex-row h-[calc(100vh-220px)] overflow-hidden">
                {/* Channels Sidebar */}
                <div className="w-full md:w-1/4 border-b md:border-b-0 md:border-e border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4">
                    <h3 className="font-bold mb-4 text-xs uppercase tracking-wider text-slate-500">{t('chat.channels')}</h3>
                    <ul className="flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar">
                       {chatChannels.map(channel => (
                            <ChannelButton 
                                key={channel.id}
                                name={channel.name[locale]} 
                                activeChannelId={activeChannel?.id || ''} 
                                channelId={channel.id}
                                onClick={() => setActiveChannelId(channel.id)} 
                                icon={iconMap[channel.iconName] || SparklesIcon}
                            />
                       ))}
                    </ul>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-white dark:bg-slate-800">
                    <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-100 dark:bg-slate-700 rounded-lg">
                                {activeChannel && React.createElement(iconMap[activeChannel.iconName] || SparklesIcon, { className: "h-5 w-5 text-primary-600" })}
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{activeChannel?.name[locale]}</h3>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setIsSettingsOpen(true)} className="!p-2">
                            <Cog6ToothIcon className="h-5 w-5" />
                        </Button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {aiMessages.map(msg => (
                            <div key={msg.id} className={`flex items-start gap-3 ${msg.user === user?.displayName ? 'flex-row-reverse' : ''}`}>
                                {msg.avatar && msg.avatar.includes('gstatic') ? (
                                    <img src={msg.avatar} alt={msg.user} className="w-9 h-9 rounded-full object-cover bg-white p-1 shadow-sm ring-2 ring-primary-100" />
                                ) : (
                                    <Avatar name={msg.user} size="sm" />
                                )}
                                <div className={`group relative max-w-[85%] sm:max-w-md p-4 rounded-2xl shadow-sm ${
                                    msg.user === user?.displayName 
                                    ? 'bg-primary-600 text-white rounded-te-none' 
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-ts-none'
                                }`}>
                                    <div className="flex items-center justify-between gap-4 mb-1">
                                        <p className="font-bold text-xs opacity-90">{msg.user}</p>
                                        <p className="text-[10px] opacity-70">{msg.timestamp}</p>
                                    </div>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                    
                                    {msg.hasAudio && (
                                        <button 
                                            onClick={() => handleListen(msg)}
                                            className={`mt-3 flex items-center gap-2 text-xs font-semibold py-1.5 px-3 rounded-full transition-all ${
                                                msg.user === user?.displayName 
                                                ? 'bg-white/10 hover:bg-white/20 text-white' 
                                                : 'bg-primary-50 dark:bg-slate-600 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-slate-500'
                                            } ${speakingId === msg.id ? 'animate-pulse ring-2 ring-primary-400' : ''}`}
                                        >
                                            <SpeakerWaveIcon className="h-3.5 w-3.5" />
                                            {speakingId === msg.id ? t('chat.listening') : t('chat.listen')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isAiThinking && (
                            <div className="flex items-start gap-3">
                                <img src={AI_AVATAR_ICON} className="w-9 h-9 rounded-full object-cover bg-white p-1" alt="AI Thinking" />
                                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-2xl rounded-ts-none flex gap-1 items-center">
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
                        {user ? (
                            <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={t('chat.messagePlaceholder')}
                                    className="flex-1 p-3 border border-slate-300 rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 shadow-inner outline-none transition-all"
                                />
                                <button 
                                    type="submit" 
                                    disabled={!newMessage.trim() || isAiThinking}
                                    className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                                >
                                    {t('chat.send')}
                                </button>
                            </form>
                        ) : (
                            <div className="p-6 text-center bg-white/50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 max-w-md mx-auto">
                                <LockClosedIcon className="h-8 w-8 mx-auto mb-3 text-slate-400" />
                                <p className="text-slate-600 dark:text-slate-400 font-medium">{t('chat.loginPrompt')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {isSettingsOpen && activeChannel && (
                <ChatSettingsModal 
                    isOpen={isSettingsOpen} 
                    onClose={() => setIsSettingsOpen(false)} 
                    channel={activeChannel} 
                    onSave={handleSaveSettings}
                    onReset={(c) => handleSaveSettings(c)}
                />
            )}
        </div>
    );
};

interface ChannelButtonProps { name: string; channelId: string; activeChannelId: string; onClick: () => void; icon: React.ElementType; }
const ChannelButton: React.FC<ChannelButtonProps> = ({ name, channelId, activeChannelId, onClick, icon: Icon }) => (
    <li className="flex-none">
        <button
            onClick={onClick}
            className={`w-full text-center md:text-start p-3 rounded-xl text-sm transition-all flex items-center gap-3 ${
                activeChannelId === channelId 
                ? 'bg-primary-600 text-white shadow-md font-bold' 
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 shadow-sm'
            }`}
        >
            <Icon className={`h-5 w-5 ${activeChannelId === channelId ? 'text-white' : 'text-primary-500'}`} />
            <span className="flex-grow whitespace-nowrap">{name}</span>
        </button>
    </li>
);

export default ChatSection;
