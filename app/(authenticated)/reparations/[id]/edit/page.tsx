import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { updateReparationAction } from '@/app/(authenticated)/reparations/actions'
import { ReparationForm } from '@/components/reparations/ReparationForm'
import { getOrganizationId } from '@/lib/auth'

async function getPageData(id: string) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    )
    const organization_id = await getOrganizationId(supabase)

    const [{ data: rep }, { data: clients }] = await Promise.all([
        supabase.from('reparations').select('*').eq('id', id).maybeSingle(),
        supabase.from('clients').select('id, full_name, document, phone').eq('organization_id', organization_id).order('full_name'),
    ])

    return { rep, clients: clients || [] }
}

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EditReparationPage({ params }: PageProps) {
    const { id } = await params
    const { rep, clients } = await getPageData(id)
    if (!rep) notFound()

    return (
        <ReparationForm
            clients={clients}
            action={updateReparationAction}
            title="Editar Recepción"
            description={`Modificar orden ${rep.ticket_number}`}
            submitLabel="Guardar Cambios"
            cancelHref={`/reparations/${id}`}
            initialData={{
                id: rep.id,
                client_id: rep.client_id,
                device_brand: rep.device_brand,
                device_model: rep.device_model,
                imei_or_serial: rep.imei_or_serial,
                aesthetic_condition: rep.aesthetic_condition,
                budget: rep.budget,
                entry_checklist: rep.entry_checklist,
            }}
        />
    )
}
