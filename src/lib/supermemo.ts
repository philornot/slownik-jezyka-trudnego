import type { UserWordProgress, ReviewGrade } from './types';

/**
 * Returns today's date in local timezone as a string formatted as YYYY-MM-DD.
 *
 * @returns Today's date string.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds or subtracts a specified number of days to/from a given date string (YYYY-MM-DD).
 * Operates strictly in the local timezone.
 *
 * @param dateStr - Base date string in YYYY-MM-DD format.
 * @param days - Number of days to add (or subtract if negative).
 * @returns Resulting date string in YYYY-MM-DD format.
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates the current study streak in consecutive days based on review history.
 * Uses local timezone date formatting consistent with getTodayDateString and addDaysToDate.
 *
 * @param map - Record mapping word IDs to user word progress.
 * @returns Number of consecutive days in streak.
 */
export function calculateStreak(map: Record<string, UserWordProgress>): number {
  const dates = new Set<string>();
  for (const prog of Object.values(map)) {
    if (prog.history) {
      for (const h of prog.history) {
        if (h.date) dates.add(h.date);
      }
    }
  }
  if (dates.size === 0) return 0;

  const today = getTodayDateString();
  let count = 0;
  let currStr = today;

  while (true) {
    if (dates.has(currStr)) {
      count++;
      currStr = addDaysToDate(currStr, -1);
    } else {
      if (count === 0) {
        const yesterdayStr = addDaysToDate(today, -1);
        if (dates.has(yesterdayStr)) {
          count++;
          currStr = addDaysToDate(yesterdayStr, -1);
          continue;
        }
      }
      break;
    }
  }
  return count;
}

/**
 * Calculates updated SuperMemo SM-2 parameters for a word based on review grade.
 *
 * @param wordId - Unique identifier of the word.
 * @param grade - User evaluation grade (0, 3, 4, 5).
 * @param currentProgress - Existing progress data or undefined for new word.
 * @returns Updated UserWordProgress object.
 */
export function calculateSM2(
  wordId: string,
  grade: ReviewGrade,
  currentProgress?: UserWordProgress
): UserWordProgress {
  const today = getTodayDateString();
  const historyItem = { date: today, grade };

  let repetitions = currentProgress?.repetitions ?? 0;
  let easeFactor = currentProgress?.easeFactor ?? 2.5;
  let interval = currentProgress?.interval ?? 1;
  const history = currentProgress?.history ? [...currentProgress.history, historyItem] : [historyItem];

  if (grade < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    if (easeFactor < 1.3) {
      easeFactor = 1.3;
    }

    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  const nextReviewDate = addDaysToDate(today, interval);

  return {
    wordId,
    repetitions,
    easeFactor: Number(easeFactor.toFixed(2)),
    interval,
    nextReviewDate,
    lastReviewedAt: new Date().toISOString(),
    history
  };
}

/**
 * Checks if a word is due for review today.
 *
 * @param progress - User progress object for the word.
 * @param todayStr - Optional date string to compare against (defaults to today).
 * @returns True if the word is due for review.
 */
export function isWordDueToday(progress: UserWordProgress, todayStr: string = getTodayDateString()): boolean {
  return progress.nextReviewDate <= todayStr;
}
