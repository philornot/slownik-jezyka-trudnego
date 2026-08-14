<script lang="ts">
  // NOTE: all code comments/identifiers in English per user preference,
  // page copy stays in Polish to match the rest of the site.
  import Icon from '@iconify/svelte';
</script>

<svelte:head>
  <title>Usuwanie konta i danych - Słownik Języka Trudnego</title>
  <meta name="description" content="Jak usunąć konto i dane w aplikacji Słownik Języka Trudnego. Instrukcja usunięcia konta z poziomu aplikacji oraz informacja o usuwaniu wybranych danych." />
  <link rel="canonical" href="https://www.slownik-jezyka-trudnego.pl/usun-konto" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="https://www.slownik-jezyka-trudnego.pl/usun-konto" />
  <meta property="og:title" content="Usuwanie konta i danych - Słownik Języka Trudnego" />
  <meta property="og:description" content="Jak usunąć konto i dane w aplikacji Słownik Języka Trudnego." />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="Usuwanie konta i danych - Słownik Języka Trudnego" />
  <meta name="twitter:description" content="Jak usunąć konto i dane w aplikacji Słownik Języka Trudnego." />
</svelte:head>

<div class="min-h-screen bg-(--bg-app) text-(--text-primary) p-4 sm:p-8 flex flex-col items-center">
  <div class="w-full max-w-4xl space-y-6">

    <!-- Back bar -->
    <div class="flex items-center justify-between border-b border-(--border-default) pb-4">
      <a
        href="/"
        class="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl border border-(--border-default) bg-(--bg-surface) hover:bg-(--bg-surface-muted) transition-colors"
      >
        <Icon icon="ph:arrow-left-bold" class="h-4 w-4" />
        <span>Wróć do aplikacji</span>
      </a>
    </div>

    <main class="bg-(--bg-surface) border border-(--border-default) rounded-2xl p-6 sm:p-10 shadow-sm space-y-8">

      <header class="space-y-2 border-b border-(--border-default) pb-6">
        <h1 class="title-serif text-2xl sm:text-3xl font-bold">Usuwanie konta i danych</h1>
        <p class="text-sm text-(--text-muted)">
          Słownik Języka Trudnego - Ostatnia aktualizacja: sierpień 2026 r.
        </p>
      </header>

      <!-- Section 1: Delete account from app -->
      <section class="space-y-3">
        <h2 class="text-lg font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <Icon icon="ph:user-minus-bold" class="h-5 w-5 shrink-0" />
          <span>1. Usunięcie konta z poziomu aplikacji</span>
        </h2>
        <p class="text-sm text-(--text-muted) leading-relaxed">
          Jeśli posiadasz konto w aplikacji <strong>Słownik Języka Trudnego</strong> (na stronie internetowej lub w aplikacji mobilnej), możesz samodzielnie i w każdej chwili usunąć swoje konto wraz ze wszystkimi powiązanymi z nim danymi:
        </p>
        <ol class="list-decimal list-inside space-y-2 text-sm text-(--text-muted) pl-2">
          <li>Zaloguj się na swoje konto.</li>
          <li>Otwórz ustawienia konta (ikona profilu / menu konta).</li>
          <li>Wybierz opcję <strong class="text-(--text-primary)">„Usuń konto”</strong>.</li>
          <li>Potwierdź operację, wpisując wymagane słowo potwierdzające.</li>
        </ol>
        <p class="text-sm text-(--text-muted) leading-relaxed">
          Usunięcie konta jest <strong class="text-(--text-primary)">natychmiastowe i nieodwracalne</strong> - dane nie są przechowywane po tym czasie w żadnej formie umożliwiającej ich odzyskanie.
        </p>
      </section>

      <!-- Section 2: Request deletion without the app -->
      <section class="space-y-3">
        <h2 class="text-lg font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <Icon icon="ph:envelope-simple-open-bold" class="h-5 w-5 shrink-0" />
          <span>2. Prośba o usunięcie konta bez dostępu do aplikacji</span>
        </h2>
        <p class="text-sm text-(--text-muted) leading-relaxed">
          Jeżeli nie masz dostępu do aplikacji (np. ją odinstalowałeś/aś), możesz poprosić o usunięcie konta i danych drogą mailową. Napisz wiadomość na adres <a href="mailto:philornot3@gmail.com?subject=Usuni%C4%99cie%20konta%20-%20S%C5%82ownik%20J%C4%99zyka%20Trudnego" class="font-mono text-emerald-700 dark:text-emerald-400 font-semibold hover:underline">philornot3@gmail.com</a>, podając:
        </p>
        <ul class="list-disc list-inside space-y-2 text-sm text-(--text-muted) pl-2">
          <li>adres e-mail powiązany z kontem w aplikacji,</li>
          <li>nazwę użytkownika (jeśli została ustawiona),</li>
          <li>temat wiadomości: <span class="font-mono text-(--text-primary)">„Usunięcie konta”</span>.</li>
        </ul>
        <p class="text-sm text-(--text-muted) leading-relaxed">
          Konto oraz powiązane z nim dane zostaną usunięte w ciągu <strong class="text-(--text-primary)">30 dni</strong> od otrzymania i weryfikacji prośby.
        </p>
      </section>

      <!-- Section 3: Delete specific data without deleting the account -->
      <section class="space-y-3">
        <h2 class="text-lg font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <Icon icon="ph:trash-bold" class="h-5 w-5 shrink-0" />
          <span>3. Usunięcie wybranych danych bez usuwania konta</span>
        </h2>
        <p class="text-sm text-(--text-muted) leading-relaxed">
          Możesz też poprosić o usunięcie tylko części swoich danych, zachowując konto. Napisz na adres <a href="mailto:philornot3@gmail.com?subject=Usuni%C4%99cie%20danych%20-%20S%C5%82ownik%20J%C4%99zyka%20Trudnego" class="font-mono text-emerald-700 dark:text-emerald-400 font-semibold hover:underline">philornot3@gmail.com</a>, wskazując dokładnie, które dane mają zostać usunięte (np. historia powtórek, statystyki serii dni nauki, nazwa użytkownika). Prośby tego typu realizujemy w ciągu <strong class="text-(--text-primary)">30 dni</strong>.
        </p>
      </section>

      <!-- Section 4: What gets deleted / retained -->
      <section class="space-y-3">
        <h2 class="text-lg font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <Icon icon="ph:database-bold" class="h-5 w-5 shrink-0" />
          <span>4. Rodzaje usuwanych danych i okresy przechowywania</span>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div class="p-4 rounded-xl border border-(--border-default) bg-(--bg-surface-elevated)">
            <h3 class="font-bold text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Usuwane trwale</h3>
            <p class="text-xs text-(--text-muted)">Adres e-mail, UID konta, nazwa użytkownika, postępy w nauce (powtórki, interwały, serie dni), lista urządzeń zsynchronizowanych z kontem, ustawienia aplikacji.</p>
          </div>
          <div class="p-4 rounded-xl border border-(--border-default) bg-(--bg-surface-elevated)">
            <h3 class="font-bold text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Zachowywane po usunięciu</h3>
            <p class="text-xs text-(--text-muted)">Zanonimizowane dane techniczne (np. logi błędów) niepowiązane z tożsamością, przechowywane maksymalnie 90 dni wyłącznie w celach diagnostycznych i bezpieczeństwa.</p>
          </div>
        </div>
      </section>

      <!-- Section 5: link to privacy policy -->
      <section class="space-y-3">
        <h2 class="text-lg font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <Icon icon="ph:link-bold" class="h-5 w-5 shrink-0" />
          <span>5. Więcej informacji</span>
        </h2>
        <p class="text-sm text-(--text-muted) leading-relaxed">
          Szczegóły dotyczące przetwarzania danych osobowych znajdziesz w <a href="/polityka-prywatnosci" class="font-mono text-emerald-700 dark:text-emerald-400 font-semibold hover:underline">Polityce Prywatności</a>. W razie pytań napisz na <a href="mailto:philornot3@gmail.com" class="font-mono text-emerald-700 dark:text-emerald-400 font-semibold hover:underline">philornot3@gmail.com</a>.
        </p>
      </section>

    </main>
  </div>
</div>