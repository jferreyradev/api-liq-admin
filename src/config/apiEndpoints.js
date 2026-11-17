/**
 * Catálogo de servidores configurado exclusivamente vía variable de entorno VITE_API_ENDPOINTS.
 * Formato esperado en .env o panel de Vercel:
 * VITE_API_ENDPOINTS='[{"name":"Desarrollo Cloud","url":"https://api-desa.liqsysonline.com"},{"name":"Localhost","url":"http://localhost:3005"}]'
 */

// Fallback de seguridad en caso de que la variable de entorno no esté presente
const FALLBACK_ENDPOINTS = [
  {
    name: 'Desarrollo Cloud (api-desa)',
    url: 'https://api-desa.liqsysonline.com'
  }
];

/**
 * Retorna la lista activa de servidores parseada desde VITE_API_ENDPOINTS.
 */
export function getApiEndpoints() {
  const raw = import.meta.env.VITE_API_ENDPOINTS;
  if (raw && typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(item => ({
          name: item.name || item.url,
          url: (item.url || '').trim().replace(/\/+$/, ''),
          isDefault: Boolean(item.isDefault)
        }));
      }
    } catch (err) {
      console.error('Error al parsear VITE_API_ENDPOINTS:', err);
    }
  }
  return FALLBACK_ENDPOINTS;
}

/**
 * Obtiene la URL predeterminada inicial del sistema.
 * 1) Busca el endpoint que tenga isDefault: true
 * 2) Si ninguno lo tiene, toma el primer endpoint de la lista
 */
export function getDefaultApiUrl() {
  const endpoints = getApiEndpoints();
  const def = endpoints.find(e => e.isDefault);
  return (def || endpoints[0])?.url || FALLBACK_ENDPOINTS[0].url;
}
