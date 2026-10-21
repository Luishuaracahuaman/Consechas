<script>
  import { Shield, ShieldCheck, Download, Share2, Database, CheckCircle2, ArrowLeft, ExternalLink, Printer } from 'lucide-svelte';

  let { lastOrder, navigate } = $props();

  let order = $state(null);

  $effect(() => {
    if (lastOrder) {
      order = lastOrder;
    } else {
      // 1. Restaurar de localStorage si existe
      const saved = localStorage.getItem('terra_last_order');
      if (saved) {
        try { 
          order = JSON.parse(saved); 
          return; 
        } catch(e){}
      }
      // 2. Si no, consultar la última orden registrada en Neon DB
      fetch('http://localhost:3000/api/orders/latest')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            order = {
              id: data.id,
              items: typeof data.items === 'string' ? JSON.parse(data.items) : data.items,
              total: parseFloat(data.total_amount),
              moneda: data.currency,
              fecha: new Date(data.created_at).toLocaleString(),
              gasFee: 0.0001,
              to: data.seller_wallet,
              buyer: data.buyer_wallet,
              txHash: data.tx_hash,
              explorerUrl: data.explorer_url,
              networkName: data.network
            };
          }
        })
        .catch(console.error);
    }
  });

  // Fallback si no hay nada aún
  let displayOrder = $derived(order || {
    id: 'DEMO-01',
    items: [
      { id: '1', nombre: 'Cacao Orgánico', precio: 0.0001, cantidad: 1 }
    ],
    total: 0.0001,
    moneda: 'tSYS',
    icon: 'https://cryptologos.cc/logos/starknet-token-strk-logo.svg',
    fecha: new Date().toLocaleString(),
    gasFee: 0.0001,
    to: '0xfad3E2f30896bf812CF779730d25018B46BE4C32',
    networkName: 'Syscoin Testnet'
  });

  function handlePrint() {
    window.print();
  }

  function copyToClipboard() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(displayOrder, null, 2));
      alert("Datos del comprobante copiados al portapapeles.");
    }
  }
</script>

