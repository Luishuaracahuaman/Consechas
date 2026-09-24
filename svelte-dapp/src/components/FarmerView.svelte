<script>
  import { Star, ShieldCheck } from 'lucide-svelte';

  let { isWalletConnected, showToast } = $props();

  let lotes = $state([]);
  
  $effect(() => {
    fetch('http://localhost:3000/api/lotes')
      .then(res => res.json())
      .then(data => lotes = data)
      .catch(err => console.error("Error fetching lotes:", err));
  });

  let fotoCosechaUrl = $state(null);
  let fotoInput;
  
  function handleFotoCosecha(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        fotoCosechaUrl = e.target.result;
        form.img = fotoCosechaUrl; // Agregar imagen al formulario
        showToast('Foto de la cosecha lista para registrarse.');
      };
      reader.readAsDataURL(file);
    }
  }

  let form = $state({ cultivo: '', cantidad: '', precio: '', gps: '', tipoVenta: 'Spot', fechaEstimada: '', img: '' });
  let isSubmitting = $state(false);
  let showSuccessModal = $state(false);

  async function registrarLote(e) {
    e.preventDefault();
    if (!isWalletConnected) {
      showToast("Conecta tu Wallet arriba a la derecha antes de sellar un lote.", 'error');
      return;
    }
    
    // Si no subió foto, usamos una genérica
    if (!form.img) form.img = '/palta.png';

    isSubmitting = true;

    try {
      const res = await fetch('http://localhost:3000/api/lotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const nuevoLote = await res.json();
      
      if (res.ok) {
        lotes = [nuevoLote, ...lotes];
        form = { cultivo: '', cantidad: '', precio: '', gps: '', tipoVenta: 'Spot', fechaEstimada: '', img: '' };
        fotoCosechaUrl = null;
        isSubmitting = false;
        showSuccessModal = true;
        setTimeout(() => showSuccessModal = false, 3000);
      } else {
        isSubmitting = false;
        showToast("Error al guardar en BD", "error");
      }
    } catch (err) {
      isSubmitting = false;
      console.error(err);
      showToast("Error de conexión al servidor", "error");
    }
  }

  function subirCertificado() {
    console.log('Abriendo selector de archivos y subiendo certificado a IPFS...');
    showToast('Función de subida a IPFS activada');
  }
</script>

<div class="max-w-7xl mx-auto px-4 md:px-5 py-5 md:py-10 mt-4 md:mt-10 animate-in fade-in duration-300">
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
    <h2 class="text-2xl md:text-3xl font-bold text-primary">Panel del Productor 👨‍🌾</h2>
    <div class="bg-dark border border-border p-3 rounded-lg flex items-center gap-4">
      <div>
        <span class="block text-xs text-muted uppercase tracking-wider">Tu Reputación Global</span>
        <div class="flex items-center gap-2">
          <Star class="text-primary fill-primary w-5 h-5" />
          <span class="text-white font-bold text-xl">4.9</span>
          <span class="text-muted text-sm">(120 reseñas)</span>
        </div>
      </div>
    </div>
  </div>
  
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
    <!-- FORMULARIO: Registrar Nuevo Lote -->
    <div class="bg-panel/40 backdrop-blur-md rounded-lg p-6 border border-border lg:col-span-1 shadow-lg">
      <h3 class="text-xl font-semibold mb-6">Registrar Nuevo Lote</h3>
      <form onsubmit={registrarLote} class="flex flex-col gap-4">
        <div>
          <label class="block text-sm text-muted mb-1">Tipo de cultivo</label>
          <input type="text" placeholder="Ej: Uva Italia" required class="w-full p-3 bg-dark border border-border text-white rounded focus:outline-none focus:border-primary transition-colors" bind:value={form.cultivo} />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-muted mb-1">Cantidad (KG)</label>
            <input type="number" placeholder="Ej: 1000" required class="w-full p-3 bg-dark border border-border text-white rounded focus:outline-none focus:border-primary transition-colors" bind:value={form.cantidad} />
          </div>
          <div>
            <label class="block text-sm text-muted mb-1">Precio (USDT)</label>
            <input type="number" step="0.01" placeholder="Ej: 150" required class="w-full p-3 bg-dark border border-border text-white rounded focus:outline-none focus:border-primary transition-colors" bind:value={form.precio} />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-muted mb-1">Modalidad</label>
            <select class="w-full p-3 bg-dark border border-border text-white rounded focus:outline-none focus:border-primary transition-colors" bind:value={form.tipoVenta}>
              <option value="Spot">Mercado Spot</option>
              <option value="Futuro">Venta a Futuro</option>
            </select>
          </div>
          {#if form.tipoVenta === 'Futuro'}
            <div class="animate-in fade-in zoom-in-95 duration-200">
              <label class="block text-sm text-primary font-semibold mb-1">Mes de Cosecha</label>
              <input type="month" required class="w-full p-3 bg-dark border border-primary text-white rounded focus:outline-none focus:border-primary transition-colors" bind:value={form.fechaEstimada} />
            </div>
          {:else}
            <div>
              <label class="block text-sm text-muted mb-1">Coordenadas GPS</label>
              <input type="text" placeholder="-12.04, -77.04" required class="w-full p-3 bg-dark border border-border text-white rounded focus:outline-none focus:border-primary transition-colors" bind:value={form.gps} />
            </div>
          {/if}
        </div>

        <div class="flex flex-col gap-3 mt-2">
          <!-- Input oculto para la foto -->
          <input type="file" accept="image/*" class="hidden" bind:this={fotoInput} onchange={handleFotoCosecha} />
          
          {#if fotoCosechaUrl}
            <div class="relative w-full h-32 rounded-lg overflow-hidden border border-primary/50 group">
              <img src={fotoCosechaUrl} alt="Cosecha" class="w-full h-full object-cover" />
              <button type="button" onclick={() => fotoInput.click()} class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm font-bold transition-opacity">
                Cambiar Foto
              </button>
            </div>
          {:else}
            <button type="button" onclick={() => fotoInput.click()} class="w-full flex items-center justify-center gap-2 bg-dark text-muted border border-dashed border-border font-medium py-3 rounded hover:text-white hover:border-primary transition-colors">
              📷 Subir Foto de la Cosecha
            </button>
          {/if}

          <button type="submit" disabled={isSubmitting} class="w-full bg-primary text-black font-bold py-3 rounded hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 mt-2 disabled:opacity-50 flex justify-center items-center gap-2">
            {#if isSubmitting}
              <svg class="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Sellando en Blockchain...
            {:else}
              Sellar en Blockchain
            {/if}
          </button>

          <button type="button" onclick={subirCertificado} class="w-full flex items-center justify-center gap-2 bg-dark text-muted border border-border font-medium py-3 rounded hover:text-white hover:border-gray-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Subir Certificado Fitosanitario
          </button>
        </div>
      </form>
    </div>

    <!-- HISTORIAL Y ESCROW -->
    <div class="bg-panel/40 backdrop-blur-md rounded-lg p-6 border border-border lg:col-span-2 shadow-lg">
      <h3 class="text-xl font-semibold mb-6">Historial de Smart Contracts</h3>
      <div class="overflow-x-auto mb-10">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr>
              <th class="p-3 border-b border-border font-semibold text-muted">Cultivo</th>
              <th class="p-3 border-b border-border font-semibold text-muted">Volumen</th>
              <th class="p-3 border-b border-border font-semibold text-muted">Estado</th>
              <th class="p-3 border-b border-border font-semibold text-muted text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {#each lotes as lote}
              <tr class="hover:bg-dark/50 transition-colors">
                <td class="p-3 border-b border-border text-main">{lote.cultivo}</td>
                <td class="p-3 border-b border-border">{lote.volumen}</td>
                <td class="p-3 border-b border-border">
                  <span class="px-2 py-1 rounded text-xs font-bold {lote.status === 'Pagado' ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'}">
                    {lote.status}
                  </span>
                </td>
                <td class="p-3 border-b border-border text-right">
                  <a href={`https://mumbai.polygonscan.com/tx/${lote.hash}`} target="_blank" rel="noreferrer" class="inline-flex items-center gap-1 text-primary hover:text-primary-hover font-medium text-sm transition-colors bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded">
                    Explorer
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- ESCROW TRACKER -->
      <div class="pt-6 border-t border-border">
        <h3 class="text-lg font-bold text-main mb-8">Estado Actual: Escrow Tracker</h3>
        <div class="relative flex justify-between items-center w-full mx-auto pb-4 px-2">
          <div class="absolute top-5 left-0 w-full h-1 bg-dark border border-border rounded-full z-0"></div>
          <div class="absolute top-5 left-0 w-[33%] h-1 bg-primary rounded-full z-0 transition-all shadow-[0_0_8px_rgba(252,211,77,0.5)]"></div>

          <div class="relative z-10 flex flex-col items-center">
            <div class="w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center font-bold shadow-lg ring-4 ring-panel">
              <ShieldCheck size={20} />
            </div>
            <span class="mt-3 text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wide">Bloqueados</span>
          </div>

          <div class="relative z-10 flex flex-col items-center">
            <div class="w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center font-bold shadow-lg ring-4 ring-panel">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" /></svg>
            </div>
            <span class="mt-3 text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wide text-center">En Camino</span>
          </div>

          <div class="relative z-10 flex flex-col items-center">
            <div class="w-10 h-10 rounded-full bg-dark text-muted flex items-center justify-center font-bold ring-4 ring-panel shadow-sm border border-border">
              3
            </div>
            <span class="mt-3 text-[10px] sm:text-xs font-semibold text-muted uppercase tracking-wide text-center">Confirmada</span>
          </div>

          <div class="relative z-10 flex flex-col items-center">
            <div class="w-10 h-10 rounded-full bg-dark text-muted flex items-center justify-center font-bold ring-4 ring-panel shadow-sm border border-border">
              4
            </div>
            <span class="mt-3 text-[10px] sm:text-xs font-semibold text-muted uppercase tracking-wide text-center">Liberados</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- DASHBOARD ANALÍTICO -->
  <div class="mt-8 bg-panel rounded-[2rem] p-8 border border-border shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
    <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

    <h3 class="text-2xl font-black mb-8 flex items-center gap-3 relative z-10 text-white">
      <div class="w-10 h-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center text-xl border border-primary/30 shadow-inner">📊</div> 
      Rendimiento y Analíticas
    </h3>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
      
      <!-- Gráfico de Ingresos -->
      <div class="h-80 w-full bg-dark/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 flex flex-col justify-between hover:border-primary/50 transition-colors shadow-lg group/card">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h4 class="text-xs font-bold text-muted uppercase tracking-widest mb-1">Ingresos (USDT)</h4>
            <span class="text-2xl font-black text-white">40,500 <span class="text-primary text-sm font-bold">USDT</span></span>
          </div>
          <span class="bg-success/20 text-success text-xs font-bold px-2 py-1 rounded-md border border-success/30">+14%</span>
        </div>

        <div class="flex-grow flex items-end justify-between gap-2 md:gap-4 h-full border-b border-border pb-2 relative">
          <!-- Líneas guía -->
          <div class="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2 border-l border-border pl-2 opacity-50">
            <div class="w-full border-t border-border/50"></div>
            <div class="w-full border-t border-border/50"></div>
            <div class="w-full border-t border-border/50"></div>
            <div class="w-full border-t border-border/50"></div>
          </div>

          {#each [
            { label: 'Ene', val: 40, real: '4,000' },
            { label: 'Feb', val: 65, real: '6,500' },
            { label: 'Mar', val: 55, real: '5,500' },
            { label: 'Abr', val: 80, real: '8,000' },
            { label: 'May', val: 70, real: '7,000' },
            { label: 'Jun', val: 95, real: '9,500' }
          ] as point, i}
            <div class="relative flex flex-col items-center flex-1 group h-full justify-end z-10">
              <!-- Tooltip -->
              <div class="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-panel border border-border px-3 py-1.5 rounded-lg text-xs text-primary font-black shadow-xl pointer-events-none z-20 whitespace-nowrap transform -translate-y-2 group-hover:translate-y-0 duration-200">
                {point.real}
              </div>
              <!-- Barra -->
              <div 
                class="w-full max-w-[40px] bg-primary/20 group-hover:bg-primary rounded-t-md transition-all duration-300 border-t-2 border-primary shadow-[0_0_15px_rgba(252,213,53,0)] group-hover:shadow-[0_0_15px_rgba(252,213,53,0.5)] cursor-pointer" 
                style="height: {point.val}%"
              ></div>
              <span class="text-[10px] text-muted mt-3 font-medium uppercase">{point.label}</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Gráfico de Volumen -->
      <div class="h-80 w-full bg-dark/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 flex flex-col justify-between hover:border-success/50 transition-colors shadow-lg group/card">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h4 class="text-xs font-bold text-muted uppercase tracking-widest mb-1">Volumen Entregado</h4>
            <span class="text-2xl font-black text-white">960 <span class="text-success text-sm font-bold">Ton</span></span>
          </div>
          <span class="bg-success/20 text-success text-xs font-bold px-2 py-1 rounded-md border border-success/30">+8%</span>
        </div>

        <div class="flex-grow flex items-end justify-between gap-2 md:gap-4 h-full border-b border-border pb-2 relative">
          <!-- Líneas guía -->
          <div class="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2 border-l border-border pl-2 opacity-50">
            <div class="w-full border-t border-border/50"></div>
            <div class="w-full border-t border-border/50"></div>
            <div class="w-full border-t border-border/50"></div>
            <div class="w-full border-t border-border/50"></div>
          </div>

          {#each [
            { label: 'Ene', val: 30, real: '120' },
            { label: 'Feb', val: 45, real: '150' },
            { label: 'Mar', val: 65, real: '180' },
            { label: 'Abr', val: 50, real: '140' },
            { label: 'May', val: 85, real: '210' },
            { label: 'Jun', val: 75, real: '160' }
          ] as point, i}
            <div class="relative flex flex-col items-center flex-1 group h-full justify-end z-10">
              <!-- Tooltip -->
              <div class="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-panel border border-border px-3 py-1.5 rounded-lg text-xs text-success font-black shadow-xl pointer-events-none z-20 whitespace-nowrap transform -translate-y-2 group-hover:translate-y-0 duration-200">
                {point.real}
              </div>
              <!-- Barra -->
              <div 
                class="w-full max-w-[40px] bg-success/20 group-hover:bg-success rounded-t-md transition-all duration-300 border-t-2 border-success shadow-[0_0_15px_rgba(16,185,129,0)] group-hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] cursor-pointer" 
                style="height: {point.val}%"
              ></div>
              <span class="text-[10px] text-muted mt-3 font-medium uppercase">{point.label}</span>
            </div>
          {/each}
        </div>
      </div>

    </div>
  </div>

  <!-- Modal Profesional de Carga/Éxito al Registrar -->
  {#if isSubmitting || showSuccessModal}
    <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex justify-center items-center p-4 transition-opacity animate-in fade-in duration-300">
      <div class="bg-panel/40 backdrop-blur-md border {showSuccessModal ? 'border-primary' : 'border-border'} rounded-xl max-w-sm w-full p-5 md:p-8 relative shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col items-center text-center">
        {#if isSubmitting}
          <div class="relative w-20 h-20 mb-6">
            <div class="absolute inset-0 border-4 border-dark rounded-full"></div>
            <div class="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <ShieldCheck class="absolute inset-0 m-auto text-primary animate-pulse" size={32} />
          </div>
          <h3 class="text-xl font-bold text-white mb-2">Sellando en Blockchain</h3>
          <p class="text-muted text-sm">Generando Smart Contract en la red de Polygon...</p>
        {:else if showSuccessModal}
          <div class="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-6 animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h3 class="text-xl font-bold text-white mb-2 text-primary">¡Lote Sellado Exitosamente!</h3>
          <p class="text-muted text-sm">Tu lote ahora es inmutable y ya está disponible en el Mercado Global.</p>
        {/if}
      </div>
    </div>
  {/if}
</div>
