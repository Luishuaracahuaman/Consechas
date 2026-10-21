<script>
  import { Send, Wallet, Activity, CheckCircle, AlertCircle, Loader, ChevronDown } from 'lucide-svelte';
  import { ethers } from 'ethers';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  let { account, isWalletConnected, currentNetwork, networks = {}, switchNetwork } = $props();

  let networkDropdownOpen = $state(false);
  let localSelectedNetwork = $state(currentNetwork || 'polygon');
  let currentBalance = $state(null);
  let isBalanceLoading = $state(false);

  let recipientAddress = $state('');
  let amount = $state('');
  
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
      if (window.ethereum) {
        try {
          const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
          const normalizedCurrent = typeof currentChainId === 'string' && currentChainId.startsWith('0x') 
            ? parseInt(currentChainId, 16) 
            : parseInt(currentChainId, 10);
          
          const normalizedTarget = parseInt(net.chainId, 16);
          if (normalizedCurrent === normalizedTarget) {
            isCurrentNetwork = true;
            provider = new ethers.BrowserProvider(window.ethereum);
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
            const proxyRes = await fetch('http://localhost:3000/api/rpc-proxy', {
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
  
  // Cargar historial al iniciar y sincronizar con Neon PostgreSQL
  $effect(() => {
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

    // Consultar Base de Datos Neon PostgreSQL
    fetch('http://localhost:3000/api/orders')
      .then(res => res.ok ? res.json() : [])
      .then(dbOrders => {
        if (Array.isArray(dbOrders) && dbOrders.length > 0) {
          const dbTxs = dbOrders.map(o => ({
            id: o.id,
            hash: o.tx_hash,
            to: o.seller_wallet,
            amount: parseFloat(o.total_amount).toFixed(4),
            symbol: o.currency,
            network: o.network,
            networkKey: o.network_key,
            explorerUrl: o.explorer_url,
            date: new Date(o.created_at).toLocaleString(),
            status: o.status || 'confirmed',
            concept: o.concept || 'Compra registrada en Neon DB'
          }));

          // Unir sin duplicados por hash
          const combined = [...dbTxs];
          for (const lt of localTxs) {
            if (!combined.some(c => c.hash === lt.hash)) {
              combined.push(lt);
            }
          }
          txHistory = combined;
        }
      })
      .catch(err => {
        console.warn("Fallo lectura de órdenes en BD Neon:", err);
      });
  });

  async function sendTransaction() {
    if (!isWalletConnected || !account) {
      errorMessage = "Por favor, conecta tu billetera primero.";
      txStatus = 'error';
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      errorMessage = "La dirección del destinatario no es válida.";
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

    try {
      // 1. Verificar que la billetera esté físicamente en la misma red que localSelectedNetwork
      if (currentNetwork !== localSelectedNetwork) {
        if (switchNetwork) {
          await switchNetwork(localSelectedNetwork);
        } else {
          throw new Error("No se puede cambiar de red automáticamente.");
        }
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tx = await signer.sendTransaction({
        to: recipientAddress,
        value: ethers.parseEther(amount.toString())
      });

      txHash = tx.hash;
      
      // Guardar en historial inmediatamente (como pendiente o confirmando)
      const newTx = {
        hash: txHash,
        to: recipientAddress,
        amount: amount.toString(),
        symbol: networks[localSelectedNetwork]?.nativeCurrency?.symbol || 'ETH',
        network: networks[localSelectedNetwork]?.shortName || 'Unknown',
        networkKey: localSelectedNetwork, // Para filtrar
        explorerUrl: networks[localSelectedNetwork]?.blockExplorerUrls?.[0] || '', // URL base del explorador
        date: new Date().toLocaleString(),
        status: 'pending' // Agregamos estado
      };
      
      txHistory = [newTx, ...txHistory];
      localStorage.setItem('transferHistory', JSON.stringify(txHistory));

      // Limpiar formulario para que el usuario pueda hacer otra cosa
      recipientAddress = '';
      amount = '';
      txStatus = 'loading'; // Mantenemos estado loading visualmente para esta tx

      // Esperar confirmación
      await tx.wait(); 
      
      txStatus = 'success';

      // Actualizar estado en historial a confirmado
      txHistory = txHistory.map(t => t.hash === txHash ? { ...t, status: 'confirmed' } : t);
      localStorage.setItem('transferHistory', JSON.stringify(txHistory));

      // Guardar también en base de datos Neon PostgreSQL
      try {
        fetch('http://localhost:3000/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txHash: newTx.hash,
            buyerWallet: account,
            sellerWallet: newTx.to,
            items: [{ nombre: 'Transferencia Directa', cantidad: 1, precio: parseFloat(newTx.amount) }],
            totalAmount: parseFloat(newTx.amount),
            currency: newTx.symbol,
            network: newTx.network,
            networkKey: newTx.networkKey,
            explorerUrl: newTx.explorerUrl,
            concept: 'Transferencia directa Web3',
            status: 'confirmed'
          })
        }).catch(e => console.warn("Error guardando transfer en Neon DB:", e));
      } catch (e) {}

    } catch (error) {
      console.error(error);
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
        <div transition:fly={{ y: -10, duration: 300 }} class="bg-success/10 border border-success/50 rounded-xl p-4 flex flex-col gap-2">
          <div class="flex items-center gap-3">
            <CheckCircle class="text-success shrink-0" size={20} />
            <p class="text-success font-bold">¡Transacción Exitosa!</p>
          </div>
          {#if txHash}
            <p class="text-xs text-muted font-mono truncate pl-8">Hash: {txHash}</p>
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

  <!-- Historial de Transferencias (Filtrado por red) -->
  {#if txHistory.filter(tx => tx.networkKey === localSelectedNetwork || tx.network === networks[localSelectedNetwork]?.shortName).length > 0}
    <div class="mt-12 bg-panel/40 backdrop-blur-md border border-border rounded-[2rem] p-8 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
      <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Activity class="text-primary" size={24} /> 
        Historial en {networks[localSelectedNetwork]?.shortName}
      </h3>
      <div class="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {#each txHistory.filter(tx => tx.networkKey === localSelectedNetwork || tx.network === networks[localSelectedNetwork]?.shortName) as tx}
          <div class="bg-dark/50 border border-border/50 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary/30 transition-colors relative">
            <div class="flex-grow overflow-hidden w-full sm:w-auto">
              <div class="flex items-center gap-2 mb-1">
                <span class="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">{tx.network}</span>
                <span class="text-xs text-muted">{tx.date}</span>
                {#if tx.status === 'pending'}
                  <span class="bg-yellow-500/20 text-yellow-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                    <Loader size={10} class="animate-spin" /> Pendiente
                  </span>
                {:else}
                  <span class="bg-success/20 text-success text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle size={10} /> Confirmado
                  </span>
                {/if}
              </div>
              <p class="text-sm text-white font-mono truncate" title={tx.to}>A: {tx.to}</p>
              <p class="text-xs text-muted font-mono truncate mt-1">Hash: {tx.hash}</p>
              
              {#if tx.explorerUrl}
                <a 
                  href="{tx.explorerUrl}/tx/{tx.hash}" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="inline-block mt-2 text-xs font-bold text-primary hover:text-white transition-colors underline decoration-primary/50 underline-offset-4"
                >
                  Ver más detalle ↗
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
          // Borrar solo los de esta red
          txHistory = txHistory.filter(tx => tx.networkKey !== localSelectedNetwork && tx.network !== networks[localSelectedNetwork]?.shortName); 
          localStorage.setItem('transferHistory', JSON.stringify(txHistory)); 
        }}
        class="mt-6 text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 mx-auto font-bold"
      >
        Borrar Historial de esta red
      </button>
    </div>
  {/if}
</div>
