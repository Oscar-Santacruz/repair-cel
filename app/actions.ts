'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/permissions'
import { logAuditAction } from '@/lib/audit'
import { getOrganizationId } from '@/lib/auth'

async function getSupabase() {
    const cookieStore = await cookies()
    return createServerClient(
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
}

export async function createClientAction(formData: FormData) {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Unified Organization Resolution
    const organization_id = await getOrganizationId(supabase)

    const full_name = (formData.get('full_name') as string).toUpperCase()
    const document = (formData.get('document') as string) || null
    const phone = (formData.get('phone') as string) || null
    const email = (formData.get('email') as string) || null
    const address = (formData.get('address') as string) || null

    const { error } = await supabase.from('clients').insert({
        organization_id,
        full_name,
        document,
        phone,
        email,
        address
    })

    if (error) {
        console.error('Supabase error creating client:', error)
        throw new Error(`Failed to create client: ${error.message} (Code: ${error.code})`)
    }

    redirect('/clients')
}

export async function updateClientAction(formData: FormData) {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const id = formData.get('id') as string
    const full_name = (formData.get('full_name') as string).toUpperCase()
    const document = (formData.get('document') as string) || null
    const phone = (formData.get('phone') as string) || null
    const email = (formData.get('email') as string) || null
    const address = (formData.get('address') as string) || null

    const { error } = await supabase.from('clients').update({
        full_name,
        document,
        phone,
        email,
        address
    }).eq('id', id)

    if (error) {
        console.error('Supabase error updating client:', error)
        throw new Error(`Failed to update client: ${error.message}`)
    }

    revalidatePath('/clients')
    revalidatePath(`/clients/${id}`)
    redirect(`/clients/${id}`)
}

export async function createVehicleAction(formData: FormData) {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")
    // Unified Organization Resolution
    const organization_id = await getOrganizationId(supabase)

    const cod = formData.get('cod') as string
    const brand = formData.get('brand') as string
    const model = formData.get('model') as string
    const year = Number(formData.get('year'))
    const plate = formData.get('plate') as string
    const price = Number(formData.get('price'))
    const status = formData.get('status') as string

    const { error } = await supabase.from('equipos').insert({
        organization_id,
        cod,
        brand,
        model,
        year,
        plate,
        list_price: price,
        status,
        created_by: user.id
    })

    if (error) {
        console.error('Supabase error creating equipo:', error)
        throw new Error(`Failed to create equipo: ${error.message} (Code: ${error.code})`)
    }

    redirect('/inventory')
}

export async function updateVehicleAction(formData: FormData) {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const id = formData.get('id') as string

    // Check if equipo is sold
    const { data: currentVehicle } = await supabase.from('equipos').select('status').eq('id', id).single()
    if (currentVehicle?.status === 'sold') {
        throw new Error("No se puede modificar un equipos que ya ha sido vendido.")
    }

    const cod = formData.get('cod') as string
    const brand = formData.get('brand') as string
    const model = formData.get('model') as string
    const year = Number(formData.get('year'))
    const plate = formData.get('plate') as string
    const price = Number(formData.get('price'))
    const status = formData.get('status') as string

    const { error } = await supabase.from('equipos').update({
        cod,
        brand,
        model,
        year,
        plate,
        list_price: price,
        status,
        updated_by: user.id
    }).eq('id', id)

    if (error) {
        console.error('Supabase error updating equipo:', error)
        throw new Error(`Failed to update equipo: ${error.message}`)
    }

    revalidatePath('/inventory')
    revalidatePath(`/inventory/${id}`)
    redirect(`/inventory/${id}`)
}

export async function deactivateClientAction(clientId: string) {
    const user = await requireAdmin() // requireAdmin should now return the user for logging
    const supabase = await getSupabase()

    // Get client details for log before update? Or just log ID.
    // Let's perform update first.

    const { error } = await supabase
        .from('clients')
        .update({ is_active: false })
        .eq('id', clientId)

    if (error) {
        console.error('Error deactivating client:', error)
        throw new Error(`Failed to deactivate client: ${error.message}`)
    }

    await logAuditAction(
        user.id,
        'DEACTIVATE_CLIENT',
        'clients',
        clientId,
        { timestamp: new Date().toISOString() }
    )

    revalidatePath('/clients')
    revalidatePath(`/clients/${clientId}`)
}
