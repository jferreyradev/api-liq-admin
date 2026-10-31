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
    proceduresList: [],
    functionsList: []
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
        this.viewsList = Array.isArray(res) ? res : (res.views || []);
        return this.viewsList;
      } catch (err) {
        console.error('Error al listar vistas:', err);
        throw err;
      }
    },

    async fetchProcedures() {
      try {
        const res = await api.getProceduresList();
        this.proceduresList = Array.isArray(res) ? res : (res.procedures || []);
        return this.proceduresList;
      } catch (err) {
        console.error('Error al listar procedimientos:', err);
        throw err;
      }
    },

    async fetchFunctions() {
      try {
        const res = await api.getFunctionsList();
        this.functionsList = Array.isArray(res) ? res : (res.functions || []);
        return this.functionsList;
      } catch (err) {
        console.error('Error al listar funciones:', err);
        throw err;
      }
    }
  }
});
