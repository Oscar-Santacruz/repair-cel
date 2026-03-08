import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Building2, Phone, Mail, FileText } from "lucide-react"
import { getSuppliers } from "./actions"
import { SuppliersList } from "@/components/suppliers/SuppliersList"

interface PageProps {
    searchParams: Promise<{ q?: string }>
}

export default async function SuppliersPage({ searchParams }: PageProps) {
    const { q = '' } = await searchParams
    const suppliers = await getSuppliers(q)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Proveedores</h2>
                    <p className="text-muted-foreground">Proveedores de repuestos e insumos · {suppliers.length} registrados</p>
                </div>
                <Link href="/suppliers/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Proveedor
                    </Button>
                </Link>
            </div>

            <SuppliersList initialSuppliers={suppliers} />
        </div>
    )
}
