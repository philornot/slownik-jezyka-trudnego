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
  class="app-card w-full max-w-2xl overflow-hidden shadow-xl transition-all duration-300"
>
  <!-- Nagłówek karty -->
  <div
    class="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-surface-elevated)] px-6 py-3"
  >
    <span class="badge-amber">
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

  <div class="p-6 sm:p-8 space-y-6">
    <!-- Słowo główne i wymowa -->
    <div class="text-center">
      <h2
        class="title-serif text-3xl tracking-wide sm:text-4xl"
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

        <div class="grid gap-3 sm:grid-cols-1">
          {#each card.options as option, index}
            <button
              type="button"
              onclick={() => handleSelectOption(option)}
              class="app-card-interactive group flex items-start gap-3 bg-[var(--bg-surface-elevated)] p-4 text-left"
            >
              <span
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs font-extrabold text-[var(--text-primary)] group-hover:border-[var(--brand-primary)] group-hover:text-[var(--text-amber-brand)]"
              >
                {String.fromCharCode(65 + index)}
              </span>
              <span
                class="text-sm font-semibold text-[var(--text-primary)]"
              >
                {option}
              </span>
            </button>
          {/each}
        </div>
      </div>

      <!-- ETAP 2: ODSŁONIĘCIE KONTEKSTU I SAMOOCENA -->
    {:else}
      <div class="space-y-6 animate-in fade-in duration-300">
        <!-- Wynik z quizu -->
        <div
          class="flex items-center justify-center gap-2 rounded-xl p-3.5 text-sm font-bold {isCorrect
            ? 'bg-[var(--emerald-bg)] text-[var(--emerald-text)] border border-[var(--emerald-border)]'
            : 'bg-[var(--rose-bg)] text-[var(--rose-text)] border border-[var(--rose-border)]'}"
        >
          {#if isCorrect}
            <Icon
              icon="ph:check-circle-bold"
              class="h-5 w-5 text-[var(--emerald-icon)]"
            />
            <span>Świetnie! Poprawna odpowiedź.</span>
          {:else}
            <Icon icon="ph:x-circle-bold" class="h-5 w-5 text-[var(--rose-icon)]" />
            <span
              >Twój wybór różni się od definicji. Zobacz szczegóły poniżej.</span
            >
          {/if}
        </div>

        <!-- Definicja i Etymologia -->
        <div
          class="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-5"
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
                class="mt-1 text-xs font-semibold text-[var(--text-secondary)]"
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
              class="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-amber-brand)] hover:underline"
            >
              <span>Zobacz w SJP PWN</span>
              <Icon icon="ph:arrow-square-out-bold" class="h-4 w-4" />
            </a>
          </div>
        {/if}

        <!-- PRZYCISKI SAMOOCENY -->
        <div class="border-t border-[var(--border-default)] pt-6">
          <p
            class="mb-3 text-center text-xs font-extrabold tracking-wider text-[var(--text-muted)] uppercase"
          >
            Jak dobrze pamiętasz to słówko?
          </p>

          <div class="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            <!-- Bardzo trudne (Ocena 0) -->
            <button
              type="button"
              onclick={() => handleSelfGrade(0)}
              class="flex items-center justify-center rounded-xl border border-[var(--rose-border)] bg-[var(--rose-bg)] py-3.5 px-3 font-extrabold text-xs sm:text-sm text-[var(--rose-text)] transition-all hover:opacity-80 shadow-xs"
            >
              <span>Bardzo trudne</span>
            </button>

            <!-- Trudne (Ocena 3) -->
            <button
              type="button"
              onclick={() => handleSelfGrade(3)}
              class="flex items-center justify-center rounded-xl border border-[var(--badge-amber-border)] bg-[var(--badge-amber-bg)] py-3.5 px-3 font-extrabold text-xs sm:text-sm text-[var(--badge-amber-text)] transition-all hover:opacity-80 shadow-xs"
            >
              <span>Trudne</span>
            </button>

            <!-- Średnie (Ocena 4) -->
            <button
              type="button"
              onclick={() => handleSelfGrade(4)}
              class="flex items-center justify-center rounded-xl border border-[var(--blue-border)] bg-[var(--blue-bg)] py-3.5 px-3 font-extrabold text-xs sm:text-sm text-[var(--blue-text)] transition-all hover:opacity-80 shadow-xs"
            >
              <span>Średnie</span>
            </button>

            <!-- Łatwe (Ocena 5) -->
            <button
              type="button"
              onclick={() => handleSelfGrade(5)}
              class="flex items-center justify-center rounded-xl border border-[var(--emerald-border)] bg-[var(--emerald-bg)] py-3.5 px-3 font-extrabold text-xs sm:text-sm text-[var(--emerald-text)] transition-all hover:opacity-80 shadow-xs"
            >
              <span>Łatwe</span>
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
