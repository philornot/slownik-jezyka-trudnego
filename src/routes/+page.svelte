<script lang="ts">
  import { onMount } from 'svelte';
  import type { DictionaryWord, UserWordProgress, SessionCard, UserSettings, ReviewGrade } from '$lib/types';
  import { INITIAL_WORDS } from '$lib/data/words';
  import { calculateSM2, getTodayDateString, calculateStreak } from '$lib/supermemo';
  import {
    getLocalProgressMap,
    saveLocalWordProgress,
    saveAllLocalProgress,
    getLocalSettings,
    saveLocalSettings,
    loadProgressFromCloud,
    syncProgressToCloud,
    flushSyncProgressToCloud,
    clearAllProgress,
    saveSettingsToCloud,
    loadSettingsFromCloud,
    getSavedSessionState,
    saveSessionState,
    clearSavedSessionState,
    mergeProgressMaps
  } from '$lib/storage';
  import { createDailySession } from '$lib/session';
  import { registerServiceWorker } from '$lib/notifications';
  import { getFirebaseAuth } from '$lib/firebase';
  import { signOut, onAuthStateChanged, getRedirectResult, type User } from 'firebase/auth';
  import { initTheme } from '$lib/theme.svelte';

  import Navbar from '$lib/components/Navbar.svelte';
  import NewWordsShowcase from '$lib/components/NewWordsShowcase.svelte';
  import HybridCard from '$lib/components/HybridCard.svelte';
  import Catalog from '$lib/components/Catalog.svelte';
  import Stats from '$lib/components/Stats.svelte';
  import SettingsModal from '$lib/components/SettingsModal.svelte';
  import AuthModal from '$lib/components/AuthModal.svelte';
  import ConfirmLogoutModal from '$lib/components/ConfirmLogoutModal.svelte';
  import Icon from '@iconify/svelte';

  let activeTab = $state<'lesson' | 'catalog' | 'stats'>('lesson');
  let isSettingsOpen = $state(false);
  let isAuthOpen = $state(false);
  let isConfirmLogoutOpen = $state(false);
  let currentUser = $state<User | null>(null);

  // Faza sesji: 'showcase' (prezentacja wszystkich nowych haseł) lub 'quiz' (sprawdzanie i powtórki)
  let sessionPhase = $state<'showcase' | 'quiz'>('showcase');
  let newWordsToLearn = $state<DictionaryWord[]>([]);
  let sessionCards = $state<SessionCard[]>([]);
  let currentCardIndex = $state(0);
  let sessionCompleted = $state(false);
  let cardsReviewedInSession = $state(0);

  let progressMap = $state<Record<string, UserWordProgress>>({});
  let settings = $state<UserSettings>(getLocalSettings());

  // Wartości reaktywne
  let streakDays = $derived(calculateStreak(progressMap));
  let currentCard = $derived(sessionCards[currentCardIndex]);
  let learnedCount = $derived(Object.values(progressMap).filter((p) => p.repetitions >= 3).length);

  /**
   * Applies accessibility data attributes to the HTML element
   * based on the current user settings.
   */
  function applyA11ySettings(s: UserSettings) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-a11y-contrast', s.highContrast ? 'high' : 'default');
    root.setAttribute('data-a11y-text', s.textSize || (s.largerText ? 'medium' : 'small'));
    root.setAttribute('data-a11y-motion', s.reducedMotion ? 'reduced' : 'default');
  }

  onMount(() => {
    // Inicjalizacja motywu
    initTheme();

    // Rejestracja Service Workera
    registerServiceWorker();

    // Wczytanie postępu lokalnego
    progressMap = getLocalProgressMap();
    settings = getLocalSettings();

    // Aplikacja ustawień dostępności
    applyA11ySettings(settings);

    // Utworzenie sesji
    startSession();

    // Listener Firebase Auth
    try {
      const auth = getFirebaseAuth();
      if (auth) {
        getRedirectResult(auth).catch((e) => {
          console.warn('Google Redirect Result handler:', e);
        });

        onAuthStateChanged(auth, async (user) => {
          currentUser = user;
          if (user) {
            // Po zalogowaniu wczytujemy dane z chmury i scalamy z lokalnymi według najnowszej daty lastReviewedAt
            const cloudProgress = await loadProgressFromCloud(user.uid);
            if (cloudProgress) {
              progressMap = mergeProgressMaps(progressMap, cloudProgress);
              saveAllLocalProgress(progressMap);
              await syncProgressToCloud(user.uid, progressMap);
              startSession();
            }
            // Wczytaj ustawienia z chmury (chmura ma pierwszeństwo)
            const cloudSettings = await loadSettingsFromCloud(user.uid);
            if (cloudSettings) {
              settings = cloudSettings;
              saveLocalSettings(cloudSettings);
              applyA11ySettings(cloudSettings);
            }
          }
        });
      }
    } catch (e) {
      console.warn('Firebase Auth w trybie offline / nieskonfigurowany.');
    }
  });

  function persistActiveSessionState() {
    saveSessionState({
      date: getTodayDateString(),
      sessionPhase,
      currentCardIndex,
      cardsReviewedInSession,
      sessionCompleted
    });
  }

  function startSession(forceNew = false) {
    if (forceNew) {
      clearSavedSessionState();
    }

    const sessionData = createDailySession(progressMap, settings, INITIAL_WORDS);
    sessionCards = sessionData.cards;

    const savedState = !forceNew ? getSavedSessionState() : null;

    if (savedState) {
      sessionPhase = savedState.sessionPhase;
      currentCardIndex = Math.min(savedState.currentCardIndex, Math.max(0, sessionCards.length - 1));
      cardsReviewedInSession = savedState.cardsReviewedInSession;
      sessionCompleted = savedState.sessionCompleted;
      newWordsToLearn = sessionCards.filter((c) => c.isNew).map((c) => c.word);
    } else {
      currentCardIndex = 0;
      sessionCompleted = sessionCards.length === 0;
      cardsReviewedInSession = 0;

      const newWords = sessionCards.filter((c) => c.isNew).map((c) => c.word);
      if (newWords.length > 0) {
        newWordsToLearn = newWords;
        sessionPhase = 'showcase';
      } else {
        newWordsToLearn = [];
        sessionPhase = 'quiz';
      }

      persistActiveSessionState();
    }
  }

  function handleFinishShowcase() {
    sessionPhase = 'quiz';
    persistActiveSessionState();
  }

  function handleGradeCard(grade: ReviewGrade) {
    if (!currentCard) return;

    // Przeliczenie SuperMemo SM-2
    const updatedProgress = calculateSM2(currentCard.word.id, grade, progressMap[currentCard.word.id]);
    
    // Zapis postępu lokalnego
    saveLocalWordProgress(updatedProgress);
    progressMap[currentCard.word.id] = updatedProgress;
    cardsReviewedInSession++;

    // Synchronizacja w tle z Firebase Firestore jeśli zalogowany
    if (currentUser?.uid) {
      syncProgressToCloud(currentUser.uid, progressMap);
    }

    // Jeśli ocena to "Bardzo trudne" (0), słówko wraca na koniec obecnej sesji
    if (grade === 0) {
      sessionCards = [
        ...sessionCards,
        {
          word: currentCard.word,
          isNew: false,
          userProgress: updatedProgress,
          options: currentCard.options
        }
      ];
    }

    // Przejście do kolejnej karty
    if (currentCardIndex + 1 < sessionCards.length) {
      currentCardIndex++;
    } else {
      sessionCompleted = true;
      flushSyncProgressToCloud();
    }
    persistActiveSessionState();
  }

  function handleSaveSettings(newSettings: UserSettings) {
    settings = newSettings;
    saveLocalSettings(newSettings);
    applyA11ySettings(newSettings);
    // Synchronizacja w tle z Firebase jeśli zalogowany
    if (currentUser?.uid) {
      saveSettingsToCloud(currentUser.uid, newSettings);
    }
  }

  /** Podgląd na żywo – aplikuje ustawienia bez zapisu */
  function handlePreviewSettings(previewSettings: UserSettings) {
    applyA11ySettings(previewSettings);
  }

  async function handleResetProgress() {
    await clearAllProgress(currentUser?.uid || undefined);
    progressMap = {};
    startSession();
  }

  async function handleLogout() {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch (err) {
      console.error('Błąd wylogowania:', err);
    }
  }

  /**
   * Handles keyboard shortcuts when on the session summary screen.
   *
   * @param e - The keyboard event object.
   */
  function handlePageKeydown(e: KeyboardEvent) {
    if (e.repeat) return;

    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return;
    }

    if (activeTab === 'lesson' && sessionCompleted) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        activeTab = 'catalog';
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        activeTab = 'stats';
      }
    }
  }
