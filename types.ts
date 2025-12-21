
import React from 'react';

export type MultilingualString = {
    ar: string;
    fr: string;
};

export interface User {
    displayName: string;
    email: string;
    photoURL: string;
    mustChangePassword?: boolean;
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
}

export interface Skill {
    id: number;
    title: MultilingualString;
    description: MultilingualString;
    iconName: string;
}

export interface Specialization {
    id: string;
    name: MultilingualString;
    traineeCount?: number;
}

export type QuestionType = 'فهم' | 'تحليل' | 'مناقشة' | 'مفاهيم' | 'ابداء الرأي';

export interface AnswerOption {
    id: string;
    text: MultilingualString;
}

export interface Question {
    id: string;
    text: MultilingualString;
    type: QuestionType;
    options?: AnswerOption[];
    correctAnswerId?: string;
}

export interface TextData {
    id: string;
    title: MultilingualString;
    specialization: MultilingualString;
    content: MultilingualString;
    questions: Question[];
}

export interface ChatMessage {
    id: number;
    user: string;
    avatar: string;
    text: string;
    timestamp: string;
    hasAudio?: boolean;
}

export interface ChatChannel {
    id: string;
    name: MultilingualString;
    defaultSystemPrompt: MultilingualString;
    systemPrompt: MultilingualString;
    iconName: string;
    model: string;
}

export interface Resource {
    id: string;
    title: MultilingualString;
    type: MultilingualString;
    link: string;
}

export type UserRole = 'متدرب' | 'أستاذ' | 'مدير';

export interface PlatformUser {
    id: number;
    name: string;
    email: string;
    phone: string;
    specialization: string;
    role: UserRole;
    status: 'نشط' | 'غير نشط';
    password?: string;
    mustChangePassword?: boolean;
}

export interface Team {
    id: number;
    name: MultilingualString;
    specialization: MultilingualString;
    members: string[];
    presentation: string | null;
    presentationData?: string | null;
    videoSummaryUrl: string | null;
    presentationTitle: MultilingualString;
    dueDate: string;
    teamLeader: string;
}

export interface TestContext {
    id: string;
    title: MultilingualString;
    content: MultilingualString;
}

export interface ProgressDataPoint {
    month: string;
    completedTexts: number;
    acquiredSkills: number;
    testScores: number;
}

export type Page = 'home' | 'texts' | 'skills' | 'presentations' | 'tests' | 'chat' | 'resources' | 'dashboard' | 'admin';

export interface NavItem {
    id: Page;
    labelKey: string;
    icon: React.ElementType;
    adminOnly: boolean;
}
