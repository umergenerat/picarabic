
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
        const model = ai.getGenerativeModel({ model: LATEST_MODEL });
        console.log('TTS request for:', text.substring(0, 20) + '...');
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: `انطق النص التالي بوضوح وبلغة عربية فصيحة: ${text}` }] }],
            generationConfig: {
                responseModalities: ["audio"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            } as any,
        });
        const responseData = result.response;
        const base64Audio = responseData.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data returned from Gemini TTS");
        return base64Audio;
    } catch (error: any) {
        console.error("Error generating speech:", error);
        throw new Error(error.message || "فشل في توليد الصوت.");
    }
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

            // Try with the intelligent model first for better results
            try {
                console.log(`AI Task: ${description} (Attempt ${attempt}/${maxRetries}, Model: ${INTELLIGENT_MODEL})`);
                const model = ai.getGenerativeModel({ model: INTELLIGENT_MODEL });
                return await task(model);
            } catch (firstError: any) {
                console.warn(`${INTELLIGENT_MODEL} failed, falling back to ${STABLE_MODEL}:`, firstError.message);
                // Fallback to the stable model
                const model = ai.getGenerativeModel({ model: STABLE_MODEL });
                return await task(model);
            }
        } catch (error: any) {
            lastError = error;
            console.error(`AI Task Failure [${description}] (Attempt ${attempt}/${maxRetries}):`, error.message);

            // Don't retry for specific errors
            if (error.message?.includes('API key') || error.message?.includes('quota') || error.message?.includes('429')) {
                break;
            }

            // Wait before retrying with exponential backoff
            if (attempt < maxRetries) {
                const waitTime = attempt * 1500; // 1.5s, 3s, etc.
                console.log(`Retrying in ${waitTime}ms...`);
                await delay(waitTime);
            }
        }
    }

    // Sanitize error messages for the user
    if (lastError?.message?.includes('API key')) {
        throw new Error("تنبيه: مفتاح الذكاء الاصطناعي غير صالح. يرجى التحقق من الإعدادات.");
    } else if (lastError?.message?.includes('quota') || lastError?.message?.includes('429')) {
        throw new Error("عذراً، تم الوصول للحد الأقصى للطلبات حالياً. يرجى المحاولة بعد قليل.");
    } else if (lastError?.message?.includes('network') || lastError?.message?.includes('fetch')) {
        throw new Error("خطأ في الاتصال بالشبكة. يرجى التأكد من اتصالك بالإنترنت.");
    }

    throw new Error("عذراً، فشل الاتصال بخدمة الذكاء الاصطناعي. يمكنك استخدام المحتوى البديل.");
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
    try {
        const ai = getAiClient(apiKey);
        const model = ai.getGenerativeModel({
            model: modelName,
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
    } catch (error: any) {
        console.error("Streaming chat error:", error);
        throw error;
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
    return runAiTask(apiKey, async (model) => {
        const result = await model.generateContent({
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
        return parseAiJson(result.response.text());
    }, "Quiz Generation");
};

export const evaluateAnswer = async (context: string, question: string, answer: string, apiKey?: string): Promise<string> => {
    return runAiTask(apiKey, async (model) => {
        const result = await model.generateContent({
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
        return result.response.text();
    }, "Answer Evaluation");
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
    return runAiTask(apiKey, async (model) => {
        const result = await model.generateContent({
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
        return parseAiJson(result.response.text());
    }, "Skill Scenario Generation");
};

export const evaluateSkillAnswer = async (
    skillTitle: string,
    scenario: string,
    userAnswer: string,
    apiKey?: string
): Promise<string> => {
    return runAiTask(apiKey, async (model) => {
        const result = await model.generateContent({
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
        return result.response.text();
    }, "Skill Answer Evaluation");
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
