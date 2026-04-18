
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from "@google/generative-ai";
import { QuizQuestion } from '../types';

export const getAiClient = (apiKey?: string) => {
    const API_KEY = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) {
        throw new Error("No API key provided. AI features are unavailable.");
    }
    return new GoogleGenerativeAI(API_KEY);
};

export const STABLE_MODEL = "gemini-1.5-flash";
export const INTELLIGENT_MODEL = "gemini-1.5-pro";
export const LATEST_MODEL = "gemini-2.0-flash-exp";

export const AUTH_ERROR_MESSAGE = "AUTH_ERROR: Invalid or missing API Key";
export const QUOTA_ERROR_MESSAGE = "QUOTA_ERROR: Limit exceeded";

// ============================================================
// Web Speech API TTS (Browser Built-in, Free, Supports Arabic)
// ============================================================

// Keep these exports for backward compatibility (no longer used for audio decoding)
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

// Active utterance reference for stop support
let activeUtterance: SpeechSynthesisUtterance | null = null;

export const stopSpeech = () => {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        activeUtterance = null;
    }
};

// ============================================================
// Cache System for API Optimization (Cost / Quota saving)
// ============================================================

const hashString = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit int
    }
    return hash.toString(36);
};

const getFromCache = (key: string): any => {
    try {
        const cached = localStorage.getItem(`ai_cache_${key}`);
        if (cached) return JSON.parse(cached);
    } catch (e) {
        console.warn("Storage warning:", e);
    }
    return null;
};

const saveToCache = (key: string, data: any) => {
    try {
        localStorage.setItem(`ai_cache_${key}`, JSON.stringify(data));
    } catch (e) {
        // Handle QuotaExceededError implicitly
        console.warn("Could not save to cache:", e);
    }
};

const classifyAiError = (error: any): Error => {
    const msg = error.message || '';
    console.error("Original AI Error:", error);

    if (msg.includes('API key') || msg.includes('401') || msg.includes('403') || msg.includes('not found')) {
        return new Error(AUTH_ERROR_MESSAGE);
    }
    if (msg.includes('quota') || msg.includes('429')) {
        return new Error(QUOTA_ERROR_MESSAGE);
    }
    if (msg.includes('model') && msg.includes('not found')) {
        return new Error("النموذج المختار غير متوفر حالياً. يرجى اختيار نموذج آخر من الإعدادات.");
    }
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
        return new Error("خطأ في الاتصال بالشبكة. يرجى التأكد من اتصالك بالإنترنت أو صحة مفتاح API.");
    }
    return new Error(msg || "عذراً، فشل الاتصال بخدمة الذكاء الاصطناعي.");
};

/**
 * Reads text aloud using the browser's built-in Web Speech API.
 * Supports Arabic natively. Returns a Promise that resolves when speech ends.
 * @param text - The text to speak
 * @param onEnd - Optional callback when speech finishes
 */
export const speakText = (text: string, onEnd?: () => void): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!window.speechSynthesis) {
            reject(new Error("متصفحك لا يدعم ميزة القراءة الصوتية."));
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Strip HTML tags from the text
        const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

        const utterance = new SpeechSynthesisUtterance(plainText);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to find an Arabic voice
        const voices = window.speechSynthesis.getVoices();
        const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
        if (arabicVoice) utterance.voice = arabicVoice;

        activeUtterance = utterance;

        utterance.onend = () => {
            activeUtterance = null;
            onEnd?.();
            resolve();
        };

        utterance.onerror = (e) => {
            activeUtterance = null;
            if (e.error === 'interrupted' || e.error === 'canceled') {
                resolve(); // Not a real error
            } else {
                reject(new Error(`خطأ في القراءة الصوتية: ${e.error}`));
            }
        };

        window.speechSynthesis.speak(utterance);
    });
};

