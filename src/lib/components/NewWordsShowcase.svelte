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
  class="w-full sm:max-w-2xl border-y sm:border border-(--border-default) bg-(--bg-surface) sm:rounded-2xl sm:shadow-2xl transition-all duration-300"
>
  <!-- Nagłówek Prezentacji Nowych Słów -->
  <div
    class="flex items-center justify-between border-b border-(--border-default) bg-(--bg-surface-elevated) px-4 sm:px-6 py-3.5 sm:rounded-t-2xl"
  >
    <div class="flex items-center gap-2">
      <Icon icon="ph:sparkle-bold" class="h-4 w-4 text-(--brand-primary) shrink-0" />
      <span
        class="text-xs font-bold tracking-wider text-(--text-primary) uppercase"
      >
        Prezentacja ({currentIndex + 1}/{words.length})
      </span>
    </div>

    <!-- Pasek minipostępu -->
    <div class="flex items-center gap-1.5">
      {#each words as _, idx}
        <div
          class="h-2 w-4 sm:w-5 rounded-full transition-all {idx === currentIndex
            ? 'bg-(--brand-primary)'
            : idx < currentIndex
              ? 'bg-(--bar-secondary)'
              : 'bg-(--progress-track)'}"
        ></div>
      {/each}
    </div>
  </div>

  <div class="p-4 sm:p-8 space-y-5 sm:space-y-6 pb-24 sm:pb-6">
    <!-- Słowo i wymowa -->
    <div class="text-center py-2 sm:py-0">
      <h2
        class="title-serif text-2xl sm:text-4xl tracking-wide wrap-break-word"
      >
        {currentWord.word}
      </h2>
      {#if currentWord.phonetic}
        <p
          class="mt-1 text-sm tracking-widest text-(--text-muted) italic font-bold"
        >
          {currentWord.phonetic}
        </p>
      {/if}
      <span
        class="mt-2 inline-block badge-neutral"
      >
        Kategoria: {currentWord.category}
      </span>
    </div>

    <!-- DEFINICJA PEŁNA (ZAMAZANA DO MOMENTU KLIKNIĘCIA) -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <h3
          class="text-xs font-extrabold tracking-wider text-(--brand-primary) uppercase"
        >
          Definicja i znaczenie
        </h3>
        {#if !isRevealed}
          <span
            class="inline-flex items-center gap-1 text-[11px] font-extrabold text-(--brand-primary) animate-pulse"
          >
            <Icon icon="ph:eye-bold" class="h-4 w-4" />
            <span>Stuknij, aby odsłonić</span>
          </span>
        {/if}
      </div>

      <!-- Karta definicji do kliknięcia -->
      <div
        role="button"
        tabindex="0"
        onclick={handleReveal}
        onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleReveal()}
        class="relative min-h-25 rounded-xl border border-(--border-default) bg-(--bg-surface-elevated) p-4 sm:p-5 shadow-xs transition-all cursor-pointer group hover:border-(--brand-primary)"
      >
        <p
          class="text-base leading-relaxed font-semibold transition-all duration-300 {isRevealed
            ? 'text-(--text-primary) blur-none'
            : 'text-transparent select-none blur-md group-hover:blur-sm'}"
        >
          {currentWord.fullDefinition}
        </p>

        <!-- Przycisk z kłódką/okiem zachęcający do kliknięcia -->
        {#if !isRevealed}
          <div
            class="absolute inset-0 flex items-center justify-center rounded-xl bg-(--brand-primary)/15 backdrop-blur-[2px] transition-all group-hover:bg-(--brand-primary)/20 p-4"
          >
            <div
              class="btn-primary py-2.5 px-4 text-xs sm:text-sm text-center"
            >
              <Icon icon="ph:eye-bold" class="h-4 w-4 shrink-0" />
              <span>Stuknij, aby odsłonić definicję</span>
            </div>
          </div>
        {/if}
      </div>

      {#if currentWord.etymology}
        <div
          class="rounded-xl border border-(--border-default) bg-(--bg-surface-elevated) p-4"
        >
          <h4
            class="text-xs font-extrabold text-(--text-muted) uppercase"
          >
            Etymologia
          </h4>
          <p
            class="mt-1 text-xs font-semibold text-(--text-secondary)"
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
          class="text-xs font-extrabold tracking-wider text-(--text-muted) uppercase"
        >
          Przykłady użycia
        </h3>
        <div class="space-y-2">
          {#each currentWord.examples as example}
            <blockquote
              class="border-l-4 border-(--brand-primary) bg-(--blockquote-bg) py-3 px-4 rounded-r-xl font-sans text-sm font-semibold leading-relaxed text-(--blockquote-text)"
            >
              "{example}"
            </blockquote>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Odnośnik PWN i Przycisk Przejścia (Dokowane na dole na mobile) -->
    <div
      class="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 border-t border-(--border-default) bg-(--bg-surface)/95 backdrop-blur-md px-4 py-3 shadow-2xl sm:relative sm:bottom-auto sm:z-auto sm:border-t sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 sm:pt-5"
    >
      {#if currentWord.sjpUrl}
        <a
          href={currentWord.sjpUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-xs font-bold text-(--text-amber-brand) hover:underline py-1"
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
        class="btn-touch sm:w-auto sm:px-6"
      >
        {#if currentIndex + 1 < words.length}
          <span>Następne słowo</span>
          <Icon icon="ph:arrow-right-bold" class="h-5 w-5" />
        {:else}
          <span>Przejdź do testu wiedzy</span>
          <Icon icon="ph:check-bold" class="h-5 w-5" />
        {/if}
      </button>
    </div>
  </div>
</div>
