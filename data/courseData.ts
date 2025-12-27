
import { TextData, Skill, Team, TestContext, ProgressDataPoint, ChatChannel, Resource, MultilingualString, Specialization } from '../types';

export const initialTexts: TextData[] = [
    {
        id: 'txt-1',
        title: { ar: 'المقاولات الصغرى والمتوسطة في المغرب', fr: 'PME au Maroc' },
        specialization: { ar: 'تدبير المقاولات', fr: 'Gestion' },
        difficulty: 'متوسط',
        learningObjectives: [
            { ar: 'فهم دور المقاولات الصغرى والمتوسطة', fr: 'Comprendre le rôle des PME' },
            { ar: 'تحليل النسيج المقاولاتي المغربي', fr: 'Analyser le tissu entrepreneurial marocain' }
        ],
        skillIds: [1],
        content: {
            ar: `يعتبر الباحثون والدارسون أن قضية تطوير وتنمية المقاولات الصغرى والمتوسطة تُعتبر إحدى الرهانات الكبرى الملقاة على كاهل صناع القرار. تلعب هذه المقاولات دوراً هاماً وحيوياً في النمو الاقتصادي، وخلق فرص الشغل، والتماسك الاجتماعي. وبالتركيز على المغرب، يتبين أن المقاولات الصغرى والمتوسطة تحتل مكانة هامة ضمن المنظومة الاقتصادية، فهي تمثل حوالي 95 في المائة من النسيج المقاولاتي المغربي.`,
            fr: `Les PME représentent environ 95% du tissu entrepreneurial marocain.`
        },
        questions: []
    }
];

export const initialSkills: Skill[] = [
    {
        id: 1,
        title: { ar: 'العمل الجماعي', fr: 'Travail d\'Équipe' },
        description: { ar: 'القدرة على التعاون بفعالية.', fr: 'Collaborer efficacement.' },
        iconName: 'UsersIcon',
    }
];

export const initialTeams: Team[] = [];
export const initialTestContexts: TestContext[] = [];
export const initialResources: Resource[] = [];

export const initialSpecializations: Specialization[] = [
    { id: 'spec-1', name: { ar: 'تدبير المقاولة', fr: 'Gestion des Entreprises' } },
    { id: 'spec-2', name: { ar: 'التقني المتخصص في تدبير المقاولة', fr: 'TS Gestion' } },
    { id: 'spec-3', name: { ar: 'الإدارة الفندقية', fr: 'Management Hôtelier' } },
    { id: 'spec-4', name: { ar: 'المساعد الإداري', fr: 'Assistant Administratif' } },
    { id: 'spec-5', name: { ar: 'كهرباء الإنشاءات', fr: 'Électricité de Bâtiment' } },
    { id: 'spec-6', name: { ar: 'المطعمة', fr: 'Restauration' } },
    { id: 'spec-7', name: { ar: 'الخياطة', fr: 'Couture' } },
    { id: 'spec-8', name: { ar: 'إصلاح المركبات السيارة', fr: 'Réparation Auto' } },
    { id: 'spec-9', name: { ar: 'النجارة', fr: 'Menuiserie' } },
];

export const initialProgressData: ProgressDataPoint[] = [
    { month: 'Septembre', completedTexts: 0, acquiredSkills: 0, testScores: 0 },
];

export const initialChatChannels: ChatChannel[] = [
    {
        id: 'smart-support',
        name: { ar: 'مركز الدعم الذكي', fr: 'Support Intelligent' },
        iconName: 'InformationCircleIcon',
        model: 'gemini-1.5-flash',
        defaultSystemPrompt: {
            ar: 'أنت مساعد الدعم الفني للمنصة التعليمية ISTA TATA. مهمتك هي مساعدة الطلاب في استخدام المنصة، شرح المميزات، وحل المشكلات التقنية البسيطة. كن ودوداً ومختصراً.',
            fr: 'Vous êtes l\'assistant support technique de la plateforme ISTA TATA...'
        },
        systemPrompt: {
            ar: 'أنت مساعد الدعم الفني للمنصة التعليمية ISTA TATA. مهمتك هي مساعدة الطلاب في استخدام المنصة، شرح المميزات، وحل المشكلات التقنية البسيطة. كن ودوداً ومختصراً.',
            fr: 'Vous êtes l\'assistant support technique de la plateforme ISTA TATA...'
        },
    },
    {
        id: 'test-expert',
        name: { ar: 'خبير الاختبارات الذكي', fr: 'Expert Tests' },
        iconName: 'BeakerIcon',
        model: 'gemini-1.5-flash',
        defaultSystemPrompt: {
            ar: 'أنت خبير في تقييم المعارف. مهمتك هي إجراء اختبارات تفاعلية قصيرة للطلاب بناءً على تخصصاتهم. اطرح سؤالاً واحداً في كل مرة وانتظر الإجابة.',
            fr: 'Expert en évaluation... Proposez un quiz interactif.'
        },
        systemPrompt: {
            ar: 'أنت خبير في تقييم المعارف. مهمتك هي إجراء اختبارات تفاعلية قصيرة للطلاب بناءً على تخصصاتهم. اطرح سؤالاً واحداً في كل مرة وانتظر الإجابة.',
            fr: 'Expert en évaluation... Proposez un quiz interactif.'
        },
    },
    {
        id: 'comm-expert',
        name: { ar: 'خبير التواصل المهني', fr: 'Expert Comm' },
        iconName: 'ChatBubbleLeftRightIcon',
        model: 'gemini-1.5-flash',
        defaultSystemPrompt: { ar: 'أنت مساعد أكاديمي متخصص في التواصل المهني...', fr: 'Expert assistant en communication...' },
        systemPrompt: { ar: 'أنت مساعد أكاديمي متخصص في التواصل المهني...', fr: 'Expert assistant en communication...' },
    },
    {
        id: 'soft-skills-expert',
        name: { ar: 'خبير المهارات الناعمة', fr: 'Expert Soft Skills' },
        iconName: 'SparklesIcon',
        model: 'gemini-1.5-flash',
        defaultSystemPrompt: {
            ar: 'أنت مدرب تطوير ذاتي متخصص في المهارات الناعمة (Soft Skills) مثل العمل الجماعي، القيادة، والذكاء العاطفي. مهمتك هي مساعدة المتدربين على تطوير هذه المهارات من خلال النصائح والتمارين.',
            fr: 'Vous êtes un coach en développement personnel spécialisé dans les Soft Skills...'
        },
        systemPrompt: {
            ar: 'أنت مدرب تطوير ذاتي متخصص في المهارات الناعمة (Soft Skills) مثل العمل الجماعي، القيادة، والذكاء العاطفي. مهمتك هي مساعدة المتدربين على تطوير هذه المهارات من خلال النصائح والتمارين.',
            fr: 'Vous êtes un coach en développement personnel spécialisé dans les Soft Skills...'
        },
    }
];
