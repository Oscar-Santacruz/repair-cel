'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { saveChassisSettings } from "@/app/settings-actions"
import { toast } from "sonner"

interface ChassisSettingsManagerProps {
    settings: any
}

export function ChassisSettingsManager({ settings }: ChassisSettingsManagerProps) {
    const [isRequired, setIsRequired] = useState(settings?.chassis_required || false)
    const [isUnique, setIsUnique] = useState(settings?.chassis_unique === undefined ? true : settings.chassis_unique)
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await saveChassisSettings(
                isRequired,
                isUnique,
                settings?.id
            )
            toast.success("Configuración de chasis guardada")
        } catch (error) {
            console.error("Error saving settings:", error)
            toast.error("Error al guardar configuración")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Configuración de Chasis</CardTitle>
                <CardDescription>
                    Define las validaciones para el campo Nro. de Chasis / VIN.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                        <Label htmlFor="chassis-required">Nro. de Chasis Obligatorio</Label>
                        <p className="text-sm text-muted-foreground">
                            Si se activa, no se permitirá guardar equipos sin este dato.
                        </p>
                    </div>
                    <Switch
                        id="chassis-required"
                        checked={isRequired}
                        onCheckedChange={setIsRequired}
                    />
                </div>
                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                        <Label htmlFor="chassis-unique">Validar Unicidad</Label>
                        <p className="text-sm text-muted-foreground">
                            Si se activa, el sistema verificará que el Nro. de Chasis no esté duplicado (si se ingresa).
                        </p>
                    </div>
                    <Switch
                        id="chassis-unique"
                        checked={isUnique}
                        onCheckedChange={setIsUnique}
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Guardando..." : "Guardar Configuración"}
                </Button>
            </CardFooter>
        </Card>
    )
}
