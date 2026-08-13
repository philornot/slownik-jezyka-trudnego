<script lang="ts">
  import { theme, toggleTheme } from "../theme.svelte";
  import Icon from "@iconify/svelte";
  import { onMount } from "svelte";

  interface Props {
    activeTab: "lesson" | "catalog" | "stats";
    streakDays: number;
    learnedCount: number;
    userEmail: string | null;
    username?: string | null;
    onTabChange: (tab: "lesson" | "catalog" | "stats") => void;
    onOpenSettings: () => void;
    onOpenAccount?: () => void;
    onLogin: () => void;
    onLogout: () => void;
  }

  let {
    activeTab,
    streakDays,
    learnedCount,
    userEmail,
    username = null,
    onTabChange,
    onOpenSettings,
    onOpenAccount,
    onLogin,
    onLogout,
  }: Props = $props();

  let pointerCoords = { x: 0, y: 0 };

  /** Popup onboarding – widoczny przy pierwszej wizycie */
  let showOnboardingPopup = $state(false);
  const ONBOARDING_KEY = "sjt_onboarding_seen_v1";

  function dismissOnboarding() {
    showOnboardingPopup = false;
    try {
      localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {}
  }

  onMount(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_KEY)) {
        setTimeout(() => {
          showOnboardingPopup = true;
        }, 800);
        setTimeout(() => {
          dismissOnboarding();
        }, 6800);
      }
    } catch {}
  });

  function handlePointerDown(e: PointerEvent) {
    pointerCoords = { x: e.clientX, y: e.clientY };
  }

  function handleThemeToggle(e: MouseEvent) {
    const x = pointerCoords.x || e.clientX || window.innerWidth / 2;
    const y = pointerCoords.y || e.clientY || 40;
    toggleTheme(x, y);
  }
</script>

<!-- ============================== -->
<!-- HEADER - widoczny na wszystkich rozmiarach -->
<!-- ============================== -->
<header
  class="sticky top-0 z-40 border-b border-(--border-default) bg-(--bg-app)/95 backdrop-blur-md shadow-xs transition-colors duration-200 pt-[env(safe-area-inset-top,0px)]"
