<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-100 tracking-tight">Catálogo de Vistas Dinámicas</h1>
        <p class="text-sm text-slate-400">Vistas administradas en Oracle (`API_VIEW_MAPPER`) con reconstrucción SQL, exportación y creador de endpoints.</p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Nueva Vista -->
        <button 
          @click="openCreateModal" 
          class="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition shadow-md shadow-indigo-600/20"
        >
          <Plus class="w-4 h-4" />
          <span>Nueva Vista</span>
        </button>

        <!-- Importar JSON -->
        <label class="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer shadow-sm">
          <Upload class="w-4 h-4 text-emerald-400" />
          <span>Importar JSON</span>
          <input 
            type="file" 
            accept=".json,application/json" 
            class="hidden" 
            @change="handleImportFile" 
          />
        </label>

        <!-- Exportar Dropdown / Botón -->
        <button 
          @click="exportViewsAction" 
          class="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-700 transition shadow-sm"
          :title="selectedViewsList.length > 0 ? `Exportar ${selectedViewsList.length} seleccionadas` : 'Exportar catálogo completo a JSON'"
        >
          <Download class="w-4 h-4 text-sky-400" />
          <span>{{ selectedViewsList.length > 0 ? `Exportar (${selectedViewsList.length})` : 'Exportar Todas' }}</span>
        </button>

        <!-- Vaciar Caché RAM -->
        <button 
          @click="refreshCache" 
          :disabled="isRefreshing"
          class="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-700 transition shadow-sm"
          title="Limpia la memoria RAM del backend y recarga desde Oracle"
        >
          <RefreshCw class="w-4 h-4 text-amber-400" :class="{ 'animate-spin': isRefreshing }" />
          <span class="hidden sm:inline">Vaciar Caché</span>
        </button>

        <!-- Recargar Catálogo Local -->
        <button 
          @click="loadViews" 
          class="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-700 transition shadow-sm"
          title="Recargar lista de vistas"
        >
          <RotateCcw class="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>

    <!-- Search and Selection Bar -->
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

      <div class="flex items-center gap-3 text-xs">
        <div v-if="selectedViewsList.length > 0" class="flex items-center gap-2 bg-indigo-950/60 border border-indigo-800/80 text-indigo-300 px-3 py-1 rounded-lg">
          <span class="font-semibold">{{ selectedViewsList.length }} seleccionadas</span>
          <button @click="clearSelection" class="text-slate-400 hover:text-white underline text-[11px]">Deseleccionar</button>
        </div>

        <div class="text-slate-400 font-mono">
          Total: <span class="font-bold text-slate-200">{{ filteredViews.length }}</span> vistas
        </div>
      </div>
    </div>

    <!-- Main Content Grid: View List + Inspector/Runner -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: Views List with Checkboxes -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[700px]">
        <div class="p-3 bg-slate-950/70 border-b border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between">
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input 
              type="checkbox" 
              :checked="isAllSelected" 
              @change="toggleSelectAll"
              class="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span>Vistas Registradas</span>
          </label>
          <span class="text-slate-500 font-normal text-[11px]">Click para inspeccionar</span>
        </div>
        
        <div class="overflow-y-auto flex-1 divide-y divide-slate-800/60">
          <div 
            v-for="vName in filteredViews" 
            :key="vName"
            class="p-3 cursor-pointer transition flex items-center justify-between text-xs group"
            :class="selectedView === vName ? 'bg-indigo-600/15 text-indigo-300 border-l-2 border-indigo-500' : 'text-slate-300 hover:bg-slate-800/50'"
            @click="selectView(vName)"
          >
            <div class="flex items-center gap-2.5 overflow-hidden">
              <input 
                type="checkbox" 
                :checked="selectedViewsList.includes(vName)" 
                @click.stop="toggleViewSelection(vName)"
                class="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <div class="space-y-0.5 truncate">
                <div class="font-mono font-medium truncate group-hover:text-indigo-400">{{ vName }}</div>
                <div class="text-[11px] text-slate-500 truncate">GET /api/view/{{ vName }}</div>
              </div>
            </div>
            <ChevronRight class="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition shrink-0 ml-2" />
          </div>

          <div v-if="filteredViews.length === 0" class="p-8 text-center text-slate-500 text-xs">
            No se encontraron vistas coincidentes.
          </div>
        </div>
      </div>

      <!-- Right: Inspector, SQL Reconstructor and Test Runner -->
      <div class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 h-[700px] flex flex-col overflow-hidden">
        <div v-if="!selectedView" class="h-full flex flex-col items-center justify-center text-slate-500">
          <Table class="w-12 h-12 mb-3 stroke-[1.2] text-slate-600" />
          <p class="text-sm font-medium">Selecciona una vista para ver su SQL, probar datos o exportar</p>
        </div>

        <div v-else class="flex flex-col h-full space-y-4">
          <!-- View Title Header & Quick Actions -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-indigo-400 font-mono">VISTA ACTIVA</span>
                <span v-if="viewFieldsList.length" class="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {{ viewFieldsList.length }} columnas
                </span>
                <span v-if="whereParamList.length" class="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  {{ whereParamList.length }} binds
                </span>
              </div>
              <h2 class="text-lg font-bold text-slate-100 font-mono mt-0.5">{{ selectedView }}</h2>
            </div>

            <!-- View Header Actions -->
            <div class="flex items-center gap-2">
              <button 
                @click="exportCurrentView" 
                class="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition"
                title="Exportar definición JSON de esta vista"
              >
                <Download class="w-3.5 h-3.5 text-sky-400" />
                <span>Exportar</span>
              </button>
              <button 
                @click="openInStudio" 
                class="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-900/60 transition"
                title="Abrir sentencia SQL en SQL Studio para modificar o probar libremente"
              >
                <ExternalLink class="w-3.5 h-3.5 text-indigo-400" />
                <span>Abrir en SQL Studio</span>
              </button>
            </div>
          </div>

          <!-- Tabs Selector: 1. Datos en Vivo, 2. SQL Reconstruido, 3. Config JSON -->
          <div class="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button 
              @click="activeSubTab = 'data'"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              :class="activeSubTab === 'data' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'"
            >
              <Table class="w-3.5 h-3.5" />
              <span>Datos en Vivo</span>
            </button>
            <button 
              @click="activeSubTab = 'sql'"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              :class="activeSubTab === 'sql' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'"
            >
              <Code class="w-3.5 h-3.5" />
              <span>Sentencia SQL Reconstruida</span>
            </button>
            <button 
              @click="activeSubTab = 'json'"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              :class="activeSubTab === 'json' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'"
            >
              <FileJson class="w-3.5 h-3.5" />
              <span>Config JSON</span>
            </button>
          </div>

          <!-- TAB 1: DATOS EN VIVO -->
          <div v-show="activeSubTab === 'data'" class="flex-1 flex flex-col space-y-4 overflow-hidden">
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

            <!-- Botón Ejecutar -->
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500 font-mono">GET /api/view/{{ selectedView }}</span>
              <button 
                @click="executeViewQuery" 
                :disabled="isLoadingData"
                class="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm"
              >
                <Play class="w-3.5 h-3.5 fill-current" />
                <span>{{ isLoadingData ? 'Consultando Oracle...' : 'Ejecutar Query' }}</span>
              </button>
            </div>

            <!-- Results Table -->
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

            <div v-if="tableRows.length > 0" class="text-xs text-slate-400 flex items-center justify-between pt-1">
              <span>Mostrando <b class="text-slate-200">{{ tableRows.length }}</b> filas</span>
              <span class="text-slate-500 font-mono">Paginación nativa ROWNUM (Triple Subquery 11g)</span>
            </div>
          </div>

          <!-- TAB 2: SENTENCIA SQL RECONSTRUIDA -->
          <div v-show="activeSubTab === 'sql'" class="flex-1 flex flex-col space-y-3 overflow-hidden">
            <div class="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-xs">
              <span class="text-slate-400">Consulta SQL deducida dinámicamente desde la configuración de la vista:</span>
              <div class="flex items-center gap-2">
                <button 
                  @click="copySql" 
                  class="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded text-xs font-medium border border-slate-700 transition"
                >
                  <Check v-if="hasCopiedSql" class="w-3.5 h-3.5 text-emerald-400" />
                  <Copy v-else class="w-3.5 h-3.5 text-slate-400" />
                  <span>{{ hasCopiedSql ? '¡Copiado!' : 'Copiar SQL' }}</span>
                </button>
                <button 
                  @click="openInStudio" 
                  class="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs font-medium transition"
                >
                  <ExternalLink class="w-3.5 h-3.5" />
                  <span>Probar en SQL Studio</span>
                </button>
              </div>
            </div>

            <div class="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs overflow-auto text-emerald-300 leading-relaxed">
              <pre class="whitespace-pre">{{ reconstructedSql }}</pre>
            </div>

            <div class="p-3 bg-indigo-950/30 border border-indigo-900/40 rounded-xl text-xs text-indigo-300 flex items-start gap-2.5">
              <div class="mt-0.5 font-bold">💡</div>
              <div class="space-y-1">
                <div><b>Mapeo de Parámetros Binds:</b> Los filtros definidos en la cláusula WHERE (ej: <code>:Periodo</code>, <code>:IdRep</code>) se vinculan automáticamente desde los Query Params de la URL HTTP en <code>GET /api/view/{{ selectedView }}?Periodo=01/09/2026</code>.</div>
              </div>
            </div>
          </div>

          <!-- TAB 3: CONFIG JSON -->
          <div v-show="activeSubTab === 'json'" class="flex-1 flex flex-col space-y-3 overflow-hidden">
            <div class="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-xs">
              <span class="text-slate-400">Definición nativa en tabla <code>API_VIEW_MAPPER</code>:</span>
              <button 
                @click="copyJson" 
                class="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded text-xs font-medium border border-slate-700 transition"
              >
                <Check v-if="hasCopiedJson" class="w-3.5 h-3.5 text-emerald-400" />
                <Copy v-else class="w-3.5 h-3.5 text-slate-400" />
                <span>{{ hasCopiedJson ? '¡Copiado!' : 'Copiar JSON' }}</span>
              </button>
            </div>

            <div class="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs overflow-auto text-sky-300 leading-relaxed">
              <pre class="whitespace-pre">{{ jsonConfigString }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: CREAR / GENERAR NUEVA VISTA -->
    <div 
      v-if="showCreateModal" 
      class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <!-- Modal Header -->
        <div class="bg-slate-950/80 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Plus class="w-5 h-5 text-indigo-400" />
            <h3 class="font-bold text-slate-100 text-base">Crear Nueva Vista de la API</h3>
          </div>
          <button 
            @click="showCreateModal = false"
            class="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto space-y-4 text-xs">
          <!-- Creation Mode Switcher -->
          <div class="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button 
              @click="creationMode = 'sql'"
              class="flex-1 py-2 rounded-md font-semibold transition"
              :class="creationMode === 'sql' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'"
            >
              1. A partir de Consulta SQL (SELECT)
            </button>
            <button 
              @click="creationMode = 'oracle'"
              class="flex-1 py-2 rounded-md font-semibold transition"
              :class="creationMode === 'oracle' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'"
            >
              2. Desde Vista / Tabla Física Oracle
            </button>
          </div>

          <!-- Common Fields -->
          <div>
            <label class="block text-slate-300 font-semibold mb-1">Nombre del Endpoint / Vista:</label>
            <input 
              v-model="newViewForm.name" 
              type="text" 
              placeholder="Ej: empleadosActivos, conceptosLiquidacion, etc."
              class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
            <span class="text-[11px] text-slate-500 mt-0.5 block">Quedará disponible inmediatamente en: <code>GET /api/view/{{ newViewForm.name || ':nombre' }}</code></span>
          </div>

          <div>
            <label class="block text-slate-300 font-semibold mb-1">Descripción (Opcional):</label>
            <input 
              v-model="newViewForm.description" 
              type="text" 
              placeholder="Ej: Consulta de empleados activos con filtro por repartición y período"
              class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- Mode 1: SQL Pure -->
          <div v-if="creationMode === 'sql'" class="space-y-2">
            <label class="block text-slate-300 font-semibold">Sentencia SQL (SELECT):</label>
            <textarea 
              v-model="newViewForm.sql" 
              rows="7"
              placeholder="SELECT e.IDEMPLEADO, e.CUIL, e.APELLIDO, e.NOMBRE&#10;FROM EMPLEADOS e&#10;WHERE e.ACTIVO = 1&#10;  AND e.PERIODO = :Periodo"
              class="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500 leading-relaxed"
            ></textarea>
            <div class="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-slate-400 space-y-1">
              <div>⚡ <b>Auto-Generación de Parámetros:</b> Los campos del <code>SELECT</code> se mapearán automáticamente.</div>
              <div>⚡ Los parámetros como <code>:Periodo</code> o <code>:IdRep</code> en el <code>WHERE</code> se convertirán en filtros dinámicos aceptados por la URL.</div>
            </div>
          </div>

          <!-- Mode 2: Physical Oracle View/Table -->
          <div v-else class="space-y-2">
            <label class="block text-slate-300 font-semibold">Nombre de la Tabla o Vista en Oracle:</label>
            <input 
              v-model="newViewForm.oracleView" 
              type="text" 
              placeholder="Ej: V_RECIBOS_SUELDOS, EMPLEADOS, o CARGOS"
              class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500 uppercase"
            />
            <div class="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-slate-400 space-y-1">
              <div>🔍 El backend consultará <code>ALL_TAB_COLS</code> en Oracle para descubrir todas las columnas y generar la vista automáticamente sin necesidad de escribir SQL manual.</div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="bg-slate-950/80 px-6 py-3.5 border-t border-slate-800 flex items-center justify-end gap-3">
          <button 
            @click="showCreateModal = false"
            class="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 font-semibold text-xs transition"
          >
            Cancelar
          </button>
          <button 
            @click="submitCreateView"
            :disabled="isSubmitting || !isFormValid"
            class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg font-semibold text-xs transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            <RefreshCw v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            <span>{{ isSubmitting ? 'Guardando en Oracle...' : 'Guardar Vista en Oracle' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAdminStore } from '../stores/adminStore';
import { api } from '../services/api';
import { buildSqlFromViewConfig } from '../utils/sqlReconstructor';
import { 
  Search, 
  RefreshCw, 
  RotateCcw, 
  ChevronRight, 
  Play, 
  Table, 
  AlertCircle,
  Plus,
  Download,
  Upload,
  Code,
  Copy,
  Check,
  ExternalLink,
  FileJson,
  X,
  Save
} from '@lucide/vue';

const store = useAdminStore();
const searchQuery = ref('');
const selectedView = ref(null);
const selectedViewsList = ref([]);
const activeSubTab = ref('data'); // 'data' | 'sql' | 'json'
const isRefreshing = ref(false);
const isLoadingData = ref(false);
const hasExecuted = ref(false);
const queryError = ref(null);

const hasCopiedSql = ref(false);
const hasCopiedJson = ref(false);

const queryParams = ref({
  limit: 25,
  offset: 0,
  Periodo: '',
  IdRep: ''
});

const tableRows = ref([]);

// Modal Nueva Vista State
const showCreateModal = ref(false);
const creationMode = ref('sql'); // 'sql' | 'oracle'
const isSubmitting = ref(false);
const newViewForm = ref({
  name: '',
  description: '',
  sql: '',
  oracleView: ''
});

const selectedViewMeta = computed(() => {
  if (!selectedView.value) return null;
  return store.viewsMap[selectedView.value] || null;
});

const viewFieldsList = computed(() => {
  if (!selectedViewMeta.value?.fields) return [];
  return Object.keys(selectedViewMeta.value.fields);
});

const whereParamList = computed(() => {
  if (!selectedViewMeta.value?.sql?.whereFields) return [];
  return Object.keys(selectedViewMeta.value.sql.whereFields);
});

const filteredViews = computed(() => {
  if (!searchQuery.value) return store.viewsList;
  const q = searchQuery.value.toLowerCase();
  return store.viewsList.filter(v => v.toLowerCase().includes(q));
});

const isAllSelected = computed(() => {
  return filteredViews.value.length > 0 && filteredViews.value.every(v => selectedViewsList.value.includes(v));
});

const tableColumns = computed(() => {
  if (tableRows.value.length === 0) return [];
  return Object.keys(tableRows.value[0]);
});

const reconstructedSql = computed(() => {
  if (!selectedViewMeta.value) return '';
  return buildSqlFromViewConfig(selectedViewMeta.value);
});

const jsonConfigString = computed(() => {
  if (!selectedViewMeta.value) return '{}';
  return JSON.stringify(selectedViewMeta.value, null, 2);
});

const isFormValid = computed(() => {
  if (!newViewForm.value.name.trim()) return false;
  if (creationMode.value === 'sql') {
    return !!newViewForm.value.sql.trim();
  }
  return !!newViewForm.value.oracleView.trim();
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
  hasCopiedSql.value = false;
  hasCopiedJson.value = false;
}

function toggleViewSelection(name) {
  const idx = selectedViewsList.value.indexOf(name);
  if (idx >= 0) {
    selectedViewsList.value.splice(idx, 1);
  } else {
    selectedViewsList.value.push(name);
  }
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedViewsList.value = selectedViewsList.value.filter(v => !filteredViews.value.includes(v));
  } else {
    const combined = new Set([...selectedViewsList.value, ...filteredViews.value]);
    selectedViewsList.value = Array.from(combined);
  }
}

function clearSelection() {
  selectedViewsList.value = [];
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
    alert('✅ Caché RAM de vistas reiniciada exitosamente en el servidor.');
    await loadViews();
  } catch (err) {
    alert(`❌ Error al reiniciar caché: ${err.message}`);
  } finally {
    isRefreshing.value = false;
  }
}

async function copySql() {
  if (!reconstructedSql.value) return;
  await navigator.clipboard.writeText(reconstructedSql.value);
  hasCopiedSql.value = true;
  setTimeout(() => {
    hasCopiedSql.value = false;
  }, 2000);
}

async function copyJson() {
  if (!jsonConfigString.value) return;
  await navigator.clipboard.writeText(jsonConfigString.value);
  hasCopiedJson.value = true;
  setTimeout(() => {
    hasCopiedJson.value = false;
  }, 2000);
}

function openInStudio() {
  if (!reconstructedSql.value) return;
  store.openInSqlStudio(reconstructedSql.value);
}

function exportCurrentView() {
  if (!selectedView.value) return;
  try {
    store.exportViews([selectedView.value]);
  } catch (err) {
    alert(err.message);
  }
}

function exportViewsAction() {
  try {
    const targets = selectedViewsList.value.length > 0 ? selectedViewsList.value : null;
    const count = store.exportViews(targets);
    alert(`✅ Archivo JSON con ${count} vista(s) descargado exitosamente.`);
  } catch (err) {
    alert(`❌ Error al exportar: ${err.message}`);
  }
}

async function handleImportFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const viewsPayload = (parsed && (parsed.views || parsed.jsonViewMap)) ? (parsed.views || parsed.jsonViewMap) : parsed;
    
    const count = Object.keys(viewsPayload || {}).length;
    if (count === 0) {
      alert('⚠️ El archivo JSON no contiene definiciones de vistas válidas.');
      return;
    }

    if (!confirm(`Se encontraron ${count} vistas en "${file.name}".\n\n¿Deseas importarlas y guardarlas en Oracle (API_VIEW_MAPPER)?`)) {
      return;
    }

    const res = await api.importViewsJson(viewsPayload);
    alert(`✅ ${res.message || `${count} vistas importadas exitosamente.`}`);
    await refreshCache();
  } catch (err) {
    alert(`❌ Error al importar archivo JSON: ${err.message}`);
  } finally {
    event.target.value = '';
  }
}

function openCreateModal() {
  newViewForm.value = {
    name: '',
    description: '',
    sql: '',
    oracleView: ''
  };
  showCreateModal.value = true;
}

async function submitCreateView() {
  if (!isFormValid.value) return;
  isSubmitting.value = true;

  try {
    const payload = {
      viewName: newViewForm.value.name.trim(),
      description: newViewForm.value.description.trim() || undefined
    };

    if (creationMode.value === 'sql') {
      payload.sql = newViewForm.value.sql.trim();
    } else {
      payload.oracleView = newViewForm.value.oracleView.trim();
    }

    const res = await api.saveView(payload);
    alert(`✅ ${res.message || `Vista '${payload.viewName}' creada exitosamente en Oracle.`}`);
    showCreateModal.value = false;
    await api.refreshViews();
    await store.fetchViews();
    selectView(payload.viewName);
  } catch (err) {
    alert(`❌ Error al crear vista: ${err.message}`);
  } finally {
    isSubmitting.value = false;
  }
}

function formatCell(val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}
</script>