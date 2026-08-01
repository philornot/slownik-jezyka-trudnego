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
  class="w-full sm:max-w-2xl border-y sm:border border-(--border-default) bg-(--bg-surface) sm:rounded-2xl sm:shadow-xl transition-all duration-300"
>
  <!-- Nagłówek karty -->
  <div
    class="flex items-center justify-between border-b border-(--border-default) bg-(--bg-surface-elevated) px-4 sm:px-6 py-3 sm:rounded-t-2xl"
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
        class="title-serif text-2xl sm:text-4xl tracking-wide wrap-break-word"
      >
        {card.word.word}
      </h2>
      {#if card.word.phonetic}
        <p
          class="mt-1 text-sm tracking-widest text-(--text-muted) italic font-bold"
        >
          {card.word.phonetic}
        </p>
      {/if}
    </div>

    <!-- ETAP 1: QUIZ AKTYWNEGO PRZYPOMINANIA -->
    {#if !isAnswered}
      <div class="space-y-4 animate-in fade-in duration-300">
        <p
          class="text-center text-xs font-extrabold tracking-wider text-(--text-primary) uppercase"
        >
          Sprawdź pamięć: Wybierz właściwe znaczenie tego słowa
        </p>

        <div class="grid gap-3">
          {#each card.options as option, index}
            <button
              type="button"
              onclick={() => handleSelectOption(option)}
              class="app-card-interactive group flex items-start gap-3 bg-(--bg-surface-elevated) p-4 min-h-14 text-left active:scale-[0.99] transition-transform"
            >
              <span
                class="flex h-7 w-7 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-lg border border-(--border-default) bg-(--bg-surface) text-xs font-extrabold text-(--text-primary) group-hover:border-(--brand-primary) group-hover:text-(--text-amber-brand)"
              >
                {String.fromCharCode(65 + index)}
              </span>
              <span
                class="text-sm font-semibold leading-snug text-(--text-primary) pt-0.5"
              >
                {option}
              </span>
            </button>
          {/each}
        </div>
      </div>

    <!-- ETAP 2: ODSŁONIĘCIE KONTEKSTU I SAMOOCENA -->
    {:else}
      <div class="space-y-4 sm:space-y-5 animate-in fade-in duration-300">
        <!-- Wynik z quizu -->
        <div
          class="flex items-center justify-center gap-2 rounded-xl p-3.5 text-sm font-bold {isCorrect
            ? 'bg-(--emerald-bg) text-(--emerald-text) border border-(--emerald-border)'
            : 'bg-(--rose-bg) text-(--rose-text) border border-(--rose-border)'}"
        >
          {#if isCorrect}
            <Icon
              icon="ph:check-circle-bold"
              class="h-5 w-5 text-(--emerald-icon) shrink-0"
            />
            <span>Świetnie! Poprawna odpowiedź.</span>
          {:else}
            <Icon icon="ph:x-circle-bold" class="h-5 w-5 text-(--rose-icon) shrink-0" />
            <span>Twój wybór różni się od definicji. Zobacz szczegóły poniżej.</span>
          {/if}
        </div>

        <!-- Definicja i Etymologia -->
        <div
          class="rounded-xl border border-(--border-default) bg-(--bg-surface-elevated) p-4 sm:p-5"
        >
          <h3
            class="text-xs font-extrabold tracking-wider text-(--brand-primary) uppercase"
          >
            Pełna Definicja
          </h3>
          <p
            class="mt-2 text-base leading-relaxed font-semibold text-(--text-primary)"
          >
            {card.word.fullDefinition}
          </p>

          {#if card.word.etymology}
            <div
              class="mt-4 border-t border-(--border-default) pt-3"
            >
              <h4
                class="text-xs font-extrabold text-(--text-muted) uppercase"
              >
                Etymologia
              </h4>
              <p
                class="mt-1 text-xs font-semibold text-(--text-secondary)"
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
              class="text-xs font-extrabold tracking-wider text-(--text-muted) uppercase"
            >
              Przykłady użycia w zdaniach
            </h3>
            <div class="space-y-2">
              {#each card.word.examples as example}
                <blockquote
                  class="border-l-4 border-(--brand-primary) bg-(--blockquote-bg) py-3 px-4 rounded-r-xl font-sans text-sm font-semibold leading-relaxed text-(--blockquote-text)"
                >
                  "{example}"
                </blockquote>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Link PWN -->
        {#if card.word.sjpUrl}
          <div class="flex justify-end">
            <a
              href={card.word.sjpUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-xs font-bold text-(--text-amber-brand) hover:underline py-1 px-2"
            >
              <span>Zobacz w SJP PWN</span>
              <Icon icon="ph:arrow-square-out-bold" class="h-4 w-4" />
            </a>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- PRZYCISKI SAMOOCENY – stopka karty, bez fixed -->
  {#if isAnswered}
    <div class="border-t border-(--border-default) bg-(--bg-surface-elevated) px-4 sm:px-6 py-4 sm:rounded-b-2xl">
      <!-- CTA -->
      <div class="mb-3 text-center">
        <p class="text-xs sm:text-sm font-extrabold text-(--text-primary)">
          Oceń, jak dobrze pamiętasz to słówko
        </p>
        <p class="text-[11px] font-semibold text-(--text-muted) mt-0.5">
          Kliknij przycisk, żeby przejść dalej
        </p>
      </div>

      <div class="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
        <!-- Bardzo słabo (Ocena 0) -->
        <button
          type="button"
          onclick={() => handleSelfGrade(0)}
          class="flex min-h-13 sm:min-h-14 flex-col items-center justify-center rounded-xl border border-(--grade-0-border) bg-(--grade-0-bg) py-2.5 px-2 text-center transition-all active:scale-[0.96] hover:opacity-85 hover:shadow-md shadow-xs gap-1"
        >
          <Icon icon="ph:x-circle-bold" class="h-5 w-5 text-(--grade-0-text)" />
          <span class="font-extrabold text-xs sm:text-sm text-(--grade-0-text)">Bardzo słabo</span>
        </button>

        <!-- Słabo (Ocena 3) -->
        <button
          type="button"
          onclick={() => handleSelfGrade(3)}
          class="flex min-h-13 sm:min-h-14 flex-col items-center justify-center rounded-xl border border-(--grade-3-border) bg-(--grade-3-bg) py-2.5 px-2 text-center transition-all active:scale-[0.96] hover:opacity-85 hover:shadow-md shadow-xs gap-1"
        >
          <Icon icon="ph:minus-circle-bold" class="h-5 w-5 text-(--grade-3-text)" />
          <span class="font-extrabold text-xs sm:text-sm text-(--grade-3-text)">Słabo</span>
        </button>

        <!-- Dobrze (Ocena 4) -->
        <button
          type="button"
          onclick={() => handleSelfGrade(4)}
          class="flex min-h-13 sm:min-h-14 flex-col items-center justify-center rounded-xl border border-(--grade-4-border) bg-(--grade-4-bg) py-2.5 px-2 text-center transition-all active:scale-[0.96] hover:opacity-85 hover:shadow-md shadow-xs gap-1"
        >
          <Icon icon="ph:check-circle-bold" class="h-5 w-5 text-(--grade-4-text)" />
          <span class="font-extrabold text-xs sm:text-sm text-(--grade-4-text)">Dobrze</span>
        </button>

        <!-- Bardzo dobrze (Ocena 5) -->
        <button
          type="button"
          onclick={() => handleSelfGrade(5)}
          class="flex min-h-13 sm:min-h-14 flex-col items-center justify-center rounded-xl border border-(--grade-5-border) bg-(--grade-5-bg) py-2.5 px-2 text-center transition-all active:scale-[0.96] hover:opacity-85 hover:shadow-md shadow-xs gap-1"
        >
          <Icon icon="ph:star-bold" class="h-5 w-5 text-(--grade-5-text)" />
          <span class="font-extrabold text-xs sm:text-sm text-(--grade-5-text)">Bardzo dobrze</span>
        </button>
      </div>
    </div>
  {/if}
</div>
