import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export type UserRole = 'admin' | 'user' | 'viewer' | 'owner' | 'technician' | 'receptionist'

export type Permission =
    | 'create:sales'
    | 'edit:sales'
    | 'delete:sales'
    | 'process:payments'
    | 'delete:payments'
    | 'view:reports'
    | 'manage:users'
    | 'manage:settings'

export async function getSupabase() {
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

export async function getCurrentUserRole(): Promise<UserRole | null> {
    const supabase = await getSupabase()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Fallback logic. Usually relies on profiles, but check organization_users if user has roles there
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    let role = (profile?.role as UserRole) || null

    if (!role || role === 'viewer') {
        // Search organization_users instead
        const { data: member } = await supabase
            .from('organization_users')
            .select('role')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()
        if (member?.role) {
            role = member.role as UserRole
        } else {
            // Also check legacy user_organizations name as fallback
            const { data: legacyMember } = await supabase
                .from('user_organizations')
                .select('role')
                .eq('user_id', user.id)
                .limit(1)
                .maybeSingle()
            if (legacyMember?.role) {
                role = legacyMember.role as UserRole
            }
        }
    }

    return role || 'viewer'
}

export async function getCurrentOrgPlan(): Promise<'free' | 'pro'> {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 'free'

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) return 'free'

    const { data: org } = await supabase
        .from('organizations')
        .select('plan')
        .eq('id', profile.organization_id)
        .single()

    return (org?.plan as 'free' | 'pro') || 'free'
}

export async function isAdmin(): Promise<boolean> {
    const role = await getCurrentUserRole()
    return role === 'admin' || role === 'owner'
}

export async function hasPermission(permission: Permission): Promise<boolean> {
    const role = await getCurrentUserRole()

    const permissions: Record<UserRole, Permission[]> = {
        admin: [
            'create:sales',
            'edit:sales',
            'delete:sales',
            'process:payments',
            'delete:payments',
            'view:reports',
            'manage:users',
            'manage:settings'
        ],
        owner: [
            'create:sales',
            'edit:sales',
            'delete:sales',
            'process:payments',
            'delete:payments',
            'view:reports',
            'manage:users',
            'manage:settings'
        ],
        user: [
            'create:sales',
            'process:payments',
            'view:reports'
        ],
        technician: [
            'create:sales',
            'view:reports'
        ],
        receptionist: [
            'create:sales',
            'process:payments',
            'view:reports'
        ],
        viewer: [
            'view:reports'
        ]
    }

    const userPermissions = permissions[role || 'user'] || []
    return userPermissions.includes(permission)
}

export async function requirePermission(permission: Permission): Promise<void> {
    const hasAccess = await hasPermission(permission)
    if (!hasAccess) {
        throw new Error('Insufficient permissions')
    }
}

export async function requireAdmin() {
    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const admin = await isAdmin()
    if (!admin) {
        throw new Error('Admin access required')
    }

    return user
}
