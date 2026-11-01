<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-100 tracking-tight">Stored Procedures & Funciones</h1>
        <p class="text-sm text-slate-400">Introspección y ejecución directa sobre Oracle PL/SQL con mapeo dinámico de binds.</p>
      </div>
      <div class="flex items-center gap-2">
        <button 
          @click="syncFromOracle" 
          :disabled="isSyncing"
          class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition shadow-md shadow-indigo-600/20"
          title="Descubre procedimientos y funciones en tiempo real desde ALL_ARGUMENTS"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isSyncing }" />
          <span>Sincronizar desde Oracle (ALL_ARGUMENTS)</span>
        </button>
      </div>
    </div>

    <!-- Filter and Sub-Tabs -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <!-- Tabs (SPs vs FNs) -->
      <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
        <button 
          @click="activeSubTab = 'sp'"
          class="px-4 py-1.5 rounded-md text-xs font-medium transition"
          :class="activeSubTab === 'sp' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'"
        >
          Stored Procedures ({{ store.proceduresList.length }})
        </button>
        <button 
          @click="activeSubTab = 'fn'"
          class="px-4 py-1.5 rounded-md text-xs font-medium transition"
          :class="activeSubTab === 'fn' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'"
        >
          Funciones ({{ store.functionsList.length }})
        </button>
      </div>

      <!-- Search -->
      <div class="relative w-full sm:w-80">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input 
          v-model="searchQuery" 
          type="text" 
          :placeholder="`Buscar ${activeSubTab === 'sp' ? 'procedimiento' : 'función'}...`"
          class="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: List -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[650px]">
        <div class="p-3.5 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold text-slate-300">
          {{ activeSubTab === 'sp' ? 'Procedimientos Disponibles' : 'Funciones Disponibles' }}
        </div>
        <div class="overflow-y-auto flex-1 divide-y divide-slate-800/60">
          <div 
            v-for="item in currentList" 
            :key="item"
            @click="selectItem(item)"
            class="p-3.5 cursor-pointer transition flex items-center justify-between text-xs group"
            :class="selectedItem === item ? 'bg-indigo-600/15 text-indigo-300 border-l-2 border-indigo-500' : 'text-slate-300 hover:bg-slate-800/50'"
          >
            <div class="space-y-0.5">
              <div class="font-mono font-medium group-hover:text-indigo-400">{{ item }}</div>
              <div class="text-[11px] text-slate-500">POST /api/{{ activeSubTab }}/{{ item }}</div>
            </div>
            <ChevronRight class="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition" />
          </div>
        </div>
      </div>

      <!-- Right: Execution Form and Output -->
      <div class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 h-[650px] flex flex-col overflow-hidden">
        <div v-if="!selectedItem" class="h-full flex flex-col items-center justify-center text-slate-500">
          <Code2 class="w-12 h-12 mb-3 stroke-[1.2] text-slate-600" />
          <p class="text-sm font-medium">Selecciona un procedimiento o función para ejecutar en Oracle</p>
        </div>

        <div v-else class="flex flex-col h-full space-y-4">
          <!-- Item Header -->
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-indigo-400 font-mono uppercase">
                  {{ activeSubTab === 'sp' ? 'STORED PROCEDURE' : 'FUNCIÓN ORACLE' }}
                </span>
                <span v-if="selectedItemMeta?.sp_name || selectedItemMeta?.fn_name" class="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {{ selectedItemMeta?.sp_name || selectedItemMeta?.fn_name }}
                </span>
              </div>
              <h2 class="text-lg font-bold text-slate-100 font-mono mt-0.5">{{ selectedItem }}</h2>
            </div>
            <button 
              @click="executeCall" 
              :disabled="isExecuting"
              class="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition shadow-sm"
            >
              <Play class="w-3.5 h-3.5 fill-current" />
              <span>{{ isExecuting ? 'Ejecutando en Oracle...' : 'Ejecutar en Oracle' }}</span>
            </button>
          </div>

          <!-- Payload Input Builder (JSON Editor) -->
          <div class="space-y-2">
            <div class="flex justify-between items-center text-xs text-slate-400">
              <span class="font-medium">Parámetros de Entrada (JSON Body):</span>
              <span class="text-slate-500 font-mono text-[11px]">Enviados como Binds (:v...)</span>
            </div>
            <textarea 
              v-model="rawPayload" 
              rows="6"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder='{\n  "vIDREP": 1,\n  "vPERIODO": "01/09/2026"\n}'
            ></textarea>
          </div>

          <!-- Execution Output / Results -->
          <div class="flex-1 flex flex-col space-y-2 min-h-0">
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span class="font-medium">Resultado de la Ejecución (OUT / Cursor / Error):</span>
              <span v-if="executionTime" class="font-mono text-slate-400">Tiempo: {{ executionTime }} ms</span>
            </div>
            
            <div class="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs overflow-auto">
              <div v-if="executionError" class="text-rose-400 space-y-1">
                <div class="font-bold flex items-center gap-1.5">
                  <AlertCircle class="w-4 h-4 shrink-0" />
                  <span>Error retornado por la API / Oracle:</span>
                </div>
                <pre class="whitespace-pre-wrap text-[11px] bg-rose-950/30 p-2.5 rounded border border-rose-900/40 text-rose-300">{{ executionError }}</pre>
              </div>

              <div v-else-if="executionResult" class="text-emerald-400 space-y-2">
                <div class="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
                  <span class="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle class="w-4 h-4" />
                    Ejecución Exitosa
                  </span>
                </div>
                <pre class="whitespace-pre-wrap text-[11px] text-slate-200">{{ JSON.stringify(executionResult, null, 2) }}</pre>
              </div>

              <div v-else class="text-slate-600 text-center py-10">
                Presiona "Ejecutar en Oracle" para probar el procedimiento.
              </div>
            </div>
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
  Code2, 
  Search, 
  ChevronRight, 
  Play, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle 
} from '@lucide/vue';

