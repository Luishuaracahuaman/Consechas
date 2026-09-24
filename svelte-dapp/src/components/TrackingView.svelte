<script>
  import { FileText, Star, ShieldCheck } from 'lucide-svelte';

  let { lastOrder, navigate } = $props();

  const productor = {
    finca: 'Fundo San Vicente',
    dueño: 'Carlos Mendoza',
    reputacion: 4.9
  };

  let pasoActual = $state(4); // Forzado a 4 para demo de Calificación
  let rating = $state(0);
  let hoveredRating = $state(0);
  let ratingSubmitted = $state(false);

  let order = $derived(lastOrder || {
    items: [
      { id: '1', nombre: 'Palta Hass (Lote de Ejemplo)', precio: 850, cantidad: 1 }
    ],
    total: 850,
    moneda: 'USDT',
    fecha: new Date().toLocaleString(),
    gasFee: 0.50
  });

  const pasos = [
    { id: 1, titulo: 'Contrato Sellado', descripcion: 'Bloqueado en Escrow', icon: '📝' },
    { id: 2, titulo: 'Preparando Cosecha', descripcion: 'Empacando', icon: '📦' },
    { id: 3, titulo: 'En Tránsito', descripcion: 'Saliendo de hacienda', icon: '🚚' },
    { id: 4, titulo: 'Entregado', descripcion: 'Fondos liberados', icon: '✅' }
  ];

  const historial = [
    { id: 'ORD-092', fecha: '05 Ago 2026', total: 450, cripto: 'USDC', estado: 'Entregado', item: 'Mango Edward Premium', emoji: '🥭' },
    { id: 'ORD-041', fecha: '28 Jul 2026', total: 1200, cripto: 'USDT', estado: 'Entregado', item: 'Cacao Orgánico (Lote 2)', emoji: '🍫' },
  ];
</script>

