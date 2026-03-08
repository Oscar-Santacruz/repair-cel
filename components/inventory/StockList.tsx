'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Package, AlertTriangle, Plus, Pencil, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { deleteStockItemAction, StockItem } from '@/app/(authenticated)/inventory/actions'
import { STOCK_TYPE_COLORS, STOCK_TYPE_LABELS, StockType } from '@/lib/inventory'

type SortKey = 'name' | 'quantity' | 'stock_type' | 'selling_price'
type SortDir = 'asc' | 'desc'

function formatGs(value: number | null) {
    if (value === null || value === undefined) return '—'
    return `Gs. ${value.toLocaleString('es-PY')}`
}

function SortableHead({ label, sortKey, currentSort, currentDir, onSort, align = 'left' }: {
    label: string; sortKey: SortKey; currentSort: SortKey | null; currentDir: SortDir
    onSort: (key: SortKey) => void; align?: 'left' | 'center' | 'right'
}) {
    const isActive = currentSort === sortKey
    return (
        <TableHead className={align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : ''}>
            <Button variant="ghost" size="sm" onClick={() => onSort(sortKey)} className="-ml-3 h-8 font-medium text-xs">
                {label}
                {isActive ? (currentDir === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />) : <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />}
            </Button>
        </TableHead>
    )
}

export function StockList({ initialItems, totalCount }: { initialItems: StockItem[]; totalCount: number }) {
    const [items, setItems] = useState<StockItem[]>(initialItems)
    const [sortKey, setSortKey] = useState<SortKey | null>(null)
    const [sortDir, setSortDir] = useState<SortDir>('asc')
    const [deleting, setDeleting] = useState<string | null>(null)

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortKey(key); setSortDir('asc') }
    }

    const sortedItems = [...items].sort((a, b) => {
        if (!sortKey) return 0
        const valA = a[sortKey] ?? ''
        const valB = b[sortKey] ?? ''
        if (valA < valB) return sortDir === 'asc' ? -1 : 1
        if (valA > valB) return sortDir === 'asc' ? 1 : -1
        return 0
    })

    async function handleDelete(id: string) {
        setDeleting(id)
        try {
            await deleteStockItemAction(id)
            setItems(prev => prev.filter(i => i.id !== id))
        } catch (e) { console.error(e) }
        finally { setDeleting(null) }
    }

    const lowStockCount = items.filter(i => i.quantity <= i.min_quantity).length

    return (
        <div className="space-y-4">
            {lowStockCount > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span><strong>{lowStockCount}</strong> ítems con stock bajo el mínimo</span>
                </div>
            )}

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <SortableHead label="Tipo" sortKey="stock_type" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                            <SortableHead label="Nombre" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                            <TableHead>Marca / Modelo</TableHead>
                            <SortableHead label="Stock" sortKey="quantity" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="center" />
                            <TableHead className="text-right">Costo</TableHead>
                            <SortableHead label="Venta" sortKey="selling_price" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="right" />
                            <TableHead className="w-20 text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Package className="h-8 w-8 opacity-30" />
                                        <span>No hay ítems registrados.</span>
                                        <Link href="/inventory/new">
                                            <Button size="sm" variant="secondary">
                                                <Plus className="h-4 w-4 mr-1" /> Agregar ítem
                                            </Button>
                                        </Link>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : sortedItems.map(item => {
                            const isLow = item.quantity <= item.min_quantity
                            const typeColor = STOCK_TYPE_COLORS[item.stock_type as StockType] || ''
                            return (
                                <TableRow key={item.id} className={isLow ? 'bg-amber-500/5' : ''}>
                                    <TableCell>
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${typeColor}`}>
                                            {STOCK_TYPE_LABELS[item.stock_type as StockType] || item.stock_type}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-medium text-sm">{item.name}</span>
                                            {isLow && <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />}
                                        </div>
                                        {item.sku && <p className="text-[11px] font-mono text-muted-foreground">{item.sku}</p>}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {[item.brand, item.model_compat].filter(Boolean).join(' · ') || '—'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={isLow ? 'destructive' : 'secondary'}>{item.quantity}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                        {formatGs(item.cost_price)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm font-medium">
                                        {formatGs(item.selling_price ?? item.price)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Link href={`/inventory/${item.id}/edit`}>
                                                <Button size="icon" variant="ghost" className="h-7 w-7">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            </Link>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Eliminar ítem?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Vas a eliminar <strong>{item.name}</strong>. Esta acción no se puede deshacer.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(item.id)} disabled={deleting === item.id} className="bg-destructive hover:bg-destructive/90">
                                                            Eliminar
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
            <p className="text-sm text-muted-foreground text-right">{totalCount} ítems en total</p>
        </div>
    )
}
