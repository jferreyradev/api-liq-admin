<template>
  <div v-if="isOpen" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
      <!-- Title -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2.5">
          <Settings class="w-5 h-5 text-indigo-400" />
          <h3 class="text-base font-bold text-slate-100">Configuración de Conexión</h3>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-200">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Settings Form -->
      <div class="space-y-4 text-xs">
        <!-- API URL -->
        <div>
          <label class="block text-slate-400 font-medium mb-1.5">URL Base de la API Liquid:</label>
          <input 
            v-model="tempUrl" 
            type="text" 
            placeholder="http://localhost:3005"
            class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500" 
          />
          <div class="flex items-center gap-2 mt-2">
            <span class="text-slate-500 text-[11px]">Accesos rápidos:</span>
            <button 
              @click="tempUrl = 'http://localhost:3005'" 
              class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
            >
              Localhost:3005
            </button>
            <button 
              @click="tempUrl = 'http://192.168.1.100:3005'" 
              class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
            >
              Raspberry Pi
            </button>
          </div>
        </div>

        <!-- Admin Access Key -->
        <div>
          <label class="block text-slate-400 font-medium mb-1.5">Clave de Administrador (X-Admin-Key):</label>
          <div class="relative">
            <input 
              v-model="tempKey" 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="Ingresa ADMIN_ACCESS_KEY del .env"
              class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 pr-10 text-slate-100 font-mono focus:outline-none focus:border-indigo-500" 
            />
            <button 
              type="button" 
              @click="showPassword = !showPassword" 
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <EyeOff v-if="showPassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
          <p class="text-[11px] text-slate-500 mt-1">
            Requerida para guardar vistas, sincronizar con Oracle y realizar importaciones masivas.
          </p>
        </div>

        <!-- Info Card -->
        <div class="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-slate-400 space-y-1">
          <div class="font-semibold text-slate-300 flex items-center gap-1.5">
            <Shield class="w-3.5 h-3.5 text-emerald-400" />
            <span>Almacenamiento Local Seguro:</span>
          </div>
          <p class="text-[11px]">
            Los datos se guardan exclusivamente en el <code class="text-slate-300">localStorage</code> de este navegador. La clave nunca sale de tu equipo excepto en la cabecera <code class="text-slate-300">X-Admin-Key</code> hacia la API.
          </p>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="flex items-center justify-between pt-3 border-t border-slate-800">
        <button 
          @click="testConnection" 
          :disabled="isTesting"
          class="text-xs font-semibold text-sky-400 hover:text-sky-300 px-3 py-1.5 rounded-lg hover:bg-sky-500/10 transition"
        >
          {{ isTesting ? 'Probando...' : 'Probar Conexión Ahora' }}
        </button>

        <div class="flex items-center gap-2">
          <button 
            @click="$emit('close')" 
            class="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button 
            @click="saveSettings" 
            class="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useAdminStore } from '../stores/adminStore';
import { api } from '../services/api';
import { Settings, X, Eye, EyeOff, Shield } from '@lucide/vue';

const props = defineProps({
  isOpen: Boolean
});
const emit = defineEmits(['close']);

const store = useAdminStore();
const tempUrl = ref(store.apiUrl);
const tempKey = ref(store.adminKey);
const showPassword = ref(false);
const isTesting = ref(false);

watch(() => props.isOpen, (open) => {
  if (open) {
    tempUrl.value = store.apiUrl;
    tempKey.value = store.adminKey;
  }
});

async function testConnection() {
  isTesting.value = true;
  try {
    api.setBaseUrl(tempUrl.value);
    const status = await api.getStatus();
    alert(`✅ Conexión Exitosa con la API:\nServicio: ${status.service}\nUptime: ${status.uptime}\nNode: ${status.node}`);
  } catch (err) {
    alert(`❌ No se pudo conectar a ${tempUrl.value}: ${err.message}`);
  } finally {
    isTesting.value = false;
  }
}

function saveSettings() {
  store.setApiUrl(tempUrl.value);
  store.setAdminKey(tempKey.value);
  emit('close');
}
</script>
