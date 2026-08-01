<script lang="ts">
  import type { DictionaryWord, UserWordProgress } from "../types";
  import Icon from "@iconify/svelte";

  interface Props {
    words?: DictionaryWord[];
    progressMap?: Record<string, UserWordProgress>;
    streakDays?: number;
  }

  let { words = [], progressMap = {}, streakDays = 1 }: Props = $props();

  let activeWord = $state<DictionaryWord | null>(null);

  let totalWords = $derived(words.length);
  let progressList = $derived(Object.values(progressMap));
  let learnedWords = $derived(
    progressList.filter((p) => p.repetitions >= 3).length,
  );
  let inProgressWords = $derived(
    progressList.filter((p) => p.repetitions < 3).length,
  );

  let totalReviewsPerformed = $derived(
    progressList.reduce((acc, curr) => acc + (curr.history?.length || 0), 0),
  );

  // Generowanie danych do wykresu 7 ostatnich dni
  let last7DaysData = $derived.by(() => {
    const days: {
      dateStr: string;
      label: string;
      count: number;
      isToday: boolean;
    }[] = [];
    const today = new Date();

    // Tworzymy mapę zliczeń powtórek per dzień YYYY-MM-DD
    const countByDate: Record<string, number> = {};
    for (const prog of progressList) {
      if (prog.history) {
        for (const h of prog.history) {
          if (h.date) {
            countByDate[h.date] = (countByDate[h.date] || 0) + 1;
          }
        }
      }
    }

    const dayNames = ["Niedz", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label = dayNames[d.getDay()];
      const count = countByDate[dateStr] || 0;
      days.push({
        dateStr,
        label: i === 0 ? "Dziś" : label,
        count,
        isToday: i === 0,
      });
    }

    return days;
  });

  let maxReviewsInLast7Days = $derived(
    Math.max(...last7DaysData.map((d) => d.count), 5),
  );

  let total7DaysReviews = $derived(
    last7DaysData.reduce((sum, d) => sum + d.count, 0),
  );

  // Podział znajomości słów wg 9 głównych kategorii
  let categoryStats = $derived.by(() => {
    const catsMap: Record<
      string,
      { total: number; learned: number; inProgress: number }
    > = {};

    for (const w of words) {
      const cat = w.category || "Inne";
      if (!catsMap[cat]) {
        catsMap[cat] = { total: 0, learned: 0, inProgress: 0 };
      }
      catsMap[cat].total++;

      const prog = progressMap[w.id];
      if (prog) {
        if (prog.repetitions >= 3) {
          catsMap[cat].learned++;
        } else {
          catsMap[cat].inProgress++;
        }
      }
    }

    return Object.entries(catsMap)
      .map(([name, stat]) => ({
        name,
        total: stat.total,
        learned: stat.learned,
        inProgress: stat.inProgress,
        unlocked: stat.learned + stat.inProgress,
        percentage: Math.round(
          ((stat.learned + stat.inProgress) / stat.total) * 100,
        ),
      }))
      .sort((a, b) => b.unlocked - a.unlocked);
  });

  // Najtrudniejsze słówka (niski easeFactor lub wysoka liczba ocen "Bardzo trudne")
  let hardestWords = $derived.by(() => {
    const entries: {
      word: DictionaryWord;
      easeFactor: number;
      reviews: number;
      hardCount: number;
    }[] = [];

    for (const w of words) {
      const prog = progressMap[w.id];
      if (prog) {
        const hardCount = prog.history
          ? prog.history.filter((h) => h.grade === 0).length
          : 0;
        if (
          hardCount > 0 ||
          prog.easeFactor < 2.4 ||
          (prog.history && prog.history.length >= 4 && prog.repetitions < 3)
        ) {
          entries.push({
            word: w,
            easeFactor: prog.easeFactor,
            reviews: prog.history ? prog.history.length : 0,
            hardCount,
          });
        }
      }
    }

    return entries
      .sort((a, b) => b.hardCount - a.hardCount || a.easeFactor - b.easeFactor)
      .slice(0, 5);
  });
</script>

