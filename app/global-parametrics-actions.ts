'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getOrganizationId } from '@/lib/auth'
import { reportError } from '@/lib/logger'

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

async function getOrgId(supabase: any): Promise<string> {
    return getOrganizationId(supabase)
}

// ===========================
// GLOBAL BRANDS
// ===========================

export interface GlobalBrand {
    id: string
    name: string
    slug: string
    logo_url: string | null
    sort_order: number
    is_enabled: boolean   // per-org preference
    usage_count: number   // how many equipos this org has with this brand
}

/**
 * Get global brands filtered and ordered by org preferences.
 * Returns all active global brands, with is_enabled=true for those the org hasn't disabled,
 * sorted by usage in that org (most used first), then by default sort_order.
 */
export async function getGlobalBrandsForOrg(): Promise<GlobalBrand[]> {
    try {
        const supabase = await getSupabase()
        const orgId = await getOrgId(supabase)

        const [brandsResult, prefsResult, usageResult] = await Promise.all([
            supabase
                .from('global_brands')
                .select('*')
                .eq('is_active', true)
                .order('sort_order'),
            supabase
                .from('organization_brand_preferences')
                .select('global_brand_id, is_enabled')
                .eq('organization_id', orgId),
            // Count usage per global brand slug
            supabase
                .from('equipos')
                .select('global_brand_id')
                .eq('organization_id', orgId)
                .is('deleted_at', null),
        ])

        if (brandsResult.error) throw brandsResult.error
        if (prefsResult.error) throw prefsResult.error
        if (usageResult.error) throw usageResult.error

        const brands: any[] = brandsResult.data || []
        const prefs: any[] = prefsResult.data || []
        const equipos: any[] = usageResult.data || []

        // Build preference map
        const prefMap = new Map<string, boolean>()
        for (const p of prefs) {
            prefMap.set(p.global_brand_id, p.is_enabled)
        }

        // Build usage count by global_brand_id
        const usageMap = new Map<string, number>()
        for (const v of equipos) {
            const gbId = v.global_brand_id
            if (gbId) {
                usageMap.set(gbId, (usageMap.get(gbId) || 0) + 1)
            }
        }

        const result: GlobalBrand[] = brands.map((b: any) => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
            logo_url: b.logo_url,
            sort_order: b.sort_order,
            is_enabled: prefMap.has(b.id) ? prefMap.get(b.id)! : true, // default enabled
            usage_count: usageMap.get(b.id) || 0,
        }))

        // Sort: most used first, then by default sort_order
        result.sort((a, b) => {
            if (b.usage_count !== a.usage_count) return b.usage_count - a.usage_count
            return a.sort_order - b.sort_order
        })

        return result
    } catch (error) {
        await reportError(error, 'getGlobalBrandsForOrg')
        throw error
    }
}

/**
 * Toggle whether a global brand is enabled for the current org.
 */
export async function toggleOrgBrandPreference(globalBrandId: string, isEnabled: boolean) {
    try {
        const supabase = await getSupabase()
        const orgId = await getOrgId(supabase)

        const { error } = await supabase
            .from('organization_brand_preferences')
            .upsert({
                organization_id: orgId,
                global_brand_id: globalBrandId,
                is_enabled: isEnabled,
            }, { onConflict: 'organization_id,global_brand_id' })

        if (error) throw error

        revalidatePath('/settings')
        return { success: true }
    } catch (error) {
        await reportError(error, 'toggleOrgBrandPreference')
        throw error
    }
}

// ===========================
// GLOBAL COLORS
// ===========================

export interface GlobalColor {
    id: string
    name: string
    hex_code: string
    category: 'exterior' | 'interior' | 'both'
    sort_order: number
    is_enabled: boolean  // per-org preference
}

/**
 * Get global colors filtered by org preferences.
 */
export async function getGlobalColorsForOrg(): Promise<{ exterior: GlobalColor[], interior: GlobalColor[] }> {
    try {
        const supabase = await getSupabase()
        const orgId = await getOrgId(supabase)

        const [colorsResult, prefsResult] = await Promise.all([
            supabase
                .from('global_colors')
                .select('*')
                .eq('is_active', true)
                .order('sort_order'),
            supabase
                .from('organization_color_preferences')
                .select('global_color_id, is_enabled')
                .eq('organization_id', orgId),
        ])

        if (colorsResult.error) throw colorsResult.error
        if (prefsResult.error) throw prefsResult.error

        const colors: any[] = colorsResult.data || []
        const prefs: any[] = prefsResult.data || []

        const prefMap = new Map<string, boolean>()
        for (const p of prefs) prefMap.set(p.global_color_id, p.is_enabled)

        const allColors: GlobalColor[] = colors.map((c: any) => ({
            id: c.id,
            name: c.name,
            hex_code: c.hex_code,
            category: c.category,
            sort_order: c.sort_order,
            is_enabled: prefMap.has(c.id) ? prefMap.get(c.id)! : true,
        })).filter(c => c.is_enabled)

        return {
            exterior: allColors.filter(c => c.category === 'exterior' || c.category === 'both'),
            interior: allColors.filter(c => c.category === 'interior' || c.category === 'both'),
        }
    } catch (error) {
        await reportError(error, 'getGlobalColorsForOrg')
        throw error
    }
}

/**
 * Toggle whether a global color is enabled for the current org.
 */
