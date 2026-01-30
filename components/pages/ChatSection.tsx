
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { ChatMessage, User, ChatChannel } from '../../types';
import { LockClosedIcon, SparklesIcon, iconMap, Cog6ToothIcon, XMarkIcon, SpeakerWaveIcon, ChatBubbleLeftRightIcon, TrashIcon } from '../common/Icons';
import { useI18n } from '../../contexts/I18nContext';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { textToSpeech, decodeBase64, decodeAudioData, streamChatMessage, STABLE_MODEL } from '../../services/geminiService';
import { useAi } from '../../contexts/AiContext';
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
    const availableModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'];

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
    initialChannelId?: string | null;
}

const ChatSection: React.FC<ChatSectionProps> = ({ user, chatChannels, setChatChannels, initialChannelId }) => {
    const { t, locale } = useI18n();
    const { getApiKey, handleAiError, clearApiKey } = useAi();
    const [activeChannelId, setActiveChannelId] = useState<string | null>(initialChannelId || (chatChannels.length > 0 ? chatChannels[0].id : null));
    const activeChannel = chatChannels.find(c => c.id === activeChannelId) || null;

    useEffect(() => {
        if (initialChannelId) {
            setActiveChannelId(initialChannelId);
        }
    }, [initialChannelId]);

    const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [speakingId, setSpeakingId] = useState<number | null>(null);
    const chatSession = useRef<Chat | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Deep link support via props or active channel id sync
    useEffect(() => {
        // If the URL or some state externally changes the active page to chat,
        // we might want to default to support if triggered by the support button.
        // For now, it defaults to first channel as per state initialization.
    }, []);

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
            const executeAndPlay = async (key: string) => {
                const base64Audio = await textToSpeech(message.text, key);
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
            };

            const apiKey = await getApiKey();
            try {
                await executeAndPlay(apiKey);
            } catch (innerErr: any) {
                if (innerErr.message.includes('AUTH_ERROR')) {
                    clearApiKey();
                    const newKey = await getApiKey();
                    await executeAndPlay(newKey);
                } else {
                    throw innerErr;
                }
            }
        } catch (err) {
            console.error("Audio error:", err);
            setSpeakingId(null);
        }
    };

    const initializeChannel = useCallback(async (channel: ChatChannel) => {
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

    const handleStartSmartTest = () => {
        if (!user || activeChannel?.id !== 'test-expert') return;
        setNewMessage(t('chat.startTestRequest') || 'أريد البدء في اختبار ذكي جديد في تخصصي.');
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user || !activeChannel) return;

        const timestamp = new Date().toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'fr-FR', { hour: '2-digit', minute: '2-digit' });
        const userMsg: ChatMessage = {
            id: Date.now(),
            user: user.displayName,
            avatar: '',
            text: newMessage,
            timestamp: timestamp,
        };

        setAiMessages(prev => [...prev, userMsg]);
        setNewMessage('');
        setIsAiThinking(true);

        const aiMsgId = Date.now() + 1;
        const initialAiMsg: ChatMessage = {
            id: aiMsgId,
            user: t('chat.aiName'),
            avatar: AI_AVATAR_ICON,
            text: '',
            timestamp: new Date().toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }),
            hasAudio: true
        };

        setAiMessages(prev => [...prev, initialAiMsg]);

        try {
            const executeChat = async (key: string) => {
                // Format history for Gemini
                const history = aiMessages.slice(-10).map(m => ({
                    role: (m.user === user.displayName ? 'user' : 'model') as 'user' | 'model',
                    parts: [{ text: m.text }]
                }));

                let fullText = "";
                await streamChatMessage(
                    userMsg.text,
                    history,
                    activeChannel.systemPrompt[locale],
                    activeChannel.model || STABLE_MODEL,
                    key,
                    (chunk) => {
                        setIsAiThinking(false);
                        fullText += chunk;
                        setAiMessages(prev => prev.map(m =>
                            m.id === aiMsgId ? { ...m, text: fullText } : m
                        ));
                    }
                );
            };

            const apiKey = await getApiKey();
            try {
                await executeChat(apiKey);
            } catch (innerErr: any) {
                if (innerErr.message.includes('AUTH_ERROR')) {
                    clearApiKey();
                    const newKey = await getApiKey();
                    await executeChat(newKey);
                } else {
                    throw innerErr;
                }
            }
        } catch (error: any) {
            console.error("Chat error:", error);
            setIsAiThinking(false);

            const errorMsg = error.message?.includes('QUOTA_ERROR')
                ? t('chat.quotaExceeded') || 'عذراً، تم تجاوز حصة الاستخدام المتاحة.'
                : t('chat.aiError');

            setAiMessages(prev => prev.map(m =>
                m.id === aiMsgId ? { ...m, text: errorMsg } : m
            ));
        }
    };

    const handleClearChat = () => {
        if (activeChannel && window.confirm(t('chat.clearConfirm'))) {
            localStorage.removeItem(`platformChatHistory_${activeChannel.id}`);
            initializeChannel(activeChannel);
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
            <Card className="flex flex-col md:flex-row h-[calc(100vh-220px)] overflow-hidden shadow-huge border-none ring-1 ring-slate-200/50 dark:ring-slate-700/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl">
                {/* Channels Sidebar */}
                <div className="w-full md:w-80 border-b md:border-b-0 md:border-e border-slate-200/50 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-800/20 p-5 overflow-y-auto">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{t('chat.channels')}</h3>
                    </div>
                    <ul className="flex flex-row md:flex-col gap-3 overflow-x-auto scroll-container-focusable" tabIndex={0}>
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
                <div className="flex-1 flex flex-col bg-white/50 dark:bg-slate-800/40">
                    <div className="flex justify-between items-center p-5 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-primary-100 dark:bg-primary-900/30 rounded-2xl shadow-sm">
                                {activeChannel && React.createElement(iconMap[activeChannel.iconName] || SparklesIcon, { className: "h-5 w-5 text-primary-600 dark:text-primary-400" })}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{activeChannel?.name[locale]}</h3>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mt-0.5">{activeChannel?.model || STABLE_MODEL}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {activeChannel?.id === 'test-expert' && (
                                <Button size="sm" onClick={handleStartSmartTest} className="premium-gradient border-none shadow-glow">
                                    <SparklesIcon className="h-4 w-4 me-1" />
                                    {'ابدأ الاختبار الذكي'}
                                </Button>
                            )}
                            <Button variant="secondary" size="sm" onClick={handleClearChat} className="!p-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 border-slate-200/50 dark:border-slate-700/50">
                                <TrashIcon className="h-5 w-5" />
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => setIsSettingsOpen(true)} className="!p-2.5 border-slate-200/50 dark:border-slate-700/50">
                                <Cog6ToothIcon className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    <div
                        className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth force-scrollbar scroll-container-focusable bg-white/30 dark:bg-transparent"
                        tabIndex={0}
                    >
                        {aiMessages.map((msg, idx) => (
                            <div key={msg.id} className={`flex items-start gap-4 animate-message-in ${msg.user === user?.displayName ? 'flex-row-reverse' : ''}`} style={{ animationDelay: `${idx * 0.05}s` }}>
                                {msg.avatar && msg.avatar.includes('gstatic') ? (
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-primary-400 to-blue-400 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                        <img src={msg.avatar} alt={msg.user} className="relative w-10 h-10 rounded-full object-cover bg-white p-1.5 shadow-md ring-1 ring-slate-100 dark:ring-slate-800" />
                                    </div>
                                ) : (
                                    <Avatar name={msg.user} size="sm" className="shadow-md" />
                                )}
                                <div className={`group relative max-w-[85%] sm:max-w-xl p-5 rounded-3xl chat-bubble-shadow transition-all duration-300 ${msg.user === user?.displayName
                                    ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-te-none border-b border-primary-500/30'
                                    : 'glass-panel bg-white/80 dark:bg-slate-700/60 text-slate-800 dark:text-slate-100 rounded-ts-none'
                                    }`}>
                                    <div className="flex items-center justify-between gap-6 mb-3">
                                        <p className="font-bold text-[11px] uppercase tracking-wider opacity-90">{msg.user}</p>
                                        <p className="text-[10px] opacity-60 font-medium">{msg.timestamp}</p>
                                    </div>
                                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>

                                    {msg.hasAudio && (
                                        <button
                                            onClick={() => handleListen(msg)}
                                            className={`mt-4 flex items-center gap-2.5 text-[11px] font-bold py-2 px-4 rounded-full transition-all active:scale-95 ${msg.user === user?.displayName
                                                ? 'bg-white/20 hover:bg-white/30 text-white border border-white/20'
                                                : 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 border border-primary-100 dark:border-primary-800/50'
                                                } ${speakingId === msg.id ? 'animate-pulse ring-2 ring-primary-400 dark:ring-primary-500' : ''}`}
                                        >
                                            <SpeakerWaveIcon className="h-3.5 w-3.5" />
                                            {speakingId === msg.id ? t('chat.listening') : t('chat.listen')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isAiThinking && (
                            <div className="flex items-start gap-4 animate-message-in">
                                <div className="relative">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-primary-400 to-blue-400 rounded-full blur opacity-25 animate-pulse"></div>
                                    <img src={AI_AVATAR_ICON} className="relative w-10 h-10 rounded-full object-cover bg-white p-1.5 shadow-md" alt="AI Thinking" />
                                </div>
                                <div className="glass-panel bg-white/80 dark:bg-slate-700/60 p-5 rounded-3xl rounded-ts-none flex gap-1.5 items-center chat-bubble-shadow">
                                    <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-6 border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/40 backdrop-blur-md">
                        {user ? (
                            <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto items-end">
                                <div className="flex-1 relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-blue-500 rounded-2xl blur opacity-0 group-focus-within:opacity-10 transition duration-300"></div>
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => {
                                            setNewMessage(e.target.value);
                                            e.target.style.height = 'auto';
                                            e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e as any);
                                            }
                                        }}
                                        placeholder={t('chat.messagePlaceholder')}
                                        rows={1}
                                        className="relative w-full p-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-soft outline-none transition-all resize-none min-h-[56px] max-h-[200px] text-slate-700 dark:text-slate-200 font-medium"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || isAiThinking}
                                    className="px-8 py-4 premium-gradient text-white rounded-2xl font-bold hover:shadow-glow disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed transition-all shadow-md active:scale-95 h-[56px] flex items-center justify-center min-w-[120px]"
                                >
                                    <span className="flex items-center gap-2">
                                        {t('chat.send')}
                                        <SparklesIcon className="h-4 w-4" />
                                    </span>
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
    <li className="flex-none w-full animate-sidebar-item">
        <button
            onClick={onClick}
            className={`w-full text-start p-4 rounded-2xl text-sm transition-all duration-300 flex items-center gap-4 group relative overflow-hidden ${activeChannelId === channelId
                ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-lg shadow-primary-500/5 font-bold scale-[1.02] active-channel-glow'
                : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
        >
            <div className={`p-2.5 rounded-xl transition-all duration-300 ${activeChannelId === channelId ? 'bg-primary-50 dark:bg-primary-900/30' : 'bg-slate-200/50 dark:bg-slate-700/30 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20'}`}>
                <Icon className={`h-5.5 w-5.5 transition-colors ${activeChannelId === channelId ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-primary-500'}`} />
            </div>
            <span className="flex-grow truncate leading-snug tracking-tight">{name}</span>
            {activeChannelId === channelId && (
                <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_var(--color-primary-400)]"></div>
            )}
        </button>
    </li>
);

export default ChatSection;
