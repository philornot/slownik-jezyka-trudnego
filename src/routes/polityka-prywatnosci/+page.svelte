<script lang="ts">
  import Icon from '@iconify/svelte';
</script>

<svelte:head>
  <title>Polityka Prywatności i RODO - Słownik Języka Trudnego</title>
  <meta name="description" content="Informacje o ochronie danych osobowych, zasadach przetwarzania danych oraz prawach użytkownika zgodnie z RODO (GDPR) w aplikacji Słownik Języka Trudnego." />
  <link rel="canonical" href="https://www.slownik-jezyka-trudnego.pl/polityka-prywatnosci" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="https://www.slownik-jezyka-trudnego.pl/polityka-prywatnosci" />
  <meta property="og:title" content="Polityka Prywatności i RODO - Słownik Języka Trudnego" />
  <meta property="og:description" content="Informacje o ochronie danych osobowych, zasadach przetwarzania danych oraz prawach użytkownika zgodnie z RODO (GDPR) w aplikacji Słownik Języka Trudnego." />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="Polityka Prywatności i RODO - Słownik Języka Trudnego" />
  <meta name="twitter:description" content="Informacje o ochronie danych osobowych i zasadach przetwarzania danych w aplikacji Słownik Języka Trudnego." />
</svelte:head>

