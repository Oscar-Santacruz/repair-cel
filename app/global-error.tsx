'use client';

import { useEffect } from 'react';
import { reportError } from '@/lib/logger';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Report the error to WhatsApp
        reportError(error, 'Global Error Boundary');
    }, [error]);

    return (
        <html>
            <body>
                <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                    <h2 className="text-2xl font-bold mb-4">Algo salió mal</h2>
                    <p className="mb-6 text-gray-600">
                        Hemos sido notificados del error y estamos trabajando en ello.
                    </p>
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        Intentar de nuevo
                    </button>
                </div>
            </body>
        </html>
    );
}
