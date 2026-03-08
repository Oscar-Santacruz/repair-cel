'use client'

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { FileText, RefreshCcw } from "lucide-react"
import { sendPaymentReceiptAction } from "@/app/notification-actions"
import { toast } from "sonner"

interface ResendPaymentConfirmationButtonProps {
    paymentId: string
    className?: string
}

export function ResendPaymentConfirmationButton({ paymentId, className }: ResendPaymentConfirmationButtonProps) {
    const [isPending, startTransition] = useTransition()

    const handleSend = () => {
        startTransition(async () => {
            try {
                const result = await sendPaymentReceiptAction(paymentId)
                if (result.success) {
                    toast.success("Recibo PDF enviado por WhatsApp correctamente")
                } else {
                    toast.error(`Error al enviar: ${result.error}`)
                }
            } catch (error: any) {
                toast.error(error?.message || "Error al procesar el envío del recibo")
            }
        })
    }

    return (
        <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleSend}
            className={`text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 shadow-sm ${className}`}
            title="Enviar recibo de pago en PDF por WhatsApp"
        >
            {isPending ? (
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <FileText className="mr-2 h-4 w-4" />
            )}
            Enviar Recibo PDF
        </Button>
    )
}
