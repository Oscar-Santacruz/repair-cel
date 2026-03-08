import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, ShoppingCart, CheckCircle2, Clock } from "lucide-react"
import { getPurchaseOrders } from "./actions"
import { Badge } from "@/components/ui/badge"

interface PageProps {
    searchParams: Promise<{ q?: string }>
}

function formatGs(v: number) { return `Gs. ${v.toLocaleString('es-PY')}` }

export default async function PurchasesPage({ searchParams }: PageProps) {
    const { q = '' } = await searchParams
    const orders = await getPurchaseOrders(q)

    const totalPending = orders.filter(o => o.payment_status === 'PENDING').reduce((s, o) => s + o.total_amount, 0)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Compras</h2>
                    <p className="text-muted-foreground">
                        Registro de facturas de compra · {orders.length} órdenes
                        {totalPending > 0 && <span className="ml-2 text-amber-500 font-medium">· {formatGs(totalPending)} pendiente de pago</span>}
                    </p>
                </div>
                <Link href="/purchases/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Compra
                    </Button>
                </Link>
            </div>

            {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 border rounded-lg bg-card gap-3">
                    <ShoppingCart className="h-10 w-10 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-sm">No hay compras registradas.</p>
                    <Link href="/purchases/new">
                        <Button size="sm" variant="secondary">
                            <Plus className="h-4 w-4 mr-1" /> Registrar primera compra
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="rounded-md border bg-card overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/40">
                                <th className="px-4 py-3 text-left font-medium">Orden</th>
                                <th className="px-4 py-3 text-left font-medium">Proveedor</th>
                                <th className="px-4 py-3 text-left font-medium">Factura</th>
                                <th className="px-4 py-3 text-left font-medium">Fecha</th>
                                <th className="px-4 py-3 text-right font-medium">Total</th>
                                <th className="px-4 py-3 text-center font-medium">Pago</th>
                                <th className="px-4 py-3 text-right font-medium w-16"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id} className="border-b hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-mono font-medium text-primary">{order.order_number}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{(order.suppliers as { name: string } | null)?.name || '—'}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{order.invoice_number || '—'}</td>
                                    <td className="px-4 py-3 text-muted-foreground text-xs">
                                        {order.invoice_date ? new Date(order.invoice_date + 'T12:00:00').toLocaleDateString('es-PY') : new Date(order.created_at).toLocaleDateString('es-PY')}
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold font-mono">{formatGs(order.total_amount)}</td>
                                    <td className="px-4 py-3 text-center">
                                        {order.payment_status === 'PAID' ? (
                                            <Badge className="bg-green-500/10 text-green-700 border-green-400/30 border">
                                                <CheckCircle2 className="h-3 w-3 mr-1" /> Pagado
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-amber-500/10 text-amber-700 border-amber-400/30 border">
                                                <Clock className="h-3 w-3 mr-1" /> Pendiente
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link href={`/purchases/${order.id}`}>
                                            <Button size="sm" variant="ghost">Ver</Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
