'use server'

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getOrganizationId as getUnifiedOrgId } from '@/lib/auth'

function getAdminClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
}

export async function uploadLogoAction(formData: FormData): Promise<string> {
    const supabase = await getSupabase()
    const organization_id = await getOrganizationId(supabase)

    const file = formData.get('file') as File
    if (!file) throw new Error('No file provided')

    const adminClient = getAdminClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${organization_id}/logo-${Date.now()}.${fileExt}`
    const bytes = await file.arrayBuffer()

    const { error } = await adminClient.storage
        .from('logos')
        .upload(fileName, bytes, { contentType: file.type, upsert: true })

    if (error) throw error

    const { data } = adminClient.storage.from('logos').getPublicUrl(fileName)
    return data.publicUrl
}

export async function uploadAvatarAction(formData: FormData): Promise<string> {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const file = formData.get('file') as File
    if (!file) throw new Error('No file provided')

    const adminClient = getAdminClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const bytes = await file.arrayBuffer()

    const { error } = await adminClient.storage
        .from('avatars')
        .upload(fileName, bytes, { contentType: file.type, upsert: true })

    if (error) throw error

    const { data } = adminClient.storage.from('avatars').getPublicUrl(fileName)
    return data.publicUrl
}

// Import deletion actions
import {
    deleteBrandAction as deleteBrandActionFn,
    deleteModelAction as deleteModelActionFn,
    deleteCostConceptAction as deleteCostConceptActionFn,
    deleteVehicleCategoryAction as deleteVehicleCategoryActionFn,
    deleteVehicleTypeAction as deleteVehicleTypeActionFn,
    deletePaymentMethodAction as deletePaymentMethodActionFn,
    deleteTaxAction as deleteTaxActionFn,
    deleteBankAccountAction as deleteBankAccountActionFn,
    deleteCreditorAction as deleteCreditorActionFn,
    getDeletionAuditLog as getDeletionAuditLogFn
} from './deletion-actions'

export async function deleteBrandAction(id: string, reason?: string) { return deleteBrandActionFn(id, reason) }
export async function deleteModelAction(id: string, reason?: string) { return deleteModelActionFn(id, reason) }
export async function deleteCostConceptAction(id: string, reason?: string) { return deleteCostConceptActionFn(id, reason) }
export async function deleteVehicleCategoryAction(id: string, reason?: string) { return deleteVehicleCategoryActionFn(id, reason) }
export async function deleteVehicleTypeAction(id: string, reason?: string) { return deleteVehicleTypeActionFn(id, reason) }
export async function deletePaymentMethodAction(id: string, reason?: string) { return deletePaymentMethodActionFn(id, reason) }
export async function deleteTaxAction(id: string, reason?: string) { return deleteTaxActionFn(id, reason) }
export async function deleteBankAccountAction(id: string, reason?: string) { return deleteBankAccountActionFn(id, reason) }
export async function deleteCreditorAction(id: string, reason?: string) { return deleteCreditorActionFn(id, reason) }
export async function getDeletionAuditLog(tableName?: string, limit: number = 50) { return getDeletionAuditLogFn(tableName, limit) }

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

// Generic helper to get organization
async function getOrganizationId(supabase: any) {
    return getUnifiedOrgId(supabase)
}

// ... existing code ...

export async function getParametricData() {
    const supabase = await getSupabase()

    // Get organization ID to enforce filtering at the application level
    let organization_id: string;
    try {
        organization_id = await getOrganizationId(supabase)
    } catch (e) {
        // Fallback for unauthenticated or first-time setup
        console.warn("Could not determine organization_id in getParametricData", e)
        return { brands: [], models: [], categories: [], types: [], costConcepts: [], paymentMethods: [], taxes: [], creditors: [], orgSettings: null, bankAccounts: [], displacements: [], exteriorColors: [], interiorColors: [], globalBrands: [], globalModels: [], brandPrefs: [], debug: { authError: "No org" } }
    }

    const [
        brands,
        models,
        categories,
        types,
        financialCosts,
        paymentMethods,
        taxes,
        creditors,
        orgSettings,
        bankAccounts,
        displacements,
        exteriorColors,
        interiorColors,
        globalBrands,
        globalModels,
        brandPrefs
    ] = await Promise.all([
        supabase.from('brands').select('*').eq('organization_id', organization_id).order('name'),
        supabase.from('models').select('*, brands(name)').eq('organization_id', organization_id).order('name'),
        supabase.from('vehicle_categories').select('*').eq('organization_id', organization_id).order('name'),
        supabase.from('vehicle_types').select('*').eq('organization_id', organization_id).order('name'),
        supabase.from('cost_concepts').select('*').eq('organization_id', organization_id).order('name'),
        supabase.from('payment_methods').select('*').eq('organization_id', organization_id).order('name'),
        supabase.from('taxes').select('*').eq('organization_id', organization_id).order('name'),
        supabase.from('creditors').select('*').eq('organization_id', organization_id).order('name'),
        supabase.from('organization_settings').select('*').eq('organization_id', organization_id).single(),
        supabase.from('bank_accounts').select('*').eq('organization_id', organization_id).order('created_at'),
        supabase.from('displacements').select('*').eq('organization_id', organization_id).order('name'),
        supabase.from('exterior_colors').select('*').eq('organization_id', organization_id).order('name'),
        supabase.from('interior_colors').select('*').eq('organization_id', organization_id).order('name'),
        supabase.from('global_brands').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('global_models').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('organization_brand_preferences').select('global_brand_id, is_enabled').eq('organization_id', organization_id)
    ])

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Debug info
    let debugInfo: any = {
        authError: authError?.message || null,
        userId: user?.id || null,
        orgId: null,
        profileFound: false
    }

    if (user) {
        const { data: profile, error: profileError } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
        debugInfo.orgId = profile?.organization_id
        debugInfo.profileError = profileError?.message
        debugInfo.profileFound = !!profile
    }

    // Explicitly using the org ID if found, to see if manual query works vs RLS equipo
    // But for now, we leave the queries as is (relying on RLS) to test RLS.

    return {
        brands: brands.data || [],
        models: models.data || [],
        categories: categories.data || [],
        types: types.data || [],
        costConcepts: financialCosts.data || [],
        paymentMethods: paymentMethods.data || [],
        taxes: taxes.data || [],
        creditors: creditors.data || [],
        orgSettings: orgSettings.data || null,
        bankAccounts: bankAccounts.data || [],
        displacements: displacements.data || [],
        exteriorColors: exteriorColors.data || [],
        interiorColors: interiorColors.data || [],
        debug: debugInfo,
        globalBrands: globalBrands.data || [],
        globalModels: globalModels.data || [],
        brandPrefs: brandPrefs.data || []
    }
}

// --- GENERIC ACTIONS (Where structure is simple name/id) ---

export async function saveSimpleItem(table: string, name: string, id?: string) {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    const organization_id = await getOrganizationId(supabase)

    // Sanitize ID
    if (id === '$undefined' || id === 'undefined' || id === 'null') {
        id = undefined
    }

    // Check for duplicate name in the same organization
    const { data: existing } = await supabase
        .from(table)
        .select('id')
        .eq('organization_id', organization_id)
        .ilike('name', name)
        .neq('id', id || '00000000-0000-0000-0000-000000000000') // Exclude current item if editing
        .single()

    if (existing) {
        throw new Error(`Ya existe un registro con el nombre "${name}" en esta organización`)
    }

    // Use admin client to bypass RLS for writes -- REVERTED due to missing key
    // Falling back to standard client.
    // The real fix is ensuring the user has organization_id in profiles.

    if (id) {
        const { error } = await supabase.from(table).update({ name, updated_by: user?.id }).eq('id', id).eq('organization_id', organization_id)
        if (error) throw new Error(error.message)
    } else {
        const { error } = await supabase.from(table).insert({ name, organization_id, created_by: user?.id })
        if (error) throw new Error(error.message)
    }
    revalidatePath('/settings')
    return { success: true }
}

// --- SPECIFIC ACTIONS (For complex tables) ---

export async function saveModel(name: string, brandId?: string, id?: string) {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    const organization_id = await getOrganizationId(supabase)

    // Check for duplicate model name in the same organization
    const { data: existing } = await supabase
        .from('models')
        .select('id')
        .eq('organization_id', organization_id)
        .ilike('name', name)
        .neq('id', id || '00000000-0000-0000-0000-000000000000') // Exclude current item if editing
        .single()

    if (existing) {
        throw new Error(`Ya existe un modelo con el nombre "${name}" en esta organización`)
    }

    const data: any = { name, organization_id }
    if (brandId) data.brand_id = brandId

    if (id) {
        const { error } = await supabase.from('models').update({ ...data, updated_by: user?.id }).eq('id', id).eq('organization_id', organization_id)
        if (error) throw error
    } else {
        const { error } = await supabase.from('models').insert({ ...data, created_by: user?.id })
        if (error) throw error
    }
    revalidatePath('/settings')
}

export async function saveTax(name: string, rate: number, id?: string) {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    const organization_id = await getOrganizationId(supabase)

    const data = { name, rate, organization_id }

    if (id) {
        await supabase.from('taxes').update({ ...data, updated_by: user?.id }).eq('id', id).eq('organization_id', organization_id)
    } else {
        await supabase.from('taxes').insert({ ...data, created_by: user?.id })
    }
    revalidatePath('/settings')
}

export async function saveCollectionSettings(defaultPenalty: number, penaltyDays: number, id?: string) {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    const organization_id = await getOrganizationId(supabase)

    const data = {
        organization_id,
        default_penalty_amount: defaultPenalty,
        penalty_grace_days: penaltyDays
    }

    if (id) {
        await supabase.from('organization_settings').update({ ...data, updated_by: user?.id }).eq('id', id).eq('organization_id', organization_id)
    } else {
        await supabase.from('organization_settings').insert({ ...data, created_by: user?.id })
    }
    revalidatePath('/settings')
}



export async function saveCompanyDetails(
    id?: string,
    companyName?: string,
    ruc?: string,
    address?: string,
    phone?: string,
    email?: string,
    website?: string,
    logoUrl?: string
) {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    const organization_id = await getOrganizationId(supabase)

    const data = {
        organization_id,
        company_name: companyName,
        ruc,
        address,
        phone,
        email,
        website,
        logo_url: logoUrl
    }

    if (id) {
        await supabase.from('organization_settings').update({ ...data, updated_by: user?.id }).eq('id', id).eq('organization_id', organization_id)
    } else {
        await supabase.from('organization_settings').insert({ ...data, created_by: user?.id })
    }
    revalidatePath('/settings')
}

export async function saveChassisSettings(chassisRequired: boolean, chassisUnique: boolean, id?: string) {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    const organization_id = await getOrganizationId(supabase)

    const data = {
        organization_id,
        chassis_required: chassisRequired,
        chassis_unique: chassisUnique
    }

    if (id) {
        await supabase.from('organization_settings').update({ ...data, updated_by: user?.id }).eq('id', id).eq('organization_id', organization_id)
    } else {
        await supabase.from('organization_settings').insert({ ...data, created_by: user?.id })
    }
    revalidatePath('/settings')
}

export async function saveBankAccount(data: any, id?: string) {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    const organization_id = await getOrganizationId(supabase)

    const payload = {
        ...data,
        organization_id
    }

    if (id) {
        await supabase.from('bank_accounts').update({ ...payload, updated_by: user?.id }).eq('id', id).eq('organization_id', organization_id)
    } else {
        await supabase.from('bank_accounts').insert({ ...payload, created_by: user?.id })
    }
    revalidatePath('/settings')
}

// ============================================================================
// DISPLACEMENTS
// ============================================================================
export async function saveDisplacement(name: string, id?: string) {
    return saveSimpleItem('displacements', name, id)
}

export async function deleteDisplacement(id: string) {
    const supabase = await getSupabase()
    const organization_id = await getOrganizationId(supabase)
    const { error } = await supabase.from('displacements').delete().eq('id', id).eq('organization_id', organization_id)
    if (error) throw new Error(error.message)
    revalidatePath('/settings')
    return { success: true }
}

// ============================================================================
// EXTERIOR COLORS
// ============================================================================
export async function saveExteriorColor(name: string, id?: string) {
    return saveSimpleItem('exterior_colors', name, id)
}

export async function deleteExteriorColor(id: string) {
    const supabase = await getSupabase()
    const organization_id = await getOrganizationId(supabase)
    const { error } = await supabase.from('exterior_colors').delete().eq('id', id).eq('organization_id', organization_id)
    if (error) throw new Error(error.message)
    revalidatePath('/settings')
    return { success: true }
}

// ============================================================================
// INTERIOR COLORS
// ============================================================================
export async function saveInteriorColor(name: string, id?: string) {
    return saveSimpleItem('interior_colors', name, id)
}

export async function deleteInteriorColor(id: string) {
    const supabase = await getSupabase()
    const organization_id = await getOrganizationId(supabase)
    const { error } = await supabase.from('interior_colors').delete().eq('id', id).eq('organization_id', organization_id)
    if (error) throw new Error(error.message)
    revalidatePath('/settings')
    return { success: true }
}
