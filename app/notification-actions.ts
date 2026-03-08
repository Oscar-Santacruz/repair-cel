'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { format, differenceInDays, startOfDay, isToday, parseISO } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { numberToWords } from "@/lib/number-to-words"
import fs from 'fs'
import path from 'path'

async function getSupabase() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
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
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
        if (profile?.organization_id) {
            return { client: supabase, organization_id: profile.organization_id }
        }
    }
    return { client: supabase, organization_id: null }
}

async function getSupabaseAdmin() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    // Always get organization_id from the session user via anon client
    const { organization_id } = await getSupabase()
    if (!serviceRoleKey) {
        console.warn('?? SUPABASE_SERVICE_ROLE_KEY is missing. Using ANON key, RLS policies may block data fetching.')
        const { client } = await getSupabase()
        return { client, organization_id }
    }
    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
    )
    return { client: adminClient, organization_id }
}

export async function getWhatsAppSettings() {
    const { client: supabase, organization_id } = await getSupabase()
    if (!organization_id) return null
    const { data, error } = await supabase.from('organization_settings').select('*').eq('organization_id', organization_id).single()
    if (error && error.code !== 'PGRST116') throw error
    return data
}

export async function saveWhatsAppSettings(data: {
    wa_due_today_template: string
    wa_overdue_template: string
    wa_overdue_threshold_days: number
    wa_overdue_frequency_days: number
    wa_show_installment_number?: boolean
    whatsapp_bot_url?: string
    whatsapp_bot_token?: string
}) {
    const { client: supabase, organization_id } = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !organization_id) throw new Error("Unauthorized")

    // Get current settings to update or insert
    const { data: existing } = await supabase.from('organization_settings').select('id').eq('organization_id', organization_id).single()

    if (existing) {
        const { error } = await supabase
            .from('organization_settings')
            .update({ ...data, updated_by: user.id })
            .eq('id', existing.id)
            .eq('organization_id', organization_id)
        if (error) throw error
    } else {
        // This shouldn't happen normally as settings are usually pre-created, but for safety:
        const { error } = await supabase
            .from('organization_settings')
            .insert({ ...data, organization_id, created_by: user.id })
        if (error) throw error
    }

    revalidatePath('/notifications')
    return { success: true }
}

