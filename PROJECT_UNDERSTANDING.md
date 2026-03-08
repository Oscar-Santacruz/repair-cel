# Reparar-Cel — Contexto del Proyecto

Este documento está diseñado para que cualquier IA o nuevo desarrollador entienda rápidamente qué es este sistema, su arquitectura y sus reglas de negocio.

## 1. Visión General del Negocio

**Sistema de Gestión Integral para Talleres de Reparación de Celulares.**

Una plataforma web multi-tenant pensada para talleres de reparación de teléfonos móviles. Permite gestionar:

- **Recepciones / Reparaciones:** registro de equipos que ingresan al taller, estado del trabajo, entrega al cliente.
- **Inventario:** repuestos, insumos y productos para venta, con distinción por tipo y categoría.
- **Proveedores y Compras:** registro de facturas de compra, entrada de stock, seguimiento de pagos.
- **Punto de Venta (POS):** venta de productos (accesorios, celulares, fundas, etc.) con carrito interactivo.
- **Caja:** resumen de ingresos y egresos del período.
- **Clientes:** base de clientes con historial.
- **Notificaciones WhatsApp:** envío automático de notificaciones al cliente.
- **Administración:** usuarios, roles, configuración de la organización.

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Lenguaje | TypeScript (strict mode) |
| Base de Datos / Auth | Supabase (PostgreSQL + Auth + RLS) |
| Estilos | Tailwind CSS + PostCSS |
| Componentes UI | Radix UI / shadcn-style components |
| Notificaciones | WhatsApp vía bot (webhook propio) |
| Analytics | PostHog |
| Testing | Playwright (E2E), Vitest (unit) |

## 3. Arquitectura y Estructura de Carpetas

```
/app
  /(authenticated)          ← Rutas protegidas post-login
    /dashboard-v2           ← Dashboard principal
    /reparations            ← Recepciones / reparaciones
    /inventory              ← Stock (repuestos, insumos, productos)
    /suppliers              ← Proveedores
    /purchases              ← Órdenes de compra / facturas de entrada
    /pos                    ← Punto de Venta
    /caja                   ← Movimientos de caja
    /clients                ← Clientes
    /notifications          ← Centro de WhatsApp
    /users                  ← Gestión de usuarios
    /settings               ← Configuración de la organización
  /api                      ← Routes (bot-status, cron, etc.)
  *-actions.ts              ← Server Actions (mutaciones seguras)

/components
  /inventory                ← StockForm, StockList
  /reparations              ← ReparationForm, BrandSelector, ModelSelector
  /suppliers                ← SupplierForm, SuppliersList
  /purchases                ← NewPurchaseForm
  /pos                      ← POSCart
  /notifications            ← NotificationHistory, WhatsappConnectionManager
  /ui                       ← Componentes base reutilizables

/lib
  auth.ts                   ← getOrganizationId() y helpers de auth
  inventory.ts              ← Tipos y constantes de inventario (StockType, etc.)
  reparations.ts            ← Tipos y constantes de reparaciones
  permissions.ts            ← Control de acceso por rol
  nav.ts                    ← Definición del menú de navegación
  phoneModels.ts            ← Base de datos de marcas y modelos de celulares

/supabase
  migrations/               ← Historial DDL completo
  schema.sql                ← Schema consolidado
```

## 4. Modelo de Datos Principal

La base de datos es **multi-tenant** usando `organization_id` en todas las tablas + RLS (Row Level Security).

| Tabla | Descripción |
|-------|-------------|
| `organizations` | Empresas / talleres |
| `profiles` | Usuarios con rol (admin, owner, user, technician, receptionist) |
| `clients` | Clientes del taller |
| `reparations` | Tickets de recepción / reparación |
| `stock` | Inventario (tipo: REPUESTO, INSUMO, PRODUCTO) |
| `suppliers` | Proveedores |
| `purchase_orders` + `purchase_order_items` | Facturas de compra |
| `sales` + `sale_items` | Ventas generadas en el POS |
| `quotes` | Presupuestos |
| `receipts` | Recibos de pago |
| `whatsapp_notifications` | Historial de mensajes enviados |
| `organization_settings` | Configuración por organización |

## 5. Reglas de Negocio Clave

1. **Stock types:** `REPUESTO` (piezas de reparación), `INSUMO` (consumibles del taller), `PRODUCTO` (artículos para vender en el POS).
2. **POS:** Solo muestra ítems de tipo `PRODUCTO` con `quantity > 0`. Al confirmar venta, descuenta automáticamente el stock.
3. **Compras:** Al confirmar una orden de compra, incrementa automáticamente el `quantity` en `stock`.
4. **Auto-numeración:** Órdenes de compra: `OC-0001`, Facturas POS: `FAC-0001`.
5. **RLS:** Toda consulta está filtrada por `organization_id`. Se usa `get_my_organization_id()` (SECURITY DEFINER) para evitar recursión en políticas.
6. **'use server':** Los archivos `actions.ts` solo pueden exportar funciones `async`. Tipos y constantes van en `lib/`.

## 6. Guía para Nuevas Incorporaciones

- **UI:** Usar componentes de `components/ui/`. Mantener el esquema de colores y dark mode.
- **Nuevo módulo:** Crear `app/(authenticated)/[modulo]/actions.ts` (solo async functions), página, y componentes en `components/[modulo]/`.
- **Constantes de un módulo:** Ponerlas en `lib/[modulo].ts`, no en `actions.ts`.
- **DB:** Todo DDL debe ir como migración en `supabase/migrations/`.
- **PowerShell:** Siempre usar `cmd.exe /c "..."` para comandos con `&&`. PowerShell no soporta `&&`.

---
*Última actualización: Marzo 2026*
