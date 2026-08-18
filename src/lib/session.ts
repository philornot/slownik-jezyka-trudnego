import type { DictionaryWord, UserWordProgress, SessionCard, UserSettings } from './types';
import { isWordDueToday, getTodayDateString } from './supermemo';

/**
 * Zwraca słowa wymagające powtórki na dzisiaj
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
 * Zwraca liczbę słów w trakcie nauki, które nie zostały jeszcze w pełni opanowane (repetitions < 3).
 */
export function getUnmasteredWordsCount(progressMap: Record<string, UserWordProgress>): number {
  return Object.values(progressMap).filter((p) => p.repetitions < 3).length;
}

/**
 * Zwraca liczbę słów rozpoczętych przed dzisiejszym dniem, które nie zostały jeszcze w pełni opanowane.
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
 * Zwraca liczbę nowych słów rozpoczętych dzisiaj.
 */

/**
 * Zwraca liczbę słów powtórzonych dzisiaj.
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
 * Adaptacyjne wyliczanie ile nowych słów można dodać dzisiaj:
 * - Odejmuje słowa już rozpoczęte dzisiaj od dzisiejszego limitu użytkownika.
 * - Jeśli użytkownik ma dużo nieopanowanych słów z poprzednich dni (>= 8), nie dodajemy nowych słów.
 * - Jeśli ma 5-7 nieopanowanych słów z poprzednich dni, dodajemy maksymalnie 1 nowe słowo.
 * - Jeśli ma 3-4 nieopanowane słowa z poprzednich dni, dodajemy maksymalnie 2 nowe słowa.
 * - Jeśli ma poniżej 3 nieopanowanych słów z poprzednich dni, pozwala na pozostały ustalony limit.
 */
export function calculateAdaptiveNewWordsLimit(
  progressMap: Record<string, UserWordProgress>,
  userConfiguredLimit: number,
  todayStr: string = getTodayDateString()
): number {
  const startedToday = getWordsStartedTodayCount(progressMap, todayStr);
  const maxRemaining = Math.max(0, userConfiguredLimit - startedToday);

  if (maxRemaining <= 0) {
    return 0;
  }

  const unmasteredPrev = getUnmasteredWordsFromPreviousDaysCount(progressMap, todayStr);

  if (unmasteredPrev >= 8) {
    return 0;
  } else if (unmasteredPrev >= 5) {
    return Math.min(1, maxRemaining);
  } else if (unmasteredPrev >= 3) {
    return Math.min(2, maxRemaining);
  } else {
    return maxRemaining;
  }
}

/**
 * Prosty generator liczb pseudolosowych z ziarnem (Mulberry32).
 * Zapewnia deterministyczne losowanie słówek i dystraktorów w danym dniu.
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
 * Mieszanie tablicy wg podanego generatora liczb losowych
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
 * Pobiera adaptacyjną paczkę nowych słów do nauki z deterministycznie wymieszanej puli
 */
export function getNewWordsToLearn(
  progressMap: Record<string, UserWordProgress>,
  allWords: DictionaryWord[],
  userConfiguredLimit: number,
  randomFn: () => number = Math.random,
  todayStr: string = getTodayDateString()
): DictionaryWord[] {
  const effectiveLimit = calculateAdaptiveNewWordsLimit(progressMap, userConfiguredLimit, todayStr);
  if (effectiveLimit <= 0) return [];

  const unstartedWords = allWords.filter((word) => !progressMap[word.id]);
  const shuffled = shuffleArray(unstartedWords, randomFn);
  return shuffled.slice(0, effectiveLimit);
}

/**
 * Generuje błędne opcje (dystraktory) dla quizu
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
 * Tworzy sesję dzienną obejmującą adaptacyjne nowe słówka oraz powtórki SM-2
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
  const adaptiveLimit = calculateAdaptiveNewWordsLimit(progressMap, settings.dailyNewWordsLimit, today);
  const newWords = getNewWordsToLearn(progressMap, allWords, settings.dailyNewWordsLimit, randomFn, today);
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

  // Łączymy nowe karty i powtórki w deterministycznie wymieszaną kolejność dla danego dnia
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