export async function toggleOrgColorPreference(globalColorId: string, isEnabled: boolean) {
    const supabase = await getSupabase()
    const orgId = await getOrgId(supabase)

    await supabase
        .from('organization_color_preferences')
        .upsert({
            organization_id: orgId,
            global_color_id: globalColorId,
            is_enabled: isEnabled,
        }, { onConflict: 'organization_id,global_color_id' })

    revalidatePath('/settings')
    return { success: true }
}

// ===========================
// GET ALL FORM DATA
// ===========================

export interface VehicleFormData {
    brands: GlobalBrand[]
    exteriorColors: GlobalColor[]
    interiorColors: GlobalColor[]
    costConcepts: any[]
    displacements: any[]
    orgSettings: any
    nextCode: string
}

/**
 * Single server call to load ALL data needed by the New Equipo form.
 * Brands and colors are global (not per-org parametric).
 */
export async function getVehicleFormData(): Promise<VehicleFormData> {
    try {
        const supabase = await getSupabase()
        const orgId = await getOrgId(supabase)

        const [brandsData, colorsData, conceptsResult, displacementsResult, settingsResult, vehiclesResult] = await Promise.all([
            getGlobalBrandsForOrg(),
            getGlobalColorsForOrg(),
            supabase.from('cost_concepts').select('*').eq('organization_id', orgId).order('name'),
            supabase.from('displacements').select('*').eq('organization_id', orgId).order('name'),
            supabase.from('organization_settings').select('*').eq('organization_id', orgId).single(),
            supabase.from('equipos').select('cod').eq('organization_id', orgId).is('deleted_at', null),
        ])

        if (conceptsResult.error) throw conceptsResult.error
        if (displacementsResult.error) throw displacementsResult.error
        if (settingsResult.error && settingsResult.status !== 406) throw settingsResult.error
        if (vehiclesResult.error) throw vehiclesResult.error

        // Calculate next code
        let maxId = 0
        for (const v of vehiclesResult.data || []) {
            const num = parseInt(v.cod, 10)
            if (!isNaN(num) && num > maxId) maxId = num
        }
        const nextCode = (maxId + 1).toString()

        return {
            brands: brandsData.filter(b => b.is_enabled),
            exteriorColors: colorsData.exterior,
            interiorColors: colorsData.interior,
            costConcepts: conceptsResult.data || [],
            displacements: displacementsResult.data || [],
            orgSettings: settingsResult.data || null,
            nextCode,
        }
    } catch (error) {
        await reportError(error, 'getVehicleFormData')
        throw error
    }
}

// ===========================
// LAZY LOAD MODELS BY BRAND SLUG
// ===========================

export async function getModelsByBrandSlugAction(brandSlug: string) {
    try {
        const supabase = await getSupabase()
        const orgId = await getOrgId(supabase)

        // Find the global brand that matches the slug
        const { data: globalBrand, error: brandError } = await supabase
            .from('global_brands')
            .select('id')
            .eq('slug', brandSlug)
            .single()

        if (brandError || !globalBrand) return []

        // Prefer global models
        const { data: globalModels } = await supabase
            .from('global_models')
            .select('id, name')
            .eq('global_brand_id', globalBrand.id)
            .eq('is_active', true)
            .order('sort_order')

        if (globalModels && globalModels.length > 0) {
            return globalModels
        }

        // Fallback: org-local models linked via global_brand_id
        const { data: orgBrand } = await supabase
            .from('brands')
            .select('id')
            .eq('organization_id', orgId)
            .eq('global_brand_id', globalBrand.id)
            .maybeSingle()

        if (!orgBrand) return []

        const { data: models } = await supabase
            .from('models')
            .select('id, name')
            .eq('organization_id', orgId)
            .eq('brand_id', orgBrand.id)
            .order('name')

        return models || []
    } catch (error) {
        await reportError(error, 'getModelsByBrandSlugAction')
        throw error
    }
}

/**
 * Get models for a given GlobalBrand.id — uses global_models table first (seeded globally),
 * falls back to the org's local models linked via global_brand_id.
 * Returns { models, orgBrandId } so the form can submit the correct org FK.
 */
export async function getModelsByBrandIdAction(
    globalBrandId: string
): Promise<{ models: { id: string; name: string }[]; orgBrandId: string | null }> {
    try {
        const supabase = await getSupabase()
        const orgId = await getOrgId(supabase)

        // 1. Try global_models (authoritative, SaaS-wide)
        const { data: globalModels, error: gmError } = await supabase
            .from('global_models')
            .select('id, name')
            .eq('global_brand_id', globalBrandId)
            .eq('is_active', true)
            .order('sort_order')

        if (gmError) throw gmError

        // Find org brand linked to this global brand (for legacy/fallback context)
        const { data: orgBrand } = await supabase
            .from('brands')
            .select('id')
            .eq('organization_id', orgId)
            .eq('global_brand_id', globalBrandId)
            .maybeSingle()

        if (globalModels && globalModels.length > 0) {
            return { models: globalModels, orgBrandId: orgBrand?.id || null }
        }

        // 2. Fallback: org-local models (for brands without global_models)
        if (!orgBrand) return { models: [], orgBrandId: null }

        const { data: localModels } = await supabase
            .from('models')
            .select('id, name')
            .eq('organization_id', orgId)
            .eq('brand_id', orgBrand.id)
            .order('name')

        return { models: localModels || [], orgBrandId: orgBrand.id }
    } catch (error) {
        await reportError(error, 'getModelsByBrandIdAction')
        throw error
    }
}
