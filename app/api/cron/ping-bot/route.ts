import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Ping the WhatsApp bot every 10 min to prevent Render free tier sleep
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const botUrl = process.env.WHATSAPP_BOT_URL
    if (!botUrl) {
        return NextResponse.json({ error: 'WHATSAPP_BOT_URL not set' }, { status: 500 })
    }

    try {
        const res = await fetch(`${botUrl}/health`, { cache: 'no-store' })
        const data = await res.json()
        return NextResponse.json({ pinged: true, bot: data })
    } catch (err: any) {
        return NextResponse.json({ pinged: false, error: err.message }, { status: 503 })
    }
}