export async function getPendingReminders() {
    const { client: supabase, organization_id } = await getSupabase()
    const settings = await getWhatsAppSettings()

    if (!settings) return []

    // Get Today from Database to avoid Timezone issues (Paraguay is UTC-3)
    const { data: dbDate } = await supabase.rpc('get_paraguay_date')
    const today = dbDate ? parseISO(dbDate) : startOfDay(new Date())
    const todayStr = dbDate || format(today, 'yyyy-MM-dd')

    // Fetch all pending/partial installments
    const { data: installments, error: instError } = await supabase
        .from('installments')
        .select(`
            *,
            sales!inner (
                id,
                organization_id,
                balance,
                clients!client_id (id, name, phone, created_at),
                equipos!vehicle_id (brand, model, plate)
            )
        `)
        .eq('status', 'pending')
        .eq('sales.organization_id', organization_id)
        .order('due_date', { ascending: true })

    if (instError) {
        console.error("Error fetching installments for reminders:", instError)
        throw new Error(`Error en la base de datos (installments): ${instError.message}`)
    }

    // Fetch last notification for each client to check frequency
    const clientIds = Array.from(new Set(installments.map(i => i.sales.clients.id)))
    const { data: lastNotifs, error: notifError } = await supabase
        .from('whatsapp_notifications')
        .select('client_id, sent_at')
        .in('client_id', clientIds)
        .eq('type', 'payment_reminder')
        .eq('organization_id', organization_id)
        .order('sent_at', { ascending: false })

    if (notifError) {
        console.error("Error fetching last notifications:", notifError)
        // We can continue even if this fails, but better to log
    }

    const lastNotifMap: Record<string, string> = {}
    lastNotifs?.forEach(n => {
        if (!lastNotifMap[n.client_id]) {
            lastNotifMap[n.client_id] = n.sent_at
        }
    })

    const pendingReminders: any[] = []

    // Group by client/sale to handle delinquent logic (all overdue cuotas)
    const clientReminders: Record<string, any> = {}

    for (const inst of installments) {
        const sale = inst.sales
        const client = sale.clients
        const equipo = sale.equipos
        const dueDate = parseISO(inst.due_date)
        const daysOverdue = differenceInDays(today, dueDate)
        const lastNotified = lastNotifMap[client.id] ? parseISO(lastNotifMap[client.id]) : null

        // --- 1. Due Today Logic ---
        if (isToday(dueDate)) {
            pendingReminders.push({
                type: 'due_today',
                clientId: client.id,
                clientName: client.name,
                phone: client.phone,
                saleId: sale.id,
                vehicleInfo: `${equipo.brand} ${equipo.model}${equipo.plate ? ` (${equipo.plate})` : ''}`,
                lastNotified: lastNotifMap[client.id] || null,
                daysOverdue: 0,
                installmentId: inst.id,
                installmentNumber: inst.number,
                amount: inst.amount,
                priority: 1
            })
            continue // Don't process for delinquency if it's due today
        }

        // --- 2. Delinquency Logic ---
        if (daysOverdue >= settings.wa_overdue_threshold_days) {
            // Check frequency
            const shouldRemind = !lastNotified || differenceInDays(today, lastNotified) >= settings.wa_overdue_frequency_days

            if (shouldRemind) {
                if (!clientReminders[sale.id]) {
                    clientReminders[sale.id] = {
                        type: 'overdue',
                        clientId: client.id,
                        clientName: client.name,
                        phone: client.phone,
                        saleId: sale.id,
                        vehicleInfo: `${equipo.brand} ${equipo.model}${equipo.plate ? ` (${equipo.plate})` : ''}`,
                        lastNotified: lastNotifMap[client.id] || null,
                        daysOverdue: daysOverdue,
                        installments: [],
                        totalAmount: 0,
                        priority: 2
                    }
                }

                // Keep track of the maximum days overdue for the group
                if (daysOverdue > clientReminders[sale.id].daysOverdue) {
                    clientReminders[sale.id].daysOverdue = daysOverdue
                }

                // Penalty calculation aligned with PaymentForm.tsx
                let penalty = 0
                const grace = settings.penalty_grace_days || 0
                if (daysOverdue > grace) {
                    // Calcular meses vencidos (cada 30 días = 1 multa)
                    let monthsOverdue = Math.floor(daysOverdue / 30)
                    if (monthsOverdue === 0) monthsOverdue = 1
                    penalty = Number(settings.default_penalty_amount || 0) * monthsOverdue
                }

                clientReminders[sale.id].installments.push({
                    id: inst.id,
                    number: inst.number,
                    amount: inst.amount,
                    dueDate: inst.due_date,
                    penalty: penalty
                })
                clientReminders[sale.id].totalAmount += (Number(inst.amount) + Number(penalty))
            }
        }
    }

    // Merge and sort
    return [...pendingReminders, ...Object.values(clientReminders)].sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority
        return b.daysOverdue - a.daysOverdue
    })
}

