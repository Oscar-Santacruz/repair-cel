import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Robustly determines the active organization ID for the current user.
 * 1. Checks the user's profile for the 'organization_id' (active organization selected in UI).
 * 2. If missing, falls back to the first available organization from 'user_organizations'.
 * 3. Proactively updates the profile if a fallback was necessary to ensure consistency.
 */
export async function getOrganizationId(supabase: SupabaseClient): Promise<string> {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error("Acceso no autorizado")

    // 1. Try to get from profile (Active Organization)
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle()

    if (profile?.organization_id) {
        return profile.organization_id
    }

    // 2. Fallback: Get first available organization from membership table
    let fallbackOrgId = null;
    let fallbackRole = null;

    const { data: memberNew, error: errNew } = await supabase
        .from('organization_users')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .limit(1)

    if (!errNew && memberNew && memberNew.length > 0) {
        fallbackOrgId = memberNew[0].organization_id;
        fallbackRole = memberNew[0].role;
    } else {
        const { data: memberOld, error: errOld } = await supabase
            .from('user_organizations')
            .select('organization_id, role')
            .eq('user_id', user.id)
            .limit(1)
        if (!errOld && memberOld && memberOld.length > 0) {
            fallbackOrgId = memberOld[0].organization_id;
            fallbackRole = memberOld[0].role;
        }
    }

    if (!fallbackOrgId) {
        throw new Error("El usuario no pertenece a ninguna organización. Contacte al administrador.")
    }

    // 3. Proactive Sync: Update profile with this org to make it the active one
    try {
        await supabase
            .from('profiles')
            .update({
                organization_id: fallbackOrgId,
                role: fallbackRole
            })
            .eq('id', user.id)
    } catch (err) {
        console.error("Error updating profile during org fallback sync:", err)
    }

    return fallbackOrgId
}
