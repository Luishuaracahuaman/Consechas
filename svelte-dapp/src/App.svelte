<script>
  import { onMount } from 'svelte';
  import { crossfade, fly, scale } from 'svelte/transition';
  import { cubicOut, quintOut, backOut } from 'svelte/easing';
  import { ethers } from 'ethers';
  import { Menu, X, Bell, Play, ChevronDown } from 'lucide-svelte';
  import MarketView from './components/MarketView.svelte';
  import FarmerView from './components/FarmerView.svelte';
  import CartView from './components/CartView.svelte';
  import TrackingView from './components/TrackingView.svelte';
  import ReceiptView from './components/ReceiptView.svelte';
  import CheckoutView from './components/CheckoutView.svelte';
  import BalanceView from './components/BalanceView.svelte';
  import TransferView from './components/TransferView.svelte';
  import AuroraBackground from './components/AuroraBackground.svelte';
  import ShinyButton from './components/ShinyButton.svelte';
  import Footer from './components/Footer.svelte';
  import AppMenuBar from './components/AppMenuBar.svelte';

  // States
  let currentView = $state('home');
  let isWalletConnected = $state(false);
  let walletModalOpen = $state(false);
  let disconnectModalOpen = $state(false);
  let mobileMenuOpen = $state(false);
  let notificationsOpen = $state(false);

  let lastScrollY = $state(0);
  let showNav = $state(true);

  function handleScroll() {
    if (window.scrollY > lastScrollY && window.scrollY > 80) {
      showNav = false; // Bajar oculta el menú
    } else {
      showNav = true;  // Subir lo muestra
    }
    lastScrollY = window.scrollY;
  }
  let account = $state(null);
  let provider = null;
  let toast = $state(null);
  
  let carrito = $state([]);
  let lastOrder = $state(null);
  let currentProduct = $state(null);
  let chatOpen = $state(false);
  let chatTarget = $state(null);
  let faqOpen = $state(null);
  let profilePhoto = $state(null);
  let fileInput = $state();

  function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
      profilePhoto = URL.createObjectURL(file);
    }
  }

  function triggerPhotoUpload() {
    fileInput.click();
  }

  function toggleFaq(id) {
    faqOpen = faqOpen === id ? null : id;
  }

  const notificaciones = [
    { id: 1, text: "Se ha bloqueado 1,500 USDT en tu contrato de Cacao", time: "Hace 5 min", unread: true },
    { id: 2, text: "El productor Fundo San Vicente ha enviado tu cosecha", time: "Hace 1 hora", unread: true },
    { id: 3, text: "Contrato inteligente auditado con éxito", time: "Hace 1 día", unread: false }
  ];

  function showToast(message, type = 'success') {
    toast = { message, type };
    setTimeout(() => toast = null, 3000);
  }

  function navigate(view) {
    mobileMenuOpen = false;
    currentView = view;
    if (typeof window !== 'undefined') {
      localStorage.setItem('terra_current_view', view);
    }
    window.scrollTo(0, 0);
  }

  const [send, receive] = crossfade({
    duration: 400,
    easing: cubicOut,
  });

  let eip6963Providers = new Map();

  // Escuchar proveedores EIP-6963 de inmediato a nivel de script (antes de onMount)
  if (typeof window !== 'undefined') {
    window.addEventListener("eip6963:announceProvider", (event) => {
      if (event?.detail?.info && event?.detail?.provider) {
        const { info, provider: prov } = event.detail;
        console.log(">>> EIP-6963 Detectado:", info.name, info.rdns, prov);
        if (info.name) eip6963Providers.set(info.name.toLowerCase(), prov);
        if (info.rdns) eip6963Providers.set(info.rdns.toLowerCase(), prov);
      }
    });
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  }

  onMount(async () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event("eip6963:requestProvider"));
      
      console.log("=== ESTADO DE WALLETS EN EL NAVEGADOR ===");
      console.log("window.ethereum:", window.ethereum);
      console.log("isMetaMask:", window.ethereum?.isMetaMask, "isPali:", window.ethereum?.isPali);
      console.log("providers array:", window.ethereum?.providers);
      console.log("window.pali:", window.pali);
      console.log("eip6963Providers detectados:", Array.from(eip6963Providers.keys()));

      // 1. Restaurar la última vista donde ingresó el usuario
      const savedView = localStorage.getItem('terra_current_view');
      if (savedView && savedView !== 'home') {
        currentView = savedView;
      }

      // 2. Restaurar sesión de wallet si ya había ingresado
      const wasConnected = localStorage.getItem('terra_wallet_connected') === 'true';
      const savedAccount = localStorage.getItem('terra_account');

      if (wasConnected) {
        if (window.ethereum) {
          try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
              account = accounts[0];
              isWalletConnected = true;
              provider = new ethers.BrowserProvider(window.ethereum);
            } else if (savedAccount) {
              account = savedAccount;
              isWalletConnected = true;
            }
          } catch (e) {
            if (savedAccount) {
              account = savedAccount;
              isWalletConnected = true;
            }
          }
        } else if (savedAccount) {
          account = savedAccount;
          isWalletConnected = true;
        }
      }
    }
  });

  let metamaskBlockedByPali = $state(false);

  async function resolveProvider(walletName) {
    if (typeof window === 'undefined') return null;

    if (walletName === 'MetaMask') {
      // 1. Detección EIP-6963 (MetaMask independiente y directo)
      for (const [key, prov] of eip6963Providers.entries()) {
        if (key.includes('metamask') || key.includes('io.metamask')) {
          return prov;
        }
      }

      // 2. Disparar solicitud EIP-6963 y esperar respuesta
      window.dispatchEvent(new Event("eip6963:requestProvider"));
      await new Promise(res => setTimeout(res, 250));

      for (const [key, prov] of eip6963Providers.entries()) {
        if (key.includes('metamask') || key.includes('io.metamask')) {
          return prov;
        }
      }

      // 3. Array de proveedores múltiples (window.ethereum.providers)
      if (window.ethereum?.providers?.length) {
        const found = window.ethereum.providers.find(p => (p.isMetaMask || p._metamask) && !p.isPali);
        if (found) return found;
      }

      // 4. Objetos alternativos inyectados por extensiones
      if (window.metamask) return window.metamask;
      if (window.ethereumProvider?.isMetaMask && !window.ethereumProvider?.isPali) return window.ethereumProvider;

      // 5. window.ethereum directo (únicamente si NO es Pali)
      if (window.ethereum) {
        if (window.ethereum._metamask || (!window.ethereum.isPali && window.ethereum.isMetaMask)) {
          return window.ethereum;
        }
      }

      return null;
    }

    if (walletName === 'Pali Wallet') {
      // 1. Detección EIP-6963
      for (const [key, prov] of eip6963Providers.entries()) {
        if (key.includes('pali')) return prov;
      }
      // 2. window.pali directo
      if (window.pali) return window.pali;
      // 3. Array de proveedores múltiples
      if (window.ethereum?.providers?.length) {
        const found = window.ethereum.providers.find(p => p.isPali);
        if (found) return found;
      }
      // 4. window.ethereum si pertenece a Pali
      if (window.ethereum?.isPali) return window.ethereum;
      return null;
    }

    return null;
  }

  async function connectWallet(walletName) {
    metamaskBlockedByPali = false;
    const selectedProvider = await resolveProvider(walletName);

    if (selectedProvider) {
      try {
        // Invocar directamente a la extensión seleccionada para que abra su ventana de login
        const accounts = await selectedProvider.request({ method: "eth_requestAccounts" });
        if (accounts && accounts.length > 0) {
          account = accounts[0];
          provider = new ethers.BrowserProvider(selectedProvider);
          isWalletConnected = true;
          walletModalOpen = false;
          if (typeof window !== 'undefined') {
            localStorage.setItem('terra_wallet_connected', 'true');
            localStorage.setItem('terra_wallet_name', walletName);
            localStorage.setItem('terra_account', account);
          }
          showToast(`Conectado exitosamente con ${walletName}.`);
          
          if (currentView === 'home') {
            navigate('market');
          }

          if (selectedProvider.on) {
            selectedProvider.on('chainChanged', (chainId) => {
              console.log("Red cambiada a:", chainId);
            });
            selectedProvider.on('accountsChanged', (newAccounts) => {
              if (newAccounts && newAccounts.length > 0) {
                account = newAccounts[0];
                if (typeof window !== 'undefined') {
                  localStorage.setItem('terra_account', account);
                }
              } else {
                confirmDisconnect();
              }
            });
          }
          return;
        }
      } catch (error) {
        console.warn(`Error al conectar con ${walletName}:`, error);
        if (error.code === 4001 || error.code === 4100) {
          showToast(`Conexión con ${walletName} cancelada por el usuario.`, "error");
        } else {
          showToast(`Error al abrir ventana de ${walletName}.`, "error");
        }
      }
    } else {
      // Si MetaMask fue solicitado pero Pali Wallet lo está opacando
      if (walletName === 'MetaMask' && (window.ethereum?.isPali || window.pali)) {
        metamaskBlockedByPali = true;
        showToast("Pali Wallet está activa como predeterminada y bloquea a MetaMask.", "error");
      } else {
        showToast(`No se detectó la extensión de ${walletName} instalada.`, "error");
      }
    }
  }

  function connectDemoWallet(walletName) {
    account = walletName === 'MetaMask' 
      ? "0x71C8366420A023c02554364946637B1a0765B42c" 
      : "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7";
    isWalletConnected = true;
    walletModalOpen = false;
    metamaskBlockedByPali = false;
    if (typeof window !== 'undefined') {
      localStorage.setItem('terra_wallet_connected', 'true');
      localStorage.setItem('terra_wallet_name', walletName);
      localStorage.setItem('terra_account', account);
    }
    showToast(`Conectado en modo prueba con ${walletName}.`);
    if (currentView === 'home') {
      navigate('market');
    }
  }

  function confirmDisconnect() {
    isWalletConnected = false;
    account = null;
    disconnectModalOpen = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('terra_wallet_connected');
      localStorage.removeItem('terra_wallet_name');
      localStorage.removeItem('terra_account');
    }
    showToast("Wallet desconectada exitosamente.");
  }

  // --- LOGICA DE REDES (EVM / UTXO - PALI WALLET) ---
  const networks = {
    'ethereum': {
      chainId: '0x1',
      chainName: 'Ethereum Mainnet',
      shortName: 'Ethereum Mainnet',
      rpcUrls: ['https://cloudflare-eth.com'],
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      blockExplorerUrls: ['https://etherscan.io'],
      logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg'
    },
    'polygon': {
      chainId: '0x89',
      chainName: 'Polygon Mainnet',
      shortName: 'Polygon Mainnet',
      rpcUrls: ['https://polygon.llamarpc.com'],
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      blockExplorerUrls: ['https://polygonscan.com/'],
      logo: 'https://cryptologos.cc/logos/polygon-matic-logo.svg'
    },
    'rollux': {
      chainId: '0x15f90',
      chainName: 'Rollux',
      shortName: 'Rollux',
      rpcUrls: ['https://rpc.rollux.com'],
      nativeCurrency: { name: 'SYS', symbol: 'SYS', decimals: 18 },
      blockExplorerUrls: ['https://explorer.rollux.com'],
      logo: 'https://cryptologos.cc/logos/zcash-zec-logo.svg' // Logo funcional (Zcash)
    },
    'syscoin-nevm': {
      chainId: '0x39',
      chainName: 'Syscoin NEVM',
      shortName: 'Syscoin NEVM',
      rpcUrls: ['https://rpc.syscoin.org'],
      nativeCurrency: { name: 'SYS', symbol: 'SYS', decimals: 18 },
      blockExplorerUrls: ['https://explorer.syscoin.org'],
      logo: 'https://cryptologos.cc/logos/syscoin-sys-logo.svg'
    },
    'syscoin-testnet': {
      chainId: '0x1644', // 5700
      chainName: 'Syscoin NEVM Testnet',
      shortName: 'Syscoin NEVM Testnet',
      rpcUrls: ['https://rpc.tanenbaum.io'],
      nativeCurrency: { name: 'tSYS', symbol: 'tSYS', decimals: 18 },
      blockExplorerUrls: ['https://tanenbaum.io'],
      logo: 'https://cryptologos.cc/logos/starknet-token-strk-logo.svg' // Logo distinto (Testnet)
    },
    'zksys-testnet': {
      chainId: '0xdeE1', // 57057
      chainName: 'zkSYS Testnet',
      shortName: 'zkSYS Testnet',
      rpcUrls: ['https://rpc-zk.tanenbaum.io'],
      nativeCurrency: { name: 'TSYS', symbol: 'TSYS', decimals: 18 },
      blockExplorerUrls: ['https://explorer-zk.tanenbaum.io'],
      logo: 'https://cryptologos.cc/logos/cosmos-atom-logo.svg' // Logo genérico para que se vea
    },
    'base-sepolia': {
      chainId: '0x14a34', // 84532
      chainName: 'Base Sepolia Testnet',
      shortName: 'Base Sepolia Testnet',
      rpcUrls: ['https://sepolia.base.org'],
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      blockExplorerUrls: ['https://sepolia-explorer.base.org'],
      logo: 'https://avatars.githubusercontent.com/u/108554348?v=4'
    },
    'hoodi': {
      chainId: '0x88bb0', // 560048
      chainName: 'Ethereum Hoodi',
      shortName: 'Ethereum Hoodi',
      rpcUrls: ['https://0xrpc.io/hoodi'],
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      blockExplorerUrls: ['https://light-hoodi.beaconcha.in/'],
      logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg' // Logo funcional
    },
    'sepolia': {
      chainId: '0xaa36a7', // 11155111
      chainName: 'Sepolia',
      shortName: 'Sepolia',
      rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      blockExplorerUrls: ['https://sepolia.etherscan.io'],
      logo: 'https://cryptologos.cc/logos/ethereum-classic-etc-logo.svg' // Logo verde distinto
    },
    'utxo': {
      chainId: 'utxo',
      chainName: 'Syscoin (UTXO Network)',
      shortName: 'Syscoin (UTXO)',
      isUTXO: true,
      logo: 'https://cryptologos.cc/logos/syscoin-sys-logo.svg'
    }
  };

  let currentNetwork = $state('polygon');
  let networkDropdownOpen = $state(false);

  async function switchNetwork(networkKey) {
    currentNetwork = networkKey;
    const net = networks[networkKey];

    if (net.isUTXO) {
      if (window.pali) {
        try {
          // Pali Wallet inyecta window.pali para redes UTXO
          const accounts = await window.pali.request({ method: 'sys_requestAccounts' });
          if (accounts && accounts.length > 0) {
            account = accounts[0];
            isWalletConnected = true;
            showToast('Conectado a la red UTXO vía Pali Wallet', 'success');
          }
        } catch (err) {
          console.error(err);
          showToast('Error al conectar con Pali Wallet (UTXO).', 'error');
        }
      } else {
        showToast('Para redes UTXO necesitas instalar Pali Wallet.', 'error');
      }
      return;
    }

    if (!window.ethereum) {
      showToast('No se detectó un proveedor Web3 (MetaMask / Pali).', 'error');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: net.chainId }],
      });
      showToast(`Conectado a ${net.chainName}`, 'success');
    } catch (switchError) {
      // Si la red no existe (código 4902), la añadimos automáticamente
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: net.chainId,
                chainName: net.chainName,
                rpcUrls: net.rpcUrls,
                nativeCurrency: net.nativeCurrency,
                blockExplorerUrls: net.blockExplorerUrls
              },
            ],
          });
          showToast(`Red ${net.chainName} añadida y conectada`, 'success');
        } catch (addError) {
          console.error(addError);
          showToast('Error al añadir la red.', 'error');
        }
      } else {
        console.error(switchError);
        showToast('Error al cambiar de red.', 'error');
      }
    }
  }