export async function sendManualNotification(reminder: any) {
    const { client: supabaseAdmin, organization_id } = await getSupabaseAdmin()
    if (!organization_id) throw new Error("Unauthorized")
    const settings = await getWhatsAppSettings()
    const whatsappBotUrl = settings?.whatsapp_bot_url || process.env.WHATSAPP_BOT_URL
    const whatsappBotToken = settings?.whatsapp_bot_token || process.env.WHATSAPP_BOT_TOKEN

    if (!settings || !whatsappBotUrl || !whatsappBotToken) {
        throw new Error("Bot or settings not configured")
    }

    let message = ""
    if (reminder.type === 'due_today') {
        message = settings.wa_due_today_template
            .replace(/{cliente}/g, reminder.clientName)
            .replace(/{cuota_nro}/g, reminder.installmentNumber.toString())
            .replace(/{equipo}/g, reminder.vehicleInfo)
            .replace(/{monto}/g, Number(reminder.amount).toLocaleString('es-PY'))
    } else {
        const detailRows = reminder.installments.map((i: any) => {
            const dateStr = format(parseISO(i.dueDate), 'dd/MM/yyyy')
            const amount = Number(i.amount)
            const penalty = Number(i.penalty || 0)
            const subtotal = amount + penalty

            const amountStr = amount.toLocaleString('es-PY')
            const penaltyStr = penalty.toLocaleString('es-PY')
            const subtotalStr = subtotal.toLocaleString('es-PY')

            const penaltyDetails = penalty > 0 ? ` (${amountStr} + ${penaltyStr} multa)` : ""

            if (settings.wa_show_installment_number === false) {
                return `- Venció ${dateStr}: *${subtotalStr} Gs.*${penaltyDetails}`
            }
            return `- Cuota ${i.number} (Venció ${dateStr}): *${subtotalStr} Gs.*${penaltyDetails}`
        }).join('\n')

        message = settings.wa_overdue_template
            .replace(/{cliente}/g, reminder.clientName)
            .replace(/{equipo}/g, reminder.vehicleInfo)
            .replace(/{detalle_cuotas}/g, detailRows)
            .replace(/{total_pendiente}/g, Number(reminder.totalAmount).toLocaleString('es-PY'))
    }

    // Get sale to get org_id (needed for bot routing and RLS visibility)
    const { data: sale } = await supabaseAdmin.from('sales').select('organization_id').eq('id', reminder.saleId).eq('organization_id', organization_id).single()

    if (!sale?.organization_id) return { success: false, error: "Organización no encontrada para esta venta" }

    // Send to bot
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 5000)

    let status: 'sent' | 'failed' = 'failed'
    let errorMsg: string | null = 'Timeout: El bot no respondió'

    try {
        const response = await fetch(`${whatsappBotUrl}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${whatsappBotToken}`,
            },
            body: JSON.stringify({
                phone: reminder.phone,
                message,
                orgId: sale.organization_id
            }),
            signal: controller.signal
        })

        clearTimeout(id)
        status = response.ok ? 'sent' : 'failed'
        errorMsg = response.ok ? null : await response.text()
    } catch (fetchError: any) {
        clearTimeout(id)
        if (fetchError.name === 'AbortError') {
            errorMsg = 'Timeout: El bot de WhatsApp no respondió'
        } else {
            errorMsg = fetchError.message || 'Error de conexión'
        }
    }

    // Log to DB
    const { error: insertError } = await supabaseAdmin.from('whatsapp_notifications').insert({
        organization_id: sale.organization_id,
        client_id: reminder.clientId,
        sale_id: reminder.saleId,
        installment_id: reminder.type === 'due_today' ? reminder.installmentId : null,
        type: 'payment_reminder',
        phone: reminder.phone,
        message,
        status: status,
        error_message: errorMsg,
    })

    if (insertError) console.error("Error logging manual notif:", insertError)

    revalidatePath('/notifications')
    return { success: status === 'sent', error: errorMsg }
}

export async function resendNotification(notificationId: string) {
    const { client: supabaseAdmin, organization_id } = await getSupabaseAdmin()
    if (!organization_id) throw new Error("Unauthorized")

    // 1. Fetch existing notification
    const { data: notif, error: fetchError } = await supabaseAdmin
        .from('whatsapp_notifications')
        .select('*')
        .eq('id', notificationId)
        .eq('organization_id', organization_id)
        .single()

    if (fetchError || !notif) {
        throw new Error("Notification not found")
    }

    // Fetch tenant settings
    const { data: settings } = await supabaseAdmin
        .from('organization_settings')
        .select('whatsapp_bot_url, whatsapp_bot_token')
        .eq('organization_id', notif.organization_id)
        .single()

    const whatsappBotUrl = settings?.whatsapp_bot_url || process.env.WHATSAPP_BOT_URL
    const whatsappBotToken = settings?.whatsapp_bot_token || process.env.WHATSAPP_BOT_TOKEN

    if (!whatsappBotUrl || !whatsappBotToken) {
        throw new Error("Bot not configured for this organization")
    }

    // 2. Determine target phone number
    let targetPhone = notif.phone

    // If linked to a client, try to get their current phone number
    if (notif.client_id) {
        const { data: client } = await supabaseAdmin
            .from('clients')
            .select('phone')
            .eq('id', notif.client_id)
            .single()

        if (client?.phone) {
            targetPhone = client.phone
        }
    }

    // 3. Send to bot
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 5000)

    let status: 'sent' | 'failed' = 'failed'
    let errorMsg: string | null = 'Timeout: El bot no respondió'

    try {
        const response = await fetch(`${whatsappBotUrl}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${whatsappBotToken}`,
            },
            body: JSON.stringify({
                phone: targetPhone,
                message: notif.message,
                orgId: notif.organization_id
            }),
            signal: controller.signal
        })

        clearTimeout(id)
        status = response.ok ? 'sent' : 'failed'
        errorMsg = response.ok ? null : await response.text()
    } catch (fetchError: any) {
        clearTimeout(id)
        if (fetchError.name === 'AbortError') {
            errorMsg = 'Timeout: El bot de WhatsApp no respondió'
        } else {
            errorMsg = fetchError.message || 'Error de conexión'
        }
    }

    // 4. Update the notification record
    const { error: updateError } = await supabaseAdmin
        .from('whatsapp_notifications')
        .update({
            phone: targetPhone, // Update in case it changed
            status: status,
            error_message: errorMsg,
            sent_at: new Date().toISOString() // Update timestamp to current attempt
        })
        .eq('id', notificationId)

    if (updateError) console.error("Error updating notification record:", updateError)

    revalidatePath('/notifications')
    return { success: status === 'sent', error: errorMsg }
}

