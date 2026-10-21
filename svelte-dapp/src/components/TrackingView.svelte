<script>
  import { FileText, Star, ShieldCheck, ExternalLink, PackageCheck, Truck, RefreshCw, ChevronDown, ChevronUp } from 'lucide-svelte';

  let { lastOrder, setLastOrder = () => {}, navigate } = $props();

  let ordersHistory = $state([]);
  let isOrdersLoading = $state(true);

  // Estado para mostrar u ocultar la Trazabilidad de cada orden específica
  let expandedOrderTraceId = $state(null);

  // Calificaciones por orden (persistidas en localStorage)
  let ratingsByOrder = $state({});
  let hoveredRatingsByOrder = $state({});
  let submittedRatingsByOrder = $state({});

  function loadSavedRatings() {
    try {
      const saved = localStorage.getItem('terra_order_ratings');
      if (saved) {
        const parsed = JSON.parse(saved);
        ratingsByOrder = parsed.ratings || {};
        submittedRatingsByOrder = parsed.submitted || {};
      }
    } catch (e) {
      console.error("Error al cargar calificaciones guardadas:", e);
    }
  }

  function setOrderRating(orderId, star) {
    ratingsByOrder = { ...ratingsByOrder, [orderId]: star };
  }

  function setHoveredRating(orderId, star) {
    hoveredRatingsByOrder = { ...hoveredRatingsByOrder, [orderId]: star };
  }

  function submitRatingForOrder(orderId) {
    if (!ratingsByOrder[orderId]) return;
    submittedRatingsByOrder = { ...submittedRatingsByOrder, [orderId]: true };
    try {
      localStorage.setItem('terra_order_ratings', JSON.stringify({
        ratings: ratingsByOrder,
        submitted: submittedRatingsByOrder
      }));
    } catch (e) {
      console.error("Error al guardar calificación:", e);
    }
  }

  function toggleOrderTraceability(orderId) {
    if (expandedOrderTraceId === orderId) {
      expandedOrderTraceId = null;
    } else {
      expandedOrderTraceId = orderId;
    }
  }

  // Helper para asignar emoji según el cultivo
  function getCropEmoji(name) {
    if (!name) return '📦';
    const s = name.toLowerCase();
    if (s.includes('cebolla')) return '🧅';
    if (s.includes('palta')) return '🥑';
    if (s.includes('uva')) return '🍇';
    if (s.includes('cacao')) return '🍫';
    if (s.includes('mango')) return '🥭';
    if (s.includes('manzana')) return '🍎';
    if (s.includes('esparrago')) return '🌱';
    if (s.includes('quinua')) return '🌾';
    if (s.includes('arandano')) return '🫐';
    return '🛒';
  }

  // Cargar historial real desde Neon PostgreSQL
  async function loadRealOrders() {
    isOrdersLoading = true;
    try {
      const res = await fetch('http://localhost:3000/api/orders');
      if (res.ok) {
        const data = await res.json();
        ordersHistory = data;
      }
    } catch (err) {
      console.error("Error al cargar órdenes de Neon DB:", err);
    } finally {
      isOrdersLoading = false;
    }
  }

  $effect(() => {
    loadSavedRatings();
    loadRealOrders();
  });

  const pasos = [
    { id: 1, titulo: 'Contrato Sellado', descripcion: 'Bloqueado en Escrow', icon: '📝' },
    { id: 2, titulo: 'Preparando Cosecha', descripcion: 'Empacando en Fundo', icon: '📦' },
    { id: 3, titulo: 'En Tránsito', descripcion: 'Hacia Valle Grande / Cañete', icon: '🚚' },
    { id: 4, titulo: 'Entregado', descripcion: 'Fondos liberados al productor', icon: '✅' }
  ];

  function verBoletaCompleta(targetOrder) {
    setLastOrder(targetOrder);
    localStorage.setItem('terra_last_order', JSON.stringify(targetOrder));
    navigate('receipt');
  }
</script>

