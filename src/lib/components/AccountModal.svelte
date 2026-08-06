<script lang="ts">
  import Icon from "@iconify/svelte";
  import type { UserProfile, DeviceSession } from "$lib/types";
  import { getDeviceId } from "$lib/storage";

  interface Props {
    userEmail: string | null;
    username: string | null;
    devices: Record<string, DeviceSession>;
    onClose: () => void;
    onSaveUsername: (newUsername: string) => Promise<void>;
    onLogoutAllDevices: () => Promise<void>;
    onLogout: () => void;
    onDeleteAccount: () => Promise<void>;
  }

  let {
    userEmail,
    username,
    devices,
    onClose,
    onSaveUsername,
    onLogoutAllDevices,
    onLogout,
    onDeleteAccount,
  }: Props = $props();

  let currentDeviceId = getDeviceId();

  let inputUsername = $state("");
  let isSavingUsername = $state(false);

  $effect(() => {
    inputUsername = username || "";
  });
  let usernameSuccessMsg = $state<string | null>(null);
  let usernameErrorMsg = $state<string | null>(null);

  let isLoggingOutAll = $state(false);
  let logoutAllErrorMsg = $state<string | null>(null);

  let showDeleteConfirm = $state(false);
  let deleteConfirmText = $state("");
  let isDeletingAccount = $state(false);
  let deleteErrorMsg = $state<string | null>(null);

  let deviceList = $derived(
    Object.values(devices || {})
      .map((d) => ({
        ...d,
        isCurrent: d.id === currentDeviceId,
      }))
      .sort((a, b) => (b.isCurrent ? -1 : 1)),
  );

  let devicesCount = $derived(deviceList.length || 1);

  async function handleSaveUsernameSubmit(e: SubmitEvent) {
    e.preventDefault();
    usernameSuccessMsg = null;
    usernameErrorMsg = null;
    const trimmed = inputUsername.trim();

    if (!trimmed) {
      usernameErrorMsg = "Nazwa użytkownika nie może być pusta.";
      return;
    }

    if (trimmed.length < 2) {
      usernameErrorMsg = "Nazwa użytkownika musi mieć co najmniej 2 znaki.";
      return;
    }

    try {
      isSavingUsername = true;
      await onSaveUsername(trimmed);
      usernameSuccessMsg = "Nazwa użytkownika została zaktualizowana!";
      setTimeout(() => {
        usernameSuccessMsg = null;
      }, 3000);
    } catch (err: any) {
      console.error("Błąd zapisu username:", err);
      usernameErrorMsg =
        err?.message || "Nie udało się zapisać nazwy użytkownika.";
    } finally {
      isSavingUsername = false;
    }
  }

  async function handleLogoutAllClick() {
    logoutAllErrorMsg = null;
    try {
      isLoggingOutAll = true;
      await onLogoutAllDevices();
      onClose();
    } catch (err: any) {
      console.error("Błąd wylogowywania ze wszystkich urządzeń:", err);
      logoutAllErrorMsg =
        err?.message || "Nie udało się wylogować ze wszystkich urządzeń.";
    } finally {
      isLoggingOutAll = false;
    }
  }

  async function handleDeleteAccountConfirm() {
    deleteErrorMsg = null;
    try {
      isDeletingAccount = true;
      await onDeleteAccount();
      onClose();
    } catch (err: any) {
      console.error("Błąd usuwania konta:", err);
      if (err?.code === "auth/requires-recent-login") {
        deleteErrorMsg =
          "Ze względów bezpieczeństwa usuwanie konta wymaga niedawnego zalogowania. Wyloguj się i zaloguj ponownie, a następnie spróbuj usunąć konto.";
      } else {
        deleteErrorMsg =
          err?.message ||
          "Nie udało się usunąć konta. Spróbuj ponownie później.";
      }
    } finally {
      isDeletingAccount = false;
    }
  }

  function formatDate(isoStr?: string): string {
    if (!isoStr) return "Przed chwilą";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  }
</script>

