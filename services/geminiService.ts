
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

const STABLE_MODEL = "gemini-1.5-flash";
const INTELLIGENT_MODEL = "gemini-1.5-pro";

/**
 * Robustly executes an AI task with fallback and error sanitization.
 */
const runAiTask = async (
    apiKey: string | undefined,
    task: (ai: any, model: string) => Promise<any>,
    description: string
): Promise<any> => {
    try {
        const ai = getAiClient(apiKey);
        // Try with the intelligent model first for better results
        try {
            console.log(`AI Task: ${description} (Attempting ${INTELLIGENT_MODEL})`);
            return await task(ai, INTELLIGENT_MODEL);
        } catch (firstError: any) {
            console.warn(`${INTELLIGENT_MODEL} failed, falling back to ${STABLE_MODEL}:`, firstError.message);
            // Fallback to the stable model
            return await task(ai, STABLE_MODEL);
        }
    } catch (error: any) {
        console.error(`AI Task Failure [${description}]:`, error);

        // Sanitize error messages for the user
        if (error.message?.includes('API key')) {
            throw new Error("تنبيه: مفتاح الذكاء الاصطناعي غير صالح. يرجى التحقق من الإعدادات.");
        } else if (error.message?.includes('quota') || error.message?.includes('429')) {
            throw new Error("عذراً، تم الوصول للحد الأقصى للطلبات حالياً. يرجى المحاولة بعد قليل.");
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
            throw new Error("خطأ في الاتصال بالشبكة. يرجى التأكد من اتصالك بالإنترنت.");
        }

        throw new Error("عذراً، حدث خطأ ذكي غير متوقع. جاري العمل على تحسين التجربة.");
    }
};

/**
 * Robust JSON parsing for AI responses that might include markdown blocks.
 */
const parseAiJson = (text: string): any => {
    let sanitized = text.trim();
    if (sanitized.startsWith('```')) {
        sanitized = sanitized.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }
    try {
        return JSON.parse(sanitized);
    } catch (e) {
        console.error("JSON Parse Error. Raw text:", text);
        // Attempt to find JSON array or object if direct parse fails
        const match = sanitized.match(/(\[.*\]|\{.*\})/s);
        if (match) return JSON.parse(match[0]);
        throw e;
    }
};

export const generateQuiz = async (context: string, apiKey?: string): Promise<QuizQuestion[]> => {
    return runAiTask(apiKey, async (ai, model) => {
        const response = await ai.models.generateContent({
            model: model,
            contents: `أنت خبير تربوي. بناءً على النص القادم، قم بإنشاء 5 أسئلة اختيار من متعدد نوعية وعميقة باللغة العربية لاختبار فهم المتدرب وتطبيقه للمفاهيم. يجب أن يكون لكل سؤال أربعة خيارات ذكية (مشتتات واقعية)، مع تحديد الإجابة الصحيحة. النص هو: """${context}"""`,
            config: {
                responseMimeType: "application/json",
                responseSchema: questionGenerationSchema
            }
        });
        return parseAiJson(response.text);
    }, "Quiz Generation");
};

export const evaluateAnswer = async (context: string, question: string, answer: string, apiKey?: string): Promise<string> => {
    return runAiTask(apiKey, async (ai, model) => {
        const response = await ai.models.generateContent({
            model: model,
            contents: `أنت خبير تعليمي محفز ومهني (Pedagogical Expert). 
            قم بتقييم إجابة المتدرب التالية بدقة بناءً على النص المرجعي والسؤال المرفق.
            
            المطلوب:
            1. تحليل مدى دقة وموضوعية الإجابة بالنسبة للنص.
            2. تقديم تغذية راجعة بناءة (Constructive Feedback) تبدأ بنقاط القوة.
            3. إذا كانت الإجابة ناقصة، وجه المتدرب للمعلومة الصحيحة بذكاء دون إعطاء الحل المباشر.
            4. استخدم لغة عربية فصحى، مهنية، ومشجعة جداً.

            السياق المرجعي: ${context}
            السؤال المنشود: ${question}
            إجابة المتدرب: ${answer}`
        });
        return response.text;
    }, "Answer Evaluation");
};

