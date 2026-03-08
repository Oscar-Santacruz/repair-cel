import { getProductsForPOS } from "@/app/(authenticated)/pos/actions"
import { getClients } from "@/app/(authenticated)/clients/actions"
import { POSCart } from "@/components/pos/POSCart"

export default async function POSPage() {
    const [products, clientsResult] = await Promise.all([
        getProductsForPOS(),
        getClients(),
    ])

    const clients = (clientsResult as { clients?: { id: string; full_name: string; phone: string | null }[] }).clients || []

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Punto de Venta</h2>
                <p className="text-muted-foreground">{products.length} productos disponibles para venta</p>
            </div>
            <POSCart products={products} clients={clients} />
        </div>
    )
}
