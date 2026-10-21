<script>
  import { ChevronLeft, ChevronDown, Shield, ShieldCheck } from 'lucide-svelte';
  import { ethers } from 'ethers';

  let { product, navigate, setLoading, setLoaderMsg, showToast } = $props();

  let moneda = $state('USDT');
  let loadingModal = $state(false);
  let successModal = $state(false);
  let txHash = $state(null);

  const hashPlaceholder = "0x" + Math.random().toString(16).substr(2, 10);
  const gasFee = 0.00001;
  let total = $derived((parseFloat(product?.price) || 0.0001) + gasFee);

  const opcionesPago = [
    { id: 'USDT', nombre: 'USDT', logo: 'https://cryptologos.cc/logos/tether-usdt-logo.svg' },
    { id: 'MATIC', nombre: 'MATIC', logo: 'https://cryptologos.cc/logos/polygon-matic-logo.svg' },
    { id: 'ETH', nombre: 'Ethereum', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg' }
  ];

  let logoSeleccionado = $derived(opcionesPago.find(m => m.id === moneda)?.logo);

  async function signTransaction() {
    if (!window.ethereum) {
      showToast("MetaMask no está instalado", "error");
      return;
    }

    loadingModal = true;
    try {
      // Connect to MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Dirección del productor destino (solicitada por el usuario)
      const toAddress = "0xfad3E2f30896bf812CF779730d25018B46BE4C32";
      
      // Amount in ETH/MATIC (monto seguro para pruebas en testnet)
      const amountParsed = ethers.parseEther("0.0001");

      // Enviar Tx Real
      const tx = await signer.sendTransaction({
        to: toAddress,
        value: amountParsed
      });

      // Esperar confirmación
      const receipt = await tx.wait();
      
      txHash = tx.hash;
      loadingModal = false;
      successModal = true;
    } catch (err) {
      console.error(err);
      loadingModal = false;
      showToast("La transacción falló o fue rechazada", "error");
    }
  }

  function descargarPDF() {
    window.print();
  }

  function compartirVoucher() {
    if (navigator.share) {
      navigator.share({
        title: 'Voucher de Pago AgriChain',
        text: `He pagado ${total.toFixed(2)} ${moneda} al productor ${product?.fundo} vía Smart Contract.`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      showToast('Tu navegador no soporta la API nativa para compartir.', 'error');
    }
  }

  function guardarQR() {
    showToast('Generando y guardando el código QR de trazabilidad...');
  }

  function closeSuccess() {
    successModal = false;
    navigate('home');
  }
</script>

<div class="max-w-2xl mx-auto px-4 md:px-5 py-5 md:py-10 mt-4 md:mt-10 animate-in fade-in duration-300">
  <button onclick={() => navigate('market')} class="flex items-center gap-1 text-muted hover:text-main transition-colors mb-6 text-sm">
    <ChevronLeft size={16} /> Volver al Mercado
  </button>

  <div class="bg-panel border border-border rounded-lg p-8 shadow-2xl">
    <h2 class="text-3xl font-bold mb-6 text-center">Resumen de Pago ⚖️</h2>

    <div class="bg-dark border border-border p-5 rounded-lg mb-8 space-y-2">
      <div class="flex justify-between">
        <span class="text-muted">Productor:</span>
        <span class="font-semibold">{product?.fundo || 'Productor Demo'}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-muted">Producto a Tokenizar:</span>
        <span class="font-semibold text-primary">{product?.name || 'Producto Demo'} ({product?.lot || 0} KG)</span>
      </div>
      <div class="flex justify-between">
        <span class="text-muted">Contrato Destino:</span>
        <span class="font-mono text-muted">{hash}</span>
      </div>
    </div>

    <div class="mb-8">
      <label class="block text-sm font-bold text-muted mb-3 uppercase tracking-wide">Pagar con:</label>
      <div class="relative">
        <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
          {#if logoSeleccionado}
            <img src={logoSeleccionado} class="w-6 h-6 drop-shadow-sm" alt="logo" />
          {/if}
        </div>
        <select
          bind:value={moneda}
          class="w-full appearance-none bg-dark border border-border text-white font-bold text-base rounded focus:outline-none focus:ring-0 focus:border-primary block py-4 pl-12 pr-10 shadow-sm cursor-pointer"
        >
          {#each opcionesPago as m}
            <option value={m.id}>{m.nombre}</option>
          {/each}
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted">
          <ChevronDown size={20} />
        </div>
      </div>
    </div>

    <div class="bg-primary/10 border-l-4 border-primary p-5 rounded-lg mb-8 flex flex-col items-center justify-center">
      <span class="text-xs font-bold text-primary uppercase tracking-wider mb-1">Total a Bloquear</span>
      <span class="text-4xl font-black text-primary">{total.toFixed(2)} <span class="text-xl font-bold">{moneda}</span></span>
    </div>

    <div class="bg-[#181a20] border border-border p-4 rounded-lg mb-8 text-sm text-muted">
      <div class="flex items-start gap-3">
        <Shield class="text-primary w-6 h-6 shrink-0 mt-0.5" />
        <p>
          <strong class="text-white block mb-1">Privacidad de Datos (Off-chain)</strong>
          Tus datos de envío se cifran y almacenan en bases de datos privadas (Off-chain) por cumplimiento legal. Solo el Hash criptográfico de la transacción se registra en Polygon (On-chain).
        </p>
      </div>
    </div>

    <button onclick={signTransaction} class="w-full bg-primary text-black text-lg font-bold py-4 rounded hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 flex justify-center items-center gap-2">
      <ShieldCheck /> Firmar Transacción Definitiva
    </button>
  </div>

  <!-- MODAL 1: Cargando -->
  {#if loadingModal}
    <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div class="bg-panel border border-border p-8 rounded-xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4">
        <div class="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin mb-6"></div>
        <p class="text-xl font-bold text-white text-center">Esperando confirmación...</p>
        <p class="text-sm text-primary mt-2 text-center">Interactuando con la red Polygon.</p>
      </div>
    </div>
  {/if}

  <!-- MODAL 2: Éxito (Voucher Digital) -->
  {#if successModal}
    <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <div class="bg-panel border border-border rounded-[2rem] shadow-2xl flex flex-col items-center max-w-md w-full relative overflow-hidden animate-in zoom-in duration-300 my-8">
        <div class="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-primary to-yellow-600"></div>

        <div class="p-8 w-full flex flex-col items-center print:p-0">
          <div class="success-checkmark mb-6">
            <div class="check-icon">
              <span class="icon-line line-tip"></span>
              <span class="icon-line line-long"></span>
              <div class="icon-circle"></div>
              <div class="icon-fix bg-panel"></div>
            </div>
          </div>

          <h3 class="text-2xl font-black text-white mb-1 uppercase tracking-wider text-center">¡Transferencia Exitosa!</h3>
          <p class="text-muted text-sm mb-6">{new Date().toLocaleString()}</p>

          <div class="bg-dark w-full py-6 rounded-2xl mb-6 text-center border border-border border-dashed">
            <span class="text-sm font-semibold text-muted uppercase tracking-wide">Monto Bloqueado en Escrow</span>
            <div class="text-5xl font-black text-white mt-2">
              {total.toFixed(2)} <span class="text-2xl text-primary">{moneda}</span>
            </div>
          </div>

          <div class="w-full text-left space-y-3 mb-8">
            <div class="flex justify-between items-center border-b border-border pb-2">
              <span class="text-muted text-sm">Destinatario:</span>
              <span class="font-bold text-white">{product?.fundo || 'Demo'}</span>
            </div>
            <div class="flex justify-between items-center pb-2">
              <span class="text-muted text-sm">Tx Hash:</span>
              <a href="https://polygonscan.com/tx/{txHash || hashPlaceholder}" target="_blank" rel="noopener noreferrer" class="font-mono text-primary hover:text-white font-bold text-xs bg-primary/10 px-2 py-1 rounded truncate max-w-[150px] underline">
                {txHash || hashPlaceholder}
              </a>
            </div>
          </div>

          <div class="w-full space-y-3 print:hidden">
            <button onclick={descargarPDF} class="w-full flex justify-center items-center gap-2 bg-primary hover:bg-primary-hover text-black font-bold py-3.5 px-4 rounded-xl transition-colors shadow-md">
              Descargar Voucher (PDF)
            </button>

            <div class="flex gap-3">
              <button onclick={compartirVoucher} class="flex-1 flex justify-center items-center gap-2 bg-dark hover:bg-border text-white border border-border font-bold py-3.5 rounded-xl transition-colors">
                Compartir
              </button>
              <button onclick={guardarQR} class="flex-1 flex justify-center items-center gap-2 bg-dark hover:bg-border text-white border border-border font-bold py-3.5 rounded-xl transition-colors">
                Código QR
              </button>
            </div>
          </div>

          <div class="flex flex-col w-full mt-6 gap-2 print:hidden">
            <button onclick={() => { successModal = false; navigate('tracking'); }} class="text-sm font-bold text-primary hover:text-white underline transition-colors">
              Ver Seguimiento del Pedido
            </button>
            <button onclick={closeSuccess} class="text-sm text-muted hover:text-white underline transition-colors">
              Volver al Mercado
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
