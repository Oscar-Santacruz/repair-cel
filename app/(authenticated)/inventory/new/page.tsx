'use client'

import { createStockItemAction } from "@/app/(authenticated)/inventory/actions"
import { StockForm } from "@/components/inventory/StockForm"

export default function NewStockPage() {
    return (
        <StockForm
            action={createStockItemAction}
            title="Nueva Refacción"
            description="Ingrese los datos de la pieza o insumo para agregar al inventario."
            submitLabel="Guardar Refacción"
            cancelHref="/inventory"
        />
    )
}
