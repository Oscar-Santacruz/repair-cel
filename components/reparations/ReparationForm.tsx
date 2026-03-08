'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SubmitButton } from "@/components/ui/submit-button"
import { BrandSelector } from "@/components/reparations/BrandSelector"
import { ModelSelector } from "@/components/reparations/ModelSelector"
import Link from "next/link"
import { ArrowLeft, Smartphone, User, Wrench, CheckSquare, DollarSign } from "lucide-react"

const CHECKLIST_ITEMS = [
    { key: 'screen', label: 'Pantalla (sin rayaduras/golpes)' },
    { key: 'touch', label: 'Touch/Digitalizador funcional' },
    { key: 'camera_front', label: 'Cámara Frontal' },
    { key: 'camera_back', label: 'Cámara Trasera' },
    { key: 'speaker', label: 'Altavoz / Bocina' },
    { key: 'microphone', label: 'Micrófono' },
    { key: 'wifi', label: 'WiFi' },
    { key: 'bluetooth', label: 'Bluetooth' },
    { key: 'charging_port', label: 'Puerto de Carga' },
    { key: 'buttons', label: 'Botones físicos (volumen, encendido)' },
]

interface Client {
    id: string
    full_name: string
    document: string | null
    phone: string | null
}

interface ReparationFormProps {
    clients: Client[]
    action: (formData: FormData) => Promise<void>
    title: string
    description: string
    submitLabel: string
    cancelHref: string
    initialData?: {
        id?: string
        client_id?: string
        device_brand?: string
        device_model?: string
        imei_or_serial?: string
        aesthetic_condition?: string
        budget?: number | null
        entry_checklist?: Record<string, boolean>
    }
}

export function ReparationForm({ clients, action, title, description, submitLabel, cancelHref, initialData }: ReparationFormProps) {
    const [checklist, setChecklist] = useState<Record<string, boolean>>(
        initialData?.entry_checklist || {}
    )
    const [selectedClient, setSelectedClient] = useState(initialData?.client_id || '')
    const [clientSearch, setClientSearch] = useState('')
    const [selectedBrand, setSelectedBrand] = useState(initialData?.device_brand || '')

    const filteredClients = clients.filter(c =>
        c.full_name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        (c.document || '').includes(clientSearch)
    )

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                    <p className="text-muted-foreground">{description}</p>
                </div>
                <Link href={cancelHref}>
                    <Button variant="ghost" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Cancelar
                    </Button>
                </Link>
            </div>

            <form action={action} className="space-y-5">
                {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}

                {/* 1. Client Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="h-4 w-4 text-primary" />
                            Cliente
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Input
                            placeholder="Buscar cliente por nombre o documento..."
                            value={clientSearch}
                            onChange={e => setClientSearch(e.target.value)}
                            className="mb-2"
                        />
                        <input type="hidden" name="client_id" value={selectedClient} />
                        <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
                            {filteredClients.length === 0 ? (
                                <p className="text-center text-muted-foreground text-sm py-4">
                                    No se encontraron clientes.{' '}
                                    <Link href="/clients/new" className="text-primary underline">Crear cliente nuevo</Link>
                                </p>
                            ) : filteredClients.map(client => (
                                <button
                                    key={client.id}
                                    type="button"
                                    onClick={() => { setSelectedClient(client.id); setClientSearch(client.full_name) }}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-accent transition-colors ${selectedClient === client.id ? 'bg-primary/10 font-medium' : ''}`}
                                >
                                    <span>{client.full_name}</span>
                                    <span className="text-xs text-muted-foreground">{client.document || client.phone || ''}</span>
                                </button>
                            ))}
                        </div>
                        {!selectedClient && (
                            <p className="text-xs text-destructive">Seleccione un cliente para continuar</p>
                        )}
                    </CardContent>
                </Card>

                {/* 2. Device Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Smartphone className="h-4 w-4 text-primary" />
                            Datos del Equipo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="device_brand">Marca *</Label>
                                <BrandSelector
                                    name="device_brand"
                                    defaultValue={initialData?.device_brand}
                                    required
                                    onBrandChange={brand => setSelectedBrand(brand)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="device_model">Modelo *</Label>
                                <ModelSelector
                                    name="device_model"
                                    defaultValue={initialData?.device_model}
                                    required
                                    selectedBrand={selectedBrand}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="imei_or_serial">IMEI / Nro. de Serie</Label>
                            <Input id="imei_or_serial" name="imei_or_serial"
                                defaultValue={initialData?.imei_or_serial || ''}
                                placeholder="Ej: 123456789012345 (marcar *#06# para ver IMEI)"
                                className="font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="aesthetic_condition">Condición Estética / Descripción del Problema *</Label>
                            <Textarea id="aesthetic_condition" name="aesthetic_condition" required
                                defaultValue={initialData?.aesthetic_condition || ''}
                                placeholder="Describe la condición física del equipo y el problema reportado por el cliente..."
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="budget" className="flex items-center gap-2">
                                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                                Presupuesto estimado (Gs.)
                            </Label>
                            <Input id="budget" name="budget" type="number" min="0"
                                defaultValue={initialData?.budget ?? ''}
                                placeholder="0 (puede completarse luego)"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Entry Checklist */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CheckSquare className="h-4 w-4 text-primary" />
                            Checklist de Entrada
                        </CardTitle>
                        <CardDescription>
                            Marque con ✓ las funciones que el equipo tiene EN BUEN ESTADO al ingresar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {CHECKLIST_ITEMS.map(item => {
                                const isChecked = checklist[item.key] === true
                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => setChecklist(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                                        className={`flex items-center gap-3 p-3 rounded-lg border text-sm text-left transition-all ${isChecked
                                            ? 'bg-green-500/10 border-green-500/40 text-green-700 dark:text-green-400'
                                            : 'bg-card border-border text-muted-foreground hover:bg-accent/40'
                                            }`}
                                    >
                                        <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-muted-foreground'}`}>
                                            {isChecked && <span className="text-[10px] font-bold">✓</span>}
                                        </div>
                                        <input type="hidden" name={`checklist_${item.key}`} value={isChecked ? 'true' : 'false'} />
                                        {item.label}
                                    </button>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                <SubmitButton className="w-full h-12 text-lg font-semibold" disabled={!selectedClient}>
                    {submitLabel}
                </SubmitButton>
            </form>
        </div>
    )
}