<div class="mx-auto max-w-5xl space-y-4 sm:space-y-6 px-3 sm:px-0">
  <!-- SEKCJA 1: 4 Kluczowe Wskaźniki KPI (2 kolumny na mobile) -->
  <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
    <!-- Seria dni -->
    <div
      class="app-card border-[var(--border-amber)] p-3.5 sm:p-5 transition-all hover:border-[var(--brand-primary)]"
    >
      <div class="flex items-center justify-between">
        <span class="text-[11px] sm:text-xs font-extrabold text-[var(--text-amber-brand)]"
          >Seria Nauki</span
        >
        <div class="rounded-xl bg-[var(--icon-bg-amber)] p-1.5 sm:p-2">
          <Icon icon="ph:fire-bold" class="h-4 w-4 sm:h-5 sm:w-5 text-[var(--brand-primary)]" />
        </div>
      </div>
      <p
        class="mt-2 sm:mt-3 font-serif text-2xl sm:text-3xl font-bold text-[var(--text-serif-title)]"
      >
        {streakDays}
        {streakDays === 1 ? "dzień" : "dni"}
      </p>
      <p class="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-bold text-[var(--text-muted)] line-clamp-1">
        Codzienna dyscyplina
      </p>
    </div>

    <!-- Łączne powtórki -->
    <div
      class="app-card p-3.5 sm:p-5 transition-all hover:border-[var(--brand-primary)]"
    >
      <div class="flex items-center justify-between">
        <span class="text-[11px] sm:text-xs font-extrabold text-[var(--text-primary)]"
          >Powtórki</span
        >
        <div class="rounded-xl bg-[var(--icon-bg-stone)] p-1.5 sm:p-2">
          <Icon icon="ph:arrows-clockwise-bold" class="h-4 w-4 sm:h-5 sm:w-5 text-[var(--brand-primary)]" />
        </div>
      </div>
      <p
        class="mt-2 sm:mt-3 font-serif text-2xl sm:text-3xl font-bold text-[var(--text-serif-title)]"
      >
        {totalReviewsPerformed}
      </p>
      <p class="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-bold text-[var(--text-muted)] line-clamp-1">
        Liczba odpowiedzi
      </p>
    </div>

    <!-- Opanowane słowa -->
    <div
      class="app-card border-[var(--emerald-border)] p-3.5 sm:p-5 transition-all hover:border-[var(--emerald-icon)]"
    >
      <div class="flex items-center justify-between">
        <span class="text-[11px] sm:text-xs font-extrabold text-[var(--emerald-text)]"
          >Opanowane</span
        >
        <div class="rounded-xl bg-[var(--icon-bg-emerald)] p-1.5 sm:p-2">
          <Icon icon="ph:check-circle-bold" class="h-4 w-4 sm:h-5 sm:w-5 text-[var(--emerald-icon)]" />
        </div>
      </div>
      <p
        class="mt-2 sm:mt-3 font-serif text-2xl sm:text-3xl font-bold text-[var(--text-serif-title)]"
      >
        {learnedWords}
      </p>
      <p class="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-bold text-[var(--text-muted)] line-clamp-1">
        Trwale w pamięci
      </p>
    </div>

    <!-- W trakcie -->
    <div
      class="app-card border-[var(--border-amber)] p-3.5 sm:p-5 transition-all hover:border-[var(--brand-primary)]"
    >
      <div class="flex items-center justify-between">
        <span class="text-[11px] sm:text-xs font-extrabold text-[var(--text-amber-brand)]"
          >W Trakcie</span
        >
        <div class="rounded-xl bg-[var(--icon-bg-amber)] p-1.5 sm:p-2">
          <Icon icon="ph:clock-bold" class="h-4 w-4 sm:h-5 sm:w-5 text-[var(--brand-primary)]" />
        </div>
      </div>
      <p
        class="mt-2 sm:mt-3 font-serif text-2xl sm:text-3xl font-bold text-[var(--text-serif-title)]"
      >
        {inProgressWords}
      </p>
      <p class="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-bold text-[var(--text-muted)] line-clamp-1">
        Aktywnie utrwalane
      </p>
    </div>
  </div>

  <!-- SEKCJA 2: Wykres Aktywności z Ostatnich 7 Dni -->
  <div
    class="app-card p-4 sm:p-6 space-y-3 sm:space-y-4"
  >
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[var(--border-default)] pb-3"
    >
      <div class="flex items-center gap-2">
        <Icon icon="ph:trend-up-bold" class="h-5 w-5 text-[var(--brand-primary)] shrink-0" />
        <h3
          class="title-serif text-lg sm:text-xl"
        >
          Aktywność (Ostatnie 7 dni)
        </h3>
      </div>
      <span class="text-xs font-bold text-[var(--text-muted)]">
        W tym tygodniu: <strong
          class="text-[var(--text-amber-brand)]">{total7DaysReviews}</strong
        > powtórek
      </span>
    </div>

    <!-- Wykres słupkowy -->
    <div class="pt-2 sm:pt-4 pb-2">
      <div
        class="grid grid-cols-7 gap-1.5 sm:gap-4 items-end h-36 sm:h-40 border-b border-[var(--border-default)] pb-2"
      >
        {#each last7DaysData as day}
          {@const heightPercent = Math.max(
            (day.count / maxReviewsInLast7Days) * 100,
            day.count > 0 ? 12 : 4,
          )}
          <div
            class="flex flex-col items-center gap-2 h-full justify-end group relative"
          >
            <!-- Tooltip z liczbą powtórek -->
            {#if day.count > 0}
              <span
                class="absolute -top-7 rounded-md bg-[var(--tooltip-bg)] px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-[var(--tooltip-text)] shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {day.count}
              </span>
            {/if}

            <!-- Słupek -->
            <div
              class="w-full max-w-[32px] sm:max-w-[36px] rounded-t-lg transition-all duration-500 {day.isToday
                ? 'bg-[var(--bar-active)] shadow-sm'
                : day.count > 0
                  ? 'bg-[var(--bar-secondary)]'
                  : 'bg-[var(--bar-inactive)]'}"
              style="height: {heightPercent}%"
            ></div>

            <!-- Etykieta dnia -->
            <span
              class="text-[10px] sm:text-[11px] font-extrabold {day.isToday
                ? 'text-[var(--text-amber-brand)]'
                : 'text-[var(--text-muted)]'}"
            >
              {day.label}
            </span>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- SEKCJA 3: Postęp według 9 głównych kategorii -->
  <div
    class="app-card p-4 sm:p-6 space-y-4 sm:space-y-5"
  >
    <div
      class="flex items-center gap-2 border-b border-[var(--border-default)] pb-3"
    >
      <Icon icon="ph:sparkle-bold" class="h-5 w-5 text-[var(--brand-primary)] shrink-0" />
      <h3
        class="title-serif text-lg sm:text-xl"
      >
        Postęp według Kategorii
      </h3>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {#each categoryStats as cat}
        <div
          class="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-3.5 space-y-2"
        >
          <div class="flex items-start justify-between gap-2">
            <h4
              class="text-xs font-extrabold text-[var(--text-primary)] line-clamp-1"
            >
              {cat.name}
            </h4>
            <span
              class="text-[10px] font-extrabold text-[var(--text-amber-brand)] shrink-0"
              >{cat.unlocked} / {cat.total}</span
            >
          </div>

          <!-- Pasek postępu dla kategorii -->
          <div
            class="h-2 w-full overflow-hidden rounded-full bg-[var(--progress-track)] flex"
          >
            <div
              class="bg-[var(--emerald-icon)] transition-all duration-500"
              style="width: {cat.total > 0
                ? (cat.learned / cat.total) * 100
                : 0}%"
              title="Opanowane"
            ></div>
            <div
              class="bg-[var(--brand-primary)] transition-all duration-500"
              style="width: {cat.total > 0
                ? (cat.inProgress / cat.total) * 100
                : 0}%"
              title="W trakcie"
            ></div>
          </div>

          <div
            class="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-bold pt-0.5"
          >
            <span>Opanowane: <strong>{cat.learned}</strong></span>
            <span>W trakcie: <strong>{cat.inProgress}</strong></span>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- SEKCJA 4: Najtrudniejsze Słówka -->
  {#if hardestWords.length > 0}
    <div
      class="app-card border-[var(--border-amber)] p-4 sm:p-6 space-y-4"
    >
      <div
        class="flex items-center justify-between border-b border-[var(--border-default)] pb-3"
      >
        <div class="flex items-center gap-2">
          <Icon icon="ph:warning-bold" class="h-5 w-5 text-[var(--text-amber-accent)] shrink-0" />
          <h3
            class="title-serif text-lg sm:text-xl"
          >
            Najtrudniejsze słówka
          </h3>
        </div>
        <span class="hidden sm:inline text-xs font-bold text-[var(--text-muted)]"
          >Kliknij, aby przejrzeć słówko</span
        >
      </div>

      <div class="space-y-2.5">
        {#each hardestWords as item}
          <div
            role="button"
            tabindex="0"
            onclick={() => (activeWord = item.word)}
            onkeydown={(e) =>
              (e.key === "Enter" || e.key === " ") && (activeWord = item.word)}
            class="app-card-interactive group flex items-center justify-between bg-[var(--bg-surface-elevated)] p-3 sm:p-3.5 min-h-[48px]"
          >
            <div class="flex items-center gap-2.5 min-w-0 pr-2">
              <span
                class="rounded-lg bg-[var(--icon-bg-amber)] p-1.5 sm:p-2 text-[var(--brand-primary)] shrink-0"
              >
                <Icon icon="ph:book-open-bold" class="h-4 w-4" />
              </span>
              <div class="min-w-0">
                <h4
                  class="title-serif text-sm sm:text-base group-hover:text-[var(--brand-primary)] transition-colors truncate"
                >
                  {item.word.word}
                </h4>
                <p
                  class="text-[11px] sm:text-xs font-bold text-[var(--text-muted)] truncate"
                >
                  {item.word.shortDefinition}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 sm:gap-4 text-right shrink-0">
              <div class="hidden sm:block">
                <span
                  class="text-[10px] font-extrabold text-[var(--text-amber-brand)] uppercase"
                  >Trudność</span
                >
                <p class="text-xs font-extrabold text-[var(--text-primary)]">
                  {item.hardCount} x Bardzo trudne
                </p>
              </div>
              <span
                class="text-xs font-bold text-[var(--text-amber-accent)] group-hover:underline py-1 px-1.5"
                >Podgląd</span
              >
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Modal Szczegółów Słówka (Bottom Sheet na mobile) -->
  {#if activeWord}
    <div
      role="button"
      tabindex="-1"
      onclick={() => (activeWord = null)}
      onkeydown={(e) => e.key === "Escape" && (activeWord = null)}
      class="sheet-backdrop sm:modal-backdrop cursor-pointer"
    >
      <div
        role="dialog"
        aria-modal="true"
        tabindex="0"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
        class="sheet-container sm:modal-container max-w-xl p-5 sm:p-6 space-y-4 sm:space-y-5 cursor-default"
      >
        <!-- Uchwyt do przeciągania na mobile -->
        <div class="sheet-handle sm:hidden"></div>

        <div
          class="flex items-start justify-between border-b border-[var(--border-default)] pb-3"
        >
          <div>
            <h2
              class="title-serif text-2xl break-words"
            >
              {activeWord.word}
            </h2>
            {#if activeWord.phonetic}
              <p
                class="text-xs font-bold text-[var(--text-muted)] italic"
              >
                {activeWord.phonetic}
              </p>
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
          <h3
            class="text-xs font-extrabold text-[var(--brand-primary)] uppercase"
          >
            Pełna Definicja
          </h3>
          <p
            class="mt-1.5 text-sm font-semibold text-[var(--text-primary)] leading-relaxed"
          >
            {activeWord.fullDefinition}
          </p>
        </div>

        {#if activeWord.etymology}
          <div>
            <h3
              class="text-xs font-extrabold text-[var(--text-muted)] uppercase"
            >
              Etymologia
            </h3>
            <p
              class="mt-1 text-xs font-semibold text-[var(--text-secondary)]"
            >
              {activeWord.etymology}
            </p>
          </div>
        {/if}

        {#if activeWord.examples && activeWord.examples.length > 0}
          <div>
            <h3
              class="text-xs font-extrabold text-[var(--text-muted)] uppercase"
            >
              Przykłady z literatury
            </h3>
            <div class="mt-1.5 space-y-2">
              {#each activeWord.examples as ex}
                <blockquote
                  class="border-l-4 border-[var(--brand-primary)] bg-[var(--blockquote-bg)] p-3 rounded-r-xl font-sans text-xs font-semibold text-[var(--blockquote-text)] leading-relaxed"
                >
                  "{ex}"
                </blockquote>
              {/each}
            </div>
          </div>
        {/if}

        <div
          class="flex items-center justify-between border-t border-[var(--border-default)] pt-4"
        >
          <a
            href={activeWord.sjpUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-amber-brand)] hover:underline py-1"
          >
            <span>Otwórz w SJP PWN</span>
            <Icon icon="ph:arrow-square-out-bold" class="h-4 w-4" />
          </a>

          <button
            type="button"
            onclick={() => (activeWord = null)}
            class="btn-primary py-2 px-5"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
