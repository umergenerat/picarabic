import { TextData, Skill, Team, TestContext, ProgressDataPoint, ChatChannel, Resource, MultilingualString, Specialization } from '../types';

export const initialTexts: TextData[] = [
    {
        id: '1',
        title: {
            ar: 'مقدمة في التواصل',
            fr: 'Introduction à la communication'
        },
        specialization: {
            ar: 'جميع التخصصات',
            fr: 'Toutes spécialités'
        },
        content: {
            ar: `إذا كان الإنسان هو المبتدأ والمنتهى في مسيرة الحياة البشرية، فإن الوليد البشري إنما يكون في البدا-ية إنساناً بالقوة ولا يستطيع أن يتحول إلى إنسان بالفعل إلا بالقدر الذي يستثمر فيه الإمكانات التواصلية لديه. وهذا أمر لا يمكن أن يتأتى بدرجة عالية إلا عن طريق عمليتي التربية والتكوين. فمن يملك اللغة يملك الفعالية الرمزية وسلطة التأثير والإقناع بموجب العملية التواصلية.`,
            fr: `Si l'être humain est le début et la fin du parcours de la vie humaine, le nouveau-né n'est au départ qu'un être humain en puissance et ne peut devenir un être humain en acte que dans la mesure où il investit son potentiel de communication. Ceci ne peut être atteint à un haut degré que par les processus d'éducation et de formation. Celui qui maîtrise la langue détient l'efficacité symbolique et le pouvoir d'influence et de persuasion par le processus de communication.`
        },
        questions: [
            { 
                id: 'q1-1', 
                text: { ar: 'حسب النص، ما هي الوسيلة الأساسية لتحويل الإنسان من "إنسان بالقوة" إلى "إنسان بالفعل"؟', fr: `Selon le texte, quel est le principal moyen de transformer l'être humain d'un "être en puissance" à un "être en acte" ?` }, 
                type: 'فهم',
                options: [
                    { id: 'q1-1-opt1', text: { ar: 'التربية والتكوين', fr: `L'éducation et la formation` } },
                    { id: 'q1-1-opt2', text: { ar: 'امتلاك السلطة', fr: `La possession du pouvoir` } },
                    { id: 'q1-1-opt3', text: { ar: 'الثروة المادية', fr: `La richesse matérielle` } },
                    { id: 'q1-1-opt4', text: { ar: 'التواصل الفعال فقط', fr: `La communication efficace seule` } },
                ],
                correctAnswerId: 'q1-1-opt1'
            },
            { id: 'q1-2', text: { ar: 'ماذا يقصد الكاتب بـ "سلطة التأثير والإقناع"؟', fr: `Que veut dire l'auteur par "le pouvoir d'influence et de persuasion" ?` }, type: 'مفاهيم' },
        ],
    },
    {
        id: '2',
        title: {
            ar: 'مهارات التواصل الفعال',
            fr: 'Compétences de communication efficace'
        },
        specialization: {
            ar: 'مهارات شخصية',
            fr: 'Compétences personnelles'
        },
        content: {
            ar: `تتضمن مهارات التواصل الفعال مجموعة من المهارات، منها: مهارة الاستماع، وهي القدرة على فهم واستيعاب ما يقوله الآخرون. مهارة التحدث، وهي القدرة على التعبير عن أفكارك ومشاعرك بشكل واضح. مهارة الكتابة، وهي القدرة على التعبير الواضح باستخدام اللغة المكتوبة. ومهارة القراءة، وهي القدرة على فهم ما تقرأه. هذه المهارات تستلزم الوضوح والدقة في الأهداف والأدوار.`,
            fr: `Les compétences de communication efficace comprennent un ensemble d'aptitudes, notamment : l'écoute, qui est la capacité de comprendre et d'assimiler ce que les autres disent. L'expression orale, qui est la capacité d'exprimer clairement ses pensées et ses sentiments. L'écriture, qui est la capacité de s'exprimer clairement en utilisant la langue écrite. Et la lecture, qui est la capacité de comprendre ce que vous lisez. Ces compétences exigent clarté et précision dans les objectifs et les rôles.`
        },
        questions: [
            { id: 'q2-1', text: { ar: 'اذكر اثنتين من مهارات التواصل الفعال التي تم شرحها في النص.', fr: 'Mentionnez deux compétences de communication efficace expliquées dans le texte.' }, type: 'فهم' },
            { id: 'q2-2', text: { ar: 'في تخصصك (مثلاً: الكهرباء الصناعية)، كيف يمكن لمهارة الاستماع أن تساعدك في تجنب الأخطاء؟', fr: `Dans votre spécialité (ex: Électricité industrielle), comment l'écoute peut-elle vous aider à éviter les erreurs ?` }, type: 'تحليل' },
            { id: 'q2-3', text: { ar: 'هل تعتقد أن مهارة الكتابة لا تزال مهمة في عصر التواصل الرقمي السريع؟ ولماذا؟', fr: `Pensez-vous que la compétence écrite est toujours importante à l'ère de la communication numérique rapide ? Et pourquoi ?` }, type: 'مناقشة' },
        ],
    },
    {
        id: '3',
        title: {
            ar: 'اقتصاد المعرفة',
            fr: 'Économie de la connaissance'
        },
        specialization: {
            ar: 'اقتصاد وإدارة',
            fr: 'Économie et gestion'
        },
        content: {
            ar: `في الاقتصاد التقليدي، كانت الشركات الكبرى هي المسيطرة، وهي الأكثر امتلاكاً للأصول والمعدات. أما اقتصاد المعرفة الحديث، فإنه يعتمد على المعلومة والمعرفة وتقنيات الاتصالات ومدى الإبداع والابتكار في إدارتها واستخدامها. يتيح هذا الاقتصاد فرصاً للشركات الجديدة أن تكون عابرة للحدود وأن تقدم منتجات وخدمات مرنة تتغلب على القيود التقليدية.`,
            fr: `Dans l'économie traditionnelle, les grandes entreprises étaient dominantes, possédant le plus d'actifs et d'équipements. Quant à l'économie moderne de la connaissance, elle repose sur l'information, le savoir, les technologies de la communication et le degré de créativité et d'innovation dans leur gestion et leur utilisation. Cette économie offre aux nouvelles entreprises la possibilité de transcender les frontières et de proposer des produits et services flexibles qui surmontent les contraintes traditionnelles.`
        },
        questions: [
            { id: 'q3-1', text: { ar: 'ما هو العنصر الأساسي الذي يعتمد عليه اقتصاد المعرفة الحديث؟', fr: `Quel est l'élément fondamental sur lequel repose l'économie moderne de la connaissance ?` }, type: 'فهم' },
        ],
    },
    {
        id: '4',
        title: {
            ar: 'السلامة الكهربائية في ورشات العمل',
            fr: 'Sécurité Électrique dans les Ateliers'
        },
        specialization: {
            ar: 'كهرباء الصيانة الصناعية',
            fr: 'Électricité de Maintenance Industrielle'
        },
        content: {
            ar: `تعتبر السلامة الكهربائية من أهم الأولويات في أي بيئة عمل تتعامل مع المعدات الكهربائية. يجب على الفنيين دائمًا التأكد من فصل التيار الكهربائي قبل البدء في أي أعمال صيانة أو إصلاح. استخدام أدوات معزولة وارتداء معدات الوقاية الشخصية المناسبة، مثل القفازات والنظارات الواقية، يقلل بشكل كبير من خطر الصدمات الكهربائية. إجراءات القفل ووضع اللافتات (LOTO) هي ممارسة قياسية لضمان عدم إعادة توصيل الطاقة عن طريق الخطأ أثناء العمل.`,
            fr: `La sécurité électrique est une priorité absolue dans tout environnement de travail impliquant des équipements électriques. Les techniciens doivent toujours s'assurer que l'alimentation électrique est coupée avant de commencer tout travail de maintenance ou de réparation. L'utilisation d'outils isolés et le port d'équipements de protection individuelle appropriés, tels que des gants et des lunettes de sécurité, réduisent considérablement le risque de chocs électriques. Les procédures de consignation et de déconsignation (LOTO) sont une pratique standard pour garantir que l'énergie n'est pas rétablie accidentuellement pendant les travaux.`
        },
        questions: [
            { id: 'q4-1', text: { ar: 'ما هي أول خطوة يجب على الفني اتخاذها قبل البدء في صيانة المعدات الكهربائية حسب النص؟', fr: `Quelle est la première étape qu'un technicien doit prendre avant de commencer la maintenance d'un équipement électrique, selon le texte ?` }, type: 'فهم' },
            { id: 'q4-2', text: { ar: 'لماذا تعتبر إجراءات القفل ووضع اللافتات (LOTO) مهمة جدًا في ضمان سلامة الفنيين؟', fr: `Pourquoi les procédures de consignation et de déconsignation (LOTO) sont-elles si importantes pour garantir la sécurité des techniciens ?` }, type: 'تحليل' },
        ],
    },
];

