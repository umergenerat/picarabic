
import { TextData, Skill, Team, TestContext, ProgressDataPoint, ChatChannel, Resource, MultilingualString, Specialization } from '../types';

// --- نصوص القراءة والفهم المستخرجة من PDF ---
export const initialTexts: TextData[] = [
    {
        id: 'txt-1',
        title: { ar: 'المقاولات الصغرى والمتوسطة في المغرب', fr: 'PME au Maroc' },
        specialization: { ar: 'تدبير المقاولات', fr: 'Gestion' },
        content: {
            ar: `يعتبر الباحثون والدارسون أن قضية تطوير وتنمية المقاولات الصغرى والمتوسطة تُعتبر إحدى الرهانات الكبرى الملقاة على كاهل صناع القرار. تلعب هذه المقاولات دوراً هاماً وحيوياً في النمو الاقتصادي، وخلق فرص الشغل، والتماسك الاجتماعي. وبالتركيز على المغرب، يتبين أن المقاولات الصغرى والمتوسطة تحتل مكانة هامة ضمن المنظومة الاقتصادية، فهي تمثل حوالي 95 في المائة من النسيج المقاولاتي المغربي.`,
            fr: `Les PME représentent environ 95% du tissu entrepreneurial marocain et jouent un rôle crucial dans la croissance économique et la création d'emplois.`
        },
        questions: [
            {
                id: 'q1-1',
                text: { ar: 'ما هو الدور الذي تلعبه المقاولات الصغرى والمتوسطة في التنمية؟', fr: 'Quel est le rôle des PME dans le développement ?' },
                type: 'فهم',
                options: [
                    { id: 'opt-1', text: { ar: 'المساهمة في النمو الاقتصادي وخلق فرص الشغل', fr: 'Croissance et création d\'emplois' } },
                    { id: 'opt-2', text: { ar: 'زيادة الواردات فقط', fr: 'Augmenter les importations' } },
                    { id: 'opt-3', text: { ar: 'إضعاف المنافسة الدولية', fr: 'Affaiblir la compétition' } }
                ],
                correctAnswerId: 'opt-1'
            },
            { id: 'q1-2', text: { ar: 'حدد أهم التحديات التي تواجه المقاولات الصغرى في المغرب حسب النص.', fr: 'Défis des PME au Maroc.' }, type: 'تحليل' }
        ]
    },
    {
        id: 'txt-2',
        title: { ar: 'التحيز في الذكاء الاصطناعي', fr: 'Biais dans l\'IA' },
        specialization: { ar: 'التكنلوجيا الرقمية', fr: 'Technologie Digital' },
        content: {
            ar: `التحيز في الذكاء الاصطناعي هو مشكلة خطيرة يمكن أن تؤدي إلى نتائج غير عادلة أو حتى ضارة. يحدث التحيز عندما يتم تصميم أو تدريب أنظمة الذكاء الاصطناعي بطريقة تعكس التحيزات الموجودة في العالم الحقيقي. على سبيل المثال، إذا كانت بيانات التدريب تتكون بشكل أساسي من الرجال البيض، فمن المرجح أن يكون النظام أقل دقة في التعرف على النساء أو الأشخاص ذوي البشرة الملونة.`,
            fr: `Le biais algorithmique se produit lorsque les systèmes d'IA reflètent les préjugés du monde réel à travers des données d'entraînement non représentatives.`
        },
        questions: [
            { id: 'q2-1', text: { ar: 'كيف يمكن أن يؤدي "التحيز التصميمي" إلى التمييز المهني؟', fr: 'Comment le biais mène à la discrimination ?' }, type: 'تحليل' },
            { id: 'q2-2', text: { ar: 'في رأيك، ما هي الإجراءات التقنية للحد من تحيز الخوارزميات؟', fr: 'Actions pour réduire le biais ?' }, type: 'مناقشة' }
        ]
    }
];

// --- المهارات المهنية (Soft Skills) المستخرجة من PDF ---
export const initialSkills: Skill[] = [
    {
        id: 1,
        title: { ar: 'العمل الجماعي وفريق العمل', fr: 'Travail d\'Équipe' },
        description: { ar: 'القدرة على التعاون مع أفراد من خلفيات مختلفة لتحقيق أهداف مشتركة، وتقاسم المسؤوليات بفعالية.', fr: 'Collaborer efficacement en groupe.' },
        iconName: 'UsersIcon',
    },
    {
        id: 2,
        title: { ar: 'تقنيات التفاوض والإقناع', fr: 'Négociation et Persuasion' },
        description: { ar: 'استخدام التخطيط والاستماع الفعال وبناء العلاقات للوصول إلى اتفاقات مرضية لجميع الأطراف.', fr: 'Maîtriser les techniques de négociation.' },
        iconName: 'ChatBubbleLeftRightIcon',
    },
    {
        id: 3,
        title: { ar: 'كتابة التقارير التقنية', fr: 'Rédaction de Rapports' },
        description: { ar: 'صياغة وثائق مكتوبة لتسجيل المعلومات والنتائج المتعلقة بمشروع أو عطل تقني بدقة ووضوح.', fr: 'Rédiger des documents techniques clairs.' },
        iconName: 'DocumentTextIcon',
    }
];

