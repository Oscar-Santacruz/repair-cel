import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Resolves a list of user IDs to their display names (first_name + last_name or email).
 * Uses the admin client to bypass RLS restrictions on the profiles table.
 */
export async function resolveUserNames(
    userIds: (string | null | undefined)[]
): Promise<Record<string, string>> {
    const ids = [...new Set(userIds.filter(Boolean))] as string[]
    if (ids.length === 0) return {}

    try {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('profiles')
            .select('id, email, first_name, last_name')
            .in('id', ids)

        if (error || !data) return {}

        const map: Record<string, string> = {}
        for (const profile of data) {
            const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim()
            map[profile.id] = fullName || profile.email || 'Desconocido'
        }
        return map
    } catch {
        return {}
    }
}
