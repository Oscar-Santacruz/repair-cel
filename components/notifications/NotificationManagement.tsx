"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { sendManualNotification } from "@/app/notification-actions"
import { Send, Users, AlertCircle, Clock, MessageSquare } from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

export function NotificationManagement({ reminders, settings }: { reminders: any[], settings?: any }) {
    const [mounted, setMounted] = useState(false)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [sending, setSending] = useState<string | null>(null)
    const [batchSending, setBatchSending] = useState(false)
    const [previewing, setPreviewing] = useState<any>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === reminders.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(reminders.map(r => r.clientId + r.saleId))
        }
    }

    const handleSend = async (reminder: any) => {
        const id = reminder.clientId + reminder.saleId
        setSending(id)
        try {
            const res = await sendManualNotification(reminder)
            if (res.success) {
                toast.success(`Notificación enviada a ${reminder.clientName}`)
            } else {
                toast.error(`Error al enviar a ${reminder.clientName}: ${res.error}`)
            }
        } catch (error: any) {
            toast.error("Error inesperado: " + error.message)
        } finally {
            setSending(null)
        }
    }

    const handleSendAll = async () => {
        if (selectedIds.length === 0) return
        setBatchSending(true)
        let successCount = 0
        let failCount = 0

        const itemsToSend = reminders.filter(r => selectedIds.includes(r.clientId + r.saleId))

        for (const item of itemsToSend) {
            try {
                const res = await sendManualNotification(item)
                if (res.success) successCount++
                else failCount++
            } catch (e) {
                failCount++
            }
        }

        toast.success(`Proceso finalizado. Éxito: ${successCount}, Error: ${failCount}`)
        setBatchSending(false)
        setSelectedIds([])
    }

    const handlePreview = (reminder: any) => {
        setPreviewing(reminder);
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            Mensajes Pendientes
                        </CardTitle>
                        <CardDescription>
                            Listado de clientes para notificar hoy. Hacé <strong>doble clic</strong> en una fila para previsualizar el mensaje.
                        </CardDescription>
                    </div>
                    <Button
                        variant="default"
                        size="sm"
                        disabled={selectedIds.length === 0 || batchSending}
                        onClick={handleSendAll}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Send className="h-4 w-4 mr-2" />
                        {batchSending ? "Enviando..." : `Notificar Seleccionados (${selectedIds.length})`}
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-equipo">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={selectedIds.length === reminders.length && reminders.length > 0}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>Cliente / Equipos</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Estado Pendiente</TableHead>
                                    <TableHead>Última Notif.</TableHead>
                                    <TableHead className="text-right">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reminders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            No hay notificaciones pendientes para enviar hoy.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reminders.map((r, i) => {
                                        const id = r.clientId + r.saleId
                                        return (
                                            <TableRow
                                                key={id + i}
                                                onDoubleClick={() => handlePreview(r)}
                                                className="cursor-pointer hover:bg-muted/50 transition-colors select-none"
                                                title="Doble clic para previsualizar mensaje"
                                            >
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox
                                                        checked={selectedIds.includes(id)}
                                                        onCheckedChange={() => toggleSelect(id)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{r.clientName}</span>
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Clock className="h-3 w-3" /> {r.vehicleInfo}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={r.type === 'due_today' ? 'outline' : 'destructive'} className="whitespace-nowrap">
                                                        {r.type === 'due_today' ? 'Vence Hoy' : 'Moroso'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {r.type === 'due_today' ? (
                                                        <div className="text-xs space-y-1">
                                                            <div className="font-semibold text-blue-700">Cuota {r.installmentNumber}</div>
                                                            <div>{Number(r.amount).toLocaleString('es-PY')} Gs.</div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-[10px] space-y-1 max-w-[200px]">
                                                            <div className="font-bold text-red-700 uppercase flex items-center gap-1">
                                                                <AlertCircle className="h-3 w-3" /> {r.installments.length} cuotas con {r.daysOverdue} días de mora
                                                            </div>
                                                            <div className="space-y-0.5 border-l-2 border-red-100 pl-2 mt-1">
                                                                {r.installments.slice(0, 3).map((inst: any, idx: number) => (
                                                                    <div key={idx} className="flex justify-between items-center gap-2">
                                                                        <span>Cuota {inst.number} ({format(parseISO(inst.dueDate), 'dd/MM/yyyy')} venció):</span>
                                                                        <span className="font-bold whitespace-nowrap">
                                                                            {Number(Number(inst.amount) + Number(inst.penalty || 0)).toLocaleString('es-PY')}
                                                                        </span>
                                                                        {inst.penalty > 0 && (
                                                                            <span className="text-[8px] text-muted-foreground">
                                                                                ({Number(inst.amount).toLocaleString('es-PY')} + {Number(inst.penalty || 0).toLocaleString('es-PY')} multa)
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                {r.installments.length > 3 && (
                                                                    <div className="text-muted-foreground italic">... y {r.installments.length - 3} cuotas más</div>
                                                                )}
                                                            </div>
                                                            <div className="pt-1 mt-1 border-t font-bold text-red-700 flex justify-between">
                                                                <span>TOTAL:</span>
                                                                <span>{Number(r.totalAmount).toLocaleString('es-PY')} Gs.</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs">
                                                            {r.lastNotified
                                                                ? format(parseISO(r.lastNotified), "dd/MM/yyyy", { locale: es })
                                                                : 'Nunca'}
                                                        </span>
                                                        {r.lastNotified && (
                                                            <span className="text-[10px] text-muted-foreground">
                                                                Hace {differenceInDays(new Date(), parseISO(r.lastNotified))} días
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={sending === id || batchSending}
                                                        onClick={() => handleSend(r)}
                                                    >
                                                        {sending === id ? "..." : <Send className="h-4 w-4" />}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!previewing} onOpenChange={() => setPreviewing(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                            Previsualización del Mensaje
                        </DialogTitle>
                        <DialogDescription>
                            Así se verá el mensaje que se enviará a {previewing?.clientName}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 p-6 bg-muted rounded-lg border whitespace-pre-wrap font-sans text-sm shadow-inner leading-relaxed overflow-y-equipo max-h-[60vh] text-foreground">
                        {previewing && (
                            previewing.type === 'due_today'
                                ? `⏰ *Recordatorio de Vencimiento*\n\nHola ${previewing.clientName}, le recordamos que su *${settings?.wa_show_installment_number !== false ? `Cuota N° ${previewing.installmentNumber}` : 'cuota'}* del equipos *${previewing.vehicleInfo}* por *${Number(previewing.amount).toLocaleString('es-PY')} Gs.* vence *hoy*.\n\nPor favor, realice su pago en tiempo y forma. ¡Muchas gracias!`
                                : `⚠️ *Aviso de Morosidad*\n\nHola ${previewing.clientName}, le enviamos el detalle de su estado de cuenta para el equipos *${previewing.vehicleInfo}*:\n\n${previewing.installments.map((i: any) => settings?.wa_show_installment_number !== false ? `- Cuota ${i.number} (Venció ${format(parseISO(i.dueDate), 'dd/MM/yyyy')}): *${Number(Number(i.amount) + Number(i.penalty || 0)).toLocaleString('es-PY')} Gs.*${i.penalty > 0 ? ` (${Number(i.amount).toLocaleString('es-PY')} + ${Number(i.penalty || 0).toLocaleString('es-PY')} multa)` : ""}` : `- Venció ${format(parseISO(i.dueDate), 'dd/MM/yyyy')}: *${Number(Number(i.amount) + Number(i.penalty || 0)).toLocaleString('es-PY')} Gs.*${i.penalty > 0 ? ` (${Number(i.amount).toLocaleString('es-PY')} + ${Number(i.penalty || 0).toLocaleString('es-PY')} multa)` : ""}`).join('\n')}\n\n*Total Pendiente:* ${Number(previewing.totalAmount).toLocaleString('es-PY')} Gs.\n\nPor favor, regularice su situación a la brevedad. ¡Muchas gracias!`
                        )}
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" onClick={() => setPreviewing(null)}>Cerrar</Button>
                        <Button onClick={() => { handleSend(previewing); setPreviewing(null); }}>
                            <Send className="h-4 w-4 mr-2" /> Enviar ahora
                        </Button>
                    </div>
                </DialogContent>
            </Dialog >
        </>
    )
}

function differenceInDays(d1: Date, d2: Date) {
    const diffTime = Math.abs(d1.getTime() - d2.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
