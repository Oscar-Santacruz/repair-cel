import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, User, CreditCard, FileText, Package } from "lucide-react"
import { getSaleById, type SaleCartItem } from "@/app/(authenticated)/pos/actions"

interface PageProps { params: Promise<{ id: string }> }

function formatGs(v: number) { return `Gs. ${v.toLocaleString('es-PY')}` }

const PAYMENT_LABELS: Record<string, string> = {
    CASH: 'Efectivo', TRANSFER: 'Transferencia', CARD: 'Tarjeta',
}

export default async function SaleDetailPage({ params }: PageProps) {
    const { id } = await params
    const sale = await getSaleById(id)
    if (!sale) notFound()

    const items = (sale.sale_items || []) as SaleCartItem[]

    const client = sale.clients as { full_name: string; phone: string | null } | null

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/pos"><Button variant="ghost" size="sm" className="gap-1.5 mb-1"><ArrowLeft className="h-3.5 w-3.5" /> Punto de Venta</Button></Link>
                    <h2 className="text-2xl font-bold">Venta Registrada ✓</h2>
                    <p className="font-mono text-muted-foreground">{sale.invoice_number}</p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-bold text-primary">{formatGs(sale.total_amount)}</p>
                    <p className="text-sm text-muted-foreground">{new Date(sale.created_at).toLocaleString('es-PY')}</p>
                </div>
            </div>

            <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Detalle</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p className="text-xs text-muted-foreground">Cliente</p>
                        <p className="font-medium flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-muted-foreground" />{client?.full_name || 'Sin cliente'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Forma de Pago</p>
                        <p className="font-medium flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-muted-foreground" />{PAYMENT_LABELS[sale.payment_method || ''] || sale.payment_method}</p>
                    </div>
                    {(sale.discount ?? 0) > 0 && (
                        <div>
                            <p className="text-xs text-muted-foreground">Descuento</p>
                            <p className="font-medium text-green-600">-{formatGs(sale.discount ?? 0)}</p>
                        </div>
                    )}
                    {sale.sale_notes && (
                        <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">Notas</p>
                            <p>{sale.sale_notes}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Ítems</CardTitle></CardHeader>
                <CardContent>
                    {items.map(item => (
                        <div key={item.id || item.stock_id} className="flex items-center gap-3 py-2 border-b last:border-0">
                            <div className="flex-1">
                                <p className="text-sm font-medium">{item.description}</p>
                                <p className="text-xs text-muted-foreground">{item.quantity} u. × {formatGs(item.unit_price)}</p>
                            </div>
                            <p className="font-mono font-semibold">{formatGs(item.total)}</p>
                        </div>
                    ))}
                    <div className="flex justify-between pt-3 font-bold border-t">
                        <span>Total</span>
                        <span className="font-mono text-primary">{formatGs(sale.total_amount)}</span>
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-3">
                <Link href="/pos" className="flex-1">
                    <Button variant="outline" className="w-full">Nueva Venta</Button>
                </Link>
                <Button
                    className="flex-1"
                    onClick={() => typeof window !== 'undefined' && window.print()}
                    variant="default"
                >
                    Imprimir Recibo
                </Button>
            </div>
        </div>
    )
}