<div class="max-w-4xl mx-auto p-6 mt-10 space-y-6 animate-in fade-in duration-300">
  <div class="flex justify-between items-center mb-8">
    <h2 class="text-3xl font-black text-white">Seguimiento de mi Pedido 📦</h2>
    {#if lastOrder}
      <button onclick={() => navigate('receipt')} class="flex items-center gap-2 bg-dark border border-border px-4 py-2 rounded-lg hover:bg-border transition-colors text-sm font-bold text-white shadow-sm">
        <FileText size={16} /> Ver Boleta
      </button>
    {/if}
  </div>

  <!-- PEDIDO ACTUAL: PRODUCTOR + TRACKING HORIZONTAL -->
  <div class="bg-panel/40 backdrop-blur-md rounded-3xl shadow-xl border border-border overflow-hidden">
    <!-- Header / Producer Info -->
    <div class="p-6 md:p-8 border-b border-border bg-dark/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
      <div class="flex items-center gap-5">
        <div class="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center border-4 border-primary/30 text-3xl shadow-inner">
          🧑‍🌾
        </div>
        <div>
          <h3 class="text-xs font-bold text-muted uppercase tracking-widest mb-1.5">Comprado a:</h3>
          <h4 class="text-xl font-bold text-white leading-tight mb-1">{productor.finca}</h4>
          <p class="text-sm text-muted font-medium flex items-center gap-2">
            {productor.dueño} <span class="text-border">•</span> <span class="text-white bg-dark px-2 py-0.5 rounded border border-border shadow-sm">⭐ {productor.reputacion}/5</span>
          </p>
        </div>
      </div>
      <div>
        <span class="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold border border-primary/20 flex items-center gap-2 shadow-sm">
          <span class="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(252,213,53,0.8)]"></span>
          En Progreso
        </span>
      </div>
    </div>

    <!-- Tracking Horizontal -->
    <div class="p-6 md:p-10">
      <h3 class="text-lg font-bold text-white mb-10">Estado del Envío (Live Tracking)</h3>

      <div class="relative">
        <div class="absolute top-6 left-[10%] right-[10%] h-1 bg-dark rounded-full border border-border"></div>
        <div
          class="absolute top-6 left-[10%] h-1 bg-primary rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(252,213,53,0.5)]"
          style="width: {((pasoActual - 1) / (pasos.length - 1)) * 80}%"
        ></div>

        <div class="flex justify-between relative z-10">
          {#each pasos as paso}
            <div class="flex flex-col items-center text-center w-1/4">
              <div class="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full border-4 flex items-center justify-center transition-all duration-500 text-xl md:text-2xl z-10 mb-4 {pasoActual >= paso.id ? 'bg-panel border-primary shadow-[0_0_15px_rgba(252,213,53,0.3)] text-white scale-110' : 'bg-dark border-border text-muted grayscale'}">
                {paso.icon}
              </div>
              <div class="flex flex-col px-1">
                <h4 class="text-xs md:text-sm font-bold transition-colors {pasoActual >= paso.id ? 'text-white' : 'text-muted'}">{paso.titulo}</h4>
                <p class="text-[10px] md:text-xs mt-1 font-medium transition-colors {pasoActual >= paso.id ? 'text-primary' : 'text-gray-600'}">{paso.descripcion}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- MÓDULO DE REPUTACIÓN -->
    {#if pasoActual === 4}
      <div class="bg-primary/5 border-t border-primary/20 p-6 md:p-8 flex flex-col items-center justify-center animate-in slide-in-from-bottom-4 fade-in duration-500">
        {#if !ratingSubmitted}
          <h3 class="text-xl font-bold text-white mb-2 text-center">Califica a tu Productor</h3>
          <p class="text-muted text-sm mb-6 text-center max-w-md">Tu calificación se registrará inmutablemente en la Blockchain para ayudar a construir una red de confianza.</p>
          <div class="flex gap-2 mb-6">
            {#each [1, 2, 3, 4, 5] as star}
              <button
                class="transition-transform hover:scale-110 focus:outline-none"
                onmouseenter={() => hoveredRating = star}
                onmouseleave={() => hoveredRating = 0}
                onclick={() => rating = star}
              >
                <Star
                  class="w-10 h-10 transition-colors duration-200 {star <= (hoveredRating || rating) ? 'text-primary fill-primary drop-shadow-[0_0_8px_rgba(252,213,53,0.8)]' : 'text-muted stroke-[1.5]'}"
                />
              </button>
            {/each}
          </div>
          <button
            disabled={rating === 0}
            onclick={() => ratingSubmitted = true}
            class="bg-primary disabled:bg-border disabled:text-muted disabled:cursor-not-allowed hover:bg-primary-hover text-black font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <ShieldCheck /> Firmar Calificación (Web3)
          </button>
        {:else}
          <div class="text-center">
            <div class="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center border border-success/30 text-3xl mx-auto mb-4">
              ✓
            </div>
            <h3 class="text-xl font-bold text-white mb-2">¡Calificación Registrada!</h3>
            <p class="text-primary text-sm font-mono bg-dark px-3 py-1.5 rounded-lg border border-border inline-block">
              Tx: 0x{Math.random().toString(16).substr(2, 10)}... en Polygon
            </p>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- HISTORIAL DE PEDIDOS -->
  <div class="pt-8">
    <h3 class="text-2xl font-black text-white mb-6">Historial de Compras Pasadas 📜</h3>
    <div class="space-y-4">
      {#each historial as pedido}
        <div class="bg-panel/40 backdrop-blur-md rounded-2xl p-5 border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group">
          <div class="flex items-center gap-5">
            <div class="w-14 h-14 bg-dark rounded-2xl flex items-center justify-center text-3xl border border-border group-hover:scale-105 transition-transform shadow-sm">
              {pedido.emoji}
            </div>
            <div>
              <h4 class="text-white font-bold text-lg mb-1">{pedido.item}</h4>
              <p class="text-sm text-muted font-medium flex items-center gap-2">
                <span class="text-white/60">{pedido.id}</span>
                <span class="text-border">•</span>
                {pedido.fecha}
              </p>
            </div>
          </div>
          <div class="text-left sm:text-right w-full sm:w-auto flex sm:block justify-between items-center border-t sm:border-0 border-border pt-3 sm:pt-0 mt-2 sm:mt-0">
            <div class="text-white font-black text-lg">{pedido.total} <span class="text-primary text-sm font-bold">{pedido.cripto}</span></div>
            <div class="text-success text-xs font-bold sm:mt-1.5 bg-success/10 px-2.5 py-1 rounded-md border border-success/20 inline-block">
              ✓ {pedido.estado}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