<div class="min-h-screen bg-(--bg-app) text-(--text-primary) p-4 sm:p-8 flex flex-col items-center">
  <div class="w-full max-w-4xl space-y-6">
    
    <!-- Pasek powrotu -->
    <div class="flex items-center justify-between border-b border-(--border-default) pb-4">
      <a
        href="/"
        class="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl border border-(--border-default) bg-(--bg-surface) hover:bg-(--bg-surface-muted) transition-colors"
      >
        <Icon icon="ph:arrow-left-bold" class="h-4 w-4" />
        <span>Wróć do aplikacji</span>
      </a>
    </div>

    <!-- Karta z treścią Polityki -->
    <main class="bg-(--bg-surface) border border-(--border-default) rounded-2xl p-6 sm:p-10 shadow-sm space-y-8">
      
      <header class="space-y-2 border-b border-(--border-default) pb-6">
        <h1 class="title-serif text-2xl sm:text-3xl font-bold">Polityka prywatności i ochrona danych</h1>
        <p class="text-sm text-(--text-muted)">
          Słownik Języka Trudnego - Ostatnia aktualizacja: sierpień 2026 r.
        </p>
      </header>

      <!-- Sekcja 1: Administrator -->
      <section class="space-y-3">
        <h2 class="text-lg font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <Icon icon="ph:user-focus-bold" class="h-5 w-5 shrink-0" />
          <span>1. Administrator danych osobowych</span>
        </h2>
        <p class="text-sm text-(--text-muted) leading-relaxed">
          Administratorem danych osobowych w rozumieniu Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO / GDPR) jest wydawca aplikacji <strong>Słownik Języka Trudnego</strong>.
        </p>
        <p class="text-sm text-(--text-muted) leading-relaxed">
          W sprawach ochrony prywatności oraz realizacji przysługujących praw RODO można kontaktować się drogą elektroniczną pod adresem: <a href="mailto:philornot3@gmail.com" class="font-mono text-emerald-700 dark:text-emerald-400 font-semibold hover:underline">philornot3@gmail.com</a>.
        </p>
      </section>

      <!-- Sekcja 2: Zakres i Cele -->
      <section class="space-y-3">
        <h2 class="text-lg font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <Icon icon="ph:database-bold" class="h-5 w-5 shrink-0" />
          <span>2. Zakres i Cele Przetwarzania Danych</span>
        </h2>
        <p class="text-sm text-(--text-muted) leading-relaxed">
          Aplikacja realizuje naukę pojęć trudnych za pomocą algorytmu inteligentnych powtórek SuperMemo-2. Przetwarzamy wyłącznie dane konieczne do dostarczenia tej usługi:
        </p>
        <ul class="list-disc list-inside space-y-2 text-sm text-(--text-muted) pl-2">
          <li>
            <strong class="text-(--text-primary)">Postępy w nauce:</strong> zapis danych o powtórkach (interwały, powtórzenia, daty, seria dni nauki).
          </li>
          <li>
            <strong class="text-(--text-primary)">Ustawienia aplikacji:</strong> motyw wizualny, rozmiar tekstu, wysoki kontrast, automatyczny lektor TTS.
          </li>
          <li>
            <strong class="text-(--text-primary)">Konto użytkownika (opcjonalne):</strong> adres e-mail i UID w przypadku logowania oraz synchronizacji z chmurą.
          </li>
        </ul>
      </section>

      <!-- Sekcja 3: Podstawy Prawne -->
      <section class="space-y-3">
        <h2 class="text-lg font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <Icon icon="ph:scales-bold" class="h-5 w-5 shrink-0" />
          <span>3. Podstawy Prawne Przetwarzania (Art. 6 RODO)</span>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div class="p-4 rounded-xl border border-(--border-default) bg-(--bg-surface-elevated)">
            <h3 class="font-bold text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Art. 6 ust. 1 lit. b RODO</h3>
            <p class="text-xs text-(--text-muted)">Wykonanie umowy o świadczenie usługi drogą elektroniczną (realizacja nauki i powtórek słów).</p>
          </div>
          <div class="p-4 rounded-xl border border-(--border-default) bg-(--bg-surface-elevated)">
            <h3 class="font-bold text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Art. 6 ust. 1 lit. a RODO</h3>
            <p class="text-xs text-(--text-muted)">Zgoda użytkownika na wybrane funkcjonalności (powiadomienia PWA, zewnętrzny dostawca tożsamości).</p>
          </div>
        </div>
      </section>

      <!-- Sekcja 4: LocalStorage -->
      <section class="space-y-3">
        <h2 class="text-lg font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <Icon icon="ph:cookie-bold" class="h-5 w-5 shrink-0" />
          <span>4. Pamięć Lokalna i Brak Śledzących Plików Cookies</span>
        </h2>
        <p class="text-sm text-(--text-muted) leading-relaxed">
          Aplikacja wykorzystuje technologie pamięci podręcznej przeglądarki (LocalStorage oraz Service Worker). Nie stosujemy śledzących cookies podmiotów zewnętrznych ani skryptów analitycznych śledzących zachowania użytkownika w celach reklamowych.
        </p>
      </section>

      <!-- Sekcja 5: Prawa RODO -->
      <section class="space-y-3">
        <h2 class="text-lg font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <Icon icon="ph:gavel-bold" class="h-5 w-5 shrink-0" />
          <span>5. Prawa Użytkownika i Prawo do Skargi (PUODO)</span>
        </h2>
        <p class="text-sm text-(--text-muted) leading-relaxed">
          Użytkownikowi przysługuje prawo dostępu do treści swoich danych, ich sprostowania, usunięcia ("prawo do bycia zapomnianym"), ograniczenia przetwarzania, przenoszenia danych oraz wycofania zgody w dowolnym momencie.
        </p>
        <p class="text-sm text-(--text-muted) leading-relaxed">
          W przypadku naruszenia przepisów o ochronie danych masz prawo wniesienia skargi do organu nadzorczego: Prezes Urzędu Ochrony Danych Osobowych (PUODO), ul. Stawki 2, 00-193 Warszawa.
        </p>
      </section>

      <!-- Sekcja 6: Firebase -->
      <section class="space-y-3">
        <h2 class="text-lg font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <Icon icon="ph:cloud-check-bold" class="h-5 w-5 shrink-0" />
          <span>6. Usługi Zewnętrzne i Przekazywanie Danych</span>
        </h2>
        <p class="text-sm text-(--text-muted) leading-relaxed">
          W przypadku korzystania z logowania i synchronizacji w chmurze, dane są przetwarzane w infrastrukturze Google Firebase (Google Ireland Limited / Google LLC) z zachowaniem wymaganych gwarancji bezpieczeństwa (Standardowe Klauzule Umowne).
        </p>
      </section>

    </main>
  </div>
</div>
