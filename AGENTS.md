# AGENTS.md — Contexto y Guía Técnica: api-liq-admin

Este documento permite que cualquier agente de IA en una nueva sesión o workspace entienda de inmediato la arquitectura, objetivos y conexión del frontend `api-liq-admin`.

---

## 🧭 1. Resumen del Proyecto y Stack Tecnológico

* **Nombre del Proyecto:** `api-liq-admin`
* **Propósito:** Consola de administración, telemetría y gestión desacoplada para la API de Liquidación de Sueldos y base de datos Oracle 11g (`node-apiliq`).
* **Framework:** **Vue 3** (Composition API `<script setup>`).
* **Empaquetador:** **Vite 8.x**.
* **Estilos:** **Tailwind CSS v4** (`@tailwindcss/vite`).
* **Iconografía:** **`@lucide/vue`**.
* **Gestión de Estado:** **Pinia** (`src/stores/adminStore.js`).
* **Backend de Producción Conectado:** `https://api-rpi.liqsysonline.com` (Raspberry Pi a través de Cloudflare Tunnel).
* **Backend de Desarrollo Local:** `http://localhost:3005`.

---

## 🏗️ 2. Arquitectura de Componentes

```text
api-liq-admin/
├── src/
│   ├── components/
│   │   ├── Navbar.vue           # Barra superior con estado en vivo y selector de entorno
│   │   ├── Sidebar.vue          # Menú lateral de navegación con conteos dinámicos
│   │   ├── Dashboard.vue        # Métricas en vivo (Uptime, Node version, medidor de Pool Oracle 11g)
│   │   ├── ViewsManager.vue     # Catálogo interactivo de vistas maestras con paginación ROWNUM
│   │   ├── ProceduresManager.vue# Introspección y ejecución de Stored Procedures y Funciones PL/SQL
│   │   ├── SqlStudio.vue        # Editor SELECT interactivo con auto-conversión a endpoints
│   │   ├── ImporterManager.vue  # Carga masiva por lotes (Excel/CSV) con mapeo visual
│   │   └── SettingsModal.vue    # Configuración de URL base y X-Admin-Key persistidos en localStorage
│   ├── services/
│   │   └── api.js               # Cliente HTTP desacoplado con inyección de X-Admin-Key
│   ├── stores/
│   │   └── adminStore.js        # Store central Pinia con caché de vistas, procedimientos y pool
│   ├── App.vue                  # Layout principal SPA
│   ├── main.js                  # Inicialización de Vue + Pinia
│   └── style.css                # Importación de Tailwind CSS v4
├── index.html                   # HTML base de la SPA
├── vite.config.js               # Configuración de Vite con plugin Vue y Tailwind
├── package.json                 # Dependencias limpias (0 vulnerabilidades)
└── .env                         # VITE_API_URL=https://api-rpi.liqsysonline.com
```

---

## 🔑 3. Flujos Clave y Endpoints de la API Consumidos

1. **Telemetría y Salud:**
   - `GET /api/status`: Público, devuelve estado, uptime formateado y métricas del pool de Oracle.
   - `GET /api/admin/pool-status`: Detalle completo del pool de conexiones Oracle (`X-Admin-Key`).
   - `GET /api/admin/health?testDb=true`: Comprueba conectividad real contra Oracle (`SELECT 1 FROM DUAL`).

2. **Vistas Maestras:**
   - `GET /api/view/list`: Lista todas las vistas disponibles.
   - `GET /api/view/:name?limit=25&offset=0&Periodo=01/MM/YYYY`: Consulta con paginación ROWNUM.
   - `POST /api/view/save`: Guarda una consulta SQL como vista permanente (`X-Admin-Key`).
   - `POST /api/view/refresh`: Reinicia la memoria RAM del backend (`X-Admin-Key`).

3. **Stored Procedures y Funciones:**
   - `GET /api/sp/list` y `GET /api/fn/list`: Catálogo de procedimientos y funciones.
   - `POST /api/sp/sync-oracle`: Introspección en vivo desde `ALL_ARGUMENTS` (`X-Admin-Key`).
   - `POST /api/sp/:name` y `POST /api/fn/:name`: Ejecución de llamadas PL/SQL con binds dinámicos.

4. **Carga Masiva (Excel / CSV):**
   - `POST /api/import/preview`: Recibe archivo binario y retorna columnas + 10 filas de muestra.
   - `POST /api/import/execute`: Ejecuta `executeMany` por lotes en Oracle.

---

## 🧪 4. Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo (puerto 5173)
npm run dev

# Compilar para producción (carpeta dist/)
npm run build

# Previsualizar build de producción
npm run preview
```
