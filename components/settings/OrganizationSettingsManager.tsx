'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { saveCollectionSettings } from "@/app/settings-actions"
import { AuditInfo } from "@/components/ui/audit-info"

interface OrganizationSettingsManagerProps {
    settings: any
    userNames?: Record<string, string>
}

export function OrganizationSettingsManager({ settings, userNames = {} }: OrganizationSettingsManagerProps) {
    const [defaultPenalty, setDefaultPenalty] = useState(settings?.default_penalty_amount || 0)
    const [graceDays, setGraceDays] = useState(settings?.penalty_grace_days || 0)
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await saveCollectionSettings(
                Number(defaultPenalty),
                Number(graceDays),
                settings?.id
            )
        } catch (error) {
            console.error("Error saving settings:", error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>Configuración Financiera</CardTitle>
                <CardDescription>
                    Define los parámetros generales de cobro y mora.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="defaultPenalty">Monto de Multa por Defecto (Gs.)</Label>
                        <Input
                            id="defaultPenalty"
                            type="text"
                            value={new Intl.NumberFormat('es-PY').format(Number(defaultPenalty))}
                            onChange={(e) => {
                                const rawValue = e.target.value.replace(/\D/g, '')
                                setDefaultPenalty(rawValue === '' ? 0 : Number(rawValue))
                            }}
                            placeholder="0"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="graceDays">Días de Gracia</Label>
                        <Input
                            id="graceDays"
                            type="number"
                            value={graceDays}
                            onChange={(e) => setGraceDays(Number(e.target.value))}
                            placeholder="0"
                        />
                        <p className="text-[10px] text-muted-foreground">Días después del vencimiento antes de aplicar mora.</p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-4">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Guardando..." : "Guardar Configuración"}
                </Button>
                <AuditInfo
                    creation={{
                        by: settings?.created_by ? userNames[settings.created_by] : null,
                        at: settings?.created_at
                    }}
                    update={{
                        by: settings?.updated_by ? userNames[settings.updated_by] : null,
                        at: settings?.updated_at
                    }}
                />
            </CardFooter>
        </Card >
    )
}
