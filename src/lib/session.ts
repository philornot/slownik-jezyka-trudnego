import type { DictionaryWord, UserWordProgress, SessionCard, UserSettings } from './types';
import { isWordDueToday, getTodayDateString } from './supermemo';

/**
 * Returns words that are due for review today.
 *
 * @param progressMap - Current progress for all words.
 * @param allWords - Full dictionary.
 * @returns Array of words due for review.
 */
export function getDueReviewWords(
  progressMap: Record<string, UserWordProgress>,
  allWords: DictionaryWord[]
): DictionaryWord[] {
  const today = getTodayDateString();
  return allWords.filter((word) => {
    const progress = progressMap[word.id];
    return progress && isWordDueToday(progress, today);
  });
}

/**
 * Returns the count of words in progress that are not yet fully mastered (repetitions < 3).
 *
 * @param progressMap - Current progress for all words.
 * @returns Count of unmastered words.
 */
export function getUnmasteredWordsCount(progressMap: Record<string, UserWordProgress>): number {
  return Object.values(progressMap).filter((p) => p.repetitions < 3).length;
}

/**
 * Returns the count of words started before today that are not yet fully mastered.
 *
 * @param progressMap - Current progress for all words.
 * @param todayStr - Today's date string (YYYY-MM-DD).
 * @returns Count of unmastered words from previous days.
 */
export function getUnmasteredWordsFromPreviousDaysCount(
  progressMap: Record<string, UserWordProgress>,
  todayStr: string = getTodayDateString()
): number {
  return Object.values(progressMap).filter((p) => {
    if (p.repetitions >= 3) return false;
    const firstDate = p.history && p.history.length > 0 ? p.history[0].date : null;
    return !firstDate || firstDate < todayStr;
  }).length;
}

/**
 * Returns the count of words reviewed today.
 *
 * @param progressMap - Current progress for all words.
 * @param todayStr - Today's date string (YYYY-MM-DD).
 * @returns Count of words reviewed today.
 */
export function getWordsReviewedTodayCount(
  progressMap: Record<string, UserWordProgress>,
  todayStr: string = getTodayDateString()
): number {
  return Object.values(progressMap).filter((p) => {
    return (
      (p.history && p.history.some((h) => h.date === todayStr)) ||
      (p.lastReviewedAt && p.lastReviewedAt.startsWith(todayStr))
    );
  }).length;
}

/**
 * Returns the count of new words started today.
 *
 * @param progressMap - Current progress for all words.
 * @param todayStr - Today's date string (YYYY-MM-DD).
 * @returns Count of words started today.
 */
export function getWordsStartedTodayCount(
  progressMap: Record<string, UserWordProgress>,
  todayStr: string = getTodayDateString()
): number {
  return Object.values(progressMap).filter((p) => {
    const firstDate = p.history && p.history.length > 0 ? p.history[0].date : null;
    return firstDate === todayStr;
  }).length;
}

/**
 * Calculates the adaptive new-words limit for today.
 *
 * Respects the user-configured daily limit from Settings. The only throttle
 * kicks in when there is a genuine backlog of overdue reviews (> 20 due words),
 * halving the new-words budget so the user catches up before drowning in more
 * new material.
 *
 * @param progressMap - Current progress for all words.
 * @param userConfiguredLimit - Daily new-words cap from user settings.
 * @param dueWordsCount - Number of words due for review today.
 * @param todayStr - Today's date string (YYYY-MM-DD).
 * @returns Number of new words to include in today's session.
 */
export function calculateAdaptiveNewWordsLimit(
  progressMap: Record<string, UserWordProgress>,
  userConfiguredLimit: number,
  dueWordsCount: number = 0,
  todayStr: string = getTodayDateString()
): number {
  const startedToday = getWordsStartedTodayCount(progressMap, todayStr);
  let maxRemaining = Math.max(0, userConfiguredLimit - startedToday);

  if (maxRemaining <= 0) {
    return 0;
  }

  // Only throttle when there is a genuine review backlog
  if (dueWordsCount > 20) {
    maxRemaining = Math.max(1, Math.floor(maxRemaining / 2));
  }

  return maxRemaining;
}

/**
 * Simple seeded pseudo-random number generator (Mulberry32).
 * Ensures deterministic word and distractor shuffling for a given day.
 *
 * @param seedString - Seed string for the PRNG.
 * @returns A function that returns a pseudo-random number in [0, 1).
 */
