
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { QuizQuestion } from '../types';

const getAiClient = (apiKey?: string) => {
    const API_KEY = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) {
        throw new Error("No API key provided. AI features are unavailable.");
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

export const textToSpeech = async (text: string, apiKey?: string): Promise<string> => {
    try {
        const ai = getAiClient(apiKey);
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

export const generateQuiz = async (context: string, apiKey?: string, model: string = "gemini-1.5-flash"): Promise<QuizQuestion[]> => {
    try {
        const ai = getAiClient(apiKey);
        const response = await ai.models.generateContent({
            model: model,
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

export const evaluateAnswer = async (context: string, question: string, answer: string, apiKey?: string, model: string = "gemini-1.5-flash"): Promise<string> => {
    try {
        const ai = getAiClient(apiKey);
        const response = await ai.models.generateContent({
            model: model,
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

export const generateSkillScenario = async (skillTitle: string, skillDescription: string, specialization: string, apiKey?: string, model: string = "gemini-1.5-flash"): Promise<{ scenario: string; question: string; }> => {
    try {
        const ai = getAiClient(apiKey);
        console.log('Calling Gemini API for skill scenario generation...');
        const response = await ai.models.generateContent({
            model: model,
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

        if (!text) {
            throw new Error("لم يتم استلام استجابة من الذكاء الاصطناعي. تأكد من صحة مفتاح API.");
        }

        return JSON.parse(text);
    } catch (error: any) {
        console.error("Error generating skill scenario:", error);
        // Provide more specific error messages
        if (error.message?.includes('API key')) {
            throw new Error("مفتاح API غير صالح أو مفقود. الرجاء إدخال مفتاح صحيح.");
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
            throw new Error("خطأ في الاتصال بالشبكة. تحقق من اتصالك بالإنترنت.");
        } else if (error.message?.includes('JSON')) {
            throw new Error("خطأ في تحليل استجابة الذكاء الاصطناعي. الرجاء المحاولة مرة أخرى.");
        }
        throw new Error(error.message || "فشل في إنشاء سيناريو التمرين. الرجاء المحاولة لاحقاً.");
    }
};

export const evaluateSkillAnswer = async (skillTitle: string, scenario: string, userAnswer: string, apiKey?: string, model: string = "gemini-1.5-flash"): Promise<string> => {
    try {
        const ai = getAiClient(apiKey);
        const response = await ai.models.generateContent({
            model: model,
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

const traineeExtractionSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "الاسم الكامل للمتدرب" },
            email: { type: Type.STRING, description: "البريد الإلكتروني" },
            specialization: { type: Type.STRING, description: "التخصص أو الشعبة" },
            phone: { type: Type.STRING, description: "رقم الهاتف" }
        },
        required: ["name", "email"],
        propertyOrdering: ["name", "email", "specialization", "phone"]
    }
};

export const extractTraineesFromDocument = async (fileBase64: string, mimeType: string, apiKey?: string): Promise<any[]> => {
    try {
        const ai = getAiClient(apiKey);
        const prompt = `أنت خبير في استخراج البيانات. قم باستخراج قائمة المتدربين من الملف المرفق بدقة.
        المطلوب استخراج: الاسم الكامل، البريد الإلكتروني، التخصص، ورقم الهاتف (إن وجد).
        حول البيانات إلى تنسيق JSON حسب المخطط المطلوب. إذا كانت بعض البيانات مفقودة، اترك الحقل فارغاً ولكن استخرج ما هو موجود.`;

        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [
                {
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                data: fileBase64,
                                mimeType: mimeType
                            }
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: traineeExtractionSchema
            }
        });

        let text = response.text || '';

        // Remove markdown code blocks if present
        if (text.startsWith('```')) {
            text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
        }

        try {
            return JSON.parse(text);
        } catch (parseError) {
            console.error("Failed to parse JSON from Gemini:", text);
            // Fallback: try to find anything between [ ]
            const match = text.match(/\[.*\]/s);
            if (match) return JSON.parse(match[0]);
            throw new Error("فشل في تحليل البيانات المستخرجة من الملف.");
        }
    } catch (error: any) {
        console.error("Error extracting trainees:", error);
        throw new Error(error.message || "فشل في معالجة الملف واستخراج البيانات.");
    }
};
