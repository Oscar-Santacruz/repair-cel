# agent.md — Guía para Agentes IA (Reparar-Cel)

Este archivo contiene las reglas y el contexto específico que un agente IA **debe leer antes de hacer cualquier cambio** en este repositorio.

## Identidad del Proyecto

**Reparar-Cel** es un sistema de gestión para **talleres de reparación de celulares**.  
NO es un sistema de venta de autos ni de concesionaria. Cualquier referencia a vehículos, autos, o "carsale" que encuentres es un artefacto obsoleto y debe eliminarse.

## Reglas Críticas

### 1. PowerShell no soporta `&&`
Siempre encadenar comandos con:
```
cmd.exe /c "comando1 && comando2 && comando3"
```
Nunca usar `&&` directamente en PowerShell — se produce un error de parser.

### 2. `'use server'` solo exporta async functions
Los archivos `actions.ts` con `'use server'` solo pueden exportar funciones `async`.  
**Tipos, interfaces y constantes van en `lib/[modulo].ts`**, no en `actions.ts`.

```ts
// ❌ INCORRECTO — en actions.ts 'use server'
export const STOCK_TYPE_LABELS = { ... }

// ✅ CORRECTO — en lib/inventory.ts
export const STOCK_TYPE_LABELS = { ... }
```

### 3. RLS y recursión
La función `get_my_organization_id()` existe en Supabase como `SECURITY DEFINER` para evitar recursión en políticas RLS. Usar esta función en nuevas políticas de `profiles`:
```sql
USING (organization_id = public.get_my_organization_id())
```

### 4. Query de perfiles / usuarios
Para leer todos los perfiles de la organización (ej: página `/users`), la columna en `profiles` es:
- `first_name`, `last_name`, `email`, `document_number`, `avatar_url` ← existen
- Si `SUPABASE_SERVICE_ROLE_KEY` está definida, usar el admin client para bypasear RLS

### 5. Columna `full_name` en `clients`
La tabla `clients` usa `full_name`, NO `name`. Al hacer joins: `clients(id, full_name, phone)`.

## Estructura de Navegación (`lib/nav.ts`)

| Grupo | Módulo | Ruta |
|-------|--------|------|
| Taller | Dashboard | `/dashboard-v2` |
| Taller | Recepciones | `/reparations` |
| Taller | Inventario | `/inventory` |
| Taller | Clientes | `/clients` |
| Taller | Proveedores | `/suppliers` |
| Taller | Compras | `/purchases` |
| Finanzas | Punto de Venta | `/pos` |
| Finanzas | Caja | `/caja` |
| Finanzas | Notificaciones | `/notifications` |
| Administración | Usuarios | `/users` |
| Administración | Configuración | `/settings` |

## Tipos de Stock

| Valor | Label | Uso |
|-------|-------|-----|
| `REPUESTO` | Repuesto | Piezas de reparación (pantallas, baterías, etc.) |
| `INSUMO` | Insumo | Consumibles del taller (flux, soldadura, etc.) |
| `PRODUCTO` | Producto para Venta | Artículos que aparecen en el POS |

Solo los ítems tipo `PRODUCTO` con `quantity > 0` aparecen en el Punto de Venta.

## Flujo de Datos

```
Compra (purchase_order) → stock.quantity += n
Venta POS (sale)        → stock.quantity -= n
```

## Variables de Entorno Necesarias

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_DEFAULT_ORG_ID=        # org ID por defecto
SUPABASE_SERVICE_ROLE_KEY=         # opcional pero recomendado para admin operations
```

## Supabase Project ID

`rnipmjmfzndlzovtkqbm` ← este es el proyecto correcto (verificar en `.env.local`)

## Comandos Frecuentes

```bash
# Desarrollo
cmd.exe /c "npm run dev"

# Aplicar migración via MCP
# Usar la herramienta mcp_supabase-mcp-server_apply_migration

# Build de producción
cmd.exe /c "npm run build"
```
