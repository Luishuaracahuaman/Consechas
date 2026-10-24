// Configuración centralizada de API para entorno local, Docker y Cloud
export const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.port === '5173' 
    ? 'http://localhost:3000' 
    : '');
