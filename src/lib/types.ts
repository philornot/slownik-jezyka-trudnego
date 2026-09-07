/**
 * Broad part of the day the user prefers to receive their daily study
 * reminder. The exact minute the notification fires is randomised within the
 * slot's window on each day, so the reminder doesn't arrive at a predictable,
 * easy-to-ignore time - identical behaviour to the Android app.
 */
export type NotificationTimeSlot = 'morning' | 'daytime' | 'evening';

/** Meta-data for each time slot - used both in the UI picker and scheduler. */
export const NOTIFICATION_TIME_SLOTS: Record<
  NotificationTimeSlot,
  { label: string; startHour: number; endHour: number }
> = {
  morning:  { label: 'Rano',          startHour: 7,  endHour: 11 },
  daytime:  { label: 'W ciągu dnia',  startHour: 11, endHour: 17 },
  evening:  { label: 'Wieczorem',     startHour: 17, endHour: 21 },
};

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
  /** Part of the day in which the reminder fires at a random time. */
  notificationTimeSlot: NotificationTimeSlot;
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

