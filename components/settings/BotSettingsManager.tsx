'use client'

import { useState } from "react"
import { saveWhatsAppSettings } from "@/app/notification-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Bot, Link, KeyRound } from "lucide-react"

export function BotSettingsManager({ settings }: { settings?: any }) {
    const [isLoading, setIsLoading] = useState(false)
    const [webhookUrl, setWebhookUrl] = useState(settings?.whatsapp_bot_url || "")
    const [webhookToken, setWebhookToken] = useState(settings?.whatsapp_bot_token || "")

    async function handleSave() {
        setIsLoading(true)
        try {
            // Re-fetch or pass along other required WA settings so they aren't lost
            await saveWhatsAppSettings({
                wa_due_today_template: settings?.wa_due_today_template || '',
                wa_overdue_template: settings?.wa_overdue_template || '',
                wa_overdue_threshold_days: settings?.wa_overdue_threshold_days || 5,
                wa_overdue_frequency_days: settings?.wa_overdue_frequency_days || 5,
                whatsapp_bot_url: webhookUrl,
                whatsapp_bot_token: webhookToken
            })
            toast.success("Credenciales del Bot guardadas correctamente")
        } catch (error: any) {
            toast.error(error.message || "Error al guardar la configuración del Bot")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Conexión WhatsApp Bot
                </CardTitle>
                <CardDescription>
                    Configura la URL y el Token de Seguridad del webhook del bot central para esta empresa.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="webhook_url" className="flex items-center gap-2">
                        <Link className="h-4 w-4" />
                        URL del Webhook
                    </Label>
                    <Input
                        id="webhook_url"
                        placeholder="ej: https://api.bot.com"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        La URL del servidor central del bot que maneja tus notificaciones.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="webhook_token" className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4" />
                        Token de Autenticación
                    </Label>
                    <Input
                        id="webhook_token"
                        type="password"
                        placeholder="Token secreto"
                        value={webhookToken}
                        onChange={(e) => setWebhookToken(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        El token de seguridad provisto por el administrador para conectarse al bot.
                    </p>
                </div>

                <Button onClick={handleSave} disabled={isLoading} className="w-full">
                    {isLoading ? "Guardando..." : "Guardar Credenciales"}
                </Button>
            </CardContent>
        </Card>
    )
}
