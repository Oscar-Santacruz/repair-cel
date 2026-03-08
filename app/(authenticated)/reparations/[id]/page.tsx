import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Pencil, Smartphone, User, CheckCircle, Clock, Wrench, Package, Truck } from 'lucide-react'
import { STATUS_LABELS, STATUS_COLORS, ReparationStatus } from '@/lib/reparations'
import { updateReparationStatusAction } from '../actions'
import { ReparationStatusChanger } from '@/components/reparations/ReparationStatusChanger'

const CHECKLIST_LABELS: Record<string, string> = {
    screen: 'Pantalla',
    touch: 'Touch/Digitalizador',
    camera_front: 'Cámara Frontal',
    camera_back: 'Cámara Trasera',
    speaker: 'Altavoz',
    microphone: 'Micrófono',
    wifi: 'WiFi',
    bluetooth: 'Bluetooth',
    charging_port: 'Puerto de Carga',
    buttons: 'Botones físicos',
}

async function getReparation(id: string) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    )
    const { data, error } = await supabase
        .from('reparations')
        .select('*, clients(id, full_name, phone, document, address)')
        .eq('id', id)
        .maybeSingle()

    if (error || !data) return null
    return data
}

interface PageProps {
    params: Promise<{ id: string }>
}

const STATUS_FLOW: ReparationStatus[] = ['RECEIVED', 'IN_REVIEW', 'DOING', 'READY', 'DELIVERED']

export default async function ReparationDetailPage({ params }: PageProps) {
    const { id } = await params
    const rep = await getReparation(id)
    if (!rep) notFound()

    const currentStatusIndex = STATUS_FLOW.indexOf(rep.status as ReparationStatus)

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                    <Link href="/reparations">
                        <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold font-mono">{rep.ticket_number}</h2>
                        <p className="text-muted-foreground text-sm">
                            {new Date(rep.created_at).toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[rep.status as ReparationStatus]}`}>
                        {STATUS_LABELS[rep.status as ReparationStatus]}
                    </span>
                    <Link href={`/reparations/${id}/edit`}>
                        <Button variant="outline" size="sm">
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Status Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Flujo de la Reparación</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Progress bar */}
                    <div className="flex items-center gap-0 relative mb-6">
                        {STATUS_FLOW.map((s, i) => {
                            const isPast = i <= currentStatusIndex
                            const isCurrent = i === currentStatusIndex
                            return (
                                <div key={s} className="flex-1 flex flex-col items-center gap-1">
                                    <div className={`h-2 w-full relative ${i === 0 ? 'rounded-l-full' : ''} ${i === STATUS_FLOW.length - 1 ? 'rounded-r-full' : ''} ${isPast ? 'bg-primary' : 'bg-muted'}`} />
                                    <span className={`text-[10px] mt-1 text-center ${isCurrent ? 'text-primary font-bold' : isPast ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>
                                        {STATUS_LABELS[s]}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                    {/* Action buttons */}
                    <ReparationStatusChanger
                        id={rep.id}
                        currentStatus={rep.status as ReparationStatus}
                        updateStatusAction={updateReparationStatusAction}
                    />
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Client Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="h-4 w-4 text-primary" /> Cliente
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="font-semibold">{rep.clients?.full_name}</p>
                        {rep.clients?.document && <p className="text-sm text-muted-foreground">CI/Doc: {rep.clients.document}</p>}
                        {rep.clients?.phone && (
                            <a
                                href={`https://wa.me/${rep.clients.phone.replace(/\D/g, '')}`}
                                target="_blank" rel="noopener noreferrer"
                                className="text-sm text-green-600 hover:underline flex items-center gap-1"
                            >
                                📱 {rep.clients.phone}
                            </a>
                        )}
                        {rep.clients?.address && <p className="text-sm text-muted-foreground">{rep.clients.address}</p>}
                        <Link href={`/clients/${rep.clients?.id}`}>
                            <Button variant="link" size="sm" className="px-0 h-auto text-xs">Ver perfil del cliente →</Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Device Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Smartphone className="h-4 w-4 text-primary" /> Equipo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="font-semibold text-lg">{rep.device_brand} {rep.device_model}</p>
                        {rep.imei_or_serial && (
                            <p className="text-sm font-mono text-muted-foreground">IMEI: {rep.imei_or_serial}</p>
                        )}
                        {rep.aesthetic_condition && (
                            <div className="mt-2 p-3 bg-muted/50 rounded-md">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Problema / Condición:</p>
                                <p className="text-sm">{rep.aesthetic_condition}</p>
                            </div>
                        )}
                        {rep.budget && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                                <span className="text-sm text-muted-foreground">Presupuesto:</span>
                                <span className="font-semibold text-green-600">Gs. {rep.budget.toLocaleString('es-PY')}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Checklist */}
            {rep.entry_checklist && Object.keys(rep.entry_checklist).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Checklist de Entrada</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                            {Object.entries(rep.entry_checklist).map(([key, value]) => (
                                <div
                                    key={key}
                                    className={`p-2 rounded-lg border text-center text-xs ${value
                                        ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400'
                                        : 'bg-red-500/10 border-red-500/30 text-red-600'
                                        }`}
                                >
                                    <div className="text-base mb-1">{value ? '✅' : '❌'}</div>
                                    {CHECKLIST_LABELS[key] || key}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
