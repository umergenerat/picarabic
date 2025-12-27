
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { QuizQuestion } from '../types';

const getAiClient = () => {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) {
        throw new Error("VITE_GEMINI_API_KEY environment variable not set. AI features are unavailable.");
    }
    return new GoogleGenAI({ apiKey: API_KEY });
};

// Utilities for Audio Decoding
export const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

export const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number = 24000,
    numChannels: number = 1,
): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
};

export const textToSpeech = async (text: string): Promise<string> => {
    try {
        const ai = getAiClient();
        console.log('TTS request for:', text.substring(0, 20) + '...');
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ parts: [{ text: `انطق النص التالي بوضوح وبلغة عربية فصحى: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data returned from Gemini TTS");
        return base64Audio;
    } catch (error: any) {
        console.error("Error generating speech:", error);
        throw new Error(error.message || "فشل في توليد الصوت.");
    }
};

const questionGenerationSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            question: {
                type: Type.STRING,
                description: "نص السؤال"
            },
            options: {
                type: Type.ARRAY,
                items: {
                    type: Type.STRING
                },
                description: "مصفوفة من أربعة خيارات محتملة للإجابة"
            },
            correctAnswer: {
                type: Type.STRING,
                description: "الإجابة الصحيحة من بين الخيارات"
            }
        },
        required: ["question", "options", "correctAnswer"],
        propertyOrdering: ["question", "options", "correctAnswer"]
    }
};

export const generateQuiz = async (context: string): Promise<QuizQuestion[]> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: `أنت خبير تربوي. بناءً على النص القادم، قم بإنشاء 5 أسئلة اختيار من متعدد نوعية وعميقة باللغة العربية لاختبار فهم المتدرب وتطبيقه للمفاهيم. يجب أن يكون لكل سؤال أربعة خيارات ذكية (مشتتات واقعية)، مع تحديد الإجابة الصحيحة. النص هو: """${context}"""`,
            config: {
                responseMimeType: "application/json",
                responseSchema: questionGenerationSchema
            }
        });

        // Robust parsing
        let text = String(response.text || '').trim();
        if (text.startsWith('```')) {
            text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
        }
        return JSON.parse(text);
    } catch (error: any) {
        console.error("Error generating quiz:", error);
        throw new Error(error.message || "فشل في إنشاء الاختبار.");
    }
};

export const evaluateAnswer = async (context: string, question: string, answer: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: `أنت خبير تعليمي محفز. قيم إجابة المتدرب التالية بدقة بناءً على النص والسؤال المرفقين. قدم ملاحظات بناءة، حدد نقاط القوة، وقدم نصيحة للتحسين إذا لزم الأمر. استخدم لغة عربية مهنية ومشجعة.\n\nالسياق: ${context}\nالسؤال: ${question}\nإجابة المتدرب: ${answer}`
        });
        return response.text;
    } catch (error: any) {
        console.error("Error evaluating answer:", error);
        throw new Error(error.message || "فشل في تقييم الإجابة.");
    }
};

const skillScenarioSchema = {
    type: Type.OBJECT,
    properties: {
        scenario: { type: Type.STRING },
        question: { type: Type.STRING }
    },
    required: ["scenario", "question"]
};

export const generateSkillScenario = async (skillTitle: string, skillDescription: string, specialization: string): Promise<{ scenario: string; question: string; }> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: `أنت مدرب تطوير مهني وخبير في المهارات الناعمة (Soft Skills). 
            المطلوب: إنشاء سيناريو واقعي وتحدي مهني للمهارة: '${skillTitle}'. 
            الوصف: ${skillDescription}. 
            السياق المهني: '${specialization}'. 
            يجب أن يضع السيناريو المتدرب في موقف حرج أو يتطلب اتخاذ قرار ذكي يعكس تمكنه من هذه المهارة. 
            اجعل السيناريو مفصلاً ومهنياً، ثم اطرح سؤالاً مفتوحاً يحفز الطالب على التفكير العميق في الحل.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: skillScenarioSchema
            }
        });

        // Robust parsing
        let text = String(response.text || '').trim();
        if (text.startsWith('```')) {
            text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
        }
        console.log('Parsed Scenario JSON:', text);
        return JSON.parse(text);
    } catch (error: any) {
        console.error("Error generating skill scenario:", error);
        throw new Error("فشل في إنشاء سيناريو التمرين.");
    }
};

export const evaluateSkillAnswer = async (skillTitle: string, scenario: string, userAnswer: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: `أنت مدرب مهارات حياتية ومهنية (Soft Skills Coach). 
            قم بتقييم استجابة المتدرب لمهارة '${skillTitle}' بناءً على السيناريو التالي: 
            ---
            ${scenario}
            ---
            إجابة المتدرب: ${userAnswer}
            ---
            المطلوب:
            1. تقييم مدى ملاءمة الإجابة للمهارة المطلوبة.
            2. تقديم ملاحظات إيجابية حول نقاط القوة في الإجابة.
            3. تقديم نصائح عملية لتطوير المهارة بشكل أكبر في هذا الموقف.
            اجعل أسلوبك تدريبياً، محفزاً، ومهنياً باللغة العربية.`
        });
        return response.text;
    } catch (error: any) {
        console.error("Error evaluating skill answer:", error);
        throw new Error("فشل في تقييم الإجابة.");
    }
};