export function createSeededRandom(seedString: string): () => number {
  let h = 2166136261 ^ seedString.length;
  for (let i = 0; i < seedString.length; i++) {
    h = Math.imul(h ^ seedString.charCodeAt(i), 16777619);
  }
  let a = h >>> 0;
  return function random(): number {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shuffles an array using a given random number generator.
 *
 * @param array - Array to shuffle.
 * @param randomFn - Random number generator function.
 * @returns A new shuffled array.
 */
export function shuffleArray<T>(array: T[], randomFn: () => number = Math.random): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Gets an adaptive batch of new words to learn from a deterministically shuffled pool.
 *
 * @param progressMap - Current progress for all words.
 * @param allWords - Full dictionary.
 * @param userConfiguredLimit - Daily new-words cap from user settings.
 * @param randomFn - Random number generator function.
 * @param todayStr - Today's date string (YYYY-MM-DD).
 * @param dueWordsCount - Number of words due for review today.
 * @returns Array of new words to learn.
 */
export function getNewWordsToLearn(
  progressMap: Record<string, UserWordProgress>,
  allWords: DictionaryWord[],
  userConfiguredLimit: number,
  randomFn: () => number = Math.random,
  todayStr: string = getTodayDateString(),
  dueWordsCount: number = 0
): DictionaryWord[] {
  const effectiveLimit = calculateAdaptiveNewWordsLimit(
    progressMap,
    userConfiguredLimit,
    dueWordsCount,
    todayStr
  );
  if (effectiveLimit <= 0) return [];

  const unstartedWords = allWords.filter((word) => !progressMap[word.id]);
  const shuffled = shuffleArray(unstartedWords, randomFn);
  return shuffled.slice(0, effectiveLimit);
}

/**
 * Generates wrong answer options (distractors) for a quiz card.
 *
 * @param correctWord - The correct word for the quiz.
 * @param allWords - Full dictionary.
 * @param randomFn - Random number generator function.
 * @returns Array of 4 answer options (1 correct + 3 distractors), shuffled.
 */
export function generateQuizOptions(
  correctWord: DictionaryWord,
  allWords: DictionaryWord[],
  randomFn: () => number = Math.random
): string[] {
  let distractors: string[] = [];

  if (correctWord.distractors && correctWord.distractors.length >= 3) {
    distractors = shuffleArray(correctWord.distractors, randomFn).slice(0, 3);
  } else {
    const otherWords = allWords.filter((w) => w.id !== correctWord.id);
    const shuffled = shuffleArray(otherWords, randomFn);
    distractors = shuffled.slice(0, 3).map((w) => w.shortDefinition);
  }

  const allOptions = [correctWord.shortDefinition, ...distractors];
  return shuffleArray(allOptions, randomFn);
}

/**
 * Creates the daily session including adaptive new words and SM-2 reviews.
 *
 * @param progressMap - Current progress for all words.
 * @param settings - User settings including daily new words limit.
 * @param allWords - Full dictionary.
 * @param customSeed - Optional custom seed for deterministic shuffling.
 * @returns Session cards, adaptive limit, and unmastered count.
 */
export function createDailySession(
  progressMap: Record<string, UserWordProgress>,
  settings: UserSettings,
  allWords: DictionaryWord[],
  customSeed?: string
): { cards: SessionCard[]; adaptiveLimit: number; unmasteredCount: number } {
  const seed = customSeed || getTodayDateString();
  const randomFn = createSeededRandom(seed);
  const today = getTodayDateString();

  const dueReviews = getDueReviewWords(progressMap, allWords);
  const adaptiveLimit = calculateAdaptiveNewWordsLimit(
    progressMap,
    settings.dailyNewWordsLimit,
    dueReviews.length,
    today
  );
  const newWords = getNewWordsToLearn(
    progressMap,
    allWords,
    settings.dailyNewWordsLimit,
    randomFn,
    today,
    dueReviews.length
  );
  const unmasteredCount = getUnmasteredWordsCount(progressMap);

  const reviewCards: SessionCard[] = dueReviews.map((word) => ({
    word,
    isNew: false,
    userProgress: progressMap[word.id],
    options: generateQuizOptions(word, allWords, randomFn)
  }));

  const newCards: SessionCard[] = newWords.map((word) => ({
    word,
    isNew: true,
    userProgress: progressMap[word.id],
    options: generateQuizOptions(word, allWords, randomFn)
  }));

  // Combine new cards and reviews in a deterministically shuffled order for the day
  let cards = shuffleArray([...newCards, ...reviewCards], randomFn);

  if (cards.length === 0) {
    const reviewedToday = getWordsReviewedTodayCount(progressMap, today);
    if (reviewedToday > 0) {
      return {
        cards: [],
        adaptiveLimit,
        unmasteredCount
      };
    }

    if (unmasteredCount > 0) {
      const unmasteredWords = allWords.filter((w) => progressMap[w.id] && progressMap[w.id].repetitions < 3);
      const shuffledUnmastered = shuffleArray(unmasteredWords, randomFn);
      const trainingCards: SessionCard[] = shuffledUnmastered.slice(0, 5).map((word) => ({
        word,
        isNew: false,
        userProgress: progressMap[word.id],
        options: generateQuizOptions(word, allWords, randomFn)
      }));
      cards = trainingCards;
    }
  }

  return {
    cards,
    adaptiveLimit,
    unmasteredCount
  };
}

/**
 * Creates an on-demand session of additional new words from the dictionary.
 *
 * @param progressMap - Current progress for all words.
 * @param allWords - Full dictionary.
 * @param count - Number of new words to include.
 * @returns Session cards for new words (showcase + quiz), or empty if none available.
 */
export function createExtraNewWordsSession(
  progressMap: Record<string, UserWordProgress>,
  allWords: DictionaryWord[],
  count: number
): SessionCard[] {
  const unstartedWords = allWords.filter((word) => !progressMap[word.id]);
  if (unstartedWords.length === 0) return [];

  const randomFn = createSeededRandom(`extra_${getTodayDateString()}_${Date.now()}`);
  const shuffled = shuffleArray(unstartedWords, randomFn);
  const selected = shuffled.slice(0, Math.min(count, unstartedWords.length));

  return selected.map((word) => ({
    word,
    isNew: true,
    userProgress: undefined,
    options: generateQuizOptions(word, allWords, randomFn)
  }));
}

/**
 * Creates an on-demand practice session with the hardest words.
 *
 * Selects words the user has started but finds most difficult, sorted by
 * ascending easeFactor (hardest first), then lowest recent grade.
 *
 * @param progressMap - Current progress for all words.
 * @param allWords - Full dictionary.
 * @param count - Number of words to include.
 * @returns Session cards for practice, or empty if none available.
 */
export function createHardWordsPracticeSession(
  progressMap: Record<string, UserWordProgress>,
  allWords: DictionaryWord[],
  count: number
): SessionCard[] {
  const startedWords = allWords.filter((word) => progressMap[word.id]);
  if (startedWords.length === 0) return [];

  // Sort by easeFactor ascending, then by last grade ascending (hardest first)
  const sorted = [...startedWords].sort((a, b) => {
    const pa = progressMap[a.id];
    const pb = progressMap[b.id];
    const efDiff = pa.easeFactor - pb.easeFactor;
    if (efDiff !== 0) return efDiff;

    const lastGradeA = pa.history?.length ? pa.history[pa.history.length - 1].grade : 5;
    const lastGradeB = pb.history?.length ? pb.history[pb.history.length - 1].grade : 5;
    return lastGradeA - lastGradeB;
  });

  const selected = sorted.slice(0, Math.min(count, sorted.length));
  const randomFn = createSeededRandom(`practice_${getTodayDateString()}_${Date.now()}`);

  return selected.map((word) => ({
    word,
    isNew: false,
    userProgress: progressMap[word.id],
    options: generateQuizOptions(word, allWords, randomFn)
  }));
}

/**
 * Checks if there are unstarted words available in the dictionary.
 *
 * @param progressMap - Current progress for all words.
 * @param allWords - Full dictionary.
 * @returns True if at least one word has not been started yet.
 */
export function hasUnstartedWords(
  progressMap: Record<string, UserWordProgress>,
  allWords: DictionaryWord[]
): boolean {
  return allWords.some((word) => !progressMap[word.id]);
}

/**
 * Checks if there are started words available for practice.
 *
 * @param progressMap - Current progress for all words.
 * @returns True if at least one word has been started.
 */
export function hasWordsToPractice(
  progressMap: Record<string, UserWordProgress>
): boolean {
  return Object.keys(progressMap).length > 0;
}

export const COMPLETION_MESSAGES: Array<{ title: string; description: string }> = [
  {
    title: 'Plan na dziś wykonany',
    description: 'Dzisiejsza porcja materiału została zaliczona. Powtórki będą dostępne jutro.'
  },
  {
    title: 'Lekcja zakończona',
    description: 'Słówka z dzisiejszej sesji zostały przetworzone. Nowy zestaw powtórek pojawi się jutro.'
  },
  {
    title: 'Dzienna sesja zaliczona',
    description: 'Materiał na dziś został przerobiony. Algorytm wyznaczy kolejne powtórki na jutro.'
  },
  {
    title: 'Cel dzienny osiągnięty',
    description: 'Wykonałeś zaplanowane powtórki. Odpoczynek sprzyja utrwalaniu wiedzy w pamięci.'
  },
  {
    title: 'Powtórki ukończone',
    description: 'Przerobiłeś wszystkie zaplanowane słówka. Kolejne zadania pojawią się jutro.'
  },
  {
    title: 'Kolejny dzień zaliczony',
    description: 'Regularna nauka w krótkich porcjach przynosi optymalne efekty w zapamiętywaniu.'
  },
  {
    title: 'Sesja ukończona',
    description: 'Przejrzałeś wyznaczone hasła. Wszystkie postępy zostały zapisane.'
  },
  {
    title: 'Moduł na dziś zamknięty',
    description: 'Wszystkie zaplanowane na ten dzień ćwiczenia zostały wykonane.'
  }
];

/**
 * Returns a deterministic completion message for a given date string.
 *
 * @param dateStr - Date string YYYY-MM-DD (defaults to today).
 * @returns Title and description pair for the completion screen.
 */
export function getDailyCompletionMessage(dateStr: string = getTodayDateString()): {
  title: string;
  description: string;
} {
  const randomFn = createSeededRandom(`completion_${dateStr}`);
  const index = Math.floor(randomFn() * COMPLETION_MESSAGES.length);
  return COMPLETION_MESSAGES[index];
}