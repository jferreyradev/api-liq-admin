<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-100 tracking-tight">Importador Masivo de Tablas</h1>
        <p class="text-sm text-slate-400">Carga masiva por lotes hacia tablas de Oracle con validación de tipos e introspección de esquema.</p>
      </div>
    </div>

    <!-- Step 1: Upload File Box -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <h2 class="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
        <span class="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs font-bold">1</span>
        Seleccionar Archivo (Excel o CSV)
      </h2>

      <div 
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        class="border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer"
        :class="isDragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'"
        @click="$refs.fileInput.click()"
      >
        <input 
          ref="fileInput" 
          type="file" 
          accept=".xlsx,.xls,.csv" 
          class="hidden" 
          @change="handleFileChange" 
        />
        <div class="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <UploadCloud class="w-6 h-6 text-indigo-400" />
        </div>
        <div class="text-xs font-medium text-slate-200">
          <span class="text-indigo-400 font-semibold">Haz clic para subir</span> o arrastra y suelta tu archivo aquí
        </div>
        <div class="text-[11px] text-slate-500 mt-1">
          Archivos compatibles: .xlsx, .xls, .csv (hasta 50 MB)
        </div>
      </div>

      <!-- File Details if loaded -->
      <div v-if="selectedFile" class="mt-4 p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
        <div class="flex items-center gap-2">
          <FileSpreadsheet class="w-4 h-4 text-emerald-400" />
          <span class="font-mono text-slate-200">{{ selectedFile.name }}</span>
          <span class="text-slate-500 font-mono">({{ (selectedFile.size / 1024).toFixed(1) }} KB)</span>
        </div>
        <button 
          @click="uploadAndPreview" 
          :disabled="isPreviewing"
          class="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition"
        >
          <Eye class="w-3.5 h-3.5" />
          <span>{{ isPreviewing ? 'Analizando...' : 'Previsualizar y Mapear' }}</span>
        </button>
      </div>
    </div>

    <!-- Step 2: Mapping & Execution -->
    <div v-if="previewData" class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
      <h2 class="text-sm font-semibold text-slate-200 flex items-center gap-2">
        <span class="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs font-bold">2</span>
        Configuración de Destino y Mapeo
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label class="block text-slate-400 font-medium mb-1">Nombre de la Tabla en Oracle:</label>
          <input 
            v-model="targetTable" 
            type="text" 
            placeholder="ej: NOVIPSST o TEMP_IMPORT" 
            class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono uppercase focus:outline-none focus:border-indigo-500" 
          />
        </div>

        <div class="flex items-center gap-6 pt-5">
          <label class="flex items-center gap-2 cursor-pointer text-slate-300">
            <input v-model="truncateBefore" type="checkbox" class="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0" />
            <span>Truncar tabla antes de insertar</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer text-slate-300">
            <input v-model="isAtomic" type="checkbox" class="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0" />
            <span>Transacción atómica (Rollback total ante error)</span>
          </label>
        </div>
      </div>

      <!-- Preview Sample Rows -->
      <div>
        <div class="text-xs font-medium text-slate-400 mb-2">Muestra de datos encontrada (primeras filas):</div>
        <div class="overflow-x-auto bg-slate-950 border border-slate-800 rounded-lg max-h-48">
          <table class="w-full text-left text-xs text-slate-300 font-mono">
            <thead class="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0">
              <tr>
                <th v-for="col in previewData.columns" :key="col" class="px-3 py-2 whitespace-nowrap">{{ col }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/50">
              <tr v-for="(row, idx) in previewData.sampleRows" :key="idx">
                <td v-for="col in previewData.columns" :key="col" class="px-3 py-1.5 whitespace-nowrap text-slate-300">{{ row[col] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Execute Import Button -->
      <div class="pt-4 border-t border-slate-800 flex justify-end">
        <button 
          @click="executeImport" 
          :disabled="isExecutingImport || !targetTable.trim()"
          class="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-xs font-semibold transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
        >
          <CheckCircle class="w-4 h-4" />
          <span>{{ isExecutingImport ? 'Insertando en Oracle (executeMany)...' : 'Iniciar Carga Masiva a Oracle' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { api } from '../services/api';
import { UploadCloud, FileSpreadsheet, Eye, CheckCircle } from '@lucide/vue';

const isDragging = ref(false);
const selectedFile = ref(null);
const isPreviewing = ref(false);
const previewData = ref(null);
const targetTable = ref('');
const truncateBefore = ref(false);
const isAtomic = ref(true);
const isExecutingImport = ref(false);

function handleDrop(e) {
  isDragging.value = false;
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    selectedFile.value = e.dataTransfer.files[0];
  }
}

function handleFileChange(e) {
  if (e.target.files && e.target.files[0]) {
    selectedFile.value = e.target.files[0];
  }
}

async function uploadAndPreview() {
  if (!selectedFile.value) return;
  isPreviewing.value = true;
  try {
    const res = await api.previewImportFile(selectedFile.value);
    previewData.value = res;
  } catch (err) {
    alert(`❌ Error al analizar archivo: ${err.message}`);
  } finally {
    isPreviewing.value = false;
  }
}

async function executeImport() {
  if (!previewData.value || !targetTable.value.trim()) return;
  isExecutingImport.value = true;

  try {
    // Mapeo automático directo 1:1 por defecto
    const mapping = {};
    for (const col of previewData.value.columns) {
      mapping[col] = col;
    }

    const payload = {
      uploadId: previewData.value.uploadId,
      tableName: targetTable.value.trim().toUpperCase(),
      mapping,
      truncate: truncateBefore.value,
      atomic: isAtomic.value
    };

    const res = await api.executeImport(payload);
    alert(`🎉 Importación completada con éxito:\nFilas insertadas: ${res.inserted || res.totalRows || 'Completado'}\nTabla: ${targetTable.value.toUpperCase()}`);
    selectedFile.value = null;
    previewData.value = null;
    targetTable.value = '';
  } catch (err) {
    alert(`❌ Error durante la importación: ${err.message}`);
  } finally {
    isExecutingImport.value = false;
  }
}
</script>
