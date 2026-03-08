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

export interface Supplier {
    id: string
    organization_id: string
    name: string
    ruc_or_document: string | null
    phone: string | null
    email: string | null
    address: string | null
    notes: string | null
    created_at: string
}

export async function getSuppliers(query: string = '') {
    const supabase = await getSupabase()
    const organization_id = await getOrganizationId(supabase)

    let q = supabase
        .from('suppliers')
        .select('*')
        .eq('organization_id', organization_id)
        .order('name')

    if (query) {
        q = q.or(`name.ilike.%${query}%,ruc_or_document.ilike.%${query}%,phone.ilike.%${query}%`)
    }

    const { data, error } = await q
    if (error) { console.error(error); return [] }
    return (data || []) as Supplier[]
}

function parseSupplierForm(formData: FormData) {
    return {
        name: formData.get('name') as string,
        ruc_or_document: (formData.get('ruc_or_document') as string) || null,
        phone: (formData.get('phone') as string) || null,
        email: (formData.get('email') as string) || null,
        address: (formData.get('address') as string) || null,
        notes: (formData.get('notes') as string) || null,
    }
}

export async function createSupplierAction(formData: FormData) {
    const supabase = await getSupabase()
    const organization_id = await getOrganizationId(supabase)

    const { error } = await supabase.from('suppliers').insert({
        organization_id,
        ...parseSupplierForm(formData),
    })

    if (error) throw new Error(`Error al crear proveedor: ${error.message}`)

    revalidatePath('/suppliers')
    redirect('/suppliers')
}

export async function updateSupplierAction(formData: FormData) {
    const supabase = await getSupabase()
    const id = formData.get('id') as string

    const { error } = await supabase.from('suppliers').update(parseSupplierForm(formData)).eq('id', id)

    if (error) throw new Error(`Error al actualizar: ${error.message}`)

    revalidatePath('/suppliers')
    redirect('/suppliers')
}

export async function deleteSupplierAction(id: string) {
    const supabase = await getSupabase()
    const { error } = await supabase.from('suppliers').delete().eq('id', id)
    if (error) throw new Error(`Error al eliminar: ${error.message}`)
    revalidatePath('/suppliers')
}