>
  <div
    class="mx-auto flex max-w-5xl items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3"
  >
    <!-- Logo & Brand Header -->
    <button
      type="button"
      onclick={() => onTabChange("lesson")}
      class="flex items-center gap-2.5 cursor-pointer text-left focus:outline-none transition-transform active:scale-95 group"
      aria-label="Słownik Języka Trudnego - Strona Główna"
    >
      <!-- Mobile: tylko okrągły emblemat (< sm) -->
      <div class="flex sm:hidden h-9 w-9 shrink-0">
        <picture>
          <source
            srcset={theme.current === "dark" ? "/logo-circle-dark.webp" : "/logo-circle.webp"}
            type="image/webp"
          />
          <img
            src={theme.current === "dark" ? "/logo-circle-dark.png" : "/logo-circle.png"}
            alt="Słownik Języka Trudnego"
            width="128"
            height="128"
            fetchpriority="high"
            class="h-full w-full object-contain"
          />
        </picture>
      </div>

      <!-- Desktop: pełne logo z napisem (>= sm) -->
      <div class="hidden sm:flex h-12 sm:h-14 shrink-0">
        <picture>
          <source
            srcset={theme.current === "dark" ? "/logo-wide-dark.webp" : "/logo-wide.webp"}
            type="image/webp"
          />
          <img
            src={theme.current === "dark" ? "/logo-wide-dark.png" : "/logo-wide.png"}
            alt="Słownik Języka Trudnego"
            width="400"
            height="114"
            fetchpriority="high"
            class="h-full w-auto object-contain"
          />
        </picture>
      </div>
    </button>

    <!-- Desktop: nawigacja zakładkowa w środku headera -->
    <nav
      class="hidden sm:flex items-center gap-1 rounded-xl border border-(--border-default) bg-(--bg-surface-elevated) p-1"
    >
      <button
        type="button"
        onclick={() => onTabChange("lesson")}
        class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 {activeTab ===
        'lesson'
          ? 'bg-(--brand-primary) text-white shadow-xs'
          : 'text-(--text-primary) hover:text-(--brand-primary)'}"
      >
        <Icon icon="ph:book-open-bold" class="h-4 w-4" />
        <span>Lekcja</span>
      </button>
      <button
        type="button"
        onclick={() => onTabChange("catalog")}
        class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 {activeTab ===
        'catalog'
          ? 'bg-(--brand-primary) text-white shadow-xs'
          : 'text-(--text-primary) hover:text-(--brand-primary)'}"
      >
        <Icon icon="ph:bookmark-bold" class="h-4 w-4" />
        <span>Katalog</span>
      </button>
      <button
        type="button"
        onclick={() => onTabChange("stats")}
        class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 {activeTab ===
        'stats'
          ? 'bg-(--brand-primary) text-white shadow-xs'
          : 'text-(--text-primary) hover:text-(--brand-primary)'}"
      >
        <Icon icon="ph:chart-bar-bold" class="h-4 w-4" />
        <span>Statystyki</span>
      </button>
    </nav>

    <!-- Prawa strona - akcje użytkownika -->
    <div class="flex items-center gap-1.5 sm:gap-2">
      {#if userEmail}
        <!-- Zalogowany: przycisk profilu (username/email) i wylogowanie -->
        <button
          type="button"
          onclick={onOpenAccount}
          title="Zarządzaj kontem"
          class="flex items-center gap-1.5 rounded-xl border border-(--border-default) bg-(--bg-surface-elevated) px-2.5 py-1 text-xs font-semibold text-(--text-secondary) hover:border-(--brand-primary) hover:text-(--brand-primary) transition-all active:scale-95 cursor-pointer"
        >
          <Icon
            icon="ph:user-bold"
            class="h-3.5 w-3.5 text-(--brand-primary)"
          />
          <span class="max-w-28 sm:max-w-36 truncate font-extrabold">{username || userEmail}</span>
        </button>
        <button
          type="button"
          onclick={onLogout}
          title="Wyloguj się"
          class="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-(--rose-border) bg-(--rose-bg) text-(--rose-icon) hover:bg-(--rose-border)/30 active:scale-95 transition-all shadow-xs shrink-0"
        >
          <Icon icon="ph:sign-out-bold" class="h-4.5 w-4.5 sm:h-4 sm:w-4" />
        </button>
      {:else}
        <button
          type="button"
          onclick={onLogin}
          class="hidden sm:flex btn-primary py-1.5 px-3"
        >
          <Icon icon="ph:sign-in-bold" class="h-4 w-4" />
          <span>Zaloguj</span>
        </button>
        <!-- Na mobile: ikona logowania bez tekstu -->
        <button
          type="button"
          onclick={onLogin}
          title="Zaloguj się"
          class="flex sm:hidden h-10 w-10 items-center justify-center rounded-xl border border-(--border-default) bg-(--bg-surface) text-(--text-primary) hover:border-(--brand-primary) active:scale-95 transition-all"
        >
          <Icon icon="ph:sign-in-bold" class="h-4 w-4" />
        </button>
      {/if}

      <!-- Przełącznik motywu -->
      <button
        type="button"
        onpointerdown={handlePointerDown}
        onclick={handleThemeToggle}
        title={theme.current === "dark" ? "Jasny motyw" : "Ciemny motyw"}
        class="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-(--border-default) bg-(--bg-surface) text-(--text-secondary) hover:border-(--brand-primary) hover:text-(--brand-primary) active:scale-95 transition-all"
      >
        {#if theme.current === "dark"}
          <Icon
            icon="ph:sun-bold"
            class="h-4 w-4 text-(--text-secondary)"
          />
        {:else}
          <Icon
            icon="ph:moon-bold"
            class="h-4 w-4 text-(--text-secondary)"
          />
        {/if}
      </button>

      <!-- Ustawienia -->
      <div class="relative">
        <button
          type="button"
          onclick={onOpenSettings}
          title="Ustawienia"
          class="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-(--border-default) bg-(--bg-surface) text-(--text-secondary) hover:border-(--brand-primary) hover:text-(--brand-primary) active:scale-95 transition-all"
        >
          <Icon icon="ph:gear-six-bold" class="h-4 w-4" />
        </button>

        <!-- Popup onboarding -->
        {#if showOnboardingPopup}
          <div
            role="tooltip"
            class="onboarding-popup"
          >
            <!-- Strzałka wskazująca na przycisk -->
            <div class="onboarding-arrow"></div>
            <div class="flex items-start gap-2.5">
              <span class="text-xl leading-none shrink-0">👋</span>
              <div>
                <p class="text-xs font-extrabold text-(--text-primary) leading-tight">
                  Hej, tu są ustawienia!
                </p>
                <p class="text-[11px] font-semibold text-(--text-muted) mt-0.5 leading-snug">
                  Dostępność, animacje, limit słówek i więcej.
                </p>
              </div>
              <button
                type="button"
                onclick={dismissOnboarding}
                class="shrink-0 ml-1 text-(--text-muted) hover:text-(--text-primary) transition-colors"
                aria-label="Zamknij"
              >
                <Icon icon="ph:x-bold" class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</header>

<!-- ============================== -->
<!-- BOTTOM TAB BAR - tylko na mobile -->
<!-- ============================== -->
<div
  class="bottom-tab-bar sm:hidden"
  role="navigation"
  aria-label="Nawigacja główna"
>
  <button
    type="button"
    onclick={() => onTabChange("lesson")}
    class="bottom-tab-item relative {activeTab === 'lesson' ? 'active' : ''}"
    aria-current={activeTab === "lesson" ? "page" : undefined}
  >
    {#if activeTab === "lesson"}
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.75 bg-(--brand-primary) rounded-b-full shadow-xs"
      ></div>
    {/if}
    <Icon
      icon={activeTab === "lesson" ? "ph:book-open-fill" : "ph:book-open"}
      class="h-6 w-6 transition-transform {activeTab === 'lesson'
        ? 'scale-110'
        : ''}"
    />
    <span>Lekcja</span>
  </button>

  <button
    type="button"
    onclick={() => onTabChange("catalog")}
    class="bottom-tab-item relative {activeTab === 'catalog' ? 'active' : ''}"
    aria-current={activeTab === "catalog" ? "page" : undefined}
  >
    {#if activeTab === "catalog"}
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.75 bg-(--brand-primary) rounded-b-full shadow-xs"
      ></div>
    {/if}
    <Icon
      icon={activeTab === "catalog" ? "ph:bookmark-fill" : "ph:bookmark"}
      class="h-6 w-6 transition-transform {activeTab === 'catalog'
        ? 'scale-110'
        : ''}"
    />
    <span>Katalog</span>
  </button>

  <button
    type="button"
    onclick={() => onTabChange("stats")}
    class="bottom-tab-item relative {activeTab === 'stats' ? 'active' : ''}"
    aria-current={activeTab === "stats" ? "page" : undefined}
  >
    {#if activeTab === "stats"}
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.75 bg-(--brand-primary) rounded-b-full shadow-xs"
      ></div>
    {/if}
    <Icon
      icon={activeTab === "stats" ? "ph:chart-bar-fill" : "ph:chart-bar"}
      class="h-6 w-6 transition-transform {activeTab === 'stats'
        ? 'scale-110'
        : ''}"
    />
    <span>Statystyki</span>
  </button>
</div>
