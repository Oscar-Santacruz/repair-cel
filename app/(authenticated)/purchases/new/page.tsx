import { getSuppliers } from "@/app/(authenticated)/suppliers/actions"
import { getStockItems } from "@/app/(authenticated)/inventory/actions"
import { NewPurchaseForm } from "@/components/purchases/NewPurchaseForm"

export default async function NewPurchasePage() {
    const [suppliers, { items: stockItems }] = await Promise.all([
        getSuppliers(),
        getStockItems('', '', 1, 500),
    ])

    return <NewPurchaseForm suppliers={suppliers} stockItems={stockItems} />
}
