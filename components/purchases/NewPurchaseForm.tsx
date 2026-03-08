'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SubmitButton } from '@/components/ui/submit-button'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, ShoppingCart, Package } from 'lucide-react'
import { createPurchaseOrderAction, PurchaseOrderItem } from '@/app/(authenticated)/purchases/actions'
import { Supplier } from '@/app/(authenticated)/suppliers/actions'
import { StockItem } from '@/app/(authenticated)/inventory/actions'

interface NewPurchaseFormProps {
    suppliers: Supplier[]
    stockItems: StockItem[]
}

function formatGs(v: number) { return `Gs. ${v.toLocaleString('es-PY')}` }

export function NewPurchaseForm({ suppliers, stockItems }: NewPurchaseFormProps) {
    const [items, setItems] = useState<PurchaseOrderItem[]>([])
    const [stockSearch, setStockSearch] = useState('')
    const [customDesc, setCustomDesc] = useState('')
    const [qty, setQty] = useState(1)
    const [unitCost, setUnitCost] = useState(0)
    const [selectedStock, setSelectedStock] = useState<StockItem | null>(null)
    const [isPending, startTransition] = useTransition()

    const filteredStock = stockItems.filter(s =>
        s.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
        (s.sku || '').toLowerCase().includes(stockSearch.toLowerCase())
    ).slice(0, 8)

    function addItem() {
        const desc = selectedStock ? selectedStock.name : customDesc
        if (!desc || qty <= 0 || unitCost <= 0) return
        setItems(prev => [...prev, {
            stock_id: selectedStock?.id || null,
            description: desc,
            quantity: qty,
            unit_cost: unitCost,
            total: qty * unitCost,
        }])
        setSelectedStock(null)
        setStockSearch('')
        setCustomDesc('')
        setQty(1)
        setUnitCost(0)
    }

    function removeItem(idx: number) {
        setItems(prev => prev.filter((_, i) => i !== idx))
    }

    const total = items.reduce((s, i) => s + i.total, 0)

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Nueva Compra</h2>
                    <p className="text-muted-foreground">Registrar una factura de compra a proveedor.</p>
                </div>
                <Link href="/purchases">
                    <Button variant="ghost" className="gap-2"><ArrowLeft className="h-4 w-4" /> Cancelar</Button>
                </Link>
            </div>

            <form action={formData => startTransition(() => createPurchaseOrderAction(formData))} className="space-y-5">
                <input type="hidden" name="items_json" value={JSON.stringify(items)} />

                {/* Header data */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-primary" /> Datos de la Compra
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="supplier_id">Proveedor</Label>
                            <select id="supplier_id" name="supplier_id"
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                                <option value="">Sin proveedor especificado</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment_status">Estado de Pago</Label>
                            <select id="payment_status" name="payment_status"
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                                <option value="PENDING">Pendiente de pago</option>
                                <option value="PAID">Pagado</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoice_number">Nro. Factura del Proveedor</Label>
                            <Input id="invoice_number" name="invoice_number" placeholder="001-001-0001234" className="font-mono" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoice_date">Fecha de Factura</Label>
                            <Input id="invoice_date" name="invoice_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="notes">Notas</Label>
                            <Textarea id="notes" name="notes" rows={2} placeholder="Observaciones..." />
                        </div>
                    </CardContent>
                </Card>

                {/* Item adder */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary" /> Ítems Comprados
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Add row */}
                        <div className="p-3 rounded-lg border border-dashed bg-muted/30 space-y-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Agregar ítem</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Buscar en stock existente</Label>
                                    <Input
                                        placeholder="Nombre o SKU..."
                                        value={stockSearch}
                                        onChange={e => { setStockSearch(e.target.value); setSelectedStock(null) }}
                                    />
                                    {stockSearch && !selectedStock && filteredStock.length > 0 && (
                                        <div className="border rounded-md bg-background shadow-md max-h-40 overflow-y-auto">
                                            {filteredStock.map(s => (
                                                <button key={s.id} type="button" onClick={() => { setSelectedStock(s); setStockSearch(s.name) }}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex justify-between items-center">
                                                    <span>{s.name}</span>
                                                    {s.sku && <span className="text-xs font-mono text-muted-foreground">{s.sku}</span>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {selectedStock && (
                                        <p className="text-xs text-green-600 font-medium">✓ Vinculado: {selectedStock.name}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">O ítem personalizado (sin vincular)</Label>
                                    <Input placeholder="Descripción libre..." value={customDesc} onChange={e => setCustomDesc(e.target.value)} disabled={!!selectedStock} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Cantidad</Label>
                                    <Input type="number" min="1" value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Costo Unitario (Gs.)</Label>
                                    <Input type="number" min="0" value={unitCost || ''} onChange={e => setUnitCost(parseFloat(e.target.value) || 0)} placeholder="0" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Subtotal</Label>
                                    <div className="h-9 flex items-center px-3 rounded-md bg-muted font-mono text-sm">{formatGs(qty * unitCost)}</div>
                                </div>
                            </div>
                            <Button type="button" onClick={addItem} disabled={(!selectedStock && !customDesc) || qty <= 0 || unitCost <= 0} size="sm" variant="secondary">
                                <Plus className="h-4 w-4 mr-1" /> Agregar ítem
                            </Button>
                        </div>

                        {/* Items list */}
                        {items.length > 0 && (
                            <div className="space-y-2">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{item.description}</p>
                                            <p className="text-xs text-muted-foreground">{item.quantity} u. × {formatGs(item.unit_cost)}</p>
                                        </div>
                                        <p className="font-mono font-semibold text-sm shrink-0">{formatGs(item.total)}</p>
                                        <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive shrink-0" onClick={() => removeItem(idx)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="flex justify-end pt-2 border-t">
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Total de la orden</p>
                                        <p className="text-2xl font-bold font-mono">{formatGs(total)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <SubmitButton className="w-full h-12 text-base font-semibold" disabled={items.length === 0 || isPending}>
                    Registrar Compra
                </SubmitButton>
            </form>
        </div>
    )
}
