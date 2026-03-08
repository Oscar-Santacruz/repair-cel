'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
                set(name: string, value: string, options: any) {
                    cookieStore.set(name, value, options)
                },
                remove(name: string, options: any) {
                    cookieStore.set(name, '', options)
                },
            },
        }
    )
}

export async function getUserOrganizationsAction() {
    const supabase = await getSupabase()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return []

    // Get organizations from user_organizations join table
    const { data, error } = await supabase
        .from('user_organizations')
        .select(`
            id,
            role,
            organization_id,
            organizations (
                id,
                name
            )
        `)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error fetching user organizations:', error)
        // Return empty array instead of throwing so the UI doesn't crash
        return []
    }

    return data ?? []
}

export async function switchOrganizationAction(organizationId: string) {
    const supabase = await getSupabase()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error("Unauthorized")

    // Verify the user belongs to the target organization
    const { data: membership, error: membershipError } = await supabase
        .from('user_organizations')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .single()

    if (membershipError || !membership) {
        throw new Error("No tienes acceso a esta organización")
    }

    // Update active organization in profiles
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            organization_id: organizationId,
            role: membership.role
        })
        .eq('id', user.id)

    if (updateError) {
        throw new Error("Error al cambiar de organización")
    }

    // Revalidate everything
    revalidatePath('/', 'layout')

    return { success: true }
}

export async function createNewOrganizationAction(companyName: string) {
    const supabase = await getSupabase()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error("Unauthorized")

    // 1. Create Organization
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: companyName })
        .select('id')
        .single()

    if (orgError || !org) throw new Error("Error creando la empresa")

    // 2. Create Organization Settings
    await supabase.from('organization_settings').insert({
        organization_id: org.id,
        company_name: companyName,
        created_by: user.id
    })

    // 3. Insert into user_organizations
    await supabase.from('user_organizations').insert({
        user_id: user.id,
        organization_id: org.id,
        role: 'admin'
    })

    // 4. Update Profile to make it active right away
    await supabase.from('profiles').update({
        organization_id: org.id,
        role: 'admin'
    }).eq('id', user.id)

    revalidatePath('/', 'layout')
    return { success: true, organizationId: org.id }
}

