import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createReparationAction } from '@/app/(authenticated)/reparations/actions'
import { ReparationForm } from '@/components/reparations/ReparationForm'
import { getOrganizationId } from '@/lib/auth'

async function getClients() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    )
    const organization_id = await getOrganizationId(supabase)
    const { data } = await supabase
        .from('clients')
        .select('id, full_name, document, phone')
        .eq('organization_id', organization_id)
        .order('full_name')
    return data || []
}

export default async function NewReparationPage() {
    const clients = await getClients()

    return (
        <ReparationForm
            clients={clients}
            action={createReparationAction}
            title="Nueva Recepción"
            description="Registre el ingreso de un equipo al taller."
            submitLabel="Crear Orden de Reparación"
            cancelHref="/reparations"
        />
    )
}
