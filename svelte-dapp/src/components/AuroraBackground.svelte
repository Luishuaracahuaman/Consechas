<script>
  let { starCount = 50 } = $props();

  // Generamos posiciones aleatorias para las estrellas (una sola vez)
  const stars = Array.from({ length: starCount }).map(() => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 2,
    opacityMax: Math.random() * 0.8
  }));
</script>

<div class="fixed inset-0 overflow-hidden bg-black text-slate-50 pointer-events-none -z-50">
  <!-- Capas de fondo ocultas para lectores de pantalla -->
  <div class="absolute inset-0 opacity-50 bg-aurora-gradient animate-aurora-pulse"></div>

  <!-- Burbujas de color desenfocadas (Blobs) -->
  <div class="absolute inset-0 mix-blend-screen opacity-100 transition-opacity duration-1000">
    <!-- Blob 1: Verde esmeralda oscuro -->
    <div class="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-emerald-900 rounded-full blur-[120px] opacity-40 animate-blob1"></div>
    <!-- Blob 2: Verde azulado oscuro -->
    <div class="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-teal-900 rounded-full blur-[120px] opacity-30 animate-blob2"></div>
    <!-- Blob 3: Verde pino oscuro -->
    <div class="absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-green-900 rounded-full blur-[120px] opacity-20 animate-blob3"></div>
  </div>

  <!-- Estrellas titilantes -->
  {#each stars as star}
    <div
      class="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
      style="left: {star.x}vw; top: {star.y}vh; animation-duration: {star.duration}s; animation-delay: {star.delay}s; --max-opacity: {star.opacityMax};"
    ></div>
  {/each}
</div>

<style>
  .bg-aurora-gradient {
    background-image: 
      radial-gradient(circle at 20% 30%, rgba(6,78,59,0.2) 0%, transparent 60%),
      radial-gradient(circle at 80% 80%, rgba(13,148,136,0.1) 0%, transparent 60%);
    background-size: 100% 100%;
  }

  @keyframes aurora-pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
  .animate-aurora-pulse {
    animation: aurora-pulse 10s infinite ease-in-out;
  }

  @keyframes blob1 {
    0%, 100% { transform: translate(-10%, -10%) scale(1); }
    50% { transform: translate(10%, 10%) scale(1.2); }
  }
  .animate-blob1 { animation: blob1 30s infinite ease-in-out; }

  @keyframes blob2 {
    0%, 100% { transform: translate(10%, 10%) scale(1); }
    50% { transform: translate(-10%, -10%) scale(1.3); }
  }
  .animate-blob2 { animation: blob2 40s infinite ease-in-out; }

  @keyframes blob3 {
    0%, 100% { transform: translate(10%, -10%) rotate(0deg); }
    50% { transform: translate(-10%, 10%) rotate(180deg); }
  }
  .animate-blob3 { animation: blob3 50s infinite ease-in-out; }

  @keyframes twinkle {
    0%, 100% { opacity: 0; }
    50% { opacity: var(--max-opacity); }
  }
  .animate-twinkle {
    animation-name: twinkle;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
  }
</style>
