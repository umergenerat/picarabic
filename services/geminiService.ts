
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from '../types';

const getAiClient = () => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    return new GoogleGenAI({ apiKey: API_KEY });
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
            model: "gemini-2.5-flash",
            contents: `بناءً على النص التالي، قم بإنشاء 5 أسئلة اختيار من متعدد باللغة العربية لاختبار فهم المتدرب. يجب أن يكون لكل سؤال أربعة خيارات، مع تحديد الإجابة الصحيحة. النص هو: """${context}"""`,
            config: {
                responseMimeType: "application/json",
                responseSchema: questionGenerationSchema
            }
        });

        const jsonStr = response.text.trim();
        const questions = JSON.parse(jsonStr);
        return questions;

    } catch (error) {
        console.error("Error generating quiz:", error);
        throw new Error("فشل في إنشاء الاختبار. يرجى المحاولة مرة أخرى.");
    }
};

export const evaluateAnswer = async (context: string, question: string, answer: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const prompt = `أنت مساعد تعليمي ذكي. قم بتقييم إجابة المتدرب التالية بناءً على النص والسؤال المرفقين. قدم تغذية راجعة بناءة ومشجعة باللغة العربية. اجعل التقييم موجزًا ومفيدًا.

النص المرجعي: """${context}"""
السؤال: "${question}"
إجابة المتدرب: "${answer}"

تقييمك:`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        return response.text;

    } catch (error) {
        console.error("Error evaluating answer:", error);
        throw new Error("فشل في تقييم الإجابة. يرجى المحاولة مرة أخرى.");
    }
};

const skillScenarioSchema = {
    type: Type.OBJECT,
    properties: {
        scenario: {
            type: Type.STRING,
            description: "سيناريو واقعي قصير من بيئة عمل مهنية."
        },
        question: {
            type: Type.STRING,
            description: "سؤال مفتوح حول كيفية تعامل المتدرب مع الموقف."
        }
    },
    required: ["scenario", "question"]
};

export const generateSkillScenario = async (skillTitle: string, skillDescription: string, specialization: string): Promise<{ scenario: string; question: string; }> => {
    try {
        const ai = getAiClient();
        const prompt = `أنت مدرب تطوير مهني. للمهارة التالية: '${skillTitle}' (${skillDescription})، قم بإنشاء سيناريو واقعي قصير ومحدد من بيئة عمل مهنية تتعلق بتخصص '${specialization}'. يجب أن يتطلب السيناريو من المتدرب تطبيق هذه المهارة. ثم، اطرح سؤالاً مفتوحاً حول كيفية تعامله مع الموقف. اجعل السيناريو والسؤال باللغة العربية وموجزين ومباشرين.`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: skillScenarioSchema
            }
        });
        
        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        return result;

    } catch (error) {
        console.error("Error generating skill scenario:", error);
        throw new Error("فشل في إنشاء سيناريو التمرين. يرجى المحاولة مرة أخرى.");
    }
};


export const evaluateSkillAnswer = async (skillTitle: string, scenario: string, userAnswer: string): Promise<string> => {
     try {
        const ai = getAiClient();
        const prompt = `أنت مدرب مهني داعم ومشجع. قام متدرب بوصف كيفية تعامله مع موقف يتعلق بمهارة '${skillTitle}'.
السيناريو كان: "${scenario}"
إجابة المتدرب هي: "${userAnswer}"

قدم تغذية راجعة بناءة ومشجعة باللغة العربية. ركز على الجوانب الإيجابية في إجابته، ثم قدم اقتراحاً واحداً أو اثنين لتحسينها. اجعل التغذية الراجعة موجزة وإيجابية وموجهة نحو التطوير.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        return response.text;

    } catch (error) {
        console.error("Error evaluating skill answer:", error);
        throw new Error("فشل في تقييم الإجابة. يرجى المحاولة مرة أخرى.");
    }
};
