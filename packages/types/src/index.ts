export type UserRole =
  | 'SCHOLAR'
  | 'AUTHOR'
  | 'FACULTY'
  | 'INSTITUTION_ADMIN'
  | 'ADMIN'
  | 'SUPER_ADMIN';

export type PaperStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PEER_REVIEWED'
  | 'ACCEPTED'
  | 'REJECTED';

export type ReviewStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  institutionId: string | null;
  plan?: string;
  preferredLanguage?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: UserSession;
  message?: string;
}

export interface PaperSubmissionPayload {
  title: string;
  abstract: string;
  keywords: string[];
}

export interface ReviewPayload {
  paperId: string;
  score: number;
  comments: string;
  recommendations: string;
  status: ReviewStatus;
}

export interface CourseDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  published: boolean;
  modules: CourseModuleDetail[];
  isEnrolled?: boolean;
  progressPercent?: number;
}

export interface CourseModuleDetail {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  lessons: LessonDetail[];
}

export interface LessonDetail {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  orderIndex: number;
  videoUrl: string | null;
  completed?: boolean;
}
