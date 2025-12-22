
import { TextData, Skill, Team, TestContext, ProgressDataPoint, ChatChannel, Resource, MultilingualString, Specialization } from '../types';

export const initialTexts: TextData[] = [
    {
        id: '1',
        title: {
            ar: 'مقدمة في التواصل المهني',
            fr: 'Introduction à la communication professionnelle'
        },
        specialization: {
            ar: 'جميع التخصصات',
            fr: 'Toutes spécialités'
        },
        content: {
            ar: `إذا كان الإنسان هو المبتدأ والمنتهى في مسيرة الحياة البشرية، فإن الوليد البشري إنما يكون في البداية إنساناً بالقوة ولا يستطيع أن يتحول إلى إنسان بالفعل إلا بالقدر الذي يستثمر فيه الإمكانات التواصلية لديه. وهذا أمر لا يمكن أن يتأتى بدرجة عالية إلا عن طريق عمليتي التربية والتكوين. فمن يملك اللغة يملك الفعالية الرمزية وسلطة التأثير والإقناع بموجب العملية التواصلية. في بيئة العمل التقني، يصبح التواصل الفعال بين التقني والمشرف حجر الزاوية لنجاح المشاريع.`,
            fr: `Si l'être humain est le début et la fin du parcours de la vie humaine, le nouveau-né n'est au départ qu'un être humain en puissance et ne peut devenir un être humain en acte que dans la mesure où il investit son potentiel de communication. Ceci ne peut être atteint à un haut degré que par les processus d'éducation et de formation. Celui qui maîtrise la langue détient l'efficacité symbolique et le pouvoir d'influence et de persuasion par le processus de communication.`
        },
        questions: [
            { 
                id: 'q1-1', 
                text: { ar: 'حسب النص، ما هي الوسيلة الأساسية لتحويل الإنسان من "إنسان بالقوة" إلى "إنسان بالفعل"؟', fr: `Selon le texte, quel est le principal moyen de transformer l'être humain d'un "être en puissance" à un "être en acte" ?` }, 
                type: 'فهم',
                options: [
                    { id: 'q1-1-opt1', text: { ar: 'التربية والتكوين المهني', fr: `L'éducation et la formation` } },
                    { id: 'q1-1-opt2', text: { ar: 'امتلاك السلطة المالية', fr: `La possession du pouvoir` } },
                    { id: 'q1-1-opt3', text: { ar: 'الانعزال عن المجتمع', fr: `L'isolement` } },
                    { id: 'q1-1-opt4', text: { ar: 'القوة البدنية فقط', fr: `La force physique seule` } },
                ],
                correctAnswerId: 'q1-1-opt1'
            },
            { id: 'q1-2', text: { ar: 'ماذا يقصد الكاتب بـ "سلطة التأثير والإقناع" في سياق العمل؟', fr: `Que veut dire l'auteur par "le pouvoir d'influence et de persuasion" ?` }, type: 'مفاهيم' },
        ],
    },
    {
        id: '2',
        title: {
            ar: 'مهارات التواصل الفعال في المهن التقنية',
            fr: 'Compétences de communication en milieu technique'
        },
        specialization: {
            ar: 'مهارات شخصية',
            fr: 'Compétences personnelles'
        },
        content: {
            ar: `تتضمن مهارات التواصل الفعال مجموعة من المهارات، منها: مهارة الاستماع النشط، وهي القدرة على فهم واستيعاب تعليمات المشرف بدقة. مهارة التحدث المهني، وهي القدرة على شرح المشكلات التقنية لغير المتخصصين. مهارة الكتابة التقنية، وهي القدرة على صياغة تقارير الصيانة اليومية بوضوح. هذه المهارات تستلزم الوضوح والدقة لتجنب الحوادث المهنية في ورشات العمل.`,
            fr: `Les compétences de communication efficace comprennent un ensemble d'aptitudes, notamment : l'écoute, l'expression orale, l'écriture technique et la lecture. Ces compétences exigent clarté et précision.`
        },
        questions: [
            { id: 'q2-1', text: { ar: 'لماذا يعد "الوضوح والدقة" ضروريين في ورشات العمل التقنية؟', fr: 'Pourquoi la clarté et la précision sont-elles nécessaires dans les ateliers techniques ?' }, type: 'تحليل' },
            { id: 'q2-2', text: { ar: 'كيف يمكن لمهارة الكتابة التقنية أن تساهم في تتبع أعطال الماكينات؟', fr: `Comment l'écriture technique peut-elle aider au suivi des pannes ?` }, type: 'مناقشة' },
        ],
    }
];

export const initialSkills: Skill[] = [
    {
        id: 1,
        title: { ar: 'التواصل الفعال', fr: 'Communication Efficace' },
        description: { ar: 'القدرة على نقل الأفكار والمعلومات بوضوح وثقة، سواء شفهياً أو كتابياً.', fr: `Capacité à transmettre des idées et des informations avec clarté et confiance.` },
        iconName: 'ChatBubbleLeftRightIcon',
    },
    {
        id: 2,
        title: { ar: 'العمل الجماعي', fr: `Travail d'Équipe` },
        description: { ar: 'التعاون مع الآخرين بفعالية لتحقيق أهداف مشتركة، وتقاسم المسؤوليات في الورشة.', fr: 'Collaborer efficacement avec les autres.' },
        iconName: 'UsersIcon',
    },
    {
        id: 3,
        title: { ar: 'التفكير النقدي', fr: 'Pensée Critique' },
        description: { ar: 'تحليل المشكلات التقنية بموضوعية، وتقييم الحلول المتاحة.', fr: 'Analyser les informations de manière objective.' },
        iconName: 'LightBulbIcon',
    }
];