export async function sendPaymentConfirmationAction(paymentId: string) {
    const { client: supabaseAdmin, organization_id } = await getSupabaseAdmin()

    // Fetch payment and client info
    const { data: payment } = await supabaseAdmin
        .from('payments')
        .select(`
            *,
            sales (
                clients:clients!sales_client_id_fkey (id, name, phone)
            ),
            installments (number)
        `)
        .eq('id', paymentId)
        .single()

    if (!payment) {
        console.error("Payment not found for Confirmation:", paymentId)
        return { success: false, error: "Pago no encontrado o sin permisos" }
    }

    const client = Array.isArray(payment.sales.clients) ? payment.sales.clients[0] : payment.sales.clients
    if (!client?.phone) return { success: false, error: "El cliente no tiene teléfono registrado" }

    const message =
        `✅ *Confirmación de Pago*\n\n` +
        `Hola ${client.name}, confirmamos la recepción de su pago de *${payment.installments ? 'Cuota N° ' + payment.installments.number : 'Entrega Inicial'}* ` +
        `por *${Number(payment.amount).toLocaleString('es-PY')} Gs.*\n\n` +
        `_Gracias por su puntualidad._`

    // 2. Fetch Organization Settings for Bot Webhook
    const { data: settings } = await supabaseAdmin
        .from('organization_settings')
        .select('*')
        .eq('organization_id', payment.sales.organizations?.id || payment.sales.organization_id)
        .single()

    const whatsappBotUrl = settings?.whatsapp_bot_url || process.env.WHATSAPP_BOT_URL
    const whatsappBotToken = settings?.whatsapp_bot_token || process.env.WHATSAPP_BOT_TOKEN

    if (!whatsappBotUrl || !whatsappBotToken) return { success: false, error: "Bot no configurado para esta empresa" }

    const response = await fetch(`${whatsappBotUrl}/send`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${whatsappBotToken}`,
        },
        body: JSON.stringify({
            phone: client.phone,
            message,
            orgId: payment.sales.organizations?.id || payment.sales.organization_id
        }),
    })

    if (!response.ok) return { success: false, error: await response.text() }

    return { success: true }
}

export async function sendPaymentReceiptAction(paymentId: string) {
    const { client: supabaseAdmin, organization_id } = await getSupabaseAdmin()

    // 1. Fetch Payment Data
    const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .select(`
            *,
            sales (
                id,
                organization_id,
                clients:clients!sales_client_id_fkey (id, name, phone, ci, address),
                equipos (brand, model, plate, year, color, chassis_number, cod)
            ),
            installments (number, amount, due_date),
            bank_accounts (*)
        `)
        .eq('id', paymentId)
        .single()

    if (paymentError || !payment) {
        console.error("Payment fetch error:", paymentError, "Payment ID:", paymentId)
        return { success: false, error: "Pago no encontrado o sin permisos" }
    }

    const sale = payment.sales
    const client = Array.isArray(sale.clients) ? sale.clients[0] : sale.clients
    const equipo = Array.isArray(sale.equipos) ? sale.equipos[0] : sale.equipos
    const installment = payment.installments

    if (!client?.phone) {
        return { success: false, error: "El cliente no tiene teléfono registrado" }
    }

    // 2. Fetch Organization Settings for Header and Bot Webhook
    const { data: settings } = await supabaseAdmin
        .from('organization_settings')
        .select('*')
        .eq('organization_id', sale.organization_id)
        .single()

    const whatsappBotUrl = settings?.whatsapp_bot_url || process.env.WHATSAPP_BOT_URL
    const whatsappBotToken = settings?.whatsapp_bot_token || process.env.WHATSAPP_BOT_TOKEN

    if (!whatsappBotUrl || !whatsappBotToken) {
        console.error("WhatsApp Bot not configured")
        return { success: false, error: "Bot no configurado para esta empresa" }
    }

    // 3. Generate PDF (Server-side)
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    })

    // Aesthetic similar to Receipt.tsx
    let yPos = 15

    const fCurrency = (num: number) => new Intl.NumberFormat('es-PY').format(num)

    // Translate Payment Method
    const paymentMethodMap: Record<string, string> = {
        'cash': 'EFECTIVO',
        'transfer': 'TRANSFERENCIA',
        'deposit': 'DEPÓSITO',
        'card': 'TARJETA',
        'check': 'CHEQUE'
    }
    const translatedPaymentMethod = paymentMethodMap[payment.payment_method?.toLowerCase()] || payment.payment_method || 'EFECTIVO'

    // Determine description
    const isInstallment = installment && Number(installment.number) > 0
    let description = isInstallment
        ? `Pago de Cuota N° ${installment.number}`
        : (payment.amount >= (sale.total_amount || 0) ? `Pago de Equipos` : `Entrega Inicial`) // Simplification since isCashSale isn't strictly defined in this context without sale total

    const vehicleDetails = [
        `${equipo.brand} ${equipo.model}`,
        equipo.plate ? `Chapa: ${equipo.plate}` : null,
        equipo.chassis_number ? `Chasis: ${equipo.chassis_number}` : null,
        equipo.color ? `Color: ${equipo.color}` : null,
        equipo.cod ? `Cód: ${equipo.cod}` : null
    ].filter(Boolean).join(' - ')

    // --- MAIN RECEIPT BORDER ---
    // Instead of a single surrounding border, we draw the boxes like the UI

    // --- Header Box (Left: Company, Right: RUC/Recibo) ---
    doc.setDrawColor(0)
    doc.setLineWidth(0.5)
    doc.rect(14, yPos, 182, 35) // Outer Header Rect
    doc.line(130, yPos, 130, yPos + 35) // Vertical divider

    // Left Side: Company Info
    try {
        let logoBase64 = ''
        if (settings?.logo_url) {
            // Fetch dynamic logo and convert to base64
            const logoResponse = await fetch(settings.logo_url)
            if (logoResponse.ok) {
                const arrayBuffer = await logoResponse.arrayBuffer()
                logoBase64 = Buffer.from(arrayBuffer).toString('base64')
            } else {
                throw new Error("Failed to fetch dynamic logo")
            }
        } else {
            // Fallback to local default logo
            const logoPath = path.join(process.cwd(), 'public', 'LOGO_default.png')
            logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' })
        }

        // Add logo (adjust dimensions as needed: x, y, width, height)
        // Note: Assuming PNG. If the dynamic logo is JPEG, jsPDF handles it if format isn't strictly enforced or matches. We use 'PNG' or 'JPEG' generally. 
        // A robust implementation might check MIME type from the fetch response, but we'll attempt automatic recognition or standard.
        doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', 18, yPos + 4, 25, 25)

        // Push the text to the right of the logo
        doc.setFont("helvetica", "bold")
        doc.setFontSize(16)
        doc.setTextColor(0, 51, 102)
        doc.text(settings?.company_name || 'MIGUEL LANERI', 48, yPos + 8)

        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)
        doc.setTextColor(50, 50, 50)
        if (settings?.address) {
            const addressLines = doc.splitTextToSize(settings.address, 80) // Reduced width to avoid overlapping Date/Payment box later on
            doc.text(addressLines, 48, yPos + 14)
        }
        let optY = yPos + 22
        if (settings?.website) { doc.text(`Web: ${settings.website}`, 48, optY); optY += 4 }
        if (settings?.email) { doc.text(`Email: ${settings.email}`, 48, optY); optY += 4 }
        if (settings?.phone) { doc.text(`Tel: ${settings.phone}`, 48, optY); }
    } catch (e) {
        // Fallback if logo not found
        doc.setFont("helvetica", "bold")
        doc.setFontSize(16)
        doc.setTextColor(0, 51, 102)
        doc.text(settings?.company_name || 'MIGUEL LANERI', 18, yPos + 8)

        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)
        doc.setTextColor(50, 50, 50)
        if (settings?.address) {
            const addressLines = doc.splitTextToSize(settings.address, 105)
            doc.text(addressLines, 18, yPos + 14)
        }
        let optY = yPos + 22
        if (settings?.website) { doc.text(`Web: ${settings.website}`, 18, optY); optY += 4 }
        if (settings?.email) { doc.text(`Email: ${settings.email}`, 18, optY); optY += 4 }
        if (settings?.phone) { doc.text(`Tel: ${settings.phone}`, 18, optY); }
    }

    // Right Side: RUC & Receipt Number
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(`RUC: ${settings?.ruc || '3825728-9'}`, 160, yPos + 8, { align: 'center' })

    // RECIBO background
    doc.setFillColor(240, 240, 240)
    doc.rect(130, yPos + 12, 66, 8, 'F')
    doc.setDrawColor(0)
    doc.line(130, yPos + 12, 196, yPos + 12)
    doc.line(130, yPos + 20, 196, yPos + 20)

    doc.setFontSize(12)
    doc.text("RECIBO DE DINERO", 163, yPos + 17, { align: 'center' })

    doc.setFontSize(12)
    doc.setFont("courier", "normal")
    doc.text(payment.receipt_number, 163, yPos + 28, { align: 'center' })

    yPos += 38

    // --- Date & Payment Method Box ---
    doc.rect(14, yPos, 182, 10)
    doc.line(105, yPos, 105, yPos + 10)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("FECHA DE EMISION:", 18, yPos + 6)
    doc.setFont("helvetica", "normal")
    doc.text(format(new Date(payment.created_at), "dd/MM/yyyy"), 55, yPos + 6)

    doc.setFont("helvetica", "bold")
    doc.text("FORMA DE PAGO:", 110, yPos + 6)
    doc.setFont("helvetica", "normal")
    doc.text(translatedPaymentMethod, 142, yPos + 6)

    yPos += 13

    // --- Client Info Box ---
    doc.rect(14, yPos, 182, 15)
    doc.setFont("helvetica", "bold")
    doc.text("DOCUMENTO DE IDENTIDAD:", 18, yPos + 6)
    doc.setFont("helvetica", "normal")
    doc.text(client.ci || 'N/A', 75, yPos + 6)

    doc.setFont("helvetica", "bold")
    doc.text("NOMBRE O RAZON SOCIAL:", 18, yPos + 12)
    doc.setFont("helvetica", "normal")
    doc.text(client.name, 75, yPos + 12)

    yPos += 18

    // --- Details Table ---
    const tableBody = [
        [
            '1',
            `${description}\n${vehicleDetails}` + (payment.comment ? `\n\nObs: ${payment.comment}` : ''),
            fCurrency(payment.amount - (payment.penalty_amount || 0)),
            fCurrency(payment.amount - (payment.penalty_amount || 0))
        ]
    ]

    if (payment.penalty_amount > 0) {
        tableBody.push([
            '1',
            'Multa / Intereses por mora',
            fCurrency(payment.penalty_amount),
            fCurrency(payment.penalty_amount)
        ])
    }

    autoTable(doc, {
        startY: yPos,
        head: [['Cant.', 'CLASE DE MERCADERIAS Y/O SERVICIOS', 'PRECIO UNITARIO', 'TOTAL']],
        body: tableBody,
        theme: 'grid',
        tableLineWidth: 0.5,
        tableLineColor: [0, 0, 0],
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { halign: 'left' },
            2: { halign: 'right', cellWidth: 35 },
            3: { halign: 'right', cellWidth: 35 }
        },
        styles: { fontSize: 8, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.5 },
        margin: { left: 14, right: 14 }
    })

    // @ts-ignore
    yPos = doc.lastAutoTable.finalY

    // Total row
    doc.setFillColor(240, 240, 240)
    doc.rect(14, yPos, 182, 8, 'FD')
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("TOTAL A PAGAR", 140, yPos + 5, { align: 'right' })
    doc.text(fCurrency(payment.amount), 190, yPos + 5, { align: 'right' })
    doc.line(161, yPos, 161, yPos + 8) // Separator for the last Total column box

    yPos += 8

    // Amount in Words
    doc.setFillColor(255, 255, 255)
    doc.rect(14, yPos, 182, 10, 'S')
    doc.setFont("helvetica", "italic")
    doc.setFontSize(8)
    doc.text(`Son: Guaraníes ${numberToWords(payment.amount)}.-`, 18, yPos + 6)

    yPos += 30

    // No signatures on digital receipts
    yPos += 15
    doc.text("ORIGINAL: FORMATO DIGITAL", 196, yPos, { align: 'right' })

    // 4. Send to Bot
    const pdfBase64 = doc.output('datauristring').split(',')[1]
    const fileName = `Recibo_${payment.receipt_number}.pdf`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
        const response = await fetch(`${whatsappBotUrl}/send-document`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${whatsappBotToken}`,
            },
            body: JSON.stringify({
                phone: client.phone,
                file: pdfBase64,
                fileName: fileName,
                mimetype: 'application/pdf',
                orgId: sale.organization_id
            }),
            signal: controller.signal
        })

        clearTimeout(timeoutId)
        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Bot error: ${errorText}`)
        }

        // Log notification to DB
        await supabaseAdmin.from('whatsapp_notifications').insert({
            organization_id: sale.organization_id,
            client_id: client.id,
            sale_id: sale.id,
            installment_id: payment.installment_id,
            type: 'payment_confirmation',
            phone: client.phone,
            message: `Envío de Recibo PDF #${payment.receipt_number}`,
            status: 'sent',
        })

        return { success: true }
    } catch (err: any) {
        clearTimeout(timeoutId)
        console.error("Error sending PDF via WhatsApp:", err)
        return { success: false, error: err.message }
    }
}

