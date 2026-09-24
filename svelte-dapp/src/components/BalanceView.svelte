<script>
  import { Search, Loader, Wallet, RefreshCw } from 'lucide-svelte';
  import { ethers } from 'ethers';

  let { account, isWalletConnected } = $props();

  let searchAddress = $state('');
  let balances = $state({
    current: { name: 'Mi Billetera', symbol: 'Nativo', balance: '0.00', loading: false, logo: 'https://cryptologos.cc/logos/chainlink-link-logo.svg', error: null },
    rollux: { name: 'Rollux', symbol: 'SYS', balance: '0.00', loading: false, logo: 'https://cryptologos.cc/logos/zcash-zec-logo.svg', error: null },
    'syscoin-nevm': { name: 'Syscoin NEVM', symbol: 'SYS', balance: '0.00', loading: false, logo: 'https://cryptologos.cc/logos/syscoin-sys-logo.svg', error: null },
    ethereum: { name: 'Ethereum Mainnet', symbol: 'ETH', balance: '0.00', loading: false, logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg', error: null },
    polygon: { name: 'Polygon Mainnet', symbol: 'MATIC', balance: '0.00', loading: false, logo: 'https://cryptologos.cc/logos/polygon-matic-logo.svg', error: null },
    'syscoin-testnet': { name: 'Syscoin Testnet', symbol: 'tSYS', balance: '0.00', loading: false, logo: 'https://cryptologos.cc/logos/starknet-token-strk-logo.svg', error: null },
    'base-sepolia': { name: 'Base Sepolia', symbol: 'ETH', balance: '0.00', loading: false, logo: 'https://avatars.githubusercontent.com/u/108554348?v=4', error: null },
    hoodi: { name: 'Ethereum Hoodi', symbol: 'ETH', balance: '0.00', loading: false, logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg', error: null },
    sepolia: { name: 'Sepolia', symbol: 'ETH', balance: '0.00', loading: false, logo: 'https://cryptologos.cc/logos/ethereum-classic-etc-logo.svg', error: null }
  });

  const rpceEndpoints = {
    polygon: 'https://polygon-rpc.com',
    ethereum: 'https://ethereum-rpc.publicnode.com',
    rollux: 'https://rpc.rollux.com',
    'syscoin-nevm': 'https://rpc.syscoin.org',
    'syscoin-testnet': 'https://rpc.tanenbaum.io',
    'base-sepolia': 'https://sepolia.base.org',
    sepolia: 'https://rpc.sepolia.org',
    hoodi: 'http://localhost:8545'
  };

  const chainIds = {
    polygon: '0x89',
    ethereum: '0x1',
    rollux: '0x15f90',
    'syscoin-nevm': '0x39',
    'syscoin-testnet': '0x1644',
    'base-sepolia': '0x14a34',
    sepolia: '0xaa36a7',
    hoodi: '0x539'
  };

  async function fetchBalance(networkKey, address) {
    balances[networkKey].loading = true;
    balances[networkKey].error = null;
    try {
      let provider;
      let balance;
      let isCurrentNetwork = false;

      if (networkKey === 'current') {
        if (!window.ethereum) throw new Error("No web3");
        provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        balances[networkKey].name = 'Mi Billetera';
        balances[networkKey].symbol = 'Nativo';
        isCurrentNetwork = true;
      } else if (window.ethereum) {
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
          provider = new ethers.JsonRpcProvider(rpceEndpoints[networkKey]);
        }
      }
      
      balance = await provider.getBalance(address);
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

    // Consulta Masiva a TODAS las redes configuradas
    const networkKeys = Object.keys(balances);
    for (const key of networkKeys) {
      fetchBalance(key, target);
    }
  }
</script>

<div class="max-w-4xl mx-auto px-4 py-10 mt-10 animate-in fade-in duration-500">
  <div class="text-center mb-10">
    <h2 class="text-4xl font-black text-white mb-4">Consulta Masiva de <span class="text-primary">Saldos Web3</span></h2>
    <p class="text-muted text-lg">Verifica los fondos de cualquier billetera de forma descentralizada a través de múltiples nodos RPC en tiempo real.</p>
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

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    {#each Object.entries(balances) as [key, data]}
      <div class="bg-gradient-to-br from-dark to-[#0b0e11] border {data.loading ? 'border-primary shadow-[0_0_15px_rgba(252,213,53,0.3)]' : 'border-border'} rounded-2xl p-6 relative overflow-hidden transition-all duration-300 group hover:border-primary/50 hover:-translate-y-1">
        <div class="flex justify-between items-start mb-6">
          <div class="flex items-center gap-3">
            <img src={data.logo} alt={data.name} class="w-10 h-10 bg-white rounded-full p-1 shadow-sm" />
            <div>
              <h4 class="font-bold text-white leading-tight">{data.name}</h4>
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
      </div>
    {/each}
  </div>
</div>
