'use client'

import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import { toast } from "sonner"
import { deletePaymentAction } from "@/app/deletion-actions"
import { useState, useTransition } from "react"
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog"

interface VoidPaymentButtonProps {
    paymentId: string
    installmentNumber?: number
}

export function VoidPaymentButton({ paymentId, installmentNumber }: VoidPaymentButtonProps) {
    const [isPending, startTransition] = useTransition()
    const [showConfirm, setShowConfirm] = useState(false)

    const handleConfirmVoid = async (reason: string) => {
        startTransition(async () => {
            try {
                const result = await deletePaymentAction(paymentId, reason)
                if (result.success) {
                    toast.success(result.message)
                    setShowConfirm(false)
                } else {
                    toast.error(result.message, {
                        description: result.error ? `Causa: ${result.error}` : undefined,
                        duration: 5000
                    })
                }
            } catch (error: any) {
                toast.error(error.message || "Error al anular el cobro")
            }
        })
    }

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirm(true)}
                disabled={isPending}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
                <XCircle className="mr-2 h-4 w-4" />
                {isPending ? 'Anulando...' : 'Anular'}
            </Button>

            <DeleteConfirmDialog
                isOpen={showConfirm}
                onOpenChange={setShowConfirm}
                onConfirm={handleConfirmVoid}
                title={`Anular Cobro ${installmentNumber ? `Cuota ${installmentNumber}` : ''}`}
                description="¡ATENCIÓN! Esta acción anulará el cobro, revertirá el saldo de la venta y cambiará el estado de la cuota. Esta operación quedará registrada en el historial."
                isLoading={isPending}
            />
        </>
    )
}
