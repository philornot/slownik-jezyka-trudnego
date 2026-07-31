import { runThemeWave } from './themeTransition';

export type ThemeName = 'light' | 'dark';

const STORAGE_KEY = 'sjt_theme_mode';

const META_COLOR: Record<ThemeName, string> = {
  light: '#f2f5f3',
  dark: '#0e1411'
};

let current = $state<ThemeName>('dark');

function isThemeName(value: string | null): value is ThemeName {
  return value === 'light' || value === 'dark';
}

function readStoredTheme(): ThemeName | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isThemeName(stored) ? stored : null;
  } catch {
    return null;
  }
}

function persistTheme(next: ThemeName): void {
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {}
}

function systemPrefersDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
}

function writeThemeToDom(next: ThemeName): void {
  document.documentElement.setAttribute('data-theme', next);
  if (next === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLOR[next]);
}

export const theme = {
  get current(): ThemeName {
    return current;
  }
};

export function initTheme(): void {
  if (typeof window === 'undefined') return;
  const storedTheme = readStoredTheme();
  current = storedTheme ?? (systemPrefersDark() ? 'dark' : 'light');
  writeThemeToDom(current);

  if (typeof matchMedia !== 'function') return;

  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    if (readStoredTheme()) return;
    const next: ThemeName = event.matches ? 'dark' : 'light';
    runThemeWave(null, () => {
      current = next;
      writeThemeToDom(next);
    });
  });
}

export function toggleTheme(originX: number, originY: number): void {
  const next: ThemeName = current === 'dark' ? 'light' : 'dark';
  runThemeWave({ x: originX, y: originY }, () => {
    current = next;
    writeThemeToDom(next);
    persistTheme(next);
  });
}
