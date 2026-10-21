<script>
  import { ShoppingCart, ChevronDown, ShieldCheck, AlertCircle, Wallet, RefreshCw, ExternalLink, Copy, Check } from 'lucide-svelte';
  import { ethers } from 'ethers';

  let { 
    navigate, 
    carrito = $bindable(), 
    setLastOrder,
    isWalletConnected = false,
    account = null,
    showToast = () => {},
    currentNetwork = 'polygon',
    networks = {},
    openWalletModal = () => {}
  } = $props();

  // Dirección real del Productor (Cañete / Valle Grande)
  const DESTINATION_PRODUCER = "0xfad3E2f30896bf812CF779730d25018B46BE4C32";

  let selectedNetworkKey = $state('syscoin-testnet');
  let isDropdownOpen = $state(false);
  let isProcessing = $state(false);
  let statusMessage = $state('');
  let txError = $state('');
  let copiedAddress = $state(false);

  // Saldo real del usuario
  let userWalletBalance = $state(null);
  let isBalanceLoading = $state(false);

  // Monto simbólico mínimo para pruebas en testnet
  let montoBlockchain = $state("0.0001");

  const opcionesCripto = [
    { 
      name: 'Syscoin Testnet', 
      symbol: 'tSYS', 
      networkKey: 'syscoin-testnet', 
      chainId: '0x1644', 
      rpcUrl: 'https://rpc.tanenbaum.io', 
      explorerUrl: 'https://tanenbaum.io',
      faucetUrl: 'https://faucet.tanenbaum.io',
      icon: 'https://cryptologos.cc/logos/starknet-token-strk-logo.svg' 
    },
    { 
      name: 'Polygon Mainnet', 
      symbol: 'MATIC', 
      networkKey: 'polygon', 
      chainId: '0x89', 
      rpcUrl: 'https://polygon.llamarpc.com', 
      explorerUrl: 'https://polygonscan.com/',
      icon: 'https://cryptologos.cc/logos/polygon-matic-logo.svg' 
    },
    { 
      name: 'Rollux', 
      symbol: 'SYS', 
      networkKey: 'rollux', 
      chainId: '0x15f90', 
      rpcUrl: 'https://rpc.rollux.com', 
      explorerUrl: 'https://explorer.rollux.com',
      icon: 'https://cryptologos.cc/logos/zcash-zec-logo.svg' 
    },
    { 
      name: 'Syscoin NEVM', 
      symbol: 'SYS', 
      networkKey: 'syscoin-nevm', 
      chainId: '0x39', 
      rpcUrl: 'https://rpc.syscoin.org', 
      explorerUrl: 'https://explorer.syscoin.org',
      icon: 'https://cryptologos.cc/logos/syscoin-sys-logo.svg' 
    },
    { 
      name: 'Base Sepolia', 
      symbol: 'ETH', 
      networkKey: 'base-sepolia', 
      chainId: '0x14a34', 
      rpcUrl: 'https://sepolia.base.org', 
      explorerUrl: 'https://sepolia-explorer.base.org',
      faucetUrl: 'https://www.alchemy.com/faucets/base-sepolia',
      icon: 'https://avatars.githubusercontent.com/u/108554348?v=4' 
    },
    { 
      name: 'Ethereum Mainnet', 
      symbol: 'ETH', 
      networkKey: 'ethereum', 
      chainId: '0x1', 
      rpcUrl: 'https://cloudflare-eth.com', 
      explorerUrl: 'https://etherscan.io',
      icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg' 
    },
    { 
      name: 'Sepolia', 
      symbol: 'ETH', 
      networkKey: 'sepolia', 
      chainId: '0xaa36a7', 
      rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com', 
      explorerUrl: 'https://sepolia.etherscan.io',
      faucetUrl: 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia',
      icon: 'https://cryptologos.cc/logos/ethereum-classic-etc-logo.svg' 
    }
  ];

  let criptoSeleccionada = $derived(opcionesCripto.find(c => c.networkKey === selectedNetworkKey) || opcionesCripto[0]);
  let monedaSeleccionada = $derived(criptoSeleccionada.symbol);

  // Auto-normalizar cualquier precio residual antiguo (como 1500) al mínimo 0.0001 para que la prueba no cueste nada
  $effect(() => {
    if (carrito && carrito.length > 0) {
      let needsFix = false;
      const fixed = carrito.map(item => {
        const p = parseFloat(item.precio);
        if (!p || p > 0.1 || isNaN(p)) {
          needsFix = true;
          return { ...item, precio: 0.0001, criptomoneda: monedaSeleccionada };
        }
        return item;
      });
      if (needsFix) {
        carrito = fixed;
      }
    }
  });

  let totalPagar = $derived(carrito.reduce((acc, item) => acc + (parseFloat(item.precio || 0.0001) * item.cantidad), 0));

  // Sincronizar automáticamente el monto de la transacción con el total de productos
  $effect(() => {
    if (totalPagar > 0) {
      montoBlockchain = totalPagar.toFixed(4);
    }
  });

  // Consultar el saldo real en la blockchain cada vez que cambia la cuenta o moneda
  $effect(() => {
    if (account) {
      fetchUserBalance();
    } else {
      userWalletBalance = null;
    }
  });

  async function fetchUserBalance() {
    if (!account) return;
    isBalanceLoading = true;
    txError = '';
    try {
      // 1. Consultar el RPC de la red seleccionada directamente (para tSYS es rpc.tanenbaum.io)
      const targetRpc = criptoSeleccionada.rpcUrl || (networks[currentNetwork]?.rpcUrls?.[0]);
      if (targetRpc) {
        try {
          const jsonRpc = new ethers.JsonRpcProvider(targetRpc);
          const bal = await jsonRpc.getBalance(account);
          userWalletBalance = ethers.formatEther(bal);
          isBalanceLoading = false;
          return;
        } catch (rpcErr) {
          console.warn("RPC directo falló, probando wallet browser provider:", rpcErr);
        }
      }

      // 2. Fallback a provider inyectado en el navegador (MetaMask / Pali)
      const providerObj = getActiveProvider();
      if (providerObj) {
        const bp = new ethers.BrowserProvider(providerObj);
        const bal = await bp.getBalance(account);
        userWalletBalance = ethers.formatEther(bal);
      }
    } catch (err) {
      console.error("Error al consultar saldo:", err);
      if (userWalletBalance === null) userWalletBalance = "0.0000";
    } finally {
      isBalanceLoading = false;
    }
  }

  function getActiveProvider() {
    if (typeof window === 'undefined') return null;
    const connectedWallet = localStorage.getItem('terra_wallet_name');

    if (connectedWallet === 'MetaMask') {
      if (window.ethereum?.providers?.length) {
        const mm = window.ethereum.providers.find(p => (p.isMetaMask || p._metamask) && !p.isPali);
        if (mm) return mm;
      }
      if (window.metamask) return window.metamask;
      if (window.ethereum && !window.ethereum.isPali && window.ethereum.isMetaMask) {
        return window.ethereum;
      }
    }

    if (connectedWallet === 'Pali Wallet') {
      if (window.pali) return window.pali;
      if (window.ethereum?.isPali) return window.ethereum;
      if (window.ethereum?.providers?.length) {
        const pali = window.ethereum.providers.find(p => p.isPali);
        if (pali) return pali;
      }
    }

    // Si ambos están instalados, dar prioridad a MetaMask si window.ethereum está secuestrado por Pali
    if (window.ethereum?.providers?.length) {
      const mm = window.ethereum.providers.find(p => (p.isMetaMask || p._metamask) && !p.isPali);
      if (mm) return mm;
    }

    return window.ethereum || window.pali;
  }

  function copyUserAddress() {
    if (!account) return;
    navigator.clipboard.writeText(account);
    copiedAddress = true;
    showToast("Dirección copiada al portapapeles", "success");
    setTimeout(() => copiedAddress = false, 2500);
  }

  async function handleCheckout() {
    txError = '';

    // 1. Validar conexión
    if (!isWalletConnected || !account) {
      showToast("Por favor conecta tu Wallet para firmar la compra en Blockchain.", "error");
      openWalletModal();
      return;
    }

    if (carrito.length === 0) {
      showToast("Tu carrito está vacío.", "error");
      return;
    }

    const providerObj = getActiveProvider();
    if (!providerObj) {
      showToast("No se detectó un proveedor Web3 (MetaMask / Pali).", "error");
      return;
    }

    // Validar saldo suficiente
    const balNum = parseFloat(userWalletBalance || 0);
    const montoNum = parseFloat(montoBlockchain || 0.0001);

    if (userWalletBalance !== null && balNum < montoNum) {
      txError = `Saldo insuficiente: Tienes ${balNum.toFixed(4)} ${criptoSeleccionada.symbol} en tu wallet y se requieren ${montoNum.toFixed(4)} ${criptoSeleccionada.symbol}. Reclama monedas gratis en el Faucet de Tanenbaum para continuar.`;
      showToast("Saldo insuficiente en tu wallet.", "error");
      return;
    }

    isProcessing = true;
    statusMessage = "Solicitando confirmación en tu Wallet...";

    try {
      // Si la red del wallet difiere, solicitar cambio a la red seleccionada (Syscoin Testnet)
      if (providerObj.request && criptoSeleccionada.chainId) {
        try {
          await providerObj.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: criptoSeleccionada.chainId }]
          });
        } catch (switchErr) {
          if (switchErr.code === 4902 && criptoSeleccionada.rpcUrl) {
            await providerObj.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: criptoSeleccionada.chainId,
                chainName: criptoSeleccionada.name,
                rpcUrls: [criptoSeleccionada.rpcUrl],
                nativeCurrency: { name: criptoSeleccionada.symbol, symbol: criptoSeleccionada.symbol, decimals: 18 },
                blockExplorerUrls: [criptoSeleccionada.explorerUrl]
              }]
            });
          }
        }
      }

      const browserProvider = new ethers.BrowserProvider(providerObj);
      const signer = await browserProvider.getSigner();

      statusMessage = `Firma la transferencia real de ${montoBlockchain} ${criptoSeleccionada.symbol} al Productor...`;

      const tx = await signer.sendTransaction({
        to: DESTINATION_PRODUCER,
        value: ethers.parseEther(montoBlockchain.toString())
      });

      statusMessage = "Transacción enviada a la blockchain. Minando bloque...";

      const receipt = await tx.wait();
      const realHash = tx.hash;

      // 2. Guardar en Base de Datos Neon PostgreSQL (Tabla orders)
      const targetNetworkKey = criptoSeleccionada.networkKey || currentNetwork;
      let dbOrder = null;
      try {
        const orderPayload = {
          txHash: realHash,
          buyerWallet: account,
          sellerWallet: DESTINATION_PRODUCER,
          items: [...carrito],
          totalAmount: totalPagar,
          currency: criptoSeleccionada.symbol,
          network: criptoSeleccionada.name,
          networkKey: targetNetworkKey,
          explorerUrl: criptoSeleccionada.explorerUrl || 'https://tanenbaum.io',
          concept: `Compra de ${carrito.map(i => i.nombre).join(', ')}`,
          status: 'confirmed'
        };

        const dbRes = await fetch('http://localhost:3000/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });

        if (dbRes.ok) {
          dbOrder = await dbRes.json();
          console.log("Orden guardada exitosamente en Neon PostgreSQL:", dbOrder);
        }
      } catch (dbErr) {
        console.warn("Fallo guardado en API orders, respaldando en local:", dbErr);
      }

      // 3. Guardar en el Historial de Transacciones (filtrable por red)
      const newTx = {
        id: dbOrder?.id || Date.now(),
        hash: realHash,
        to: DESTINATION_PRODUCER,
        amount: montoBlockchain.toString(),
        symbol: criptoSeleccionada.symbol,
        network: criptoSeleccionada.name,
        networkKey: targetNetworkKey,
        explorerUrl: criptoSeleccionada.explorerUrl || 'https://tanenbaum.io',
        date: new Date().toLocaleString(),
        status: 'confirmed',
        concept: `Compra de ${carrito.map(i => i.nombre).join(', ')}`
      };

      try {
        const savedHistory = localStorage.getItem('transferHistory');
        const historyArr = savedHistory ? JSON.parse(savedHistory) : [];
        localStorage.setItem('transferHistory', JSON.stringify([newTx, ...historyArr]));
      } catch (e) {
        console.error("Error guardando en transferHistory:", e);
      }

      // 4. Generar la boleta oficial para ReceiptView y persistir
      const orderData = {
        id: dbOrder?.id || Date.now().toString().slice(-6),
        items: [...carrito],
        total: totalPagar,
        montoBlockchain: montoBlockchain,
        moneda: criptoSeleccionada.symbol,
        icon: criptoSeleccionada.icon,
        fecha: new Date().toLocaleString(),
        gasFee: 0.0001,
        to: DESTINATION_PRODUCER,
        buyer: account,
        txHash: realHash,
        explorerUrl: criptoSeleccionada.explorerUrl || 'https://tanenbaum.io',
        networkName: criptoSeleccionada.name,
        networkKey: targetNetworkKey
      };

      setLastOrder(orderData);
      localStorage.setItem('terra_last_order', JSON.stringify(orderData));

      carrito = [];
      showToast("¡Compra guardada en Blockchain y en Base de Datos Neon!", "success");
      navigate('receipt');

    } catch (err) {
      console.error("Error en checkout Web3:", err);
      if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        txError = "Transacción cancelada o rechazada en la billetera.";
        showToast("Transacción rechazada en la Wallet.", "error");
      } else {
        txError = err.reason || err.message || "Error al procesar la transacción. Verifica tu saldo de gas en la testnet.";
        showToast("Error en Blockchain: " + (err.reason || "Revisa tus fondos"), "error");
      }
    } finally {
      isProcessing = false;
      statusMessage = "";
    }
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

