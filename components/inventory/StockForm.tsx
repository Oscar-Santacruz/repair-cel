'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SubmitButton } from "@/components/ui/submit-button"
import Link from "next/link"
import { ArrowLeft, Package, Hash, DollarSign, Tag, AlignLeft, AlertTriangle, Layers, Barcode, Wrench, ShoppingBag, FlaskConical } from "lucide-react"
import { CATEGORIES_BY_TYPE, StockType } from "@/lib/inventory"

const TYPE_OPTIONS: { value: StockType; label: string; description: string; icon: React.ReactNode; color: string }[] = [
    {
        value: 'REPUESTO',
        label: 'Repuesto',
        description: 'Pantallas, baterías, conectores...',
        icon: <Wrench className="h-5 w-5" />,
        color: 'border-blue-400 bg-blue-500/10 text-blue-700',
    },
    {
        value: 'INSUMO',
        label: 'Insumo',
        description: 'Flux, soldadura, adhesivos...',
        icon: <FlaskConical className="h-5 w-5" />,
        color: 'border-amber-400 bg-amber-500/10 text-amber-700',
    },
    {
        value: 'PRODUCTO',
        label: 'Producto para Venta',
        description: 'Celulares, fundas, láminas...',
        icon: <ShoppingBag className="h-5 w-5" />,
        color: 'border-green-400 bg-green-500/10 text-green-700',
    },
]

interface StockFormProps {
    initialData?: {
        id?: string
        stock_type?: StockType
        category?: string | null
        name?: string
        description?: string
        quantity?: number
        min_quantity?: number
        serial_number?: string | null
        cost_price?: number | null
        selling_price?: number | null
        brand?: string | null
        model_compat?: string | null
        sku?: string | null
    }
    action: (formData: FormData) => Promise<void>
    title: string
    description: string
    submitLabel: string
    cancelHref: string
}

export function StockForm({ initialData, action, title, description, submitLabel, cancelHref }: StockFormProps) {
    const [stockType, setStockType] = useState<StockType>(initialData?.stock_type || 'REPUESTO')
    const categories = CATEGORIES_BY_TYPE[stockType]

    return (
        <div className="max-w-2xl mx-auto space-y-6">
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
                <input type="hidden" name="stock_type" value={stockType} />

                {/* Type selector */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Layers className="h-4 w-4 text-primary" />
                            Tipo de ítem
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-3">
                            {TYPE_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setStockType(opt.value)}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${stockType === opt.value ? opt.color + ' border-current' : 'border-border bg-card hover:bg-accent/50'}`}
                                >
                                    <div className={stockType === opt.value ? '' : 'text-muted-foreground'}>
                                        {opt.icon}
                                    </div>
                                    <span className="font-semibold text-sm">{opt.label}</span>
                                    <span className="text-xs text-muted-foreground leading-tight">{opt.description}</span>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Category */}
                <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <select
                        id="category"
                        name="category"
                        defaultValue={initialData?.category || ''}
                        className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="">Sin categoría</option>
                        {categories.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>

                {/* Name + SKU */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5 text-muted-foreground" /> Nombre *
                        </Label>
                        <Input id="name" name="name" required defaultValue={initialData?.name} placeholder="Ej: Pantalla Samsung A52, Flux Amtech" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sku" className="flex items-center gap-1.5">
                            <Barcode className="h-3.5 w-3.5 text-muted-foreground" /> SKU / Código
                        </Label>
                        <Input id="sku" name="sku" defaultValue={initialData?.sku || ''} placeholder="P-001" className="font-mono" />
                    </div>
                </div>

                {/* Brand + Model */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="brand">Marca</Label>
                        <Input id="brand" name="brand" defaultValue={initialData?.brand || ''} placeholder="Samsung, Apple..." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="model_compat">Modelo Compatible</Label>
                        <Input id="model_compat" name="model_compat" defaultValue={initialData?.model_compat || ''} placeholder="A52, iPhone 13, universal..." />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label htmlFor="description" className="flex items-center gap-1.5">
                        <AlignLeft className="h-3.5 w-3.5 text-muted-foreground" /> Descripción
                    </Label>
                    <Textarea id="description" name="description" defaultValue={initialData?.description || ''} placeholder="Notas adicionales..." rows={2} />
                </div>

                {/* Quantity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="quantity" className="flex items-center gap-1.5">
                            <Hash className="h-3.5 w-3.5 text-muted-foreground" /> Cantidad en Stock *
                        </Label>
                        <Input id="quantity" name="quantity" type="number" min="0" required defaultValue={initialData?.quantity ?? 0} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="min_quantity" className="flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" /> Stock Mínimo (alerta)
                        </Label>
                        <Input id="min_quantity" name="min_quantity" type="number" min="0" defaultValue={initialData?.min_quantity ?? 5} />
                    </div>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="cost_price" className="flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" /> Precio de Costo (Gs.)
                        </Label>
                        <Input id="cost_price" name="cost_price" type="number" min="0" defaultValue={initialData?.cost_price ?? ''} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="selling_price" className="flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground text-green-500" /> Precio de Venta (Gs.)
                        </Label>
                        <Input id="selling_price" name="selling_price" type="number" min="0" defaultValue={initialData?.selling_price ?? ''} placeholder="0" />
                    </div>
                </div>

                {/* Serial number */}
                <div className="space-y-2">
                    <Label htmlFor="serial_number" className="flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" /> Nro. de Serie (piezas únicas)
                    </Label>
                    <Input id="serial_number" name="serial_number" defaultValue={initialData?.serial_number || ''} placeholder="Solo para piezas únicas serializadas" className="font-mono" />
                </div>

                <div className="pt-2">
                    <SubmitButton className="w-full h-12 text-lg font-semibold">
                        {submitLabel}
                    </SubmitButton>
                </div>
            </form>
        </div>
    )
}