</script>

<svelte:window onscroll={handleScroll} />
<div class="min-h-screen flex flex-col font-sans text-main relative">
  <AuroraBackground starCount={60} />

  {#if toast}
    <div class="fixed top-5 right-5 z-[10000] p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right-8 duration-300 {toast.type === 'success' ? 'bg-panel border-success text-white' : 'bg-panel border-red-500 text-white'}">
      <div class="w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-inner {toast.type === 'success' ? 'bg-success/20 text-success' : 'bg-red-500/20 text-red-500'}">
        {toast.type === 'success' ? '✓' : '⚠'}
      </div>
      <p class="font-semibold text-sm pr-4">{toast.message}</p>
      <button onclick={() => toast = null} class="ml-2 text-muted hover:text-white transition-colors">✕</button>
    </div>
  {/if}

  <nav class="flex justify-between items-center px-4 md:px-10 py-4 bg-dark/70 backdrop-blur-md sticky top-0 z-50 transition-transform duration-300 {showNav ? 'translate-y-0' : '-translate-y-full'}">
    <div class="flex items-center gap-4 md:gap-12">
      <!-- Logo Oculto -->
      <!-- <div class="flex items-center cursor-pointer pl-2 mr-4 md:mr-10" onclick={() => navigate('home')}>
        <img src="/logo_transparent.png" alt="TerraTrust Logo" class="h-16 md:h-20 w-auto object-contain scale-[1.2] md:scale-[1.5] origin-left drop-shadow-lg" />
      </div> -->

      <button class="md:hidden ml-auto text-white p-2" onclick={() => mobileMenuOpen = !mobileMenuOpen}>
        {#if mobileMenuOpen}<X />{:else}<Menu />{/if}
      </button>

      <div class="hidden md:flex flex-1 justify-center">
        <AppMenuBar {currentView} {navigate} />
      </div>
      <!-- Menú Móvil (Solo se muestra cuando se clickea el botón de hamburguesa) -->
      {#if mobileMenuOpen}
        <div class="absolute top-full left-0 w-full bg-dark border-b border-border p-4 flex flex-col gap-2 z-50 md:hidden shadow-2xl">
          <button class="text-left px-4 py-3 text-lg font-bold text-white hover:bg-white/10 rounded" onclick={() => { navigate('balance'); mobileMenuOpen = false; }}>Saldos</button>
        </div>
      {/if}
    </div>
    
    <div class="hidden md:flex items-center gap-8 relative">
      <div class="relative">
        <button onclick={() => notificationsOpen = !notificationsOpen} class="text-muted hover:text-white transition-colors relative">
          <Bell size={24} />
          <span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-dark"></span>
        </button>
        
        {#if notificationsOpen}
          <div class="absolute right-0 mt-4 w-80 bg-panel border border-border rounded-xl shadow-2xl overflow-hidden z-50">
            <div class="p-4 border-b border-border bg-dark">
              <h3 class="font-bold text-white">Notificaciones</h3>
            </div>
            <div class="max-h-80 overflow-y-auto">
              {#each notificaciones as n}
                <div class="p-4 border-b border-border hover:bg-dark cursor-pointer transition-colors {n.unread ? 'bg-primary/5' : ''}">
                  <p class="text-sm text-white mb-1">{n.text}</p>
                  <p class="text-xs text-muted font-medium">{n.time}</p>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
      <ShinyButton 
        label={isWalletConnected ? `${account.slice(0, 6)}...` : 'Acceder a Web3'}
        showOnlineIndicator={isWalletConnected}
        onclick={() => isWalletConnected ? disconnectModalOpen = true : walletModalOpen = true}
      />
    </div>
  </nav>

  <div class="md:hidden fixed bottom-4 right-4 z-40">
    <ShinyButton 
      label={isWalletConnected ? 'Wallet' : 'Acceder'}
      showOnlineIndicator={isWalletConnected}
      cornerRadius={32}
      onclick={() => isWalletConnected ? disconnectModalOpen = true : walletModalOpen = true}
    />
  </div>

  <main class="flex-grow">
    {#if currentView === 'home'}
      <div class="animate-in fade-in duration-300">
        <header class="flex flex-col items-center pt-16 md:pt-24 pb-10 px-4 max-w-[100vw] mx-auto relative overflow-hidden text-center z-10">
          <div class="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-border bg-panel/50 backdrop-blur-sm mb-8 shadow-sm">
            <span class="text-xs md:text-sm font-medium text-muted hover:text-white transition-colors cursor-pointer">Únete a los más de 200 agricultores 🚀</span>
          </div>
          
          <h1 class="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[1.1] mb-6 tracking-tight max-w-5xl">
            Vende tu Cosecha con <br class="hidden md:block"/> <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-600">Smart Contracts</span>
          </h1>
          
          <p class="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-16 px-4">
            Venta directa, pagos seguros en USDT, trazabilidad blockchain y cero intermediarios para fundos de Cañete y Nuevo Imperial.
          </p>
          
          <div class="relative w-full h-[300px] md:h-[450px] flex justify-center items-start mt-4">
            <!-- Botones superpuestos en el centro -->
            <div class="absolute top-[40%] md:top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col sm:flex-row gap-4">
              <ShinyButton label="Comienza a comprar hoy" cornerRadius={32} onclick={() => navigate('market')} />
              <button onclick={() => navigate('farmer')} class="bg-panel/80 backdrop-blur-md text-white border border-border font-bold py-3 px-8 rounded-full hover:bg-dark transition-colors text-lg shadow-xl">Soy Productor</button>
            </div>
            
            <!-- Galería de imágenes estilo "Hero 3" -->
            <div class="flex justify-center gap-3 md:gap-6 w-full max-w-[1400px] px-2 md:px-8">
              <img src="/hero/grapes.jpg" alt="Uvas" class="w-24 sm:w-32 md:w-56 h-48 sm:h-64 md:h-96 object-cover rounded-2xl shadow-2xl -rotate-[8deg] translate-y-12 opacity-80 hover:opacity-100 hover:-translate-y-2 hover:-rotate-[4deg] transition-all duration-500 hidden sm:block" />
              <img src="/hero/cacao.jpg" alt="Cacao" class="w-24 sm:w-32 md:w-56 h-48 sm:h-64 md:h-96 object-cover rounded-2xl shadow-2xl -rotate-[4deg] translate-y-4 opacity-90 hover:opacity-100 hover:-translate-y-2 hover:-rotate-[2deg] transition-all duration-500" />
              <img src="/hero/field.jpg" alt="Campo" class="w-28 sm:w-36 md:w-64 h-56 sm:h-72 md:h-[420px] object-cover rounded-2xl shadow-2xl rotate-[1deg] translate-y-8 opacity-100 hover:-translate-y-2 hover:rotate-0 transition-all duration-500 z-20 ring-1 ring-border" />
              <img src="/hero/apples.jpg" alt="Manzanas" class="w-24 sm:w-32 md:w-56 h-48 sm:h-64 md:h-96 object-cover rounded-2xl shadow-2xl rotate-[5deg] translate-y-2 opacity-90 hover:opacity-100 hover:-translate-y-2 hover:rotate-[3deg] transition-all duration-500" />
              <img src="/hero/farmer.jpg" alt="Agricultor" class="w-24 sm:w-32 md:w-56 h-48 sm:h-64 md:h-96 object-cover rounded-2xl shadow-2xl rotate-[9deg] translate-y-16 opacity-80 hover:opacity-100 hover:-translate-y-2 hover:rotate-[5deg] transition-all duration-500 hidden md:block" />
            </div>
            
            <!-- Sombra difuminada inferior removida para más transparencia -->
          </div>
        </header>

        <section class="py-10 md:py-20 px-4 md:px-[5%] z-10 relative bg-transparent">
          <div class="max-w-7xl mx-auto">
            <h2 class="text-3xl md:text-4xl font-extrabold leading-[1.1] mb-12 text-center">SOBRE EL PROYECTO <span class="text-primary">BLOCKCHAIN</span></h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 relative">
              <!-- Glow backdrop -->
              <div class="absolute inset-0 bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>

              <!-- Box 1 -->
              <div class="relative group bg-panel/40 backdrop-blur-md p-8 md:p-10 border border-border/40 rounded-3xl shadow-2xl hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div class="mb-10">
                  <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl border border-primary/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                      📖
                    </div>
                    <h3 class="text-2xl font-black text-white tracking-wide">1. Descripción</h3>
                  </div>
                  <p class="text-muted text-base leading-relaxed pl-16 border-l-2 border-border/50 group-hover:border-primary/30 transition-colors">
                    TerraTrust es una DApp descentralizada desarrollada en Svelte que permite transacciones seguras de cuenta a cuenta, gestión multi-red (EVM/UTXO) y consultas públicas de saldo directamente desde la Blockchain.
                  </p>
                </div>
                
                <div>
                  <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl border border-primary/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                      🎯
                    </div>
                    <h3 class="text-2xl font-black text-white tracking-wide">2. Objetivos</h3>
                  </div>
                  <ul class="space-y-3 pl-16">
                    {#each ['Demostrar la interacción Web3 con Svelte.', 'Implementar transacciones transparentes P2P.', 'Facilitar el cambio de redes Blockchain.'] as item}
                      <li class="flex items-start gap-3 text-muted">
                        <span class="w-2 h-2 mt-2 rounded-full bg-primary/60 shrink-0 shadow-[0_0_8px_rgba(252,213,53,0.5)]"></span>
                        <span class="leading-relaxed">{item}</span>
                      </li>
                    {/each}
                  </ul>
                </div>
              </div>
              
              <!-- Box 2 -->
              <div class="relative group bg-panel/40 backdrop-blur-md p-8 md:p-10 border border-border/40 rounded-3xl shadow-2xl hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div class="mb-10">
                  <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl border border-primary/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                      ✨
                    </div>
                    <h3 class="text-2xl font-black text-white tracking-wide">3. Beneficios</h3>
                  </div>
                  <ul class="space-y-3 pl-16 border-l-2 border-border/50 group-hover:border-primary/30 transition-colors pb-2">
                    {#each ['Inmutabilidad y seguridad criptográfica.', 'Transparencia en el rastro de fondos.', 'Eliminación de fraude por intermediarios.'] as item}
                      <li class="flex items-start gap-3 text-muted">
                        <span class="w-2 h-2 mt-2 rounded-full bg-success/80 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        <span class="leading-relaxed">{item}</span>
                      </li>
                    {/each}
                  </ul>
                </div>
                
                <div>
                  <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl border border-primary/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                      ⚡
                    </div>
                    <h3 class="text-2xl font-black text-white tracking-wide">4. Características</h3>
                  </div>
                  <ul class="space-y-3 pl-16">
                    {#each ['Envío de fondos de cuenta a cuenta.', 'Captura del Hash de transacción.', 'Consulta de saldo multi-red y multi-address.'] as item}
                      <li class="flex items-start gap-3 text-muted">
                        <span class="w-2 h-2 mt-2 rounded-full bg-blue-500/80 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                        <span class="leading-relaxed">{item}</span>
                      </li>
                    {/each}
                  </ul>
                </div>
              </div>
            </div>

            <!-- File Input hidden -->
            <input type="file" accept="image/*" class="hidden" bind:this={fileInput} onchange={handlePhotoUpload} />

            <!-- New Premium Developer Card -->
            <div class="relative overflow-hidden bg-gradient-to-br from-[#1a1c23] via-[#0b0e11] to-[#1a1c23] p-10 md:p-12 border border-border/50 rounded-[2rem] flex flex-col md:flex-row items-center gap-10 shadow-2xl group hover:border-primary/50 transition-all duration-500 my-10 max-w-4xl mx-auto">
              <!-- Glow Effect -->
              <div class="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              
              <!-- Avatar with Upload -->
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div class="relative group cursor-pointer shrink-0" onclick={triggerPhotoUpload}>
                <div class="w-36 h-36 md:w-44 md:h-44 bg-dark rounded-full border-4 border-primary overflow-hidden flex justify-center items-center text-6xl shadow-[0_0_30px_rgba(252,213,53,0.2)] transition-transform duration-300 group-hover:scale-105 z-10 relative">
                  {#if profilePhoto}
                    <img src={profilePhoto} alt="Luis Enrique" class="w-full h-full object-cover" />
                  {:else}
                    👨‍💻
                  {/if}
                  
                  <!-- Hover overlay for changing photo -->
                  <div class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                    <span class="text-white text-xs font-bold uppercase tracking-wider text-center px-2">Cambiar Foto</span>
                  </div>
                </div>
              </div>

              <!-- Content -->
              <div class="text-center md:text-left relative z-10">
                <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-4 shadow-inner">
                  <span class="text-primary font-bold text-xs uppercase tracking-widest">5. Desarrollador Principal</span>
                </div>
                <h4 class="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight drop-shadow-md">Luis Enrique Huaraca Huaman</h4>
                <p class="text-muted text-lg mb-6 flex items-center justify-center md:justify-start gap-2 font-medium">
                  <span class="w-2.5 h-2.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                  Estudiante de Sistemas Distribuidos (JuC)
                </p>
                
                <div class="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span class="px-3 py-1 bg-dark/50 border border-border/50 rounded-md text-xs font-bold text-gray-300 shadow-sm backdrop-blur-sm">🚀 Svelte 5</span>
                  <span class="px-3 py-1 bg-dark/50 border border-border/50 rounded-md text-xs font-bold text-gray-300 shadow-sm backdrop-blur-sm">🔗 Web3 & Smart Contracts</span>
                  <span class="px-3 py-1 bg-dark/50 border border-border/50 rounded-md text-xs font-bold text-gray-300 shadow-sm backdrop-blur-sm">🌐 DApp Developer</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- SECCION: TUS FONDOS Y LOTES ESTÁN SEGUROS -->
        <section class="bg-transparent py-10 md:py-20 px-4 md:px-[5%]">
          <div class="max-w-7xl mx-auto">
            <div class="flex flex-col md:flex-row justify-between mb-10 gap-10">
              <div class="w-full md:max-w-[45%]">
                <h2 class="text-3xl md:text-4xl font-extrabold leading-[1.1] mb-4 text-center md:text-left">TUS FONDOS Y LOTES<br />ESTÁN <span class="text-primary">SEGUROS</span></h2>
                <p class="text-muted text-base md:text-lg text-center md:text-left">El Smart Contract retiene los fondos (USDT) hasta que se confirma la recepción física del producto. Eliminamos el riesgo de estafas para el productor y el comprador.</p>
              </div>
              <div class="w-full md:max-w-[50%] text-center md:text-left">
                <p class="text-muted text-sm mb-1">Fondos asegurados actualmente en Smart Contracts (Polygon)</p>
                <h3 class="text-primary text-3xl md:text-4xl font-extrabold mb-1">2,500,000 USDT</h3>
                <p class="font-mono text-muted text-sm mb-5">Contrato Principal: 0x8f...4b2c</p>
                <div class="flex flex-col sm:flex-row gap-6 md:gap-12 justify-center md:justify-start">
                  <div>
                    <h4 class="text-primary text-2xl font-bold">1,250</h4>
                    <p class="text-muted">Productores activos</p>
                  </div>
                  <div>
                    <h4 class="text-primary text-2xl font-bold">15,400 Ton</h4>
                    <p class="text-muted">Cosechas transadas</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {#each [
                { img: '/hero.png', title: 'Recorriendo los campos' },
                { img: '/uva.png', title: 'Cosecha de Uvas' },
                { img: '/palta.png', title: 'Empaque de Paltas' }
              ] as video}
                <div class="relative rounded-lg overflow-hidden cursor-pointer aspect-video group border border-border">
                  <img src={video.img} alt="Video thumbnail" class="w-full h-full object-cover opacity-60 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300" />
                  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-black/70 text-white rounded-full flex items-center justify-center pl-1 group-hover:bg-primary group-hover:text-black transition-colors backdrop-blur-sm shadow-xl">
                    <Play fill="currentColor" size={24} />
                  </div>
                  <div class="absolute bottom-3 left-4 right-4">
                    <p class="font-semibold text-white truncate drop-shadow-md">{video.title}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </section>

        <!-- SECCION: PREGUNTAS FRECUENTES -->
        <section class="py-10 md:py-20 px-4 md:px-[20%] bg-transparent">
          <h2 class="text-2xl md:text-3xl font-bold text-center mb-10">Preguntas Frecuentes</h2>
          <div class="flex flex-col gap-4">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="bg-transparent border-b border-border/50 cursor-pointer py-4" onclick={() => toggleFaq(1)}>
              <div class="flex items-center gap-3 md:gap-4 text-base md:text-lg font-semibold">
                <div class="bg-panel/40 backdrop-blur-md w-7 h-7 flex items-center justify-center rounded text-sm text-muted shrink-0">1</div>
                <span>¿Por qué AgriChain es mejor que un mercado tradicional?</span>
                <ChevronDown class="ml-auto text-muted shrink-0 transition-transform duration-300 {faqOpen === 1 ? 'rotate-180' : ''}" />
              </div>
              <div class="overflow-hidden transition-all duration-300 text-muted pl-11 {faqOpen === 1 ? 'max-h-40 pt-4 pb-2' : 'max-h-0'}">
                Eliminamos a los intermediarios. Usamos tecnología Blockchain para conectar directamente a productores con compradores, garantizando precios justos.
              </div>
            </div>
            
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="bg-transparent border-b border-border/50 cursor-pointer py-4" onclick={() => toggleFaq(2)}>
              <div class="flex items-center gap-3 md:gap-4 text-base md:text-lg font-semibold">
                <div class="bg-panel/40 backdrop-blur-md w-7 h-7 flex items-center justify-center rounded text-sm text-muted shrink-0">2</div>
                <span>¿Cómo funcionan los Smart Contracts en la agricultura?</span>
                <ChevronDown class="ml-auto text-muted shrink-0 transition-transform duration-300 {faqOpen === 2 ? 'rotate-180' : ''}" />
              </div>
              <div class="overflow-hidden transition-all duration-300 text-muted pl-11 {faqOpen === 2 ? 'max-h-40 pt-4 pb-2' : 'max-h-0'}">
                El comprador deposita el dinero, pero queda bloqueado en el código. Solo se libera a la Wallet del agricultor cuando el producto llega a su destino.
              </div>
            </div>
          </div>
        </section>
      </div>
    {:else if currentView === 'market'}
      <MarketView 
        bind:carrito
        navigate={navigate}
        showToast={showToast}
        setChatOpen={(v) => chatOpen = v}
        setChatTarget={(t) => chatTarget = t}
      />
    {:else if currentView === 'farmer'}
      <FarmerView 
        isWalletConnected={isWalletConnected} 
        showToast={showToast} 
      />
    {:else if currentView === 'cart'}
      <CartView 
        navigate={navigate}
        bind:carrito
        setLastOrder={(order) => lastOrder = order}
        isWalletConnected={isWalletConnected}
        account={account}
        showToast={showToast}
        currentNetwork={currentNetwork}
        networks={networks}
        openWalletModal={() => walletModalOpen = true}
      />
    {:else if currentView === 'tracking'}
      <TrackingView 
        lastOrder={lastOrder}
        setLastOrder={(order) => lastOrder = order}
        navigate={navigate}
      />
    {:else if currentView === 'receipt'}
      <ReceiptView 
        lastOrder={lastOrder}
        navigate={navigate}
      />
    {:else if currentView === 'checkout'}
      <CheckoutView 
        product={currentProduct}
        navigate={navigate}
        showToast={showToast}
      />
    {:else if currentView === 'balance'}
      <BalanceView 
        account={account}
        isWalletConnected={isWalletConnected}
        networks={networks}
        currentNetwork={currentNetwork}
        switchNetwork={switchNetwork}
      />
    {:else if currentView === 'transfer'}
      <TransferView 
        account={account}
        isWalletConnected={isWalletConnected}
        networks={networks}
        currentNetwork={currentNetwork}
        switchNetwork={switchNetwork}
      />
    {:else}
      <div class="max-w-4xl mx-auto text-center py-20">
        <h2 class="text-3xl text-muted">Vista en construcción...</h2>
      </div>
    {/if}
  </main>

  <!-- Pie de página animado -->
  {#if currentView === 'home'}
    <Footer />
  {/if}

  {#if walletModalOpen}
    <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex justify-center items-center p-4">
      <div 
        in:fly={{ y: 40, duration: 500, easing: backOut }}
        out:scale={{ start: 0.9, duration: 250, easing: quintOut }}
        class="bg-[#0b0e11]/90 backdrop-blur-3xl border border-[#FCD34D]/30 rounded-3xl max-w-sm w-full p-8 relative shadow-[0_0_80px_rgba(252,213,77,0.15)] overflow-hidden group/modal"
      >
        <!-- Borde animado brillante -->
        <div class="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-[#6C25B5]/20 opacity-0 group-hover/modal:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

        <!-- Iluminación profesional animada -->
        <div class="absolute -top-32 -right-32 w-80 h-80 bg-primary/20 rounded-full blur-[80px] pointer-events-none animate-pulse"></div>
        <div class="absolute -bottom-32 -left-32 w-80 h-80 bg-[#6C25B5]/20 rounded-full blur-[80px] pointer-events-none animate-pulse" style="animation-delay: 1.5s;"></div>

        <button class="absolute top-5 right-5 text-muted hover:text-white transition-all hover:rotate-90 z-20" onclick={() => walletModalOpen = false}>
          <X size={24} />
        </button>
        
        <div class="relative z-10 mt-2">
          <h3 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FCD34D] to-white mb-3 text-center drop-shadow-sm tracking-tight">Acceso Web3</h3>
          <p class="text-sm text-muted mb-10 text-center font-medium">Elige tu proveedor para operar en TerraTrust.</p>
          
          <div class="flex flex-col gap-5">
            
            <!-- Pali Wallet -->
            <button onclick={() => connectWallet('Pali Wallet')} class="flex items-center justify-between bg-dark/80 backdrop-blur-sm border border-border/50 p-4 rounded-2xl hover:border-[#6C25B5] hover:bg-gradient-to-r hover:from-[#6C25B5]/20 hover:to-transparent transition-all duration-300 text-left font-semibold group shadow-lg hover:shadow-[0_0_25px_rgba(108,37,181,0.4)] hover:-translate-y-1">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full flex items-center justify-center drop-shadow-xl group-hover:scale-110 transition-transform">
                  <!-- Imagen local subida por el usuario -->
                  <img src="/logo-pali-v3.png" alt="Pali Wallet" class="w-full h-full object-contain rounded-full" />
                </div>
                <span class="text-white text-xl group-hover:text-[#b084e6] transition-colors tracking-wide">Pali Wallet</span>
              </div>
              <div class="w-2.5 h-2.5 rounded-full bg-[#6C25B5] opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_#6C25B5]"></div>
            </button>

            <!-- MetaMask -->
            <button onclick={() => connectWallet('MetaMask')} class="flex items-center justify-between bg-dark/80 backdrop-blur-sm border border-border/50 p-4 rounded-2xl hover:border-[#F6851B] hover:bg-gradient-to-r hover:from-[#F6851B]/20 hover:to-transparent transition-all duration-300 text-left font-semibold group shadow-lg hover:shadow-[0_0_25px_rgba(246,133,27,0.4)] hover:-translate-y-1">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full flex items-center justify-center p-1 drop-shadow-xl group-hover:scale-110 transition-transform">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" class="w-full h-full object-contain" />
                </div>
                <span class="text-white text-xl group-hover:text-[#F6851B] transition-colors tracking-wide">MetaMask</span>
              </div>
              <div class="w-2.5 h-2.5 rounded-full bg-[#F6851B] opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_#F6851B]"></div>
            </button>

            {#if metamaskBlockedByPali}
              <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left animate-in fade-in duration-300">
                <p class="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                  <span>⚠️</span> Pali Wallet está bloqueando a MetaMask
                </p>
                <p class="text-[11px] text-zinc-300 mb-3 leading-relaxed">
                  Pali tiene activada la prioridad Web3 en tu navegador. Para que MetaMask pueda abrir su ventana: abre la extensión <strong>Pali ➔ Configuración ➔ Desactiva "Set as default wallet"</strong>.
                </p>
                <button 
                  onclick={() => connectDemoWallet('MetaMask')} 
                  class="w-full py-2.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 rounded-xl text-xs font-bold transition-all"
                >
                  Continuar en Modo Prueba con MetaMask →
                </button>
              </div>
            {/if}

          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if disconnectModalOpen}
    <div class="fixed inset-0 bg-black/80 z-[9999] flex justify-center items-center p-5">
      <div class="bg-panel border border-border rounded-lg max-w-sm w-full p-6 relative shadow-2xl text-center">
        <h3 class="text-xl font-bold mb-2">¿Desconectar Wallet?</h3>
        <p class="text-sm text-muted mb-6">Si te desconectas, no podrás realizar compras ni firmar contratos.</p>
        
        <div class="flex gap-3">
          <button onclick={() => disconnectModalOpen = false} class="flex-1 bg-dark border border-border text-white font-semibold py-3 rounded hover:bg-border transition-colors">
            Cancelar
          </button>
          <button onclick={confirmDisconnect} class="flex-1 bg-red-500 text-white font-semibold py-3 rounded hover:bg-red-600 transition-colors">
            Sí, salir
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
