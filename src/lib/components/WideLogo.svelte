<script lang="ts">
  /**
   * Wektorowe logo "Słownik Języka Trudnego" (wersja szeroka).
   * Korzysta z pliku /slownik-jezyka-trudnego-logo.svg z katalogu static.
   * Maska CSS umożliwia dynamiczne zabarwienie oryginalnego pliku SVG
   * kolorem tekstowym rodziaca (bg-current / var(--brand-primary))
   * zarówno w motywie jasnym, jak i ciemnym.
   */
  interface Props {
    class?: string;
  }

  let { class: className = "" }: Props = $props();
</script>

<div
  class="bg-current transition-colors duration-300 {className}"
  style="
    mask: url('/slownik-jezyka-trudnego-logo.svg') no-repeat center / contain;
    -webkit-mask: url('/slownik-jezyka-trudnego-logo.svg') no-repeat center / contain;
  "
  aria-hidden="true"
></div>