const skillScenarioSchema = {
    type: Type.OBJECT,
    properties: {
        scenario: { type: Type.STRING },
        question: { type: Type.STRING }
    },
    required: ["scenario", "question"]
};

export const generateSkillScenario = async (
    skillTitle: string,
    skillDescription: string,
    specialization: string,
    apiKey?: string
): Promise<{ scenario: string; question: string; }> => {
    return runAiTask(apiKey, async (ai, model) => {
        const response = await ai.models.generateContent({
            model: model,
            contents: `أنت مدرب تطوير مهني وخبير عالمي في المهارات الناعمة (Soft Skills Expert). 
            المطلوب: إنشاء "تحدي سيناريو" (Scenario-based Challenge) واقعي ومعقد للمهارة التالية:
            
            - المهارة: '${skillTitle}'
            - وصفها: '${skillDescription}'
            - التخصص المهني: '${specialization}' 

            إرشادات السيناريو:
            1. ابدأ بوصف موقف مهني محدد يواجهه المتدرب في عمله (مثال: اجتماع حاسم، مشكلة مع زبون، ضغط عمل).
            2. اجعل الموقف يتطلب استخدام ذكي جداً للمهارة المذكورة أعلاه للنجاح فيه.
            3. لا تقدم الحل، بل توقف عند ذروة المشكلة.
            4. اطرح سؤالاً مفتوحاً وذكياً: "كيف ستتصرف في هذا الموقف للحفاظ على احترافيتك وتحقيق أفضل نتيجة؟".
            
            اللغة: عربية مهنية رفيعة المستوى.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: skillScenarioSchema
            }
        });
        return parseAiJson(response.text);
    }, "Skill Scenario Generation");
};

export const evaluateSkillAnswer = async (
    skillTitle: string,
    scenario: string,
    userAnswer: string,
    apiKey?: string
): Promise<string> => {
    return runAiTask(apiKey, async (ai, model) => {
        const response = await ai.models.generateContent({
            model: model,
            contents: `أنت كبير مدربي تطوير المهارات الذاتية والقيادية (Executive Coach). 
            قم بتقييم استجابة المتدرب لسيناريو المهارة '${skillTitle}'.
            
            السيناريو المعطى:
            """${scenario}"""
            
            طريقة تفكير المتدرب وقراره:
            """${userAnswer}"""
            
            معايير التقييم المطلوب منك تقديمها:
            1. **التحليل السلوكي**: هل يعكس تصرفه تمكناً من مهارة ${skillTitle}؟
            2. **نقاط التميز**: ما هو أذكى جزء في إجابته؟
            3. **التحسين التطويري**: كيف يمكن تطوير هذا التصرف ليكون أكثر مثالية في بيئة العمل الحقيقية؟
            4. **الخلاصة**: كلمة تشجيعية قوية.
            
            استخدم نبرة صوت (Tone of Voice) مهنية، محفزة، وتعليمية باللغة العربية.`
        });
        return response.text;
    }, "Skill Answer Evaluation");
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
    return runAiTask(apiKey, async (ai, model) => {
        const prompt = `أنت خبير في استخراج البيانات من المستندات واللوائح المعقدة. 
        المطلوب: قم باستخراج قائمة المتدربين من الملف المرفق بدقة متناهية.
        حول البيانات إلى تنسيق JSON حسب المخطط المطلوب. 
        يجب استخراج: (الاسم الكامل، البريد الإلكتروني، التخصص، ورقم الهاتف). 
        إذا كان الحقل غير موجود، اتركه فارغاً. 
        أعطِ الأولوية للدقة وتأكد من أن البريد الإلكتروني صيغته صحيحة.`;

        const response = await ai.models.generateContent({
            model: model,
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

        return parseAiJson(response.text);
    }, "Document Trainee Extraction");
};
