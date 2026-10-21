<script>
  import { MessageSquare, ShieldCheck } from 'lucide-svelte';

  // Props
  let { carrito = $bindable(), navigate, showToast, setChatOpen, setChatTarget } = $props();

  let marketType = $state('spot');
  let filter = $state('all');
  let auditModal = $state(null);
  let addedToCartModal = $state(false);
  let products = $state([]);
  let loading = $state(true);

  // Fetch products from backend
  $effect(() => {
    fetch('http://localhost:3000/api/products')
      .then(res => res.json())
      .then(data => {
        // Inicializar funding: 0 para las del productor, 65 para los datos semilla
        products = data.map(p => ({
          ...p,
          price: parseFloat(p.price) > 0 ? parseFloat(p.price) : 0.0001,
          funding: p.fundo === 'Fundo Productor Local' ? 0 : 65
        }));
        loading = false;
      })
      .catch(err => {
        console.error("Error fetching products:", err);
        showToast("Error de conexión al servidor DB", "error");
        loading = false;
      });
  });

  let typeFiltered = $derived(products.filter(p => p.type === marketType));
  let filtered = $derived(
    filter === 'all' ? typeFiltered : 
    filter === 'mis_publicaciones' ? typeFiltered.filter(p => p.fundo === 'Fundo Productor Local') :
    typeFiltered.filter(p => p.category === filter)
  );

  let deleteModalOpen = $state(false);
  let itemToDelete = $state(null);
  let isDeleting = $state(false);

  function openDeleteModal(p) {
    itemToDelete = p;
    deleteModalOpen = true;
  }

  async function confirmDelete() {
    if (!itemToDelete) return;
    isDeleting = true;
    try {
      const res = await fetch(`http://localhost:3000/api/products/${itemToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        products = products.filter(p => p.id !== itemToDelete.id);
        showToast("Publicación eliminada correctamente.");
      } else {
        showToast("Error al eliminar la publicación.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error de conexión al servidor.", "error");
    } finally {
      isDeleting = false;
      deleteModalOpen = false;
      itemToDelete = null;
    }
  }
  
  let cartTotal = $derived(carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0));

  function handleAddToCart(product) {
    const unitPrice = parseFloat(product.price) > 0 ? parseFloat(product.price) : 0.0001;
    const existing = carrito.find(item => item.id === product.name);
    if (existing) {
      carrito = carrito.map(item => item.id === product.name ? { ...item, cantidad: item.cantidad + 1, precio: unitPrice } : item);
    } else {
      carrito = [...carrito, {
        id: product.name,
        nombre: product.name,
        precio: unitPrice,
        criptomoneda: 'tSYS',
        cantidad: 1,
        imagen: '🛒'
      }];
    }
    
    // Simular inversión: sumar 10% al fondeo
    if (product.type === 'futuro') {
      product.funding = Math.min(100, product.funding + 10);
    }

    addedToCartModal = true;
  }
</script>

<div class="max-w-7xl mx-auto px-4 md:px-5 py-5 md:py-10 mt-4 md:mt-10 animate-in fade-in duration-300">
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
    <div>
      <h2 class="text-2xl md:text-3xl font-bold mb-4 md:mb-0">
        {marketType === 'spot' ? 'Mercado Spot 🛒' : 'Mercado de Futuros 📅'}
      </h2>
    </div>

    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6">
      <div class="bg-dark rounded-lg p-1 border border-border flex">
        <button onclick={() => marketType = 'spot'} class="px-4 py-2 rounded-md font-bold text-sm transition-colors {marketType === 'spot' ? 'bg-panel text-white shadow' : 'text-muted hover:text-white'}">Spot (Stock)</button>
        <button onclick={() => marketType = 'futuro'} class="px-4 py-2 rounded-md font-bold text-sm transition-colors {marketType === 'futuro' ? 'bg-primary text-black shadow' : 'text-muted hover:text-white'}">Futuros</button>
      </div>

      <div class="flex gap-4 md:gap-5 overflow-x-auto pb-2 sm:pb-0 max-w-[90vw]">
        <button onclick={() => filter = 'all'} class="font-semibold pb-2 border-b-2 transition-colors whitespace-nowrap {filter === 'all' ? 'text-main border-primary' : 'text-muted border-transparent hover:text-main'}">Todos</button>
        <button onclick={() => filter = 'mis_publicaciones'} class="font-semibold pb-2 border-b-2 transition-colors whitespace-nowrap {filter === 'mis_publicaciones' ? 'text-main border-primary' : 'text-muted border-transparent hover:text-main'}">Mis Publicaciones</button>
        <button onclick={() => filter = 'frutas'} class="font-semibold pb-2 border-b-2 transition-colors whitespace-nowrap {filter === 'frutas' ? 'text-main border-primary' : 'text-muted border-transparent hover:text-main'}">Frutas locales</button>
        <button onclick={() => filter = 'export'} class="font-semibold pb-2 border-b-2 transition-colors whitespace-nowrap {filter === 'export' ? 'text-main border-primary' : 'text-muted border-transparent hover:text-main'}">Exportación</button>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#if loading}
      <!-- Esqueleto de Carga Animado -->
      {#each [1, 2, 3] as skeleton}
        <div class="bg-panel/40 backdrop-blur-md border border-white/10 rounded-xl p-5 flex flex-col gap-4 animate-pulse">
          <div class="w-full h-48 bg-dark rounded"></div>
          <div class="h-4 bg-dark rounded w-1/4"></div>
          <div class="h-6 bg-dark rounded w-3/4"></div>
          <div class="h-4 bg-dark rounded w-1/2 mb-2"></div>
          <div class="flex gap-2">
            <div class="h-8 bg-dark rounded w-24"></div>
            <div class="h-8 bg-dark rounded w-16"></div>
          </div>
          <div class="h-20 bg-dark rounded w-full mt-2"></div>
          <div class="h-10 bg-dark rounded w-full mt-auto"></div>
        </div>
      {/each}
    {:else}
      {#each filtered as p}
        <div class="bg-panel/40 backdrop-blur-md border border-white/10 rounded-xl p-5 flex flex-col group hover:border-primary/50 transition-colors animate-in fade-in zoom-in-95 duration-300 relative shadow-lg">
          {#if p.fundo === 'Fundo Productor Local'}
            <button onclick={() => openDeleteModal(p)} class="absolute top-2 right-2 z-10 bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110" title="Eliminar mi publicación">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          {/if}
        <div class="w-full h-48 rounded overflow-hidden mb-4 relative">
          <img src={p.img} alt={p.name} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
        <div class="bg-success-bg text-success border border-success px-2 py-1 rounded text-xs font-bold w-fit flex items-center gap-1 mb-3">
          <ShieldCheck size={14} /> Origen Verificado
        </div>
        <h3 class="text-xl font-bold mb-1">{p.name}</h3>
        <p class="text-muted text-sm mb-2">{p.fundo}</p>
        <div class="flex gap-2 text-xs text-muted mb-4 flex-wrap">
          <span class="px-2 py-1 rounded border border-border {p.type === 'futuro' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-dark'}">📅 {p.type === 'futuro' ? 'Estimado:' : 'Cosecha:'} {p.harvestDate}</span>
          <span class="bg-dark px-2 py-1 rounded border border-border flex items-center gap-1">⭐ {p.rating}</span>
        </div>
        <div class="flex justify-between items-center bg-dark p-4 rounded mb-5 border border-border">
          <div class="flex flex-col w-full">
            <div class="flex justify-between mb-2">
              <span class="text-sm font-medium">Lote: <strong class="text-white">{p.lot} KG</strong></span>
              <span class="text-xl font-bold text-main">{(parseFloat(p.price) || 0.0001).toFixed(4)} tSYS</span>
            </div>
            {#if p.type === 'futuro'}
              <div class="w-full mt-2">
                <div class="flex justify-between text-xs text-muted mb-1">
                  <span>Fondeado (Crowdfarming)</span>
                  <span class="text-primary font-bold">{p.funding}%</span>
                </div>
                <div class="w-full h-1.5 bg-border rounded-full overflow-hidden relative">
                  <div class="h-full bg-primary transition-all duration-1000 ease-out" style="width: {p.funding}%;"></div>
                </div>
              </div>
            {/if}
          </div>
        </div>
        <div class="flex flex-col gap-3 mt-auto">
          <div class="flex justify-between items-center">
            <button onclick={() => auditModal = p} class="text-muted text-sm underline hover:text-main transition-colors">Auditar Contrato</button>
            <button onclick={() => { setChatTarget(p.fundo); setChatOpen(true); }} class="text-primary text-sm flex items-center gap-1 hover:underline transition-colors">
              <MessageSquare size={16} /> Contactar
            </button>
          </div>
          <button onclick={() => handleAddToCart(p)} class="w-full bg-primary text-black font-semibold py-2 px-6 rounded hover:bg-primary-hover transition-colors shadow-lg shadow-primary/10">
            {p.type === 'futuro' ? 'Invertir en Fracción' : 'Añadir al carro'}
          </button>
        </div>
      </div>
    {/each}
    {/if}
  </div>

  {#if auditModal}
    <div class="fixed inset-0 bg-black/80 z-[9999] flex justify-center items-center p-4">
      <div class="bg-panel border border-border rounded-lg max-w-md w-full p-5 md:p-6 relative shadow-2xl">
        <button class="absolute top-4 right-4 text-muted hover:text-white" onclick={() => auditModal = null}>✕</button>
        <div class="flex items-center gap-2 mb-4 text-primary">
          <ShieldCheck size={24} />
          <h3 class="text-xl font-bold">Auditoría en Blockchain</h3>
        </div>
        <p class="text-sm text-muted mb-6">Los datos a continuación son inmutables y están verificados en la red Polygon.</p>

        <div class="space-y-4">
          <div class="bg-dark p-4 rounded border border-border">
            <p class="text-xs text-muted mb-1">Producto / Origen</p>
            <p class="font-semibold text-main">{auditModal.name}</p>
          </div>
          <div class="bg-dark p-4 rounded border border-border">
            <p class="text-xs text-muted mb-1">Entidad Productora</p>
            <p class="font-semibold text-main">{auditModal.fundo}</p>
            <p class="text-sm text-primary flex items-center gap-1 mt-1">⭐ {auditModal.rating} Estrellas</p>
          </div>
        </div>

        <button class="w-full bg-border text-white font-semibold py-3 rounded mt-6 hover:bg-dark transition-colors" onclick={() => auditModal = null}>
          Cerrar Auditoría
        </button>
      </div>
    </div>
  {/if}

  {#if addedToCartModal}
    <div class="fixed inset-0 bg-black/80 z-[9999] flex justify-center items-center p-5">
      <div class="bg-panel border border-border rounded-lg max-w-md w-full p-6 relative shadow-2xl">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 bg-success/20 text-success rounded-full flex items-center justify-center text-xl border border-success/30">✓</div>
          <h3 class="text-2xl font-bold text-white">Lista de mi Pedido</h3>
        </div>

        <div class="max-h-60 overflow-y-auto mb-6 pr-2 space-y-3">
          {#each carrito as item}
            <div class="flex justify-between items-center bg-dark p-3 rounded border border-border">
              <div>
                <p class="font-semibold text-white">{item.nombre}</p>
                <p class="text-xs text-muted">Cant: {item.cantidad}</p>
              </div>
              <p class="font-bold text-primary">{(item.precio * item.cantidad).toFixed(4)} tSYS</p>
            </div>
          {/each}
        </div>

        <div class="border-t border-border pt-4 mb-6 flex justify-between items-center">
          <span class="text-muted font-semibold">Subtotal:</span>
          <span class="text-xl font-bold text-white">{cartTotal.toFixed(4)} tSYS</span>
        </div>

        <div class="flex gap-3">
          <button onclick={() => addedToCartModal = false} class="flex-1 bg-dark border border-border text-white font-semibold py-3 rounded hover:bg-border transition-colors">
            Seguir comprando
          </button>
          <button onclick={() => { addedToCartModal = false; navigate('cart'); }} class="flex-1 bg-primary text-black font-semibold py-3 rounded hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20">
            Finalizar compra
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Modal Profesional de Confirmación de Eliminación -->
  {#if deleteModalOpen}
    <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex justify-center items-center p-4 transition-opacity animate-in fade-in duration-200">
      <div class="bg-panel border border-border rounded-xl max-w-sm w-full p-5 md:p-6 relative shadow-2xl animate-in zoom-in-95 duration-300">
        <div class="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 9-6 6"/><path d="m9 9 6 6"/><circle cx="12" cy="12" r="10"/></svg>
        </div>
        <h3 class="text-xl font-bold text-center text-white mb-2">¿Eliminar Producto?</h3>
        <p class="text-muted text-center text-sm mb-6">Estás a punto de eliminar <strong>{itemToDelete?.name}</strong>. Esta acción no se puede deshacer y se borrará de la blockchain de forma permanente.</p>
        
        <div class="flex gap-3">
          <button disabled={isDeleting} onclick={() => deleteModalOpen = false} class="flex-1 bg-dark text-white border border-border font-semibold py-2.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button disabled={isDeleting} onclick={confirmDelete} class="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 flex justify-center items-center gap-2 disabled:opacity-70">
            {#if isDeleting}
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Borrando...
            {:else}
              Sí, eliminar
            {/if}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