// --- الفرق والمشاريع المقترحة في PDF ---
export const initialTeams: Team[] = [
    { 
        id: 1, 
        name: { ar: 'فريق التنمية المستدامة', fr: 'Équipe Durabilité' }, 
        specialization: { ar: 'الطاقات المتجددة', fr: 'Énergies Renouvelables' }, 
        members: ['ياسين', 'ليلى', 'عمر'], 
        presentation: null, 
        presentationData: null,
        videoSummaryUrl: null,
        presentationTitle: { ar: 'آفاق الطاقات المتجددة في منطقة طاطا', fr: "Énergies renouvelables à Tata" },
        dueDate: '2025-05-20',
        teamLeader: 'ياسين'
    }
];

// --- سياقات الاختبارات الذكية ---
export const initialTestContexts: TestContext[] = [
    {
        id: 'ctx-1',
        title: { ar: 'الثورة الصناعية الرابعة', fr: 'Industrie 4.0' },
        content: {
            ar: 'تتميز الثورة الصناعية الرابعة بمزج التقنيات التي تلغي الحدود بين ما هو فيزيائي ورقمي وبيولوجي. إنها تطال كل الصناعات وتغير طرق العيش والعمل. تعتمد هذه الثورة على الذكاء الاصطناعي، الروبوتات، والطباعة ثلاثية الأبعاد.',
            fr: 'L\'industrie 4.0 fusionne les technologies physiques, numériques et biologiques.'
        }
    }
];

// --- المصادر التعليمية الإضافية ---
export const initialResources: Resource[] = [
    { id: 'res1', title: { ar: 'دليل كتابة التقارير للمتدربين', fr: 'Guide de rédaction' }, type: { ar: 'PDF تعليمي', fr: 'Support PDF' }, link: '#' },
];

export const initialSpecializations: Specialization[] = [
    { id: 'spec-1', name: { ar: 'تدبير المقاولات', fr: 'Gestion des Entreprises' }, traineeCount: 0 },
    { id: 'spec-2', name: { ar: 'التقني المتخصص في تدبير المقاولة', fr: 'TS Gestion des Entreprises' }, traineeCount: 0 },
    { id: 'spec-3', name: { ar: 'الإدارة الفندقية', fr: 'Management Hôtelier' }, traineeCount: 0 },
    { id: 'spec-4', name: { ar: 'المساعد الإداري', fr: 'Assistant Administratif' }, traineeCount: 0 },
    { id: 'spec-5', name: { ar: 'كهرباء الإنشاءات', fr: 'Électricité de Bâtiment' }, traineeCount: 0 },
    { id: 'spec-6', name: { ar: 'المطعمة', fr: 'Restauration' }, traineeCount: 0 },
    { id: 'spec-7', name: { ar: 'الخياطة', fr: 'Couture' }, traineeCount: 0 },
    { id: 'spec-8', name: { ar: 'إصلاح المركبات السيارة', fr: 'Réparation Automobile' }, traineeCount: 0 },
    { id: 'spec-9', name: { ar: 'النجارة', fr: 'Menuiserie' }, traineeCount: 0 },
    { id: 'spec-10', name: { ar: 'كهرباء الصيانة الصناعية', fr: 'Électricité Industrielle' }, traineeCount: 0 },
    { id: 'spec-11', name: { ar: 'إصلاح مركبات الشحن الثقيل', fr: 'Mécanique Poids Lourd' }, traineeCount: 0 },
];

export const initialProgressData: ProgressDataPoint[] = [
    { month: 'Septembre', completedTexts: 1, acquiredSkills: 0, testScores: 0 },
    { month: 'Octobre', completedTexts: 3, acquiredSkills: 1, testScores: 70 },
    { month: 'Novembre', completedTexts: 5, acquiredSkills: 3, testScores: 85 },
];

// --- إعدادات المساعد الذكي ---
const generalPrompt: MultilingualString = {
    ar: 'أنت مساعد أكاديمي خبير في "مصوغة التواصل باللغة العربية". مهمتك هي مساعدة المتدربين في فهم النصوص، صياغة التقارير التقنية، والتحضير للمقابلات المهنية بناءً على محتوى الحقيبة التعليمية للمعهد (ISTA Tata). كن مشجعاً ومهنياً واستخدم أمثلة من التخصصات التقنية كالميكانيك والكهرباء.',
    fr: `Vous êtes un assistant IA expert en communication professionnelle.`
};

export const initialChatChannels: ChatChannel[] = [
    {
        id: 'comm-expert',
        name: { ar: 'خبير التواصل المهني', fr: 'Expert Comm' },
        iconName: 'ChatBubbleLeftRightIcon',
        model: 'gemini-3-flash-preview',
        defaultSystemPrompt: generalPrompt,
        systemPrompt: generalPrompt,
    }
];
