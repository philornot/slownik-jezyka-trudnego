<script lang="ts">
  import { theme, toggleTheme } from '../theme.svelte';
  import Icon from '@iconify/svelte';

  interface Props {
    activeTab: 'lesson' | 'catalog' | 'stats';
    streakDays: number;
    learnedCount: number;
    userEmail: string | null;
    onTabChange: (tab: 'lesson' | 'catalog' | 'stats') => void;
    onOpenSettings: () => void;
    onLogin: () => void;
    onLogout: () => void;
  }

  let {
    activeTab,
    streakDays,
    learnedCount,
    userEmail,
    onTabChange,
    onOpenSettings,
    onLogin,
    onLogout
  }: Props = $props();

  let pointerCoords = { x: 0, y: 0 };

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
<header class="sticky top-0 z-40 border-b border-[var(--border-default)] bg-[var(--bg-app)]/95 backdrop-blur-md shadow-xs transition-colors duration-200 pt-[env(safe-area-inset-top,0px)]">
  <div class="mx-auto flex max-w-5xl items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3">
    
    <!-- Logo -->
    <div class="flex items-center gap-2.5">
      <div class="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-hover)] shadow-xs shrink-0">
        <Icon icon="ph:book-open-duotone" class="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      </div>
      <div>
        <h1 class="title-serif text-base sm:text-xl tracking-tight leading-tight">
          <span class="hidden xs:inline">Słownik Języka Trudnego</span>
          <span class="inline xs:hidden font-bold">Słownik Trudny</span>
        </h1>
        <p class="hidden sm:block text-xs font-semibold text-[var(--text-muted)]">Codzienna porcja wykwintnej polszczyzny</p>
      </div>
    </div>

    <!-- Desktop: nawigacja zakładkowa w środku headera -->
    <nav class="hidden sm:flex items-center gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-1">
      <button
        type="button"
        onclick={() => onTabChange('lesson')}
        class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 {activeTab === 'lesson' ? 'bg-[var(--brand-primary)] text-white shadow-xs' : 'text-[var(--text-primary)] hover:text-[var(--brand-primary)]'}"
      >
        <Icon icon="ph:book-open-bold" class="h-4 w-4" />
        <span>Lekcja</span>
      </button>
      <button
        type="button"
        onclick={() => onTabChange('catalog')}
        class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 {activeTab === 'catalog' ? 'bg-[var(--brand-primary)] text-white shadow-xs' : 'text-[var(--text-primary)] hover:text-[var(--brand-primary)]'}"
      >
        <Icon icon="ph:bookmark-bold" class="h-4 w-4" />
        <span>Katalog</span>
      </button>
      <button
        type="button"
        onclick={() => onTabChange('stats')}
        class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 {activeTab === 'stats' ? 'bg-[var(--brand-primary)] text-white shadow-xs' : 'text-[var(--text-primary)] hover:text-[var(--brand-primary)]'}"
      >
        <Icon icon="ph:chart-bar-bold" class="h-4 w-4" />
        <span>Statystyki</span>
      </button>
    </nav>

    <!-- Prawa strona - akcje użytkownika -->
    <div class="flex items-center gap-1.5 sm:gap-2">
      
      {#if userEmail}
        <!-- Zalogowany: avatar/email i wylogowanie -->
        <div class="hidden md:flex items-center gap-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
          <Icon icon="ph:user-bold" class="h-3.5 w-3.5 text-[var(--brand-primary)]" />
          <span class="max-w-[130px] truncate">{userEmail}</span>
        </div>
        <button
          type="button"
          onclick={onLogout}
          title="Wyloguj się"
          class="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--rose-icon)] hover:border-[var(--rose-border)] active:scale-95 transition-all"
        >
          <Icon icon="ph:sign-out-bold" class="h-4 w-4" />
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
          class="flex sm:hidden h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] active:scale-95 transition-all"
        >
          <Icon icon="ph:sign-in-bold" class="h-4 w-4" />
        </button>
      {/if}

      <!-- Przełącznik motywu -->
      <button
        type="button"
        onpointerdown={handlePointerDown}
        onclick={handleThemeToggle}
        title={theme.current === 'dark' ? 'Jasny motyw' : 'Ciemny motyw'}
        class="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] active:scale-95 transition-all"
      >
        {#if theme.current === 'dark'}
          <Icon icon="ph:sun-bold" class="h-4 w-4 text-[var(--text-secondary)]" />
        {:else}
          <Icon icon="ph:moon-bold" class="h-4 w-4 text-[var(--text-secondary)]" />
        {/if}
      </button>

      <!-- Ustawienia -->
      <button
        type="button"
        onclick={onOpenSettings}
        title="Ustawienia"
        class="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] active:scale-95 transition-all"
      >
        <Icon icon="ph:gear-six-bold" class="h-4 w-4" />
      </button>
    </div>
  </div>
</header>

<!-- ============================== -->
<!-- BOTTOM TAB BAR - tylko na mobile -->
<!-- ============================== -->
<div class="bottom-tab-bar sm:hidden" role="navigation" aria-label="Nawigacja główna">
  <button
    type="button"
    onclick={() => onTabChange('lesson')}
    class="bottom-tab-item relative {activeTab === 'lesson' ? 'active' : ''}"
    aria-current={activeTab === 'lesson' ? 'page' : undefined}
  >
    {#if activeTab === 'lesson'}
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[var(--brand-primary)] rounded-b-full shadow-xs"></div>
    {/if}
    <Icon
      icon={activeTab === 'lesson' ? 'ph:book-open-fill' : 'ph:book-open'}
      class="h-6 w-6 transition-transform {activeTab === 'lesson' ? 'scale-110' : ''}"
    />
    <span>Lekcja</span>
  </button>

  <button
    type="button"
    onclick={() => onTabChange('catalog')}
    class="bottom-tab-item relative {activeTab === 'catalog' ? 'active' : ''}"
    aria-current={activeTab === 'catalog' ? 'page' : undefined}
  >
    {#if activeTab === 'catalog'}
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[var(--brand-primary)] rounded-b-full shadow-xs"></div>
    {/if}
    <Icon
      icon={activeTab === 'catalog' ? 'ph:bookmark-fill' : 'ph:bookmark'}
      class="h-6 w-6 transition-transform {activeTab === 'catalog' ? 'scale-110' : ''}"
    />
    <span>Katalog</span>
  </button>

  <button
    type="button"
    onclick={() => onTabChange('stats')}
    class="bottom-tab-item relative {activeTab === 'stats' ? 'active' : ''}"
    aria-current={activeTab === 'stats' ? 'page' : undefined}
  >
    {#if activeTab === 'stats'}
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[var(--brand-primary)] rounded-b-full shadow-xs"></div>
    {/if}
    <Icon
      icon={activeTab === 'stats' ? 'ph:chart-bar-fill' : 'ph:chart-bar'}
      class="h-6 w-6 transition-transform {activeTab === 'stats' ? 'scale-110' : ''}"
    />
    <span>Statystyki</span>
  </button>
</div>
