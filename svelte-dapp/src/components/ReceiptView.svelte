<script>
  import { Shield, ShieldCheck, Download, Share2 } from 'lucide-svelte';

  let { lastOrder, navigate } = $props();

  let order = $derived(lastOrder || {
    items: [
      { id: '1', nombre: 'Palta Hass (Lote de Ejemplo)', precio: 850, cantidad: 1 }
    ],
    total: 850,
    moneda: 'USDT',
    icon: 'https://cryptologos.cc/logos/tether-usdt-logo.svg?v=025',
    fecha: new Date().toLocaleString(),
    gasFee: 0.50
  });

  function copyToClipboard() {
    alert("Boleta copiada al portapapeles.");
  }
</script>

<div class="max-w-2xl mx-auto px-4 md:px-6 mt-4 md:mt-10 mb-20">
  <div class="bg-[#181a20] rounded-3xl p-8 shadow-2xl border border-border relative overflow-hidden animate-in zoom-in-95 duration-500">
    <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success to-primary"></div>

    <h3 class="text-xl font-bold text-white mb-8 text-center tracking-wide">Detalle de mi Compra</h3>

    <div class="flex flex-col items-center mb-10 animate-in slide-in-from-bottom-4 fade-in duration-500" style="animation-delay: 100ms; animation-fill-mode: both;">
      <div class="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4 border border-success/20">
        <span class="text-success text-3xl">✓</span>
      </div>
      <h4 class="text-5xl font-black text-white mb-3 tracking-tight flex items-center gap-3">
        + {order.total.toFixed(2)}
        <span class="flex items-center gap-1.5 text-2xl text-primary bg-dark px-3 py-1 rounded-xl border border-border">
          {#if order.icon}
            <img src={order.icon} alt={order.moneda} class="w-6 h-6 bg-white rounded-full" />
          {/if}
          {order.moneda}
        </span>
      </h4>
      <p class="text-muted text-sm font-medium bg-dark px-4 py-1.5 rounded-full border border-border">Pago Confirmado en Smart Contract</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-border pt-6 mb-6 animate-in slide-in-from-bottom-4 fade-in duration-500" style="animation-delay: 200ms; animation-fill-mode: both;">

      <div class="space-y-4 text-sm font-medium bg-dark p-4 rounded-xl border border-border">
        <h5 class="text-primary text-xs font-bold uppercase tracking-widest border-b border-border pb-2 mb-3">Registro On-Chain (Público)</h5>
        <div class="flex justify-between items-center">
          <span class="text-muted">Red</span>
          <span class="text-white flex items-center gap-2"><div class="w-2 h-2 bg-purple-500 rounded-full"></div> Polygon</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-muted">Smart Contract</span>
          <span class="text-white font-mono text-xs">0x8f...4b2c</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-muted">Tx Hash</span>
          <span class="text-white font-mono text-xs truncate max-w-[100px]">0x{Math.random().toString(16).substr(2, 10)}</span>
        </div>
      </div>

      <div class="space-y-4 text-sm font-medium bg-dark p-4 rounded-xl border border-border relative overflow-hidden">
        <div class="absolute top-0 right-0 p-2 opacity-10"><Shield size={40} /></div>
        <h5 class="text-white text-xs font-bold uppercase tracking-widest border-b border-border pb-2 mb-3">Datos Legales Off-Chain (Privado)</h5>
        <div class="flex justify-between items-center relative z-10">
          <span class="text-muted">Comprador</span>
          <span class="text-white font-semibold flex items-center gap-1"><ShieldCheck class="text-success w-3 h-3" /> Verificado</span>
        </div>
        <div class="flex justify-between items-center relative z-10">
          <span class="text-muted">Dirección Envío</span>
          <span class="text-white font-semibold flex items-center gap-1"><ShieldCheck class="text-success w-3 h-3" /> Encriptada</span>
        </div>
      </div>

    </div>

    <div class="border-t border-border pt-6 mb-6 space-y-3 animate-in slide-in-from-bottom-4 fade-in duration-500" style="animation-delay: 300ms; animation-fill-mode: both;">
      <h5 class="text-muted text-xs font-bold uppercase tracking-widest mb-4">Artículos Pagados</h5>
      {#each order.items as item, idx}
        <div class="flex justify-between items-center text-sm">
          <span class="text-white flex items-center gap-2">
            <span class="bg-dark text-muted px-2 py-0.5 rounded text-xs border border-border">{item.cantidad}x</span>
            {item.nombre}
          </span>
          <span class="text-white font-semibold">{(item.precio * item.cantidad).toFixed(2)} {order.moneda}</span>
        </div>
      {/each}
    </div>

    <div class="border-t border-border pt-6 space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500" style="animation-delay: 400ms; animation-fill-mode: both;">
      <div class="flex justify-between items-center text-sm">
        <span class="text-muted">Subtotal</span>
        <span class="text-white font-bold">{order.total.toFixed(2)} {order.moneda}</span>
      </div>
      <div class="flex justify-between items-center text-sm">
        <span class="text-muted">Comisión de Red (Gas)</span>
        <span class="text-white font-bold">{order.gasFee.toFixed(2)} {order.moneda}</span>
      </div>
      <div class="flex justify-between items-center text-lg mt-6 bg-dark p-5 rounded-2xl border border-border shadow-inner">
        <span class="text-white font-bold">Total Pagado</span>
        <span class="text-primary font-black text-2xl">{(order.total + order.gasFee).toFixed(2)} {order.moneda}</span>
      </div>
    </div>
  </div>

  <!-- BOTONES DE ACCION -->
  <div class="flex flex-col sm:flex-row gap-4 mt-8 animate-in slide-in-from-bottom-4 fade-in duration-500 print:hidden" style="animation-delay: 500ms; animation-fill-mode: both;">
    <button onclick={() => window.print()} class="flex-1 bg-dark hover:bg-border text-white border border-border font-bold py-4 rounded-2xl transition-colors flex justify-center items-center gap-2 shadow-lg">
      <Download size={20} /> Descargar
    </button>
    <button onclick={copyToClipboard} class="flex-1 bg-dark hover:bg-border text-white border border-border font-bold py-4 rounded-2xl transition-colors flex justify-center items-center gap-2 shadow-lg">
      <Share2 size={20} /> Compartir
    </button>
    <button onclick={() => navigate('tracking')} class="flex-1 bg-primary hover:bg-primary-hover text-black font-bold py-4 rounded-2xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-primary/20">
      Tracking del Pedido
    </button>
  </div>
</div>
