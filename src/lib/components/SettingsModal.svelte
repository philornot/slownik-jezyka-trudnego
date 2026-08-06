<script lang="ts">
  import type { UserSettings } from "../types";
  import { requestNotificationPermission } from "../notifications";
  import { APP_VERSION } from "../version";
  import Icon from "@iconify/svelte";

  interface Props {
    settings: UserSettings;
    onClose: () => void;
    onSave: (newSettings: UserSettings) => void;
    /** Podgląd na żywo – wywoływany przy każdej zmianie ustawienia */
    onPreview: (previewSettings: UserSettings) => void;
    onResetProgress?: () => void;
    onOpenDebugLogs?: () => void;
  }

  let { settings, onClose, onSave, onPreview, onResetProgress, onOpenDebugLogs }: Props =
    $props();

  function getInitialSettings(): UserSettings {
    return { ...settings };
  }

  let localSettings = $state<UserSettings>(getInitialSettings());
  let message = $state<string | null>(null);

  // Stan dla przycisku bezpiecznego resetowania (odliczanie 5 sekund)
  let isResetConfirmOpen = $state(false);
  let countdown = $state(5);
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Aktualizuje dane ustawienie i natychmiast wywołuje podgląd na żywo.
   * @param key - klucz ustawienia do zmiany
   * @param value - nowa wartość
   */
  function updateSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) {
    localSettings[key] = value;
    onPreview({ ...localSettings });
  }

  async function handleToggleNotifications() {
    if (!localSettings.notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (granted === "granted") {
        updateSetting("notificationsEnabled", true);
        message = "Powiadomienia zostały włączone!";
      } else {
        updateSetting("notificationsEnabled", false);
        message = "Brak zgody na powiadomienia w przeglądarce.";
      }
    } else {
      updateSetting("notificationsEnabled", false);
      message = "Powiadomienia zostały wyłączone.";
    }
  }

  function handleSave() {
    onSave(localSettings);
    onClose();
  }

  function handleClose() {
    // Przy anulowaniu – przywróć oryginalne ustawienia
    onPreview({ ...settings });
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
  onclick={handleClose}
  onkeydown={(e) => e.key === "Escape" && handleClose()}
  class="sheet-backdrop sm:modal-backdrop cursor-pointer"
>
  <div
    role="dialog"
    aria-modal="true"
    tabindex="0"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    class="sheet-container sm:modal-container max-w-md cursor-default"
  >
    <!-- Uchwyt do przeciągania na mobile -->
    <div class="sheet-handle sm:hidden"></div>

    <!-- Nagłówek -->
    <div
      class="flex items-center justify-between border-b border-(--border-default) bg-(--bg-surface-elevated) px-4 sm:px-6 py-3.5"
    >
      <div>
        <h2 class="title-serif text-xl">Ustawienia</h2>
        <p class="text-[11px] font-semibold text-(--text-muted) mt-0.5">
          Zmiany widoczne od razu · Zapisz, żeby zachować
        </p>
      </div>
      <button
        type="button"
        onclick={handleClose}
        class="rounded-lg p-1.5 text-(--text-muted) hover:bg-(--bg-surface-muted) hover:text-(--text-primary)"
      >
        <Icon icon="ph:x-bold" class="h-5 w-5" />
      </button>
    </div>

    <div class="overflow-y-auto flex-1 p-4 sm:p-6 space-y-5 sm:space-y-6">
      {#if message}
        <div
          class="flex items-center gap-2 rounded-xl bg-(--badge-amber-bg) border border-(--badge-amber-border) p-3 text-xs font-bold text-(--badge-amber-text)"
        >
          <Icon
            icon="ph:check-circle-bold"
            class="h-4 w-4 text-(--brand-primary) shrink-0"
          />
          <span>{message}</span>
        </div>
      {/if}

      <!-- ========================================== -->
      <!-- SEKCJA: Parametry Nauki -->
      <!-- ========================================== -->
      <div class="space-y-4">
        <div
          class="flex items-center gap-2 text-xs font-extrabold text-(--text-amber-brand) uppercase tracking-wider"
        >
          <Icon icon="ph:book-open-bold" class="h-4 w-4" />
          <span>Parametry Nauki</span>
        </div>

        <!-- Liczba nowych słów na sesję -->
        <div class="space-y-2">
          <label
            for="daily-target-input"
            class="flex items-center justify-between text-xs font-extrabold text-(--text-primary)"
          >
            <span>Nowe słowa na dzienną sesję</span>
            <span class="text-sm font-extrabold text-(--text-amber-brand)"
              >{localSettings.dailyNewWordsLimit}</span
            >
          </label>

          <input
            id="daily-target-input"
            type="range"
            min="1"
            max="20"
            bind:value={localSettings.dailyNewWordsLimit}
            oninput={() => onPreview({ ...localSettings })}
            class="w-full h-3 sm:h-2 rounded-lg bg-(--progress-track) border border-(--progress-border) accent-(--brand-primary) cursor-pointer"
          />
          <div
            class="flex justify-between text-[10px] font-extrabold text-(--text-muted)"
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
              class="flex items-center gap-2 text-xs font-extrabold text-(--text-primary)"
            >
              <Icon
                icon="ph:bell-bold"
                class="h-4 w-4 text-(--brand-primary)"
              />
              <span>Powiadomienia o powtórkach</span>
            </div>
            <p class="text-[11px] font-semibold text-(--text-muted)">
              Codzienne przypomnienie w przeglądarce
            </p>
          </div>

          <button
            type="button"
            aria-label="Przełącz powiadomienia"
            onclick={handleToggleNotifications}
            class="relative inline-flex h-7 w-12 sm:h-6 sm:w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-hidden {localSettings.notificationsEnabled
              ? 'bg-(--brand-primary) border-transparent'
              : 'bg-(--progress-track) border-(--progress-border)'}"
          >
            <span
              class="pointer-events-none inline-block h-6 w-6 sm:h-5 sm:w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out {localSettings.notificationsEnabled
                ? 'translate-x-5 sm:translate-x-5'
                : 'translate-x-0'}"
            ></span>
          </button>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- SEKCJA: Dostępność (Accessibility) -->
      <!-- ========================================== -->
      <div
        class="border-t border-(--border-default) pt-4 sm:pt-5 space-y-4"
      >
        <div
          class="flex items-center gap-2 text-xs font-extrabold text-(--text-amber-brand) uppercase tracking-wider"
        >
          <Icon icon="ph:eye-bold" class="h-4 w-4" />
          <span>Dostępność</span>
        </div>

        <!-- Wysoki Kontrast -->
        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <div
              class="flex items-center gap-2 text-xs font-extrabold text-(--text-primary)"
            >
              <Icon
                icon="ph:sun-dim-bold"
                class="h-4 w-4 text-(--brand-primary)"
              />
              <span>Wysoki kontrast</span>
            </div>
            <p class="text-[11px] font-semibold text-(--text-muted)">
              Wyrazistsze kolory, grubsze obramowania
            </p>
          </div>

          <button
            type="button"
            aria-label="Przełącz wysoki kontrast"
            onclick={() => updateSetting("highContrast", !localSettings.highContrast)}
            class="relative inline-flex h-7 w-12 sm:h-6 sm:w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-hidden {localSettings.highContrast
              ? 'bg-(--brand-primary) border-transparent'
              : 'bg-(--progress-track) border-(--progress-border)'}"
          >
            <span
              class="pointer-events-none inline-block h-6 w-6 sm:h-5 sm:w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out {localSettings.highContrast
                ? 'translate-x-5 sm:translate-x-5'
                : 'translate-x-0'}"
            ></span>
          </button>
        </div>

        <!-- Wielkość Tekstu (3 poziomy) -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <div
                class="flex items-center gap-2 text-xs font-extrabold text-(--text-primary)"
              >
                <Icon
                  icon="ph:text-aa-bold"
                  class="h-4 w-4 text-(--brand-primary)"
                />
                <span>Wielkość tekstu</span>
              </div>
              <p class="text-[11px] font-semibold text-(--text-muted)">
                Rozmiar czcionki w całej aplikacji
              </p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 pt-1" role="radiogroup" aria-label="Wielkość tekstu">
            <button
              type="button"
              role="radio"
              aria-checked={localSettings.textSize === "small"}
              onclick={() => updateSetting("textSize", "small")}
              class="flex flex-col items-center justify-center gap-0.5 p-2.5 rounded-xl border-2 transition-all cursor-pointer text-center min-h-12 {localSettings.textSize === 'small'
                ? 'bg-(--brand-primary) border-(--brand-primary) text-white font-extrabold shadow-xs'
                : 'bg-(--bg-surface-elevated) border-(--border-default) text-(--text-muted) hover:text-(--text-primary) hover:border-(--brand-primary)'}"
            >
              <span class="text-xs">Mały</span>
              <span class="text-[9px] opacity-75 font-mono uppercase">Domyślny</span>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={localSettings.textSize === "medium"}
              onclick={() => updateSetting("textSize", "medium")}
              class="flex flex-col items-center justify-center gap-0.5 p-2.5 rounded-xl border-2 transition-all cursor-pointer text-center min-h-12 {localSettings.textSize === 'medium'
                ? 'bg-(--brand-primary) border-(--brand-primary) text-white font-extrabold shadow-xs'
                : 'bg-(--bg-surface-elevated) border-(--border-default) text-(--text-muted) hover:text-(--text-primary) hover:border-(--brand-primary)'}"
            >
              <span class="text-sm font-bold">Średni</span>
              <span class="text-[9px] opacity-75 font-mono uppercase">Powiększony</span>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={localSettings.textSize === "large"}
              onclick={() => updateSetting("textSize", "large")}
              class="flex flex-col items-center justify-center gap-0.5 p-2.5 rounded-xl border-2 transition-all cursor-pointer text-center min-h-12 {localSettings.textSize === 'large'
                ? 'bg-(--brand-primary) border-(--brand-primary) text-white font-extrabold shadow-xs'
                : 'bg-(--bg-surface-elevated) border-(--border-default) text-(--text-muted) hover:text-(--text-primary) hover:border-(--brand-primary)'}"
            >
              <span class="text-base font-extrabold">Duży</span>
              <span class="text-[9px] opacity-75 font-mono uppercase">Maksymalny</span>
            </button>
          </div>
        </div>

        <!-- Redukcja Ruchu -->
        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <div
              class="flex items-center gap-2 text-xs font-extrabold text-(--text-primary)"
            >
              <Icon
                icon="ph:prohibit-bold"
                class="h-4 w-4 text-(--brand-primary)"
              />
              <span>Redukcja animacji</span>
            </div>
            <p class="text-[11px] font-semibold text-(--text-muted)">
              Wyłączenie animacji i przejść
            </p>
          </div>

          <button
            type="button"
            aria-label="Przełącz redukcję animacji"
            onclick={() => updateSetting("reducedMotion", !localSettings.reducedMotion)}
            class="relative inline-flex h-7 w-12 sm:h-6 sm:w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-hidden {localSettings.reducedMotion
              ? 'bg-(--brand-primary) border-transparent'
              : 'bg-(--progress-track) border-(--progress-border)'}"
          >
            <span
              class="pointer-events-none inline-block h-6 w-6 sm:h-5 sm:w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out {localSettings.reducedMotion
                ? 'translate-x-5 sm:translate-x-5'
                : 'translate-x-0'}"
            ></span>
          </button>
        </div>
      </div>

      {#if onOpenDebugLogs}
        <div class="border-t border-(--border-default) pt-4 sm:pt-5 space-y-3">
          <div class="flex items-center gap-2 text-xs font-extrabold text-(--text-primary) uppercase tracking-wider">
            <Icon icon="ph:terminal-window-bold" class="h-4 w-4 text-(--brand-primary)" />
            <span>Diagnostyka aplikacji</span>
          </div>

          <button
            type="button"
            onclick={() => {
              onClose();
              onOpenDebugLogs();
            }}
            class="flex w-full items-center justify-center gap-2 rounded-xl border border-(--border-default) bg-(--bg-surface-elevated) py-3 px-4 text-xs font-extrabold text-(--text-primary) hover:border-(--brand-primary) transition-all shadow-xs min-h-11"
          >
            <Icon icon="ph:bug-bold" class="h-4 w-4 text-(--brand-primary)" />
            <span>Otwórz konsolę logów diagnostycznych</span>
          </button>
        </div>
      {/if}

      <!-- ========================================== -->
      <!-- SEKCJA: Resetowanie danych nauki -->
      <!-- ========================================== -->
      {#if onResetProgress}
        <div
          class="border-t border-(--border-default) pt-4 sm:pt-5 space-y-3"
        >
          <div
            class="flex items-center gap-2 text-xs font-extrabold text-(--rose-text) uppercase tracking-wider"
          >
            <Icon
              icon="ph:trash-bold"
              class="h-4 w-4 text-(--rose-icon)"
            />
            <span>Niebezpieczne ustawienia</span>
          </div>

          {#if !isResetConfirmOpen}
            <button
              type="button"
              onclick={startResetTimer}
              class="flex w-full items-center justify-center gap-2 rounded-xl border border-(--rose-border) bg-(--rose-bg) py-3 px-4 text-xs font-extrabold text-(--rose-text) hover:opacity-80 transition-all shadow-xs min-h-11"
            >
              <Icon icon="ph:trash-bold" class="h-4 w-4" />
              <span>Resetuj cały postęp nauki</span>
            </button>
          {:else}
            <!-- Karta potwierdzenia z 5-sekundowym timerem -->
            <div
              class="rounded-xl border border-(--rose-border) bg-(--rose-bg) p-4 space-y-3 animate-in fade-in duration-200"
            >
              <div class="flex items-start gap-2">
                <Icon
                  icon="ph:warning-bold"
                  class="h-5 w-5 shrink-0 text-(--rose-icon) mt-0.5"
                />
                <div class="text-xs text-(--rose-text)">
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
                  class="w-full rounded-lg py-2.5 px-3 text-xs font-bold transition-all shadow-md min-h-11 {countdown >
                  0
                    ? 'bg-(--rose-bg) text-(--rose-text) cursor-not-allowed opacity-60'
                    : 'bg-(--rose-icon) text-white hover:opacity-90 animate-pulse'}"
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
                  class="btn-secondary py-2.5 px-4 min-h-11"
                >
                  Anuluj
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Stopka z przyciskami i wersją -->
    <div
      class="flex items-center justify-between border-t border-(--border-default) bg-(--bg-surface-elevated) p-4 sm:px-6"
    >
      <div class="flex items-center gap-1.5 text-[11px] font-mono text-(--text-muted)/60 select-none">
        <span>v{APP_VERSION}</span>
        <span class="text-(--text-muted)/30">•</span>
        <div class="relative group inline-flex items-center">
          <button
            type="button"
            class="inline-flex items-center justify-center p-0.5 rounded-full text-rose-600/70 dark:text-rose-400/80 hover:text-rose-600 dark:hover:text-rose-400 {localSettings.reducedMotion ? '' : 'hover:scale-110 active:scale-95 transition-all duration-200'} focus:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
            aria-label="Autor loga i faviconu"
          >
            <Icon icon="ph:heart-fill" class="h-3.5 w-3.5" />
          </button>

          <!-- Dymek (Tooltip) podziękowania -->
          <div
            class="absolute bottom-full left-0 mb-2 hidden group-hover:flex group-focus-within:flex items-center whitespace-nowrap rounded-lg border border-(--border-default) bg-(--bg-surface-elevated) px-2.5 py-1 text-[11px] font-sans font-medium text-(--text-primary) shadow-lg backdrop-blur-md {localSettings.reducedMotion ? '' : 'transition-all duration-200'} z-50 pointer-events-none"
            role="tooltip"
          >
            <span>Autor logo strony: Dawid Siekielski</span>
            <div class="absolute -bottom-1 left-2 w-2 h-2 rotate-45 border-r border-b border-(--border-default) bg-(--bg-surface-elevated)"></div>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          onclick={handleClose}
          class="btn-secondary py-2.5 px-4"
        >
          Anuluj
        </button>
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
</div>
