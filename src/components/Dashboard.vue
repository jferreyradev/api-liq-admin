<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-100 tracking-tight">Panel de Control & Telemetría</h1>
        <p class="text-sm text-slate-400">Monitoreo en tiempo real del servicio REST y del pool de conexiones Oracle 11g.</p>
      </div>
      <div class="flex items-center gap-2">
        <button 
          @click="testOraclePing" 
          :disabled="isTestingDb"
          class="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-700 transition shadow-sm"
        >
          <Database class="w-4 h-4 text-sky-400" />
          <span>{{ isTestingDb ? 'Probando DUAL...' : 'Test SELECT 1 FROM DUAL' }}</span>
        </button>
        <button 
          @click="store.checkStatus()" 
          class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition shadow-md shadow-indigo-600/20"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': store.isCheckingHealth }" />
          <span>Actualizar Telemetría</span>
        </button>
      </div>
    </div>

    <!-- Error Banner if disconnected -->
    <div v-if="!store.isConnected" class="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3">
      <AlertTriangle class="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      <div>
        <h3 class="text-sm font-semibold text-rose-300">Sin conexión con la API</h3>
        <p class="text-xs text-rose-400/90 mt-0.5">
          No se pudo contactar con <code class="bg-rose-950/40 px-1 py-0.5 rounded">{{ store.apiUrl }}</code>. 
          Asegúrate de que la API esté corriendo (`npm start` o PM2) y que la URL esté configurada correctamente.
        </p>
      </div>
    </div>

    <!-- Metric Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Card 1: API Status -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
          <span>Estado del Servicio</span>
          <Activity class="w-4 h-4 text-emerald-400" />
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-2xl font-bold tracking-tight" :class="store.isConnected ? 'text-emerald-400' : 'text-rose-400'">
            {{ store.isConnected ? 'ONLINE' : 'OFFLINE' }}
          </span>
          <span class="text-xs text-slate-400 font-mono">{{ store.statusData?.service || 'node-apiliq' }}</span>
        </div>
        <div class="mt-3 text-xs text-slate-500 flex items-center justify-between">
          <span>Último chequeo:</span>
          <span class="font-mono text-slate-300">{{ store.lastCheckTime || 'N/A' }}</span>
        </div>
      </div>

      <!-- Card 2: Uptime -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
          <span>Tiempo Activo (Uptime)</span>
          <Clock class="w-4 h-4 text-indigo-400" />
        </div>
        <div class="mt-3">
          <span class="text-2xl font-bold tracking-tight text-slate-100 font-mono">
            {{ store.uptimeString }}
          </span>
        </div>
        <div class="mt-3 text-xs text-slate-500 flex items-center justify-between">
          <span>Total en segundos:</span>
          <span class="font-mono text-slate-300">{{ store.statusData?.uptimeSeconds?.toLocaleString() || 0 }} s</span>
        </div>
      </div>

      <!-- Card 3: Node Engine -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
          <span>Entorno Node.js</span>
          <Cpu class="w-4 h-4 text-sky-400" />
        </div>
        <div class="mt-3">
          <span class="text-2xl font-bold tracking-tight text-slate-100 font-mono">
            {{ store.statusData?.node || 'N/A' }}
          </span>
        </div>
        <div class="mt-3 text-xs text-slate-500 flex items-center justify-between">
          <span>Modo Express:</span>
          <span class="font-semibold text-emerald-400">Headless 4.x</span>
        </div>
      </div>

      <!-- Card 4: Oracle Pool Health -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
          <span>Pool Oracle 11g</span>
          <Server class="w-4 h-4 text-amber-400" />
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-2xl font-bold tracking-tight font-mono text-indigo-400">
            {{ store.poolStats.connectionsInUse ?? 0 }}
          </span>
          <span class="text-xs text-slate-400">en uso de</span>
          <span class="text-lg font-bold text-slate-200 font-mono">
            {{ store.poolStats.connectionsOpen ?? 0 }}
          </span>
        </div>
        <div class="mt-3 text-xs text-slate-500 flex items-center justify-between">
          <span>Máximo configurado:</span>
          <span class="font-mono text-slate-300">{{ store.poolStats.poolMax ?? 10 }} conns</span>
        </div>
      </div>
    </div>

    <!-- Oracle Pool Deep Dive Widget -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
            <Layers class="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 class="text-base font-semibold text-slate-100">Estado del Pool de Conexiones Oracle (Thick Mode)</h2>
            <p class="text-xs text-slate-400">Multiplexación persistente para proteger Oracle 11g de agotamiento de procesos.</p>
          </div>
        </div>
        <span 
          class="text-xs font-semibold px-2.5 py-1 rounded-full uppercase"
          :class="store.poolStats.open || store.poolStats.status === 'open' 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'"
        >
          Estado: {{ store.poolStats.status || 'Desconectado' }}
        </span>
      </div>

      <!-- Pool Progress Bar -->
      <div class="space-y-2 mt-4">
        <div class="flex justify-between text-xs text-slate-400">
          <span>Capacidad utilizada:</span>
          <span class="font-mono font-medium text-slate-200">{{ poolUsagePercentage }}%</span>
        </div>
        <div class="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
          <div 
            class="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full transition-all duration-500"
            :style="{ width: `${poolUsagePercentage}%` }"
          ></div>
        </div>
      </div>

      <!-- Pool Specs Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80 text-xs">
        <div class="bg-slate-950/50 p-3 rounded-lg border border-slate-800/60">
          <div class="text-slate-500">Mínimo de Conexiones:</div>
          <div class="text-base font-bold font-mono text-slate-200 mt-1">{{ store.poolStats.poolMin ?? 4 }}</div>
        </div>
        <div class="bg-slate-950/50 p-3 rounded-lg border border-slate-800/60">
          <div class="text-slate-500">Máximo de Conexiones:</div>
          <div class="text-base font-bold font-mono text-slate-200 mt-1">{{ store.poolStats.poolMax ?? 10 }}</div>
        </div>
        <div class="bg-slate-950/50 p-3 rounded-lg border border-slate-800/60">
          <div class="text-slate-500">Incremento de Lote:</div>
          <div class="text-base font-bold font-mono text-slate-200 mt-1">{{ store.poolStats.poolIncrement ?? 1 }}</div>
        </div>
        <div class="bg-slate-950/50 p-3 rounded-lg border border-slate-800/60">
          <div class="text-slate-500">Timeout de Inactividad:</div>
          <div class="text-base font-bold font-mono text-slate-200 mt-1">{{ store.poolStats.poolTimeout ?? 60 }} s</div>
        </div>
      </div>
    </div>

    <!-- Quick Direct Endpoints Tester -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <h2 class="text-base font-semibold text-slate-100 mb-1">Endpoints Diagnósticos Directos</h2>
      <p class="text-xs text-slate-400 mb-4">Acceso rápido a las rutas de monitoreo nativas implementadas en la API.</p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <a 
          :href="`${store.apiUrl}/api/status`" 
          target="_blank"
          class="flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 rounded-xl transition group"
        >
          <div class="space-y-1">
            <div class="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 flex items-center gap-1.5">
              <span>GET /api/status</span>
              <ExternalLink class="w-3 h-3 text-slate-500" />
            </div>
            <div class="text-[11px] text-slate-500">Telemetría pública y ligera</div>
          </div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">200 OK</span>
        </a>

        <a 
          :href="`${store.apiUrl}/api/admin/pool-status`" 
          target="_blank"
          class="flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 rounded-xl transition group"
        >
          <div class="space-y-1">
            <div class="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 flex items-center gap-1.5">
              <span>GET /api/admin/pool-status</span>
              <ExternalLink class="w-3 h-3 text-slate-500" />
            </div>
            <div class="text-[11px] text-slate-500">Métricas avanzadas del pool</div>
          </div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Admin Key</span>
        </a>

        <a 
          :href="`${store.apiUrl}/api/view/list`" 
          target="_blank"
          class="flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 rounded-xl transition group"
        >
          <div class="space-y-1">
            <div class="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 flex items-center gap-1.5">
              <span>GET /api/view/list</span>
              <ExternalLink class="w-3 h-3 text-slate-500" />
            </div>
            <div class="text-[11px] text-slate-500">Catálogo maestro de vistas</div>
          </div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">JSON</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAdminStore } from '../stores/adminStore';
import { api } from '../services/api';
import { 
  Activity, 
  Clock, 
  Cpu, 
  Server, 
  Database, 
  RefreshCw, 
  Layers, 
  AlertTriangle,
  ExternalLink 
} from '@lucide/vue';

const store = useAdminStore();
const isTestingDb = ref(false);

const poolUsagePercentage = computed(() => {
  const open = store.poolStats.connectionsOpen || 0;
  const inUse = store.poolStats.connectionsInUse || 0;
  if (!open) return 0;
  return Math.min(100, Math.round((inUse / open) * 100));
});

async function testOraclePing() {
  isTestingDb.value = true;
  try {
    const res = await api.getAdminHealth(true);
    alert(res.database?.connected ? `✅ Conexión Oracle Exitosa: ${res.database.message}` : `⚠️ Respuesta Oracle: ${res.database.message}`);
    store.checkStatus();
  } catch (err) {
    alert(`❌ Error al conectar a Oracle: ${err.message}`);
  } finally {
    isTestingDb.value = false;
  }
}
</script>
