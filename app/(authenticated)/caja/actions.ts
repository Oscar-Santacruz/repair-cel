'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getOrganizationId } from '@/lib/auth'

async function getSupabase() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    )
}

export interface CajaMovement {
    id: string
    type: 'VENTA' | 'COMPRA' | 'PAGO_REPARACION'
    description: string
    amount: number
    direction: 'IN' | 'OUT'
    created_at: string
    reference?: string
}

export async function getCajaData(dateFrom: string, dateTo: string) {
    const supabase = await getSupabase()
    const organization_id = await getOrganizationId(supabase)

    // Fetch sales in range (ingress)
    const { data: sales } = await supabase
        .from('sales')
        .select('id, invoice_number, total_amount, payment_method, created_at, clients(full_name)')
        .eq('organization_id', organization_id)
        .gte('created_at', dateFrom + 'T00:00:00')
        .lte('created_at', dateTo + 'T23:59:59')
        .order('created_at', { ascending: false })

    // Fetch purchase orders in range (egress)
    const { data: purchases } = await supabase
        .from('purchase_orders')
        .select('id, order_number, total_amount, payment_status, created_at, suppliers(name)')
        .eq('organization_id', organization_id)
        .eq('payment_status', 'PAID')
        .gte('created_at', dateFrom + 'T00:00:00')
        .lte('created_at', dateTo + 'T23:59:59')
        .order('created_at', { ascending: false })

    const movements: CajaMovement[] = []

    for (const sale of (sales || [])) {
        const client = Array.isArray(sale.clients) ? sale.clients[0] : sale.clients as { full_name: string } | null
        movements.push({
            id: sale.id,
            type: 'VENTA',
            description: `Venta ${sale.invoice_number || ''}${client ? ` — ${client.full_name}` : ''}`,
            amount: sale.total_amount,
            direction: 'IN',
            created_at: sale.created_at,
            reference: sale.invoice_number || undefined,
        })
    }

    for (const purchase of (purchases || [])) {
        const supplier = Array.isArray(purchase.suppliers) ? purchase.suppliers[0] : purchase.suppliers as { name: string } | null
        movements.push({
            id: purchase.id,
            type: 'COMPRA',
            description: `Compra ${purchase.order_number}${supplier ? ` — ${supplier.name}` : ''}`,
            amount: purchase.total_amount,
            direction: 'OUT',
            created_at: purchase.created_at,
            reference: purchase.order_number,
        })
    }

    // Sort by date descending
    movements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const totalIn = movements.filter(m => m.direction === 'IN').reduce((s, m) => s + m.amount, 0)
    const totalOut = movements.filter(m => m.direction === 'OUT').reduce((s, m) => s + m.amount, 0)
    const balance = totalIn - totalOut

    return { movements, totalIn, totalOut, balance }
}
