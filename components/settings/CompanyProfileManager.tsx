'use client'

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { saveCompanyDetails, uploadLogoAction } from "@/app/settings-actions"
import { AuditInfo } from "@/components/ui/audit-info"
import { Loader2, Building2 } from 'lucide-react'

interface CompanyProfileManagerProps {
    settings: any
    userNames?: Record<string, string>
}

export function CompanyProfileManager({ settings, userNames = {} }: CompanyProfileManagerProps) {
    const [companyName, setCompanyName] = useState(settings?.company_name || "")
    const [ruc, setRuc] = useState(settings?.ruc || "")
    const [address, setAddress] = useState(settings?.address || "")
    const [phone, setPhone] = useState(settings?.phone || "")
    const [email, setEmail] = useState(settings?.email || "")
    const [website, setWebsite] = useState(settings?.website || "")
    const [logo, setLogo] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(settings?.logo_url || null)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setError('El logo debe pesar menos de 2MB')
                return
            }
            if (!file.type.startsWith('image/')) {
                setError('El archivo debe ser una imagen')
                return
            }
            setLogo(file)
            setLogoPreview(URL.createObjectURL(file))
            setError('')
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        setError('')
        try {
            let finalLogoUrl = settings?.logo_url

            if (logo) {
                // Upload via server action to avoid client-side Supabase auth lock
                const formData = new FormData()
                formData.append('file', logo)
                finalLogoUrl = await uploadLogoAction(formData)
            }

            await saveCompanyDetails(
                settings?.id,
                companyName,
                ruc,
                address,
                phone,
                email,
                website,
                finalLogoUrl
            )
            setLogo(null)
        } catch (error: any) {
            console.error("Error saving company details:", error)
            setError(error.message || 'Error al guardar los datos')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>Datos de la Empresa</CardTitle>
                <CardDescription>
                    Información que aparecerá en los recibos y documentos oficiales.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="space-y-2 flex flex-col items-center flex-shrink-0">
                        <Label className="w-full text-center sm:text-left mb-1">Logo</Label>
                        <div
                            className="h-28 w-28 rounded-md border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/10 cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <div className="flex flex-col items-center text-muted-foreground p-2 text-center">
                                    <Building2 className="h-8 w-8 mb-1 opacity-50" />
                                    <span className="text-[10px]">Subir Logo (Max 2MB)</span>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleLogoChange}
                        />
                    </div>

                    <div className="grid gap-4 w-full md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Nombre / Razón Social</Label>
                            <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ej: Miguel Laneri" />
                        </div>
                        <div className="space-y-2">
                            <Label>RUC</Label>
                            <Input value={ruc} onChange={e => setRuc(e.target.value)} placeholder="Ej: 1234567-8" />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Dirección</Label>
                    <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="Dirección de Casa Matriz y Sucursales"
                    />
                    <p className="text-[10px] text-muted-foreground">Esta dirección se mostrará en el encabezado del recibo.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label>Teléfono</Label>
                        <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ej: +595 991..." />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="contacto@empresa.com" />
                    </div>
                    <div className="space-y-2">
                        <Label>Sitio Web</Label>
                        <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="www.empresa.com" />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-4">
                {error && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                        {error}
                    </div>
                )}
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        "Guardar Datos de Empresa"
                    )}
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
        </Card>
    )
}
