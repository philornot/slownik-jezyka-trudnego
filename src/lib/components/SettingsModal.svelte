<script lang="ts">
  import type { UserSettings } from "../types";
  import { requestNotificationPermission } from "../notifications";
  import Icon from "@iconify/svelte";

  interface Props {
    settings: UserSettings;
    onClose: () => void;
    onSave: (newSettings: UserSettings) => void;
    onResetProgress?: () => void;
  }

  let { settings, onClose, onSave, onResetProgress }: Props = $props();

  let localSettings = $state<UserSettings>({ ...settings });
  let message = $state<string | null>(null);

  // Stan dla przycisku bezpiecznego resetowania (odliczanie 5 sekund)
  let isResetConfirmOpen = $state(false);
  let countdown = $state(5);
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  async function handleToggleNotifications() {
    if (!localSettings.notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (granted === "granted") {
        localSettings.notificationsEnabled = true;
        message = "Powiadomienia zostały włączone!";
      } else {
        localSettings.notificationsEnabled = false;
        message = "Brak zgody na powiadomienia w przeglądarce.";
      }
    } else {
      localSettings.notificationsEnabled = false;
      message = "Powiadomienia zostały wyłączone.";
    }
  }

  function handleSave() {
    onSave(localSettings);
    onClose();
  }

  function startResetTimer() {
    isResetConfirmOpen = true;
    countdown = 5;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (countdown > 1) {
        countdown--;
      } else {
        countdown = 0;
        if (timerInterval) clearInterval(timerInterval);
      }
    }, 1000);
  }

  function cancelReset() {
    isResetConfirmOpen = false;
    if (timerInterval) clearInterval(timerInterval);
  }

  function executeReset() {
    if (countdown > 0) return;
    if (timerInterval) clearInterval(timerInterval);
    isResetConfirmOpen = false;
    if (onResetProgress) {
      onResetProgress();
    }
    onClose();
  }
</script>

<!-- Backdrop z zamykaniem po kliknięciu poza okno -->
<div
  role="button"
  tabindex="-1"
  onclick={onClose}
  onkeydown={(e) => e.key === "Escape" && onClose()}
  class="sheet-backdrop sm:modal-backdrop cursor-pointer"