/** @deprecated Use speakText() instead – Gemini TTS API no longer supports audio modality in generateContent */
export const textToSpeech = async (text: string, _apiKey?: string): Promise<string> => {
    throw new Error("DEPRECATED: Use speakText() directly via Web Speech API");
};

const questionGenerationSchema = {
    type: SchemaType.ARRAY,
    items: {
        type: SchemaType.OBJECT,
        properties: {
            question: {
                type: SchemaType.STRING,
                description: "نص السؤال"
            },
            options: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.STRING
                },
                description: "مصفوفة من أربعة خيارات محتملة للإجابة"
            },
            correctAnswer: {
                type: SchemaType.STRING,
                description: "الإجابة الصحيحة من بين الخيارات"
            }
        },
        required: ["question", "options", "correctAnswer"],
    }
};

/**
 * Delay utility for retry mechanism
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Robustly executes an AI task with retry logic, fallback, and error sanitization.
 */
const runAiTask = async (
    apiKey: string | undefined,
    task: (model: any) => Promise<any>,
    description: string,
    maxRetries: number = 2
): Promise<any> => {
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const ai = getAiClient(apiKey);

            // Try with the stable (flash) model first to save quota and cost
            try {
                console.log(`AI Task: ${description} (Attempt ${attempt}/${maxRetries}, Model: ${STABLE_MODEL})`);
                const model = ai.getGenerativeModel({ model: STABLE_MODEL });
                return await task(model);
            } catch (firstError: any) {
                console.warn(`${STABLE_MODEL} failed, falling back to ${INTELLIGENT_MODEL}:`, firstError.message);
                // Fallback to the intelligent model if needed
                const model = ai.getGenerativeModel({ model: INTELLIGENT_MODEL });
                return await task(model);
            }
        } catch (error: any) {
            lastError = error;
            console.error(`AI Task Failure [${description}] (Attempt ${attempt}/${maxRetries}):`, error.message);

            // Don't retry for specific errors
            if (error.message?.includes('API key') || error.message?.includes('quota') || error.message?.includes('429') || error.message?.includes('401')) {
                break;
            }

            // Wait before retrying
            if (attempt < maxRetries) {
                const waitTime = attempt * 1500;
                await delay(waitTime);
            }
        }
    }

    throw classifyAiError(lastError);
};

/**
 * Streaming chat response
 */
export const streamChatMessage = async (
    message: string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    systemInstruction: string,
    modelName: string = STABLE_MODEL,
    apiKey?: string,
    onChunk?: (chunk: string) => void
): Promise<string> => {
    const attemptChat = async (targetModel: string): Promise<string> => {
        const ai = getAiClient(apiKey);
        const model = ai.getGenerativeModel({
            model: targetModel,
            systemInstruction: systemInstruction,
        });

        const chat = model.startChat({
            history: history,
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
            },
        });

        const result = await chat.sendMessageStream(message);
        let fullText = "";

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullText += chunkText;
            if (onChunk) onChunk(chunkText);
        }

        return fullText;
    };

    try {
        console.log(`Starting stream with model: ${modelName}`);
        return await attemptChat(modelName);
    } catch (error: any) {
        console.warn(`Streaming failed with ${modelName}:`, error.message);

        // If it's a model not found error and we aren't already using the stable model
        if (modelName !== STABLE_MODEL && (error.message?.includes('not found') || error.message?.includes('500') || error.message?.includes('model'))) {
            console.info(`Falling back to ${STABLE_MODEL}...`);
            try {
                return await attemptChat(STABLE_MODEL);
            } catch (fallbackError: any) {
                throw classifyAiError(fallbackError);
            }
        }

        throw classifyAiError(error);
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
    const cacheKey = hashString(`quiz_${context}`);
    const cached = getFromCache(cacheKey);
    if (cached) {
        console.log("Serving Quiz Generation from cache");
        return cached;
    }

    const result = await runAiTask(apiKey, async (model) => {
        const response = await model.generateContent({
            contents: [{
                role: 'user', parts: [{
                    text: `أنت خبير تربوي متمرس في تصميم الاختبارات التقويمية.

## المطلوب:
قم بإنشاء 5 أسئلة اختيار من متعدد عالية الجودة باللغة العربية بناءً على النص المرفق.

## معايير الأسئلة:
1. **التنوع المعرفي**: اجعل الأسئلة تغطي مستويات بلوم المختلفة (تذكر، فهم، تطبيق، تحليل)
2. **الوضوح**: صياغة واضحة ومباشرة بدون غموض
3. **المشتتات الذكية**: اجعل الخيارات الخاطئة منطقية وواقعية (ليست سخيفة)
4. **الإجابة الصحيحة**: يجب أن تكون واحدة فقط وواضحة
5. **الارتباط بالنص**: كل سؤال يجب أن يرتبط مباشرة بمحتوى النص

## مثال على سؤال جيد:
{
  "question": "ما النسبة التي تمثلها المقاولات الصغرى والمتوسطة من النسيج المقاولاتي المغربي؟",
  "options": ["75%", "85%", "95%", "55%"],
  "correctAnswer": "95%"
}

## النص المرجعي:
"""${context}"""

أنتج 5 أسئلة بهذا المستوى من الجودة.` }]
            }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: questionGenerationSchema as any
            }
        });
        return parseAiJson(response.response.text());
    }, "Quiz Generation");

    saveToCache(cacheKey, result);
    return result;
};

