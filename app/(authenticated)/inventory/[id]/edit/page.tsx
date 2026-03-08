import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { updateStockItemAction } from "@/app/(authenticated)/inventory/actions"
import { StockForm } from "@/components/inventory/StockForm"

async function getStockItem(id: string) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    )
    const { data, error } = await supabase.from('stock').select('*').eq('id', id).maybeSingle()
    if (error || !data) return null
    return data
}

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EditStockPage({ params }: PageProps) {
    const { id } = await params
    const item = await getStockItem(id)
    if (!item) notFound()

    return (
        <StockForm
            initialData={{
                id: item.id,
                stock_type: item.stock_type || 'REPUESTO',
                category: item.category,
                name: item.name,
                description: item.description,
                quantity: item.quantity,
                min_quantity: item.min_quantity,
                serial_number: item.serial_number,
                cost_price: item.cost_price,
                selling_price: item.selling_price ?? item.price,
                brand: item.brand,
                model_compat: item.model_compat,
                sku: item.sku,
            }}
            action={updateStockItemAction}
            title="Editar Ítem"
            description="Actualizá los datos del ítem de inventario."
            submitLabel="Guardar Cambios"
            cancelHref="/inventory"
        />
    )
}
