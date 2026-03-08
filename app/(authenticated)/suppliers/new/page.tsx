import { createSupplierAction } from "@/app/(authenticated)/suppliers/actions"
import { SupplierForm } from "@/components/suppliers/SupplierForm"

export default function NewSupplierPage() {
    return (
        <SupplierForm
            action={createSupplierAction}
            title="Nuevo Proveedor"
            submitLabel="Crear Proveedor"
        />
    )
}
