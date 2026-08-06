<script lang="ts">
  import { onMount } from 'svelte';
  import { getLogs, clearLogs, subscribeLogs, type LogEntry } from '../debugLogger';
  import Icon from '@iconify/svelte';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  let logList = $state<LogEntry[]>([]);
  let filter = $state<'all' | 'error' | 'warn' | 'info'>('all');
  let copied = $state(false);

  function refreshLogs() {
    logList = getLogs();
  }

  let filteredLogs = $derived(
    logList.filter((log) => (filter === 'all' ? true : log.type === filter))
  );

  onMount(() => {
    refreshLogs();
    const unsubscribe = subscribeLogs(refreshLogs);
    return () => unsubscribe();
  });

  function handleCopyLogs() {
    const text = logList
      .map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }

  function handleClear() {
    clearLogs();
    refreshLogs();
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
    class="sheet-container sm:modal-container max-w-2xl max-h-[85vh] flex flex-col overflow-hidden cursor-default text-left bg-(--bg-surface) text-(--text-primary)"
  >
    <!-- Nagłówek -->
    <div class="flex items-center justify-between border-b border-(--border-default) px-4 py-3 bg-(--bg-surface-elevated)">
      <div class="flex items-center gap-2">
        <Icon icon="ph:terminal-window-bold" class="h-5 w-5 text-(--brand-primary)" />
        <h2 class="title-serif text-lg">Logi diagnostyczne</h2>
        <span class="badge-neutral text-[10px]">{logList.length} zdarzeń</span>
      </div>
      <button
        type="button"
        onclick={onClose}
        class="rounded-lg p-1.5 text-(--text-muted) hover:bg-(--bg-surface-muted) hover:text-(--text-primary)"
      >
        <Icon icon="ph:x-bold" class="h-5 w-5" />
      </button>
    </div>

    <!-- Pasek narzędzi -->
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-default) px-4 py-2 bg-(--bg-surface-muted)">
      <div class="flex items-center gap-1">
        <button
          type="button"
          onclick={() => (filter = 'all')}
          class="px-2.5 py-1 text-xs font-bold rounded-lg transition-colors {filter === 'all' ? 'bg-(--brand-primary) text-white' : 'text-(--text-muted) hover:bg-(--bg-surface)'}"
        >
          Wszystkie
        </button>
        <button
          type="button"
          onclick={() => (filter = 'error')}
          class="px-2.5 py-1 text-xs font-bold rounded-lg transition-colors {filter === 'error' ? 'bg-(--rose-bg) text-(--rose-text) border border-(--rose-border)' : 'text-(--text-muted) hover:bg-(--bg-surface)'}"
        >
          Błędy
        </button>
        <button
          type="button"
          onclick={() => (filter = 'warn')}
          class="px-2.5 py-1 text-xs font-bold rounded-lg transition-colors {filter === 'warn' ? 'bg-(--amber-bg) text-(--amber-text) border border-(--amber-border)' : 'text-(--text-muted) hover:bg-(--bg-surface)'}"
        >
          Ostrzeżenia
        </button>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          onclick={handleCopyLogs}
          class="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-(--border-default) hover:bg-(--bg-surface) transition-colors text-(--text-primary)"
        >
          <Icon icon={copied ? 'ph:check-bold' : 'ph:copy-bold'} class="h-3.5 w-3.5" />
          <span>{copied ? 'Skopiowano!' : 'Kopiuj logi'}</span>
        </button>
        <button
          type="button"
          onclick={handleClear}
          class="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-(--rose-border) text-(--rose-text) hover:bg-(--rose-bg) transition-colors"
        >
          <Icon icon="ph:trash-bold" class="h-3.5 w-3.5" />
          <span>Wyczyść</span>
        </button>
      </div>
    </div>

    <!-- Lista logów -->
    <div class="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs select-text bg-black/90 text-zinc-200 min-h-[250px]">
      {#if filteredLogs.length === 0}
        <div class="py-8 text-center text-zinc-500 italic">Brak zarejestrowanych logów</div>
      {:else}
        {#each filteredLogs as log (log.id)}
          <div class="flex items-start gap-2 border-b border-zinc-800/60 pb-1.5 leading-relaxed">
            <span class="text-zinc-500 shrink-0 select-none">[{log.timestamp}]</span>
            {#if log.type === 'error'}
              <span class="bg-red-950 text-red-400 px-1 rounded text-[10px] font-bold uppercase shrink-0">ERR</span>
              <span class="text-red-300 break-all">{log.message}</span>
            {:else if log.type === 'warn'}
              <span class="bg-amber-950 text-amber-400 px-1 rounded text-[10px] font-bold uppercase shrink-0">WARN</span>
              <span class="text-amber-200 break-all">{log.message}</span>
            {:else}
              <span class="bg-zinc-800 text-zinc-400 px-1 rounded text-[10px] font-bold uppercase shrink-0">INFO</span>
              <span class="text-zinc-300 break-all">{log.message}</span>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>
