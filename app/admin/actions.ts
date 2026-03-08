'use server'

import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'oscar.sntcrz@gmail.com'
const ADMIN_ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || 'admin'
const ADMIN_WHATSAPP_PHONE = process.env.ADMIN_WHATSAPP_PHONE || ''

async function getAdminSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function getAdminStats() {
    const supabase = await getAdminSupabase()

    const [{ count: userCount }, { count: orgCount }, { data: orgs }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('organizations').select('*', { count: 'exact', head: true }),
        supabase.from('organizations').select(`
            id,
            name,
            plan,
            created_at,
            profiles(count)
        `).order('created_at', { ascending: false })
    ])

    return {
        userCount: userCount ?? 0,
        orgCount: orgCount ?? 0,
        organizations: orgs ?? []
    }
}

export async function toggleOrgPlanAction(orgId: string, newPlan: 'free' | 'pro') {
    const supabase = await getAdminSupabase()
    const { error } = await supabase
        .from('organizations')
        .update({ plan: newPlan })
        .eq('id', orgId)

    if (error) throw new Error('Error actualizando plan: ' + error.message)
    return { success: true }
}

export async function notifyAdminNewCompanyAction(companyName: string, userEmail: string) {
    const botUrl = process.env.WHATSAPP_BOT_URL
    const botToken = process.env.WHATSAPP_BOT_TOKEN
    const adminPhone = ADMIN_WHATSAPP_PHONE

    if (!botUrl || !botToken || !adminPhone) {
        console.warn('[Admin Notif] Missing WhatsApp bot config or ADMIN_WHATSAPP_PHONE')
        return { success: false }
    }

    const now = new Date().toLocaleString('es-PY', { timeZone: 'America/Asuncion' })
    const message =
        `🏢 *Nueva empresa registrada en CarSale*\n\n` +
        `*Empresa:* ${companyName}\n` +
        `*Usuario:* ${userEmail}\n` +
        `*Fecha:* ${now}`

    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)

        const response = await fetch(`${botUrl}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${botToken}`,
            },
            body: JSON.stringify({
                phone: adminPhone,
                message,
                orgId: ADMIN_ORG_ID
            }),
            signal: controller.signal
        })
        clearTimeout(timeout)

        if (!response.ok) {
            console.warn('[Admin Notif] Bot responded with error:', await response.text())
        }
        return { success: response.ok }
    } catch (e: any) {
        console.warn('[Admin Notif] Failed to send admin notification:', e.message)
        return { success: false }
    }
}
