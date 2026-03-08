import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Package } from "lucide-react"
import { StockList } from "@/components/inventory/StockList"
import { getStockItems } from "./actions"
import { STOCK_TYPE_LABELS, type StockType } from "@/lib/inventory"

const TYPE_FILTERS = [
    { value: '', label: 'Todo' },
    { value: 'REPUESTO', label: 'Repuestos' },
    { value: 'INSUMO', label: 'Insumos' },
    { value: 'PRODUCTO', label: 'Productos' },
]

interface PageProps {
    searchParams: Promise<{ q?: string; type?: string; page?: string }>
}

export default async function InventoryPage({ searchParams }: PageProps) {
    const { q = '', type = '', page = '1' } = await searchParams
    const currentPage = parseInt(page)

    const { items, totalCount } = await getStockItems(q, type, currentPage, 50)
    const lowStockCount = items.filter(i => i.quantity <= i.min_quantity).length

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Inventario</h2>
                    <p className="text-muted-foreground">
                        Repuestos, insumos y productos del taller · {totalCount} ítems
                        {lowStockCount > 0 && (
                            <span className="ml-2 text-amber-500 font-medium">· {lowStockCount} con stock bajo</span>
                        )}
                    </p>
                </div>
                <Link href="/inventory/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Ítem
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <form method="GET" className="flex-1 max-w-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input name="q" defaultValue={q} placeholder="Buscar por nombre, SKU..." className="pl-9" />
                        <input type="hidden" name="type" value={type} />
                    </div>
                </form>
                <div className="flex gap-2 flex-wrap">
                    {TYPE_FILTERS.map(f => (
                        <Link key={f.value} href={`/inventory?q=${q}&type=${f.value}`}>
                            <Button variant={type === f.value ? 'default' : 'outline'} size="sm" type="button">
                                {f.label}
                            </Button>
                        </Link>
                    ))}
                </div>
            </div>

            <StockList initialItems={items} totalCount={totalCount} />
        </div>
    )
}
