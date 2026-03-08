'use server'

import { cookies } from "next/headers"
import { createServerClient } from '@supabase/ssr'

export async function getClients(query?: string, page: number = 1, limit: number = 20) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { clients: [], count: 0 }

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organization_id = profile?.organization_id

    if (!organization_id) return { clients: [], count: 0 }

    let clientsQuery = supabase
        .from('clients')
        .select('*', { count: 'exact' })
        .eq('organization_id', organization_id)
        .order('created_at', { ascending: false })

    if (query) {
        clientsQuery = clientsQuery.or(`full_name.ilike.%${query}%,document.ilike.%${query}%`)
    }

    const { data: clients, count, error } = await clientsQuery
        .range((page - 1) * limit, page * limit - 1)

    if (error || !clients || clients.length === 0) {
        return {
            clients: clients?.map((c: any) => ({
                ...c,
                reparations_count: 0,
                is_arrears: false,
                last_purchase_date: null,
            })) || [], count: count || 0
        }
    }

    // Step 2: fetch reparations + sales for those clients only
    const clientIds = clients.map((c: any) => c.id)

    // Fetch reparations count
    const { data: reparationsData } = await supabase
        .from('reparations')
        .select('id, client_id')
        .in('client_id', clientIds)

    // Fetch sales to see if they have pending payments
    const { data: salesData } = await supabase
        .from('sales')
        .select('id, client_id, payment_status, created_at')
        .in('client_id', clientIds)

    // Build a map of stats per client_id
    const statsMap: Record<string, {
        reparationsCount: number
        isArrears: boolean
        lastPurchaseDate: string | null
    }> = {}

        ; (reparationsData || []).forEach((rep: any) => {
            const cid = rep.client_id
            if (!statsMap[cid]) {
                statsMap[cid] = { reparationsCount: 0, isArrears: false, lastPurchaseDate: null }
            }
            statsMap[cid].reparationsCount += 1
        })

        ; (salesData || []).forEach((sale: any) => {
            const cid = sale.client_id
            if (!statsMap[cid]) {
                statsMap[cid] = { reparationsCount: 0, isArrears: false, lastPurchaseDate: null }
            }

            if (sale.created_at && (!statsMap[cid].lastPurchaseDate || sale.created_at > statsMap[cid].lastPurchaseDate!)) {
                statsMap[cid].lastPurchaseDate = sale.created_at
            }

            if (sale.payment_status === 'PENDING' || sale.payment_status === 'PARTIAL') {
                statsMap[cid].isArrears = true
            }
        })

    const enrichedClients = clients.map((client: any) => {
        const stats = statsMap[client.id] || { reparationsCount: 0, isArrears: false, lastPurchaseDate: null }
        return {
            ...client,
            reparations_count: stats.reparationsCount,
            is_arrears: stats.isArrears,
            last_purchase_date: stats.lastPurchaseDate,
        }
    })

    return { clients: enrichedClients, count: count || 0 }
}