>
  <div
    role="dialog"
    aria-modal="true"
    tabindex="0"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    class="sheet-container sm:modal-container max-w-md overflow-hidden cursor-default"
  >
    <!-- Uchwyt do przeciągania na mobile -->
    <div class="sheet-handle sm:hidden"></div>

    <!-- Nagłówek -->
    <div
      class="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-surface-elevated)] px-4 sm:px-6 py-3.5"
    >
      <h2 class="title-serif text-xl">Ustawienia</h2>
      <button
        type="button"
        onclick={onClose}
        class="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface-muted)] hover:text-[var(--text-primary)]"
      >
        <Icon icon="ph:x-bold" class="h-5 w-5" />
      </button>
    </div>

    <div class="p-4 sm:p-6 space-y-5 sm:space-y-6">
      {#if message}
        <div
          class="flex items-center gap-2 rounded-xl bg-[var(--badge-amber-bg)] border border-[var(--badge-amber-border)] p-3 text-xs font-bold text-[var(--badge-amber-text)]"
        >
          <Icon
            icon="ph:check-circle-bold"
            class="h-4 w-4 text-[var(--brand-primary)] shrink-0"
          />
          <span>{message}</span>
        </div>
      {/if}

      <!-- ========================================== -->
      <!-- SEKCJA: Parametry Nauki -->
      <!-- ========================================== -->
      <div class="space-y-4">
        <div
          class="flex items-center gap-2 text-xs font-extrabold text-[var(--text-amber-brand)] uppercase tracking-wider"
        >
          <Icon icon="ph:book-open-bold" class="h-4 w-4" />
          <span>Parametry Nauki</span>
        </div>

        <!-- Liczba nowych słów na sesję -->
        <div class="space-y-2">
          <label
            for="daily-target-input"
            class="flex items-center justify-between text-xs font-extrabold text-[var(--text-primary)]"
          >
            <span>Nowe słowa na dzienną sesję</span>
            <span class="text-sm font-extrabold text-[var(--text-amber-brand)]"
              >{localSettings.dailyNewWordsLimit}</span
            >
          </label>

          <input
            id="daily-target-input"
            type="range"
            min="1"
            max="20"
            bind:value={localSettings.dailyNewWordsLimit}
            class="w-full h-3 sm:h-2 rounded-lg bg-[var(--progress-track)] accent-[var(--brand-primary)] cursor-pointer"
          />
          <div
            class="flex justify-between text-[10px] font-extrabold text-[var(--text-muted)]"
          >
            <span>1 słowo</span>
            <span>10 słów</span>
            <span>20 słów</span>
          </div>
        </div>

        <!-- Powiadomienia -->
        <div class="flex items-center justify-between pt-2">
          <div class="space-y-0.5">
            <div
              class="flex items-center gap-2 text-xs font-extrabold text-[var(--text-primary)]"
            >
              <Icon
                icon="ph:bell-bold"
                class="h-4 w-4 text-[var(--brand-primary)]"
              />
              <span>Powiadomienia o powtórkach</span>
            </div>
            <p class="text-[11px] font-semibold text-[var(--text-muted)]">
              Codzienne przypomnienie w przeglądarce
            </p>
          </div>

          <button
            type="button"
            aria-label="Przełącz powiadomienia"
            onclick={handleToggleNotifications}
            class="relative inline-flex h-7 w-12 sm:h-6 sm:w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden {localSettings.notificationsEnabled
              ? 'bg-[var(--brand-primary)]'
              : 'bg-[var(--progress-track)]'}"
          >
            <span
              class="pointer-events-none inline-block h-6 w-6 sm:h-5 sm:w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out {localSettings.notificationsEnabled
                ? 'translate-x-5'
                : 'translate-x-0'}"
            ></span>
          </button>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- SEKCJA: Dostępność (Accessibility) -->
      <!-- ========================================== -->
      <div
        class="border-t border-[var(--border-default)] pt-4 sm:pt-5 space-y-4"
      >
        <div
          class="flex items-center gap-2 text-xs font-extrabold text-[var(--text-amber-brand)] uppercase tracking-wider"
        >
          <Icon icon="ph:eye-bold" class="h-4 w-4" />
          <span>Dostępność</span>
        </div>

        <!-- Wysoki Kontrast -->
        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <div
              class="flex items-center gap-2 text-xs font-extrabold text-[var(--text-primary)]"
            >
              <Icon
                icon="ph:sun-dim-bold"
                class="h-4 w-4 text-[var(--brand-primary)]"
              />
              <span>Wysoki kontrast</span>
            </div>
            <p class="text-[11px] font-semibold text-[var(--text-muted)]">
              Wyrazistsze kolory, grubsze obramowania
            </p>
          </div>

          <button
            type="button"
            aria-label="Przełącz wysoki kontrast"
            onclick={() =>
              (localSettings.highContrast = !localSettings.highContrast)}
            class="relative inline-flex h-7 w-12 sm:h-6 sm:w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden {localSettings.highContrast
              ? 'bg-[var(--brand-primary)]'
              : 'bg-[var(--progress-track)]'}"
          >
            <span
              class="pointer-events-none inline-block h-6 w-6 sm:h-5 sm:w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out {localSettings.highContrast
                ? 'translate-x-5'
                : 'translate-x-0'}"
            ></span>
          </button>
        </div>

        <!-- Powiększony Tekst -->
        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <div
              class="flex items-center gap-2 text-xs font-extrabold text-[var(--text-primary)]"
            >
              <Icon
                icon="ph:text-aa-bold"
                class="h-4 w-4 text-[var(--brand-primary)]"
              />
              <span>Powiększony tekst</span>
            </div>
            <p class="text-[11px] font-semibold text-[var(--text-muted)]">
              Zwiększona wielkość czcionki
            </p>
          </div>

          <button
            type="button"
            aria-label="Przełącz powiększony tekst"
            onclick={() =>
              (localSettings.largerText = !localSettings.largerText)}
            class="relative inline-flex h-7 w-12 sm:h-6 sm:w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden {localSettings.largerText
              ? 'bg-[var(--brand-primary)]'
              : 'bg-[var(--progress-track)]'}"
          >
            <span
              class="pointer-events-none inline-block h-6 w-6 sm:h-5 sm:w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out {localSettings.largerText
                ? 'translate-x-5'
                : 'translate-x-0'}"
            ></span>
          </button>
        </div>

        <!-- Redukcja Ruchu -->
        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <div
              class="flex items-center gap-2 text-xs font-extrabold text-[var(--text-primary)]"
            >
              <Icon
                icon="ph:prohibit-bold"
                class="h-4 w-4 text-[var(--brand-primary)]"
              />
              <span>Redukcja animacji</span>
            </div>
            <p class="text-[11px] font-semibold text-[var(--text-muted)]">
              Wyłączenie animacji i przejść
            </p>
          </div>

          <button
            type="button"
            aria-label="Przełącz redukcję animacji"
            onclick={() =>
              (localSettings.reducedMotion = !localSettings.reducedMotion)}
            class="relative inline-flex h-7 w-12 sm:h-6 sm:w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden {localSettings.reducedMotion
              ? 'bg-[var(--brand-primary)]'
              : 'bg-[var(--progress-track)]'}"
          >
            <span
              class="pointer-events-none inline-block h-6 w-6 sm:h-5 sm:w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out {localSettings.reducedMotion
                ? 'translate-x-5'
                : 'translate-x-0'}"
            ></span>
          </button>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- SEKCJA: Resetowanie danych nauki -->
      <!-- ========================================== -->
      {#if onResetProgress}
        <div
          class="border-t border-[var(--border-default)] pt-4 sm:pt-5 space-y-3"
        >
          <div
            class="flex items-center gap-2 text-xs font-extrabold text-[var(--rose-text)] uppercase tracking-wider"
          >
            <Icon
              icon="ph:trash-bold"
              class="h-4 w-4 text-[var(--rose-icon)]"
            />
            <span>Niebezpieczne ustawienia</span>
          </div>

          {#if !isResetConfirmOpen}
            <button
              type="button"
              onclick={startResetTimer}
              class="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--rose-border)] bg-[var(--rose-bg)] py-3 px-4 text-xs font-extrabold text-[var(--rose-text)] hover:opacity-80 transition-all shadow-xs min-h-[44px]"
            >
              <Icon icon="ph:trash-bold" class="h-4 w-4" />
              <span>Resetuj cały postęp nauki</span>
            </button>
          {:else}
            <!-- Karta potwierdzenia z 5-sekundowym timerem -->
            <div
              class="rounded-xl border border-[var(--rose-border)] bg-[var(--rose-bg)] p-4 space-y-3 animate-in fade-in duration-200"
            >
              <div class="flex items-start gap-2">
                <Icon
                  icon="ph:warning-bold"
                  class="h-5 w-5 shrink-0 text-[var(--rose-icon)] mt-0.5"
                />
                <div class="text-xs text-[var(--rose-text)]">
                  <p class="font-extrabold">
                    Czy na pewno chcesz zresetować całą historię?
                  </p>
                  <p class="mt-1 text-[11px] font-semibold">
                    Ta operacja usunie wszystkie powtórki i rozpocznie naukę od
                    zera. Nie można jej cofnąć.
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={countdown > 0}
                  onclick={executeReset}
                  class="w-full rounded-lg py-2.5 px-3 text-xs font-bold transition-all shadow-md min-h-[44px] {countdown >
                  0
                    ? 'bg-[var(--rose-bg)] text-[var(--rose-text)] cursor-not-allowed opacity-60'
                    : 'bg-[var(--rose-icon)] text-white hover:opacity-90 animate-pulse'}"
                >
                  {#if countdown > 0}
                    <span>Odczekaj {countdown} s...</span>
                  {:else}
                    <span>Potwierdzam resetowanie</span>
                  {/if}
                </button>

                <button
                  type="button"
                  onclick={cancelReset}
                  class="btn-secondary py-2.5 px-4 min-h-[44px]"
                >
                  Anuluj
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Stopka z przyciskiem Zapisz -->
    <div
      class="flex items-center justify-end border-t border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-4 sm:px-6"
    >
      <button
        type="button"
        onclick={handleSave}
        class="btn-touch sm:w-auto sm:px-6"
      >
        Zapisz zmiany
      </button>
    </div>
  </div>
</div>
