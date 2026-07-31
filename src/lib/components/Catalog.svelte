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
      return { label: `Opanowane (${prog.repetitions} powt.)`, badgeClass: 'badge-emerald' };
    }
    return { label: `W trakcie nauki`, badgeClass: 'badge-amber' };
  }
</script>

<div class="mx-auto max-w-5xl space-y-6">

  <!-- Zwięzły pasek wyszukiwania i filtrów z tokenami -->
  <div class="app-card p-4 sm:p-5">
    <div class="flex flex-col gap-4 md:flex-row md:items-center justify-between">
      
      <!-- Szukajka -->
      <div class="relative flex-1">
        <Icon icon="ph:magnifying-glass-bold" class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-body-muted" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Szukaj w poznanych lub zablokowanych słówkach..."
          class="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] pl-10 pr-4 py-2.5 text-xs font-bold text-body-primary placeholder:text-body-muted focus:border-[var(--brand-primary)] focus:outline-hidden"
        />
      </div>

      <!-- Filtr Kategorii oraz dyskretny wskaźnik odblokowanych -->
      <div class="flex flex-wrap items-center gap-3">
        <select
          bind:value={selectedCategory}
          class="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] px-3.5 py-2.5 text-xs font-bold text-body-primary focus:border-[var(--brand-primary)] focus:outline-hidden"
        >
          <option value="all">Wszystkie kategorie</option>
          {#each categories as cat}
            <option value={cat}>{cat}</option>
          {/each}
        </select>

        <span class="badge-amber px-3.5 py-2.5 text-xs">
          <Icon icon="ph:sparkle-bold" class="h-4 w-4 text-[var(--brand-primary)]" />
          <span>Odblokowane: {unlockedWords.length} / {words.length}</span>
        </span>
      </div>

    </div>
  </div>

  <!-- SEKCJA 1: ODBLOKOWANE / POZNANE SŁÓWKA -->
  <div class="space-y-4">
    <div class="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
      <div class="flex items-center gap-2">
        <Icon icon="ph:check-circle-bold" class="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        <h3 class="title-serif text-xl">
          Poznane Słówka ({filteredUnlockedWords.length})
        </h3>
      </div>
    </div>

    {#if filteredUnlockedWords.length > 0}
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each filteredUnlockedWords as word}
          {@const status = getStatusBadge(word.id)}
          <!-- Klikalny kafelek ze spójną klasą -->
          <div
            role="button"
            tabindex="0"
            onclick={() => (activeWord = word)}
            onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (activeWord = word)}
            class="app-card-interactive group flex flex-col justify-between p-5"
          >
            <div>
              <div class="flex items-start justify-between gap-2">
                <h4 class="title-serif text-xl group-hover:text-[var(--brand-primary)] transition-colors">{word.word}</h4>
                {#if status}
                  <span class="{status.badgeClass} text-[10px] py-0.5">
                    {status.label}
                  </span>
                {/if}
              </div>

              {#if word.phonetic}
                <p class="mt-0.5 text-xs italic font-bold text-body-muted">{word.phonetic}</p>
              {/if}

              <p class="mt-3 text-xs font-semibold text-body-primary line-clamp-3 leading-relaxed">
                {word.shortDefinition}
              </p>
            </div>

            <div class="mt-5 flex items-center justify-between border-t border-[var(--border-default)] pt-3">
              <span class="text-[11px] font-extrabold text-[var(--text-amber-brand)]">{word.category}</span>
              
              <span class="inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-primary)] group-hover:underline">
                <span>Szczegóły</span>
                <Icon icon="ph:book-open-bold" class="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-8 text-center">
        <p class="text-xs font-bold text-body-muted">
          Nie rozpocząłeś jeszcze nauki słówek z wybranymi filtrami. Przejdź do zakładki Lekcja!
        </p>
      </div>
    {/if}
  </div>

  <!-- SEKCJA 2: ZABLOKOWANE SŁÓWKA -->
  <div class="space-y-4 pt-4">
    <div class="flex items-center justify-between border-b border-[var(--border-default)] pb-2">
      <div class="flex items-center gap-2">
        <Icon icon="ph:lock-key-bold" class="h-5 w-5 text-[#b45309] dark:text-amber-400" />
        <h3 class="title-serif text-xl">
          Oczekujące na Odblokowanie ({filteredLockedWords.length})
        </h3>
      </div>
    </div>

    {#if filteredLockedWords.length > 0}
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each filteredLockedWords as word}
          <div
            class="relative flex flex-col justify-between rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-5 opacity-90"
          >
            <div>
              <div class="flex items-start justify-between gap-2">
                <h4 class="title-serif text-lg text-body-muted">
                  {word.word}
                </h4>
                <span class="inline-flex items-center gap-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-0.5 text-[10px] font-extrabold text-body-muted">
                  <Icon icon="ph:lock-key-bold" class="h-3 w-3" />
                  <span>Zablokowane</span>
                </span>
              </div>

              {#if word.phonetic}
                <p class="mt-0.5 text-xs italic font-bold text-body-muted">{word.phonetic}</p>
              {/if}

              <!-- Ukryty podgląd definicji -->
              <p class="mt-3 text-xs font-semibold text-body-muted italic blur-[3px] select-none">
                {word.shortDefinition}
              </p>
            </div>

            <div class="mt-4 flex items-center justify-between border-t border-[var(--border-default)] pt-3">
              <span class="text-[11px] font-bold text-body-muted">{word.category}</span>
              <span class="text-[10px] font-extrabold text-[var(--brand-primary)]">Poznasz w lekcji</span>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-6 text-center">
        <p class="text-xs font-bold text-body-muted">
          Wszystkie słówka z wybranej kategorii zostały już odblokowane!
        </p>
      </div>
    {/if}
  </div>

  <!-- Modal Szczegółów Otwartych Słów -->
  {#if activeWord}
    <div
      role="button"
      tabindex="-1"
      onclick={() => (activeWord = null)}
      onkeydown={(e) => e.key === 'Escape' && (activeWord = null)}
      class="modal-backdrop cursor-pointer"
    >
      <div
        role="dialog"
        aria-modal="true"
        tabindex="0"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
        class="modal-container p-6 space-y-5 cursor-default"
      >
        
        <div class="flex items-start justify-between border-b border-[var(--border-default)] pb-4">
          <div>
            <h2 class="title-serif text-2xl">{activeWord.word}</h2>
            {#if activeWord.phonetic}
              <p class="text-xs font-bold text-body-muted italic">{activeWord.phonetic}</p>
            {/if}
          </div>
          <button
            type="button"
            onclick={() => (activeWord = null)}
            class="btn-secondary py-1 px-3"
          >
            Zamknij
          </button>
        </div>

        <div>
          <h3 class="text-xs font-extrabold text-[var(--brand-primary)] uppercase">Pełna Definicja</h3>
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
                <blockquote class="border-l-4 border-[var(--brand-primary)] bg-[var(--bg-surface-elevated)] p-3 rounded-r-xl font-sans text-xs font-semibold text-body-primary leading-relaxed">
                  "{ex}"
                </blockquote>
              {/each}
            </div>
          </div>
        {/if}

        <div class="flex items-center justify-between border-t border-[var(--border-default)] pt-4">
          <a
            href={activeWord.sjpUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand-primary)] hover:underline"
          >
            <span>Otwórz w SJP PWN</span>
            <Icon icon="ph:arrow-square-out-bold" class="h-4 w-4" />
          </a>

          <button
            type="button"
            onclick={() => (activeWord = null)}
            class="btn-primary"
          >
            Zamknij
          </button>
        </div>

      </div>
    </div>
  {/if}

</div>
