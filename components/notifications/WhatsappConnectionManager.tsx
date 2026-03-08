'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Smartphone, RefreshCw, LogOut, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { getWhatsAppBotStatus, connectWhatsAppBot, disconnectWhatsAppBot } from "@/app/notification-actions"

export function WhatsappConnectionManager() {
    const [status, setStatus] = useState<'loading' | 'disconnected' | 'connecting' | 'connected' | 'error'>('loading')
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const checkStatus = async () => {
        try {
            const res = await getWhatsAppBotStatus()
            if (res.error) {
                if (res.error.includes('No session initialized')) {
                    setStatus('disconnected')
                    setQrCode(null)
                    return
                }
                if (res.error.includes('fetch failed')) {
                    setStatus('error')
                    setErrorMsg('No se pudo conectar con el servidor del bot de WhatsApp.')
                } else {
                    setStatus('error')
                    setErrorMsg(res.error)
                }
                setQrCode(null)
                return
            }

            if (res.connected) {
                setStatus('connected')
                setQrCode(null)
            } else if (res.qr) {
                setStatus('connecting')
                setQrCode(res.qr)
            } else {
                setStatus('disconnected')
                setQrCode(null)
            }
        } catch (e: any) {
            setStatus('error')
            setErrorMsg(e.message)
        }
    }

    // Initial check
    useEffect(() => {
        checkStatus()
    }, [])

    // Polling when connecting
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (status === 'connecting') {
            interval = setInterval(() => {
                checkStatus()
            }, 3000)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [status])

    const handleConnect = async () => {
        setStatus('loading')
        try {
            await connectWhatsAppBot()
            toast.info("Iniciando conexión. Espere el código QR...")
            // Will start polling due to status change if connection gives QR
            checkStatus()
        } catch (e: any) {
            setStatus('error')
            setErrorMsg(e.message)
            toast.error("Error al iniciar conexión: " + e.message)
        }
    }

    const handleDisconnect = async () => {
        setStatus('loading')
        try {
            await disconnectWhatsAppBot()
            toast.success("WhatsApp desconectado correctamente")
            checkStatus()
        } catch (e: any) {
            setStatus('error')
            setErrorMsg(e.message)
            toast.error("Error al desconectar: " + e.message)
        }
    }

    return (
        <Card className="border-blue-100 bg-blue-50/20">
            <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Smartphone className="h-4 w-4" /> Conexión de WhatsApp
                </CardTitle>
                <CardDescription>
                    Vincula un número de WhatsApp para enviar notificaciones a los clientes.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {status === 'loading' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin" /> Verificando estado...
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-4">
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                            <strong>Error de conexión:</strong> {errorMsg}
                        </div>
                        <Button variant="outline" size="sm" onClick={checkStatus}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
                        </Button>
                    </div>
                )}

                {status === 'disconnected' && (
                    <div className="space-y-4">
                        <div className="text-sm">No hay ninguna cuenta conectada actualmente.</div>
                        <Button onClick={handleConnect}>Generar código QR</Button>
                    </div>
                )}

                {status === 'connecting' && (
                    <div className="space-y-4">
                        <div className="text-sm font-medium">Escanea este código con tu WhatsApp:</div>
                        <div className="bg-white p-4 rounded-xl border w-fit mx-equipo sm:mx-0">
                            {qrCode ? (
                                <img src={qrCode} alt="WhatsApp QR Code" className="w-[200px] h-[200px]" />
                            ) : (
                                <div className="w-[200px] h-[200px] flex items-center justify-center text-muted-foreground">
                                    <RefreshCw className="h-6 w-6 animate-spin" />
                                </div>
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground flex gap-2 items-center">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Esperando conexión... la pantalla se actualizará automáticamente.
                        </div>
                        <Button variant="outline" size="sm" onClick={handleDisconnect} className="mt-2 text-red-600">
                            Cancelar
                        </Button>
                    </div>
                )}

                {status === 'connected' && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-green-50 p-4 rounded-xl border border-green-200">
                        <div className="flex items-center gap-3 text-green-700">
                            <CheckCircle2 className="h-6 w-6" />
                            <div>
                                <div className="font-bold">WhatsApp Conectado</div>
                                <div className="text-xs text-green-600">El bot está listo para enviar mensajes automáticamente.</div>
                            </div>
                        </div>
                        <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                            <LogOut className="h-4 w-4 mr-2" /> Desconectar
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
