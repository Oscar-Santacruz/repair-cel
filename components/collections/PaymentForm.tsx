'use client'

import { toast } from "sonner"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"
import { processPayment } from "@/app/collection-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircle, FileText, Smartphone, CreditCard, ArrowLeft, Printer } from "lucide-react"
import { useRouter } from "next/navigation"
import { Receipt } from "./Receipt"
import { parseISO, format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { sendPaymentConfirmationAction, sendPaymentReceiptAction } from "@/app/notification-actions"
import {
    Combobox,
    ComboboxTrigger,
    ComboboxValue,
    ComboboxInput,
    ComboboxContent,
    ComboboxList,
    ComboboxItem,
    ComboboxEmpty,
} from "@/components/ui/combobox"

type Installment = {
    id: string
    number: number
    amount: number
    due_date: string
    status: string
    sales: {
        id: string
        clients: {
            name: string
            ci: string
        }
        equipos: {
            brand: string
            model: string
            year: number
            plate: string
        }
    }
}

type BankAccount = {
    id: string;
    bank_name: string;
    account_number: string;
    currency: string;
}

type PaymentFormProps = {
    installment: Installment
    settings?: any // { default_penalty_amount, penalty_grace_days }
    bankAccounts: BankAccount[]
    onSuccess?: (paymentResult: any) => void
    onCancel?: () => void
    returnUrl?: string
    serverDate?: string // Format YYYY-MM-DD
}

type PaymentMethodOption = { value: string; label: string }
type BankAccountOption = { value: string; label: string }

export function PaymentForm({ installment, settings, bankAccounts, onSuccess, onCancel, returnUrl, serverDate }: PaymentFormProps) {
    const router = useRouter()
    const receiptRef = useRef<HTMLDivElement>(null)

    // Payment State
    const [paymentAmount, setPaymentAmount] = useState<number>(0)
    const [penaltyAmount, setPenaltyAmount] = useState<number>(0)
    const [comment, setComment] = useState("")
    const [paymentMethod, setPaymentMethod] = useState<string>("cash")
    const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccountOption | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [lastPayment, setLastPayment] = useState<any>(null)

    // WhatsApp Options State
    const [isSendingWa, setIsSendingWa] = useState(false)
    const [waSent, setWaSent] = useState(false)

    // Calculate initial penalty
    useEffect(() => {
        const calculatePenalty = () => {
            if (!settings) return 0
            const dueDate = parseISO(installment.due_date)

            // Use server date if provided, otherwise fallback to local
            const today = serverDate ? parseISO(serverDate) : new Date()

            today.setHours(0, 0, 0, 0)
            dueDate.setHours(0, 0, 0, 0)

            const diffTime = today.getTime() - dueDate.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            // If overdue
            if (diffDays > 0) {
                // Check grace period
                const grace = settings.penalty_grace_days || 0
                if (diffDays > grace) {
                    // Calcular meses vencidos (cada 30 días = 1 multa)
                    let monthsOverdue = Math.floor(diffDays / 30)
                    if (monthsOverdue === 0) monthsOverdue = 1

                    return Number(settings.default_penalty_amount || 0) * monthsOverdue
                }
            }
            return 0
        }

        const initialPenalty = calculatePenalty()
        setPenaltyAmount(initialPenalty)
        setPaymentAmount(installment.amount + initialPenalty)
    }, [installment, settings, serverDate])


    const handleProcessPayment = async () => {
        setIsProcessing(true)
        try {
            const result = await processPayment({
                installmentId: installment.id,
                saleId: installment.sales.id,
                amount: paymentAmount,
                paymentMethod: paymentMethod,
                penaltyAmount,
                comment,
                referenceNumber: "",
                bankAccountId: selectedBankAccount?.value || undefined,
            }) as any

            setLastPayment(result.payment)
            toast.success("Pago registrado correctamente")
            if (onSuccess) onSuccess(result)


        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Error al procesar el pago")
        } finally {
            setIsProcessing(false)
        }
    }

    const handlePrint = () => {
        const content = receiptRef.current
        if (!content) return

        const printWindow = window.open('', '_blank')
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Imprimir Recibo</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <style>
                            @page { size: equipo; margin: 0mm; }
                            body { margin: 20mm; }
                        </style>
                    </head>
                    <body>
                        ${content.outerHTML}
                    </body>
                </html>
            `)
            printWindow.document.close()
            printWindow.focus()
            setTimeout(() => {
                printWindow.print()
                printWindow.close()
            }, 500)
        }
    }

    const handleSendWhatsApp = async () => {
        if (!lastPayment) return
        setIsSendingWa(true)
        try {
            // Send both the text confirmation and the PDF receipt automatically
            await sendPaymentConfirmationAction(lastPayment.id)

            const res = await sendPaymentReceiptAction(lastPayment.id)
            if (!res.success) throw new Error(res.error)
            toast.success("Notificaciones enviadas por WhatsApp")
            setWaSent(true)
        } catch (error: any) {
            console.error(error)
            toast.error("Error al enviar WhatsApp: " + error.message)
        } finally {
            setIsSendingWa(false)
        }
    }

    if (lastPayment) {
        return (
            <Card className="w-full max-w-md mx-equipo">
                <CardHeader>
                    <CardTitle>Pago Exitoso</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center text-green-700">
                        <CheckCircle className="h-16 w-16 mx-equipo mb-4" />
                        <p className="font-bold text-xl">Pago Registrado</p>
                        <p className="text-sm mt-2">Recibo N° {lastPayment?.receipt_number}</p>
                    </div>

                    {!waSent ? (
                        <div className="bg-muted/50 p-4 rounded-lg border space-y-4">
                            <p className="text-sm font-semibold flex items-center gap-2 mb-2">
                                <span className="bg-primary/20 p-1 rounded-full"><Printer className="h-4 w-4 text-primary" /></span>
                                Opciones de WhatsApp
                            </p>
                            <Button
                                className="w-full"
                                size="sm"
                                onClick={handleSendWhatsApp}
                                disabled={isSendingWa}
                            >
                                {isSendingWa ? "Enviando..." : "Enviar Constancia y Recibo PDF"}
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center text-blue-700 text-sm">
                            ✅ WhatsApp enviado correctamente
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button onClick={() => {
                            if (returnUrl) {
                                router.push(returnUrl)
                            } else {
                                onCancel?.()
                            }
                        }} variant="outline" className="flex-1">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                        </Button>
                        <Button className="flex-1" onClick={handlePrint}>
                            <FileText className="mr-2 h-4 w-4" /> Imprimir
                        </Button>
                    </div>

                    <div className="hidden">
                        <Receipt
                            ref={receiptRef}
                            payment={lastPayment}
                            client={installment.sales.clients}
                            sale={{
                                vehicle_brand: installment.sales.equipos.brand,
                                vehicle_model: installment.sales.equipos.model,
                                vehicle_plate: installment.sales.equipos.plate
                            }}
                            installmentNumber={installment.number}
                            settings={settings}
                        />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-lg mx-equipo">
            <CardHeader>
                <CardTitle>Registrar Cobro</CardTitle>
                <CardDescription>
                    {installment.sales.equipos.brand} {installment.sales.equipos.model} - {installment.sales.equipos.plate}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="rounded-lg bg-muted p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cuota N°:</span>
                        <span className="font-medium">{installment.number}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Vencimiento:</span>
                        <span className="font-medium">{format(parseISO(installment.due_date), "dd/MM/yyyy")}</span>
                    </div>
                    <div className="pt-2 border-t flex justify-between items-center">
                        <span className="font-semibold">Importe Cuota:</span>
                        <span className="text-lg font-bold text-primary">
                            {formatCurrency(installment.amount)}
                        </span>
                    </div>
                </div>

                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Label>Multa / Interés (Gs.)</Label>
                        <Input
                            type="text"
                            value={new Intl.NumberFormat('es-PY').format(penaltyAmount)}
                            onChange={(e) => {
                                const rawValue = e.target.value.replace(/\D/g, '')
                                const val = rawValue === '' ? 0 : Number(rawValue)
                                setPenaltyAmount(val)
                                setPaymentAmount(installment.amount + val)
                            }}
                            className="text-right"
                        />
                        {settings?.penalty_grace_days > 0 && (
                            <p className="text-xs text-muted-foreground">
                                Días de Gracia: {settings.penalty_grace_days}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Monto Total a Cobrar (Gs.)</Label>
                        <Input
                            type="text"
                            value={new Intl.NumberFormat('es-PY').format(paymentAmount)}
                            onChange={(e) => {
                                const rawValue = e.target.value.replace(/\D/g, '')
                                setPaymentAmount(rawValue === '' ? 0 : Number(rawValue))
                            }}
                            className="text-lg font-bold text-right"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Comentarios</Label>
                        <Input
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Opcional..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Método de Pago</Label>
                        <Combobox
                            value={paymentMethod}
                            onValueChange={(value) => value && setPaymentMethod(value)}
                        >
                            <ComboboxTrigger className="w-full">
                                <ComboboxValue placeholder="Seleccionar método">
                                    {paymentMethod === "cash" && "Efectivo"}
                                    {paymentMethod === "transfer" && "Transferencia"}
                                    {paymentMethod === "check" && "Cheque"}
                                    {paymentMethod === "pos" && "Tarjeta (POS)"}
                                    {!paymentMethod && "Seleccionar método"}
                                </ComboboxValue>
                            </ComboboxTrigger>
                            <ComboboxContent>
                                <ComboboxInput placeholder="Buscar..." />
                                <ComboboxList>
                                    <ComboboxEmpty>No se encontraron métodos</ComboboxEmpty>
                                    <ComboboxItem value="cash">Efectivo</ComboboxItem>
                                    <ComboboxItem value="transfer">Transferencia</ComboboxItem>
                                    <ComboboxItem value="check">Cheque</ComboboxItem>
                                    <ComboboxItem value="pos">Tarjeta (POS)</ComboboxItem>
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                    </div>

                    {paymentMethod === 'transfer' && (
                        <div className="space-y-2">
                            <Label>Cuenta Bancaria Destino</Label>
                            <Combobox
                                value={selectedBankAccount?.value || ''}
                                onValueChange={(value) => {
                                    const account = bankAccounts.find(acc => acc.id === value)
                                    if (account) {
                                        setSelectedBankAccount({
                                            value: account.id,
                                            label: `${account.bank_name} - ${account.account_number} (${account.currency})`
                                        })
                                    }
                                }}
                            >
                                <ComboboxTrigger className="w-full">
                                    <ComboboxValue placeholder="Seleccione una cuenta">
                                        {selectedBankAccount?.label || 'Seleccione una cuenta'}
                                    </ComboboxValue>
                                </ComboboxTrigger>
                                <ComboboxContent>
                                    <ComboboxInput placeholder="Buscar..." />
                                    <ComboboxList>
                                        <ComboboxEmpty>No se encontraron cuentas</ComboboxEmpty>
                                        {bankAccounts.map(acc => (
                                            <ComboboxItem key={acc.id} value={acc.id}>
                                                {acc.bank_name} - {acc.account_number} ({acc.currency})
                                            </ComboboxItem>
                                        ))}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <Button onClick={handleProcessPayment} disabled={isProcessing || (paymentMethod === 'transfer' && !selectedBankAccount)} className="w-full">
                        {isProcessing ? "Procesando..." : "Confirmar Cobro"}
                    </Button>
                    <Button variant="ghost" onClick={onCancel} disabled={isProcessing}>
                        Cancelar
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
