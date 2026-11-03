<template>
  <header class="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-md">
    <!-- Brand -->
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
        <Database class="w-5 h-5 text-white" />
      </div>
      <div>
        <div class="flex items-center gap-2">
          <span class="font-bold text-slate-100 tracking-tight text-lg">API Liquid</span>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Studio</span>
        </div>
        <p class="text-xs text-slate-400">Consola de Gestión y Telemetría Oracle 11g</p>
      </div>
    </div>

    <!-- Center Host Indicator -->
    <div class="hidden md:flex items-center gap-2 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-full text-xs text-slate-300">
      <span class="w-2 h-2 rounded-full" :class="store.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'"></span>
      <span class="text-slate-400">Conectado a:</span>
      <span class="font-mono font-medium text-sky-400">{{ store.apiUrl }}</span>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-3">
      <!-- Auth Status Badge -->
      <span 
        class="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 border"
        :class="store.isAdminVerified 
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'"
      >
        <ShieldCheck v-if="store.isAdminVerified" class="w-3.5 h-3.5" />
        <KeyRound v-else class="w-3.5 h-3.5" />
        {{ store.isAdminVerified ? 'Admin Verificado' : 'Solo Lectura' }}
      </span>

      <!-- Refresh Status Button -->
      <button 
        @click="store.checkStatus()" 
        :disabled="store.isCheckingHealth"
        class="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
        title="Verificar conexión ahora"
      >
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': store.isCheckingHealth }" />
      </button>

      <!-- Settings Button -->
      <button 
        @click="$emit('open-settings')" 
        class="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 hover:border-slate-600 transition-colors shadow-sm"
      >
        <Settings class="w-4 h-4 text-slate-400" />
        <span>Configurar</span>
      </button>

      <!-- Logout / Salir Button -->
      <button 
        @click="store.openLogoutModal()" 
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm border"
        :class="store.adminKey 
          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20 hover:border-rose-500/30' 
          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-slate-600'"
        title="Cerrar sesión y borrar datos de localStorage"
      >
        <LogOut class="w-3.5 h-3.5" :class="store.adminKey ? 'text-rose-400' : 'text-slate-400'" />
        <span>{{ store.adminKey ? 'Cerrar Sesión' : 'Salir / Limpiar' }}</span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { useAdminStore } from '../stores/adminStore';
import { Database, ShieldCheck, KeyRound, RefreshCw, Settings, LogOut } from '@lucide/vue';

defineEmits(['open-settings']);
const store = useAdminStore();
</script>
