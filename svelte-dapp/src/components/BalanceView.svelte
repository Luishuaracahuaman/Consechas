<script>
  import { Search, Loader, Wallet, RefreshCw, ChevronDown } from 'lucide-svelte';
  import { ethers } from 'ethers';
  import { fly, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  let { account, isWalletConnected, networks = {}, currentNetwork = 'polygon', switchNetwork } = $props();

  let viewMode = $state('individual'); // 'individual' or 'masiva'
  let networkDropdownOpen = $state(false);
  let localSelectedNetwork = $state(currentNetwork || 'polygon');

  let searchAddress = $state('');
  let balances = $state({
    rollux: { name: 'Rollux', symbol: 'SYS', balance: '0.00', loading: false, logo: 'https://cryptologos.cc/logos/zcash-zec-logo.svg', error: null },
    'syscoin-nevm': { name: 'Syscoin NEVM', symbol: 'SYS', balance: '0.00', loading: false, logo: 'https://cryptologos.cc/logos/syscoin-sys-logo.svg', error: null },
    ethereum: { name: 'Ethereum Mainnet', symbol: 'ETH', balance: '0.00', loading: false, logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg', error: null },
    polygon: { name: 'Polygon Mainnet', symbol: 'MATIC', balance: '0.00', loading: false, logo: 'https://cryptologos.cc/logos/polygon-matic-logo.svg', error: null },
    'syscoin-testnet': { name: 'Syscoin Testnet', symbol: 'tSYS', balance: '0.00', loading: false, logo: 'https://cryptologos.cc/logos/starknet-token-strk-logo.svg', error: null },
    'base-sepolia': { name: 'Base Sepolia', symbol: 'ETH', balance: '0.00', loading: false, logo: 'https://avatars.githubusercontent.com/u/108554348?v=4', error: null },
    'zksys-testnet': { name: 'zkSYS Testnet', symbol: 'TSYS', balance: '0.00', loading: false, logo: 'https://cryptologos.cc/logos/cosmos-atom-logo.svg', error: null },
    hoodi: { name: 'Ethereum Hoodi', symbol: 'ETH', balance: '0.00', loading: false, logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg', error: null },
    sepolia: { name: 'Sepolia', symbol: 'ETH', balance: '0.00', loading: false, logo: 'https://cryptologos.cc/logos/ethereum-classic-etc-logo.svg', error: null }
  });

  const rpceEndpoints = {
    polygon: 'https://polygon-rpc.com',
    ethereum: 'https://ethereum-rpc.publicnode.com',
    rollux: 'https://rpc.rollux.com',
    'syscoin-nevm': 'https://rpc.syscoin.org',
    'syscoin-testnet': 'https://rpc.tanenbaum.io',
    'zksys-testnet': 'https://rpc-zk.tanenbaum.io',
    'base-sepolia': 'https://sepolia.base.org',
    sepolia: 'https://rpc.sepolia.org',
    hoodi: 'https://0xrpc.io/hoodi'
  };

  const chainIds = {
    polygon: '0x89',
    ethereum: '0x1',
    rollux: '0x15f90',
    'syscoin-nevm': '0x39',
    'syscoin-testnet': '0x1644',
    'zksys-testnet': '0xdeE1',
    'base-sepolia': '0x14a34',
    sepolia: '0xaa36a7',
    hoodi: '0x88bb0'
  };

  async function fetchBalance(networkKey, address) {
    balances[networkKey].loading = true;
    balances[networkKey].error = null;
    try {
      let provider;
      let balance;
      let isCurrentNetwork = false;

      if (window.ethereum) {
        try {
          const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
          let normalizedCurrent;
          if (typeof currentChainId === 'string' && currentChainId.startsWith('0x')) {
            normalizedCurrent = parseInt(currentChainId, 16);
          } else {
            normalizedCurrent = parseInt(currentChainId, 10);
          }
          const normalizedTarget = parseInt(chainIds[networkKey], 16);
          
          if (normalizedCurrent === normalizedTarget) {
            isCurrentNetwork = true;
            provider = new ethers.BrowserProvider(window.ethereum);
          }
        } catch (e) { console.error("Error reading chainId", e); }
      }

      if (!isCurrentNetwork) {
        if (networkKey === 'ethereum') {
          provider = ethers.getDefaultProvider('mainnet');
        } else if (networkKey === 'sepolia') {
          provider = ethers.getDefaultProvider('sepolia');
        } else {
          // Si es localhost, usamos el backend proxy
          const isLocalRpc = rpceEndpoints[networkKey] && (rpceEndpoints[networkKey].includes('127.0.0.1') || rpceEndpoints[networkKey].includes('localhost'));
          if (isLocalRpc) {
            const proxyRes = await fetch('http://localhost:3000/api/rpc-proxy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ rpcUrl: rpceEndpoints[networkKey], method: 'eth_getBalance', params: [address, 'latest'] })
            });
            const data = await proxyRes.json();
            if (data.error) throw new Error(data.error.message || 'Proxy Error');
            // Formatear desde hex (JSON RPC standard devuelve hex para el balance)
            balance = BigInt(data.result);
          } else {
            provider = new ethers.JsonRpcProvider(rpceEndpoints[networkKey]);
          }
        }
      }
      
      if (provider) {
        balance = await provider.getBalance(address);
      }
      
      balances[networkKey].balance = ethers.formatEther(balance);
    } catch (err) {
      console.error(`Error fetching balance for ${networkKey}:`, err);
      // Silenciar el error en la UI y poner 0 por defecto como pidió el usuario
      balances[networkKey].balance = '0.0000';
      balances[networkKey].error = null;
    } finally {
      balances[networkKey].loading = false;
    }
  }

  async function consultarSaldo() {
    let target = searchAddress;
    if (!target) {
      if (isWalletConnected && account) {
        target = account;
        searchAddress = account;
      } else {
        alert("Ingresa una dirección o conecta tu wallet.");
        return;
      }
    }
    
    // Validar address EVM básico
    if (!/^0x[a-fA-F0-9]{40}$/.test(target)) {
      alert("La dirección ingresada no es un address válido de Web3 (EVM).");
      return;
    }

    // Consulta Masiva o Individual
    if (viewMode === 'masiva') {
      const networkKeys = Object.keys(balances);
      for (const key of networkKeys) {
        fetchBalance(key, target);
      }
    } else {
      // Individual: Consultar solo la red seleccionada localmente sin cambiar la wallet
      fetchBalance(localSelectedNetwork, target);
    }
  }
</script>

<div in:fly={{ y: 30, duration: 400, delay: 200, easing: quintOut }} out:fade={{ duration: 150 }} class="max-w-4xl mx-auto px-4 py-10 mt-10">
  
  <!-- Selectores de Vista -->
  <div class="flex justify-center mb-8">
    <div class="flex items-center bg-dark/50 border border-border/50 rounded-lg p-1 shadow-lg">
      <button 
        onclick={() => viewMode = 'individual'} 
        class="px-6 py-2.5 text-sm font-semibold rounded-md transition-all {viewMode === 'individual' ? 'bg-primary text-black shadow-md' : 'text-muted hover:text-white'}"
      >
        Consulta Individual
      </button>
      <button 
        onclick={() => viewMode = 'masiva'} 
        class="px-6 py-2.5 text-sm font-semibold rounded-md transition-all {viewMode === 'masiva' ? 'bg-primary text-black shadow-md' : 'text-muted hover:text-white'}"
      >
        Consulta Masiva
      </button>
    </div>
  </div>

  <div class="text-center mb-10 min-h-[160px] relative flex flex-col items-center justify-center">
    {#if viewMode === 'individual'}
      <div in:fly={{ y: 20, duration: 300, delay: 150 }} out:fade={{ duration: 150 }} class="absolute w-full">
        <h2 class="text-4xl font-black text-white mb-4">Consulta Individual de <span class="text-primary">Saldo</span></h2>
        <p class="text-muted text-lg mb-6">Conecta a la red de tu preferencia y consulta el saldo en tiempo real.</p>
        
        <!-- Network Selector Movido Aquí -->
        {#if networks && Object.keys(networks).length > 0}
          <div class="relative inline-block text-left mb-6">
            <button 
              onclick={() => networkDropdownOpen = !networkDropdownOpen}
              class="flex items-center justify-center gap-3 bg-panel px-5 py-3 rounded-xl text-lg font-bold border border-border focus:outline-none focus:border-primary text-white cursor-pointer shadow-xl transition-all hover:bg-panel/80 mx-auto min-w-[250px]"
            >
              <span class="w-3 h-3 rounded-full inline-block shadow-[0_0_8px_rgba(255,255,255,0.5)] {localSelectedNetwork === 'utxo' ? 'bg-orange-500' : 'bg-success'}"></span>
              {#if networks[localSelectedNetwork]}
                <img src={networks[localSelectedNetwork].logo} alt={networks[localSelectedNetwork].shortName} class="w-6 h-6 rounded-full bg-white/10" />
                {networks[localSelectedNetwork].shortName}
              {/if}
              <div class="transition-transform duration-300 ml-auto {networkDropdownOpen ? 'rotate-180' : ''}">
                <ChevronDown size={18} class="text-muted" />
              </div>
            </button>
  
            {#if networkDropdownOpen}
              <div 
                transition:fly={{ y: -20, duration: 300, easing: quintOut }}
                class="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-panel border border-border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[100]"
              >
                <div class="max-h-[300px] overflow-y-auto">
                  {#each Object.entries(networks) as [key, net]}
                    <button
                      class="w-full text-left px-5 py-3 hover:bg-dark flex items-center gap-4 transition-colors {localSelectedNetwork === key ? 'bg-dark border-l-4 border-primary text-primary font-bold' : 'text-white'}"
                      onclick={() => { localSelectedNetwork = key; networkDropdownOpen = false; }}
                    >
                      <img src={net.logo} alt={net.shortName} class="w-6 h-6 rounded-full bg-white p-0.5" />
                      <span class="text-base">{net.shortName}</span>
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {:else}
      <div in:fly={{ y: 20, duration: 300, delay: 150 }} out:fade={{ duration: 150 }} class="absolute w-full">
        <h2 class="text-4xl font-black text-white mb-4">Consulta Masiva de <span class="text-primary">Saldos Web3</span></h2>
        <p class="text-muted text-lg">Verifica los fondos de cualquier billetera de forma descentralizada a través de múltiples nodos RPC en tiempo real.</p>
      </div>
    {/if}
  </div>

  <div class="bg-panel/40 backdrop-blur-md border border-border rounded-[2rem] p-8 shadow-2xl mb-12">
    <div class="flex flex-col md:flex-row gap-4 items-center">
      <div class="relative flex-grow w-full">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
          <Search size={20} />
        </div>
        <input 
          type="text" 
          bind:value={searchAddress}
          placeholder="Ej. 0x71C...9A23"
          class="w-full bg-dark border border-border focus:border-primary text-white font-mono text-lg rounded-2xl py-4 pl-12 pr-4 outline-none transition-colors shadow-inner"
        />
      </div>
      <button 
        onclick={consultarSaldo}
        class="w-full md:w-auto bg-primary text-black font-bold text-lg px-8 py-4 rounded-2xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
      >
        <RefreshCw size={20} class={Object.values(balances).some(b => b.loading) ? 'animate-spin' : ''} /> 
        Consultar 
      </button>
    </div>
    
    {#if isWalletConnected && account && searchAddress !== account}
      <div class="mt-4 flex justify-center">
        <button onclick={() => { searchAddress = account; consultarSaldo(); }} class="text-sm font-semibold text-primary hover:text-white flex items-center gap-1 transition-colors">
          <Wallet size={16} /> Usar mi Wallet conectada ({account.slice(0,6)}...)
        </button>
      </div>
    {/if}
  </div>

  <div class="{viewMode === 'masiva' ? 'grid grid-cols-1 md:grid-cols-3 gap-6' : 'flex justify-center'}">
    {#each Object.entries(balances) as [key, data] (key)}
      {#if viewMode === 'masiva' || (viewMode === 'individual' && key === localSelectedNetwork)}
        <div transition:fly={{ y: 30, duration: 400, easing: quintOut }} class="bg-panel/40 backdrop-blur-md border {data.loading ? 'border-primary shadow-[0_0_15px_rgba(252,213,53,0.3)]' : 'border-border'} rounded-2xl relative overflow-hidden transition-all duration-300 group hover:border-primary/50 hover:-translate-y-1 {viewMode === 'individual' ? 'w-full max-w-2xl p-10' : 'p-6'}">
          <div class="flex justify-between items-start mb-6">
            <div class="flex items-center gap-3">
              <img src={data.logo} alt={data.name} class="{viewMode === 'individual' ? 'w-16 h-16' : 'w-10 h-10'} bg-white rounded-full p-1 shadow-sm transition-all" />
              <div>
                <h4 class="{viewMode === 'individual' ? 'text-2xl' : 'text-base'} font-bold text-white leading-tight transition-all">{data.name}</h4>
                <p class="text-xs text-muted">{data.symbol}</p>
              </div>
            </div>
            {#if data.loading}
              <Loader size={20} class="text-primary animate-spin" />
            {/if}
          </div>
          
          <div>
            <p class="text-xs text-muted uppercase tracking-widest font-bold mb-1">Saldo Nativo</p>
            {#if data.error}
              <p class="text-red-500 font-bold text-xl">{data.error}</p>
            {:else if data.loading}
              <div class="h-8 bg-panel animate-pulse rounded border border-border w-3/4"></div>
            {:else}
              <p class="text-3xl font-black text-white truncate" title={data.balance}>
                {parseFloat(data.balance).toFixed(4)} <span class="text-lg font-bold text-primary">{data.symbol}</span>
              </p>
            {/if}
          </div>
          
          {#if viewMode === 'individual' && networks[key]}
            <div class="mt-8 pt-6 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm animate-in fade-in duration-500">
              <div>
                <p class="text-muted mb-1 uppercase text-xs font-bold tracking-wider">Chain ID</p>
                <p class="text-white bg-dark/50 px-3 py-2 rounded-lg font-mono border border-border/50">{parseInt(networks[key].chainId, 16)}</p>
              </div>
              <div>
                <p class="text-muted mb-1 uppercase text-xs font-bold tracking-wider">RPC Endpoint</p>
                <p class="text-white bg-dark/50 px-3 py-2 rounded-lg font-mono border border-border/50 truncate" title={rpceEndpoints[key]}>{rpceEndpoints[key]}</p>
              </div>
              
              {#if networks[key].blockExplorerUrls}
                <div class="sm:col-span-2 mt-2">
                  <a href={networks[key].blockExplorerUrls[0]} target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 w-full bg-dark/80 hover:bg-primary/20 hover:text-primary text-white border border-border hover:border-primary/50 py-3 rounded-xl transition-all font-semibold">
                    <Search size={16} /> Ver en Explorador de Bloques
                  </a>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    {/each}
  </div>
</div>