const store = useAdminStore();
const activeSubTab = ref('sp');
const searchQuery = ref('');
const selectedItem = ref(null);
const isSyncing = ref(false);
const isExecuting = ref(false);
const rawPayload = ref('{\n  \n}');
const executionResult = ref(null);
const executionError = ref(null);
const executionTime = ref(null);

const currentList = computed(() => {
  const list = activeSubTab.value === 'sp' ? store.proceduresList : store.functionsList;
  if (!searchQuery.value) return list;
  const q = searchQuery.value.toLowerCase();
  return list.filter(item => item.toLowerCase().includes(q));
});

const selectedItemMeta = computed(() => {
  if (!selectedItem.value) return null;
  return activeSubTab.value === 'sp' 
    ? store.proceduresMap[selectedItem.value] 
    : store.functionsMap[selectedItem.value];
});

onMounted(async () => {
  await Promise.allSettled([
    store.fetchProcedures(),
    store.fetchFunctions()
  ]);
});

function selectItem(item) {
  selectedItem.value = item;
  executionResult.value = null;
  executionError.value = null;
  executionTime.value = null;

  const meta = activeSubTab.value === 'sp' 
    ? store.proceduresMap[item] 
    : store.functionsMap[item];

  if (meta?.in_param) {
    if (Array.isArray(meta.in_param)) {
      const sample = {};
      meta.in_param.forEach(p => { sample[p] = ''; });
      rawPayload.value = JSON.stringify(sample, null, 2);
    } else if (typeof meta.in_param === 'object') {
      const sample = {};
      Object.keys(meta.in_param).forEach(k => { sample[k] = ''; });
      rawPayload.value = JSON.stringify(sample, null, 2);
    } else {
      rawPayload.value = '{\n  \n}';
    }
  } else {
    rawPayload.value = '{\n  \n}';
  }
}

async function executeCall() {
  if (!selectedItem.value) return;
  isExecuting.value = true;
  executionResult.value = null;
  executionError.value = null;
  executionTime.value = null;

  let body = {};
  try {
    body = JSON.parse(rawPayload.value);
  } catch (err) {
    alert('JSON inválido en parámetros de entrada');
    isExecuting.value = false;
    return;
  }

  const start = performance.now();
  try {
    if (activeSubTab.value === 'sp') {
      executionResult.value = await api.executeProcedure(selectedItem.value, body);
    } else {
      executionResult.value = await api.executeFunction(selectedItem.value, body);
    }
  } catch (err) {
    executionError.value = err.data ? JSON.stringify(err.data, null, 2) : err.message;
  } finally {
    executionTime.value = Math.round(performance.now() - start);
    isExecuting.value = false;
  }
}

async function syncFromOracle() {
  isSyncing.value = true;
  try {
    const res = await api.syncOracleProcedures();
    alert(`✅ Sincronización exitosa desde Oracle:\nProcedimientos: ${res.proceduresCount || 'Actualizados'}\nFunciones: ${res.functionsCount || 'Actualizadas'}`);
    await store.fetchProcedures();
    await store.fetchFunctions();
  } catch (err) {
    alert(`❌ Error al sincronizar desde Oracle: ${err.message}`);
  } finally {
    isSyncing.value = false;
  }
}
</script>
