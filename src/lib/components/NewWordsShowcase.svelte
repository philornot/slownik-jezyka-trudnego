<script lang="ts">
  import type { DictionaryWord } from "../types";
  import Icon from "@iconify/svelte";

  interface Props {
    words: DictionaryWord[];
    onFinishShowcase: () => void;
  }

  let { words, onFinishShowcase }: Props = $props();

  let currentIndex = $state(0);
  let currentWord = $derived(words[currentIndex]);

  // Stan odsłonięcia definicji (domyślnie zamazana dla każdego nowego słowa)
  let isRevealed = $state(false);

  function handleReveal() {
    isRevealed = true;
  }

  function handleNextWord() {
    if (currentIndex + 1 < words.length) {
      currentIndex++;
      isRevealed = false;
    } else {
      onFinishShowcase();
    }
  }
</script>

<div
  class="app-card w-full max-w-2xl overflow-hidden border-[var(--border-amber)] shadow-2xl transition-all duration-300"
>
  <!-- Nagłówek Prezentacji Nowych Słów -->
  <div
    class="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--icon-bg-amber)] px-6 py-3.5"
  >
    <div class="flex items-center gap-2">
      <Icon icon="ph:sparkle-bold" class="h-5 w-5 text-[var(--text-amber-brand)]" />
      <span
        class="text-xs font-extrabold tracking-wider text-[var(--text-amber-brand)] uppercase"
      >
        Faza 1: Prezentacja Nowych Słów ({currentIndex + 1} z {words.length})
      </span>
    </div>

    <!-- Pasek minipostępu -->
    <div class="flex items-center gap-1.5">
      {#each words as _, idx}
        <div
          class="h-2 w-5 rounded-full transition-all {idx === currentIndex
            ? 'bg-[var(--brand-primary)]'
            : idx < currentIndex
              ? 'bg-[var(--bar-secondary)]'
              : 'bg-[var(--progress-track)]'}"
        ></div>
      {/each}
    </div>
  </div>

  <div class="p-6 sm:p-8 space-y-6">
    <!-- Słowo i wymowa -->
    <div class="text-center">
      <h2
        class="title-serif text-3xl tracking-wide sm:text-4xl"
      >
        {currentWord.word}
      </h2>
      {#if currentWord.phonetic}
        <p
          class="mt-1 text-sm tracking-widest text-[var(--text-muted)] italic font-bold"
        >
          {currentWord.phonetic}
        </p>
      {/if}
      <span
        class="mt-2 inline-block badge-amber"
      >
        Kategoria: {currentWord.category}
      </span>
    </div>

    <!-- DEFINICJA PEŁNA (ZAMAZANA DO MOMENTU KLIKNIĘCIA) -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <h3
          class="text-xs font-extrabold tracking-wider text-[var(--brand-primary)] uppercase"
        >
          Definicja i znaczenie
        </h3>
        {#if !isRevealed}
          <span
            class="inline-flex items-center gap-1 text-[11px] font-extrabold text-[var(--brand-primary)] animate-pulse"
          >
            <Icon icon="ph:eye-bold" class="h-4 w-4" />
            <span>Kliknij pole poniżej, aby odsłonić</span>
          </span>
        {/if}
      </div>

      <!-- Karta definicji do kliknięcia -->
      <div
        role="button"
        tabindex="0"
        onclick={handleReveal}
        onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleReveal()}
        class="relative min-h-[90px] rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-5 shadow-xs transition-all cursor-pointer group hover:border-[var(--brand-primary)]"
      >
        <p
          class="text-base leading-relaxed font-semibold transition-all duration-300 {isRevealed
            ? 'text-[var(--text-primary)] blur-none'
            : 'text-transparent select-none blur-md group-hover:blur-sm'}"
        >
          {currentWord.fullDefinition}
        </p>

        <!-- Przycisk z kłódką/okiem zachęcający do kliknięcia -->
        {#if !isRevealed}
          <div
            class="absolute inset-0 flex items-center justify-center rounded-xl bg-[var(--brand-primary)]/15 backdrop-blur-[2px] transition-all group-hover:bg-[var(--brand-primary)]/20"
          >
            <div
              class="btn-primary"
            >
              <Icon icon="ph:eye-bold" class="h-4 w-4" />
              <span>Kliknij, aby odsłonić definicję</span>
            </div>
          </div>
        {/if}
      </div>

      {#if currentWord.etymology}
        <div
          class="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-4"
        >
          <h4
            class="text-xs font-extrabold text-[var(--text-muted)] uppercase"
          >
            Etymologia
          </h4>
          <p
            class="mt-1 text-xs font-semibold text-[var(--text-secondary)]"
          >
            {currentWord.etymology}
          </p>
        </div>
      {/if}
    </div>

    <!-- Przykłady zdań (widoczne zawsze) -->
    {#if currentWord.examples && currentWord.examples.length > 0}
      <div class="space-y-2">
        <h3
          class="text-xs font-extrabold tracking-wider text-[var(--text-muted)] uppercase"
        >
          Przykłady użycia
        </h3>
        <div class="space-y-2">
          {#each currentWord.examples as example}
            <blockquote
              class="border-l-4 border-[var(--brand-primary)] bg-[var(--blockquote-bg)] py-3 px-4 rounded-r-xl font-sans text-sm font-semibold leading-relaxed text-[var(--blockquote-text)]"
            >
              "{example}"
            </blockquote>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Odnośnik PWN i Przycisk Przejścia -->
    <div
      class="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--border-default)] pt-5"
    >
      {#if currentWord.sjpUrl}
        <a
          href={currentWord.sjpUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-amber-brand)] hover:underline"
        >
          <span>Zobacz w SJP PWN</span>
          <Icon icon="ph:arrow-square-out-bold" class="h-4 w-4" />
        </a>
      {:else}
        <div></div>
      {/if}

      <button
        type="button"
        onclick={handleNextWord}
        class="btn-primary w-full sm:w-auto px-6 py-2.5 shadow-lg"
      >
        {#if currentIndex + 1 < words.length}
          <span>Następne słowo</span>
          <Icon icon="ph:arrow-right-bold" class="h-4 w-4" />
        {:else}
          <span>Przejdź do testu wiedzy</span>
          <Icon icon="ph:check-bold" class="h-4 w-4" />
        {/if}
      </button>
    </div>
  </div>
</div>
