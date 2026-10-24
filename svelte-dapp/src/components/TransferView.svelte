<script>
  import { Send, Wallet, Activity, CheckCircle, AlertCircle, Loader, ChevronDown, RefreshCw, ExternalLink, Database } from 'lucide-svelte';
  import { ethers } from 'ethers';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { API_URL } from '../config.js';

  let { account, isWalletConnected, currentNetwork, networks = {}, switchNetwork } = $props();

  let networkDropdownOpen = $state(false);
  let localSelectedNetwork = $state(currentNetwork || 'polygon');
  let currentBalance = $state(null);
  let isBalanceLoading = $state(false);
  let isHistoryLoading = $state(false);

  let recipientAddress = $state('');
  let amount = $state('');

  function getActiveProvider(netKey) {
    if (typeof window === 'undefined') return null;
    
    // Si la red seleccionada es Syscoin o Tanenbaum, dar prioridad a Pali si existe
    if (netKey === 'syscoin' || netKey === 'tanenbaum' || netKey === 'tanenbaum-zk') {
      if (window.pali) return window.pali;
      if (window.ethereum?.isPali) return window.ethereum;
      if (window.ethereum?.providers?.length) {
        const pali = window.ethereum.providers.find(p => p.isPali);
        if (pali) return pali;
      }
    }

    // Para redes como Sepolia, Ethereum, Polygon, dar prioridad a MetaMask
    if (window.ethereum?.providers?.length) {
      const mm = window.ethereum.providers.find(p => (p.isMetaMask || p._metamask) && !p.isPali);
      if (mm) return mm;
    }

    return window.ethereum || window.pali;
  }
  
  // Efecto para buscar el saldo en tiempo real
  $effect(() => {
    if (account && networks[localSelectedNetwork]) {
      fetchBalance(localSelectedNetwork, account);
    }
  });

  async function fetchBalance(netKey, addr) {
    isBalanceLoading = true;
    try {
      const net = networks[netKey];
      if (!net) throw new Error("Red no encontrada");

      let provider;
      let balance;
      let isCurrentNetwork = false;

      // 1. Intentar usar la billetera si está en la misma red
      const providerObj = getActiveProvider(netKey);
      if (providerObj) {
        try {
          const currentChainId = await providerObj.request({ method: 'eth_chainId' });
          const normalizedCurrent = typeof currentChainId === 'string' && currentChainId.startsWith('0x') 
            ? parseInt(currentChainId, 16) 
            : parseInt(currentChainId, 10);
          
          const normalizedTarget = parseInt(net.chainId, 16);
          if (normalizedCurrent === normalizedTarget) {
            isCurrentNetwork = true;
            provider = new ethers.BrowserProvider(providerObj);
          }
        } catch (e) { console.error("Error leyendo chainId de la wallet", e); }
      }

      // 2. Si no es la red actual, usar Providers públicos
      if (!isCurrentNetwork) {
        if (netKey === 'ethereum') {
          provider = ethers.getDefaultProvider('mainnet');
        } else if (netKey === 'sepolia') {
          provider = ethers.getDefaultProvider('sepolia');
        } else {
          const rpcUrl = net.rpcUrls[0];
          // Usar proxy si es localhost para evitar CORS
          if (rpcUrl.includes('127.0.0.1') || rpcUrl.includes('localhost')) {
            const proxyRes = await fetch(`${API_URL}/api/rpc-proxy`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ rpcUrl: rpcUrl, method: 'eth_getBalance', params: [addr, 'latest'] })
            });
            const data = await proxyRes.json();
            if (data.error) throw new Error(data.error.message || 'Proxy Error');
            balance = BigInt(data.result);
          } else {
            provider = new ethers.JsonRpcProvider(rpcUrl);
          }
        }
      }

      // Si tenemos un provider (no pasamos por el proxy), obtenemos el saldo
      if (provider) {
        balance = await provider.getBalance(addr);
      }

      currentBalance = ethers.formatEther(balance);
    } catch (e) {
      console.error("Error al obtener saldo:", e);
      currentBalance = "0.0000";
    } finally {
      isBalanceLoading = false;
    }
  }
  
  let txStatus = $state('idle'); // 'idle' | 'loading' | 'success' | 'error'
  let txHash = $state('');
  let errorMessage = $state('');
  
  let txHistory = $state([]);

  // Consultar transferencias guardadas en la base de datos Neon PostgreSQL
  async function loadTransferHistory() {
    isHistoryLoading = true;
    let localTxs = [];
    const savedHistory = localStorage.getItem('transferHistory');
    if (savedHistory) {
      try {
        localTxs = JSON.parse(savedHistory);
        txHistory = localTxs;
      } catch (e) {
        console.error("Error cargando historial local", e);
      }
    }

    try {
      // 1. Consultar tabla transfers de Neon PostgreSQL
      const resTransfers = await fetch(`${API_URL}/api/transfers`);
      const dbTransfers = resTransfers.ok ? await resTransfers.json() : [];

      // 2. Consultar también transferencias registradas en la tabla orders
      const resOrders = await fetch(`${API_URL}/api/orders`);
      const dbOrders = resOrders.ok ? await resOrders.json() : [];

      const formattedTransfers = [
        ...dbTransfers.map(t => ({
          id: t.id,
          hash: t.tx_hash,
          from: t.from_wallet,
          to: t.to_wallet,
          amount: parseFloat(t.amount).toFixed(4),
          symbol: t.currency,
          network: t.network,
          networkKey: t.network_key,
          explorerUrl: t.explorer_url,
          date: new Date(t.created_at).toLocaleString(),
          status: t.status || 'confirmed',
          concept: t.concept || 'Transferencia directa en Neon DB'
        })),
        ...dbOrders.filter(o => o.concept && o.concept.toLowerCase().includes('transferencia')).map(o => ({
          id: o.id,
          hash: o.tx_hash,
          from: o.buyer_wallet,
          to: o.seller_wallet,
          amount: parseFloat(o.total_amount).toFixed(4),
          symbol: o.currency,
          network: o.network,
          networkKey: o.network_key,
          explorerUrl: o.explorer_url,
          date: new Date(o.created_at).toLocaleString(),
          status: o.status || 'confirmed',
          concept: o.concept || 'Transferencia directa Web3'
        }))
      ];

      // Unir sin duplicados por hash (priorizando registros de la BD)
      const combined = [...formattedTransfers];
      for (const lt of localTxs) {
        if (!combined.some(c => c.hash === lt.hash)) {
          combined.push(lt);
        }
      }
      txHistory = combined;
    } catch (err) {
      console.warn("Fallo lectura de transferencias en BD Neon:", err);
    } finally {
      isHistoryLoading = false;
    }
  }
  
  // Cargar historial al iniciar
  $effect(() => {
    loadTransferHistory();
  });

  async function sendTransaction() {
    if (!isWalletConnected || !account) {
      errorMessage = "Por favor, conecta tu billetera primero.";
      txStatus = 'error';
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      errorMessage = "La dirección del destinatario no es válida (debe ser formato 0x...).";
      txStatus = 'error';
      return;
    }

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      errorMessage = "Por favor, ingresa un monto válido mayor a 0.";
      txStatus = 'error';
      return;
    }

    txStatus = 'loading';
    txHash = '';
    errorMessage = '';

    const targetRecipient = recipientAddress;
    const targetAmount = amount.toString();

    try {
      // 1. Verificar que la billetera esté en la red seleccionada
      if (currentNetwork !== localSelectedNetwork) {
        if (switchNetwork) {
          await switchNetwork(localSelectedNetwork);
        } else {
          throw new Error("No se puede cambiar de red automáticamente.");
        }
      }

      const providerObj = getActiveProvider(localSelectedNetwork);
      if (!providerObj) {
        throw new Error("No se detectó un proveedor Web3 (MetaMask / Pali).");
      }

      const provider = new ethers.BrowserProvider(providerObj);
      const signer = await provider.getSigner();

      // Enviar la transacción a la Blockchain
      const tx = await signer.sendTransaction({
        to: targetRecipient,
        value: ethers.parseEther(targetAmount)
      });

      txHash = tx.hash;
      
      const newTx = {
        hash: txHash,
        from: account,
        to: targetRecipient,
        amount: targetAmount,
        symbol: networks[localSelectedNetwork]?.nativeCurrency?.symbol || 'ETH',
        network: networks[localSelectedNetwork]?.shortName || 'Unknown',
        networkKey: localSelectedNetwork,
        explorerUrl: networks[localSelectedNetwork]?.blockExplorerUrls?.[0] || '',
        date: new Date().toLocaleString(),
        status: 'pending'
      };
      
      txHistory = [newTx, ...txHistory];
      localStorage.setItem('transferHistory', JSON.stringify(txHistory));

      // Limpiar formulario
      recipientAddress = '';
      amount = '';

      // Esperar confirmación on-chain
      await tx.wait(); 
      
      txStatus = 'success';

      // Actualizar estado local
      txHistory = txHistory.map(t => t.hash === txHash ? { ...t, status: 'confirmed' } : t);
      localStorage.setItem('transferHistory', JSON.stringify(txHistory));

      // 2. Guardar en Base de Datos Neon PostgreSQL (Tabla transfers)
      try {
        await fetch(`${API_URL}/api/transfers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txHash: newTx.hash,
            fromWallet: account,
            toWallet: newTx.to,
            amount: parseFloat(newTx.amount),
            currency: newTx.symbol,
            network: newTx.network,
            networkKey: newTx.networkKey,
            explorerUrl: newTx.explorerUrl,
            concept: 'Transferencia directa Web3',
            status: 'confirmed'
          })
        });

        // Registrar también en orders para que figure en el historial unificado
        await fetch(`${API_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txHash: newTx.hash,
            buyerWallet: account,
            sellerWallet: newTx.to,
            items: [{ nombre: `Envío ${newTx.symbol}`, cantidad: 1, precio: parseFloat(newTx.amount) }],
            totalAmount: parseFloat(newTx.amount),
            currency: newTx.symbol,
            network: newTx.network,
            networkKey: newTx.networkKey,
            explorerUrl: newTx.explorerUrl,
            concept: `Transferencia directa a ${newTx.to.slice(0, 8)}...`,
            status: 'confirmed'
          })
        });

        // Recargar historial sincronizado desde Neon DB
        await loadTransferHistory();
      } catch (dbErr) {
        console.warn("Aviso al guardar transfer en Neon DB:", dbErr);
      }

    } catch (error) {
      console.error("Error al procesar transferencia:", error);
      txStatus = 'error';
      errorMessage = error.reason || error.message || "Error desconocido al enviar la transacción.";
    }
  }
