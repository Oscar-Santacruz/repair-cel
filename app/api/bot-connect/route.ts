import { NextRequest, NextResponse } from 'next/server'

const BOT_URL = process.env.WHATSAPP_BOT_URL
const BOT_TOKEN = process.env.WHATSAPP_BOT_TOKEN

export async function POST(req: NextRequest) {
    const { orgId } = await req.json()
    if (!orgId) return NextResponse.json({ error: 'Missing orgId' }, { status: 400 })

    if (!BOT_URL || !BOT_TOKEN) {
        return NextResponse.json({ error: 'Bot not configured' }, { status: 500 })
    }

    try {
        const res = await fetch(`${BOT_URL}/api/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${BOT_TOKEN}`
            },
            body: JSON.stringify({ orgId }),
            signal: AbortSignal.timeout(8000)
        })
        const data = await res.json()
        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Bot unreachable' }, { status: 503 })
    }
}
