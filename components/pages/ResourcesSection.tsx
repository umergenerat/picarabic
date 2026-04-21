
import React, { useState, useMemo } from 'react';
import Card from '../common/Card';
import { LinkIcon } from '../common/Icons';
import { useI18n } from '../../contexts/I18nContext';
import { Resource, TextData, Skill, Specialization } from '../../types';

interface ResourcesSectionProps {
    resources: Resource[];
    texts: TextData[];
    skills: Skill[];
    specializations: Specialization[];
}

// ───────────────────────────────────────────────────────────────
// Educational link generator – maps a topic keyword to curated URLs
// ───────────────────────────────────────────────────────────────
interface EducationalLink {
    title: string;
    url: string;
    source: string;
    type: 'video' | 'article' | 'course' | 'quiz';
    lang: 'ar' | 'fr' | 'both';
}

const TYPE_META: Record<EducationalLink['type'], { label: string; color: string; icon: string }> = {
    video:   { label: 'فيديو تعليمي',   color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',     icon: '▶' },
    article: { label: 'مقالة تعليمية', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: '📄' },
    course:  { label: 'دورة تدريبية',   color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',   icon: '🎓' },
    quiz:    { label: 'اختبار تفاعلي',  color: 'bg-amber-100 text-amber-700 dark:bg-amberald-900/40 dark:text-amber-300',   icon: '✏' },
};

// Static curated database keyed by Arabic topic slugs
const LINK_DB: Record<string, EducationalLink[]> = {
    // ── مهارات ناعمة ─────────────────────────────────────────
    'العمل الجماعي': [
        { title: 'كيف تبني فريق عمل ناجح – يوتيوب',     url: 'https://www.youtube.com/results?search_query=العمل+الجماعي+مهارات',  source: 'YouTube', type: 'video',   lang: 'ar' },
        { title: 'Teamwork Skills – Coursera',           url: 'https://www.coursera.org/search?query=teamwork',                      source: 'Coursera', type: 'course', lang: 'fr' },
        { title: 'مهارات العمل الجماعي – إدراك',        url: 'https://www.edraak.org/search/?q=العمل+الجماعي',                     source: 'إدراك',   type: 'course',  lang: 'ar' },
    ],
    'القيادة': [
        { title: 'مهارات القيادة للمبتدئين – يوتيوب',   url: 'https://www.youtube.com/results?search_query=مهارات+القيادة+عربي',   source: 'YouTube', type: 'video',   lang: 'ar' },
        { title: 'Leadership – Harvard Online',          url: 'https://online.hbs.edu/subjects/leadership/',                        source: 'Harvard', type: 'course',  lang: 'fr' },
        { title: 'القيادة الفعالة – إدراك',             url: 'https://www.edraak.org/search/?q=القيادة',                           source: 'إدراك',   type: 'course',  lang: 'ar' },
    ],
    'التواصل المهني': [
        { title: 'مهارات التواصل في بيئة العمل – يوتيوب', url: 'https://www.youtube.com/results?search_query=التواصل+المهني+مهارات', source: 'YouTube', type: 'video',  lang: 'ar' },
        { title: 'Communication Professionnelle – OpenClassrooms', url: 'https://openclassrooms.com/fr/search?q=communication+professionnelle', source: 'OpenClassrooms', type: 'course', lang: 'fr' },
        { title: 'مهارات التواصل – خان أكاديمي',        url: 'https://ar.khanacademy.org/',                                        source: 'Khan Academy', type: 'article', lang: 'ar' },
    ],
    'الذكاء العاطفي': [
        { title: 'الذكاء العاطفي – يوتيوب',             url: 'https://www.youtube.com/results?search_query=الذكاء+العاطفي',        source: 'YouTube', type: 'video',   lang: 'ar' },
        { title: 'Intelligence Émotionnelle – Coursera', url: 'https://www.coursera.org/search?query=intelligence+emotionnelle',    source: 'Coursera', type: 'course', lang: 'fr' },
    ],
    'التفكير النقدي': [
        { title: 'مهارة التفكير النقدي – يوتيوب',       url: 'https://www.youtube.com/results?search_query=التفكير+النقدي+تعليمي', source: 'YouTube', type: 'video',   lang: 'ar' },
        { title: 'Critical Thinking – edX',              url: 'https://www.edx.org/search?q=critical+thinking',                    source: 'edX',      type: 'course',  lang: 'fr' },
    ],
    // ── تخصصات ───────────────────────────────────────────────
    'تدبير المقاولة': [
        { title: 'إدارة المشاريع الصغيرة – يوتيوب',     url: 'https://www.youtube.com/results?search_query=إدارة+المقاولات+الصغيرة+المغرب', source: 'YouTube', type: 'video', lang: 'ar' },
        { title: 'Gestion d\'Entreprise – OpenClassrooms', url: 'https://openclassrooms.com/fr/search?q=gestion+entreprise',       source: 'OpenClassrooms', type: 'course', lang: 'fr' },
        { title: 'ريادة الأعمال – إدراك',               url: 'https://www.edraak.org/search/?q=ريادة+الأعمال',                    source: 'إدراك',    type: 'course',  lang: 'ar' },
        { title: 'مقالة: دور المقاولات الصغيرة في المغرب', url: 'https://www.hespress.com/?s=مقاولات+صغيرة',                    source: 'هسبريس',   type: 'article', lang: 'ar' },
    ],
    'التقني المتخصص في تدبير المقاولة': [
        { title: 'إدارة المشاريع – يوتيوب',              url: 'https://www.youtube.com/results?search_query=تدبير+المقاولة+تكويني',  source: 'YouTube', type: 'video',  lang: 'ar' },
        { title: 'Comptabilité de Gestion – YouTube',    url: 'https://www.youtube.com/results?search_query=comptabilité+de+gestion', source: 'YouTube', type: 'video', lang: 'fr' },
        { title: 'دورة المحاسبة – إدراك',               url: 'https://www.edraak.org/search/?q=المحاسبة',                          source: 'إدراك',    type: 'course',  lang: 'ar' },
    ],
    'الإدارة الفندقية': [
        { title: 'تعلم الإدارة الفندقية – يوتيوب',      url: 'https://www.youtube.com/results?search_query=hotel+management+arabic', source: 'YouTube', type: 'video',  lang: 'ar' },
        { title: 'Hôtellerie et Restauration – OpenClassrooms', url: 'https://openclassrooms.com/fr/search?q=h%C3%B4tellerie', source: 'OpenClassrooms', type: 'course', lang: 'fr' },
        { title: 'دورة السياحة والفندقة – Coursera',    url: 'https://www.coursera.org/search?query=hotel+management',             source: 'Coursera', type: 'course', lang: 'fr' },
    ],
    'المساعد الإداري': [
        { title: 'مهارات السكرتارية التنفيذية – يوتيوب', url: 'https://www.youtube.com/results?search_query=السكرتارية+التنفيذية',  source: 'YouTube', type: 'video',  lang: 'ar' },
        { title: 'Assistant Administratif – YouTube',    url: 'https://www.youtube.com/results?search_query=assistant+administratif+formation', source: 'YouTube', type: 'video', lang: 'fr' },
        { title: 'Word & Excel للإداريين – إدراك',      url: 'https://www.edraak.org/search/?q=اكسل',                              source: 'إدراك',    type: 'course',  lang: 'ar' },
    ],
    'كهرباء الإنشاءات': [
        { title: 'الكهرباء المنزلية للمبتدئين – يوتيوب', url: 'https://www.youtube.com/results?search_query=الكهرباء+المنزلية+تعليم', source: 'YouTube', type: 'video', lang: 'ar' },
        { title: 'Électricité du Bâtiment – YouTube',   url: 'https://www.youtube.com/results?search_query=electricite+batiment+cours', source: 'YouTube', type: 'video', lang: 'fr' },
        { title: 'دورة الكهرباء المنزلية',              url: 'https://www.edx.org/search?q=electrical+engineering',                source: 'edX',      type: 'course',  lang: 'fr' },
    ],
    'المطعمة': [
        { title: 'فنون الطبخ المهني – يوتيوب',          url: 'https://www.youtube.com/results?search_query=الطبخ+المهني+المطبخ',   source: 'YouTube', type: 'video',   lang: 'ar' },
        { title: 'Cuisine Professionnelle – YouTube',    url: 'https://www.youtube.com/results?search_query=cuisine+professionnelle+formation', source: 'YouTube', type: 'video', lang: 'fr' },
        { title: 'Restauration – OpenClassrooms',        url: 'https://openclassrooms.com/fr/search?q=restauration',               source: 'OpenClassrooms', type: 'course', lang: 'fr' },
    ],
    'الخياطة': [
        { title: 'تعلم الخياطة من الصفر – يوتيوب',     url: 'https://www.youtube.com/results?search_query=تعليم+الخياطة',         source: 'YouTube', type: 'video',   lang: 'ar' },
        { title: 'Couture – YouTube',                    url: 'https://www.youtube.com/results?search_query=cours+couture+débutant', source: 'YouTube', type: 'video',  lang: 'fr' },
    ],
    'إصلاح المركبات السيارة': [
        { title: 'ميكانيكا السيارات – يوتيوب',          url: 'https://www.youtube.com/results?search_query=ميكانيكا+السيارات+تعليمي', source: 'YouTube', type: 'video', lang: 'ar' },
        { title: 'Mécanique Auto – YouTube',             url: 'https://www.youtube.com/results?search_query=mecanique+automobile+cours', source: 'YouTube', type: 'video', lang: 'fr' },
        { title: 'Car Repair – edX',                     url: 'https://www.edx.org/search?q=automotive',                           source: 'edX',      type: 'course',  lang: 'fr' },
    ],
    'النجارة': [
        { title: 'تعلم النجارة – يوتيوب',               url: 'https://www.youtube.com/results?search_query=تعليم+النجارة',         source: 'YouTube', type: 'video',   lang: 'ar' },
        { title: 'Menuiserie – YouTube',                 url: 'https://www.youtube.com/results?search_query=cours+menuiserie',      source: 'YouTube', type: 'video',   lang: 'fr' },
    ],
    // ── موضوع عام (نصوص) ─────────────────────────────────────
    'المقاولات الصغرى والمتوسطة': [
        { title: 'PME au Maroc – اقتصاد المغرب',        url: 'https://www.youtube.com/results?search_query=PME+Maroc+formation',   source: 'YouTube', type: 'video',   lang: 'fr' },
        { title: 'دور المقاولات الصغيرة – مقالة',       url: 'https://www.hespress.com/?s=مقاولات+صغيرة+متوسطة',                  source: 'هسبريس',   type: 'article', lang: 'ar' },
        { title: 'اقتصاد المقاولة – إدراك',             url: 'https://www.edraak.org/search/?q=اقتصاد',                            source: 'إدراك',    type: 'course',  lang: 'ar' },
    ],
    // ── عام (fallback) ────────────────────────────────────────
    '__general__': [
        { title: 'إدراك – التعلم بالعربية',             url: 'https://www.edraak.org/',                                            source: 'إدراك',    type: 'course',  lang: 'ar' },
        { title: 'خان أكاديمي بالعربية',                 url: 'https://ar.khanacademy.org/',                                        source: 'Khan Academy', type: 'course', lang: 'ar' },
        { title: 'OpenClassrooms – Formation pro',       url: 'https://openclassrooms.com/fr/',                                     source: 'OpenClassrooms', type: 'course', lang: 'fr' },
        { title: 'Coursera – Free Courses',              url: 'https://www.coursera.org/',                                          source: 'Coursera', type: 'course',  lang: 'fr' },
        { title: 'edX – University Courses',             url: 'https://www.edx.org/',                                               source: 'edX',      type: 'course',  lang: 'fr' },
        { title: 'YouTube التعليمي',                    url: 'https://www.youtube.com/results?search_query=تعليم+عربي',            source: 'YouTube',  type: 'video',   lang: 'ar' },
    ],
};

// Build dropdown options from platform data
const buildFilterOptions = (
    texts: TextData[],
    skills: Skill[],
    specializations: Specialization[]
) => {
    const options: { value: string; label: string; group: string }[] = [
        { value: '__general__', label: 'مصادر عامة', group: 'عام' },
    ];

    specializations.forEach(s => {
        options.push({ value: s.name.ar, label: s.name.ar, group: 'التخصصات' });
    });

    skills.forEach(sk => {
        options.push({ value: sk.title.ar, label: sk.title.ar, group: 'المهارات الناعمة' });
    });

    const textTopics = new Set<string>();
    texts.forEach(txt => {
        const topic = txt.title.ar;
        if (!textTopics.has(topic)) {
            textTopics.add(topic);
            options.push({ value: topic, label: topic, group: 'موضوعات النصوص' });
        }
    });

    return options;
};

const getLinks = (key: string): EducationalLink[] => {
    // Try exact match first
    if (LINK_DB[key]) return LINK_DB[key];
    // Partial match on topic words
    const found = Object.entries(LINK_DB).find(([k]) =>
        k !== '__general__' && (key.includes(k) || k.includes(key))
    );
    if (found) return found[1];
    // Fallback to general
    return LINK_DB['__general__'];
};

// ───────────────────────────────────────────────────────────────
// Component
// ───────────────────────────────────────────────────────────────
const ResourcesSection: React.FC<ResourcesSectionProps> = ({ resources, texts, skills, specializations }) => {
    const { t, locale } = useI18n();
    const [selectedTopic, setSelectedTopic] = useState('__general__');

    const filterOptions = useMemo(
        () => buildFilterOptions(texts, skills, specializations),
        [texts, skills, specializations]
    );

    const smartLinks = useMemo(() => getLinks(selectedTopic), [selectedTopic]);

    // Group options by group label
    const groups = useMemo(() => {
        const map = new Map<string, typeof filterOptions>();
        filterOptions.forEach(opt => {
            if (!map.has(opt.group)) map.set(opt.group, []);
            map.get(opt.group)!.push(opt);
        });
        return map;
    }, [filterOptions]);

    const selectedLabel = filterOptions.find(o => o.value === selectedTopic)?.label || 'مصادر عامة';

    return (
        <div dir="rtl" className="space-y-6">
            {/* Header */}
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                {t('resources.title')}
            </h2>

            {/* Filter Card */}
            <Card className="p-5">
                <label htmlFor="topic-select" className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    🎯 اختر موضوعاً أو تخصصاً لعرض الروابط التعليمية المناسبة:
                </label>
                <div className="relative">
                    <select
                        id="topic-select"
                        value={selectedTopic}
                        onChange={e => setSelectedTopic(e.target.value)}
                        className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-4 py-3 pr-10 text-base font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition cursor-pointer"
                        aria-label="اختيار موضوع"
                    >
                        {Array.from(groups.entries()).map(([groupName, opts]) => (
                            <optgroup key={groupName} label={`── ${groupName} ──`}>
                                {opts.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-slate-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </Card>

            {/* Smart Links */}
            <Card className="p-6">
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            روابط تعليمية: <span className="text-primary-600 dark:text-primary-400">{selectedLabel}</span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            انقر على الرابط لفتح الموقع التعليمي في متصفحك
                        </p>
                    </div>
                    <span className="text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full font-semibold">
                        {smartLinks.length} روابط
                    </span>
                </div>

                <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                    {smartLinks.map((link, idx) => {
                        const meta = TYPE_META[link.type];
                        return (
                            <li key={idx} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group">
                                <div className="flex items-start gap-3 min-w-0">
                                    <span className="text-2xl mt-0.5 flex-shrink-0">{meta.icon}</span>
                                    <div className="min-w-0">
                                        <p className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition truncate">
                                            {link.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className={`text-xs py-0.5 px-2 rounded-full font-medium ${meta.color}`}>
                                                {meta.label}
                                            </span>
                                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                                📌 {link.source}
                                            </span>
                                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                                {link.lang === 'ar' ? '🇲🇦 عربي' : link.lang === 'fr' ? '🇫🇷 فرنسي' : '🌐 ثنائي'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    id={`resource-link-${idx}`}
                                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border border-primary-300 dark:border-primary-700 text-sm font-semibold rounded-lg text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                                    onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                                >
                                    <LinkIcon className="h-4 w-4" />
                                    زيارة الموقع
                                </a>
                            </li>
                        );
                    })}
                </ul>
            </Card>

            {/* Admin-added resources (from DB) */}
            {resources.length > 0 && (
                <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            {t('resources.suggested')}
                        </h3>
                        <p className="text-sm text-primary-500 font-bold">{t('resources.weekly')}</p>
                    </div>
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {resources.map((resource) => (
                            <li key={resource.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div>
                                    <p className="text-lg font-medium text-slate-900 dark:text-white">{resource.title[locale]}</p>
                                    <span className="text-sm py-0.5 px-2 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                                        {resource.type[locale]}
                                    </span>
                                </div>
                                <a
                                    href={resource.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-primary-600 bg-primary-100 dark:bg-slate-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-slate-600 transition"
                                >
                                    <LinkIcon className="h-4 w-4" />
                                    {t('resources.visit')}
                                </a>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}
        </div>
    );
};

export default ResourcesSection;