</script>

<div in:fly={{ y: 30, duration: 400, delay: 200, easing: quintOut }} out:fade={{ duration: 150 }} class="max-w-2xl mx-auto px-4 py-10 mt-10">
  
  <div class="text-center mb-10">
    <h2 class="text-4xl font-black text-white mb-4">Transferir <span class="text-primary">Fondos</span></h2>
    <p class="text-muted text-lg">Envía tokens nativos de forma segura a cualquier dirección Web3.</p>
  </div>

  <div class="bg-panel/40 backdrop-blur-md border border-border rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
    <!-- Decoración de fondo -->
    <div class="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Selector de Red -->
    {#if networks && Object.keys(networks).length > 0}
      <div class="relative w-full mb-8 z-50">
        <button 
          type="button"
          onclick={() => networkDropdownOpen = !networkDropdownOpen}
          class="w-full flex items-center gap-4 p-4 bg-dark/50 hover:bg-dark/80 rounded-xl border border-border/50 hover:border-primary/50 transition-all text-left shadow-inner group"
        >
          <div class="w-12 h-12 rounded-full bg-panel flex items-center justify-center shadow-md border border-white/5">
            {#if networks[localSelectedNetwork]}
              <img src={networks[localSelectedNetwork].logo} alt="Logo" class="w-8 h-8 rounded-full" />
            {:else}
              <Wallet class="w-6 h-6 text-primary" />
            {/if}
          </div>
          <div class="flex-grow">
            <p class="text-xs text-muted uppercase font-bold tracking-wider">Red a utilizar</p>
            <p class="text-white font-bold text-lg">{networks[localSelectedNetwork]?.shortName || 'Red Desconocida'}</p>
          </div>
          <div class="transition-transform duration-300 {networkDropdownOpen ? 'rotate-180' : ''}">
            <ChevronDown size={24} class="text-muted group-hover:text-white transition-colors" />
          </div>
        </button>

        {#if networkDropdownOpen}
          <div 
            transition:fly={{ y: -20, duration: 300, easing: quintOut }}
            class="absolute top-full left-0 right-0 mt-3 bg-panel border border-border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[100]"
          >
            <div class="max-h-[300px] overflow-y-auto">
              {#each Object.entries(networks) as [key, net]}
                <button
                  type="button"
                  class="w-full text-left px-5 py-4 hover:bg-dark flex items-center gap-4 transition-colors {localSelectedNetwork === key ? 'bg-dark border-l-4 border-primary text-primary font-bold' : 'text-white'}"
                  onclick={() => { localSelectedNetwork = key; networkDropdownOpen = false; }}
                >
                  <img src={net.logo} alt={net.shortName} class="w-8 h-8 rounded-full bg-white p-0.5" />
                  <span class="text-base">{net.shortName}</span>
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <form onsubmit={(e) => { e.preventDefault(); sendTransaction(); }} class="space-y-6 relative z-10">
      
      <div>
        <label for="address" class="block text-sm font-bold text-muted mb-2 ml-1">Dirección del Destinatario</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
            <Wallet size={18} />
          </div>
          <input 
            id="address"
            type="text" 
            bind:value={recipientAddress}
            placeholder="0x..."
            class="w-full bg-dark border border-border focus:border-primary text-white font-mono text-base rounded-xl py-4 pl-12 pr-4 outline-none transition-all focus:ring-2 focus:ring-primary/20 shadow-inner"
            disabled={txStatus === 'loading'}
          />
        </div>
      </div>

      <div>
        <div class="flex justify-between items-end mb-2 ml-1">
          <label for="amount" class="block text-sm font-bold text-muted">Monto a Enviar ({networks[localSelectedNetwork]?.nativeCurrency?.symbol || 'ETH'})</label>
          {#if account}
            <div class="text-xs font-bold bg-dark/50 px-3 py-1 rounded-full border border-border/50 text-white flex items-center gap-2">
              <Wallet size={12} class="text-primary" /> 
              Saldo: 
              {#if isBalanceLoading}
                <Loader size={12} class="animate-spin text-primary" />
              {:else}
                <span class="{currentBalance === '0.0000' ? 'text-red-400' : 'text-primary'}">
                  {currentBalance ? parseFloat(currentBalance).toFixed(4) : '0.0000'} {networks[localSelectedNetwork]?.nativeCurrency?.symbol}
                </span>
              {/if}
            </div>
          {/if}
        </div>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
            <Activity size={18} />
          </div>
          <input 
            id="amount"
            type="number" 
            step="any"
            bind:value={amount}
            placeholder="0.00"
            class="w-full bg-dark border border-border focus:border-primary text-white font-mono text-xl rounded-xl py-4 pl-12 pr-20 outline-none transition-all focus:ring-2 focus:ring-primary/20 shadow-inner"
            disabled={txStatus === 'loading'}
          />
          <div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <span class="text-primary font-bold">{networks[localSelectedNetwork]?.nativeCurrency?.symbol || 'ETH'}</span>
          </div>
        </div>
        
        <!-- Botones Rápidos de Monto -->
        <div class="flex gap-2 mt-3 overflow-x-auto pb-1">
          <button type="button" onclick={() => amount = '0.0001'} class="px-3 py-1.5 bg-dark hover:bg-primary/20 hover:text-primary hover:border-primary/50 text-xs font-bold text-muted rounded-lg border border-border transition-colors whitespace-nowrap">
            Mínimo (0.0001)
          </button>
          <button type="button" onclick={() => { if(currentBalance) amount = (parseFloat(currentBalance) * 0.25).toFixed(4) }} class="px-3 py-1.5 bg-dark hover:bg-primary/20 hover:text-primary hover:border-primary/50 text-xs font-bold text-muted rounded-lg border border-border transition-colors whitespace-nowrap">
            25%
          </button>
          <button type="button" onclick={() => { if(currentBalance) amount = (parseFloat(currentBalance) * 0.50).toFixed(4) }} class="px-3 py-1.5 bg-dark hover:bg-primary/20 hover:text-primary hover:border-primary/50 text-xs font-bold text-muted rounded-lg border border-border transition-colors whitespace-nowrap">
            50%
          </button>
          <button type="button" onclick={() => { if(currentBalance) { let max = parseFloat(currentBalance) - 0.001; amount = max > 0 ? max.toFixed(4) : '0'; } }} class="px-3 py-1.5 bg-dark hover:bg-primary/20 hover:text-primary hover:border-primary/50 text-xs font-bold text-muted rounded-lg border border-border transition-colors whitespace-nowrap ml-auto">
            Máx (Seguro)
          </button>
        </div>
      </div>

      {#if txStatus === 'error'}
        <div transition:fly={{ y: -10, duration: 300 }} class="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle class="text-red-500 shrink-0 mt-0.5" size={20} />
          <p class="text-red-200 text-sm">{errorMessage}</p>
        </div>
      {/if}

      {#if txStatus === 'success'}
        <div transition:fly={{ y: -10, duration: 300 }} class="bg-success/15 border border-success/50 rounded-2xl p-4 flex flex-col gap-2 shadow-lg">
          <div class="flex items-center gap-3">
            <CheckCircle class="text-success shrink-0" size={22} />
            <div>
              <p class="text-success font-bold text-base">¡Transacción Exitosa y Guardada en Base de Datos!</p>
              <p class="text-xs text-muted">La transferencia ha sido confirmada en blockchain y almacenada en Neon PostgreSQL.</p>
            </div>
          </div>
          {#if txHash}
            <div class="flex items-center justify-between bg-dark/60 p-2.5 rounded-xl border border-border text-xs mt-1">
              <span class="text-muted font-mono truncate">Hash: {txHash.slice(0, 16)}...{txHash.slice(-8)}</span>
              {#if networks[localSelectedNetwork]?.blockExplorerUrls?.[0]}
                <a 
                  href="{networks[localSelectedNetwork].blockExplorerUrls[0]}/tx/{txHash}" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="text-primary hover:underline font-bold flex items-center gap-1 shrink-0 ml-2"
                >
                  Ver en Explorer <ExternalLink size={12} />
                </a>
              {/if}
            </div>
          {/if}
        </div>
      {/if}

      <button 
        type="submit"
        disabled={txStatus === 'loading'}
        class="w-full bg-primary text-black font-bold text-lg px-8 py-4 rounded-xl hover:bg-primary-hover transition-all shadow-[0_0_20px_rgba(252,213,53,0.3)] hover:shadow-[0_0_30px_rgba(252,213,53,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group mt-8"
      >
        {#if txStatus === 'loading'}
          <Loader size={22} class="animate-spin" />
          Procesando Transacción...
        {:else}
          <Send size={22} class="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
          Enviar Fondos
        {/if}
      </button>

    </form>
  </div>

  <!-- Historial de Transferencias (Sincronizado con Neon PostgreSQL) -->
  {#if txHistory.filter(tx => tx.networkKey === localSelectedNetwork || tx.network === networks[localSelectedNetwork]?.shortName).length > 0}
    <div class="mt-12 bg-panel/40 backdrop-blur-md border border-border rounded-[2rem] p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-3 border-b border-border/60">
        <div>
          <h3 class="text-xl font-bold text-white flex items-center gap-2">
            <Activity class="text-primary" size={24} /> 
            <span>Historial en {networks[localSelectedNetwork]?.shortName}</span>
          </h3>
          <p class="text-xs text-muted mt-0.5">Sincronizado con la base de datos Neon PostgreSQL.</p>
        </div>

        <button 
          type="button"
          onclick={loadTransferHistory} 
          disabled={isHistoryLoading}
          class="flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors bg-dark/60 border border-border px-3 py-1.5 rounded-lg shadow-sm"
          title="Actualizar historial desde la base de datos"
        >
          <RefreshCw class="w-3.5 h-3.5 {isHistoryLoading ? 'animate-spin text-primary' : ''}" />
          <span>Actualizar BD</span>
        </button>
      </div>

      <div class="space-y-4 max-h-[420px] overflow-y-auto pr-2">
        {#each txHistory.filter(tx => tx.networkKey === localSelectedNetwork || tx.network === networks[localSelectedNetwork]?.shortName) as tx}
          <div class="bg-dark/50 border border-border/50 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary/40 hover:shadow-lg transition-all relative">
            <div class="flex-grow overflow-hidden w-full sm:w-auto">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                {#if tx.id}
                  <span class="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    #TRF-{tx.id}
                  </span>
                {/if}
                <span class="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">{tx.network}</span>
                <span class="text-xs text-muted">{tx.date}</span>
                {#if tx.status === 'pending'}
                  <span class="bg-yellow-500/20 text-yellow-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                    <Loader size={10} class="animate-spin" /> Pendiente
                  </span>
                {:else}
                  <span class="bg-success/20 text-success text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 border border-success/30">
                    <CheckCircle size={10} /> Guardado en BD
                  </span>
                {/if}
              </div>
              <p class="text-sm text-white font-mono truncate" title={tx.to}>
                <span class="text-muted">A:</span> <strong class="text-gray-200">{tx.to}</strong>
              </p>
              <p class="text-xs text-muted font-mono truncate mt-0.5">
                <span>Hash: {tx.hash}</span>
              </p>
              
              {#if tx.explorerUrl}
                <a 
                  href="{tx.explorerUrl}/tx/{tx.hash}" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 mt-2 text-xs font-bold text-primary hover:text-white transition-colors underline decoration-primary/50 underline-offset-4"
                >
                  <span>Ver en Explorer</span>
                  <ExternalLink size={12} />
                </a>
              {/if}
            </div>
            <div class="shrink-0 text-right mt-2 sm:mt-0">
              <p class="text-lg font-black text-white">-{tx.amount} <span class="text-primary text-sm">{tx.symbol}</span></p>
            </div>
          </div>
        {/each}
      </div>

      <button 
        onclick={() => { 
          // Borrar solo los de esta red del almacenamiento local
          txHistory = txHistory.filter(tx => tx.networkKey !== localSelectedNetwork && tx.network !== networks[localSelectedNetwork]?.shortName); 
          localStorage.setItem('transferHistory', JSON.stringify(txHistory)); 
        }}
        class="mt-6 text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 mx-auto font-medium"
      >
        Limpiar caché local de esta red
      </button>
    </div>
  {/if}
</div>