</script>

<svelte:window onkeydown={handlePageKeydown} />

<!-- Pasek Nawigacji z przełącznikiem motywu -->
<Navbar
  {activeTab}
  {streakDays}
  {learnedCount}
  userEmail={currentUser?.email || null}
  onTabChange={(tab) => (activeTab = tab)}
  onOpenSettings={() => (isSettingsOpen = true)}
  onLogin={() => (isAuthOpen = true)}
  onLogout={() => (isConfirmLogoutOpen = true)}
/>

<!-- Główna zawartość -->
<!-- pb na mobile = wyliczony margines pod bottom tab bar z uwzględnieniem gestów -->
<main class="mx-auto max-w-5xl px-0 sm:px-6 py-3 sm:py-8 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:pb-8">
  
  {#if activeTab === 'lesson'}
    <!-- WIDOK LEKCJI -->
    <div class="flex flex-col items-center justify-center space-y-6">
      
      {#if !sessionCompleted}

        <!-- FAZA 1: Prezentacja Nowych Słów (Showcase) -->
        {#if sessionPhase === 'showcase' && newWordsToLearn.length > 0}
          
          <NewWordsShowcase
            words={newWordsToLearn}
            onFinishShowcase={handleFinishShowcase}
          />

        <!-- FAZA 2: Sprawdzian wiedzy i powtórki (Quiz) -->
        {:else if currentCard}
          
          <!-- Pasek postępu sesji - kompaktowy na mobile -->
          <div class="w-full max-w-2xl px-4 sm:px-0">
            <!-- Mobile: uproszczony pasek z liczbą -->
            <div class="flex items-center gap-3 mb-1">
              <span class="text-[11px] sm:text-xs font-extrabold text-(--brand-primary) shrink-0">Faza 2 &middot; {currentCardIndex + 1}/{sessionCards.length}</span>
              <div class="flex-1 h-2 sm:h-2.5 rounded-full bg-(--progress-track) border border-(--progress-border) overflow-hidden">
                <div
                  class="h-full bg-linear-to-r from-(--brand-primary) to-(--brand-primary-hover) transition-all duration-300"
                  style="width: {((currentCardIndex + 1) / sessionCards.length) * 100}%"
                ></div>
              </div>
              <span class="text-[11px] sm:text-xs font-extrabold text-(--text-muted) shrink-0 tabular-nums">{Math.round(((currentCardIndex + 1) / sessionCards.length) * 100)}%</span>
            </div>
          </div>

          <!-- Hybrydowa Karta Słówka dla Quizu -->
          <HybridCard card={currentCard} onGrade={handleGradeCard} />

        {/if}

      {:else}
        
        <!-- EKRAN PODSUMOWANIA LEKCJI -->
        <!-- Na mobile: edge-to-edge, brak zaokrągleń po bokach -->
        <div class="w-full sm:max-w-xl sm:rounded-2xl border-y sm:border border-(--border-default) bg-(--bg-surface) sm:shadow-xl animate-in fade-in duration-300 overflow-hidden">
          
          <!-- Górna sekcja -->
          <div class="flex flex-col items-center text-center px-6 pt-10 pb-6 gap-4">
            <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-(--brand-primary) to-(--brand-primary-hover) shadow-lg">
              <Icon icon="ph:trophy-bold" class="h-11 w-11 text-white" />
            </div>
            <div>
              <h2 class="title-serif text-3xl sm:text-4xl">Plan na dziś wykonany!</h2>
              <p class="mt-2 text-sm font-semibold text-(--text-muted) max-w-sm mx-auto">
                Dzisiejsza porcja materiału została zaliczona. Wróć jutro po kolejne powtórki!
              </p>
            </div>
          </div>

          <!-- Baner edukacyjny SRS -->
          <div class="mx-5 mb-5 p-4 rounded-xl bg-(--brand-primary)/10 border border-(--brand-primary)/20 text-xs font-medium text-(--text-primary) flex items-center gap-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--brand-primary)/20 text-(--brand-primary)">
              <Icon icon="ph:sparkle-bold" class="h-5 w-5" />
            </div>
            <p class="leading-relaxed">
              Algorytm powtórek dba o trwałe zapamiętywanie. Najlepsze efekty daje regularna, codzienna nauka!
            </p>
          </div>

          <!-- Statystyki sesji -->
          <div class="grid grid-cols-2 divide-x divide-(--border-default) border-y border-(--border-default) text-center">
            <div class="py-5 px-4">
              <span class="text-[11px] font-extrabold text-(--text-muted) uppercase tracking-wider">Przejrzane hasła</span>
              <p class="font-serif text-3xl font-bold text-(--text-amber-brand) mt-1">{cardsReviewedInSession}</p>
            </div>
            <div class="py-5 px-4">
              <span class="text-[11px] font-extrabold text-(--text-muted) uppercase tracking-wider">Seria nauki</span>
              <p class="font-serif text-3xl font-bold text-(--text-amber-brand) mt-1">{streakDays} dni</p>
            </div>
          </div>

          <!-- Akcje -->
          <div class="flex flex-col gap-3 p-5">
            <button
              type="button"
              onclick={() => (activeTab = 'catalog')}
              class="btn-touch flex items-center justify-center gap-2"
            >
              <Icon icon="ph:book-open-bold" class="h-5 w-5" />
              <span>Przeglądaj Słowniczek</span>
              <kbd class="hidden sm:inline-flex">
                Enter ↵
              </kbd>
            </button>
            <button
              type="button"
              onclick={() => (activeTab = 'stats')}
              class="btn-secondary w-full py-3 text-sm flex items-center justify-center gap-2"
            >
              <Icon icon="ph:chart-bar-bold" class="h-4 w-4" />
              <span>Zobacz Statystyki</span>
              <kbd class="hidden sm:inline-flex">
                S
              </kbd>
            </button>
          </div>

        </div>

      {/if}

    </div>

  {:else if activeTab === 'catalog'}
    
    <!-- WIDOK KATALOGU / SŁOWNICZKA -->
    <Catalog words={INITIAL_WORDS} {progressMap} />

  {:else if activeTab === 'stats'}

    <!-- WIDOK STATYSTYK -->
    <Stats words={INITIAL_WORDS} {progressMap} {streakDays} />

  {/if}

</main>

<!-- Modal Ustawień -->
{#if isSettingsOpen}
  <SettingsModal
    {settings}
    onClose={() => (isSettingsOpen = false)}
    onSave={handleSaveSettings}
    onPreview={handlePreviewSettings}
    onResetProgress={handleResetProgress}
  />
{/if}

<!-- Modal Logowania i Rejestracji -->
{#if isAuthOpen}
  <AuthModal
    onClose={() => (isAuthOpen = false)}
    onSuccess={() => startSession()}
  />
{/if}

<!-- Customowe Modal Potwierdzenia Wylogowania -->
{#if isConfirmLogoutOpen}
  <ConfirmLogoutModal
    userEmail={currentUser?.email || null}
    onClose={() => (isConfirmLogoutOpen = false)}
    onConfirm={handleLogout}
  />
{/if}
