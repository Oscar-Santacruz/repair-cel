'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getOrganizationId } from '@/lib/auth'
import { StockType } from '@/lib/inventory'

async function getSupabase() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    )
}

export interface StockItem {
    id: string
    organization_id: string
    name: string
    description: string | null
    stock_type: StockType
    category: string | null
    quantity: number
    min_quantity: number
    serial_number: string | null
    price: number | null
    cost_price: number | null
    selling_price: number | null
    brand: string | null
    model_compat: string | null
    sku: string | null
    created_at: string
    updated_at: string
}

export async function getStockItems(
    query: string = '',
    type: string = '',
    page: number = 1,
    limit: number = 20
) {
    const supabase = await getSupabase()
    const organization_id = await getOrganizationId(supabase)
    const offset = (page - 1) * limit

    let q = supabase
        .from('stock')
        .select('*', { count: 'exact' })
        .eq('organization_id', organization_id)
        .order('stock_type', { ascending: true })
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1)

    if (query) {
        q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%,sku.ilike.%${query}%,serial_number.ilike.%${query}%`)
    }
    if (type) {
        q = q.eq('stock_type', type)
    }

    const { data, error, count } = await q

    if (error) {
        console.error('Error fetching stock items:', error)
        return { items: [], totalCount: 0 }
    }

    return { items: (data || []) as StockItem[], totalCount: count || 0 }
}

function parseStockForm(formData: FormData) {
    const stock_type = (formData.get('stock_type') as StockType) || 'REPUESTO'
    return {
        stock_type,
        category: (formData.get('category') as string) || null,
        name: formData.get('name') as string,
        description: (formData.get('description') as string) || null,
        brand: (formData.get('brand') as string) || null,
        model_compat: (formData.get('model_compat') as string) || null,
        sku: (formData.get('sku') as string) || null,
        quantity: parseInt(formData.get('quantity') as string) || 0,
        min_quantity: parseInt(formData.get('min_quantity') as string) || 5,
        serial_number: (formData.get('serial_number') as string) || null,
        cost_price: parseFloat(formData.get('cost_price') as string) || null,
        selling_price: parseFloat(formData.get('selling_price') as string) || null,
        price: parseFloat(formData.get('selling_price') as string) || null,
    }
}

export async function createStockItemAction(formData: FormData) {
    const supabase = await getSupabase()
    const organization_id = await getOrganizationId(supabase)

    const { error } = await supabase.from('stock').insert({
        organization_id,
        ...parseStockForm(formData),
    })

    if (error) throw new Error(`Error al crear: ${error.message}`)

    revalidatePath('/inventory')
    redirect('/inventory')
}

export async function updateStockItemAction(formData: FormData) {
    const supabase = await getSupabase()
    const id = formData.get('id') as string

    const { error } = await supabase.from('stock').update(parseStockForm(formData)).eq('id', id)

    if (error) throw new Error(`Error al actualizar: ${error.message}`)

    revalidatePath('/inventory')
    redirect('/inventory')
}

export async function deleteStockItemAction(id: string) {
    const supabase = await getSupabase()

    const { error } = await supabase.from('stock').delete().eq('id', id)

    if (error) throw new Error(`Error al eliminar: ${error.message}`)

    revalidatePath('/inventory')
}
