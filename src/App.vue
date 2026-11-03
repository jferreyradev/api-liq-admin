<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
    <!-- Top Navigation Bar -->
    <Navbar @open-settings="showSettings = true" />

    <!-- Main Workspace Area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Sidebar -->
      <Sidebar />

      <!-- Content Area -->
      <main class="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-950">
        <div class="max-w-7xl mx-auto">
          <!-- Views Switcher -->
          <Dashboard v-if="store.activeTab === 'dashboard'" />
          <ViewsManager v-else-if="store.activeTab === 'views'" />
          <ProceduresManager v-else-if="store.activeTab === 'procedures'" />
          <SqlStudio v-else-if="store.activeTab === 'sqlStudio'" />
          <ImporterManager v-else-if="store.activeTab === 'importer'" />
          <div v-else-if="store.activeTab === 'settings'" class="p-4">
            {{ openSettingsFromNav() }}
          </div>
        </div>
      </main>
    </div>

    <!-- Settings Dialog -->
    <SettingsModal 
      :is-open="showSettings" 
      @close="showSettings = false" 
    />

    <!-- Modal de Salida y Limpieza de Almacenamiento -->
    <LogoutModal />

    <!-- Modal de Sesión Expirada por Inactividad -->
    <div 
      v-if="store.showSessionExpiredModal" 
      class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-center">
        <div class="w-12 h-12 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto">
          <Clock class="w-6 h-6 stroke-[1.8]" />
        </div>
        <div class="space-y-1">
          <h3 class="text-lg font-bold text-slate-100">Sesión Cerrada por Inactividad</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Por seguridad, tu clave de administrador fue removida tras 30 minutos sin actividad.
          </p>
        </div>

        <div class="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono text-left space-y-1">
          <div>🛡️ <b>Protección activa:</b> Las credenciales en memoria y <code>localStorage</code> han sido purgadas.</div>
        </div>

        <div class="flex items-center justify-center gap-3 pt-2">
          <button 
            @click="store.dismissSessionExpiredModal()"
            class="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            Continuar en Modo Lectura
          </button>
          <button 
            @click="reconnectAdmin"
            class="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
          >
            <Lock class="w-3.5 h-3.5" />
            <span>Reconectar Administrador</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useAdminStore } from './stores/adminStore';
import Navbar from './components/Navbar.vue';
import Sidebar from './components/Sidebar.vue';
import Dashboard from './components/Dashboard.vue';
import ViewsManager from './components/ViewsManager.vue';
import ProceduresManager from './components/ProceduresManager.vue';
import SqlStudio from './components/SqlStudio.vue';
import ImporterManager from './components/ImporterManager.vue';
import SettingsModal from './components/SettingsModal.vue';
import LogoutModal from './components/LogoutModal.vue';
import { Clock, Lock } from '@lucide/vue';

const store = useAdminStore();
const showSettings = ref(false);

let inactivityInterval = null;
let lastThrottleTime = 0;

function openSettingsFromNav() {
  showSettings.value = true;
  store.setActiveTab('dashboard');
  return '';
}

function reconnectAdmin() {
  store.dismissSessionExpiredModal();
  showSettings.value = true;
}

function handleUserActivity() {
  const now = Date.now();
  // Throttle: registrar actividad como máximo una vez cada 10 segundos
  if (now - lastThrottleTime > 10000) {
    lastThrottleTime = now;
    store.recordActivity();
  }
}

onMounted(() => {
  // Comprobar si ya expiró antes de montar
  store.checkInactivity();
  store.checkStatus();

  // Escuchar eventos de interacción del usuario
  const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
  events.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

  // Monitoreo periódico de inactividad cada 10 segundos
  inactivityInterval = setInterval(() => {
    store.checkInactivity();
  }, 10000);
});

onUnmounted(() => {
  if (inactivityInterval) clearInterval(inactivityInterval);
  const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
  events.forEach(evt => window.removeEventListener(evt, handleUserActivity));
});
</script>
