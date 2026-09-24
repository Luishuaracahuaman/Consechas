<script>
  import {
    Home, Store, Sprout, Wallet, ShoppingCart, Truck
  } from 'lucide-svelte';

  let { currentView, navigate } = $props();

  function handleNavigate(view) {
    navigate(view);
  }
</script>

<div class="menubar-container relative flex h-[3.25rem] items-center justify-between rounded-xl border border-white/10 bg-[#0b0e11]/80 backdrop-blur-md shadow-lg shadow-black/50 px-2 text-white w-full max-w-4xl mx-auto">
  
  <!-- Inicio -->
  <button 
    class="flex-1 flex justify-center items-center gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all hover:bg-white/10 {currentView === 'home' ? 'bg-primary/10 text-primary' : 'text-zinc-300 hover:text-white'}"
    onclick={() => handleNavigate('home')}
  >
    <Home class="w-4 h-4" />
    <span class="hidden sm:inline">Inicio</span>
  </button>

  <!-- Mercado -->
  <button 
    class="flex-1 flex justify-center items-center gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all hover:bg-white/10 {currentView === 'market' ? 'bg-primary/10 text-primary' : 'text-zinc-300 hover:text-white'}"
    onclick={() => handleNavigate('market')}
  >
    <Store class="w-4 h-4" />
    <span class="hidden sm:inline">Mercado</span>
  </button>

  <!-- Productor -->
  <button 
    class="flex-1 flex justify-center items-center gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all hover:bg-white/10 {currentView === 'farmer' ? 'bg-primary/10 text-primary' : 'text-zinc-300 hover:text-white'}"
    onclick={() => handleNavigate('farmer')}
  >
    <Sprout class="w-4 h-4" />
    <span class="hidden sm:inline">Productor</span>
  </button>

  <!-- Saldos -->
  <button 
    class="flex-1 flex justify-center items-center gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all hover:bg-white/10 {currentView === 'balance' ? 'bg-primary/10 text-primary' : 'text-zinc-300 hover:text-white'}"
    onclick={() => handleNavigate('balance')}
  >
    <Wallet class="w-4 h-4" />
    <span class="hidden sm:inline">Saldos</span>
  </button>

  <div class="w-px h-6 bg-white/10 mx-1 hidden sm:block"></div>

  <!-- Carrito -->
  <button 
    class="flex-1 flex justify-center items-center gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all hover:bg-white/10 {currentView === 'cart' ? 'bg-primary/10 text-primary' : 'text-zinc-300 hover:text-white'}"
    onclick={() => handleNavigate('cart')}
  >
    <ShoppingCart class="w-4 h-4" />
    <span class="hidden sm:inline">Carrito</span>
  </button>

  <!-- Pedidos -->
  <button 
    class="flex-1 flex justify-center items-center gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all hover:bg-white/10 {currentView === 'tracking' ? 'bg-primary/10 text-primary' : 'text-zinc-300 hover:text-white'}"
    onclick={() => handleNavigate('tracking')}
  >
    <Truck class="w-4 h-4" />
    <span class="hidden sm:inline">Pedidos</span>
  </button>
</div>