<div class="max-w-2xl mx-auto px-4 md:px-6 mt-4 md:mt-10 mb-20">
  
  <!-- BARRA SUPERIOR DE NAVEGACION (NO IMPRESA) -->
  <div class="flex items-center justify-between mb-4 print:hidden">
    <button 
      onclick={() => navigate('tracking')} 
      class="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors font-medium bg-panel/40 px-3 py-1.5 rounded-lg border border-border"
    >
      <ArrowLeft class="w-4 h-4" />
      <span>Ir al Seguimiento (Tracking)</span>
    </button>

    <button 
      onclick={() => navigate('market')} 
      class="text-xs text-primary hover:underline font-bold"
    >
      Volver a la Tienda
    </button>
  </div>

  <!-- TARJETA OFICIAL IMPRIMIBLE -->
  <div 
    id="receipt-printable" 
    class="bg-[#181a20] rounded-3xl p-6 sm:p-8 shadow-2xl border border-border relative overflow-hidden animate-in zoom-in-95 duration-500"
  >
    <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-success via-primary to-emerald-400 print:hidden"></div>

    <!-- ENCABEZADO OFICIAL -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/70 mb-6 gap-3">
      <div>
        <h2 class="text-xs uppercase tracking-widest font-black text-primary print:text-black">TerraTrust • Valle Grande / Cañete</h2>
        <p class="text-lg font-black text-white print:text-black flex items-center gap-2">
          <span>Boleta Electrónica Web3</span>
          <span class="font-mono text-sm bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md print:bg-slate-100 print:text-black print:border-black">
            #BOL-{displayOrder.id ? displayOrder.id : '001'}
          </span>
        </p>
      </div>
      <div class="text-left sm:text-right font-mono text-xs text-muted print:text-black">
        <p class="font-bold">Emisión Inmutable</p>
        <p>{displayOrder.fecha || new Date().toLocaleString()}</p>
      </div>
    </div>

    <!-- MONTO DESTACADO -->
    <div class="flex flex-col items-center mb-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div class="w-16 h-16 bg-success/15 rounded-2xl flex items-center justify-center mb-4 border border-success/30 shadow-inner print:border-black print:bg-slate-100">
        <CheckCircle2 class="text-success w-9 h-9 print:text-black" />
      </div>
      <h4 class="text-4xl sm:text-5xl font-black text-white print:text-black mb-3 tracking-tight flex items-center gap-3">
        + {parseFloat(displayOrder.total || 0).toFixed(4)}
        <span class="flex items-center gap-1.5 text-2xl text-primary print:text-black bg-dark print:bg-slate-100 px-3 py-1 rounded-xl border border-border print:border-black">
          {#if displayOrder.icon}
            <img src={displayOrder.icon} alt={displayOrder.moneda} class="w-6 h-6 bg-white rounded-full p-0.5 print:hidden" />
          {/if}
          {displayOrder.moneda}
        </span>
      </h4>
      <div class="flex items-center gap-2 flex-wrap justify-center">
        <span class="text-success print:text-black text-xs font-semibold bg-success/10 print:bg-slate-100 px-3 py-1 rounded-full border border-success/30 print:border-black flex items-center gap-1">
          ✓ Pago Confirmado en Blockchain
        </span>
        <span class="text-primary print:text-black text-xs font-semibold bg-primary/10 print:bg-slate-100 px-3 py-1 rounded-full border border-primary/30 print:border-black flex items-center gap-1">
          <Database class="w-3 h-3" /> Guardado en Neon PostgreSQL
        </span>
      </div>
    </div>

    <!-- DATOS ON-CHAIN & OFF-CHAIN -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-6 mb-6">

      <div class="space-y-3 text-sm font-medium bg-dark/70 print:bg-slate-50 p-4 rounded-xl border border-border print:border-black">
        <h5 class="text-primary print:text-black text-xs font-bold uppercase tracking-widest border-b border-border/70 print:border-black pb-2 mb-2 flex items-center gap-1.5">
          <span>🔗 Registro On-Chain (Blockchain)</span>
        </h5>
        <div class="flex justify-between items-center text-xs">
          <span class="text-muted print:text-gray-700">Red:</span>
          <span class="text-white print:text-black font-bold flex items-center gap-1.5">
            <span class="w-2 h-2 bg-success rounded-full print:hidden"></span>
            {displayOrder.networkName || 'Sepolia Testnet'}
          </span>
        </div>
        <div class="flex justify-between items-center text-xs">
          <span class="text-muted print:text-gray-700">Beneficiario:</span>
          <span class="text-white print:text-black font-mono truncate max-w-[140px]" title={displayOrder.to || "0xfad3E2f30896bf812CF779730d25018B46BE4C32"}>
            {(displayOrder.to || "0xfad3E2f30896bf812CF779730d25018B46BE4C32").slice(0, 6)}...{(displayOrder.to || "0xfad3E2f30896bf812CF779730d25018B46BE4C32").slice(-4)}
          </span>
        </div>
        <div class="flex justify-between items-center text-xs">
          <span class="text-muted print:text-gray-700">Tx Hash:</span>
          {#if displayOrder.explorerUrl && displayOrder.txHash}
            <a 
              href="{displayOrder.explorerUrl}/tx/{displayOrder.txHash}" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="text-primary hover:underline font-mono truncate max-w-[140px] flex items-center gap-1 font-bold print:text-black print:underline"
              title={displayOrder.txHash}
            >
              {displayOrder.txHash.slice(0, 10)}... ↗
            </a>
          {:else}
            <span class="text-white print:text-black font-mono truncate max-w-[140px]" title={displayOrder.txHash || '0x...'}>
              {displayOrder.txHash ? displayOrder.txHash.slice(0, 10) + '...' : '0x...'}
            </span>
          {/if}
        </div>
      </div>

      <div class="space-y-3 text-sm font-medium bg-dark/70 print:bg-slate-50 p-4 rounded-xl border border-border print:border-black relative overflow-hidden">
        <div class="absolute top-0 right-0 p-2 opacity-10 pointer-events-none print:hidden"><Shield size={40} /></div>
        <h5 class="text-white print:text-black text-xs font-bold uppercase tracking-widest border-b border-border/70 print:border-black pb-2 mb-2">
          <span>🏛️ Registro Neon DB (Inmutable)</span>
        </h5>
        <div class="flex justify-between items-center text-xs relative z-10">
          <span class="text-muted print:text-gray-700">Estado en BD:</span>
          <span class="text-success print:text-black font-bold flex items-center gap-1">
            <ShieldCheck class="w-3.5 h-3.5 print:hidden" /> Confirmado
          </span>
        </div>
        <div class="flex justify-between items-center text-xs relative z-10">
          <span class="text-muted print:text-gray-700">Comprador:</span>
          <span class="text-white print:text-black font-mono truncate max-w-[140px]" title={displayOrder.buyer || "Cuenta Web3"}>
            {displayOrder.buyer ? displayOrder.buyer.slice(0, 6) + '...' + displayOrder.buyer.slice(-4) : '0xd00a...745f'}
          </span>
        </div>
        <div class="flex justify-between items-center text-xs relative z-10">
          <span class="text-muted print:text-gray-700">Trazabilidad:</span>
          <span class="text-primary print:text-black font-bold">Valle Grande / Cañete</span>
        </div>
      </div>

    </div>

    <!-- ARTICULOS PAGADOS -->
    <div class="border-t border-border pt-5 mb-5 space-y-2.5">
      <h5 class="text-muted print:text-black text-xs font-bold uppercase tracking-widest mb-3">Artículos de la Cosecha</h5>
      {#each (displayOrder.items || []) as item}
        <div class="flex justify-between items-center text-sm p-3 rounded-lg bg-dark/40 print:bg-slate-50 border border-border/50 print:border-slate-300">
          <span class="text-white print:text-black flex items-center gap-2 font-medium">
            <span class="bg-primary/10 print:bg-slate-200 text-primary print:text-black font-mono px-2 py-0.5 rounded text-xs border border-primary/20 print:border-slate-400">{item.cantidad}x</span>
            {item.nombre}
          </span>
          <span class="text-primary print:text-black font-mono font-bold">{(parseFloat(item.precio || 0.0001) * item.cantidad).toFixed(4)} {displayOrder.moneda}</span>
        </div>
      {/each}
    </div>

    <!-- TOTALES -->
    <div class="border-t border-border pt-5 space-y-3">
      <div class="flex justify-between items-center text-xs">
        <span class="text-muted print:text-gray-700">Subtotal Cosecha</span>
        <span class="text-white print:text-black font-mono font-bold">{parseFloat(displayOrder.total || 0).toFixed(4)} {displayOrder.moneda}</span>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-muted print:text-gray-700">Comisión de Red (Gas Testnet)</span>
        <span class="text-white print:text-black font-mono font-bold">{(displayOrder.gasFee || 0.0001).toFixed(4)} {displayOrder.moneda}</span>
      </div>
      <div class="flex justify-between items-center text-base mt-4 bg-dark print:bg-slate-100 p-4 rounded-2xl border border-border print:border-black shadow-inner">
        <span class="text-white print:text-black font-bold">Total Pagado</span>
        <span class="text-primary print:text-black font-black text-2xl font-mono">
          {(parseFloat(displayOrder.total || 0) + (displayOrder.gasFee || 0.0001)).toFixed(4)} {displayOrder.moneda}
        </span>
      </div>
    </div>

    <!-- PIE OFICIAL DE IMPRESION (SOLO IMPRESO) -->
    <div class="hidden print:block mt-8 pt-4 border-t border-black text-center text-[10px] text-gray-700 font-mono">
      <p class="font-bold">Comprobante emitido mediante Smart Contract en la Blockchain y registrado en Neon PostgreSQL.</p>
      <p>Hash: {displayOrder.txHash || 'N/A'}</p>
    </div>
  </div>

  <!-- BOTONES DE ACCIÓN (OCULTOS AL IMPRIMIR) -->
  <div class="flex flex-col sm:flex-row gap-4 mt-8 print:hidden">
    <button 
      onclick={handlePrint} 
      class="flex-1 bg-dark hover:bg-border text-white border border-border font-bold py-3.5 rounded-2xl transition-colors flex justify-center items-center gap-2 shadow-lg"
    >
      <Printer size={18} /> Imprimir / Guardar en PDF
    </button>
    <button 
      onclick={copyToClipboard} 
      class="flex-1 bg-dark hover:bg-border text-white border border-border font-bold py-3.5 rounded-2xl transition-colors flex justify-center items-center gap-2 shadow-lg"
    >
      <Share2 size={18} /> Copiar Datos
    </button>
    <button 
      onclick={() => navigate('tracking')} 
      class="flex-1 bg-primary hover:bg-primary-hover text-black font-bold py-3.5 rounded-2xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-primary/20"
    >
      Ver en Seguimiento (Tracking)
    </button>
  </div>
</div>

<style>
  @media print {
    :global(body *) {
      visibility: hidden !important;
    }
    #receipt-printable, :global(#receipt-printable *) {
      visibility: visible !important;
    }
    #receipt-printable {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 24px 30px !important;
      background: #ffffff !important;
      color: #000000 !important;
      border: 2px solid #000000 !important;
      border-radius: 8px !important;
      box-shadow: none !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    :global(.print\:hidden) {
      display: none !important;
    }
  }
</style>
