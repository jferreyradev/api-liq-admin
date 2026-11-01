<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-100 tracking-tight">Catálogo de Vistas Dinámicas</h1>
        <p class="text-sm text-slate-400">Vistas administradas en Oracle (`API_VIEW_MAPPER`) con fallback local en memoria.</p>
      </div>
      <div class="flex items-center gap-2">
        <button 
          @click="refreshCache" 
          :disabled="isRefreshing"
          class="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-700 transition shadow-sm"
          title="Limpia la memoria RAM y recarga desde Oracle"
        >
          <RefreshCw class="w-4 h-4 text-sky-400" :class="{ 'animate-spin': isRefreshing }" />
          <span>Vaciar Caché RAM</span>
        </button>
        <button 
          @click="loadViews" 
          class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition shadow-md shadow-indigo-600/20"
        >
          <RotateCcw class="w-4 h-4" />
          <span>Recargar Catálogo</span>
        </button>
      </div>
    </div>

    <!-- Search and Filter Bar -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="relative w-full sm:w-96">
        <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar vista por nombre..." 
          class="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
        />
      </div>
      <div class="text-xs text-slate-400 font-mono">
        Total: <span class="font-bold text-slate-200">{{ filteredViews.length }}</span> vistas encontradas
      </div>
    </div>

    <!-- Main Content Grid: View List + Inspector/Runner -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: Views List -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[650px]">
        <div class="p-3.5 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>Vistas Registradas</span>
          <span class="text-slate-500 font-normal">Click para inspeccionar</span>
        </div>
        
        <div class="overflow-y-auto flex-1 divide-y divide-slate-800/60">
          <div 
            v-for="vName in filteredViews" 
            :key="vName"
            @click="selectView(vName)"
            class="p-3.5 cursor-pointer transition flex items-center justify-between text-xs group"
            :class="selectedView === vName ? 'bg-indigo-600/15 text-indigo-300 border-l-2 border-indigo-500' : 'text-slate-300 hover:bg-slate-800/50'"
          >
            <div class="space-y-0.5">
              <div class="font-mono font-medium group-hover:text-indigo-400">{{ vName }}</div>
              <div class="text-[11px] text-slate-500">GET /api/view/{{ vName }}</div>
            </div>
            <ChevronRight class="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition" />
          </div>
        </div>
      </div>

      <!-- Right: Inspector and Test Runner -->
      <div class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 h-[650px] flex flex-col overflow-hidden">
        <div v-if="!selectedView" class="h-full flex flex-col items-center justify-center text-slate-500">
          <Table class="w-12 h-12 mb-3 stroke-[1.2] text-slate-600" />
          <p class="text-sm font-medium">Selecciona una vista para inspeccionar y ejecutar consultas</p>
        </div>

        <div v-else class="flex flex-col h-full space-y-4">
          <!-- View Title -->
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-indigo-400 font-mono">VISTA ACTIVA</span>
                <span v-if="viewFieldsList.length" class="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {{ viewFieldsList.length }} columnas
                </span>
              </div>
              <h2 class="text-lg font-bold text-slate-100 font-mono mt-0.5">{{ selectedView }}</h2>
            </div>
            <div class="flex items-center gap-2">
              <button 
                @click="executeViewQuery" 
                :disabled="isLoadingData"
                class="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm"
              >
                <Play class="w-3.5 h-3.5 fill-current" />
                <span>{{ isLoadingData ? 'Consultando Oracle...' : 'Ejecutar Query' }}</span>
              </button>
            </div>
          </div>

          <!-- Mapped Fields Preview -->
          <div v-if="viewFieldsList.length" class="flex flex-wrap gap-1.5 py-1">
            <span 
              v-for="col in viewFieldsList" 
              :key="col" 
              class="text-[10px] font-mono bg-slate-800/80 text-slate-300 border border-slate-700/60 px-2 py-0.5 rounded"
            >
              {{ col }}
            </span>
          </div>

          <!-- Parameter Controls -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs">
            <div>
              <label class="block text-slate-400 mb-1 font-medium">Límite (limit):</label>
              <input 
                v-model.number="queryParams.limit" 
                type="number" 
                class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500" 
              />
            </div>
            <div>
              <label class="block text-slate-400 mb-1 font-medium">Desplazamiento (offset):</label>
              <input 
                v-model.number="queryParams.offset" 
                type="number" 
                class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500" 
              />
            </div>
            <div>
              <label class="block text-slate-400 mb-1 font-medium">Periodo (01/MM/YYYY):</label>
              <input 
                v-model="queryParams.Periodo" 
                type="text" 
                placeholder="09/2026"
                class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500" 
              />
            </div>
            <div>
              <label class="block text-slate-400 mb-1 font-medium">Repartición (IdRep):</label>
              <input 
                v-model="queryParams.IdRep" 
                type="text" 
                placeholder="Opcional"
                class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500" 
              />
            </div>
          </div>

          <!-- Results Table or JSON Output -->
          <div class="flex-1 overflow-auto bg-slate-950 rounded-xl border border-slate-800 relative">
            <div v-if="isLoadingData" class="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-10">
              <RefreshCw class="w-6 h-6 text-indigo-400 animate-spin" />
            </div>

            <div v-if="queryError" class="p-6 text-center text-rose-400 text-xs">
              <AlertCircle class="w-8 h-8 mx-auto mb-2 opacity-80" />
              <div class="font-semibold">Error al consultar vista</div>
              <div class="mt-1 font-mono text-slate-400">{{ queryError }}</div>
            </div>

            <div v-else-if="tableRows.length === 0 && hasExecuted" class="p-8 text-center text-slate-500 text-xs">
              0 registros retornados desde Oracle para estos parámetros.
            </div>

            <div v-else-if="tableRows.length > 0" class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-900/90 text-slate-400 uppercase font-mono text-[11px] sticky top-0 border-b border-slate-800">
                  <tr>
                    <th v-for="col in tableColumns" :key="col" class="px-4 py-2.5 font-semibold whitespace-nowrap">
                      {{ col }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/50 font-mono">
                  <tr v-for="(row, idx) in tableRows" :key="idx" class="hover:bg-slate-900/40">
                    <td v-for="col in tableColumns" :key="col" class="px-4 py-2 whitespace-nowrap text-slate-200">
                      {{ formatCell(row[col]) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="p-8 text-center text-slate-500 text-xs">
              Presiona "Ejecutar Query" para traer datos en vivo de Oracle 11g.
            </div>
          </div>

          <!-- Bottom Footer Stats -->
          <div v-if="tableRows.length > 0" class="text-xs text-slate-400 flex items-center justify-between pt-1">
            <span>Mostrando <b class="text-slate-200">{{ tableRows.length }}</b> filas</span>
            <span class="text-slate-500 font-mono">Paginación nativa ROWNUM (Triple Subquery 11g)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAdminStore } from '../stores/adminStore';
import { api } from '../services/api';
import { 
  Search, 
  RefreshCw, 
  RotateCcw, 
  ChevronRight, 
  Play, 
  Table, 
  AlertCircle 
} from '@lucide/vue';

const store = useAdminStore();
const searchQuery = ref('');
const selectedView = ref(null);
const isRefreshing = ref(false);
const isLoadingData = ref(false);
const hasExecuted = ref(false);
const queryError = ref(null);

const queryParams = ref({
  limit: 25,
  offset: 0,
  Periodo: '',
  IdRep: ''
});

const tableRows = ref([]);

const selectedViewMeta = computed(() => {
  if (!selectedView.value) return null;
  return store.viewsMap[selectedView.value] || null;
});

const viewFieldsList = computed(() => {
  if (!selectedViewMeta.value?.fields) return [];
  return Object.keys(selectedViewMeta.value.fields);
});

const filteredViews = computed(() => {
  if (!searchQuery.value) return store.viewsList;
  const q = searchQuery.value.toLowerCase();
  return store.viewsList.filter(v => v.toLowerCase().includes(q));
});

const tableColumns = computed(() => {
  if (tableRows.value.length === 0) return [];
  return Object.keys(tableRows.value[0]);
});

onMounted(() => {
  loadViews();
});

async function loadViews() {
  try {
    await store.fetchViews();
  } catch (err) {
    console.error('Error cargando vistas:', err);
  }
}

function selectView(name) {
  selectedView.value = name;
  tableRows.value = [];
  queryError.value = null;
  hasExecuted.value = false;
}

async function executeViewQuery() {
  if (!selectedView.value) return;
  isLoadingData.value = true;
  queryError.value = null;
  hasExecuted.value = true;
  tableRows.value = [];

  try {
    const res = await api.getViewData(selectedView.value, queryParams.value);
    const rows = Array.isArray(res) ? res : (res.rows || res.data || []);
    tableRows.value = rows;
  } catch (err) {
    queryError.value = err.message;
  } finally {
    isLoadingData.value = false;
  }
}

async function refreshCache() {
  isRefreshing.value = true;
  try {
    await api.refreshViews();
    alert('✅ Caché RAM de vistas reiniciada exitosamente.');
    await loadViews();
  } catch (err) {
    alert(`❌ Error al reiniciar caché: ${err.message}`);
  } finally {
    isRefreshing.value = false;
  }
}

function formatCell(val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}
</script>