export const initialSkills: Skill[] = [
    {
        id: 1,
        title: { ar: 'التواصل الفعال', fr: 'Communication Efficace' },
        description: { ar: 'القدرة على نقل الأفكار والمعلومات بوضوح وثقة، سواء شفهياً أو كتابياً.', fr: `Capacité à transmettre des idées et des informations avec clarté et confiance, à l'oral comme à l'écrit.` },
        iconName: 'ChatBubbleLeftRightIcon',
    },
    {
        id: 2,
        title: { ar: 'العمل الجماعي', fr: `Travail d'Équipe` },
        description: { ar: 'التعاون مع الآخرين بفعالية لتحقيق أهداف مشتركة، وتقاسم المسؤوليات.', fr: 'Collaborer efficacement avec les autres pour atteindre des objectifs communs et partager les responsabilités.' },
        iconName: 'UsersIcon',
    },
    {
        id: 3,
        title: { ar: 'التفكير النقدي', fr: 'Pensée Critique' },
        description: { ar: 'تحليل المعلومات بموضوعية، وتقييم الحجج، وتكوين استنتاجات منطقية.', fr: 'Analyser les informations de manière objective, évaluer les arguments et former des conclusions logiques.' },
        iconName: 'LightBulbIcon',
    },
    {
        id: 4,
        title: { ar: 'مهارة التخطيط والتنظيم', fr: 'Planification et Organisation' },
        description: { ar: 'القدرة على تحديد الأهداف ووضع الخطط وترتيب المهام والموارد اللازمة لتحقيقها بفعالية.', fr: 'Capacité à définir des objectifs, élaborer des plans et organiser les tâches et les ressources pour les atteindre efficacement.' },
        iconName: 'PresentationChartBarIcon',
    },
    {
        id: 5,
        title: { ar: 'اتخاذ القرار', fr: 'Prise de Décision' },
        description: { ar: 'اختيار أفضل مسار للعمل من بين عدة بدائل بناءً على تحليل وتقييم دقيق للمعلومات.', fr: `Choisir le meilleur plan d'action parmi plusieurs alternatives sur la base d'une analyse et d'une évaluation précises.` },
        iconName: 'BeakerIcon',
    },
    {
        id: 6,
        title: { ar: 'حل المشكلات', fr: 'Résolution de Problèmes' },
        description: { ar: 'تحديد المشكلات المعقدة وتطوير وتنفيذ حلول فعالة ومبتكرة باستخدام التفكير التحليلي والإبداعي.', fr: 'Identifier des problèmes complexes et développer et mettre en œuvre des solutions efficaces et innovantes.' },
        iconName: 'SparklesIcon',
    }
];

