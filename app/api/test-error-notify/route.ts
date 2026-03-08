import { NextRequest, NextResponse } from 'next/server';
import { reportError } from '@/lib/logger';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const message = searchParams.get('msg') || 'Error de prueba desde la aplicación';

        // Simulate an error
        throw new Error(message);

    } catch (error) {
        await reportError(error, 'Test Route Notification');

        return NextResponse.json({
            success: true,
            message: 'Error capturado y reportado a WhatsApp. Verifica tu teléfono.'
        });
    }
}
