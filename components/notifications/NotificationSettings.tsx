'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { saveWhatsAppSettings } from "@/app/notification-actions"
import { Settings, Save, AlertCircle } from "lucide-react"

export function NotificationSettings({ settings }: { settings: any }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        wa_due_today_template: settings?.wa_due_today_template || "",
        wa_overdue_template: settings?.wa_overdue_template || "",
        wa_overdue_threshold_days: settings?.wa_overdue_threshold_days || 5,
        wa_overdue_frequency_days: settings?.wa_overdue_frequency_days || 5,
        wa_show_installment_number: settings?.wa_show_installment_number !== false,
    })

    const handleSave = async () => {
        setLoading(true)
        try {
            await saveWhatsAppSettings(formData)
            toast.success("Configuración guardada correctamente")
        } catch (error: any) {
            toast.error("Error al guardar: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Due Today Template */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            Plantilla: Vencimientos de Hoy
                        </CardTitle>
                        <CardDescription>Mensaje para cuotas que vencen en la fecha actual.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            rows={8}
                            value={formData.wa_due_today_template}
                            onChange={(e) => setFormData({ ...formData, wa_due_today_template: e.target.value })}
                        />
                        <div className="text-[10px] text-muted-foreground bg-accent/30 p-2 rounded border">
                            <strong>Tags disponibles:</strong> {`{cliente}, {cuota_nro}, {equipo}, {monto}`}
                        </div>
                    </CardContent>
                </Card>

                {/* Overdue Template */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            Plantilla: Morosidad
                        </CardTitle>
                        <CardDescription>Mensaje para clientes con cuotas ya vencidas.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            rows={8}
                            value={formData.wa_overdue_template}
                            onChange={(e) => setFormData({ ...formData, wa_overdue_template: e.target.value })}
                        />
                        <div className="text-[10px] text-muted-foreground bg-accent/30 p-2 rounded border">
                            <strong>Tags disponibles:</strong> {`{cliente}, {equipo}, {detalle_cuotas}, {total_pendiente}`}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Thresholds and Frequency */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Settings className="h-4 w-4" /> Parámetros de Envío
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <Label>¿A partir de cuántos días de mora se notifica?</Label>
                        <div className="flex items-center gap-3">
                            <Input
                                type="number"
                                value={formData.wa_overdue_threshold_days}
                                onChange={(e) => setFormData({ ...formData, wa_overdue_threshold_days: parseInt(e.target.value) })}
                                className="max-w-[100px]"
                            />
                            <span className="text-sm text-muted-foreground">días de vencimiento.</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>¿Con qué frecuencia re-notificar a un moroso?</Label>
                        <div className="flex items-center gap-3">
                            <Input
                                type="number"
                                value={formData.wa_overdue_frequency_days}
                                onChange={(e) => setFormData({ ...formData, wa_overdue_frequency_days: parseInt(e.target.value) })}
                                className="max-w-[100px]"
                            />
                            <span className="text-sm text-muted-foreground">días entre mensajes.</span>
                        </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label>Formato de Mensaje</Label>
                        <div className="flex items-center gap-3 pt-2">
                            <Checkbox
                                id="show-installment"
                                checked={formData.wa_show_installment_number}
                                onCheckedChange={(checked) => setFormData({ ...formData, wa_show_installment_number: checked === true })}
                            />
                            <Label htmlFor="show-installment" className="cursor-pointer font-normal text-sm">
                                Mostrar el número de cuota en el mensaje enviado
                            </Label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Guardando..." : "Guardar Configuración"}
                </Button>
            </div>
        </div>
    )
}
