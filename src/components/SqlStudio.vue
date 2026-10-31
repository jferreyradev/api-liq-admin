<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-100 tracking-tight">SQL Studio & Creador de Vistas</h1>
        <p class="text-sm text-slate-400">Escribe consultas SELECT y conviértelas automáticamente en endpoints de la API con paginación 11g.</p>
      </div>
      <div class="flex items-center gap-2">
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
    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[320px]">
      <div class="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Terminal class="w-4 h-4 text-indigo-400" />
          <span>Editor de Consulta Oracle (SELECT)</span>
        </div>
        <div class="flex items-center gap-2">
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
          class="w-full h-full bg-transparent text-slate-200 placeholder-slate-600 focus:outline-none resize-none"
          placeholder="SELECT p.ID, p.APELLIDO, p.NOMBRE, p.CUIL FROM PERSONAS p WHERE p.ACTIVO = 1"
          spellcheck="false"
        ></textarea>
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
import { ref } from 'vue';
import { api } from '../services/api';
import { useAdminStore } from '../stores/adminStore';
import { Terminal, Save, X } from '@lucide/vue';

const store = useAdminStore();
const sqlText = ref('');
const showModal = ref(false);
const newViewName = ref('');
const newViewDesc = ref('');
const isSaving = ref(false);

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
