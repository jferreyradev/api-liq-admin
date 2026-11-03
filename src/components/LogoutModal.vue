<template>
  <div 
    v-if="store.showLogoutModal" 
    class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
    @click.self="store.closeLogoutModal()"
  >
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <LogOut class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-100">Cerrar Sesión y Almacenamiento</h3>
            <p class="text-xs text-slate-400">Gestiona la salida y limpieza de datos en este equipo</p>
          </div>
        </div>
        <button 
          @click="store.closeLogoutModal()" 
          class="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content Options -->
      <div class="space-y-3">
        <p class="text-xs text-slate-300">
          Selecciona cómo deseas salir. Los datos están almacenados en el <code class="text-sky-300">localStorage</code> de este navegador:
        </p>

        <!-- Option 1: Solo cerrar sesión de Admin -->
        <div 
          @click="handleLogoutOnly"
          class="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-950 hover:border-amber-500/40 cursor-pointer transition group"
        >
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
              <KeyRound class="w-5 h-5" />
            </div>
            <div class="flex-1 space-y-1">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-semibold text-slate-100 group-hover:text-amber-400 transition-colors">
                  Cerrar Sesión de Administrador
                </h4>
                <span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  Modo Lectura
                </span>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">
                Elimina la clave <code class="text-slate-300">X-Admin-Key</code> de la memoria y del <code class="text-slate-300">localStorage</code>. Mantiene la URL de la API guardada.
              </p>
            </div>
          </div>
        </div>

        <!-- Option 2: Borrar TODO el localStorage y salir -->
        <div 
          @click="handleResetAll"
          class="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-950 hover:border-rose-500/40 cursor-pointer transition group"
        >
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Trash2 class="w-5 h-5" />
            </div>
            <div class="flex-1 space-y-1">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-semibold text-slate-100 group-hover:text-rose-400 transition-colors">
                  Cerrar Sesión y Purgar Todo (Reset Completo)
                </h4>
                <span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Limpieza Total
                </span>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">
                Borra absolutamente todo del <code class="text-slate-300">localStorage</code> (clave de admin, actividad y URL personalizada). Restablece la app a los valores originales.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Notification/Success message if any -->
      <div v-if="feedbackMessage" class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4 shrink-0" />
        <span>{{ feedbackMessage }}</span>
      </div>

      <!-- Footer Buttons -->
      <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
        <button 
          @click="store.closeLogoutModal()"
          class="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAdminStore } from '../stores/adminStore';
import { LogOut, KeyRound, Trash2, X, CheckCircle2 } from '@lucide/vue';

const store = useAdminStore();
const feedbackMessage = ref('');

function handleLogoutOnly() {
  store.logout();
  feedbackMessage.value = 'Sesión cerrada. Clave de administrador eliminada de localStorage.';
  setTimeout(() => {
    feedbackMessage.value = '';
    store.closeLogoutModal();
  }, 900);
}

function handleResetAll() {
  store.resetAndClearAll();
  feedbackMessage.value = 'Almacenamiento local purgado por completo y restaurado a valores de fábrica.';
  setTimeout(() => {
    feedbackMessage.value = '';
    store.closeLogoutModal();
  }, 900);
}
</script>
