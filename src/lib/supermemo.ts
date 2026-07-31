import type { UserWordProgress, ReviewGrade } from './types';

/**
 * Zwraca dzisiejszą datę w formacie YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Dodaje określoną liczbę dni do podanej daty
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Przelicza stan powtórzenia słówka zgodnie z algorytmem SuperMemo SM-2.
 * @param grade Ocena zapamiętania: 0 (Ponów), 3 (Trudne), 4 (Średnie), 5 (Łatwe)
 * @param currentProgress Dotychczasowy postęp lub undefined jeśli to nowo poznane słowo
 */
export function calculateSM2(
  wordId: string,
  grade: ReviewGrade,
  currentProgress?: UserWordProgress
): UserWordProgress {
  const today = getTodayDateString();
  const historyItem = { date: today, grade };

  // Domyślne wartości początkowe dla nowego słówka
  let repetitions = currentProgress?.repetitions ?? 0;
  let easeFactor = currentProgress?.easeFactor ?? 2.5;
  let interval = currentProgress?.interval ?? 1;
  const history = currentProgress?.history ? [...currentProgress.history, historyItem] : [historyItem];

  if (grade < 3) {
    // Niepoprawna odpowiedź lub ocena "Ponów"
    repetitions = 0;
    interval = 1;
  } else {
    // Poprawna odpowiedź: przeliczenie wskaźnika łatwości EF
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
 * Sprawdza czy słówko wymaga dzisiaj powtórki
 */
export function isWordDueToday(progress: UserWordProgress, todayStr: string = getTodayDateString()): boolean {
  return progress.nextReviewDate <= todayStr;
}
