import { defineStore } from 'pinia';
import { api } from '../services/api';
import { buildSqlFromViewConfig } from '../utils/sqlReconstructor';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    apiUrl: api.getBaseUrl(),
    adminKey: api.getAdminKey(),
    activeTab: 'dashboard',
    sqlStudioDraft: '',
    
    // Conectividad y Salud
    isConnected: false,
    isAdminVerified: false,
    isCheckingHealth: false,
    lastCheckTime: null,
    statusData: null,
    healthData: null,
    poolData: null,
    error: null,

    // Seguridad y Sesión (Auto-Logout y Salida)
    lastActivity: Number(localStorage.getItem('api_liq_last_activity') || Date.now()),
    inactivityTimeoutMs: 30 * 60 * 1000, // 30 minutos
    showSessionExpiredModal: false,
    showLogoutModal: false,

    // Datos cacheados
    viewsList: [],
    viewsMap: {},
    proceduresList: [],
    proceduresMap: {},
    functionsList: [],
    functionsMap: {}
  }),

  getters: {
    poolStats: (state) => {
      return state.statusData?.database || state.poolData?.pool || {};
    },
    uptimeString: (state) => {
      return state.statusData?.uptime || 'N/A';
    }
  },

  actions: {
    setApiUrl(url) {
      api.setBaseUrl(url);
      this.apiUrl = api.getBaseUrl();
      this.checkStatus();
    },

    setAdminKey(key) {
      api.setAdminKey(key);
      this.adminKey = api.getAdminKey();
      if (this.adminKey) {
        this.recordActivity();
      }
      this.verifyAuth();
    },

    recordActivity() {
      const now = Date.now();
      this.lastActivity = now;
      localStorage.setItem('api_liq_last_activity', String(now));
    },

    checkInactivity() {
      if (!this.adminKey) return;
      const now = Date.now();
      const elapsed = now - (this.lastActivity || now);
      if (elapsed > this.inactivityTimeoutMs) {
        this.logout(true);
      }
    },

    logout(dueToInactivity = false) {
      api.clearAdminKey();
      this.adminKey = '';
      this.isAdminVerified = false;
      this.poolData = null;
      this.showLogoutModal = false;
      if (dueToInactivity) {
        this.showSessionExpiredModal = true;
      } else {
        this.checkStatus();
      }
    },

    resetAndClearAll() {
      api.clearAllStorage();
      this.adminKey = '';
      this.isAdminVerified = false;
      this.poolData = null;
      this.apiUrl = api.getBaseUrl();
      this.showLogoutModal = false;
      this.checkStatus();
    },

    openLogoutModal() {
      this.showLogoutModal = true;
    },

    closeLogoutModal() {
      this.showLogoutModal = false;
    },

    dismissSessionExpiredModal() {
      this.showSessionExpiredModal = false;
      this.recordActivity();
    },

    setActiveTab(tab) {
      this.activeTab = tab;
    },

    openInSqlStudio(sql) {
      this.sqlStudioDraft = sql || '';
      this.activeTab = 'sqlStudio';
    },

    exportViews(viewNames = null) {
      const targetNames = Array.isArray(viewNames) && viewNames.length > 0
        ? viewNames
        : this.viewsList;

      if (!targetNames || targetNames.length === 0) {
        throw new Error('No hay vistas disponibles para exportar.');
      }

      const payload = {};
      targetNames.forEach(name => {
        const config = this.viewsMap[name] || {};
        payload[name] = {
          ...config,
          sqlQuery: buildSqlFromViewConfig(config)
        };
      });

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      const suffix = targetNames.length === 1 ? `_${targetNames[0]}` : `_${targetNames.length}_vistas`;
      a.download = `views${suffix}_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return targetNames.length;
    },

    async checkStatus() {
      this.isCheckingHealth = true;
      this.error = null;
      try {
        const status = await api.getStatus();
        this.statusData = status;
        this.isConnected = true;
        this.lastCheckTime = new Date().toLocaleTimeString();

        // Si tenemos clave, verificar auth y obtener pool profundo
        if (this.adminKey) {
          await this.verifyAuth();
        }

        // Cargar catálogos en segundo plano para poblar badges y vistas
        Promise.allSettled([
          this.fetchViews(),
          this.fetchProcedures(),
          this.fetchFunctions()
        ]);
      } catch (err) {
        this.isConnected = false;
        this.error = `No se pudo conectar a la API en ${this.apiUrl}: ${err.message}`;
      } finally {
        this.isCheckingHealth = false;
      }
    },

    async verifyAuth() {
      if (!this.adminKey) {
        this.isAdminVerified = false;
        return;
      }
      try {
        await api.verifyAdminKey();
        this.isAdminVerified = true;
        
        // Cargar pool status completo
        const poolRes = await api.getPoolStatus();
        this.poolData = poolRes;
      } catch (err) {
        this.isAdminVerified = false;
      }
    },

    async fetchViews() {
      try {
        const res = await api.getViewsList();
        if (Array.isArray(res)) {
          this.viewsList = res;
          this.viewsMap = {};
        } else if (res && typeof res === 'object') {
          this.viewsMap = res.views && typeof res.views === 'object' && !Array.isArray(res.views) ? res.views : res;
          this.viewsList = Array.isArray(res.views) ? res.views : Object.keys(this.viewsMap);
        } else {
          this.viewsList = [];
          this.viewsMap = {};
        }
        return this.viewsList;
      } catch (err) {
        this.viewsList = [];
        this.viewsMap = {};
        console.error('Error al listar vistas:', err);
        throw err;
      }
    },

    async fetchProcedures() {
      try {
        const res = await api.getProceduresList();
        if (Array.isArray(res)) {
          this.proceduresList = res;
          this.proceduresMap = {};
        } else if (res && typeof res === 'object') {
          this.proceduresMap = res.procedures && typeof res.procedures === 'object' && !Array.isArray(res.procedures) ? res.procedures : res;
          this.proceduresList = Array.isArray(res.procedures) ? res.procedures : Object.keys(this.proceduresMap);
        } else {
          this.proceduresList = [];
          this.proceduresMap = {};
        }
        return this.proceduresList;
      } catch (err) {
        this.proceduresList = [];
        this.proceduresMap = {};
        console.error('Error al listar procedimientos:', err);
        throw err;
      }
    },

    async fetchFunctions() {
      try {
        const res = await api.getFunctionsList();
        if (Array.isArray(res)) {
          this.functionsList = res;
          this.functionsMap = {};
        } else if (res && typeof res === 'object') {
          this.functionsMap = res.functions && typeof res.functions === 'object' && !Array.isArray(res.functions) ? res.functions : res;
          this.functionsList = Array.isArray(res.functions) ? res.functions : Object.keys(this.functionsMap);
        } else {
          this.functionsList = [];
          this.functionsMap = {};
        }
        return this.functionsList;
      } catch (err) {
        this.functionsList = [];
        this.functionsMap = {};
        console.error('Error al listar funciones:', err);
        throw err;
      }
    }
  }
});
