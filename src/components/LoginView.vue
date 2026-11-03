<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
    <!-- Glow effects in background -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-600/15 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Login Card -->
    <div class="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-7 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
      
      <!-- Brand & Header -->
      <div class="text-center space-y-2">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Database class="w-7 h-7 text-white" />
        </div>
        <div class="pt-2">
          <div class="flex items-center justify-center gap-2">
            <h1 class="text-2xl font-bold tracking-tight text-slate-100">API Liquid</h1>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Studio</span>
          </div>
          <p class="text-xs text-slate-400 mt-1">Consola de Gestión y Telemetría Oracle 11g</p>
        </div>
      </div>

      <!-- Environment / API Status Pill -->
      <div class="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full" :class="isChecking ? 'bg-amber-400 animate-pulse' : (apiConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500')"></span>
            <span class="text-slate-400">Servidor API:</span>
          </div>
          <button 
            type="button" 
            @click="showServerConfig = !showServerConfig"
            class="text-[11px] font-medium text-sky-400 hover:text-sky-300 underline underline-offset-2"
          >
            {{ showServerConfig ? 'Ocultar' : 'Cambiar URL' }}
          </button>
        </div>

        <div class="font-mono text-[11px] text-slate-300 truncate">
          {{ currentUrl }}
        </div>

        <!-- Collapsible Server URL Selector -->
        <div v-if="showServerConfig" class="pt-2 border-t border-slate-800/80 space-y-2">
          <input 
            v-model="currentUrl"
            type="text" 
            placeholder="https://api-rpi.liqsysonline.com"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
          />
          <div class="flex items-center gap-2">
            <button 
              type="button"
              @click="currentUrl = 'https://api-rpi.liqsysonline.com'"
              class="px-2 py-1 rounded bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border border-indigo-500/30 text-[10px] font-medium"
            >
              api-rpi (Producción)
            </button>
            <button 
              type="button"
              @click="currentUrl = 'http://localhost:3005'"
              class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium"
            >
              localhost:3005
            </button>
          </div>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-start gap-2.5 animate-in fade-in">
        <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
        <div class="flex-1 text-[11px] leading-relaxed">
          {{ errorMessage }}
        </div>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1.5">
            Clave de Administrador (X-Admin-Key):
          </label>
          <div class="relative">
            <input 
              v-model="adminKeyInput"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Ingresa la clave de administrador..."
              required
              autofocus
              class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 pr-10 text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
            <button 
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
            >
              <EyeOff v-if="showPassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <button 
          type="submit"
          :disabled="isLoading || !adminKeyInput"
          class="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
          <LockKeyhole v-else class="w-4 h-4" />
          <span>{{ isLoading ? 'Verificando credenciales...' : 'Iniciar Sesión como Administrador' }}</span>
        </button>
      </form>

      <!-- Guest / Read-only Divider -->
      <div class="relative flex items-center justify-center pt-1">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-slate-800"></div>
        </div>
        <span class="relative bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider">
          O acceso restringido
        </span>
      </div>

      <!-- Guest Access Button -->
      <div>
        <button 
          type="button"
          @click="handleGuestAccess"
          class="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-700/80 transition flex items-center justify-center gap-2 group cursor-pointer"
        >
          <Compass class="w-4 h-4 text-slate-400 group-hover:text-sky-400 transition-colors" />
          <span>Continuar en Modo Solo Lectura</span>
        </button>
        <p class="text-[10px] text-center text-slate-500 mt-2">
          Permite visualizar telemetría y estado de la base de datos sin permisos de modificación.
        </p>
      </div>

      <!-- Footer Info -->
      <div class="text-center pt-2 text-[11px] text-slate-600 font-mono">
        Almacenamiento seguro en navegador local &bull; v1.0.0
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAdminStore } from '../stores/adminStore';
import { api } from '../services/api';
import { 
  Database, 
  LockKeyhole, 
  Eye, 
  EyeOff, 
  Compass, 
  AlertCircle, 
  Loader2 
} from '@lucide/vue';

const store = useAdminStore();

const adminKeyInput = ref('');
const currentUrl = ref(store.apiUrl || api.getBaseUrl());
const showServerConfig = ref(false);
const showPassword = ref(false);
const isLoading = ref(false);
const isChecking = ref(false);
const apiConnected = ref(false);
const errorMessage = ref('');

onMounted(async () => {
  checkApiHealth();
});

async function checkApiHealth() {
  isChecking.value = true;
  try {
    api.setBaseUrl(currentUrl.value);
    await api.getStatus();
    apiConnected.value = true;
  } catch (err) {
    apiConnected.value = false;
  } finally {
    isChecking.value = false;
  }
}

async function handleLogin() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    if (currentUrl.value !== store.apiUrl) {
      store.setApiUrl(currentUrl.value);
    }
    await store.login(adminKeyInput.value);
  } catch (err) {
    errorMessage.value = err.message || 'La clave de administrador no es válida o no se pudo conectar con el servidor.';
  } finally {
    isLoading.value = false;
  }
}

function handleGuestAccess() {
  if (currentUrl.value !== store.apiUrl) {
    store.setApiUrl(currentUrl.value);
  }
  store.enterAsGuest();
}
</script>
