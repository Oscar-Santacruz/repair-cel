'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getOrganizationId } from '@/lib/auth'
import type { ReparationStatus, Reparation } from '@/lib/reparations'

async function getSupabase() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    )
}

export async function getReparations(query: string = '', status: string = '', page: number = 1, limit: number = 20) {
    const supabase = await getSupabase()
    const organization_id = await getOrganizationId(supabase)
    const offset = (page - 1) * limit

    let q = supabase
        .from('reparations')
        .select('*, clients(full_name, phone, document)', { count: 'exact' })
        .eq('organization_id', organization_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (query) {
        q = q.or(`ticket_number.ilike.%${query}%,device_brand.ilike.%${query}%,device_model.ilike.%${query}%`)
    }
    if (status) {
        q = q.eq('status', status)
    }

    const { data, error, count } = await q

    if (error) {
        console.error('Error fetching reparations:', error)
        return { reparations: [], totalCount: 0 }
    }

    return { reparations: (data || []) as Reparation[], totalCount: count || 0 }
}

async function generateTicketNumber(supabase: Awaited<ReturnType<typeof getSupabase>>, organization_id: string): Promise<string> {
    const { count } = await supabase
        .from('reparations')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization_id)

    const nextNum = ((count || 0) + 1).toString().padStart(4, '0')
    return `TCK-${nextNum}`
}

export async function createReparationAction(formData: FormData) {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const organization_id = await getOrganizationId(supabase)
    const ticket_number = await generateTicketNumber(supabase, organization_id)

    const client_id = formData.get('client_id') as string
    const device_brand = formData.get('device_brand') as string
    const device_model = formData.get('device_model') as string
    const imei_or_serial = (formData.get('imei_or_serial') as string) || null
    const aesthetic_condition = (formData.get('aesthetic_condition') as string) || null
    const budget = formData.get('budget') ? parseFloat(formData.get('budget') as string) : null

    // Parse entry checklist from form
    const checklistKeys = ['wifi', 'bluetooth', 'camera_front', 'camera_back', 'speaker', 'microphone', 'charging_port', 'buttons', 'screen', 'touch']
    const entry_checklist: Record<string, boolean> = {}
    checklistKeys.forEach(key => {
        entry_checklist[key] = formData.get(`checklist_${key}`) === 'true'
    })

    const { data, error } = await supabase.from('reparations').insert({
        organization_id,
        ticket_number,
        client_id,
        received_by: user.id,
        device_brand,
        device_model,
        imei_or_serial,
        aesthetic_condition,
        budget,
        entry_checklist,
        status: 'RECEIVED',
    }).select('id').single()

    if (error) {
        console.error('Error creating reparation:', error)
        throw new Error(`Error al crear la orden: ${error.message}`)
    }

    revalidatePath('/reparations')
    redirect(`/reparations/${data.id}`)
}

export async function updateReparationStatusAction(id: string, status: ReparationStatus) {
    const supabase = await getSupabase()

    const updateData: any = { status }
    if (status === 'DELIVERED') {
        updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase.from('reparations').update(updateData).eq('id', id)

    if (error) {
        console.error('Error updating status:', error)
        throw new Error(`Error al actualizar estado: ${error.message}`)
    }

    revalidatePath('/reparations')
    revalidatePath(`/reparations/${id}`)
}

export async function updateReparationAction(formData: FormData) {
    const supabase = await getSupabase()

    const id = formData.get('id') as string
    const device_brand = formData.get('device_brand') as string
    const device_model = formData.get('device_model') as string
    const imei_or_serial = (formData.get('imei_or_serial') as string) || null
    const aesthetic_condition = (formData.get('aesthetic_condition') as string) || null
    const budget = formData.get('budget') ? parseFloat(formData.get('budget') as string) : null
    const assigned_technician_id = (formData.get('assigned_technician_id') as string) || null

    const { error } = await supabase.from('reparations').update({
        device_brand,
        device_model,
        imei_or_serial,
        aesthetic_condition,
        budget,
        assigned_technician_id,
    }).eq('id', id)

    if (error) {
        throw new Error(`Error al actualizar: ${error.message}`)
    }

    revalidatePath('/reparations')
    revalidatePath(`/reparations/${id}`)
    redirect(`/reparations/${id}`)
}
