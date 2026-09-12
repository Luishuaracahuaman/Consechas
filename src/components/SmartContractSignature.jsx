import React, { useState } from 'react';

export default function SmartContractSignature() {
  const [monedaSeleccionada, setMonedaSeleccionada] = useState('USDT');
  const [mostrarModalCarga, setMostrarModalCarga] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);

  const opcionesPago = [
    { id: 'USDT', nombre: 'USDT', logo: 'https://cryptologos.cc/logos/tether-usdt-logo.svg' },
    { id: 'USDC', nombre: 'USDC', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg' },
    { id: 'MATIC', nombre: 'MATIC', logo: 'https://cryptologos.cc/logos/polygon-matic-logo.svg' },
    { id: 'ETH', nombre: 'Ethereum', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg' }
  ];

  const firmarTransaccion = () => {
    setMostrarModalCarga(true);
    
    setTimeout(() => {
      setMostrarModalCarga(false);
      setMostrarModalExito(true);
    }, 2000);
  };

  const cerrarModales = () => {
    setMostrarModalCarga(false);
    setMostrarModalExito(false);
  };

  const logoSeleccionado = opcionesPago.find(m => m.id === monedaSeleccionada)?.logo;

  return (
    <div className="p-6 max-w-md mx-auto text-gray-800 font-sans">
      
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h2 className="text-2xl font-black mb-8 text-center text-gray-900">Resumen de Pago</h2>
        
        <div className="space-y-3 mb-8 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">
          <div className="flex justify-between pb-2 border-b border-gray-200"><span className="font-semibold text-gray-500">Productor:</span> <span className="font-medium text-gray-900">Finca La Esperanza</span></div>
          <div className="flex justify-between pt-1"><span className="font-semibold text-gray-500">Volumen:</span> <span className="font-medium text-gray-900">500 kg Café Org.</span></div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Pagar con:</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
              {logoSeleccionado && <img src={logoSeleccionado} className="w-6 h-6 drop-shadow-sm" alt="logo" />}
            </div>

            <select 
              value={monedaSeleccionada} 
              onChange={(e) => setMonedaSeleccionada(e.target.value)} 
              className="w-full appearance-none bg-white border-2 border-gray-200 text-gray-900 font-bold text-base rounded-2xl focus:outline-none focus:ring-0 focus:border-purple-600 block py-4 pl-12 pr-10 shadow-sm transition-colors cursor-pointer"
            >
              {opcionesPago.map(moneda => (
                <option key={moneda.id} value={moneda.id}>{moneda.nombre}</option>
              ))}
            </select>
            
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        <div className="mb-8 p-4 bg-purple-50 rounded-2xl border border-purple-100">
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-1">Total a Bloquear</span>
            <span className="text-4xl font-black text-purple-700">1,500 <span className="text-xl font-bold">{monedaSeleccionada}</span></span>
          </div>
        </div>

        <button onClick={firmarTransaccion} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-purple-500/30 transform transition hover:-translate-y-1">
          Firmar Transacción Definitiva
        </button>
      </div>

      {/* MODAL 1: Esperando confirmación */}
      {mostrarModalCarga && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4">
            <svg className="animate-spin text-purple-500 h-16 w-16 mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-100" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xl font-bold text-white text-center tracking-wide">Esperando confirmación...</p>
            <p className="text-sm text-purple-300 mt-2 text-center">Interactuando con la red Polygon.</p>
          </div>
        </div>
      )}

      {/* MODAL 2: Éxito */}
      {mostrarModalExito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md transition-opacity">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 animate-modal-pop relative overflow-hidden">
            
            <div className="success-checkmark mb-4">
              <div className="check-icon">
                <span className="icon-line line-tip"></span>
                <span className="icon-line line-long"></span>
                <div className="icon-circle"></div>
                <div className="icon-fix"></div>
              </div>
            </div>

            <h3 className="text-2xl font-black text-gray-900 mb-2 text-center">¡Smart Contract Sellado!</h3>
            <p className="text-gray-500 text-center mb-8 text-sm leading-relaxed">Los fondos están bloqueados de forma segura en el contrato inteligente.</p>

            <div className="w-full space-y-3 relative z-10">
              <button className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-md shadow-indigo-500/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Descargar Certificado (PDF)
              </button>
              
              <button className="w-full flex justify-center items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold py-3.5 px-4 rounded-xl transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                Compartir mi impacto
              </button>

              <button className="w-full flex justify-center items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 font-bold py-3.5 px-4 rounded-xl transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                Guardar QR de Trazabilidad
              </button>
            </div>

            <button onClick={cerrarModales} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
