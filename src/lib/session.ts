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
 * Adaptacyjne wyliczanie ile nowych słów można dodać dzisiaj:
 * - Jeśli użytkownik ma dużo nieopanowanych słów (>= 8), nie dodajemy nowych słów wcale.
 * - Jeśli ma 5-7 nieopanowanych słów, dodajemy maksymalnie 1 nowe słowo.
 * - Jeśli ma 3-4 nieopanowane słowa, dodajemy maksymalnie 2 nowe słowa.
 * - Jeśli ma poniżej 3 nieopanowanych słów, dodajemy pełny ustalony limit.
 */
export function calculateAdaptiveNewWordsLimit(
  progressMap: Record<string, UserWordProgress>,
  userConfiguredLimit: number
): number {
  const unmastered = getUnmasteredWordsCount(progressMap);

  if (unmastered >= 8) {
    return 0;
  } else if (unmastered >= 5) {
    return Math.min(1, userConfiguredLimit);
  } else if (unmastered >= 3) {
    return Math.min(2, userConfiguredLimit);
  } else {
    return userConfiguredLimit;
  }
}

/**
 * Pobiera adaptacyjną paczkę nowych słów do nauki z losowej puli niepoznanych słówek
 */
export function getNewWordsToLearn(
  progressMap: Record<string, UserWordProgress>,
  allWords: DictionaryWord[],
  userConfiguredLimit: number
): DictionaryWord[] {
  const effectiveLimit = calculateAdaptiveNewWordsLimit(progressMap, userConfiguredLimit);
  if (effectiveLimit <= 0) return [];

  const unstartedWords = allWords.filter((word) => !progressMap[word.id]);
  // Losujemy kolejność niepoznanych słówek, aby każda lekcja była zaskakująca
  const shuffled = [...unstartedWords].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, effectiveLimit);
}

/**
 * Generuje błędne opcje (dystraktory) dla quizu
 */
export function generateQuizOptions(
  correctWord: DictionaryWord,
  allWords: DictionaryWord[]
): string[] {
  let distractors: string[] = [];

  if (correctWord.distractors && correctWord.distractors.length >= 3) {
    distractors = [...correctWord.distractors].sort(() => 0.5 - Math.random()).slice(0, 3);
  } else {
    const otherWords = allWords.filter((w) => w.id !== correctWord.id);
    const shuffled = [...otherWords].sort(() => 0.5 - Math.random());
    distractors = shuffled.slice(0, 3).map((w) => w.shortDefinition);
  }

  const allOptions = [correctWord.shortDefinition, ...distractors];
  return allOptions.sort(() => 0.5 - Math.random());
}

/**
 * Tworzy sesję dzienną obejmującą adaptacyjne nowe słówka oraz powtórki SM-2
 */
export function createDailySession(
  progressMap: Record<string, UserWordProgress>,
  settings: UserSettings,
  allWords: DictionaryWord[]
): { cards: SessionCard[]; adaptiveLimit: number; unmasteredCount: number } {
  const dueReviews = getDueReviewWords(progressMap, allWords);
  const adaptiveLimit = calculateAdaptiveNewWordsLimit(progressMap, settings.dailyNewWordsLimit);
  const newWords = getNewWordsToLearn(progressMap, allWords, settings.dailyNewWordsLimit);
  const unmasteredCount = getUnmasteredWordsCount(progressMap);

  const reviewCards: SessionCard[] = dueReviews.map((word) => ({
    word,
    isNew: false,
    userProgress: progressMap[word.id],
    options: generateQuizOptions(word, allWords)
  }));

  const newCards: SessionCard[] = newWords.map((word) => ({
    word,
    isNew: true,
    userProgress: progressMap[word.id],
    options: generateQuizOptions(word, allWords)
  }));

  // Łączymy nowe karty i powtórki w wymieszaną losową kolejność
  let cards = [...newCards, ...reviewCards].sort(() => 0.5 - Math.random());

  if (cards.length === 0 && unmasteredCount > 0) {
    const unmasteredWords = allWords.filter((w) => progressMap[w.id] && progressMap[w.id].repetitions < 3);
    const shuffledUnmastered = [...unmasteredWords].sort(() => 0.5 - Math.random());
    const trainingCards: SessionCard[] = shuffledUnmastered.slice(0, 5).map((word) => ({
      word,
      isNew: false,
      userProgress: progressMap[word.id],
      options: generateQuizOptions(word, allWords)
    }));
    cards = trainingCards;
  }

  return {
    cards,
    adaptiveLimit,
    unmasteredCount
  };
}
