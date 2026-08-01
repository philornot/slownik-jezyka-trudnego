<script lang="ts">
  import type { DictionaryWord, UserWordProgress } from '../types';
  import Icon from '@iconify/svelte';

  interface Props {
    words?: DictionaryWord[];
    progressMap?: Record<string, UserWordProgress>;
  }

  let { words = [], progressMap = {} }: Props = $props();

  let searchQuery = $state('');
  let selectedCategory = $state('all');
  let activeWord = $state<DictionaryWord | null>(null);

  // Dzielimy słowa na Odblokowane (użytkownik już rozpoczął naukę) oraz Zablokowane
  let unlockedWords = $derived(
    words.filter((w) => !!progressMap[w.id])
  );

  let lockedWords = $derived(
    words.filter((w) => !progressMap[w.id])
  );

  // Wyciągamy Unikalne Kategorie
  let categories = $derived(Array.from(new Set(words.map((w) => w.category).filter(Boolean))));

  // Filtrowanie odblokowanych słów po szukajce i kategorii
  let filteredUnlockedWords = $derived(
    unlockedWords.filter((w) => {
      const matchesSearch =
        w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.shortDefinition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.fullDefinition.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || w.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
  );

  // Filtrowanie zablokowanych słów po szukajce i kategorii
  let filteredLockedWords = $derived(
    lockedWords.filter((w) => {
      const matchesSearch =
        searchQuery === '' ||
        w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || w.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
  );

  function getStatusBadge(wordId: string) {
    const prog = progressMap[wordId];
    if (!prog) return null;
    if (prog.repetitions >= 3) {
      const rep = prog.repetitions;
      const label = rep === 1 ? '1 powtórzenie' : (rep >= 2 && rep <= 4 ? `${rep} powtórzenia` : `${rep} powtórzeń`);
      return { label, badgeClass: 'badge-emerald' };
    }
    return { label: `W trakcie nauki`, badgeClass: 'badge-amber' };
  }
</script>

<div class="mx-auto max-w-5xl space-y-4 sm:space-y-6 px-3 sm:px-0">

  <!-- Zwięzły pasek wyszukiwania i filtrów z tokenami (sticky na mobile) -->
  <div class="app-card p-3.5 sm:p-5 sticky top-[calc(53px+env(safe-area-inset-top,0px))] z-30 sm:relative sm:top-0 shadow-md sm:shadow-xs">
    <div class="flex flex-col gap-3 md:flex-row md:items-center justify-between">
      
      <!-- Szukajka -->
      <div class="relative flex-1">
        <Icon icon="ph:magnifying-glass-bold" class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-body-muted" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Szukaj w słówkach..."
          class="w-full rounded-xl border border-(--border-default) bg-(--bg-surface-elevated) pl-10 pr-4 py-2.5 text-xs sm:text-xs font-bold text-body-primary placeholder:text-body-muted focus:border-(--brand-primary) focus:outline-hidden"
        />
      </div>

      <!-- Filtr Kategorii oraz dyskretny wskaźnik odblokowanych -->
      <div class="flex items-center justify-between gap-2.5">
        <select
          bind:value={selectedCategory}
          class="flex-1 sm:flex-none rounded-xl border border-(--border-default) bg-(--bg-surface-elevated) px-3 py-2 text-xs font-bold text-body-primary focus:border-(--brand-primary) focus:outline-hidden"
        >
          <option value="all">Wszystkie kategorie</option>
          {#each categories as cat}
            <option value={cat}>{cat}</option>
          {/each}
        </select>

        <span class="badge-neutral px-2.5 py-2 text-[11px] sm:text-xs shrink-0 flex items-center gap-1.5 text-(--text-secondary)">
          <Icon icon="ph:sparkle-bold" class="h-3.5 w-3.5 text-current shrink-0" />
          <span>{unlockedWords.length} / {words.length}</span>
        </span>
      </div>

    </div>
  </div>

  <!-- SEKCJA 1: ODBLOKOWANE / POZNANE SŁÓWKA -->
  <div class="space-y-3 sm:space-y-4">
    <div class="flex items-center justify-between border-b border-(--border-default) pb-2">
      <div class="flex items-center gap-2">
        <Icon icon="ph:check-circle-bold" class="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <h3 class="title-serif text-lg sm:text-xl">
          Poznane Słówka ({filteredUnlockedWords.length})
        </h3>
      </div>
    </div>

    {#if filteredUnlockedWords.length > 0}
      <div class="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {#each filteredUnlockedWords as word}
          {@const status = getStatusBadge(word.id)}
          <!-- Klikalny kafelek ze spójną klasą -->
          <div
            role="button"
            tabindex="0"
            onclick={() => (activeWord = word)}
            onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (activeWord = word)}
            class="app-card-interactive group flex flex-col justify-between p-4 sm:p-5 min-h-27.5"
          >
            <div>
              <div class="flex items-start justify-between gap-2">
                <h4 class="title-serif text-lg sm:text-xl wrap-break-word group-hover:text-(--brand-primary) transition-colors">{word.word}</h4>
                {#if status}
                  <span class="{status.badgeClass} text-[10px] py-0.5 px-2 shrink-0">
                    {status.label}
                  </span>
                {/if}
              </div>

              {#if word.phonetic}
                <p class="mt-0.5 text-xs italic font-bold text-body-muted">{word.phonetic}</p>
              {/if}

              <p class="mt-2 text-xs font-semibold text-body-primary line-clamp-2 sm:line-clamp-3 leading-relaxed">
                {word.shortDefinition}
              </p>
            </div>

            <div class="mt-4 flex items-center justify-between border-t border-(--border-default) pt-2.5">
              <span class="text-[11px] font-extrabold text-(--text-amber-brand)">{word.category}</span>
              
              <span class="inline-flex items-center gap-1 text-xs font-bold text-(--brand-primary) group-hover:underline py-0.5">
                <span>Szczegóły</span>
                <Icon icon="ph:book-open-bold" class="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="rounded-2xl border border-dashed border-(--border-default) bg-(--bg-surface-elevated) p-6 sm:p-8 text-center">
        <p class="text-xs font-bold text-body-muted">
          Nie rozpocząłeś jeszcze nauki słówek z wybranymi filtrami. Przejdź do zakładki Lekcja!
        </p>
      </div>
    {/if}
  </div>

  <!-- SEKCJA 2: ZABLOKOWANE SŁÓWKA -->
  <div class="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
    <div class="flex items-center justify-between border-b border-(--border-default) pb-2">
      <div class="flex items-center gap-2">
        <Icon icon="ph:lock-key-bold" class="h-5 w-5 text-(--brand-primary) shrink-0" />
        <h3 class="title-serif text-lg sm:text-xl">
          Oczekujące na Odblokowanie ({filteredLockedWords.length})
        </h3>
      </div>
    </div>

    {#if filteredLockedWords.length > 0}
      <div class="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {#each filteredLockedWords as word}
          <div
            class="relative flex flex-col justify-between rounded-2xl border border-dashed border-(--border-default) bg-(--bg-surface-elevated) p-4 sm:p-5 opacity-90"
          >
            <div>
              <div class="flex items-start justify-between gap-2">
                <h4 class="title-serif text-base sm:text-lg text-body-muted">
                  {word.word}
                </h4>
                <span class="inline-flex items-center gap-1 rounded-full border border-(--border-default) bg-(--bg-surface) px-2 py-0.5 text-[10px] font-extrabold text-body-muted shrink-0">
                  <Icon icon="ph:lock-key-bold" class="h-3 w-3" />
                  <span>Zablokowane</span>
                </span>
              </div>

              {#if word.phonetic}
                <p class="mt-0.5 text-xs italic font-bold text-body-muted">{word.phonetic}</p>
              {/if}

              <!-- Ukryty podgląd definicji -->
              <p class="mt-2 text-xs font-semibold text-body-muted italic blur-[3px] select-none line-clamp-2">
                {word.shortDefinition}
              </p>
            </div>

            <div class="mt-3 flex items-center justify-between border-t border-(--border-default) pt-2.5">
              <span class="text-[11px] font-bold text-body-muted">{word.category}</span>
              <span class="text-[10px] font-extrabold text-(--brand-primary)">Poznasz w lekcji</span>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="rounded-2xl border border-dashed border-(--border-default) bg-(--bg-surface-elevated) p-6 text-center">
        <p class="text-xs font-bold text-body-muted">
          Wszystkie słówka z wybranej kategorii zostały już odblokowane!
        </p>
      </div>
    {/if}
  </div>

  {#if activeWord}
    <div
      role="button"
      tabindex="-1"
      onclick={() => (activeWord = null)}
      onkeydown={(e) => e.key === 'Escape' && (activeWord = null)}
      class="sheet-backdrop sm:modal-backdrop cursor-pointer"
    >
      <div
        role="dialog"
        aria-modal="true"
        tabindex="0"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
        class="sheet-container sm:modal-container cursor-default max-w-xl"
      >
        <!-- Uchwyt przeciągania na mobile -->
        <div class="sheet-handle sm:hidden"></div>

        <!-- Nagłówek -->
        <div class="flex items-start justify-between border-b border-(--border-default) px-5 py-4 sm:px-6 shrink-0">
          <div>
            <h2 class="title-serif text-2xl wrap-break-word">{activeWord.word}</h2>
            {#if activeWord.phonetic}
              <p class="text-xs font-bold text-(--text-muted) italic mt-0.5">{activeWord.phonetic}</p>
            {/if}
          </div>
          <button
            type="button"
            onclick={() => (activeWord = null)}
            class="rounded-lg p-1.5 text-(--text-muted) hover:bg-(--bg-surface-muted) hover:text-(--text-primary) transition-colors ml-2 shrink-0"
            aria-label="Zamknij"
          >
            <Icon icon="ph:x-bold" class="h-5 w-5" />
          </button>
        </div>

        <!-- Treść przewijalna -->
        <div class="overflow-y-auto flex-1 px-5 py-4 sm:px-6 space-y-4 sm:space-y-5">
          <div>
            <h3 class="text-xs font-extrabold text-(--brand-primary) uppercase">Pełna Definicja</h3>
            <p class="mt-1.5 text-sm font-semibold text-body-primary leading-relaxed">{activeWord.fullDefinition}</p>
          </div>

          {#if activeWord.etymology}
            <div>
              <h3 class="text-xs font-extrabold text-body-muted uppercase">Etymologia</h3>
              <p class="mt-1 text-xs font-semibold text-body-primary">{activeWord.etymology}</p>
            </div>
          {/if}

          {#if activeWord.examples && activeWord.examples.length > 0}
            <div>
              <h3 class="text-xs font-extrabold text-body-muted uppercase">Przykłady z literatury</h3>
              <div class="mt-1.5 space-y-2">
                {#each activeWord.examples as ex}
                  <blockquote class="border-l-4 border-(--brand-primary) bg-(--bg-surface-elevated) p-3 rounded-r-xl font-sans text-xs font-semibold text-body-primary leading-relaxed">
                    "{ex}"
                  </blockquote>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- Stopka -->
        {#if activeWord.sjpUrl}
          <div class="flex items-center justify-between border-t border-(--border-default) bg-(--bg-surface-elevated) px-5 py-3.5 sm:px-6 shrink-0">
            <a
              href={activeWord.sjpUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-xs font-bold text-(--brand-primary) hover:underline py-1 w-full justify-center"
            >
              <span>Otwórz w SJP PWN</span>
              <Icon icon="ph:arrow-square-out-bold" class="h-4 w-4" />
            </a>
          </div>
        {/if}

      </div>
    </div>
  {/if}

</div>
