<script lang="ts">
  import Icon from '@iconify/svelte';
  import {
    getFirebaseAuth,
    googleProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
  } from '../firebase';
  import { signInWithPopup, signInWithRedirect } from 'firebase/auth';
  import { getLastLoginMethod, saveLastLoginMethod } from '../storage';

  interface Props {
    onClose: () => void;
    onSuccess: () => void;
    onOpenPrivacy?: () => void;
  }

  let { onClose, onSuccess, onOpenPrivacy }: Props = $props();

  let mode = $state<'login' | 'register'>('login');
  let email = $state('');
  let password = $state('');
  let isSubmitting = $state(false);
  let errorMessage = $state<string | null>(null);
  let successMessage = $state<string | null>(null);
  let lastUsedMethod = $state<string | null>(getLastLoginMethod());

  async function handleGoogleLogin() {
    isSubmitting = true;
    errorMessage = null;
    try {
      const auth = getFirebaseAuth();
      try {
        const result = await signInWithPopup(auth, googleProvider);
        if (result?.user) {
          saveLastLoginMethod('google');
          onSuccess();
          onClose();
        }
      } catch (popupErr: any) {
        console.warn('Błąd okna logowania Google:', popupErr);
        const code = popupErr?.code || '';
        
        // Jeśli użytkownik zamknął okienko lub logowanie w okienku zakończyło się, nie wywołujemy ponownego przekierowania
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
          return;
        }

        // Przekierowanie wywołujemy wyłącznie wtedy, gdy okienka pop-up są zablokowane
        if (
          code === 'auth/popup-blocked' ||
          code === 'auth/operation-not-supported-in-this-environment'
        ) {
          await signInWithRedirect(auth, googleProvider);
          return;
        }

        throw popupErr;
      }
    } catch (err: any) {
      console.error('Błąd logowania przez Google:', err);
      const code = err?.code || '';
      const msg = err?.message || '';
      
      if (code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : '';
        errorMessage = `IP/Domena "${host}" nie jest w autoryzowanych domenach Firebase. Dodaj ją w Firebase Console -> Auth -> Settings -> Authorized Domains.`;
      } else if (code === 'auth/popup-blocked') {
        errorMessage = 'Przeglądarka zablokowała okienko logowania. Zezwól na wyskakujące okienka.';
      } else if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        errorMessage = msg || `Błąd logowania przez Google (${code || 'brak kodu'}).`;
      }
    } finally {
      isSubmitting = false;
    }
  }

  async function handleSubmitEmail(e: SubmitEvent) {
    e.preventDefault();
    if (!email || !password) {
      errorMessage = 'Uzupełnij adres email oraz hasło.';
      return;
    }

    isSubmitting = true;
    errorMessage = null;
    try {
      const auth = getFirebaseAuth();
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        saveLastLoginMethod('email');
        onSuccess();
        onClose();
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        saveLastLoginMethod('email');
        successMessage = 'Konto zostało pomyślnie utworzone!';
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = 'Nieprawidłowy adres e-mail lub hasło.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Konto o tym adresie e-mail już istnieje.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Hasło musi mieć co najmniej 6 znaków.';
      } else {
        errorMessage = err.message || 'Wystąpił błąd uwierzytelniania.';
      }
    } finally {
      isSubmitting = false;
    }
  }
</script>

<!-- Backdrop z opcją zamknięcia po kliknięciu w tło -->
<div
  role="button"
  tabindex="-1"
  onclick={onClose}
  onkeydown={(e) => e.key === 'Escape' && onClose()}
  class="sheet-backdrop sm:modal-backdrop cursor-pointer"
