<template>
  <aside class="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-[calc(100vh-61px)]">
    <!-- Nav Items -->
    <div class="p-4 space-y-1.5">
      <div class="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Navegación
      </div>

      <button 
        v-for="item in navItems" 
        :key="item.id"
        @click="store.setActiveTab(item.id)"
        class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left group"
        :class="store.activeTab === item.id 
          ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 shadow-sm' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'"
      >
        <component 
          :is="item.icon" 
          class="w-4 h-4 transition-transform group-hover:scale-110" 
          :class="store.activeTab === item.id ? 'text-indigo-400' : 'text-slate-400'"
        />
        <div class="flex-1 flex items-center justify-between">
          <span>{{ item.label }}</span>
          <span 
            v-if="item.badge !== undefined" 
            class="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            :class="store.activeTab === item.id ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'"
          >
            {{ item.badge }}
          </span>
        </div>
      </button>
    </div>

    <!-- Bottom Status Card -->
    <div class="p-4 border-t border-slate-800/80 bg-slate-950/40">
      <div class="bg-slate-900/90 border border-slate-800 p-3 rounded-xl shadow-inner">
        <div class="flex items-center justify-between text-xs mb-2">
          <span class="text-slate-400 font-medium">Pool Oracle 11g</span>
          <span 
            class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
            :class="store.poolStats.open || store.poolStats.status === 'open' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'"
          >
            {{ store.poolStats.status || 'Offline' }}
          </span>
        </div>
        <div class="space-y-1.5 text-xs text-slate-400 font-mono">
          <div class="flex justify-between">
            <span>En uso:</span>
            <span class="font-bold text-indigo-400">{{ store.poolStats.connectionsInUse ?? 0 }}</span>
          </div>
          <div class="flex justify-between">
            <span>Abiertas:</span>
            <span class="text-slate-200">{{ store.poolStats.connectionsOpen ?? 0 }} / {{ store.poolStats.poolMax ?? 10 }}</span>
          </div>
        </div>
      </div>

      <!-- Logout / Limpiar button -->
      <button 
        @click="store.openLogoutModal()"
        class="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all group"
        title="Cerrar sesión y purgar datos locales"
      >
        <LogOut class="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        <span>{{ store.adminKey ? 'Cerrar Sesión' : 'Cerrar / Limpiar Datos' }}</span>
      </button>

      <div class="mt-2 text-[11px] text-center text-slate-500">
        API Liquid v1.0.0
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useAdminStore } from '../stores/adminStore';
import { 
  LayoutDashboard, 
  Table, 
  Code2, 
  Terminal, 
  FileSpreadsheet,
  Settings,
  LogOut
} from '@lucide/vue';

const store = useAdminStore();

const navItems = computed(() => [
  { id: 'dashboard', label: 'Dashboard & Pool', icon: LayoutDashboard },
  { id: 'views', label: 'Vistas de la API', icon: Table, badge: store.viewsList.length || undefined },
  { id: 'procedures', label: 'SPs & Funciones', icon: Code2, badge: (store.proceduresList.length + store.functionsList.length) || undefined },
  { id: 'sqlStudio', label: 'SQL Studio', icon: Terminal },
  { id: 'importer', label: 'Importador Excel/CSV', icon: FileSpreadsheet },
  { id: 'settings', label: 'Configuración', icon: Settings }
]);
</script>
