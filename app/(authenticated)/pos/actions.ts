'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getOrganizationId } from '@/lib/auth'

async function getSupabase() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    )
}

export interface SaleCartItem {
    stock_id: string
    description: string
    quantity: number
    unit_price: number
    total: number
}

export interface Sale {
    id: string
    organization_id: string
    client_id: string | null
    invoice_number: string | null
    total_amount: number
    initial_payment: number
    discount: number
    payment_method: string
    sale_notes: string | null
    created_at: string
    clients?: { full_name: string; phone: string | null } | null
    sale_items?: SaleCartItem[]
}

async function generateInvoiceNumber(supabase: ReturnType<typeof createServerClient>, organization_id: string): Promise<string> {
    const { data } = await supabase
        .from('sales')
        .select('invoice_number')
        .eq('organization_id', organization_id)
        .not('invoice_number', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (!data?.invoice_number) return 'FAC-0001'
    const match = data.invoice_number.match(/(\d+)$/)
    const next = match ? parseInt(match[1]) + 1 : 1
    return `FAC-${String(next).padStart(4, '0')}`
}

export async function getSales(query: string = '', page: number = 1, limit: number = 20) {
    const supabase = await getSupabase()
    const organization_id = await getOrganizationId(supabase)
    const offset = (page - 1) * limit

    let q = supabase
        .from('sales')
        .select('*, clients(full_name, phone)', { count: 'exact' })
        .eq('organization_id', organization_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (query) {
        q = q.or(`invoice_number.ilike.%${query}%`)
    }

    const { data, error, count } = await q
    if (error) { console.error(error); return { items: [], totalCount: 0 } }
    return { items: (data || []) as Sale[], totalCount: count || 0 }
}

export async function getSaleById(id: string) {
    const supabase = await getSupabase()
    const { data, error } = await supabase
        .from('sales')
        .select('*, clients(full_name, phone), sale_items(*)')
        .eq('id', id)
        .maybeSingle()
    if (error || !data) return null
    return data as Sale
}

export async function getProductsForPOS(query: string = '') {
    const supabase = await getSupabase()
    const organization_id = await getOrganizationId(supabase)
    let q = supabase
        .from('stock')
        .select('id, name, selling_price, price, quantity, category, brand, sku')
        .eq('organization_id', organization_id)
        .eq('stock_type', 'PRODUCTO')
        .gt('quantity', 0)
        .order('name')

    if (query) q = q.ilike('name', `%${query}%`)

    const { data, error } = await q.limit(50)
    if (error) return []
    return data || []
}

export async function createSaleAction(formData: FormData) {
    const supabase = await getSupabase()
    const organization_id = await getOrganizationId(supabase)
    const { data: { user } } = await supabase.auth.getUser()

    const itemsJson = formData.get('items_json') as string
    const items: SaleCartItem[] = JSON.parse(itemsJson || '[]')
    if (items.length === 0) throw new Error('El carrito está vacío.')

    const client_id = (formData.get('client_id') as string) || null
    const payment_method = (formData.get('payment_method') as string) || 'CASH'
    const discount = parseFloat(formData.get('discount') as string) || 0
    const sale_notes = (formData.get('sale_notes') as string) || null

    const subtotal = items.reduce((s, i) => s + i.total, 0)
    const total_amount = Math.max(0, subtotal - discount)
    const invoice_number = await generateInvoiceNumber(supabase as ReturnType<typeof createServerClient>, organization_id)

    // Create sale record
    const { data: sale, error: saleErr } = await supabase
        .from('sales')
        .insert({
            organization_id,
            client_id,
            invoice_number,
            total_amount,
            initial_payment: total_amount,
            amount_paid: total_amount,
            payment_method,
            discount,
            sale_notes,
            status: 'completed',
        })
        .select()
        .single()

    if (saleErr || !sale) throw new Error(`Error al registrar venta: ${saleErr?.message}`)

    // Insert sale items
    const saleItems = items.map(i => ({
        sale_id: sale.id,
        stock_id: i.stock_id,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
    }))

    const { error: itemsErr } = await supabase.from('sale_items').insert(saleItems)
    if (itemsErr) throw new Error(`Error al insertar ítems: ${itemsErr.message}`)

    // Decrement stock quantities
    for (const item of items) {
        const { data: current } = await supabase.from('stock').select('quantity').eq('id', item.stock_id).single()
        if (current) {
            await supabase.from('stock').update({ quantity: Math.max(0, current.quantity - item.quantity) }).eq('id', item.stock_id)
        }
    }

    revalidatePath('/pos')
    revalidatePath('/inventory')
    revalidatePath('/caja')
    redirect(`/pos/${sale.id}`)
}
