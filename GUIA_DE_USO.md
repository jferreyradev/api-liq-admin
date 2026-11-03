# 📖 Manual y Guía de Uso — `api-liq-admin`

Esta guía detalla el funcionamiento paso a paso de cada módulo de la consola de administración `api-liq-admin`, diseñada para interactuar con el backend de sueldos `node-apiliq` y bases de datos Oracle 11g.

---

## 🧭 Índice
1. [Autenticación y Configuración Inicial](#1-autenticación-y-configuración-inicial)
2. [Dashboard y Telemetría de Oracle](#2-dashboard-y-telemetría-de-oracle)
3. [Catálogo de Vistas Dinámicas (`ViewsManager`)](#3-catálogo-de-vistas-dinámicas)
   - [Probar Datos en Vivo](#31-probar-datos-en-vivo)
   - [Sentencia SQL Reconstruida](#32-sentencia-sql-reconstruida)
   - [Editar una Vista Existente](#33-editar-una-vista-existente)
   - [Crear una Nueva Vista](#34-crear-una-nueva-vista)
   - [Exportar e Importar Catálogos JSON](#35-exportar-e-importar-catálogos-json)
4. [SQL Studio & Creador de Vistas](#4-sql-studio--creador-de-vistas)
5. [Procedimientos y Funciones PL/SQL](#5-procedimientos-y-funciones-plsql)
6. [Carga Masiva de Tablas (Excel y CSV)](#6-carga-masiva-de-tablas-excel-y-csv)
7. [Reglas Clave del Negocio (Sueldos)](#7-reglas-clave-del-negocio-sueldos)

---

## 1. Autenticación y Configuración Inicial

Para proteger las operaciones que alteran datos o esquemas en Oracle, la API utiliza la clave administrativa `X-Admin-Key`.

1. En la barra superior (Navbar), haz clic en el ícono de engranaje **`⚙️ Configuración`**.
2. **URL Base de la API:** Puedes alternar entre producción (`https://api-rpi.liqsysonline.com`) o desarrollo local (`http://localhost:3005`).
3. **Clave de Administrador (`X-Admin-Key`):** Ingresa la clave administrativa correspondiente a la API (definida en la variable `ADMIN_ACCESS_KEY` del backend).
4. Haz clic en **"Guardar Configuración"**.
   > La clave queda almacenada en el `localStorage` de tu navegador de manera persistente.

---

## 2. Dashboard y Telemetría de Oracle

En la vista principal **Dashboard**:
- **Medidor de Conexiones del Pool Oracle 11g:** 
  - `connectionsOpen`: Conexiones físicas activas con el servidor Oracle.
  - `connectionsInUse`: Conexiones atendiendo peticiones concurrentes en este instante.
- **Botón "Probar Conexión con Oracle":** Ejecuta un `SELECT 1 FROM DUAL` para medir la latencia y comprobar que la base de datos responda.
- **Uptime:** Tiempo transcurrido desde el último inicio del proceso Node.js.

---

## 3. Catálogo de Vistas Dinámicas

Módulo para consultar, probar y gestionar la tabla `API_VIEW_MAPPER` de Oracle.

### 3.1. Probar Datos en Vivo
1. Selecciona cualquier vista de la lista lateral izquierda.
2. En la pestaña **"Datos en Vivo"**, configura los parámetros:
   - **Límite (`limit`):** Cantidad de filas a traer (ej: 25, 50).
   - **Desplazamiento (`offset`):** Paginación base 0.
   - **Periodo:** Formato obligatorio `01/MM/YYYY` (ej: `01/09/2026`).
   - **Repartición (`IdRep`):** Código de repartición numérico opcional.
3. Presiona **"Ejecutar Query"** para ver la tabla de datos en tiempo real con paginación nativa `ROWNUM`.

### 3.2. Sentencia SQL Reconstruida
1. Haz clic en la pestaña **"Sentencia SQL Reconstruida"**.
2. El sistema deduce y muestra la consulta SQL legible (`SELECT ... FROM ... WHERE ... GROUP BY ...`).
3. Botones disponibles:
   - **Copiar SQL:** Copia la consulta al portapapeles.
   - **Abrir en SQL Studio:** Envía la sentencia al editor interactivo para modificarla o probarla libremente.

### 3.3. Editar una Vista Existente
1. Con la vista seleccionada, presiona el botón **`Editar Vista`** (ícono de lápiz en la cabecera).
2. Se abrirá el modal con:
   - El nombre de la vista (bloqueado como clave primaria).
   - La descripción actual.
   - La consulta SQL reconstruida.
3. Modifica las columnas, joins o condiciones del `WHERE`.
4. Haz clic en **"Actualizar Vista en Oracle"**. El servidor actualizará la tabla `API_VIEW_MAPPER`, vaciará la memoria RAM y recargará el catálogo al instante.

### 3.4. Crear una Nueva Vista
1. En el encabezado presiona el botón **`+ Nueva Vista`**.
2. Elige el método de creación:
   - **Modo 1 (Consulta SQL):** Escribes el nombre del endpoint (ej: `empleadosActivos`) y tu consulta `SELECT`. Binds como `:Periodo` o `:IdRep` se convierten automáticamente en parámetros aceptados por la URL HTTP.
   - **Modo 2 (Tabla o Vista Física de Oracle):** Ingresas el nombre físico en la base de datos (ej: `V_HISTORIAL_RECIBOS` o `CARGOS`). El backend consulta `ALL_TAB_COLS` y mapea todas las columnas automáticamente.
3. Presiona **"Guardar Vista en Oracle"**.

### 3.5. Exportar e Importar Catálogos JSON
- **Exportar Vista Actual:** Botón **"Exportar"** en la cabecera de la vista activa.
- **Exportación Masiva o Completa:** Marca las casillas de verificación (checkboxes) de las vistas deseadas en la lista izquierda y presiona **"Exportar (N)"** o **"Exportar Todas"**. Descarga un archivo `.json` con la definición y el SQL de cada una.
- **Importar JSON:** Haz clic en **"Importar JSON"** para subir un archivo `.json` exportado previamente y registrar todas las vistas en bloque en Oracle.

---

## 4. SQL Studio & Creador de Vistas

Consola interactiva para escribir y probar consultas directamente contra la base de datos:
1. Escribe cualquier sentencia de lectura `SELECT` o `WITH` en el editor.
2. Atajos de teclado:
   - Mac: `Cmd + Enter`
   - Windows/Linux: `Ctrl + Enter`
3. Usa el desplegable **"Cargar Consulta Ejemplo..."** para ver patrones comunes (nóminas, conceptos, binds).
4. **Convertir en Endpoint:** Si la consulta que probaste arroja los datos esperados, haz clic en **"Guardar como Vista de la API"**, dale un nombre y quedará disponible de inmediato como endpoint `GET /api/view/<nombre>`.

---

## 5. Procedimientos y Funciones PL/SQL

1. **Sincronización:** El botón **"Sincronizar desde Oracle"** ejecuta introspección en `ALL_ARGUMENTS` y detecta nuevos procedimientos del paquete de liquidación (`MOD_LIQUIDACION`).
2. **Ejecución de Pruebas:**
   - Selecciona un procedimiento o función.
   - Completa los valores de los parámetros de entrada (`IN`).
   - Presiona **"Ejecutar Procedimiento"**.
   - La pantalla mostrará el tiempo de ejecución en milisegundos, el bloque PL/SQL invocado y los valores o cursores de salida (`OUT`).

---

## 6. Carga Masiva de Tablas (Excel y CSV)

1. Arrastra tu archivo `.xlsx`, `.xls` o `.csv` al área punteada (hasta 50 MB).
2. El sistema mostrará las columnas detectadas y una muestra de 10 filas.
3. Selecciona la tabla de destino en Oracle (ej: `HOJA_NOVEDADES`).
4. Asocia las columnas de tu archivo con las columnas de Oracle.
5. Elige si deseas truncar la tabla previamente o insertar acumulativamente.
6. Presiona **"Ejecutar Inserción Masiva"**. La API utilizará `executeMany` para insertar miles de filas por segundo dentro de una transacción segura.

---

## 7. Reglas Clave del Negocio (Sueldos)

> [!IMPORTANT]
> **Regla Obligatoria del Día 01:**
> En toda esta API, cualquier parámetro o filtro que represente un período (`Periodo`, `PeriodoLiq`, `vPERIODO`, `PeriodoDDJJ`) utiliza **SIEMPRE el día 01 del mes** en formato `01/MM/YYYY`.
> 
> *Ejemplos válidos:* `01/09/2026`, `01/10/2026`.

---

## 8. Seguridad y Gestión de Usuarios

### 8.1. Auto-Logout por Inactividad (Frontend)
- Si dejas la aplicación abierta sin interactuar (sin movimientos de mouse, clics ni teclas) durante **30 minutos**, la sesión se cerrará de forma automática.
- Las credenciales (`X-Admin-Key`) se borran de la memoria y del `localStorage`.
- Aparecerá un cuadro de diálogo informando el cierre por seguridad, permitiéndote **Reconectar Administrador** o continuar en modo lectura.

### 8.2. Rate Limiting Anti-Fuerza Bruta (Backend)
- **Rutas de Autenticación y Administración (`/api/admin/*`, `/api/auth/login`, `/adduser`):**
  - Limitadas a un máximo de **15 peticiones por minuto por IP**.
  - Si un script intenta adivinar contraseñas, la API responderá con `HTTP 429 Too Many Requests` y cabecera `Retry-After: 60`.
- **Rutas Generales (`/api/*`):**
  - Limitadas a **300 peticiones por minuto por IP** para evitar sobrecarga del pool de Oracle.

### 8.3. Login para el Panel de Gestión (Multi-Usuario Masivo)
Para los operadores municipales o usuarios del sistema de gestión de sueldos:

* **Endpoint:** `POST /api/auth/login` (o `POST /login`)
* **Headers:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "usr": "operador_trancas",
    "pws": "contraseña_segura"
  }
  ```
* **Respuesta Exitosa (`HTTP 200`):**
  ```json
  {
    "status": "ok",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresInSeconds": 28800,
    "user": {
      "id": 5,
      "usr": "operador_trancas",
      "email": "operador@municipio.gov.ar",
      "role": 2
    }
  }
  ```
* **Uso del Token:** El Panel de Gestión guarda ese `token` y lo envía en las consultas subsecuentes:
  ```http
  Authorization: Bearer <token>
  ```

### 8.4. Dar de Alta Nuevos Usuarios
Para registrar nuevos usuarios en la base de datos Oracle (`US_SUELDO.USUARIOS`):
* **Endpoint:** `POST /adduser`
* **Headers:** 
  - `Content-Type: application/json`
  - `X-Admin-Key: <clave_admin>`
* **Body:**
  ```json
  {
    "usr": "nuevo_usuario",
    "pws": "clave123",
    "email": "usuario@municipio.gov.ar",
    "idrol": 2
  }
  ```
La contraseña se almacena automáticamente cifrada con `bcryptjs` en Oracle.