export async function getWhatsAppBotStatus() {
    const { client: supabase, organization_id } = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { connected: false, qr: null, error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) return { connected: false, qr: null, error: 'No org found' }

    const settings = await getWhatsAppSettings()
    const whatsappBotUrl = settings?.whatsapp_bot_url || process.env.WHATSAPP_BOT_URL
    const whatsappBotToken = settings?.whatsapp_bot_token || process.env.WHATSAPP_BOT_TOKEN

    if (!whatsappBotUrl || !whatsappBotToken) return { connected: false, qr: null, error: 'Bot settings missing' }

    try {
        const res = await fetch(`${whatsappBotUrl}/api/status/${profile.organization_id}`, {
            headers: { 'Authorization': `Bearer ${whatsappBotToken}` },
            cache: 'no-store'
        })
        if (!res.ok) return { connected: false, qr: null, error: await res.text() }
        return await res.json()
    } catch (e: any) {
        return { connected: false, qr: null, error: e.message }
    }
}

export async function connectWhatsAppBot() {
    const { client: supabase, organization_id } = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) throw new Error("No organization found")

    const settings = await getWhatsAppSettings()
    const whatsappBotUrl = settings?.whatsapp_bot_url || process.env.WHATSAPP_BOT_URL
    const whatsappBotToken = settings?.whatsapp_bot_token || process.env.WHATSAPP_BOT_TOKEN

    if (!whatsappBotUrl || !whatsappBotToken) throw new Error("Bot no configurado")

    const res = await fetch(`${whatsappBotUrl}/api/connect`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${whatsappBotToken}`
        },
        body: JSON.stringify({ orgId: profile.organization_id })
    })

    if (!res.ok) throw new Error(await res.text())
    return await res.json()
}

export async function disconnectWhatsAppBot() {
    const { client: supabase, organization_id } = await getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) throw new Error("No organization found")

    const settings = await getWhatsAppSettings()
    const whatsappBotUrl = settings?.whatsapp_bot_url || process.env.WHATSAPP_BOT_URL
    const whatsappBotToken = settings?.whatsapp_bot_token || process.env.WHATSAPP_BOT_TOKEN

    if (!whatsappBotUrl || !whatsappBotToken) throw new Error("Bot no configurado")

    const res = await fetch(`${whatsappBotUrl}/logout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${whatsappBotToken}`
        },
        body: JSON.stringify({ orgId: profile.organization_id })
    })

    if (!res.ok) throw new Error(await res.text())
    return { success: true }
}


