<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-100 tracking-tight">SQL Studio & Creador de Vistas</h1>
        <p class="text-sm text-slate-400">Escribe consultas SELECT, pruébalas en tiempo real contra Oracle y conviértelas en endpoints de la API.</p>
      </div>
      <div class="flex items-center gap-2">
        <button 
          @click="runQuery"
          :disabled="isExecuting || !sqlText.trim()"
          class="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
        >
          <Play class="w-4 h-4 fill-current" :class="{ 'animate-spin': isExecuting }" />
          <span>{{ isExecuting ? 'Ejecutando en Oracle...' : 'Ejecutar Consulta' }}</span>
        </button>
        <button 
          @click="openSaveModal"
          :disabled="!sqlText.trim()"
          class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
        >
          <Save class="w-4 h-4" />
          <span>Guardar como Vista de la API</span>
        </button>
      </div>
    </div>

    <!-- SQL Editor Area -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[280px]">
      <div class="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Terminal class="w-4 h-4 text-indigo-400" />
          <span>Editor de Consulta Oracle (SELECT)</span>
          <span class="text-[11px] text-slate-500 font-normal hidden sm:inline">(Cmd+Enter para ejecutar)</span>
        </div>
        <div class="flex items-center gap-3">
          <!-- Limit selector -->
          <div class="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Límite:</span>
            <select 
              v-model.number="queryLimit" 
              class="bg-slate-900 border border-slate-700 text-slate-300 rounded px-2 py-0.5 text-xs focus:outline-none"
            >
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
              <option :value="200">200</option>
            </select>
          </div>

          <!-- Samples Dropdown -->
          <select 
            @change="loadSample($event.target.value)" 
            class="bg-slate-900 border border-slate-700 text-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none"
          >
            <option value="">Cargar Consulta Ejemplo...</option>
            <option value="empleados">Empleados con Repartición</option>
            <option value="conceptos">Conceptos de Liquidación</option>
            <option value="parametros">Consulta con Filtros Binds (:IdRep, :Periodo)</option>
          </select>
        </div>
      </div>

      <div class="flex-1 p-3 bg-slate-950 font-mono text-xs">
        <textarea 
          v-model="sqlText"
          @keydown.meta.enter="runQuery"
          @keydown.ctrl.enter="runQuery"
          class="w-full h-full bg-transparent text-slate-200 placeholder-slate-600 focus:outline-none resize-none"
          placeholder="SELECT p.ID, p.APELLIDO, p.NOMBRE, p.CUIL FROM PERSONAS p WHERE p.ACTIVO = 1"
          spellcheck="false"
        ></textarea>
      </div>
    </div>

    <!-- Query Results Section -->
    <div v-if="hasRun || isExecuting || queryError" class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[300px]">
      <div class="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Table class="w-4 h-4 text-emerald-400" />
          <span class="text-xs font-semibold text-slate-300">Resultado de la Consulta</span>
          <span v-if="queryDuration !== null" class="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            {{ queryDuration }} ms
          </span>
          <span v-if="resultRows.length > 0" class="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            {{ resultRows.length }} registros
          </span>
        </div>
        <button 
          v-if="hasRun" 
          @click="clearResults" 
          class="text-xs text-slate-500 hover:text-slate-300 transition"
        >
          Limpiar
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isExecuting" class="p-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
        <RefreshCw class="w-6 h-6 text-emerald-400 animate-spin" />
        <span class="text-xs">Consultando base de datos Oracle...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="queryError" class="p-6 text-xs text-rose-400 space-y-2">
        <div class="font-semibold flex items-center gap-1.5">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>Error retornado por Oracle / API:</span>
        </div>
        <pre class="whitespace-pre-wrap font-mono text-[11px] bg-rose-950/30 p-3 rounded-lg border border-rose-900/40 text-rose-300">{{ queryError }}</pre>
      </div>

      <!-- Empty State -->
      <div v-else-if="hasRun && resultRows.length === 0" class="p-12 text-center text-slate-500 text-xs">
        0 registros retornados desde Oracle para esta consulta.
      </div>

      <!-- Data Table -->
      <div v-else-if="resultRows.length > 0" class="overflow-auto max-h-[450px]">
        <table class="w-full text-left border-collapse text-xs">
          <thead class="bg-slate-950 sticky top-0 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
            <tr>
              <th v-for="col in tableColumns" :key="col" class="p-3 font-semibold whitespace-nowrap">
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-mono text-slate-300">
            <tr v-for="(row, idx) in resultRows" :key="idx" class="hover:bg-slate-800/40 transition">
              <td v-for="col in tableColumns" :key="col" class="p-3 whitespace-nowrap text-[11px]">
                {{ formatCell(row[col]) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Save View Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-slate-100">Guardar como Vista de la API</h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-slate-200">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 font-medium mb-1">Nombre del Endpoint (/api/view/:name):</label>
            <input 
              v-model="newViewName" 
              type="text" 
              placeholder="ej: misEmpleadosActivos" 
              class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500" 
            />
          </div>

          <div>
            <label class="block text-slate-400 font-medium mb-1">Descripción de la Vista:</label>
            <input 
              v-model="newViewDesc" 
              type="text" 
              placeholder="ej: Consulta de empleados activos con repartición" 
              class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500" 
            />
          </div>

          <div class="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-slate-400 space-y-1">
            <div class="font-semibold text-slate-300">Auto-Procesamiento en la API:</div>
            <p>• La API desglosará automáticamente columnas, alias y filtros `:param`.</p>
            <p>• Se persistirá en Oracle (`API_VIEW_MAPPER`) y en la memoria RAM de inmediato.</p>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            @click="showModal = false" 
            class="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button 
            @click="confirmSaveView" 
            :disabled="isSaving || !newViewName.trim()"
            class="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
          >
            {{ isSaving ? 'Guardando en Oracle...' : 'Guardar y Publicar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { api } from '../services/api';
import { useAdminStore } from '../stores/adminStore';
import { 
  Terminal, 
  Save, 
  X, 
  Play, 
  Table, 
  RefreshCw, 
  AlertCircle 
} from '@lucide/vue';

const store = useAdminStore();
const sqlText = ref('');
const queryLimit = ref(50);
const isExecuting = ref(false);
const hasRun = ref(false);
const resultRows = ref([]);
const queryError = ref(null);
const queryDuration = ref(null);

onMounted(() => {
  if (store.sqlStudioDraft) {
    sqlText.value = store.sqlStudioDraft;
    store.sqlStudioDraft = '';
  }
});

watch(() => store.sqlStudioDraft, (newDraft) => {
  if (newDraft) {
    sqlText.value = newDraft;
    store.sqlStudioDraft = '';
  }
});

const showModal = ref(false);
const newViewName = ref('');
const newViewDesc = ref('');
const isSaving = ref(false);

const tableColumns = computed(() => {
  if (resultRows.value.length === 0) return [];
  return Object.keys(resultRows.value[0]);
});

async function runQuery() {
  if (!sqlText.value.trim() || isExecuting.value) return;
  isExecuting.value = true;
  hasRun.value = true;
  queryError.value = null;
  resultRows.value = [];
  queryDuration.value = null;

  try {
    const res = await api.executeSql(sqlText.value.trim(), {}, queryLimit.value);
    resultRows.value = res.rows || [];
    queryDuration.value = res.durationMs ?? 0;
  } catch (err) {
    queryError.value = err.data ? (err.data.error || JSON.stringify(err.data, null, 2)) : err.message;
  } finally {
    isExecuting.value = false;
  }
}

function clearResults() {
  resultRows.value = [];
  queryError.value = null;
  queryDuration.value = null;
  hasRun.value = false;
}

function formatCell(val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function openSaveModal() {
  if (!store.adminKey) {
    alert('Se requiere configurar la clave de administrador (X-Admin-Key) para crear vistas en Oracle.');
    return;
  }
  newViewName.value = '';
  newViewDesc.value = '';
  showModal.value = true;
}

async function confirmSaveView() {
  if (!newViewName.value.trim()) return;
  isSaving.value = true;
  try {
    const payload = {
      viewName: newViewName.value.trim(),
      description: newViewDesc.value.trim() || undefined,
      sql: sqlText.value.trim()
    };
    await api.saveView(payload);
    alert(`✅ Vista '${newViewName.value}' guardada con éxito en Oracle y disponible de inmediato en /api/view/${newViewName.value}`);
    showModal.value = false;
    await store.fetchViews();
  } catch (err) {
    alert(`❌ Error al guardar vista: ${err.message}`);
  } finally {
    isSaving.value = false;
  }
}

function loadSample(type) {
  if (type === 'empleados') {
    sqlText.value = `SELECT e.IDEMPLEADO, e.CUIL, e.APELLIDO, e.NOMBRE, r.DESCRIPCION AS REPARTICION
FROM EMPLEADOS e
JOIN REPARTICIONES r ON e.IDREP = r.IDREP
WHERE e.ACTIVO = 1
ORDER BY e.APELLIDO ASC`;
  } else if (type === 'conceptos') {
    sqlText.value = `SELECT c.COD_CONCEPTO, c.DESCRIPCION, c.TIPO_CONCEPTO, c.PORCENTAJE
FROM CONCEPTOS_LIQUIDACION c
WHERE c.VIGENTE = 1
ORDER BY c.COD_CONCEPTO ASC`;
  } else if (type === 'parametros') {
    sqlText.value = `SELECT h.IDHOJA, h.CUIL, h.IMPORTE, h.PERIODO, h.IDREP
FROM HOJA_NOVEDADES h
WHERE h.IDREP = :IdRep
  AND h.PERIODO = :Periodo
ORDER BY h.CUIL ASC`;
  }
}
</script>
