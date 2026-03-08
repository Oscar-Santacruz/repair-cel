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

export interface PurchaseOrderItem {
    id?: string
    stock_id: string | null
    description: string
    quantity: number
    unit_cost: number
    total: number
}

export interface PurchaseOrder {
    id: string
    organization_id: string
    supplier_id: string | null
    order_number: string
    invoice_number: string | null
    invoice_date: string | null
    total_amount: number
    payment_status: 'PENDING' | 'PAID'
    notes: string | null
    created_at: string
    suppliers?: { name: string } | null
    purchase_order_items?: PurchaseOrderItem[]
}

async function generateOrderNumber(supabase: ReturnType<typeof createServerClient>, organization_id: string): Promise<string> {
    const { data } = await supabase
        .from('purchase_orders')
        .select('order_number')
        .eq('organization_id', organization_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (!data?.order_number) return 'OC-0001'
    const match = data.order_number.match(/(\d+)$/)
    const next = match ? parseInt(match[1]) + 1 : 1
    return `OC-${String(next).padStart(4, '0')}`
}

export async function getPurchaseOrders(query: string = '') {
    const supabase = await getSupabase()
    const organization_id = await getOrganizationId(supabase)

    let q = supabase
        .from('purchase_orders')
        .select('*, suppliers(name)')
        .eq('organization_id', organization_id)
        .order('created_at', { ascending: false })

    if (query) {
        q = q.or(`order_number.ilike.%${query}%,invoice_number.ilike.%${query}%`)
    }

    const { data, error } = await q
    if (error) { console.error(error); return [] }
    return (data || []) as PurchaseOrder[]
}

export async function getPurchaseOrderById(id: string) {
    const supabase = await getSupabase()
    const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, suppliers(name), purchase_order_items(*)')
        .eq('id', id)
        .maybeSingle()
    if (error || !data) return null
    return data as PurchaseOrder
}

export async function createPurchaseOrderAction(formData: FormData) {
    const supabase = await getSupabase()
    const organization_id = await getOrganizationId(supabase)
    const { data: { user } } = await supabase.auth.getUser()

    // Parse items from form
    const itemsJson = formData.get('items_json') as string
    const items: PurchaseOrderItem[] = JSON.parse(itemsJson || '[]')

    if (items.length === 0) throw new Error('Debe agregar al menos un ítem a la orden.')

    const total_amount = items.reduce((sum, i) => sum + i.total, 0)
    const order_number = await generateOrderNumber(supabase as ReturnType<typeof createServerClient>, organization_id)

    const supplier_id = (formData.get('supplier_id') as string) || null
    const invoice_number = (formData.get('invoice_number') as string) || null
    const invoice_date = (formData.get('invoice_date') as string) || null
    const payment_status = (formData.get('payment_status') as 'PENDING' | 'PAID') || 'PENDING'
    const notes = (formData.get('notes') as string) || null

    // Create the order
    const { data: order, error: orderErr } = await supabase
        .from('purchase_orders')
        .insert({
            organization_id,
            supplier_id,
            order_number,
            invoice_number,
            invoice_date,
            total_amount,
            payment_status,
            notes,
            created_by: user?.id,
        })
        .select()
        .single()

    if (orderErr || !order) throw new Error(`Error al crear orden: ${orderErr?.message}`)

    // Insert items
    const itemsToInsert = items.map(i => ({
        purchase_order_id: order.id,
        stock_id: i.stock_id || null,
        description: i.description,
        quantity: i.quantity,
        unit_cost: i.unit_cost,
    }))

    const { error: itemsErr } = await supabase.from('purchase_order_items').insert(itemsToInsert)
    if (itemsErr) throw new Error(`Error al insertar ítems: ${itemsErr.message}`)

    // Update stock quantities for known stock items
    for (const item of items) {
        if (item.stock_id) {
            await supabase.rpc('increment_stock', { stock_id: item.stock_id, qty: item.quantity })
                .then(async ({ error }) => {
                    if (error) {
                        // Fallback: manual update
                        const { data: current } = await supabase.from('stock').select('quantity').eq('id', item.stock_id!).single()
                        if (current) {
                            await supabase.from('stock').update({ quantity: current.quantity + item.quantity }).eq('id', item.stock_id!)
                        }
                    }
                })
        }
    }

    revalidatePath('/purchases')
    revalidatePath('/inventory')
    redirect(`/purchases/${order.id}`)
}

export async function updatePurchasePaymentStatusAction(id: string, status: 'PENDING' | 'PAID') {
    const supabase = await getSupabase()
    const { error } = await supabase.from('purchase_orders').update({ payment_status: status }).eq('id', id)
    if (error) throw new Error(`Error: ${error.message}`)
    revalidatePath(`/purchases/${id}`)
    revalidatePath('/purchases')
}

export async function deletePurchaseOrderAction(id: string) {
    const supabase = await getSupabase()
    const { error } = await supabase.from('purchase_orders').delete().eq('id', id)
    if (error) throw new Error(`Error al eliminar: ${error.message}`)
    revalidatePath('/purchases')
}