>
  <!-- Wnętrze modala -->
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
    <div class="flex items-center justify-between border-b border-(--border-default) bg-(--bg-surface-elevated) px-4 sm:px-6 py-3.5 sm:py-4">
      <div>
        <h2 class="title-serif text-xl">
          {mode === 'login' ? 'Zaloguj się' : 'Utwórz nowe konto'}
        </h2>
        <p class="text-xs font-bold text-(--text-muted)">
          Zapisuj swój postęp i synchronizuj słówka
        </p>
      </div>
      <button
        type="button"
        onclick={onClose}
        class="rounded-lg p-1.5 text-(--text-muted) hover:bg-(--bg-surface-muted) hover:text-(--text-primary)"
      >
        <Icon icon="ph:x-bold" class="h-5 w-5" />
      </button>
    </div>

    <div class="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <!-- Komunikaty o błędach / sukcesie -->
      {#if errorMessage}
        <div class="flex items-center gap-2 rounded-xl bg-(--rose-bg) border border-(--rose-border) p-3 text-xs font-bold text-(--rose-text)">
          <Icon icon="ph:warning-circle-bold" class="h-4 w-4 shrink-0 text-(--rose-icon)" />
          <span>{errorMessage}</span>
        </div>
      {/if}

      {#if successMessage}
        <div class="flex items-center gap-2 rounded-xl bg-(--emerald-bg) border border-(--emerald-border) p-3 text-xs font-bold text-(--emerald-text)">
          <Icon icon="ph:check-circle-bold" class="h-4 w-4 shrink-0 text-(--emerald-icon)" />
          <span>{successMessage}</span>
        </div>
      {/if}

      <!-- OPCJA 1: Logowanie przez Google -->
      <div class="space-y-2">
        <button
          type="button"
          disabled={isSubmitting}
          onclick={handleGoogleLogin}
          class="app-card-interactive relative flex w-full items-center justify-between p-3.5 min-h-12"
        >
          <div class="flex items-center gap-3">
            <svg class="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span class="text-xs font-bold text-(--text-primary)">Kontynuuj z Google</span>
          </div>

          {#if lastUsedMethod === 'google'}
            <span class="badge-amber text-[10px] py-0.5">
              <Icon icon="ph:sparkle-bold" class="h-3 w-3" />
              <span>Ostatnio użyte</span>
            </span>
          {/if}
        </button>
      </div>

      <div class="relative flex items-center justify-center">
        <div class="w-full border-t border-(--border-default)"></div>
        <span class="absolute bg-(--bg-surface) px-3 text-[10px] font-extrabold text-(--text-muted) uppercase">lub e-mail</span>
      </div>

      <!-- FORMULARZ LOGOWANIA EMAIL/HASŁO -->
      <form onsubmit={handleSubmitEmail} class="space-y-3.5">
        <div class="space-y-1.5">
          <label for="auth-email-input" class="text-xs font-extrabold text-(--text-primary) uppercase">Adres Email</label>
          <div class="relative">
            <Icon icon="ph:envelope-bold" class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-muted)" />
            <input
              id="auth-email-input"
              type="email"
              required
              bind:value={email}
              placeholder="twojadres@email.com"
              class="w-full rounded-xl border border-(--border-default) bg-(--bg-surface-elevated) pl-10 pr-4 py-3 text-xs font-bold text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--brand-primary) focus:outline-hidden"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label for="auth-password-input" class="text-xs font-extrabold text-(--text-primary) uppercase">Hasło</label>
          <div class="relative">
            <Icon icon="ph:lock-key-bold" class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-muted)" />
            <input
              id="auth-password-input"
              type="password"
              required
              bind:value={password}
              placeholder="••••••••"
              class="w-full rounded-xl border border-(--border-default) bg-(--bg-surface-elevated) pl-10 pr-4 py-3 text-xs font-bold text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--brand-primary) focus:outline-hidden"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          class="btn-touch mt-2"
        >
          <span>{mode === 'login' ? 'Zaloguj się' : 'Zarejestruj konto'}</span>
          <Icon icon="ph:arrow-right-bold" class="h-5 w-5" />
        </button>
      </form>

      <!-- PRZEŁĄCZNIK LOGOWANIE / REJESTRACJA -->
      <div class="border-t border-(--border-default) pt-4 text-center pb-2">
        {#if mode === 'login'}
          <p class="text-xs font-bold text-(--text-muted)">
            Nie masz jeszcze konta?
            <button
              type="button"
              onclick={() => {
                mode = 'register';
                errorMessage = null;
              }}
              class="font-extrabold text-(--text-amber-brand) hover:underline p-1"
            >
              Zarejestruj się
            </button>
          </p>
        {:else}
          <p class="text-xs font-bold text-(--text-muted)">
            Masz już konto?
            <button
              type="button"
              onclick={() => {
                mode = 'login';
                errorMessage = null;
              }}
              class="font-extrabold text-(--text-amber-brand) hover:underline p-1"
            >
              Przejdź do logowania
            </button>
          </p>
        {/if}
      </div>

      <div class="mt-2 text-center text-[11px] text-(--text-muted)">
        Rejestrując się lub logując, akceptujesz 
        <button
          type="button"
          onclick={() => {
            onClose();
            if (onOpenPrivacy) onOpenPrivacy();
          }}
          class="font-semibold underline hover:text-(--text-primary) transition-colors cursor-pointer"
        >
          Politykę Prywatności (RODO)
        </button>
      </div>
    </div>
  </div>
</div>
