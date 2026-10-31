<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
    <!-- Top Navigation Bar -->
    <Navbar @open-settings="showSettings = true" />

    <!-- Main Workspace Area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Sidebar -->
      <Sidebar />

      <!-- Content Area -->
      <main class="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-950">
        <div class="max-w-7xl mx-auto">
          <!-- Views Switcher -->
          <Dashboard v-if="store.activeTab === 'dashboard'" />
          <ViewsManager v-else-if="store.activeTab === 'views'" />
          <ProceduresManager v-else-if="store.activeTab === 'procedures'" />
          <SqlStudio v-else-if="store.activeTab === 'sqlStudio'" />
          <ImporterManager v-else-if="store.activeTab === 'importer'" />
          <div v-else-if="store.activeTab === 'settings'" class="p-4">
            {{ openSettingsFromNav() }}
          </div>
        </div>
      </main>
    </div>

    <!-- Settings Dialog -->
    <SettingsModal 
      :is-open="showSettings" 
      @close="showSettings = false" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAdminStore } from './stores/adminStore';
import Navbar from './components/Navbar.vue';
import Sidebar from './components/Sidebar.vue';
import Dashboard from './components/Dashboard.vue';
import ViewsManager from './components/ViewsManager.vue';
import ProceduresManager from './components/ProceduresManager.vue';
import SqlStudio from './components/SqlStudio.vue';
import ImporterManager from './components/ImporterManager.vue';
import SettingsModal from './components/SettingsModal.vue';

const store = useAdminStore();
const showSettings = ref(false);

function openSettingsFromNav() {
  showSettings.value = true;
  store.setActiveTab('dashboard');
  return '';
}

onMounted(() => {
  store.checkStatus();
});
</script>
