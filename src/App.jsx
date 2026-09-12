import React, { useState } from 'react';
import { ChevronDown, Play, Shield, ShieldCheck, ChevronLeft, ShoppingCart, Download, Share2, FileText } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaderMsg, setLoaderMsg] = useState('');
  
  const [toast, setToast] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [lastOrder, setLastOrder] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const navigate = (view) => {
    setLoading(true);
    setLoaderMsg('Conectando a la Blockchain...');
    setTimeout(() => {
      setCurrentView(view);
      setLoading(false);
      window.scrollTo(0, 0);
    }, 500);
  };

  const connectWallet = (provider) => {
    setWalletModalOpen(false);
    setLoading(true);
    setLoaderMsg(`Conectando con ${provider}...`);
    setTimeout(() => {
      setLoading(false);
      setIsWalletConnected(true);
      showToast(`Wallet conectada exitosamente a través de ${provider}.`);
    }, 1000);
  };

  const disconnectWallet = () => {
    setDisconnectModalOpen(true);
  };

  const confirmDisconnect = () => {
    setIsWalletConnected(false);
    setDisconnectModalOpen(false);
    showToast("Wallet desconectada exitosamente.");
  };

  const goToCheckout = (product) => {
    if (!isWalletConnected) {
      showToast('Debes conectar tu Wallet primero.', 'error');
      return;
    }
    setCheckoutProduct(product);
    navigate('checkout');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {loading && (
        <div className="fixed inset-0 bg-dark/95 z-[9999] flex flex-col justify-center items-center">
          <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin"></div>
          <p className="mt-5 font-semibold text-primary">{loaderMsg}</p>
        </div>
      )}

      {toast && (
        <div className={`fixed top-5 right-5 z-[10000] p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right-8 duration-300 ${
          toast.type === 'success' ? 'bg-panel border-success text-white' : 'bg-panel border-red-500 text-white'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-inner ${
            toast.type === 'success' ? 'bg-success/20 text-success' : 'bg-red-500/20 text-red-500'
          }`}>
            {toast.type === 'success' ? '✓' : '⚠'}
          </div>
          <p className="font-semibold text-sm pr-4">{toast.message}</p>
          <button onClick={() => setToast(null)} className="ml-2 text-muted hover:text-white transition-colors">✕</button>
        </div>
      )}

      <nav className="flex justify-between items-center px-10 py-4 bg-dark border-b border-border sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 font-bold text-lg text-primary cursor-pointer" onClick={() => navigate('home')}>
            <span>🔶</span>
            <span>AgriChain</span>
          </div>
          <ul className="flex list-none gap-5 text-sm font-medium">
            <li><button onClick={() => navigate('market')} className="hover:text-primary transition-colors">Comprar Cosechas</button></li>
            <li><button onClick={() => navigate('farmer')} className="hover:text-primary transition-colors">Panel Productor</button></li>
            <li><button onClick={() => navigate('cart')} className="hover:text-primary transition-colors text-primary flex items-center gap-1">🛒 Mi Carrito</button></li>
            <li><button onClick={() => navigate('tracking')} className="hover:text-primary transition-colors">Mis Pedidos</button></li>
          </ul>
        </div>
        <div className="flex items-center gap-8">
          <span className="bg-panel px-3 py-1 rounded text-sm border border-border flex items-center gap-2">
            <span className="w-2 h-2 bg-success rounded-full inline-block"></span>
            Polygon
          </span>
          <button 
            onClick={!isWalletConnected ? () => setWalletModalOpen(true) : disconnectWallet}
            className={`font-semibold py-2 px-5 rounded transition-colors ${
              isWalletConnected 
                ? 'bg-border text-primary border border-primary hover:bg-red-900/30 hover:text-red-400 hover:border-red-500' 
                : 'bg-primary text-black hover:bg-primary-hover'
            }`}
            title={isWalletConnected ? 'Clic para desconectar' : ''}
          >
            {isWalletConnected ? '🦊 0x71C...9A23' : 'Conectar Wallet'}
          </button>
        </div>
      </nav>

      <main className="flex-grow">
        {currentView === 'home' && <HomeView navigate={navigate} />}
        {currentView === 'farmer' && <FarmerView isWalletConnected={isWalletConnected} showToast={showToast} />}
        {currentView === 'market' && <MarketView goToCheckout={goToCheckout} navigate={navigate} carrito={carrito} setCarrito={setCarrito} showToast={showToast} />}
        {currentView === 'checkout' && checkoutProduct && (
          <CheckoutView 
            product={checkoutProduct} 
            navigate={navigate} 
            setLoading={setLoading}
            setLoaderMsg={setLoaderMsg}
            showToast={showToast}
          />
        )}
        {currentView === 'cart' && <CartView navigate={navigate} carrito={carrito} setCarrito={setCarrito} setLastOrder={setLastOrder} />}
        {currentView === 'tracking' && <TrackingView lastOrder={lastOrder} navigate={navigate} />}
        {currentView === 'receipt' && <ReceiptView lastOrder={lastOrder} navigate={navigate} />}
      </main>

      {walletModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex justify-center items-center p-5 animate-in fade-in duration-200" onClick={() => setWalletModalOpen(false)}>
          <div className="bg-panel border border-border rounded-lg max-w-sm w-full p-6 relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-muted hover:text-white" onClick={() => setWalletModalOpen(false)}>✕</button>
            <h3 className="text-xl font-bold mb-2">Conectar Wallet</h3>
            <p className="text-sm text-muted mb-6">Selecciona el proveedor para conectarte a AgriChain.</p>
            
            <div className="flex flex-col gap-3">
              <button onClick={() => connectWallet('MetaMask')} className="flex items-center gap-4 bg-dark border border-border p-4 rounded hover:border-primary transition-colors text-left font-semibold group">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-xl shadow-lg">🦊</div>
                <span className="group-hover:text-primary transition-colors">MetaMask</span>
              </button>
              <button onClick={() => connectWallet('WalletConnect')} className="flex items-center gap-4 bg-dark border border-border p-4 rounded hover:border-primary transition-colors text-left font-semibold group">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xl shadow-lg">🔗</div>
                <span className="group-hover:text-primary transition-colors">WalletConnect</span>
              </button>
              <button onClick={() => connectWallet('Coinbase Wallet')} className="flex items-center gap-4 bg-dark border border-border p-4 rounded hover:border-primary transition-colors text-left font-semibold group">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xl shadow-lg">🔵</div>
                <span className="group-hover:text-primary transition-colors">Coinbase Wallet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {disconnectModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex justify-center items-center p-5 animate-in fade-in duration-200" onClick={() => setDisconnectModalOpen(false)}>
          <div className="bg-panel border border-border rounded-lg max-w-sm w-full p-6 relative shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-900/30 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-red-900/50">
              ⚠️
            </div>
            <h3 className="text-xl font-bold mb-2">¿Desconectar Wallet?</h3>
            <p className="text-sm text-muted mb-6">Si te desconectas, no podrás realizar compras ni firmar contratos hasta volver a conectarte.</p>
            
            <div className="flex gap-3">
              <button onClick={() => setDisconnectModalOpen(false)} className="flex-1 bg-dark border border-border text-white font-semibold py-3 rounded hover:bg-border transition-colors">
                Cancelar
              </button>
              <button onClick={confirmDisconnect} className="flex-1 bg-red-500 text-white font-semibold py-3 rounded hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">
                Sí, salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HomeView({ navigate }) {
  const [faqOpen, setFaqOpen] = useState(null);

  const toggleFaq = (id) => {
    setFaqOpen(faqOpen === id ? null : id);
  };

  return (
    <div className="animate-in fade-in duration-300">
      <header className="flex justify-between items-center py-20 px-[5%] max-w-7xl mx-auto gap-10">
        <div className="max-w-[50%]">
          <h1 className="text-5xl font-extrabold leading-[1.1] mb-5">USA AGRICHAIN<br/>PARA TODO</h1>
          <p className="text-lg text-main mb-8">Venta directa con Smart Contracts, pagos en USDT, trazabilidad blockchain y cero intermediarios en Cañete y Nuevo Imperial.</p>
          <div className="flex gap-10 mb-10 text-primary">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <div>
                <strong className="block text-lg">No. 1</strong>
                <p className="text-sm text-main">Contratos Seguros</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <div>
                <strong className="block text-lg">No. 1</strong>
                <p className="text-sm text-main">Agricultores Activos</p>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate('market')} className="bg-primary text-black font-semibold py-3 px-6 rounded hover:bg-primary-hover text-lg">Comienza a comprar hoy</button>
            <button onClick={() => navigate('farmer')} className="bg-transparent text-primary border border-primary font-semibold py-3 px-6 rounded hover:bg-primary/10 text-lg">Soy Productor</button>
          </div>
        </div>
        <div className="w-[45%]">
          <img src="/hero.png" alt="Agricultor" className="w-full rounded-lg shadow-2xl border border-border" />
        </div>
      </header>

      <section className="bg-[#0b0e11] py-20 px-[5%] border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between mb-10 gap-10">
            <div className="max-w-[45%]">
              <h2 className="text-4xl font-extrabold leading-[1.1] mb-4">TUS FONDOS Y LOTES<br/>ESTÁN <span className="text-primary">SEGUROS</span></h2>
              <p className="text-muted text-lg">El Smart Contract retiene los fondos (USDT) hasta que se confirma la recepción física del producto. Eliminamos el riesgo de estafas para el productor y el comprador.</p>
            </div>
            <div className="max-w-[50%]">
              <p className="text-muted text-sm mb-1">Fondos asegurados actualmente en Smart Contracts (Polygon)</p>
              <h3 className="text-primary text-4xl font-extrabold mb-1">2,500,000 USDT</h3>
              <p className="font-mono text-muted text-sm mb-5">Contrato Principal: 0x8f...4b2c</p>
              <div className="flex gap-12">
                <div>
                  <h4 className="text-primary text-2xl font-bold">1,250</h4>
                  <p className="text-muted">Productores activos</p>
                </div>
                <div>
                  <h4 className="text-primary text-2xl font-bold">15,400 Ton</h4>
                  <p className="text-muted">Cosechas transadas</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-5">
            {[
              { img: '/hero.png', title: 'Recorriendo los campos' },
              { img: '/uva.png', title: 'Cosecha de Uvas' },
              { img: '/palta.png', title: 'Empaque de Paltas' }
            ].map((video, i) => (
              <div key={i} className="relative rounded-lg overflow-hidden cursor-pointer aspect-video group border border-border">
                <img src={video.img} alt="Video thumbnail" className="w-full h-full object-cover opacity-60 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-black/70 text-white rounded-full flex items-center justify-center pl-1 group-hover:bg-primary group-hover:text-black transition-colors backdrop-blur-sm shadow-xl">
                  <Play fill="currentColor" size={24} />
                </div>
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="font-semibold text-white truncate drop-shadow-md">{video.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-[20%] bg-dark">
        <h2 className="text-3xl font-bold text-center mb-10">Preguntas Frecuentes</h2>
        <div className="flex flex-col gap-4">
          <div className="bg-dark border-b border-border cursor-pointer py-4" onClick={() => toggleFaq(1)}>
            <div className="flex items-center gap-4 text-lg font-semibold">
              <div className="bg-panel w-7 h-7 flex items-center justify-center rounded text-sm text-muted">1</div>
              <span>¿Por qué AgriChain es mejor que un mercado tradicional?</span>
              <ChevronDown className={`ml-auto text-muted transition-transform duration-300 ${faqOpen === 1 ? 'rotate-180' : ''}`} />
            </div>
            <div className={`overflow-hidden transition-all duration-300 text-muted pl-11 ${faqOpen === 1 ? 'max-h-40 pt-4 pb-2' : 'max-h-0'}`}>
              Eliminamos a los intermediarios. Usamos tecnología Blockchain para conectar directamente a productores con compradores, garantizando precios justos.
            </div>
          </div>
          <div className="bg-dark border-b border-border cursor-pointer py-4" onClick={() => toggleFaq(2)}>
            <div className="flex items-center gap-4 text-lg font-semibold">
              <div className="bg-panel w-7 h-7 flex items-center justify-center rounded text-sm text-muted">2</div>
              <span>¿Cómo funcionan los Smart Contracts en la agricultura?</span>
              <ChevronDown className={`ml-auto text-muted transition-transform duration-300 ${faqOpen === 2 ? 'rotate-180' : ''}`} />
            </div>
            <div className={`overflow-hidden transition-all duration-300 text-muted pl-11 ${faqOpen === 2 ? 'max-h-40 pt-4 pb-2' : 'max-h-0'}`}>
              El comprador deposita el dinero, pero queda bloqueado en el código. Solo se libera a la Wallet del agricultor cuando el producto llega a su destino.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FarmerView({ isWalletConnected, showToast }) {
  const [lotes, setLotes] = useState([
    { cultivo: 'Palta Hass', volumen: '500 KG', hash: '0x8f...4b2c', status: 'Pagado' },
    { cultivo: 'Uva Quebranta', volumen: '1200 KG', hash: '0x3a...9c1f', status: 'Fondos Bloqueados' },
    { cultivo: 'Manzana Delicia', volumen: '300 KG', hash: '0x7c...2e8d', status: 'Pagado' },
    { cultivo: 'Limón Sutil', volumen: '800 KG', hash: '0x1b...5a91', status: 'Fondos Bloqueados' }
  ]);
  const [form, setForm] = useState({ cultivo: '', cantidad: '', precio: '', gps: '' });

  const registrarLote = (e) => {
    e.preventDefault();
    if (!isWalletConnected) {
      showToast("Conecta tu Wallet arriba a la derecha antes de sellar un lote.", 'error'); 
      return;
    }
    const fakeHash = "0x" + Math.random().toString(16).substr(2, 8);
    setLotes([{ cultivo: form.cultivo, volumen: `${form.cantidad} KG`, hash: fakeHash, status: 'Fondos Bloqueados' }, ...lotes]);
    setForm({ cultivo: '', cantidad: '', precio: '', gps: '' });
    showToast(`Lote de ${form.cultivo} tokenizado en la red Polygon.`);
  };

  const subirCertificado = () => {
    console.log('Abriendo selector de archivos y subiendo certificado a IPFS...');
    showToast('Función de subida a IPFS activada');
  };

  return (
    <div className="max-w-7xl mx-auto px-5 py-10 mt-10 animate-in fade-in duration-300">
      <h2 className="text-3xl font-bold mb-8 text-primary">Panel del Productor 👨‍🌾</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORMULARIO: Registrar Nuevo Lote */}
        <div className="bg-panel rounded-lg p-6 border border-border lg:col-span-1 shadow-lg">
          <h3 className="text-xl font-semibold mb-6">Registrar Nuevo Lote</h3>
          <form onSubmit={registrarLote} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-muted mb-1">Tipo de cultivo</label>
              <input type="text" placeholder="Ej: Uva Italia" required className="w-full p-3 bg-dark border border-border text-white rounded focus:outline-none focus:border-primary transition-colors" value={form.cultivo} onChange={e => setForm({...form, cultivo: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted mb-1">Cantidad (KG)</label>
                <input type="number" placeholder="Ej: 1000" required className="w-full p-3 bg-dark border border-border text-white rounded focus:outline-none focus:border-primary transition-colors" value={form.cantidad} onChange={e => setForm({...form, cantidad: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Precio (USDT)</label>
                <input type="number" step="0.01" placeholder="Ej: 150" required className="w-full p-3 bg-dark border border-border text-white rounded focus:outline-none focus:border-primary transition-colors" value={form.precio} onChange={e => setForm({...form, precio: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Coordenadas GPS</label>
              <input type="text" placeholder="Ej: -12.0463, -77.0427" required className="w-full p-3 bg-dark border border-border text-white rounded focus:outline-none focus:border-primary transition-colors" value={form.gps} onChange={e => setForm({...form, gps: e.target.value})} />
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <button type="submit" className="w-full bg-primary text-black font-bold py-3 rounded hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20">
                Sellar en Blockchain
              </button>
              
              <button type="button" onClick={subirCertificado} className="w-full flex items-center justify-center gap-2 bg-dark text-muted border border-border font-medium py-3 rounded hover:text-white hover:border-gray-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Subir Certificado Fitosanitario
              </button>
            </div>
          </form>
        </div>

        {/* HISTORIAL Y ESCROW */}
        <div className="bg-panel rounded-lg p-6 border border-border lg:col-span-2 shadow-lg">
          <h3 className="text-xl font-semibold mb-6">Historial de Smart Contracts</h3>
          <div className="overflow-x-auto mb-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-3 border-b border-border font-semibold text-muted">Cultivo</th>
                  <th className="p-3 border-b border-border font-semibold text-muted">Volumen</th>
                  <th className="p-3 border-b border-border font-semibold text-muted">Estado</th>
                  <th className="p-3 border-b border-border font-semibold text-muted text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lotes.map((lote, i) => (
                  <tr key={i} className="hover:bg-dark/50 transition-colors">
                    <td className="p-3 border-b border-border text-main">{lote.cultivo}</td>
                    <td className="p-3 border-b border-border">{lote.volumen}</td>
                    <td className="p-3 border-b border-border">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${lote.status === 'Pagado' ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'}`}>
                        {lote.status}
                      </span>
                    </td>
                    <td className="p-3 border-b border-border text-right">
                      <a href={`https://mumbai.polygonscan.com/tx/${lote.hash}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:text-primary-hover font-medium text-sm transition-colors bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded">
                        Explorer
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ESCROW TRACKER */}
          <div className="pt-6 border-t border-border">
            <h3 className="text-lg font-bold text-main mb-8">Estado Actual: Escrow Tracker</h3>
            <div className="relative flex justify-between items-center w-full mx-auto pb-4 px-2">
              <div className="absolute top-5 left-0 w-full h-1 bg-dark border border-border rounded-full z-0"></div>
              <div className="absolute top-5 left-0 w-[33%] h-1 bg-primary rounded-full z-0 transition-all shadow-[0_0_8px_rgba(252,211,77,0.5)]"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center font-bold shadow-lg ring-4 ring-panel">
                  <ShieldCheck size={20} />
                </div>
                <span className="mt-3 text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wide">Bloqueados</span>
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center font-bold shadow-lg ring-4 ring-panel">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" /></svg>
                </div>
                <span className="mt-3 text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wide text-center">En Camino</span>
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-dark text-muted flex items-center justify-center font-bold ring-4 ring-panel shadow-sm border border-border">
                  3
                </div>
                <span className="mt-3 text-[10px] sm:text-xs font-semibold text-muted uppercase tracking-wide text-center">Confirmada</span>
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-dark text-muted flex items-center justify-center font-bold ring-4 ring-panel shadow-sm border border-border">
                  4
                </div>
                <span className="mt-3 text-[10px] sm:text-xs font-semibold text-muted uppercase tracking-wide text-center">Liberados</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketView({ goToCheckout, navigate, carrito, setCarrito }) {
  const [filter, setFilter] = useState('all');
  const [auditModal, setAuditModal] = useState(null);
  const [addedToCartModal, setAddedToCartModal] = useState(false);

  const handleAddToCart = (product) => {
    const existing = carrito.find(item => item.id === product.name);
    if (existing) {
      setCarrito(carrito.map(item => item.id === product.name ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCarrito([...carrito, { 
        id: product.name, 
        nombre: product.name, 
        precio: product.price, 
        criptomoneda: 'USDT', 
        cantidad: 1, 
        imagen: '🛒' 
      }]);
    }
    setAddedToCartModal(true);
  };

  const products = [
    { name: 'Uva Quebranta', fundo: 'Fundo San Vicente', location: 'Valle de Cañete', harvestDate: 'Hace 2 días', rating: '4.9', lot: 500, price: 150.00, category: 'frutas', img: '/uva.png' },
    { name: 'Palta Hass', fundo: 'Asoc. Nuevo Imperial', location: 'Nuevo Imperial', harvestDate: 'Hoy', rating: '5.0', lot: 1000, price: 850.00, category: 'export', img: '/palta.png' },
    { name: 'Manzana Delicia', fundo: 'Fundo El Rosal', location: 'San Vicente', harvestDate: 'Hace 5 días', rating: '4.7', lot: 300, price: 120.00, category: 'frutas', img: '/manzana.png' },
    { name: 'Limón Sutil', fundo: 'Hacienda San José', location: 'Tambos de Chincha', harvestDate: 'Hace 1 día', rating: '4.8', lot: 800, price: 240.00, category: 'frutas', img: '/limon.png' },
    { name: 'Mango Edward', fundo: 'Agro Piura', location: 'Valle de San Lorenzo', harvestDate: 'Hoy', rating: '4.9', lot: 1500, price: 1125.00, category: 'export', img: '/mango.png' },
    { name: 'Arándano Biloxi', fundo: 'Fundo Azul', location: 'Ica', harvestDate: 'Hace 3 días', rating: '5.0', lot: 250, price: 500.00, category: 'export', img: '/arandano.png' },
    { name: 'Mandarina Murcott', fundo: 'Cítricos del Sur', location: 'Pisco', harvestDate: 'Hace 4 días', rating: '4.6', lot: 950, price: 380.00, category: 'frutas', img: '/mandarina.png' },
    { name: 'Espárrago Verde', fundo: 'Fundo Esperanza', location: 'Villuri', harvestDate: 'Hoy', rating: '4.8', lot: 400, price: 600.00, category: 'export', img: '/esparrago.png' },
    { name: 'Cebolla Roja', fundo: 'Agro Arequipa', location: 'Majes', harvestDate: 'Hace 6 días', rating: '4.5', lot: 2000, price: 500.00, category: 'frutas', img: '/cebolla.png' },
    { name: 'Paprika', fundo: 'Valles Secos', location: 'Nazca', harvestDate: 'Hace 2 días', rating: '4.7', lot: 600, price: 900.00, category: 'export', img: '/paprika.png' },
    { name: 'Quinua Blanca', fundo: 'Cooperativa Andina', location: 'Ayacucho', harvestDate: 'Hace 1 semana', rating: '5.0', lot: 1000, price: 2000.00, category: 'export', img: '/quinua.png' },
    { name: 'Cacao Orgánico', fundo: 'Amazonas Bio', location: 'San Martín', harvestDate: 'Hace 10 días', rating: '4.9', lot: 500, price: 1500.00, category: 'export', img: '/cacao.png' },
    { name: 'Uva Red Globe', fundo: 'Viñedos Ica', location: 'Villakuri', harvestDate: 'Ayer', rating: '4.8', lot: 1200, price: 600.00, category: 'export', img: '/uva.png' }
  ];

  const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);

  return (
    <div className="max-w-7xl mx-auto px-5 py-10 mt-10 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Mercado Spot 🛒</h2>
        <div className="flex gap-5">
          <button onClick={() => setFilter('all')} className={`font-semibold pb-2 border-b-2 transition-colors ${filter === 'all' ? 'text-main border-primary' : 'text-muted border-transparent hover:text-main'}`}>Todos</button>
          <button onClick={() => setFilter('frutas')} className={`font-semibold pb-2 border-b-2 transition-colors ${filter === 'frutas' ? 'text-main border-primary' : 'text-muted border-transparent hover:text-main'}`}>Frutas locales</button>
          <button onClick={() => setFilter('export')} className={`font-semibold pb-2 border-b-2 transition-colors ${filter === 'export' ? 'text-main border-primary' : 'text-muted border-transparent hover:text-main'}`}>Exportación</button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((p, i) => (
          <div key={i} className="bg-panel border border-border rounded-lg p-5 flex flex-col group hover:border-primary/50 transition-colors">
            <div className="w-full h-48 rounded overflow-hidden mb-4">
              <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="bg-success-bg text-success border border-success px-2 py-1 rounded text-xs font-bold w-fit flex items-center gap-1 mb-3">
              <ShieldCheck size={14} /> Origen Verificado en Blockchain
            </div>
            <h3 className="text-xl font-bold mb-1">{p.name}</h3>
            <p className="text-muted text-sm mb-2">{p.fundo}</p>
            <div className="flex gap-2 text-xs text-muted mb-4">
              <span className="bg-dark px-2 py-1 rounded border border-border">📅 Cosecha: {p.harvestDate}</span>
              <span className="bg-dark px-2 py-1 rounded border border-border flex items-center gap-1">⭐ {p.rating} / 5.0</span>
            </div>
            <div className="flex justify-between items-center bg-dark p-4 rounded mb-5 border border-border">
              <span className="text-sm font-medium">Lote: <strong className="text-white">{p.lot} KG</strong></span>
              <span className="text-xl font-bold text-main">{p.price.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between items-center mt-auto">
              <button onClick={() => setAuditModal(p)} className="text-muted text-sm underline hover:text-main transition-colors">Auditar Contrato</button>
              <button onClick={() => handleAddToCart(p)} className="bg-primary text-black font-semibold py-2 px-6 rounded hover:bg-primary-hover transition-colors shadow-lg shadow-primary/10">Añadir al carro</button>
            </div>
          </div>
        ))}
      </div>

      {auditModal && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex justify-center items-center p-5 animate-in fade-in duration-200" onClick={() => setAuditModal(null)}>
          <div className="bg-panel border border-border rounded-lg max-w-md w-full p-6 relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-muted hover:text-white" onClick={() => setAuditModal(null)}>✕</button>
            <div className="flex items-center gap-2 mb-4 text-primary">
              <ShieldCheck size={24} />
              <h3 className="text-xl font-bold">Auditoría en Blockchain</h3>
            </div>
            <p className="text-sm text-muted mb-6">Los datos a continuación son inmutables y están verificados en la red Polygon.</p>
            
            <div className="space-y-4">
              <div className="bg-dark p-4 rounded border border-border">
                <p className="text-xs text-muted mb-1">Producto / Origen</p>
                <p className="font-semibold text-main">{auditModal.name}</p>
              </div>
              <div className="bg-dark p-4 rounded border border-border">
                <p className="text-xs text-muted mb-1">Entidad Productora</p>
                <p className="font-semibold text-main">{auditModal.fundo}</p>
                <p className="text-sm text-primary flex items-center gap-1 mt-1">⭐ {auditModal.rating} Estrellas (Verificado)</p>
              </div>
              <div className="bg-dark p-4 rounded border border-border">
                <p className="text-xs text-muted mb-1">Estado de Certificación</p>
                <p className="font-semibold text-success flex items-center gap-1"><ShieldCheck size={16} /> Certificado Orgánico Limpio</p>
                <p className="text-xs font-mono text-muted mt-2 break-all">Hash: 0x{Math.random().toString(16).substr(2, 40)}</p>
              </div>
            </div>
            
            <button className="w-full bg-border text-white font-semibold py-3 rounded mt-6 hover:bg-dark transition-colors" onClick={() => setAuditModal(null)}>
              Cerrar Auditoría
            </button>
          </div>
        </div>
      )}

      {addedToCartModal && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex justify-center items-center p-5 animate-in fade-in duration-200" onClick={() => setAddedToCartModal(false)}>
          <div className="bg-panel border border-border rounded-lg max-w-md w-full p-6 relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-success/20 text-success rounded-full flex items-center justify-center text-xl border border-success/30">✓</div>
              <h3 className="text-2xl font-bold text-white">Lista de mi Pedido</h3>
            </div>
            
            <div className="max-h-60 overflow-y-auto mb-6 pr-2 space-y-3">
              {carrito.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-dark p-3 rounded border border-border">
                  <div>
                    <p className="font-semibold text-white">{item.nombre}</p>
                    <p className="text-xs text-muted">Cant: {item.cantidad}</p>
                  </div>
                  <p className="font-bold text-primary">{(item.precio * item.cantidad).toFixed(2)} USDT</p>
                </div>
              ))}
            </div>
            
            <div className="border-t border-border pt-4 mb-6 flex justify-between items-center">
              <span className="text-muted font-semibold">Subtotal:</span>
              <span className="text-xl font-bold text-white">{carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0).toFixed(2)} USDT</span>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setAddedToCartModal(false)} className="flex-1 bg-dark border border-border text-white font-semibold py-3 rounded hover:bg-border transition-colors">
                Seguir comprando
              </button>
              <button onClick={() => { setAddedToCartModal(false); navigate('cart'); }} className="flex-1 bg-primary text-black font-semibold py-3 rounded hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20">
                Finalizar compra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckoutView({ product, navigate, setLoading, setLoaderMsg, showToast }) {
  const [moneda, setMoneda] = useState('USDT');
  const [loadingModal, setLoadingModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  const hash = "0x" + Math.random().toString(16).substr(2, 10);
  const gasFee = 0.05;
  const total = (product.price + gasFee).toFixed(2);

  const opcionesPago = [
    { id: 'USDT', nombre: 'USDT', logo: 'https://cryptologos.cc/logos/tether-usdt-logo.svg' },
    { id: 'USDC', nombre: 'USDC', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg' },
    { id: 'MATIC', nombre: 'MATIC', logo: 'https://cryptologos.cc/logos/polygon-matic-logo.svg' },
    { id: 'ETH', nombre: 'Ethereum', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg' }
  ];

  const signTransaction = () => {
    setLoadingModal(true);
    setTimeout(() => {
      setLoadingModal(false);
      setSuccessModal(true);
    }, 2000);
  };

  const descargarPDF = () => {
    window.print();
  };

  const compartirVoucher = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Voucher de Pago AgriChain',
        text: `He pagado ${total} ${moneda} al productor ${product.fundo} vía Smart Contract.`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      showToast('Tu navegador no soporta la API nativa para compartir.', 'error');
    }
  };

  const guardarQR = () => {
    showToast('Generando y guardando el código QR de trazabilidad...');
  };

  const closeSuccess = () => {
    setSuccessModal(false);
    navigate('home');
  };

  const logoSeleccionado = opcionesPago.find(m => m.id === moneda)?.logo;

  return (
    <div className="max-w-2xl mx-auto px-5 py-10 mt-10 animate-in fade-in duration-300">
      <button onClick={() => navigate('market')} className="flex items-center gap-1 text-muted hover:text-main transition-colors mb-6 text-sm">
        <ChevronLeft size={16} /> Volver al Mercado
      </button>
      
      <div className="bg-panel border border-border rounded-lg p-8 shadow-2xl">
        <h2 className="text-3xl font-bold mb-6 text-center">Resumen de Pago ⚖️</h2>
        
        <div className="bg-dark border border-border p-5 rounded-lg mb-8 space-y-2">
          <div className="flex justify-between">
            <span className="text-muted">Productor:</span>
            <span className="font-semibold">{product.fundo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Producto a Tokenizar:</span>
            <span className="font-semibold text-primary">{product.name} ({product.lot} KG)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Contrato Destino:</span>
            <span className="font-mono text-muted">{hash}</span>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-bold text-muted mb-3 uppercase tracking-wide">Pagar con:</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
              {logoSeleccionado && <img src={logoSeleccionado} className="w-6 h-6 drop-shadow-sm" alt="logo" />}
            </div>
            <select 
              value={moneda} 
              onChange={(e) => setMoneda(e.target.value)} 
              className="w-full appearance-none bg-dark border border-border text-white font-bold text-base rounded focus:outline-none focus:ring-0 focus:border-primary block py-4 pl-12 pr-10 shadow-sm cursor-pointer"
            >
              {opcionesPago.map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted">
              <ChevronDown size={20} />
            </div>
          </div>
        </div>

        <div className="bg-primary/10 border-l-4 border-primary p-5 rounded-lg mb-8 flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Total a Bloquear</span>
          <span className="text-4xl font-black text-primary">{total} <span className="text-xl font-bold">{moneda}</span></span>
        </div>
        
        <button onClick={signTransaction} className="w-full bg-primary text-black text-lg font-bold py-4 rounded hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20">
          Firmar Transacción Definitiva
        </button>
      </div>

      {/* MODAL 1: Cargando */}
      {loadingModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="bg-panel border border-border p-8 rounded-xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4">
            <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin mb-6"></div>
            <p className="text-xl font-bold text-white text-center">Esperando confirmación...</p>
            <p className="text-sm text-primary mt-2 text-center">Interactuando con la red Polygon.</p>
          </div>
        </div>
      )}

      {/* MODAL 2: Éxito (Voucher Digital) */}
      {successModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-panel border border-border rounded-[2rem] shadow-2xl flex flex-col items-center max-w-md w-full relative overflow-hidden animate-in zoom-in duration-300 my-8">
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-primary to-yellow-600"></div>
            
            <div className="p-8 w-full flex flex-col items-center print:p-0">
              <div className="success-checkmark mb-6">
                <div className="check-icon">
                  <span className="icon-line line-tip"></span>
                  <span className="icon-line line-long"></span>
                  <div className="icon-circle"></div>
                  <div className="icon-fix bg-panel"></div>
                </div>
              </div>

              <h3 className="text-2xl font-black text-white mb-1 uppercase tracking-wider text-center">¡Transferencia Exitosa!</h3>
              <p className="text-muted text-sm mb-6">{new Date().toLocaleString()}</p>

              <div className="bg-dark w-full py-6 rounded-2xl mb-6 text-center border border-border border-dashed">
                <span className="text-sm font-semibold text-muted uppercase tracking-wide">Monto Bloqueado en Escrow</span>
                <div className="text-5xl font-black text-white mt-2">
                  {total} <span className="text-2xl text-primary">{moneda}</span>
                </div>
              </div>

              <div className="w-full text-left space-y-3 mb-8">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-muted text-sm">Destinatario:</span>
                  <span className="font-bold text-white">{product.fundo}</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-muted text-sm">Tx Hash:</span>
                  <span className="font-mono text-primary font-bold text-xs bg-primary/10 px-2 py-1 rounded truncate max-w-[150px]">{hash}</span>
                </div>
              </div>

              <div className="w-full space-y-3 print:hidden">
                <button onClick={descargarPDF} className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-primary-hover text-black font-bold py-3.5 px-4 rounded-xl transition-colors shadow-md">
                  Descargar Voucher (PDF)
                </button>
                
                <div className="flex gap-3">
                  <button onClick={compartirVoucher} className="flex-1 flex justify-center items-center gap-2 bg-dark hover:bg-border text-white border border-border font-bold py-3.5 rounded-xl transition-colors">
                    Compartir
                  </button>
                  <button onClick={guardarQR} className="flex-1 flex justify-center items-center gap-2 bg-dark hover:bg-border text-white border border-border font-bold py-3.5 rounded-xl transition-colors">
                    Código QR
                  </button>
                </div>
              </div>

              <div className="flex flex-col w-full mt-6 gap-2 print:hidden">
                <button onClick={() => { setSuccessModal(false); navigate('tracking'); }} className="text-sm font-bold text-primary hover:text-white underline transition-colors">
                  Ver Seguimiento del Pedido
                </button>
                <button onClick={closeSuccess} className="text-sm text-muted hover:text-white underline transition-colors">
                  Volver al Mercado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CartView({ navigate, carrito, setCarrito, setLastOrder }) {
  const [monedaSeleccionada, setMonedaSeleccionada] = useState('USDT');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const opcionesCripto = [
    { name: 'Tether', symbol: 'USDT', icon: 'https://cryptologos.cc/logos/tether-usdt-logo.svg?v=025' },
    { name: 'USD Coin', symbol: 'USDC', icon: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=025' },
    { name: 'Polygon', symbol: 'MATIC', icon: 'https://cryptologos.cc/logos/polygon-matic-logo.svg?v=025' },
    { name: 'Ethereum', symbol: 'ETH', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=025' },
    { name: 'Wrapped Bitcoin', symbol: 'WBTC', icon: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.svg?v=025' },
    { name: 'BNB', symbol: 'BNB', icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=025' },
    { name: 'Solana', symbol: 'SOL', icon: 'https://cryptologos.cc/logos/solana-sol-logo.svg?v=025' },
    { name: 'Avalanche', symbol: 'AVAX', icon: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg?v=025' },
    { name: 'Chainlink', symbol: 'LINK', icon: 'https://cryptologos.cc/logos/chainlink-link-logo.svg?v=025' },
    { name: 'Polkadot', symbol: 'DOT', icon: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.svg?v=025' }
  ];

  const criptoSeleccionada = opcionesCripto.find(c => c.symbol === monedaSeleccionada) || opcionesCripto[0];

  const handleCheckout = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setLastOrder({
        items: [...carrito],
        total: carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0),
        moneda: monedaSeleccionada,
        icon: criptoSeleccionada.icon,
        fecha: new Date().toLocaleString(),
        gasFee: 0.50
      });
      setCarrito([]);
      navigate('receipt');
    }, 2000);
  };

  const aumentarCantidad = (id) => {
    setCarrito(carrito.map(item => item.id === id ? { ...item, cantidad: item.cantidad + 1 } : item));
  };

  const reducirCantidad = (id) => {
    setCarrito(carrito.map(item => item.id === id && item.cantidad > 1 ? { ...item, cantidad: item.cantidad - 1 } : item));
  };

  const eliminarProducto = (id) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const totalPagar = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-panel rounded-3xl shadow-xl border border-border mt-10 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          Tu Carrito Web3 <ShoppingCart className="w-6 h-6 text-primary" />
        </h2>
        <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full">{carrito.length} Items</span>
      </div>

      {carrito.length === 0 && (
        <div className="text-center py-10 text-muted">
          <p>Tu carrito está vacío.</p>
          <button onClick={() => navigate('market')} className="mt-4 text-primary underline">Volver al Mercado</button>
        </div>
      )}

      <div className="space-y-4 mb-8">
        {carrito.map(item => (
          <div key={item.id} className="flex items-center justify-between p-4 bg-dark rounded-2xl border border-border transition-all hover:border-primary/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-panel rounded-xl shadow-sm border border-border flex items-center justify-center text-3xl">
                {item.imagen}
              </div>
              <div>
                <h4 className="font-bold text-white text-lg">{item.nombre}</h4>
                <p className="text-primary font-bold text-sm">{item.precio.toFixed(2)} {item.criptomoneda} / kg</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center bg-panel border border-border rounded-lg shadow-sm overflow-hidden">
                <button onClick={() => reducirCantidad(item.id)} className="px-3 py-2 text-white hover:bg-border font-black transition-colors">-</button>
                <span className="px-4 py-2 font-bold text-white border-x border-border min-w-[3rem] text-center">{item.cantidad}</span>
                <button onClick={() => aumentarCantidad(item.id)} className="px-3 py-2 text-white hover:bg-border font-black transition-colors">+</button>
              </div>

              <button onClick={() => eliminarProducto(item.id)} className="text-red-400 hover:text-red-500 bg-red-900/20 hover:bg-red-900/40 p-2 rounded-lg transition-colors border border-red-900/50">
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-6">
        
        {/* Selector de Criptomonedas (Dark Mode Web3) */}
        <div className="mb-6 p-5 rounded-xl bg-dark border border-border shadow-lg">
          <label className="block text-sm font-medium text-muted mb-3">Pagar con:</label>
          
          <div className="relative">
            <button 
              type="button" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between bg-panel border border-border rounded-lg p-3 text-white hover:bg-[#2b3139] focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            >
              <div className="flex items-center space-x-3">
                <img src={criptoSeleccionada.icon} alt="Logo" className="w-6 h-6 rounded-full shadow-sm bg-white" />
                <span className="font-semibold">{criptoSeleccionada.name}</span>
                <span className="text-muted text-sm">({criptoSeleccionada.symbol})</span>
              </div>
              <ChevronDown className={`w-5 h-5 text-muted transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-50 mt-2 w-full bg-panel border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                <ul className="py-1 m-0">
                  {opcionesCripto.map(cripto => (
                    <li 
                      key={cripto.symbol}
                      onClick={() => { setMonedaSeleccionada(cripto.symbol); setIsDropdownOpen(false); }}
                      className={`flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-dark transition-colors ${cripto.symbol === monedaSeleccionada ? 'bg-dark' : ''}`}
                    >
                      <img src={cripto.icon} alt={cripto.name} className="w-6 h-6 rounded-full bg-white" />
                      <span className="text-white font-medium">{cripto.name}</span>
                      <span className="text-muted text-sm ml-auto">{cripto.symbol}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-muted text-sm font-bold uppercase tracking-wider mb-1">Total a Pagar</span>
          <div className="text-4xl font-black text-white mb-6">
            {totalPagar.toFixed(2)} <span className="text-xl text-primary">{monedaSeleccionada}</span>
          </div>
          <button 
            disabled={carrito.length === 0 || isProcessing} 
            onClick={handleCheckout}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <div className="w-6 h-6 border-4 border-black/30 border-t-black rounded-full animate-spin"></div>
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
            <span>{isProcessing ? 'Procesando Pago Seguro...' : 'Proceder al Pago Seguro'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function TrackingView({ lastOrder, navigate }) {
  const productor = {
    finca: 'Fundo San Vicente',
    dueño: 'Carlos Mendoza',
    reputacion: 4.9
  };

  const pasoActual = 3;

  const order = lastOrder || {
    items: [
      { id: '1', nombre: 'Palta Hass (Lote de Ejemplo)', precio: 850, cantidad: 1 }
    ],
    total: 850,
    moneda: 'USDT',
    fecha: new Date().toLocaleString(),
    gasFee: 0.50
  };

  const pasos = [
    { id: 1, titulo: 'Contrato Sellado', descripcion: 'Bloqueado en Escrow', icon: '📝' },
    { id: 2, titulo: 'Preparando Cosecha', descripcion: 'Empacando', icon: '📦' },
    { id: 3, titulo: 'En Tránsito', descripcion: 'Saliendo de hacienda', icon: '🚚' },
    { id: 4, titulo: 'Entregado', descripcion: 'Fondos liberados', icon: '✅' }
  ];

  const historial = [
    { id: 'ORD-092', fecha: '05 Ago 2026', total: 450, cripto: 'USDC', estado: 'Entregado', item: 'Mango Edward Premium', emoji: '🥭' },
    { id: 'ORD-041', fecha: '28 Jul 2026', total: 1200, cripto: 'USDT', estado: 'Entregado', item: 'Cacao Orgánico (Lote 2)', emoji: '🍫' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10 space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black text-white">Seguimiento de mi Pedido 📦</h2>
        {lastOrder && (
          <button onClick={() => navigate('receipt')} className="flex items-center gap-2 bg-dark border border-border px-4 py-2 rounded-lg hover:bg-border transition-colors text-sm font-bold text-white shadow-sm">
            <FileText size={16} /> Ver Boleta
          </button>
        )}
      </div>

      {/* PEDIDO ACTUAL: PRODUCTOR + TRACKING HORIZONTAL */}
      <div className="bg-panel rounded-3xl shadow-xl border border-border overflow-hidden">
        
        {/* Header / Producer Info */}
        <div className="p-6 md:p-8 border-b border-border bg-dark/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center border-4 border-primary/30 text-3xl shadow-inner">
              🧑‍🌾
            </div>
            <div>
              <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-1.5">Comprado a:</h3>
              <h4 className="text-xl font-bold text-white leading-tight mb-1">{productor.finca}</h4>
              <p className="text-sm text-muted font-medium flex items-center gap-2">
                {productor.dueño} <span className="text-border">•</span> <span className="text-white bg-dark px-2 py-0.5 rounded border border-border shadow-sm">⭐ {productor.reputacion}/5</span>
              </p>
            </div>
          </div>
          <div>
            <span className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold border border-primary/20 flex items-center gap-2 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(252,213,53,0.8)]"></span>
              En Progreso
            </span>
          </div>
        </div>

        {/* Tracking Horizontal */}
        <div className="p-6 md:p-10">
          <h3 className="text-lg font-bold text-white mb-10">Estado del Envío (Live Tracking)</h3>
          
          <div className="relative">
            {/* Linea conectora horizontal */}
            <div className="absolute top-6 left-[10%] right-[10%] h-1 bg-dark rounded-full border border-border"></div>
            
            {/* Barra de progreso activa */}
            <div 
              className="absolute top-6 left-[10%] h-1 bg-primary rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(252,213,53,0.5)]"
              style={{ width: `${((pasoActual - 1) / (pasos.length - 1)) * 80}%` }}
            ></div>
            
            <div className="flex justify-between relative z-10">
              {pasos.map((paso) => (
                <div key={paso.id} className="flex flex-col items-center text-center w-1/4">
                  
                  <div className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full border-4 flex items-center justify-center transition-all duration-500 text-xl md:text-2xl z-10 mb-4 ${
                    pasoActual >= paso.id 
                      ? 'bg-panel border-primary shadow-[0_0_15px_rgba(252,213,53,0.3)] text-white scale-110' 
                      : 'bg-dark border-border text-muted grayscale'
                  }`}>
                    {paso.icon}
                  </div>

                  <div className="flex flex-col px-1">
                    <h4 className={`text-xs md:text-sm font-bold transition-colors ${pasoActual >= paso.id ? 'text-white' : 'text-muted'}`}>{paso.titulo}</h4>
                    <p className={`text-[10px] md:text-xs mt-1 font-medium transition-colors ${pasoActual >= paso.id ? 'text-primary' : 'text-gray-600'}`}>{paso.descripcion}</p>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* HISTORIAL DE PEDIDOS */}
      <div className="pt-8">
        <h3 className="text-2xl font-black text-white mb-6">Historial de Compras Pasadas 📜</h3>
        <div className="space-y-4">
          {historial.map((pedido) => (
            <div key={pedido.id} className="bg-panel rounded-2xl p-5 border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group">
               <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-dark rounded-2xl flex items-center justify-center text-3xl border border-border group-hover:scale-105 transition-transform shadow-sm">
                    {pedido.emoji}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg mb-1">{pedido.item}</h4>
                    <p className="text-sm text-muted font-medium flex items-center gap-2">
                      <span className="text-white/60">{pedido.id}</span> 
                      <span className="text-border">•</span> 
                      {pedido.fecha}
                    </p>
                  </div>
               </div>
               <div className="text-left sm:text-right w-full sm:w-auto flex sm:block justify-between items-center border-t sm:border-0 border-border pt-3 sm:pt-0 mt-2 sm:mt-0">
                  <div className="text-white font-black text-lg">{pedido.total} <span className="text-primary text-sm font-bold">{pedido.cripto}</span></div>
                  <div className="text-success text-xs font-bold sm:mt-1.5 bg-success/10 px-2.5 py-1 rounded-md border border-success/20 inline-block">
                    ✓ {pedido.estado}
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function ReceiptView({ lastOrder, navigate }) {
  const order = lastOrder || {
    items: [
      { id: '1', nombre: 'Palta Hass (Lote de Ejemplo)', precio: 850, cantidad: 1 }
    ],
    total: 850,
    moneda: 'USDT',
    icon: 'https://cryptologos.cc/logos/tether-usdt-logo.svg?v=025',
    fecha: new Date().toLocaleString(),
    gasFee: 0.50
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10">
      <div className="bg-[#181a20] rounded-3xl p-8 shadow-2xl border border-border relative overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success to-primary"></div>
        
        <h3 className="text-xl font-bold text-white mb-8 text-center tracking-wide">Detalle de mi Compra</h3>

        <div className="flex flex-col items-center mb-10 animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4 border border-success/20">
            <span className="text-success text-3xl">✓</span>
          </div>
          <h4 className="text-5xl font-black text-white mb-3 tracking-tight flex items-center gap-3">
            + {order.total.toFixed(2)} 
            <span className="flex items-center gap-1.5 text-2xl text-primary bg-dark px-3 py-1 rounded-xl border border-border">
              {order.icon && <img src={order.icon} alt={order.moneda} className="w-6 h-6 bg-white rounded-full" />}
              {order.moneda}
            </span>
          </h4>
          <p className="text-muted text-sm font-medium bg-dark px-4 py-1.5 rounded-full border border-border">Pago Confirmado en Smart Contract</p>
        </div>

        <div className="space-y-4 text-sm font-medium border-t border-border pt-6 mb-6 animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <div className="flex justify-between items-center">
            <span className="text-muted">Estado</span>
            <span className="text-success font-bold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Completado
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted">Tipo</span>
            <span className="text-white">Compra Directa de Cosecha</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted">Fecha</span>
            <span className="text-white">{order.fecha}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted">Red Blockchain</span>
            <span className="text-white flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div> Polygon Network
            </span>
          </div>
        </div>

        <div className="border-t border-border pt-6 mb-6 space-y-3 animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          <h5 className="text-muted text-xs font-bold uppercase tracking-widest mb-4">Artículos Pagados</h5>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm">
              <span className="text-white flex items-center gap-2">
                <span className="bg-dark text-muted px-2 py-0.5 rounded text-xs border border-border">{item.cantidad}x</span> 
                {item.nombre}
              </span>
              <span className="text-white font-semibold">{(item.precio * item.cantidad).toFixed(2)} {order.moneda}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-6 space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted">Subtotal</span>
            <span className="text-white font-bold">{order.total.toFixed(2)} {order.moneda}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted">Comisión de Red (Gas)</span>
            <span className="text-white font-bold">{order.gasFee.toFixed(2)} {order.moneda}</span>
          </div>
          <div className="flex justify-between items-center text-lg mt-6 bg-dark p-5 rounded-2xl border border-border shadow-inner">
            <span className="text-white font-bold">Total Pagado</span>
            <span className="text-primary font-black text-2xl">{(order.total + order.gasFee).toFixed(2)} {order.moneda}</span>
          </div>
        </div>
      </div>

      {/* BOTONES DE ACCION */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-in slide-in-from-bottom-4 fade-in duration-500 print:hidden" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
        <button onClick={() => window.print()} className="flex-1 bg-dark hover:bg-border text-white border border-border font-bold py-4 rounded-2xl transition-colors flex justify-center items-center gap-2 shadow-lg">
          <Download size={20} /> Descargar
        </button>
        <button onClick={() => alert("Boleta copiada al portapapeles.")} className="flex-1 bg-dark hover:bg-border text-white border border-border font-bold py-4 rounded-2xl transition-colors flex justify-center items-center gap-2 shadow-lg">
          <Share2 size={20} /> Compartir
        </button>
        <button onClick={() => navigate('tracking')} className="flex-1 bg-primary hover:bg-primary-hover text-black font-bold py-4 rounded-2xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-primary/20">
          Tracking del Pedido
        </button>
      </div>
    </div>
  );
}

