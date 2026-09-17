<script>
  import { ShoppingCart, ChevronDown, ShieldCheck } from 'lucide-svelte';

  let { navigate, carrito = $bindable(), setLastOrder } = $props();

  let monedaSeleccionada = $state('ETH');
  let isDropdownOpen = $state(false);
  let isProcessing = $state(false);

  const opcionesCripto = [
    { name: 'Ethereum Mainnet', symbol: 'ETH', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg' },
    { name: 'Polygon Mainnet', symbol: 'MATIC', icon: 'https://cryptologos.cc/logos/polygon-matic-logo.svg' },
    { name: 'Rollux', symbol: 'SYS', icon: 'https://cryptologos.cc/logos/zcash-zec-logo.svg' },
    { name: 'Syscoin NEVM', symbol: 'SYS', icon: 'https://cryptologos.cc/logos/syscoin-sys-logo.svg' },
    { name: 'Syscoin Testnet', symbol: 'tSYS', icon: 'https://cryptologos.cc/logos/starknet-token-strk-logo.svg' },
    { name: 'Base Sepolia', symbol: 'ETH', icon: 'https://avatars.githubusercontent.com/u/108554348?v=4' },
    { name: 'Ethereum Hoodi', symbol: 'ETH', icon: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg' },
    { name: 'Sepolia', symbol: 'ETH', icon: 'https://cryptologos.cc/logos/ethereum-classic-etc-logo.svg' }
  ];

  let criptoSeleccionada = $derived(opcionesCripto.find(c => c.symbol === monedaSeleccionada) || opcionesCripto[0]);
  let totalPagar = $derived(carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0));

  function handleCheckout() {
    isProcessing = true;
    setTimeout(() => {
      isProcessing = false;
      setLastOrder({
        items: [...carrito],
        total: totalPagar,
        moneda: monedaSeleccionada,
        icon: criptoSeleccionada.icon,
        fecha: new Date().toLocaleString(),
        gasFee: 0.50
      });
      carrito = [];
      navigate('receipt');
    }, 2000);
  }

  function aumentarCantidad(id) {
    carrito = carrito.map(item => item.id === id ? { ...item, cantidad: item.cantidad + 1 } : item);
  }

  function reducirCantidad(id) {
    carrito = carrito.map(item => item.id === id && item.cantidad > 1 ? { ...item, cantidad: item.cantidad - 1 } : item);
  }

  function eliminarProducto(id) {
    carrito = carrito.filter(item => item.id !== id);
  }
</script>

<div class="max-w-2xl mx-auto p-6 bg-panel rounded-3xl shadow-xl border border-border mt-10 animate-in fade-in duration-300">
  <div class="flex items-center justify-between mb-8">
    <h2 class="text-2xl font-black text-white flex items-center gap-2">
      Tu Carrito Web3 <ShoppingCart class="w-6 h-6 text-primary" />
    </h2>
    <span class="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full">{carrito.length} Items</span>
  </div>

  {#if carrito.length === 0}
    <div class="text-center py-10 text-muted">
      <p>Tu carrito está vacío.</p>
      <button onclick={() => navigate('market')} class="mt-4 text-primary underline">Volver al Mercado</button>
    </div>
  {/if}

  <div class="space-y-4 mb-8">
    {#each carrito as item}
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-dark rounded-2xl border border-border transition-all hover:border-primary/50 gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 bg-panel rounded-xl shadow-sm border border-border flex items-center justify-center text-3xl shrink-0">
            {item.imagen}
          </div>
          <div>
            <h4 class="font-bold text-white text-lg">{item.nombre}</h4>
            <p class="text-primary font-bold text-sm">{item.precio.toFixed(2)} {item.criptomoneda} / kg</p>
          </div>
        </div>

        <div class="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div class="flex items-center bg-panel border border-border rounded-lg shadow-sm overflow-hidden">
            <button onclick={() => reducirCantidad(item.id)} class="px-3 py-2 text-white hover:bg-border font-black transition-colors">-</button>
            <span class="px-4 py-2 font-bold text-white border-x border-border min-w-[3rem] text-center">{item.cantidad}</span>
            <button onclick={() => aumentarCantidad(item.id)} class="px-3 py-2 text-white hover:bg-border font-black transition-colors">+</button>
          </div>

          <button onclick={() => eliminarProducto(item.id)} class="text-red-400 hover:text-red-500 bg-red-900/20 hover:bg-red-900/40 p-2 rounded-lg transition-colors border border-red-900/50 shrink-0">
            🗑️
          </button>
        </div>
      </div>
    {/each}
  </div>

  <div class="border-t border-border pt-6">
    <div class="mb-6 p-5 rounded-xl bg-dark border border-border shadow-lg relative">
      <label class="block text-sm font-medium text-muted mb-3">Pagar con:</label>

      <div class="relative">
        <button
          type="button"
          onclick={() => isDropdownOpen = !isDropdownOpen}
          class="w-full flex items-center justify-between bg-panel border border-border rounded-lg p-3 text-white hover:bg-[#2b3139] focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
        >
          <div class="flex items-center space-x-3">
            <img src={criptoSeleccionada.icon} alt="Logo" class="w-6 h-6 rounded-full shadow-sm bg-white" />
            <span class="font-semibold">{criptoSeleccionada.name}</span>
            <span class="text-muted text-sm">({criptoSeleccionada.symbol})</span>
          </div>
          <ChevronDown class="w-5 h-5 text-muted transition-transform duration-200 {isDropdownOpen ? 'rotate-180' : ''}" />
        </button>

        {#if isDropdownOpen}
          <div class="absolute z-50 mt-2 w-full bg-panel border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
            <ul class="py-1 m-0">
              {#each opcionesCripto as cripto}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <li
                  onclick={() => { monedaSeleccionada = cripto.symbol; isDropdownOpen = false; }}
                  class="flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-dark transition-colors {cripto.symbol === monedaSeleccionada ? 'bg-dark' : ''}"
                >
                  <img src={cripto.icon} alt={cripto.name} class="w-6 h-6 rounded-full bg-white" />
                  <span class="text-white font-medium">{cripto.name}</span>
                  <span class="text-muted text-sm ml-auto">{cripto.symbol}</span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    </div>

    <div class="flex flex-col items-end">
      <span class="text-muted text-sm font-bold uppercase tracking-wider mb-1">Total a Pagar</span>
      <div class="text-4xl font-black text-white mb-6">
        {totalPagar.toFixed(2)} <span class="text-xl text-primary">{monedaSeleccionada}</span>
      </div>
      <button
        disabled={carrito.length === 0 || isProcessing}
        onclick={handleCheckout}
        class="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
      >
        {#if isProcessing}
          <div class="w-6 h-6 border-4 border-black/30 border-t-black rounded-full animate-spin"></div>
          <span>Procesando Pago Seguro...</span>
        {:else}
          <ShieldCheck class="w-6 h-6" />
          <span>Proceder al Pago Seguro</span>
        {/if}
      </button>
    </div>
  </div>
</div>
