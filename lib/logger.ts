export async function reportError(error: any, context?: string) {
    // Always log to console for Render logs
    console.error(`[${context || 'ERROR'}]:`, error);

    const botUrl = process.env.WHATSAPP_BOT_URL;
    const botToken = process.env.WHATSAPP_BOT_TOKEN;
    const adminPhone = process.env.ADMIN_WHATSAPP_PHONE;

    if (!botUrl || !botToken || !adminPhone) {
        console.warn('WhatsApp error reporting not fully configured. Missing:',
            !botUrl ? 'WHATSAPP_BOT_URL ' : '',
            !botToken ? 'WHATSAPP_BOT_TOKEN ' : '',
            !adminPhone ? 'ADMIN_WHATSAPP_PHONE' : ''
        );
        return;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : '';

    const message = `🚨 *ERROR EN PLAYA DE Equipos* 🚨\n\n` +
        `*Contexto:* ${context || 'General'}\n` +
        `*Mensaje:* ${errorMessage}\n` +
        (stack ? `\n*Stack snippet:*\n_${stack}_\n` : '') +
        `\n_Revisar logs de Render para el stack completo._`;

    try {
        const res = await fetch(`${botUrl}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${botToken}`
            },
            body: JSON.stringify({
                phone: adminPhone,
                message,
                orgId: process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || process.env.NEXT_PUBLIC_ORG_ID
            }),
            // Use a short timeout to prevent hanging the main process
            signal: AbortSignal.timeout(5000)
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error('WhatsApp bot returned error:', res.status, errorData);
        }
    } catch (err) {
        console.error('Failed to send WhatsApp error notification:', err);
    }
}
