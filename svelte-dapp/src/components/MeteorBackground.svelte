<script>
  let { count = 40 } = $props();

  // Generamos meteoros con posiciones y tiempos aleatorios
  const meteors = Array.from({ length: count }).map(() => ({
    x: Math.random() * 150 - 25, // Posición horizontal inicial (-25vw a 125vw)
    y: Math.random() * 150 - 50, // Posición vertical inicial (-50vh a 100vh)
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 2, // 2s a 5s
  }));
</script>

<div class="fixed inset-0 overflow-hidden bg-[#050505] pointer-events-none -z-50">
  {#each meteors as meteor}
    <span
      class="absolute h-[1px] w-[150px] bg-gradient-to-r from-transparent via-white/20 to-white shadow-[0_0_8px_rgba(255,255,255,0.3)] rounded-full animate-meteor"
      style="
        left: {meteor.x}vw; 
        top: {meteor.y}vh; 
        animation-delay: {meteor.delay}s; 
        animation-duration: {meteor.duration}s;
      "
    >
      <!-- Cabeza brillante del meteoro -->
      <div class="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_15px_3px_rgba(255,255,255,0.8)]"></div>
    </span>
  {/each}
</div>

<style>
  @keyframes meteor {
    0% {
      /* 135 grados apunta hacia abajo a la izquierda */
      transform: rotate(135deg) translateX(0);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    70% {
      opacity: 1;
    }
    100% {
      /* Se mueve a lo largo de su eje X rotado (hacia abajo a la izquierda) */
      transform: rotate(135deg) translateX(1500px);
      opacity: 0;
    }
  }

  .animate-meteor {
    animation-name: meteor;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }
</style>