<!-- Backdrop z zamknięciem po kliknięciu poza okienko -->
<div
  role="button"
  tabindex="-1"
  onclick={onClose}
  onkeydown={(e) => e.key === "Escape" && onClose()}
  class="sheet-backdrop sm:modal-backdrop cursor-pointer"
>
  <!-- Kontener okienka dialogowego -->
  <div
    role="dialog"
    aria-modal="true"
    tabindex="0"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    class="sheet-container sm:modal-container max-w-lg overflow-hidden cursor-default max-h-[90vh] flex flex-col"
  >
    <!-- Uchwyt do przeciągania na telefonie -->
    <div class="sheet-handle sm:hidden"></div>

    <!-- Header modalnego okna -->
    <div
      class="flex items-center justify-between px-5 py-4 border-b border-(--border-default) shrink-0"
    >
      <div class="flex items-center gap-2.5">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-(--brand-primary)/10 text-(--brand-primary)"
        >
          <Icon icon="ph:user-circle-bold" class="h-5 w-5" />
        </div>
        <div>
          <h2 class="title-serif text-lg font-bold text-(--text-primary)">
            Konto użytkownika
          </h2>
          <p class="text-xs font-semibold text-(--text-muted)">
            {userEmail || "Profil"}
          </p>
        </div>
      </div>

      <button
        type="button"
        onclick={onClose}
        class="flex h-8 w-8 items-center justify-center rounded-xl border border-(--border-default) bg-(--bg-surface-elevated) text-(--text-muted) hover:text-(--text-primary) transition-colors"
        aria-label="Zamknij"
      >
        <Icon icon="ph:x-bold" class="h-4 w-4" />
      </button>
    </div>

    <!-- Zawartość przewijana -->
    <div class="p-5 space-y-6 overflow-y-auto flex-1">
      <!-- SEKCJA 1: NAZWA UŻYTKOWNIKA (USERNAME) -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <label
            for="username-input"
            class="text-xs font-extrabold text-(--text-primary) uppercase tracking-wider flex items-center gap-1.5"
          >
            <Icon
              icon="ph:identification-card-bold"
              class="h-4 w-4 text-(--brand-primary)"
            />
            <span>Nazwa użytkownika</span>
          </label>
          <span class="text-[11px] font-semibold text-(--text-muted)">
            {username ? "Własny nick" : "Domyślnie: e-mail"}
          </span>
        </div>

        <form onsubmit={handleSaveUsernameSubmit} class="space-y-2">
          <div class="flex items-center gap-2">
            <div class="relative flex-1">
              <input
                id="username-input"
                type="text"
                bind:value={inputUsername}
                placeholder={userEmail || "Twoja nazwa"}
                maxlength="30"
                class="w-full rounded-xl border border-(--border-default) bg-(--bg-surface-elevated) px-3.5 py-2.5 text-xs font-bold text-(--text-primary) focus:border-(--brand-primary) focus:outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isSavingUsername}
              class="btn-primary py-2.5 px-4 text-xs shrink-0 flex items-center gap-1.5"
            >
              {#if isSavingUsername}
                <Icon icon="ph:spinner-gap-bold" class="h-4 w-4 animate-spin" />
              {:else}
                <Icon icon="ph:check-bold" class="h-4 w-4" />
              {/if}
              <span>Zapisz</span>
            </button>
          </div>

          <p class="text-[11px] font-semibold text-(--text-muted)">
            Nazwa użytkownika będzie wyświetlana w nagłówku aplikacji i
            synchronizuje się w Firestore.
          </p>

          {#if usernameSuccessMsg}
            <p
              class="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 flex items-center gap-1.5"
            >
              <Icon icon="ph:check-circle-bold" class="h-4 w-4 shrink-0" />
              <span>{usernameSuccessMsg}</span>
            </p>
          {/if}

          {#if usernameErrorMsg}
            <p
              class="text-xs font-extrabold text-(--rose-icon) bg-(--rose-bg) p-2.5 rounded-xl border border-(--rose-border) flex items-center gap-1.5"
            >
              <Icon icon="ph:warning-circle-bold" class="h-4 w-4 shrink-0" />
              <span>{usernameErrorMsg}</span>
            </p>
          {/if}
        </form>
      </div>

      <hr class="border-(--border-default)" />

      <!-- SEKCJA 2: ZALOGOWANE URZĄDZENIA -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div
            class="flex items-center gap-1.5 text-xs font-extrabold text-(--text-primary) uppercase tracking-wider"
          >
            <Icon
              icon="ph:devices-bold"
              class="h-4 w-4 text-(--brand-primary)"
            />
            <span>Zalogowane urządzenia</span>
          </div>
          <span
            class="inline-flex items-center gap-1 rounded-lg border border-(--border-default) bg-(--bg-surface-elevated) px-2 py-0.5 text-[11px] font-bold text-(--brand-primary)"
          >
            {devicesCount}
            {devicesCount === 1
              ? "urządzenie"
              : devicesCount < 5
                ? "urządzenia"
                : "urządzeń"}
          </span>
        </div>

        <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
          {#if deviceList.length > 0}
            {#each deviceList as dev (dev.id)}
              <div
                class="flex items-center justify-between rounded-xl border border-(--border-default) bg-(--bg-surface-elevated) p-3 text-xs"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--brand-primary)/10 text-(--brand-primary)"
                  >
                    {#if dev.name.toLowerCase().includes("iphone") || dev.name
                        .toLowerCase()
                        .includes("android") || dev.name
                        .toLowerCase()
                        .includes("ios")}
                      <Icon icon="ph:device-mobile-bold" class="h-4 w-4" />
                    {:else}
                      <Icon icon="ph:desktop-bold" class="h-4 w-4" />
                    {/if}
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span
                        class="font-extrabold text-(--text-primary) truncate"
                        >{dev.name}</span
                      >
                      {#if dev.isCurrent}
                        <span
                          class="shrink-0 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-1.5 py-px text-[10px] font-extrabold border border-emerald-500/30"
                        >
                          To urządzenie
                        </span>
                      {/if}
                    </div>
                    <p
                      class="text-[10px] font-semibold text-(--text-muted) truncate"
                    >
                      Ostatnia aktywność: {formatDate(dev.lastActive)}
                    </p>
                  </div>
                </div>
              </div>
            {/each}
          {:else}
            <!-- Fallback dla bieżącej sesji -->
            <div
              class="flex items-center justify-between rounded-xl border border-(--border-default) bg-(--bg-surface-elevated) p-3 text-xs"
            >
              <div class="flex items-center gap-2.5">
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--brand-primary)/10 text-(--brand-primary)"
                >
                  <Icon icon="ph:desktop-bold" class="h-4 w-4" />
                </div>
                <div>
                  <span class="font-extrabold text-(--text-primary)"
                    >Bieżąca przeglądarka</span
                  >
                  <p class="text-[10px] font-semibold text-(--text-muted)">
                    Aktywna teraz
                  </p>
                </div>
              </div>
              <span
                class="shrink-0 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-1.5 py-px text-[10px] font-extrabold border border-emerald-500/30"
              >
                To urządzenie
              </span>
            </div>
          {/if}
        </div>

        {#if logoutAllErrorMsg}
          <p
            class="text-xs font-extrabold text-(--rose-icon) bg-(--rose-bg) p-2.5 rounded-xl border border-(--rose-border) flex items-center gap-1.5"
          >
            <Icon icon="ph:warning-circle-bold" class="h-4 w-4 shrink-0" />
            <span>{logoutAllErrorMsg}</span>
          </p>
        {/if}

        <button
          type="button"
          onclick={handleLogoutAllClick}
          disabled={isLoggingOutAll}
          class="w-full flex items-center justify-center gap-2 rounded-xl border border-(--border-default) bg-(--bg-surface-elevated) hover:border-(--brand-primary) text-(--text-primary) hover:text-(--brand-primary) font-extrabold text-xs py-2.5 px-4 transition-all shadow-xs"
        >
          {#if isLoggingOutAll}
            <Icon icon="ph:spinner-gap-bold" class="h-4 w-4 animate-spin" />
          {:else}
            <Icon icon="ph:sign-out-bold" class="h-4 w-4" />
          {/if}
          <span>Wyloguj ze wszystkich urządzeń</span>
        </button>
      </div>

      <hr class="border-(--border-default)" />

      <!-- SEKCJA 3: ZARZĄDZANIE KONTEM & USUWANIE -->
      <div class="space-y-3">
        {#if !showDeleteConfirm}
          <div class="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onclick={() => {
                onLogout();
                onClose();
              }}
              class="flex-1 btn-secondary py-2.5 text-xs flex items-center justify-center gap-1.5"
            >
              <Icon icon="ph:sign-out-bold" class="h-4 w-4" />
              <span>Wyloguj się</span>
            </button>

            <button
              type="button"
              onclick={() => (showDeleteConfirm = true)}
              class="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-(--rose-bg) border border-(--rose-border) text-(--rose-icon) hover:bg-(--rose-border)/30 font-extrabold text-xs py-2.5 px-4 transition-all"
            >
              <Icon icon="ph:trash-bold" class="h-4 w-4" />
              <span>Usuń konto</span>
            </button>
          </div>
        {:else}
          <!-- EKRAN POTWIERDZENIA USUWANIA KONTA -->
          <div
            class="space-y-3 bg-(--rose-bg) border border-(--rose-border) rounded-2xl p-4 text-xs"
          >
            <div class="flex items-start gap-2.5">
              <Icon
                icon="ph:warning-octagon-bold"
                class="h-6 w-6 text-(--rose-icon) shrink-0 mt-0.5"
              />
              <div>
                <h3 class="font-extrabold text-(--rose-icon) text-sm">
                  Czy na pewno chcesz usunąć konto?
                </h3>
                <p
                  class="text-(--text-primary) text-[11px] font-semibold mt-1 leading-relaxed"
                >
                  Operacja usunie konto oraz wszystkie Twoje postępy w chmurze.
                  Tej operacji nie można cofnąć.
                </p>
              </div>
            </div>

            <div class="space-y-1.5">
              <label
                for="delete-confirm-input"
                class="text-[11px] font-bold text-(--text-primary)"
              >
                Wpisz <span class="font-mono font-extrabold text-(--rose-icon)"
                  >USUŃ</span
                >, aby potwierdzić:
              </label>
              <input
                id="delete-confirm-input"
                type="text"
                bind:value={deleteConfirmText}
                placeholder="USUŃ"
                class="w-full rounded-xl border border-(--rose-border) bg-(--bg-surface) px-3 py-2 text-xs font-bold text-(--text-primary) uppercase focus:outline-none"
              />
            </div>

            {#if deleteErrorMsg}
              <p
                class="text-xs font-bold text-(--rose-icon) bg-(--bg-surface) p-2.5 rounded-xl border border-(--rose-border)"
              >
                {deleteErrorMsg}
              </p>
            {/if}

            <div class="flex items-center gap-2 pt-1">
              <button
                type="button"
                onclick={() => {
                  showDeleteConfirm = false;
                  deleteConfirmText = "";
                  deleteErrorMsg = null;
                }}
                class="btn-secondary flex-1 py-2"
              >
                Anuluj
              </button>

              <button
                type="button"
                disabled={deleteConfirmText.trim().toUpperCase() !== "USUŃ" ||
                  isDeletingAccount}
                onclick={handleDeleteAccountConfirm}
                class="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-(--rose-icon) text-white font-extrabold text-xs py-2 px-3 shadow-xs hover:bg-(--rose-icon)/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {#if isDeletingAccount}
                  <Icon
                    icon="ph:spinner-gap-bold"
                    class="h-4 w-4 animate-spin"
                  />
                {:else}
                  <Icon icon="ph:trash-bold" class="h-4 w-4" />
                {/if}
                <span>Tak, usuń konto</span>
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
