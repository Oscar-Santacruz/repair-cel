import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Pencil, Smartphone, Calendar, AlertCircle } from "lucide-react"
import { notFound } from "next/navigation"

async function getClient(id: string) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const { data, error } = await supabase.from('clients').select('*').eq('id', id).maybeSingle()

    if (error) {
        console.error("Error fetching client", error)
        return null
    }
    return data
}

async function getClientReparations(clientId: string) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const { data, error } = await supabase
        .from('reparations')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching client reparations", error)
        return []
    }
    return data
}

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: PageProps) {
    const { id } = await params
    const client = await getClient(id)
    const reparations = await getClientReparations(id)

    if (!client) {
        notFound()
    }

    const completedReparations = reparations.filter(r => r.status === 'DELIVERED').length;
    const activeReparations = reparations.length - completedReparations;

    return (
        <div className="max-w-6xl mx-auto space-y-6">

            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                    <Link href="/clients">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h2 className="text-3xl font-bold tracking-tight">Detalle del Cliente</h2>
                </div>
                <div className="flex gap-2">
                    <Link href={`/clients/${client.id}/edit`}>
                        <Button>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reparaciones Totales</CardTitle>
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {reparations.length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reparaciones Activas</CardTitle>
                        <AlertCircle className={`h-4 w-4 ${activeReparations > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${activeReparations > 0 ? 'text-primary' : ''}`}>
                            {activeReparations}
                        </div>
                        <p className="text-xs text-muted-foreground">En taller actualmente</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Desde</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Date(client.created_at).toLocaleDateString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Datos Personales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-1">
                            <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
                            <p className="text-lg font-medium">{client.full_name}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-1">
                            <p className="text-sm font-medium text-muted-foreground">Documento</p>
                            <p className="text-lg">{client.document || '-'}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-1">
                            <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                            <p className="text-lg">{client.phone || '-'}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-1">
                            <p className="text-sm font-medium text-muted-foreground">Email</p>
                            <p className="text-lg">{client.email || '-'}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-1">
                            <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                            <p className="text-lg">{client.address || '-'}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Últimas Reparaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {reparations.length === 0 ? (
                            <p className="text-muted-foreground text-sm">Este cliente no tiene reparaciones registradas.</p>
                        ) : (
                            <div className="space-y-4">
                                {reparations.slice(0, 5).map((rep: any) => (
                                    <div key={rep.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                                        <div>
                                            <p className="font-medium text-sm">{rep.device_brand} {rep.device_model}</p>
                                            <p className="text-xs text-muted-foreground">Tickt: {rep.ticket_number}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-semibold">{rep.status}</p>
                                            <p className="text-[10px] text-muted-foreground">{new Date(rep.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

        </div >
    )
}