export const initialSpecializations: Specialization[] = [
    { id: 'spec-1', name: { ar: 'كهرباء الصيانة الصناعية', fr: 'Électricité de Maintenance Industrielle' }, traineeCount: 45 },
    { id: 'spec-2', name: { ar: 'إصلاح المركبات', fr: 'Réparation de Véhicules' }, traineeCount: 30 },
    { id: 'spec-3', name: { ar: 'عام / أخرى', fr: 'Général / Autre' }, traineeCount: 25 },
];

export const initialTeams: Team[] = [
    { 
        id: 1, 
        name: { ar: 'فريق الابتكار', fr: `Équipe d'innovation` }, 
        specialization: { ar: 'كهرباء الصيانة الصناعية', fr: 'Électricité de Maintenance Industrielle' }, 
        members: ['أحمد', 'فاطمة', 'يوسف'], 
        presentation: 'عرض تقديمي حول الذكاء الاصطناعي.pdf', 
        presentationData: null,
        videoSummaryUrl: null,
        presentationTitle: { ar: 'تأثير الذكاء الاصطناعي على الصيانة', fr: "L'impact de l'IA sur la maintenance" },
        dueDate: '2024-09-15',
        teamLeader: 'أحمد'
    },
    { 
        id: 2, 
        name: { ar: 'فريق التطوير', fr: 'Équipe de développement' }, 
        specialization: { ar: 'إصلاح المركبات', fr: 'Réparation de Véhicules' }, 
        members: ['سارة', 'محمد', 'علي'], 
        presentation: null, 
        videoSummaryUrl: null,
        presentationTitle: { ar: 'أنظمة التشخيص الحديثة في السيارات', fr: 'Systèmes de diagnostic modernes pour véhicules' },
        dueDate: '2024-09-20',
        teamLeader: 'سارة'
    },
    { 
        id: 3, 
        name: { ar: 'فريق التسويق', fr: 'Équipe marketing' }, 
        specialization: { ar: 'عام', fr: 'Général' }, 
        members: ['هبة', 'خالد', 'ليلى'], 
        presentation: 'خطة التسويق للربع الثالث.pptx', 
        presentationData: null,
        videoSummaryUrl: null,
        presentationTitle: { ar: 'استراتيجية التسويق الرقمي للمعهد', fr: 'Stratégie de marketing numérique pour l\'institut' },
        dueDate: '2024-09-10',
        teamLeader: 'هبة'
    },
];

