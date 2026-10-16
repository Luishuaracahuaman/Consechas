<script>
  let {
    label = "Conectar Wallet",
    onclick,
    className = "",
    fillColor = "#0b0e11", // Dark background matching TerraTrust panel
    labelColor = "#ffffff",
    accentColor = "#FCD34D", // TerraTrust yellow
    accentSoftColor = "#FBBF24",
    sweepDuration = 3,
    easeDuration = 0.8,
    arcWidth = 5,
    cornerRadius = 8, // Less rounded to match the TerraTrust style, or 32 for pill
    showSpeckle = true,
    showSheen = true,
    speckleOpacity = 0.4,
    showOnlineIndicator = false
  } = $props();
</script>

<svelte:head>
  <style>
    /* Global properties for the gradient animation (Houdini API) */
    @property --gradient-angle {
      syntax: "<angle>";
      initial-value: 0deg;
      inherits: false;
    }
    @property --gradient-angle-offset {
      syntax: "<angle>";
      initial-value: 0deg;
      inherits: false;
    }
    @property --gradient-percent {
      syntax: "<percentage>";
      initial-value: 5%;
      inherits: false;
    }
    @property --gradient-shine {
      syntax: "<color>";
      initial-value: white;
      inherits: false;
    }
  </style>
</svelte:head>

<button
  type="button"
  class="gleam-edge {className}"
  {onclick}
  style="
    --gleam-base: {fillColor};
    --gleam-label: {labelColor};
    --gleam-accent: {accentColor};
    --gleam-accent-soft: {accentSoftColor};
    --duration: {sweepDuration}s;
    --transition: {easeDuration}s cubic-bezier(0.25, 1, 0.5, 1);
    --arc-width: {arcWidth}%;
    --corner-radius: {cornerRadius}px;
    --speckle-opacity: {showSpeckle ? speckleOpacity : 0};
    --sheen-opacity: {showSheen ? 0.6 : 0};
  "
>
  <span class="flex items-center gap-2">
    {#if showOnlineIndicator}
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></span>
    {/if}
    {label}
  </span>
</button>

<style>
  .gleam-edge {
    --gleam-inset: #1a1818;
    --animation: gradient-angle linear infinite;
    --shadow-size: 2px;
    
    isolation: isolate;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    outline-offset: 4px;
    padding: 0.7rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    border: 1px solid transparent;
    border-radius: var(--corner-radius);
    color: var(--gleam-label);
    background:
      linear-gradient(var(--gleam-base), var(--gleam-base)) padding-box,
      conic-gradient(
        from calc(var(--gradient-angle) - var(--gradient-angle-offset)),
        transparent,
        var(--gleam-accent) var(--gradient-percent),
        var(--gradient-shine) calc(var(--gradient-percent) * 2),
        var(--gleam-accent) calc(var(--gradient-percent) * 3),
        transparent calc(var(--gradient-percent) * 4)
      ) border-box;
    box-shadow: inset 0 0 0 1px var(--gleam-inset);
    transition: var(--transition);
    transition-property: --gradient-angle-offset, --gradient-percent, --gradient-shine;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .gleam-edge::before,
  .gleam-edge::after,
  .gleam-edge span::before {
    content: "";
    pointer-events: none;
    position: absolute;
    inset-inline-start: 50%;
    inset-block-start: 50%;
    translate: -50% -50%;
    z-index: -1;
  }

  .gleam-edge:active {
    translate: 0 1px;
  }

  .gleam-edge::before {
    --size: calc(100% - var(--shadow-size) * 3);
    --position: 2px;
    --space: calc(var(--position) * 2);
    width: var(--size);
    height: var(--size);
    background: radial-gradient(
      circle at var(--position) var(--position),
      white calc(var(--position) / 4),
      transparent 0
    ) padding-box;
    background-size: var(--space) var(--space);
    background-repeat: space;
    mask-image: conic-gradient(
      from calc(var(--gradient-angle) + 45deg),
      black,
      transparent 10% 90%,
      black
    );
    border-radius: inherit;
    opacity: var(--speckle-opacity);
    z-index: -1;
  }

  .gleam-edge::after {
    --animation: shimmer linear infinite;
    width: 100%;
    aspect-ratio: 1;
    background: linear-gradient(
      -50deg,
      transparent,
      var(--gleam-accent),
      transparent
    );
    mask-image: radial-gradient(circle at bottom, transparent 40%, black);
    opacity: var(--sheen-opacity);
  }

  .gleam-edge span {
    z-index: 1;
  }

  .gleam-edge span::before {
    --size: calc(100% + 1rem);
    width: var(--size);
    height: var(--size);
    box-shadow: inset 0 -1ex 2rem 4px var(--gleam-accent);
    opacity: 0;
    transition: opacity var(--transition);
    animation: calc(var(--duration) * 1.5) breathe linear infinite;
  }

  .gleam-edge,
  .gleam-edge::before,
  .gleam-edge::after {
    animation:
      var(--animation) var(--duration),
      var(--animation) calc(var(--duration) / 0.4) reverse paused;
    animation-composition: add;
  }

  .gleam-edge:is(:hover, :focus-visible) {
    --gradient-percent: 20%;
    --gradient-angle-offset: 95deg;
    --gradient-shine: var(--gleam-accent-soft);
  }

  .gleam-edge:is(:hover, :focus-visible),
  .gleam-edge:is(:hover, :focus-visible)::before,
  .gleam-edge:is(:hover, :focus-visible)::after {
    animation-play-state: running;
  }

  .gleam-edge:is(:hover, :focus-visible) span::before {
    opacity: 1;
  }

  @keyframes gradient-angle {
    to { --gradient-angle: 360deg; }
  }

  @keyframes shimmer {
    to { rotate: 360deg; }
  }

  @keyframes breathe {
    from, to { scale: 1; }
    50% { scale: 1.2; }
  }
</style>
