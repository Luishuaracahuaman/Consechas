import React, { useState } from 'react';

export default function ProducerDashboard() {
  const [coordenadasGps, setCoordenadasGps] = useState('');

  const contratos = [
    { id: '1045', cultivo: 'Café Orgánico', cantidad: '500 kg', estado: 'En progreso', hash: '0x1a2b3c4d5e6f7g8h9i0j' },
    { id: '1042', cultivo: 'Cacao Fino', cantidad: '200 kg', estado: 'Completado', hash: '0x0j9i8h7g6f5e4d3c2b1a' }
  ];

  const subirCertificado = () => {
    console.log('Abriendo selector de archivos y subiendo certificado a IPFS...');
    alert('Función de subida a IPFS activada');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-12 text-gray-800 font-sans">
      {/* SECCIÓN: Registrar Nuevo Lote */}
      <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-emerald-800">Registrar Nuevo Lote</h2>
        
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Lote</label>
              <input type="text" className="w-full rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-3" placeholder="Ej. Lote Norte" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Coordenadas GPS</label>
              <input 
                type="text" 
                value={coordenadasGps} 
                onChange={(e) => setCoordenadasGps(e.target.value)} 
                className="w-full rounded-xl border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-3" 
                placeholder="Ej. -12.046374, -77.042793" 
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-8 rounded-xl transition-colors shadow-md">
              Registrar Lote
            </button>
            
            <button type="button" onClick={subirCertificado} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-medium py-3 px-6 rounded-xl transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Subir Certificado Fitosanitario (IPFS)
            </button>
          </div>
        </form>
      </section>

      {/* SECCIÓN: Historial de Smart Contracts */}
      <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-emerald-800">Historial de Smart Contracts</h2>
        
        <div className="overflow-x-auto mb-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold text-gray-500 rounded-tl-xl">ID</th>
                <th className="p-4 font-semibold text-gray-500">Cultivo</th>
                <th className="p-4 font-semibold text-gray-500">Estado</th>
                <th className="p-4 font-semibold text-gray-500 text-right rounded-tr-xl">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contratos.map(contrato => (
                <tr key={contrato.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">#{contrato.id}</td>
                  <td className="p-4 text-gray-700">{contrato.cultivo}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold tracking-wide border border-blue-100">{contrato.estado}</span>
                  </td>
                  <td className="p-4 text-right">
                    <a href={`https://mumbai.polygonscan.com/tx/${contrato.hash}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium text-sm transition-colors bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg">
                      Ver en Explorer
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

        {/* Escrow Tracker */}
        <div className="mt-8 pt-8 border-t border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-8">Estado de Lote Actual: Escrow Tracker</h3>
          <div className="relative flex justify-between items-center w-full max-w-4xl mx-auto pb-4">
            <div className="absolute top-5 left-0 w-full h-1.5 bg-gray-100 rounded-full z-0"></div>
            <div className="absolute top-5 left-0 w-[33%] h-1.5 bg-emerald-500 rounded-full z-0 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-lg ring-4 ring-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              </div>
              <span className="mt-3 text-xs font-bold text-emerald-700 uppercase tracking-wide">Fondos Bloqueados</span>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-lg ring-4 ring-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" /></svg>
              </div>
              <span className="mt-3 text-xs font-bold text-emerald-700 uppercase tracking-wide">Cosecha en Camino</span>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-11 h-11 rounded-full bg-white border-2 border-gray-200 text-gray-400 flex items-center justify-center font-bold ring-4 ring-white shadow-sm">
                3
              </div>
              <span className="mt-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Entrega Confirmada</span>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-11 h-11 rounded-full bg-white border-2 border-gray-200 text-gray-400 flex items-center justify-center font-bold ring-4 ring-white shadow-sm">
                4
              </div>
              <span className="mt-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Fondos Liberados</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
