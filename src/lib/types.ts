export interface DictionaryWord {
  id: string;
  word: string;
  phonetic?: string;
  shortDefinition: string;
  fullDefinition: string;
  etymology?: string;
  examples: string[];
  category: string;
  sjpUrl: string;
  distractors: string[];
}

export interface UserWordProgress {
  wordId: string;
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReviewDate: string; // Format YYYY-MM-DD
  lastReviewedAt: string; // ISO string
  history: Array<{
    date: string;
    grade: number; // 0, 3, 4, 5
  }>;
}

export type TextSizeLevel = 'small' | 'medium' | 'large';

export interface UserSettings {
  preferredNotificationHour: number; // np. 9 dla 09:00
  notificationsEnabled: boolean;
  dailyNewWordsLimit: number; // np. 5
  // Accessibility
  highContrast: boolean;
  reducedMotion: boolean;
  textSize: TextSizeLevel;
  largerText?: boolean; // legacy compatibility
}

export type ReviewGrade = 0 | 3 | 4 | 5;

export interface SessionCard {
  word: DictionaryWord;
  isNew: boolean;
  userProgress?: UserWordProgress;
  options: string[]; // 4 warianty odpowiedzi do quizu
}

export interface DeviceSession {
  id: string;
  name: string;
  lastActive: string; // ISO String
  createdAt: string; // ISO String
  isCurrent?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  username: string | null; // Nullable if not explicitly set (defaults to email display)
  devices?: Record<string, DeviceSession>;
  sessionRevokedAt?: string | null;
  updatedAt?: string;
}