export const initialSpecializations: Specialization[] = [
    { id: 'spec-1', name: { ar: 'كهرباء الصيانة الصناعية', fr: 'Électricité de Maintenance Industrielle' }, traineeCount: 45 },
    { id: 'spec-2', name: { ar: 'إصلاح مركبات الشحن الثقيل', fr: 'Réparation de Poids Lourds' }, traineeCount: 30 },
    { id: 'spec-3', name: { ar: 'الأنظمة التلقائية', fr: 'Systèmes Automatisés' }, traineeCount: 20 },
    { id: 'spec-4', name: { ar: 'عام / إدارة', fr: 'Général / Gestion' }, traineeCount: 25 },
];

export const initialTeams: Team[] = [
    { 
        id: 1, 
        name: { ar: 'فريق الابتكار الصناعي', fr: `Équipe d'innovation` }, 
        specialization: { ar: 'كهرباء الصيانة الصناعية', fr: 'Électricité de Maintenance Industrielle' }, 
        members: ['أحمد', 'فاطمة', 'يوسف'], 
        presentation: 'تقرير صيانة محول كهربائي.pdf', 
        presentationData: null,
        videoSummaryUrl: null,
        presentationTitle: { ar: 'صيانة المحولات الكهربائية الثلاثية الأطوار', fr: "Maintenance des transformateurs" },
        dueDate: '2024-10-15',
        teamLeader: 'أحمد'
    }
];

export const initialTestContexts: TestContext[] = [
    {
        id: 'ctx1',
        title: { ar: 'أهمية الصيانة الوقائية', fr: `Maintenance préventive` },
        content: {
            ar: 'تعتبر الصيانة الوقائية عنصراً حاسماً في أي منشأة صناعية حديثة. بدلاً من انتظار حدوث الأعطال، تهدف الصيانة الوقائية إلى فحص المعدات بانتظام وتحديد المشكلات المحتملة قبل تفاقمها. يؤدي هذا النهج الاستباقي إلى تقليل وقت التوقف غير المخطط له، وزيادة عمر المعدات، وتحسين السلامة العامة في مكان العمل.',
            fr: `La maintenance préventive est un élément crucial dans toute installation industrielle moderne.`
        }
    }
];

export const initialResources: Resource[] = [
    { id: 'res1', title: { ar: 'قواعد النحو العربي للتقنيين', fr: 'Grammaire arabe pour techniciens' }, type: { ar: 'ملف تعليمي', fr: 'Support de cours' }, link: '#' },
    { id: 'res2', title: { ar: 'مهارات العرض التقديمي الفعال', fr: 'Soft Skills de présentation' }, type: { ar: 'فيديو', fr: 'Vidéo' }, link: '#' },
];

export const initialProgressData: ProgressDataPoint[] = [
    { month: 'Septembre', completedTexts: 2, acquiredSkills: 1, testScores: 75 },
    { month: 'Octobre', completedTexts: 5, acquiredSkills: 2, testScores: 80 },
];

const generalPrompt: MultilingualString = {
    ar: 'أنت مساعد ذكاء اصطناعي خبير في اللغة العربية والتواصل المهني لمتدربي المعهد المتخصص للتكنولوجيا التطبيقية بطاطا (ISTA Tata). مهمتك هي تقديم الدعم اللغوي، شرح المصطلحات التقنية بالعربية الفصحى، والمساعدة في صياغة التقارير والرسائل المهنية. كن مشجعاً ومهنياً واستخدم أمثلة من تخصصات المتدربين.',
    fr: `Vous êtes un assistant IA expert en communication professionnelle pour les stagiaires de l'ISTA Tata. Votre mission est de les aider à améliorer leur arabe professionnel.`
};

const criticalThinkingPrompt: MultilingualString = {
    ar: 'أنت مدرب في التفكير النقدي وحل المشكلات المهنية. ساعد المتدربين على تحليل المواقف المعقدة في بيئة العمل، وتدريبهم على اتخاذ القرارات بناءً على المعطيات المتاحة. اطرح أسئلة سقراطية لتوجيههم للحل بدلاً من إعطائه مباشرة.',
    fr: `Vous êtes un coach en pensée critique et résolution de problèmes professionnels.`
};

export const initialChatChannels: ChatChannel[] = [
    {
        id: 'ai-assistant-general',
        name: { ar: 'المساعد الأكاديمي الشامل', fr: 'Assistant IA Général' },
        iconName: 'AcademicCapIcon',
        model: 'gemini-3-flash-preview',
        defaultSystemPrompt: generalPrompt,
        systemPrompt: generalPrompt,
    },
    {
        id: 'ai-assistant-pro',
        name: { ar: 'مستشار المهارات المتقدمة', fr: 'Conseiller Soft Skills' },
        iconName: 'SparklesIcon',
        model: 'gemini-3-pro-preview',
        defaultSystemPrompt: criticalThinkingPrompt,
        systemPrompt: criticalThinkingPrompt,
    }
];
