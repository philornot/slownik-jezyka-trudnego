<script lang="ts">
  import Icon from '@iconify/svelte';

  interface Props {
    onClose: () => void;
    onOpenContact?: () => void;
  }

  let { onClose, onOpenContact }: Props = $props();

  let activeSection = $state<string>('admin');

  function scrollToSection(id: string) {
    activeSection = id;
    const el = document.getElementById(`privacy-sec-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
    class="sheet-container sm:modal-container max-w-3xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden cursor-default text-left bg-(--bg-surface) text-(--text-primary)"
  >
    <!-- Nagłówek -->
    <div class="flex items-center justify-between border-b border-(--border-default) px-5 py-4 bg-(--bg-surface-elevated)">
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
          <Icon icon="ph:shield-check-bold" class="h-5 w-5" />
        </div>
        <div>
          <h2 class="title-serif text-xl leading-tight">Polityka Prywatności i RODO</h2>
          <p class="text-xs text-(--text-muted)">Ochrona danych osobowych i zasady korzystania z serwisu</p>
        </div>
      </div>
      <button
        type="button"
        onclick={onClose}
        aria-label="Zamknij politykę prywatności"
        class="rounded-xl p-2 text-(--text-muted) hover:bg-(--bg-surface-muted) hover:text-(--text-primary) transition-colors"
      >
        <Icon icon="ph:x-bold" class="h-5 w-5" />
      </button>
    </div>

    <!-- Szybka nawigacja po sekcjach -->
    <div class="flex items-center gap-1.5 overflow-x-auto px-5 py-2.5 border-b border-(--border-default) bg-(--bg-surface-muted) scrollbar-none">
      <button
        type="button"
        onclick={() => scrollToSection('admin')}
        class="px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors {activeSection === 'admin' ? 'bg-emerald-600 text-white dark:bg-emerald-500' : 'text-(--text-muted) hover:bg-(--bg-surface)'}"
      >
        Administrator
      </button>
      <button
        type="button"
        onclick={() => scrollToSection('data')}
        class="px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors {activeSection === 'data' ? 'bg-emerald-600 text-white dark:bg-emerald-500' : 'text-(--text-muted) hover:bg-(--bg-surface)'}"
      >
        Zakres danych
      </button>
      <button
        type="button"
        onclick={() => scrollToSection('legal')}
        class="px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors {activeSection === 'legal' ? 'bg-emerald-600 text-white dark:bg-emerald-500' : 'text-(--text-muted) hover:bg-(--bg-surface)'}"
      >
        Podstawa prawna
      </button>
      <button
        type="button"
        onclick={() => scrollToSection('storage')}
        class="px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors {activeSection === 'storage' ? 'bg-emerald-600 text-white dark:bg-emerald-500' : 'text-(--text-muted) hover:bg-(--bg-surface)'}"
      >
        Cookies i LocalStorage
      </button>
      <button
        type="button"
        onclick={() => scrollToSection('rights')}
        class="px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors {activeSection === 'rights' ? 'bg-emerald-600 text-white dark:bg-emerald-500' : 'text-(--text-muted) hover:bg-(--bg-surface)'}"
      >
        Prawa RODO
      </button>
      <button
        type="button"
        onclick={() => scrollToSection('services')}
        class="px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors {activeSection === 'services' ? 'bg-emerald-600 text-white dark:bg-emerald-500' : 'text-(--text-muted) hover:bg-(--bg-surface)'}"
      >
        Firebase i Chmura
      </button>
    </div>

    <!-- Treść Polityki Prywatności -->
    <div class="flex-1 overflow-y-auto p-5 space-y-6 text-sm leading-relaxed select-text">
      
      <!-- Sekcja 1: Administrator -->
      <section id="privacy-sec-admin" class="space-y-2 border-b border-(--border-default) pb-5">
        <div class="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
          <Icon icon="ph:user-focus-bold" class="h-4 w-4 shrink-0" />
          <h3 class="text-base font-semibold">1. Administrator Danych Osobowych</h3>
        </div>
        <p class="text-(--text-muted)">
          Administratorem danych osobowych w rozumieniu Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO / GDPR) przetwarzanych w ramach aplikacji <strong>Słownik Języka Trudnego</strong> jest wydawca serwisu.
        </p>
        <p class="text-(--text-muted)">
          W sprawach związanych z ochroną danych osobowych oraz realizacją praw RODO możesz skontaktować się z nami pod adresem e-mail: <a href="mailto:philornot3@gmail.com" class="font-mono text-emerald-700 dark:text-emerald-400 font-semibold hover:underline">philornot3@gmail.com</a> lub poprzez nasz formularz kontaktowy.
        </p>
        {#if onOpenContact}
          <div class="pt-1">
            <button
              type="button"
              onclick={() => {
                onClose();
                onOpenContact();
              }}
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors cursor-pointer"
            >
              <Icon icon="ph:paper-plane-tilt-bold" class="h-3.5 w-3.5" />
              <span>Otwórz formularz kontaktowy</span>
            </button>
          </div>
        {/if}
      </section>

      <!-- Sekcja 2: Zakres i Cele Przetwarzania -->
      <section id="privacy-sec-data" class="space-y-3 border-b border-(--border-default) pb-5">
        <div class="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
          <Icon icon="ph:database-bold" class="h-4 w-4 shrink-0" />
          <h3 class="text-base font-semibold">2. Zakres i Cele Przetwarzania Danych</h3>
        </div>
        <p class="text-(--text-muted)">
          Dbamy o zasadę minimalizacji danych. Przetwarzamy wyłącznie dane niezbędne do prawidłowego świadczenia usługi nauki trudnych słów pojęciowych:
        </p>
        <ul class="list-disc list-inside space-y-2 text-(--text-muted) pl-2">
          <li>
            <strong class="text-(--text-primary)">Postępy w nauce i statystyki:</strong> algorytm powtórek SuperMemo-2 zapisuje liczbę powtórzeń, interwały czasu, daty ostatnich powtórek, wskaźniki zapamiętywania oraz serię dni nauki (streak).
          </li>
          <li>
            <strong class="text-(--text-primary)">Preferencje i ustawienia użytkownika:</strong> wybór motywu (jasny/ciemny), rozmiar czcionki, automatyczny odczyt głosowy (TTS), powiadomienia oraz wysoki kontrast.
          </li>
          <li>
            <strong class="text-(--text-primary)">Konto użytkownika (opcjonalne):</strong> w przypadku rejestracji przetwarzamy Twój adres e-mail, identyfikator Firebase UID oraz ewentualnie nazwę profilu (przy logowaniu przez Google OAuth).
          </li>
          <li>
            <strong class="text-(--text-primary)">Powiadomienia przeglądarkowe:</strong> token powiadomień Service Worker umożliwiający wysyłanie przypomnień o dziennej sesji powtórkowej.
          </li>
        </ul>
      </section>

      <!-- Sekcja 3: Podstawa Prawna -->
      <section id="privacy-sec-legal" class="space-y-3 border-b border-(--border-default) pb-5">
        <div class="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
          <Icon icon="ph:scales-bold" class="h-4 w-4 shrink-0" />
          <h3 class="text-base font-semibold">3. Podstawa Prawna Przetwarzania (Art. 6 RODO)</h3>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="p-3 rounded-xl border border-(--border-default) bg-(--bg-surface-elevated)">
            <h4 class="font-semibold text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Art. 6 ust. 1 lit. b RODO</h4>
            <p class="text-xs text-(--text-muted)">Niezbędność do wykonania umowy o świadczenie usługi drogą elektroniczną (realizacja sesji naukowych, zapamiętywanie historii powtórek i synchronizacja konta).</p>
          </div>
          <div class="p-3 rounded-xl border border-(--border-default) bg-(--bg-surface-elevated)">
            <h4 class="font-semibold text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Art. 6 ust. 1 lit. a RODO</h4>
            <p class="text-xs text-(--text-muted)">Dobrowolna zgoda użytkownika (włączenie powiadomień push oraz logowanie przez zewnętrznego dostawcę tożsamości).</p>
          </div>
          <div class="p-3 rounded-xl border border-(--border-default) bg-(--bg-surface-elevated) sm:col-span-2">
            <h4 class="font-semibold text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Art. 6 ust. 1 lit. f RODO</h4>
            <p class="text-xs text-(--text-muted)">Prawnie uzasadniony interes administratora polegający na zapewnieniu bezpieczeństwa, stabilności działania serwisu oraz diagnozowaniu usterek technicznych.</p>
          </div>
        </div>
      </section>

      <!-- Sekcja 4: LocalStorage i Cookies -->
      <section id="privacy-sec-storage" class="space-y-3 border-b border-(--border-default) pb-5">
        <div class="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
          <Icon icon="ph:cookie-bold" class="h-4 w-4 shrink-0" />
          <h3 class="text-base font-semibold">4. Pamięć Lokalna (LocalStorage) i Cookies</h3>
        </div>
        <p class="text-(--text-muted)">
          Aplikacja działa w modelu PWA (Progressive Web App) i wykorzystuje pamięć przeglądarki <strong class="text-(--text-primary)">LocalStorage</strong> oraz <strong class="text-(--text-primary)">Service Worker Cache</strong> zamiast śledzących plików cookies.
        </p>
        <p class="text-(--text-muted)">
          Dane zapisywane lokalnie pozostają wyłącznie na Twoim urządzeniu i nie są przekazywane podmiotom trzecim, chyba że zdecydujesz się zalogować i włączyć synchronizację w chmurze. Możesz w każdej chwili wyczyszczać dane lokalne z poziomu Ustawień aplikacji lub w opcjach przeglądarki.
        </p>
      </section>

      <!-- Sekcja 5: Prawa Użytkownika -->
      <section id="privacy-sec-rights" class="space-y-3 border-b border-(--border-default) pb-5">
        <div class="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
          <Icon icon="ph:gavel-bold" class="h-4 w-4 shrink-0" />
          <h3 class="text-base font-semibold">5. Prawa Użytkownika w Świetle RODO</h3>
        </div>
        <p class="text-(--text-muted)">Zgodnie z przepisami RODO przysługują Ci następujące prawa:</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div class="p-2.5 rounded-lg border border-(--border-default) bg-(--bg-surface-elevated) flex items-start gap-2">
            <Icon icon="ph:check-circle-bold" class="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong class="text-(--text-primary) block">Prawo dostępu i kopii danych</strong>
              <span class="text-(--text-muted)">Możliwość uzyskania informacji o przetwarzanych danych i ich kopii.</span>
            </div>
          </div>
          <div class="p-2.5 rounded-lg border border-(--border-default) bg-(--bg-surface-elevated) flex items-start gap-2">
            <Icon icon="ph:check-circle-bold" class="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong class="text-(--text-primary) block">Prawo do usunięcia danych ("Prawo do bycia zapomnianym")</strong>
              <span class="text-(--text-muted)">Dostępne m.in. poprzez opcję "Resetuj postęp" w ustawieniach.</span>
            </div>
          </div>
          <div class="p-2.5 rounded-lg border border-(--border-default) bg-(--bg-surface-elevated) flex items-start gap-2">
            <Icon icon="ph:check-circle-bold" class="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong class="text-(--text-primary) block">Prawo do sprostowania i ograniczenia</strong>
              <span class="text-(--text-muted)">Możliwość aktualizacji lub wstrzymania przetwarzania niepoprawnych danych.</span>
            </div>
          </div>
          <div class="p-2.5 rounded-lg border border-(--border-default) bg-(--bg-surface-elevated) flex items-start gap-2">
            <Icon icon="ph:check-circle-bold" class="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong class="text-(--text-primary) block">Prawo do przenoszenia i sprzeciwu</strong>
              <span class="text-(--text-muted)">Prawo do eksportu swoich postępów oraz wycofania udzielonych zgód.</span>
            </div>
          </div>
        </div>
        <p class="text-xs text-(--text-muted) pt-1">
          Masz również prawo wniesienia skargi do organu nadzorczego: <strong>Prezes Urzędu Ochrony Danych Osobowych (PUODO)</strong>, ul. Stawki 2, 00-193 Warszawa.
        </p>
      </section>

      <!-- Sekcja 6: Firebase i Chmura -->
      <section id="privacy-sec-services" class="space-y-3">
        <div class="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
          <Icon icon="ph:cloud-check-bold" class="h-4 w-4 shrink-0" />
          <h3 class="text-base font-semibold">6. Usługi Zewnętrzne i Przekazywanie Danych</h3>
        </div>
        <p class="text-(--text-muted)">
          Do świadczenia usługi opcjonalnej synchronizacji danych używamy platformy <strong>Google Firebase</strong> (Google Ireland Limited / Google LLC). Google świadczy usługi w oparciu o Standardowe Klauzule Umowne (SCC) zapewniające odpowiedni poziom ochrony danych osobowych.
        </p>
        <p class="text-(--text-muted)">
          Serwis nie sprzedaje, nie udostępnia i nie przetwarza Twoich danych osobowych w celach komercyjnych, marketingowych ani profilowania reklamowego.
        </p>
      </section>

    </div>

    <!-- Stopka modala z przyciskiem akceptacji -->
    <div class="flex items-center justify-between border-t border-(--border-default) px-5 py-3.5 bg-(--bg-surface-elevated)">
      <span class="text-xs text-(--text-muted)">Ostatnia aktualizacja: sierpień 2026 r.</span>
      <button
        type="button"
        onclick={onClose}
        class="px-5 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm cursor-pointer"
      >
        Rozumiem i akceptuję
      </button>
    </div>
  </div>
</div>
