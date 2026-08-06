/**
 * Lightweight debug logger for capturing console output and unhandled errors on mobile devices.
 */

export interface LogEntry {
  id: number;
  timestamp: string;
  type: 'info' | 'warn' | 'error';
  message: string;
}

let logs: LogEntry[] = [];
let listeners: Array<() => void> = [];
let logIdCounter = 0;
let isInitialized = false;

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function addLog(type: 'info' | 'warn' | 'error', message: string) {
  const entry: LogEntry = {
    id: ++logIdCounter,
    timestamp: new Date().toLocaleTimeString('pl-PL'),
    type,
    message: typeof message === 'string' ? message : JSON.stringify(message)
  };
  logs = [entry, ...logs.slice(0, 99)];
  notifyListeners();
}

export function getLogs(): LogEntry[] {
  return logs;
}

export function clearLogs() {
  logs = [];
  notifyListeners();
}

export function subscribeLogs(fn: () => void) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export function initDebugLogger() {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;

  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (...args: any[]) => {
    originalLog.apply(console, args);
    addLog('info', args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
  };

  console.warn = (...args: any[]) => {
    originalWarn.apply(console, args);
    addLog('warn', args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
  };

  console.error = (...args: any[]) => {
    originalError.apply(console, args);
    addLog('error', args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
  };

  window.addEventListener('error', (event) => {
    addLog('error', `Uncaught Error: ${event.message} at ${event.filename}:${event.lineno}`);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.message || event.reason || 'Unhandled Promise Rejection';
    addLog('error', `Unhandled Rejection: ${reason}`);
  });

  addLog('info', 'Debug logger initialized');
}
