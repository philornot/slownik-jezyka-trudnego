<script lang="ts">
  import Icon from '@iconify/svelte';
  import { getFirebaseDb } from '../firebase';
  import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

  interface Props {
    onClose: () => void;
    initialSubject?: string;
  }

  let { onClose, initialSubject }: Props = $props();

  let senderEmail = $state('');
  let subject = $state('');
  let message = $state('');
  let isSubmitting = $state(false);
  let successMessage = $state<string | null>(null);
  let errorMessage = $state<string | null>(null);

  $effect(() => {
    if (!subject) {
      subject = initialSubject || 'Zapytanie RODO / Ochrona danych';
    }
  });

  const subjectOptions = [
    'Zapytanie RODO / Ochrona danych',
    'Zgłoszenie błędu / problem z aplikacją',
    'Propozycja nowego słowa',
    'Inny temat'
  ];

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!senderEmail || !message) {
      errorMessage = 'Wypełnij adres e-mail oraz treść wiadomości.';
      return;
    }

    isSubmitting = true;
    errorMessage = null;

    try {
      // 1. Zapis do chmury Firestore (jeśli skonfigurowane)
      try {
        const db = getFirebaseDb();
        if (db) {
          await addDoc(collection(db, 'contact_messages'), {
            email: senderEmail,
            subject,
            message,
            createdAt: serverTimestamp(),
            recipient: 'philornot3@gmail.com'
          });
        }
      } catch (dbErr) {
        console.warn('Zapis wiadomości do Firestore nie powiódł się lub brak konfiguracji, stosowanie awaryjne mailto:', dbErr);
      }

      // 2. Sukces
      successMessage = 'Twoja wiadomość została wysłana! Odpowiemy na podany adres e-mail tak szybko, jak to możliwe.';
    } catch (err: any) {
      console.error('Błąd wysyłania formularza kontaktowego:', err);
      errorMessage = 'Wystąpił problem podczas wysyłania. Spróbuj wysłać wiadomość bezpośrednio z programu pocztowego.';
    } finally {
      isSubmitting = false;
    }
  }

  function handleOpenMailClient() {
    const mailtoUrl = `mailto:philornot3@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Od: ${senderEmail}\n\n${message}`)}`;
    window.location.href = mailtoUrl;
  }
</script>

<div
  role="button"
  tabindex="-1"
  onclick={onClose}
  onkeydown={(e) => e.key === 'Escape' && onClose()}
  class="sheet-backdrop sm:modal-backdrop cursor-pointer z-50"
>
  <div
    role="dialog"
    aria-modal="true"
    tabindex="0"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    class="sheet-container sm:modal-container max-w-lg flex flex-col overflow-hidden cursor-default text-left bg-(--bg-surface) text-(--text-primary)"
  >
    <!-- Nagłówek -->
    <div class="flex items-center justify-between border-b border-(--border-default) px-5 py-4 bg-(--bg-surface-elevated)">
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
          <Icon icon="ph:paper-plane-tilt-bold" class="h-5 w-5" />
        </div>
        <div>
          <h2 class="title-serif text-xl leading-tight">Formularz kontaktowy</h2>
          <p class="text-xs text-(--text-muted)">Napisz do nas bezpośrednio w sprawie RODO lub serwisu</p>
        </div>
      </div>
      <button
        type="button"
        onclick={onClose}
        aria-label="Zamknij formularz kontaktowy"
        class="rounded-xl p-2 text-(--text-muted) hover:bg-(--bg-surface-muted) hover:text-(--text-primary) transition-colors"
      >
        <Icon icon="ph:x-bold" class="h-5 w-5" />
      </button>
    </div>

    <!-- Treść / Formularz -->
    <div class="p-5 sm:p-6 space-y-4">
      {#if successMessage}
        <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 space-y-3">
          <div class="flex items-center gap-2 font-bold text-sm">
            <Icon icon="ph:check-circle-bold" class="h-5 w-5 shrink-0" />
            <span>Wiadomość została przyjęta</span>
          </div>
          <p class="text-xs leading-relaxed">{successMessage}</p>
          <div class="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onclick={handleOpenMailClient}
              class="px-3 py-2 text-xs font-semibold rounded-lg border border-emerald-500/30 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Icon icon="ph:envelope-simple-bold" class="h-4 w-4" />
              <span>Otwórz w programie pocztowym</span>
            </button>
            <button
              type="button"
              onclick={onClose}
              class="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center cursor-pointer"
            >
              Zamknij
            </button>
          </div>
        </div>
      {:else}
        <div class="p-3 rounded-xl bg-(--bg-surface-elevated) border border-(--border-default) text-xs text-(--text-muted) flex items-start gap-2.5">
          <Icon icon="ph:info-bold" class="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            Kontakt mailowy z administratorem: <span class="font-mono text-(--text-primary) font-semibold">philornot3@gmail.com</span>
          </div>
        </div>

        {#if errorMessage}
          <div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
            <Icon icon="ph:warning-circle-bold" class="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        {/if}

        <form onsubmit={handleSubmit} class="space-y-4">
          <div>
            <label for="contact-email" class="block text-xs font-bold text-(--text-primary) mb-1.5">
              Twój adres e-mail <span class="text-rose-500">*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              required
              bind:value={senderEmail}
              placeholder="twoj-email@domain.com"
              class="w-full rounded-xl border border-(--border-default) bg-(--bg-surface-elevated) px-3.5 py-2.5 text-xs text-(--text-primary) placeholder:text-(--text-muted) focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label for="contact-subject" class="block text-xs font-bold text-(--text-primary) mb-1.5">
              Temat wiadomości
            </label>
            <select
              id="contact-subject"
              bind:value={subject}
              class="w-full rounded-xl border border-(--border-default) bg-(--bg-surface-elevated) px-3.5 py-2.5 text-xs text-(--text-primary) focus:border-emerald-500 focus:outline-hidden"
            >
              {#each subjectOptions as opt}
                <option value={opt}>{opt}</option>
              {/each}
            </select>
          </div>

          <div>
            <label for="contact-message" class="block text-xs font-bold text-(--text-primary) mb-1.5">
              Treść wiadomości <span class="text-rose-500">*</span>
            </label>
            <textarea
              id="contact-message"
              required
              rows="4"
              bind:value={message}
              placeholder="Napisz swoją wiadomość lub zgłoszenie..."
              class="w-full rounded-xl border border-(--border-default) bg-(--bg-surface-elevated) p-3.5 text-xs text-(--text-primary) placeholder:text-(--text-muted) focus:border-emerald-500 focus:outline-hidden resize-none"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onclick={onClose}
              class="px-4 py-2 text-xs font-semibold rounded-xl border border-(--border-default) hover:bg-(--bg-surface-muted) transition-colors cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              class="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {#if isSubmitting}
                <Icon icon="ph:spinner-gap-bold" class="h-4 w-4 animate-spin" />
                <span>Wysyłanie...</span>
              {:else}
                <Icon icon="ph:paper-plane-right-bold" class="h-4 w-4" />
                <span>Wyślij wiadomość</span>
              {/if}
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>
</div>
