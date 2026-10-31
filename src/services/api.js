/**
 * Cliente HTTP ligero y desacoplado para node-apiliq
 */
class ApiService {
  constructor() {
    this.defaultBaseUrl = 'http://localhost:3005';
  }

  getBaseUrl() {
    return localStorage.getItem('api_liq_base_url') || this.defaultBaseUrl;
  }

  setBaseUrl(url) {
    const clean = url.trim().replace(/\/+$/, '');
    localStorage.setItem('api_liq_base_url', clean);
  }

  getAdminKey() {
    return localStorage.getItem('api_liq_admin_key') || '';
  }

  setAdminKey(key) {
    localStorage.setItem('api_liq_admin_key', key.trim());
  }

  async request(endpoint, options = {}) {
    const baseUrl = this.getBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${cleanEndpoint}`;

    const headers = {
      ...(options.headers || {})
    };

    const adminKey = this.getAdminKey();
    if (adminKey && !headers['X-Admin-Key']) {
      headers['X-Admin-Key'] = adminKey;
    }

    if (!(options.body instanceof FormData) && !(options.body instanceof Blob) && !headers['Content-Type'] && options.body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    const isJson = (response.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMsg = (typeof data === 'object' && (data.error || data.message)) 
        ? (data.error || data.message) 
        : `Error HTTP ${response.status}: ${response.statusText}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  }

  // --- Endpoints de Salud y Diagnóstico ---
  async getStatus() {
    return this.request('/api/status');
  }

  async getAdminHealth(testDb = false) {
    return this.request(`/api/admin/health${testDb ? '?testDb=true' : ''}`);
  }

  async getPoolStatus() {
    return this.request('/api/admin/pool-status');
  }

  async verifyAdminKey() {
    return this.request('/api/admin/verify', { method: 'POST' });
  }

  // --- Endpoints de Vistas ---
  async getViewsList() {
    return this.request('/api/view/list');
  }

  async getViewData(viewName, params = {}) {
    const query = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    }
    const qStr = query.toString();
    return this.request(`/api/view/${viewName}${qStr ? '?' + qStr : ''}`);
  }

  async saveView(viewConfig) {
    return this.request('/api/view/save', {
      method: 'POST',
      body: JSON.stringify(viewConfig)
    });
  }

  async refreshViews() {
    return this.request('/api/view/refresh', { method: 'POST' });
  }

  async importViewsJson(viewsObject) {
    return this.request('/api/view/import-json', {
      method: 'POST',
      body: JSON.stringify(viewsObject)
    });
  }

  // --- Endpoints de Procedimientos y Funciones ---
  async getProceduresList() {
    return this.request('/api/sp/list');
  }

  async getFunctionsList() {
    return this.request('/api/fn/list');
  }

  async syncOracleProcedures() {
    return this.request('/api/sp/sync-oracle', { method: 'POST' });
  }

  async executeProcedure(spName, body) {
    return this.request(`/api/sp/${spName}`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async executeFunction(fnName, body) {
    return this.request(`/api/fn/${fnName}`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  // --- Endpoints de Importación de Tablas (Excel/CSV) ---
  async previewImportFile(file) {
    const baseUrl = this.getBaseUrl();
    const adminKey = this.getAdminKey();
    
    const response = await fetch(`${baseUrl}/api/import/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-File-Name': encodeURIComponent(file.name),
        'X-Admin-Key': adminKey
      },
      body: file
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Error ${response.status} en preview`);
    }

    return response.json();
  }

  async executeImport(payload) {
    return this.request('/api/import/execute', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}

export const api = new ApiService();
