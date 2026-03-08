# Auditoría de Seguridad - Fase 2

Este documento resume los hallazgos de la segunda fase de la auditoría de seguridad, enfocada en riesgos lógicos, configuración de políticas y vulnerabilidades potenciales en la arquitectura de la aplicación.

## 1. Gestión de Archivos (Supabase Storage)

**Componente:** `components/ui/file-uploader.tsx`, `components/clients/client-document-manager.tsx`

**Riesgo Identificado (Medio):**
La aplicación utiliza la carga de archivos directamente desde el cliente (`client-side upload`). Esto es una práctica común en Supabase, pero transfiere toda la responsabilidad de seguridad a las **Políticas de Almacenamiento (Storage Policies)** de Supabase.

*   El componente genera nombres de archivo basándose en `Date.now()` y `Math.random()`, lo cual es predecible pero aceptable para archivos no públicos.
*   No existe validación de contenido en el servidor (solo `accept` en el input HTML, que es fácilmente evadible).

**Recomendación:**
Verificar en el Dashboard de Supabase que el bucket `clients` (y cualquier otro bucket público/privado) tenga políticas estrictas:
1.  **Authenticated Uploads Only:** Solo usuarios autenticados deben poder subir archivos.
2.  **MIME Type Restriction:** Restringir los tipos de archivo permitidos a imágenes y documentos seguros (PDF), evitando ejecutables (`.exe`, `.sh`, `.html`).
3.  **Size Limit:** Establecer un límite de tamaño de archivo (ej. 5MB) para evitar denegación de servicio (DoS) por consumo de almacenamiento.
4.  **RLS en `storage.objects`:** Asegurar que los usuarios solo puedan subir/modificar sus propios archivos o los de su organización.

## 2. Escalada de Privilegios (Perfiles y Roles)

**Componente:** `lib/permissions.ts`, `app/user-actions.ts`

**Riesgo Identificado (Alto):**
La seguridad del sistema depende críticamente del campo `role` en la tabla `profiles`.
*   La función `isAdmin()` verifica este rol.
*   Si un usuario malintencionado logra actualizar su propio registro en `profiles` y cambiar su rol a `admin`, tendrá control total del sistema.
*   Por defecto, las políticas RLS a menudo permiten a los usuarios hacer `UPDATE` en su propio perfil (para cambiar nombre, teléfono, etc.).

**Recomendación Crítica:**
Verificar la política RLS de la tabla `profiles` para la operación `UPDATE`:
*   **Debe prohibir explícitamente** la modificación de la columna `role` por parte del propio usuario.
*   Solo un administrador (o una función de base de datos con `security definer`) debería poder cambiar el rol de un usuario.
*   Idealmente, usar columnas separadas o disparadores (triggers) para proteger campos sensibles.

## 3. Funciones RPC Temporales

**Componente:** `scripts/migrate-excel.ts` (Analizado previamente)

**Riesgo Identificado (Crítico si existe):**
En el script de migración se observó la intención de usar una función RPC llamada `execute_sql_hack` (o similar) para ejecutar SQL arbitrario desde el cliente.
Si esta función fue creada en la base de datos para facilitar la migración y no fue borrada, representa una **puerta trasera total** para cualquier usuario autenticado (SQL Injection by design).

**Recomendación:**
Ejecutar el siguiente SQL en el editor de Supabase para verificar y eliminar si existe:
```sql
DROP FUNCTION IF EXISTS execute_sql_hack;
DROP FUNCTION IF EXISTS exec_sql;
-- Verificar cualquier función que tome 'sql' o 'query' como parámetro
```

## 4. Middleware y Rutas Protegidas

**Componente:** `middleware.ts`

**Estado (Seguro):**
El middleware está correctamente configurado para interceptar rutas y redirigir a `/login`.
*   Lista blanca estricta (`publicRoutes`).
*   Protección por defecto para todas las rutas no estáticas.
*   Manejo correcto de redirecciones para usuarios autenticados.

## 5. Dependencias Vulnerables

**Estado (Conocido - Requiere Acción):**
*   **Next.js:** Versión con vulnerabilidades conocidas. Se intentó actualizar, pero persistieron conflictos de dependencia. Se recomienda forzar la actualización (`npm audit fix --force`) en un entorno controlado y probar exhaustivamente.
*   **XLSX:** Librería con vulnerabilidades de Prototype Pollution. Si solo se usa para leer archivos locales de confianza (migración), el riesgo es bajo. Si se usa para leer archivos subidos por usuarios, se recomienda migrar a `exceljs` o similar.

## Resumen de Acciones Inmediatas

1.  [ ] **Verificar RLS de `profiles`:** Asegurar que `role` no sea editable por el usuario.
2.  [ ] **Revisar Buckets:** Configurar tipos MIME permitidos y límites de tamaño.
3.  [ ] **Limpieza DB:** Confirmar inexistencia de funciones RPC de ejecución SQL genérica.
4.  [ ] **Update Deps:** Planificar la actualización de `next` y `xlsx`.
