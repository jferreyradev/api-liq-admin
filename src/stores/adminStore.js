import { defineStore } from 'pinia';
import { api } from '../services/api';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    apiUrl: api.getBaseUrl(),
    adminKey: api.getAdminKey(),
    activeTab: 'dashboard',
    
    // Conectividad y Salud
    isConnected: false,
    isAdminVerified: false,
    isCheckingHealth: false,
    lastCheckTime: null,
    statusData: null,
    healthData: null,
    poolData: null,
    error: null,

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
      this.verifyAuth();
    },

    setActiveTab(tab) {
      this.activeTab = tab;
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
