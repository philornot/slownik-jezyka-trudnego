<script lang="ts">
  import Icon from '@iconify/svelte';

  interface Props {
    userEmail: string | null;
    onClose: () => void;
    onConfirm: () => void;
  }

  let { userEmail, onClose, onConfirm }: Props = $props();

  function handleConfirm() {
    onConfirm();
    onClose();
  }
</script>

<!-- Backdrop z zamknięciem po kliknięciu poza okienko -->
<div
  role="button"
  tabindex="-1"
  onclick={onClose}
  onkeydown={(e) => e.key === 'Escape' && onClose()}
  class="sheet-backdrop sm:modal-backdrop cursor-pointer"
>
  <!-- Kontener okienka dialogowego -->
  <div
    role="dialog"
    aria-modal="true"
    tabindex="0"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    class="sheet-container sm:modal-container max-w-sm overflow-hidden cursor-default"
  >
    <!-- Uchwyt do przeciągania na telefonie -->
    <div class="sheet-handle sm:hidden"></div>

    <div class="p-5 sm:p-6 space-y-4 text-center">
      <!-- Czerwona ikona ostrzegawcza -->
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-(--rose-bg) border border-(--rose-border) text-(--rose-icon) shadow-xs">
        <Icon icon="ph:sign-out-bold" class="h-7 w-7" />
      </div>

      <!-- Tytuł i opis z adresem e-mail -->
      <div class="space-y-1.5">
        <h2 class="title-serif text-xl font-bold text-(--text-primary)">
          Czy chcesz się wylogować?
        </h2>
        <p class="text-xs font-semibold text-(--text-muted) leading-relaxed">
          Obecnie zalogowane konto:
        </p>
        <div class="inline-flex items-center gap-1.5 rounded-xl border border-(--border-default) bg-(--bg-surface-elevated) px-3 py-1.5 text-xs font-extrabold text-(--text-primary)">
          <Icon icon="ph:user-bold" class="h-4 w-4 text-(--brand-primary)" />
          <span class="truncate max-w-56">{userEmail || 'Konto użytkownika'}</span>
        </div>
      </div>

      <p class="text-[11px] font-semibold text-(--text-muted) bg-(--bg-surface-elevated) p-2.5 rounded-xl border border-(--border-default)">
        Po wylogowaniu synchronizacja postępów w chmurze dla tego urządzenia zostanie wstrzymana do ponownego zalogowania.
      </p>

      <!-- Przyciski akcji -->
      <div class="flex flex-col-reverse sm:flex-row items-center gap-2.5 pt-2">
        <button
          type="button"
          onclick={onClose}
          class="btn-secondary w-full py-2.5"
        >
          Anuluj
        </button>

        <button
          type="button"
          onclick={handleConfirm}
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-(--rose-icon) text-white font-extrabold text-xs py-2.5 px-4 shadow-xs hover:bg-(--rose-icon)/90 active:scale-95 transition-all"
        >
          <Icon icon="ph:sign-out-bold" class="h-4 w-4" />
          <span>Tak, wyloguj się</span>
        </button>
      </div>
    </div>
  </div>
</div>