export const initialTestContexts: TestContext[] = [
    {
        id: 'ctx1',
        title: { ar: 'موضوع تقييمي حول أهمية الصيانة الوقائية', fr: `Sujet d'évaluation sur l'importance de la maintenance préventive` },
        content: {
            ar: 'تعتبر الصيانة الوقائية عنصراً حاسماً في أي منشأة صناعية حديثة. بدلاً من انتظار حدوث الأعطال، تهدف الصيانة الوقائية إلى فحص المعدات بانتظام وتحديد المشكلات المحتملة قبل تفاقمها. يؤدي هذا النهج الاستباقي إلى تقليل وقت التوقف غير المخطط له، وزيادة عمر المعدات، وتحسين السلامة العامة في مكان العمل.',
            fr: `La maintenance préventive est un élément crucial dans toute installation industrielle moderne. Au lieu d'attendre que les pannes se produisent, la maintenance préventive vise à inspecter régulièrement les équipements et à identifier les problèmes potentiels avant qu'ils ne s'aggravent. Cette approche proactive permet de réduire les temps d'arrêt imprévus, d'augmenter la durée de vie des équipements et d'améliorer la sécurité globale sur le lieu de travail.`
        }
    }
];

export const initialResources: Resource[] = [
    { id: 'res1', title: { ar: 'فيديو: 10 نصائح للتواصل الفعال في العمل', fr: 'Vidéo : 10 conseils pour une communication efficace au travail' }, type: { ar: 'فيديو YouTube', fr: 'Vidéo YouTube' }, link: 'https://www.youtube.com' },
    { id: 'res2', title: { ar: 'مقالة: كيف تبني فريق عمل ناجح؟', fr: 'Article : Comment construire une équipe performante ?' }, type: { ar: 'مقالة', fr: 'Article' }, link: 'https://www.google.com' },
    { id: 'res3', title: { ar: 'درس مفتوح: مقدمة في إدارة المشاريع', fr: 'Cours ouvert : Introduction à la gestion de projet' }, type: { ar: 'Coursera', fr: 'Coursera' }, link: 'https://www.coursera.org' },
    { id: 'res4', title: { ar: 'درس: مهارات العرض والتقديم', fr: 'Cours : Compétences de présentation' }, type: { ar: 'Edraak', fr: 'Edraak' }, link: 'https://www.edraak.org' },
];

