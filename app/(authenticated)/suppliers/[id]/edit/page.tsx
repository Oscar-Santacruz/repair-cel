import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { updateSupplierAction } from "@/app/(authenticated)/suppliers/actions"
import { SupplierForm } from "@/components/suppliers/SupplierForm"

async function getSupplier(id: string) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    )
    const { data, error } = await supabase.from('suppliers').select('*').eq('id', id).maybeSingle()
    if (error || !data) return null
    return data
}

interface PageProps { params: Promise<{ id: string }> }

export default async function EditSupplierPage({ params }: PageProps) {
    const { id } = await params
    const supplier = await getSupplier(id)
    if (!supplier) notFound()

    return (
        <SupplierForm
            initialData={supplier}
            action={updateSupplierAction}
            title="Editar Proveedor"
            submitLabel="Guardar Cambios"
        />
    )
}
