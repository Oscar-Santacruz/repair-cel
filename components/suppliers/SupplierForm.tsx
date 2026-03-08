'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SubmitButton } from "@/components/ui/submit-button"
import Link from "next/link"
import { ArrowLeft, Building2, Phone, Mail, MapPin, FileText, Hash } from "lucide-react"
import { Supplier } from "@/app/(authenticated)/suppliers/actions"

interface SupplierFormProps {
    initialData?: Partial<Supplier>
    action: (formData: FormData) => Promise<void>
    title: string
    submitLabel: string
}

export function SupplierForm({ initialData, action, title, submitLabel }: SupplierFormProps) {
    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                    <p className="text-muted-foreground">Complete los datos del proveedor.</p>
                </div>
                <Link href="/suppliers">
                    <Button variant="ghost" className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Cancelar
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Building2 className="h-4 w-4 text-primary" />
                        Datos del Proveedor
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={action} className="space-y-4">
                        {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}

                        <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> Nombre *
                            </Label>
                            <Input id="name" name="name" required defaultValue={initialData?.name} placeholder="Ej: Distribuidora Tech S.A." />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ruc_or_document" className="flex items-center gap-1.5">
                                <Hash className="h-3.5 w-3.5 text-muted-foreground" /> RUC / CI
                            </Label>
                            <Input id="ruc_or_document" name="ruc_or_document" defaultValue={initialData?.ruc_or_document || ''} placeholder="Ej: 80123456-7" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Teléfono
                                </Label>
                                <Input id="phone" name="phone" type="tel" defaultValue={initialData?.phone || ''} placeholder="0981 123456" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
                                </Label>
                                <Input id="email" name="email" type="email" defaultValue={initialData?.email || ''} placeholder="ventas@proveedor.com" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address" className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Dirección
                            </Label>
                            <Input id="address" name="address" defaultValue={initialData?.address || ''} placeholder="Av. Mcal. López 1234, Asunción" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes" className="flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Notas
                            </Label>
                            <Textarea id="notes" name="notes" defaultValue={initialData?.notes || ''} placeholder="Condiciones de pago, contacto, notas..." rows={2} />
                        </div>

                        <div className="pt-2">
                            <SubmitButton className="w-full h-11 font-semibold">
                                {submitLabel}
                            </SubmitButton>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
