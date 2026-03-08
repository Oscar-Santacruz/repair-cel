import { NextRequest, NextResponse } from 'next/server'

const BOT_URL = process.env.WHATSAPP_BOT_URL
const BOT_TOKEN = process.env.WHATSAPP_BOT_TOKEN

export async function GET(req: NextRequest) {
    const orgId = req.nextUrl.searchParams.get('orgId')
    if (!orgId) return NextResponse.json({ error: 'Missing orgId' }, { status: 400 })

    if (!BOT_URL || !BOT_TOKEN) {
        return NextResponse.json({ connected: false, qr: null, error: 'Bot not configured' })
    }

    try {
        const res = await fetch(`${BOT_URL}/api/status/${orgId}`, {
            headers: { Authorization: `Bearer ${BOT_TOKEN}` },
            signal: AbortSignal.timeout(5000)
        })
        const data = await res.json()
        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ connected: false, qr: null, error: 'Bot unreachable' })
    }
}
