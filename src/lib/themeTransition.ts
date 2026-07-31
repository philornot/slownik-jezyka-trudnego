export interface WaveOrigin {
  x: number;
  y: number;
}

interface ViewTransition {
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  finished: Promise<void>;
  skipTransition: () => void;
}

interface DocumentWithViewTransitions extends Omit<Document, 'startViewTransition'> {
  startViewTransition?: (callback: () => void) => ViewTransition;
}

const WAVE_DURATION_MS = 650;
const WAVE_EASING = 'cubic-bezier(0.65, 0, 0.35, 1)';
const CROSSFADE_CLASS = 'theme-crossfade';
const CROSSFADE_DURATION_MS = 500;

const MOBILE_MEDIA_QUERY = '(max-width: 768px)';
const MOBILE_WAVE_DURATION_MS = 500;

const MOBILE_CLIP_KEYFRAMES: Record<'horizontal' | 'vertical', string[]> = {
  horizontal: ['inset(0 50% 0 50%)', 'inset(0 0% 0 0%)'],
  vertical: ['inset(50% 0 50% 0)', 'inset(0% 0 0% 0)']
};

export type MobileWaveAxis = keyof typeof MOBILE_CLIP_KEYFRAMES;

let transitionInFlight: Promise<void> | null = null;

function isMobileViewport(): boolean {
  return typeof matchMedia === 'function' && matchMedia(MOBILE_MEDIA_QUERY).matches;
}

export function pickMobileAxis(random: () => number = Math.random): MobileWaveAxis {
  return random() < 0.5 ? 'horizontal' : 'vertical';
}

export function computeCoverRadius(x: number, y: number, width: number, height: number): number {
  const dx = Math.max(x, width - x);
  const dy = Math.max(y, height - y);
  return Math.hypot(dx, dy);
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function runThemeWave(origin: WaveOrigin | null, apply: () => void): void {
  if (transitionInFlight) return;

  if (prefersReducedMotion()) {
    apply();
    return;
  }

  const doc = document as DocumentWithViewTransitions;

  if (typeof doc.startViewTransition === 'function' && origin) {
    transitionInFlight = startWave(origin, apply).finally(() => {
      transitionInFlight = null;
    });
    return;
  }

  const root = document.documentElement;
  root.classList.add(CROSSFADE_CLASS);
  apply();
  transitionInFlight = new Promise<void>((resolve) => {
    window.setTimeout(() => {
      root.classList.remove(CROSSFADE_CLASS);
      transitionInFlight = null;
      resolve();
    }, CROSSFADE_DURATION_MS);
  });
}

function startWave(origin: WaveOrigin, apply: () => void): Promise<void> {
  const doc = document as DocumentWithViewTransitions;
  if (typeof doc.startViewTransition !== 'function') {
    apply();
    return Promise.resolve();
  }

  let transition: ViewTransition;
  try {
    transition = doc.startViewTransition(apply);
  } catch {
    apply();
    return Promise.resolve();
  }

  const settled = transition.finished.catch(() => {}).then(() => undefined);
  const mobile = isMobileViewport();

  transition.ready
    .then(() => {
      if (mobile) {
        document.documentElement.animate(
          {
            clipPath: [...MOBILE_CLIP_KEYFRAMES[pickMobileAxis()]]
          },
          {
            duration: MOBILE_WAVE_DURATION_MS,
            easing: WAVE_EASING,
            pseudoElement: '::view-transition-new(root)'
          }
        );
        return;
      }

      const { x, y } = origin;
      const vv = window.visualViewport;
      const width = vv ? vv.width : window.innerWidth;
      const height = vv ? vv.height : window.innerHeight;
      const endRadius = computeCoverRadius(x, y, width, height);

      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: WAVE_DURATION_MS,
          easing: WAVE_EASING,
          pseudoElement: '::view-transition-new(root)'
        }
      );
    })
    .catch(() => {});

  return settled;
}