<div class="max-w-2xl mx-auto p-6 bg-panel/40 backdrop-blur-md rounded-3xl shadow-xl border border-border mt-10 animate-in fade-in duration-300">
  <div class="flex items-center justify-between mb-8">
    <h2 class="text-2xl font-black text-white flex items-center gap-2">
      Tu Carrito Web3 <ShoppingCart class="w-6 h-6 text-primary" />
    </h2>
    <span class="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full">{carrito.length} Items</span>
  </div>

  {#if carrito.length === 0}
    <div class="text-center py-10 text-muted">
      <p>Tu carrito está vacío.</p>
      <button onclick={() => navigate('market')} class="mt-4 text-primary underline font-bold">Volver al Mercado</button>
    </div>
  {/if}

  <!-- LISTA DE PRODUCTOS DEL CARRITO CON PRECIO MÍNIMO DE PRUEBA -->
  <div class="space-y-4 mb-8">
    {#each carrito as item}
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-dark/40 backdrop-blur-md rounded-2xl border border-border transition-all hover:border-primary/50 gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 bg-panel/40 backdrop-blur-md rounded-xl shadow-sm border border-border flex items-center justify-center text-3xl shrink-0">
            {item.imagen}
          </div>
          <div>
            <h4 class="font-bold text-white text-lg">{item.nombre}</h4>
            <div class="flex items-center gap-2">
              <span class="text-primary font-bold text-sm">{(parseFloat(item.precio || 0.0001)).toFixed(4)} {monedaSeleccionada} / kg</span>
              <span class="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">Testnet Min</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div class="flex items-center bg-panel/40 backdrop-blur-md border border-border rounded-lg shadow-sm overflow-hidden">
            <button onclick={() => reducirCantidad(item.id)} class="px-3 py-2 text-white hover:bg-border font-black transition-colors">-</button>
            <span class="px-4 py-2 font-bold text-white border-x border-border min-w-[3rem] text-center">{item.cantidad}</span>
            <button onclick={() => aumentarCantidad(item.id)} class="px-3 py-2 text-white hover:bg-border font-black transition-colors">+</button>
          </div>

          <button onclick={() => eliminarProducto(item.id)} class="text-red-400 hover:text-red-500 bg-red-900/20 hover:bg-red-900/40 p-2 rounded-lg transition-colors border border-red-900/50 shrink-0" title="Eliminar producto">
            🗑️
          </button>
        </div>
      </div>
    {/each}
  </div>

  <div class="border-t border-border pt-6">
    
    <!-- SALDO DE LA BILLETERA DEL USUARIO (SUPER DESTACADO) -->
    <div class="mb-6 p-4 md:p-5 rounded-2xl bg-dark/80 border {userWalletBalance !== null && parseFloat(userWalletBalance) >= parseFloat(montoBlockchain || 0) ? 'border-success/40 bg-success/5' : 'border-border'} flex flex-col gap-3 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            <Wallet class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-sm font-bold text-white">Tu Saldo Disponible en Blockchain</h4>
            <p class="text-xs text-muted flex items-center gap-1.5 font-mono">
              {#if account}
                <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
                <button onclick={copyUserAddress} class="text-primary hover:text-white transition-colors" title="Copiar dirección">
                  {#if copiedAddress}
                    <Check class="w-3.5 h-3.5 text-success inline" />
                  {:else}
                    <Copy class="w-3.5 h-3.5 inline" />
                  {/if}
                </button>
              {:else}
                <span class="text-yellow-400">Billetera no conectada</span>
              {/if}
            </p>
          </div>
        </div>

        <button 
          onclick={fetchUserBalance} 
          disabled={isBalanceLoading || !account}
          class="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors bg-panel/60 px-2.5 py-1.5 rounded-lg border border-border"
          title="Actualizar saldo"
        >
          <RefreshCw class="w-3.5 h-3.5 {isBalanceLoading ? 'animate-spin text-primary' : ''}" />
          <span class="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      <!-- VALOR DEL SALDO Y COMPARACIÓN -->
      <div class="p-3 bg-panel/60 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted">Red:</span>
          <span class="text-xs font-bold text-white bg-dark px-2 py-0.5 rounded border border-border flex items-center gap-1">
            <img src={criptoSeleccionada.icon} alt="" class="w-3.5 h-3.5 rounded-full" />
            {criptoSeleccionada.name}
          </span>
        </div>

        <div class="flex items-center gap-2 font-mono">
          {#if isBalanceLoading}
            <span class="text-xs text-primary animate-pulse font-medium">Leyendo saldo en red...</span>
          {:else if userWalletBalance !== null}
            <span class="text-xl font-black {parseFloat(userWalletBalance) >= parseFloat(montoBlockchain || 0) ? 'text-success' : 'text-red-400'}">
              {parseFloat(userWalletBalance).toFixed(4)} <span class="text-xs">{criptoSeleccionada.symbol}</span>
            </span>

            {#if parseFloat(userWalletBalance) >= parseFloat(montoBlockchain || 0)}
              <span class="text-[10px] bg-success/20 text-success font-bold px-2 py-0.5 rounded border border-success/40">
                ✓ Saldo suficiente
              </span>
            {:else}
              <span class="text-[10px] bg-red-500/20 text-red-300 font-bold px-2 py-0.5 rounded border border-red-500/40">
                ⚠️ Insuficiente
              </span>
            {/if}
          {:else}
            <button onclick={openWalletModal} class="text-xs text-primary font-bold hover:underline">
              Conectar Wallet para verificar
            </button>
          {/if}
        </div>
      </div>

      <!-- MENSAJE DE AYUDA SI TIENE SALDO INSUFICIENTE -->
      {#if userWalletBalance !== null && parseFloat(userWalletBalance) < parseFloat(montoBlockchain || 0)}
        <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p class="font-bold">⚠️ Tu billetera tiene {parseFloat(userWalletBalance).toFixed(4)} {criptoSeleccionada.symbol}</p>
            <p class="text-[11px] text-muted">Necesitas al menos {montoBlockchain} {criptoSeleccionada.symbol} para pagar.</p>
          </div>
          {#if criptoSeleccionada.faucetUrl}
            <a 
              href={criptoSeleccionada.faucetUrl} 
              target="_blank" 
              rel="noreferrer"
              class="inline-flex items-center gap-1.5 bg-primary text-black font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-primary-hover transition-colors shrink-0"
            >
              <span>Obtener Faucet Gratis</span>
              <ExternalLink class="w-3.5 h-3.5" />
            </a>
          {/if}
        </div>
      {/if}
    </div>

    <!-- TARJETA DESTINO DEL PRODUCTOR REAL -->
    <div class="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/30 flex flex-col gap-2 shadow-inner">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
          📍 Productor Beneficiario (Cañete / Valle Grande):
        </span>
        <span class="text-[10px] bg-dark px-2 py-0.5 rounded text-success font-bold border border-success/30">
          Cuenta Verificada
        </span>
      </div>
      <p class="font-mono text-xs text-white break-all bg-dark/70 p-3 rounded-xl border border-border select-all shadow-sm">
        {DESTINATION_PRODUCER}
      </p>

      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-2 pt-2 border-t border-border/50 gap-2">
        <div class="text-left">
          <p class="text-xs font-bold text-white">Monto Real en Blockchain:</p>
          <p class="text-[11px] text-muted">Monto mínimo para pruebas en testnet</p>
        </div>
        <div class="flex items-center gap-2">
          <input 
            type="text" 
            bind:value={montoBlockchain} 
            class="w-28 bg-dark border border-border rounded-lg px-2.5 py-1.5 text-right font-mono text-sm text-primary font-bold focus:outline-none focus:border-primary shadow-inner"
            placeholder="0.0001"
          />
          <span class="text-xs font-bold text-white uppercase">{criptoSeleccionada.symbol}</span>
        </div>
      </div>
    </div>

    <!-- SELECCIÓN DE CRIPTO -->
    <div class="mb-6 p-5 rounded-xl bg-dark/40 backdrop-blur-md border border-border shadow-lg relative">
      <label for="cripto-select-btn" class="block text-sm font-medium text-muted mb-3">Pagar con:</label>

      <div class="relative">
        <button
          id="cripto-select-btn"
          type="button"
          onclick={() => isDropdownOpen = !isDropdownOpen}
          class="w-full flex items-center justify-between bg-panel/40 backdrop-blur-md border border-border rounded-lg p-3 text-white hover:bg-[#2b3139] focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
        >
          <div class="flex items-center space-x-3">
            <img src={criptoSeleccionada.icon} alt="Logo" class="w-6 h-6 rounded-full shadow-sm bg-white" />
            <span class="font-semibold">{criptoSeleccionada.name}</span>
            <span class="text-muted text-sm">({criptoSeleccionada.symbol})</span>
          </div>
          <ChevronDown class="w-5 h-5 text-muted transition-transform duration-200 {isDropdownOpen ? 'rotate-180' : ''}" />
        </button>

        {#if isDropdownOpen}
          <div class="absolute z-50 mt-2 w-full bg-panel/90 backdrop-blur-xl border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
            <ul class="py-1 m-0">
              {#each opcionesCripto as cripto}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <li
                  onclick={() => { selectedNetworkKey = cripto.networkKey; isDropdownOpen = false; fetchUserBalance(); }}
                  class="flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-dark/60 transition-colors {cripto.networkKey === selectedNetworkKey ? 'bg-primary/20 text-primary font-bold' : 'text-white'}"
                >
                  <img src={cripto.icon} alt={cripto.name} class="w-6 h-6 rounded-full bg-white p-0.5" />
                  <span class="font-medium">{cripto.name}</span>
                  <span class="text-muted text-sm ml-auto font-mono">({cripto.symbol})</span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    </div>

    <!-- ERROR SI HUBO -->
    {#if txError}
      <div class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-200 text-xs">
        <AlertCircle size={18} class="text-red-400 shrink-0 mt-0.5" />
        <p class="leading-relaxed">{txError}</p>
      </div>
    {/if}

    <div class="flex flex-col items-end">
      <span class="text-muted text-sm font-bold uppercase tracking-wider mb-1">Total del Pedido</span>
      <div class="text-4xl font-black text-white mb-6">
        {totalPagar.toFixed(4)} <span class="text-xl text-primary">{monedaSeleccionada}</span>
      </div>

      {#if isProcessing && statusMessage}
        <div class="w-full mb-3 text-center text-xs font-bold text-primary animate-pulse bg-primary/10 border border-primary/20 py-2.5 px-3 rounded-xl">
          ⏳ {statusMessage}
        </div>
      {/if}

      <button
        disabled={carrito.length === 0 || isProcessing}
        onclick={handleCheckout}
        class="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group"
      >
        {#if isProcessing}
          <div class="w-6 h-6 border-4 border-black/30 border-t-black rounded-full animate-spin"></div>
          <span>Confirmando en Blockchain...</span>
        {:else}
          <ShieldCheck class="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span>Firmar y Enviar Pago Real al Productor</span>
        {/if}
      </button>
    </div>
  </div>
</div>
