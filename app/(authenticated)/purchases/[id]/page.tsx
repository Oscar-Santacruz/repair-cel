import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Building2, FileText, CheckCircle2, Clock, Package } from "lucide-react"
import { getPurchaseOrderById, updatePurchasePaymentStatusAction } from "@/app/(authenticated)/purchases/actions"

interface PageProps { params: Promise<{ id: string }> }

function formatGs(v: number) { return `Gs. ${v.toLocaleString('es-PY')}` }

export default async function PurchaseDetailPage({ params }: PageProps) {
    const { id } = await params
    const order = await getPurchaseOrderById(id)
    if (!order) notFound()

    const items = (order.purchase_order_items || []) as Array<{
        id: string; description: string; quantity: number; unit_cost: number; total: number
    }>

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/purchases"><Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="h-3.5 w-3.5" /> Compras</Button></Link>
                    </div>
                    <h2 className="text-2xl font-bold font-mono">{order.order_number}</h2>
                    <p className="text-muted-foreground text-sm">
                        Registrado el {new Date(order.created_at).toLocaleDateString('es-PY')}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-bold font-mono">{formatGs(order.total_amount)}</p>
                    {order.payment_status === 'PAID' ? (
                        <Badge className="bg-green-500/10 text-green-700 border-green-400/30 border">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Pagado
                        </Badge>
                    ) : (
                        <Badge className="bg-amber-500/10 text-amber-700 border-amber-400/30 border">
                            <Clock className="h-3 w-3 mr-1" /> Pendiente de pago
                        </Badge>
                    )}
                </div>
            </div>

            {/* Info */}
            <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Información de la Compra</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p className="text-xs text-muted-foreground">Proveedor</p>
                        <p className="font-medium flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            {(order.suppliers as { name: string } | null)?.name || 'Sin proveedor'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Factura del Proveedor</p>
                        <p className="font-mono font-medium">{order.invoice_number || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Fecha Factura</p>
                        <p className="font-medium">{order.invoice_date ? new Date(order.invoice_date + 'T12:00:00').toLocaleDateString('es-PY') : '—'}</p>
                    </div>
                    {order.notes && (
                        <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">Notas</p>
                            <p>{order.notes}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Items */}
            <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Ítems Comprados</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{item.description}</p>
                                    <p className="text-xs text-muted-foreground">{item.quantity} u. × {formatGs(item.unit_cost)}</p>
                                </div>
                                <p className="font-mono font-semibold text-sm">{formatGs(item.total)}</p>
                            </div>
                        ))}
                        <div className="flex justify-between pt-2 font-semibold">
                            <span>Total</span>
                            <span className="font-mono">{formatGs(order.total_amount)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Payment toggle */}
            {order.payment_status === 'PENDING' && (
                <form action={async () => {
                    'use server'
                    await updatePurchasePaymentStatusAction(id, 'PAID')
                }}>
                    <Button type="submit" className="w-full gap-2 bg-green-600 hover:bg-green-700">
                        <CheckCircle2 className="h-4 w-4" /> Marcar como Pagado
                    </Button>
                </form>
            )}
        </div>
    )
}
