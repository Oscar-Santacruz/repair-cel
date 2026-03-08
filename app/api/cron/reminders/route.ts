import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// International phone format: starts with + and has 7-15 digits
const isValidPhone = (phone: string): boolean => {
    return /^\+\d{7,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''))
}

// Utility to pause execution
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const whatsappBotUrl = process.env.WHATSAPP_BOT_URL
    const whatsappBotToken = process.env.WHATSAPP_BOT_TOKEN

    if (!whatsappBotUrl || !whatsappBotToken) {
        return NextResponse.json({ error: 'WhatsApp bot not configured' }, { status: 500 })
    }

    // Get tomorrow's date in YYYY-MM-DD
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    // Get organization settings
    const { data: orgSettings } = await supabase
        .from('organization_settings')
        .select('organization_id, wa_show_installment_number, whatsapp_bot_url, whatsapp_bot_token')

    const settingsMap: Record<string, { showNumber: boolean, botUrl: string | null, botToken: string | null }> = {}
    if (orgSettings) {
        orgSettings.forEach(s => {
            settingsMap[s.organization_id] = {
                showNumber: s.wa_show_installment_number !== false,
                botUrl: s.whatsapp_bot_url || whatsappBotUrl,
                botToken: s.whatsapp_bot_token || whatsappBotToken
            }
        })
    }

    // Only installments whose client has whatsapp_reminders_enabled = true
    const { data: installments, error } = await supabase
        .from('installments')
        .select(`
            id,
            number,
            amount,
            due_date,
            organization_id,
            sales (
                id,
                clients:clients!sales_client_id_fkey (
                    id, name, phone, whatsapp_reminders_enabled
                ),
                equipos (
                    brand, model
                )
            )
        `)
        .eq('due_date', tomorrowStr)
        .in('status', ['pending', 'partial'])

    if (error) {
        console.error('Cron: Error fetching installments:', error)
        return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    let sent = 0
    let skipped = 0
    let failed = 0
    const errors: string[] = []

    for (const inst of installments || []) {
        const sale = Array.isArray(inst.sales) ? inst.sales[0] : inst.sales as any
        const client = Array.isArray(sale?.clients) ? sale.clients[0] : sale?.clients as any
        const equipo = Array.isArray(sale?.equipos) ? sale.equipos[0] : sale?.equipos as any

        // Skip if client has reminders disabled
        if (!client?.whatsapp_reminders_enabled) {
            skipped++
            continue
        }

        // Skip if phone is missing or not in valid international format
        if (!client?.phone || !isValidPhone(client.phone)) {
            skipped++
            console.log(`[Cron] Skipping ${client?.name}: invalid or missing phone (${client?.phone})`)
            continue
        }

        const orgConfig = settingsMap[inst.organization_id] || { showNumber: true, botUrl: whatsappBotUrl, botToken: whatsappBotToken }
        const showInstallmentNumber = orgConfig.showNumber
        const targetBotUrl = orgConfig.botUrl
        const targetBotToken = orgConfig.botToken

        if (!targetBotUrl || !targetBotToken) {
            skipped++
            console.log(`[Cron] Skipping ${client?.name}: Bot not configured for organization ${inst.organization_id}`)
            continue
        }

        const message =
            `⏰ *Recordatorio de Vencimiento*\n\n` +
            `Hola ${client.name}, le recordamos que su *${showInstallmentNumber ? `Cuota N° ${inst.number}` : 'cuota'}* ` +
            (equipo ? `del equipos *${equipo.brand} ${equipo.model}* ` : '') +
            `por *${Number(inst.amount).toLocaleString('es-PY')} Gs.* vence *mañana*.\n\n` +
            `Por favor, realice su pago en tiempo y forma. ¡Muchas gracias!`

        try {
            const controller = new AbortController()
            const id = setTimeout(() => controller.abort(), 5000)

            let notifStatus: 'sent' | 'failed' = 'failed'
            let errorMsg: string | null = 'Timeout: El bot no respondió'

            try {
                const response = await fetch(`${targetBotUrl}/send`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${targetBotToken}`,
                    },
                    body: JSON.stringify({
                        phone: client.phone,
                        message,
                        orgId: inst.organization_id
                    }),
                    signal: controller.signal
                })

                clearTimeout(id)
                notifStatus = response.ok ? 'sent' : 'failed'
                errorMsg = response.ok ? null : await response.text()

                if (!response.ok) {
                    failed++
                    errors.push(`${client.name}: ${errorMsg}`)
                } else {
                    sent++
                }
            } catch (fetchError: any) {
                clearTimeout(id)
                failed++
                if (fetchError.name === 'AbortError') {
                    errorMsg = 'Timeout: El bot no respondió'
                } else {
                    errorMsg = fetchError.message || 'Error de conexión'
                }
                errors.push(`${client.name}: ${errorMsg}`)
            }

            await supabase.from('whatsapp_notifications').insert({
                organization_id: inst.organization_id,
                client_id: client.id,
                sale_id: sale.id,
                installment_id: inst.id,
                type: 'payment_reminder',
                phone: client.phone,
                message,
                status: notifStatus,
                error_message: errorMsg,
            })
        } catch (err: any) {
            failed++
            errors.push(`${client.name}: ${err.message}`)
        }

        // Add a 3-second delay between messages to avoid WhatsApp spam detection/bans
        await delay(3000)
    }

    return NextResponse.json({ success: true, sent, skipped, failed, errors })
}
