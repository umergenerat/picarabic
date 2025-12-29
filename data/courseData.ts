
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

export const initialTeams: Team[] = [
    {
        id: 1,
        name: { ar: 'فريق الريادة', fr: 'Équipe Leadership' },
        specialization: { ar: 'تدبير المقاولات', fr: 'Gestion des Entreprises' },
        members: ['أحمد بنسعيد', 'فاطمة العلوي', 'كريم مصباح'],
        presentation: null,
        presentationData: null,
        videoSummaryUrl: null,
        presentationTitle: { ar: 'استراتيجيات تطوير المقاولات الصغرى', fr: 'Stratégies de développement des PME' },
        dueDate: '2025-01-15',
        teamLeader: 'أحمد بنسعيد'
    },
    {
        id: 2,
        name: { ar: 'فريق الإبداع', fr: 'Équipe Créativité' },
        specialization: { ar: 'الإدارة الفندقية', fr: 'Management Hôtelier' },
        members: ['سارة المنصوري', 'يوسف الحسني', 'نور الدين بوزيان'],
        presentation: 'presentation_hotel.pptx',
        presentationData: null,
        videoSummaryUrl: null,
        presentationTitle: { ar: 'التسويق الرقمي للفنادق', fr: 'Marketing Digital Hôtelier' },
        dueDate: '2025-01-10',
        teamLeader: 'سارة المنصوري'
    },
    {
        id: 3,
        name: { ar: 'فريق التواصل', fr: 'Équipe Communication' },
        specialization: { ar: 'المساعد الإداري', fr: 'Assistant Administratif' },
        members: ['هند الراضي', 'محمد أمين', 'ليلى بركات'],
        presentation: null,
        presentationData: null,
        videoSummaryUrl: null,
        presentationTitle: { ar: 'تقنيات التواصل المهني الفعال', fr: 'Techniques de Communication Professionnelle' },
        dueDate: '2025-01-20',
        teamLeader: 'هند الراضي'
    },
    {
        id: 4,
        name: { ar: 'فريق التقنية', fr: 'Équipe Technique' },
        specialization: { ar: 'كهرباء الإنشاءات', fr: 'Électricité de Bâtiment' },
        members: ['عمر الزاهري', 'خالد بنعلي', 'رضا التازي'],
        presentation: 'electric_safety.pdf',
        presentationData: null,
        videoSummaryUrl: null,
        presentationTitle: { ar: 'معايير السلامة الكهربائية', fr: 'Normes de Sécurité Électrique' },
        dueDate: '2025-01-08',
        teamLeader: 'عمر الزاهري'
    }
];
export const initialTestContexts: TestContext[] = [
    {
        id: 'ctx-1',
        title: { ar: 'المقاولات الصغرى والمتوسطة', fr: 'Les PME' },
        content: {
            ar: `يعتبر الباحثون والدارسون أن قضية تطوير وتنمية المقاولات الصغرى والمتوسطة تُعتبر إحدى الرهانات الكبرى الملقاة على كاهل صناع القرار. تلعب هذه المقاولات دوراً هاماً وحيوياً في النمو الاقتصادي، وخلق فرص الشغل، والتماسك الاجتماعي. وبالتركيز على المغرب، يتبين أن المقاولات الصغرى والمتوسطة تحتل مكانة هامة ضمن المنظومة الاقتصادية، فهي تمثل حوالي 95 في المائة من النسيج المقاولاتي المغربي. كما أنها تساهم في توفير حوالي 46 في المائة من مناصب الشغل، و7.8 في المائة من الصادرات، و35 في المائة من الاستثمارات. غير أنه رغم هذه الأهمية، تواجه هذه المقاولات تحديات كبيرة منها: صعوبة الولوج إلى التمويل، ضعف الكفاءات الإدارية، والمنافسة غير المتكافئة مع المقاولات الكبرى.`,
            fr: `Les PME représentent environ 95% du tissu entrepreneurial marocain. Elles contribuent à environ 46% des emplois, 7.8% des exportations et 35% des investissements. Cependant, elles font face à des défis majeurs tels que l'accès au financement, le manque de compétences managériales et la concurrence inégale avec les grandes entreprises.`
        }
    },
    {
        id: 'ctx-2',
        title: { ar: 'التواصل المهني', fr: 'Communication Professionnelle' },
        content: {
            ar: `التواصل المهني هو مجموعة المهارات والتقنيات التي تُستخدم لنقل المعلومات بفعالية في بيئة العمل. يشمل ذلك التواصل الشفهي كالعروض التقديمية والاجتماعات، والتواصل الكتابي كالتقارير والرسائل الإلكترونية. من أهم مبادئ التواصل المهني الفعال: الوضوح والدقة في الرسالة، اختيار القناة المناسبة للتواصل، الإصغاء الفعال، والتكيف مع الجمهور المستهدف. كما يجب مراعاة آداب التواصل المهني مثل الاحترام والمهنية، والالتزام بالوقت، وتجنب المصطلحات المعقدة. من التحديات الشائعة: الحواجز الثقافية واللغوية، سوء الفهم، وإدارة الصراعات.`,
            fr: `La communication professionnelle englobe les compétences utilisées pour transmettre efficacement des informations dans un environnement de travail. Elle comprend la communication orale (présentations, réunions) et écrite (rapports, emails). Les principes clés incluent la clarté, le choix du canal approprié, l'écoute active et l'adaptation au public cible.`
        }
    },
    {
        id: 'ctx-3',
        title: { ar: 'مهارات القيادة', fr: 'Compétences en Leadership' },
        content: {
            ar: `القيادة هي القدرة على توجيه وتحفيز الآخرين نحو تحقيق أهداف مشتركة. يتميز القائد الفعال بعدة صفات منها: الرؤية الواضحة، القدرة على اتخاذ القرارات، مهارات التواصل، والذكاء العاطفي. هناك أنماط مختلفة للقيادة مثل: القيادة التحويلية التي تركز على التغيير والإلهام، القيادة الخادمة التي تضع احتياجات الفريق أولاً، والقيادة الديمقراطية التي تشرك الفريق في اتخاذ القرارات. لتطوير مهارات القيادة، يجب التركيز على: التعلم المستمر، طلب التغذية الراجعة، تحمل المسؤولية، وبناء علاقات قوية مع الفريق. كما أن القائد الناجح يعرف كيف يُفوض المهام ويُمكّن أعضاء فريقه من النمو والتطور.`,
            fr: `Le leadership est la capacité à guider et motiver les autres vers des objectifs communs. Un leader efficace se distingue par plusieurs qualités: vision claire, prise de décision, compétences en communication et intelligence émotionnelle. Il existe différents styles de leadership: transformationnel, serviteur et démocratique.`
        }
    }
];
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
        model: 'gemini-1.5-flash-001',
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
        model: 'gemini-1.5-flash-001',
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
        model: 'gemini-1.5-flash-001',
        defaultSystemPrompt: { ar: 'أنت مساعد أكاديمي متخصص في التواصل المهني...', fr: 'Expert assistant en communication...' },
        systemPrompt: { ar: 'أنت مساعد أكاديمي متخصص في التواصل المهني...', fr: 'Expert assistant en communication...' },
    },
    {
        id: 'soft-skills-expert',
        name: { ar: 'خبير المهارات الناعمة', fr: 'Expert Soft Skills' },
        iconName: 'SparklesIcon',
        model: 'gemini-1.5-flash-001',
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
