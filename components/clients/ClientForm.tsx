'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SubmitButton } from "@/components/ui/submit-button"
import Link from "next/link"
import { User, CreditCard, Phone, MapPin, Mail, ArrowLeft } from "lucide-react"

interface ClientFormProps {
    initialData?: {
        id?: string
        full_name: string
        document?: string
        phone?: string
        email?: string
        address?: string
    }
    action: (formData: FormData) => Promise<void>
    title: string
    description: string
    submitLabel: string
    cancelHref: string
}

export function ClientForm({ initialData, action, title, description, submitLabel, cancelHref }: ClientFormProps) {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                        {title}
                    </h2>
                    <p className="text-muted-foreground">{description}</p>
                </div>
                <Link href={cancelHref}>
                    <Button variant="ghost" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Cancelar
                    </Button>
                </Link>
            </div>

            <Card className="shadow-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Datos Personales
                    </CardTitle>
                    <CardDescription>
                        Complete la información del cliente. Los campos con * son obligatorios.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={action} className="space-y-6">
                        {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}

                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="full_name" className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    Nombre Completo *
                                </Label>
                                <Input
                                    id="full_name"
                                    name="full_name"
                                    required
                                    defaultValue={initialData?.full_name}
                                    placeholder="EJ: JUAN PEREZ"
                                    className="uppercase transition-all focus:ring-2 focus:ring-primary/50"
                                    onInput={(e) => {
                                        e.currentTarget.value = e.currentTarget.value.toUpperCase();
                                    }}
                                />
                                <p className="text-[11px] text-muted-foreground">El nombre se convertirá automáticamente a MAYÚSCULAS.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="document" className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                        Documento (C.I. / RUC)
                                    </Label>
                                    <Input
                                        id="document"
                                        name="document"
                                        defaultValue={initialData?.document}
                                        placeholder="Ej: 1.234.567"
                                        className="transition-all focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        Teléfono
                                    </Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        defaultValue={initialData?.phone}
                                        placeholder="Ej: +595971123123"
                                        className="transition-all focus:ring-2 focus:ring-primary/50"
                                    />
                                    <p className="text-[11px] text-muted-foreground">Formato internacional requerido para WhatsApp, ej: +595971123123</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    Correo Electrónico
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={initialData?.email}
                                    placeholder="Ej: cliente@correo.com"
                                    className="transition-all focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address" className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    Dirección
                                </Label>
                                <Input
                                    id="address"
                                    name="address"
                                    defaultValue={initialData?.address}
                                    placeholder="Ej: Calle Principal 123"
                                    className="transition-all focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <SubmitButton className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                                {submitLabel}
                            </SubmitButton>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
