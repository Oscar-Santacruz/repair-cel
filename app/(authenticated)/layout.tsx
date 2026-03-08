import { AppLayoutClient } from "@/components/layout/AppLayoutClient"
import { getCurrentUserRole, getSupabase } from "@/lib/permissions"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const fetchedRole = await getCurrentUserRole()
    const role = fetchedRole || 'viewer'
    let logoUrl = "/LOGO_default.png"
    let emailConfirmed = true

    const supabase = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    let orgPlan: 'free' | 'pro' = 'free'
    if (user) {
        // En supabase.auth.getUser(), user.email_confirmed_at indica si confirmó su correo
        emailConfirmed = !!user.email_confirmed_at

        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
        if (profile?.organization_id) {
            const { data: orgSettings } = await supabase.from('organization_settings').select('logo_url').eq('organization_id', profile.organization_id).single()
            if (orgSettings?.logo_url) {
                logoUrl = orgSettings.logo_url
            }
            const { data: org } = await supabase.from('organizations').select('plan').eq('id', profile.organization_id).single()
            if (org?.plan) orgPlan = org.plan as 'free' | 'pro'
        }
    }

    return (
        <AppLayoutClient userRole={role} logoUrl={logoUrl} emailConfirmed={emailConfirmed} orgPlan={orgPlan}>
            {children}
        </AppLayoutClient>
    )
}
