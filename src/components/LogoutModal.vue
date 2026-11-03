<template>
  <div 
    v-if="store.showLogoutModal" 
    class="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
    @click.self="store.closeLogoutModal()"
  >
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <LogOut class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-100">Cerrar Sesión</h3>
            <p class="text-xs text-slate-400">Confirmación de salida y limpieza local</p>
          </div>
        </div>
        <button 
          type="button"
          @click="store.closeLogoutModal()" 
          class="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Body Message -->
      <div class="space-y-3 text-xs text-slate-300">
        <p class="leading-relaxed">
          ¿Deseas cerrar la sesión y borrar los datos almacenados en este navegador (<code class="text-sky-300 font-mono">localStorage</code>)?
        </p>

        <div class="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 text-slate-400 space-y-2">
          <div class="flex items-center gap-2 text-rose-400 font-medium">
            <Trash2 class="w-4 h-4 shrink-0" />
            <span class="text-slate-200">Se eliminarán de este equipo:</span>
          </div>
          <ul class="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-1 font-mono">
            <li>Clave de Administrador (<span class="text-slate-300">api_liq_admin_key</span>)</li>
            <li>Marca de actividad (<span class="text-slate-300">api_liq_last_activity</span>)</li>
            <li>URL base configurada (<span class="text-slate-300">api_liq_base_url</span>)</li>
          </ul>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
        <button 
          type="button"
          @click="store.closeLogoutModal()"
          class="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          Cancelar
        </button>
        <button 
          type="button"
          @click="executeLogout" 
          class="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <LogOut class="w-4 h-4" />
          <span>Cerrar Sesión y Borrar LocalStorage</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAdminStore } from '../stores/adminStore';
import { LogOut, Trash2, X } from '@lucide/vue';

const store = useAdminStore();

function executeLogout() {
  store.logoutAndClearStorage(false);
}
</script>
