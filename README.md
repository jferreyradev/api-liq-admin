# 🎛️ API Liquid — Admin Studio (`api-liq-admin`)

Consola de administración, diagnóstico y gestión visual desacoplada para la API de Sueldos y base de datos Oracle 11g (`node-apiliq`).

👉 **[Consulta la Guía Completa de Uso y Manual de la Interfaz](GUIA_DE_USO.md)**

---

## 🚀 Características Principales

1. **📊 Dashboard y Telemetría en Vivo:**
   - Monitoreo en tiempo real del estado de la API (`/api/status`), uptime formateado y versión de Node.
   - Medidor visual del **Pool de Conexiones Oracle (Thick Mode)**: conexiones abiertas, en uso y capacidad máxima para proteger la base de datos de saturación (`ORA-00020`).
   - Botón de comprobación rápida de conectividad hacia Oracle (`SELECT 1 FROM DUAL`).

2. **📋 Catálogo, Reconstrucción SQL y Editor de Vistas:**
   - Explorador de todas las vistas registradas en Oracle (`API_VIEW_MAPPER`).
   - **Reconstructor SQL Automático:** Deduce y muestra el `SELECT ... FROM ... WHERE ...` generado a partir de la definición de cada vista con botón para copiar al portapapeles.
   - **Editor y Creador:** Modificación in situ de vistas (`Editar Vista`) y creación asistida por SQL o por introspección de vistas físicas de Oracle (`+ Nueva Vista`).
   - **Exportación e Importación JSON:** Descarga de catálogos seleccionados o completos e importación en 1 clic.
   - Probador interactivo de consultas con parámetros (`limit`, `offset`, `Periodo`, `IdRep`).
   - Tabla de resultados con visualización formateada y paginación `ROWNUM` nativa de Oracle 11g.
   - Botón para vaciar la memoria RAM (`POST /api/view/refresh`).

3. **⚡ Stored Procedures & Funciones:**
   - Descubrimiento e introspección en tiempo real del esquema PL/SQL en Oracle (`ALL_ARGUMENTS`).
   - Formulario interactivo para enviar parámetros `IN` y ejecutar procedimientos/funciones.
   - Visualización de salidas `OUT`, cursores y detección de errores de negocio vs excepciones de base de datos.

4. **🔍 SQL Studio & Creador de Vistas:**
   - Editor interactivo de sentencias `SELECT` de solo lectura con atajo (`Cmd + Enter` / `Ctrl + Enter`).
   - Botón para guardar automáticamente la consulta como un nuevo endpoint de la API (`POST /api/view/save`), desglosando binds y persistiendo en Oracle sin reiniciar el backend.

5. **📁 Importador Masivo de Tablas (Excel y CSV):**
   - Subida por arrastrar y soltar de archivos `.xlsx`, `.xls` o `.csv` (hasta 50 MB).
   - Previsualización instantánea de columnas y primeras filas de muestra.
   - Ejecución por lotes (`executeMany`) en Oracle con opciones de truncado previo y transacciones atómicas (commit/rollback).

6. **🔑 Conexión Flexible y Segura:**
   - Conexión hacia servidor Local (`http://localhost:3005`), Raspberry Pi o Cloudflare Tunnel.
   - Almacenamiento seguro de `X-Admin-Key` en `localStorage` del navegador.

---

## 🛠️ Tecnologías

- **Framework:** Vue 3 (Composition API `<script setup>`)
- **Empaquetador:** Vite 8.x
- **Estilos:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Iconografía:** `@lucide/vue`
- **Estado:** Pinia

---

## 💻 Puesta en Marcha

### 1. Iniciar en Modo Desarrollo

```bash
cd api-liq-admin
npm install
npm run dev
```

La consola se abrirá en `http://localhost:5173`.

### 2. Compilar para Producción

```bash
npm run build
```

Genera la carpeta `dist/` con archivos estáticos ultralivianos (~46 KB gzipped) listos para desplegar en cualquier servidor (Nginx, Apache, Cloudflare Pages, Vercel o la misma Raspberry Pi).

### 3. Previsualizar Build Localmente

```bash
npm run preview
```
