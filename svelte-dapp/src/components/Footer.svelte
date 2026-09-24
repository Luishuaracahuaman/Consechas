<script>

  const footerLinks = [
    {
      label: 'Producto',
      links: [
        { title: 'Mercado', href: '#' },
        { title: 'Precios', href: '#' },
        { title: 'Testimonios', href: '#' },
        { title: 'Integración', href: '#' },
      ],
    },
    {
      label: 'Compañía',
      links: [
        { title: 'Preguntas Frecuentes', href: '#' },
        { title: 'Sobre Nosotros', href: '#' },
        { title: 'Privacidad', href: '#' },
        { title: 'Términos de Servicio', href: '#' },
      ],
    },
    {
      label: 'Recursos',
      links: [
        { title: 'Blog', href: '#' },
        { title: 'Actualizaciones', href: '#' },
        { title: 'Marca', href: '#' },
        { title: 'Ayuda', href: '#' },
      ],
    },
    {
      label: 'Redes Sociales',
      links: [
        { title: 'Facebook', href: '#' },
        { title: 'Instagram', href: '#' },
        { title: 'Youtube', href: '#' },
        { title: 'LinkedIn', href: '#' },
      ],
    },
  ];

  // Acción para observar cuando los elementos entran a la pantalla
  function inview(node) {
    let observer;
    const handleIntersect = (entries) => {
      if (entries[0].isIntersecting) {
        node.classList.add('in-view');
        observer.unobserve(node);
      }
    };
    observer = new IntersectionObserver(handleIntersect, { threshold: 0.1 });
    observer.observe(node);
    return {
      destroy() {
        if (observer) observer.disconnect();
      }
    };
  }
</script>

<footer class="relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center px-6 py-12 lg:py-16 mt-20">

  <div class="grid w-full gap-8 xl:grid-cols-3 xl:gap-8 z-10">
    <div use:inview class="space-y-4 opacity-0 translate-y-2 blur-[4px] transition-all duration-700 ease-out delay-100">
      <img src="/logo_transparent.png" alt="TerraTrust Logo" class="h-20 w-auto object-contain -ml-4" />
      <p class="text-muted mt-8 text-sm md:mt-0 max-w-xs">
        Venta directa con Smart Contracts, trazabilidad blockchain y cero intermediarios.
      </p>
      <p class="text-muted text-sm mt-4">
        © {new Date().getFullYear()} TerraTrust. Todos los derechos reservados.
      </p>
    </div>

    <div class="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
      {#each footerLinks as section, index}
        <div use:inview class="opacity-0 translate-y-2 blur-[4px] transition-all duration-700 ease-out" style="transition-delay: {(index + 2) * 100}ms">
          <div class="mb-10 md:mb-0">
            <h3 class="text-xs font-semibold text-white uppercase tracking-wider">{section.label}</h3>
            <ul class="text-muted mt-4 space-y-3 text-sm">
              {#each section.links as link}
                <li>
                  <a
                    href={link.href}
                    class="hover:text-primary inline-flex items-center transition-all duration-300"
                  >
                    {#if link.icon}
                      {@const Icon = link.icon}
                      <Icon class="mr-2 h-4 w-4" />
                    {/if}
                    {link.title}
                  </a>
                </li>
              {/each}
            </ul>
          </div>
        </div>
      {/each}
    </div>
  </div>
</footer>

<style>
  :global(.in-view) {
    opacity: 1 !important;
    transform: translateY(0) !important;
    filter: blur(0px) !important;
  }
</style>