export const evaluateAnswer = async (context: string, question: string, answer: string, apiKey?: string): Promise<string> => {
    const cacheKey = hashString(`eval_${context}_${question}_${answer}`);
    const cached = getFromCache(cacheKey);
    if (cached) {
        console.log("Serving Answer Evaluation from cache");
        return cached;
    }

    const result = await runAiTask(apiKey, async (model) => {
        const response = await model.generateContent({
            contents: [{
                role: 'user', parts: [{
                    text: `أنت خبير تعليمي محفز ومهني (Pedagogical Expert). 
            قم بتقييم إجابة المتدرب التالية بدقة بناءً على النص المرجعي والسؤال المرفق.
            
            المطلوب:
            1. تحليل مدى دقة وموضوعية الإجابة بالنسبة للنص.
            2. تقديم تغذية راجعة بناءة (Constructive Feedback) تبدأ بنقاط القوة.
            3. إذا كانت الإجابة ناقصة، وجه المتدرب للمعلومة الصحيحة بذكاء دون إعطاء الحل المباشر.
            4. استخدم لغة عربية فصيحة، مهنية، ومشجعة جداً.

            السياق المرجعي: ${context}
            السؤال المنشود: ${question}
            إجابة المتدرب: ${answer}`
                }]
            }]
        });
        return response.response.text();
    }, "Answer Evaluation");

    saveToCache(cacheKey, result);
    return result;
};

const skillScenarioSchema = {
    type: SchemaType.OBJECT,
    properties: {
        scenario: { type: SchemaType.STRING },
        question: { type: SchemaType.STRING }
    },
    required: ["scenario", "question"]
};