export const initialProgressData: ProgressDataPoint[] = [
    { month: 'Septembre', completedTexts: 2, acquiredSkills: 1, testScores: 75 },
    { month: 'Octobre', completedTexts: 5, acquiredSkills: 2, testScores: 80 },
    { month: 'Novembre', completedTexts: 8, acquiredSkills: 4, testScores: 82 },
    { month: 'Décembre', completedTexts: 10, acquiredSkills: 5, testScores: 88 },
    { month: 'Janvier', completedTexts: 12, acquiredSkills: 6, testScores: 90 },
    { month: 'Février', completedTexts: 15, acquiredSkills: 7, testScores: 91 },
    { month: 'Mars', completedTexts: 18, acquiredSkills: 8, testScores: 94 },
];

const generalPrompt: MultilingualString = {
    ar: 'أنت مساعد ذكاء اصطناعي مفيد للمتدربين في معهد تكوين مهني بالمغرب يسمى ISTA Tata. هدفك هو مساعدتهم على تحسين مهارات التواصل المهني (الكتابي والشفهي). يجب أن تكون مشجعًا، وتقدم أمثلة واضحة، وتكيف نصائحك مع المجالات التقنية مثل الكهرباء الصناعية وإصلاح المركبات. يمكنك أيضًا مساعدتهم في التحضير للعروض التقديمية، أو فهم النصوص المعقدة، أو التدرب على الاختبارات. أجب دائمًا بلغة طلب المستخدم (إما العربية أو الفرنسية). كن ودودًا ومهنيًا.',
    fr: `Vous êtes un assistant IA utile pour les stagiaires d'un institut de formation professionnelle au Maroc appelé ISTA Tata. Votre objectif est de les aider à améliorer leurs compétences en communication professionnelle (écrite et orale). Vous devez être encourageant, fournir des exemples clairs et adapter vos conseils aux domaines techniques comme l'électricité industrielle et la réparation de véhicules. Vous pouvez également les aider à préparer des présentations, à comprendre des textes complexes ou à s'entraîner pour des tests. Répondez toujours dans la langue de la requête de l'utilisateur (arabe ou français). Soyez amical et professionnel.`
};

const criticalThinkingPrompt: MultilingualString = {
    ar: 'أنت مدرب متخصص في التفكير النقدي. مهمتك هي طرح أسئلة محفزة على المتدربين، وتشجيعهم على تحليل المواقف من زوايا متعددة، وتقييم الحجج بموضوعية. لا تقدم إجابات مباشرة، بل قم بتوجيههم للوصول إلى استنتاجاتهم الخاصة. ركز على سيناريوهات من واقع بيئة العمل المهنية والتقنية.',
    fr: `Vous êtes un coach spécialisé en pensée critique. Votre mission est de poser des questions stimulantes aux stagiaires, de les encourager à analyser les situations sous plusieurs angles et à évaluer objectivement les arguments. Ne donnez pas de réponses directes, mais guidez-les pour qu'ils parviennent à leurs propres conclusions. Concentrez-vous sur des scénarios issus de l'environnement de travail professionnel et technique.`
};

export const initialChatChannels: ChatChannel[] = [
    {
        id: 'ai-assistant-general',
        name: { ar: 'المساعد الذكي العام', fr: 'Assistant IA Général' },
        iconName: 'SparklesIcon',
        model: 'gemini-2.5-pro',
        defaultSystemPrompt: generalPrompt,
        systemPrompt: generalPrompt,
    },
    {
        id: 'ai-assistant-critical-thinking',
        name: { ar: 'التفكير النقدي', fr: 'Pensée Critique' },
        iconName: 'LightBulbIcon',
        model: 'gemini-2.5-pro',
        defaultSystemPrompt: criticalThinkingPrompt,
        systemPrompt: criticalThinkingPrompt,
    }
];