<script lang="ts">
  import type { SessionCard, ReviewGrade } from "../types";
  import Icon from "@iconify/svelte";

  interface Props {
    card: SessionCard;
    onGrade: (grade: ReviewGrade) => void;
  }

  let { card, onGrade }: Props = $props();

  // Flaga czy użytkownik wybrał już odpowiedź w quizie
  let selectedOption = $state<string | null>(null);
  let isAnswered = $derived(selectedOption !== null);
  let isCorrect = $derived(selectedOption === card.word.shortDefinition);

  // Reset stanu po zmianie karty słówka
  $effect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    card.word.id;
    selectedOption = null;
  });

  function handleSelectOption(option: string) {
    selectedOption = option;
  }

  function handleSelfGrade(grade: ReviewGrade) {
    onGrade(grade);
    selectedOption = null;
  }
</script>

<div
  class="w-full sm:max-w-2xl border-y sm:border border-[var(--border-default)] bg-[var(--bg-surface)] sm:rounded-2xl sm:shadow-xl transition-all duration-300"
>
  <!-- Nagłówek karty -->
  <div
    class="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-surface-elevated)] px-4 sm:px-6 py-3 sm:rounded-t-2xl"
  >
    <span class="badge-neutral">
      {card.word.category || "Literackie"}
    </span>

    <div class="flex items-center gap-2">
      {#if card.isNew}
        <span class="badge-emerald">
          <Icon icon="ph:sparkle-bold" class="h-4 w-4" />
          <span>Nowo poznane słówko</span>
        </span>
      {:else}
        <span class="badge-amber">
          <Icon icon="ph:bookmark-bold" class="h-4 w-4" />
          <span>Powtórka</span>
        </span>
      {/if}
    </div>
  </div>

  <div class="p-4 sm:p-8 space-y-5 sm:space-y-6">
    <!-- Słowo główne i wymowa -->
    <div class="text-center py-2 sm:py-0">
      <h2
        class="title-serif text-2xl sm:text-4xl tracking-wide break-words"
      >
        {card.word.word}
      </h2>
      {#if card.word.phonetic}
        <p
          class="mt-1 text-sm tracking-widest text-[var(--text-muted)] italic font-bold"
        >
          {card.word.phonetic}
        </p>
      {/if}
    </div>

    <!-- ETAP 1: QUIZ AKTYWNEGO PRZYPOMINANIA -->
    {#if !isAnswered}
      <div class="space-y-4 animate-in fade-in duration-300">
        <p
          class="text-center text-xs font-extrabold tracking-wider text-[var(--text-primary)] uppercase"
        >
          Sprawdź pamięć: Wybierz właściwe znaczenie tego słowa
        </p>

        <div class="grid gap-3">
          {#each card.options as option, index}
            <button
              type="button"
              onclick={() => handleSelectOption(option)}
              class="app-card-interactive group flex items-start gap-3 bg-[var(--bg-surface-elevated)] p-4 sm:p-4 min-h-[56px] text-left active:scale-[0.99] transition-transform"
            >
              <span
                class="flex h-7 w-7 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs sm:text-xs font-extrabold text-[var(--text-primary)] group-hover:border-[var(--brand-primary)] group-hover:text-[var(--text-amber-brand)]"
              >
                {String.fromCharCode(65 + index)}
              </span>
              <span
                class="text-sm font-semibold leading-snug text-[var(--text-primary)] pt-0.5"
              >
                {option}
              </span>
            </button>
          {/each}
        </div>
      </div>

      <!-- ETAP 2: ODSŁONIĘCIE KONTEKSTU I SAMOOCENA -->
    {:else}
      <div class="space-y-4 sm:space-y-5 animate-in fade-in duration-300 pb-4 sm:pb-0">
        <!-- Wynik z quizu -->
        <div
          class="flex items-center justify-center gap-2 rounded-xl p-3.5 text-sm font-bold {isCorrect
            ? 'bg-[var(--emerald-bg)] text-[var(--emerald-text)] border border-[var(--emerald-border)]'
            : 'bg-[var(--rose-bg)] text-[var(--rose-text)] border border-[var(--rose-border)]'}"
        >
          {#if isCorrect}
            <Icon
              icon="ph:check-circle-bold"
              class="h-5 w-5 text-[var(--emerald-icon)] shrink-0"
            />
            <span>Świetnie! Poprawna odpowiedź.</span>
          {:else}
            <Icon icon="ph:x-circle-bold" class="h-5 w-5 text-[var(--rose-icon)] shrink-0" />
            <span
              >Twój wybór różni się od definicji. Zobacz szczegóły poniżej.</span
            >
          {/if}
        </div>

        <!-- Definicja i Etymologia -->
        <div
          class="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-4 sm:p-5"
        >
          <h3
            class="text-xs font-extrabold tracking-wider text-[var(--brand-primary)] uppercase"
          >
            Pełna Definicja
          </h3>
          <p
            class="mt-2 text-base leading-relaxed font-semibold text-[var(--text-primary)]"
          >
            {card.word.fullDefinition}
          </p>

          {#if card.word.etymology}
            <div
              class="mt-4 border-t border-[var(--border-default)] pt-3"
            >
              <h4
                class="text-xs font-extrabold text-[var(--text-muted)] uppercase"
              >
                Etymologia
              </h4>
              <p
                class="mt-1 text-xs sm:text-xs font-semibold text-[var(--text-secondary)]"
              >
                {card.word.etymology}
              </p>
            </div>
          {/if}
        </div>

        <!-- Czytelne przykłady zdań -->
        {#if card.word.examples && card.word.examples.length > 0}
          <div class="space-y-2">
            <h3
              class="text-xs font-extrabold tracking-wider text-[var(--text-muted)] uppercase"
            >
              Przykłady użycia w zdaniach
            </h3>
            <div class="space-y-2">
              {#each card.word.examples as example}
                <blockquote
                  class="border-l-4 border-[var(--brand-primary)] bg-[var(--blockquote-bg)] py-3 px-4 rounded-r-xl font-sans text-sm font-semibold leading-relaxed text-[var(--blockquote-text)]"
                >
                  "{example}"
                </blockquote>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Link PWN -->
        {#if card.word.sjpUrl}
          <div class="flex justify-end pt-1">
            <a
              href={card.word.sjpUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-amber-brand)] hover:underline py-1 px-2"
            >
              <span>Zobacz w SJP PWN</span>
              <Icon icon="ph:arrow-square-out-bold" class="h-4 w-4" />
            </a>
          </div>
        {/if}

        <!-- PRZYCISKI SAMOOCENY (Dokowane na dole nad paska nawigacji na mobile) -->
        <div class="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 border-t-2 border-[var(--brand-primary)]/30 bg-[var(--bg-surface)]/97 backdrop-blur-md px-3.5 py-3 shadow-2xl sm:relative sm:bottom-auto sm:z-auto sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none pt-3 sm:pt-6">

          <!-- CTA: instrukcja dla użytkownika -->
          <div class="mb-2.5 sm:mb-3 flex flex-col items-center gap-0.5">
            <p class="text-xs sm:text-sm font-extrabold tracking-wide text-[var(--text-primary)]">
              Oceń, jak dobrze pamiętasz to słówko
            </p>
            <p class="text-[11px] font-semibold text-[var(--text-muted)]">
              Kliknij przycisk, żeby przejść dalej
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2 sm:gap-3.5 sm:grid-cols-4 max-w-2xl mx-auto">
            <!-- Bardzo słabo (Ocena 0 - Czerwony/Różowy) -->
            <button
              type="button"
              onclick={() => handleSelfGrade(0)}
              class="flex min-h-[52px] sm:min-h-[56px] flex-col items-center justify-center rounded-xl border border-[var(--grade-0-border)] bg-[var(--grade-0-bg)] py-2.5 px-2 text-center transition-all active:scale-[0.96] hover:opacity-85 hover:shadow-md shadow-xs gap-0.5"
            >
              <span class="text-base leading-none">😰</span>
              <span class="font-extrabold text-xs sm:text-sm text-[var(--grade-0-text)]">Bardzo słabo</span>
            </button>

            <!-- Słabo (Ocena 3 - Bursztynowy/Pomarańczowy) -->
            <button
              type="button"
              onclick={() => handleSelfGrade(3)}
              class="flex min-h-[52px] sm:min-h-[56px] flex-col items-center justify-center rounded-xl border border-[var(--grade-3-border)] bg-[var(--grade-3-bg)] py-2.5 px-2 text-center transition-all active:scale-[0.96] hover:opacity-85 hover:shadow-md shadow-xs gap-0.5"
            >
              <span class="text-base leading-none">😕</span>
              <span class="font-extrabold text-xs sm:text-sm text-[var(--grade-3-text)]">Słabo</span>
            </button>

            <!-- Dobrze (Ocena 4 - Stonowany Błękit) -->
            <button
              type="button"
              onclick={() => handleSelfGrade(4)}
              class="flex min-h-[52px] sm:min-h-[56px] flex-col items-center justify-center rounded-xl border border-[var(--grade-4-border)] bg-[var(--grade-4-bg)] py-2.5 px-2 text-center transition-all active:scale-[0.96] hover:opacity-85 hover:shadow-md shadow-xs gap-0.5"
            >
              <span class="text-base leading-none">🙂</span>
              <span class="font-extrabold text-xs sm:text-sm text-[var(--grade-4-text)]">Dobrze</span>
            </button>

            <!-- Bardzo dobrze (Ocena 5 - Szmaragdowa Zieleń) -->
            <button
              type="button"
              onclick={() => handleSelfGrade(5)}
              class="flex min-h-[52px] sm:min-h-[56px] flex-col items-center justify-center rounded-xl border border-[var(--grade-5-border)] bg-[var(--grade-5-bg)] py-2.5 px-2 text-center transition-all active:scale-[0.96] hover:opacity-85 hover:shadow-md shadow-xs gap-0.5"
            >
              <span class="text-base leading-none">🤩</span>
              <span class="font-extrabold text-xs sm:text-sm text-[var(--grade-5-text)]">Bardzo dobrze</span>
            </button>
          </div>
        </div>

      </div>
    {/if}
  </div>
</div>