export const generateSkillScenario = async (
    skillTitle: string,
    skillDescription: string,
    specialization: string,
    apiKey?: string
): Promise<{ scenario: string; question: string; }> => {
    const cacheKey = hashString(`scenario_${skillTitle}_${skillDescription}_${specialization}`);
    const cached = getFromCache(cacheKey);
    if (cached) {
        console.log("Serving Skill Scenario from cache");
        return cached;
    }

    const result = await runAiTask(apiKey, async (model) => {
        const response = await model.generateContent({
            contents: [{
                role: 'user', parts: [{
                    text: `أنت مدرب تطوير مهني محترف ومتخصص في المهارات الناعمة (Soft Skills Coach).

## المهمة:
أنشئ سيناريو تدريبي واقعي ومشوق لتطوير المهارة التالية.

## معلومات المهارة:
- **اسم المهارة**: ${skillTitle}
- **الوصف**: ${skillDescription}
- **التخصص المهني للمتدرب**: ${specialization}

## متطلبات السيناريو:
1. **الواقعية**: اجعل الموقف مستوحى من بيئة العمل الحقيقية في مجال "${specialization}"
2. **التعقيد المناسب**: ليس سهلاً جداً ولا مستحيلاً - تحدٍ قابل للحل بتفكير عميق
3. **الشخصيات**: أضف شخصيات واقعية (زملاء، مدراء، زبائن) مع أسماء مغربية
4. **التوتر الدرامي**: ابنِ الموقف تدريجياً حتى ذروة التحدي
5. **عدم إعطاء الحل**: توقف عند لحظة اتخاذ القرار

## مثال على بنية السيناريو:
- الفقرة 1: تقديم الموقف والسياق
- الفقرة 2: تصاعد المشكلة
- الفقرة 3: ذروة التحدي (اللحظة الحاسمة)

## السؤال:
اختم بسؤال مفتوح يدفع المتدرب للتفكير في كيفية استخدام مهارة "${skillTitle}" لحل الموقف.

اللغة: عربية فصيحة مهنية وسلسة.` }]
            }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: skillScenarioSchema as any
            }
        });
        return parseAiJson(response.response.text());
    }, "Skill Scenario Generation");

    saveToCache(cacheKey, result);
    return result;
};

export const evaluateSkillAnswer = async (
    skillTitle: string,
    scenario: string,
    userAnswer: string,
    apiKey?: string
): Promise<string> => {
    const cacheKey = hashString(`skilleval_${skillTitle}_${scenario}_${userAnswer}`);
    const cached = getFromCache(cacheKey);
    if (cached) {
        console.log("Serving Skill Answer Evaluation from cache");
        return cached;
    }

    const result = await runAiTask(apiKey, async (model) => {
        const response = await model.generateContent({
            contents: [{
                role: 'user', parts: [{
                    text: `أنت كبير مدربي تطوير المهارات الذاتية والقيادية (Executive Coach). 
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
            
            استخدم نبرة صوت (Tone of Voice) مهنية، محفزة، وتعليمية باللغة العربية.` }]
            }]
        });
        return response.response.text();
    }, "Skill Answer Evaluation");

    saveToCache(cacheKey, result);
    return result;
};

const traineeExtractionSchema = {
    type: SchemaType.ARRAY,
    items: {
        type: SchemaType.OBJECT,
        properties: {
            name: { type: SchemaType.STRING, description: "الاسم الكامل للمتدرب" },
            email: { type: SchemaType.STRING, description: "البريد الإلكتروني" },
            specialization: { type: SchemaType.STRING, description: "التخصص أو الشعبة" },
            phone: { type: SchemaType.STRING, description: "رقم الهاتف" }
        },
        required: ["name", "email"],
    }
};

export const extractTraineesFromDocument = async (fileBase64: string, mimeType: string, apiKey?: string): Promise<any[]> => {
    return runAiTask(apiKey, async (model) => {
        const prompt = `أنت خبير في استخراج البيانات من المستندات واللوائح المعقدة. 
        المطلوب: قم باستخراج قائمة المتدربين من الملف المرفق بدقة متناهية.
        حول البيانات إلى تنسيق JSON حسب المخطط المطلوب. 
        يجب استخراج: (الاسم الكامل، البريد الإلكتروني، التخصص، ورقم الهاتف). 
        إذا كان الحقل غير موجود، اتركه فارغاً. 
        أعطِ الأولوية للدقة وتأكد من أن البريد الإلكتروني صيغته صحيحة.`;

        const result = await model.generateContent({
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
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: traineeExtractionSchema as any
            }
        });

        return parseAiJson(result.response.text());
    }, "Document Trainee Extraction");
};
