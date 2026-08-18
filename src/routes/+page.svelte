<script lang="ts">
  import { onMount } from 'svelte';
  import type { DictionaryWord, UserWordProgress, SessionCard, UserSettings, ReviewGrade, DeviceSession } from '$lib/types';
  import { INITIAL_WORDS } from '$lib/data/words';
  import { calculateSM2, getTodayDateString, calculateStreak } from '$lib/supermemo';
  import {
    getLocalProgressMap,
    saveLocalWordProgress,
    saveAllLocalProgress,
    getLocalSettings,
    saveLocalSettings,
    clearLocalProgress,
    getSavedSessionState,
    saveSessionState,
    clearSavedSessionState,
    saveLastLoginMethod,
    mergeProgressMaps,
    getDeviceId
  } from '$lib/storage';
  import { createDailySession, getDailyCompletionMessage, getWordsReviewedTodayCount } from '$lib/session';
  import { registerServiceWorker } from '$lib/notifications';
  import type { Auth, User, Unsubscribe } from 'firebase/auth';
  import { initTheme } from '$lib/theme.svelte';

  import Navbar from '$lib/components/Navbar.svelte';
  import NewWordsShowcase from '$lib/components/NewWordsShowcase.svelte';
  import HybridCard from '$lib/components/HybridCard.svelte';
  import Icon from '@iconify/svelte';

  // Firebase (auth + firestore) and every modal/tab below are loaded lazily
  // on demand instead of being bundled into the initial page load. This is
  // what keeps the first-load JS small (PageSpeed previously flagged ~130 KB
  // of unused JS coming from these, since they were statically imported but
  // rarely needed on first paint).
  let cloudModulePromise: Promise<typeof import('$lib/storage.cloud')> | null = null;
  function getCloudStorage() {
    if (!cloudModulePromise) {
      cloudModulePromise = import('$lib/storage.cloud');
    }
    return cloudModulePromise;
  }

  let firebaseAuthModulePromise: Promise<typeof import('firebase/auth')> | null = null;
  function getFirebaseAuthModule() {
    if (!firebaseAuthModulePromise) {
      firebaseAuthModulePromise = import('firebase/auth');
    }
    return firebaseAuthModulePromise;
  }

  let firebaseFirestoreModulePromise: Promise<typeof import('firebase/firestore')> | null = null;
  function getFirebaseFirestoreModule() {
    if (!firebaseFirestoreModulePromise) {
      firebaseFirestoreModulePromise = import('firebase/firestore');
    }
    return firebaseFirestoreModulePromise;
  }


  let activeTab = $state<'lesson' | 'catalog' | 'stats'>('lesson');
  let isSettingsOpen = $state(false);
  let isAccountOpen = $state(false);
  let isAuthOpen = $state(false);
  let isConfirmLogoutOpen = $state(false);
  let isPrivacyOpen = $state(false);
  let isContactOpen = $state(false);
  let currentUser = $state<User | null>(null);
  let userUsername = $state<string | null>(null);
  let userDevices = $state<Record<string, DeviceSession>>({});
  let unsubscribeUserSnapshot: Unsubscribe | null = null;

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
  let completionMessage = $derived(getDailyCompletionMessage());

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

    // Listener Firebase Auth - odroczony do czasu bezczynności przeglądarki.
    // Wcześniej getFirebaseAuth()/getAuth() był wywoływany natychmiast, co
    // wyzwalało blokujące żądanie sieciowe (getProjectConfig, ~1.8-1.9s
    // w raportach PageSpeed) leżące na ścieżce krytycznej i opóźniające LCP.
    // Ekran gościa działa w pełni na localStorage, więc logowanie może
    // poczekać do momentu, gdy przeglądarka skończy renderować pierwszy widok.
    const idle =
      typeof requestIdleCallback === 'function'
        ? requestIdleCallback
        : (cb: () => void) => setTimeout(cb, 200);
    idle(() => initFirebaseAuthListener());
  });

  async function initFirebaseAuthListener() {
    try {
      const [{ getFirebaseAuth, getFirebaseDb }, authMod, firestoreMod, cloud] = await Promise.all([
        import('$lib/firebase'),
        getFirebaseAuthModule(),
        getFirebaseFirestoreModule(),
        getCloudStorage()
      ]);
      const { signOut, onAuthStateChanged, getRedirectResult } = authMod;
      const { doc, onSnapshot } = firestoreMod;
      const { registerDeviceSession, loadUserProfileFromCloud, loadProgressFromCloud, syncProgressToCloud, loadSettingsFromCloud, loadSessionCompletionFromCloud, syncSessionCompletionToCloud } = cloud;

      const auth: Auth = getFirebaseAuth();
      if (auth) {
        getRedirectResult(auth)
          .then((res) => {
            if (res?.user) {
              saveLastLoginMethod('google');
              isAuthOpen = false;
            }
          })
          .catch((e) => {
            console.warn('Google Redirect Result handler:', e);
          });

        onAuthStateChanged(auth, async (user) => {
          if (unsubscribeUserSnapshot) {
            unsubscribeUserSnapshot();
            unsubscribeUserSnapshot = null;
          }

          currentUser = user;
          if (user) {
            isAuthOpen = false;

            // Rejestracja obecnej sesji urządzenia w Firestore
            await registerDeviceSession(user.uid, user.email);

            // Wczytanie profilu użytkownika (username, devices)
            const profile = await loadUserProfileFromCloud(user.uid);
            userUsername = profile?.username || user.displayName || null;
            userDevices = profile?.devices || {};

            // Nasłuchiwanie zmian na żywo w dokumencie użytkownika (profil i weryfikacja sesji)
            const db = getFirebaseDb();
            if (db) {
              const userDocRef = doc(db, 'users', user.uid);
              unsubscribeUserSnapshot = onSnapshot(userDocRef, (snap) => {
                if (snap.exists()) {
                  const data = snap.data();
                  userUsername = data.username || data.displayName || null;
                  userDevices = data.devices || {};

                  // Sprawdzenie czy sesja została wycofana (wyloguj ze wszystkich urządzeń)
                  const currentDevId = getDeviceId();
                  const isDeviceInList = data.devices && data.devices[currentDevId];

                  if (data.sessionRevokedAt && !isDeviceInList) {
                    signOut(auth).catch(() => {});
                    return;
                  }

                  const today = getTodayDateString();
                  if (data.lastCompletedSessionDate === today) {
                    sessionCompleted = true;
                    if (typeof data.cardsReviewedToday === 'number') {
                      cardsReviewedInSession = data.cardsReviewedToday;
                    }
                    persistActiveSessionState();
                  }

                  if (data.progressMap) {
                    const remote = data.progressMap;
                    const merged = mergeProgressMaps(progressMap, remote);
                    if (JSON.stringify(merged) !== JSON.stringify(progressMap)) {
                      progressMap = merged;
                      saveAllLocalProgress(progressMap);
                      if (data.lastCompletedSessionDate !== today) {
                        startSession();
                      }
                    }
                  }
                }
              });
            }

            // Po zalogowaniu wczytujemy dane z chmury i scalamy z lokalnymi według najnowszej daty lastReviewedAt
            const cloudProgress = await loadProgressFromCloud(user.uid);
            if (cloudProgress) {
              progressMap = mergeProgressMaps(progressMap, cloudProgress);
              saveAllLocalProgress(progressMap);
              await syncProgressToCloud(user.uid, progressMap);
              startSession();
            }
            const cloudSession = await loadSessionCompletionFromCloud(user.uid);
            if (cloudSession?.lastCompletedSessionDate === getTodayDateString()) {
              sessionCompleted = true;
              if (typeof cloudSession.cardsReviewedToday === 'number') {
                cardsReviewedInSession = cloudSession.cardsReviewedToday;
              }
              persistActiveSessionState();
            }
            // Wczytaj ustawienia z chmury (z zachowaniem lokalnych ustawień powiadomień)
            const cloudSettings = await loadSettingsFromCloud(user.uid);
            if (cloudSettings) {
              const localNotificationsEnabled = settings.notificationsEnabled;
              settings = {
                ...cloudSettings,
                notificationsEnabled: localNotificationsEnabled
              };
              saveLocalSettings(settings);
              applyA11ySettings(settings);
            }
          } else {
            userUsername = null;
            userDevices = {};
            isAccountOpen = false;
          }
        });
      }
    } catch (e) {
      console.warn('Firebase Auth w trybie offline / nieskonfigurowany.');
    }
  }

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
    const today = getTodayDateString();
    const reviewedToday = getWordsReviewedTodayCount(progressMap, today);

    if (savedState && savedState.date === today) {
      sessionPhase = savedState.sessionPhase;
      currentCardIndex = Math.min(savedState.currentCardIndex, Math.max(0, sessionCards.length - 1));
      cardsReviewedInSession = savedState.cardsReviewedInSession || reviewedToday;
      sessionCompleted = savedState.sessionCompleted || (sessionCards.length === 0 && reviewedToday > 0);
      newWordsToLearn = sessionCards.filter((c) => c.isNew).map((c) => c.word);
    } else {
      currentCardIndex = 0;
      sessionCompleted = sessionCards.length === 0;
      cardsReviewedInSession = sessionCards.length === 0 ? reviewedToday : 0;

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
      getCloudStorage().then((cloud) => cloud.syncProgressToCloud(currentUser!.uid, progressMap));
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
      if (currentUser?.uid) {
        getCloudStorage().then((cloud) => {
          cloud.flushSyncProgressToCloud();
          cloud.syncSessionCompletionToCloud(currentUser!.uid, getTodayDateString(), cardsReviewedInSession);
        });
      }
    }
    persistActiveSessionState();
  }

  function handleSaveSettings(newSettings: UserSettings) {
    const oldLimit = settings.dailyNewWordsLimit;
    settings = newSettings;
    saveLocalSettings(newSettings);
    applyA11ySettings(newSettings);
    // Synchronizacja w tle z Firebase jeśli zalogowany
    if (currentUser?.uid) {
      getCloudStorage().then((cloud) => cloud.saveSettingsToCloud(currentUser!.uid, newSettings));
    }
    // Jeśli zmieniono limit słówek, przelicz sesję na dziś
    if (newSettings.dailyNewWordsLimit !== oldLimit) {
      startSession(true);
    }
  }

  /** Podgląd na żywo – aplikuje ustawienia bez zapisu */
  function handlePreviewSettings(previewSettings: UserSettings) {
    applyA11ySettings(previewSettings);
  }

  async function handleResetProgress() {
    clearLocalProgress();
    if (currentUser?.uid) {
      const cloud = await getCloudStorage();
      await cloud.clearCloudProgress(currentUser.uid);
    }
    progressMap = {};
    startSession(true);
  }

  async function handleLogout() {
    try {
      const [{ getFirebaseAuth }, { signOut }] = await Promise.all([
        import('$lib/firebase'),
        getFirebaseAuthModule()
      ]);
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch (err) {
      console.error('Błąd wylogowania:', err);
    }
  }

  async function handleSaveUsername(newUsername: string) {
    if (!currentUser) return;
    const cloud = await getCloudStorage();
    await cloud.saveUsernameToCloud(currentUser.uid, newUsername);
    userUsername = newUsername;
  }

  async function handleLogoutAllDevices() {
    if (!currentUser) return;
    const cloud = await getCloudStorage();
    await cloud.logoutAllDevicesInCloud(currentUser.uid);
    await handleLogout();
  }

  async function handleDeleteAccount() {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const cloud = await getCloudStorage();
    await cloud.deleteUserAccount(uid);
    currentUser = null;
    userUsername = null;
    userDevices = {};
    progressMap = {};
    startSession(true);
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
  username={userUsername}
  onTabChange={(tab) => (activeTab = tab)}
  onOpenSettings={() => (isSettingsOpen = true)}
  onOpenAccount={() => (isAccountOpen = true)}
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
              <h2 class="title-serif text-3xl sm:text-4xl">{completionMessage.title}</h2>
              <p class="mt-2 text-sm font-semibold text-(--text-muted) max-w-sm mx-auto">
                {completionMessage.description}
              </p>
            </div>
          </div>

          <!-- Baner edukacyjny SRS -->
          <div class="mx-5 mb-5 p-4 rounded-xl bg-(--brand-primary)/10 border border-(--brand-primary)/20 text-xs font-medium text-(--text-primary) flex items-center gap-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--brand-primary)/20 text-(--brand-primary)">
              <Icon icon="ph:sparkle-bold" class="h-5 w-5" />
            </div>
            <p class="leading-relaxed">
              Algorytm powtórek dba o trwałe zapamiętywanie. Najlepsze efekty daje regularna, codzienna nauka.
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

    <!-- WIDOK KATALOGU / SŁOWNICZKA (lazy-loaded, not needed on first paint) -->
    {#await import('$lib/components/Catalog.svelte') then { default: Catalog }}
      <Catalog words={INITIAL_WORDS} {progressMap} />
    {/await}

  {:else if activeTab === 'stats'}

    <!-- WIDOK STATYSTYK (lazy-loaded, not needed on first paint) -->
    {#await import('$lib/components/Stats.svelte') then { default: Stats }}
      <Stats words={INITIAL_WORDS} {progressMap} {streakDays} />
    {/await}

  {/if}

</main>

<!-- Modal Ustawień -->
{#if isSettingsOpen}
  {#await import('$lib/components/SettingsModal.svelte') then { default: SettingsModal }}
    <SettingsModal
      {settings}
      onClose={() => (isSettingsOpen = false)}
      onSave={handleSaveSettings}
      onPreview={handlePreviewSettings}
      onResetProgress={handleResetProgress}
    />
  {/await}
{/if}

<!-- Modal Logowania i Rejestracji -->
{#if isAuthOpen}
  {#await import('$lib/components/AuthModal.svelte') then { default: AuthModal }}
    <AuthModal
      onClose={() => (isAuthOpen = false)}
      onSuccess={() => startSession()}
      onOpenPrivacy={() => (isPrivacyOpen = true)}
    />
  {/await}
{/if}

<!-- Customowe Modal Potwierdzenia Wylogowania -->
{#if isConfirmLogoutOpen}
  {#await import('$lib/components/ConfirmLogoutModal.svelte') then { default: ConfirmLogoutModal }}
    <ConfirmLogoutModal
      userEmail={currentUser?.email || null}
      onClose={() => (isConfirmLogoutOpen = false)}
      onConfirm={handleLogout}
    />
  {/await}
{/if}

<!-- Modal Polityki Prywatności (RODO) -->
{#if isPrivacyOpen}
  {#await import('$lib/components/PrivacyModal.svelte') then { default: PrivacyModal }}
    <PrivacyModal
      onClose={() => (isPrivacyOpen = false)}
      onOpenContact={() => (isContactOpen = true)}
    />
  {/await}
{/if}

<!-- Modal Formularza Kontaktowego -->
{#if isContactOpen}
  {#await import('$lib/components/ContactModal.svelte') then { default: ContactModal }}
    <ContactModal onClose={() => (isContactOpen = false)} />
  {/await}
{/if}

<!-- Modal Konta i Urządzeń -->
{#if isAccountOpen && currentUser}
  {#await import('$lib/components/AccountModal.svelte') then { default: AccountModal }}
    <AccountModal
      userEmail={currentUser.email}
      username={userUsername}
      devices={userDevices}
      onClose={() => (isAccountOpen = false)}
      onSaveUsername={handleSaveUsername}
      onLogoutAllDevices={handleLogoutAllDevices}
      onLogout={() => {
        isAccountOpen = false;
        isConfirmLogoutOpen = true;
      }}
      onDeleteAccount={handleDeleteAccount}
    />
  {/await}
{/if}