<div class="max-w-4xl mx-auto p-4 sm:p-6 mt-6 md:mt-10 space-y-6 animate-in fade-in duration-300">
  
  <!-- HISTORIAL DE COMPRAS REALES EN LA BASE DE DATOS -->
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border/60">
    <div>
      <h2 class="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
        Historial de Compras Reales en Blockchain 📜
      </h2>
      <p class="text-xs text-muted mt-1">Sincronizado directamente desde la base de datos Neon PostgreSQL.</p>
    </div>

    <button 
      onclick={loadRealOrders} 
      disabled={isOrdersLoading}
      class="flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors bg-panel/60 border border-border px-3.5 py-2 rounded-xl shadow-sm self-start sm:self-auto"
    >
      <RefreshCw class="w-3.5 h-3.5 {isOrdersLoading ? 'animate-spin text-primary' : ''}" />
      <span>Actualizar</span>
    </button>
  </div>

  {#if isOrdersLoading}
    <div class="p-12 text-center text-muted bg-panel/30 rounded-3xl border border-border animate-pulse">
      <RefreshCw class="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
      <p class="text-sm font-medium">Cargando compras desde Neon PostgreSQL Database...</p>
    </div>
  {:else if ordersHistory.length === 0}
    <div class="p-12 text-center text-muted bg-panel/30 rounded-3xl border border-border">
      <PackageCheck class="w-12 h-12 text-muted mx-auto mb-3 opacity-50" />
      <h4 class="text-white font-bold text-lg mb-1">Aún no hay compras registradas</h4>
      <p class="text-xs mb-4">Agrega productos al carrito y firma tu primera compra Web3.</p>
      <button onclick={() => navigate('market')} class="bg-primary text-black font-bold px-5 py-2.5 rounded-xl text-xs hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20">
        Ir al Mercado Spot
      </button>
    </div>
  {:else}
    <div class="space-y-4">
      {#each ordersHistory as compra}
        {@const parsedItems = typeof compra.items === 'string' ? JSON.parse(compra.items) : (compra.items || [])}
        {@const primerItem = parsedItems[0] || { nombre: 'Producto Agrícola', cantidad: 1 }}
        {@const isExpanded = expandedOrderTraceId === compra.id}
        {@const orderRating = ratingsByOrder[compra.id] || 0}
        {@const orderHovered = hoveredRatingsByOrder[compra.id] || 0}
        {@const isRated = submittedRatingsByOrder[compra.id]}

        <div class="bg-panel/40 backdrop-blur-md rounded-2xl p-5 border {isExpanded ? 'border-primary/60 shadow-xl' : 'border-border'} hover:border-primary/50 transition-all">
          
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 bg-dark rounded-2xl flex items-center justify-center text-3xl border border-border shrink-0 shadow-sm">
                {getCropEmoji(primerItem.nombre)}
              </div>
              <div>
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <span class="text-xs font-mono font-bold text-primary">#BOL-{compra.id}</span>
                  <span class="text-[11px] bg-dark text-muted px-2 py-0.5 rounded border border-border font-mono">
                    {compra.network || 'Sepolia'}
                  </span>
                  <span class="text-[11px] bg-success/15 text-success font-bold px-2 py-0.5 rounded border border-success/30">
                    ✓ Confirmado
                  </span>

                  {#if isRated}
                    <span class="text-[11px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded border border-primary/20 flex items-center gap-1">
                      ⭐ {orderRating}/5 Calificado
                    </span>
                  {/if}
                </div>

                <h4 class="text-white font-bold text-base mb-1">
                  {parsedItems.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')}
                </h4>

                <p class="text-xs text-muted flex items-center gap-2 font-mono flex-wrap">
                  <span>{new Date(compra.created_at).toLocaleString()}</span>
                  <span>•</span>
                  {#if compra.tx_hash}
                    <a 
                      href="{compra.explorer_url ? compra.explorer_url + '/tx/' + compra.tx_hash : 'https://sepolia.etherscan.io/tx/' + compra.tx_hash}" 
                      target="_blank" 
                      rel="noreferrer"
                      class="text-primary hover:underline flex items-center gap-0.5"
                    >
                      <span>Tx: {compra.tx_hash.slice(0, 10)}...</span>
                      <ExternalLink class="w-3 h-3 inline" />
                    </a>
                  {/if}
                </p>
              </div>
            </div>

            <!-- TOTAL Y BOTONES DE ACCIÓN (SIN BOTÓN DETALLES) -->
            <div class="flex flex-col sm:items-end w-full sm:w-auto border-t sm:border-0 border-border/60 pt-3 sm:pt-0 mt-2 sm:mt-0 gap-2">
              <div class="flex items-baseline gap-1">
                <span class="text-xl font-black font-mono text-white">
                  {parseFloat(compra.total_amount).toFixed(4)}
                </span>
                <span class="text-primary font-bold text-sm">{compra.currency}</span>
              </div>

              <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <!-- BOTÓN VER / OCULTAR TRAZABILIDAD -->
                <button 
                  onclick={() => toggleOrderTraceability(compra.id)}
                  class="bg-dark hover:bg-panel text-xs font-bold px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 {isExpanded ? 'border-primary text-primary bg-primary/10 shadow-sm' : 'border-border text-white hover:text-primary'}"
                  title="Ver más u ocultar la trazabilidad de esta cosecha"
                >
                  <Truck class="w-3.5 h-3.5 {isExpanded ? 'text-primary' : 'text-gray-400'}" />
                  <span>{isExpanded ? 'Ocultar Trazabilidad ▲' : 'Ver Trazabilidad ▼'}</span>
                </button>

                <!-- BOTÓN VER MÁS DETALLES DE MI COMPRA (BOLETA OFICIAL) -->
                <button 
                  onclick={() => {
                    const formatted = {
                      id: compra.id,
                      items: parsedItems,
                      total: parseFloat(compra.total_amount),
                      moneda: compra.currency,
                      fecha: new Date(compra.created_at).toLocaleString(),
                      gasFee: 0.0001,
                      to: compra.seller_wallet,
                      buyer: compra.buyer_wallet,
                      txHash: compra.tx_hash,
                      explorerUrl: compra.explorer_url,
                      networkName: compra.network
                    };
                    verBoletaCompleta(formatted);
                  }}
                  class="bg-primary hover:bg-primary-hover text-black text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
                >
                  <FileText class="w-3.5 h-3.5" />
                  <span>Ver más detalles de mi compra</span>
                </button>
              </div>
            </div>
          </div>

          <!-- SECCIÓN DESPLEGABLE: TRAZABILIDAD DE LA COSECHA + CALIFICACIÓN -->
          {#if isExpanded}
            <div class="mt-4 pt-5 border-t border-border/80 bg-dark/60 rounded-xl p-4 sm:p-6 animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
              
              <!-- Cabecera de la trazabilidad -->
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-xl">🌱</span>
                  <div>
                    <h5 class="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      Trazabilidad de la Cosecha #{compra.id}
                      <span class="text-[11px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-mono">
                        Smart Contract Escrow
                      </span>
                    </h5>
                    <p class="text-[11px] text-muted">
                      Cultivo: <span class="text-white font-medium">{parsedItems.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')}</span>
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  {#if compra.tx_hash}
                    <a 
                      href="{compra.explorer_url ? compra.explorer_url + '/tx/' + compra.tx_hash : 'https://sepolia.etherscan.io/tx/' + compra.tx_hash}"
                      target="_blank"
                      rel="noreferrer"
                      class="text-xs text-primary hover:underline font-mono flex items-center gap-1 bg-dark px-2.5 py-1 rounded-lg border border-border"
                    >
                      <span>Tx: {compra.tx_hash.slice(0, 10)}...</span>
                      <ExternalLink class="w-3 h-3" />
                    </a>
                  {/if}
                  <button 
                    onclick={() => toggleOrderTraceability(compra.id)}
                    class="text-xs text-muted hover:text-white flex items-center gap-1 px-2.5 py-1 rounded bg-panel border border-border"
                  >
                    <ChevronUp size={13} />
                    <span>Ocultar</span>
                  </button>
                </div>
              </div>

              <!-- Línea de tiempo horizontal de los 4 pasos -->
              <div class="relative py-4 px-2 sm:px-6">
                <div class="absolute top-10 left-[10%] right-[10%] h-1 bg-dark rounded-full border border-border/50"></div>
                <div
                  class="absolute top-10 left-[10%] h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(252,213,53,0.4)]"
                  style="width: 80%"
                ></div>

                <div class="flex justify-between relative z-10">
                  {#each pasos as paso}
                    <div class="flex flex-col items-center text-center w-1/4">
                      <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center text-xl sm:text-2xl z-10 mb-2 bg-panel border-primary text-white shadow-md">
                        {paso.icon}
                      </div>
                      <div class="flex flex-col px-0.5">
                        <h6 class="text-xs sm:text-sm font-bold text-white leading-tight">{paso.titulo}</h6>
                        <p class="text-[10px] sm:text-xs mt-0.5 font-medium text-primary leading-tight">{paso.descripcion}</p>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>

              <!-- Productor y estado de fondos -->
              <div class="bg-panel/40 p-3.5 rounded-xl border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div class="text-muted flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-success"></span>
                  <span>Productor: <strong class="text-white">Valle Grande / Cañete</strong> <span class="font-mono text-gray-400">({compra.seller_wallet?.slice(0, 10)}...{compra.seller_wallet?.slice(-6)})</span></span>
                </div>
                <div class="text-primary font-mono font-bold">
                  Fondos Liberados de Escrow ✓
                </div>
              </div>

              <!-- MÓDULO DE CALIFICACIÓN AL PRODUCTOR DE ESTA COSECHA -->
              <div class="bg-primary/5 border border-primary/20 rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center">
                {#if !isRated}
                  <h4 class="text-base sm:text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <span>Califica al Productor de Cañete</span>
                    <span>🌟</span>
                  </h4>
                  <p class="text-muted text-xs mb-4 max-w-md">
                    Tu calificación para el pedido <strong>#BOL-{compra.id}</strong> se registrará en la base de datos y la blockchain para verificar la reputación del agricultor.
                  </p>

                  <!-- Estrellas interactivas -->
                  <div class="flex gap-2 mb-4">
                    {#each [1, 2, 3, 4, 5] as star}
                      <button
                        type="button"
                        class="transition-transform hover:scale-125 focus:outline-none p-1"
                        onmouseenter={() => setHoveredRating(compra.id, star)}
                        onmouseleave={() => setHoveredRating(compra.id, 0)}
                        onclick={() => setOrderRating(compra.id, star)}
                        aria-label={`Calificar con ${star} estrellas`}
                      >
                        <Star
                          class="w-7 h-7 sm:w-8 sm:h-8 transition-colors duration-150 {star <= (orderHovered || orderRating) ? 'text-primary fill-primary drop-shadow-[0_0_8px_rgba(252,213,53,0.8)]' : 'text-muted stroke-[1.5]'}"
                        />
                      </button>
                    {/each}
                  </div>

                  <button
                    disabled={orderRating === 0}
                    onclick={() => submitRatingForOrder(compra.id)}
                    class="bg-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-hover text-black font-bold py-2 px-5 rounded-xl transition-all shadow-md shadow-primary/20 flex items-center gap-2 text-xs sm:text-sm"
                  >
                    <ShieldCheck size={16} /> Firmar Calificación de Cosecha
                  </button>
                {:else}
                  <div class="py-2">
                    <div class="w-10 h-10 bg-success/20 text-success rounded-full flex items-center justify-center border border-success/30 text-xl mx-auto mb-2">
                      ✓
                    </div>
                    <h4 class="text-base font-bold text-white mb-0.5">
                      ¡Calificación de {orderRating} Estrellas Registrada!
                    </h4>
                    <p class="text-muted text-xs mb-3">
                      Agradecimiento verificado enviado al productor de Valle Grande (Cañete).
                    </p>
                    <button
                      onclick={() => submittedRatingsByOrder = { ...submittedRatingsByOrder, [compra.id]: false }}
                      class="text-xs text-primary hover:underline"
                    >
                      Editar calificación
                    </button>
                  </div>
                {/if}
              </div>

            </div>
          {/if}

        </div>
      {/each}
    </div>
  {/if}

</div>
