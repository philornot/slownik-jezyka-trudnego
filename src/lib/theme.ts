/**
 * Moduł do zarządzania motywem Jasnym / Ciemnym z kołową animacją płynnego przejścia (View Transitions API)
 */

export type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'sjt_theme_mode';

/**
 * Zwraca aktualnie zapisany lub preferowany motyw
 */
export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/**
 * Aplikuje klasę .dark lub usuwa ją z elementu <html> bez animacji (np. przy załadowaniu strony)
 */
export function applyInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const theme = getStoredTheme();
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  return theme;
}

/**
 * Przełącza motyw z efektową kołową animacją fali rozchodzącej się z miejsca kliknięcia
 */
export function toggleThemeWithTransition(currentTheme: Theme, event?: MouseEvent): Theme {
  const nextTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';

  if (typeof window === 'undefined') return nextTheme;

  // Zapis w LocalStorage
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);

  // Sprawdzamy wsparcie dla View Transitions API
  const doc = document as unknown as {
    startViewTransition?: (callback: () => void) => { ready: Promise<void> };
  };

  const updateDOM = () => {
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!doc.startViewTransition) {
    updateDOM();
    return nextTheme;
  }

  // Wyliczamy promień koła tak, aby pokryć cały ekran z punktu kliknięcia
  const x = event?.clientX ?? window.innerWidth / 2;
  const y = event?.clientY ?? window.innerHeight / 2;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const transition = doc.startViewTransition(updateDOM);

  transition.ready.then(() => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`
    ];

    document.documentElement.animate(
      {
        clipPath: nextTheme === 'dark' ? clipPath : clipPath.reverse()
      },
      {
        duration: 450,
        easing: 'ease-in-out',
        pseudoElement: nextTheme === 'dark' ? '::view-transition-new(root)' : '::view-transition-old(root)'
      }
    );
  });

  return nextTheme;
}
