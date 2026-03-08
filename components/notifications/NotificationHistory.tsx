'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { MessageSquare, CheckCircle2, XCircle, ExternalLink, RefreshCcw } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { useTransition } from "react"
import { resendNotification } from "@/app/notification-actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function NotificationHistory({ notifications }: { notifications: any[] }) {
    const [selectedMessage, setSelectedMessage] = useState<any>(null)
    const [isPending, startTransition] = useTransition()
    const [resendingId, setResendingId] = useState<string | null>(null)

    const handleResend = async (id: string) => {
        setResendingId(id)
        startTransition(async () => {
            try {
                const result = await resendNotification(id)
                if (result.success) {
                    toast.success("Mensaje reenviado correctamente")
                } else {
                    toast.error(`Error al reenviar: ${result.error}`)
                }
            } catch (error) {
                toast.error("Error al reenviar el mensaje")
            } finally {
                setResendingId(null)
            }
        })
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                        Últimos 200 mensajes enviados
                    </CardTitle>
                    <CardDescription>
                        Esta lista muestra los mensajes despachados. Hacé <strong>doble clic</strong> en una fila para ver el mensaje completo en grande.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-equipo">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha y Hora</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Tipo de Mensaje</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="w-[30%]">Detalle del Mensaje</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {notifications.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            No hay registros de mensajes enviados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    notifications.map((notif: any) => (
                                        <TableRow
                                            key={notif.id}
                                            onDoubleClick={() => setSelectedMessage(notif)}
                                            className="cursor-pointer hover:bg-muted/50 transition-colors select-none"
                                            title="Doble clic para ver mensaje completo"
                                        >
                                            <TableCell className="whitespace-nowrap font-medium text-sm text-muted-foreground">
                                                {format(new Date(notif.sent_at), "dd/MM/yyyy HH:mm")}
                                            </TableCell>

                                            <TableCell>
                                                {notif.clients ? (
                                                    <div className="flex flex-col">
                                                        <Link href={`/clients/${notif.client_id}`} className="font-semibold text-blue-600 hover:underline flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                            {notif.clients.name}
                                                        </Link>
                                                        <span className="text-xs text-muted-foreground">{notif.phone}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-semibold">{notif.phone}</span>
                                                )}

                                                {notif.sale_id && (
                                                    <Link href={`/sales/${notif.sale_id}`} className="text-[10px] text-gray-500 hover:text-gray-900 mt-1 inline-flex items-center gap-1 hover:underline" onClick={(e) => e.stopPropagation()}>
                                                        Venta <ExternalLink className="h-2 w-2" />
                                                    </Link>
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${notif.type === 'payment_confirmation'
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                                                    : 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
                                                    }`}>
                                                    {notif.type === 'payment_confirmation' ? 'Confirmación' : 'Recordatorio'}
                                                </span>
                                            </TableCell>

                                            <TableCell>
                                                {notif.status === 'sent' ? (
                                                    <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                                                        <CheckCircle2 className="h-2.5 w-2.5" /> OK
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800">
                                                        <XCircle className="h-2.5 w-2.5" /> Error
                                                    </span>
                                                )}
                                            </TableCell>

                                            <TableCell className="text-xs">
                                                <div className="line-clamp-2 text-muted-foreground italic" title={notif.message}>
                                                    "{notif.message}"
                                                </div>
                                                {notif.error_message && (
                                                    <div className="text-[10px] text-red-600 mt-1 font-medium bg-red-50 p-1 px-2 rounded border border-red-100">
                                                        Error: {notif.error_message}
                                                    </div>
                                                )}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={resendingId !== null}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleResend(notif.id)
                                                    }}
                                                    className="h-8 px-2 text-[10px] gap-1"
                                                >
                                                    <RefreshCcw className={`h-3 w-3 ${resendingId === notif.id ? 'animate-spin' : ''}`} />
                                                    Reenviar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-green-600" />
                            Detalle del Mensaje Enviado
                        </DialogTitle>
                        <DialogDescription>
                            Enviado a {selectedMessage?.clients?.name || selectedMessage?.phone} el {selectedMessage && format(new Date(selectedMessage.sent_at), "dd/MM/yyyy HH:mm")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 p-6 bg-muted rounded-lg border whitespace-pre-wrap font-sans text-sm shadow-inner leading-relaxed overflow-y-equipo max-h-[60vh] text-foreground">
                        {selectedMessage?.message}
                    </div>
                    {selectedMessage?.error_message && (
                        <div className="mt-2 p-3 bg-red-50 text-red-700 border border-red-100 rounded text-xs italic">
                            <strong>Error de envío:</strong> {selectedMessage.error_message}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
